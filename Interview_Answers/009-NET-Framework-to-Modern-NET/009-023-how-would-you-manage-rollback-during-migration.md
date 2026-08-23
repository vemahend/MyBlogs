# 23. How would you manage rollback during migration?

**Technology:** .NET Framework to Modern .NET

**Source question:** 23. How would you manage rollback during migration?

## 1. What is it?

Rollback management is the plan for returning production traffic to the stable .NET Framework application if the modern .NET version causes a serious problem.

It is more than redeploying an old package. A safe rollback also considers database changes, messages, caches, API contracts, user sessions, configuration, and data created while the new application was running.

In some cases, a quick **roll-forward** fix is safer than rollback, especially after an irreversible data change. The team should define both options before deployment.

## 2. Why is it important?

A migration can pass all tests and still fail under real traffic because of runtime differences, unsupported libraries, configuration errors, performance problems, or changed serialization behavior.

A planned rollback:

- Reduces customer impact and recovery time.
- Prevents rushed decisions during an incident.
- Protects data when old and new versions use the same database.
- Gives the team confidence to release in small, controlled steps.
- Makes ownership, rollback triggers, and verification steps clear.

For senior developers and architects, rollback is part of the migration design. It should not be written after the release has failed.

## 3. How does it work?

I normally manage rollback through these steps:

1. **Capture a baseline.** Record the current error rate, latency, throughput, business success rate, and infrastructure usage of the .NET Framework application.
2. **Keep releases independently deployable.** Store the previous application artifact, configuration, infrastructure definition, and dependency versions. Never rebuild the old release during an incident.
3. **Make data changes backward compatible.** Use the expand-and-contract approach: add new tables or nullable columns first, deploy compatible code, backfill data, switch reads, and remove old fields only after the rollback window closes.
4. **Release gradually.** Run the old and new applications side by side and route a small percentage of traffic to modern .NET. Increase traffic only when technical and business metrics are healthy.
5. **Use feature flags.** Separate risky behavior from the deployment so a feature can be disabled without replacing the whole application.
6. **Define automatic and manual triggers.** Examples include a payment failure rate above an agreed limit, increased response time, data mismatches, or a security issue.
7. **Stop and isolate the new version.** Route traffic back to the old version, disable its message consumers and scheduled jobs, and prevent two versions from processing the same work.
8. **Handle changed data safely.** Reverse only changes that have a tested down migration. Otherwise, keep the compatible schema and roll back application traffic, or roll forward with a corrective release.
9. **Verify recovery.** Check health metrics, important business transactions, queues, logs, and data consistency. Record the incident and improve the next release plan.

Blue-green deployment, deployment slots, a reverse proxy, or a service mesh can make traffic switching fast. The exact tool is less important than testing the rollback procedure with production-like data.

## 4. Practical example

Consider a bank migrating a payment API from .NET Framework 4.8 to a supported modern .NET version. Both versions initially use the same SQL database and accept the same API contract.

The team deploys the modern service beside the old service and sends 5% of payment requests to it. A dashboard compares authorization success rate, duplicate-payment checks, latency, and database errors between both versions.

After traffic reaches 25%, the modern service starts timing out when a legacy fraud provider responds slowly. The agreed rollback threshold is breached. The team routes new traffic back to the .NET Framework service, disables the modern service's queue consumer, and waits for its in-flight requests to finish. No database rollback is required because the release only added a nullable column and both versions can read the schema.

After fixing and load-testing the timeout policy, the team deploys a new build and repeats the canary release.

## 5. Scenario-based interview answer

**Problem:** “In one migration, we had to move a business-critical payment service from .NET Framework to modern .NET without creating a long outage or risking duplicate payments.”

**Decision:** “I chose a parallel, gradual migration rather than a one-time replacement. The old service remained available as the rollback target. We also agreed on measurable rollback triggers before the release, including payment failure rate, p95 latency, and reconciliation mismatches.”

**Implementation:** “We used backward-compatible database changes, versioned deployment artifacts, and feature flags. We first mirrored requests without executing payments, compared the results, and then enabled a small amount of live traffic. Only one version owned each queue consumer and scheduled job. Our runbook explained how to stop traffic, drain in-flight work, disable the new consumers, restore routing, and verify payment reconciliation. We rehearsed that runbook in staging.”

**Result:** “When a dependency timeout appeared under production load, we restored all traffic to the old application within minutes without losing or duplicating a payment. We kept the compatible database change, fixed the problem, and released again gradually. The important point is that rollback was designed and tested as part of the migration, not treated as a last-minute deployment command.”

## 6. Code example

A feature flag can provide a fast functional rollback while both implementations remain available:

```csharp
public interface IPaymentProcessor
{
    Task<PaymentResult> ProcessAsync(
        PaymentRequest request,
        CancellationToken cancellationToken);
}

public sealed class PaymentRouter(
    IFeatureManager featureManager,
    LegacyPaymentProcessor legacyProcessor,
    ModernPaymentProcessor modernProcessor)
{
    public async Task<PaymentResult> ProcessAsync(
        PaymentRequest request,
        CancellationToken cancellationToken)
    {
        var useModernProcessor = await featureManager
            .IsEnabledAsync("UseModernPaymentProcessor");

        var processor = useModernProcessor
            ? (IPaymentProcessor)modernProcessor
            : legacyProcessor;

        return await processor.ProcessAsync(request, cancellationToken);
    }
}
```

This example uses `IFeatureManager` from `Microsoft.FeatureManagement`. Turning off `UseModernPaymentProcessor` sends new work to the stable path without redeploying the application.

Both processors must follow the same contract. Payment requests should also carry an idempotency key so retries or a switch between versions cannot create duplicate payments. A feature flag helps with behavior rollback, but it does not replace deployment rollback, database compatibility, monitoring, or a tested runbook.

## 7. Common mistakes

- Treating rollback as simply redeploying the previous binary.
- Making destructive database changes, such as dropping or renaming a column, in the same release that starts using the new model.
- Allowing old and new scheduled jobs or message consumers to process the same work.
- Rebuilding the old version instead of keeping a tested, immutable artifact.
- Changing API or message contracts in a way the old application cannot understand.
- Having no clear metric, threshold, decision owner, or time limit for rollback.
- Rolling back while requests are still in flight, causing lost or duplicate operations.
- Forgetting that configuration, secrets, runtime settings, and infrastructure must also be version-compatible.
- Assuming a database down script is safe without testing it using realistic data volumes.
- Keeping feature flags forever instead of removing them after the migration is stable.
- Performing the rollback for the first time during a production incident.

## 8. Follow-up interview questions

### 1. How do you handle database rollback when both versions share a database?

Use expand-and-contract migrations. Add backward-compatible structures first and delay destructive changes until the old application is retired and the rollback window has closed. Prefer rolling the application back while keeping the expanded schema.

### 2. When would you roll forward instead of rolling back?

Roll forward when the new version has already written data the old version cannot safely interpret, when reversing a large migration is risky, or when a small, tested fix can restore service faster. This decision should be included in the incident runbook.

### 3. How do you prevent duplicate processing during rollback?

Give each request an idempotency key, store the processing result, and ensure only one deployment owns a queue partition, consumer group, or scheduled job at a time. Drain or stop the new version before enabling the old consumer.
