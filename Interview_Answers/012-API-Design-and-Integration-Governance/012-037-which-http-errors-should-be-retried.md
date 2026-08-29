# 37. Which HTTP errors should be retried?

**Technology:** API Design and Integration Governance

**Source question:** 37. Which HTTP errors should be retried?

## 1. What is it?

Retrying an HTTP error means sending the same request again after a temporary failure.

Usually, retry only failures that may succeed shortly afterward:

- `408 Request Timeout`
- `429 Too Many Requests`, while respecting the `Retry-After` header
- `500 Internal Server Error`, when the failure is known to be temporary
- `502 Bad Gateway`
- `503 Service Unavailable`
- `504 Gateway Timeout`
- Temporary connection failures and client-side timeouts, although these are exceptions rather than HTTP status codes

Do not automatically retry most `4xx` responses such as `400`, `401`, `403`, `404`, or `422`. They normally mean the request, credentials, permissions, resource, or business data must change. Some APIs may define special retry rules for statuses such as `409 Conflict` or `423 Locked`, but that must be an explicit domain rule.

## 2. Why is it important?

Distributed systems have short-lived failures. A service may restart, a gateway may briefly lose its upstream connection, or a rate limit may be reached. A controlled retry can hide these temporary problems from the user.

Incorrect retries can make an outage worse. They can overload an unhealthy service, increase latency, or repeat a payment. Architects therefore need rules for the status code, HTTP method, request idempotency, delay, and maximum retry count.

## 3. How does it work?

The client follows a small decision flow:

1. Send the request once.
2. If it succeeds, return the response.
3. If it fails, classify the failure as temporary or permanent.
4. Check whether repeating the operation is safe. `GET`, `HEAD`, `OPTIONS`, and `TRACE` are normally safe. `PUT` and `DELETE` are idempotent by HTTP semantics, but an implementation can still have side effects. `POST` and `PATCH` need special care.
5. For `429` or `503`, use `Retry-After` when the server provides it. Otherwise, wait using exponential backoff with random jitter.
6. Stop after a small number of attempts or when the overall timeout is reached.
7. Use a circuit breaker when a dependency remains unhealthy, so every caller does not keep retrying it.

A retry is safe only when the operation can be repeated without creating a second business result. For a payment `POST`, use an idempotency key stored by the server, or do not retry automatically.

## 4. Practical example

A payment service calls a bank and receives `503 Service Unavailable`. The request contains an idempotency key such as `payment-87421`. The client waits, retries with exponential backoff, and the bank returns the result already associated with that key if it processed the first attempt.

The client does not retry a `400` caused by an invalid account number because sending the same data again cannot fix it. It also does not blindly retry a timeout without an idempotency key, because the bank may have completed the payment even though the response was lost.

## 5. Scenario-based interview answer

“In one payment integration, short gateway failures were causing customer-visible errors. I first separated temporary failures from permanent ones. We allowed limited retries for connection failures, timeouts, `408`, `429`, `502`, `503`, and `504`. We treated `500` as retryable only where the provider confirmed it represented a temporary failure.

For reads, we used exponential backoff with jitter and respected `Retry-After`. For payment creation, we retried only after introducing an idempotency key and server-side deduplication. We capped both the attempt count and total execution time, and added metrics for retry count and final outcome. This improved recovery from brief failures without producing duplicate payments or creating a retry storm.”

## 6. Code example

For .NET 8 and later, `Microsoft.Extensions.Http.Resilience` provides a supported resilience handler for `HttpClient`:

```csharp
using Microsoft.Extensions.Http.Resilience;

builder.Services
    .AddHttpClient<BankClient>(client =>
    {
        client.BaseAddress = new Uri("https://bank.example/");
    })
    .AddStandardResilienceHandler(options =>
    {
        options.Retry.MaxRetryAttempts = 3;
        options.Retry.UseJitter = true;
        options.Retry.ShouldRetryAfterHeader = true;

        // Do not automatically retry POST, PATCH, PUT, DELETE, or CONNECT.
        // Enable a write separately only when its end-to-end behavior is idempotent.
        options.Retry.DisableForUnsafeHttpMethods();
    });
```

The standard handler treats `408`, `429`, server errors (`500` and above), `HttpRequestException`, and resilience timeouts as transient by default. It also includes overall and per-attempt timeouts plus a circuit breaker. The example limits retries, adds jitter, respects `Retry-After`, and prevents automatic retries of unsafe methods. Avoid stacking multiple resilience handlers because that can multiply the number of attempts.

For a payment `POST`, the application should use a dedicated client policy and send a stable idempotency key. Disabling unsafe methods in the general policy is the safer default.

## 7. Common mistakes

- Retrying every `4xx` or every `5xx` without understanding the API contract.
- Retrying `401` repeatedly instead of refreshing credentials once or fixing authentication.
- Retrying `POST` after a timeout without an idempotency key, causing duplicate orders or payments.
- Ignoring `Retry-After` on `429` or `503`.
- Using immediate retries instead of exponential backoff and jitter.
- Allowing unlimited attempts or giving each attempt a new full timeout.
- Letting retries happen at several layers, which multiplies traffic.
- Logging only the final failure and losing visibility into retry count, delay, and dependency health.
- Retrying a non-replayable request body or reusing an `HttpRequestMessage` incorrectly.

## 8. Follow-up interview questions

**1. Should all `500` responses be retried?**  
No. A `500` may be temporary, but it can also represent a repeatable application bug. Retry it only a few times, only for an idempotent operation, and preferably according to the provider’s contract.

**2. What is exponential backoff with jitter?**  
The delay grows after each failure, and a small random value is added. This reduces the chance that many clients retry at the same moment.

**3. Can a timed-out payment request be retried?**  
Only when the operation supports end-to-end idempotency, normally through a stable idempotency key and server-side deduplication. A timeout does not prove that the server failed to process the first request.
