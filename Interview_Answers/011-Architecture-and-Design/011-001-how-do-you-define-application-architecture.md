# 1. How do you define application architecture?

**Technology:** Architecture and Design

**Source question:** 1. How do you define application architecture?

## 1. What is it?

Application architecture is the high-level structure of an application. It describes:

- The main parts of the system and their responsibilities.
- How those parts communicate.
- How data moves through the system.
- Which technologies and design patterns are used.
- How the application meets needs such as security, performance, reliability, and maintainability.

It is not only a diagram or a choice between monolith and microservices. It is a set of important design decisions and rules that guide how the application is built and changed.

For example, a .NET application might use an ASP.NET Core API, application services for use cases, domain classes for business rules, and infrastructure components for SQL Server and external services.

## 2. Why is it important?

Architecture gives a development team a shared direction. Without it, business logic can become mixed with database code, different modules can become tightly connected, and every change can affect unrelated areas.

Good architecture helps a team:

- Keep business rules separate from technical details.
- Make changes with less risk.
- Test important logic without calling a real database or external service.
- Protect sensitive operations with clear security boundaries.
- Scale only the parts that need more capacity.
- Recover from failures and monitor the system in production.
- Allow several teams to work without constantly blocking each other.

The goal is not to create the most complex design. The goal is to choose the simplest structure that meets the current requirements and can handle likely future change.

## 3. How does it work?

Architecture starts with requirements and constraints, not with a diagram. An architect normally considers the business workflows, expected load, security rules, availability target, delivery speed, team structure, budget, and existing systems.

The typical flow is:

1. Identify important use cases, such as making a payment or signing in.
2. Identify quality requirements, such as response time, auditability, security, and uptime.
3. Divide the application into components with clear responsibilities.
4. Define how components communicate, for example through method calls, HTTP APIs, or messages.
5. Define where data is owned and how consistency is handled.
6. Add cross-cutting concerns such as authentication, authorization, logging, tracing, validation, and error handling.
7. Record important decisions and their trade-offs in Architecture Decision Records (ADRs).
8. Validate risky decisions with small proofs of concept and production measurements.

In a layered .NET application, an HTTP request might flow like this:

`Endpoint -> Application use case -> Domain rules -> Repository or external service -> Response`

Dependencies should point toward stable business rules. The domain should not need to know whether data is stored in SQL Server, PostgreSQL, or another system. Infrastructure code implements interfaces defined closer to the business use case.

Architecture is also reviewed over time. A design that was suitable for a small product may need to change when traffic, team size, or business requirements change.

## 4. Practical example

Consider a payment application that transfers money between accounts.

The architecture could contain these parts:

- A Payment API receives and authenticates the request.
- An application service coordinates the transfer use case.
- The domain layer checks rules such as account status and payment limits.
- A database stores the payment and its current status.
- An outbox stores an event in the same database transaction as the payment.
- A background worker publishes the event to a message broker.
- Notification and reporting components consume the event independently.

The client sends an idempotency key so that retrying the same request does not create a second payment. The API returns a payment identifier, and the client can query its status. Audit logs and distributed tracing make the flow visible across components.

This architecture separates the core payment rules from transport, storage, and messaging details. It also handles retries and partial failures, which are normal in distributed systems.

## 5. Scenario-based interview answer

**Scenario:** A bank has a large .NET application. Releasing one small payment change requires deploying the whole system, payment logic is duplicated, and failures in the notification code can cause a payment request to fail.

**Natural interview answer:**

“I define application architecture as the major structural and technical decisions that allow a system to meet both business and quality requirements. I start with the business flow and constraints rather than choosing a pattern first.

In this case, the problem was unclear boundaries and tight coupling. Payment processing, reporting, and notifications were part of the same execution path. I decided to create a clear payment module with its own application and domain rules. I did not immediately split everything into microservices because that would add operational complexity.

We moved payment rules behind one use-case interface, made notification processing asynchronous, and used an outbox so payment events were not lost between the database and message broker. We also added idempotency, structured logs, metrics, tracing, and ADRs for the main decisions. After measuring the module in production, we could extract it as a separate service later if independent scaling or deployment became necessary.

The result was safer releases, one consistent implementation of payment rules, and fewer payment failures caused by non-critical notification work. The important point is that the architecture followed the business and operational needs; it was not based on a fashionable pattern.”

## 6. Code example

The following simplified example shows an application use case depending on an abstraction rather than directly on Entity Framework Core or SQL Server:

```csharp
public sealed record TransferMoneyCommand(
    Guid FromAccountId,
    Guid ToAccountId,
    decimal Amount,
    string IdempotencyKey);

public interface ITransferRepository
{
    Task<bool> HasBeenProcessedAsync(
        string idempotencyKey,
        CancellationToken cancellationToken);

    Task<Account> GetAccountAsync(
        Guid accountId,
        CancellationToken cancellationToken);

    Task SaveAsync(
        Account from,
        Account to,
        string idempotencyKey,
        CancellationToken cancellationToken);
}

public sealed class TransferMoneyHandler(ITransferRepository repository)
{
    public async Task HandleAsync(
        TransferMoneyCommand command,
        CancellationToken cancellationToken)
    {
        if (await repository.HasBeenProcessedAsync(
                command.IdempotencyKey, cancellationToken))
        {
            return;
        }

        var from = await repository.GetAccountAsync(
            command.FromAccountId, cancellationToken);
        var to = await repository.GetAccountAsync(
            command.ToAccountId, cancellationToken);

        from.Debit(command.Amount);
        to.Credit(command.Amount);

        await repository.SaveAsync(
            from, to, command.IdempotencyKey, cancellationToken);
    }
}
```

The handler coordinates one business use case. `Account.Debit` can enforce rules such as sufficient balance, while `ITransferRepository` hides storage details. A production repository should save both account changes, the idempotency record, and any outbox event in one database transaction.

ASP.NET Core can register the implementation through built-in dependency injection:

```csharp
builder.Services.AddScoped<ITransferRepository, EfTransferRepository>();
builder.Services.AddScoped<TransferMoneyHandler>();
```

This keeps the business workflow easy to test and allows infrastructure details to change without rewriting the use case.

## 7. Common mistakes

- Choosing microservices, event-driven design, or another pattern before understanding the problem.
- Treating architecture as a one-time diagram instead of decisions that must be implemented and reviewed.
- Adding too many layers, interfaces, and abstractions to a small application.
- Creating layers by technical type but allowing business logic to leak into controllers, database procedures, and message handlers.
- Sharing one database across supposedly independent services without clear data ownership.
- Ignoring failure handling, timeouts, retries, idempotency, and eventual consistency in distributed flows.
- Focusing only on code structure while ignoring deployment, monitoring, security, and operations.
- Designing for imagined future scale without measuring current needs.
- Failing to document important decisions and trade-offs.

## 8. Follow-up interview questions

### How is application architecture different from software design?

Architecture covers high-impact system decisions such as boundaries, communication, data ownership, deployment, security, and scaling. Software design usually deals with more detailed decisions inside those boundaries, such as classes, interfaces, and algorithms. The two overlap, but architectural decisions are generally harder and more expensive to change.

### How do you know whether an architecture is good?

A good architecture meets the important business and quality requirements with acceptable cost and complexity. It should be testable, observable, secure, and easy enough for the team to change. Evidence such as production metrics, failure tests, deployment frequency, and lead time is more useful than how impressive the diagram looks.

### When would you choose a modular monolith instead of microservices?

I would prefer a modular monolith when the product or domain boundaries are still changing, the team is small, and independent scaling or deployment is not required. It keeps operations and transactions simpler while still enforcing module boundaries. I would consider extracting a module when measured needs justify the extra distributed-system complexity.
