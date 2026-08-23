# 20. What is shadow traffic?

**Technology:** Strangler Fig and Migration Patterns

**Source question:** 20. What is shadow traffic?

## 1. What is it?

Shadow traffic is a copy of real production requests sent to a new or replacement system while the current system still handles the real user request.

The new system processes the copied request, but its response is not returned to the user. This is also called **traffic mirroring** or **dark traffic**. It lets a team observe how the new system behaves with real workloads before making it responsible for production results.

## 2. Why is it important?

Tests and staging environments rarely reproduce production traffic exactly. Real traffic contains unusual data, unexpected request patterns, traffic spikes, and dependencies that test data may miss.

Shadow traffic helps a team:

- compare the old and new systems using the same inputs;
- find functional differences and performance problems early;
- estimate the capacity required by the new system;
- reduce the risk of a Strangler Fig migration before routing users to the new service.

It is an observation technique, not a complete release strategy. Canary releases, feature flags, monitoring, and rollback plans are still needed when the new service starts serving users.

## 3. How does it work?

1. A real request reaches an API gateway, reverse proxy, service mesh, or application middleware.
2. The request continues to the existing production system, which remains the source of the user response.
3. A copy is sent asynchronously to the new system. The shadow call must not add noticeable delay or cause the real request to fail.
4. The new system processes the request in an isolated or side-effect-safe mode.
5. Its response, timing, errors, and resource usage are recorded, but its response is discarded.
6. A comparison process checks important values from both systems, allowing for fields such as timestamps and generated IDs that are expected to differ.
7. After the results meet agreed correctness, latency, and error-rate targets, a small amount of real traffic can be moved to the new system.

For write operations, copying a request can create duplicate payments, emails, or database updates. Such requests should normally be blocked, made idempotent, or sent to an isolated environment where external side effects are disabled.

## 4. Practical example

A bank is replacing a legacy transaction-history API with a new .NET service. The gateway returns the legacy API's response to mobile-banking customers and mirrors selected read-only requests to the new service.

Both systems read equivalent data. The team compares transaction count, amount, currency, ordering, and response time. It ignores known differences such as correlation IDs. If the new service misses transactions for one account type, customers are unaffected because they still receive the legacy response. The team fixes the mapping problem and repeats the comparison before gradually routing customer traffic to the new service.

## 5. Scenario-based interview answer

**Problem:** We needed to move a high-volume account-summary endpoint from a monolith to a new .NET service. Load tests passed, but we were not confident that our test data covered every account and transaction type.

**Decision:** I used shadow traffic before a canary release. The monolith stayed authoritative, so this stage could not change the response seen by customers.

**Implementation:** At the gateway, we sampled production GET requests and sent copies to the new service asynchronously. We removed unnecessary personal data, used a separate shadow identity, set short timeouts, and applied strict rate limits. The new service could read production-equivalent data but could not publish events or perform writes. We compared business fields, latency percentiles, and error rates, while excluding timestamps and generated IDs.

**Result:** We found an incorrect balance rule for joint accounts and a slow database query before customer traffic was switched. After the results remained within our agreed thresholds, we started a small canary release and increased it gradually. This gave us evidence from real workloads without making the new service part of the customer response path too early.

## 6. Code example

The following simplified ASP.NET Core example mirrors only safe GET requests. It copies the required values into a bounded queue, so shadow work does not hold the request open or capture `HttpContext` after the request has ended.

```csharp
// Program.cs - ASP.NET Core on .NET 8+
builder.Services.AddSingleton(Channel.CreateBounded<ShadowRequest>(
    new BoundedChannelOptions(1_000)
    {
        FullMode = BoundedChannelFullMode.DropWrite,
        SingleReader = true
    }));
builder.Services.AddHostedService<ShadowWorker>();
builder.Services.AddHttpClient("ShadowApi", client =>
{
    client.BaseAddress = new Uri("https://shadow-api.internal/");
    client.Timeout = TimeSpan.FromSeconds(2);
});

var app = builder.Build();

app.Use(async (context, next) =>
{
    if (HttpMethods.IsGet(context.Request.Method) &&
        context.Request.Path.StartsWithSegments("/api/accounts"))
    {
        var queue = context.RequestServices
            .GetRequiredService<Channel<ShadowRequest>>();

        queue.Writer.TryWrite(new ShadowRequest(
            context.Request.Path + context.Request.QueryString,
            context.TraceIdentifier));
    }

    await next(); // The normal system still produces the customer response.
});

record ShadowRequest(string Path, string CorrelationId);

sealed class ShadowWorker(
    Channel<ShadowRequest> queue,
    IHttpClientFactory clientFactory,
    ILogger<ShadowWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var client = clientFactory.CreateClient("ShadowApi");

        await foreach (var item in queue.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Get, item.Path);
                request.Headers.TryAddWithoutValidation(
                    "X-Correlation-Id", item.CorrelationId);

                using var response = await client.SendAsync(
                    request, HttpCompletionOption.ResponseHeadersRead, stoppingToken);

                logger.LogInformation("Shadow response: {StatusCode}",
                    (int)response.StatusCode);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Shadow request failed");
            }
        }
    }
}
```

The important point is the separation between the main request and the shadow request. `TryWrite` does not wait, and the queue drops new shadow items when it is full, protecting the customer path during a spike. The worker sends the copies separately, and a shadow failure is logged rather than returned to the customer. In production, also record dropped-item metrics and prefer gateway or service-mesh mirroring when available. Copy only approved headers and data rather than forwarding credentials blindly.

## 7. Common mistakes

- Mirroring write requests that create duplicate payments, messages, emails, or audit records.
- Allowing the shadow call to delay or fail the real customer request.
- Sending 100% of traffic immediately without sampling, rate limits, backpressure, or capacity planning.
- Forwarding passwords, tokens, personal data, or sensitive headers without a security review.
- Giving the shadow service permission to update production data or publish production events.
- Comparing complete JSON documents without excluding expected differences such as timestamps, IDs, ordering, or eventually consistent data.
- Recording only HTTP status codes instead of comparing business results, latency percentiles, exceptions, and resource use.
- Treating successful shadow testing as proof that cutover is safe and skipping a canary release and rollback plan.

## 8. Follow-up interview questions

### How is shadow traffic different from a canary release?

With shadow traffic, the new system processes copied requests but users never receive its response. In a canary release, a small percentage of users receive responses from the new system, so it is part of the live request path.

### How do you handle shadow traffic for write operations?

Prefer not to mirror writes. If write behavior must be tested, use an isolated data store, disable external side effects, use idempotency keys, and ensure the shadow identity cannot affect production records or events.

### What should be measured during shadow testing?

Compare business outputs, error rate, timeouts, latency percentiles, CPU and memory use, database load, and dependency calls. Define acceptable differences before deciding that the new system is ready.
