# When Would You Create a Custom Pipe?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

The same presentation transformation appears across templates and must remain consistent, readable, localized, and testable. Inline ternaries or component formatting methods duplicate logic and run unpredictably.

---

## 2. Explain it in simple language

Create a custom pipe for a small reusable display transformation that maps the same inputs to the same output. Prefer a pure pipe. Use a mapper, computed signal, or service when the work is heavy, stateful, asynchronous, or part of business logic.

### Memory rule

> **Pipe for display; function for logic; API for truth.**

### Interview-ready answer

> Create a custom pipe for a small reusable display transformation that maps the same inputs to the same output. Prefer a pure pipe. Use a mapper, computed signal, or service when the work is heavy, stateful, asynchronous, or part of business logic. In production I would also explain who owns the state, how the view behaves during change and destruction, and which validation or authorization must remain authoritative in ASP.NET Core.

---

## 3. How does it work internally?

1. Template passes the source and arguments to transform.
2. A pure pipe caches based on primitive values/reference identity at the binding level.
3. It returns a display value without mutating input.
4. Reference changes cause reevaluation.
5. Angular renders the result and retains ownership of view updates.

### Practical interpretation

Ask whether the transformation is truly presentation. Status display is; deciding a status transition is not. For localization, use message infrastructure rather than embedding one language everywhere. For large collections, prepare view models once instead of stacking heavy pipes per row.

### Incorrect versus improved approach

```typescript
transform(payment:PaymentDto){
 this.audit.log(payment); return this.http.get('/api/status/'+payment.id);
}
// Side effects and HTTP do not belong in a pipe.
```

### Runtime mental model

1. Angular compiles the template and identifies directives, pipes, bindings, and embedded views.
2. Runtime values are evaluated during view synchronization.
3. Angular updates the host node or reconciles embedded views using the declared identity and state.
4. Child components, subscriptions, and DOM resources follow the lifetime of the view that owns them.
5. Browser behavior remains a user-experience layer; backend policies protect money and data.

---

## 4. Realistic payment or banking example

A `paymentStatus` pipe maps stable API status codes to localized display labels/icons. It must not determine whether the payment is legally settled or approvable; those facts come from backend state and policies.

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

1. API returns a stable status code.
2. Pipe maps known values to display text.
3. Unknown values fall back safely and telemetry detects contract drift elsewhere.
4. Templates remain readable.
5. One test table covers every status.

### Failure flow

1. Pipe calls Date.now, user service, and HTTP API.
2. Same input returns different output and triggers side effects.
3. Many rows produce request storms.
4. An unknown backend status renders blank.
5. Make contract mapping explicit and handle evolution at the boundary.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
@Pipe({name:'paymentStatus',standalone:true,pure:true})
export class PaymentStatusPipe implements PipeTransform {
 transform(value:PaymentStatus):string {
   switch(value){
    case 'Pending': return 'Pending review';
    case 'Settled': return 'Settled';
    case 'Rejected': return 'Rejected';
    default: return 'Unknown status';
   }
 }
}

<span>{{ payment.status | paymentStatus }}</span>
```

### ASP.NET Core boundary

```csharp
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PaymentStatus { Pending, Settled, Rejected }

public sealed record PaymentDto(Guid Id,PaymentStatus Status);
```

### How to test it

Directly instantiate and table-test every input, null/unknown policy, locale, and immutability. Add API contract tests for new enum values and a component smoke test for wiring.

### Production verification

- Exercise refresh, rapid interaction, delayed API responses, and navigation away.
- Verify keyboard, focus, labels, disabled state, and screen-reader semantics.
- Profile a realistic list rather than a ten-row demo.
- Test 401, 403, 404, 409, validation failure, and transient server failure.
- Confirm the browser never receives secrets merely hidden by a directive or pipe.
- Confirm logs use correlation IDs and avoid account, card, and payment credentials.

---

## 7. Important design decisions

- Pure and deterministic by default.
- Explicit unknown/null fallback.
- No input mutation or side effects.
- Plan localization and contract evolution.
- Move expensive derivation to view-model/state boundary.

A senior answer should state the rejected alternative and its failure mode. Naming an Angular API is not enough; explain identity, ownership, lifetime, performance, accessibility, and server authority.

---

## 8. When to use and when not to use it

### Use it when

- Repeated lightweight formatting or display mapping.

### Avoid or reconsider it when

- HTTP, authorization, financial calculations, workflow decisions, or expensive list operations.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Custom pipe | Reusable template display mapping |
| Built-in pipe | Framework formatting |
| Mapper | DTO-to-VM boundary conversion |
| Computed signal | Cached reactive derivation |

---

## 10. Common production mistakes

- Business logic in pipe.
- Unknown enum renders blank.
- Ignoring localization.
- Impure patch for mutation.
- Stacking expensive pipes in large tables.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

The backend adds `PartiallySettled`, but the status pipe renders an empty label. How would you design safe fallback, contract testing, localization, and deployment compatibility?

---

## Quick revision card

- **Core answer:** Create a custom pipe for a small reusable display transformation that maps the same inputs to the same output. Prefer a pure pipe. Use a mapper, computed signal, or service when the work is heavy, stateful, asynchronous, or part of business logic.
- **Memory rule:** Pipe for display; function for logic; API for truth.
- **Senior checks:** identity, ownership, lifetime, accessibility, performance, and backend authority.
- **Failure checks:** mutation, stale view, duplicate action, unauthorized API call, and contract drift.

## Official Angular references

- [Control flow](https://angular.dev/guide/templates/control-flow)
- [Structural directives](https://angular.dev/guide/directives/structural-directives)
- [Pipes](https://angular.dev/guide/templates/pipes)
