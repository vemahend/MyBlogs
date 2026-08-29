# 3. How do you balance architecture and delivery speed?

**Technology:** Architecture and Design

**Source question:** 3. How do you balance architecture and delivery speed?

## 1. What is it?

Balancing architecture and delivery speed means building enough structure to deliver safely without designing more than the product currently needs.

Architecture and speed are not opposites. Good architecture can improve delivery speed by creating clear boundaries, reliable tests, and simple deployment paths. The balance is to make important decisions early while delaying decisions that are expensive, uncertain, or easy to change later.

For example, a team may start with a modular monolith instead of microservices. It can still separate payment, customer, and notification responsibilities in the code. This provides useful boundaries now without adding the operational cost of distributed services.

## 2. Why is it important?

If a team focuses only on short-term speed, it may create tightly coupled code, fragile releases, security gaps, and repeated production incidents. Delivery then becomes slower because every change affects many parts of the system.

If a team focuses only on an ideal future architecture, it may spend months building infrastructure and abstractions before delivering customer value. Some of that work may never be needed.

A practical balance helps a team:

- Release useful features early and learn from real users.
- Protect critical qualities such as security, correctness, auditability, and availability.
- Keep common changes easy to make and test.
- Avoid technology and operational complexity without a clear benefit.
- Reduce rework by creating clean boundaries around important business areas.
- Use production evidence to guide later architecture changes.

Senior developers and architects need this skill because architecture is a business decision as well as a technical one. The right design depends on risk, deadlines, team skills, cost, and the impact of failure.

## 3. How does it work?

A practical approach is:

1. **Understand the immediate business goal.** Be clear about what must be delivered, by when, and why it matters.
2. **Identify non-negotiable requirements.** Security, regulatory compliance, data correctness, and recovery may require work from the first release.
3. **Assess the main risks.** Focus design effort on areas that are costly to change or dangerous to get wrong, such as payment integrity or customer identity.
4. **Choose the simplest suitable architecture.** Use established platform features and familiar patterns before adding custom frameworks or distributed components.
5. **Create clear boundaries.** Separate business modules and data access so that future changes remain possible, even if everything is deployed together today.
6. **Deliver a thin end-to-end slice.** Build one small workflow through API, business logic, storage, security, monitoring, and deployment. This tests the architecture with real code.
7. **Automate the safety checks.** Add focused unit tests, integration tests, code analysis, and a repeatable deployment pipeline.
8. **Record important trade-offs.** A short Architecture Decision Record (ADR) should explain the context, decision, consequences, and review condition.
9. **Measure and evolve.** Review lead time, failure rate, latency, incidents, cost, and change difficulty. Improve the architecture when evidence shows a real constraint.

This is sometimes called intentional or evolutionary architecture. It does not mean ignoring design. It means doing the design needed for current risks while keeping reasonable options open.

## 4. Practical example

Suppose a bank needs to launch a domestic payment feature in eight weeks. The first version will have moderate traffic, one development team, and strict requirements for authorization, audit history, and duplicate prevention.

Starting with many independently deployed microservices would slow delivery and introduce network failures, message handling, distributed tracing, and deployment complexity. Instead, the team builds a modular monolith in ASP.NET Core with separate Payment, Account, and Notification modules.

The team does not postpone the important safeguards:

- Every payment request requires authentication and authorization.
- An idempotency key and database unique constraint prevent duplicate payments.
- Payment data and an outbox message are stored in one transaction.
- Notifications run asynchronously, so their failure does not fail a payment.
- Structured logs, metrics, tracing, and alerts are included in the first release.
- Automated tests cover payment rules and database constraints.

This approach is faster to build and operate, but its module boundaries provide a path to extract a service later if traffic, team ownership, or independent deployment creates a real need.

## 5. Scenario-based interview answer

**Scenario:** A product manager wants a payment feature in two months. Some engineers want to create several microservices and a new internal framework before starting feature development.

**Natural interview answer:**

“I balance architecture and speed by first separating essential risk controls from optional future design.

The problem was that we had a fixed launch date, one team, and moderate expected traffic, but the proposed solution included several services and a custom framework. That would have added delivery and operational risk without solving a current problem.

I decided on a modular monolith using ASP.NET Core and SQL Server. We agreed on clear Payment, Account, and Notification boundaries, but deployed them as one application. We delivered a thin payment flow first and included the controls that were expensive to add later: authorization, idempotency, a unique database constraint, transactional outbox handling, audit records, observability, and automated deployment. We recorded why we delayed service extraction and defined review triggers such as separate team ownership, a proven scaling difference, or a need for independent releases.

The result was that we met the launch date with a secure and supportable system. The simpler deployment reduced early production risk, and later features were easier to add because the module boundaries were already clear. I would not claim the design was permanent; I would use production data and delivery metrics to decide when further architectural investment was justified.”

## 6. Code example

This example shows a small payment use case with a clean boundary. It adds enough structure to protect the business rule without introducing a large framework.

```csharp
public sealed record SubmitPayment(
    Guid AccountId,
    decimal Amount,
    string IdempotencyKey);

public interface IPaymentRepository
{
    Task<Payment?> FindByIdempotencyKeyAsync(
        string key,
        CancellationToken cancellationToken);

    Task SaveWithOutboxMessageAsync(
        Payment payment,
        OutboxMessage message,
        CancellationToken cancellationToken);
}

public sealed class SubmitPaymentHandler(IPaymentRepository repository)
{
    public async Task<Guid> HandleAsync(
        SubmitPayment command,
        CancellationToken cancellationToken)
    {
        if (command.Amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(command.Amount));

        var existing = await repository.FindByIdempotencyKeyAsync(
            command.IdempotencyKey,
            cancellationToken);

        if (existing is not null)
            return existing.Id;

        var payment = Payment.Create(
            command.AccountId,
            command.Amount,
            command.IdempotencyKey);

        var message = OutboxMessage.For(
            new PaymentSubmitted(payment.Id));

        await repository.SaveWithOutboxMessageAsync(
            payment,
            message,
            cancellationToken);

        return payment.Id;
    }
}
```

The handler contains the workflow and depends on a small repository contract. The repository implementation should save the payment and outbox message in one database transaction. The database must also have a unique constraint on the idempotency key because the earlier lookup alone cannot prevent two concurrent requests from inserting duplicates.

This design is deliberately small. It protects an important payment rule and keeps infrastructure outside the use case, but it does not add service boundaries, a mediator library, or extra layers without a demonstrated need.

## 7. Common mistakes

- Treating speed as writing code quickly while ignoring testing, deployment, security, and support.
- Building for imagined scale instead of the expected workload and measured evidence.
- Using microservices because they appear more advanced, despite having one small team and no need for independent deployment.
- Creating a large internal framework or many abstractions before a real use case proves their value.
- Taking shortcuts in non-negotiable areas such as authorization, data integrity, auditability, secrets, and recovery.
- Calling poor-quality code a temporary solution without an owner, deadline, or tracked follow-up work.
- Spending weeks on architecture diagrams without proving the design through a thin end-to-end slice.
- Allowing deadline pressure to remove observability, making production problems slow to diagnose.
- Refactoring architecture without defining the business or operational result it should improve.
- Making every decision permanent instead of recording assumptions and review triggers.

## 8. Follow-up interview questions

### How do you decide which architecture work must be done before release?

Prioritize work based on risk and cost of change. Security, compliance, data correctness, recovery, and critical boundaries usually need early attention. Optional scaling mechanisms and complex abstractions can wait until there is evidence that they are needed.

### How do you prevent technical debt when working under a deadline?

Make shortcuts explicit, assess their risk, and record each accepted debt item with an owner and review date. Keep automated tests and basic engineering standards in place, and reserve capacity to remove debt that is slowing delivery or increasing production risk.

### When would you move from a modular monolith to microservices?

Consider extraction when a clear module needs independent deployment, scaling, fault isolation, or team ownership. Confirm that the benefit is greater than the added cost of networking, data consistency, monitoring, testing, and operating multiple services.
