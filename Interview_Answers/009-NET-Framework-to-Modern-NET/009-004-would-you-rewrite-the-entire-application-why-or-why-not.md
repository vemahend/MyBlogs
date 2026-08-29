# 4. Would you rewrite the entire application? Why or why not?

**Technology:** .NET Framework to Modern .NET

**Source question:** 4. Would you rewrite the entire application? Why or why not?

## 1. What is it?

I would not normally rewrite the entire application in one large project. A full rewrite means rebuilding all features on modern .NET and replacing the old system at one time. This is often called a big-bang rewrite.

For a large business application, I would usually modernize it in small, controlled steps. I would keep the working .NET Framework system running, move one business capability at a time to modern .NET, and retire each old part after the new part is proven. This is commonly called the Strangler Fig pattern.

A full rewrite can still be the right choice for a small application, a system with little business value, or a codebase that cannot be changed safely. It should be a decision based on evidence, not a default rule.

## 2. Why is it important?

A mature application contains more than source code. It also contains years of business rules, production fixes, integrations, security controls, and unusual cases that may not be documented. Rewriting everything can accidentally remove that knowledge.

An incremental approach is usually safer because it:

- Delivers value before the entire migration is finished.
- Allows old and new parts to run together.
- Limits the impact of a failed release.
- Makes rollback easier.
- Lets the team learn modern .NET while working on a smaller area.
- Avoids freezing business development for a long rewrite project.

The goal is not simply to produce newer code. The goal is to improve supportability, security, deployment, and delivery speed without putting the business at unnecessary risk.

## 3. How does it work?

I would first assess the application rather than immediately changing its target framework. I would map its business modules, dependencies, database use, traffic, operational risks, and unsupported technologies such as ASP.NET Web Forms, `System.Web`, WCF server endpoints, or old third-party libraries.

The migration would then work like this:

1. Add automated characterization tests around important existing behavior.
2. Separate business logic from UI, infrastructure, and .NET Framework-specific code where practical.
3. Choose a capability with clear boundaries and manageable risk.
4. Build that capability on a supported modern .NET release, normally the current LTS version.
5. Route selected requests or messages to the new implementation through an API gateway, reverse proxy, facade, or message broker.
6. Run controlled tests, compare results, monitor errors and business metrics, and gradually increase traffic.
7. Remove the old capability only after the new one is stable and rollback is no longer needed.
8. Repeat until the remaining legacy application is small enough to retire or no longer worth migrating.

Data ownership needs special care. At first, the new component may call the legacy system through an API. Later, it can take ownership of its data. Allowing both systems to update the same tables for a long time creates tight coupling and makes retirement difficult.

## 4. Practical example

Consider a bank whose .NET Framework application handles customer accounts, payments, statements, and notifications. Rewriting all modules together would put payment processing and regulatory reporting at risk.

I would start with notifications because they have a clearer boundary and are less critical than payment authorization. The existing application would publish a `PaymentCompleted` event. A new worker service on .NET 10 LTS would consume the event and send email or SMS messages. During rollout, the bank could compare delivery results with the old notification process and enable the new service for a small group of customers first.

After the new service meets reliability and audit requirements, the old notification code could be removed. The team could then migrate another bounded capability. Core payment processing would remain unchanged until the tests, controls, and migration plan were strong enough.

## 5. Scenario-based interview answer

**Scenario:** An interviewer asks whether I would rewrite a ten-year-old .NET Framework banking application because the code is difficult to maintain.

**Answer:**

“I would not recommend a complete rewrite only because the code is old. First, I would assess the business value, production stability, test coverage, dependencies, security issues, and the cost of keeping it on .NET Framework.

The problem with a big-bang rewrite is that we must reproduce years of hidden business rules before users receive any benefit. It also creates a risky cutover where many things can fail at the same time.

My decision would normally be an incremental migration. I would add characterization tests, identify bounded business capabilities, and select a useful but lower-risk area first. I would build that area on the current .NET LTS release, place a stable API or messaging contract between the systems, and route traffic gradually. I would use feature flags, observability, reconciliation reports, and a tested rollback path during the transition.

The result would be regular business delivery and a measurable reduction in legacy code without risking the whole banking platform. I would choose a full rewrite only if the application were small, its behavior were well understood, incremental separation were more expensive than replacement, and the business accepted the cutover risk.”

## 6. Code example

During an incremental migration, a routing abstraction can switch one capability between the legacy system and the modern implementation:

```csharp
public interface IStatementService
{
    Task<Statement> GetAsync(
        string accountId,
        CancellationToken cancellationToken);
}

public sealed class StatementRouter(
    LegacyStatementClient legacy,
    ModernStatementClient modern,
    IFeatureManager features) : IStatementService
{
    public async Task<Statement> GetAsync(
        string accountId,
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

`IStatementService` gives the calling code one stable contract. The feature flag controls which implementation receives the request, so the team can release gradually and return to the legacy path if the new service has a problem. In production, the flag should support a controlled rollout, and both clients should have timeouts, tracing, and appropriate resilience policies. A flag is a transition tool; it should be removed after the migration is complete.

## 7. Common mistakes

- Choosing a rewrite because the team prefers new technology, without proving business value.
- Underestimating undocumented rules and rare production cases in the old application.
- Trying to reproduce every old feature, including features that users no longer need.
- Migrating the UI, services, and database in one release with no safe rollback.
- Starting with the most critical and tightly coupled module instead of learning from a smaller boundary.
- Creating a distributed monolith where new services still share the legacy database and deployment process.
- Running old and new implementations without reconciliation, tracing, or business-level monitoring.
- Keeping temporary feature flags, adapters, and duplicate code forever.
- Treating migration as only a framework upgrade and ignoring security, operations, team skills, and data ownership.
- Assuming a rewrite will automatically produce good architecture; new code can repeat the same design problems.

## 8. Follow-up interview questions

### When would you approve a full rewrite?

I would consider it when the application is small, its behavior is well tested and understood, most of its technology is unsupported, incremental migration has little value, and the business can accept the cost and cutover risk. I would still deliver and validate it in small slices where possible.

### How would you choose the first capability to migrate?

I would look for a capability with a clear business boundary, few dependencies, measurable value, and moderate operational risk. It should teach the team about deployment and integration without putting the most critical transaction flow at risk.

### How do you know whether the migration is succeeding?

I would track business correctness, error rate, latency, availability, deployment frequency, recovery time, support effort, infrastructure cost, and the amount of legacy code retired. Technical completion alone is not enough; the migration must improve business and operational outcomes.
