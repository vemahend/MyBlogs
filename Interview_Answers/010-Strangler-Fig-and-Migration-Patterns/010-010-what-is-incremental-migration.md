# 10. What is incremental migration?

**Technology:** Strangler Fig and Migration Patterns

**Source question:** 10. What is incremental migration?

## 1. What is it?

Incremental migration means replacing or moving an existing system in small, controlled steps instead of rewriting and switching everything at once.

For example, a team may move one business capability, API endpoint, database table, or group of users to a new .NET service at a time. During the migration, the old and new systems run together until the old system is no longer needed.

The Strangler Fig pattern is a common way to do this: traffic is placed behind a gateway or routing layer, and individual requests are gradually redirected from the legacy application to new services.

## 2. Why is it important?

A large one-time migration has a wide failure impact and usually requires a risky cutover. Incremental migration reduces that risk because each change is smaller, testable, and reversible.

It helps teams:

- Deliver business value before the whole migration is finished.
- Learn from real production traffic.
- Roll back one capability without restoring the entire system.
- Keep the existing product available during a long migration.
- Spread cost and effort across multiple releases.

Architects still need to manage temporary complexity because two systems, data models, and operational processes may coexist for some time.

## 3. How does it work?

A typical flow is:

1. Identify a capability with a clear boundary, such as beneficiary management or payment history.
2. Record the current behaviour, dependencies, data ownership, and success measures.
3. Put a stable routing layer, such as an API gateway, in front of the legacy and new systems.
4. Build the capability in the new system and add automated tests, monitoring, and reconciliation.
5. Route a small percentage of suitable traffic to the new implementation.
6. Compare errors, latency, and business results with the legacy path.
7. Increase traffic gradually when the results are acceptable. Use a feature flag or routing rule for a fast rollback.
8. Move ownership of the related data and remove legacy code only after callers and dependencies have migrated.

Data is usually harder than request routing. A team should define one owner for each piece of data. Temporary techniques such as change-data capture, event replication, or controlled dual writes can support the transition, but they need reconciliation and idempotency.

## 4. Practical example

A bank wants to replace a legacy payments application. It first moves the read-only payment-history API to an ASP.NET Core service.

The API gateway initially sends employee traffic to the new service and customer traffic to the legacy application. The team checks response accuracy, authorization, latency, and audit logs. It then enables the new service for 5%, 25%, and finally 100% of customers.

Payment creation remains in the legacy system during this phase. New payment records are published to the history service through an outbox and message broker. Reconciliation jobs compare both systems. Once the new service is stable and all consumers have migrated, the old history module is retired.

## 5. Scenario-based interview answer

“In one payment platform, we needed to move away from a large legacy application, but a full rewrite and single cutover were too risky.

The decision was to migrate by business capability. We started with payment history because it was read-heavy, had a clear boundary, and did not initiate money movement.

We placed routing at the API gateway, built the new capability in ASP.NET Core, and fed it through events published with the outbox pattern. We first used shadow comparisons, then enabled traffic for internal users and gradually increased the customer percentage. Dashboards covered latency, errors, missing records, and reconciliation differences. A feature flag allowed us to route traffic back immediately.

The capability reached 100% traffic without a large outage. We also learned how to handle identity, events, and observability before migrating higher-risk payment operations. After the agreed stability period, we removed the old module and its database access.”

## 6. Code example

The following ASP.NET Core middleware shows a simplified routing decision. In a real system, the destination would normally be configured in an API gateway or reverse proxy such as YARP, and the rollout percentage would come from controlled configuration or a feature-management service.

```csharp
using System.Security.Cryptography;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

const int migrationPercentage = 10;
var legacyBaseUri = new Uri("https://legacy.internal");
var newBaseUri = new Uri("https://payments-v2.internal");

app.MapGet("/routing/payment-history/{customerId}",
    (string customerId) =>
    {
        var hash = SHA256.HashData(
            System.Text.Encoding.UTF8.GetBytes(customerId));

        var bucket = BitConverter.ToUInt32(hash, 0) % 100;
        var destination = bucket < migrationPercentage
            ? newBaseUri
            : legacyBaseUri;

        return Results.Ok(new
        {
            CustomerId = customerId,
            Destination = destination.ToString()
        });
    });

app.Run();
```

Hashing the customer ID gives the same customer the same route, which is safer than making a random choice for every request. The percentage can be increased gradually. Production routing must also include authentication, timeouts, health checks, telemetry, and a tested rollback rule.

## 7. Common mistakes

- Starting with the most critical capability before proving the migration approach.
- Treating the work as only a code migration and ignoring data ownership.
- Allowing both systems to update the same data without conflict rules.
- Using uncontrolled dual writes, which can leave the systems inconsistent after a partial failure.
- Migrating traffic without business-level reconciliation and observability.
- Having no fast rollback path or testing rollback only after a failure.
- Creating many permanent integrations between the old and new systems.
- Leaving migrated legacy code running indefinitely and never completing decommissioning.
- Changing behaviour during migration without documenting whether the difference is intentional.

## 8. Follow-up interview questions

### How is incremental migration related to the Strangler Fig pattern?

Incremental migration is the broader approach. Strangler Fig is one implementation pattern in which a routing layer gradually replaces parts of a legacy system with new implementations.

### How do you handle data during an incremental migration?

Define a clear system of record, replicate changes through reliable mechanisms such as an outbox and events, make consumers idempotent, and run reconciliation. Avoid long-term bidirectional synchronization where possible.

### How do you know when a migrated capability is ready for full traffic?

Use agreed measures such as functional accuracy, reconciliation results, error rate, latency, security checks, and stability over time. Increase traffic in stages and keep rollback available until the new path is proven.
