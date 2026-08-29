# 36. How do you handle API timeouts and retries?

**Technology:** API Design and Integration Governance

**Source question:** 36. How do you handle API timeouts and retries?

## 1. What is it?

A **timeout** limits how long an application waits for an API operation. If the limit is reached, the application cancels the wait instead of holding resources forever.

A **retry** makes another attempt after a temporary failure, such as a network interruption, HTTP `408`, `429`, or some `5xx` responses. Retries must be limited and delayed. They are not a safe response to every failure.

Together, timeouts and retries are resilience controls. A timeout stops a slow call; a retry may recover when the failure is brief.

## 2. Why is it important?

Remote calls can fail or become slow even when our own application is healthy. Without timeouts, slow dependencies can consume threads, sockets, and memory until the whole service becomes unresponsive.

Retries can hide short network problems and service restarts, but uncontrolled retries can make an outage worse by sending more traffic to an already overloaded service. A senior design therefore uses a time budget, limited retries, backoff, jitter, cancellation, and monitoring.

The API operation also matters. Retrying a read is usually safe. Retrying a payment command can create a duplicate charge unless the operation supports idempotency.

## 3. How does it work?

A typical flow is:

1. Set an overall time budget for the complete operation.
2. Set a shorter timeout for each individual attempt.
3. Send the request and pass the caller's cancellation token.
4. Retry only failures that are likely to be temporary.
5. Wait between attempts using exponential backoff and random jitter.
6. Honor the server's `Retry-After` instruction for responses such as `429` when supported.
7. Stop when the request succeeds, the retry limit is reached, the overall budget expires, or the caller cancels.
8. Record attempts, final failures, latency, and dependency health. A circuit breaker can temporarily stop calls when a dependency is repeatedly failing.

Timeouts should be based on the end-to-end request budget. For example, if an incoming request has three seconds left, a downstream policy must not spend ten seconds retrying.

Retries are normally suitable for connection failures, `408 Request Timeout`, `429 Too Many Requests`, and selected `5xx` responses. They are normally unsuitable for validation errors, authentication failures, most other `4xx` responses, or non-idempotent operations without protection.

## 4. Practical example

A payment API calls a bank to check an account and then submit a transfer. The account check is a read, so the service allows up to three attempts with short, increasing delays.

The transfer is different. The service sends a unique idempotency key, such as the payment ID. If the first response is lost after the bank accepts the transfer, a retry uses the same key. The bank returns the original result instead of creating a second transfer.

Both calls have per-attempt and overall timeouts. If the overall budget is exhausted, the payment remains in a `Pending` state and a background reconciliation process checks the final bank status. The API does not report a definite failure when the outcome is unknown.

## 5. Scenario-based interview answer

**Problem:** In one distributed payment system, calls to a bank API occasionally became slow or returned `503`. Fixed, immediate retries increased traffic and sometimes made the incident worse.

**Decision:** I separated transient failures from permanent failures and gave every operation an overall time budget. I allowed retries for safe reads and protected payment commands with an idempotency key. I did not retry normal business or validation errors.

**Implementation:** I used `IHttpClientFactory` with the .NET resilience handler. Each attempt had a short timeout, the full pipeline had a total timeout, and retries used exponential backoff with jitter. We honored cancellation, logged the final outcome separately from retry attempts, and added metrics for timeouts, retry counts, and dependency latency. A circuit breaker stopped repeated calls during a sustained outage.

**Result:** Brief failures recovered without affecting users, while longer bank outages failed quickly and did not exhaust our service resources. Duplicate payments were prevented, and the operational metrics made dependency problems much easier to diagnose.

## 6. Code example

For .NET 8 or later, `Microsoft.Extensions.Http.Resilience` provides resilience handlers built on Polly:

```csharp
using Microsoft.Extensions.Http.Resilience;
using Polly;
using Polly.Retry;

builder.Services
    .AddHttpClient<BankClient>(client =>
    {
        client.BaseAddress = new Uri("https://bank.example/");
    })
    .AddStandardResilienceHandler(options =>
    {
        // Maximum time for the complete call, including retries and delays.
        options.TotalRequestTimeout.Timeout = TimeSpan.FromSeconds(8);

        // Maximum time allowed for one network attempt.
        options.AttemptTimeout.Timeout = TimeSpan.FromSeconds(2);

        options.Retry.MaxRetryAttempts = 2;
        options.Retry.Delay = TimeSpan.FromMilliseconds(200);
        options.Retry.BackoffType = DelayBackoffType.Exponential;
        options.Retry.UseJitter = true;
        options.Retry.ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
            .Handle<HttpRequestException>()
            .HandleResult(response =>
                response.StatusCode == System.Net.HttpStatusCode.RequestTimeout ||
                response.StatusCode == System.Net.HttpStatusCode.TooManyRequests ||
                (int)response.StatusCode >= 500);
    });

public sealed class BankClient(HttpClient httpClient)
{
    public async Task<HttpResponseMessage> SubmitPaymentAsync(
        Payment payment,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "payments")
        {
            Content = JsonContent.Create(payment)
        };

        // The bank must treat repeated requests with this key as one operation.
        request.Headers.Add("Idempotency-Key", payment.PaymentId.ToString());

        return await httpClient.SendAsync(request, cancellationToken);
    }
}
```

`AddStandardResilienceHandler` is the supported .NET 8+ approach for common HTTP resilience. It combines total and per-attempt timeouts, retries, a circuit breaker, and other safeguards. The caller's `CancellationToken` is still passed through so a disconnected client or application shutdown can stop the work.

The exact timeout and retry values are examples, not universal defaults. They should come from the service-level objective, measured dependency latency, and the caller's remaining time budget. A retryable `POST` also requires the receiving API to enforce the idempotency key; adding the header alone is not enough.

## 7. Common mistakes

- Retrying every error, including `400`, `401`, `403`, and business validation failures.
- Retrying a payment or order command without server-side idempotency protection.
- Using immediate retries or the same delay for every client, which creates a retry storm.
- Giving every attempt a long timeout and ignoring the overall request deadline.
- Stacking multiple retry layers, such as the gateway, service, SDK, and message consumer.
- Treating caller cancellation and a dependency timeout as the same event in logs and metrics.
- Setting only `HttpClient.Timeout` without designing per-attempt and total time budgets.
- Catching timeout or cancellation exceptions and continuing work after the caller has gone.
- Logging every retry as a production error instead of distinguishing attempts from the final failure.
- Assuming retries guarantee success; the final state of a timed-out write may be unknown and may require reconciliation.

## 8. Follow-up interview questions

### When is it safe to retry a `POST` request?

When the operation is naturally idempotent or the server enforces an idempotency key and returns the same result for repeated requests. Otherwise, a retry may create duplicate data or charges.

### What is the difference between a per-attempt timeout and a total timeout?

A per-attempt timeout limits one network call. A total timeout limits the whole operation, including all attempts and waiting periods between them.

### Why should retries use exponential backoff and jitter?

Exponential backoff gives a failing service more recovery time after each attempt. Jitter adds randomness so many clients do not retry at exactly the same moment and create another traffic spike.
