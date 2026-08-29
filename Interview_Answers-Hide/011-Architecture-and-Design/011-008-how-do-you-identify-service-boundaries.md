# 8. How do you identify service boundaries?

**Technology:** Architecture and Design

**Source question:** 8. How do you identify service boundaries?

## 1. What is it?

A service boundary defines what a service owns and what it is responsible for. This normally includes a business capability, its rules, its data, and the operations it exposes to other parts of the system.

For example, a Payment service may own payment attempts, payment status, provider references, and refund rules. An Order service may need to know that a payment succeeded, but it should not update the Payment service's tables.

Good boundaries usually follow the business domain, not technical layers such as controllers, database access, or logging. The goal is high cohesion inside a service and low coupling between services: related behavior stays together, while services depend on each other through small, stable contracts.

## 2. Why is it important?

Service boundaries decide whether a distributed system can change safely. A good boundary allows a team to develop, deploy, scale, and support a service with limited coordination with other teams.

Poor boundaries cause practical problems:

- One business change requires several services to be changed and released together.
- Services constantly call each other to complete simple work.
- Several services update the same database tables.
- Transactions cross service boundaries and become difficult to keep consistent.
- Ownership is unclear when production failures occur.
- Small network or deployment failures can break a tightly coupled workflow.

Architects need to find boundaries before splitting an application. If the domain is not understood well enough, a modular monolith is often safer until the boundaries become clearer.

## 3. How does it work?

I identify boundaries by studying business behavior and change patterns rather than starting from a list of entities.

1. **Map business capabilities.** Speak with domain experts and describe what the business does, such as onboarding customers, assessing risk, taking payments, and sending notifications.
2. **Model business language and rules.** Use domain-driven design techniques such as event storming to find groups of rules that use the same language. These groups often suggest bounded contexts.
3. **Follow data ownership.** Decide which capability is the source of truth for each piece of data. A service should own its data and expose a contract instead of allowing another service to change its tables.
4. **Find consistency boundaries.** Rules that must succeed or fail in one database transaction usually belong together. Operations that can tolerate a delay can often communicate through events across a boundary.
5. **Study change coupling.** Review past and expected changes. If two proposed services nearly always change and deploy together, the split may be wrong or too fine-grained.
6. **Consider team and operational needs.** Independent ownership, release frequency, scaling, availability, security, and regulatory requirements can strengthen or adjust a business boundary.
7. **Define contracts.** Give each service a clear responsibility, API or event contracts, and explicit failure behavior. Other services should depend on those contracts, not its internal model.
8. **Validate with real workflows.** Walk through normal and failure scenarios. Count cross-service calls and check where retries, compensation, eventual consistency, and support ownership are required.

Boundaries are hypotheses that should be tested. I prefer a slightly larger cohesive service over many small services that behave like a distributed monolith.

## 4. Practical example

Consider an online banking payment flow. A customer creates a payment, the bank checks limits, sends the instruction to a payment network, and notifies the customer.

Possible boundaries are:

- **Payments** owns the payment instruction, status, idempotency key, and submission rules.
- **Accounts** owns accounts and available balances.
- **Fraud and Limits** owns risk decisions and limit policies.
- **Notifications** owns templates, delivery preferences, and delivery attempts.

The Payments service requests the required account or risk decision through a defined contract. When the payment status changes, it publishes a `PaymentCompleted` event. Notifications consumes that event and sends a message. Payments does not wait for the email or update notification tables, because notification delivery is not part of the payment transaction.

The payment record and its status transition stay together because their rules require strong consistency. Notification delivery is a separate boundary because it has different rules, scaling needs, and failure handling, and a short delay is acceptable.

## 5. Scenario-based interview answer

“In one payment platform, the proposed design had separate services for payment validation, payment creation, payment status, and refunds. The problem was that a normal payment change touched most of them, they shared the same database, and a single request required several synchronous calls. It was a distributed monolith rather than a set of independent services.

I ran event-storming sessions with product owners, operations, and developers. We mapped business commands, events, rules, data ownership, and transaction needs. The exercise showed that payment creation and status transitions used the same language, data, and invariants, so I kept them in one Payments boundary. Refunds had different permissions and workflows, but they still depended strongly on the payment lifecycle, so we initially kept refunds in the same service as a separate module. Notifications became a separate service because it could react asynchronously and had independent delivery and scaling concerns.

We gave Payments ownership of its database, exposed a small API for commands, and published versioned integration events through a message broker. Consumers stored only the payment information they needed, and we used an outbox plus idempotent consumers so database changes and event publishing were reliable. We documented ownership and contract expectations and tracked how often changes crossed boundaries.

The result was fewer network calls, simpler payment consistency, and releases that no longer required several teams to coordinate. My main principle is that a boundary should follow cohesive business rules and data ownership, then be validated against transactions, change patterns, team ownership, and operational needs.”

## 6. Code example

This simplified C# example shows communication across a boundary using an integration event. Payments publishes a fact; Notifications does not access the Payments database.

```csharp
public sealed record PaymentCompleted(
    Guid EventId,
    Guid PaymentId,
    Guid CustomerId,
    decimal Amount,
    string Currency,
    DateTimeOffset CompletedAtUtc);

// This handler belongs to the Notifications service.
public sealed class PaymentCompletedHandler(
    INotificationSender sender,
    IProcessedMessageStore processedMessages)
{
    public async Task HandleAsync(
        PaymentCompleted message,
        CancellationToken cancellationToken)
    {
        if (await processedMessages.ExistsAsync(
                message.EventId, cancellationToken))
        {
            return;
        }

        await sender.SendPaymentConfirmationAsync(
            message.CustomerId,
            message.PaymentId,
            message.Amount,
            message.Currency,
            cancellationToken);

        await processedMessages.MarkAsProcessedAsync(
            message.EventId, cancellationToken);
    }
}
```

`PaymentCompleted` is a small public contract, not the Payment service's internal entity. Notifications owns its delivery logic and storage. The processed-message check makes the consumer idempotent because message brokers can deliver an event more than once. In production, marking the event as processed and recording the notification work should be atomic, commonly through a local transaction or an inbox pattern.

The Payments service should use an outbox pattern to save its state change and outgoing event in the same local transaction. A background publisher then sends the event. This keeps each service responsible for only its own transaction and data.

## 7. Common mistakes

- Creating one service for every database table or domain entity.
- Splitting by technical layers, such as separate API, business logic, and data services.
- Making services so small that a normal request requires a long chain of synchronous calls.
- Sharing a database and allowing several services to update the same tables.
- Ignoring business invariants and then needing distributed transactions for normal operations.
- Copying the complete internal domain model into integration events.
- Treating eventual consistency as acceptable without discussing it with the business.
- Choosing boundaries only from an organization chart; team structures and business ownership can change.
- Ignoring failure handling, timeouts, retries, idempotency, observability, and contract versioning.
- Assuming the first boundary design is permanent instead of measuring cross-service changes and refining it.
- Starting with microservices when the domain is still unclear; a modular monolith can reveal better boundaries with less risk.

## 8. Follow-up interview questions

### Is a bounded context always a microservice?

No. A bounded context is a domain and language boundary. It can be implemented as a module inside a monolith or as one or more deployable services. Deployment boundaries should be chosen for clear operational or organizational reasons.

### How do you know that a service is too small?

It is probably too small when it cannot complete meaningful business work independently, frequently calls other services, or must be changed and deployed with them. That usually shows low cohesion or an artificial split.

### How do services share data without sharing a database?

The owning service exposes an API for current information or publishes integration events that other services use to build local read models. The right choice depends on freshness, availability, and consistency needs.
