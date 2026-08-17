# What Is a Template in Angular?

## 1. What problem does it solve?

A component needs a declarative description of its UI. Building elements with document APIs would mix rendering mechanics with application behaviour, make server rendering difficult, and prevent Angular from type-checking bindings. A template expresses what the view should look like for the current state.

---

## 2. Explain it in simple language

A template is HTML enhanced with Angular syntax for values, properties, events, control flow, pipes, child components, and projected content. The class supplies state and actions; the template turns them into a user-visible view.

### Memory rule

> **The class owns state; the template describes the screen for that state.**

---

## 3. How does it work internally?

1. Angular parses the template during compilation and checks names and types against the component.
2. It converts elements, bindings, listeners, child components, and control-flow blocks into efficient view instructions.
3. When the component is instantiated, Angular creates the host view and executes creation instructions once.
4. During later synchronization, update instructions reevaluate bindings and change only what differs.
5. Embedded views are created and destroyed by control flow such as @if and @for; ng-template defines a fragment that is not rendered by itself.

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

The discriminated page state is more important than the syntax of @switch. It makes impossible combinations unrepresentable: the page cannot be both loading and ready unless you deliberately model a refresh state containing old data. This simplifies the template and gives the support team a predictable screen for 403, 404, 409, and transient failures.

### Incorrect versus improved approach

```typescript
<!-- Avoid contradictory booleans -->
@if (loading()) { <app-spinner /> }
@if (error()) { <app-error /> }
@if (payment()) { <app-payment /> }

<!-- Prefer one explicit state -->
@switch (state().kind) { /* exactly one branch */ }
```

---

## 4. Realistic payment or banking example

A payment page template must deliberately model loading, forbidden, missing, ready, submitting, success, and conflict states. If these states are hidden behind several unrelated booleans, the screen can show a spinner and an error simultaneously. A discriminated view model keeps the template predictable.

---

## 5. Successful flow and failure flow

### Successful flow

1. Router activates the payment page.
2. Facade exposes `{kind: ready, payment}`.
3. The `@switch` template selects the ready branch.
4. Child components receive typed values and render the form and summary.
5. Submission changes state to submitting and the template disables the action.

### Failure flow

1. The API returns 409 Conflict because another approver acted first.
2. Facade maps the HTTP error to `{kind: conflict, latestPayment}`.
3. Template replaces the form action with a clear conflict message.
4. User can reload the authoritative state rather than seeing a generic failure.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
type PaymentPageState =
  | { kind: 'loading' }
  | { kind: 'ready'; payment: PaymentVm }
  | { kind: 'forbidden' }
  | { kind: 'conflict'; message: string };

@Component({
  selector: 'app-payment-page',
  imports: [PaymentFormComponent, PaymentSummaryComponent],
  template: `
    @switch (state().kind) {
      @case ('loading') { <app-spinner /> }
      @case ('ready') {
        <app-payment-summary [payment]="readyPayment()" />
        <app-payment-form (submitted)="submit($event)" />
      }
      @case ('forbidden') { <p>You cannot access this payment.</p> }
      @case ('conflict') { <p role="alert">{{ conflictMessage() }}</p> }
    }
  `
})
export class PaymentPageComponent { /* facade-backed signals */ }
```

### ASP.NET Core boundary

```csharp
[Authorize]
[HttpGet("{id:guid}")]
public async Task<IActionResult> Get(Guid id, CancellationToken ct)
{
    var result = await paymentQueries.GetForUserAsync(id, User, ct);
    return result switch
    {
        PaymentFound value => Ok(value),
        PaymentForbidden => Forbid(),
        _ => NotFound()
    };
}
```

The Angular code owns presentation and user intent. The .NET API owns authentication, authorization, concurrency, idempotency, validation, transactions, and audit history.

### How to test this practically

Create a fixture for every state in the union and assert the accessible output. Verify that ready state renders child components, forbidden state does not reveal payment details, conflict state provides a recovery action, and loading state contains a meaningful accessible label. Also test that one cold HTTP request is not started multiple times by repeated template subscriptions.

---

## 7. Important design decisions

- Model mutually exclusive page states explicitly.
- Keep expressions short; prepare complex view models in TypeScript.
- Extract cohesive repeated markup into components, not arbitrary fragments.
- Use accessible semantic HTML before adding custom behaviour.
- Avoid direct DOM manipulation unless integrating a browser-only library.

When reviewing the design, explicitly ask who owns the value, who may change it, how long it should live, what happens after refresh or navigation, and which rule must remain on the API.

---

## 8. When to use and when not to use it

### Use it when

- Rendering component state, composition, forms, control flow, and user events.
- Making all important states visible and testable.

### Avoid or reconsider it when

- Business rules, API orchestration, large data transformation, or side effects.
- Copying the same large template block across multiple screens.

---

## 9. Compare it with related concepts

| Concept | Purpose or direction | Example |
|---|---|---|
| Component template | The view owned by one component | Normal UI |
| `ng-template` | Unrendered reusable fragment | Conditional/dynamic view |
| `ng-container` | Grouping without an element | Apply control flow without extra DOM |
| Content projection | Caller-provided content | Reusable card/dialog shell |

---

## 10. Common production mistakes

- Nested conditions that obscure valid states.
- Calling service methods directly from template expressions.
- Using div click handlers instead of accessible buttons.
- Repeating async pipe subscriptions to the same cold HTTP stream.
- Large inline templates that hide component boundaries.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

A payment template has nine nested `@if` blocks, three `async` pipe uses for the same HTTP observable, and method calls inside every transaction row. How would you simplify it and prove the result is faster and easier to test?

---

## Quick revision card

- **Definition:** A template is HTML enhanced with Angular syntax for values, properties, events, control flow, pipes, child components, and projected content. The class supplies state and actions; the template turns them into a user-visible view.
- **Memory rule:** The class owns state; the template describes the screen for that state.
- **Design check:** owner, direction, lifetime, failure path, and API authority.
- **Interview check:** explain the happy path, the failure path, and why the chosen boundary is testable.
