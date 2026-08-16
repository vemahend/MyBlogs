# Exponential Backoff and Jitter

## What Are Exponential Backoff and Jitter?

**Exponential backoff** and **jitter** are retry techniques commonly used when calling systems that can fail temporarily, such as:

- External APIs
- Payment gateways
- Databases
- RabbitMQ consumers
- Microservices
- AWS/Azure services

The main idea is:

> **Don't retry immediately, and don't let every client retry at exactly the same time.**

---

## 1. Why Do We Need Retry Backoff?

Imagine a Payment Service calling a bank API:

```text
Payment Service → Bank API
```

The bank API temporarily returns:

```http
503 Service Unavailable
```

A bad retry implementation could do this:

```text
Request → 503
Retry immediately → 503
Retry immediately → 503
Retry immediately → 503
```

This puts even more load on a service that may already be struggling.

---

## 2. Exponential Backoff

With exponential backoff, the delay increases after every failed attempt.

A common formula is:

```text
delay = baseDelay × 2^retryNumber
```

For example:

```text
Initial request → FAIL

Retry 1 → wait 1 second
Retry 2 → wait 2 seconds
Retry 3 → wait 4 seconds
Retry 4 → wait 8 seconds
Retry 5 → wait 16 seconds
```

This gives the downstream service progressively more time to recover.

```text
Request ──X
         1s
Request ──X
         2s
Request ──X
         4s
Request ──X
         8s
Request ──✓
```

---

## 3. The Problem With Exponential Backoff Alone

Imagine 10,000 application instances call the same service.

The downstream service fails at the same time for everyone.

```text
10:00:00 → 10,000 requests fail

10:00:01 → 10,000 clients retry
10:00:03 → 10,000 clients retry
10:00:07 → 10,000 clients retry
```

Even though the retries are delayed, all clients are still retrying at approximately the same time.

This can create a **thundering herd** or **retry storm**.

This is where jitter helps.

---

## 4. What Is Jitter?

**Jitter adds randomness to the retry delay.**

Instead of every application using exactly:

```text
1 second
2 seconds
4 seconds
8 seconds
```

one application might retry after:

```text
1.2 seconds
2.7 seconds
4.4 seconds
9.1 seconds
```

Another might retry after:

```text
0.8 seconds
1.9 seconds
5.2 seconds
7.6 seconds
```

This spreads retries over time instead of creating one large traffic spike.

```text
Without jitter:

Service recovers
      ↓
██████████████████   ← huge retry spike


With jitter:

Service recovers
      ↓
   ██
      ███
         ██
            ███
               ██
```

---

## 5. Practical Example: Payment API

Suppose:

```text
Order API
    ↓
Payment Service
    ↓
External Payment Provider
```

The payment provider returns:

```http
503 Service Unavailable
```

A retry sequence might look like:

```text
Attempt 1 → 503

Wait ~1 second

Attempt 2 → 503

Wait ~2 seconds

Attempt 3 → 503

Wait ~4 seconds

Attempt 4 → 200 OK
```

The `~` indicates that jitter has introduced some randomness into the delay.

---

## 6. Practical Example: RabbitMQ Consumer

Suppose a consumer receives:

```text
OrderCreated
```

and calls an Inventory API:

```text
RabbitMQ
   ↓
OrderCreated
   ↓
Order Consumer
   ↓
Inventory API
```

If Inventory returns `503`, we shouldn't continuously retry immediately.

A better strategy could be:

```text
Attempt 1 → FAIL

wait ~2 sec

Attempt 2 → FAIL

wait ~4 sec

Attempt 3 → FAIL

wait ~8 sec

Attempt 4 → FAIL

→ Dead Letter Queue
```

This prevents a failing dependency from being hammered indefinitely.

---

# 7. Important: Decide Whether the Failure Is Retryable First

Exponential backoff and jitter answer:

> **How long should I wait before retrying?**

They do **not** answer:

> **Should I retry this failure at all?**

This distinction is very important.

A retry policy should normally make two decisions:

```text
Failure occurs
      ↓
Should I retry?
      ↓
If yes, how long should I wait?
```

---

## 8. Don't Retry Every Exception Blindly

This implementation is too broad:

```csharp
catch (HttpRequestException)
{
    // Retry
}
```

It treats every `HttpRequestException` as something that should be retried.

Instead, classify the failure first.

For example:

```text
400 Bad Request          ❌ Don't retry
401 Unauthorized         ❌ Don't retry
403 Forbidden            ❌ Don't retry
404 Not Found            ❌ Usually don't retry

408 Request Timeout      ✅ Retry
429 Too Many Requests    ✅ Retry
502 Bad Gateway          ✅ Retry
503 Service Unavailable  ✅ Retry
504 Gateway Timeout      ✅ Retry
```

---

# 9. Check the Status Code, Not the Exception Message

A fragile implementation would be:

```csharp
catch (HttpRequestException ex)
{
    if (ex.Message.Contains("503"))
    {
        // Retry
    }
}
```

Avoid this.

Exception message strings are not reliable contracts and can change.

Instead, use structured information such as:

```csharp
response.StatusCode
```

or, where available:

```csharp
ex.StatusCode
```

---

# 10. Better C# Example

First call the service and inspect the response.

```csharp
var response = await httpClient.PostAsync(url, content);

if (response.IsSuccessStatusCode)
{
    return response;
}

if (response.StatusCode is
    HttpStatusCode.RequestTimeout or
    HttpStatusCode.TooManyRequests or
    HttpStatusCode.BadGateway or
    HttpStatusCode.ServiceUnavailable or
    HttpStatusCode.GatewayTimeout)
{
    // Retry using exponential backoff + jitter
}
else
{
    // Permanent/non-transient failure.
    // Don't retry.
}
```

The logic becomes:

```text
Call downstream service
        ↓
Did it succeed?
        ↓ No
What type of failure?
        ↓
Is it transient?
   ↙           ↘
 Yes            No
  ↓              ↓
Retry          Fail
  ↓
Exponential Backoff
  +
Jitter
```

---

# 11. Network-Level Exceptions

Sometimes there is no HTTP response because the network connection itself failed.

For example:

```csharp
catch (HttpRequestException)
{
    // Potential transient network failure
}
catch (TaskCanceledException)
{
    // Could represent a timeout
}
```

These failures need to be classified carefully according to the application's retry policy.

---

# 12. Practical C# Backoff + Jitter Example

Once you've determined that the operation is safe and appropriate to retry:

```csharp
var maxRetries = 5;

for (int retry = 0; retry < maxRetries; retry++)
{
    try
    {
        await CallPaymentApiAsync();
        break;
    }
    catch (HttpRequestException)
    {
        var exponentialDelay =
            Math.Pow(2, retry) * 1000;

        var jitter =
            Random.Shared.Next(0, 1000);

        var delay =
            exponentialDelay + jitter;

        await Task.Delay(
            TimeSpan.FromMilliseconds(delay));
    }
}
```

Possible delays could be:

```text
Retry 1 → 1.4 seconds
Retry 2 → 2.8 seconds
Retry 3 → 4.2 seconds
Retry 4 → 8.9 seconds
Retry 5 → 16.3 seconds
```

In production .NET applications, prefer established resilience facilities/libraries rather than maintaining complex retry logic manually.

---

# 13. 429 Too Many Requests

`429 Too Many Requests` deserves special attention.

If the server returns a `Retry-After` header, respect it when appropriate instead of blindly calculating your own delay.

Conceptually:

```text
API → 429 Too Many Requests
       +
       Retry-After: 10 seconds

Client
   ↓
Wait according to Retry-After
   ↓
Retry
```

---

# 14. Payment Retry + Idempotency

Retries become particularly important for payment operations.

Suppose:

```text
POST /payments
```

The payment provider processes the payment successfully, but the response is lost because of a network timeout.

```text
Client
   ↓
Payment Provider
   ↓
Payment processed ✅
   ↓
Response lost ❌
```

The client may think the payment failed.

If it blindly retries:

```text
Payment 1 → $100
Payment 2 → $100
```

the customer could potentially be charged twice.

Therefore, payment retries should normally be combined with **idempotency**.

For example:

```http
POST /payments
Idempotency-Key: payment-abc-123
```

Then:

```text
Attempt 1
   ↓
Payment processed
   ↓
Response lost ❌

Retry using same Idempotency-Key
   ↓
Server recognizes duplicate
   ↓
Does NOT charge again ✅
```

So these concepts often work together:

```text
Retry Policy
     ↓
Is failure transient?
     ↓
Exponential Backoff
     ↓
Jitter
     ↓
Idempotency
```

---

# 15. Practical Production Combination

In a distributed system, retry is only one resilience mechanism.

A typical combination is:

```text
Request
   ↓
Timeout
   ↓
Retry Policy
   ├── Retry only transient failures
   ├── Exponential Backoff
   └── Jitter
   ↓
Circuit Breaker
   ↓
Downstream Service
```

Depending on the architecture, you may also use:

- Idempotency
- Rate limiting
- Dead-letter queues
- Observability/logging
- Correlation IDs
- Circuit breakers
- Timeouts

---

# Interview-Ready Answer

> **Exponential backoff means increasing the delay between retries exponentially, for example 1, 2, 4, and 8 seconds. It gives a temporarily failing downstream service time to recover.**
>
> **Jitter adds randomness to those delays so that when many clients fail simultaneously, they don't all retry at exactly the same time and create a retry storm.**
>
> **Before applying either technique, I first determine whether the failure is transient and should actually be retried. For HTTP calls, I might retry 408, 429, 502, 503, and 504, along with selected network failures, while avoiding retries for permanent failures such as 400, 401, and 403.**
>
> **For payment or transaction operations, I would also use idempotency so that retrying a timed-out request cannot accidentally process the same transaction twice.**

---

## Key Point to Remember

There are **two separate retry decisions**:

```text
1. SHOULD I RETRY?
   ↓
Check whether the failure is transient.

2. HOW SHOULD I RETRY?
   ↓
Exponential Backoff + Jitter
```

**Exponential backoff and jitter solve the second problem, not the first.**
