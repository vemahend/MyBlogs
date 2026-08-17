# How Do You Handle Dynamic Form Fields?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

Users may add multiple beneficiaries, split allocations, addresses, or payment lines at runtime. A fixed FormGroup cannot naturally model an ordered variable-length collection.

---

## 2. Explain it in simple language

Use a typed `FormArray` of FormControls or FormGroups. Create each row through one factory, add/remove controls through the FormArray API, and apply item-level plus collection-level validation.

### Memory rule

> **FormGroup names fields; FormArray repeats a structure.**

### Interview-ready answer

> Use a typed `FormArray` of FormControls or FormGroups. Create each row through one factory, add/remove controls through the FormArray API, and apply item-level plus collection-level validation. In production I also separate form-state concerns from the API contract, preserve user input on failure, and repeat every financial and security rule on the ASP.NET Core side.

---

## 3. How does it work internally?

1. FormArray owns an ordered list of child controls.
2. push/insert/removeAt changes the control tree and aggregate value/status.
3. Each child tracks value, errors, dirty, touched, and disabled state.
4. Array validators enforce collection rules such as count or total.
5. Template iterates `controls` with stable row identity.

### Practical interpretation

Separate UI-only row identity from backend identifiers. Removing a row by index is fine at the FormArray boundary, but render/state identity should remain stable. Use `getRawValue()` only deliberately because disabled controls are excluded from `value`.

### Incorrect versus improved approach

```typescript
this.form.value.allocations.push(newRow); // does not add Angular controls
// Use this.allocations.push(row()).
```

### Form mental model

1. Controls form a tree containing value, validation status, errors, and interaction flags.
2. A value change runs synchronous validation and then eligible asynchronous validation.
3. Status and value propagate to parent groups/arrays.
4. Submission captures a typed snapshot and maps it to a dedicated request DTO.
5. The API repeats authoritative validation, authorization, idempotency, and concurrency checks.

---

## 4. Realistic payment or banking example

A split-payment form contains allocation rows with accountId and amount. Each amount must be positive, recipient IDs unique, and the allocation total must equal the payment amount. The API repeats every rule atomically.

### Full-stack responsibility split

| Angular form | ASP.NET Core API |
|---|---|
| Immediate usability validation | Authoritative validation and invariants |
| Typed editing state and accessible errors | Secure request DTO and safe problem details |
| Local duplicate-click prevention | Idempotency and concurrency enforcement |
| Explicit form-to-command mapping | Server-derived fees, status, user, and permissions |
| Preserve values during recoverable failure | Atomic transaction and durable audit/outbox |

---

## 5. Successful flow and failure flow

### Successful flow

1. Row factory creates a consistent typed group.
2. User adds/removes rows.
3. Item and array validators recalculate.
4. Mapper creates a clean immutable command.
5. API validates total and recipients in one transaction.

### Failure flow

1. Template mutates `form.value` array directly.
2. Controls and values become misaligned.
3. Index-based UI state moves after deletion.
4. Disabled values disappear unexpectedly.
5. Use FormArray methods and stable row IDs.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
type AllocationForm=FormGroup<{
 rowId:FormControl<string>; accountId:FormControl<string>; amount:FormControl<number>
}>;
const row=():AllocationForm=>new FormGroup({
 rowId:new FormControl(crypto.randomUUID(),{nonNullable:true}),
 accountId:new FormControl('',{nonNullable:true,validators:[Validators.required]}),
 amount:new FormControl(0,{nonNullable:true,validators:[Validators.min(0.01)]})
});
allocations=new FormArray<AllocationForm>([row()],{validators:[allocationTotalValidator]});
add(){this.allocations.push(row())} remove(i:number){this.allocations.removeAt(i)}
```

### ASP.NET Core boundary

```csharp
public sealed record AllocationRequest(Guid AccountId,decimal Amount);
public sealed record SplitPaymentRequest(decimal Total,IReadOnlyList<AllocationRequest> Allocations);
// Validate uniqueness and Sum(Amount)==Total server-side.
```

### How to test it

Add, insert, remove, reorder, disable, reset, and submit rows. Test duplicate recipients, min/max count, decimal total, row error display, stable DOM identity, and backend atomic rejection.

### Production verification

- Test keyboard-only use, screen-reader labels, error focus, and pending feedback.
- Exercise boundary decimals, locale formats, nulls, malformed values, and dynamic rows.
- Submit rapidly, lose the response, retry, navigate away, and return.
- Test 400 validation, 401, 403, 409, timeout, and server failure without losing input.
- Verify no display-only, permission, status, fee, or identity field can be overposted.
- Confirm the server rejects a request even when client validators are bypassed.

---

## 7. Important design decisions

- Central row factory.
- Typed controls.
- Stable UI identity.
- Array-level invariants.
- Explicit disabled-value policy.

A technical-lead answer should explain form ownership, value/null/disabled semantics, validation timing, mapping, failure recovery, accessibility, and backend authority—not merely name FormControl APIs.

---

## 8. When to use and when not to use it

### Use it when

- Ordered repeatable fields and runtime add/remove behavior.

### Avoid or reconsider it when

- Unknown keyed dictionaries better modeled by FormRecord or simple fixed fields.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| FormArray | Ordered variable controls |
| FormGroup | Known named controls |
| FormRecord | Dynamic string-keyed controls |
| Metadata form | Schema-driven field generation |

---

## 10. Common production mistakes

- Mutating value directly.
- Using index as identity.
- Forgetting aggregate validators.
- Duplicated row creation.
- Trusting client totals.

> **Client validation guides the user; server validation protects the system.**

---

## 11. Scenario-based interview question

A split-payment form shows errors on the wrong row after deletion and submits a total different from the visible values. Diagnose identity and disabled-control issues.

---

## Quick revision card

- **Core answer:** Use a typed `FormArray` of FormControls or FormGroups. Create each row through one factory, add/remove controls through the FormArray API, and apply item-level plus collection-level validation.
- **Memory rule:** FormGroup names fields; FormArray repeats a structure.
- **Design checks:** typing, null/disabled values, validation timing, DTO mapping, failure preservation, and API authority.
- **Production checks:** accessibility, rapid submit, timeout/retry, overposting, and concurrent change.

## Official Angular references

- [Forms overview](https://angular.dev/guide/forms)
- [Reactive forms](https://angular.dev/guide/forms/reactive-forms)
- [Strictly typed reactive forms](https://angular.dev/guide/forms/typed-forms)
- [Form validation](https://angular.dev/guide/forms/form-validation)
- [Building dynamic forms](https://angular.dev/guide/forms/dynamic-forms)
