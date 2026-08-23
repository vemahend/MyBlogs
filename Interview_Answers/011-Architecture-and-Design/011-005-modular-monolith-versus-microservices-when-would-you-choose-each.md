# 5. Modular monolith versus microservices: when would you choose each?

**Technology:** Architecture and Design

**Source question:** 5. Modular monolith versus microservices: when would you choose each?

## 1. What is it?

A **modular monolith** is one deployable application divided into clear business modules, such as Accounts, Payments, and Notifications. The modules run in the same process, but each module owns its business rules and data access. Other modules use its public interface rather than reaching into its internal code.

**Microservices** split the system into several independently deployable services. Each service normally owns one business capability and its data. Services communicate through network APIs or messages.

Neither style is automatically better. I usually choose the simplest architecture that meets the system's real needs:

- Choose a modular monolith when the domain or team boundaries are still changing, the system can be deployed as one unit, and independent scaling is not required.
- Choose microservices when there are proven needs for independent deployment, team ownership, fault isolation, different scaling patterns, or different technology choices.

## 2. Why is it important?

This choice affects development speed, reliability, deployment, testing, cost, and team structure.

A modular monolith keeps operations simple. Calls are local, transactions are easier, debugging is straightforward, and one deployment pipeline may be enough. It still prevents a "big ball of mud" when module boundaries are enforced.

Microservices give teams more independence and let busy parts scale separately. They can also isolate some failures. However, they add network failures, message delivery concerns, distributed tracing, eventual consistency, service versioning, more infrastructure, and higher support cost.

Architects should make this decision from measurable constraints, not fashion. Starting with too many services can slow a small team. Keeping one deployment forever can also become a bottleneck when many teams and workloads grow independently.

## 3. How does it work?

In a modular monolith:

1. The application is deployed as one unit and usually runs as one process.
2. Each module exposes a small public contract.
3. Internal classes are hidden from other modules.
4. A module owns its business logic and database access. It may use its own schema or tables even when modules share one physical database.
5. Cross-module work uses method calls or in-process events. A single database transaction is possible when strong consistency is needed.
6. Automated architecture tests and code reviews prevent modules from bypassing boundaries.

In microservices:

1. Each service is built and deployed independently.
2. Each service owns its data; another service must not directly update its database.
3. Synchronous work uses HTTP or gRPC. Asynchronous work uses a broker such as Azure Service Bus.
4. A business flow across services normally uses eventual consistency, idempotent consumers, retries, and patterns such as an outbox or saga.
5. Logs, metrics, traces, health checks, security, and deployment automation are required across all services.

Migration does not need to be all-or-nothing. A well-structured module can later be extracted behind the same contract when there is evidence that it needs independent deployment or scaling.

## 4. Practical example

Consider a payment platform with Payments, Fraud Checks, Settlements, and Notifications.

For a new product maintained by one team, I would begin with a modular monolith. Each area would be a separate module, and Payments would call Fraud through an interface. Payment authorization and its local audit record could commit in one transaction. This gives fast delivery and simple production support while business rules are changing.

Suppose transaction volume later grows sharply and fraud models require CPU-heavy processing and frequent releases by a separate team. I would consider extracting Fraud as a microservice. Payments could send a fraud-check request through a reliable message or call a carefully designed API, depending on the latency requirement. The remaining modules could stay in the monolith. This avoids splitting stable areas without a business reason.

## 5. Scenario-based interview answer

**Problem:** "In one payment system, six developers were building a new product. Requirements and domain boundaries changed frequently, but stakeholders suggested microservices from day one."

**Decision:** "I chose a modular monolith because we did not need independent deployments or different scaling yet. Microservices would have introduced distributed transactions, network failure handling, and several pipelines before those costs delivered value."

**Implementation:** "We separated Payments, Customers, Reconciliation, and Notifications into modules. Each module owned its rules and tables, exposed interfaces, and could not reference another module's internal types. We used in-process domain events and an outbox for events sent to external systems. We also added architecture tests to enforce dependencies."

**Result:** "The team released quickly and could debug a payment flow in one process. Later, Notifications developed a different scaling pattern, so we extracted that module into a service without redesigning the whole application. I would choose microservices earlier only if independent team delivery, isolation, or scaling were already proven requirements."

## 6. Code example

The following simplified .NET example shows a module exposing a small contract while keeping its implementation internal:

```csharp
// Payments.Contracts
public sealed record AuthorizePaymentCommand(
    Guid PaymentId,
    decimal Amount,
    string Currency);

public sealed record AuthorizationResult(bool Approved, string? Reason);

public interface IPaymentsModule
{
    Task<AuthorizationResult> AuthorizeAsync(
        AuthorizePaymentCommand command,
        CancellationToken cancellationToken);
}

// Payments module implementation
internal sealed class PaymentsModule(
    PaymentsDbContext dbContext,
    IFraudPolicy fraudPolicy) : IPaymentsModule
{
    public async Task<AuthorizationResult> AuthorizeAsync(
        AuthorizePaymentCommand command,
        CancellationToken cancellationToken)
    {
        if (command.Amount <= 0)
            return new(false, "Amount must be positive.");

        if (!await fraudPolicy.IsAllowedAsync(command, cancellationToken))
            return new(false, "Payment failed a fraud check.");

        dbContext.Payments.Add(new Payment(
            command.PaymentId,
            command.Amount,
            command.Currency));

        await dbContext.SaveChangesAsync(cancellationToken);
        return new(true, null);
    }
}

// Composition root in Program.cs
builder.Services.AddScoped<IPaymentsModule, PaymentsModule>();
```

Other modules depend only on `IPaymentsModule` and the contract records. `PaymentsModule`, `PaymentsDbContext`, and the domain model remain internal. This makes the boundary clear while calls remain local. If Payments is later extracted, the contract can be implemented by an HTTP, gRPC, or messaging adapter, although network failure and consistency handling must then be added.

For a real modular monolith, I would normally place contracts and implementations in separate projects, control project references, and add architecture tests. The example uses the standard dependency-injection and Entity Framework Core patterns supported by current .NET versions.

## 7. Common mistakes

- Calling an application "modular" while every module can access every table and internal class.
- Creating microservices only because they are popular, without a deployment, ownership, scaling, or isolation need.
- Making services too small. A service should represent a cohesive business capability, not simply one entity or controller.
- Sharing one database and allowing several services to update the same tables. This removes service autonomy and creates hidden coupling.
- Treating remote calls like local method calls. Networks introduce latency, timeouts, partial failure, retries, and duplicate requests.
- Using distributed transactions as the default. Prefer clear ownership and explicit eventual-consistency workflows where appropriate.
- Ignoring operational cost: monitoring, tracing, security, versioning, deployments, on-call support, and message-broker management.
- Splitting code before understanding the domain. Poor boundaries become harder and more expensive to change once they cross a network.
- Assuming a modular monolith cannot scale. The whole application can often scale horizontally; extraction is needed only when parts require meaningfully different treatment.

## 8. Follow-up interview questions

### How do you keep a modular monolith from becoming tightly coupled?

Give each module clear ownership, expose only contracts, block invalid project references, avoid cross-module table access, and enforce the rules with architecture tests and code reviews.

### What signs suggest extracting a module into a microservice?

Useful signs include a separate team needing independent releases, a workload with very different scaling, a strong fault-isolation requirement, or deployment coordination that repeatedly slows delivery. Use production evidence rather than expected future growth alone.

### Can microservices use one shared database?

They can share a database server, but each service should own its schema or data and prevent other services from directly changing it. Shared writable tables create tight coupling and make independent deployment unsafe.
