# 10. How is dependency injection different in modern ASP.NET Core?

**Technology:** .NET Framework to Modern .NET

**Source question:** 10. How is dependency injection different in modern ASP.NET Core?

## 1. What is it?

Dependency injection (DI) means that a class receives the services it needs instead of creating them itself.

In classic ASP.NET on .NET Framework, there was no single built-in DI approach for the whole application. Teams commonly used third-party containers such as Autofac, Unity, Ninject, or StructureMap and connected them to MVC or Web API through framework-specific dependency resolvers.

Modern ASP.NET Core includes DI as a core platform feature. Services are registered in `IServiceCollection`, the framework builds an `IServiceProvider`, and dependencies can be injected into controllers, minimal API handlers, middleware, hosted services, and other application classes.

## 2. Why is it important?

Built-in DI gives the application one consistent way to create and manage services. It reduces boilerplate and makes code easier to test because business classes depend on interfaces instead of creating databases, HTTP clients, loggers, or other infrastructure directly.

It also manages object lifetimes. For example, one service can be created for every request, another for every use, and another once for the whole application. This is especially important for database contexts, request-specific user data, caches, and thread-safe shared services.

For migration projects, the main architectural change is not simply replacing one container API with another. The team must review registrations, lifetimes, request scopes, disposal, and any advanced features that were specific to the old container.

## 3. How does it work?

The usual flow is:

1. At startup, the application adds service registrations to `builder.Services`.
2. Each registration maps a service type to an implementation, factory, or existing instance and defines its lifetime.
3. `builder.Build()` creates the application and its root service provider.
4. ASP.NET Core creates a dependency-injection scope for each HTTP request.
5. When an endpoint, controller, or service is activated, the provider resolves its constructor dependencies recursively.
6. At the end of the request, scoped services created in that request are disposed automatically.

The standard lifetimes are:

- **Transient:** a new instance is created each time it is requested.
- **Scoped:** one instance is used within one request scope.
- **Singleton:** one instance is normally used for the application's lifetime.

Constructor injection is the preferred approach because it makes required dependencies clear. Modern .NET also supports keyed services, available from .NET 8, when an application needs multiple named implementations of the same service type. A third-party container is still possible when the built-in container does not provide a genuinely required advanced feature.

## 4. Practical example

Consider a payment API. `PaymentService` needs a repository, a fraud-check client, and a logger.

The repository uses an EF Core `DbContext`, so both are registered as scoped. They then share the same context during one payment request. The fraud-check integration uses a typed `HttpClient`, created through `IHttpClientFactory`, so connections are managed correctly. Logging is already registered by the framework.

The payment service only knows the interfaces. Tests can therefore supply fake repository and fraud-check implementations without connecting to a real database or external provider.

## 5. Scenario-based interview answer

**Problem:** In a .NET Framework payment application, MVC and Web API used different dependency resolvers, and several services created repositories manually. Object ownership was unclear, and database connections sometimes remained open longer than expected.

**Decision:** During migration to ASP.NET Core, I chose the built-in DI container as the default and used constructor injection consistently. I did not carry the old container into the new service because its advanced features were not actually needed.

**Implementation:** I moved registrations into small extension methods grouped by application area. I registered EF Core repositories and business services as scoped, stateless lightweight services as transient where appropriate, and only thread-safe shared components as singleton. External APIs used typed `HttpClient` registrations. I also added startup validation and tests that resolved key service graphs.

**Result:** Service creation became consistent across controllers, minimal APIs, and background processing. Unit tests became simpler, disposal was handled by the framework, and lifetime-related production issues were easier to identify.

A natural interview summary would be: “Modern ASP.NET Core has DI built into the hosting and request pipeline. The important migration work is to choose correct lifetimes and remove service-locator patterns, not just translate registrations from Unity or Autofac into `AddScoped` calls.”

## 6. Code example

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<PaymentsDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Payments")));

builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.AddScoped<IPaymentService, PaymentService>();

builder.Services.AddHttpClient<IFraudClient, FraudClient>(client =>
    client.BaseAddress = new Uri(builder.Configuration["FraudApi:BaseUrl"]!));

var app = builder.Build();

app.MapPost("/payments", async (
    CreatePaymentRequest request,
    IPaymentService paymentService,
    CancellationToken cancellationToken) =>
{
    var result = await paymentService.CreateAsync(request, cancellationToken);
    return Results.Created($"/payments/{result.Id}", result);
});

app.Run();
```

`AddDbContext` registers `PaymentsDbContext` as scoped by default. The repository and payment service are also scoped, so one request uses one consistent service graph. `AddHttpClient` uses `IHttpClientFactory` to manage handlers and avoids creating and disposing `HttpClient` manually for every call. The minimal API handler receives `IPaymentService` directly from DI.

In a real application, these registrations can be placed in extension methods to keep `Program.cs` readable.

## 7. Common mistakes

- Injecting a scoped service, such as `DbContext`, into a singleton. The scoped object can be retained beyond its valid lifetime.
- Making a service singleton only for performance without confirming that it is thread-safe and does not hold request-specific state.
- Calling `BuildServiceProvider()` during registration. This creates a second container and can duplicate singleton instances or break disposal.
- Using `IServiceProvider` everywhere as a service locator instead of declaring dependencies in constructors.
- Resolving scoped services from the root provider in a background service. Create a scope with `IServiceScopeFactory` for each unit of work.
- Registering every class automatically without understanding its lifetime or ownership.
- Assuming the built-in container behaves exactly like Autofac, Unity, or another legacy container. Features and registration rules can differ.

## 8. Follow-up interview questions

### What lifetime should an EF Core `DbContext` use?

Scoped is the normal choice for web applications. One context can then represent one request or unit of work. `AddDbContext` uses scoped lifetime by default.

### Can a singleton use a scoped service?

Not through normal constructor injection. The singleton would keep the scoped instance too long. If a singleton or hosted service must run scoped work, it should create a scope with `IServiceScopeFactory`, resolve the service inside that scope, and dispose the scope after the work completes.

### When would you still use a third-party DI container?

Use one only when the application needs a container feature that the built-in provider does not reasonably support, such as particular interception or advanced registration behavior. For most ASP.NET Core applications, the built-in container is sufficient and simpler to maintain.
