# What Are Pipes in Angular?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

Templates frequently need human-readable formatting. Repeating date, currency, status-label, or masking expressions in components clutters orchestration code and produces inconsistent display.

---

## 2. Explain it in simple language

A pipe transforms a value for presentation using `value | pipe:argument`. It should normally be a deterministic, side-effect-free display transformation—not a place for API calls or business decisions.

### Memory rule

> **A pipe changes presentation, not truth.**

### Interview-ready answer

> A pipe transforms a value for presentation using `value | pipe:argument`. It should normally be a deterministic, side-effect-free display transformation—not a place for API calls or business decisions. In production I would also explain who owns the state, how the view behaves during change and destruction, and which validation or authorization must remain authoritative in ASP.NET Core.

---

## 3. How does it work internally?

1. Angular evaluates the expression on the left.
2. It resolves the pipe declared in the template compilation scope.
3. The value and arguments are passed to `transform`.
4. For a pure pipe, Angular can skip invocation when primitive inputs or object references have not changed.
5. The returned value participates in rendering; the source value is not changed.

### Practical interpretation

Built-in pipes include date, currency, decimal, percent, JSON, title case, slice, key-value, and async. Be deliberate with locale, timezone, rounding, and currency; financial display precision is not the same as authoritative monetary calculation.

### Incorrect versus improved approach

```typescript
// Avoid async work and mutation in transform()
transform(id:string){ this.http.get('/api/account/'+id).subscribe(); return 'Loading'; }
// Fetch in a service/facade; pipe only formats the resulting value.
```

### Runtime mental model

1. Angular compiles the template and identifies directives, pipes, bindings, and embedded views.
2. Runtime values are evaluated during view synchronization.
3. Angular updates the host node or reconciles embedded views using the declared identity and state.
4. Child components, subscriptions, and DOM resources follow the lifetime of the view that owns them.
5. Browser behavior remains a user-experience layer; backend policies protect money and data.

---

## 4. Realistic payment or banking example

An account-mask pipe displays `•••• 1234`, while the full account number is never returned to a screen that does not need it. The pipe improves presentation but cannot protect data that has already been sent to the browser.

### Full-stack responsibility split

| Angular | ASP.NET Core |
|---|---|
| Render explicit loading, empty, ready, and error states | Return authorized, least-privilege DTOs |
| Format values and guide input | Validate authoritative currency, precision, limits, and status |
| Hide/disable actions for usability | Enforce authorization, concurrency, and idempotency |
| Reconcile rows with stable IDs | Provide stable resource identity |
| Avoid stale work and release view resources | Honour cancellation and protect server capacity |

---

## 5. Successful flow and failure flow

### Successful flow

1. API returns a least-privilege display DTO.
2. Pure pipe receives the safe value.
3. It returns a consistent localized display string.
4. Same pipe is reused in transaction and account views.
5. Tests cover null and malformed input.

### Failure flow

1. API sends full card/account data everywhere.
2. Pipe visually hides most digits.
3. Secrets remain in browser memory, logs, or devtools.
4. A client bug exposes them.
5. Fix the DTO and authorization boundary, not only the formatter.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
@Pipe({name:'accountMask',standalone:true,pure:true})
export class AccountMaskPipe implements PipeTransform {
 transform(last4:string|null|undefined):string {
   return /^\d{4}$/.test(last4 ?? '') ? '•••• ' + last4 : 'Unavailable';
 }
}

<span>{{ account.last4 | accountMask }}</span>
```

### ASP.NET Core boundary

```csharp
public sealed record AccountDisplayDto(Guid Id,string DisplayName,string Last4);

[Authorize]
[HttpGet]
public Task<IReadOnlyList<AccountDisplayDto>> Get(CancellationToken ct)
 => accounts.GetDisplayAccountsAsync(User,ct);
```

### How to test it

Instantiate a pure pipe directly for fast table-driven tests: valid, null, malformed, locale, rounding, and boundary cases. Test the component once to ensure correct template wiring. Contract-test that the API omits sensitive fields.

### Production verification

- Exercise refresh, rapid interaction, delayed API responses, and navigation away.
- Verify keyboard, focus, labels, disabled state, and screen-reader semantics.
- Profile a realistic list rather than a ten-row demo.
- Test 401, 403, 404, 409, validation failure, and transient server failure.
- Confirm the browser never receives secrets merely hidden by a directive or pipe.
- Confirm logs use correlation IDs and avoid account, card, and payment credentials.

---

## 7. Important design decisions

- Keep transformation deterministic.
- Define null/error behavior.
- Use locale intentionally.
- Never mutate the input.
- Reduce sensitive data at the API boundary.

A senior answer should state the rejected alternative and its failure mode. Naming an Angular API is not enough; explain identity, ownership, lifetime, performance, accessibility, and server authority.

---

## 8. When to use and when not to use it

### Use it when

- Small reusable presentation transformations.

### Avoid or reconsider it when

- Business rules, workflow state, HTTP calls, heavy collection filtering, or security redaction after excessive data delivery.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Pipe | Template display transformation |
| Pure function | General transformation outside templates |
| Computed signal | Derived reactive state |
| DTO mapper | Boundary shape conversion |

---

## 10. Common production mistakes

- API calls in pipe.
- Mutating arrays with sort.
- Ignoring locale/timezone.
- Expensive filtering.
- Confusing masking with data security.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

A card-number pipe hides digits, but a security review finds full PAN values in browser logs. Explain why the pipe is insufficient and redesign the boundary.

---

## Quick revision card

- **Core answer:** A pipe transforms a value for presentation using `value | pipe:argument`. It should normally be a deterministic, side-effect-free display transformation—not a place for API calls or business decisions.
- **Memory rule:** A pipe changes presentation, not truth.
- **Senior checks:** identity, ownership, lifetime, accessibility, performance, and backend authority.
- **Failure checks:** mutation, stale view, duplicate action, unauthorized API call, and contract drift.

## Official Angular references

- [Control flow](https://angular.dev/guide/templates/control-flow)
- [Structural directives](https://angular.dev/guide/directives/structural-directives)
- [Pipes](https://angular.dev/guide/templates/pipes)
