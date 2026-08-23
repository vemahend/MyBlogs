# 26. How do you document architecture decisions?

**Technology:** Architecture and Design

**Source question:** 26. How do you document architecture decisions?

## 1. What is it?

I document important architecture decisions as **Architecture Decision Records (ADRs)**. An ADR is a short, version-controlled document that explains:

- the problem and its context;
- the options considered;
- the chosen option and why it was selected;
- the consequences and trade-offs;
- the decision's status, owner, and date.

An ADR records the reasoning, not only the final design. Diagrams and detailed design documents can support it, but they do not replace the decision record.

## 2. Why is it important?

Architecture decisions often make sense when they are made, but the reason can be forgotten when people or requirements change. Without a record, a later team may remove an important constraint or repeat the same discussion.

Good decision documentation:

- gives developers a clear direction;
- helps reviewers understand trade-offs;
- makes onboarding and audits easier;
- records risks and assumptions;
- shows when a decision should be reviewed;
- prevents decisions from living only in meetings, emails, or one person's memory.

This is especially useful in long-running .NET systems where many teams share services, data, and operational responsibilities.

## 3. How does it work?

I use a lightweight process:

1. Identify a decision that has a meaningful cost, risk, or long-term effect.
2. Write the context, constraints, and decision drivers, such as security, reliability, delivery time, and cost.
3. List realistic options and their main advantages and disadvantages.
4. Review the proposal with affected developers, security, operations, and product representatives.
5. Record the decision, its consequences, and any follow-up actions.
6. Store the ADR beside the source code, usually under `/docs/adr`, and review it through the normal pull-request process.
7. Give it a stable number and a status such as `Proposed`, `Accepted`, `Deprecated`, or `Superseded`.

An accepted ADR should not be silently edited when the decision changes. I create a new ADR and link it to the old one, so the history remains clear. I also keep diagrams and service documentation linked from the ADR and update them as part of the same change.

## 4. Practical example

A payment platform must prevent the same payment request from being processed twice. The team considers three options: relying on the client, using an in-memory cache, or storing an idempotency key in the payment database.

The ADR records the decision to store a unique idempotency key with the payment transaction. It explains that this adds database storage and cleanup work, but works across multiple service instances and survives restarts. It also states the retention period, unique constraint, expected response for a repeated request, and monitoring requirements.

Months later, another team can understand why an in-memory solution is not safe without repeating the original investigation.

## 5. Scenario-based interview answer

**Problem:** In one distributed payment project, teams repeatedly debated how services should publish events after database updates. Some services published directly to the broker, which created a risk of saving a payment but failing to publish its event.

**Decision:** I led a review of direct publishing, distributed transactions, and the transactional outbox pattern. We chose the outbox because it gave us reliable event publication without requiring a distributed transaction.

**Implementation:** I created an ADR containing the context, decision drivers, options, trade-offs, failure scenarios, and operational responsibilities. I added a sequence diagram and linked the ADR to the implementation stories. We stored it in `/docs/adr` and approved it through a pull request involving application, platform, and operations engineers. We also added a review date and documented how a future ADR would supersede it.

**Result:** New services followed the same pattern, production failures were easier to diagnose, and developers could understand why the extra outbox components existed. The ADR became the durable record; the meeting notes were only supporting information.

## 6. Code example

This question does not benefit from C# code because the main deliverable is a decision record. A concise ADR can look like this:

```markdown
# ADR-014: Use transactional outbox for payment events

- Status: Accepted
- Date: 2026-08-22
- Owners: Payments Architecture Group

## Context
Payment data and its integration event must not become inconsistent.

## Decision drivers
- At-least-once event delivery
- No distributed transaction
- Clear operational recovery

## Options considered
1. Publish directly after saving
2. Use a distributed transaction
3. Use a transactional outbox

## Decision
Write the payment and outbox message in one database transaction.
A background worker publishes pending messages. Consumers must be idempotent.

## Consequences
- Reliable publication after temporary broker failures
- Additional table, worker, monitoring, and cleanup
- Duplicate delivery remains possible and must be handled

## Review trigger
Review if broker or database guarantees materially change.
```

The important parts are the context, decision drivers, alternatives, final decision, and consequences. The review trigger prevents the ADR from being treated as permanent when its assumptions change.

## 7. Common mistakes

- Recording only the chosen technology and not the reason or alternatives.
- Writing a large document that becomes difficult to review and maintain.
- Documenting every small coding choice as an architecture decision.
- Keeping decisions only in chat, email, meeting notes, or a private wiki.
- Missing negative consequences, risks, owners, or operational impact.
- Changing an accepted ADR in place and losing the original history.
- Letting diagrams, links, and implementation drift away from the decision.
- Treating an ADR as approval by one architect instead of reviewing it with affected people.
- Failing to communicate the accepted decision or check that implementation matches it.

## 8. Follow-up interview questions

### What is the difference between an ADR and a design document?

An ADR captures one important decision and its reasoning. A design document describes the wider solution, components, flows, APIs, and implementation details. They should link to each other when both are needed.

### When should an ADR be created?

Create one when a decision is hard to reverse or has a meaningful effect on security, reliability, cost, data, integrations, or multiple teams. Small local coding choices usually do not need an ADR.

### How do you change an accepted architecture decision?

Create a new ADR that explains the new context and decision, mark the old ADR as `Superseded`, and link both records. Then update the related diagrams, standards, backlog items, and code through the normal review process.
