# 9. What is a bounded context?

**Technology:** Architecture and Design

**Source question:** 9. What is a bounded context?

## 1. What is it?

A bounded context is a clear boundary inside a business domain where a specific model, language, and set of business rules apply.

The same word can mean different things in different parts of a system. For example, a **customer** in a Sales context may include contact details and buying preferences, while a **customer** in a Payments context may mean the party responsible for paying. Each context owns its meaning and model.

A bounded context is a Domain-Driven Design (DDD) concept. It is a logical business boundary, not automatically a microservice, database, namespace, or deployment unit. Those technical boundaries may be aligned with it when that is useful.

## 2. Why is it important?

Large systems become difficult to maintain when every team shares one large model. A change made for one business area can then break another area, and common terms can have unclear meanings.

Bounded contexts help by:

- keeping business rules and terminology clear within each area;
- giving one team clear ownership of a model;
- reducing coupling between unrelated parts of the system;
- allowing each context to change at its own pace; and
- providing a useful boundary for services, data, and team responsibilities.

Developers and architects need these boundaries so that a growing system does not turn into one tightly coupled model that nobody can safely change.

## 3. How does it work?

First, the team studies the business domain and identifies areas that use different rules or meanings. Each area becomes a candidate bounded context, such as Accounts, Payments, Fraud, or Notifications.

Inside a context:

1. The context owns its domain model and business rules.
2. Its terms have one precise meaning.
3. Other contexts do not directly change its internal data.
4. It exposes an explicit contract, such as an API, command, or integration event.
5. When another context has a different model, it translates the external contract into its own terms. This translation is often called an anti-corruption layer.

Architects document the relationships between contexts in a **context map**. The map shows which context supplies information, which one consumes it, and how they integrate.

## 4. Practical example

Consider an online bank with **Customer Management** and **Lending** contexts.

In Customer Management, a customer contains identity, contact details, and communication preferences. In Lending, an applicant contains income, credit score, loan exposure, and affordability information. They may refer to the same person, but their models and rules are different.

When an address changes, Customer Management publishes a `CustomerAddressChanged` event. Lending consumes the event and updates only the address data it needs. Lending does not read or update the Customer Management database directly.

This keeps customer-profile rules separate from loan-assessment rules while still allowing the two contexts to cooperate.

## 5. Scenario-based interview answer

**Problem:** In a payment platform, the Orders and Payments modules shared one large `Customer` and `Order` model. Payment changes frequently broke order processing, and teams argued about what statuses such as `Completed` meant.

**Decision:** I worked with domain experts to separate Order Management and Payment Processing into bounded contexts. Each context received its own model and vocabulary. An order could be `Confirmed`, while a payment could be `Authorized`, `Captured`, or `Failed`.

**Implementation:** We gave each context ownership of its data and exposed versioned contracts. Order Management requested payment through a command, and Payment Processing published events such as `PaymentAuthorized` and `PaymentFailed`. Each side translated those messages into its own model, and we used idempotent consumers because events could be delivered more than once.

**Result:** The teams could release independently, payment-specific changes stopped leaking into order code, and production incidents caused by shared status meanings were reduced.

In an interview, I would summarize it like this: “A bounded context gives a business model a clear boundary. Inside that boundary, terms and rules have one meaning. Across boundaries, I integrate through explicit contracts instead of sharing domain objects or databases.”

## 6. Code example

The following example shows two contexts using different models and an explicit integration event:

```csharp
// Contract published by the Payments bounded context.
public sealed record PaymentAuthorized(
    Guid PaymentId,
    Guid OrderId,
    decimal Amount,
    string Currency);

// Model owned by the Order Management bounded context.
public sealed class Order
{
    public Guid Id { get; }
    public OrderStatus Status { get; private set; } = OrderStatus.AwaitingPayment;

    public Order(Guid id) => Id = id;

    public void MarkAsPaid()
    {
        if (Status != OrderStatus.AwaitingPayment)
            return; // Makes repeated event delivery harmless.

        Status = OrderStatus.Paid;
    }
}

public enum OrderStatus
{
    AwaitingPayment,
    Paid,
    Cancelled
}

public sealed class PaymentAuthorizedHandler
{
    private readonly IOrderRepository _orders;

    public PaymentAuthorizedHandler(IOrderRepository orders) => _orders = orders;

    public async Task HandleAsync(
        PaymentAuthorized message,
        CancellationToken cancellationToken)
    {
        var order = await _orders.GetAsync(message.OrderId, cancellationToken);
        order.MarkAsPaid();
        await _orders.SaveAsync(order, cancellationToken);
    }
}
```

`PaymentAuthorized` is an integration contract, not the Payments context's internal domain entity. The Order context consumes the contract and performs an operation on its own `Order` model. It does not reuse a Payments domain class or access the Payments database.

## 7. Common mistakes

- Treating every bounded context as a separate microservice. A bounded context can initially be a module inside a modular monolith.
- Defining contexts around technical layers, such as UI, API, and database, instead of business capabilities.
- Sharing domain entities or one database schema across contexts, which removes real ownership.
- Assuming the same term must have the same model everywhere.
- Creating boundaries without involving domain experts, leading to boundaries that do not match the business.
- Using events as shared internal models rather than stable, versioned integration contracts.
- Ignoring reliability concerns such as idempotency, retries, event ordering, and eventual consistency.

## 8. Follow-up interview questions

### Is a bounded context the same as a microservice?

No. A bounded context is a business and model boundary. A microservice is a deployment boundary. One bounded context may become one service, but it can also be implemented as a module, and a large context may require several cooperating services.

### What is the difference between a bounded context and a subdomain?

A subdomain is a part of the business problem, such as Payments or Fraud Detection. A bounded context is the boundary of a particular model used to solve part of that problem. They often align, but they are not the same concept.

### How do bounded contexts communicate?

They communicate through explicit contracts such as APIs, commands, or integration events. Each context should translate external data into its own model and should avoid direct access to another context's internal tables or domain objects.
