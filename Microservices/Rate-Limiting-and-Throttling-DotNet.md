# Rate Limiting and Throttling in .NET --- Scenario-Based Interview Guide

## What Is Rate Limiting?

**Rate limiting** controls how many requests a client can make during a
defined period.

For example:

``` text
Customer A → Maximum 100 requests/minute
Customer B → Maximum 100 requests/minute
```

Basic flow:

``` text
Client
  ↓
API Gateway / Load Balancer
  ↓
Rate Limiter
  ↓
Allowed?
 ┌───────────────┐
 │               │
YES              NO
 │                │
 ↓                ↓
API            HTTP 429
                  +
              Retry-After
```

Rate limiting protects systems from:

-   Excessive traffic
-   Accidental client loops
-   API abuse
-   Brute-force attempts
-   Resource exhaustion
-   Expensive requests
-   Downstream service overload

------------------------------------------------------------------------

# Rate Limiting vs Throttling

The terms are often used interchangeably, but throttling is a broader
concept.

``` text
Rate Limiting
─────────────
"Maximum 100 requests/minute."

When exceeded:
Reject request → usually HTTP 429


Throttling
──────────
Controls how aggressively traffic is processed.

It may involve:
- Slowing requests
- Delaying requests
- Queueing
- Limiting concurrency
- Rejecting requests
```

A simple way to remember:

> **Rate limiting defines how much traffic is allowed. Throttling
> controls how traffic is handled when capacity or policy limits are
> reached.**

------------------------------------------------------------------------

# ASP.NET Core Example

ASP.NET Core provides built-in rate limiting middleware.

A simple fixed-window policy:

``` csharp
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("payments", options =>
    {
        options.PermitLimit = 20;
        options.Window = TimeSpan.FromMinutes(1);
        options.QueueLimit = 0;
    });

    options.RejectionStatusCode =
        StatusCodes.Status429TooManyRequests;
});

var app = builder.Build();

app.UseRateLimiter();
```

Apply the policy:

``` csharp
app.MapPost("/api/payments", CreatePayment)
   .RequireRateLimiting("payments");
```

This means the payment endpoint is protected by the `payments`
rate-limit policy.

------------------------------------------------------------------------

# Why Not Use One Global Limit?

Suppose the entire API allows:

``` text
100 requests/minute
```

Customer A sends:

``` text
100 requests
```

Customer B then sends:

``` text
1 request
```

If the limiter is global, Customer B could be rejected because Customer
A consumed the entire quota.

A better approach is usually to partition the rate limiter.

``` text
Customer A → 100/minute
Customer B → 100/minute
Customer C → 100/minute
```

Possible partition keys include:

``` text
User ID
Tenant ID
API Key
Subscription ID
Client ID
IP address
```

The correct key depends on the business scenario.

------------------------------------------------------------------------

# Scenario 1 --- Login API / Brute-Force Protection

Consider:

``` http
POST /api/login
```

An attacker could send:

``` text
Attempt 1
Attempt 2
Attempt 3
...
Attempt 500
```

A stricter rate limit can be applied to the login endpoint.

For example:

``` text
Maximum:
5 login attempts/minute per client/IP
```

ASP.NET Core example:

``` csharp
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("login", httpContext =>
    {
        var ip =
            httpContext.Connection.RemoteIpAddress?
                .ToString() ?? "unknown";

        return RateLimitPartition.GetFixedWindowLimiter(
            ip,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
    });
});
```

Conceptually:

``` text
IP A → 5 login requests/minute
IP B → 5 login requests/minute
IP C → 5 login requests/minute
```

For authentication endpoints, rate limiting should normally be combined
with other protections such as:

``` text
Account lockout / progressive delays
Risk-based controls
Monitoring and alerting
WAF protection
CAPTCHA where appropriate
MFA
```

Rate limiting should not be treated as the only security mechanism.

------------------------------------------------------------------------

# Scenario 2 --- Public API With Different Subscription Plans

Imagine an API product with:

``` text
Free
→ 100 requests/minute

Premium
→ 1,000 requests/minute

Enterprise
→ 10,000 requests/minute
```

Here the limiter could be partitioned using:

``` text
API Key
Tenant ID
Subscription ID
```

rather than IP address.

Why?

A company might have:

``` text
100 employees
      ↓
Corporate NAT
      ↓
Same public IP
```

If the limit is based only on IP address, all users could incorrectly
share the same quota.

Therefore, for multi-tenant/business APIs:

> **Tenant ID or API key is often a better partition key than IP
> address.**

------------------------------------------------------------------------

# Rate Limiting Algorithms

ASP.NET Core supports several rate limiting approaches.

The algorithm should be selected according to the business requirement.

------------------------------------------------------------------------

# 1. Fixed Window

Example:

``` text
Maximum:
100 requests/minute
```

Window:

``` text
12:00:00 → 12:00:59
```

The client gets:

``` text
100 requests
```

At:

``` text
12:01:00
```

the counter resets.

## Advantage

Simple and inexpensive.

## Problem

Consider:

``` text
12:00:59 → 100 requests
12:01:00 → 100 requests
```

Technically the client could send approximately:

``` text
200 requests
```

around the window boundary.

Use fixed window when exact smoothing is not critical.

------------------------------------------------------------------------

# 2. Sliding Window

Sliding window reduces the boundary problem.

Instead of asking:

``` text
How many requests have happened
since exactly 12:00?
```

it effectively considers recent traffic over a moving period.

For example:

``` text
How many requests occurred
during the recent 60-second window?
```

This produces smoother traffic control.

Good scenarios include:

``` text
Customer-facing APIs
External APIs
APIs where boundary bursts matter
```

------------------------------------------------------------------------

# 3. Token Bucket

Token bucket is an excellent algorithm to discuss in interviews.

Imagine a bucket containing:

``` text
10 tokens
```

Each request consumes:

``` text
1 token
```

Initially:

``` text
● ● ● ● ● ● ● ● ● ●
```

Five requests arrive:

``` text
● ● ● ● ●
```

Tokens are replenished over time.

This allows controlled bursts.

For example:

``` text
Normal rate:
10 requests/second

Short burst:
Up to 50 requests
```

Useful scenarios:

``` text
Mobile application synchronization
Dashboard loading several resources
Batch processing
Partner APIs
Bursty but legitimate workloads
```

------------------------------------------------------------------------

# Exponential Traffic vs Token Bucket

Token bucket is useful when you want to say:

> "The client should normally operate at this rate, but I am willing to
> tolerate short bursts."

This is often more practical than a strict fixed-window policy for real
client applications.

------------------------------------------------------------------------

# 4. Concurrency Limiting

Concurrency limiting is different from requests-per-minute limiting.

Instead of:

``` text
100 requests/minute
```

you specify:

``` text
Maximum 20 requests executing simultaneously
```

Consider an expensive endpoint:

``` http
GET /reports/yearly
```

Each request:

``` text
Uses significant CPU
Runs expensive SQL
Takes 10 seconds
```

If 1,000 requests arrive simultaneously:

``` text
1000 requests
      ↓
Application
      ↓
Database
      ↓
Resource exhaustion
```

Instead:

``` text
Maximum concurrent requests = 20
```

Then:

``` text
Requests 1-20
→ Execute

Requests 21+
→ Queue or reject according to policy
```

Concurrency limiting is especially useful for:

``` text
Report generation
Expensive database queries
CPU-heavy processing
File generation
Limited downstream resources
```

------------------------------------------------------------------------

# Scenario 3 --- Payment API

Consider:

``` http
POST /api/payments
```

Suppose a malicious or faulty client sends:

``` text
10,000 payment requests
```

A layered architecture could be:

``` text
Internet
   ↓
WAF
   ↓
API Gateway
   ↓
Global abuse protection
   ↓
Per-customer rate limit
   ↓
Payment API
   ↓
Idempotency
   ↓
Payment Provider
```

Rate limiting and idempotency solve different problems.

``` text
Rate Limiting
→ "You are calling too frequently."


Idempotency
→ "You have already submitted this logical payment."
```

For example:

``` http
Idempotency-Key: PAY-123
```

If the same payment is submitted three times:

``` text
Request 1 → PAY-123
Request 2 → PAY-123
Request 3 → PAY-123
```

the customer should not be charged three times.

Therefore:

> **Rate limiting protects system capacity. Idempotency protects
> business operations from duplicate execution.**

------------------------------------------------------------------------

# Scenario 4 --- Protecting a Downstream Service

Rate limiting is not only about protecting your API from external
clients.

Suppose:

``` text
Order Service
      ↓
Payment Provider
```

The provider allows:

``` text
100 requests/second
```

but your application can generate:

``` text
500 requests/second
```

Blindly forwarding all requests could cause:

``` text
HTTP 429
Provider overload
Failed payments
Retry storms
```

Instead, throttle outgoing calls:

``` text
Application
    ↓
Outgoing Rate Limiter
    ↓
Maximum 100/sec
    ↓
Payment Provider
```

This is an important senior-level design principle:

> **Rate limiting can protect both your service and your downstream
> dependencies.**

------------------------------------------------------------------------

# HTTP 429 --- Too Many Requests

When a client exceeds the configured limit, the API normally returns:

``` http
HTTP/1.1 429 Too Many Requests
```

Where possible, provide:

``` http
Retry-After: 10
```

This tells the client:

``` text
Wait approximately 10 seconds
before trying again.
```

The client should respect this instead of immediately retrying.

------------------------------------------------------------------------

# ASP.NET Core Rejection Handling

A custom rejection handler could conceptually look like:

``` csharp
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode =
        StatusCodes.Status429TooManyRequests;

    options.OnRejected = async (context, token) =>
    {
        if (context.Lease.TryGetMetadata(
            MetadataName.RetryAfter,
            out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter =
                ((int)retryAfter.TotalSeconds).ToString();
        }

        await context.HttpContext.Response.WriteAsync(
            "Too many requests. Try again later.",
            token);
    };
});
```

------------------------------------------------------------------------

# Scenario 5 --- Distributed System

Consider three API instances:

``` text
              Load Balancer
                   ↓
          ┌────────┼────────┐
          ↓        ↓        ↓
        API 1    API 2    API 3
```

Suppose every instance independently allows:

``` text
100 requests/minute
```

The effective total limit could become approximately:

``` text
300 requests/minute
```

depending on how requests are routed.

This is an important distributed-system consideration.

For system-wide quotas, consider enforcement at a shared boundary such
as:

``` text
API Gateway
Ingress
Cloud gateway
Centralized rate-limit service/store
Distributed cache/store
```

rather than blindly relying on independent in-memory counters.

------------------------------------------------------------------------

# Scenario 6 --- Microservices

Suppose:

``` text
Client
   ↓
API Gateway
   ↓
Order Service
   ↓
Payment Service
   ↓
Fraud Service
```

You can potentially have rate limiting at different boundaries:

``` text
API Gateway
→ Protect the overall platform.

Order Service
→ Protect expensive order operations.

Payment Service
→ Protect payment processing capacity.

Outgoing Payment Provider calls
→ Protect provider quota.
```

Do not automatically put the same arbitrary limit everywhere.

Each limit should protect a specific:

``` text
Business quota
Security boundary
Resource
Dependency
Capacity constraint
```

------------------------------------------------------------------------

# Rate Limiting + Retry Policy

Rate limiting and retry policies need to work together carefully.

Suppose the provider returns:

``` http
429 Too Many Requests
Retry-After: 30
```

Bad client behavior:

``` text
429
 ↓
Retry immediately
 ↓
429
 ↓
Retry immediately
 ↓
429
```

This creates a retry storm.

Better:

``` text
429
 ↓
Read Retry-After
 ↓
Wait
 ↓
Retry
```

Where appropriate, combine this with:

``` text
Exponential backoff
Jitter
Retry limits
Circuit breaker
```

------------------------------------------------------------------------

# Rate Limiting + Circuit Breaker

These patterns solve different problems.

``` text
Rate Limiting
→ Controls traffic volume.

Circuit Breaker
→ Stops calls to an unhealthy dependency.

Retry
→ Handles temporary failures.

Timeout
→ Prevents waiting indefinitely.

Idempotency
→ Makes repeated business operations safe.
```

Together:

``` text
Request
   ↓
Rate Limiter
   ↓
Circuit Breaker
   ↓
Timeout
   ↓
External Service
   ↓
Transient failure?
   ↓
Controlled Retry
```

The exact ordering depends on the architecture and resilience
implementation.

------------------------------------------------------------------------

# What Metrics Should We Monitor?

Rate limits should not be arbitrary numbers that are configured once and
forgotten.

Monitor:

``` text
Number of 429 responses
Requests per second
Requests per tenant/client
Latency
CPU usage
Memory usage
Database connections
Thread-pool pressure
Downstream service latency
Downstream 429 responses
Queue length
Rejected requests
```

Then tune limits using:

``` text
Production observations
Load testing
Capacity testing
Business requirements
Provider quotas
Service-level objectives
```

------------------------------------------------------------------------

# Common Interview Mistakes

## Mistake 1

> "We allow 100 requests per minute."

The interviewer may ask:

> Per what?

You should be able to answer:

``` text
Per user?
Per tenant?
Per IP?
Per API key?
Globally?
```

------------------------------------------------------------------------

## Mistake 2

Using IP address for every scenario.

IP is useful for some anonymous/security scenarios, but authenticated
business APIs may be better partitioned by:

``` text
Tenant
Client ID
Subscription
API Key
User
```

------------------------------------------------------------------------

## Mistake 3

Thinking rate limiting prevents duplicate payments.

It doesn't.

Use:

``` text
Rate limiting
+
Idempotency
```

------------------------------------------------------------------------

## Mistake 4

Immediately retrying HTTP 429.

Respect:

``` http
Retry-After
```

and use controlled retry/backoff behavior.

------------------------------------------------------------------------

## Mistake 5

Only protecting incoming traffic.

Your own service can overwhelm downstream dependencies.

Consider:

``` text
Outgoing throttling
```

as well.

------------------------------------------------------------------------

# Best Senior-Level Interview Answer

If asked:

> **How do you implement rate limiting and throttling?**

A strong answer is:

> **In ASP.NET Core I can use the built-in rate-limiting middleware, but
> I first choose the policy based on the business scenario. For a public
> API, I would normally partition the limiter by tenant or API key
> rather than globally. For login or password-reset endpoints, I would
> use stricter per-user or per-IP limits to reduce abuse. For APIs that
> need occasional bursts, I would consider token bucket or sliding
> window, while for expensive operations such as report generation I
> would consider concurrency limiting.**
>
> **When the limit is exceeded, I normally return HTTP 429 and include
> Retry-After where appropriate. In a distributed environment with
> multiple API instances, I would consider enforcing system-wide quotas
> at an API gateway, ingress, or another shared rate-limiting boundary
> rather than relying only on independent in-memory counters.**
>
> **I also consider outgoing throttling so that my service cannot
> overwhelm a downstream provider. In payment systems, I combine rate
> limiting with idempotency because rate limiting protects capacity
> while idempotency prevents duplicate financial operations. Finally, I
> monitor rejection rates, latency, resource usage, and downstream
> behavior and tune the limits using production observations and load
> testing rather than choosing arbitrary numbers.**

------------------------------------------------------------------------

# Quick Interview Cheat Sheet

``` text
Fixed Window
→ Simple
→ Example: 100 requests/minute
→ Boundary burst problem


Sliding Window
→ Smoother limits
→ Reduces fixed-window boundary problem


Token Bucket
→ Allows controlled bursts
→ Great for APIs with occasional traffic spikes


Concurrency Limiter
→ Controls simultaneous work
→ Great for expensive endpoints


429
→ Too Many Requests


Retry-After
→ Tells client when to retry


Partition Key
→ User / Tenant / API Key / IP / Subscription


API Gateway
→ Good place for distributed/global rate limits


Idempotency
→ Prevents duplicate business processing


Rate Limiting
→ Protects capacity


Outgoing Throttling
→ Protects downstream dependencies
```

------------------------------------------------------------------------

# Easy Way to Remember

``` text
Rate Limit
→ How much traffic do I allow?

Partition
→ Whose traffic am I counting?

Algorithm
→ How do I measure the limit?

429
→ What happens when the limit is exceeded?

Retry-After
→ When should the client try again?

Concurrency Limit
→ How much work can run simultaneously?

Gateway
→ Where do I enforce global/distributed limits?

Idempotency
→ How do I make repeated payment requests safe?

Monitoring
→ How do I know whether my limits are correct?
```
