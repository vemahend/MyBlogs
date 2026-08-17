# How Do Directives Help Reduce Duplicated Template Logic?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

Without directives, the same DOM behavior—permission-aware visibility, focus management, input normalization, analytics, or double-click prevention—gets copied into many components. Copies drift, miss cleanup, and create inconsistent accessibility and security expectations.

---

## 2. Explain it in simple language

A directive packages reusable behavior and applies it to an existing element through a selector. The component keeps its business workflow; the directive owns one cross-cutting presentation behavior.

### Memory rule

> **Components own views; directives add behavior to views.**

### Interview-ready answer

> A directive packages reusable behavior and applies it to an existing element through a selector. The component keeps its business workflow; the directive owns one cross-cutting presentation behavior. In production I would also explain who owns the state, how the view behaves during change and destruction, and which validation or authorization must remain authoritative in ASP.NET Core.

---

## 3. How does it work internally?

1. Angular matches the directive selector while compiling the template.
2. The element and directive are created in the same view and injector context.
3. Inputs configure the behavior; host bindings/listeners affect the host element.
4. The directive reacts to input or host-event changes.
5. Angular destroys it with the host view, allowing cleanup through DestroyRef.

### Practical interpretation

Extract behavior only when its meaning is stable across consumers. A directive should not secretly call payment APIs or become a miniature workflow engine. Prefer native HTML behavior first; for a real button, the native disabled property is stronger than styling alone.

### Incorrect versus improved approach

```typescript
<!-- Copied, incomplete guards -->
<button [disabled]="saving" (click)="saving || submit()">Pay</button>
<!-- Shared behavior; API still enforces idempotency -->
<button appSubmitOnce [busy]="saving" (click)="submit()">Pay</button>
```

### Runtime mental model

1. Angular compiles the template and identifies directives, pipes, bindings, and embedded views.
2. Runtime values are evaluated during view synchronization.
3. Angular updates the host node or reconciles embedded views using the declared identity and state.
4. Child components, subscriptions, and DOM resources follow the lifetime of the view that owns them.
5. Browser behavior remains a user-experience layer; backend policies protect money and data.

---

## 4. Realistic payment or banking example

Every payment action must be disabled while submission is running. A focused directive can prevent repeated DOM activation and expose an accessible disabled state. It improves UX, but the create-payment endpoint still requires an idempotency key because two tabs, retries, or direct API calls bypass the directive.

### Full-stack responsibility split

| Angular | ASP.NET Core |
|---|---|
| Render explicit loading, empty, ready, and error states | Return authorized, least-privilege DTOs |
| Format values and guide input | Validate authoritative currency, precision, limits, and status |
| Hide/disable actions for usability | Enforce authorization, concurrency, and idempotency |
| Reconcile rows with stable IDs | Provide stable resource identity |
| Avoid stale work and release view resources | Honour cancellation and protect server capacity |

---

## 5. Successful flow and failure flow

### Successful flow

1. Template applies one reviewed directive.
2. Directive blocks a second local activation and exposes busy state.
3. Component sends one command with an idempotency key.
4. API atomically accepts or replays the same result.
5. All screens receive the directive fix together.

### Failure flow

1. Teams copy `(click)` guards into ten templates.
2. One screen forgets keyboard activation and another never resets its flag after an error.
3. A retry produces duplicate payment requests.
4. Frontend and backend disagree about state.
5. Centralize UI behavior and enforce idempotency server-side.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
@Directive({selector:'button[appSubmitOnce]'})
export class SubmitOnceDirective {
  readonly busy = input(false);
  private readonly el = inject(ElementRef<HTMLButtonElement>);
  @HostBinding('attr.aria-disabled') get ariaDisabled(){ return String(this.busy()); }
  @HostListener('click',['$event']) stopWhenBusy(e:Event){
    if(this.busy()){ e.preventDefault(); e.stopImmediatePropagation(); }
  }
}

<button appSubmitOnce [busy]="state().submitting" (click)="submit()">Pay</button>
```

### ASP.NET Core boundary

```csharp
[HttpPost]
public async Task<IActionResult> Create(CreatePaymentRequest request,
 [FromHeader(Name="Idempotency-Key")] string key,CancellationToken ct)
 => (await payments.CreateIdempotentlyAsync(key,request,User,ct)).ToActionResult();
```

### How to test it

Use a host component. Test mouse and keyboard behavior, busy-state transitions, accessibility attributes, event count, view destruction, and recovery after an API error. Separately integration-test idempotency at the API.

### Production verification

- Exercise refresh, rapid interaction, delayed API responses, and navigation away.
- Verify keyboard, focus, labels, disabled state, and screen-reader semantics.
- Profile a realistic list rather than a ten-row demo.
- Test 401, 403, 404, 409, validation failure, and transient server failure.
- Confirm the browser never receives secrets merely hidden by a directive or pipe.
- Confirm logs use correlation IDs and avoid account, card, and payment credentials.

---

## 7. Important design decisions

- Choose one cohesive behavior.
- Expose typed inputs and semantic outputs only when needed.
- Prefer native semantics before custom DOM behavior.
- Clean global listeners and observers.
- Document that authorization/idempotency remain server concerns.

A senior answer should state the rejected alternative and its failure mode. Naming an Angular API is not enough; explain identity, ownership, lifetime, performance, accessibility, and server authority.

---

## 8. When to use and when not to use it

### Use it when

- The same host-element behavior appears across multiple screens.

### Avoid or reconsider it when

- One-off markup, page orchestration, domain rules, or behavior already provided correctly by HTML.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Directive | Adds behavior to an existing host |
| Component | Owns a view/template |
| Pipe | Transforms display data |
| Service | Coordinates non-view logic |

---

## 10. Common production mistakes

- Copy-paste template guards.
- Calling APIs inside directives.
- Using CSS disabled as real disabled.
- No keyboard/accessibility support.
- Treating visibility as authorization.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

Five payment screens implement different double-submit guards. Design a reusable solution and explain what must still be enforced by the API.

---

## Quick revision card

- **Core answer:** A directive packages reusable behavior and applies it to an existing element through a selector. The component keeps its business workflow; the directive owns one cross-cutting presentation behavior.
- **Memory rule:** Components own views; directives add behavior to views.
- **Senior checks:** identity, ownership, lifetime, accessibility, performance, and backend authority.
- **Failure checks:** mutation, stale view, duplicate action, unauthorized API call, and contract drift.

## Official Angular references

- [Control flow](https://angular.dev/guide/templates/control-flow)
- [Structural directives](https://angular.dev/guide/directives/structural-directives)
- [Pipes](https://angular.dev/guide/templates/pipes)
