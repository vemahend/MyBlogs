# 11. What is an aggregate?

**Technology:** Architecture and Design

**Source question:** 11. What is an aggregate?

## 1. What is it?

An aggregate is a small group of related domain objects that must stay consistent together. Domain-Driven Design (DDD) treats that group as one unit when business data is changed.

Every aggregate has one **aggregate root**. The root is the only object that code outside the aggregate should use to make changes. Other entities and value objects inside the aggregate are controlled through the root.

An aggregate is a business and consistency boundary, not simply a database table, an object graph, or every object that has a relationship.

## 2. Why is it important?

An aggregate protects business rules, also called invariants. For example, an order total must match its lines, and a confirmed order must not accept another line.

It gives developers a clear answer to important design questions:

- Which objects must be updated in the same transaction?
- Which object is responsible for enforcing a rule?
- Which data can be changed later through another process?
- Where should concurrent updates be detected?

Without this boundary, application code can change related records independently and leave the business data in an invalid state. In distributed systems, sensible aggregate boundaries also reduce large transactions and unnecessary coupling.

## 3. How does it work?

The normal flow is:

1. The application loads an aggregate by the identity of its root.
2. It calls a business method on the root, such as `AddLine` or `Confirm`.
3. The root checks the business rules and changes its internal state.
4. The repository saves the aggregate in one local transaction.
5. The aggregate may record domain events for work that can happen after the transaction.

Objects outside the aggregate should not directly modify its internal entities. Other aggregates should normally be referenced by ID, rather than held as a large editable object graph.

Consistency is immediate inside one aggregate. Consistency between separate aggregates is often eventual, using domain events, integration events, or an outbox-based process.

## 4. Practical example

In a payment system, a `Payment` aggregate could contain the payment root and its attempt records. The aggregate enforces rules such as:

- A captured payment cannot be captured again.
- The captured amount cannot exceed the authorized amount.
- A failed attempt must not mark the payment as successful.

The customer account should not be part of the same aggregate just because it initiated the payment. The payment can store the account ID. If a successful payment must update another service, that work can happen through a reliable event after the payment transaction commits.

## 5. Scenario-based interview answer

**Problem:** In an ordering system, several handlers updated order lines and order status directly through separate repositories. Under concurrent requests, a line could be added after the order had been confirmed, and totals sometimes became incorrect.

**Decision:** I modelled `Order` as the aggregate root and `OrderLine` as an entity inside the aggregate. The boundary was based on the rules that had to be immediately consistent, not on all tables related to an order.

**Implementation:** Commands loaded the `Order`, called methods such as `AddLine` and `Confirm`, and saved it once in a database transaction. The root controlled its line collection and recalculated the total. I used optimistic concurrency to reject conflicting updates. Downstream work, such as starting payment, was triggered through an event and a transactional outbox.

**Result:** Invalid state changes were blocked in one place, concurrent conflicts became visible, and the order transaction stayed small. Payment remained a separate aggregate, so the design did not create a large distributed transaction.

## 6. Code example

```csharp
public sealed class Order
{
    private readonly List<OrderLine> _lines = [];

    private Order() { } // Used by EF Core

    public Order(Guid id, Guid customerId)
    {
        Id = id;
        CustomerId = customerId;
    }

    public Guid Id { get; private set; }
    public Guid CustomerId { get; private set; }
    public OrderStatus Status { get; private set; } = OrderStatus.Draft;
    public IReadOnlyCollection<OrderLine> Lines => _lines.AsReadOnly();
    public decimal Total => _lines.Sum(line => line.Quantity * line.UnitPrice);

    public void AddLine(Guid productId, int quantity, decimal unitPrice)
    {
        if (Status != OrderStatus.Draft)
            throw new InvalidOperationException("Only a draft order can be changed.");

        if (quantity <= 0)
            throw new ArgumentOutOfRangeException(nameof(quantity));

        if (unitPrice < 0)
            throw new ArgumentOutOfRangeException(nameof(unitPrice));

        _lines.Add(new OrderLine(Guid.NewGuid(), productId, quantity, unitPrice));
    }

    public void Confirm()
    {
        if (Status != OrderStatus.Draft)
            throw new InvalidOperationException("The order is not a draft.");

        if (_lines.Count == 0)
            throw new InvalidOperationException("An empty order cannot be confirmed.");

        Status = OrderStatus.Confirmed;
    }
}

public sealed record OrderLine(
    Guid Id,
    Guid ProductId,
    int Quantity,
    decimal UnitPrice);

public enum OrderStatus
{
    Draft,
    Confirmed
}
```

`Order` is the aggregate root. Its collection is exposed as read-only, so callers must use the root's methods. Those methods protect the rules before changing state. A repository would load and save the complete `Order` aggregate; callers would not use a separate repository to update `OrderLine` directly.

The collection expression `[]` requires C# 12 or later. On earlier supported language versions, use `new List<OrderLine>()` instead.

## 7. Common mistakes

- Treating every entity or database table as a separate aggregate.
- Creating one very large aggregate containing everything related to a business process.
- Allowing application code or ORM navigation properties to bypass the root and edit child entities directly.
- Trying to make several aggregates immediately consistent in one distributed transaction.
- Putting rules only in controllers or services and leaving the aggregate as a data-only model.
- Loading an aggregate without concurrency control when multiple requests can update it.
- Publishing integration events before the database transaction commits, which can announce a change that is later rolled back.

## 8. Follow-up interview questions

### What is the difference between an aggregate and an aggregate root?

The aggregate is the whole consistency boundary. The aggregate root is the main entity that identifies that boundary and controls all changes inside it.

### Can one transaction update multiple aggregates?

It is technically possible in a single database, but it should not be the normal design. If multiple aggregates must always change atomically, reconsider whether the boundary is correct. Otherwise, use events and eventual consistency.

### How should one aggregate reference another aggregate?

Usually by the other aggregate's ID. This keeps boundaries clear and avoids loading and modifying a large connected object graph.
