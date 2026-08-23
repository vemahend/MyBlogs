# 42. How would you refactor a large service class?

**Technology:** C# Live Coding and LINQ

**Source question:** 42. How would you refactor a large service class?

## 1. What is it?

Refactoring a large service class means splitting a class that has too many responsibilities into smaller, focused parts without changing its expected behaviour.

I would not split it only because it has many lines. I would first find the separate reasons it changes. For example, validation, pricing, payment processing, data access, notification, and audit logging are different responsibilities. The original service can remain as a small coordinator that runs these parts in the correct order.

## 2. Why is it important?

A large service class often becomes difficult to understand, test, and change safely. A small payment rule may accidentally affect notification or persistence logic. The class may also need many dependencies, which is usually a sign that it is doing too much.

Focused components provide:

- clearer business boundaries;
- smaller and faster unit tests;
- safer changes with less regression risk;
- reusable rules and less duplicated code;
- simpler dependency injection and code review.

The goal is better cohesion and lower coupling, not simply creating more classes.

## 3. How does it work?

I refactor in small, behaviour-preserving steps:

1. Add tests around the current public behaviour, especially important failure paths.
2. Identify responsibilities and side effects. I look for groups such as validation, calculations, database access, external API calls, and mapping.
3. Extract pure business rules first because they are easiest to test.
4. Move infrastructure work behind focused interfaces, such as a payment gateway or repository.
5. Keep the application service as an orchestrator. It controls the use-case flow and transaction boundary.
6. Replace long conditional blocks with a strategy only when behaviours genuinely vary.
7. Run tests after every small extraction and compare logs, errors, and outputs where necessary.

LINQ is useful for collection operations such as filtering eligible transactions or calculating totals. I keep LINQ queries readable and avoid hiding database calls or other side effects inside them.

## 4. Practical example

Imagine a `PaymentService` that validates a request, calculates fees, selects a payment provider, charges the customer, saves the transaction, publishes an event, and sends an email.

I would extract request validation into `IPaymentValidator`, fee rules into `IFeeCalculator`, provider communication into `IPaymentGateway`, and persistence into `IPaymentRepository`. An outbox component would store the payment event in the same database transaction as the payment record. The refactored `PaymentService` would coordinate those components and return the result.

This keeps the business flow visible while preventing one class from owning every detail.

## 5. Scenario-based interview answer

“In one payment system, the checkout service had grown to more than a thousand lines. It handled validation, fee rules, gateway calls, database updates, and notifications. Changes were risky, and its unit tests needed many mocks.

My first decision was to preserve behaviour before changing the design. I added characterization tests for successful payments, declines, retries, and exceptions. I then grouped the code by responsibility and extracted the pure validation and fee calculation rules first. Next, I placed provider-specific behaviour behind gateway strategies and moved database access into a repository. I kept a small application service to coordinate the use case and made the transaction boundary explicit. Events were written through an outbox so a committed payment would not lose its notification event.

We delivered the refactor in small pull requests rather than rewriting the service. The result was simpler tests, fewer dependencies in the coordinator, and safer changes when we added another payment provider.”

## 6. Code example

```csharp
public sealed record PaymentRequest(
    Guid AccountId,
    decimal Amount,
    string Currency,
    string Provider);

public sealed record PaymentResult(Guid PaymentId, decimal Fee);

public interface IPaymentValidator
{
    void Validate(PaymentRequest request);
}

public interface IFeeCalculator
{
    decimal Calculate(decimal amount, string currency);
}

public interface IPaymentGateway
{
    string Provider { get; }
    Task ChargeAsync(PaymentRequest request, CancellationToken cancellationToken);
}

public interface IPaymentRepository
{
    Task SaveAsync(
        Guid paymentId,
        PaymentRequest request,
        decimal fee,
        CancellationToken cancellationToken);
}

public sealed class PaymentService(
    IPaymentValidator validator,
    IFeeCalculator feeCalculator,
    IEnumerable<IPaymentGateway> gateways,
    IPaymentRepository repository)
{
    public async Task<PaymentResult> PayAsync(
        PaymentRequest request,
        CancellationToken cancellationToken)
    {
        validator.Validate(request);

        var gateway = gateways.SingleOrDefault(gateway =>
            string.Equals(
                gateway.Provider,
                request.Provider,
                StringComparison.OrdinalIgnoreCase))
            ?? throw new NotSupportedException(
                $"Payment provider '{request.Provider}' is not supported.");

        var fee = feeCalculator.Calculate(request.Amount, request.Currency);
        await gateway.ChargeAsync(request, cancellationToken);

        var paymentId = Guid.NewGuid();
        await repository.SaveAsync(
            paymentId,
            request,
            fee,
            cancellationToken);

        return new PaymentResult(paymentId, fee);
    }
}
```

The service now shows the payment workflow without containing every implementation detail. Each dependency has one focused role. The LINQ `SingleOrDefault` makes the provider selection clear and also detects duplicate registrations by throwing if more than one gateway matches. In a larger system, I might build a provider dictionary during startup instead of searching the collection for every request.

The example uses primary constructors, supported for classes in C# 12 and later. With an older language version, the same dependencies can be assigned through a normal constructor.

## 7. Common mistakes

- Rewriting the whole class at once without tests or incremental releases.
- Splitting code by method size instead of by business responsibility.
- Creating many tiny interfaces that add indirection but no useful boundary.
- Moving methods to new classes while leaving all components tightly coupled.
- Putting business rules in controllers, repositories, or LINQ expressions that are hard to test.
- Hiding external calls or mutations inside LINQ operations.
- Ignoring transaction boundaries when database writes and event publication are separated.
- Changing public behaviour, exception types, or validation order accidentally during refactoring.
- Applying design patterns before confirming that the variation actually exists.

## 8. Follow-up interview questions

### How do you decide what to extract first?

I start with a responsibility that has a clear boundary and good test coverage. Pure validation or calculation logic is often the safest first extraction because it has few side effects.

### Should every extracted class have an interface?

No. I use an interface at a real boundary, when multiple implementations exist, or when it improves isolation from infrastructure. A simple internal helper with one stable implementation may not need one.

### How do you refactor without breaking production behaviour?

I add characterization tests, make small changes, run automated tests after each step, and use observability or feature flags for risky paths. I also preserve contracts and transaction behaviour until a deliberate change is agreed.
