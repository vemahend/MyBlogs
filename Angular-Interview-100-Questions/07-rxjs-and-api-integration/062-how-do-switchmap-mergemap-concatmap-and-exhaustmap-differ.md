# How do switchMap, mergeMap, concatMap, and exhaustMap differ?

> **Category:** rxjs and api integration  
> **Difficulty:** Medium  
> **Goal:** Understand it, explain it, apply it, and remember it.

## Interview-ready answer (30–60 seconds)

The flattening operators differ by concurrency policy: `switchMap` cancels the previous inner stream, `mergeMap` runs concurrently, `concatMap` queues in order, and `exhaustMap` ignores new triggers while one is active. In production, I choose it based on ownership, lifetime, testability, and failure behavior—not just because the syntax is convenient.

## Memory anchor

> **Switch = latest; merge = parallel; concat = queue; exhaust = busy.**

## 1. What problem does it solve?

The flattening operators differ by concurrency policy: `switchMap` cancels the previous inner stream, `mergeMap` runs concurrently, `concatMap` queues in order, and `exhaustMap` ignores new triggers while one is active.

Without it, developers usually duplicate behavior, manually manipulate the DOM, blur state ownership, or create code that is difficult to test and reason about. The real problem is not syntax; it is making the UI contract predictable.

## 2. Explain it in simple language

Switch = latest; merge = parallel; concat = queue; exhaust = busy. Imagine the Angular screen as a set of small responsibilities. This concept tells you who owns a value or action, when it changes, and how the next part of the screen learns about it.

## 3. How it works internally

1. Each maps an outer emission to an inner Observable, then decides how multiple active inners coexist. HttpClient unsubscription can abort in-flight browser requests, but server processing may already have started.

Angular’s compiler can type-check much of this at build time, while the runtime creates views, resolves dependencies, listens for events, and synchronizes only the affected UI. Remember that TypeScript types disappear at runtime, so external API data still needs defensive mapping or validation.

## 4. Realistic payment or banking example

Search beneficiaries with switchMap; load independent account details with bounded mergeMap; queue ordered draft saves with concatMap; prevent repeat payment-submit clicks with exhaustMap plus server idempotency.

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
search$.pipe(switchMap(q=>api.search(q)));
items$.pipe(mergeMap(x=>api.load(x)));
saves$.pipe(concatMap(x=>api.save(x)));
submits$.pipe(exhaustMap(x=>api.pay(x)));
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

**Use it when:** Choose only after stating what should happen when a second event arrives.

**Avoid or reconsider it when:** Avoid picking by habit; the wrong concurrency semantics create real production defects.

The senior decision is rarely “Can Angular do it?” The better question is “Which boundary makes ownership and failure behavior easiest to understand?”

## 9. Compare it with related concepts

The operator choice encodes a business rule about cancellation, parallelism, ordering, or ignoring.

In an interview, compare concepts using four axes: **data direction, owner, lifetime, and side effects**. That produces a stronger answer than listing syntax differences.

## 10. Common production mistakes

- switchMap for writes assuming cancellation undoes server action
- unbounded mergeMap
- concat queue growing forever
- exhaustMap silently ignoring an action without UI feedback.
- Missing loading, empty, error, and retry states.
- Treating frontend checks as security instead of repeating the rule on the API.
- Using **any**, non-null assertions, or mutable shared state to silence design problems.

## 11. Scenario-based interview question

A payment screen uses **How do switchMap, mergeMap, concatMap, and exhaustMap differ**, works during the happy path, but becomes inconsistent after refresh, rapid clicks, or navigation. How would you reproduce the issue, identify the state owner and lifetime, decide whether the fix belongs in the component/service/router/RxJS pipeline/API, and prove the fix with tests and telemetry?

## 12. Wait for your answer and review it honestly

Answer aloud in 2–3 minutes using this order:

1. Clarify the expected behavior and security/financial risk.
2. Reproduce and collect evidence.
3. Explain the likely Angular mechanism involved.
4. Propose the smallest safe fix and alternatives.
5. Cover failure paths, cleanup, tests, and monitoring.

**Stop here. Do not read a model answer immediately.** Your goal is active recall, not recognition.

## Final revision card

- **Definition:** The flattening operators differ by concurrency policy: `switchMap` cancels the previous inner stream, `mergeMap` runs concurrently, `concatMap` queues in order, and `exhaustMap` ignores new triggers while one is active.
- **Remember:** Switch = latest; merge = parallel; concat = queue; exhaust = busy.
- **Choose by:** owner, direction, lifetime, failure behavior.
- **Never forget:** Angular controls the UI; the API protects the money.

## Official reference

- [Angular documentation](https://angular.dev/ecosystem/rxjs-interop)
