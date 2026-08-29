# 14. Domain event versus integration event?

**Technology:** Architecture and Design

**Source question:** 14. Domain event versus integration event?

## 1. What is it?

A **domain event** describes something important that happened inside a business domain, such as `PaymentApproved`. It is normally handled inside the same application or bounded context. It helps domain objects communicate without being tightly connected.

An **integration event** is a message published for another application or bounded context, such as `PaymentCompletedV1`. It is an external contract, so it must be stable, serializable, and safe for other teams or services to consume.

They may describe the same business occurrence, but they have different purposes. A domain event represents the domain model; an integration event represents a public message contract. A domain event should not automatically be exposed as an integration event.

## 2. Why is it important?

The distinction protects service boundaries.

- Domain events keep business workflows loosely coupled inside one service.
- Integration events let independent services exchange facts asynchronously.
- Separate models allow the domain to change without breaking external consumers.
- Integration events support distributed workflows without sharing databases or domain assemblies.

In a real system, treating an internal domain class as a public message contract creates accidental coupling. A harmless domain refactoring can then break several services in production.

## 3. How does it work?

A typical flow is:

1. An aggregate performs a valid business operation and records a domain event.
2. The application saves the aggregate in its local database transaction.
3. An in-process domain event handler performs local work or creates an integration message.
4. The integration message is stored in an **outbox** in the same database transaction as the business change.
5. A background publisher reads the outbox and sends the message to a broker such as Azure Service Bus, RabbitMQ, or Kafka.
6. Other services consume the message and update their own data.

This flow matters because saving data and publishing to a broker cannot normally be one atomic transaction. The outbox prevents the database update from succeeding while its message is lost. Delivery is commonly at least once, so consumers must be idempotent.

Domain event handlers may run before or after the database commit, depending on the design. The team must choose deliberately: handlers before commit can participate in the local transaction, while handlers after commit cannot roll back the original change.

## 4. Practical example

In a payment service, a `Payment` aggregate approves a card payment and records `PaymentApprovedDomainEvent`. A local handler may update payment history and translate that internal event into `PaymentCompletedV1`.

The public integration event contains only the fields consumers need: payment ID, order ID, amount, currency, and completion time. The order service consumes it to mark the order as paid, while the notification service uses it to send a receipt. Neither consumer needs the payment service's domain classes or database.

## 5. Scenario-based interview answer

“In one payment platform, payment completion updated our database correctly, but occasionally the broker publish failed. Orders then remained unpaid even though money had been captured.

I decided to separate the internal domain event from the external integration contract and use the transactional outbox pattern. The `Payment` aggregate raised a domain event after approval. The application mapped it to a versioned integration event and stored that event in an outbox row in the same SQL transaction as the payment update. A background worker published pending rows to the broker and retried failures. Consumers used the event ID for idempotency.

As a result, we removed the message-loss window, could evolve our domain model without breaking consumers, and made retries safe. I would still monitor outbox age, publish failures, dead-letter messages, and consumer lag because eventual consistency is now part of the design.”

## 6. Code example

```csharp
public sealed record PaymentApprovedDomainEvent(
    Guid PaymentId,
    Guid OrderId,
    decimal Amount,
    string Currency,
    DateTimeOffset ApprovedAt);

// Public message contract. Keep it independent from the domain assembly.
public sealed record PaymentCompletedV1(
    Guid EventId,
    Guid PaymentId,
    Guid OrderId,
    decimal Amount,
    string Currency,
    DateTimeOffset OccurredAt);

public sealed class Payment
{
    private readonly List<object> _domainEvents = [];

    public Guid Id { get; init; }
    public Guid OrderId { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "NZD";
    public bool IsApproved { get; private set; }

    public IReadOnlyCollection<object> DomainEvents => _domainEvents;

    public void Approve(DateTimeOffset approvedAt)
    {
        if (IsApproved)
            throw new InvalidOperationException("Payment is already approved.");

        IsApproved = true;
        _domainEvents.Add(new PaymentApprovedDomainEvent(
            Id, OrderId, Amount, Currency, approvedAt));
    }
}

public static class PaymentEventMapper
{
    public static PaymentCompletedV1 ToIntegrationEvent(
        PaymentApprovedDomainEvent domainEvent) =>
        new(
            Guid.NewGuid(),
            domainEvent.PaymentId,
            domainEvent.OrderId,
            domainEvent.Amount,
            domainEvent.Currency,
            domainEvent.ApprovedAt);
}
```

`PaymentApprovedDomainEvent` is an internal representation and can follow the domain model. `PaymentCompletedV1` is a separate, versioned external contract. The mapper is the boundary between them. In production, the application should serialize the integration event into an outbox record in the same transaction used to save `Payment`; it should not publish directly from the aggregate.

## 7. Common mistakes

- Publishing domain event classes directly to the message broker.
- Sharing the domain assembly between producer and consumer services.
- Publishing before the database commit, which can announce a change that later rolls back.
- Publishing after the commit without an outbox, which can lose messages if the process fails.
- Putting sensitive data or a complete domain entity into an integration event.
- Changing or removing fields in a published contract without a compatibility and versioning plan.
- Assuming exactly-once delivery and failing to make consumers idempotent.
- Using commands such as `ApprovePayment` as events. Events describe facts in the past tense; commands request an action.
- Ignoring ordering, retries, poison messages, dead-letter queues, tracing, and outbox monitoring.

## 8. Follow-up interview questions

### Can one domain event create more than one integration event?

Yes. A handler may map one internal business occurrence to different public contracts, but each event should have a clear purpose and only the data its consumers need.

### Should every domain event become an integration event?

No. Many domain events matter only inside their bounded context. Publish an integration event only when another service has a genuine business need for that fact.

### How do you handle changes to an integration event?

Prefer backward-compatible additions when possible. For a breaking change, introduce a new version, support old consumers during migration, and retire the old version only after verifying that nobody uses it.
