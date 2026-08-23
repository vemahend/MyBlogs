# 13. What is a domain event?

**Technology:** Architecture and Design

**Source question:** 13. What is a domain event?

## 1. What is it?

A domain event is a record that something important has already happened in the business domain. It is normally named in the past tense, such as `PaymentAuthorized`, `MoneyTransferred`, or `AccountLocked`.

The event describes a business fact. It should contain the information needed to understand that fact, but it should not contain business logic or instructions about what must happen next.

## 2. Why is it important?

Without domain events, one use case often calls every follow-up action directly. For example, payment code may update an order, create an invoice, send an email, and write an audit entry. This makes the main business operation tightly coupled to many other concerns.

Domain events let the aggregate announce a meaningful change while separate handlers react to it. This helps developers:

- keep the core business rule focused;
- add new reactions without changing the aggregate;
- make business workflows explicit and easier to test;
- reduce coupling between parts of the same application.

A domain event is not automatically a message sent to another service. Communication across service boundaries normally uses an integration event, often published reliably through an outbox.

## 3. How does it work?

A common flow is:

1. A command calls a method on an aggregate, such as `account.Debit(amount)`.
2. The aggregate checks its business rules and changes its state.
3. The aggregate creates a domain event and stores it in an internal collection.
4. The application saves the aggregate in the database.
5. A dispatcher sends the recorded events to their handlers, usually in the same process.
6. Handlers perform related work, such as creating an audit record or preparing an integration event.
7. The aggregate's event collection is cleared after successful dispatch.

The team must choose transaction timing deliberately. Dispatching before the database commit can keep handler changes in the same transaction. Dispatching after the commit avoids handlers running for data that later rolls back, but handlers then need retry and idempotency support. For reliable external messaging, save an outbox record in the same transaction as the business change and publish it later.

## 4. Practical example

In a banking system, a customer transfers money from one account to another. After the transfer aggregate validates the balance and records the transfer, it raises `MoneyTransferred`.

One in-process handler writes a business audit entry. Another creates a notification request. If a fraud service in another bounded context must be informed, a handler converts the domain event into an integration event and stores it in the outbox. A background worker publishes that integration event safely after the transaction commits.

The transfer aggregate therefore owns the transfer rules, but it does not need to know how email, auditing, or external messaging works.

## 5. Scenario-based interview answer

“In a payment system, our payment-completion method was directly calling receipt, loyalty, notification, and audit services. The method became difficult to change and a failure in a secondary action could affect the main payment flow.

I kept payment validation and state changes inside the payment aggregate and raised a `PaymentCompleted` domain event after a valid transition. In-process handlers dealt with local follow-up work. For events needed by other services, we wrote an integration event to an outbox in the same database transaction, then a worker published it. Consumers were idempotent because delivery could occur more than once.

This made the payment logic smaller, allowed new reactions to be added independently, and prevented successful payments from being lost just because an external broker or notification service was temporarily unavailable.”

## 6. Code example

```csharp
public interface IDomainEvent
{
    DateTimeOffset OccurredAtUtc { get; }
}

public sealed record PaymentCompleted(
    Guid PaymentId,
    decimal Amount,
    DateTimeOffset OccurredAtUtc) : IDomainEvent;

public sealed class Payment
{
    private readonly List<IDomainEvent> _domainEvents = [];

    public Guid Id { get; private set; }
    public decimal Amount { get; private set; }
    public string Status { get; private set; } = "Pending";

    public IReadOnlyCollection<IDomainEvent> DomainEvents =>
        _domainEvents.AsReadOnly();

    public void Complete()
    {
        if (Status != "Pending")
            throw new InvalidOperationException("Only a pending payment can complete.");

        Status = "Completed";
        _domainEvents.Add(
            new PaymentCompleted(Id, Amount, DateTimeOffset.UtcNow));
    }

    public void ClearDomainEvents() => _domainEvents.Clear();
}

public sealed class CreateReceiptHandler
{
    public Task Handle(PaymentCompleted domainEvent, CancellationToken cancellationToken)
    {
        // Create a receipt or add reliable follow-up work to an outbox.
        return Task.CompletedTask;
    }
}
```

`Payment.Complete` protects the business rule, changes the aggregate state, and records the business fact. It does not call the receipt handler directly. Application infrastructure can collect the event around `SaveChangesAsync`, dispatch it at the transaction boundary chosen by the team, and clear it only when appropriate.

The example uses C# collection expressions (`[]`), available in C# 12 and later. On older language versions, use `new List<IDomainEvent>()` instead.

## 7. Common mistakes

- Raising events for technical details instead of meaningful business facts.
- Naming an event like a command, such as `CompletePayment`, rather than a past-tense fact such as `PaymentCompleted`.
- Putting mutable entities, services, or large object graphs inside the event. Prefer a small immutable snapshot of relevant values.
- Using handlers to bypass aggregate rules or hiding the main business workflow across too many handlers.
- Publishing to a message broker before the database commit and creating an event for a transaction that later fails.
- Assuming delivery is exactly once. Retries and duplicate messages require idempotent handlers.
- Treating domain events and integration events as the same thing and accidentally exposing an internal domain model as a public contract.
- Running slow network calls inside the business transaction without considering locks, timeouts, and rollback behavior.

## 8. Follow-up interview questions

### What is the difference between a domain event and an integration event?

A domain event represents a business fact inside a domain or bounded context and is often handled in-process. An integration event is a stable message contract used to notify other services or bounded contexts.

### Should domain events be dispatched before or after saving changes?

Either can be valid. Before commit allows local handlers to participate in the same transaction. After commit avoids reacting to rolled-back data, but reliable follow-up work needs retries or an outbox. The transaction boundary must be explicit.

### Why should handlers be idempotent?

Reliable systems may retry event delivery, so the same event can be handled more than once. An idempotent handler produces the same final result without creating duplicate receipts, notifications, or financial entries.
