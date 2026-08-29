# 38. Why should you not retry every request?

**Technology:** API Design and Integration Governance

**Source question:** 38. Why should you not retry every request?

## 1. What is it?

A retry means sending the same request again after it fails. We should not retry every request because some failures are permanent, and some operations can produce a second business action when repeated.

For example, retrying a balance lookup is usually safe. Retrying a payment request without protection could charge the customer twice.

## 2. Why is it important?

Retries are useful for short-lived problems such as a network interruption, timeout, HTTP `429 Too Many Requests`, or HTTP `503 Service Unavailable`. They give a system time to recover.

However, uncontrolled retries can:

- repeat non-idempotent actions such as payments or order creation;
- increase traffic while a downstream service is already struggling;
- make response times longer;
- waste threads, connections, and request quotas;
- hide permanent problems such as invalid input or failed authorization.

A senior developer should apply retries only when the operation and failure are both safe to retry.

## 3. How does it work?

Before retrying, the client should make two decisions:

1. **Is the operation safe to repeat?** `GET`, `HEAD`, and `OPTIONS` are normally safe. `PUT` and `DELETE` are intended to be idempotent, but the real API implementation must support that promise. `POST` and `PATCH` usually need an idempotency key or another deduplication mechanism.
2. **Is the failure temporary?** Timeouts, connection failures, `408`, `429`, and many `5xx` responses may be temporary. Most `4xx` responses, such as `400`, `401`, `403`, and `404`, normally require a change rather than a retry.

When retrying, use a small retry limit, exponential backoff, and random jitter. Respect the server's `Retry-After` header. If retries are exhausted, stop and return or record the failure. A circuit breaker can temporarily block calls when the dependency remains unhealthy.

## 4. Practical example

A banking service sends a `POST /transfers` request. The bank completes the transfer, but the response is lost because the network connection breaks. If the client blindly retries, the bank may create a second transfer.

The client instead sends an idempotency key such as `transfer-7f21`. The bank stores that key with the first result. If the same request arrives again, it returns the stored result instead of moving money again. The client retries only temporary failures and uses the same key for every attempt.

## 5. Scenario-based interview answer

“In one payment integration, we saw occasional timeouts after sending a payment request. The main risk was that a timeout did not tell us whether the provider had processed the payment.

I decided not to apply the same retry policy to every endpoint. We retried safe read requests for temporary network errors, `429`, and selected `5xx` responses. For payment creation, we first required an idempotency key supported by the provider. Every retry reused that key. We used exponential backoff with jitter, respected `Retry-After`, limited the number of attempts, and added a circuit breaker.

This allowed the system to recover from short outages without creating duplicate payments or adding a retry storm during a provider incident.”

## 6. Code example

For .NET 8, the supported resilience package `Microsoft.Extensions.Http.Resilience` can apply a standard transient-fault policy and disable retries for unsafe HTTP methods:

```csharp
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http.Resilience;

services.AddHttpClient<AccountsClient>(client =>
{
    client.BaseAddress = new Uri("https://bank.example/");
})
.AddStandardResilienceHandler(options =>
{
    options.Retry.MaxRetryAttempts = 3;
    options.Retry.DisableForUnsafeHttpMethods();
});
```

`AddStandardResilienceHandler` handles common transient HTTP failures with bounded retries and backoff. `DisableForUnsafeHttpMethods` prevents automatic retries for methods such as `POST`, `PATCH`, `PUT`, and `DELETE`.

This is a safe default, not a complete business rule. If a particular `POST` is protected by an idempotency key, give that operation a separate, carefully defined resilience pipeline. Also set an overall timeout so multiple attempts cannot run longer than the caller expects.

## 7. Common mistakes

- Retrying every exception or every non-success status code.
- Retrying validation, authentication, or authorization failures.
- Retrying a timed-out payment without knowing whether it was processed.
- Generating a new idempotency key for each retry instead of reusing the original key.
- Using immediate retries without exponential backoff and jitter.
- Ignoring `Retry-After` on `429` or `503` responses.
- Allowing nested services to retry independently, which multiplies traffic.
- Using too many attempts or no total timeout.
- Assuming an HTTP method is idempotent without checking the API's actual behavior.
- Logging retries without metrics, correlation IDs, or final-failure alerts.

## 8. Follow-up interview questions

### What is an idempotency key?

It is a unique value that identifies one business operation. The server stores the result and returns the same result when it receives the key again, preventing duplicate processing.

### Which HTTP responses should normally be retried?

Temporary responses such as `408`, `429`, and selected `5xx` responses may be retried. The decision must also consider the HTTP method, API contract, `Retry-After` header, and remaining time budget.

### What is the difference between a retry and a circuit breaker?

A retry makes another attempt after a temporary failure. A circuit breaker stops new attempts for a period when failures remain high, protecting both the caller and the unhealthy dependency.
