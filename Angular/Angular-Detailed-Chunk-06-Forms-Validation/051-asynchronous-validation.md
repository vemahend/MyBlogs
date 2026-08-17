# How Do You Add Asynchronous Validation?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

Some validity checks require external or delayed knowledge—beneficiary existence, payment reference uniqueness, account eligibility, or a server lookup. A synchronous validator cannot wait for that result.

---

## 2. Explain it in simple language

Attach an `AsyncValidatorFn` that returns an Observable or Promise of `ValidationErrors | null`. Angular runs async validators only after synchronous validators pass and marks the control `PENDING` until the result completes.

### Memory rule

> **Sync checks shape first; async checks remote facts second.**

### Interview-ready answer

> Attach an `AsyncValidatorFn` that returns an Observable or Promise of `ValidationErrors | null`. Angular runs async validators only after synchronous validators pass and marks the control `PENDING` until the result completes. In production I also separate form-state concerns from the API contract, preserve user input on failure, and repeat every financial and security rule on the ASP.NET Core side.

---

## 3. How does it work internally?

1. Control value changes according to updateOn.
2. Synchronous validators run first.
3. If sync validation passes, Angular invokes async validators.
4. The control becomes PENDING while the returned async work runs.
5. Latest result sets errors or null; Angular updates parent status.

### Practical interpretation

Async validation improves feedback but is a time-of-check snapshot. It is not a reservation or guarantee. Distinguish “invalid” from “validation service unavailable”; otherwise an outage may incorrectly tell users their beneficiary is invalid.

### Incorrect versus improved approach

```typescript
control.valueChanges.subscribe(v=>api.check(v).subscribe(...));
// Do not subscribe inside a validator; return finite async work to Angular.
```

### Form mental model

1. Controls form a tree containing value, validation status, errors, and interaction flags.
2. A value change runs synchronous validation and then eligible asynchronous validation.
3. Status and value propagate to parent groups/arrays.
4. Submission captures a typed snapshot and maps it to a dedicated request DTO.
5. The API repeats authoritative validation, authorization, idempotency, and concurrency checks.

---

## 4. Realistic payment or banking example

A beneficiary account field checks whether the beneficiary is currently eligible. Use `updateOn: blur` or a debounced design to avoid one call per keystroke. Recheck eligibility during transfer submission because state can change after validation.

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

1. Local format validator accepts account identifier.
2. Async validator starts once after blur.
3. Pending feedback appears.
4. API returns eligible and control becomes valid.
5. Submit endpoint revalidates eligibility.

### Failure flow

1. Validator calls API on every keypress.
2. Old response arrives after a newer value.
3. Control shows the wrong result or remains pending.
4. User submits based on stale eligibility.
5. Use a finite cancellable validator and server revalidation.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
function beneficiaryEligible(api:BeneficiaryApi):AsyncValidatorFn {
 return control => api.check(control.value).pipe(
  map(r=>r.eligible?null:{beneficiaryIneligible:{reason:r.reason}}),
  catchError(()=>of({eligibilityUnavailable:true})),
  take(1)
 );
}

beneficiaryId=new FormControl('',{
 nonNullable:true,
 validators:[Validators.required,beneficiaryIdFormat],
 asyncValidators:[beneficiaryEligible(inject(BeneficiaryApi))],
 updateOn:'blur'
});
```

### ASP.NET Core boundary

```csharp
[Authorize]
[HttpGet("beneficiaries/{id}/eligibility")]
public Task<EligibilityDto> Check(string id,CancellationToken ct)
 => eligibility.CheckForUserAsync(id,User,ct);

// CreateTransferAsync must check eligibility again inside the command workflow.
```

### How to test it

Use fake timers/test scheduler or controlled Observables. Assert sync-invalid values do not call the API, status becomes pending, latest value wins, success returns null, failures map correctly, and submission repeats authoritative checks.

### Production verification

- Test keyboard-only use, screen-reader labels, error focus, and pending feedback.
- Exercise boundary decimals, locale formats, nulls, malformed values, and dynamic rows.
- Submit rapidly, lose the response, retry, navigate away, and return.
- Test 400 validation, 401, 403, 409, timeout, and server failure without losing input.
- Verify no display-only, permission, status, fee, or identity field can be overposted.
- Confirm the server rejects a request even when client validators are bypassed.

---

## 7. Important design decisions

- Use sync validation first.
- Choose change/blur/submit deliberately.
- Return finite work.
- Model unavailable separately.
- Revalidate on command.

A technical-lead answer should explain form ownership, value/null/disabled semantics, validation timing, mapping, failure recovery, accessibility, and backend authority—not merely name FormControl APIs.

---

## 8. When to use and when not to use it

### Use it when

- Remote uniqueness, eligibility, or policy hints where early feedback matters.

### Avoid or reconsider it when

- Authoritative decisions that belong only at submission or checks too expensive for field validation.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Sync validator | Immediate local rule |
| Async validator | Delayed/remote field feedback |
| Submit API validation | Authoritative current decision |
| Resolver | Route data loading, not form validity |

---

## 10. Common production mistakes

- API per keystroke.
- Never-completing Observable.
- Swallowing outage as valid.
- Stale response.
- Trusting precheck during submit.

> **Client validation guides the user; server validation protects the system.**

---

## 11. Scenario-based interview question

A beneficiary async validator sometimes displays “eligible” for the previous account and generates hundreds of calls. Diagnose timing, update strategy, and server safeguards.

---

## Quick revision card

- **Core answer:** Attach an `AsyncValidatorFn` that returns an Observable or Promise of `ValidationErrors | null`. Angular runs async validators only after synchronous validators pass and marks the control `PENDING` until the result completes.
- **Memory rule:** Sync checks shape first; async checks remote facts second.
- **Design checks:** typing, null/disabled values, validation timing, DTO mapping, failure preservation, and API authority.
- **Production checks:** accessibility, rapid submit, timeout/retry, overposting, and concurrent change.

## Official Angular references

- [Forms overview](https://angular.dev/guide/forms)
- [Reactive forms](https://angular.dev/guide/forms/reactive-forms)
- [Strictly typed reactive forms](https://angular.dev/guide/forms/typed-forms)
- [Form validation](https://angular.dev/guide/forms/form-validation)
- [Building dynamic forms](https://angular.dev/guide/forms/dynamic-forms)
