# What Is Data Binding in Angular?

## 1. What problem does it solve?

The component class and DOM need a controlled way to exchange values and user actions. Manual synchronization creates stale screens, duplicated listeners, and unclear ownership. Data binding defines the direction and target of that communication.

---

## 2. Explain it in simple language

Data binding connects component state with the template. Text and property bindings move values to the view; event bindings move user actions to the component; two-way binding pairs both directions for an editable value.

### Memory rule

> **Square brackets go in, parentheses come out, curly braces display.**

---

## 3. How does it work internally?

1. The compiler records each binding and verifies its target.
2. Text interpolation writes a string to a text node.
3. Property binding assigns the real value type to a DOM, directive, or child-component property.
4. Event binding registers a listener and invokes a component statement with the event payload.
5. Two-way binding is a property input plus a corresponding change output, not unrestricted shared state.

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

The important design decision is not which brackets to type; it is deciding who owns the value. In the example, the parent owns PaymentVm. The child may request approval but cannot declare that approval succeeded. Only the API response can establish the new business status, after which the parent replaces its state and the child rerenders.

### Incorrect versus improved approach

```typescript
// Avoid mutating an input owned by the parent
this.payment().status = 'approved';

// Prefer emitting intent
this.approveRequested.emit(this.payment().id);
```

---

## 4. Realistic payment or banking example

A transfer container sends a PaymentVm into a summary child, binds the saving state to the Approve button, listens for approveRequested, and updates the page only after the API response. The direction makes ownership clear.

---

## 5. Successful flow and failure flow

### Successful flow

1. Parent owns the payment state.
2. Property binding passes an immutable view model to the child.
3. User clicks Approve and child emits a semantic output.
4. Parent calls the facade with an idempotency key.
5. New server state replaces the parent value and flows down again.

### Failure flow

1. Child mutates the input status optimistically.
2. API rejects the approval due to concurrency.
3. Parent still holds the old value while child shows Approved.
4. The UI contains two sources of truth.
5. Fix: child emits intent; parent/facade owns state and maps API result.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
<app-payment-summary
  [payment]="payment()"
  [submitting]="submitting()"
  (approveRequested)="approve($event)" />

<p>Total: {{ payment().amount | currency:'NZD' }}</p>
<button [disabled]="submitting()" (click)="cancel()">Cancel</button>
```

### ASP.NET Core boundary

```csharp
public sealed record ApprovePaymentRequest(string IdempotencyKey);

[Authorize(Policy = "CanApprovePayments")]
[HttpPost("{id:guid}/approve")]
public async Task<IActionResult> Approve(Guid id, ApprovePaymentRequest request, CancellationToken ct)
{
    var result = await approvalService.ApproveAsync(id, request.IdempotencyKey, User, ct);
    return result.ToActionResult();
}
```

The Angular code owns presentation and user intent. The .NET API owns authentication, authorization, concurrency, idempotency, validation, transactions, and audit history.

### How to test this practically

Use a small host component to bind a payment into the child and listen to its output. Assert that a changed parent value updates the child, a user action emits exactly one immutable ID, and the input object is not mutated. Include a test where the API rejects approval and verify the UI returns to the authoritative server state.

---

## 7. Important design decisions

- Identify the source of truth before choosing syntax.
- Prefer one-way data flow with semantic outputs.
- Bind properties when type matters.
- Keep output payloads small and immutable.
- Never treat disabled controls or hidden elements as authorization.

When reviewing the design, explicitly ask who owns the value, who may change it, how long it should live, what happens after refresh or navigation, and which rule must remain on the API.

---

## 8. When to use and when not to use it

### Use it when

- Connecting state, attributes/properties, CSS, child inputs, and user events.

### Avoid or reconsider it when

- Using two-way binding to hide unclear ownership.
- Binding raw backend DTOs across many screens without mapping.

---

## 9. Compare it with related concepts

| Concept | Purpose or direction | Example |
|---|---|---|
| Interpolation | Display text | One-way to view |
| Property binding | Set typed property/input | One-way to view |
| Event binding | Handle action/output | One-way to class |
| Two-way binding | Value plus change event | Both directions |

---

## 10. Common production mistakes

- Confusing HTML attributes with DOM properties.
- Mutating input objects.
- Using two-way binding on shared domain objects.
- Expensive getters in many bindings.
- Assuming binding is a security boundary.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

A reusable payment child receives a mutable PaymentDto and directly changes its status. The parent also refreshes the DTO from an API. Explain the race and redesign the bindings.

---

## Quick revision card

- **Definition:** Data binding connects component state with the template. Text and property bindings move values to the view; event bindings move user actions to the component; two-way binding pairs both directions for an editable value.
- **Memory rule:** Square brackets go in, parentheses come out, curly braces display.
- **Design check:** owner, direction, lifetime, failure path, and API authority.
- **Interview check:** explain the happy path, the failure path, and why the chosen boundary is testable.
