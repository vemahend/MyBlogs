# 8. How do you handle libraries that are not compatible with modern .NET?

**Technology:** .NET Framework to Modern .NET

**Source question:** 8. How do you handle libraries that are not compatible with modern .NET?

## 1. What is it?

An incompatible library is a dependency that a modern .NET application cannot safely compile or run. It may target only .NET Framework, use APIs that do not exist in modern .NET, depend on Windows-only features, or rely on an old runtime behavior.

I do not treat every compatibility warning in the same way. First, I find the exact incompatibility. Then I choose the lowest-risk option: upgrade or replace the package, rebuild its source for a compatible target, wrap it, or keep it in a separate legacy process until it can be removed.

## 2. Why is it important?

A migration can compile successfully and still fail in production. An old library might fail only when it loads a configuration section, performs serialization, accesses the registry, or calls an unsupported API.

Handling these dependencies deliberately is important because it:

- reduces production and security risk;
- prevents one legacy component from blocking the whole migration;
- makes the remaining technical debt visible;
- gives the team a controlled path for removing old code.

For a senior developer or architect, the decision is not only about making the package compile. It must also consider vendor support, security updates, performance, licensing, operating-system restrictions, and the cost of future maintenance.

## 3. How does it work?

I normally handle the library in this order:

1. **Identify the real dependency.** Check its target frameworks, transitive packages, native DLLs, reflection usage, configuration, and operating-system requirements. A NuGet compatibility warning is useful evidence, but it does not prove that every runtime path works.
2. **Look for a supported version.** Upgrade to a release that targets modern .NET or a compatible target such as .NET Standard 2.0.
3. **Replace it when practical.** Prefer a maintained package or a built-in .NET API if the behavior can be replaced without excessive risk.
4. **Rebuild owned source.** If the company owns the code, multi-target it temporarily, for example `net48` and `net8.0`, and move platform-specific code behind small interfaces. A newer application such as .NET 10 can also consume a compatible `net8.0` or `netstandard2.0` library.
5. **Use a compatibility package only when appropriate.** `Microsoft.Windows.Compatibility` can provide some Windows-oriented APIs, but it does not make every .NET Framework library portable or cross-platform.
6. **Isolate the library if it cannot move.** Keep it in a small .NET Framework service or worker and communicate through HTTP, gRPC, or messaging. This is usually safer than loading an unsupported binary into the new application.
7. **Test and plan removal.** Add contract, integration, load, failure, and security tests. Give the temporary adapter or legacy service an owner and a removal date.

The best option depends on risk. A small reporting component may be replaced immediately, while a certified payment component may need temporary process isolation and a phased migration.

## 4. Practical example

Suppose a bank is moving a payment API from .NET Framework 4.8 to modern .NET. The API uses an old vendor DLL to create files for a clearing system. The DLL reads legacy configuration, uses Windows registry settings, and has no supported modern .NET version.

The bank keeps that DLL in a restricted .NET Framework worker. The new payment service publishes a file-generation request to a durable queue. The worker validates the request, calls the old DLL, stores the generated file, and publishes a result event. A correlation ID and idempotency key prevent duplicate file creation during retries.

This allows the public payment API and most business logic to move to modern .NET without rewriting a high-risk clearing integration at the same time. The worker remains a temporary, monitored boundary until the vendor component is replaced.

## 5. Scenario-based interview answer

“In one migration, a critical vendor library supported only .NET Framework and was used in the settlement flow. Loading it directly into the modern .NET service was not a safe option because it depended on legacy configuration and Windows-only behavior.

My decision was to avoid blocking the full migration and isolate the dependency. We placed the DLL in a small .NET Framework worker behind a durable message contract. The modern service sent settlement requests with correlation and idempotency identifiers, and the worker returned success or failure events. We added contract tests, retry limits, monitoring, and reconciliation so that a timeout could not create duplicate settlements.

As a result, we migrated the main service independently, reduced the legacy footprint to one controlled component, and created a clear replacement path. I would use this as a transition design, not as the permanent architecture.”

## 6. Code example

The application can depend on a small interface instead of referencing the incompatible DLL directly:

```csharp
public sealed record SettlementRequest(
    string PaymentId,
    decimal Amount,
    string Currency);

public sealed record SettlementResult(
    string PaymentId,
    bool Accepted,
    string? Reference);

public interface ILegacySettlementGateway
{
    Task<SettlementResult> SubmitAsync(
        SettlementRequest request,
        CancellationToken cancellationToken);
}

public sealed class LegacySettlementHttpGateway(HttpClient httpClient)
    : ILegacySettlementGateway
{
    public async Task<SettlementResult> SubmitAsync(
        SettlementRequest request,
        CancellationToken cancellationToken)
    {
        using var response = await httpClient.PostAsJsonAsync(
            "settlements",
            request,
            cancellationToken);

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<SettlementResult>(
                   cancellationToken: cancellationToken)
               ?? throw new InvalidOperationException("The legacy service returned no result.");
    }
}
```

Register the adapter in the modern ASP.NET Core application:

```csharp
builder.Services.AddHttpClient<ILegacySettlementGateway,
    LegacySettlementHttpGateway>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["LegacySettlement:BaseUrl"]!);
    client.Timeout = TimeSpan.FromSeconds(10);
});
```

The modern application knows only the interface and the data contract. The incompatible vendor DLL stays inside the isolated .NET Framework service. In a real payment flow, I would also use authentication, resilience policies, idempotency, tracing, and reconciliation. For durable financial work, a message-based adapter is often safer than relying only on a synchronous HTTP call.

## 7. Common mistakes

- Assuming that a successful build or a suppressed NuGet warning proves runtime compatibility.
- Copying an old DLL into the output folder without checking its framework, native, COM, Windows, or configuration dependencies.
- Using `Microsoft.Windows.Compatibility` and assuming the application is now cross-platform.
- Rewriting a critical library without characterization and contract tests for its existing behavior.
- Creating a legacy service without authentication, observability, retry limits, idempotency, or failure recovery.
- Allowing a temporary bridge to become permanent because it has no owner or retirement plan.
- Migrating several risky dependencies at once, making failures difficult to isolate.
- Continuing to use an unsupported or vulnerable package without a documented risk decision.

## 8. Follow-up interview questions

### Can a modern .NET application reference a .NET Framework library directly?

Not reliably in general. It may work when the library uses APIs available through a compatible contract, but a .NET Framework-only binary can depend on runtime features missing from modern .NET. I verify the target and dependencies, then run real integration tests rather than trusting compilation alone.

### When would you use .NET Standard?

I use .NET Standard 2.0 when one shared library must support both .NET Framework and modern .NET during a transition. For a library used only by modern applications, targeting a current .NET version gives access to newer APIs and features.

### When should the old library be isolated in a separate service?

I isolate it when it cannot be rebuilt or replaced safely, has platform-specific runtime dependencies, or carries high migration risk. The service boundary must have a stable contract, proper security, monitoring, failure handling, and a plan to remove it.
