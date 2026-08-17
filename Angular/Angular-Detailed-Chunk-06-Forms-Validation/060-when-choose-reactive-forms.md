# When Would You Choose Reactive Forms?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

Complex business forms require explicit state, type safety, dynamic controls, cross-field/async validation, predictable testing, and controlled DTO mapping. An implicit template model becomes difficult to reason about.

---

## 2. Explain it in simple language

Choose reactive forms when the form is central to the feature or has nontrivial validation, dynamic sections, drafts, multiple steps, reusable custom controls, or precise testing requirements.

### Memory rule

> **When the form is a workflow, model it explicitly.**

### Interview-ready answer

> Choose reactive forms when the form is central to the feature or has nontrivial validation, dynamic sections, drafts, multiple steps, reusable custom controls, or precise testing requirements. In production I also separate form-state concerns from the API contract, preserve user input on failure, and repeat every financial and security rule on the ASP.NET Core side.

---

## 3. How does it work internally?

1. Component/form factory creates a typed control tree.
2. Template binds to that existing model.
3. Value/status streams drive derived UI and workflow state.
4. Validators and dynamic operations are plain TypeScript APIs.
5. Submit maps a stable raw-value snapshot to a command.

### Practical interpretation

Reactive forms do not require placing every line in the component. Use form factories, custom ControlValueAccessor components, pure validators/mappers, and a facade. Avoid subscribing when the template can use derived state or when one composed stream is clearer.

### Incorrect versus improved approach

```typescript
this.form.valueChanges.subscribe(v=>this.api.save(v).subscribe());
// Compose streams/cancellation deliberately or use explicit draft commands.
```

### Form mental model

1. Controls form a tree containing value, validation status, errors, and interaction flags.
2. A value change runs synchronous validation and then eligible asynchronous validation.
3. Status and value propagate to parent groups/arrays.
4. Submission captures a typed snapshot and maps it to a dedicated request DTO.
5. The API repeats authoritative validation, authorization, idempotency, and concurrency checks.

---

## 4. Realistic payment or banking example

Transfer creation, merchant dispute, loan onboarding, and beneficiary management are reactive-form candidates. They need typed values, pending async state, FormArrays, server validation mapping, unsaved-change detection, and idempotent submit.

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

1. Form model is designed before markup.
2. Factories isolate sections and custom controls.
3. Validation state is explicit.
4. Mapper creates a narrow request DTO.
5. Tests cover success/failure and API authority.

### Failure flow

1. Reactive form is chosen but component becomes 2,000 lines.
2. Every valueChanges has a nested subscription.
3. Business rules move into client.
4. Form and API DTO are identical by accident.
5. Extract factories, facades, pure mappers, and server rules.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
export function createTransferForm(fb:NonNullableFormBuilder){
 return fb.group({
  fromId:['',Validators.required],
  beneficiaryId:['',Validators.required],
  amount:[0,[Validators.required,Validators.min(0.01)]],
  reference:['']
 },{updateOn:'blur'});
}

@Component({...})
export class TransferPage {
 private fb=inject(NonNullableFormBuilder);
 readonly form=createTransferForm(this.fb);
 submit(){if(this.form.valid&&!this.form.pending)this.facade.submit(toRequest(this.form.getRawValue()));}
}
```

### ASP.NET Core boundary

```csharp
[Authorize]
[HttpPost]
public Task<IActionResult> Create(CreateTransferRequest request,CancellationToken ct)
 => workflow.CreateAsync(request,User,ct);
```

### How to test it

Test factories/validators/mappers without rendering, custom controls through their contract, component behavior with a fake facade, and backend validation/idempotency through integration tests.

### Production verification

- Test keyboard-only use, screen-reader labels, error focus, and pending feedback.
- Exercise boundary decimals, locale formats, nulls, malformed values, and dynamic rows.
- Submit rapidly, lose the response, retry, navigate away, and return.
- Test 400 validation, 401, 403, 409, timeout, and server failure without losing input.
- Verify no display-only, permission, status, fee, or identity field can be overposted.
- Confirm the server rejects a request even when client validators are bypassed.

---

## 7. Important design decisions

- Feature complexity.
- Typed model value.
- Form decomposition.
- Explicit subscription ownership.
- Backend authority.

A technical-lead answer should explain form ownership, value/null/disabled semantics, validation timing, mapping, failure recovery, accessibility, and backend authority—not merely name FormControl APIs.

---

## 8. When to use and when not to use it

### Use it when

- Complex, dynamic, multi-step, heavily validated, or test-critical forms.

### Avoid or reconsider it when

- One or two simple fields where template-driven/native forms are clearer, or choosing it only because it is popular.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Reactive form | Explicit workflow model |
| Template-driven | Simple template-managed model |
| Facade/store | Async workflow outside form |
| API domain model | Authoritative business state |

---

## 10. Common production mistakes

- God form component.
- Nested valueChanges subscriptions.
- Autosave storms.
- Client business authority.
- No DTO mapper.

> **Client validation guides the user; server validation protects the system.**

---

## 11. Scenario-based interview question

A lead says “all forms must be reactive.” Give a balanced decision rule, then design a complex transfer form without creating a god component.

---

## Quick revision card

- **Core answer:** Choose reactive forms when the form is central to the feature or has nontrivial validation, dynamic sections, drafts, multiple steps, reusable custom controls, or precise testing requirements.
- **Memory rule:** When the form is a workflow, model it explicitly.
- **Design checks:** typing, null/disabled values, validation timing, DTO mapping, failure preservation, and API authority.
- **Production checks:** accessibility, rapid submit, timeout/retry, overposting, and concurrent change.

## Official Angular references

- [Forms overview](https://angular.dev/guide/forms)
- [Reactive forms](https://angular.dev/guide/forms/reactive-forms)
- [Strictly typed reactive forms](https://angular.dev/guide/forms/typed-forms)
- [Form validation](https://angular.dev/guide/forms/form-validation)
- [Building dynamic forms](https://angular.dev/guide/forms/dynamic-forms)
