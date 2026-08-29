# 1. What do you look for in code reviews?

**Technology:** Leadership and AI-Assisted Engineering

**Source question:** 1. What do you look for in code reviews?

## 1. What is it?

A code review is a structured check of a proposed change before it is merged. I look beyond formatting and ask whether the change is correct, secure, easy to understand, testable, and safe to run in production.

I review the design and behavior first. Automated tools should handle most style, formatting, and basic static-analysis checks.

## 2. Why is it important?

Code review helps catch defects, security risks, and design problems before they reach customers. It also spreads knowledge across the team, keeps the codebase consistent, and reduces the risk of one developer becoming the only person who understands an area.

For a senior developer or architect, review is also a way to protect system qualities that may not appear in a happy-path test, such as performance, resilience, observability, backward compatibility, and data integrity.

## 3. How does it work?

I normally review a change in this order:

1. Read the ticket and pull request description to understand the expected behavior and scope.
2. Check the overall design: Is the change in the right component? Is there a simpler solution? Does it preserve existing contracts?
3. Follow the main execution path and important failure paths, including null input, timeouts, retries, concurrency, and partial failure.
4. Check security and data handling, especially authorization, validation, secrets, personal data, and logging.
5. Review tests to confirm they prove the business behavior rather than only increase coverage.
6. Check production concerns such as structured logs, metrics, tracing, cancellation, database indexes, deployment order, and rollback safety.
7. Leave clear comments. I mark blocking issues separately from suggestions and explain the reason behind each important request.

I keep the review focused on the submitted change. If I notice unrelated technical debt, I suggest a separate task instead of unnecessarily blocking the pull request.

## 4. Practical example

Suppose a pull request adds a payment endpoint. I would check that the caller is authorized, the amount and currency are validated, and money uses `decimal` rather than `double`. I would also check that an idempotency key prevents a client retry from charging twice.

Then I would review transaction boundaries and external calls. A database transaction cannot safely make a remote payment provider part of the same atomic operation, so the design may need an outbox, a durable payment state, and retry handling. I would also confirm that logs contain a correlation ID but do not expose card details or tokens, and that tests cover duplicate requests, provider timeouts, and failed payments.

## 5. Scenario-based interview answer

“In one payment project, I reviewed a change that retried provider calls after a timeout. The happy-path code was clean, but the retry could submit the same charge more than once.

The problem was not syntax; it was payment correctness. I asked the developer to store a unique idempotency key with the payment request and to return the existing result when the same key was received again. We also added a unique database constraint, passed the key to the provider, and added tests for concurrent duplicate requests and timeout retries.

As a result, retries became safe and we avoided duplicate charges. During reviews I always start with business correctness and failure behavior, then check security, maintainability, tests, and operational concerns. I keep comments respectful, explain why a change matters, and separate required fixes from optional improvements.”

## 6. Code example

This is the type of implementation I would expect for a simplified idempotent payment operation:

```csharp
public async Task<PaymentResult> CreatePaymentAsync(
    CreatePayment request,
    string idempotencyKey,
    CancellationToken cancellationToken)
{
    if (request.Amount <= 0)
        throw new ArgumentOutOfRangeException(nameof(request.Amount));

    var existing = await paymentRepository.FindByKeyAsync(
        idempotencyKey, cancellationToken);

    if (existing is not null)
        return existing;

    var payment = Payment.Create(
        idempotencyKey,
        request.Amount,
        request.Currency);

    await paymentRepository.AddAsync(payment, cancellationToken);
    await unitOfWork.SaveChangesAsync(cancellationToken);

    return payment.ToResult();
}
```

The validation protects the business rule, while the idempotency key makes repeat requests return the same payment. In production, I would also require a unique database constraint on the idempotency key because two requests can pass the first lookup at the same time. I would check how the code handles that constraint conflict and how payment-provider work is processed reliably, often through an outbox and background worker.

## 7. Common mistakes

- Reviewing only naming and formatting while missing business or security problems.
- Approving code because the happy path works without checking timeouts, retries, concurrency, and partial failures.
- Trusting unit-test coverage percentages without checking what the tests actually prove.
- Allowing sensitive values, access tokens, or personal data into logs.
- Writing vague comments such as “this is wrong” without explaining the risk or suggesting a direction.
- Treating personal preferences as blocking rules when no team standard exists.
- Making a pull request too large to review properly or adding unrelated refactoring to it.
- Relying on AI-generated code or automated review comments without verifying behavior, APIs, security, and licensing concerns.
- Approving database or API changes without considering backward-compatible deployment and rollback.

## 8. Follow-up interview questions

### How do you handle disagreement during a code review?

I discuss the requirement, risk, and team standards rather than personal preference. If the decision has a wider architectural impact, I arrange a short conversation and record the agreed decision.

### What makes a code review comment blocking?

A comment is blocking when the code may be incorrect, insecure, unreliable, incompatible, or difficult to operate. Minor naming or style suggestions are usually non-blocking unless they violate an agreed automated standard.

### How do you review AI-generated code?

I treat it like any untrusted contribution. I verify the logic, supported APIs, security, error handling, tests, and license or provenance concerns, and I make sure a developer remains accountable for the final change.
