# 25. How do you make architecture decisions?

**Technology:** Architecture and Design

**Source question:** 25. How do you make architecture decisions?

## 1. What is it?

Making an architecture decision means choosing how a system should be structured so that it meets its business and technical needs.

Examples include choosing between a modular monolith and microservices, deciding how services communicate, selecting a database, or defining how authentication works.

I treat architecture as a set of trade-offs, not a search for one perfect design. A good decision solves the current problem, supports likely future needs, and avoids unnecessary complexity. The important decisions should be recorded in an Architecture Decision Record, or ADR, so the team knows what was decided and why.

## 2. Why is it important?

Architecture decisions affect performance, security, reliability, delivery speed, operating cost, and how easily the system can change. A poor decision can be expensive to reverse after many teams and services depend on it.

A clear decision process helps a team:

- Connect technical choices to business goals.
- Compare options using evidence instead of personal preference.
- Identify risks before implementation.
- Avoid adopting technology only because it is popular.
- Give developers consistent guidance.
- Explain later why an option was chosen.

Not every choice needs a long review. A naming convention is easy to change, while a database or service-boundary decision has a much larger impact. The effort should match the cost and reversibility of the decision.

## 3. How does it work?

I normally use the following process:

1. **Understand the problem.** I clarify the business goal, users, expected lifetime, and what success means. I do not start by selecting a technology.
2. **Collect constraints.** These may include security rules, regulations, budget, delivery date, team skills, existing platforms, data location, and integration requirements.
3. **Define quality attributes.** I make requirements measurable where possible, such as 99.95% availability, a 300 ms response target, recovery within 30 minutes, or support for 2,000 transactions per second.
4. **Find realistic options.** I usually compare two or three options, including keeping the current design when that is practical.
5. **Compare trade-offs.** I consider complexity, cost, security, reliability, scalability, maintainability, testability, deployment, observability, and team ownership.
6. **Validate important assumptions.** For uncertain or high-risk areas, I use a small proof of concept, load test, threat model, or operational review.
7. **Consult the right people.** Developers, security, operations, product owners, and affected teams should contribute. The decision owner remains clear so the process does not stall.
8. **Decide and record it.** An ADR captures the context, decision, alternatives, consequences, owner, date, and status.
9. **Implement and verify it.** Tests, monitoring, architecture checks, and review rules confirm that the decision works in production.
10. **Review when facts change.** An ADR is not permanent law. It can be superseded when scale, regulations, costs, or business needs change.

For a reversible decision, I prefer a simple option and learn from delivery. For an expensive, difficult-to-reverse decision, I spend more time gathering evidence and reducing risk.

## 4. Practical example

Suppose a bank is building an account-summary API. One proposal is for the API to call the authentication service on every request. Another is to validate signed access tokens locally.

The important requirements are low latency, high availability, immediate blocking of compromised accounts, and secure key management.

The team chooses local validation of short-lived JWT access tokens because it removes a synchronous network call from every request. The API validates the token signature, issuer, audience, lifetime, and required claims. Signing keys are obtained through the identity provider's published metadata and rotated safely.

There is a trade-off: a locally validated token may remain valid until it expires. The design therefore uses short token lifetimes and a separate risk control for sensitive operations, such as checking account status or requiring step-up authentication. The ADR records why local validation was selected, the rejected option, and this security consequence.

## 5. Scenario-based interview answer

“On a payment platform, transaction volume was growing and the team suggested moving the whole application to microservices. I first clarified the real problem. The main issue was that settlement processing had different scaling and release needs from the rest of the application; the whole system was not failing because it was a monolith.

I documented the required throughput, availability, recovery targets, security constraints, team ownership, and delivery deadline. We compared three options: improve the existing monolith, convert it into a modular monolith, or extract several microservices. We also ran a load test to confirm where the bottleneck was.

I decided to strengthen module boundaries in the monolith and extract only settlement processing as an independently deployed worker. We used an outbox pattern to publish committed payment events reliably, made consumers idempotent, and added queue-depth, processing-time, and failure alerts. I recorded the decision and its consequences in an ADR.

This gave settlement independent scaling and deployment without adding distributed-system complexity to every business function. Throughput improved, releases remained manageable, and the ADR gave us clear conditions for reviewing whether another module should be extracted. My approach is to start from measurable needs, compare trade-offs, validate risky assumptions, and choose the simplest design that meets the requirements.”

## 6. Code example

Architecture decisions are mainly communicated through diagrams, ADRs, and measurable requirements rather than application code. A concise ADR can be stored with the source code like this:

```markdown
# ADR-014: Extract settlement processing

Status: Accepted
Date: 2026-08-22
Owner: Payments team

## Context
Settlement processing needs independent scaling and releases.
Peak target: 1,000 messages/second. Processing must be retry-safe.

## Decision
Run settlement as a separate .NET worker. Publish payment events by using
the transactional outbox pattern. Make consumers idempotent.

## Alternatives
- Scale the complete application: simpler, but wastes resources.
- Split every payment function: flexible, but adds excessive complexity.

## Consequences
- Settlement can scale and deploy independently.
- The team must operate messaging, retries, monitoring, and reconciliation.

## Review trigger
Review if volume changes significantly or message delay exceeds the target.
```

The useful parts are the context, measurable needs, chosen option, alternatives, and consequences. The review trigger prevents the decision from becoming permanent when its assumptions are no longer true. ADRs are a documentation practice and do not depend on a particular .NET version.

## 7. Common mistakes

- Choosing a technology before understanding the business problem.
- Treating architecture as personal preference instead of comparing trade-offs.
- Using vague requirements such as “fast” or “highly available” without measurable targets.
- Copying an architecture used by a much larger company without having the same needs.
- Ignoring team skills, operating cost, security, compliance, or support ownership.
- Designing only for possible future scale and creating complexity that is not currently needed.
- Making a decision by committee without a clear owner.
- Recording only the chosen design and not the rejected options or consequences.
- Running a proof of concept that tests only the happy path and not failure, recovery, or load.
- Treating an ADR as unchangeable. A later ADR should supersede it when the context changes.
- Failing to check production measures, so the team never learns whether the decision worked.

## 8. Follow-up interview questions

### What is an Architecture Decision Record?

An ADR is a short document that records an important decision, its context, considered options, and consequences. It keeps the reasoning close to the system and helps future team members understand it.

### How do you resolve disagreement about an architecture choice?

I return to agreed business goals, constraints, and measurable quality attributes. If evidence is missing, I use a small experiment or benchmark. The accountable decision owner then decides and records both the choice and its trade-offs.

### When should an architecture decision be revisited?

It should be reviewed when a key assumption changes, production measures miss their targets, a new regulation appears, operating cost becomes unacceptable, or a safer and simpler option becomes practical. The old ADR remains as history, and a new ADR supersedes it.
