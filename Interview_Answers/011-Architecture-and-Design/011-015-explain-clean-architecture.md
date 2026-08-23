# 15. Explain Clean Architecture.

**Technology:** Architecture and Design

**Source question:** 15. Explain Clean Architecture.

## 1. What is it?

Clean Architecture is a way to organize an application so that its core business rules do not depend on frameworks, databases, user interfaces, or external services.

The main rule is simple: dependencies point inward. Outer parts of the system may depend on inner parts, but inner parts must not know about outer implementation details.

A typical .NET solution separates responsibilities into:

- **Domain:** Business entities, value objects, and business rules.
- **Application:** Use cases and the interfaces needed by those use cases.
- **Infrastructure:** Implementations for databases, message brokers, email, and external APIs.
- **Presentation:** ASP.NET Core endpoints, controllers, authentication setup, and request/response models.

Clean Architecture is guidance, not a fixed folder structure. A small application does not always need four separate projects.

## 2. Why is it important?

Without clear boundaries, business logic often becomes mixed with controllers, Entity Framework Core, and third-party APIs. That makes changes risky and tests slow or difficult.

Clean Architecture helps because:

- Business rules can be tested without starting a web server or connecting to a database.
- Infrastructure can change with less impact. For example, SQL Server can be replaced without rewriting a payment use case.
- Framework code stays at the edge instead of controlling the design.
- Responsibilities are clearer, so a large team can maintain the system more safely.

It does not remove complexity. It makes important dependencies explicit and keeps technical details away from business decisions.

## 3. How does it work?

Consider an ASP.NET Core request to transfer money:

1. The API endpoint receives the HTTP request and maps it to an application command.
2. An application use case validates the request and coordinates the transfer.
3. Domain objects enforce rules such as sufficient funds and valid transfer amounts.
4. The application layer calls interfaces such as `IAccountRepository` and `IUnitOfWork`.
5. The infrastructure layer implements those interfaces using EF Core, SQL Server, or another technology.
6. The endpoint maps the result to an HTTP response.

The application layer defines what it needs; the infrastructure layer supplies the implementation through dependency injection. The domain and application layers therefore do not need to reference ASP.NET Core or EF Core.

## 4. Practical example

In a banking system, a transfer must not overdraw the source account.

The `Account` domain entity contains the debit rule. A `TransferMoney` use case loads both accounts through repository interfaces, asks the source account to debit, credits the destination account, and commits the transaction.

EF Core implements the repositories in the infrastructure layer. An ASP.NET Core endpoint only accepts the request, calls the use case, and returns the result. If the bank later changes its database technology or exposes the same use case through a message consumer, the overdraft rule remains unchanged.

## 5. Scenario-based interview answer

**Problem:** In one payment platform, controllers contained validation, fee calculations, EF Core queries, and calls to a payment provider. Changes were hard to test, and the same rules were duplicated in background workers.

**Decision:** I introduced Clean Architecture boundaries around the payment use cases. I kept payment rules in the domain, orchestration in the application layer, and technical integrations in infrastructure. I used interfaces only where the application needed to cross a boundary.

**Implementation:** The API and message consumer both called the same `ProcessPayment` use case. The use case depended on abstractions for payment storage, idempotency, and the external gateway. Infrastructure provided EF Core and gateway implementations through dependency injection. Unit tests used small fakes for these boundaries.

**Result:** Payment rules had one source of truth, tests became faster, and provider changes no longer affected the core workflow. I would also mention that I applied the pattern pragmatically; I did not create an interface or separate project for every class.

## 6. Code example

```csharp
// Domain layer
public sealed class Account
{
    public Guid Id { get; }
    public decimal Balance { get; private set; }

    public Account(Guid id, decimal balance) => (Id, Balance) = (id, balance);

    public void Debit(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(amount));

        if (Balance < amount)
            throw new InvalidOperationException("Insufficient funds.");

        Balance -= amount;
    }

    public void Credit(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(amount));

        Balance += amount;
    }
}

// Application layer
public interface IAccountRepository
{
    Task<Account?> GetAsync(Guid id, CancellationToken cancellationToken);
}

public interface IUnitOfWork
{
    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public sealed class TransferMoney(
    IAccountRepository accounts,
    IUnitOfWork unitOfWork)
{
    public async Task ExecuteAsync(
        Guid fromId,
        Guid toId,
        decimal amount,
        CancellationToken cancellationToken)
    {
        var from = await accounts.GetAsync(fromId, cancellationToken)
            ?? throw new KeyNotFoundException("Source account was not found.");
        var to = await accounts.GetAsync(toId, cancellationToken)
            ?? throw new KeyNotFoundException("Destination account was not found.");

        from.Debit(amount);
        to.Credit(amount);

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}

// Presentation composition root (Program.cs)
builder.Services.AddScoped<IAccountRepository, EfAccountRepository>();
builder.Services.AddScoped<IUnitOfWork, EfUnitOfWork>();
builder.Services.AddScoped<TransferMoney>();
```

`Account` owns the balance rules and has no framework dependency. `TransferMoney` coordinates the use case through interfaces it owns. The concrete EF Core classes belong in infrastructure and are connected at the application's composition root. In production, the unit of work must save both balance changes in one database transaction, and concurrent updates should be protected with an appropriate concurrency strategy.

## 7. Common mistakes

- Treating Clean Architecture as a mandatory four-project template instead of a dependency rule.
- Putting business logic in controllers, EF Core repositories, or service integration classes.
- Letting domain or application projects reference ASP.NET Core, EF Core, or infrastructure projects.
- Creating interfaces for every class even when no architectural boundary exists.
- Returning EF Core entities or `IQueryable` from repositories and leaking persistence concerns inward.
- Building an anemic domain model where entities contain only properties and all rules live in large application services.
- Ignoring transactions, concurrency, idempotency, logging, and failure handling because the diagram looks clean.
- Adding too many mapping layers and abstractions to a small, simple CRUD application.

## 8. Follow-up interview questions

### Is Clean Architecture the same as Onion or Hexagonal Architecture?

No. Their terminology and diagrams differ, but they share the main goal of protecting business rules from external technology and directing dependencies toward the core.

### Can the application layer reference the infrastructure layer?

No. The application layer defines an interface for the capability it needs. Infrastructure references the application layer and implements that interface. Dependency injection connects them at startup.

### Does every application need Clean Architecture?

No. It is most useful when business rules are important, integrations may change, or the system will grow. For a small CRUD service, a simpler modular structure may be easier to maintain.
