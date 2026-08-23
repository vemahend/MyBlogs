# 20. What is dependency inversion?

**Technology:** Architecture and Design

**Source question:** 20. What is dependency inversion?

## 1. What is it?

Dependency Inversion is the **D** in SOLID. It says:

- High-level business logic should not depend directly on low-level technical code. Both should depend on abstractions.
- Abstractions should not depend on implementation details. Implementations should follow the abstractions.

In simple terms, business code should depend on a contract such as `IPaymentGateway`, not directly on a specific class such as `StripePaymentGateway`.

Dependency inversion is a design principle. Dependency injection is one common technique used to apply that principle.

## 2. Why is it important?

Without dependency inversion, business logic becomes tightly coupled to databases, external APIs, email providers, or frameworks. Changing a provider can then require changes throughout the application.

Depending on small, business-focused interfaces makes the code easier to:

- change when an external provider changes;
- test without calling real infrastructure;
- maintain because responsibilities are separated;
- reuse with different implementations.

This is especially important in banking and payment systems, where providers, regulations, and integration details can change while the core business rules should remain stable.

## 3. How does it work?

The normal flow is:

1. The application or domain layer defines the capability it needs, for example `IPaymentGateway`.
2. An infrastructure class implements that interface, for example `BankPaymentGateway`.
3. The application service receives the interface through its constructor.
4. The .NET dependency injection container creates the selected implementation and passes it to the service.
5. The service calls the abstraction and does not know the provider's internal details.

The important inversion is ownership: the business layer owns the contract that infrastructure follows. The source-code dependency therefore points toward the business rules, even though the runtime call eventually reaches infrastructure.

## 4. Practical example

Consider a payment service that must charge a customer's card. If `PaymentService` creates a specific gateway client directly, it is tied to that provider. Switching providers or testing a declined payment becomes difficult.

Instead, the application defines `IPaymentGateway`. The production implementation calls the external gateway, while tests use a fake implementation. The payment service handles business rules such as payment status and failure handling without knowing HTTP endpoints, credentials, or provider SDK details.

## 5. Scenario-based interview answer

**Problem:** In a payment platform, the checkout service directly created a third-party gateway client. Unit tests made external calls, and adding a backup provider required changes inside the checkout workflow.

**Decision:** I applied dependency inversion by defining an `IPaymentGateway` contract in the application layer. The contract described what the business process needed rather than exposing provider-specific types.

**Implementation:** I created separate primary and backup gateway adapters in the infrastructure layer and registered the required implementation with .NET dependency injection. The checkout service accepted `IPaymentGateway` through constructor injection. Tests supplied a fake gateway to simulate approval, decline, and timeout results.

**Result:** The checkout rules became independent of provider code, tests became fast and reliable, and we could replace or select a gateway without rewriting the core workflow.

## 6. Code example

```csharp
public interface IPaymentGateway
{
    Task<PaymentResult> ChargeAsync(
        decimal amount,
        CancellationToken cancellationToken);
}

public sealed record PaymentResult(bool Succeeded, string Reference);

public sealed class PaymentService
{
    private readonly IPaymentGateway _gateway;

    public PaymentService(IPaymentGateway gateway)
    {
        _gateway = gateway;
    }

    public async Task<PaymentResult> PayAsync(
        decimal amount,
        CancellationToken cancellationToken)
    {
        if (amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(amount));

        return await _gateway.ChargeAsync(amount, cancellationToken);
    }
}

public sealed class BankPaymentGateway : IPaymentGateway
{
    public Task<PaymentResult> ChargeAsync(
        decimal amount,
        CancellationToken cancellationToken)
    {
        // A real adapter would call the bank API here.
        return Task.FromResult(new PaymentResult(true, "BANK-12345"));
    }
}

// Program.cs
builder.Services.AddScoped<IPaymentGateway, BankPaymentGateway>();
builder.Services.AddScoped<PaymentService>();
```

`PaymentService` depends only on `IPaymentGateway`. `BankPaymentGateway` contains the technical integration, and the built-in .NET dependency injection container connects the contract to that implementation. A test can provide a fake `IPaymentGateway` without changing `PaymentService`.

## 7. Common mistakes

- Confusing dependency inversion with dependency injection. Injection supplies an object; inversion is the wider design principle about dependency direction.
- Creating interfaces for every class, even when there is no useful boundary or variation.
- Defining provider-specific interfaces in the business layer, which leaks infrastructure details into the abstraction.
- Using a service locator instead of constructor injection, which hides the service's real dependencies.
- Registering an implementation with the wrong DI lifetime, such as injecting a scoped dependency into a singleton.
- Making interfaces too large. Small, focused contracts are easier to implement and test.
- Treating dependency inversion as a replacement for correct retries, timeouts, logging, and error handling around external systems.

## 8. Follow-up interview questions

### What is the difference between dependency inversion and dependency injection?

Dependency inversion is a design principle that makes high-level and low-level code depend on abstractions. Dependency injection is a technique for providing those dependencies from outside a class.

### Should every class have an interface?

No. Use an interface where it creates a meaningful boundary, supports multiple implementations, isolates infrastructure, or improves testing. An interface with no design purpose only adds complexity.

### Where should the interface be defined in Clean Architecture?

Usually in the inner layer that needs the capability, such as the application layer. The outer infrastructure layer implements it, so the compile-time dependency points inward.
