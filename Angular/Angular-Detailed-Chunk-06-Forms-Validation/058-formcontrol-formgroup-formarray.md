# What Are FormControl, FormGroup, and FormArray?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

A form needs an object model that represents individual values, named structures, and repeated collections while aggregating validation and interaction state.

---

## 2. Explain it in simple language

FormControl represents one value; FormGroup represents a fixed set of named controls; FormArray represents an ordered variable-length list of controls. All derive from AbstractControl and expose value, status, errors, dirty, touched, and change streams.

### Memory rule

> **Control is a field; Group is an object; Array is a list.**

### Interview-ready answer

> FormControl represents one value; FormGroup represents a fixed set of named controls; FormArray represents an ordered variable-length list of controls. All derive from AbstractControl and expose value, status, errors, dirty, touched, and change streams. In production I also separate form-state concerns from the API contract, preserve user input on failure, and repeat every financial and security rule on the ASP.NET Core side.

---

## 3. How does it work internally?

1. Each control owns value, validators, errors, status, and interaction flags.
2. A FormGroup aggregates children by key.
3. A FormArray aggregates children by index/order.
4. Child changes recalculate ancestor value/status.
5. Disabled controls are excluded from normal aggregate value but included by getRawValue.

### Practical interpretation

Typed reactive forms are strictly typed by default. `nonNullable` affects both type and reset behavior. Use FormRecord for dynamic string keys. Structure the form for editing needs, then map it to the API contract rather than forcing exact DTO symmetry.

### Incorrect versus improved approach

```typescript
const form=new UntypedFormGroup({anything:new UntypedFormControl(null)});
// Prefer typed reactive controls for compile-time structure.
```

### Form mental model

1. Controls form a tree containing value, validation status, errors, and interaction flags.
2. A value change runs synchronous validation and then eligible asynchronous validation.
3. Status and value propagate to parent groups/arrays.
4. Submission captures a typed snapshot and maps it to a dedicated request DTO.
5. The API repeats authoritative validation, authorization, idempotency, and concurrency checks.

---

## 4. Realistic payment or banking example

A transfer form is a FormGroup. Amount and currency are FormControls. Split allocations are a FormArray of FormGroups. A group validator ensures source differs from destination; an array validator checks totals.

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

1. Model mirrors UI/domain input structure.
2. Types catch invalid property use.
3. Validators live at correct level.
4. Template binds controls explicitly.
5. Mapper creates a request DTO.

### Failure flow

1. Everything is one untyped FormGroup with `any`.
2. Dynamic controls are added by object mutation.
3. Disabled account ID disappears from `value`.
4. Runtime payload is incomplete.
5. Use typed structures and deliberate raw-value mapping.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
const form=new FormGroup({
 fromAccountId:new FormControl('',{nonNullable:true,validators:[Validators.required]}),
 amount:new FormControl(0,{nonNullable:true,validators:[Validators.min(0.01)]}),
 allocations:new FormArray<FormGroup<{
  accountId:FormControl<string>; amount:FormControl<number>
 }>>([])
});

const enabledValue=form.value;
const allValues=form.getRawValue();
```

### ASP.NET Core boundary

```csharp
public sealed record AllocationRequest(Guid AccountId,decimal Amount);
public sealed record TransferRequest(Guid FromAccountId,decimal Amount,IReadOnlyList<AllocationRequest> Allocations);
```

### How to test it

Set/patch/reset values, disable controls, assert status propagation, add/remove array rows, and verify mapper behavior for `value` versus `getRawValue()`.

### Production verification

- Test keyboard-only use, screen-reader labels, error focus, and pending feedback.
- Exercise boundary decimals, locale formats, nulls, malformed values, and dynamic rows.
- Submit rapidly, lose the response, retry, navigate away, and return.
- Test 400 validation, 401, 403, 409, timeout, and server failure without losing input.
- Verify no display-only, permission, status, fee, or identity field can be overposted.
- Confirm the server rejects a request even when client validators are bypassed.

---

## 7. Important design decisions

- Choose structure from UI editing model.
- Use typed/nonNullable deliberately.
- Put validators at lowest correct owner.
- Know disabled-value semantics.
- Map to DTO explicitly.

A technical-lead answer should explain form ownership, value/null/disabled semantics, validation timing, mapping, failure recovery, accessibility, and backend authority—not merely name FormControl APIs.

---

## 8. When to use and when not to use it

### Use it when

- Reactive form state at field, object, and repeated-list levels.

### Avoid or reconsider it when

- Using one giant flat group or FormArray for semantically named fixed fields.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| FormControl | Single value |
| FormGroup | Fixed named shape |
| FormArray | Ordered dynamic list |
| FormRecord | Dynamic keyed map |

---

## 10. Common production mistakes

- Untyped any.
- Wrong validation level.
- Direct child collection mutation.
- Disabled value surprise.
- Form equals API DTO assumption.

> **Client validation guides the user; server validation protects the system.**

---

## 11. Scenario-based interview question

A disabled source account appears onscreen but is missing from the submitted object. Explain Angular value semantics and the safe mapping choice.

---

## Quick revision card

- **Core answer:** FormControl represents one value; FormGroup represents a fixed set of named controls; FormArray represents an ordered variable-length list of controls. All derive from AbstractControl and expose value, status, errors, dirty, touched, and change streams.
- **Memory rule:** Control is a field; Group is an object; Array is a list.
- **Design checks:** typing, null/disabled values, validation timing, DTO mapping, failure preservation, and API authority.
- **Production checks:** accessibility, rapid submit, timeout/retry, overposting, and concurrent change.

## Official Angular references

- [Forms overview](https://angular.dev/guide/forms)
- [Reactive forms](https://angular.dev/guide/forms/reactive-forms)
- [Strictly typed reactive forms](https://angular.dev/guide/forms/typed-forms)
- [Form validation](https://angular.dev/guide/forms/form-validation)
- [Building dynamic forms](https://angular.dev/guide/forms/dynamic-forms)
