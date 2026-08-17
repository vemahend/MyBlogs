# How Do You Show Validation Messages Cleanly?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

Validation markup becomes repetitive and noisy, messages appear before interaction, server errors are disconnected from fields, and inaccessible hints leave users unable to correct input.

---

## 2. Explain it in simple language

Use a consistent error-display component/helper driven by control state and stable error keys. Show field errors after touched or submit attempt, include pending feedback, summarize errors, focus the first invalid field, and map server validation safely.

### Memory rule

> **Tell the user what is wrong, where, and how to fix it.**

### Interview-ready answer

> Use a consistent error-display component/helper driven by control state and stable error keys. Show field errors after touched or submit attempt, include pending feedback, summarize errors, focus the first invalid field, and map server validation safely. In production I also separate form-state concerns from the API contract, preserve user input on failure, and repeat every financial and security rule on the ASP.NET Core side.

---

## 3. How does it work internally?

1. Validators populate `errors` on controls/groups.
2. Touched/dirty/submitted policy determines visibility.
3. A presentation mapper chooses the highest-priority human message.
4. ARIA attributes connect input, hint, and error text.
5. Server problem details map known field paths to controls and unknown errors to a form summary.

### Practical interpretation

Do not display every error simultaneously. Prioritize required before format before range. Business rejections such as insufficient funds may belong in a form summary, not as a field syntax error. Preserve the server correlation ID for support without exposing internals.

### Incorrect versus improved approach

```typescript
<div [innerHTML]="apiError.message"></div>
// Render trusted client mappings or safe text, never arbitrary server HTML.
```

### Form mental model

1. Controls form a tree containing value, validation status, errors, and interaction flags.
2. A value change runs synchronous validation and then eligible asynchronous validation.
3. Status and value propagate to parent groups/arrays.
4. Submission captures a typed snapshot and maps it to a dedicated request DTO.
5. The API repeats authoritative validation, authorization, idempotency, and concurrency checks.

---

## 4. Realistic payment or banking example

Amount field shows “Enter an amount greater than 0”; beneficiary async validation shows “Checking beneficiary…”; API limit failure appears as a form-level business error unless it maps safely to amount.

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

1. User submits invalid form.
2. All controls are marked touched.
3. Summary announces count and links/focuses first field.
4. Inline message is specific and accessible.
5. Server errors are cleared when relevant input changes.

### Failure flow

1. Template repeats twenty nested `hasError` blocks.
2. Errors show on initial page load.
3. Server message is rendered as raw HTML.
4. Screen reader has no association.
5. Centralize mapping and use text-only safe rendering.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
function shouldShow(c:AbstractControl,submitted:boolean){return c.invalid&&(c.touched||submitted);}

<input id="amount" formControlName="amount"
 [attr.aria-invalid]="shouldShow(amount,submitted)"
 [attr.aria-describedby]="shouldShow(amount,submitted)?'amount-error':'amount-hint'" />
@if (shouldShow(amount,submitted)) {
 <app-field-error id="amount-error" [errors]="amount.errors" />
}
```

### ASP.NET Core boundary

```csharp
return ValidationProblem(new Dictionary<string,string[]>{
 ["amount"]=["Amount exceeds the permitted limit."]
});
// Return stable safe codes/fields; do not expose stack traces or SQL messages.
```

### How to test it

Test untouched, touched, submit-attempt, pending, multiple errors, server field errors, summary focus, keyboard navigation, screen-reader attributes, and malicious server text.

### Production verification

- Test keyboard-only use, screen-reader labels, error focus, and pending feedback.
- Exercise boundary decimals, locale formats, nulls, malformed values, and dynamic rows.
- Submit rapidly, lose the response, retry, navigate away, and return.
- Test 400 validation, 401, 403, 409, timeout, and server failure without losing input.
- Verify no display-only, permission, status, fee, or identity field can be overposted.
- Confirm the server rejects a request even when client validators are bypassed.

---

## 7. Important design decisions

- Consistent visibility policy.
- Stable error-code mapping.
- Accessible relationships.
- Safe server text.
- Clear stale server errors.

A technical-lead answer should explain form ownership, value/null/disabled semantics, validation timing, mapping, failure recovery, accessibility, and backend authority—not merely name FormControl APIs.

---

## 8. When to use and when not to use it

### Use it when

- Every production form with more than trivial validation.

### Avoid or reconsider it when

- Raw error dumping or showing all messages before interaction.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Inline error | Specific field correction |
| Error summary | Form-wide overview/navigation |
| Pending message | Validation still running |
| Toast | Transient global feedback, poor for field correction |

---

## 10. Common production mistakes

- Error before touch.
- Raw HTML/server internals.
- No aria-describedby.
- Stale server error.
- Color-only indication.

> **Client validation guides the user; server validation protects the system.**

---

## 11. Scenario-based interview question

A banking form renders raw API validation HTML and screen-reader users cannot find invalid fields. Design a safe accessible error system.

---

## Quick revision card

- **Core answer:** Use a consistent error-display component/helper driven by control state and stable error keys. Show field errors after touched or submit attempt, include pending feedback, summarize errors, focus the first invalid field, and map server validation safely.
- **Memory rule:** Tell the user what is wrong, where, and how to fix it.
- **Design checks:** typing, null/disabled values, validation timing, DTO mapping, failure preservation, and API authority.
- **Production checks:** accessibility, rapid submit, timeout/retry, overposting, and concurrent change.

## Official Angular references

- [Forms overview](https://angular.dev/guide/forms)
- [Reactive forms](https://angular.dev/guide/forms/reactive-forms)
- [Strictly typed reactive forms](https://angular.dev/guide/forms/typed-forms)
- [Form validation](https://angular.dev/guide/forms/form-validation)
- [Building dynamic forms](https://angular.dev/guide/forms/dynamic-forms)
