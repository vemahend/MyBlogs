# Retry Policies in .NET and Payment Systems

## What Is a Retry Policy?

A **Retry Policy** means that when an operation fails because of a
**temporary (transient) problem**, the application waits for a short
period and tries the operation again instead of failing immediately.

``` text
Request
   ↓
Attempt 1 → Failed
   ↓
Wait
   ↓
Attempt 2 → Failed
   ↓
Wait longer
   ↓
Attempt 3 → Success
```

Retries are common in:

-   HTTP/API calls
-   Database connections
-   RabbitMQ / message consumers
-   Cloud services
-   Payment gateways
-   External third-party integrations

------------------------------------------------------------------------

## Example: Payment Provider Is Temporarily Unavailable

Suppose the Payment Service calls an external payment provider.

``` text
Payment Service
      ↓
Payment Provider
      ↓
503 Service Unavailable ❌
```

A `503` normally indicates a temporary problem.

Instead of immediately failing the payment:

``` text
Attempt 1 → 503 ❌
             ↓
          Wait 1 sec

Attempt 2 → 503 ❌
             ↓
          Wait 2 sec

Attempt 3 → 200 OK ✅
```

------------------------------------------------------------------------

# Exponential Backoff

We should normally avoid retrying immediately.

Instead, increase the delay between retries:

``` text
Attempt 1 fails
      ↓
Wait 1 second

Attempt 2 fails
      ↓
Wait 2 seconds

Attempt 3 fails
      ↓
Wait 4 seconds
```

This is called **Exponential Backoff**.

It prevents us from continuously hitting a service that is already
struggling.

------------------------------------------------------------------------

# Jitter

If hundreds of application instances fail at the same time, they might
all retry at exactly the same time.

For example:

``` text
Service Instance 1 ─┐
Service Instance 2 ─┤
Service Instance 3 ─┼── Retry after exactly 2 seconds
Service Instance 4 ─┤
Service Instance 5 ─┘
```

This can create another traffic spike.

**Jitter** adds a small random delay:

``` text
Instance 1 → 2.1 sec
Instance 2 → 2.7 sec
Instance 3 → 2.3 sec
Instance 4 → 2.9 sec
```

A strong resilience strategy is therefore:

> **Exponential Backoff + Jitter**

------------------------------------------------------------------------

# What Should We Retry?

Retries should generally be used for **transient failures**.

Examples include:

``` text
Network connection failure
Timeout
HTTP 408 Request Timeout
HTTP 429 Too Many Requests
HTTP 502 Bad Gateway
HTTP 503 Service Unavailable
HTTP 504 Gateway Timeout
Temporary database connectivity problem
```

## HTTP 408

`408 Request Timeout` means the server waited too long for the client to
complete/send its request.

``` text
Client                    Server
  │                          │
  │──── Start Request ──────>│
  │                          │
  │     Network problem      │
  │                          │
  │                    Waits...
  │                          │
  │<──── 408 Timeout ────────│
```

## HTTP 504

`504 Gateway Timeout` is different.

It normally means a gateway or proxy did not receive a response from an
upstream service within the allowed time.

``` text
Client
   ↓
API Gateway
   ↓
Payment Service
   ↓
Payment Provider
      ❌ Taking too long

API Gateway
   ↓
504 Gateway Timeout
```

------------------------------------------------------------------------

# What Should We NOT Retry?

Do not blindly retry permanent or business failures.

Examples:

``` text
400 Bad Request
401 Unauthorized
403 Forbidden
Invalid payment details
Card declined
Insufficient funds
Invalid account
Validation failure
```

For example:

``` text
Payment Request
      ↓
Card Declined
      ↓
Retry 1 → Card Declined
Retry 2 → Card Declined
Retry 3 → Card Declined
```

Retrying does not solve the underlying problem.

------------------------------------------------------------------------

# Retry Policies Are Dangerous in Payment Systems

Consider this situation:

``` text
Payment Service
      ↓
Charge $500
      ↓
Payment Provider
      ↓
Customer charged successfully ✅
      ↓
Response lost because of network timeout ❌
```

Our Payment Service only sees:

``` text
Timeout
```

It does **not necessarily know** whether the provider processed the
payment.

If we blindly retry:

``` text
Retry
   ↓
Charge $500
   ↓
Customer could be charged again ❌
```

Therefore:

> **Never blindly retry a non-idempotent operation.**

------------------------------------------------------------------------

# Retry + Idempotency

Payment requests should generally use an idempotency key.

For example:

``` http
Idempotency-Key: PAY-ABC-123
```

First attempt:

``` text
PAY-ABC-123
     ↓
Charge $500
     ↓
Provider processes payment ✅
     ↓
Response lost ❌
```

The client retries using the **same key**:

``` text
PAY-ABC-123
     ↓
Provider recognizes existing request
     ↓
Does NOT charge again
     ↓
Returns original transaction
```

Therefore:

``` text
Retry
   +
Idempotency
   =
Safer payment processing
```

------------------------------------------------------------------------

# Retry Policy in .NET

Modern .NET applications commonly configure resilience policies around
`HttpClient`.

Conceptually:

``` csharp
services
    .AddHttpClient<IPaymentGateway, PaymentGateway>()
    .AddStandardResilienceHandler();
```

The exact configuration depends on the .NET version and resilience
library being used.

A payment-specific policy might conceptually say:

``` text
Retry:
    Network failures
    408
    429
    Selected 5xx errors

Maximum attempts:
    3

Delay:
    Exponential backoff

Jitter:
    Enabled
```

------------------------------------------------------------------------

# Retry With RabbitMQ

Retries are also important when consuming messages.

Suppose:

``` text
RabbitMQ
    ↓
PaymentCompleted
    ↓
Order Service
    ↓
Database temporarily unavailable ❌
```

We should not necessarily send the message directly to the Dead Letter
Queue.

Instead:

``` text
PaymentCompleted
      ↓
Attempt 1 ❌
      ↓
Wait 5 seconds
      ↓
Attempt 2 ❌
      ↓
Wait 30 seconds
      ↓
Attempt 3 ❌
      ↓
DLQ
```

The flow becomes:

``` text
RabbitMQ
   ↓
Consumer
   ↓
Processing failed
   ↓
Is failure transient?
   │
   ├── YES
   │     ↓
   │   Retry
   │     ↓
   │   Retry limit exceeded?
   │       │
   │       ├── NO → Retry
   │       │
   │       └── YES → DLQ
   │
   └── NO
         ↓
        DLQ
```

------------------------------------------------------------------------

# Retry + Inbox Pattern

Message brokers commonly provide **at-least-once delivery**, so a
message may be delivered again.

For example:

``` text
RabbitMQ
   ↓
PaymentCompleted
   ↓
Order Service
   ↓
Update Order = Paid ✅
   ↓
Consumer crashes before ACK ❌
```

RabbitMQ may deliver the message again.

Therefore retries/redelivery should be combined with an **Inbox
Pattern** or another idempotent-consumer mechanism.

``` text
Message received
      ↓
Check MessageId in Inbox
      ↓
Already processed?
   /             \
 YES              NO
  ↓                ↓
ACK / Ignore    Process
                   ↓
             Save business data
                   +
             Save Inbox record
```

------------------------------------------------------------------------

# Retry + Outbox + Inbox + DLQ

A resilient event-driven payment system could look like:

``` text
Payment API
    ↓
Idempotency
    ↓
Payment Provider
    ↓
Retry Policy
    ↓
Payment Completed
    ↓
Outbox
    ↓
RabbitMQ
    ↓
Inbox
    ↓
Order Consumer
    ↓
Retry Policy
    ↓
┌───────────────┐
│               │
Success       Still Failing
                ↓
               DLQ
```

------------------------------------------------------------------------

# Difference Between the Main Patterns

  Concept           Purpose
  ----------------- -------------------------------------------------------
  **Retry**         Handles temporary/transient failures
  **Idempotency**   Makes repeated requests safe
  **Outbox**        Prevents producer events from being lost
  **Inbox**         Prevents duplicate consumer processing
  **DLQ**           Stores messages that cannot be successfully processed

------------------------------------------------------------------------

# Production Considerations

For production systems, do not simply say:

> "We retry three times."

Consider:

1.  **Which errors are retryable?**
2.  **How many retries are allowed?**
3.  **What is the delay between retries?**
4.  **Are we using exponential backoff?**
5.  **Are we adding jitter?**
6.  **Is the operation idempotent?**
7.  **What happens after retries are exhausted?**
8.  **Should the message go to a DLQ?**
9.  **How will failures be monitored and alerted?**
10. **Could retries overload an already unhealthy dependency?**

Retries are also commonly combined with:

``` text
Timeout
Circuit Breaker
Rate Limiting
Bulkhead / Concurrency Limiting
Idempotency
Observability
```

------------------------------------------------------------------------

# Interview Answer

A concise senior-level answer:

> **A retry policy is a resilience mechanism used for transient failures
> such as network errors, timeouts, 429s, and selected 5xx responses. I
> normally use a limited number of retries with exponential backoff and
> jitter. I avoid retrying validation or business failures such as a
> declined payment. For payment operations, retries must be designed
> together with idempotency because a timeout does not necessarily mean
> the payment failed---the provider may have processed it and the
> response may simply have been lost. For message consumers, I combine
> retries with idempotent processing or an Inbox Pattern, and after the
> retry limit is exhausted the message can be moved to a DLQ for
> investigation or controlled reprocessing.**

------------------------------------------------------------------------

# Easy Way to Remember

``` text
Retry
→ Try again when the failure is temporary.

Backoff
→ Don't retry immediately.

Jitter
→ Don't let every instance retry simultaneously.

Idempotency
→ Make the retry safe.

DLQ
→ Store messages that still cannot be processed.

Outbox
→ Send events reliably.

Inbox
→ Consume events safely without duplicate business processing.
```
