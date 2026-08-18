# What Build, Bundle-Size, Performance, SSR, Accessibility, and Browser-Regression Checks Would You Run Before Release?

> Senior Angular migration and ASP.NET Core interview guide using payment and banking systems.

## 1. What problem does it solve?

Compilation success alone cannot show whether customers receive larger bundles, broken deep links, hydration mismatches, inaccessible controls, unsupported browser behavior, or slower financial workflows.

A senior engineer treats migration as risk management: preserve behavior, isolate variables, protect customer money/data, measure outcomes, and maintain recovery—not merely make the compiler green.

---

## 2. Explain it in simple language

Create a release evidence matrix. Verify clean reproducible builds and budgets; compare initial/lazy bundles; profile production journeys on realistic devices/data; test server, prerender, client routes and hydration; automate and manually review accessibility; run a risk-based browser/device matrix; verify security headers, CSP, source maps, caching, service worker, and observability.

### Memory anchor

> **Upgrade for compatibility first; modernize for measured value second. Keep every step reviewable, testable, and reversible.**

### Interview-ready answer

> Create a release evidence matrix. Verify clean reproducible builds and budgets; compare initial/lazy bundles; profile production journeys on realistic devices/data; test server, prerender, client routes and hydration; automate and manually review accessibility; run a risk-based browser/device matrix; verify security headers, CSP, source maps, caching, service worker, and observability. I would start with an inventory and baseline, change one bounded concern, run production-like checks, deploy gradually, observe agreed metrics, and preserve a tested rollback.

---

## 3. How does it work internally?

The modern application builder can change chunk graphs and ESM/SSR assumptions. Bundle analysis identifies duplicate/accidentally eager code. Browser profiling separates API, JavaScript, change detection, layout, and paint. Hydration requires identical server/client DOM. Accessibility automation catches only part of WCAG; keyboard, focus, labels, announcements, zoom, contrast, motion, and screen-reader workflows need human/real-browser coverage.

### Practical migration/code example

```typescript
// angular.json production budgets (example)
{
 "budgets":[
  {"type":"initial","maximumWarning":"750kB","maximumError":"900kB"},
  {"type":"anyComponentStyle","maximumError":"12kB"}
 ]
}
// CI: build -> bundle diff -> unit/integration -> SSR smoke -> browser/a11y -> deploy canary.
```

### Migration mechanics

1. Resolve the supported Node.js, TypeScript, RxJS, Angular, builder, test, and third-party dependency set.
2. Run official Angular update/migration tooling on a clean, focused branch.
3. Review generated code as production code; never assume a schematic understands business intent.
4. Compile, lint, test, build production artifacts, and execute critical browser journeys.
5. Commit one coherent step with its evidence and rollback instructions.

Codemods change syntax and configuration. They cannot decide service lifetime, customer-security semantics, accessibility behavior, or whether a changed test still protects the right behavior.

---

## 4. Realistic payment or banking example

Critical journeys are passkey login, account switch, transaction search, beneficiary creation, payment authoring, approval, receipt download, and logout. Each runs against production-like ASP.NET Core contracts with slow/failure variants and permitted test data.

### Non-negotiable trust boundary

| Angular migration responsibility | ASP.NET Core/platform responsibility |
|---|---|
| Preserve accessible customer interaction | Authenticate and authorize every request/resource |
| Preserve typed request/response mappings | Keep backward-compatible contracts during rollout |
| Prevent accidental repeated UI actions | Guarantee idempotency and concurrency safety |
| Report correlation and safe client errors | Maintain audit, reconciliation, and safe ProblemDetails |
| Roll back frontend assets/features | Protect committed financial state independently |

A frontend rollback cannot reverse a payment already committed. Recovery must include reconciliation and compensating business procedures where required.

---

## 5. Successful flow and failure flow

### Successful flow

Budgets do not regress unexpectedly; no hydration errors occur; deep-link refresh works; p95 interaction stays within budget; keyboard and screen reader complete approval; supported Safari/Chrome/Edge/mobile combinations pass; API security and idempotency tests remain green.

1. Baseline build, bundle, runtime, errors, accessibility, and business completion.
2. Implement the smallest compatible change with targeted characterization tests.
3. Verify old and new clients against compatible APIs.
4. Release to a controlled cohort and compare guardrails.
5. Expand only when evidence is healthy; document lessons and remove temporary bridges later.

### Failure and recovery flow

A custom webpack assumption is lost, an SSR route reads window, 200 KB of a chart library enters the initial bundle, or an icon-only approval control loses its accessible name. The release is blocked or scoped behind a flag until fixed.

1. Halt exposure and preserve diagnostic evidence.
2. Disable an optional flag or restore the previous immutable client/server bundle.
3. Keep APIs compatible while cached clients drain.
4. Reconcile potentially affected financial commands.
5. Fix the smallest proven cause and rerun the same gate before retrying rollout.

---

## 6. Practical Angular and C#/.NET example

### Angular/migration

```typescript
// angular.json production budgets (example)
{
 "budgets":[
  {"type":"initial","maximumWarning":"750kB","maximumError":"900kB"},
  {"type":"anyComponentStyle","maximumError":"12kB"}
 ]
}
// CI: build -> bundle diff -> unit/integration -> SSR smoke -> browser/a11y -> deploy canary.
```

### ASP.NET Core backward-compatible command boundary

```csharp
[Authorize(Policy = "Payments.Approve")]
[HttpPost("{id:guid}/approve")]
public async Task<ActionResult<PaymentDto>> Approve(
    Guid id, ApprovePaymentRequest request,
    [FromHeader(Name = "Idempotency-Key")] string key,
    CancellationToken cancellationToken)
{
    var command = mapper.MapCompatibleRequest(id, request, User, key);
    var result = await workflow.ApproveIdempotentlyAsync(command, cancellationToken);
    return result.ToActionResult();
}
```

### Verification pyramid

- Static: TypeScript strictness, template diagnostics, lint, architecture rules, dependency audit.
- Unit: pure mapping, validation, computed state, guards, policies, and edge cases.
- Integration: TestBed, HTTP, router, providers, DTO contracts, API/database behavior.
- Browser: login/passkey, navigation/refresh, forms, accessibility, supported devices.
- Non-functional: bundle, performance, memory, SSR/hydration, security, caching.
- Production: canary/RUM, API errors, business completion, support, reconciliation.

---

## 7. Important design decisions

Base the matrix on customer analytics and contractual support, not every possible browser. Store artifacts and thresholds in CI, use production builds, include cold/warm cache and slow CPU/network, distinguish lab from real-user metrics, and require an owner for every waiver.

Also decide who owns each gate, which changes are mandatory versus optional, how long old clients remain possible, how caches/service workers are invalidated, the exact rollback trigger, and the maximum acceptable blast radius.

---

## 8. When to use and when not to use it

### Use this approach when

- Migrating a business-critical application with multiple teams and integrations.
- Old and new browser assets may coexist with the same APIs.
- The change affects build, runtime, DI, routing, forms, tests, or rendering.
- Evidence and rapid recovery matter more than migration speed alone.

### Avoid or reconsider when

- A broad rewrite is being disguised as a required framework upgrade.
- The team cannot state objective success/rollback metrics.
- API contracts are changed incompatibly while cached clients still exist.
- A generated migration diff is too large to review meaningfully.
- Optional modernization has no measured customer or engineering pain.

---

## 9. Compare it with related concepts

| Concept | Best mental model |
|---|---|
| Build check | Compilation/configuration correctness |
| Bundle budget | Delivery-size guardrail |
| Lab profiling | Controlled performance evidence |
| RUM | Real-user production evidence |


A lead compares blast radius, compatibility, maturity, provider/state lifetime, test environment, performance hypothesis, accessibility, deployment independence, and rollback—not just code size.

---

## 10. Common production mistakes

- Jumping from Angular 14 to the target in one unreviewable dependency update.
- Mixing mandatory update work with signals, forms, zoneless, SSR, and architecture rewrites.
- Accepting schematic output without reviewing provider scope or behavior.
- Changing API DTOs in a way cached old clients cannot consume.
- Keeping only “tests pass” as a release gate.
- Ignoring Safari/mobile, CSP, service workers, CDN cache, and stale chunks.
- Using unit-test coverage percentage as proof of critical journey safety.
- Rolling back assets without reconciling financial commands already accepted.
- Migrating to modern syntax without measuring any benefit.
- Removing compatibility bridges without confirming all consumers moved.

> **The safest migration creates many small points where you can confidently stop, continue, or return.**

---

## 11. Scenario-based interview question

During the Angular 22 canary, JavaScript errors remain flat but payment-approval completion falls by 1.5% only on Safari. Build and unit tests are green. Explain your immediate release decision, evidence you would collect, how you would distinguish Angular rendering, passkey/browser, API, and analytics issues, and how you would recover without risking duplicate payments.

### Strong-answer checklist

- Halt expansion against a pre-agreed business guardrail.
- Segment by browser/version, route, tenant, error, latency, and authentication method.
- Correlate client, API, identity, and payment audit events.
- Reproduce with production build, Safari devices, slow network, and cached assets.
- Roll back/disable safely while keeping API compatibility.
- Verify idempotency and reconcile any ambiguous approvals.
- Add the missing regression test before resuming canary.

---

## Quick revision card

- **Problem:** Compilation success alone cannot show whether customers receive larger bundles, broken deep links, hydration mismatches, inaccessible controls, unsupported browser behavior, or slower financial workflows.
- **Simple answer:** Create a release evidence matrix. Verify clean reproducible builds and budgets; compare initial/lazy bundles; profile production journeys on realistic devices/data; test server, prerender, client routes and hydration; automate and manually review accessibility; run a risk-based browser/device matrix; verify security headers, CSP, source maps, caching, service worker, and observability.
- **Migration rule:** One concern and one reversible commit at a time.
- **Security rule:** Browser changes never replace backend enforcement.
- **Release rule:** Technical health plus business outcomes decide rollout.

## Official Angular references

- [Angular Update Guide](https://angular.dev/update-guide)
- [Angular migrations](https://angular.dev/reference/migrations)
- [Standalone migration](https://angular.dev/reference/migrations/standalone)
- [Migration to inject](https://angular.dev/reference/migrations/inject-function)
- [Migration to signal inputs](https://angular.dev/reference/migrations/signal-inputs)
- [Migrating from Karma to Vitest](https://angular.dev/guide/testing/migrating-to-vitest)
- [New build-system migration](https://angular.dev/tools/cli/build-system-migration)
- [Zoneless Angular](https://angular.dev/guide/zoneless)
