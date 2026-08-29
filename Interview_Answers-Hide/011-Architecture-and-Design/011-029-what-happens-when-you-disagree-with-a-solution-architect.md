# 29. What happens when you disagree with a Solution Architect?

**Technology:** Architecture and Design

**Source question:** 29. What happens when you disagree with a Solution Architect?

## 1. What is it?

Disagreeing with a Solution Architect means that I see a technical risk, trade-off, or better option in a proposed design.

It should not become a personal conflict. The goal is to understand the architect's reasoning, explain my concern with evidence, and help the team make the best decision for the business.

## 2. Why is it important?

Architecture decisions affect security, reliability, cost, delivery time, and future maintenance. A senior developer should not silently implement a design when they can see a serious risk.

At the same time, productive disagreement is important. Endless debate can delay delivery and damage trust. Developers and architects need a clear way to challenge decisions, compare trade-offs, record the outcome, and then support the agreed direction.

## 3. How does it work?

I normally use this approach:

1. First, I confirm that I understand the requirement, constraints, and the architect's reason for the proposal.
2. I explain the concern using facts, such as performance tests, failure scenarios, security requirements, cost estimates, or operational experience.
3. I suggest one or two practical alternatives and compare their benefits, risks, cost, and delivery impact.
4. If the answer is still unclear, I recommend a small proof of concept or a short technical review with the relevant people.
5. The final decision and its reasons are recorded in an Architecture Decision Record (ADR), including any risks the team accepts.
6. Once a decision is made, I support it professionally unless it creates a legal, security, compliance, or serious production risk. In that case, I use the agreed escalation path.

The Solution Architect usually owns the wider solution design, but good architecture is collaborative. Decision authority should be clear; disagreement does not mean bypassing ownership.

## 4. Practical example

In a payment system, an architect proposed making the API call the fraud service and notification service synchronously before returning a successful payment response.

I agreed that fraud approval had to be synchronous, because it affected whether the payment could proceed. However, I raised a concern about calling the notification service in the same request. If that service was slow or unavailable, a valid payment could time out and the customer might try again.

I proposed completing the payment transaction, storing a `PaymentCompleted` event in an outbox table, and publishing it asynchronously for notification. We compared consistency, failure handling, complexity, and support needs. A small failure test showed that the synchronous design increased payment failures when the notification service was unavailable.

The architect accepted the hybrid design: synchronous fraud checking and asynchronous notification through the outbox pattern. We recorded the decision in an ADR and added monitoring plus retry handling.

## 5. Scenario-based interview answer

“I treat disagreement as a design discussion, not a challenge to someone's position.

**Problem:** On one project, the proposed payment flow called several downstream services synchronously. I was concerned that a failure in a non-critical notification service could cause the whole payment request to fail.

**Decision:** I first asked the Solution Architect to explain the consistency and business requirements. We agreed that fraud approval was required before payment, but notification did not need to finish before the customer received a response. I presented latency measurements, a failure scenario, and an alternative using an outbox and asynchronous messaging.

**Implementation:** We ran a small proof of concept, reviewed the operational trade-offs, and documented the chosen hybrid design in an ADR. We also recorded retries, idempotency, monitoring, and message-failure handling.

**Result:** Payment availability improved because notification failures no longer blocked successful payments. More importantly, the discussion stayed evidence-based and the team supported the final decision. If my option had not been chosen, I would still have supported the agreed design after making sure the risks were understood and recorded.”

## 6. Code example

Code is usually not the main tool for resolving an architecture disagreement. A short proof of concept, test results, a sequence diagram, and an ADR are more useful because they make the competing trade-offs visible.

For example, I would use a proof of concept to measure the payment API under downstream timeouts, then record:

- the problem and constraints;
- the options considered;
- the chosen option and reasons;
- rejected options and their trade-offs;
- risks, follow-up actions, and the decision owner.

This gives the team a shared technical record instead of relying on opinions or meeting memory.

## 7. Common mistakes

- Making the disagreement personal or arguing based on seniority.
- Rejecting a proposal without first understanding its business and technical constraints.
- Raising only problems without offering a practical alternative.
- Using preferences as evidence instead of measurements, requirements, or failure analysis.
- Debating for too long when a small proof of concept could answer the question.
- Going around the architect or discussing the issue with unrelated people to build support.
- Failing to document the final decision and accepted risks.
- Continuing to resist after a reasonable decision has been made.
- Staying silent about serious security, compliance, data-loss, or availability risks.

## 8. Follow-up interview questions

### What if the Solution Architect still rejects your proposal?

I make sure my concern and the trade-offs are understood and documented. If the decision is within their authority and does not create a serious governance risk, I support it and help make it successful.

### When would you escalate the disagreement?

I escalate when there is a material security, compliance, safety, data-loss, or production risk that remains unresolved. I use the normal governance path and bring evidence, not personal complaints.

### How do you prevent architecture discussions from delaying delivery?

I time-box the discussion, compare a small number of realistic options, identify the decision owner, and use a proof of concept only when it can answer a specific uncertainty quickly.
