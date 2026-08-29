# 5. What tests would you write for a payment or transaction workflow?

**Technology:** Testing and Quality

**Source question:** 5. What tests would you write for a payment or transaction workflow?

## 1. What is it?

Testing a payment workflow means checking the complete payment journey, not only one method or API endpoint. The tests should prove that money is charged once, transaction data is correct, failures are handled safely, and the customer receives an accurate result.

I would use several test levels:

- **Unit tests** for business rules such as amount validation, status changes, and retry decisions.
- **Integration tests** for the database, payment-gateway client, message broker, and webhook handling.
- **Contract tests** to confirm that our gateway requests and responses match the provider's API contract.
- **End-to-end tests** for a small number of critical journeys in a sandbox environment.
- **Non-functional tests** for security, performance, resilience, audit logging, and recovery.

## 2. Why is it important?

A payment defect can charge a customer twice, lose a successful transaction, show the wrong status, or create a mismatch between our system and the payment provider. These problems affect real money, customer trust, financial reporting, and regulatory obligations.

Strong tests help us prove important guarantees:

- The same request cannot create multiple charges.
- Failed and timed-out operations can be retried safely.
- Transaction states move only through valid paths.
- Database updates and published events remain consistent.
- Sensitive card data is never stored or written to logs.
- Refunds, cancellations, and provider callbacks are processed correctly.

## 3. How does it work?

I start by mapping the workflow and its failure points:

1. The client sends an amount, currency, payment method token, and idempotency key.
2. The API validates the request and creates a pending transaction.
3. The service calls the payment provider.
4. The provider may approve, decline, time out, or return an unknown result.
5. The service saves the final state and publishes an event, often through an outbox.
6. A webhook may later confirm or change the payment state.
7. Reconciliation compares our records with the provider's records.

For each step, I test the happy path, validation failures, business-rule failures, dependency failures, duplicate requests, concurrency, retries, and recovery after a partial failure.

Important cases include:

- Valid payment, declined payment, zero or negative amount, unsupported currency, and invalid token.
- Duplicate requests with the same idempotency key, including two requests arriving at the same time.
- Gateway timeout before and after the provider creates the charge.
- Database failure, broker failure, and service restart between workflow steps.
- Duplicate, delayed, invalidly signed, and out-of-order webhooks.
- Valid and invalid state changes, such as preventing a captured payment from becoming pending again.
- Full refund, partial refund, repeated refund, and refund greater than the captured amount.
- Correct rounding and decimal handling for different currencies.
- Authorization rules, secret protection, masked logs, audit history, and webhook signature verification.
- Load, latency, retry storms, circuit-breaker behavior, and reconciliation of unknown transactions.

Tests must not depend on a real production provider. Unit tests use fakes, integration tests use controlled test infrastructure, and only a small end-to-end suite uses the provider's sandbox.

## 4. Practical example

Consider a customer paying NZD 120 for an order. The payment provider accepts the charge, but our API times out before receiving the response. The mobile app retries with the same idempotency key.

I would test that the second request returns the existing payment rather than creating another charge. I would also test that a later signed webhook changes the transaction from `Pending` to `Succeeded`, that only one `PaymentSucceeded` event is published, and that reconciliation can repair the status if the webhook never arrives.

This test covers the more dangerous outcome: the provider has taken the money while our system does not yet know the final result.

## 5. Scenario-based interview answer

**Problem:** In one payment service, a gateway timeout caused the client to retry. Without protection, both requests could reach the provider and charge the customer twice.

**Decision:** I treated idempotency, concurrency, and unknown gateway outcomes as core business requirements. I did not limit testing to successful and declined payments.

**Implementation:** I added unit tests for validation and state transitions, integration tests against the real database for the unique idempotency constraint and outbox, and gateway contract tests. I also ran concurrent requests with the same key and simulated timeouts at different points. Webhook tests covered duplicate delivery, bad signatures, and events arriving out of order. A small sandbox suite checked the main payment and refund journeys.

**Result:** Retries returned the original transaction, only one provider charge was requested, and only one success event was produced. Timeout cases remained pending until a webhook or reconciliation confirmed the outcome. This gave us confidence in both normal processing and partial-failure recovery.

In an interview, I would summarise it like this: “For payments, I test business correctness and failure recovery together. My main assertions are no duplicate charge, no invalid state transition, no lost event, and no exposure of sensitive data. I use unit, integration, contract, and a focused set of end-to-end tests, with special attention to idempotency, concurrency, timeouts, webhooks, refunds, and reconciliation.”

## 6. Code example

The following example uses xUnit and a fake gateway to prove a key rule: retrying the same payment request must not charge twice.

```csharp
public sealed record PaymentRequest(
    string IdempotencyKey,
    decimal Amount,
    string Currency,
    string PaymentToken);

public sealed record PaymentResult(Guid PaymentId, string Status);

public interface IPaymentGateway
{
    Task<string> ChargeAsync(
        decimal amount,
        string currency,
        string token,
        CancellationToken cancellationToken);
}

public interface IPaymentRepository
{
    Task<PaymentResult?> FindByIdempotencyKeyAsync(
        string key,
        CancellationToken cancellationToken);

    Task<PaymentResult> SaveSucceededAsync(
        string key,
        string providerReference,
        CancellationToken cancellationToken);
}

public sealed class PaymentService(
    IPaymentGateway gateway,
    IPaymentRepository repository)
{
    public async Task<PaymentResult> PayAsync(
        PaymentRequest request,
        CancellationToken cancellationToken)
    {
        var existing = await repository.FindByIdempotencyKeyAsync(
            request.IdempotencyKey, cancellationToken);

        if (existing is not null)
            return existing;

        var providerReference = await gateway.ChargeAsync(
            request.Amount,
            request.Currency,
            request.PaymentToken,
            cancellationToken);

        return await repository.SaveSucceededAsync(
            request.IdempotencyKey,
            providerReference,
            cancellationToken);
    }
}

public sealed class PaymentServiceTests
{
    [Fact]
    public async Task Retry_with_same_key_returns_existing_payment_without_new_charge()
    {
        var existing = new PaymentResult(Guid.NewGuid(), "Succeeded");
        var gateway = new CountingGateway();
        var repository = new StubRepository(existing);
        var service = new PaymentService(gateway, repository);

        var request = new PaymentRequest(
            "order-481-payment", 120.00m, "NZD", "tok_test_123");

        var result = await service.PayAsync(request, CancellationToken.None);

        Assert.Equal(existing, result);
        Assert.Equal(0, gateway.ChargeCount);
    }

    private sealed class CountingGateway : IPaymentGateway
    {
        public int ChargeCount { get; private set; }

        public Task<string> ChargeAsync(
            decimal amount,
            string currency,
            string token,
            CancellationToken cancellationToken)
        {
            ChargeCount++;
            return Task.FromResult("provider-reference");
        }
    }

    private sealed class StubRepository(PaymentResult existing)
        : IPaymentRepository
    {
        public Task<PaymentResult?> FindByIdempotencyKeyAsync(
            string key,
            CancellationToken cancellationToken) =>
            Task.FromResult<PaymentResult?>(existing);

        public Task<PaymentResult> SaveSucceededAsync(
            string key,
            string providerReference,
            CancellationToken cancellationToken) =>
            throw new InvalidOperationException("An existing payment must not be saved again.");
    }
}
```

The test checks both the returned result and the important side effect: the gateway call count stays at zero. In production, the database must also enforce a unique constraint on the idempotency key. The read-before-write code alone is not safe when concurrent requests arrive, so I would verify that behavior with an integration test using the real database.

## 7. Common mistakes

- Testing only successful and declined payments while ignoring timeouts and unknown results.
- Mocking every dependency, so database constraints, transactions, serialization, and message delivery are never tested.
- Assuming a retry is safe without an idempotency key and a database uniqueness rule.
- Using `double` for money instead of `decimal`, or ignoring currency-specific rounding rules.
- Expecting webhooks to arrive once and in order.
- Retrying every gateway error, including permanent declines.
- Updating the database and publishing an event separately without testing partial failure or an outbox approach.
- Sharing test data between tests, which makes payment tests flaky.
- Calling the provider sandbox in every test, making the suite slow and unreliable.
- Putting real card numbers, tokens, secrets, or personal data in test code and logs.
- Asserting only HTTP status codes instead of checking state, provider calls, events, and audit records.
- Failing to test reconciliation and operational recovery for transactions stuck in an unknown state.

## 8. Follow-up interview questions

### How would you test two payment requests arriving at the same time?

Send both requests concurrently with the same idempotency key against the real database. Assert that the unique constraint allows one logical transaction, the provider is charged once, and both callers receive the same payment result.

### What should happen when the gateway times out?

Do not immediately mark the payment as failed because the provider may have completed the charge. Keep it pending or unknown, query the provider using the same idempotency reference, and use a webhook or reconciliation job to confirm the final state.

### Which tests should run in the CI pipeline?

Run fast unit tests, database and broker integration tests, and provider contract tests on every relevant change. Run a small sandbox end-to-end suite at controlled times because external sandboxes are slower and can be unstable.
