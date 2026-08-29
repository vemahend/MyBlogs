# 19. How do you measure modernisation progress?

**Technology:** .NET Framework to Modern .NET

**Source question:** 19. How do you measure modernisation progress?

## 1. What is it?

Measuring modernisation progress means using clear evidence to show how much of the legacy system has moved to modern .NET and whether the change is producing a safer, easier-to-maintain system.

It is not enough to count converted projects, changed files, or completed tickets. A project can compile on modern .NET and still depend on the legacy application, share its database, or receive no production traffic. Good measurement covers both **migration progress** and **business outcomes**.

## 2. Why is it important?

Modernisation often takes months or years. Without agreed measures, a programme can look busy while the main risks remain unchanged.

Useful measures help a team:

- Show which business capabilities have actually moved to production.
- Find blockers such as unsupported packages, Windows-only code, or shared database ownership.
- Check that reliability, security, performance, and delivery speed are improving.
- Decide which component should be migrated next.
- Prove when a legacy server, runtime, licence, or deployment pipeline can be retired.
- Give technical and business stakeholders one honest view of progress.

The purpose is not to create a perfect percentage. It is to support decisions and show whether risk and operating cost are going down.

## 3. How does it work?

I start with a baseline inventory. For every application or business capability, I record its owner, business importance, target framework, dependencies, deployment method, production traffic, data ownership, test coverage, security findings, and operating cost.

I then define completion stages with evidence. For example:

1. **Assessed:** dependencies and migration risks are known.
2. **Ready:** blocking libraries and architecture decisions are resolved.
3. **Migrated:** the component builds and passes automated tests on modern .NET.
4. **Running:** it is deployed and receives real production traffic.
5. **Retired:** callers, jobs, data access, and rollback dependencies have left the old component, so it can be switched off.

The dashboard should combine several types of measure:

- **Scope:** capabilities assessed, migrated, running, and retired. Weight them by business value or complexity instead of treating a small utility and a payment engine as equal.
- **Production adoption:** percentage of requests, messages, users, or transactions handled by the modern path.
- **Legacy reduction:** .NET Framework applications, servers, unsupported packages, database dependencies, and licences removed.
- **Quality and operations:** error rate, latency, availability, security findings, incidents, recovery time, and resource cost before and after migration.
- **Delivery:** build time, deployment frequency, lead time, rollback rate, and time needed to onboard a developer.
- **Business safety:** payment reconciliation differences, failed transactions, customer complaints, and other domain-specific measures.

The team reviews the measures regularly and keeps the original baseline visible. Each metric needs an owner, data source, target, and date. A component is counted as complete only when the agreed production and retirement evidence exists.

## 4. Practical example

A bank has 20 payment capabilities in a .NET Framework application. Instead of reporting “12 projects upgraded,” it weights the capabilities by transaction volume and business risk.

The dashboard shows that 65% of weighted capabilities are deployed on modern .NET, but only 35% of payment traffic uses them. It also shows that no legacy servers have been retired because the nightly settlement job still reads the old database directly.

This exposes the real blocker. The team migrates the settlement job, reconciles modern and legacy results for two release cycles, moves the remaining traffic gradually, and removes the old database dependency. Progress is then visible as increased modern traffic, fewer reconciliation differences, stable latency, and finally the retirement of two .NET Framework servers.

## 5. Scenario-based interview answer

“I measure modernisation by business capability and production evidence, not by lines of code or tickets closed.

**Problem:** In one payment platform, the programme reported many converted libraries, but most customer traffic and all settlement work still depended on the .NET Framework application. The reported completion percentage was therefore misleading.

**Decision:** I created a baseline inventory and agreed five stages: assessed, ready, migrated, running in production, and legacy retired. We weighted capabilities by transaction volume, criticality, and migration effort. We also agreed guardrails for error rate, latency, reconciliation, incidents, and cost.

**Implementation:** CI supplied build and test data, deployment records showed the runtime in production, OpenTelemetry metrics showed traffic through the legacy and modern paths, and the payment ledger supplied reconciliation results. We reviewed one dashboard weekly. A capability was not marked complete until production traffic had moved and its old code path, job, or server could be removed.

**Result:** The dashboard showed that settlement was preventing retirement even though most projects had been converted. After we moved that dependency, modern traffic reached 100%, reconciliation stayed within the agreed rule, deployment lead time improved, and we switched off the old servers. That gave the business a measurable result rather than an artificial migration percentage.”

## 6. Code example

This modern ASP.NET Core service records how many requests use each implementation. The values can be sent through an OpenTelemetry-compatible metrics pipeline and used to calculate production adoption:

```csharp
using System.Diagnostics.Metrics;

public static class ModernisationMetrics
{
    private static readonly Meter Meter =
        new("Payments.Modernisation", "1.0.0");

    private static readonly Counter<long> Requests =
        Meter.CreateCounter<long>("payment_requests_total");

    public static void RecordRequest(bool usedModernPath)
    {
        Requests.Add(1,
            new KeyValuePair<string, object?>(
                "implementation",
                usedModernPath ? "modern-dotnet" : "dotnet-framework"));
    }
}

app.MapPost("/payments", async (
    PaymentRequest request,
    IPaymentRouter router,
    CancellationToken cancellationToken) =>
{
    var result = await router.ProcessAsync(request, cancellationToken);
    ModernisationMetrics.RecordRequest(result.UsedModernPath);
    return Results.Ok(result.Response);
});
```

`System.Diagnostics.Metrics` is the current .NET metrics API. The `implementation` tag lets the monitoring system compare legacy and modern request counts. In production, I would also record failures and duration, keep tag values low in number, and validate traffic metrics against business transaction totals. A request counter alone does not prove that the legacy component can be retired.

## 7. Common mistakes

- Reporting lines of code changed, tickets closed, or projects compiled as the main success measure.
- Giving every component equal weight even when their value and risk are very different.
- Marking a component complete before it handles production traffic.
- Ignoring hidden dependencies such as scheduled jobs, reports, database users, and rollback routes.
- Measuring migration speed without checking errors, latency, security, or customer impact.
- Changing metric definitions during the programme so that progress always looks positive.
- Collecting many metrics without an owner, target, data source, or action.
- Using high-cardinality metric tags such as customer ID or payment ID, which increases monitoring cost.
- Removing the legacy path before reconciliation, rollback, and operational support are proven.
- Keeping the old system running indefinitely after all exit criteria have been met.

## 8. Follow-up interview questions

### What is the best single modernisation metric?

There is no reliable single metric. If I must lead with one, I use the percentage of weighted business capabilities running in production, but I always pair it with modern traffic, legacy retirement, and quality guardrails.

### When is a component fully modernised?

It is complete when the modern component is supported, tested, deployed, observable, and handling its intended production workload, and when the old component and its dependencies can be safely retired. Merely targeting a newer framework is not enough.

### How do you prevent teams from gaming the progress percentage?

Use agreed stage definitions and automated evidence from source control, CI/CD, runtime telemetry, and infrastructure records. Weight the scope before work starts, keep the baseline visible, and require independent confirmation for production cutover and legacy retirement.
