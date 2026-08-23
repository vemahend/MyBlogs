# 24. What is cohesion?

**Technology:** Architecture and Design

**Source question:** 24. What is cohesion?

## 1. What is it?

Cohesion describes how closely the responsibilities inside a class, module, or service belong together.

A highly cohesive component has one clear purpose. For example, a `PaymentValidator` validates payments and does not also send emails, create reports, and update customer profiles.

Low cohesion means unrelated responsibilities are mixed in the same place. Such a component often becomes a large “god class” that changes for many different reasons.

Cohesion is related to the Single Responsibility Principle, but they are not exactly the same. Cohesion measures how strongly the contents of a component belong together; the Single Responsibility Principle says that a component should have one reason to change.

## 2. Why is it important?

High cohesion makes code easier to understand, test, change, and reuse. A developer can usually identify what a component does from its name and can change one business area without accidentally affecting unrelated behavior.

It also helps teams work independently. In a large system, payment logic, notification logic, and reporting logic can evolve separately when each area has a clear boundary.

In production systems, high cohesion reduces risk because:

- Changes affect a smaller area of code.
- Unit tests can focus on one business responsibility.
- Failures are easier to locate.
- Components are less likely to depend on unrelated data or infrastructure.

High cohesion is normally combined with low coupling: keep related behavior together while keeping dependencies between components limited and explicit.

## 3. How does it work?

When designing a component, group data and behavior that support the same business capability.

For example, payment processing can be split into a simple flow:

1. `PaymentValidator` checks whether the request is valid.
2. `PaymentProcessor` coordinates the payment operation.
3. `PaymentRepository` stores payment data.
4. `PaymentNotificationService` sends the outcome to the customer.

Each component has a focused purpose. The processor coordinates the use case, but it delegates detailed work to cohesive collaborators.

A useful warning sign is a class that changes whenever several unrelated requirements change. If one class must be edited for payment rules, email templates, database queries, and audit formatting, its responsibilities probably do not belong together.

The goal is not to create a separate class for every method. The boundary should represent a meaningful business or technical responsibility.

## 4. Practical example

Consider an online banking transfer service. An early implementation has one `BankingService` that validates accounts, calculates fees, saves transfers, sends emails, and creates audit records.

That class has low cohesion because its methods serve several different purposes. A change to an email provider could require editing the same class that contains critical money-transfer rules.

A better design separates the responsibilities:

- `TransferValidator` handles transfer rules.
- `FeeCalculator` calculates transfer fees.
- `TransferRepository` persists transfer records.
- `TransferNotificationService` informs customers.
- `AuditWriter` records security and compliance events.

`TransferService` can coordinate these components. The transfer rules stay together, notification code stays together, and each part can be tested and changed with less risk.

## 5. Scenario-based interview answer

“In one payment system, we had a large service that validated payments, called the payment gateway, wrote database records, produced audit messages, and sent customer emails. Small changes were risky because the class had many unrelated reasons to change.

I decided to improve cohesion by separating the code around clear capabilities. We moved validation into a validator, gateway communication into a gateway client, persistence into a repository, and notifications into a notification service. The application service remained responsible for coordinating the payment use case and transaction outcome.

We introduced the change gradually and kept tests around the existing payment behavior. As a result, the classes became smaller and more focused, unit tests required fewer mocks, and changes to notifications no longer touched payment-processing logic. That is how I use cohesion in practice: related responsibilities stay together, while unrelated responsibilities get clear boundaries.”

## 6. Code example

```csharp
public sealed record PaymentRequest(
    Guid AccountId,
    decimal Amount,
    string Currency);

public interface IPaymentGateway
{
    Task<string> ChargeAsync(
        PaymentRequest request,
        CancellationToken cancellationToken);
}

public sealed class PaymentValidator
{
    public void Validate(PaymentRequest request)
    {
        if (request.AccountId == Guid.Empty)
            throw new ArgumentException("An account is required.");

        if (request.Amount <= 0)
            throw new ArgumentException("The amount must be greater than zero.");

        if (string.IsNullOrWhiteSpace(request.Currency))
            throw new ArgumentException("A currency is required.");
    }
}

public sealed class PaymentService(
    PaymentValidator validator,
    IPaymentGateway gateway)
{
    public async Task<string> ProcessAsync(
        PaymentRequest request,
        CancellationToken cancellationToken)
    {
        validator.Validate(request);

        return await gateway.ChargeAsync(request, cancellationToken);
    }
}
```

`PaymentValidator` contains only rules that validate a payment request. The gateway abstraction contains only payment-provider communication. `PaymentService` coordinates the use case instead of containing every implementation detail.

The primary-constructor syntax used by `PaymentService` is available in C# 12 and later. With an older supported language version, the same design can use a normal constructor without changing the cohesion of the classes.

## 7. Common mistakes

- Treating a small class as automatically cohesive. A small class can still mix unrelated responsibilities.
- Creating a “god service” that owns validation, persistence, messaging, logging, and business rules.
- Splitting code too aggressively into many tiny classes with no meaningful business boundary.
- Confusing cohesion with coupling. Cohesion is about responsibilities within a component; coupling is about dependencies between components.
- Grouping code only by technical type, such as putting all validators for unrelated business areas into one large class.
- Moving methods into separate classes while leaving shared state and unclear ownership behind.
- Using partial classes as a way to hide a low-cohesion class. Multiple files do not create a better responsibility boundary.

## 8. Follow-up interview questions

### What is the difference between cohesion and coupling?

Cohesion measures how well responsibilities inside one component belong together. Coupling measures how strongly one component depends on other components. A good design generally aims for high cohesion and low coupling.

### How can you identify low cohesion in an existing class?

Look for unrelated groups of methods, many injected dependencies, a vague name such as `CommonService`, and changes caused by different business requirements. Tests that require many unrelated mocks are another useful warning sign.

### Can cohesion become too high or lead to over-engineering?

The aim is focused, meaningful boundaries, not the maximum number of classes. Splitting every small operation into its own class can make the flow difficult to follow and increase unnecessary coupling. Design around responsibilities that change or operate together.
