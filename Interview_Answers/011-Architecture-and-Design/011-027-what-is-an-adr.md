# 27. What is an ADR?

**Technology:** Architecture and Design

**Source question:** 27. What is an ADR?

## 1. What is it?

An ADR, or Architecture Decision Record, is a short document that explains an important architecture decision made by a team.

It normally records the problem, the options considered, the chosen option, and the reasons for the choice. It also describes important consequences and trade-offs. An ADR captures why a decision was made, not just what the final design looks like.

## 2. Why is it important?

Architecture decisions are often discussed in meetings or chat messages and then forgotten. Months later, a developer may see an unusual design and remove it without understanding the original reason.

ADRs provide a durable history of those decisions. They help teams:

- Understand why a technology or design was selected.
- Avoid repeating the same discussions.
- Review assumptions when business or technical conditions change.
- Onboard developers more quickly.
- Make trade-offs and risks visible to architects, developers, security teams, and operations teams.

An ADR is especially useful for decisions that are expensive or difficult to reverse, such as choosing a messaging platform, database model, authentication approach, or service boundary.

## 3. How does it work?

A team usually follows this simple flow:

1. A significant architecture problem is identified.
2. The team gathers requirements and constraints.
3. Reasonable options and their trade-offs are compared.
4. The decision makers agree on an option.
5. An ADR is written and reviewed with the affected people.
6. Its status is recorded, for example `Proposed`, `Accepted`, `Rejected`, `Deprecated`, or `Superseded`.
7. The ADR is stored with the source code or in another version-controlled location.

ADRs should normally be treated as append-only historical records. If a decision changes, the team creates a new ADR and links it to the old one as its replacement. This preserves the reasoning that was valid at the time.

## 4. Practical example

A payment platform must process card-payment events reliably. The team is deciding whether the Payment API should call the Settlement service directly over HTTP or publish events through a message broker.

The team creates an ADR that records:

- **Context:** Settlement can be temporarily unavailable, but accepted payments must not be lost.
- **Options:** Synchronous HTTP, database polling, or asynchronous messaging.
- **Decision:** Publish payment events to Azure Service Bus using an outbox pattern.
- **Reason:** This reduces direct coupling and supports reliable retry and recovery.
- **Consequences:** The system becomes eventually consistent and requires message idempotency, monitoring, and broker operations.

When a new developer later asks why settlement is asynchronous, the ADR explains both the reliability requirement and the accepted complexity.

## 5. Scenario-based interview answer

**Problem:** In one payment project, different teams remembered different reasons for choosing synchronous service calls. The original architects had left, and proposed changes repeatedly reopened the same discussion.

**Decision:** I introduced lightweight ADRs for decisions with a wide impact or a high cost of reversal. For the settlement workflow, we documented the reliability requirements, evaluated direct HTTP calls and messaging, and chose asynchronous events through Azure Service Bus.

**Implementation:** We kept each ADR as Markdown in the Git repository. It included the context, decision, alternatives, trade-offs, status, owners, and date. The ADR was reviewed in the same pull request as the related design change. When a later requirement changed the decision, we created a new ADR and marked the old one as superseded instead of rewriting history.

**Result:** Developers could understand the reasoning without relying on tribal knowledge. Design reviews became faster, onboarding improved, and the team could revisit the decision using the original assumptions rather than personal opinions.

## 6. Code example

An ADR is documentation, so C# code would not make the concept clearer. A concise Markdown ADR is more useful:

```markdown
# ADR-012: Use asynchronous events for settlement

- Status: Accepted
- Date: 2026-08-22
- Decision owners: Payments Architecture Group

## Context
Accepted payments must not be lost when the Settlement service is unavailable.

## Decision
Publish payment events to Azure Service Bus through a transactional outbox.
Consumers must be idempotent.

## Alternatives considered
- Direct synchronous HTTP calls
- Polling the Payments database

## Consequences
- Payment acceptance is not blocked by Settlement availability.
- Settlement data is eventually consistent.
- We must operate the broker, monitor failed messages, and support replay.
```

The title gives the ADR a stable identifier. `Context` explains the problem and constraints. `Decision` states the chosen approach. `Alternatives considered` shows that the choice was evaluated. `Consequences` records both benefits and costs.

## 7. Common mistakes

- Recording trivial coding choices and creating too much documentation noise.
- Writing only the selected option without explaining the context, alternatives, or trade-offs.
- Creating an ADR after implementation only to justify a decision already made.
- Hiding important negative consequences to make the decision look stronger.
- Storing ADRs where developers cannot easily find or review them.
- Editing an accepted ADR when the decision changes instead of superseding it with a new ADR.
- Treating an ADR as a large design specification. It should remain focused on one significant decision.
- Assuming an ADR removes the need for discussion, prototypes, security review, or performance testing.

## 8. Follow-up interview questions

### When should you create an ADR?

Create one for a decision with significant impact, meaningful trade-offs, or a high cost of reversal. Examples include service boundaries, data ownership, communication patterns, cloud services, and security models.

### Should an accepted ADR ever be changed?

Small corrections can be made transparently, but its historical decision should not be rewritten. If the architecture changes, create a new ADR and mark the previous one as superseded.

### Where should ADRs be stored?

For most development teams, a version-controlled `docs/adr` folder near the source code works well. It makes ADRs searchable, reviewable through pull requests, and available with the system they describe.
