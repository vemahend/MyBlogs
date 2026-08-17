# What are @Input and @Output?

> **Category:** components and lifecycle  
> **Difficulty:** Medium  
> **Goal:** Understand it, explain it, apply it, and remember it.

## Interview-ready answer (30–60 seconds)

`@Input` receives values from a parent and `@Output` exposes events to a parent. Modern Angular also offers signal-based `input()` and `output()` APIs. In production, I choose it based on ownership, lifetime, testability, and failure behavior—not just because the syntax is convenient.

## Memory anchor

> **Inputs are nouns; outputs are past-tense events or user intent.**

## 1. What problem does it solve?

`@Input` receives values from a parent and `@Output` exposes events to a parent. Modern Angular also offers signal-based `input()` and `output()` APIs.

Without it, developers usually duplicate behavior, manually manipulate the DOM, blur state ownership, or create code that is difficult to test and reason about. The real problem is not syntax; it is making the UI contract predictable.

## 2. Explain it in simple language

Inputs are nouns; outputs are past-tense events or user intent. Imagine the Angular screen as a set of small responsibilities. This concept tells you who owns a value or action, when it changes, and how the next part of the screen learns about it.

## 3. How it works internally

1. Angular assigns inputs during view synchronization. Input changes can be observed with signal computation/effects or `ngOnChanges`. An output emits to template listeners
2. it does not bubble through the DOM like a native event.

Angular’s compiler can type-check much of this at build time, while the runtime creates views, resolves dependencies, listens for events, and synchronizes only the affected UI. Remember that TypeScript types disappear at runtime, so external API data still needs defensive mapping or validation.

## 4. Realistic payment or banking example

A payment card receives a `PaymentViewModel`; its output emits `approveRequested` with the payment ID, not an entire mutable object.

The browser improves usability, but the ASP.NET Core API remains authoritative for authentication, authorization, balances, payment limits, concurrency, idempotency, and audit history. A hidden button or route guard is never a security boundary.

## 5. Successful flow and failure flow

### Successful flow

1. State enters through a clearly owned input, route, form, service, or API result.
2. Angular applies this concept without mutating an unrelated owner.
3. The user sees loading, ready, empty, or success state explicitly.
4. If money moves, the API validates the command and returns a stable result.
5. Tests verify both the value and the user-visible behavior.

### Failure flow

1. Input, navigation state, authorization, or the network is invalid or unavailable.
2. The UI prevents an unsafe action and preserves the last valid state where appropriate.
3. The error is mapped to a safe message; technical detail and correlation ID go to telemetry.
4. Retry is offered only for transient failures and only when duplicate processing is prevented.
5. Cleanup stops stale callbacks from updating a destroyed or newer screen.

## 6. Practical Angular/TypeScript example

```ts
export class PaymentCard {
  payment = input.required<PaymentVm>();
  approveRequested = output<string>();
}
```

### What to notice

- The public contract is typed.
- UI state and server-owned rules are not confused.
- The example is small enough to test.
- Modern Angular syntax is used where it improves clarity; know the legacy equivalent for interviews.

## 7. Important design decisions

- **Owner:** Which component, route, service, or server owns the source of truth?
- **Lifetime:** Should the state live for one view, one route, the signed-in session, or permanently?
- **Direction:** Can data flow one way, with explicit events for changes?
- **Boundary:** Are raw backend DTOs mapped before reaching many components?
- **Failure:** What happens on refresh, cancellation, timeout, partial response, or duplicate action?
- **Security:** Which rule must be repeated and enforced by the API?
- **Performance:** Will this code run once, per emission, per row, or on every synchronization?

## 8. When to use and when not to use it

**Use it when:** For direct component composition and reusable public APIs.

**Avoid or reconsider it when:** For unrelated components or long-lived shared workflows; use a state boundary.

The senior decision is rarely “Can Angular do it?” The better question is “Which boundary makes ownership and failure behavior easiest to understand?”

## 9. Compare it with related concepts

Inputs describe state/configuration; outputs describe facts or intent. A two-way contract pairs `value` with `valueChange` or uses a model API.

In an interview, compare concepts using four axes: **data direction, owner, lifetime, and side effects**. That produces a stronger answer than listing syntax differences.

## 10. Common production mistakes

- Mutating inputs
- outputting low-level clicks
- emitting sensitive/unvalidated data
- optional inputs treated as required
- dozens of inputs indicating poor boundaries.
- Missing loading, empty, error, and retry states.
- Treating frontend checks as security instead of repeating the rule on the API.
- Using **any**, non-null assertions, or mutable shared state to silence design problems.

## 11. Scenario-based interview question

A payment screen uses **What are @Input and @Output**, works during the happy path, but becomes inconsistent after refresh, rapid clicks, or navigation. How would you reproduce the issue, identify the state owner and lifetime, decide whether the fix belongs in the component/service/router/RxJS pipeline/API, and prove the fix with tests and telemetry?

## 12. Wait for your answer and review it honestly

Answer aloud in 2–3 minutes using this order:

1. Clarify the expected behavior and security/financial risk.
2. Reproduce and collect evidence.
3. Explain the likely Angular mechanism involved.
4. Propose the smallest safe fix and alternatives.
5. Cover failure paths, cleanup, tests, and monitoring.

**Stop here. Do not read a model answer immediately.** Your goal is active recall, not recognition.

## Final revision card

- **Definition:** `@Input` receives values from a parent and `@Output` exposes events to a parent. Modern Angular also offers signal-based `input()` and `output()` APIs.
- **Remember:** Inputs are nouns; outputs are past-tense events or user intent.
- **Choose by:** owner, direction, lifetime, failure behavior.
- **Never forget:** Angular controls the UI; the API protects the money.

## Official reference

- [Angular documentation](https://angular.dev/guide/components)
