# 34. How do you design for resilience?

**Technology:** Architecture and Design

**Source question:** 34. How do you design for resilience?

## 1. What is it?

Resilience is the ability of a system to keep providing an acceptable service when something fails or becomes slow.

A resilient design assumes that networks, databases, services, and even entire data centres can fail. It does not try to prevent every failure. Instead, it limits the effect of a failure, recovers safely, and avoids turning one small problem into a system-wide outage.

Resilience is not the same as high availability. High availability is the target, such as 99.9% uptime. Resilience is how the system behaves during failure to help achieve that target.

## 2. Why is it important?

Modern applications depend on many components. A payment request may call an order service, payment provider, database, message broker, and notification service. Any one of them can be unavailable or respond slowly.

Without resilience, a slow dependency can consume all request threads and connections. This can make healthy parts of the application fail as well. It may also cause duplicate payments or lost work when requests are repeated without care.

Architects need resilience to:

- keep critical functions available during partial failures;
- protect the system from cascading failures;
- recover without corrupting data or repeating business operations;
- provide a controlled, useful response when full service is not possible;
- meet agreed availability and recovery targets.

## 3. How does it work?

I design resilience in layers:

1. **Define the business target.** Identify critical user journeys and agree service-level objectives, recovery time objectives, and recovery point objectives. Not every feature needs the same protection.
2. **Remove single points of failure.** Run multiple application instances across failure zones, use replicated data stores where needed, and make routing fail over automatically.
3. **Set time limits.** Every remote call has a sensible timeout. A request must not wait forever for a dependency.
4. **Retry only transient failures.** Use a small number of retries with exponential backoff and jitter. Retry only when the operation is safe, normally for reads or idempotent writes.
5. **Stop calling an unhealthy dependency.** A circuit breaker fails fast after repeated failures and later allows test calls to check whether the dependency has recovered.
6. **Isolate failures.** Concurrency limits, separate connection pools, queues, and service boundaries stop one busy or failing dependency from using all resources.
7. **Degrade gracefully.** Return cached data, accept work for later processing, or temporarily disable a non-critical feature instead of failing the whole request.
8. **Protect data.** Use idempotency keys, durable messaging, the transactional outbox pattern, and safe reconciliation processes.
9. **Detect and recover.** Health checks, metrics, tracing, alerts, failover tests, and disaster-recovery exercises show whether the design works in production.

The normal call flow is: apply an overall timeout, limit concurrency, try the dependency, retry selected transient errors, and open the circuit if failures continue. The service then returns a controlled error or uses an approved fallback. The exact order should be tested because combining policies can increase load if configured badly.

## 4. Practical example

Consider a banking application that transfers money and sends a confirmation email.

The money transfer is critical, but the email is not. The API validates the request and uses an idempotency key so the same client request cannot create two transfers. It commits the transfer and an `EmailRequested` outbox record in one database transaction. A background worker later publishes the email request to a durable message broker.

If the email provider is down, the transfer still succeeds. The worker retries with backoff, and messages that repeatedly fail go to a dead-letter queue for investigation. A circuit breaker stops the worker from continuously calling the unavailable provider. Monitoring reports the growing queue so support teams can react.

This design keeps the banking operation correct while allowing the non-critical notification to recover later.

## 5. Scenario-based interview answer

**Scenario:** A payment API frequently became unavailable whenever its fraud-check provider slowed down.

**Natural interview answer:**

“The main problem was not only that the provider was slow. Our API kept waiting and accepting more calls, so the request pool became exhausted and the failure spread to unrelated endpoints.

I first agreed with the business that a payment must never be charged twice and that we could return a pending result when the fraud service was temporarily unavailable. I then separated the fraud integration from the rest of the application and gave it its own timeout, concurrency limit, and circuit breaker. We used short retries only for safe transient failures and added jitter so all instances did not retry together.

For payment submission, we required an idempotency key and stored the payment state durably. If the synchronous fraud check could not complete, we placed the payment in a pending state and continued processing through a durable queue. We also added dependency metrics, distributed tracing, alerts, and failure-injection tests.

As a result, a fraud-provider incident no longer exhausted the payment API. Customers received a clear pending response, duplicate charges were prevented, and queued payments were completed after the provider recovered.”

## 6. Code example

For HTTP dependencies, .NET 8 and later applications can use `Microsoft.Extensions.Http.Resilience`, which is built on Polly resilience strategies.

```csharp
using System.Net;
using Microsoft.Extensions.Http.Resilience;
using Polly;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddHttpClient<FraudClient>(client =>
    {
        client.BaseAddress = new Uri("https://fraud.example.com");
    })
    .AddResilienceHandler("fraud", pipeline =>
    {
        pipeline.AddConcurrencyLimiter(new HttpConcurrencyLimiterStrategyOptions
        {
            PermitLimit = 50,
            QueueLimit = 20
        });

        pipeline.AddRetry(new HttpRetryStrategyOptions
        {
            MaxRetryAttempts = 2,
            Delay = TimeSpan.FromMilliseconds(200),
            BackoffType = DelayBackoffType.Exponential,
            UseJitter = true,
            ShouldHandle = args => ValueTask.FromResult(
                args.Outcome.Exception is HttpRequestException ||
                args.Outcome.Result?.StatusCode is HttpStatusCode.RequestTimeout ||
                (int?)args.Outcome.Result?.StatusCode >= 500)
        });

        pipeline.AddCircuitBreaker(new HttpCircuitBreakerStrategyOptions
        {
            FailureRatio = 0.5,
            MinimumThroughput = 10,
            SamplingDuration = TimeSpan.FromSeconds(30),
            BreakDuration = TimeSpan.FromSeconds(20)
        });

        pipeline.AddTimeout(TimeSpan.FromSeconds(2));
    });

var app = builder.Build();
app.Run();

public sealed class FraudClient(HttpClient httpClient)
{
    public async Task<bool> CheckAsync(
        string paymentId,
        CancellationToken cancellationToken)
    {
        using var response = await httpClient.GetAsync(
            $"checks/{Uri.EscapeDataString(paymentId)}",
            cancellationToken);

        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<bool>(
            cancellationToken: cancellationToken);
    }
}
```

The concurrency limiter prevents this dependency from consuming all application resources. The retry handles a small number of transient failures with exponential delay and jitter. The circuit breaker temporarily fails fast when failures cross the configured threshold, and the timeout limits each attempt to two seconds.

The example uses `GET`, which is safe to retry. For a payment `POST`, I would retry only if the provider supports an idempotency key or guarantees idempotent processing. In many applications, `AddStandardResilienceHandler()` is a useful supported default; a named custom handler is shown here because dependency limits should be based on measured behaviour and business requirements.

## 7. Common mistakes

- Retrying every error, including validation failures and non-idempotent payment operations.
- Using too many retries or no jitter, which creates a retry storm and adds load during an outage.
- Setting timeouts independently without an end-to-end request time budget.
- Adding a fallback that returns stale or misleading financial data.
- Keeping the circuit breaker only in memory and assuming it coordinates all application instances. Each instance normally has its own state.
- Calling several services synchronously when the business process can be completed asynchronously.
- Using health checks that report healthy even when a critical dependency or required resource is unavailable.
- Having replicas in one failure zone only, or backups that have never been restored in a test.
- Monitoring only CPU and memory instead of business failures, dependency latency, queue depth, retry rate, and circuit state.
- Treating resilience libraries as the whole solution while ignoring idempotency, data recovery, operational runbooks, and failure testing.

## 8. Follow-up interview questions

### What is the difference between retry and circuit breaker?

A retry handles a short-lived failure by trying the operation again. A circuit breaker stops calls for a period when a dependency is repeatedly failing, which protects both systems and allows time for recovery.

### When should you not retry an operation?

Do not retry permanent errors such as invalid input or authentication failure. Do not automatically retry a non-idempotent write, such as charging a card, unless an idempotency mechanism guarantees that repeated requests cannot repeat the business action.

### How do you prove that a system is resilient?

Test realistic failures in a safe environment: slow responses, timeouts, unavailable instances, broker outages, and zone loss. Measure whether service-level objectives are met, data stays correct, alerts fire, and the documented recovery process works.
