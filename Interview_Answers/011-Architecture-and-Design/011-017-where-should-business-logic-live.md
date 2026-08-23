# 17. Where should business logic live?

**Technology:** Architecture and Design

**Source question:** 17. Where should business logic live?

## 1. What is it?

Business logic is the code that represents business rules and business decisions. Examples include checking whether an account has enough money, calculating a fee, deciding whether a payment can be refunded, and enforcing a daily transfer limit.

In a well-structured .NET application, business logic normally lives in two places:

- The **domain layer** contains rules that belong to business concepts, such as `Account.Debit` preventing an invalid balance.
- The **application layer** coordinates a use case, such as loading accounts, calling domain methods, saving changes, and publishing an event.

It should not primarily live in ASP.NET Core controllers, Razor or React components, Entity Framework repositories, message consumers, or stored procedures. Those parts should handle delivery or technical concerns and then call the application and domain code.

This is not a rule that every application needs a complex domain model. For simple CRUD operations, an application service may be enough. The structure should match the complexity of the business rules.

## 2. Why is it important?

Keeping business logic in a clear, central place gives the system one reliable definition of each rule. The same transfer rule can then be used by an HTTP API, a background worker, and a message consumer without copying it.

This helps teams to:

- Test rules quickly without starting a web server or connecting to a real database.
- Prevent different entry points from applying different rules.
- Change the UI, database, or messaging technology without rewriting core rules.
- Make controllers and repositories smaller and easier to understand.
- Review important financial or security decisions in one place.
- Protect domain objects from entering an invalid state.

For architects, the main benefit is separation of responsibility. Business policy changes for business reasons; infrastructure changes for technical reasons. Keeping them apart reduces the risk and cost of both kinds of change.

## 3. How does it work?

A typical request flows through the layers like this:

1. An API endpoint authenticates the caller, parses the request, and performs basic input validation.
2. An application service or command handler starts the use case.
3. It loads the required domain objects through repository interfaces.
4. Domain objects or domain services apply business rules and change state.
5. The application layer coordinates persistence, transactions, external calls, and domain events.
6. Infrastructure implementations use EF Core, a message broker, or an external API.
7. The endpoint converts the result into an HTTP response.

The distinction between validation and business logic matters. Checking that `Amount` was supplied and has a valid numeric format is an input concern. Deciding that the amount exceeds the customer's remaining daily limit is a business rule and belongs in the domain or application model.

Rules that must always be true for one entity or aggregate should usually be enforced by that domain object. Rules requiring several aggregates, external information, or workflow coordination can be handled by an application service or a domain service. Database constraints may also protect data integrity, but they support the business model rather than replace it.

## 4. Practical example

Consider a banking API that transfers money between accounts. Its controller should not calculate balances or decide whether the transfer is allowed. It should accept the request and call a transfer use case.

The application handler loads the source and destination accounts. The source `Account` enforces rules such as:

- The account must be active.
- The amount must be positive.
- The available balance must be sufficient.
- The transfer must not exceed the permitted limit.

The handler then credits the destination, saves both changes in one transaction, and stores an outbox event. Infrastructure code implements the EF Core transaction and later publishes the event. This design applies the same rules whether a transfer starts through the mobile API, an internal operations tool, or a scheduled payment worker.

## 5. Scenario-based interview answer

**Scenario:** A bank has transfer rules spread across API controllers, a background job, and SQL stored procedures. Scheduled transfers sometimes bypass the daily limit that the API enforces.

**Natural interview answer:**

“The problem was not simply duplicated code; we had different definitions of a valid transfer depending on how the transfer entered the system.

I decided to make the application and domain layers the single home for the transfer policy. Rules that protected an account's state, such as positive amounts and sufficient funds, moved into the `Account` aggregate. The transfer handler coordinated rules that needed workflow data, loaded both accounts, called the domain methods, and committed the changes. Controllers and job consumers became thin adapters that called the same handler.

We kept database constraints for basic data integrity and used one database transaction plus an outbox record for reliable event publication. We added unit tests for the domain rules and integration tests for transaction and concurrency behavior.

The result was consistent behavior for API and scheduled transfers, simpler entry points, and safer rule changes. I would not force every rule into an entity: orchestration belongs in the application layer, while database and messaging details remain in infrastructure.”

## 6. Code example

This simplified example puts an account invariant in the domain object and use-case coordination in an application handler:

```csharp
public sealed class Account
{
    public Guid Id { get; }
    public decimal Balance { get; private set; }
    public bool IsActive { get; private set; }

    public Account(Guid id, decimal balance, bool isActive)
    {
        Id = id;
        Balance = balance;
        IsActive = isActive;
    }

    public void Debit(decimal amount)
    {
        if (!IsActive)
            throw new InvalidOperationException("The account is inactive.");

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

public interface IAccountRepository
{
    Task<Account> GetAsync(Guid id, CancellationToken cancellationToken);
    Task SaveTransferAsync(
        Account source,
        Account destination,
        CancellationToken cancellationToken);
}

public sealed class TransferMoneyHandler(IAccountRepository accounts)
{
    public async Task HandleAsync(
        Guid sourceId,
        Guid destinationId,
        decimal amount,
        CancellationToken cancellationToken)
    {
        if (sourceId == destinationId)
            throw new InvalidOperationException("Accounts must be different.");

        var source = await accounts.GetAsync(sourceId, cancellationToken);
        var destination = await accounts.GetAsync(destinationId, cancellationToken);

        source.Debit(amount);
        destination.Credit(amount);

        await accounts.SaveTransferAsync(
            source, destination, cancellationToken);
    }
}
```

`Account` owns the rules that keep its balance valid. `TransferMoneyHandler` coordinates the complete use case. `IAccountRepository` hides EF Core or another storage technology. In production, `SaveTransferAsync` should use one transaction, handle optimistic concurrency, and save an outbox event when other systems must be notified.

## 7. Common mistakes

- Putting business decisions in controllers, endpoints, UI components, or message handlers.
- Treating the application layer and domain layer as the same thing: use-case coordination and domain rules have different responsibilities.
- Creating an anemic domain model where entities are only data and every rule is scattered through services.
- Forcing all logic into domain entities, including database access, HTTP calls, logging, and workflow coordination.
- Duplicating rules in several services or channels instead of sharing one use case.
- Assuming client-side validation protects the system; every server-side entry point must enforce business rules.
- Relying only on database constraints or stored procedures for rules that need clear domain behavior and unit tests.
- Ignoring concurrency, allowing two individually valid requests to break a balance or limit together.
- Adding a complex domain layer to simple CRUD screens where straightforward application logic is sufficient.

## 8. Follow-up interview questions

### What is the difference between domain logic and application logic?

Domain logic expresses business rules and protects business state. Application logic coordinates a use case: it loads data, calls domain behavior, manages the transaction, and arranges external work. It should not duplicate the rules owned by the domain.

### Should business logic ever live in the database?

Database constraints are valuable for final data integrity, such as uniqueness, foreign keys, and valid ranges. Some data-heavy operations may also reasonably run in the database. However, hiding the main business policy only in stored procedures makes it harder to reuse, test, and understand, so that choice should be deliberate.

### Where should rules involving an external service live?

The business decision should remain in the application or domain model, while an interface represents the required external information. The infrastructure layer implements that interface. The application layer coordinates the call and handles technical concerns such as timeouts, retries, and failures.
