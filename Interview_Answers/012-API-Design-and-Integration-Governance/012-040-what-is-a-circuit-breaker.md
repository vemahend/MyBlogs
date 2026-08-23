# 40. What is a circuit breaker?

**Technology:** API Design and Integration Governance

**Source question:** 40. What is a circuit breaker?

## 1. What is it?

A **circuit breaker** is a resilience pattern that temporarily stops calls to a dependency when that dependency is failing repeatedly.

It behaves like an electrical circuit breaker. Under normal conditions, requests are allowed through. When failures cross a configured threshold, the circuit opens and new calls fail immediately for a short time. This gives the dependency time to recover.

## 2. Why is it important?

When a downstream API is unavailable, continuing to call it wastes threads, connections, and time. Requests can build up, users wait for timeouts, and the failure can spread to other services. This is called a **cascading failure**.

A circuit breaker helps by:

- Failing quickly when a dependency is known to be unhealthy.
- Reducing load on a service that is trying to recover.
- Protecting the calling service from connection and thread exhaustion.
- Giving the application a chance to use a fallback or return a clear temporary error.
- Making dependency health visible through metrics and alerts.

It does not repair the failed service, replace timeouts, or guarantee that a request succeeds. It limits the damage caused by repeated failures.

## 3. How does it work?

A circuit breaker normally moves through three states:

1. **Closed:** Requests flow normally. The breaker records relevant failures within a sampling window.
2. **Open:** When failures reach the configured threshold and minimum request volume, the breaker blocks new calls immediately for a configured period.
3. **Half-open:** After that period, the breaker allows a limited trial request. If the trial succeeds, the circuit closes. If it fails, the circuit opens again.

The failure policy should include only signals that show the dependency may be unhealthy, such as network exceptions, timeouts, HTTP 408, HTTP 429 in some integrations, and selected HTTP 5xx responses. Business responses such as HTTP 400 or 404 usually should not open the circuit.

Circuit breakers are normally combined with an attempt timeout and carefully bounded retries. The order matters: a few retries may handle a short transient failure, while the circuit breaker stops repeated work during a longer outage.

## 4. Practical example

A payment API calls a bank's fraud-check service before approving a transaction. The fraud service starts returning HTTP 503.

After enough failed calls within the sampling period, the payment API opens its circuit. Further fraud-check calls fail immediately instead of waiting for repeated network timeouts. Depending on the business rule, the payment is placed in a pending-review state rather than incorrectly approved.

After the break period, one trial call is allowed. If the fraud service responds successfully, normal traffic resumes. If it still fails, the circuit opens again.

## 5. Scenario-based interview answer

“In a payment system, an external fraud provider became slow during peak traffic. Each request waited for a timeout and then retried, so our API's connections filled up and an external outage started affecting unrelated payment operations.

I added an attempt timeout, a small retry policy for transient errors, and a circuit breaker around that provider only. The breaker used a failure ratio and minimum throughput over a sampling window, so one isolated failure did not open it. While open, calls failed fast and payments moved to a pending-review workflow. We also published circuit-state metrics and alerts.

This protected our API resources, reduced load on the failing provider, and kept the rest of the payment service responsive. Once a half-open trial succeeded, normal calls resumed automatically.”

## 6. Code example

This example uses the Polly 8 resilience API, which is used by the current `Microsoft.Extensions.Http.Resilience` integration for modern .NET applications.

```csharp
using System.Net;
using Polly;
using Polly.CircuitBreaker;

var pipeline = new ResiliencePipelineBuilder<HttpResponseMessage>()
    .AddCircuitBreaker(new CircuitBreakerStrategyOptions<HttpResponseMessage>
    {
        ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
            .Handle<HttpRequestException>()
            .HandleResult(response =>
                response.StatusCode is HttpStatusCode.RequestTimeout
                    or HttpStatusCode.InternalServerError
                    or HttpStatusCode.BadGateway
                    or HttpStatusCode.ServiceUnavailable
                    or HttpStatusCode.GatewayTimeout),
        FailureRatio = 0.5,
        MinimumThroughput = 10,
        SamplingDuration = TimeSpan.FromSeconds(30),
        BreakDuration = TimeSpan.FromSeconds(20)
    })
    .Build();

using var response = await pipeline.ExecuteAsync(
    async cancellationToken =>
        await httpClient.GetAsync("fraud/health", cancellationToken),
    cancellationToken);
```

The circuit opens when at least 10 handled calls occur in 30 seconds and 50% or more fail. While it is open, Polly rejects calls with `BrokenCircuitException` rather than contacting the dependency. After 20 seconds, it permits a trial call to check whether the dependency has recovered.

In an ASP.NET Core application, register the policy through `IHttpClientFactory` and `Microsoft.Extensions.Http.Resilience` so the client and resilience pipeline are managed centrally. Treat `BrokenCircuitException` as a known dependency-unavailable outcome: use an approved fallback or return an appropriate response instead of hiding it.

## 7. Common mistakes

- Opening the circuit after a single failure, which makes the system unstable during normal transient errors.
- Counting business or client errors, such as HTTP 400 and 404, as dependency failures.
- Using a percentage threshold without minimum throughput; one failure out of one request could otherwise open the circuit.
- Sharing one breaker across unrelated downstream services or endpoints, so one failure blocks healthy operations.
- Creating a new breaker for every request. The breaker must be long-lived and shared for the intended dependency scope so it can retain state.
- Treating a fallback as guaranteed success or returning stale data without telling the caller.
- Using a circuit breaker without timeouts, because slow calls may still consume resources before being recorded as failures.
- Adding retries at several layers, which can multiply traffic before the circuit opens.
- Failing to monitor state changes, rejected calls, failure rates, and recovery attempts.
- Using the same settings for every dependency without considering its traffic level and service-level agreement.

## 8. Follow-up interview questions

### What is the difference between a retry and a circuit breaker?

A retry makes another attempt because a failure may be temporary. A circuit breaker stops attempts for a period because repeated failures indicate that the dependency is unhealthy. They solve different problems and are often used together.

### What is the half-open state?

It is the recovery-check state after the open period. The breaker allows limited trial traffic. Success closes the circuit; another handled failure opens it again.

### Should all service instances share one circuit-breaker state?

Usually each application instance keeps its own in-memory breaker state. A shared distributed breaker adds coordination complexity and can become another dependency. Per-instance breakers normally provide enough protection, while centralized metrics give an overall view.
