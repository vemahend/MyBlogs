# What is ChangeDetectionStrategy.OnPush?

> **Category:** performance and change detection  
> **Difficulty:** Medium  
> **Goal:** Understand it, explain it, apply it, and remember it.

## Interview-ready answer (30–60 seconds)

`ChangeDetectionStrategy.OnPush` historically limited checks to explicit triggers such as new inputs, events, async/signal notifications, or manual marking. In current Angular, default behavior has evolved, so know your project version and configuration. In production, I choose it based on ownership, lifetime, testability, and failure behavior—not just because the syntax is convenient.

## Memory anchor

> **OnPush rewards explicit state boundaries; mutation hides changes.**

## 1. What problem does it solve?

`ChangeDetectionStrategy.OnPush` historically limited checks to explicit triggers such as new inputs, events, async/signal notifications, or manual marking. In current Angular, default behavior has evolved, so know your project version and configuration.

Without it, developers usually duplicate behavior, manually manipulate the DOM, blur state ownership, or create code that is difficult to test and reason about. The real problem is not syntax; it is making the UI contract predictable.

## 2. Explain it in simple language

OnPush rewards explicit state boundaries; mutation hides changes. Imagine the Angular screen as a set of small responsibilities. This concept tells you who owns a value or action, when it changes, and how the next part of the screen learns about it.

## 3. How it works internally

1. OnPush lets Angular skip an unchanged subtree. A signal read in the template marks that component when updated. Immutable reference changes make input updates visible and reasoning predictable.

Angular’s compiler can type-check much of this at build time, while the runtime creates views, resolves dependencies, listens for events, and synchronizes only the affected UI. Remember that TypeScript types disappear at runtime, so external API data still needs defensive mapping or validation.

## 4. Realistic payment or banking example

A transaction row component receives an immutable row VM and only updates when that input/signal/event changes, reducing repeated work across thousands of rows.

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
@Component({changeDetection:ChangeDetectionStrategy.OnPush,template:'<span>{{vm().status}}</span>'})
export class PaymentRow {vm=input.required<PaymentRowVm>();}
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

**Use it when:** For explicit performance-aware components and legacy projects where it is not already default.

**Avoid or reconsider it when:** Do not add it blindly without immutable/observable/signal update paths and tests.

The senior decision is rarely “Can Angular do it?” The better question is “Which boundary makes ownership and failure behavior easiest to understand?”

## 9. Compare it with related concepts

OnPush is a checking strategy, not automatic memoization and not a replacement for virtualization or good state design. Newer Angular versions may make OnPush-like behavior the default.

In an interview, compare concepts using four axes: **data direction, owner, lifetime, and side effects**. That produces a stronger answer than listing syntax differences.

## 10. Common production mistakes

- Mutating input object
- subscribe then forget mark/update signal
- calling detectChanges as patch
- assuming OnPush fixes huge DOM
- version assumptions.
- Missing loading, empty, error, and retry states.
- Treating frontend checks as security instead of repeating the rule on the API.
- Using **any**, non-null assertions, or mutable shared state to silence design problems.

## 11. Scenario-based interview question

A payment screen uses **What is ChangeDetectionStrategy.OnPush**, works during the happy path, but becomes inconsistent after refresh, rapid clicks, or navigation. How would you reproduce the issue, identify the state owner and lifetime, decide whether the fix belongs in the component/service/router/RxJS pipeline/API, and prove the fix with tests and telemetry?

## 12. Wait for your answer and review it honestly

Answer aloud in 2–3 minutes using this order:

1. Clarify the expected behavior and security/financial risk.
2. Reproduce and collect evidence.
3. Explain the likely Angular mechanism involved.
4. Propose the smallest safe fix and alternatives.
5. Cover failure paths, cleanup, tests, and monitoring.

**Stop here. Do not read a model answer immediately.** Your goal is active recall, not recognition.

## Final revision card

- **Definition:** `ChangeDetectionStrategy.OnPush` historically limited checks to explicit triggers such as new inputs, events, async/signal notifications, or manual marking. In current Angular, default behavior has evolved, so know your project version and configuration.
- **Remember:** OnPush rewards explicit state boundaries; mutation hides changes.
- **Choose by:** owner, direction, lifetime, failure behavior.
- **Never forget:** Angular controls the UI; the API protects the money.

## Official reference

- [Angular documentation](https://angular.dev/best-practices/runtime-performance)
