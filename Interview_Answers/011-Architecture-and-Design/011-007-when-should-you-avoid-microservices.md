# 7. When should you avoid microservices?

**Technology:** Architecture and Design

**Source question:** 7. When should you avoid microservices?

## 1. What is it?

You should avoid microservices when the cost of running a distributed system is greater than the business benefit.

Microservices add separate deployments, network calls, message handling, distributed monitoring, data consistency problems, and more production support. If a system is small, its business boundaries are unclear, or one small team changes most features together, a modular monolith is usually a better choice.

Avoiding microservices does not mean creating one badly structured application. A modular monolith can still have clear modules, private data access, well-defined interfaces, and good test coverage while being deployed as one unit.

## 2. Why is it important?

Choosing microservices too early can slow delivery instead of improving it. Developers spend time managing infrastructure and service communication rather than delivering business features.

You should normally avoid microservices when:

- The product is new and its business boundaries are still changing.
- One small team owns the whole system.
- The application has low or predictable traffic.
- Most changes require several parts of the system to be updated together.
- The business needs strong transactions across many areas.
- The team lacks automated deployment, monitoring, tracing, and production support.
- Independent scaling and deployment do not provide clear business value.

This decision matters because moving from a monolith to selected services later is possible. Removing dozens of poorly designed services is often much harder.

## 3. How does it work?

Before choosing microservices, compare the expected benefits with the operational cost.

A practical decision flow is:

1. Identify the business capabilities and how often they change together.
2. Check whether different teams genuinely need independent ownership and deployment.
3. Measure whether parts of the system need different scaling or availability.
4. Review transaction requirements. A local database transaction is much simpler than coordinating data across services.
5. Assess operational readiness, including CI/CD, logs, metrics, tracing, alerting, security, and on-call support.
6. If the benefits are weak or the boundaries are uncertain, build a modular monolith.
7. Keep module boundaries clear so a module can be extracted later if there is a proven need.

The default should not be “microservices because the system may grow.” The decision should be based on current evidence and realistic near-term needs.

## 4. Practical example

Consider a new payment reconciliation product owned by six developers. Its rules are changing every week, transaction volume is modest, and most features touch payment imports, matching, adjustments, and reporting together.

Splitting these areas into separate services would introduce API versioning, message delivery, eventual consistency, distributed tests, and several deployment pipelines. It would also make one business change span multiple repositories and releases.

A modular monolith is a better fit. The application can contain separate Import, Reconciliation, Adjustment, and Reporting modules, but use one deployment and one database. Each module controls its own code and tables. A database transaction can safely update a reconciliation and its adjustment together.

If reporting later creates heavy load or needs an independent release cycle, that proven boundary can be extracted into a service. The team pays the distributed-system cost only when the benefit is real.

## 5. Scenario-based interview answer

“On a banking project, the initial proposal was to create microservices for customer accounts, limits, fees, notifications, and audit history. The product was new, one team owned it, and the workflows were changing frequently. Almost every feature would have required coordinated changes across several proposed services.

I recommended that we avoid microservices at that stage. The main problem was not independent scaling or deployment; it was learning the domain and delivering the first release safely. Distributed transactions and network failure handling would have added risk without solving a real business problem.

We implemented a modular monolith in ASP.NET Core. Each business module had its own application logic and data access, and other modules could not directly use its internal classes. We used module interfaces and in-process events, kept database ownership clear, and added architecture tests to protect the boundaries. We also recorded extraction criteria, such as a module needing independent scaling, availability, team ownership, or release frequency.

The result was a simpler deployment, reliable local transactions, and faster delivery. We still had a path to microservices because the boundaries were explicit. My view is that microservices should be introduced to solve measured organizational or operational problems, not as a default starting architecture.”

## 6. Code example

This example shows a simple module contract inside an ASP.NET Core modular monolith. The endpoint uses the contract and does not access another module's database tables directly.

```csharp
public interface IPaymentModule
{
    Task<PaymentResult> CreateAsync(
        CreatePayment command,
        CancellationToken cancellationToken);
}

internal sealed class PaymentModule(PaymentsDbContext db) : IPaymentModule
{
    public async Task<PaymentResult> CreateAsync(
        CreatePayment command,
        CancellationToken cancellationToken)
    {
        var payment = Payment.Create(command.AccountId, command.Amount);

        db.Payments.Add(payment);
        await db.SaveChangesAsync(cancellationToken);

        return new PaymentResult(payment.Id, payment.Status);
    }
}

app.MapPost("/payments", async (
    CreatePayment command,
    IPaymentModule payments,
    CancellationToken cancellationToken) =>
{
    var result = await payments.CreateAsync(command, cancellationToken);
    return Results.Created($"/payments/{result.Id}", result);
});
```

`PaymentModule` is internal, so its implementation stays hidden. Other modules use `IPaymentModule` rather than reaching into payment internals. This gives clear boundaries without a network call, message broker, separate deployment, or distributed tracing. If Payments later needs to become a service, the contract provides a useful starting point, although it will still need a proper remote API and failure handling.

## 7. Common mistakes

- Assuming microservices are required because an application may become large.
- Splitting the system before understanding the business domain and transaction boundaries.
- Creating many very small services that must always be changed and deployed together.
- Using microservices with one small team and gaining no real ownership independence.
- Ignoring the cost of network failures, retries, timeouts, idempotency, and eventual consistency.
- Sharing one database across services and allowing every service to update the same tables.
- Starting without automated deployments, centralized logs, metrics, traces, alerts, and on-call ownership.
- Treating a modular monolith as permission to create tightly coupled code with no module boundaries.
- Choosing microservices mainly because they are popular or attractive on a CV.

## 8. Follow-up interview questions

### Is a monolith always easier than microservices?

It is operationally simpler at the start, but a poorly structured monolith can become difficult to change. A modular monolith keeps strong internal boundaries while retaining one deployment and simpler transactions.

### When should you reconsider the decision and extract a service?

Reconsider it when a module has a stable business boundary and a proven need for independent deployment, scaling, availability, security, or team ownership. Extract one justified capability at a time rather than splitting everything.

### Can a large system remain a modular monolith?

Yes. Size alone does not require microservices. If modules remain well separated and the deployment, scaling, reliability, and team model still work, a modular monolith can remain the better architecture.
