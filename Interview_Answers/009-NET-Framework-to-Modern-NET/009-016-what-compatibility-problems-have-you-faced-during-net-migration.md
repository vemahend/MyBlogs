# 16. What compatibility problems have you faced during .NET migration?

**Technology:** .NET Framework to Modern .NET

**Source question:** 16. What compatibility problems have you faced during .NET migration?

## 1. What is it?

Compatibility problems happen when code, libraries, configuration, or runtime behavior from .NET Framework does not work in modern .NET in the same way.

The language may still be C#, but the runtime and application model are different. Common examples I have faced are:

- `System.Web`, `HttpContext.Current`, ASP.NET modules, and `web.config` behavior are not available in ASP.NET Core.
- Old NuGet packages may support only .NET Framework or may depend on Windows-only APIs.
- WCF server hosting, .NET Remoting, Code Access Security, and multiple application domains are not supported in the same form.
- Entity Framework Core is not a drop-in replacement for Entity Framework 6. Queries, mappings, lazy loading, and transaction behavior can differ.
- Older serialization code can fail. For example, `BinaryFormatter` is unsafe, and its implementation was removed in .NET 9.
- Authentication, dependency injection, logging, configuration, and request processing use different APIs.
- Some code compiles but behaves differently because of culture, time zone, file paths, TLS, garbage collection, or asynchronous execution.

## 2. Why is it important?

A migration is not complete just because the solution builds. A hidden compatibility issue can cause incorrect payments, failed authentication, data loss, or production outages.

We need to identify these problems early so that we can:

- estimate the migration properly;
- decide whether to replace, isolate, upgrade, or temporarily keep a component;
- protect important business behavior with tests;
- avoid moving unsupported or insecure technology into the new system; and
- plan a gradual migration instead of attempting a risky big-bang release.

For an architect, compatibility findings also affect hosting. A service that depends on the Windows registry, COM, or integrated Windows authentication may need Windows containers or Windows hosts until that dependency is removed.

## 3. How does it work?

I normally handle compatibility in the following flow:

1. **Inventory the application.** I list target frameworks, NuGet packages, project types, IIS features, Windows dependencies, database providers, and external integrations.
2. **Run analysis tools.** I use build warnings and migration analyzers, such as the .NET Upgrade Assistant tooling, to find unsupported APIs and package problems. The report is a starting point, not proof that the application is compatible.
3. **Classify each issue.** I group it as source-code, package, platform, configuration, data, or behavior compatibility.
4. **Choose a treatment.** I upgrade the package, replace the API, introduce an adapter, multi-target a shared library, or keep a legacy service behind an API temporarily.
5. **Migrate the hosting model.** For ASP.NET applications, middleware replaces many modules and handlers, built-in dependency injection replaces service locators, and configuration moves to `appsettings.json`, environment variables, or a secret store.
6. **Verify behavior.** I run unit, integration, contract, database, security, and performance tests. I compare critical outputs between the old and new applications.
7. **Release gradually.** I use a strangler approach, feature flags, or traffic splitting, with monitoring and a rollback path.

The target framework matters. A library can multi-target .NET Framework 4.8.1 and modern .NET while consumers are migrated gradually. However, multi-targeting does not make an unsupported API portable; platform-specific code still needs to be isolated or replaced.

## 4. Practical example

Consider a payment application built on ASP.NET MVC 5 and .NET Framework. It reads the current customer from `HttpContext.Current`, uses an old payment SDK, stores session state in-process, and writes audit messages through a WCF service.

During migration to ASP.NET Core, these problems appear:

- `HttpContext.Current` no longer exists.
- In-process session data is lost when the application scales across instances.
- The payment SDK supports only .NET Framework.
- ASP.NET Core cannot host the existing WCF server in the original way.

I would move user access behind a small interface, use claims from the current ASP.NET Core request, and store only necessary session data in a distributed cache. I would upgrade or replace the payment SDK. For WCF, I would first keep the legacy audit service behind an adapter, then move the contract to HTTP or messaging. Contract and reconciliation tests would confirm that payment amounts, idempotency keys, customer identities, and audit records remain unchanged.

## 5. Scenario-based interview answer

“In one migration, we moved a payment API from ASP.NET MVC on .NET Framework to ASP.NET Core. The main problems were not C# syntax; they were framework and behavior dependencies. The application used `System.Web`, static access to the current request, an old Framework-only payment package, WCF, and Entity Framework 6 lazy loading.

My decision was to migrate in stages rather than rewrite everything at once. We first added characterization and contract tests around payment authorization, refunds, and reconciliation. We introduced interfaces around request context, the payment provider, and the WCF client. That allowed the old and new implementations to run behind the same business layer.

In the modern service, we used ASP.NET Core middleware and dependency injection, replaced request statics with claims passed through a scoped service, upgraded the provider SDK, and made database loading explicit so query behavior was clear. The WCF integration stayed behind an adapter during the first release and was later replaced with messaging.

We ran both paths for selected traffic and compared transaction and audit results. The migration was released incrementally, payment behavior stayed consistent, and the remaining legacy dependency could be removed without blocking the main upgrade.”

## 6. Code example

The following adapter removes a direct dependency on `HttpContext.Current` from business code:

```csharp
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

public interface ICurrentUser
{
    string? CustomerId { get; }
}

public sealed class HttpCurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public string? CustomerId =>
        accessor.HttpContext?.User.FindFirstValue("customer_id");
}

// Program.cs
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, HttpCurrentUser>();

public sealed class PaymentService(ICurrentUser currentUser)
{
    public Task AuthorizeAsync(decimal amount, CancellationToken cancellationToken)
    {
        var customerId = currentUser.CustomerId
            ?? throw new UnauthorizedAccessException("Customer identity is missing.");

        // Call the payment provider using customerId, amount, and an idempotency key.
        return Task.CompletedTask;
    }
}
```

`IHttpContextAccessor` is the ASP.NET Core replacement when code genuinely needs access to the current HTTP context. The business service depends on the small `ICurrentUser` abstraction instead of ASP.NET APIs, which makes it easier to test and reuse. The null check is important because background jobs do not have an HTTP request. For new code, passing the required customer ID directly to the use case is even clearer when practical.

## 7. Common mistakes

- Assuming that a successful compilation proves runtime compatibility.
- Upgrading the target framework and every NuGet package in one large change, making failures difficult to isolate.
- Using the Windows Compatibility Pack as a permanent answer without checking Linux or container requirements.
- Replacing EF6 with EF Core without testing generated SQL, decimal precision, loading behavior, migrations, and transactions.
- Copying `web.config` settings without mapping their meaning to ASP.NET Core configuration and middleware.
- Continuing to use unsafe serialization. `BinaryFormatter` should be replaced with a safe, explicit format such as `System.Text.Json`; in .NET 9 its in-box implementation no longer works.
- Treating authentication as a mechanical API change and failing to test claims, cookies, token validation, data-protection keys, and proxy headers.
- Blocking asynchronous code with `.Result` or `.Wait()`, which can cause thread starvation even though ASP.NET Core has no classic ASP.NET synchronization context.
- Forgetting non-code dependencies such as IIS modules, certificates, registry access, COM, file shares, fonts, and native DLL architecture.
- Rewriting working business logic before creating characterization, contract, and reconciliation tests.

## 8. Follow-up interview questions

### How do you find incompatible APIs before migration?

I combine automated analysis with a dependency inventory and a clean build for the target framework. I then verify the findings using integration and behavior tests because analyzers cannot detect every configuration or runtime difference.

### Would you migrate EF6 to EF Core at the same time?

Not automatically. EF6 can run on modern .NET for many applications. If changing both the runtime and the data-access behavior creates too much risk, I first move to a supported EF6 version, stabilize the runtime migration, and treat EF Core as a separate change.

### What do you do when a critical library supports only .NET Framework?

I first look for a supported version or replacement. If neither is immediately possible, I isolate it behind an interface or a small legacy service and communicate through HTTP or messaging. That lets the main application migrate while giving the legacy dependency a clear removal plan.
