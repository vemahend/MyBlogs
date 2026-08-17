# AngularJS vs Modern Angular

## 1. What problem does it solve?

Interviewers ask this to verify that you understand Angular is a rewritten platform, not simply a newer AngularJS package. The distinction affects architecture, rendering, dependency injection, language, build tooling, performance, and migration strategy.

---

## 2. Explain it in simple language

AngularJS is the 1.x JavaScript framework based on controllers, scopes, directives, and digest watchers. Modern Angular is TypeScript-first and component-based, with compiled templates, hierarchical DI, RxJS/signals, routing, and modern build tooling.

### Memory rule

> **AngularJS watches scopes; modern Angular builds component views and explicit reactive dependencies.**

---

## 3. How does it work internally?

1. AngularJS attaches values to scopes and repeatedly runs watchers during a digest cycle.
2. Modern Angular compiles templates and constructs a tree of component views.
3. Dependencies are resolved through hierarchical injectors rather than ad-hoc scope/controller access.
4. Modern tooling performs template type checking, code splitting, optimization, and server rendering support.
5. The frameworks have different packages and architecture; migration is a redesign, not an npm version bump.

```text
Component state or user action
            ↓
Angular binding/template/compiler mechanism
            ↓
Typed component or service contract
            ↓
Affected view is synchronized
            ↓
Server remains authoritative for protected operations
```

### Practical interpretation

A safe migration treats AngularJS as a legacy product with undocumented behaviour, not merely old syntax. Characterization tests record current outcomes before code moves. A stable API boundary prevents the new UI from depending on AngularJS scope details. Route-by-route release allows both business verification and rollback while keeping the retirement plan visible.

### Incorrect versus improved approach

```typescript
// Risky plan
// 1. Freeze all feature work
// 2. Rewrite 200 screens
// 3. Release everything together

// Safer plan
// Characterize → isolate API/auth seam → migrate one route → compare → retire
```

---

## 4. Realistic payment or banking example

A legacy bank portal has AngularJS controllers calling REST endpoints and sharing mutable **$rootScope** state. A safe migration creates an API-compatible shell, adds characterization tests, replaces one route at a time with modern Angular, and removes cross-framework state seams gradually.

---

## 5. Successful flow and failure flow

### Successful flow

1. Document current behaviour and critical payment journeys.
2. Stabilize backend contracts and authentication.
3. Create a modern Angular shell and design system.
4. Migrate a low-risk route behind a feature flag.
5. Monitor, compare, and gradually retire AngularJS code.

### Failure flow

1. Team starts a big-bang rewrite.
2. Hidden business rules in controllers are missed.
3. Release takes too long and both products drift.
4. Authentication and shared state behave differently.
5. Use incremental strangler migration and characterization tests instead.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
// Modern Angular standalone route
export const routes: Routes = [{
  path: 'payments/:id',
  loadComponent: () => import('./payment.page')
    .then(m => m.PaymentPageComponent)
}];

@Component({
  selector: 'app-payment-page',
  imports: [PaymentSummaryComponent],
  template: `<app-payment-summary [payment]="payment()" />`
})
export class PaymentPageComponent {
  readonly payment = input.required<PaymentVm>();
}
```

### ASP.NET Core boundary

```csharp
// Keep a stable API contract while replacing the frontend route.
[ApiController]
[Route("api/v1/payments")]
public sealed class PaymentsController : ControllerBase
{
    [HttpGet("{id:guid}")]
    public Task<PaymentDto> Get(Guid id, CancellationToken ct)
        => queries.GetAsync(id, User, ct);
}
```

The Angular code owns presentation and user intent. The .NET API owns authentication, authorization, concurrency, idempotency, validation, transactions, and audit history.

### How to test this practically

For each migrated route, run the same contract and critical journey tests against old and new implementations. Compare authorization, money formatting, browser refresh, deep links, accessibility, error mapping, and telemetry. Feature flags should support controlled rollout and rollback, but must not become permanent duplicate systems without an AngularJS retirement milestone.

---

## 7. Important design decisions

- Characterize behaviour before rewriting.
- Create stable API and authentication seams.
- Migrate by business route, not random files.
- Avoid shared mutable state across old and new frameworks.
- Measure bundle, performance, accessibility, and production errors per migrated slice.

When reviewing the design, explicitly ask who owns the value, who may change it, how long it should live, what happens after refresh or navigation, and which rule must remain on the API.

---

## 8. When to use and when not to use it

### Use it when

- Discussing legacy maintenance, modernization, or migration planning.

### Avoid or reconsider it when

- Calling modern Angular AngularJS.
- Assuming old directives/controllers have direct modern equivalents.

---

## 9. Compare it with related concepts

| Concept | Purpose or direction | Example |
|---|---|---|
| Architecture | AngularJS scope/controller | Angular component/service |
| Language | JavaScript-first | TypeScript-first |
| Rendering | Digest watchers | Compiled views/reactive updates |
| DI | Module/service system | Hierarchical injectors |
| Migration | Legacy platform | Incremental replacement |

---

## 10. Common production mistakes

- Big-bang rewrite without tests.
- Recreating **$rootScope** as a global subject.
- Migrating syntax without redesigning ownership.
- Underestimating authentication and routing seams.
- Running both frameworks indefinitely without retirement plan.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

A bank has 200 AngularJS screens and wants modern Angular completed in six months. How would you choose migration boundaries, keep releases safe, and prevent duplicated business rules?

---

## Quick revision card

- **Definition:** AngularJS is the 1.x JavaScript framework based on controllers, scopes, directives, and digest watchers. Modern Angular is TypeScript-first and component-based, with compiled templates, hierarchical DI, RxJS/signals, routing, and modern build tooling.
- **Memory rule:** AngularJS watches scopes; modern Angular builds component views and explicit reactive dependencies.
- **Design check:** owner, direction, lifetime, failure path, and API authority.
- **Interview check:** explain the happy path, the failure path, and why the chosen boundary is testable.
