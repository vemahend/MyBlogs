# 39. What are exponential backoff and jitter?

**Technology:** API Design and Integration Governance

**Source question:** 39. What are exponential backoff and jitter?

## 1. What is it?

**Exponential backoff** is a retry strategy where the application waits longer after each failed attempt. For example, it may wait about 1 second, then 2 seconds, then 4 seconds.

**Jitter** adds randomness to those waiting times. Instead of every client retrying after exactly 4 seconds, each client waits for a different random time within an allowed range.

They are normally used together when calling remote APIs, databases, queues, or other distributed services that may have temporary failures.

## 2. Why is it important?

A failed dependency may need a short time to recover. Retrying immediately and continuously adds more load and can make the failure worse.

Exponential backoff reduces the retry rate as failures continue. Jitter prevents many clients from retrying at the same moment, which is sometimes called the **thundering herd problem**.

In real systems, this helps developers:

- Handle short network or service failures safely.
- Respect API rate limits and reduce unnecessary traffic.
- Avoid retry storms during a shared outage.
- Give an overloaded dependency time to recover.

## 3. How does it work?

A typical retry flow is:

1. Send the request.
2. If it succeeds, return the result.
3. If it fails with a retryable error, calculate a delay that grows with the attempt number.
4. Apply jitter to randomize the delay.
5. Wait, then try again.
6. Stop after a small maximum number of attempts or when the operation's time budget is exhausted.

A common calculation is:

```text
maximum delay for attempt = min(configured cap, base delay × 2^attempt)
actual delay = random value between 0 and maximum delay
```

This variation is known as **full jitter**. The delay cap prevents waiting times from growing without limit.

Only transient failures should normally be retried, such as timeouts, HTTP 408, HTTP 429, and some HTTP 5xx responses. Validation failures such as HTTP 400 usually will not improve through retrying. If the server sends a `Retry-After` header, the client should normally respect it.

## 4. Practical example

A payment service calls a bank's fraud-check API. The API briefly returns HTTP 503 because one of its nodes is restarting.

The payment service retries a limited number of times using exponential backoff and jitter. Different payment instances therefore retry at different moments instead of sending a large burst to the recovering API. The fraud check succeeds on a later attempt and the payment continues.

The payment request also carries an idempotency key. This is important because a timeout does not prove that the bank failed to process the first request.

## 5. Scenario-based interview answer

“In one payment integration, a downstream provider occasionally returned 429 and 503 responses during traffic peaks. Immediate retries from all application instances increased the provider's load.

I decided to use a bounded retry policy with exponential backoff and jitter only for transient failures. We respected `Retry-After`, capped the delay, limited the number of attempts, and kept the total retry time within the API request's timeout budget. For payment operations, we also used an idempotency key so a retry could not create a duplicate charge.

This spread retries across time, reduced traffic spikes, and improved recovery from short failures. Permanent failures still failed fast, and exhausted retries were logged and measured so the support team could see dependency problems.”

## 6. Code example

The following example uses APIs available in supported modern .NET versions, including .NET 8. It demonstrates the calculation directly; production applications can also use a tested resilience library.

```csharp
using System.Net;

static async Task<HttpResponseMessage> SendWithRetryAsync(
    HttpClient client,
    HttpRequestMessage request,
    CancellationToken cancellationToken)
{
    const int maxAttempts = 4;
    var baseDelay = TimeSpan.FromMilliseconds(200);
    var maxDelay = TimeSpan.FromSeconds(5);

    for (var attempt = 0; attempt < maxAttempts; attempt++)
    {
        using var attemptRequest = await CloneAsync(request, cancellationToken);

        try
        {
            var response = await client.SendAsync(attemptRequest, cancellationToken);

            var isTransient = response.StatusCode is HttpStatusCode.RequestTimeout
                or HttpStatusCode.TooManyRequests
                or HttpStatusCode.InternalServerError
                or HttpStatusCode.BadGateway
                or HttpStatusCode.ServiceUnavailable
                or HttpStatusCode.GatewayTimeout;

            if (!isTransient || attempt == maxAttempts - 1)
                return response;

            var delay = response.Headers.RetryAfter?.Delta
                ?? CalculateDelay(attempt, baseDelay, maxDelay);

            response.Dispose();
            await Task.Delay(delay, cancellationToken);
        }
        catch (HttpRequestException) when (attempt < maxAttempts - 1)
        {
            await Task.Delay(
                CalculateDelay(attempt, baseDelay, maxDelay),
                cancellationToken);
        }
    }

    throw new InvalidOperationException("Retry loop ended unexpectedly.");
}

static TimeSpan CalculateDelay(
    int attempt,
    TimeSpan baseDelay,
    TimeSpan maxDelay)
{
    var upperBoundMs = Math.Min(
        maxDelay.TotalMilliseconds,
        baseDelay.TotalMilliseconds * Math.Pow(2, attempt));

    return TimeSpan.FromMilliseconds(Random.Shared.NextDouble() * upperBoundMs);
}

static async Task<HttpRequestMessage> CloneAsync(
    HttpRequestMessage source,
    CancellationToken cancellationToken)
{
    var clone = new HttpRequestMessage(source.Method, source.RequestUri);

    foreach (var header in source.Headers)
        clone.Headers.TryAddWithoutValidation(header.Key, header.Value);

    if (source.Content is not null)
    {
        var bytes = await source.Content.ReadAsByteArrayAsync(cancellationToken);
        clone.Content = new ByteArrayContent(bytes);

        foreach (var header in source.Content.Headers)
            clone.Content.Headers.TryAddWithoutValidation(header.Key, header.Value);
    }

    return clone;
}
```

The request is cloned because the same `HttpRequestMessage` cannot be sent more than once. The delay doubles its upper limit after each failure, `Random.Shared` adds full jitter, and the maximum delay and attempt count keep the policy bounded. The caller's cancellation token also stops retries when the request is cancelled.

For a payment-changing `POST`, the caller should add an idempotency key understood by the server before using this retry method.

## 7. Common mistakes

- Retrying every error, including authentication, authorization, validation, and other permanent failures.
- Using fixed retry times without jitter, causing all clients to retry together.
- Retrying indefinitely or allowing the retry delay to grow without a cap.
- Ignoring `Retry-After` on HTTP 429 or 503 responses.
- Retrying non-idempotent operations without an idempotency key or another deduplication mechanism.
- Setting individual attempt timeouts and retry delays without an overall time budget.
- Creating a new `HttpClient` for each attempt instead of using `IHttpClientFactory` or a long-lived client.
- Hiding exhausted retries without logs, metrics, or alerts.
- Retrying at several architecture layers, which multiplies the number of downstream calls.

## 8. Follow-up interview questions

### What is the difference between exponential backoff and jitter?

Exponential backoff increases the delay after each failure. Jitter randomizes the delay so multiple clients do not retry at the same time.

### Which HTTP responses should be retried?

Usually timeouts, HTTP 408, HTTP 429, and selected HTTP 5xx responses are candidates. The exact policy depends on the operation and the dependency's contract. Most HTTP 4xx responses should not be retried.

### Is it safe to retry a POST request?

Not automatically. A retry may repeat a completed action, such as charging a customer twice. Use an idempotency key, server-side deduplication, or another operation-specific guarantee before retrying it.
