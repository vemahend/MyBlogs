# 1. What is the difference between .NET Framework and modern .NET?

**Technology:** .NET Framework to Modern .NET

**Source question:** 1. What is the difference between .NET Framework and modern .NET?

## 1. What is it?

.NET Framework and modern .NET are two generations of Microsoft's development platform.

- **.NET Framework** is the original, Windows-only platform. It is used mainly by existing applications built with technologies such as ASP.NET Web Forms, ASP.NET MVC 5, WCF server, and Windows Workflow Foundation. Its latest version is .NET Framework 4.8.1. Microsoft supports it as part of Windows, but it is not the preferred platform for new server applications.
- **Modern .NET** is the continuation of .NET Core. It includes .NET 5 and later versions. It is cross-platform, open source, designed for cloud and container workloads, and supports side-by-side runtime versions. As of 2026, .NET 10 is the current Long Term Support (LTS) release.

They share C# and many base libraries, but they are different runtimes and have different application models. Moving an application from .NET Framework to modern .NET is therefore usually a migration, not just a version upgrade.

## 2. Why is it important?

The choice affects operating systems, deployment, performance, cloud support, maintenance, and the libraries an application can use.

Modern .NET is normally the right choice for new development because it:

- Runs on Windows, Linux, and macOS.
- Works well in Docker, Kubernetes, and cloud services.
- Allows different applications on one machine to use different runtime versions.
- Receives new runtime, language, ASP.NET Core, performance, and diagnostics features.
- Supports flexible deployment, including framework-dependent and self-contained deployment.

.NET Framework remains important because many stable business systems depend on Windows-specific technologies that modern .NET does not directly support. An architect must know whether to migrate, replace unsupported parts, or safely keep an application on .NET Framework while modernizing around it.

## 3. How does it work?

Both platforms compile C# into Intermediate Language (IL). A runtime then uses just-in-time compilation to convert the IL into machine code and provides services such as garbage collection, exception handling, and type safety.

The main differences are in the runtime and application stack:

- A .NET Framework application runs on the Windows-installed .NET Framework CLR. Its framework version is largely managed with the operating system, and .NET Framework 4.x updates replace earlier 4.x versions on the machine.
- A modern .NET application runs on CoreCLR and uses the modern base libraries. The project declares a target framework such as `net10.0` or `net8.0`.
- Modern .NET runtimes can be installed side by side. At startup, the .NET host reads the application's runtime configuration, selects a compatible installed runtime, loads dependencies, and starts the application.
- A self-contained modern .NET deployment carries its own runtime. It can also be published as a single file or, where suitable, compiled ahead of time with Native AOT.
- ASP.NET Framework applications use the older `System.Web` pipeline and often IIS. ASP.NET Core uses a lightweight middleware pipeline and can run behind IIS, Nginx, or another reverse proxy.

Some libraries can support both platforms through .NET Standard or multi-targeting, but technology-specific components such as Web Forms cannot simply run on modern .NET.

## 4. Practical example

Consider a bank with an old customer portal built on ASP.NET Web Forms and .NET Framework 4.8.1. The portal depends on Windows authentication, `System.Web`, and several older vendor libraries. A new payment-notification service must handle high traffic and run in Linux containers.

The bank can keep the stable portal on .NET Framework while building the new service with ASP.NET Core on .NET 10 LTS. The two systems communicate through a secured API or message broker. Later, the portal can be migrated feature by feature rather than through a risky big-bang rewrite.

This approach respects the legacy dependencies while allowing the new service to use containers, horizontal scaling, modern observability, and current .NET performance improvements.

## 5. Scenario-based interview answer

**Scenario:** An interviewer asks how I would modernize a large .NET Framework payment application without disrupting daily transactions.

**Answer:**

“The problem was that the payment application ran reliably on .NET Framework, but it used `System.Web`, WCF server endpoints, and Windows-only libraries. A direct retarget to modern .NET would not work.

My decision would be to start with a dependency assessment and migrate incrementally. I would keep the stable application on a supported .NET Framework version while stopping new feature growth inside the monolith. I would identify a low-coupled capability, such as payment notifications, and build it as an ASP.NET Core service on the current .NET LTS release.

For implementation, I would define API or messaging contracts, add automated characterization tests around the existing behavior, and move reusable business logic into libraries that can be multi-targeted where practical. I would replace unsupported technologies deliberately—for example, Web Forms with ASP.NET Core UI patterns and WCF server endpoints with REST or gRPC. I would deploy the new service independently and use monitoring, tracing, and a controlled rollout.

The result would be lower migration risk and no forced rewrite of the entire payment platform. Each migrated capability would gain independent deployment and scaling, while the remaining .NET Framework system would continue to process transactions safely until it was retired.”

## 6. Code example

A shared business library can temporarily target both runtimes during an incremental migration:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFrameworks>net481;net10.0</TargetFrameworks>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>
```

```csharp
namespace Payments.Domain;

public static class PaymentFeeCalculator
{
    public static decimal Calculate(decimal amount, decimal rate)
    {
        if (amount < 0)
            throw new ArgumentOutOfRangeException(nameof(amount));

        if (rate is < 0 or > 1)
            throw new ArgumentOutOfRangeException(nameof(rate));

        return decimal.Round(amount * rate, 2, MidpointRounding.AwayFromZero);
    }
}
```

`TargetFrameworks` creates separate builds for .NET Framework 4.8.1 and .NET 10. This can let the old application and a new service reuse simple business logic during migration. It works only when the library's APIs and dependencies support both targets; Windows-specific or `System.Web` code should not be placed in this shared library.

## 7. Common mistakes

- Treating the move as a simple framework retarget instead of checking source code, NuGet packages, application models, configuration, authentication, and hosting.
- Starting a new application on .NET Framework because the team already knows it, even when there is no legacy dependency requiring it.
- Assuming every .NET Framework technology exists in modern .NET. Web Forms and `System.Web` do not, and WCF server applications need an alternative such as CoreWCF, REST, or gRPC.
- Migrating everything in one large release without characterization tests, observability, rollback plans, or staged traffic.
- Moving old code into containers without removing Windows-only dependencies, then expecting Linux deployment to work.
- Multi-targeting a shared library while allowing framework-specific code to leak into its core business logic.
- Choosing a short-support release for a long-lived production system without a documented upgrade schedule. LTS reduces upgrade frequency, but it still requires regular patching and future upgrades.

## 8. Follow-up interview questions

### Can .NET Framework and modern .NET run on the same server?

Yes. On Windows they can run side by side because they use separate runtimes. Modern .NET versions can also be installed side by side with one another.

### Can an ASP.NET Web Forms application be directly upgraded to ASP.NET Core?

No. ASP.NET Core does not support Web Forms or the `System.Web` pipeline. The UI must be rewritten, commonly with Razor Pages, MVC, Blazor, or a separate frontend, while reusable business logic may be migrated independently.

### When should an application remain on .NET Framework?

It may remain when it is stable, Windows-only, and depends heavily on unsupported technologies or vendor libraries, and when migration cost is currently higher than the business benefit. It should stay patched on .NET Framework 4.8.1 where the operating system supports it, with a documented risk and modernization plan.
