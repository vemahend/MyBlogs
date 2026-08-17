# What Is Property Binding in Angular?

## 1. What problem does it solve?

HTML attributes initialize markup, but applications need to set live DOM and child-component properties using typed values. Property binding connects component expressions to those targets without converting everything to text.

---

## 2. Explain it in simple language

Property binding uses square brackets: **[property]="expression"**. Angular evaluates the expression and assigns its actual value—boolean, number, object, or function—to the target property.

### Memory rule

> **Square brackets are an inbox: a typed value goes into the target.**

---

## 3. How does it work internally?

1. Compiler resolves whether the target belongs to the DOM element, directive, or component input.
2. Angular evaluates the expression when the view synchronizes.
3. The result is compared with the prior result.
4. A changed value is assigned to the property.
5. For child inputs, the new value becomes part of the child input lifecycle.

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

Property binding preserves the real type. This is why **[disabled]="false"** enables a button while the literal attribute **disabled="false"** still disables it: boolean HTML attributes are true by presence. The same distinction matters when passing objects and booleans into child inputs. Always reason about the target property, not merely the text written in HTML.

### Incorrect versus improved approach

```typescript
<!-- Literal boolean attribute is present, so the element is disabled -->
<button disabled="false">Pay</button>

<!-- Angular assigns the boolean false to the property -->
<button [disabled]="false">Pay</button>
```

---

## 4. Realistic payment or banking example

A payment form binds a true boolean to disabled and passes an immutable PaymentVm object to a summary component. The button state improves UX, but the API still checks permission and current payment state.

---

## 5. Successful flow and failure flow

### Successful flow

1. Form becomes valid and no request is running.
2. `[disabled]` receives false as a boolean.
3. User submits and saving becomes true.
4. Angular assigns true to the DOM disabled property.
5. API processes one authorized request.

### Failure flow

1. Developer writes **disabled="false"**.
2. The attribute exists, so the browser treats the button as disabled.
3. Or the developer binds an object that is mutated without a new ownership update.
4. The view becomes confusing or stale.
5. Correct typed property binding and immutable state restore predictability.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
<button
  type="submit"
  [disabled]="form.invalid || saving()"
  [attr.aria-busy]="saving()">
  Submit payment
</button>

<app-payment-summary [payment]="paymentVm()" />
```

### ASP.NET Core boundary

```csharp
[Authorize(Policy="CanCreatePayments")]
[HttpPost]
public async Task<IActionResult> Create(CreatePaymentRequest request, CancellationToken ct)
{
    var result = await paymentService.CreateAsync(request, User, ct);
    return result.ToActionResult();
}
// The API repeats validation even when the Angular button is disabled.
```

The Angular code owns presentation and user intent. The .NET API owns authentication, authorization, concurrency, idempotency, validation, transactions, and audit history.

### How to test this practically

Render the component with valid/invalid and saving/not-saving combinations and inspect the actual disabled property. For a child input, use a host component and replace the input reference to verify the child receives the new view model. Add an accessibility assertion for aria-busy because ARIA uses attribute binding rather than a normal DOM boolean property.

---

## 7. Important design decisions

- Choose property binding when the target has a property and type matters.
- Use attribute binding for ARIA or attributes without a property equivalent.
- Pass immutable view models to reusable children.
- Avoid binding untrusted HTML.
- Keep permission and state checks on the API.

When reviewing the design, explicitly ask who owns the value, who may change it, how long it should live, what happens after refresh or navigation, and which rule must remain on the API.

---

## 8. When to use and when not to use it

### Use it when

- Disabled, checked, value, class/style properties, image source, directive inputs, and component inputs.

### Avoid or reconsider it when

- Listening to events.
- String-only display where interpolation is clearer.
- Authoritative security enforcement.

---

## 9. Compare it with related concepts

| Concept | Purpose or direction | Example |
|---|---|---|
| Property binding | Live typed property | `[disabled]` |
| Attribute binding | Markup attribute | `[attr.aria-label]` |
| Interpolation | Text/string context | `{{status}}` |
| Event binding | Listener | `(click)` |

---

## 10. Common production mistakes

- Using **disabled="false"**.
- Confusing colspan attribute with DOM property.
- Mutating bound object inputs.
- Binding unsafe innerHTML.
- Assuming property binding enforces server permission.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

A payment button remains disabled even when `canSubmit` is true, and another child fails to update after a nested object is mutated. Diagnose both binding problems.

---

## Quick revision card

- **Definition:** Property binding uses square brackets: **[property]="expression"**. Angular evaluates the expression and assigns its actual value—boolean, number, object, or function—to the target property.
- **Memory rule:** Square brackets are an inbox: a typed value goes into the target.
- **Design check:** owner, direction, lifetime, failure path, and API authority.
- **Interview check:** explain the happy path, the failure path, and why the chosen boundary is testable.
