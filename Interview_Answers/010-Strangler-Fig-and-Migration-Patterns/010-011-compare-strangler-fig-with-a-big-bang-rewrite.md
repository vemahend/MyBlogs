# 11. Compare Strangler Fig with a big-bang rewrite.

**Technology:** Strangler Fig and Migration Patterns

**Source question:** 11. Compare Strangler Fig with a big-bang rewrite.

## 1. What is it?

Both approaches replace a legacy system, but they manage the change differently.

The **Strangler Fig pattern** replaces the system one business capability at a time. A routing layer sends migrated requests to the new solution and keeps the remaining requests on the legacy system. The old system becomes smaller until it can be removed.

A **big-bang rewrite** builds the complete replacement separately and switches all users and operations to it in one major cutover. The old system normally remains active until that cutover date.

Neither approach is always correct. Strangler Fig is usually safer for a large, business-critical system that must stay available. A big-bang rewrite can be reasonable for a small, well-understood system with few integrations and an acceptable outage or simple rollback.

## 2. Why is it important?

Choosing the wrong migration approach can cause long delivery delays, data errors, or a major production outage.

Strangler Fig provides:

- Smaller releases and a smaller failure area.
- Early business value instead of waiting for the whole replacement.
- Gradual traffic movement and easier rollback.
- Time to discover undocumented rules and dependencies.
- The ability to compare old and new behaviour in production safely.

Its cost is temporary complexity. Both systems may run together, so the team must manage routing, data synchronization, monitoring, and duplicate infrastructure.

A big-bang rewrite can produce a cleaner design without a long coexistence period. However, value arrives late, requirements can change during the rewrite, testing must cover the whole system, and cutover risk is concentrated into one event. Rollback can also be difficult after new production data has been written.

## 3. How does it work?

With Strangler Fig, the flow is:

1. Identify business capabilities and their dependencies.
2. Place a gateway, proxy, facade, or event boundary in front of the legacy system.
3. Implement one capability in the new platform.
4. Move a controlled group of traffic to it.
5. Monitor technical and business results, then increase traffic gradually.
6. Make data ownership explicit while both systems coexist.
7. Repeat until no callers depend on the legacy system, then decommission it.

With a big-bang rewrite, the flow is:

1. Analyse the complete legacy application.
2. Build and test the full replacement in parallel.
3. Rehearse data migration and operational cutover.
4. Stop or restrict legacy activity during the final migration.
5. Move all traffic and users at once.
6. Validate the new system and either continue or execute a full rollback plan.

The central difference is risk distribution: Strangler Fig spreads risk across many small migrations, while a big bang concentrates it at the final cutover.

## 4. Practical example

Consider a bank replacing a legacy payments platform that handles payment status, payment initiation, refunds, settlement, and reporting.

With Strangler Fig, the bank first moves the read-only payment-status API. The gateway sends selected merchants to a new ASP.NET Core service and the rest to the legacy application. After result comparison and gradual traffic increases, all status traffic moves. The team then migrates refunds and settlement as separate slices, with one system owning each write at any time.

With a big-bang rewrite, the bank would rebuild every capability, migrate all payment data, and change every channel during one planned release window. This avoids years of coexistence, but one missed refund rule or failed data migration could affect the entire payment platform.

For this critical system, Strangler Fig is normally the safer choice because each migration can be observed and reversed independently. A big bang might be suitable for a small internal reporting tool that is read-only, has two known users, and can be restored easily.

## 5. Scenario-based interview answer

**Problem:** "I worked on a legacy payment platform used by mobile banking, internet banking, and external merchants. A full rewrite was estimated to take more than a year, and the legacy system contained undocumented settlement rules. Replacing everything in one weekend would have created unacceptable operational and data risk."

**Decision:** "I recommended Strangler Fig instead of a big-bang rewrite. We divided the platform by business capability and selected payment-status queries as the first low-risk slice. We accepted the temporary cost of running two systems because it gave us smaller releases and safer rollback."

**Implementation:** "We put stable routing at the API gateway, kept the external contract unchanged, and built the new capability in ASP.NET Core. We started with internal merchants, compared responses against the legacy result, and then increased traffic in stages. For later write operations, we assigned one write owner, used idempotency keys and an outbox-based event flow, and reconciled financial totals. Each slice had success thresholds, a rollback route, and a legacy removal date."

**Result:** "We delivered value within months rather than waiting for the complete replacement, and no single release put the whole payments estate at risk. We eventually removed the migrated legacy modules and their jobs. I would still consider a big bang for a small, isolated application, but for a highly integrated payment platform the incremental approach gave the business much better risk control."

## 6. Code example

This simplified ASP.NET Core example shows the routing control that supports a Strangler Fig migration. A big-bang rewrite would not normally need per-capability routing because all traffic changes at the cutover.

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient("legacy", client =>
    client.BaseAddress = new Uri("https://legacy-payments.internal"));

builder.Services.AddHttpClient("modern", client =>
    client.BaseAddress = new Uri("https://modern-payments.internal"));

var app = builder.Build();

app.MapGet("/payments/{id}/status", async (
    string id,
    string merchantId,
    IConfiguration configuration,
    IHttpClientFactory clientFactory,
    CancellationToken cancellationToken) =>
{
    var migratedMerchants = configuration
        .GetSection("Migration:MigratedMerchants")
        .Get<string[]>() ?? [];

    string destination = migratedMerchants.Contains(
        merchantId, StringComparer.OrdinalIgnoreCase)
        ? "modern"
        : "legacy";

    using HttpResponseMessage response = await clientFactory
        .CreateClient(destination)
        .GetAsync($"/payments/{Uri.EscapeDataString(id)}/status", cancellationToken);

    return Results.Stream(
        await response.Content.ReadAsStreamAsync(cancellationToken),
        response.Content.Headers.ContentType?.ToString(),
        statusCode: (int)response.StatusCode);
});

app.Run();
```

The migrated merchant list acts as a controlled switch. Operations can move merchants gradually or route them back to the legacy service without changing the public API. In production, routing usually belongs in an API gateway or reverse proxy and should include timeouts, tracing, authentication forwarding, health checks, and audited configuration changes. The `[]` collection expression requires C# 12 or later; it is supported by .NET 8 and newer projects using that language version.

## 7. Common mistakes

- Assuming a rewrite will automatically remove unclear requirements or hidden business rules.
- Choosing a big bang only because running two systems looks expensive, while ignoring cutover and rollback risk.
- Using Strangler Fig without clear capability boundaries, causing both systems to remain tightly coupled.
- Allowing both systems to process the same financial command without idempotency controls.
- Using uncontrolled dual writes and creating inconsistent data.
- Moving traffic without business metrics, reconciliation, tracing, or tested rollback steps.
- Keeping the legacy database as the permanent integration contract for new services.
- Migrating easy features but never planning how to extract the difficult core capabilities.
- Leaving the fallback active forever, so the legacy system is never actually retired.
- Treating a big-bang rollback as only an application deployment rollback; production data may also need safe reversal or forward recovery.

## 8. Follow-up interview questions

### When is a big-bang rewrite a reasonable choice?

It can work for a small, isolated, well-understood system with few dependencies, simple data migration, strong test coverage, and an outage or full rollback that the business can accept.

### What is the main disadvantage of Strangler Fig?

The main disadvantage is temporary coexistence complexity. The team must operate two systems and carefully manage routing, contracts, data ownership, monitoring, and eventual legacy removal.

### How do you decide which approach to use?

Assess system size, business criticality, integration count, data migration risk, availability needs, team capacity, and how easily the change can be reversed. Prefer incremental migration when failure impact or uncertainty is high; consider a big bang when the scope and cutover risk are genuinely small and controlled.
