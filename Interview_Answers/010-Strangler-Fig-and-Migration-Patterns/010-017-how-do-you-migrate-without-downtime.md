# 17. How do you migrate without downtime?

**Technology:** Strangler Fig and Migration Patterns

**Source question:** 17. How do you migrate without downtime?

## 1. What is it?

A zero-downtime migration moves users, traffic, code, or data from a legacy system to a new system while the service remains available.

It does not usually mean one large release. It means making a series of small, backward-compatible changes, running the old and new parts together for a period, and moving traffic gradually. The old part is removed only after the new part has been proven in production.

True zero downtime cannot be guaranteed for every failure. The practical goal is no planned outage and no user-visible interruption during the migration.

## 2. Why is it important?

Banking, payment, and authentication systems may need to serve customers all day. A long maintenance window can cause failed payments, blocked logins, lost revenue, and broken service-level agreements.

An incremental migration reduces risk because:

- Each change is small and easier to test.
- The new component can be observed with real production traffic.
- Traffic can be stopped or sent back to the legacy component if problems appear.
- Database changes can be introduced without breaking the old application.

For architects, the main challenge is not only deployment. They must also protect in-flight requests, data consistency, message processing, and compatibility between old and new versions.

## 3. How does it work?

A typical migration follows these steps:

1. **Measure the existing system.** Record current behaviour, error rates, latency, business totals, and important edge cases.
2. **Add a routing layer.** Use an API gateway, reverse proxy, load balancer, or feature flag to choose between the legacy and new components.
3. **Make contracts backward-compatible.** New APIs should accept old clients, and database changes should follow the expand-and-contract pattern.
4. **Expand the database first.** Add nullable columns, new tables, indexes, or events without deleting or renaming objects used by the old code.
5. **Synchronize data safely.** Backfill historical data in small batches. Use change data capture, events, or an outbox to copy ongoing changes. Make consumers idempotent so retries do not create duplicates.
6. **Validate the new path.** Run shadow traffic or compare outputs without allowing the new component to make duplicate business changes.
7. **Move traffic gradually.** Start with internal users or a small percentage, then increase it while watching technical and business metrics.
8. **Keep rollback simple.** During the safe rollback period, route traffic back without needing to reverse a destructive schema change.
9. **Contract later.** After traffic has fully moved and the rollback period has passed, stop synchronization and remove legacy code and schema in a separate release.

For stateful operations, one system should normally own each write. Uncontrolled dual writes are dangerous because one write may succeed while the other fails.

## 4. Practical example

Consider a bank moving its beneficiary-management feature out of a monolith into a new ASP.NET Core service.

The team first adds a new beneficiary table without changing the monolith's existing table. It backfills old beneficiaries in batches and uses an outbox event to copy every new change to the new service. A reconciliation job compares record counts and key business fields.

The API gateway initially sends all customer requests to the monolith. Read requests are then shadowed to the new service, but its response is not returned to the customer. After the results match, the team enables the new service for employees, then 1% of customers, then 10%, 50%, and finally 100%.

During the rollout, the gateway can immediately return a customer group to the monolith. Once the new service has been stable through the agreed rollback period, it becomes the only writer and the old beneficiary code is retired.

## 5. Scenario-based interview answer

**Problem:** “We had to extract payment-status queries from a legacy application that operated continuously. A big-bang release and a database cutover would have created too much outage and rollback risk.”

**Decision:** “I used a Strangler Fig approach. We placed routing at the gateway, designed backward-compatible API and schema changes, and planned a gradual traffic shift. We kept one authoritative writer during each stage instead of relying on unsafe dual writes.”

**Implementation:** “We deployed the new ASP.NET Core service before routing customer traffic to it. Historical data was backfilled in throttled, restartable batches, while outbox events carried live changes. We made event handling idempotent and reconciled business totals between both stores. We first used shadow reads, then enabled the service for internal users and increased traffic in small percentages. Dashboards tracked latency, error rate, mismatched payment states, event lag, and payment totals. Feature flags and gateway rules gave us a quick rollback path.”

**Result:** “Customers did not need a maintenance window. We found data-mapping issues while only a small group was affected, corrected them, and continued the rollout. After all traffic was stable and reconciliation showed no differences, we stopped synchronization and removed the legacy path in a later release.”

## 6. Code example

The following ASP.NET Core endpoint shows a simple controlled cutover. A feature flag decides which service handles a read request. In a real system, the flag might be evaluated by customer group or rollout percentage.

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.FeatureManagement;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddFeatureManagement();
builder.Services.AddScoped<LegacyPaymentReader>();
builder.Services.AddScoped<NewPaymentReader>();

var app = builder.Build();

app.MapGet("/payments/{paymentId:guid}", async Task<IResult> (
    Guid paymentId,
    IFeatureManagerSnapshot features,
    LegacyPaymentReader legacy,
    NewPaymentReader current,
    CancellationToken cancellationToken) =>
{
    var useNewService = await features.IsEnabledAsync("NewPaymentReader");

    PaymentStatus? payment = useNewService
        ? await current.GetAsync(paymentId, cancellationToken)
        : await legacy.GetAsync(paymentId, cancellationToken);

    return payment is null ? Results.NotFound() : Results.Ok(payment);
});

app.Run();

public sealed record PaymentStatus(Guid PaymentId, string Status);

public sealed class LegacyPaymentReader
{
    public Task<PaymentStatus?> GetAsync(Guid id, CancellationToken token) =>
        Task.FromResult<PaymentStatus?>(new(id, "Settled"));
}

public sealed class NewPaymentReader
{
    public Task<PaymentStatus?> GetAsync(Guid id, CancellationToken token) =>
        Task.FromResult<PaymentStatus?>(new(id, "Settled"));
}
```

`IFeatureManagerSnapshot` keeps the flag value stable for the current request. The routing decision is reversible, so the team can disable the new path without redeploying. The example uses the `Microsoft.FeatureManagement` package; production code should also add timeouts, resilience policies, telemetry, and controlled percentage or cohort targeting.

The switch alone is not enough for a safe migration. The old and new paths must use compatible contracts, and any data synchronization must be monitored and idempotent.

## 7. Common mistakes

- Treating zero downtime as only a blue-green deployment problem and ignoring data migration.
- Renaming or deleting a database column while old application instances still use it.
- Writing independently to two databases without an outbox, reconciliation, or recovery plan.
- Sending shadow requests that accidentally execute a payment twice or trigger another side effect.
- Backfilling large tables in one transaction, causing locks, transaction-log growth, or production slowdown.
- Moving 100% of traffic immediately instead of using cohorts or small percentages.
- Monitoring only HTTP errors and not business measures such as payment totals, balances, or missing records.
- Having a feature flag but no tested rollback procedure.
- Removing the legacy path before event lag is zero, data is reconciled, and the rollback period has ended.

## 8. Follow-up interview questions

### What is the expand-and-contract database pattern?

First add new schema in a backward-compatible way and update applications to use it. Only after all old versions have stopped using the old schema do you remove it in a later deployment.

### How do you avoid inconsistent dual writes?

Prefer one system of record. Save the business change and an outbox message in the same local transaction, then publish and process that message with retries and idempotency. Reconciliation detects anything still missed.

### What should trigger an automatic rollback?

Use agreed thresholds for errors, latency, dependency failures, data mismatches, event lag, and business metrics. Rollback should normally change routing or a feature flag; destructive database rollback during a live migration should not be required.
