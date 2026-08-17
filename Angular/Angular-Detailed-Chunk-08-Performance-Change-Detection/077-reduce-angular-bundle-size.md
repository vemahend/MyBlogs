# How Do You Reduce Angular Bundle Size?

> Senior Angular/.NET performance interview guide using banking-scale examples.

## 1. What problem does it solve?

Performance problems appear as slow startup, delayed interaction, jank, excessive network/CPU, large DOM, or memory growth. The goal is not to apply every optimization; it is to locate the limiting layer and reduce work without breaking correctness, accessibility, or maintainability.

---

## 2. Explain it in simple language

Measure the production bundle, remove or replace heavy dependencies, preserve tree-shaking, lazy-load routes, defer noncritical template content, import narrowly, and set budgets that fail regressions.

### Memory rule

> **Measure bytes, then remove the expensive reason.**

### Interview-ready answer

> Measure the production bundle, remove or replace heavy dependencies, preserve tree-shaking, lazy-load routes, defer noncritical template content, import narrowly, and set budgets that fail regressions. I would establish a reproducible baseline, profile the real bottleneck, change one major cause, and verify user-visible improvement and correctness under realistic banking data.

---

## 3. How does it work internally?

1. User input, signals, events, timers, or async emissions notify Angular that work may be needed.
2. Angular synchronizes eligible views and evaluates their bindings and relevant hooks.
3. List reconciliation uses stable identity to reuse, move, create, or destroy row views.
4. The browser performs style, layout, paint, and compositing after DOM updates.
5. Network payload, bundle parsing, retained memory, and server query cost can dominate independently of Angular.

### Practical interpretation

Developers gzip a huge bundle and declare success while parse/compile cost remains, or import a whole library through a side-effectful barrel for one function.

### Practical code

```typescript
@defer (on viewport; prefetch on idle) {
 <app-payment-chart />
} @placeholder { <div class=chart-skeleton></div> }
// Combine with lazy routes, narrow imports, and build budgets.
```

Do not confuse fewer change-detection checks with fewer DOM nodes, smaller network payloads, or faster database queries. A senior investigation separates those costs and chooses the highest-impact fix.

---

## 4. Realistic payment or banking example

A banking portal replaces a full date/locale package, lazy-loads reporting, defers a chart, and keeps PDF export out of the initial path.

### Full-stack responsibility split

| Angular/browser | ASP.NET Core/data layer |
|---|---|
| Render only needed rows and views | Page/filter near the database |
| Track rows by stable resource ID | Return stable IDs and narrow DTOs |
| Cancel stale reads and dispose resources | Honor cancellation and cap query cost |
| Split/defer noncritical code | Compress/cache safe responses appropriately |
| Measure interaction, memory, and bundles | Measure latency, SQL plan, allocation, and dependency calls |

---

## 5. Successful flow and failure flow

### Successful flow

1. Reproduce one slow action with production-like data and a production build.
2. Record network, CPU, Angular checks, DOM count, and memory.
3. Identify the dominant cost rather than the loudest symptom.
4. Apply a targeted fix with a performance budget.
5. Repeat the exact recording and regression-test behavior.

### Failure flow

1. Team assumes change detection is always the problem.
2. Multiple optimizations are applied without a baseline.
3. Complexity grows while server payload or DOM size remains unchanged.
4. Stale UI or accessibility regressions appear.
5. Return to measurement and isolate one layer at a time.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
@defer (on viewport; prefetch on idle) {
 <app-payment-chart />
} @placeholder { <div class=chart-skeleton></div> }
// Combine with lazy routes, narrow imports, and build budgets.
```

### ASP.NET Core boundary

```csharp
[Authorize]
[HttpGet]
public Task<PagedResult<TransactionDto>> Search([FromQuery]TransactionQuery query,CancellationToken ct)
    => transactions.SearchAuthorizedAsync(query with { PageSize=Math.Clamp(query.PageSize,1,100) },User,ct);
```

### How to test it

Use production-like row counts and network throttling. Compare before/after p50 and p95 interaction time, request bytes/count, rendered nodes, change-detection duration, long tasks, and heap after repeated navigation. Also test selection, focus, screen readers, reordering, and stale-response behavior.

### Production verification

- Build with production optimization and inspect chunks.
- Record Chrome Performance and Angular profiling for one action.
- Measure API payload, SQL duration, DOM nodes, and heap retention.
- Test slow device/network conditions and large authorized datasets.
- Confirm optimization does not expose cached cross-user data.
- Add a budget or regression benchmark for the repaired bottleneck.

---

## 7. Important design decisions

- Production analysis
-  dependency cost
-  narrow imports
-  defer by UX
-  CI budgets

Current-version note: Angular v22 makes OnPush the default and renames the eager strategy directionally; older interview codebases commonly require explicitly setting OnPush. Always state the version context.

---

## 8. When to use and when not to use it

### Use it when

- Profiling connects the technique to a meaningful user-visible bottleneck.
- The design retains correct identity, state, accessibility, and cleanup.

### Avoid or reconsider it when

- It is speculative, makes ownership unclear, or optimizes a tiny cost while data/DOM/network dominates.
- It treats frontend optimization as a substitute for efficient and authorized backend queries.

---

## 9. Compare it with related concepts

| Concept | Primary contribution |
|---|---|
| Lazy route | Separate feature chunk |
| @defer | Separate view dependency |
| tree shaking | Remove unreachable code |
| budget | Regression guard |

---

## 10. Common production mistakes

- Optimizing without a reproducible baseline.
- Rendering or downloading an entire large dataset.
- Expensive methods, getters, impure pipes, or checked hooks in hot paths.
- Mutable inputs and unstable list identity.
- Leaked subscriptions, listeners, caches, or third-party widgets.

> **Make less work happen, then make the remaining work faster.**

---

## 11. Scenario-based interview question

A transaction page becomes slow after loading 20,000 rows and gets slower after each navigation. Walk through the exact measurements you would collect, likely hypotheses, targeted fixes, and regression proof.

---

## Quick revision card

- **Core answer:** Measure the production bundle, remove or replace heavy dependencies, preserve tree-shaking, lazy-load routes, defer noncritical template content, import narrowly, and set budgets that fail regressions.
- **Memory rule:** Measure bytes, then remove the expensive reason.
- **Checks:** network, server, CPU, change detection, DOM/layout, memory, bundle, and accessibility.

## Official Angular references

- [Performance overview](https://angular.dev/best-practices/performance)
- [Skipping component subtrees](https://angular.dev/best-practices/skipping-subtrees)
- [Signals](https://angular.dev/guide/signals)
- [Lazy-loaded routes](https://angular.dev/best-practices/performance/lazy-loaded-routes)
- [Deferred loading](https://angular.dev/best-practices/performance/defer)
