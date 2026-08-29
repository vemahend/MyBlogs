# 30. How do you review an architecture?

**Technology:** Architecture and Design

**Source question:** 30. How do you review an architecture?

## 1. What is it?

An architecture review is a structured check of a proposed or existing system design.

The aim is not to decide whether a diagram looks good. It is to confirm that the design can meet the business goals and important quality needs, such as security, reliability, performance, scalability, maintainability, cost, and compliance.

A good review also makes assumptions, trade-offs, risks, and ownership clear before they become expensive production problems.

## 2. Why is it important?

Architecture decisions are difficult and costly to change after many teams have built on them. A review helps find problems early, when changing a design is still relatively cheap.

It helps a team:

- confirm that the design solves the real business problem;
- find security, data, availability, and integration risks;
- check whether the system can be operated and supported in production;
- avoid unnecessary complexity and technology choices;
- agree on trade-offs instead of assuming that every quality can be maximized;
- create a shared understanding between developers, architects, security, operations, and business stakeholders.

The review is a decision-support activity, not a gate used to blame a team.

## 3. How does it work?

I review an architecture in the following order:

1. **Understand the context.** I clarify the business goals, users, scope, constraints, budget, delivery timeline, regulations, and expected system lifetime.
2. **Identify the important quality attributes.** I ask for measurable targets, such as response time, transaction volume, recovery time objective (RTO), recovery point objective (RPO), and availability. I also ask which qualities have priority when they conflict.
3. **Review the main views.** I examine the system context, containers or services, data flow, integrations, deployment, trust boundaries, and operational dependencies. I use diagrams to support the discussion, but I do not review diagrams in isolation.
4. **Walk through real scenarios.** I trace normal requests and important failure cases: a dependency times out, a message is delivered twice, a region fails, a secret is exposed, or traffic suddenly increases.
5. **Challenge key decisions.** I check service boundaries, data ownership, consistency, security controls, technology choices, single points of failure, observability, deployment, rollback, and disaster recovery.
6. **Ask for evidence.** Important claims should be supported by load tests, proof-of-concept results, cost estimates, threat models, or experience from a similar system.
7. **Record the outcome.** I classify findings by impact and likelihood, assign owners and dates, and record major decisions in Architecture Decision Records (ADRs). Critical risks must be resolved or formally accepted by the correct owner.
8. **Follow up.** Architecture changes during delivery, so I review high-risk changes and verify agreed actions instead of treating the first review as final.

The depth of the review should match the risk. A small internal application does not need the same process as a regulated payment platform.

## 4. Practical example

Suppose a bank is designing a new money-transfer service. The design uses an ASP.NET Core API, a transfer database, a message broker, a fraud service, and a notification service.

During the review, I would walk through a transfer from the customer request to final settlement. I would ask questions such as:

- How do we prevent the same transfer when the client retries?
- What happens if the database commits but event publishing fails?
- Which system owns the transfer status?
- Can two service instances update the same transfer at the same time?
- How are customer data and service credentials protected?
- What happens when fraud checking or the broker is unavailable?
- Can the service meet its latency, audit, RTO, and RPO targets?

The walkthrough may reveal that the API writes the transfer and then publishes an event as two separate operations. A crash between those steps could leave a completed transfer with no settlement event.

I would recommend an idempotency key for duplicate requests and a transactional outbox for reliable event publishing. I would also ask for a failure test, monitoring for unpublished outbox records, and a documented recovery process.

## 5. Scenario-based interview answer

“I start an architecture review with the business goal and measurable quality requirements. I then inspect the system, data, integration, deployment, security, and operational views, and I walk through both successful and failure scenarios.

**Problem:** In one payment design, the API saved a completed payment and published a message in separate operations. If the application failed between them, downstream settlement could be missed. The design also had no clear idempotency approach for client retries.

**Decision:** I treated reliable processing and duplicate prevention as higher priorities than keeping the first implementation simple. I recommended an idempotency key and a transactional outbox rather than a distributed transaction.

**Implementation:** We recorded the decision in an ADR, added a unique database constraint for the idempotency key, saved the payment and outbox record in one local transaction, and used a background worker to publish pending events. We also added retry handling, duplicate-safe consumers, alerts, and failure tests.

**Result:** The team proved that a process crash or repeated request did not lose or duplicate a payment. The review produced clear actions and evidence, not just comments on a diagram. I also followed up during delivery because an architecture review is not a one-time meeting.”

## 6. Code example

Code cannot review an entire architecture, but automated architecture tests can continuously enforce some agreed boundaries. The following example uses `NetArchTest.Rules` to prevent the Domain project from depending on Infrastructure:

```csharp
using NetArchTest.Rules;
using Xunit;

public sealed class ArchitectureTests
{
    [Fact]
    public void Domain_must_not_depend_on_infrastructure()
    {
        var result = Types.InAssembly(typeof(Domain.Transfer).Assembly)
            .ShouldNot()
            .HaveDependencyOn("Banking.Infrastructure")
            .GetResult();

        Assert.True(
            result.IsSuccessful,
            $"Invalid dependencies: {string.Join(", ", result.FailingTypeNames ?? [])}");
    }
}
```

`Types.InAssembly` selects types from the Domain assembly. The rule fails the build if one of those types depends on the Infrastructure namespace. This protects one architecture decision during future changes.

This test is useful, but it does not replace scenario reviews, threat modelling, load testing, cost checks, or operational validation.

## 7. Common mistakes

- Reviewing only boxes and arrows without checking requirements or runtime behavior.
- Starting with a preferred technology instead of the business problem.
- Using vague requirements such as “fast” or “highly available” instead of measurable targets.
- Reviewing only the happy path and ignoring timeouts, retries, duplicates, partial failure, and recovery.
- Ignoring deployment, monitoring, support, cost, data migration, and rollback.
- Treating every finding as equally serious instead of considering impact and likelihood.
- Adding patterns, services, or infrastructure without a proven need.
- Accepting claims such as “it will scale” without tests or evidence.
- Failing to include the people responsible for security, operations, data, and business outcomes.
- Producing a long report with no decision, owner, deadline, or follow-up.
- Treating approval as permanent even when requirements or risks change.

## 8. Follow-up interview questions

### What quality attributes do you normally review?

I review the attributes important to that system. They commonly include security, availability, reliability, performance, scalability, maintainability, operability, compliance, and cost. I ask for measurable targets and priorities rather than assuming all of them are equally important.

### How do you review an architecture that has already been built?

I compare the intended design with the running system. I use production metrics, incidents, code and dependency analysis, deployment configuration, security findings, and interviews with the team. I then prioritize improvements by risk and business value rather than proposing a complete rewrite by default.

### How do you know when an architecture review is complete?

It is complete for that stage when the important scenarios have been assessed, major decisions and trade-offs are recorded, critical risks are resolved or accepted by the right owner, and remaining actions have owners and dates. High-risk changes should trigger another review.
