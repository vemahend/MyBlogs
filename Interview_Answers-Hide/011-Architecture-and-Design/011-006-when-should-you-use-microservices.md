# 6. When should you use microservices?

**Technology:** Architecture and Design

**Source question:** 6. When should you use microservices?

## 1. What is it?

Microservices are an architectural style where a system is split into small, independently deployable services. Each service owns a clear business capability, such as payments, customer accounts, or fraud checks. It usually owns its data as well and communicates with other services through APIs or messages.

You should use microservices when the business and engineering benefits of independent services are greater than the extra operational complexity. They are not automatically the right choice for every large application. A well-structured modular monolith is often a better starting point.

## 2. Why is it important?

Microservices can solve problems that appear when a large system and a large team must change, deploy, and scale different business areas independently.

They are useful when:

- Different parts of the system change at different speeds.
- Multiple teams need clear ownership and independent release cycles.
- One business capability needs much more scaling than the rest.
- Some areas require different availability, security, or technology choices.
- Strong business boundaries already exist and can be owned independently.

The trade-off is significant. Microservices add network failures, distributed data, eventual consistency, monitoring, deployment, security, and testing challenges. If a small team owns a simple product, these costs often outweigh the benefits.

## 3. How does it work?

The system is divided around business capabilities, not technical layers. For example, a payment service contains its own API, business rules, and database instead of sharing payment tables with every other service.

A typical flow is:

1. A client or API gateway sends a request to the appropriate service.
2. That service validates the request and updates the data it owns.
3. It may call another service for an immediate answer, or publish an event for work that can happen asynchronously.
4. Other services react without directly changing the first service's database.
5. Logs, metrics, traces, retries, timeouts, and deployment automation help operate the complete workflow.

Good service boundaries normally follow business domains and team ownership. Services should be loosely coupled and highly cohesive. If every change requires coordinated deployments across many services, the boundaries are probably wrong.

## 4. Practical example

Consider a banking platform with customer onboarding, accounts, payments, notifications, and fraud detection.

Payment traffic may be high and must remain available even when notifications are delayed. The payments team may also need to release regulatory changes without redeploying the entire platform. In that case, separating Payments, Fraud Detection, and Notifications can be valuable.

The Payments service owns payment records and publishes a `PaymentCompleted` event. The Notifications service consumes that event and sends a receipt. If Notifications is temporarily unavailable, the payment can still complete and the event can be retried later. Each service can be deployed and scaled independently.

For a small internal banking tool used by one team with low traffic, I would probably use a modular monolith instead. It gives clear module boundaries without the cost of a distributed system.

## 5. Scenario-based interview answer

“In one payment platform, our single application had grown to several teams. Payment processing had strict availability and scaling requirements, while reporting changed less often and ran heavy queries. Releases became risky because an unrelated reporting change required deploying the whole application.

I did not split everything into microservices. We first reviewed the business domains, deployment pain, transaction boundaries, traffic, and team ownership. We decided to extract payment processing because it had a clear boundary, its own scaling needs, and a dedicated team. Reporting remained in the existing application initially.

We gave the Payments service ownership of its database, exposed a versioned API, and published payment events through a message broker. We used an outbox pattern so a committed payment and its event could not get out of sync. We also added idempotent consumers, timeouts, distributed tracing, health checks, and automated deployments.

As a result, the payments team could release and scale independently, and reporting failures no longer affected payment completion. The key decision was based on business and operational needs, not on system size or a desire to use a fashionable architecture.”

## 6. Code example

The following .NET 10 example shows a small endpoint that records a payment and an outbox event in one database transaction. A background worker can later publish the event reliably.

```csharp
app.MapPost("/payments", async (
    CreatePayment request,
    PaymentsDbContext db,
    CancellationToken cancellationToken) =>
{
    var payment = Payment.Create(request.AccountId, request.Amount);

    var outboxMessage = new OutboxMessage(
        Guid.NewGuid(),
        "PaymentCompleted",
        JsonSerializer.Serialize(new
        {
            payment.Id,
            payment.AccountId,
            payment.Amount
        }),
        DateTimeOffset.UtcNow);

    db.Payments.Add(payment);
    db.OutboxMessages.Add(outboxMessage);
    await db.SaveChangesAsync(cancellationToken);

    return Results.Accepted($"/payments/{payment.Id}", new { payment.Id });
});
```

Both records are saved by the same `DbContext` call and therefore use the same database transaction by default. The API does not publish directly to the broker before committing the payment. An outbox worker publishes pending messages and marks them as processed. Consumers must still be idempotent because message delivery can happen more than once.

This pattern supports a microservice boundary, but the code alone does not justify using microservices. Team independence, business boundaries, scaling, reliability, and operational maturity should drive that decision.

## 7. Common mistakes

- Splitting a new or simple system into many services before understanding its business boundaries.
- Creating services around technical layers, such as one service for controllers and another for data access.
- Sharing one database schema across services, which removes data ownership and creates tight coupling.
- Making long chains of synchronous calls, so one slow service affects the whole request.
- Assuming a distributed transaction will work like a local database transaction.
- Ignoring idempotency, retries, timeouts, circuit breaking, and eventual consistency.
- Creating services that are too small, sometimes called “nano-services,” with little business value.
- Adopting microservices without automated deployment, centralized logs, metrics, traces, and production support.
- Splitting services but keeping one team and one coordinated release process, gaining complexity without independence.

## 8. Follow-up interview questions

### What are signs that a modular monolith is a better choice?

A small team, unclear domain boundaries, modest scaling needs, and frequent cross-module transactions are strong signs. A modular monolith is simpler to develop, test, deploy, and operate while still keeping code boundaries clear.

### How do you choose a microservice boundary?

Start with a business capability, its language, data ownership, transaction boundary, rate of change, and owning team. A good boundary lets the service change independently with limited knowledge of other services.

### Should every microservice have its own database?

Each service should own its data and prevent other services from reading or writing its tables directly. Services may use the same database technology or infrastructure, but ownership and schema access must remain separate. Data needed elsewhere should be shared through APIs or events.
