# 10. Explain Domain-Driven Design.

**Technology:** Architecture and Design

**Source question:** 10. Explain Domain-Driven Design.

## 1. What is it?

Domain-Driven Design (DDD) is an approach to designing software around the business domain: the real problems, rules, and language of the organization.

Instead of starting with database tables or technical layers, developers work closely with domain experts, such as payment or banking specialists. Together, they build a model that reflects how the business actually works and use the same terms in discussions, documentation, and code. This shared language is called the **ubiquitous language**.

DDD is most useful for complex business systems. It is not a framework, architecture style, or requirement to use microservices. It is a set of design principles and patterns that can be used in a modular monolith or a distributed system.

## 2. Why is it important?

Complex systems often fail because the code does not clearly represent the business. Rules become scattered across controllers, services, and database scripts. Different teams may also use the same word with different meanings.

DDD helps teams:

- put important business rules in a clear domain model;
- create a shared language between developers and domain experts;
- split a large problem into understandable business boundaries;
- protect business rules from UI, database, and integration concerns; and
- change one business area without creating unexpected effects elsewhere.

Architects need DDD when business rules are complicated and change often. For a simple CRUD application, applying every DDD pattern usually adds more complexity than value.

## 3. How does it work?

DDD is commonly considered at two levels.

At the **strategic** level:

1. The team explores the business with domain experts.
2. It identifies subdomains, including the core domain that gives the business its main advantage.
3. It defines bounded contexts, where each model and its language have a clear meaning.
4. It maps how those contexts communicate through APIs, commands, or integration events.

At the **tactical** level, the team may model the code with:

- **entities**, which have identity and change over time;
- **value objects**, which are defined by their values and are normally immutable;
- **aggregates**, which protect a group of related objects and enforce consistency rules;
- **repositories**, which load and save aggregates without exposing persistence details;
- **domain services**, for domain logic that does not naturally belong to one entity; and
- **domain events**, which describe meaningful business facts that have happened.

An application use case loads an aggregate, asks it to perform a business operation, and saves it. The aggregate accepts or rejects the operation based on its rules. Infrastructure code handles concerns such as Entity Framework Core, messaging, and external APIs.

DDD does not mean using all these patterns everywhere. The team should use only the patterns that make the domain clearer.

## 4. Practical example

Consider a bank transfer system. A transfer cannot be approved if its amount is zero, its currency is unsupported, or it exceeds the customer's daily limit.

Without a domain model, these checks may be duplicated in an API controller, a background job, and a message consumer. One path may eventually miss a rule.

With DDD, a `Transfer` aggregate owns the transfer state and rules. A `Money` value object prevents invalid monetary values. The application loads the transfer, calls `Approve`, and saves it. After approval, a `TransferApproved` domain event can trigger fraud checks or customer notification without putting those concerns inside the aggregate.

The Payments, Fraud, and Notifications bounded contexts can each keep their own model. They exchange explicit contracts instead of sharing domain entities or database tables.

## 5. Scenario-based interview answer

**Problem:** In a payment platform, refund rules were spread across controllers, stored procedures, and background workers. Different flows calculated refundable amounts differently, which caused incorrect refunds and made changes risky.

**Decision:** I used DDD for the complex payment area. We worked with finance and operations experts to define terms such as `CapturedPayment`, `Refund`, and `RefundableAmount`. We separated Payment Processing from Accounting and Notifications using bounded contexts.

**Implementation:** We introduced a `Payment` aggregate that enforced rules such as preventing a refund above the captured balance. Application handlers coordinated the use cases, repositories persisted aggregates through EF Core, and domain events recorded important business facts. Integration events were published reliably through an outbox after the database transaction so other contexts could react.

**Result:** Every refund entry point used the same rules, production defects fell, and new rules could be discussed using language that both developers and business experts understood.

In an interview, I would summarize it like this: “DDD means designing the important parts of the software around the business model and language. I use strategic DDD to define boundaries and tactical patterns where they help enforce complex rules. I do not apply it to every CRUD screen, and I do not treat DDD as another name for microservices.”

## 6. Code example

This example keeps a payment refund rule inside an aggregate:

```csharp
public sealed record Money(decimal Amount, string Currency)
{
    public Money Add(Money other)
    {
        EnsureSameCurrency(other);
        return this with { Amount = Amount + other.Amount };
    }

    private void EnsureSameCurrency(Money other)
    {
        if (!StringComparer.OrdinalIgnoreCase.Equals(Currency, other.Currency))
            throw new InvalidOperationException("Currencies must match.");
    }
}

public sealed record RefundIssued(Guid PaymentId, Money Amount);

public sealed class Payment
{
    private readonly List<object> _domainEvents = [];

    public Guid Id { get; }
    public Money CapturedAmount { get; }
    public Money RefundedAmount { get; private set; }
    public IReadOnlyCollection<object> DomainEvents => _domainEvents.AsReadOnly();

    public Payment(Guid id, Money capturedAmount)
    {
        if (capturedAmount.Amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(capturedAmount));

        Id = id;
        CapturedAmount = capturedAmount;
        RefundedAmount = new Money(0, capturedAmount.Currency);
    }

    public void Refund(Money amount)
    {
        if (amount.Amount <= 0)
            throw new InvalidOperationException("Refund must be greater than zero.");

        var newTotal = RefundedAmount.Add(amount);
        if (newTotal.Amount > CapturedAmount.Amount)
            throw new InvalidOperationException("Refund exceeds the captured amount.");

        RefundedAmount = newTotal;
        _domainEvents.Add(new RefundIssued(Id, amount));
    }
}
```

`Payment` is the aggregate root and is the only place that changes the refunded total. `Money` is an immutable value object that prevents currencies from being mixed. `RefundIssued` records a business fact; an application or infrastructure component can later dispatch it. In production, concurrent refund requests also need optimistic concurrency or another suitable database control so two valid requests cannot together exceed the balance.

The collection expression `[]` requires C# 12, which is supported by .NET 8 and later. On older C# versions, use `new List<object>()` instead.

## 7. Common mistakes

- Treating DDD as a folder structure or naming every class an entity, aggregate, or repository.
- Applying rich domain patterns to simple CRUD features where they add unnecessary work.
- Designing the model without regularly involving domain experts.
- Building one large shared model instead of defining bounded contexts.
- Letting controllers, handlers, or database scripts bypass aggregate rules.
- Making aggregates too large, which creates contention and slow transactions.
- Sharing domain entities in API or event contracts, which tightly couples contexts.
- Assuming DDD requires microservices, event sourcing, CQRS, or a separate database per service.
- Publishing messages before the database transaction is safely committed; an outbox is often needed for reliable integration.
- Ignoring concurrency, idempotency, retries, and eventual consistency in distributed workflows.

## 8. Follow-up interview questions

### What is the difference between an entity and a value object?

An entity is identified by a stable identity and changes over time, such as a payment. A value object is identified by its values and is normally immutable, such as money with an amount and currency.

### Is DDD the same as Clean Architecture?

No. DDD focuses on understanding and modeling the business domain. Clean Architecture focuses on dependency direction and keeping business logic independent from infrastructure. They work well together but solve different problems.

### When would you not use DDD?

I would avoid heavy DDD patterns for simple CRUD applications, prototypes, or domains with very little business logic. I may still use useful ideas such as clear language and boundaries, but the design effort should match the problem's complexity.
