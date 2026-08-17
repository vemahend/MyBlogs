# How Do Signal Inputs, Outputs, Model Inputs, and Signal Queries Differ from Decorator APIs?

> Senior Angular and .NET interview guide. Version baseline: Angular 14 versus Angular 22.

## 1. What problem does it solve?

Make component contracts reactive, type-safe, composable, and easier for the compiler to understand without lifecycle synchronization code.

This matters in a senior interview because the interviewer is not looking only for syntax. They want to know whether you understand ownership, lifecycle, performance, compatibility, security, and rollout risk across an Angular frontend and an ASP.NET Core backend.

---

## 2. Explain it in simple language

input() exposes an InputSignal, output() exposes a typed event emitter API, model() creates a writable two-way binding contract, and viewChild/contentChild return signals whose values change with the view. Decorators remain supported, but signal APIs fit naturally with computed state.

### Memory anchor

> **Angular 14 shows where the framework came from; Angular 22 makes dependency, state, and rendering notifications more explicit.**

### Interview-ready answer

> input() exposes an InputSignal, output() exposes a typed event emitter API, model() creates a writable two-way binding contract, and viewChild/contentChild return signals whose values change with the view. Decorators remain supported, but signal APIs fit naturally with computed state. I would adopt the modern API at a feature boundary, keep backend contracts authoritative, test observable behavior, and measure whether the change improves build time, runtime performance, maintainability, or reliability.

---

## 3. How does it work internally?

Input signals are read-only inside the child and update when the parent binding changes. output emits events but is not a state container. model is writable and implicitly creates the matching change output used by banana-in-a-box binding. Signal queries return a reactive value as matching children appear or disappear; required variants fail when absent.

### Practical code shape

```typescript
export class AmountEditor {
  readonly currency = input.required<string>();
  readonly maximum = input.required<number>();
  readonly amount = model(0);
  readonly saveRequested = output<{amount:number}>();
  readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('amountBox');
  readonly label = computed(() => `${this.currency()} ${this.amount()}`);
}
```

### Internal mental model

1. The Angular compiler turns templates and metadata into executable view instructions.
2. Dependency injection resolves services from the closest matching environment or element injector.
3. State changes notify Angular through supported mechanisms; modern signals make those dependencies explicit.
4. The renderer reconciles only the views and DOM identities that need work.
5. HTTP, authorization, validation, concurrency, and durable consistency still cross a trust boundary into ASP.NET Core.

Do not describe a modern Angular feature as magic. Explain what creates the value, who owns it, what causes an update, and when its lifetime ends.

---

## 4. Realistic payment or banking example

PaymentAmountEditor receives currency and limits through required inputs, exposes saveRequested as an output, and uses model for an editable amount only when genuine two-way ownership is appropriate.

### Responsibility boundary

| Angular responsibility | ASP.NET Core responsibility |
|---|---|
| Present typed state and accessible feedback | Authenticate and authorize every request |
| Prevent accidental duplicate gestures | Guarantee idempotent money movement |
| Validate for fast user feedback | Repeat authoritative domain validation |
| Cancel or ignore stale reads | Honor cancellation where safe and protect consistency |
| Map transport DTOs to stable view models | Version contracts and return safe ProblemDetails |

The browser is an untrusted client. A route guard, disabled button, hidden menu, or client validator improves user experience but never replaces API authorization or domain rules.

---

## 5. Successful flow and failure flow

### Successful flow

Parent owns workflow state, child derives formatting with computed, and child emits a semantic save intent. No ngOnChanges copy is required.

1. The UI receives or derives a typed state.
2. Angular updates the smallest relevant view region.
3. A semantic user intent is mapped to a request DTO.
4. ASP.NET Core authenticates, authorizes, validates, and applies concurrency/idempotency controls.
5. The response is mapped to a view model and telemetry records the outcome.

### Failure flow

The child copies input into a second writable signal and they drift, or model is used for every property, obscuring ownership. An output named clicked leaks DOM detail rather than business intent.

1. Client shows a safe validation, authorization, offline, timeout, or conflict state.
2. Technical details are logged with correlation IDs, not exposed to the customer.
3. Retriable reads may retry with a bound policy; commands retry only with a sound idempotency design.
4. Unknown states fail safely and remain observable.

---

## 6. Practical Angular and C#/.NET example

### Angular

```typescript
export class AmountEditor {
  readonly currency = input.required<string>();
  readonly maximum = input.required<number>();
  readonly amount = model(0);
  readonly saveRequested = output<{amount:number}>();
  readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('amountBox');
  readonly label = computed(() => `${this.currency()} ${this.amount()}`);
}
```

### ASP.NET Core remains authoritative

```csharp
[Authorize(Policy = "Payments.Write")]
[HttpPost("{paymentId:guid}/approve")]
public async Task<ActionResult<PaymentDto>> Approve(
    Guid paymentId,
    ApprovePaymentRequest request,
    [FromHeader(Name = "Idempotency-Key")] string idempotencyKey,
    CancellationToken cancellationToken)
{
    var command = mapper.ToCommand(paymentId, request, User, idempotencyKey);
    var result = await workflow.ApproveAsync(command, cancellationToken);
    return result.Match<ActionResult<PaymentDto>>(
        ok => Ok(mapper.ToDto(ok)),
        invalid => ValidationProblem(invalid.ToModelState()),
        forbidden => Forbid(),
        conflict => Conflict(conflict.ToProblemDetails()));
}
```

### Why show .NET in an Angular answer?

A senior full-stack answer identifies the trust boundary. Angular owns interaction and presentation. The API owns financial authority. Compile-time TypeScript safety cannot validate runtime JSON, authorize an account, prevent forged requests, or guarantee exactly one financial effect.

### Tests worth mentioning

- Angular unit/component test for state, rendering, and emitted intent.
- Contract test for DTO compatibility and unknown enum values.
- API authorization tests for anonymous, forbidden, and allowed users.
- Idempotency and optimistic-concurrency tests for commands.
- Browser test for focus, keyboard, accessibility, refresh, and slow-network behavior.

---

## 7. Important design decisions

Prefer read-only input plus semantic output; use model sparingly for real shared editable value; avoid effects that merely copy inputs; handle optional query absence.

Also decide:

- Who owns the source of truth?
- What is the provider/state lifetime: application, route, component, or request?
- What is the stable public component and API contract?
- What compatibility bridge is temporary, and how will it be removed?
- Which metric proves the modernization created value?
- What is the rollback boundary if production regresses?

---

## 8. When to use and when not to use it

### Use the modern approach when

- Starting a new Angular 22 feature or a well-isolated modernization boundary.
- It simplifies dependency visibility, synchronous state, rendering, testing, or delivery.
- The team can verify behavior and support the chosen API in production.

### Do not force it when

- A stable legacy feature would be rewritten only to look modern, without measurable value.
- A third-party library or custom build integration is not compatible.
- RxJS better models the asynchronous sequence or concurrency policy.
- The migration combines too many independent risks in one release.
- Client code is being proposed as a replacement for backend security or consistency.

---

## 9. Compare it with related concepts

| Concept | Best mental model |
|---|---|
| @Input | Decorator property updated by Angular |
| input() | Read-only signal contract |
| @Output EventEmitter | Decorator event contract |
| model() | Input plus matching change output |
| Query decorator | Snapshot-like property lifecycle |
| Signal query | Reactive query result |

### Lead-level comparison rule

Do not say one option is universally better. Compare source of truth, notification model, lifetime, cancellation, error handling, compiler support, testability, ecosystem maturity, and migration cost.

---

## 10. Common production mistakes

- Upgrading framework, build system, state architecture, forms, and tests in one unreviewable change.
- Copying state between inputs, signals, subjects, and stores until no source of truth is clear.
- Providing the same service at several injector levels accidentally.
- Assuming TypeScript types validate JSON received at runtime.
- Using an effect to propagate state that should be computed or modeled as a stream.
- Measuring a development build instead of a production build with realistic data.
- Treating hidden UI or a route guard as authorization.
- Ignoring loading, empty, error, cancellation, retry, offline, and unknown-state behavior.
- Forgetting accessibility, focus preservation, and reduced-motion behavior during rendering changes.
- Removing compatibility code before third-party dependencies and rollback paths are verified.

> **Modern syntax is useful; a safe, observable, reversible design is senior engineering.**

---

## 11. Scenario-based interview question

You own a business-critical Angular 14 payment feature with good production stability but slow builds and difficult local state. The organization has reached Angular 22. Which part would you modernize first, what would you deliberately leave unchanged, and what objective evidence would let you continue or roll back?

### What a strong answer should cover

- Separate mandatory version compatibility from optional modernization.
- Name the source of truth and the browser/API trust boundary.
- Choose a small feature or route boundary with regression tests.
- Define build, bundle, runtime, error, accessibility, and business metrics.
- Explain canary/feature-flag rollout and rollback.
- Protect API contracts, authorization, idempotency, and audit history.

---

## Quick revision card

- **Problem:** Make component contracts reactive, type-safe, composable, and easier for the compiler to understand without lifecycle synchronization code.
- **Simple answer:** input() exposes an InputSignal, output() exposes a typed event emitter API, model() creates a writable two-way binding contract, and viewChild/contentChild return signals whose values change with the view. Decorators remain supported, but signal APIs fit naturally with computed state.
- **Banking rule:** Client feedback is helpful; backend enforcement is mandatory.
- **Migration rule:** Upgrade safely first, modernize intentionally second.
- **Interview rule:** Explain mechanism, trade-off, failure mode, measurement, and rollback.

## Official Angular references

- [Angular documentation](https://angular.dev/)
- [Standalone components](https://angular.dev/guide/components/importing)
- [Signals](https://angular.dev/guide/signals)
- [Signal Forms](https://angular.dev/guide/forms/signals/overview)
- [Strictly typed reactive forms](https://angular.dev/guide/forms/typed-forms)
- [Built-in control flow](https://angular.dev/guide/templates/control-flow)
- [New build system migration](https://angular.dev/tools/cli/build-system-migration)
- [Hydration](https://angular.dev/guide/hydration)
- [Zoneless Angular](https://angular.dev/guide/zoneless)
- [Migrating from Karma to Vitest](https://angular.dev/guide/testing/migrating-to-vitest)
