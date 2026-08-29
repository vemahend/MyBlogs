# 44. What dependencies would you inject?

**Technology:** C# Live Coding and LINQ

**Source question:** 44. What dependencies would you inject?

## 1. What is it?

Dependencies are the services a class needs to do its work. Examples include a repository, payment gateway, clock, logger, or message publisher.

I would inject dependencies that represent external systems, changing business behaviour, or values that tests must control. I would normally use constructor injection because it makes the class's requirements clear and prevents it from being created in an invalid state.

I would not create an interface for every small helper. Pure, stable code such as simple mapping or formatting can remain inside the class when replacing it would provide no real benefit.

## 2. Why is it important?

If a service creates its own database connection, `HttpClient`, clock, or payment client, it becomes tightly coupled to those concrete details. Unit tests then need real infrastructure or unreliable global state.

Injecting the right dependencies gives us:

- clear responsibilities and visible requirements;
- easy replacement of infrastructure in tests;
- centralized configuration for HTTP clients, retries, logging, and database access;
- correct lifetime management through the .NET dependency injection container;
- easier replacement of one implementation without changing business logic.

The goal is not to maximize the number of injected objects. A constructor with many dependencies often tells us that the class has too many responsibilities.

## 3. How does it work?

First, I identify what the class actually needs. For a payment service, that may be a repository, an external gateway, a time source, and a logger.

I define small interfaces at boundaries where the application needs to remain independent of infrastructure or where tests need controlled behaviour. The concrete implementations are registered once in the application's composition root, usually `Program.cs`. The built-in .NET container creates the class and supplies its constructor arguments.

The lifetime must match the dependency:

- **Transient** creates an instance each time it is requested and suits lightweight, stateless services.
- **Scoped** creates one instance per scope. In ASP.NET Core, that is normally one per HTTP request; EF Core `DbContext` is commonly scoped.
- **Singleton** creates one instance for the application and must be thread-safe. It must not directly depend on a scoped service.

For HTTP integrations, I normally inject a typed client created by `IHttpClientFactory`, rather than manually creating `HttpClient` objects. For time-dependent logic on .NET 8 and later, `TimeProvider` is the standard testable time abstraction.

## 4. Practical example

A payment service must validate an idempotency key, check whether a request has expired, call a payment provider, save the result, and write logs.

I would inject an `IPaymentRepository`, an `IPaymentGateway`, `TimeProvider`, and `ILogger<PaymentService>`. The repository hides persistence details, the gateway isolates the external provider, the time provider makes expiry tests deterministic, and the logger uses the standard .NET logging pipeline.

I would pass request-specific values such as the amount, customer ID, idempotency key, and `CancellationToken` as method parameters. They are operation data, not service dependencies.

## 5. Scenario-based interview answer

“In a payment API, I found a service that created its own database context and HTTP client and read `DateTime.UtcNow` directly. That made tests slow and made the external provider configuration difficult to manage.

I decided to inject only the real boundaries: a payment repository, a typed payment-gateway client, `TimeProvider`, and `ILogger`. I kept the payment request and cancellation token as method parameters because they change for each call. I registered the repository and application service as scoped, configured the typed HTTP client through `IHttpClientFactory`, and used the framework-provided time abstraction.

In unit tests, we supplied controlled repository and gateway implementations and a fixed time provider. Integration tests covered the real database and HTTP adapters. The result was deterministic tests, centralized infrastructure configuration, and a service whose dependencies clearly described its responsibility.”

## 6. Code example

```csharp
public interface IPaymentRepository
{
    Task<bool> ExistsAsync(string idempotencyKey, CancellationToken token);
    Task SaveAsync(Payment payment, CancellationToken token);
}

public interface IPaymentGateway
{
    Task<string> ChargeAsync(decimal amount, CancellationToken token);
}

public sealed record Payment(
    string IdempotencyKey,
    decimal Amount,
    string ProviderReference,
    DateTimeOffset CreatedAt);

public sealed class PaymentService(
    IPaymentRepository repository,
    IPaymentGateway gateway,
    TimeProvider timeProvider,
    ILogger<PaymentService> logger)
{
    public async Task<Payment> ProcessAsync(
        string idempotencyKey,
        decimal amount,
        CancellationToken cancellationToken)
    {
        if (await repository.ExistsAsync(idempotencyKey, cancellationToken))
            throw new InvalidOperationException("Payment already processed.");

        string reference = await gateway.ChargeAsync(
            amount, cancellationToken);

        var payment = new Payment(
            idempotencyKey,
            amount,
            reference,
            timeProvider.GetUtcNow());

        await repository.SaveAsync(payment, cancellationToken);
        logger.LogInformation("Payment {Reference} saved", reference);

        return payment;
    }
}
```

Example registrations in `Program.cs`:

```csharp
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.AddScoped<PaymentService>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddHttpClient<IPaymentGateway, PaymentGateway>();
```

Constructor injection makes the required collaborators visible. `TimeProvider` keeps time-based tests predictable, and the typed HTTP client lets `IHttpClientFactory` manage handlers and configuration. The `CancellationToken` stays a method parameter because it belongs to one operation.

## 7. Common mistakes

- Injecting every helper behind an interface, which adds ceremony without creating a useful boundary.
- Injecting request data, such as an amount or customer ID, instead of passing it to the method.
- Giving one service too many dependencies instead of splitting its responsibilities.
- Injecting `IServiceProvider` and resolving services manually. This hides the real dependencies and uses the service-locator pattern.
- Registering a service with the wrong lifetime, especially injecting a scoped `DbContext` into a singleton.
- Creating `HttpClient` manually for every call instead of using a typed or named client where centralized configuration is needed.
- Mocking EF Core `IQueryable` behaviour and assuming it proves that a query translates to SQL. Translation and persistence still need integration tests.
- Hiding business rules inside repository or gateway implementations, which makes the application flow difficult to understand.

## 8. Follow-up interview questions

### Should every dependency have an interface?

No. Use an interface when it represents a useful boundary, has multiple implementations, or needs to be replaced in tests. Stable framework abstractions such as `ILogger<T>` and `TimeProvider` can be injected directly.

### Which dependency injection lifetime would you use for a service that uses EF Core?

Usually scoped, because EF Core `DbContext` is normally scoped to one request or unit of work. A singleton must not directly capture that scoped dependency.

### Would you inject a `CancellationToken` into the constructor?

Normally no. A cancellation token belongs to one operation, so pass it as the final method parameter and propagate it to database, HTTP, and other asynchronous calls.
