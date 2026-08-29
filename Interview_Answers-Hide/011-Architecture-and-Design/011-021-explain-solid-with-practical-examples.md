# 21. Explain SOLID with practical examples.

**Technology:** Architecture and Design

**Source question:** 21. Explain SOLID with practical examples.

## 1. What is it?

SOLID is a set of five design principles that help us create code that is easier to understand, test, change, and extend.

- **S — Single Responsibility Principle (SRP):** A class should have one main responsibility and one reason to change. For example, a payment service should process payments, not also create PDFs and send emails.
- **O — Open/Closed Principle (OCP):** Code should be open for extension but closed for modification. We should be able to add a new payment method without repeatedly changing stable payment-processing code.
- **L — Liskov Substitution Principle (LSP):** An implementation must safely replace the abstraction it implements. If code accepts an `IPaymentProcessor`, every implementation must behave according to that contract.
- **I — Interface Segregation Principle (ISP):** Prefer small, focused interfaces. A refund-only service should not be forced to implement unrelated payment or reporting methods.
- **D — Dependency Inversion Principle (DIP):** High-level business logic should depend on abstractions, not concrete infrastructure. A checkout service should depend on `IPaymentProcessor`, not directly on one bank SDK.

SOLID is guidance, not a rule that requires an interface or class for every small operation.

## 2. Why is it important?

Business systems change often. A payment application may gain a new provider, new fraud rules, or a different notification channel. If these concerns are tightly coupled, a small change can break unrelated behavior.

SOLID helps teams:

- keep business rules separate from infrastructure;
- add features with fewer changes to tested code;
- replace external services more safely;
- write focused unit tests;
- reduce large classes and risky conditional logic;
- allow different teams to work with clear contracts.

The practical goal is maintainability. SOLID does not automatically make an architecture good, but it gives developers useful ways to manage change.

## 3. How does it work?

Consider a payment flow:

1. The API receives a payment request.
2. `CheckoutService` applies the business workflow. This is its single responsibility.
3. It selects an `IPaymentProcessor` implementation based on the payment method.
4. Each processor follows the same contract, so it can be substituted safely.
5. Adding another processor extends the system without changing `CheckoutService`.
6. The service depends on interfaces supplied through .NET dependency injection, rather than creating bank SDK clients itself.
7. Separate, focused interfaces are used for payment processing, receipt delivery, and other capabilities.

The five principles support one another: focused responsibilities produce smaller contracts, and abstractions create safe extension points.

## 4. Practical example

Imagine an online banking platform that initially supports card payments. The first version puts validation, card-provider calls, database updates, receipt generation, and email delivery in one `PaymentService`.

When the bank adds account-to-account payments, developers add more `if` statements to the same class. The class becomes difficult to test, and changing email logic can accidentally affect payment processing.

A SOLID-based design separates the responsibilities:

- `CheckoutService` coordinates the use case.
- `IPaymentProcessor` defines the payment contract.
- `CardPaymentProcessor` and `AccountPaymentProcessor` implement that contract.
- `IReceiptSender` handles receipt delivery.
- Repositories handle persistence separately.

A new wallet processor can then be registered without rewriting the checkout workflow. Each processor must return the agreed result or a documented failure, so callers do not need provider-specific workarounds.

## 5. Scenario-based interview answer

**Problem:** “In one payment project, a large service handled provider calls, transaction storage, and customer notifications. Every new provider required changes to the same method, and releases were becoming risky.”

**Decision:** “I used SOLID as practical guidance. I separated orchestration from provider integration, created a small payment-processing contract, and kept notification and persistence behind their own focused abstractions.”

**Implementation:** “The checkout workflow depended on `IPaymentProcessor`. Card and bank-transfer processors implemented the same behavioral contract and were resolved by payment method. Dependencies were injected through the built-in .NET container. Adding a provider meant adding an implementation and registration rather than changing the core workflow. We also added contract tests to ensure every provider handled success, decline, timeout, and cancellation consistently.”

**Result:** “The classes became smaller, unit tests no longer called external providers, and adding the next payment method required much less change. I would also mention that I applied SOLID selectively; I did not introduce abstractions where there was no real responsibility or expected variation.”

## 6. Code example

```csharp
public sealed record PaymentRequest(decimal Amount, string Currency);
public sealed record PaymentResult(bool Succeeded, string TransactionId);

// ISP: this contract contains only payment-processing behavior.
public interface IPaymentProcessor
{
    Task<PaymentResult> ProcessAsync(
        PaymentRequest request,
        CancellationToken cancellationToken);
}

public interface IReceiptSender
{
    Task SendAsync(
        PaymentResult result,
        CancellationToken cancellationToken);
}

public sealed class CardPaymentProcessor : IPaymentProcessor
{
    public Task<PaymentResult> ProcessAsync(
        PaymentRequest request,
        CancellationToken cancellationToken)
    {
        // A real implementation would call the card provider safely.
        return Task.FromResult(new PaymentResult(true, Guid.NewGuid().ToString()));
    }
}

// SRP: this class coordinates checkout; it does not call a concrete bank SDK
// or contain email-delivery details.
public sealed class CheckoutService(
    IPaymentProcessor paymentProcessor,
    IReceiptSender receiptSender)
{
    public async Task<PaymentResult> PayAsync(
        PaymentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await paymentProcessor.ProcessAsync(request, cancellationToken);

        if (result.Succeeded)
        {
            await receiptSender.SendAsync(result, cancellationToken);
        }

        return result;
    }
}
```

Example registration with the built-in dependency injection container in supported modern .NET versions:

```csharp
builder.Services.AddScoped<IPaymentProcessor, CardPaymentProcessor>();
builder.Services.AddScoped<IReceiptSender, EmailReceiptSender>();
builder.Services.AddScoped<CheckoutService>();
```

`CheckoutService` follows DIP because it depends on abstractions. Another valid `IPaymentProcessor` can replace the card processor without changing the service, which supports LSP and OCP. The small interfaces demonstrate ISP, while separating checkout coordination from receipt delivery supports SRP.

In a system that chooses among several processors at runtime, use a factory, strategy resolver, or keyed dependency injection rather than injecting one fixed implementation.

## 7. Common mistakes

- Treating “single responsibility” as “a class may have only one method.” It means one cohesive responsibility or reason to change.
- Creating an interface for every class even when there is no useful boundary or variation.
- Claiming OCP while still editing a large `switch` statement whenever a provider is added.
- Violating LSP by making one implementation throw `NotSupportedException` for behavior promised by its interface.
- Creating broad interfaces such as `IPaymentManager` with payment, refund, reporting, email, and audit methods.
- Depending directly on database or provider SDK classes inside business workflows.
- Adding too many layers and abstractions, making a simple feature hard to follow.
- Assuming dependency injection alone means DIP is satisfied. The abstraction must represent the business need, not merely hide a concrete class.
- Ignoring production concerns such as idempotency, timeouts, retries, cancellation, logging, and consistent error contracts.

## 8. Follow-up interview questions

### Is SRP the same as one method per class?

No. A class can have several methods if they support one cohesive responsibility. The key question is whether the class changes for unrelated reasons.

### How can OCP be applied when supporting multiple payment providers?

Define a stable payment contract and create one implementation per provider. Add a new implementation and registration instead of changing the core checkout workflow.

### Can SOLID lead to over-engineering?

Yes. Too many small interfaces, factories, and layers can make simple code harder to understand. Apply SOLID where responsibilities differ, dependencies need isolation, or change is likely.
