# 5. Why would you avoid a big-bang rewrite?

**Technology:** .NET Framework to Modern .NET

**Source question:** 5. Why would you avoid a big-bang rewrite?

## 1. What is it?

A big-bang rewrite means replacing the whole legacy application with a new application in one large project and switching all users to it at once.

I would usually avoid this approach for a large .NET Framework system. The old system contains years of business rules, fixes, integrations, and operational knowledge. Some of that behaviour may not be documented, so a new system can easily miss it.

Avoiding a big-bang rewrite does not mean keeping the legacy system forever. It means modernising it in small, controlled parts, often using the strangler pattern, until the old application can be safely retired.

## 2. Why is it important?

A big-bang rewrite creates several risks at the same time:

- The business waits a long time before receiving value.
- Requirements continue to change while the rewrite is in progress.
- Hidden business rules can be lost.
- Testing every workflow and integration at once is difficult.
- Deployment and rollback become high-risk events.
- The old and new teams may have to maintain two large systems for a long period.

An incremental migration reduces the size of each change. The team can release useful improvements early, compare new behaviour with the existing system, gather production feedback, and roll back one capability without rolling back the entire platform.

## 3. How does it work?

A controlled migration normally follows this flow:

1. Assess the application, business workflows, dependencies, data, performance needs, and production risks.
2. Create clear boundaries around business capabilities such as customer profile, authentication, or payments.
3. Introduce an API, gateway, or abstraction so callers do not need to know whether the capability is handled by the old or new system.
4. Move one low-risk but valuable capability to a supported modern .NET version.
5. Use automated tests, observability, feature flags, and staged traffic to verify it.
6. Move more traffic to the new capability and retire the matching legacy code.
7. Repeat until the remaining legacy application is small enough to remove.

For shared data, the team should define ownership carefully. Temporary synchronisation may be necessary, but permanent dual writes should be avoided because partial failures can leave the two systems inconsistent.

## 4. Practical example

Consider a .NET Framework banking portal that handles customer profiles, statements, transfers, and payments. Rewriting all modules before releasing anything could take years, and a missed transfer rule could cause financial loss.

The team first moves statement generation to an ASP.NET Core service on a currently supported modern .NET release. The portal calls a stable statement interface, and a feature flag routes a small group of employees to the new service. The team compares generated statements, latency, and error rates with the legacy implementation. After a gradual rollout, the old statement module is removed. Payments and transfers are migrated later because they have greater business and regulatory risk.

This delivers value early while keeping each production change small and reversible.

## 5. Scenario-based interview answer

“I would avoid a big-bang rewrite for a business-critical .NET Framework application because its real behaviour is usually larger than its documentation. Years of production fixes and edge cases are hidden in the code and database, so replacing everything at once creates a long feedback gap and a very risky cutover.

In one payment platform, we had an aging monolith but could not stop normal product delivery. We chose an incremental strangler approach. We mapped the dependencies, added stable interfaces at the boundaries, and moved read-only capabilities first. We then migrated higher-risk payment functions one workflow at a time. Each release used contract tests, production metrics, feature flags, and a tested rollback path.

That decision let us release value every few weeks, compare new and old behaviour, and limit failures to one capability. We eventually reduced the legacy application without asking the business to accept one irreversible migration event. I would still consider a full replacement for a genuinely small, well-understood, low-risk system, but I would base that decision on evidence from the assessment.”

## 6. Code example

An abstraction can let the application move one capability without changing every caller:

```csharp
public interface IStatementService
{
    Task<Statement> GetAsync(
        Guid accountId,
        CancellationToken cancellationToken);
}

public sealed class RoutedStatementService(
    LegacyStatementService legacy,
    ModernStatementClient modern,
    IFeatureManager features) : IStatementService
{
    public async Task<Statement> GetAsync(
        Guid accountId,
        CancellationToken cancellationToken)
    {
        var useModernService =
            await features.IsEnabledAsync("ModernStatements");

        return useModernService
            ? await modern.GetAsync(accountId, cancellationToken)
            : await legacy.GetAsync(accountId, cancellationToken);
    }
}
```

`IStatementService` gives callers one stable contract. The router selects the legacy implementation or the modern service through a feature flag. This supports gradual rollout and quick rollback. In production, routing may also use customer cohorts or traffic percentages, and both paths should have metrics and contract tests.

## 7. Common mistakes

- Starting the rewrite without mapping business rules, dependencies, and data ownership.
- Treating an incremental migration as an excuse to run two complete platforms forever.
- Copying the old design into modern .NET without improving clear architectural problems.
- Migrating the hardest, most critical workflow first instead of proving the migration path safely.
- Allowing uncontrolled dual writes to legacy and modern databases.
- Having no automated regression, contract, performance, or security tests.
- Switching all traffic at once without feature flags, monitoring, or a rollback plan.
- Ignoring ongoing feature work in the legacy system, causing the new implementation to fall behind.
- Declaring success before legacy code, infrastructure, and support processes are retired.

## 8. Follow-up interview questions

### When might a full rewrite be reasonable?

It may be reasonable when the system is small, well understood, poorly suited to incremental separation, and cheap to replace. The team still needs clear acceptance tests, a migration plan, and a rollback strategy.

### What is the strangler pattern?

It is an incremental replacement approach. New components take over selected capabilities or traffic while the legacy system continues to handle the rest. The legacy system shrinks until it can be retired.

### How do you choose the first capability to migrate?

Choose a capability with a clear boundary, useful business value, manageable dependencies, and moderate risk. It should prove the delivery, routing, testing, monitoring, and rollback process before the team moves critical workflows.
