# How Is Dependency Injection Different in Modern ASP.NET Core?

In **modern ASP.NET Core**, Dependency Injection (DI) is a **built-in part of the framework**. You normally don't need a third-party DI container such as Autofac, Unity, or Ninject for standard scenarios.

The biggest thing to understand for interviews is not just *what DI is*, but **how ASP.NET Core registers, creates, scopes, and disposes dependencies**.

## 1. Traditional Approach Without DI

Imagine `OrderService` needs a repository:

```csharp
public class OrderService
{
    private readonly OrderRepository _repository;

    public OrderService()
    {
        _repository = new OrderRepository();
    }
}
```

The problem is that `OrderService` is tightly coupled to `OrderRepository`.

```text
OrderService
     |
     └── creates OrderRepository itself
```

This makes unit testing and replacing implementations harder.

For example, you can't easily replace it with:

```text
FakeOrderRepository
```

or:

```text
CachedOrderRepository
```

## 2. Modern ASP.NET Core Approach

Instead, the class declares what it needs:

```csharp
public class OrderService
{
    private readonly IOrderRepository _repository;

    public OrderService(IOrderRepository repository)
    {
        _repository = repository;
    }
}
```

Now `OrderService` doesn't create the repository. ASP.NET Core creates it and injects it.

Register the dependency in `Program.cs`:

```csharp
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
```

ASP.NET Core understands:

```text
If someone asks for:
IOrderRepository

create:
OrderRepository
```

## 3. What Happens Internally?

Suppose you have:

```csharp
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }
}
```

And:

```csharp
public class OrderService : IOrderService
{
    private readonly IOrderRepository _repository;

    public OrderService(IOrderRepository repository)
    {
        _repository = repository;
    }
}
```

Registrations:

```csharp
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
```

When a request comes:

```text
GET /api/orders
       ↓
ASP.NET Core needs OrdersController
       ↓
OrdersController needs IOrderService
       ↓
DI Container checks registrations
       ↓
IOrderService → OrderService
       ↓
OrderService needs IOrderRepository
       ↓
IOrderRepository → OrderRepository
       ↓
Creates OrderRepository
       ↓
Creates OrderService(repository)
       ↓
Creates OrdersController(orderService)
```

This process is called **dependency resolution**.

## 4. DI Is Built Into ASP.NET Core

Older .NET Framework applications commonly used third-party containers such as:

- Unity
- Autofac
- Ninject
- StructureMap

Modern ASP.NET Core provides its own container through `IServiceCollection`.

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();

var app = builder.Build();
app.MapControllers();
app.Run();
```

The key object is `builder.Services`, which is an `IServiceCollection`.

## 5. Service Lifetimes

ASP.NET Core has three main DI lifetimes:

```csharp
AddTransient()
AddScoped()
AddSingleton()
```

### Transient

```csharp
builder.Services.AddTransient<IEmailService, EmailService>();
```

A new instance is created each time it is requested. This is useful for lightweight, stateless services.

### Scoped

```csharp
builder.Services.AddScoped<IOrderService, OrderService>();
```

One instance is created **per scope**. In a typical ASP.NET Core web app, one HTTP request corresponds to one scope.

```text
HTTP Request #1 → OrderService #1
HTTP Request #2 → OrderService #2
```

This is especially important with EF Core because `DbContext` is normally scoped:

```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});
```

### Singleton

```csharp
builder.Services.AddSingleton<ICacheService, CacheService>();
```

One instance exists for the lifetime of the application and is shared across requests. Singleton services must be designed carefully around shared state and thread safety.

## 6. Important Interview Problem: Captive Dependency

Consider:

```csharp
builder.Services.AddSingleton<ReportService>();
builder.Services.AddScoped<AppDbContext>();
```

Then:

```csharp
public class ReportService
{
    private readonly AppDbContext _dbContext;

    public ReportService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
}
```

This is problematic because a long-lived singleton is trying to capture a shorter-lived scoped dependency.

```text
ReportService (Singleton)
        ↓
AppDbContext (Scoped)
```

This is commonly called a **captive dependency**.

A useful lifetime rule is:

```text
Singleton
   ↓
should NOT directly depend on Scoped
```

## 7. DI Isn't Only for Your Own Classes

ASP.NET Core itself heavily uses DI.

```csharp
public class PaymentService
{
    private readonly ILogger<PaymentService> _logger;
    private readonly IConfiguration _configuration;

    public PaymentService(
        ILogger<PaymentService> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }
}
```

ASP.NET Core can inject framework services such as:

- `ILogger<T>`
- `IConfiguration`
- `IOptions<T>`
- `IHttpClientFactory`
- `IHostEnvironment`
- `IMemoryCache`

## 8. Constructor Injection Is Preferred

The recommended style is generally:

```csharp
public PaymentService(
    IPaymentRepository repository,
    ILogger<PaymentService> logger,
    IHttpClientFactory httpClientFactory)
{
    ...
}
```

rather than manually resolving services from `IServiceProvider`.

Constructor injection makes dependencies explicit and makes classes easier to unit test.

## 9. Extension-Method Based Registration

In real applications, you may not want many registrations sitting in `Program.cs`.

```csharp
public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services)
    {
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IUserService, UserService>();

        return services;
    }
}
```

Then `Program.cs` becomes simpler:

```csharp
builder.Services.AddApplicationServices();
```

## 10. Interview Answer

> Dependency Injection is built directly into modern ASP.NET Core. We register dependencies with `IServiceCollection`, usually in `Program.cs`, and the framework resolves the dependency graph using constructor injection. The built-in container also manages object lifetimes through Transient, Scoped, and Singleton registrations. Scoped is particularly important in web applications because services such as EF Core's `DbContext` normally live for the request scope. We also need to avoid lifetime problems, such as injecting a scoped `DbContext` directly into a singleton.

## Mental Model

```text
Registration
    ↓
IServiceCollection
    ↓
DI Container
    ↓
Dependency Resolution
    ↓
Constructor Injection
    ↓
Lifetime Management
    ↓
Transient / Scoped / Singleton
    ↓
Automatic Disposal
```

For senior .NET interviews, the next level is understanding **`IServiceProvider`, scopes, `IServiceScopeFactory`, `IDisposable`, keyed services, `IOptions<T>`, and why manually calling `BuildServiceProvider()` is usually a bad idea**.
