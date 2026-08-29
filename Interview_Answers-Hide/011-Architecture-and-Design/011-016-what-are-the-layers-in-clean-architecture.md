# 16. What are the layers in Clean Architecture?

**Technology:** Architecture and Design

**Source question:** 16. What are the layers in Clean Architecture?

## 1. What is it?

Clean Architecture organizes an application into layers based on responsibility. Its main rule is that dependencies point inward: business rules must not depend on databases, web frameworks, message brokers, or other external tools.

The common layers are:

1. **Entities or Domain** – Core business concepts and rules, such as `Account`, `Payment`, and withdrawal limits.
2. **Use Cases or Application** – Business workflows, such as transferring money. It coordinates domain objects and defines interfaces for services it needs.
3. **Interface Adapters** – Code that converts data between the application and the outside world. Examples include API controllers, presenters, repository implementations, and mapping code.
4. **Frameworks and Drivers or Infrastructure** – External technology such as ASP.NET Core, Entity Framework Core, SQL Server, Redis, queues, email providers, and file storage.

The exact project names can vary. A typical .NET solution uses `Domain`, `Application`, `Infrastructure`, and `Api`. The dependency rule is more important than having exactly four projects.

## 2. Why is it important?

It keeps important business logic independent from technical details. For example, a payment rule should not be mixed into an ASP.NET Core controller or an Entity Framework Core repository.

This helps teams:

- Test business workflows without a real database or web server.
- Replace an external service with less impact on business code.
- Keep large systems easier to understand and change.
- Prevent controllers, background workers, and repositories from containing duplicated business rules.
- Develop different parts of a system in parallel with clear boundaries.

It does add structure and abstraction, so it is most useful when the application has meaningful business rules or is expected to evolve. A small CRUD application may not need every layer.

## 3. How does it work?

A request normally flows through the layers like this:

1. An API controller receives an HTTP request and converts it to an application command or query.
2. An application use case validates and coordinates the workflow.
3. Domain objects apply the core business rules.
4. The application calls interfaces, such as `IAccountRepository`, defined in an inner layer.
5. Infrastructure implements those interfaces using EF Core, SQL Server, a message broker, or another external system.
6. The result travels back through the API as an HTTP response.

Compile-time dependencies point inward. For example, `Infrastructure` can reference `Application`, but `Application` must not reference `Infrastructure`. Dependency injection connects the interface to its infrastructure implementation at application startup. Runtime calls may go outward through an interface, but the inner layer still does not know which technology performs the work.

## 4. Practical example

Consider a bank transfer API. The domain contains accounts and rules such as “an account cannot transfer more than its available balance.” The application layer contains a `TransferMoney` use case. It loads both accounts through repository interfaces, asks the domain objects to debit and credit the correct amounts, saves the changes, and requests an audit event.

The infrastructure layer implements the repositories with EF Core and publishes the event to a message broker. The API layer handles authentication, accepts the transfer request, calls the use case, and maps the result to an HTTP response.

If the bank later moves from SQL Server to PostgreSQL, the domain and application rules should not change. Only infrastructure configuration and implementations should be affected.

## 5. Scenario-based interview answer

“In one payment system, controllers contained validation, fee calculation, EF Core queries, and message publishing. This made the workflow difficult to test and caused the same rules to be repeated in API and background-processing code.

I separated the solution into Domain, Application, Infrastructure, and API projects. The Domain project owned payment rules. The Application project owned use cases and declared interfaces for persistence and event publishing. Infrastructure implemented those interfaces, while the API handled only transport concerns such as authentication, model binding, and HTTP status codes.

We wired the implementations through dependency injection and added unit tests around the application and domain layers. As a result, business tests no longer needed a database, controllers became small, and we could change the message-broker implementation without rewriting the payment workflow. I would not add abstractions mechanically, though; I introduce boundaries where they protect business behavior or isolate technology that is likely to change.”

## 6. Code example

The inner application layer defines the use case and the dependency it needs:

```csharp
// Application layer
public interface IAccountRepository
{
    Task<Account?> GetAsync(Guid id, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public sealed record TransferMoneyCommand(
    Guid FromAccountId,
    Guid ToAccountId,
    decimal Amount);

public sealed class TransferMoneyHandler(IAccountRepository accounts)
{
    public async Task HandleAsync(
        TransferMoneyCommand command,
        CancellationToken cancellationToken)
    {
        if (command.Amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(command.Amount));

        var from = await accounts.GetAsync(command.FromAccountId, cancellationToken)
            ?? throw new InvalidOperationException("Source account was not found.");
        var to = await accounts.GetAsync(command.ToAccountId, cancellationToken)
            ?? throw new InvalidOperationException("Destination account was not found.");

        from.Debit(command.Amount); // Domain rule checks the available balance.
        to.Credit(command.Amount);

        await accounts.SaveChangesAsync(cancellationToken);
    }
}
```

The outer infrastructure layer implements the application interface:

```csharp
// Infrastructure layer
public sealed class EfAccountRepository(BankingDbContext db)
    : IAccountRepository
{
    public Task<Account?> GetAsync(Guid id, CancellationToken cancellationToken) =>
        db.Accounts.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken) =>
        db.SaveChangesAsync(cancellationToken);
}

// API composition root
builder.Services.AddScoped<IAccountRepository, EfAccountRepository>();
builder.Services.AddScoped<TransferMoneyHandler>();
```

`TransferMoneyHandler` knows only the repository interface. EF Core is contained in Infrastructure, and the API composition root connects the two. In a production transfer, a database transaction and an outbox pattern may also be needed for atomic persistence and reliable event publication.

## 7. Common mistakes

- Referencing EF Core, ASP.NET Core types, or infrastructure projects from Domain or Application.
- Putting business rules in controllers, repositories, mapping profiles, or database stored procedures without a clear reason.
- Treating Clean Architecture as a fixed folder template instead of enforcing dependency boundaries.
- Creating an interface for every class even when there is no useful boundary or alternative behavior.
- Returning database entities directly from API endpoints and tightly coupling the API contract to persistence.
- Building an anemic domain where entities only hold data and all rules are scattered through services.
- Ignoring transactions, concurrency, idempotency, and reliable event delivery in real payment workflows.
- Adding four projects and many abstractions to a simple CRUD service where the complexity gives little value.

## 8. Follow-up interview questions

### What is the dependency rule in Clean Architecture?

Source-code dependencies must point toward the business rules. Inner layers must not know about outer frameworks or infrastructure implementations.

### Where should repository interfaces be defined?

Define them in the inner layer that needs them, usually Application. Infrastructure implements them. A repository that represents a domain collection may sometimes be owned by Domain, but the key rule is to avoid making the inner layer depend on Infrastructure.

### Is Clean Architecture the same as Onion or Hexagonal Architecture?

They are closely related. All three protect business logic by placing it at the center and isolating external technology through boundaries and dependency inversion. Their terminology and diagrams differ, but the core goal is similar.
