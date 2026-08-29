# 3. How would you migrate a .NET Framework 4 application to modern .NET?

**Technology:** .NET Framework to Modern .NET

**Source question:** 3. How would you migrate a .NET Framework 4 application to modern .NET?

## 1. What is it?

Migrating a .NET Framework 4 application means moving it from the Windows-only .NET Framework runtime to modern .NET, such as .NET 10 LTS.

This is more than changing the target framework in the project file. It can include:

- Converting old project files to the SDK-style format.
- Replacing APIs and NuGet packages that modern .NET does not support.
- Moving from `web.config` and `Global.asax` to the modern configuration and hosting model.
- Replacing old ASP.NET, WCF server, Remoting, or Windows-only components where necessary.
- Retesting application behavior, security, performance, deployment, and operations.

The safest approach is usually an incremental migration, not a complete rewrite.

## 2. Why is it important?

.NET Framework is still supported as part of Windows, but it receives mainly security and reliability fixes. Modern .NET receives new runtime, language, cloud, container, performance, and observability improvements.

A migration can provide:

- Better performance and lower hosting cost.
- Side-by-side runtime versions, which reduce machine-wide upgrade risk.
- Cross-platform and container deployment where the application allows it.
- Current ASP.NET Core, dependency injection, configuration, logging, and testing support.
- Easier access to supported libraries and current security fixes.

For architects, the main value is reducing technical risk without interrupting the business. A working banking application should not be rewritten only because its runtime is old. The migration must protect customer data, transaction correctness, and service availability.

## 3. How does it work?

I would use the following flow:

1. **Assess the application.** Record the current .NET Framework version, application type, project dependencies, NuGet packages, Windows services, IIS features, COM components, database access, authentication, and deployment process. Add tests around critical behavior before changing it.
2. **Move to the latest practical .NET Framework version first.** If the application is on an early 4.x version, moving it to .NET Framework 4.8.1 can remove old package and API problems before the larger migration. This step depends on the supported Windows versions.
3. **Choose the migration boundary.** Separate business logic from UI, HTTP, file system, registry, and other platform-specific code. Shared libraries can often move before the web application.
4. **Check compatibility.** Review every package and API. Upgrade supported packages and replace unsupported technologies. For example, an ASP.NET MVC 5 application moves to ASP.NET Core MVC; a WCF server commonly moves to CoreWCF, gRPC, or HTTP APIs depending on client requirements.
5. **Convert projects.** Use SDK-style project files, central package management if useful, and explicit target frameworks. A library may temporarily multi-target `net481` and `net10.0` so both old and new applications can use it during the transition.
6. **Modernize the application host.** Move configuration to `appsettings.json`, environment variables, and a secret store. Register services with dependency injection. Replace `System.Web` middleware, session, authentication, and request handling with ASP.NET Core equivalents.
7. **Migrate in slices.** For a large application, place a proxy or gateway in front of the old and new applications. Route one feature at a time to modern .NET. This is often called the strangler pattern.
8. **Validate and release safely.** Run unit, integration, contract, security, load, and recovery tests. Compare old and new results for important transactions. Use canary or blue-green deployment, metrics, tracing, logs, and a tested rollback plan.

The exact target must be a supported version when the work begins. For a new migration in 2026, .NET 10 LTS is the normal default, unless a product or hosting dependency requires another supported version.

## 4. Practical example

Consider an ASP.NET MVC 5 payment application on .NET Framework 4.7.2. It uses Entity Framework 6, Forms Authentication, `web.config`, and a third-party fraud-checking library.

First, the team adds automated tests for payment validation, idempotency, fee calculation, and settlement. It then moves reusable payment rules into an SDK-style library that targets both `net481` and `net10.0`.

The team builds a new ASP.NET Core application on .NET 10. Authentication moves to OpenID Connect, secrets move to a managed secret store, and database access is upgraded only after checking query behavior. The old application and new application remain behind the same gateway. Read-only payment history moves first, followed by payment submission after contract, load, reconciliation, and failure tests pass.

For a controlled period, the new service can run calculations in shadow mode and compare its result with the old application without creating a second payment. Traffic is then increased gradually. Reconciliation checks confirm that no payment is lost or processed twice.

## 5. Scenario-based interview answer

**Problem:** “I inherited a business-critical .NET Framework 4 payment application. It had limited tests, old packages, and several `System.Web` dependencies, so an immediate rewrite would have been too risky.”

**Decision:** “I treated the work as a staged migration. I first documented dependencies and transaction flows, added tests around payment and reconciliation rules, and selected .NET 10 LTS as the target. I kept the existing database and public contracts stable initially so that we changed fewer things at once.”

**Implementation:** “We separated business logic from the MVC 5 application and temporarily multi-targeted shared libraries. We replaced unsupported packages, created an ASP.NET Core host, moved configuration and secrets out of `web.config`, and changed authentication to OpenID Connect. A gateway routed individual endpoints to either the old or new application. We released read operations first, then payment commands with idempotency, contract tests, shadow comparisons, monitoring, and a rollback route.”

**Result:** “We moved traffic in small steps without a long outage. Transaction reconciliation showed the same financial results, performance improved, and the team could retire the old application after a stable observation period. The important part was measuring business correctness, not just getting the solution to compile.”

## 6. Code example

During an incremental migration, a shared business library can temporarily support both runtimes:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFrameworks>net481;net10.0</TargetFrameworks>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
</Project>
```

The old application and the new application can then use the same payment rule while hosts are migrated:

```csharp
public sealed class PaymentLimitService
{
    public bool CanPay(decimal amount, decimal dailyTotal, decimal dailyLimit)
    {
        if (amount <= 0)
            return false;

        return dailyTotal + amount <= dailyLimit;
    }
}
```

`TargetFrameworks` creates one build for .NET Framework 4.8.1 and another for .NET 10. The shared code should remain independent of `System.Web`, the registry, and other framework-specific APIs. Multi-targeting is a temporary migration tool; after the old application is retired, remove `net481` so new code does not remain constrained by the old runtime.

## 7. Common mistakes

- Starting with a full rewrite without tests, dependency analysis, or measurable business acceptance criteria.
- Assuming that successful compilation proves compatibility. Authentication, serialization, dates, globalization, database queries, and transaction behavior may change.
- Trying to upgrade the runtime, UI, database, architecture, authentication, and deployment platform in one release.
- Expecting every .NET Framework technology to have a direct replacement. `System.Web`, ASP.NET Web Forms, WCF server features, Remoting, AppDomains, and some Windows-only APIs need design decisions.
- Upgrading NuGet packages without checking breaking changes, licenses, support policy, and transitive dependencies.
- Copying secrets from `web.config` into `appsettings.json` and committing them to source control.
- Ignoring rollback, data compatibility, idempotency, reconciliation, load testing, and production observability.
- Keeping multi-targeting and compatibility code forever instead of removing it after the migration.

## 8. Follow-up interview questions

### Would you rewrite the whole application?

Usually no. I would first isolate the business logic and migrate in small slices. A rewrite is justified only when the existing design cannot meet the business need and the organization accepts the higher delivery risk.

### What would you do with unsupported .NET Framework APIs?

I would identify why each API is used, then replace it with a modern equivalent or isolate it behind an interface. If a Windows-only dependency cannot yet move, I may keep that component on .NET Framework temporarily and communicate with it through a stable API or queue.

### How would you prove that the migration is safe?

I would combine automated tests, API contract tests, production-like load tests, security tests, transaction reconciliation, shadow comparisons, and a gradual traffic rollout. I would also define error-rate, latency, and business-correctness thresholds with an automatic or quick rollback path.
