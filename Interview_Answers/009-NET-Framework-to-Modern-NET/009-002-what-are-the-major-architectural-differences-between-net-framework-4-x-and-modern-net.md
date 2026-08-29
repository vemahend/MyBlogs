# 2. What are the major architectural differences between .NET Framework 4.x and modern .NET?

**Technology:** .NET Framework to Modern .NET

**Source question:** 2. What are the major architectural differences between .NET Framework 4.x and modern .NET?

## 1. What is it?

.NET Framework 4.x and modern .NET use the same basic idea—C# code is normally compiled to Intermediate Language and executed by a managed runtime—but their overall architectures are different.

- **.NET Framework 4.x** is a Windows-only, machine-installed platform. It has one large framework library and is closely connected to Windows technologies such as IIS, `System.Web`, Windows Forms, WPF, WCF, the registry, and the Global Assembly Cache (GAC).
- **Modern .NET** is the cross-platform platform that grew from .NET Core. It uses CoreCLR, SDK-style projects, NuGet-based dependencies, and modular application frameworks such as ASP.NET Core. It is designed for side-by-side deployment, containers, cloud workloads, and independent application updates.

As of 2026, .NET Framework 4.8.1 is the latest .NET Framework release, while .NET 10 is the current Long Term Support (LTS) release of modern .NET. Moving between them is an architectural migration, not simply changing a version number.

## 2. Why is it important?

These differences affect how an application is designed, hosted, deployed, scaled, secured, and maintained.

For example, a .NET Framework web application may depend on IIS, `web.config`, `System.Web`, static application state, and Windows authentication. A modern ASP.NET Core service normally uses an explicit middleware pipeline, built-in dependency injection, environment-based configuration, and a self-hosted web server that can run behind different reverse proxies.

Understanding the architecture helps a team:

- Estimate migration effort correctly.
- Find Windows-only and unsupported dependencies early.
- Decide which parts can be moved and which must be redesigned.
- Use containers and independent services safely.
- Avoid treating a working legacy application as if it were already cloud-ready.

## 3. How does it work?

The main architectural differences are:

| Area | .NET Framework 4.x | Modern .NET |
|---|---|---|
| Runtime | Uses the Windows .NET Framework CLR | Uses CoreCLR and runs on Windows, Linux, and macOS |
| Installation | Framework 4.x is installed for the machine; later 4.x versions replace earlier 4.x versions | Runtime versions can exist side by side, or an application can carry its own runtime |
| Libraries | A large framework is installed with Windows; older applications may use the GAC | Application dependencies are normally declared in the project and restored through NuGet |
| Web architecture | ASP.NET uses `System.Web`, IIS modules, handlers, and `web.config` | ASP.NET Core uses an ordered middleware pipeline and the Kestrel web server, often behind a reverse proxy |
| Hosting | Strongly tied to Windows and, for classic ASP.NET, IIS | Uses a generic host for web apps, workers, configuration, logging, DI, and application lifetime |
| Configuration | Commonly uses XML files such as `app.config` and `web.config` | Combines JSON, environment variables, command-line values, secret stores, and custom providers |
| Deployment | Applications commonly rely on the machine-installed framework | Supports framework-dependent, self-contained, single-file, trimmed, and Native AOT deployment where suitable |
| Application models | Includes Web Forms, ASP.NET MVC 5, WCF server, and Windows Workflow Foundation | Uses ASP.NET Core, worker services, gRPC, minimal APIs, Blazor, and other modern models; some old models have no direct replacement |
| Platform APIs | Many APIs assume Windows | Most base APIs are cross-platform; Windows-specific APIs remain available only where supported |
| Release model | Serviced as a Windows component | Ships on a regular release cycle with STS and LTS releases |

At startup, a modern .NET application uses the .NET host to select the requested runtime, reads its dependency and runtime configuration files, loads the application, and starts the generic host. The host builds services and configuration, starts logging and hosted services, and, for ASP.NET Core, runs the HTTP middleware pipeline.

In a classic ASP.NET Framework application, IIS and `System.Web` manage much of that lifecycle. Requests pass through IIS modules and ASP.NET handlers before reaching Web Forms, MVC, or Web API code. This hidden, tightly integrated pipeline is one reason that `System.Web` applications cannot be directly retargeted to ASP.NET Core.

## 4. Practical example

Consider a bank payment API built with ASP.NET Web API 2 on .NET Framework 4.7.2. It runs only in IIS, reads settings from `web.config`, uses the GAC for a vendor assembly, and stores session data in the web process.

To run the service in Linux containers, the team moves it to ASP.NET Core on .NET 10 LTS. They replace `System.Web` components with middleware, register services through dependency injection, move configuration to environment variables and a managed secret store, and replace in-process session state with a distributed store. The vendor assembly must be upgraded or isolated if it still requires Windows.

Each container now carries the application and its declared dependencies. Instances are stateless, can start independently, and can scale horizontally behind a load balancer. The business rules may be reusable, but the hosting, configuration, and request pipeline need deliberate redesign.

## 5. Scenario-based interview answer

**Scenario:** An interviewer asks how I would approach the architecture of a .NET Framework payment service that must move to a container platform.

**Answer:**

“The problem was not only the runtime version. The service depended on `System.Web`, IIS lifecycle events, machine-level configuration, and Windows-only libraries, so changing the target framework would not make it portable.

My decision was to separate portable business logic from framework-specific hosting code and migrate in controlled stages. I first created characterization tests and inventoried NuGet packages, GAC assemblies, authentication, configuration, and operating-system dependencies.

For implementation, we moved the HTTP layer to ASP.NET Core, rebuilt the request flow as explicit middleware, used the built-in DI container, and moved secrets out of `web.config`. We removed in-memory state so multiple container instances could process requests safely. Where a vendor component was still Windows-only, we kept it behind a temporary internal adapter instead of hiding that constraint.

The result was a service that could run side by side with the legacy application, deploy independently, and scale on Linux containers. More importantly, we reduced migration risk because we changed the platform boundary without rewriting tested payment rules at the same time.”

## 6. Code example

This small ASP.NET Core example shows several modern .NET architectural ideas:

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<PaymentService>();

var app = builder.Build();

app.Use(async (context, next) =>
{
    context.Response.Headers["X-Correlation-Id"] =
        context.TraceIdentifier;

    await next(context);
});

app.MapPost("/payments", async (
    PaymentRequest request,
    PaymentService service,
    CancellationToken cancellationToken) =>
{
    var paymentId = await service.AuthorizeAsync(
        request.Amount,
        cancellationToken);

    return Results.Accepted($"/payments/{paymentId}", new { paymentId });
});

app.Run();

public sealed record PaymentRequest(decimal Amount);

public sealed class PaymentService
{
    public Task<Guid> AuthorizeAsync(
        decimal amount,
        CancellationToken cancellationToken)
    {
        if (amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(amount));

        return Task.FromResult(Guid.NewGuid());
    }
}
```

`WebApplication` sets up the modern generic host, configuration, logging, dependency injection, and Kestrel. `Use` adds explicit middleware in a known order, while `MapPost` defines an endpoint. `PaymentService` is supplied by dependency injection rather than being obtained from static application state. In production, payment authorization and idempotency would use durable storage rather than generating an ID in memory.

## 7. Common mistakes

- Treating migration as a project-file conversion without checking `System.Web`, GAC, COM, registry, Windows authentication, and other platform dependencies.
- Assuming .NET Standard means an entire .NET Framework application can run on modern .NET. It only provides a shared API contract for compatible libraries.
- Copying IIS modules or `HttpContext.Current` patterns into ASP.NET Core instead of redesigning them as middleware and request-scoped services.
- Keeping session, cache, or singleton state in one process when the new service will run across several containers.
- Choosing self-contained deployment but forgetting that the team must patch and republish the bundled runtime.
- Enabling trimming or Native AOT without testing libraries that depend on reflection or dynamic code generation.
- Assuming modern .NET makes every library cross-platform; native and Windows-specific dependencies can still restrict the application.
- Rewriting hosting code and business rules together without tests, making failures difficult to isolate.

## 8. Follow-up interview questions

### Why can modern .NET versions run side by side while .NET Framework 4.x versions generally cannot?

Modern .NET applications declare a runtime version and the host selects an installed compatible runtime, or the application includes its own runtime. .NET Framework 4.x is a Windows component and uses in-place updates for the 4.x line.

### Is CoreCLR completely different from the .NET Framework CLR?

They provide the same core managed-runtime responsibilities, including JIT compilation, garbage collection, type safety, and exception handling. CoreCLR was designed as the modular, cross-platform runtime for modern .NET and continues to receive new runtime features and performance work.

### Can every .NET Framework application be migrated to modern .NET?

Not by direct retargeting. Portable business libraries may move easily, but applications using Web Forms, `System.Web`, WCF server, Windows Workflow Foundation, or unsupported vendor components need replacements, isolation, or architectural redesign.
