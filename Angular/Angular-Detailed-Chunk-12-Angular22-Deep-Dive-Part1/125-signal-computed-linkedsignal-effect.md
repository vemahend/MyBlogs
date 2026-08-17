# How Do signal, computed, linkedSignal, and effect Differ, and What Is an Appropriate Use Case for Each?

> Senior Angular 22 and ASP.NET Core interview guide using payment and banking scenarios.

## 1. What problem does it solve?

Choosing the wrong primitive causes duplicated state, synchronization effects, write cycles, and difficult timing bugs.

A technical-lead answer must cover more than API names. It should identify the source of truth, notification model, cancellation and error semantics, security boundary, provider lifetime, accessibility impact, observability, and rollout strategy.

---

## 2. Explain it in simple language

signal stores writable source state. computed is read-only derived state and is cached until a dependency changes. linkedSignal is writable state whose valid/default value is linked to changing source state. effect performs a side effect against a non-reactive boundary and runs when read dependencies change; it should not be the normal way to copy or propagate application state.

### Memory anchor

> **Use signals for coherent current state, streams/resources for asynchronous work, and ASP.NET Core for financial authority.**

### Interview-ready answer

> signal stores writable source state. computed is read-only derived state and is cached until a dependency changes. linkedSignal is writable state whose valid/default value is linked to changing source state. effect performs a side effect against a non-reactive boundary and runs when read dependencies change; it should not be the normal way to copy or propagate application state. I would choose it only when its state and lifecycle match the problem, preserve a typed API boundary, test success and failure behavior, and roll it out with measurable production signals.

---

## 3. How does it work internally?

Angular tracks reads in reactive contexts dynamically. signal.set/update invalidates consumers. computed recalculates lazily and memoizes. linkedSignal runs a reactive computation to initialize/reset a writable value when its source changes while still allowing user writes. effect runs at least once, tracks its latest reads, schedules asynchronously, and needs cleanup for external resources.

### Angular example

```typescript
readonly currency=signal('NZD');
readonly amount=signal(100);
readonly rate=signal(1);
readonly converted=computed(()=>this.amount()*this.rate());
readonly accounts=signal<Account[]>([]);
readonly selectedAccount=linkedSignal(()=>this.accounts()[0]?.id??null);
private auditUi=effect(onCleanup=>{
 const stop=this.chart.render(this.converted()); onCleanup(stop);
});
```

### Internal sequence

1. Angular evaluates the reactive expression and records signal dependencies.
2. A dependency change invalidates the relevant consumer or asynchronous operation.
3. Angular creates a coherent new state and schedules only eligible views.
4. The template reads current state without duplicating it into unrelated flags.
5. Cleanup/cancellation prevents destroyed or stale work from becoming authoritative.

Signals do not make network calls synchronous. They provide synchronous access to the current snapshot; the underlying work still completes asynchronously.

---

## 4. Realistic payment or banking example

The payment currency is a signal; converted total is computed; selected funding account is linkedSignal so it remains user-selectable but resets if no longer present; an effect writes a non-sensitive theme preference or invokes a chart API—not another application state signal.

### Trust boundary

| Angular/browser | ASP.NET Core/backend |
|---|---|
| Accessible interaction and typed presentation state | Authentication and policy/resource authorization |
| Fast client validation | Authoritative domain and security validation |
| Suppress accidental repeated gestures | Idempotency and concurrency guarantees |
| Cancel or ignore stale reads | Safe cancellation and transaction consistency |
| Map DTOs to view models | Version contracts, audit, and safe ProblemDetails |

Never tell an interviewer that a guard, disabled button, signal validator, interceptor, or TypeScript type secures the transaction. The browser can be changed or bypassed.

---

## 5. Successful flow and failure flow

### Successful flow

Each fact has one owner, derivations cannot drift, dependent selection remains valid, and side effects are isolated and cleaned up.

1. Input/route state is normalized and validated.
2. Angular represents loading or pending without contradictory flags.
3. The request carries a correlation ID and only necessary data.
4. The API authenticates, authorizes, validates, and applies transaction controls.
5. The UI maps the outcome into value, empty, validation, conflict, forbidden, or error state.

### Failure flow

Effects copy amount into fee and total signals, producing transient inconsistency or cycles. linkedSignal preserves a funding account no longer authorized. An effect writes sensitive state to localStorage.

A production-quality failure path also answers: Can the user retry? Will retry duplicate a command? Is previous data still safe to show? Has focus moved? Are raw server details hidden? Can support trace the correlation ID?

---

## 6. Practical Angular and C#/.NET example

### Angular

```typescript
readonly currency=signal('NZD');
readonly amount=signal(100);
readonly rate=signal(1);
readonly converted=computed(()=>this.amount()*this.rate());
readonly accounts=signal<Account[]>([]);
readonly selectedAccount=linkedSignal(()=>this.accounts()[0]?.id??null);
private auditUi=effect(onCleanup=>{
 const stop=this.chart.render(this.converted()); onCleanup(stop);
});
```

### ASP.NET Core authoritative command boundary

```csharp
[Authorize(Policy = "Payments.Write")]
[HttpPost("{paymentId:guid}/approve")]
public async Task<ActionResult<PaymentDto>> Approve(
    Guid paymentId, ApprovePaymentRequest request,
    [FromHeader(Name = "Idempotency-Key")] string idempotencyKey,
    CancellationToken cancellationToken)
{
    var command = mapper.Map(paymentId, request, User, idempotencyKey);
    var result = await workflow.ApproveAsync(command, cancellationToken);
    return result.Match<ActionResult<PaymentDto>>(
        value => Ok(mapper.ToDto(value)),
        invalid => ValidationProblem(invalid.ToModelState()),
        forbidden => Forbid(),
        conflict => Conflict(conflict.ToProblemDetails()));
}
```

### Tests expected from a senior engineer

- Initial/loading, value, empty, validation, error, cancellation, refresh, and retry behavior.
- Responses arriving out of order and navigation/component destruction during work.
- Anonymous, forbidden, resource ownership, invalid input, and unknown server states.
- Idempotency and optimistic concurrency for financial commands.
- Keyboard, screen-reader announcements, focus, reduced motion, and responsive layout.
- Contract validation for DTO shape and new/unknown enum values.

---

## 7. Important design decisions

Default to signal for owned state and computed for derivation. Use linkedSignal only when state is both user-writable and constrained by another source. Use effect only for non-reactive side effects and include cleanup/security review.

Also decide the feature/provider lifetime, the cache boundary, whether stale data may remain visible, how logout/tenant change invalidates state, which errors are retryable, what telemetry proves success, and how the change can be rolled back.

---

## 8. When to use and when not to use it

### Use it when

- Its lifecycle and state model match the actual problem.
- It reduces duplicated synchronization code and clarifies ownership.
- The feature boundary has behavioral, contract, and accessibility tests.
- The team can observe and support it in production.

### Avoid or reconsider it when

- A simple synchronous computed value is being turned into an asynchronous pipeline.
- Complex stream concurrency is clearer with RxJS operators.
- A stable critical feature would be rewritten without measurable value.
- A client technique is being used to replace backend authorization, idempotency, or validation.
- Required libraries, SSR behavior, or test environments are not compatible.

---

## 9. Compare it with related concepts

| Concept | Best mental model |
|---|---|
| signal | Writable source state |
| computed | Read-only derivation |
| linkedSignal | Writable state linked to source |
| effect | External side effect |


A good comparison includes source of truth, push/pull behavior, current value, error/completion, cancellation, concurrency, lifetime, compiler integration, and migration cost.

---

## 10. Common production mistakes

- Maintaining value, loading, error, and pending in unrelated writable flags.
- Allowing a stale request to overwrite the current route/filter state.
- Using effect to copy or propagate application state.
- Forgetting teardown for timers, streams, observers, sockets, or external widgets.
- Showing raw exception text, account identifiers, or tokens in logs/UI.
- Treating TypeScript as runtime DTO validation.
- Retrying POST commands without an idempotency design.
- Providing a user/tenant cache at root and failing to clear it on identity change.
- Ignoring focus, announcements, empty states, and slow/offline behavior.
- Modernizing several architectural layers in the same irreversible release.

> **A coherent state model prevents UI bugs; an authoritative backend prevents financial loss.**

---

## 11. Scenario-based interview question

Your Angular 22 payment screen works in normal testing, but under a slow network users occasionally see data from the previously selected payment and one duplicate approval is reported. Explain how you would reproduce the problem, which Angular primitive owns each state, what cancellation can and cannot guarantee, how the API prevents duplicate financial effects, and how you would release the fix safely.

### What a strong answer should include

- Correlated evidence and deliberately reordered/delayed responses.
- Stable request identity and stale-result cancellation/ignoring.
- One source of truth with explicit loading/value/error states.
- Backend idempotency key, transaction, unique constraint, and concurrency handling.
- Tests for double click, timeout, retry, refresh, and navigation.
- Canary metrics, rollback, and reconciliation of any affected payments.

---

## Quick revision card

- **Problem:** Choosing the wrong primitive causes duplicated state, synchronization effects, write cycles, and difficult timing bugs.
- **Simple answer:** signal stores writable source state. computed is read-only derived state and is cached until a dependency changes. linkedSignal is writable state whose valid/default value is linked to changing source state. effect performs a side effect against a non-reactive boundary and runs when read dependencies change; it should not be the normal way to copy or propagate application state.
- **Security rule:** Browser behavior is UX; backend policy is security.
- **Reliability rule:** Cancellation reduces stale work; idempotency protects commands.
- **Lead rule:** Mechanism, trade-off, test, metric, rollout, and rollback.

## Official Angular references

- [Angular signals](https://angular.dev/guide/signals)
- [Async reactivity with resources](https://angular.dev/guide/signals/resource)
- [Reactive data fetching with httpResource](https://angular.dev/guide/http/http-resource)
- [Signal Forms](https://angular.dev/guide/forms/signals/overview)
- [Signal Forms validation](https://angular.dev/guide/forms/signals/validation)
- [Signal Forms async operations](https://angular.dev/guide/forms/signals/async-operations)
- [Zoneless Angular](https://angular.dev/guide/zoneless)
- [Server-side and hybrid rendering](https://angular.dev/guide/ssr)
- [Route guards](https://angular.dev/guide/routing/route-guards)
