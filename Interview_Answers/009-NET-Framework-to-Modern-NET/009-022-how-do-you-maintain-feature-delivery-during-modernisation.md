# 22. How do you maintain feature delivery during modernisation?

**Technology:** .NET Framework to Modern .NET

**Source question:** 22. How do you maintain feature delivery during modernisation?

## 1. What is it?

Maintaining feature delivery during modernisation means continuing to deliver useful business changes while parts of a .NET Framework system are being moved to modern .NET.

The migration and normal product work should not become two competing rewrites. I split the system into safe boundaries, keep contracts stable, and move capability in small steps. Features can then be added to the legacy side, the modern side, or both, depending on where the relevant business capability currently lives.

## 2. Why is it important?

A large modernisation can take months or years. The business cannot normally stop launching products, meeting regulatory dates, fixing defects, or responding to customers during that time.

A controlled approach helps the team:

- Keep delivering customer and regulatory value.
- Avoid a long-lived rewrite that produces no usable result until the end.
- Reduce merge conflicts and duplicate implementations.
- Learn from production after each small migration step.
- Roll back one capability without rolling back the whole programme.
- Maintain stakeholder confidence through visible, regular outcomes.

For architects, the challenge is not simply allocating more developers. It is designing boundaries and delivery practices that let old and new code change safely at the same time.

## 3. How does it work?

I normally use an incremental delivery model:

1. **Create one product backlog.** Feature work, defects, risk reduction, and migration work are prioritised together. This makes capacity and trade-offs visible.
2. **Map business capabilities and dependencies.** Choose small vertical slices that include code, data, tests, deployment, and monitoring.
3. **Introduce a stable boundary.** Use an API, message contract, or interface so callers do not depend directly on whether .NET Framework or modern .NET implements the capability.
4. **Use the strangler pattern or branch by abstraction.** Put the new implementation behind the boundary and move traffic gradually. Avoid keeping large source-control branches alive for months.
5. **Make contracts backward compatible.** Add fields before removing old ones, version only when necessary, and use expand-and-contract changes for databases and messages.
6. **Release independently.** Use automated builds, tests, deployment, health checks, logging, metrics, and a clear rollback path for both runtimes.
7. **Control exposure.** Feature flags, tenant allow-lists, canary releases, or routing rules allow a new feature or migrated path to be enabled gradually.
8. **Remove temporary paths.** Once production evidence shows the modern implementation is correct, remove the old route, compatibility code, and flag.

I also reserve explicit team capacity for modernisation. The percentage can change with business deadlines, but migration work must have owners and measurable outcomes. Otherwise urgent feature work will continually displace it.

## 4. Practical example

A bank has a .NET Framework internet-banking application and needs to add scheduled payments while modernising the payment area.

The team first defines a versioned payment command and query API. The legacy application calls that API rather than its internal payment classes. A new modern .NET payment service implements scheduled payments, while immediate payments still go to the legacy implementation through an adapter.

A routing flag enables scheduled payments for employees and then for a small customer group. Both paths publish the same audit events and use the same idempotency key. The team compares payment totals and failure rates before increasing traffic.

This delivers the new feature on the target platform without waiting for every payment function to be migrated. Later, immediate payments are moved behind the same boundary and the legacy adapter is removed.

## 5. Scenario-based interview answer

“In one banking modernisation, the business still had regulatory and customer features to deliver, so pausing feature work for a full rewrite was not an option.

The problem was that feature teams and migration teams were changing the same tightly coupled .NET Framework code. That caused conflicts, duplicate work, and uncertain release dates. We decided to organise the roadmap around business capabilities and keep a single backlog. For each capability, we introduced a stable API or message boundary and chose whether the next feature belonged in the legacy component or the modern service. New strategic features went to modern .NET where practical, but we did not force low-value changes through a risky migration just to follow a rule.

We used short-lived branches, contract tests, backward-compatible database changes, and independent deployment pipelines. Feature flags and canary routing let us release the new path to a small group first. For payment flows, we also used idempotency, audit events, and reconciliation so that switching or retrying traffic could not create duplicate transactions. Each migration slice included monitoring and rollback, and we removed the old path only after production validation.

The result was that the business kept its normal release cadence while migration risk decreased. We delivered features throughout the programme instead of waiting for a big-bang cutover, and each completed capability reduced the amount of legacy code we had to change.”

## 6. Code example

Branch by abstraction allows a caller to stay unchanged while traffic moves between implementations:

```csharp
public sealed record PaymentRequest(
    string PaymentId,
    decimal Amount,
    string AccountId);

public interface IPaymentProcessor
{
    Task ProcessAsync(PaymentRequest request, CancellationToken cancellationToken);
}

public sealed class RoutedPaymentProcessor(
    LegacyPaymentProcessor legacy,
    ModernPaymentProcessor modern,
    IMigrationRoute route) : IPaymentProcessor
{
    public Task ProcessAsync(
        PaymentRequest request,
        CancellationToken cancellationToken)
    {
        return route.UseModernPath(request.AccountId)
            ? modern.ProcessAsync(request, cancellationToken)
            : legacy.ProcessAsync(request, cancellationToken);
    }
}

public interface IMigrationRoute
{
    bool UseModernPath(string accountId);
}
```

`IPaymentProcessor` is the stable boundary. `RoutedPaymentProcessor` can route selected accounts to the modern implementation without changing its callers. The route could read a centrally managed feature flag, but the decision should be observable and have a safe default.

In a real payment system, both implementations must honour the same idempotency key and business contract. The flag controls routing; it is not a substitute for contract tests, reconciliation, timeouts, or rollback. The example uses primary constructors, available from C# 12; use a normal constructor if the project uses an older C# compiler.

## 7. Common mistakes

- Stopping all feature delivery until a big-bang rewrite is complete.
- Running separate feature and migration backlogs with conflicting priorities.
- Developing on long-lived branches that are difficult to merge and test.
- Implementing the same feature independently in legacy and modern code without a shared contract.
- Sending dual writes or retries without idempotency, especially for payments.
- Making breaking API, event, or database changes while old and new versions run together.
- Using feature flags without owners, expiry dates, monitoring, or a safe default.
- Migrating only technical layers instead of complete, deployable business slices.
- Sending traffic to the new path before automated contract, integration, and regression tests exist.
- Calling deployment successful without health metrics, business reconciliation, and a tested rollback route.
- Allowing urgent product work to consume all modernisation capacity every sprint.
- Leaving legacy routes, adapters, and temporary flags in place after cutover.

## 8. Follow-up interview questions

### Should all new features be built only in modern .NET?

That is a useful preference, not an absolute rule. I consider the capability's migration timing, dependencies, business deadline, and production risk. I avoid adding major investment to code that will soon be retired, but a small legacy change can be safer than forcing an unplanned migration.

### How do you avoid maintaining two implementations forever?

Give every temporary route and feature flag an owner and removal date. Define exit checks such as traffic level, error rate, reconciliation results, and rollback readiness. Once those checks pass, remove the old implementation and compatibility code as part of the same delivery plan.

### How do you prevent contract changes from blocking releases?

Use consumer-driven contract tests and backward-compatible changes. Add new fields or endpoints first, deploy consumers gradually, and remove old fields only after all consumers have moved. Use explicit versioning when compatibility cannot be preserved.
