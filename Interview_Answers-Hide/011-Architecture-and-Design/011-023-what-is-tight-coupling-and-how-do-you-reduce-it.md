# 23. What is tight coupling, and how do you reduce it?

**Technology:** Architecture and Design

**Source question:** 23. What is tight coupling, and how do you reduce it?

## 1. What is it?

Tight coupling means one class or component depends heavily on the concrete details of another component.

For example, if a payment service creates a specific SQL repository and email sender inside its constructor, it cannot work without those exact implementations. A change to the database or notification provider may then require changes to the payment service as well.

Some coupling is unavoidable because components must collaborate. The goal is not zero coupling; it is to depend on small, stable contracts instead of implementation details.

## 2. Why is it important?

Tightly coupled code is harder to change, test, reuse, and deploy safely. A small change in one component can spread into many unrelated components.

Reducing unnecessary coupling helps teams:

- Replace an implementation without changing its consumers.
- Unit test business logic with simple test doubles.
- Keep responsibilities clear and changes local.
- Develop and deploy services more independently.
- Reduce the risk of one external dependency causing a wider failure.

For a senior developer or architect, this matters because systems normally outlive their original technology choices and integrations.

## 3. How does it work?

A common approach is to apply dependency inversion:

1. Identify the responsibility that the business component needs, such as storing a payment.
2. Define a small interface for that responsibility, such as `IPaymentRepository`.
3. Make the business component depend on the interface, not on SQL Server, Entity Framework Core, or another concrete class.
4. Implement the interface in an infrastructure component.
5. Register the interface and implementation with the .NET dependency injection container.
6. Let the container supply the dependency at runtime.

Other ways to reduce coupling include separating modules by business capability, publishing events when the caller does not need an immediate response, hiding third-party SDKs behind adapters, and avoiding shared databases between services.

These techniques should be used where change or testing needs justify them. Adding an interface around every class can create unnecessary complexity without reducing meaningful coupling.

## 4. Practical example

Consider a payment application that must notify customers after a successful payment. If `PaymentService` directly calls a particular email provider's SDK, the payment workflow depends on that vendor's API, configuration, and failure behavior.

Instead, the payment workflow can publish a `PaymentCompleted` event. A separate notification handler consumes the event and calls an `INotificationSender` adapter. The payment code no longer knows whether the message is sent through email, SMS, or another provider.

For production reliability, the payment and its outgoing event can be saved in the same database transaction using the transactional outbox pattern. A background worker later publishes the event. This reduces both code coupling and runtime coupling while avoiding a lost notification after a successful payment.

## 5. Scenario-based interview answer

“In one payment system, the checkout service directly created the SQL repository and called a vendor-specific email client. That made unit tests slow, and replacing the email provider required changes inside the payment workflow.

I separated the business logic from infrastructure. I introduced small interfaces for payment persistence and notification, injected the repository through the built-in .NET dependency injection container, and moved customer notification behind a payment-completed event. We used an outbox so the event was not lost if the broker was temporarily unavailable.

As a result, we could test payment decisions without a database or email provider, replace the notification vendor in one adapter, and retry notification failures without repeating the payment. I would not claim that the system had no coupling; it was deliberately coupled to stable business contracts instead of vendor details.”

## 6. Code example

```csharp
public sealed record PaymentRequest(decimal Amount, string AccountId);

public interface IPaymentRepository
{
    Task SaveAsync(Payment payment, CancellationToken cancellationToken);
}

public sealed class PaymentService(IPaymentRepository repository)
{
    public async Task<Guid> ProcessAsync(
        PaymentRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Amount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(request.Amount));
        }

        var payment = Payment.Create(request.AccountId, request.Amount);
        await repository.SaveAsync(payment, cancellationToken);

        return payment.Id;
    }
}

// Composition root, for example in Program.cs
builder.Services.AddScoped<IPaymentRepository, SqlPaymentRepository>();
builder.Services.AddScoped<PaymentService>();
```

`PaymentService` knows only the capability described by `IPaymentRepository`. It does not create `SqlPaymentRepository` or know how data is stored. The application composition root chooses the concrete implementation.

In a unit test, the interface can be replaced with a small fake repository. In production, the same business service receives the SQL implementation. Constructor injection also makes the dependency visible and prevents the service from being created in an invalid state.

## 7. Common mistakes

- Creating dependencies with `new` inside business classes instead of supplying them from the composition root.
- Using a service locator, which hides dependencies and moves coupling to runtime.
- Creating large “god interfaces” that expose unrelated operations and cause consumers to depend on too much.
- Adding an interface for every class even when there is no useful boundary or alternative behavior.
- Leaking Entity Framework entities, vendor SDK types, or transport models through business contracts.
- Sharing one database schema across services and assuming HTTP or messaging alone makes them independent.
- Using events when an immediate result is required, without handling eventual consistency, retries, duplicate messages, and observability.
- Confusing dependency injection with loose coupling. DI helps construct objects, but poor contracts can still leave the design tightly coupled.

## 8. Follow-up interview questions

### Is dependency injection the same as loose coupling?

No. Dependency injection is a technique for supplying dependencies. Loose coupling comes from good boundaries and stable, focused contracts; injected concrete details can still be tightly coupled.

### Should every class have an interface?

No. Add an interface at a meaningful boundary, such as infrastructure, an external provider, or behavior with multiple implementations. An interface with no design or testing benefit is usually extra maintenance.

### How do you reduce coupling between microservices?

Give each service ownership of its data and business capability, avoid shared databases, use versioned contracts, and use asynchronous events when immediate coordination is unnecessary. Also design for timeouts, retries, idempotency, and eventual consistency.
