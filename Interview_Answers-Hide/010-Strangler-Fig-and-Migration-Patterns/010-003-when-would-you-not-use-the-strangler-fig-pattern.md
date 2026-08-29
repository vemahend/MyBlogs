# 3. When would you not use the Strangler Fig pattern?

**Technology:** Strangler Fig and Migration Patterns

**Source question:** 3. When would you not use the Strangler Fig pattern?

## 1. What is it?

The Strangler Fig pattern replaces a legacy system gradually. A router or facade sends some requests to the old system and others to new services until the old system can be retired.

I would not use this pattern when gradual replacement adds more risk, cost, or complexity than a direct replacement. The pattern is useful, but it is not the default answer for every migration.

## 2. Why is it important?

Choosing not to use the pattern can be as important as choosing it. During a strangler migration, the old and new systems run together. The team must operate two implementations, route traffic correctly, keep data consistent, and support a migration that may last months or years.

I would normally avoid it when:

- The system is small, well understood, and cheap to replace in one release.
- The old system cannot be separated behind stable business boundaries.
- Old and new components require immediate, strongly consistent transactions across the same data.
- There is no safe interception point for routing requests or events.
- The legacy platform must be shut down quickly because of security, licensing, or regulatory risk.
- The organization cannot fund and operate both systems during a long transition.
- The target system is still unclear, so incremental replacement would lock in uncertain design decisions.

The key point is to compare migration risks. A gradual migration reduces release risk only when the old system can be divided safely and the temporary coexistence can be controlled.

## 3. How does it work?

Before selecting a migration approach, I check four areas:

1. **Boundaries:** Can a business capability, such as customer statements, be separated without changing many unrelated modules?
2. **Routing:** Can an API gateway, reverse proxy, facade, or event subscription direct work to either implementation safely?
3. **Data ownership:** Can one system own each piece of data, or would both systems constantly update the same records?
4. **Transition cost:** Can the team monitor, test, secure, and support two systems for the expected migration period?

If these conditions are weak, I consider alternatives such as a direct rewrite for a small application, replacing the product with a commercial service, extracting and loading the data during a planned cutover, or first modularizing the legacy application before migrating it.

This is a risk-based decision rather than a rule based only on system age.

## 4. Practical example

Consider a small internal payment-fee calculator. It contains a few well-tested rules, has no user interface, and runs only during an overnight batch. The bank can stop the batch for one planned maintenance window, migrate the reference data, validate the output against previous runs, and switch the scheduler to a new .NET service.

Using the Strangler Fig pattern would require temporary routing, parallel deployments, reconciliation, and support for two calculators. It could also create a serious problem if both versions calculate different fees for the same payment. A direct cutover with a tested rollback package is simpler and safer in this case.

## 5. Scenario-based interview answer

“I would not use the Strangler Fig pattern automatically. On one project, we had a small authentication utility on an unsupported framework. It had a narrow scope, but it handled security-sensitive token validation, and the old and new implementations could not safely share signing-key state.

The problem was that running both versions would increase the attack surface and could produce inconsistent authentication decisions. I chose a controlled replacement instead of a long strangler migration.

We built the replacement on the supported .NET platform, ran contract and security tests against captured non-sensitive cases, rehearsed key migration in a staging environment, and used a short maintenance window for the cutover. We kept the previous deployment and key backup as a time-limited rollback option.

The result was a shorter period of security exposure, one clear owner for authentication decisions, and less operational complexity. I would still choose Strangler Fig for a large, separable system where incremental releases genuinely reduce risk.”

## 6. Code example

A code example would not improve this decision because the main issue is architecture and operational risk, not a particular .NET API. In practice, I would record the decision in an Architecture Decision Record and support it with evidence such as dependency analysis, transaction boundaries, data ownership, cutover duration, rollback steps, and expected coexistence cost.

## 7. Common mistakes

- Treating Strangler Fig as mandatory for every legacy migration.
- Ignoring the cost of operating, monitoring, patching, and supporting two systems.
- Splitting functionality where there is no real business or data boundary.
- Allowing both systems to write the same data without clear ownership and reconciliation.
- Choosing a big-bang rewrite only because the legacy code is difficult, without proving that a safe cutover and rollback are possible.
- Keeping temporary routing and synchronization logic permanently.
- Failing to define measurable exit criteria and a retirement date for the old system.
- Ignoring regulatory, security, or licensing deadlines that make long coexistence unacceptable.

## 8. Follow-up interview questions

### What would you use instead of the Strangler Fig pattern?

For a small and well-understood system, I may use a direct replacement with a rehearsed cutover and rollback plan. Other choices include buying a product, migrating data once, or modularizing the legacy application before replacing parts of it.

### How do you decide whether a system is separable enough?

I look for a business capability with a clear API, clear data ownership, limited shared transactions, and dependencies that can be tested. If changing one capability requires coordinated changes across most of the legacy system, it is not yet a good strangler boundary.

### Is a big-bang migration ever safer?

Yes. It can be safer when the scope is small, the downtime is acceptable, data can be migrated and verified once, rollback is practical, and running two versions would cause security or consistency risks.
