# 32. How do you implement rate limiting and throttling?

**Technology:** API Design and Integration Governance

**Source question:** 32. How do you implement rate limiting and throttling?

## 1. What is it?

Rate limiting controls how many requests a client can make during a period, for example 100 requests per minute.

Throttling is the action taken when the client reaches that limit. The API may slow or queue requests, or reject them with HTTP `429 Too Many Requests`.

Common algorithms are:

- **Fixed window:** allows a set number of requests in each fixed time window.
- **Sliding window:** divides time into smaller segments, which reduces bursts at window boundaries.
- **Token bucket:** adds tokens over time; each request uses a token. It allows controlled bursts.
- **Concurrency limiter:** limits how many requests can run at the same time. This is useful for expensive operations.

## 2. Why is it important?

Rate limiting protects an API and its dependencies from traffic spikes, abusive clients, accidental retry loops, and denial-of-service attempts. It also helps share capacity fairly between customers.

Without it, one client can consume the database connections, threads, memory, or a paid downstream API quota and affect every other client. It is therefore both a reliability control and a governance policy. It complements authentication, authorization, input validation, caching, timeouts, and infrastructure-level DDoS protection; it does not replace them.

## 3. How does it work?

A typical request flow is:

1. Identify the caller using an API key, client ID, tenant ID, authenticated user, or trusted source IP.
2. Select a policy for that caller and endpoint. A payment submission may have a stricter limit than a read-only endpoint.
3. Check the caller's counter, tokens, or current concurrency.
4. If capacity is available, consume a permit and continue to the endpoint.
5. If no permit is available, either queue a small number of requests or return `429 Too Many Requests`.
6. Return `Retry-After` when the server can tell the client when to retry, and record metrics for allowed and rejected requests.

In a single API instance, an in-memory limiter can be enough. In a scaled-out system, each instance has separate counters, so the effective total limit can increase with the number of instances. For a true global quota, enforce the limit at a shared API gateway or use a distributed counter such as Redis with atomic operations. A common design uses coarse protection at the gateway and endpoint-specific protection inside the application.

## 4. Practical example

Consider a banking API that sends one-time passwords. An authenticated customer is allowed five OTP requests in ten minutes, while the customer's IP address also has a broader limit.

When the customer reaches the limit, the API returns `429` with a `Retry-After` header. The mobile app shows a clear wait message instead of retrying immediately. Both customer-level and IP-level limits matter: the customer limit stops repeated requests against one account, while the IP limit makes automated attacks across many accounts harder. The OTP service should also prevent duplicate messages and keep an audit trail because rate limiting alone is not a complete fraud control.

## 5. Scenario-based interview answer

**Problem:** In a payment platform, one partner had a faulty retry loop. It sent a large burst of payment-status requests and increased database latency for all partners.

**Decision:** I introduced layered rate limits. The gateway applied a general client quota, and the ASP.NET Core API applied stricter endpoint-specific limits. We used the authenticated partner ID as the partition key rather than relying only on IP addresses, because partners could share NAT addresses and an attacker could change IPs. We chose a token bucket for normal traffic bursts and a concurrency limit for the expensive reporting endpoint.

**Implementation:** Requests over the limit received `429` and `Retry-After`. We kept the queue small so queued work could not consume excessive memory or complete after the caller's timeout. The client guidance required exponential backoff with jitter and no retry for non-transient errors. We also added dashboards and alerts by partner and endpoint. Because the API ran on several instances, the contractual partner quota was enforced at the gateway; the in-process limiter was an additional instance-protection layer.

**Result:** The retry storm was isolated to the faulty partner, database latency remained stable, and the metrics helped the partner find and correct its retry logic.

## 6. Code example

ASP.NET Core includes rate-limiting middleware in .NET 7 and later. This example uses the supported `Microsoft.AspNetCore.RateLimiting` and `System.Threading.RateLimiting` APIs:

```csharp
using Microsoft.AspNetCore.RateLimiting;
using System.Globalization;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthentication().AddJwtBearer();
builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("payments-per-caller", httpContext =>
    {
        // Prefer a stable authenticated client/user claim over an IP address.
        var callerId = httpContext.User.FindFirst("client_id")?.Value
            ?? httpContext.Connection.RemoteIpAddress?.ToString()
            ?? "unknown";

        return RateLimitPartition.GetTokenBucketLimiter(
            partitionKey: callerId,
            factory: _ => new TokenBucketRateLimiterOptions
            {
                TokenLimit = 20,
                TokensPerPeriod = 10,
                ReplenishmentPeriod = TimeSpan.FromSeconds(10),
                AutoReplenishment = true,
                QueueLimit = 2,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst
            });
    });

    options.OnRejected = async (context, cancellationToken) =>
    {
        if (context.Lease.TryGetMetadata(
                MetadataName.RetryAfter, out TimeSpan retryAfter))
        {
            context.HttpContext.Response.Headers["Retry-After"] =
                Math.Ceiling(retryAfter.TotalSeconds)
                    .ToString(CultureInfo.InvariantCulture);
        }

        await context.HttpContext.Response.WriteAsJsonAsync(
            new
            {
                title = "Too many requests",
                status = StatusCodes.Status429TooManyRequests
            },
            cancellationToken);
    };
});

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapPost("/payments", () => Results.Accepted())
   .RequireAuthorization()
   .RequireRateLimiting("payments-per-caller");

app.Run();
```

The policy creates a separate token bucket for each caller. It allows a short burst of up to 20 requests and restores 10 tokens every 10 seconds. Only two requests may wait; further requests are rejected. Authentication runs first so the limiter can use the trusted `client_id` claim. The application must also configure JWT validation correctly before trusting that claim.

This limiter stores state in the application process. It protects each instance, but it does not by itself provide one exact quota shared across all instances.

## 7. Common mistakes

- Applying one global limit to every endpoint and customer, regardless of cost or service tier.
- Using only an IP address as the key. NAT can make many valid users share an IP, while proxies can make the address untrustworthy.
- Trusting `X-Forwarded-For` without configuring trusted proxies and forwarded-header handling.
- Using an unbounded or large queue, which increases memory use and response latency.
- Retrying `429` responses immediately instead of respecting `Retry-After` and using backoff with jitter.
- Assuming an in-memory limiter gives an exact global quota in a multi-instance deployment.
- Returning `503 Service Unavailable` for a client quota violation. `429` is normally the correct response; `503` is more suitable when the service itself is temporarily unavailable.
- Forgetting metrics, logs, alerts, and a safe process for changing or exempting limits.
- Treating rate limiting as the only security or DDoS control.

## 8. Follow-up interview questions

### What is the difference between token bucket and fixed window limiting?

A fixed window counts requests in fixed periods and is simple, but it can allow a burst at the boundary between two windows. A token bucket refills permits over time and supports controlled bursts more smoothly.

### Where should rate limiting be implemented in a microservice system?

Usually at multiple layers. Use an API gateway for shared public quotas and early rejection, then use application-level policies for costly endpoints and instance protection. Internal services may also need limits around scarce downstream dependencies.

### Should a rate limiter queue or reject requests?

It depends on the operation. A very small queue can smooth short bursts, but rejection is safer when waiting would exceed the client's timeout or consume too many resources. Payment commands also need idempotency because rate limiting does not prevent duplicate processing after retries.
