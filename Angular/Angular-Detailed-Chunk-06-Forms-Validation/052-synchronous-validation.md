# How Do You Add Synchronous Validation?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

Users need immediate feedback for required fields, format, ranges, and cross-field consistency before paying the cost of remote calls or submission.

---

## 2. Explain it in simple language

Attach built-in or custom `ValidatorFn` functions to controls/groups. A validator returns `null` when valid or a keyed error object when invalid; it must be deterministic, fast, and side-effect-free.

### Memory rule

> **A validator reports an error; it does not repair the value.**

### Interview-ready answer

> Attach built-in or custom `ValidatorFn` functions to controls/groups. A validator returns `null` when valid or a keyed error object when invalid; it must be deterministic, fast, and side-effect-free. In production I also separate form-state concerns from the API contract, preserve user input on failure, and repeat every financial and security rule on the ASP.NET Core side.

---

## 3. How does it work internally?

1. Control value changes.
2. Angular calls composed synchronous validators.
3. Error maps are merged onto the control.
4. Status becomes VALID or INVALID and propagates to ancestors.
5. Only when sync validation passes may async validation start.

### Practical interpretation

Use control validators for one value and group validators for relationships. Error keys are part of your UI contract, so make them specific and include safe metadata such as min/max. Client and server may share generated schemas, but the server remains authoritative.

### Incorrect versus improved approach

```typescript
const validator:ValidatorFn=c=>{c.setValue(c.value.trim());return null;};
// Validators should not mutate controls. Normalize at an explicit boundary.
```

### Form mental model

1. Controls form a tree containing value, validation status, errors, and interaction flags.
2. A value change runs synchronous validation and then eligible asynchronous validation.
3. Status and value propagate to parent groups/arrays.
4. Submission captures a typed snapshot and maps it to a dedicated request DTO.
5. The API repeats authoritative validation, authorization, idempotency, and concurrency checks.

---

## 4. Realistic payment or banking example

Amount is required and positive; payment date cannot be in the past; source and destination accounts must differ. Currency precision and balance/limits are checked again by ASP.NET Core.

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

1. Typed form receives input.
2. Control validators report field errors.
3. Group validator reports cross-field conflict.
4. User corrects values and form becomes valid.
5. API repeats all authoritative rules.

### Failure flow

1. Validator mutates another control or calls a service with side effects.
2. Validation triggers more value changes.
3. Loops and unpredictable touched/errors occur.
4. Or frontend rule drifts from API.
5. Keep validators pure and share contracts, not authority.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
const differentAccounts:ValidatorFn=group=>
 group.get('fromId')?.value===group.get('toId')?.value
  ? {sameAccount:true}:null;

form=new FormGroup({
 fromId:new FormControl('',{nonNullable:true,validators:[Validators.required]}),
 toId:new FormControl('',{nonNullable:true,validators:[Validators.required]}),
 amount:new FormControl(0,{nonNullable:true,validators:[Validators.required,Validators.min(0.01)]})
},{validators:[differentAccounts]});
```

### ASP.NET Core boundary

```csharp
public sealed class CreateTransferValidator:AbstractValidator<CreateTransferRequest>
{
 public CreateTransferValidator(){
  RuleFor(x=>x.Amount).GreaterThan(0);
  RuleFor(x=>x.ToAccountId).NotEqual(x=>x.FromAccountId);
 }
}
```

### How to test it

Instantiate validators as pure functions and table-test boundaries, nulls, decimals, and cross-field cases. Form tests assert error placement/status. API tests repeat the same boundary cases independently.

### Production verification

- Test keyboard-only use, screen-reader labels, error focus, and pending feedback.
- Exercise boundary decimals, locale formats, nulls, malformed values, and dynamic rows.
- Submit rapidly, lose the response, retry, navigate away, and return.
- Test 400 validation, 401, 403, 409, timeout, and server failure without losing input.
- Verify no display-only, permission, status, fee, or identity field can be overposted.
- Confirm the server rejects a request even when client validators are bypassed.

---

## 7. Important design decisions

- Pure and fast validators.
- Correct control/group placement.
- Stable error keys.
- Explicit normalization.
- Backend duplication by design.

A technical-lead answer should explain form ownership, value/null/disabled semantics, validation timing, mapping, failure recovery, accessibility, and backend authority—not merely name FormControl APIs.

---

## 8. When to use and when not to use it

### Use it when

- Required, pattern, length, range, and deterministic cross-field rules.

### Avoid or reconsider it when

- HTTP, mutable side effects, database facts, or financial authorization.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Control validator | One field |
| Group validator | Cross-field relation |
| Async validator | Delayed external feedback |
| Domain validation | Authoritative business invariant |

---

## 10. Common production mistakes

- Mutating in validator.
- Floating-point money assumptions.
- Error placed on wrong control.
- No null handling.
- Client-only rule.

> **Client validation guides the user; server validation protects the system.**

---

## 11. Scenario-based interview question

A transfer form validator changes the amount value and causes repeated status changes. Redesign validation and normalization cleanly.

---

## Quick revision card

- **Core answer:** Attach built-in or custom `ValidatorFn` functions to controls/groups. A validator returns `null` when valid or a keyed error object when invalid; it must be deterministic, fast, and side-effect-free.
- **Memory rule:** A validator reports an error; it does not repair the value.
- **Design checks:** typing, null/disabled values, validation timing, DTO mapping, failure preservation, and API authority.
- **Production checks:** accessibility, rapid submit, timeout/retry, overposting, and concurrent change.

## Official Angular references

- [Forms overview](https://angular.dev/guide/forms)
- [Reactive forms](https://angular.dev/guide/forms/reactive-forms)
- [Strictly typed reactive forms](https://angular.dev/guide/forms/typed-forms)
- [Form validation](https://angular.dev/guide/forms/form-validation)
- [Building dynamic forms](https://angular.dev/guide/forms/dynamic-forms)
