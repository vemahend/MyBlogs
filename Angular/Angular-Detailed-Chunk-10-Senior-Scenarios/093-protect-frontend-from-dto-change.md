# A Backend API Changes a DTO Used by Angular Screens. How Do You Protect the Frontend?

> Senior Angular/.NET technical-lead scenario guide using banking and payment systems.

## 1. What problem does it solve?

This scenario tests whether a senior engineer can move from a symptom to evidence, isolate the failing layer, protect customer data and money, deliver a safe fix, and prevent recurrence. The interviewer is evaluating investigation order and trade-offs—not just whether you can name an Angular API.

---

## 2. Explain it in simple language

Treat DTOs as versioned boundary contracts. Generate or validate schemas, keep endpoint clients and DTO-to-view-model mappers at the edge, use additive compatibility, consumer/provider contract tests, and coordinated rollout.

### Memory rule

> **DTO at the edge; view model inside.**

### Interview-ready answer

> Treat DTOs as versioned boundary contracts. Generate or validate schemas, keep endpoint clients and DTO-to-view-model mappers at the edge, use additive compatibility, consumer/provider contract tests, and coordinated rollout. I would reproduce the exact failure, collect evidence across browser, Angular, network, and ASP.NET Core, define the safety boundary, fix the smallest root cause, and prove the result with regression tests and production telemetry.

---

## 3. How does it work internally?

### Investigation order

1. Define the exact user action, URL, identity, data volume, timing, and expected result.
2. Reproduce with production-like build/configuration and record browser network, console, performance, and memory evidence.
3. Follow correlation IDs into API logs, authorization decisions, dependencies, and database behavior.
4. Form multiple hypotheses and use measurements to eliminate them.
5. Fix ownership or contract at the layer that actually caused the problem.

### Practical interpretation

Raw DTO properties used across templates make one rename break dozens of screens; TypeScript interfaces alone do not validate runtime JSON.

### Angular implementation direction

```typescript
function toPaymentVm(dto:PaymentDto):PaymentVm {
 return {id:dto.id,amount:toMoney(dto.amount,dto.currency),
  status:knownStatus(dto.status)?dto.status:'Unknown',
  canApprove:dto.capabilities?.includes('approve')??false};
}
```

A strong answer avoids jumping immediately to a favorite pattern. It states what evidence would prove the diagnosis, what customer/security risk exists, and how the team can ship safely.

---

## 4. Realistic payment or banking example

Payment status adds `PartiallySettled` and amount metadata changes. One mapper handles fallback and telemetry while components continue using a stable PaymentVm.

### Full-stack responsibility split

| Angular/browser | ASP.NET Core/platform |
|---|---|
| Navigation, presentation, input, cancellation, and local state | Authentication, authorization, validation, idempotency, and concurrency |
| Safe typed DTO mapping and view states | Least-privilege contracts and safe ProblemDetails |
| Prevent accidental duplicate interaction | Guarantee one logical financial effect |
| Measure browser/network/render/memory | Measure API/dependency/SQL/queue behavior |
| Feature rollout and client telemetry | Audit trail, correlation, rollback, and data integrity |

---

## 5. Successful flow and failure flow

### Successful investigation and delivery flow

1. Reproduce the smallest failing case and capture a baseline.
2. Assess severity: money movement, data exposure, availability, or only UX.
3. Identify root cause with correlated evidence.
4. Add a failing regression test before or with the fix.
5. Roll out behind a flag/canary when risk warrants it and monitor agreed signals.

### Failure flow

1. Team treats the visible Angular symptom as the root cause.
2. A speculative rewrite changes several layers simultaneously.
3. No baseline or failure test exists.
4. The issue recurs or creates a security/data-integrity regression.
5. Incident analysis cannot distinguish client, API, or data-layer behavior.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
function toPaymentVm(dto:PaymentDto):PaymentVm {
 return {id:dto.id,amount:toMoney(dto.amount,dto.currency),
  status:knownStatus(dto.status)?dto.status:'Unknown',
  canApprove:dto.capabilities?.includes('approve')??false};
}
```

### ASP.NET Core protection boundary

```csharp
[Authorize(Policy = "PaymentsAccess")]
[HttpPost("{id:guid}/approve")]
public async Task<IActionResult> Approve(Guid id,ApprovePaymentRequest request,
 [FromHeader(Name = "Idempotency-Key")]string key,CancellationToken ct)
{
    var result=await workflow.ApproveIdempotentlyAsync(id,request,key,User,ct);
    return result.ToActionResult();
}
```

### Regression test plan

- Reproduce the original user journey exactly.
- Add success, validation, anonymous, forbidden, missing, conflict, timeout, and retry cases.
- Test refresh/direct URL and navigation reuse where relevant.
- Delay and reverse responses to expose stale-result races.
- Repeat navigation to detect leaked subscribers, DOM nodes, or memory.
- Verify direct API calls remain secure when browser guards are bypassed.

### Production verification

- Use correlation IDs across browser and API.
- Define before/after technical and user metrics.
- Canary or feature-flag high-risk changes.
- Monitor 4xx/5xx, latency, duplicate-command rate, memory, and navigation errors.
- Provide rollback and data-reconciliation steps.
- Document the ownership decision in an ADR or feature design note.

---

## 7. Important design decisions

- Additive first
-  unknown fallback
-  schema validation
-  deployment order
-  observability

For a lead-level answer, explicitly discuss blast radius, backward compatibility, security, rollout, observability, and how you will coach the team—not only the final code.

---

## 8. When to use and when not to use it

### Use this approach when

- The symptom crosses browser, Angular, HTTP, API, data, or identity boundaries.
- A production fix needs evidence, controlled rollout, and regression protection.

### Avoid or reconsider when

- You are proposing a broad rewrite before proving the bottleneck or defect.
- The frontend technique is being used to replace backend authorization, idempotency, concurrency, or durable persistence.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| DTO | Transport contract |
| view model | UI contract |
| mapper | Anti-corruption boundary |
| contract test | Runtime compatibility |

---

## 10. Common production mistakes

- Fixing symptoms with timeouts, manual detectChanges, or page reloads.
- No production-like reproduction or baseline.
- Client-side security treated as authoritative.
- Large refactor without compatibility and rollback.
- No regression test, telemetry, or ownership after release.

> **Senior engineers reduce uncertainty before they increase change.**

---

## 11. Scenario-based interview question

After your first fix ships, the incident rate drops but does not reach zero. What evidence would you compare between remaining failures and successful requests, and how would you decide whether to roll back, continue the canary, or open a second hypothesis?

---

## Quick revision card

- **Core answer:** Treat DTOs as versioned boundary contracts. Generate or validate schemas, keep endpoint clients and DTO-to-view-model mappers at the edge, use additive compatibility, consumer/provider contract tests, and coordinated rollout.
- **Memory rule:** DTO at the edge; view model inside.
- **Lead checks:** evidence, severity, owner, compatibility, test, rollout, telemetry, rollback, and coaching.

## Official Angular references

- [Route guards](https://angular.dev/guide/routing/route-guards)
- [HTTP request cancellation](https://angular.dev/guide/http/making-requests)
- [Angular performance](https://angular.dev/best-practices/performance)
- [Chrome/Angular profiling](https://angular.dev/best-practices/profiling-with-chrome-devtools)
- [RxJS teardown](https://angular.dev/ecosystem/rxjs-interop/take-until-destroyed)
