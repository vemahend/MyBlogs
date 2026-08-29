# 5. How do you gradually retire legacy functionality?

**Technology:** Strangler Fig and Migration Patterns

**Source question:** 5. How do you gradually retire legacy functionality?

## 1. What is it?

Gradually retiring legacy functionality means replacing an old system in small, controlled steps instead of rewriting and switching off everything at once.

The usual approach is the **Strangler Fig pattern**. A routing layer sends selected requests to the new implementation while the remaining requests continue to use the legacy system. As more features move, the new system slowly "strangles" the old one until the old code, data, and infrastructure are no longer needed.

Retirement is complete only when traffic has stopped, required data has been migrated or archived, dependencies have been removed, and the old component has been safely decommissioned.

## 2. Why is it important?

A large legacy system often contains hidden business rules and integrations. Replacing it in one release creates a high risk of outages, incorrect results, and a difficult rollback.

Gradual retirement helps teams:

- Deliver useful changes without waiting for a full rewrite.
- Compare old and new behaviour with real traffic.
- Limit failures to a small customer group or operation.
- Roll back by changing routing rather than redeploying the whole system.
- Learn undocumented business rules during migration.
- Reduce legacy maintenance cost in measurable stages.

Senior developers also need this approach because migration is not only a code change. It involves data ownership, monitoring, operational support, security, compliance, and the removal of old dependencies.

## 3. How does it work?

A practical flow is:

1. Map the legacy capabilities, callers, data, integrations, and business rules.
2. Choose a small migration slice with a clear boundary, such as balance enquiries rather than the entire account domain.
3. Put an API gateway, proxy, facade, or application routing layer in front of the old and new implementations.
4. Build the new capability with clear contracts and observability.
5. Route internal users or a small percentage of traffic to it. Keep a quick rollback switch.
6. Where safe, run both implementations and compare their results without allowing both to perform the same business side effect.
7. Increase traffic after checking errors, latency, business results, and support feedback.
8. Move data ownership carefully. During transition, use change events, replication, or an anti-corruption layer rather than letting new code depend directly on the legacy database forever.
9. Stop new writes to the retired path, remove callers, archive required data, and observe a quiet period.
10. Delete the old code and shut down its jobs, credentials, infrastructure, alerts, and licences.

Each slice needs explicit success, rollback, and deletion criteria. A feature is not retired merely because the new version has been deployed.

## 4. Practical example

Consider a bank whose legacy account system handles balance enquiries, statements, transfers, and interest calculation.

The team first extracts balance enquiries because they are read-only and lower risk. An API gateway routes employee accounts to a new ASP.NET Core service. The service reads from a replicated account view, while normal customers still use the legacy system.

The team compares the new response with the legacy response, investigates differences, and then increases traffic to 5%, 25%, and 100%. If error rate or data mismatch exceeds an agreed limit, routing returns to the legacy endpoint.

After all balance callers use the new service, the bank monitors the old balance endpoint for several weeks. It then removes that endpoint, its scheduled cache job, unused database permission, and related monitoring. The same process is repeated for statements and later for carefully controlled write operations.

## 5. Scenario-based interview answer

**Problem:** "In one project, a legacy payment application handled payment status, refunds, settlement, and reporting. A big-bang rewrite was too risky because several channels used it and some business rules were undocumented."

**Decision:** "I proposed a Strangler Fig migration. We split the application by business capability and started with payment-status queries, which had lower business risk. We kept the external API contract stable and placed routing in the gateway."

**Implementation:** "We built a new ASP.NET Core service, populated its read model from payment events, and added correlation IDs, metrics, and result comparison. We first enabled it for test merchants, then moved traffic in stages. Routing was controlled independently so operations could return traffic to the legacy service quickly. For refunds, we did not dual-write blindly because duplicate refunds would be dangerous. We used one system as the write owner, an idempotency key, and events to update the other side during the transition."

**Result:** "We migrated each capability without a customer outage. Once the old endpoints had no callers for the agreed observation period, we archived audit data, removed credentials and jobs, and shut down the legacy servers. This also reduced licence and support cost. The key point was that every migration slice included a retirement plan, not just a plan to deploy new code."

## 6. Code example

This simplified ASP.NET Core example routes payment-status requests gradually. The same minimal API and `HttpClientFactory` concepts are available in supported modern .NET versions; production routing would commonly sit in a gateway or proxy rather than application code.

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient("legacy", client =>
    client.BaseAddress = new Uri("https://legacy-payments.internal"));

builder.Services.AddHttpClient("modern", client =>
    client.BaseAddress = new Uri("https://payment-status.internal"));

builder.Services.AddSingleton<MigrationRoutingOptions>();

var app = builder.Build();

app.MapGet("/payments/{paymentId}/status", async (
    string paymentId,
    string merchantId,
    MigrationRoutingOptions routing,
    IHttpClientFactory clients,
    CancellationToken cancellationToken) =>
{
    // A stable key keeps the same merchant on the same route.
    bool useModernService = routing.IsModernRoute(merchantId);
    string clientName = useModernService ? "modern" : "legacy";

    using HttpResponseMessage response = await clients
        .CreateClient(clientName)
        .GetAsync($"/payments/{Uri.EscapeDataString(paymentId)}/status",
            cancellationToken);

    return Results.Stream(
        await response.Content.ReadAsStreamAsync(cancellationToken),
        response.Content.Headers.ContentType?.ToString(),
        statusCode: (int)response.StatusCode);
});

app.Run();

sealed class MigrationRoutingOptions
{
    // Load this value from controlled configuration in a real system.
    public int ModernTrafficPercentage { get; init; } = 10;

    public bool IsModernRoute(string merchantId)
    {
        uint hash = 2166136261;
        foreach (char character in merchantId)
            hash = (hash ^ character) * 16777619;

        return hash % 100 < ModernTrafficPercentage;
    }
}
```

The stable hash gives a consistent canary group, so one merchant does not randomly move between systems on every request. The percentage can be raised gradually or set to zero for rollback. In production, the team should also preserve authentication context, set timeouts, add tracing, record which route was selected, and avoid returning internal response details unintentionally.

## 7. Common mistakes

- Starting with the most complex, high-risk write operation.
- Rewriting the whole system before releasing any migrated capability.
- Sharing the legacy database permanently, which keeps the new service coupled to the old schema.
- Performing uncontrolled dual writes, causing partial updates or duplicate financial operations.
- Sending the same command to both systems without idempotency protection.
- Using random routing per request, which makes behaviour inconsistent and defects hard to reproduce.
- Migrating traffic without business-level comparison, metrics, tracing, or a tested rollback.
- Ignoring batch jobs, reports, support tools, and external consumers that still call the old feature.
- Switching off code but leaving credentials, queues, licences, infrastructure, or sensitive data behind.
- Keeping the legacy fallback forever. This creates two systems to maintain and prevents real retirement.

## 8. Follow-up interview questions

### How do you choose the first functionality to migrate?

Choose a capability with a clear boundary, useful business value, limited dependencies, and manageable risk. A read-only feature is often a good first slice because rollback and result comparison are simpler.

### How do you handle data while both systems are running?

Define one owner for each write. Move changes through reliable events, change-data capture, or controlled replication, and reconcile results. Avoid permanent shared-table access and unsafe dual writes.

### When is it safe to switch off the legacy functionality?

Switch it off only after all known callers have moved, traffic and logs show no use for an agreed quiet period, required data is migrated or archived, rollback conditions are satisfied, and related jobs, credentials, integrations, and compliance obligations have been addressed.
