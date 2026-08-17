# Template-Driven vs Reactive Forms

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

Angular offers more than one form style, and choosing poorly can create unnecessary ceremony for a tiny form or untestable template logic for a complex workflow.

---

## 2. Explain it in simple language

Template-driven forms create/manage the form model mainly through template directives and suit small simple forms. Reactive forms define an explicit typed model in TypeScript and scale better for complex validation, dynamic fields, testing, and reactive workflows.

### Memory rule

> **Simple template; complex workflow reactive.**

### Interview-ready answer

> Template-driven forms create/manage the form model mainly through template directives and suit small simple forms. Reactive forms define an explicit typed model in TypeScript and scale better for complex validation, dynamic fields, testing, and reactive workflows. In production I also separate form-state concerns from the API contract, preserve user input on failure, and repeat every financial and security rule on the ASP.NET Core side.

---

## 3. How does it work internally?

1. Template-driven directives register controls asynchronously around a mutable model.
2. Reactive forms construct the control tree explicitly before binding the template.
3. Reactive value/status access is direct and synchronous at the form-model API.
4. Validators are directives in template-driven forms and functions in reactive forms.
5. Typed reactive forms provide compile-time structure; template-driven forms have weaker typing.

### Practical interpretation

The decision is not “which is newer.” Choose based on model complexity, dynamic behavior, typing, team consistency, and tests. Current Angular also documents Signal Forms for newer versions, but reactive forms remain a strong production choice and existing applications need not rewrite without value.

### Incorrect versus improved approach

```typescript
// Mixing ngModel and formControlName for the same control creates competing ownership.
<input [(ngModel)]="amount" formControlName="amount" />
```

### Form mental model

1. Controls form a tree containing value, validation status, errors, and interaction flags.
2. A value change runs synchronous validation and then eligible asynchronous validation.
3. Status and value propagate to parent groups/arrays.
4. Submission captures a typed snapshot and maps it to a dedicated request DTO.
5. The API repeats authoritative validation, authorization, idempotency, and concurrency checks.

---

## 4. Realistic payment or banking example

A newsletter preference checkbox may be template-driven. A transfer/beneficiary onboarding form with async checks, FormArrays, cross-field rules, drafts, and idempotent submission should use reactive forms.

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

1. Team selects style based on complexity.
2. Simple form stays readable.
3. Financial workflow has typed explicit state.
4. Tests exercise validation without template gymnastics.
5. API validation remains authoritative.

### Failure flow

1. Complex payment form stores dozens of `ngModel` values and rules in markup.
2. Cross-field and dynamic logic becomes scattered.
3. Tests depend heavily on change detection timing.
4. DTO mapping is implicit.
5. Migrate feature-by-feature to typed reactive forms.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
// Template-driven (small)
<form #f="ngForm" (ngSubmit)="save(f.value)">
 <input name="nickname" [(ngModel)]="model.nickname" required />
</form>

// Reactive (complex)
form=this.fb.nonNullable.group({
 fromId:['',Validators.required], amount:[0,[Validators.required,Validators.min(0.01)]]
});
<form [formGroup]="form" (ngSubmit)="submit()">...</form>
```

### ASP.NET Core boundary

```csharp
public sealed record TransferRequest(Guid FromId,decimal Amount);
// Backend contract and validation are identical regardless of Angular form style.
```

### How to test it

Compare how each approach handles initial values, validation timing, submit, reset, and DOM. For reactive forms, test the form model cheaply; retain component integration tests for binding/accessibility.

### Production verification

- Test keyboard-only use, screen-reader labels, error focus, and pending feedback.
- Exercise boundary decimals, locale formats, nulls, malformed values, and dynamic rows.
- Submit rapidly, lose the response, retry, navigate away, and return.
- Test 400 validation, 401, 403, 409, timeout, and server failure without losing input.
- Verify no display-only, permission, status, fee, or identity field can be overposted.
- Confirm the server rejects a request even when client validators are bypassed.

---

## 7. Important design decisions

- Complexity and scale.
- Typing needs.
- Dynamic/cross-field validation.
- Team consistency.
- Migration value versus risk.

A technical-lead answer should explain form ownership, value/null/disabled semantics, validation timing, mapping, failure recovery, accessibility, and backend authority—not merely name FormControl APIs.

---

## 8. When to use and when not to use it

### Use it when

- Template-driven for genuinely small forms; reactive for business workflows.

### Avoid or reconsider it when

- Mixing ownership styles on the same controls or rewriting stable forms only for fashion.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Template-driven | Implicit template model |
| Reactive | Explicit typed control model |
| Signal Forms | Signal/schema model in newer Angular |
| Plain HTML form | Browser-native submission/validation |

---

## 10. Common production mistakes

- Complex rules in template.
- Mixing ngModel/formControl.
- Assuming reactive means backend-safe.
- No typed forms.
- Unnecessary migration.

> **Client validation guides the user; server validation protects the system.**

---

## 11. Scenario-based interview question

A 40-field onboarding form uses ngModel, async checks, and dynamic beneficiaries. Explain whether and how you would migrate incrementally.

---

## Quick revision card

- **Core answer:** Template-driven forms create/manage the form model mainly through template directives and suit small simple forms. Reactive forms define an explicit typed model in TypeScript and scale better for complex validation, dynamic fields, testing, and reactive workflows.
- **Memory rule:** Simple template; complex workflow reactive.
- **Design checks:** typing, null/disabled values, validation timing, DTO mapping, failure preservation, and API authority.
- **Production checks:** accessibility, rapid submit, timeout/retry, overposting, and concurrent change.

## Official Angular references

- [Forms overview](https://angular.dev/guide/forms)
- [Reactive forms](https://angular.dev/guide/forms/reactive-forms)
- [Strictly typed reactive forms](https://angular.dev/guide/forms/typed-forms)
- [Form validation](https://angular.dev/guide/forms/form-validation)
- [Building dynamic forms](https://angular.dev/guide/forms/dynamic-forms)
