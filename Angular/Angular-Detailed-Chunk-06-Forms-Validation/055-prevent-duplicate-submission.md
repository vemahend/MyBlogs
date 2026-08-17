# How Do You Prevent Duplicate Form Submission?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

Double clicks, Enter plus click, slow responses, retries, multiple tabs, and lost responses can send the same financial command more than once. A disabled button only covers one browser interaction path.

---

## 2. Explain it in simple language

Use a submission state and an RxJS concurrency strategy to suppress local duplicates, then send an idempotency key so the API guarantees one logical result for repeated equivalent requests.

### Memory rule

> **Disable for UX; idempotency for correctness.**

### Interview-ready answer

> Use a submission state and an RxJS concurrency strategy to suppress local duplicates, then send an idempotency key so the API guarantees one logical result for repeated equivalent requests. In production I also separate form-state concerns from the API contract, preserve user input on failure, and repeat every financial and security rule on the ASP.NET Core side.

---

## 3. How does it work internally?

1. Submit intent enters a single controlled stream/handler.
2. exhaustMap ignores new intents while the current submission is active, or state blocks another call.
3. Button reflects submitting/disabled state accessibly.
4. Request carries a stable idempotency key for that logical attempt.
5. Server atomically records key plus request/result and replays or rejects mismatches.

### Practical interpretation

A new intentional payment gets a new key; a retry of the same attempt reuses the key. The server should bind key to user/tenant and request hash, protect it with a unique constraint/transaction, and define retention.

### Incorrect versus improved approach

```typescript
button.disabled=true; http.post(...); // client-only protection
// Add serialized submit handling and server idempotency.
```

### Form mental model

1. Controls form a tree containing value, validation status, errors, and interaction flags.
2. A value change runs synchronous validation and then eligible asynchronous validation.
3. Status and value propagate to parent groups/arrays.
4. Submission captures a typed snapshot and maps it to a dedicated request DTO.
5. The API repeats authoritative validation, authorization, idempotency, and concurrency checks.

---

## 4. Realistic payment or banking example

A transfer confirmation uses `exhaustMap`. If the response is lost and the client retries with the same key and payload, the server returns the stored result rather than creating another transfer.

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

1. First submit creates an attempt key.
2. Local state blocks rapid duplicates.
3. API atomically processes key and payment.
4. Lost response is retried with same key.
5. Server returns the original result.

### Failure flow

1. Button is disabled only after async work starts.
2. Two synchronous events escape first.
3. Or retry generates a new key.
4. API creates two transfers.
5. Serialize intent and persist key per logical attempt.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
private readonly submitIntent=new Subject<CreateTransferRequest>();
readonly result$=this.submitIntent.pipe(
 exhaustMap(request=>this.api.create(request,this.attemptKey).pipe(
  finalize(()=>this.submitting.set(false))
 ))
);
submit(){
 if(this.form.invalid||this.form.pending||this.submitting())return;
 this.submitting.set(true); this.submitIntent.next(toRequest(this.form.getRawValue()));
}
```

### ASP.NET Core boundary

```csharp
[HttpPost]
public Task<IActionResult> Create(CreateTransferRequest request,
 [FromHeader(Name="Idempotency-Key")]string key,CancellationToken ct)
 => idempotentExecutor.ExecuteAsync(User.SubjectId(),key,Hash(request),()=>workflow.CreateAsync(request,User,ct),ct);
```

### How to test it

Fire multiple events in the same tick, delay response, simulate timeout/retry, use same key with same/different payload, and send concurrent requests from two clients. Assert one financial effect.

### Production verification

- Test keyboard-only use, screen-reader labels, error focus, and pending feedback.
- Exercise boundary decimals, locale formats, nulls, malformed values, and dynamic rows.
- Submit rapidly, lose the response, retry, navigate away, and return.
- Test 400 validation, 401, 403, 409, timeout, and server failure without losing input.
- Verify no display-only, permission, status, fee, or identity field can be overposted.
- Confirm the server rejects a request even when client validators are bypassed.

---

## 7. Important design decisions

- One submit entry point.
- exhaustMap for in-flight suppression.
- Stable key per attempt.
- Atomic server record.
- Clear/recreate key only at correct lifecycle.

A technical-lead answer should explain form ownership, value/null/disabled semantics, validation timing, mapping, failure recovery, accessibility, and backend authority—not merely name FormControl APIs.

---

## 8. When to use and when not to use it

### Use it when

- All financial or otherwise non-repeatable commands.

### Avoid or reconsider it when

- Relying only on debounce, disabled UI, or client-generated IDs without server enforcement.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Disabled button | Visual/local UX |
| exhaustMap | Client concurrency policy |
| Idempotency key | Server duplicate-command identity |
| Optimistic concurrency | Conflicting resource updates |

---

## 10. Common production mistakes

- New key on retry.
- Key not bound to payload/user.
- No unique constraint.
- finally not resetting UI.
- Retrying POST blindly.

> **Client validation guides the user; server validation protects the system.**

---

## 11. Scenario-based interview question

A payment duplicated even though the button was disabled. Give every path that bypasses the button and design end-to-end idempotency.

---

## Quick revision card

- **Core answer:** Use a submission state and an RxJS concurrency strategy to suppress local duplicates, then send an idempotency key so the API guarantees one logical result for repeated equivalent requests.
- **Memory rule:** Disable for UX; idempotency for correctness.
- **Design checks:** typing, null/disabled values, validation timing, DTO mapping, failure preservation, and API authority.
- **Production checks:** accessibility, rapid submit, timeout/retry, overposting, and concurrent change.

## Official Angular references

- [Forms overview](https://angular.dev/guide/forms)
- [Reactive forms](https://angular.dev/guide/forms/reactive-forms)
- [Strictly typed reactive forms](https://angular.dev/guide/forms/typed-forms)
- [Form validation](https://angular.dev/guide/forms/form-validation)
- [Building dynamic forms](https://angular.dev/guide/forms/dynamic-forms)
