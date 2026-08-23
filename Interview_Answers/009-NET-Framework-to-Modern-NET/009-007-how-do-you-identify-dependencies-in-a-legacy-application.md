# 7. How do you identify dependencies in a legacy application?

**Technology:** .NET Framework to Modern .NET

**Source question:** 7. How do you identify dependencies in a legacy application?

## 1. What is it?

Identifying dependencies means finding everything a legacy application needs to build, start, and complete its business workflows.

This includes visible code references, such as projects and NuGet packages, and less obvious runtime dependencies, such as databases, APIs, queues, file shares, Windows services, COM components, certificates, registry settings, scheduled tasks, IIS configuration, and identity providers.

The result should be a dependency map that shows what the application calls, why it calls it, who owns it, how critical it is, and whether it can work with modern .NET.

## 2. Why is it important?

Legacy applications often have dependencies that are not documented or declared in the solution. For example, a payment job may load a vendor assembly from a server folder, read a certificate from the Windows certificate store, and call a stored procedure through a connection string injected during deployment.

Finding these dependencies early helps a team:

- Avoid production failures caused by missing runtime components or configuration.
- Find packages and APIs that cannot move directly to modern .NET.
- Understand which modules can be migrated independently.
- Plan replacements, adapters, testing, deployment, and rollback.
- Estimate migration effort using evidence instead of assumptions.
- Identify owners for external systems and agree on contracts and service levels.

For an architect, this information is essential for deciding the migration order and choosing between upgrading, isolating, replacing, or temporarily retaining a component.

## 3. How does it work?

I use several sources because no single tool finds every dependency:

1. **Create a static inventory.** Review solution and project files, assembly references, NuGet packages, source imports, configuration files, build scripts, deployment scripts, and IIS settings.
2. **Search for framework-specific usage.** Look for `System.Web`, WCF server code, .NET Remoting, COM interop, registry access, Windows impersonation, `HttpContext.Current`, and other Windows or .NET Framework features.
3. **Trace business flows.** Start with important journeys such as login, payment, refund, and settlement. Follow each call through application layers, databases, queues, files, and external services.
4. **Observe the running system.** Use application logs, distributed traces, database monitoring, network and process telemetry, and assembly-load information. This reveals dependencies created through reflection, configuration, or dependency injection.
5. **Talk to the people who operate it.** Developers, support teams, database administrators, infrastructure engineers, security teams, and business users often know about manual jobs and operational dependencies that source code does not show.
6. **Validate compatibility.** Check whether packages, vendor SDKs, APIs, hosting features, and operating-system integrations support the chosen modern .NET target. A package name alone is not proof of compatibility.
7. **Record each dependency.** Capture its type, purpose, owner, version, protocol, authentication, data sensitivity, availability requirement, migration option, and failure impact.
8. **Confirm with tests.** Run representative workflows in a controlled environment and compare the observed calls with the dependency map. Repeat until important flows have no unexplained dependencies.

Static analysis shows what the code could use. Runtime observation shows what a tested workflow actually used. Both are required, including tests for month-end, failure, and recovery paths that may run rarely.

## 4. Practical example

Consider a .NET Framework 4.7.2 payment application. The solution shows references to SQL Server and a bank SDK, but the payment workflow reveals more:

- IIS supplies Windows authentication.
- A stored procedure performs fraud checks and writes to tables shared with another application.
- The bank SDK loads a native DLL from the server.
- Client certificates come from the Windows certificate store.
- Failed payments are written to an MSMQ queue.
- A scheduled task retries them overnight.

The team verifies each item from code, configuration, production traces, and operations documentation. It finds that the database and HTTP integrations can work with modern .NET, but the native bank SDK and MSMQ design need special handling.

The team places the bank SDK behind an adapter that remains on .NET Framework for the first migration phase and replaces the retry queue with a supported messaging service through a controlled data-migration plan. This allows the payment API to move without pretending that its hidden dependencies do not exist.

## 5. Scenario-based interview answer

“On a legacy payment platform, the initial dependency list contained only project references and NuGet packages. I did not consider that complete because the application also had deployment-time and runtime dependencies.

I started with the critical journeys: payment, refund, settlement, and reconciliation. For each journey, I combined source and configuration searches with runtime traces, database monitoring, deployment-script reviews, and workshops with support and infrastructure teams. We recorded every dependency with its owner, version, authentication method, business purpose, failure impact, and modern .NET compatibility.

That work found a native vendor DLL loaded through reflection, certificates installed manually on two servers, shared database tables, and an overnight retry task that was not in the solution. We isolated the vendor integration behind an adapter, added contract and characterization tests, documented certificate provisioning, and moved the shared-database separation into a later phase. We then migrated a lower-risk API first and monitored its external calls against the dependency map.

The result was a phased plan with known blockers and clear ownership. We avoided a production failure that a package-only assessment would have missed, and we could estimate the remaining migration work with much more confidence.”

## 6. Code example

The following temporary diagnostic can record managed assemblies as they are loaded by a .NET Framework application:

```csharp
using System;
using System.Diagnostics;
using System.Reflection;

public static class AssemblyDependencyMonitor
{
    public static void Start()
    {
        AppDomain.CurrentDomain.AssemblyLoad += OnAssemblyLoad;

        foreach (Assembly assembly in AppDomain.CurrentDomain.GetAssemblies())
        {
            WriteAssembly(assembly);
        }
    }

    private static void OnAssemblyLoad(object sender, AssemblyLoadEventArgs args)
    {
        WriteAssembly(args.LoadedAssembly);
    }

    private static void WriteAssembly(Assembly assembly)
    {
        string location;

        try
        {
            location = assembly.IsDynamic ? "<dynamic>" : assembly.Location;
        }
        catch (NotSupportedException)
        {
            location = "<unknown>";
        }

        Trace.TraceInformation(
            "Managed assembly loaded: {0}; Location: {1}",
            assembly.FullName,
            location);
    }
}
```

Call `AssemblyDependencyMonitor.Start()` once during application startup in a controlled assessment environment. It records assemblies already loaded and assemblies loaded later through reflection or plug-in code.

This is only one source of evidence. It will not discover an unexecuted code path, a native DLL, a database, an HTTP service, a queue, or infrastructure configuration. Sensitive paths and assembly details should not be exposed through public logs, and temporary diagnostics should be removed or properly secured after the assessment.

## 7. Common mistakes

- Treating project references and NuGet packages as the complete dependency list.
- Relying on one automated scanner without validating real business workflows.
- Looking only at source code and ignoring configuration, deployment, and infrastructure.
- Missing dependencies loaded through reflection, plug-in folders, COM, or native DLLs.
- Testing only common request paths and missing batch, month-end, retry, and recovery flows.
- Recording a dependency without its owner, purpose, version, authentication, or failure impact.
- Assuming that a package supporting modern .NET means the whole integration is compatible.
- Ignoring shared database tables, stored procedures, triggers, and transaction boundaries.
- Forgetting operational dependencies such as certificates, service accounts, firewall rules, scheduled tasks, and file permissions.
- Capturing production telemetry without protecting secrets and customer data.
- Removing a dependency because it appears unused before confirming this with owners and representative testing.

## 8. Follow-up interview questions

### Which tools would you use to find dependencies?

I use repository searches, project and package inspection, compatibility analyzers, build output, application logs, distributed tracing, database monitoring, process and network telemetry, and deployment configuration. I combine tool findings with interviews and runtime tests because each source has gaps.

### How do you find dependencies created dynamically?

I run representative workflows and observe assembly loads, network calls, database activity, file access, and logs. I also search for reflection, configuration-based type names, plug-in loading, service locators, and dependency-injection registrations.

### How do you decide what to do with an incompatible dependency?

I consider replacing or upgrading it first. If that is not immediately possible, I isolate it behind a clear interface or a small service and keep that part on .NET Framework temporarily. The decision depends on business risk, vendor support, security, cost, and the expected lifetime of the workaround.
