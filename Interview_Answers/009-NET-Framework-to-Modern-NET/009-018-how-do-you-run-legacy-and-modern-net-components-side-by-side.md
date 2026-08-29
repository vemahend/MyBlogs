# 18. How do you run legacy and modern .NET components side by side?

**Technology:** .NET Framework to Modern .NET

**Source question:** 18. How do you run legacy and modern .NET components side by side?

## 1. What is it?

Running legacy and modern .NET components side by side means keeping part of a system on .NET Framework while new or migrated parts run on modern .NET. This is usually a temporary migration state, although it can last for some time in a large system.

The safest design is normally to run them in **separate processes** and connect them through HTTP, gRPC, a message broker, named pipes, or another clear contract. A .NET Framework application and a modern .NET application use different runtimes, so we should not assume that both can be loaded safely inside one process.

For reusable business code that has no framework-specific dependency, both applications may reference a shared library targeting `netstandard2.0`. This shares code, not runtimes.

## 2. Why is it important?

Large .NET Framework systems are rarely safe to rewrite or migrate in one release. Some parts may depend on ASP.NET Web Forms, WCF server hosting, Windows-only libraries, COM components, or old third-party packages. Other parts may already be ready for modern .NET.

Side-by-side operation allows a team to:

- Migrate one business capability at a time.
- Keep the existing system available while reducing migration risk.
- Route only selected traffic to the modern component.
- Compare old and new behaviour before a full cutover.
- Roll back quickly if the new path has a problem.
- Replace legacy dependencies gradually instead of performing a risky big-bang rewrite.

The process boundary is also useful because a crash, memory leak, configuration problem, or incompatible dependency in the legacy runtime does not have to bring down the modern service.

## 3. How does it work?

A common execution flow is:

1. Identify a business capability with a clear boundary, such as payment validation.
2. Define a versioned contract for its requests, responses, errors, timeouts, and side effects.
3. Keep the legacy application in its existing .NET Framework process.
4. Build the new capability as a separate modern .NET service. For a new long-lived service, use a currently supported release such as .NET 10 LTS; .NET 8 and .NET 9 are also supported at the time of writing but reach end of support in November 2026.
5. Put a routing layer, gateway, feature flag, or adapter in front of the two implementations.
6. Send a small percentage of requests, selected customers, or one operation type to the modern service first.
7. Add correlation IDs, metrics, distributed tracing, health checks, timeouts, retries where safe, and circuit breakers across the boundary.
8. Compare results and increase traffic gradually. Keep a tested rollback route until the new component is stable.
9. Remove the old path only after callers, data, scheduled jobs, and operational dependencies have moved.

There are two main integration choices:

- **Out of process:** HTTP or gRPC for synchronous calls; queues or topics for asynchronous work. This is the preferred option because it isolates the runtimes and supports independent deployment.
- **Shared library:** Move framework-neutral models or business rules into a `netstandard2.0` library referenced by both applications. .NET Framework should target 4.7.2 or later for reliable .NET Standard 2.0 consumption. Do not use .NET Standard 2.1 because .NET Framework does not support it.

If the legacy code is only available through COM or another native boundary, a modern .NET process can sometimes call it through interop. I would hide that detail behind an adapter and treat it as a transition solution, because deployment, bitness, registration, threading, and error handling are harder to operate.

## 4. Practical example

Consider a bank whose .NET Framework 4.8 internet-banking application contains payment validation, account screens, and several Web Forms modules. The team wants to move payment validation first.

They extract the new validation rules into a .NET 10 service. The legacy application calls the service through an internal HTTPS endpoint using a stable request contract and a correlation ID. A feature flag enables the new path for employee accounts first, then for a small percentage of customers.

The service only validates and returns a decision; the legacy application remains the single owner of the actual ledger update during this stage. This avoids both systems posting the same payment. Metrics compare approval decisions and latency. If the service is unhealthy, the team can turn off the feature flag and route validation back to the legacy implementation.

After the new service is proven, the team can move payment execution and data ownership in a later phase, using idempotency keys and a controlled data migration.

## 5. Scenario-based interview answer

“I normally run legacy and modern .NET side by side by separating them at a process boundary rather than trying to host two runtimes in one process.

**Problem:** In one banking system, a .NET Framework application contained payment rules, Web Forms pages, and Windows-only dependencies. Moving everything together would have created a large release and rollback risk.

**Decision:** We used the strangler pattern. We selected payment validation as the first bounded capability and built it as a separate modern .NET service. We kept payment posting in one place so that parallel operation could not create duplicate ledger entries.

**Implementation:** We defined a versioned HTTP contract, added an adapter in the legacy application, and controlled routing with a feature flag. We used short timeouts, a circuit breaker, correlation IDs, metrics, and tracing. We first ran the modern service in shadow mode, where it calculated a result but caused no side effect. After comparing results, we enabled it for internal users and then increased production traffic gradually. The old implementation remained available as a tested rollback path.

**Result:** We migrated the capability without taking down the legacy application. Differences in rounding and validation were found during shadow comparison, and the gradual cutover avoided customer impact. Once the modern path was stable, we removed the old validation code and moved to the next capability.”

## 6. Code example

This modern .NET adapter calls a legacy service through HTTP. The same interface lets the application switch implementations through configuration or a feature flag:

```csharp
public sealed record PaymentCheck(
    string PaymentId,
    decimal Amount,
    string Currency);

public sealed record ValidationResult(bool IsAllowed, string? Reason);

public interface IPaymentValidator
{
    Task<ValidationResult> ValidateAsync(
        PaymentCheck payment,
        CancellationToken cancellationToken);
}

public sealed class LegacyPaymentValidator(HttpClient httpClient)
    : IPaymentValidator
{
    public async Task<ValidationResult> ValidateAsync(
        PaymentCheck payment,
        CancellationToken cancellationToken)
    {
        using var response = await httpClient.PostAsJsonAsync(
            "api/v1/payments/validate",
            payment,
            cancellationToken);

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<ValidationResult>(
                   cancellationToken: cancellationToken)
               ?? throw new InvalidOperationException("Legacy service returned no result.");
    }
}

// Program.cs in the modern .NET application
builder.Services.AddHttpClient<LegacyPaymentValidator>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["LegacyApi:BaseUrl"]!);
    client.Timeout = TimeSpan.FromSeconds(2);
});
builder.Services.AddScoped<IPaymentValidator, LegacyPaymentValidator>();
```

`IPaymentValidator` protects the application from the integration detail. `HttpClient` is created through `IHttpClientFactory`, so connection handling and configuration are managed correctly. The cancellation token and explicit timeout prevent requests from waiting forever. In production, I would also add authentication, resilience policies, correlation headers, contract tests, and idempotency for any operation that changes state.

## 7. Common mistakes

- Trying to load .NET Framework and modern .NET libraries into the same process as if they use one compatible runtime.
- Treating `netstandard2.0` as a runtime instead of a shared API contract for libraries.
- Targeting .NET Standard 2.1 for a library that must be consumed by .NET Framework.
- Sharing a database casually between old and new components, allowing either side to change tables without coordination.
- Letting both implementations perform the same payment, message, or ledger side effect during shadow testing.
- Retrying non-idempotent operations and creating duplicates.
- Using synchronous calls for long-running work that should be handled through messaging.
- Adding HTTP calls without timeouts, cancellation, circuit breakers, authentication, or capacity planning.
- Reusing internal domain classes as network contracts, which tightly couples both deployments.
- Creating a permanent distributed monolith with many chatty calls between legacy and modern services.
- Cutting over all users at once without feature flags, monitoring, reconciliation, or rollback.
- Leaving the temporary legacy bridge in place without an owner and removal plan.

## 8. Follow-up interview questions

### Can a .NET Framework application reference a modern .NET library directly?

Not if the library targets only modern .NET, such as `net10.0`. Shared framework-neutral code can target `netstandard2.0`; for .NET Framework consumers, 4.7.2 or later is recommended. Another option is multi-targeting when platform-specific implementations are required.

### When would you use messaging instead of HTTP?

I use messaging when the caller does not need an immediate answer, the work may take time, or temporary receiver downtime must be tolerated. Messages need idempotent consumers, durable delivery, monitoring, and a clear failure or dead-letter process.

### How do you avoid duplicate side effects during parallel running?

Choose one system as the owner of each write. Run the other implementation in read-only or shadow mode, and compare its result without committing it. When writes move, use an idempotency key, a clear cutover point, reconciliation, and a tested rollback plan.
