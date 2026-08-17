# What Mistakes Can Make Templates Hard to Maintain?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

Templates become fragile when they contain workflow logic, repeated expressions, deep condition nesting, implicit state combinations, heavy function calls, inaccessible markup, and raw backend DTO knowledge.

---

## 2. Explain it in simple language

A maintainable template reads like a view specification: explicit state branches, simple bindings, semantic events, small components, and precomputed/derived values. Complex decisions belong in typed component/facade state.

### Memory rule

> **A template should reveal the UI, not hide the algorithm.**

### Interview-ready answer

> A maintainable template reads like a view specification: explicit state branches, simple bindings, semantic events, small components, and precomputed/derived values. Complex decisions belong in typed component/facade state. In production I would also explain who owns the state, how the view behaves during change and destruction, and which validation or authorization must remain authoritative in ASP.NET Core.

---

## 3. How does it work internally?

1. Angular evaluates template expressions during view synchronization.
2. A method binding may execute far more often than the developer expects.
3. Nested blocks create nested view scopes and lifetimes.
4. Multiple booleans permit impossible combinations such as loading and success together.
5. Raw DTO coupling spreads backend changes through many templates.

### Practical interpretation

Some small expressions are fine. The smell is repeated domain knowledge, mutation, expensive work, or state that is difficult to name and test. Alias async/reactive values once, split by cohesive view responsibility, and preserve semantic HTML/accessibility.

### Incorrect versus improved approach

```typescript
@if (!loading && !error && payments && payments.length && user && canApprove(user,payments[0])) { ... }
// Prefer an explicit view state and precomputed capabilities.
```

### Runtime mental model

1. Angular compiles the template and identifies directives, pipes, bindings, and embedded views.
2. Runtime values are evaluated during view synchronization.
3. Angular updates the host node or reconciles embedded views using the declared identity and state.
4. Child components, subscriptions, and DOM resources follow the lifetime of the view that owns them.
5. Browser behavior remains a user-experience layer; backend policies protect money and data.

---

## 4. Realistic payment or banking example

Instead of `loading`, `error`, `empty`, and `loaded` booleans, expose a discriminated `PaymentPageState`. The template renders one branch and delegates transaction rows to a focused component.

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

1. Facade maps DTO to a view model.
2. One explicit state union reaches the page.
3. Template chooses exactly one branch.
4. Rows receive typed VMs and emit semantic intent.
5. Tests enumerate state cases.

### Failure flow

1. Template calls `canApprove(payment,user,limits)` in every row.
2. Rules are duplicated from API and evaluated repeatedly.
3. Boolean states conflict after an error.
4. Markup becomes a deeply nested pyramid.
5. Move derivation to typed state; keep API rules authoritative.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
type PageState =
 | {kind:'loading'} | {kind:'error';message:string}
 | {kind:'empty'} | {kind:'ready';payments:readonly PaymentVm[]};

@switch (state().kind) {
 @case ('loading') { <app-spinner/> }
 @case ('error') { <app-error [message]="state().message"/> }
 @case ('empty') { <p>No payments</p> }
 @case ('ready') { <app-payment-list [items]="state().payments"/> }
}
```

### ASP.NET Core boundary

```csharp
public sealed record PaymentListItemDto(Guid Id,decimal Amount,string Currency,string Status,bool CanApprove);
// API calculates authorization-sensitive capability; endpoint rechecks on command.
```

### How to test it

Use a state matrix: loading, error, empty, ready, unauthorized capability, and rapid transitions. Test DOM behavior rather than private implementation. Add accessibility checks and performance profiling for large lists.

### Production verification

- Exercise refresh, rapid interaction, delayed API responses, and navigation away.
- Verify keyboard, focus, labels, disabled state, and screen-reader semantics.
- Profile a realistic list rather than a ten-row demo.
- Test 401, 403, 404, 409, validation failure, and transient server failure.
- Confirm the browser never receives secrets merely hidden by a directive or pipe.
- Confirm logs use correlation IDs and avoid account, card, and payment credentials.

---

## 7. Important design decisions

- Model states explicitly.
- Map DTOs at the boundary.
- Precompute expensive derivations.
- Split cohesive child views, not every div.
- Prefer semantic HTML and accessible controls.

A senior answer should state the rejected alternative and its failure mode. Naming an Angular API is not enough; explain identity, ownership, lifetime, performance, accessibility, and server authority.

---

## 8. When to use and when not to use it

### Use it when

- Keep templates declarative and close to visual structure.

### Avoid or reconsider it when

- Business algorithms, API calls, mutation, nested subscriptions, and complex formatting in markup.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Template | Declarative rendering/event wiring |
| Component | Local presentation orchestration |
| Facade/store | Workflow and view state |
| API | Authoritative business/security rules |

---

## 10. Common production mistakes

- Function calls per row.
- Boolean-state explosion.
- Deep nested blocks.
- Raw DTO/property chains.
- Clickable divs and missing labels.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

Review a payment page with six booleans, methods in every row, nested async pipes, and a 400-line template. Give an incremental refactoring plan.

---

## Quick revision card

- **Core answer:** A maintainable template reads like a view specification: explicit state branches, simple bindings, semantic events, small components, and precomputed/derived values. Complex decisions belong in typed component/facade state.
- **Memory rule:** A template should reveal the UI, not hide the algorithm.
- **Senior checks:** identity, ownership, lifetime, accessibility, performance, and backend authority.
- **Failure checks:** mutation, stale view, duplicate action, unauthorized API call, and contract drift.

## Official Angular references

- [Control flow](https://angular.dev/guide/templates/control-flow)
- [Structural directives](https://angular.dev/guide/directives/structural-directives)
- [Pipes](https://angular.dev/guide/templates/pipes)
