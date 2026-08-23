# 21. How do you prioritise components for migration?

**Technology:** .NET Framework to Modern .NET

**Source question:** 21. How do you prioritise components for migration?

## 1. What is it?

Prioritising components for migration means deciding which parts of a legacy application should move to modern .NET first, which should move later, and which should be replaced, retired, or temporarily retained.

I do not prioritise only by technical age. I compare business value, migration difficulty, operational risk, security, dependencies, and how much each component blocks other work.

## 2. Why is it important?

Large applications cannot usually be migrated safely in one release. A good order gives the organisation useful results early while reducing the chance of production incidents.

The right priorities can:

- Remove unsupported or vulnerable technology sooner.
- Deliver high-value features on modern .NET earlier.
- Prove the migration approach with a manageable component.
- Unblock several other components by moving shared dependencies first.
- Spread delivery and operational risk across smaller releases.
- Avoid spending money on components that will soon be retired.

The highest business-value component is not always the best first component. If it is deeply coupled and business-critical, the team may first migrate a smaller representative component and use what it learns to reduce the larger migration's risk.

## 3. How does it work?

I normally use the following process:

1. Build an inventory of applications, libraries, services, scheduled jobs, databases, integrations, and owners.
2. Map dependencies so the team knows which components block or depend on others.
3. Score each component for business value, security and support urgency, change frequency, incident rate, migration effort, coupling, test coverage, and retirement plans.
4. Identify prerequisite work such as removing a shared incompatible library or defining an API boundary.
5. Group the components into migration waves rather than treating the score as an automatic answer.
6. Start with a useful but controlled component that exercises the build, deployment, observability, data, and support process.
7. Reassess the order after every wave because estimates, dependencies, and business priorities can change.

A typical order is:

- **Urgent risk:** unsupported runtimes, serious security findings, or unreliable components.
- **Enablers:** shared libraries, contracts, build pipelines, authentication boundaries, or adapters that unblock other work.
- **Quick wins:** valuable, well-tested, and loosely coupled components.
- **Complex core components:** high-value but tightly coupled or high-risk areas, migrated after the approach is proven.
- **Retire or retain:** low-value components that should be decommissioned or isolated instead of rewritten.

Scores support the decision, but they do not replace engineering and business judgement.

## 4. Practical example

A bank has a .NET Framework payment platform containing a customer-notification service, a fraud rules service, a payment-processing engine, and several shared libraries.

The payment engine has the highest business value, but it is tightly coupled to the database and a Windows-only library. Migrating it first would create too much operational risk. The notification service is loosely coupled, has good automated tests, and uses the same messaging, logging, and deployment patterns needed by the wider platform.

The bank migrates the notification service first as a controlled pilot. It then replaces the incompatible shared library and introduces stable message contracts. The fraud service moves in the second wave, followed by the payment engine after shadow testing and reconciliation are available. An unused reporting job is retired instead of migrated.

This order delivers an early production result, proves the delivery process, and reduces risk before changing the critical payment path.

## 5. Scenario-based interview answer

“In one payment modernisation programme, we had more than twenty .NET Framework components, so I did not prioritise them only by size or business visibility.

The problem was that the core payment service had high value but also had the most coupling, the weakest test coverage, and the largest production impact. I worked with product, security, operations, and engineering teams to inventory the components and score business value, support risk, incidents, dependency impact, migration effort, and test readiness.

We decided to migrate a smaller message-driven component first because it was valuable, representative, and safe enough for a pilot. We used it to establish the modern .NET build pipeline, container deployment, observability, rollback process, and support runbook. In parallel, we removed an incompatible shared dependency that blocked several later migrations. We then moved medium-risk services before the core payment path, where we used contract tests, shadow traffic, and financial reconciliation.

The result was that we delivered value early, improved our estimates, and migrated the critical service with much lower risk. We reviewed the priority after each wave rather than treating the original roadmap as fixed.”

## 6. Code example

A small scoring model can make the initial discussion consistent and visible:

```csharp
public sealed record MigrationCandidate(
    string Name,
    int BusinessValue,
    int SecurityUrgency,
    int DependencyImpact,
    int ChangeFrequency,
    int MigrationEffort,
    int OperationalRisk)
{
    public int PriorityScore =>
        (BusinessValue * 3) +
        (SecurityUrgency * 3) +
        (DependencyImpact * 2) +
        ChangeFrequency -
        (MigrationEffort * 2) -
        (OperationalRisk * 2);
}

MigrationCandidate[] candidates =
[
    new("Notification service", 3, 2, 3, 4, 2, 2),
    new("Payment engine",       5, 4, 5, 5, 5, 5),
    new("Unused reporting job", 1, 1, 1, 1, 3, 1)
];

foreach (var item in candidates.OrderByDescending(x => x.PriorityScore))
{
    Console.WriteLine($"{item.Name}: {item.PriorityScore}");
}
```

The weights express the organisation's current priorities. A high score suggests a strong migration candidate, but the team must still check dependency order, regulatory deadlines, test readiness, and whether retirement is a better choice. Collection expressions such as `[...]` require C# 12 or later; on an older compiler, use a normal array initializer.

## 7. Common mistakes

- Migrating the easiest components first even when they deliver no value or reduce no risk.
- Starting with the most critical and tightly coupled component before proving the migration process.
- Using a score as an automatic decision without reviewing dependencies and business deadlines.
- Ignoring unsupported runtimes, security findings, vendor support, or regulatory commitments.
- Migrating shared libraries without knowing which applications consume them.
- Rewriting components that should be retired or replaced by a supported product.
- Ignoring data migration, authentication, deployment, monitoring, rollback, and support readiness.
- Prioritising by code size alone; a small component can have a large operational impact.
- Creating a fixed multi-year roadmap and not revisiting it after each migration wave.
- Failing to involve product owners, security, operations, and business users in the decision.

## 8. Follow-up interview questions

### What factors would you include in a migration scorecard?

Business value, security and support urgency, incident history, change frequency, dependency impact, migration effort, coupling, test coverage, operational risk, and planned retirement date.

### Would you migrate shared libraries or business services first?

It depends on the dependency map. I migrate or replace a shared library first when it blocks several services, but I avoid changing it in isolation without testing all consumers. Sometimes an adapter or stable contract is safer than migrating every consumer together.

### How do you choose the first migration pilot?

Choose a component that has real value, a controlled failure impact, reasonable test coverage, and patterns representative of later work. It should test the full delivery and operating process without putting the most critical business flow at unnecessary risk.
