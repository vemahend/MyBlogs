# How Do You Map Form Values to Backend DTOs Safely?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

Form state contains strings, nullable values, disabled controls, display-only fields, and UI metadata. Sending `form.value` directly couples the API contract to the view and can omit or overpost fields.

---

## 2. Explain it in simple language

Create an explicit mapper from the typed form raw value to a dedicated request DTO. Normalize and convert intentionally, whitelist fields, and let the API validate and derive protected values.

### Memory rule

> **Never post the form; post a command built from the form.**

### Interview-ready answer

> Create an explicit mapper from the typed form raw value to a dedicated request DTO. Normalize and convert intentionally, whitelist fields, and let the API validate and derive protected values. In production I also separate form-state concerns from the API contract, preserve user input on failure, and repeat every financial and security rule on the ASP.NET Core side.

---

## 3. How does it work internally?

1. Typed controls produce a known raw-value shape.
2. Submit checks form status and pending state.
3. Mapper trims/parses values and selects allowed fields.
4. API client serializes a request DTO.
5. Server model binding plus validation/domain logic rejects invalid or unauthorized values.

### Practical interpretation

`value` excludes disabled controls; `getRawValue()` includes them. Neither is automatically safe. Decide field-by-field. Use decimals/minor units consistently and avoid JavaScript floating-point calculations for authoritative money.

### Incorrect versus improved approach

```typescript
this.http.post('/api/transfers',this.form.getRawValue());
// Explicit mapper + request DTO prevents accidental overposting.
```

### Form mental model

1. Controls form a tree containing value, validation status, errors, and interaction flags.
2. A value change runs synchronous validation and then eligible asynchronous validation.
3. Status and value propagate to parent groups/arrays.
4. Submission captures a typed snapshot and maps it to a dedicated request DTO.
5. The API repeats authoritative validation, authorization, idempotency, and concurrency checks.

---

## 4. Realistic payment or banking example

The UI displays account name, available balance, fee estimate, and canApprove. The CreateTransferRequest includes only account IDs, amount, currency, reference, and idempotency key; fees/status/user identity are server-derived.

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

1. Form is valid and not pending.
2. Mapper reads intended fields.
3. Money is represented consistently.
4. Request excludes display/security properties.
5. API authoritatively validates and creates.

### Failure flow

1. `http.post(form.getRawValue())` sends hidden fields and UI booleans.
2. Attacker changes canApprove or fee in devtools.
3. Server overbinds and trusts them.
4. Privilege or amount manipulation occurs.
5. Use request-specific DTOs and server derivation.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
function toRequest(v:TransferFormRaw):CreateTransferRequest {
 return {
  fromAccountId:v.fromAccountId,
  beneficiaryId:v.beneficiaryId,
  amount:parseMoney(v.amountText,v.currency),
  currency:v.currency,
  reference:v.reference.trim() || null
 };
}

submit(){
 if(this.form.invalid||this.form.pending)return;
 this.facade.submit(toRequest(this.form.getRawValue()));
}
```

### ASP.NET Core boundary

```csharp
public sealed record CreateTransferRequest(Guid FromAccountId,Guid BeneficiaryId,decimal Amount,string Currency,string? Reference);

[HttpPost]
public Task<IActionResult> Create(CreateTransferRequest request,CancellationToken ct)
 => workflow.CreateAsync(request,User,ct); // user, fees, limits, status derived server-side
```

### How to test it

Unit-test mapper with whitespace, null, disabled values, locale amount formats, unexpected UI fields, and precision boundaries. Contract-test serialized JSON and backend overposting resistance.

### Production verification

- Test keyboard-only use, screen-reader labels, error focus, and pending feedback.
- Exercise boundary decimals, locale formats, nulls, malformed values, and dynamic rows.
- Submit rapidly, lose the response, retry, navigate away, and return.
- Test 400 validation, 401, 403, 409, timeout, and server failure without losing input.
- Verify no display-only, permission, status, fee, or identity field can be overposted.
- Confirm the server rejects a request even when client validators are bypassed.

---

## 7. Important design decisions

- Request-specific DTO.
- Whitelist fields.
- Explicit money/date conversion.
- Server-derived security fields.
- Version mapping boundary.

A technical-lead answer should explain form ownership, value/null/disabled semantics, validation timing, mapping, failure recovery, accessibility, and backend authority—not merely name FormControl APIs.

---

## 8. When to use and when not to use it

### Use it when

- Every nontrivial form-to-command submission.

### Avoid or reconsider it when

- Blind object spreading or reusing read DTOs as write DTOs.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Form raw value | UI state shape |
| Request DTO | Write contract |
| Response DTO | Read contract |
| View model | Presentation-friendly data |

---

## 10. Common production mistakes

- Posting raw form.
- Overposting permissions/status.
- Disabled field surprise.
- Locale parse errors.
- Using response DTO for command.

> **Client validation guides the user; server validation protects the system.**

---

## 11. Scenario-based interview question

A transfer API accepts `canApprove` and `fee` because the frontend posts its full form. Explain the overposting risk and redesign both contracts.

---

## Quick revision card

- **Core answer:** Create an explicit mapper from the typed form raw value to a dedicated request DTO. Normalize and convert intentionally, whitelist fields, and let the API validate and derive protected values.
- **Memory rule:** Never post the form; post a command built from the form.
- **Design checks:** typing, null/disabled values, validation timing, DTO mapping, failure preservation, and API authority.
- **Production checks:** accessibility, rapid submit, timeout/retry, overposting, and concurrent change.

## Official Angular references

- [Forms overview](https://angular.dev/guide/forms)
- [Reactive forms](https://angular.dev/guide/forms/reactive-forms)
- [Strictly typed reactive forms](https://angular.dev/guide/forms/typed-forms)
- [Form validation](https://angular.dev/guide/forms/form-validation)
- [Building dynamic forms](https://angular.dev/guide/forms/dynamic-forms)
