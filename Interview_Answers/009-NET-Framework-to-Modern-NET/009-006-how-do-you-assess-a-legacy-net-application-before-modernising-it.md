# 6. How do you assess a legacy .NET application before modernising it?

**Technology:** .NET Framework to Modern .NET

**Source question:** 6. How do you assess a legacy .NET application before modernising it?

## 1. What is it?

Assessing a legacy .NET application means building an evidence-based picture of the system before choosing a migration approach.

I look at more than the target framework. I examine business-critical workflows, source code, project types, NuGet and third-party libraries, Windows-only APIs, databases, integrations, deployment, security, performance, tests, and production support. The output is a dependency map, a risk list, and a phased modernisation plan with realistic effort estimates.

The assessment answers three main questions: what can move easily, what needs redesign or replacement, and what should remain temporarily on .NET Framework.

## 2. Why is it important?

A legacy system often contains undocumented business rules and hidden dependencies. A project may compile successfully but still fail in production because it relies on Windows authentication, COM, the registry, local files, scheduled tasks, or database behaviour that the team did not discover.

A proper assessment helps architects:

- Protect critical business behaviour during the migration.
- Find unsupported APIs and packages early.
- Choose between an in-place upgrade, incremental replacement, or limited rewrite.
- Estimate cost and sequence work based on evidence.
- Define testing, security, performance, deployment, and rollback needs.
- Select a supported modern .NET version that fits the organisation's support timeline.

Without this work, a migration estimate is mostly guesswork.

## 3. How does it work?

I assess the application in a structured flow:

1. **Understand business use.** Identify owners, users, critical journeys, service-level targets, compliance rules, peak periods, and the cost of failure.
2. **Baseline production.** Record request volume, latency, error rates, resource use, batch duration, deployment frequency, and recurring incidents.
3. **Inventory the solution.** List projects, .NET Framework versions, application types, NuGet packages, external assemblies, build tools, IIS settings, Windows services, scheduled jobs, and deployment scripts.
4. **Map dependencies.** Trace calls to databases, queues, file shares, APIs, identity providers, COM components, the registry, and other internal systems. Include runtime dependencies that are not visible in project references.
5. **Check compatibility.** Use static analysis and trial builds to find unavailable APIs, unsupported packages, old project formats, `System.Web`, WCF server code, remoting, and other framework-specific features. Tools provide clues; they do not replace runtime testing.
6. **Assess architecture and data.** Find tightly coupled modules, shared databases, transaction boundaries, data ownership, session state, caching, and places where separation is safe.
7. **Assess quality and operations.** Review automated tests, security findings, secrets, logging, monitoring, release automation, infrastructure, recovery procedures, and rollback capability.
8. **Run a small proof of concept.** Upgrade or isolate one representative slice to expose unknown issues and validate the toolchain.
9. **Create a migration backlog.** Group components as straightforward, requiring code changes, requiring replacement, or temporarily blocked. Prioritise by business value, risk, dependency order, and effort.

The final recommendation may combine approaches. For example, reusable libraries may be retargeted, an ASP.NET application may be migrated incrementally, and a Windows-only adapter may remain behind an interface until it can be replaced.

## 4. Practical example

Consider a .NET Framework 4.7.2 payment application hosted in IIS. It accepts card payments, runs settlement jobs, and calls a bank through a vendor SDK.

The assessment finds that the domain libraries can move with small changes, but the web layer depends heavily on `System.Web`. The settlement job reads certificates from the Windows certificate store, and the bank SDK supports only .NET Framework. Production metrics also show that settlement is the highest-risk workflow, while payment-status queries are read-only and well tested.

The team therefore moves the domain libraries first, places the bank SDK behind an adapter that remains on .NET Framework, and builds the status-query API on a supported modern .NET release. Contract tests verify its responses, and a feature flag controls traffic. Settlement is migrated only after the vendor provides a supported SDK or the team replaces the integration.

The assessment prevents the team from discovering the vendor blocker halfway through a full migration.

## 5. Scenario-based interview answer

“I start by treating modernisation as a business and operational assessment, not just a framework upgrade.

On one payment platform, the initial request was to move the whole application to modern .NET. I first mapped the critical payment and settlement journeys, established production baselines, and inventoried the projects, packages, hosting model, database usage, identity, and external integrations. Static analysis showed several framework-specific APIs, but interviews and runtime tracing found the more important issue: a settlement component depended on a vendor SDK that only worked on .NET Framework.

I classified each component by business criticality, compatibility, coupling, test coverage, and migration effort. We decided on an incremental approach. We added characterization and contract tests, moved portable domain libraries first, isolated the vendor SDK behind an interface, and used a low-risk status API as the proof of concept. We also defined monitoring, staged rollout, and rollback before production traffic moved.

The result was a realistic roadmap instead of a speculative rewrite estimate. We delivered an early modern .NET service, reduced risk around settlement, and gave the business clear choices for replacing the blocked vendor dependency.”

## 6. Code example

Characterization tests capture the current behaviour before code is changed. This example protects an important payment rule:

```csharp
public sealed class LegacyPaymentRulesTests
{
    [Theory]
    [InlineData(100_00, "NZD", 250, 102_50)]
    [InlineData(100_00, "AUD", 300, 103_00)]
    public void Calculates_the_existing_total_in_minor_units(
        long amount,
        string currency,
        long fee,
        long expectedTotal)
    {
        var rules = new LegacyPaymentRules();

        long actual = rules.CalculateTotal(amount, currency, fee);

        Assert.Equal(expectedTotal, actual);
    }
}
```

The test records observable behaviour rather than redesigning it. Using minor currency units avoids floating-point errors. During migration, the same cases can be run against the modern implementation. More cases should come from production rules and edge cases, with sensitive data removed.

Tests like this are only one part of the assessment. Package compatibility, hosting, configuration, security, performance, data behaviour, and external integrations still need separate checks.

## 7. Common mistakes

- Looking only for compiler errors and ignoring runtime, infrastructure, and operational dependencies.
- Choosing rewrite or upgrade before understanding business risk and system boundaries.
- Trusting an automated compatibility report as the complete assessment.
- Reviewing project references but missing COM, registry, file-share, certificate, IIS, and scheduled-task dependencies.
- Assuming a package with a modern target framework behaves exactly like the old version.
- Ignoring undocumented database logic, shared tables, stored procedures, and transaction boundaries.
- Estimating the migration before running a representative proof of concept.
- Migrating critical code without characterization, contract, performance, and security tests.
- Targeting an out-of-support .NET version or failing to plan future servicing upgrades.
- Producing a technical report without owners, priorities, measurable acceptance criteria, or a rollback plan.

## 8. Follow-up interview questions

### Which tools would you use during the assessment?

I use repository and dependency searches, package vulnerability checks, compatibility analyzers, trial builds, automated tests, and production observability. I may also use .NET Upgrade Assistant where it fits the project. Tool output must be confirmed against real workflows and runtime dependencies.

### How do you decide what to migrate first?

I prefer a component with a clear boundary, useful business value, manageable dependencies, and moderate risk. It should test the build, deployment, monitoring, and rollback path without putting the most critical workflow at risk.

### What should the assessment deliver?

It should deliver a current-state inventory, dependency map, production baseline, compatibility and risk register, target architecture, proof-of-concept findings, test gaps, and a prioritised migration roadmap with estimates, owners, acceptance criteria, and rollback needs.
