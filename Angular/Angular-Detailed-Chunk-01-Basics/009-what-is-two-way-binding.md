# What Is Two-Way Binding in Angular?

## 1. What problem does it solve?

Editable controls sometimes need the component value to populate the UI and user changes to update the component. Two-way binding combines those directions concisely, but overuse can hide state ownership and mutation.

---

## 2. Explain it in simple language

Two-way binding uses banana-in-a-box syntax: **[(...)]**. It is equivalent to a property/input binding plus a matching change event. For **ngModel**, Angular writes the value into the control and assigns emitted changes back to the component.

### Memory rule

> **Banana-in-a-box means value goes in and changes come out.**

---

## 3. How does it work internally?

1. Angular binds the current component value to the directive/component input.
2. The directive listens to the native control and emits a change value.
3. The paired output updates the component expression.
4. The new component value flows back during view synchronization.
5. Custom controls expose a model/value-change contract or implement ControlValueAccessor for Angular forms.

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

Two-way binding is concise when the same component clearly owns the editable value. It becomes dangerous when the bound reference is shared. A payment edit screen should clone or map the server view into a draft/form model, let the user edit the draft, and issue an explicit command only after validation. Cancel simply discards the draft.

### Incorrect versus improved approach

```typescript
// Avoid editing a shared cached object
selectedPayment = paymentCache.current;

// Prefer an isolated draft/form value
draft = structuredClone(toEditableDraft(paymentCache.current));
// submit maps draft to a command; cancel discards draft
```

---

## 4. Realistic payment or banking example

Two-way binding is reasonable for a small local nickname preference. A transfer form with cross-field validation, async beneficiary checks, dynamic recipients, server errors, and submission state should use a typed reactive form because the form model and status are explicit.

---

## 5. Successful flow and failure flow

### Successful flow

1. Component initializes a local display preference.
2. ngModel writes it to the input.
3. User edits the value.
4. ngModelChange updates the component property.
5. The latest value is saved deliberately.

### Failure flow

1. A screen binds directly to a PaymentDto.
2. Typing mutates the same object used by summary and cache.
3. Cancel cannot restore the original value reliably.
4. Another component observes partially edited state.
5. Use a separate form/draft model and explicit submit/cancel commands.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
// Appropriate small local value
<input [(ngModel)]="nickname" name="nickname" />

// Equivalent expanded form
<input
  [ngModel]="nickname"
  (ngModelChange)="nickname = $event"
  name="nickname" />

// Complex payment workflow: prefer reactive form
readonly form = this.fb.nonNullable.group({
  beneficiaryId: ['', Validators.required],
  amount: [0, [Validators.required, Validators.min(0.01)]]
});
```

### ASP.NET Core boundary

```csharp
public sealed record UpdatePreferenceRequest(string PaymentNickname);

[HttpPut("preferences/payment-nickname")]
public async Task<IActionResult> Update(UpdatePreferenceRequest request, CancellationToken ct)
{
    await preferences.UpdateAsync(User, request.PaymentNickname.Trim(), ct);
    return NoContent();
}
```

The Angular code owns presentation and user intent. The .NET API owns authentication, authorization, concurrency, idempotency, validation, transactions, and audit history.

### How to test this practically

Verify the initial value flows into the input and a user edit updates the local owner. For a complex form, test that editing does not mutate the original PaymentVm, cancel restores the unchanged view, submit maps only allowed fields, and server rejection preserves the draft. Test custom controls through their ControlValueAccessor contract.

---

## 7. Important design decisions

- Use only when both directions belong to the same local owner.
- Do not bind editable UI directly to cached/API domain objects.
- Prefer reactive forms for complex workflows.
- Make save/cancel boundaries explicit.
- Do not mix ngModel and reactive directives on the same control.

When reviewing the design, explicitly ask who owns the value, who may change it, how long it should live, what happens after refresh or navigation, and which rule must remain on the API.

---

## 8. When to use and when not to use it

### Use it when

- Small local controls and well-designed custom fields.

### Avoid or reconsider it when

- Shared application state, complex forms, auditable financial commands, or hidden mutation.

---

## 9. Compare it with related concepts

| Concept | Purpose or direction | Example |
|---|---|---|
| Property binding | Value into target | Explicit one-way |
| Event binding | Change out of target | Explicit one-way |
| Two-way binding | Both paired | Convenient local editing |
| Reactive form | Explicit form model/status | Complex workflow |

---

## 10. Common production mistakes

- Directly mutating DTO/domain object.
- Using two-way binding as global state management.
- Mixing template-driven and reactive forms.
- No save/cancel draft boundary.
- Assuming frontend binding validates server command.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

A payment-edit screen uses two-way binding directly against an object stored in a shared service. Cancel still changes values elsewhere. Explain the reference-mutation problem and redesign the edit workflow.

---

## Quick revision card

- **Definition:** Two-way binding uses banana-in-a-box syntax: **[(...)]**. It is equivalent to a property/input binding plus a matching change event. For **ngModel**, Angular writes the value into the control and assigns emitted changes back to the component.
- **Memory rule:** Banana-in-a-box means value goes in and changes come out.
- **Design check:** owner, direction, lifetime, failure path, and API authority.
- **Interview check:** explain the happy path, the failure path, and why the chosen boundary is testable.
