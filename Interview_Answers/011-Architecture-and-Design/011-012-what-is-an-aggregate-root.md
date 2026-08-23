# 12. What is an aggregate root?

**Technology:** Architecture and Design

**Source question:** 12. What is an aggregate root?

## 1. What is it?

An aggregate root is the main entity that controls a group of related domain objects in Domain-Driven Design (DDD).

Outside code should make changes through the aggregate root, not directly through its child entities. The root protects the business rules that must always be true for the whole group.

For example, an `Account` can be an aggregate root and its `Transaction` records can be child entities. Code asks the account to debit money rather than changing its balance or adding a transaction directly.

An aggregate is also normally treated as one consistency and transaction boundary. It is not simply a database parent record or an object containing every related entity.

## 2. Why is it important?

An aggregate root keeps business rules in one trusted place. Without it, controllers, services, and repositories may update related objects independently and leave the data in an invalid state.

It is important because it:

- protects rules such as “an account cannot exceed its overdraft limit”;
- gives callers one clear entry point for changes;
- defines what should be saved atomically in one transaction;
- reduces direct coupling to internal child entities;
- provides a useful boundary for optimistic concurrency and domain events.

In a real system, this helps the team reason about consistency without creating one large transaction across many tables or services.

## 3. How does it work?

The normal flow is:

1. The application loads the aggregate root from a repository.
2. It calls a meaningful method such as `Debit` or `AddPayment`.
3. The root checks the business rules.
4. The root updates its own state and any child entities.
5. The repository saves the aggregate in one local transaction.
6. If another aggregate or service must react, the root can raise a domain event. That reaction may be eventually consistent.

Only the root is referenced from outside the aggregate. Child objects can still have identities, but callers should not load and change them independently when that would bypass the root's rules.

## 4. Practical example

Consider a bank account with a balance, an overdraft limit, and account entries.

The `BankAccount` is the aggregate root. A withdrawal request calls `BankAccount.Debit(amount)`. The account checks that the amount is positive and that the new balance will not go below the allowed overdraft limit. Only then does it change the balance and add a debit entry.

Both changes are saved together. The system cannot reduce the balance without recording the entry, or add an entry without applying the balance rule.

A money transfer should usually not make two bank accounts one huge aggregate. Each account can remain a separate aggregate, while a transfer workflow coordinates their updates using idempotent commands, events, and compensation where needed.

## 5. Scenario-based interview answer

“In a payment system, we had an order whose payment attempts were being changed directly by several services. That allowed a captured payment to be captured again and sometimes left the order total and payment status out of sync.

I made `Payment` the aggregate root and kept its attempts inside that boundary. Callers used operations such as `Authorize`, `Capture`, and `Fail` instead of setting statuses directly. Each method checked the current state, amount, and idempotency key. We saved the payment and its new attempt in one database transaction and published an outbox event after the state change for other services.

As a result, invalid state transitions were blocked in the domain model, duplicate processing became safe, and other services could react without being included in the payment transaction.”

## 6. Code example

```csharp
public sealed class BankAccount
{
    private readonly List<AccountEntry> _entries = [];

    public Guid Id { get; private set; }
    public decimal Balance { get; private set; }
    public decimal OverdraftLimit { get; private set; }
    public IReadOnlyCollection<AccountEntry> Entries => _entries.AsReadOnly();

    private BankAccount() { } // Used by EF Core

    public BankAccount(Guid id, decimal openingBalance, decimal overdraftLimit)
    {
        if (openingBalance < 0) throw new ArgumentOutOfRangeException(nameof(openingBalance));
        if (overdraftLimit < 0) throw new ArgumentOutOfRangeException(nameof(overdraftLimit));

        Id = id;
        Balance = openingBalance;
        OverdraftLimit = overdraftLimit;
    }

    public void Debit(decimal amount, string reference)
    {
        if (amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(amount));

        if (Balance - amount < -OverdraftLimit)
            throw new InvalidOperationException("Overdraft limit would be exceeded.");

        Balance -= amount;
        _entries.Add(new AccountEntry(Guid.NewGuid(), -amount, reference));
    }
}

public sealed record AccountEntry(Guid Id, decimal Amount, string Reference);

public interface IBankAccountRepository
{
    Task<BankAccount?> GetAsync(Guid id, CancellationToken cancellationToken);
    Task SaveAsync(BankAccount account, CancellationToken cancellationToken);
}
```

`BankAccount` is the only object through which a debit can occur. Its property setters and entry collection are not publicly writable, so calling code cannot bypass the overdraft rule. The repository works with the root and saves the balance and new entry as one unit. In production, a concurrency token should also be used so two requests cannot both update an old balance successfully.

## 7. Common mistakes

- Treating every entity as an aggregate root. This creates unclear ownership and too many ways to change the same data.
- Building an aggregate that is too large. Loading and saving a large object graph hurts performance and increases concurrency conflicts.
- Making the aggregate too small. Rules that require atomic updates may then be split across separate transactions.
- Exposing public setters or mutable child collections, which lets callers bypass business rules.
- Letting repositories save child entities independently when they belong to the same consistency boundary.
- Using an aggregate boundary as a reason for a distributed transaction. Changes across aggregates or services often need events, an outbox, idempotency, and eventual consistency.
- Ignoring concurrent updates. A valid in-memory check is not enough if another request changes the aggregate before it is saved.

## 8. Follow-up interview questions

### What is the difference between an entity and an aggregate root?

An entity has its own identity. An aggregate root is an entity that also owns a consistency boundary and controls access to the entities and value objects inside it.

### Can one aggregate root directly reference another aggregate root?

It is usually better to store the other root's identifier rather than its full object. This keeps boundaries clear and avoids accidentally loading or saving multiple aggregates as one unit.

### How do two aggregates communicate?

An application service can coordinate them, or one aggregate can raise a domain event that triggers work on another. When they are in different transactions or services, use eventual consistency and make event handling idempotent.
