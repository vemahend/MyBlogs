# 2. What makes an architecture good?

**Technology:** Architecture and Design

**Source question:** 2. What makes an architecture good?

## 1. What is it?

A good architecture helps a system meet its business goals and important quality needs without adding unnecessary complexity.

It should make the system:

- Easy to understand and change.
- Reliable and secure.
- Testable and observable.
- Able to handle the expected traffic and failures.
- Affordable for the team to build and operate.

There is no single architecture that is good for every system. A simple modular monolith may be right for one product, while independently deployed services may be right for another. The design is good when it fits the current context and can adapt to likely changes.

Good architecture is not measured by the number of patterns, layers, or technologies it uses. It is measured by how well it supports the business and the people maintaining the system.

## 2. Why is it important?

Software changes continuously. Business rules change, traffic grows, security threats appear, dependencies fail, and team members join or leave. Poor architecture makes every change slower and riskier because responsibilities are unclear and components are tightly connected.

Good architecture helps teams:

- Deliver business changes without modifying unrelated code.
- Contain failures so one non-critical component does not stop the whole system.
- Protect sensitive data through clear security boundaries.
- Test business rules independently from databases and external services.
- Diagnose production issues with logs, metrics, and traces.
- Scale the specific parts that need more capacity.
- Make informed trade-offs between delivery speed, reliability, cost, and complexity.

For a senior developer or architect, the important skill is not selecting a fashionable pattern. It is understanding the constraints, making a suitable decision, and showing evidence that the decision works.

## 3. How does it work?

A team normally creates and maintains a good architecture through these steps:

1. **Understand the business goals.** Identify the most important workflows and the cost of failure.
2. **Define measurable quality requirements.** For example, a payment API may require 99.95% availability, a two-second response target, a complete audit trail, and no duplicate payment for the same idempotency key.
3. **Identify constraints.** Consider regulations, budget, existing systems, delivery deadlines, team skills, and expected traffic.
4. **Create clear boundaries.** Give each module or service a focused responsibility and clear ownership of its data.
5. **Choose the simplest suitable design.** Add distributed components only when their benefits justify their operational cost.
6. **Design for failure and security.** Use validation, authorization, timeouts, idempotency, safe retries, transactions, and graceful degradation where needed.
7. **Build in operability.** Add structured logging, metrics, tracing, health checks, alerts, and safe deployment and rollback methods.
8. **Validate and evolve.** Use automated tests, load tests, failure tests, production measurements, and team feedback. Record important trade-offs in Architecture Decision Records (ADRs).

Some qualities compete with each other. Strong consistency can reduce availability during a network problem, and more services can improve independent deployment while increasing operational complexity. A good architecture makes these trade-offs explicit instead of pretending they do not exist.

## 4. Practical example

Consider a bank payment platform. Customers can submit a payment, and a separate process sends notifications.

A suitable architecture could use a payment module that owns payment rules and data. The API requires an idempotency key and enforces a unique database constraint on it. The payment record and an outbox message are saved in one transaction. A background worker later publishes the message, and a notification component consumes it.

This design supports the important qualities:

- **Correctness:** The transaction keeps the payment and outbox record consistent.
- **Reliability:** A client retry cannot create the same payment twice.
- **Failure isolation:** A notification outage does not undo a successful payment.
- **Maintainability:** Payment rules remain inside the payment module.
- **Observability:** A correlation identifier connects API, database, and messaging logs.
- **Scalability:** Workers can scale separately if the message backlog grows.

The team could begin with these parts inside a modular monolith. It should extract services only when there is a measured need for independent deployment, scaling, ownership, or fault isolation.

## 5. Scenario-based interview answer

**Scenario:** A bank's payment system has grown into a tightly coupled application. Small changes require a full release, notification failures affect payment requests, and retries sometimes create duplicate payments.

**Natural interview answer:**

“I judge architecture by how well it meets business and quality requirements, not by whether it uses a particular pattern.

The problem in this system was unclear ownership and failure coupling. A payment, audit entry, and notification were handled in one synchronous flow, and duplicate handling depended only on an application check.

I decided to create a clear payment boundary and keep it in a modular monolith initially because the team did not need the cost of multiple deployments. We made the payment operation idempotent with a client key and a unique database constraint. We stored the payment and an outbox event in one transaction, then processed notifications asynchronously. We also added authorization policies, structured logs, traces, service-level metrics, and alerts. We recorded the main decisions and trade-offs in ADRs.

The result was that notification failures no longer failed payments, duplicate retries were handled safely, and payment changes became easier to test and release. We tracked duplicate-payment incidents, failure rate, latency, and deployment lead time to confirm the design was improving the system. If a module later needs independent scaling or ownership, we have a clear boundary from which to extract it.”

## 6. Code example

This simplified example shows two useful architectural qualities: business-level idempotency and dependency boundaries.

```csharp
public sealed record CreatePayment(
    Guid AccountId,
    decimal Amount,
    string IdempotencyKey);

public interface IPaymentStore
{
    Task<Payment?> FindByIdempotencyKeyAsync(
        string key,
        CancellationToken cancellationToken);

    Task AddPaymentAndOutboxMessageAsync(
        Payment payment,
        OutboxMessage message,
        CancellationToken cancellationToken);
}

public sealed class CreatePaymentHandler(IPaymentStore store)
{
    public async Task<Guid> HandleAsync(
        CreatePayment command,
        CancellationToken cancellationToken)
    {
        if (command.Amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(command.Amount));

        var existing = await store.FindByIdempotencyKeyAsync(
            command.IdempotencyKey, cancellationToken);

        if (existing is not null)
            return existing.Id;

        var payment = Payment.Create(
            command.AccountId,
            command.Amount,
            command.IdempotencyKey);

        var message = OutboxMessage.For(
            new PaymentCreated(payment.Id, payment.AccountId, payment.Amount));

        await store.AddPaymentAndOutboxMessageAsync(
            payment, message, cancellationToken);

        return payment.Id;
    }
}
```

`CreatePaymentHandler` coordinates the use case but does not depend directly on Entity Framework Core, SQL Server, or a message broker. The store implementation should save the payment and outbox message in one database transaction. It should also enforce a unique constraint on `IdempotencyKey`; the earlier lookup alone is not safe when two requests arrive at the same time.

The code does not prove that the whole architecture is good. It shows how architectural goals become enforceable implementation rules. Integration tests, load tests, production metrics, security reviews, and operational results are also needed.

## 7. Common mistakes

- Calling an architecture good because it uses microservices, clean architecture, CQRS, or another popular pattern.
- Designing for imagined future scale instead of measured business needs.
- Writing quality goals such as “fast” or “highly available” without measurable targets.
- Adding layers and interfaces that do not protect a real boundary or improve testing.
- Ignoring data ownership, transactions, idempotency, retries, and partial failures.
- Treating security, monitoring, deployment, and recovery as work to add later.
- Sharing databases between services and then claiming the services are independent.
- Optimizing only runtime performance while ignoring delivery speed and operating cost.
- Creating architecture diagrams that do not match the code or deployment environment.
- Keeping an old decision after its assumptions have changed.

## 8. Follow-up interview questions

### How do you measure whether an architecture is good?

Use measures connected to its goals. Examples include availability, latency, error rate, recovery time, security findings, deployment frequency, lead time, change failure rate, infrastructure cost, and the time needed to make a common business change. The correct measures depend on the system.

### Can a good architecture become bad over time?

Yes. Business needs, traffic, team structure, regulations, and technology can change. Architecture should be reviewed using production evidence and evolved in small, controlled steps rather than treated as permanent.

### Does good architecture always require microservices?

No. A modular monolith is often simpler to develop, test, deploy, and keep transactionally consistent. Microservices are useful when there is a real need for independent deployment, scaling, ownership, or fault isolation and the team can manage the extra distributed-system complexity.
