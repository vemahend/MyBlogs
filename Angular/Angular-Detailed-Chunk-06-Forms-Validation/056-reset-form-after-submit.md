# How Do You Reset a Form After Submit?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

After success, a form may retain old values, dirty/touched flags, server errors, pending validators, dynamic rows, or an old idempotency key. Resetting too early can erase user data after failure.

---

## 2. Explain it in simple language

Reset only after confirmed success, using an explicit initial model and rebuilding dynamic controls if necessary. Clear submission/server state and create a new idempotency key only for the next logical attempt.

### Memory rule

> **Success resets; failure preserves.**

### Interview-ready answer

> Reset only after confirmed success, using an explicit initial model and rebuilding dynamic controls if necessary. Clear submission/server state and create a new idempotency key only for the next logical attempt. In production I also separate form-state concerns from the API contract, preserve user input on failure, and repeat every financial and security rule on the ASP.NET Core side.

---

## 3. How does it work internally?

1. Submission captures an immutable request snapshot.
2. Form is disabled or state marks submitting.
3. API result determines success versus recoverable failure.
4. On success, reset values/status and rebuild FormArrays to the intended initial structure.
5. On failure, preserve values and attach safe errors for correction/retry.

### Practical interpretation

`reset()` changes values and flags, but custom component state, server-error stores, FormArrays, and idempotency keys may need explicit handling. Decide whether a success screen should keep the receipt even while form state clears.

### Incorrect versus improved approach

```typescript
submit(){this.api.create(...).subscribe();this.form.reset();}
// Reset only in the confirmed-success branch.
```

### Form mental model

1. Controls form a tree containing value, validation status, errors, and interaction flags.
2. A value change runs synchronous validation and then eligible asynchronous validation.
3. Status and value propagate to parent groups/arrays.
4. Submission captures a typed snapshot and maps it to a dedicated request DTO.
5. The API repeats authoritative validation, authorization, idempotency, and concurrency checks.

---

## 4. Realistic payment or banking example

After a transfer is confirmed, reset the amount/reference and create a fresh attempt key. If the API returns insufficient funds or a timeout, keep inputs so the user can correct or safely retry.

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

1. Request succeeds.
2. Receipt is retained separately.
3. Form resets to explicit defaults.
4. Dynamic allocations return to one row.
5. New attempt gets a new idempotency key.

### Failure flow

1. Form resets immediately when submit is clicked.
2. Network fails.
3. User loses beneficiary/reference and cannot verify what was sent.
4. Retry may use a new payload/key accidentally.
5. Preserve until outcome is known.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
private initialValue():TransferFormRaw{return {fromId:'',beneficiaryId:'',amountText:'',reference:''};}

onSuccess(receipt:TransferReceipt){
 this.receipt.set(receipt);
 this.form.reset(this.initialValue());
 this.allocations.clear(); this.allocations.push(createAllocationRow());
 this.form.markAsPristine(); this.form.markAsUntouched();
 this.serverErrors.set({});
 this.attemptKey=crypto.randomUUID();
}
```

### ASP.NET Core boundary

```csharp
public sealed record TransferReceipt(Guid TransferId,string Status,DateTimeOffset CreatedAt);
// A successful idempotent replay returns the same receipt.
```

### How to test it

Test success, validation error, 409, timeout, idempotent replay, dynamic rows, disabled fields, async pending state, and focus placement after reset. Ensure failure never erases input.

### Production verification

- Test keyboard-only use, screen-reader labels, error focus, and pending feedback.
- Exercise boundary decimals, locale formats, nulls, malformed values, and dynamic rows.
- Submit rapidly, lose the response, retry, navigate away, and return.
- Test 400 validation, 401, 403, 409, timeout, and server failure without losing input.
- Verify no display-only, permission, status, fee, or identity field can be overposted.
- Confirm the server rejects a request even when client validators are bypassed.

---

## 7. Important design decisions

- Explicit initial model.
- Outcome-dependent reset.
- Receipt separate from form.
- Dynamic control rebuild.
- Correct key lifecycle.

A technical-lead answer should explain form ownership, value/null/disabled semantics, validation timing, mapping, failure recovery, accessibility, and backend authority—not merely name FormControl APIs.

---

## 8. When to use and when not to use it

### Use it when

- After a command definitely succeeds or user explicitly cancels/clears.

### Avoid or reconsider it when

- Immediately on submit, on ambiguous timeout, or when editing an existing entity unless UX requires it.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| reset | Values plus form-state reset |
| setValue | Exact value replacement |
| patchValue | Partial value update |
| Recreate form | Full control/validator reconstruction |

---

## 10. Common production mistakes

- Reset before response.
- Forgetting FormArray.
- Old server errors remain.
- Wrong idempotency key lifecycle.
- Receipt lost with form.

> **Client validation guides the user; server validation protects the system.**

---

## 11. Scenario-based interview question

A timed-out transfer clears the form and generates a new idempotency key. Explain why that is dangerous and redesign the result/reset lifecycle.

---

## Quick revision card

- **Core answer:** Reset only after confirmed success, using an explicit initial model and rebuilding dynamic controls if necessary. Clear submission/server state and create a new idempotency key only for the next logical attempt.
- **Memory rule:** Success resets; failure preserves.
- **Design checks:** typing, null/disabled values, validation timing, DTO mapping, failure preservation, and API authority.
- **Production checks:** accessibility, rapid submit, timeout/retry, overposting, and concurrent change.

## Official Angular references

- [Forms overview](https://angular.dev/guide/forms)
- [Reactive forms](https://angular.dev/guide/forms/reactive-forms)
- [Strictly typed reactive forms](https://angular.dev/guide/forms/typed-forms)
- [Form validation](https://angular.dev/guide/forms/form-validation)
- [Building dynamic forms](https://angular.dev/guide/forms/dynamic-forms)
