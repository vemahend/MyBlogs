# When Would You Create a Custom Directive?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

A repeated DOM behavior may need consistent lifecycle, accessibility, configuration, and testing across many components. Copying event listeners and attributes makes defects and policy drift likely.

---

## 2. Explain it in simple language

Create a custom directive when several elements need the same focused host or view behavior and a component would add the wrong visual abstraction. First check whether native HTML, CSS, Angular control flow, or an existing accessible component already solves it.

### Memory rule

> **Create a directive for reusable behavior, not reusable business workflow.**

### Interview-ready answer

> Create a custom directive when several elements need the same focused host or view behavior and a component would add the wrong visual abstraction. First check whether native HTML, CSS, Angular control flow, or an existing accessible component already solves it. In production I would also explain who owns the state, how the view behaves during change and destruction, and which validation or authorization must remain authoritative in ASP.NET Core.

---

## 3. How does it work internally?

1. A selector opts hosts into the behavior.
2. Inputs configure it from template state.
3. Host listeners/bindings integrate with element events and attributes.
4. Injected services may provide scoped UI context.
5. DestroyRef removes external listeners, observers, timers, or subscriptions.

### Practical interpretation

A good directive contract is small enough to explain in one sentence. If it needs large internal state, many inputs, API orchestration, and its own visual layout, reconsider a component or service. Financial input controls may be better as a full ControlValueAccessor component when they own markup and errors.

### Incorrect versus improved approach

```typescript
@HostListener('click') async pay(){ await firstValueFrom(this.http.post('/api/payments',...)); }
// A directive should not secretly own the payment workflow.
```

### Runtime mental model

1. Angular compiles the template and identifies directives, pipes, bindings, and embedded views.
2. Runtime values are evaluated during view synchronization.
3. Angular updates the host node or reconciles embedded views using the declared identity and state.
4. Child components, subscriptions, and DOM resources follow the lifetime of the view that owns them.
5. Browser behavior remains a user-experience layer; backend policies protect money and data.

---

## 4. Realistic payment or banking example

A `appMoneyInput` directive can normalize pasted decimal separators, preserve caret behavior, and expose accessible invalid state. It must not decide daily transfer limits; the reactive form can give a usability hint and the .NET API enforces the real rule.

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

1. Repeated behavior is identified and documented.
2. Directive preserves native input and ControlValueAccessor behavior.
3. Locale-specific display logic is tested.
4. Component maps normalized value into a command.
5. API validates decimal precision, currency, limits, and authorization.

### Failure flow

1. Directive rewrites value on every keydown.
2. Caret jumps and screen-reader behavior breaks.
3. It silently rounds a payment amount differently from API.
4. Submission fails or pays an unexpected amount.
5. Separate display normalization from authoritative numeric rules.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
@Directive({selector:'input[appMoneyInput]'})
export class MoneyInputDirective {
 readonly scale=input(2);
 private readonly el=inject(ElementRef<HTMLInputElement>);
 @HostListener('paste',['$event']) onPaste(e:ClipboardEvent){
   // validate/normalize safely; do not execute business rules or call API
 }
 @HostListener('blur') onBlur(){ /* format display without changing meaning */ }
}
```

### ASP.NET Core boundary

```csharp
public sealed record CreateTransferRequest(decimal Amount,string Currency);

RuleFor(x=>x.Amount).GreaterThan(0).ScalePrecision(2,18);
// Domain service additionally checks account/currency/limit rules.
```

### How to test it

Test typing, paste, selection/caret, blur, IME input, mobile keyboard, locale, null, disabled/read-only, screen reader attributes, and teardown. Verify backend accepts/rejects exact decimal boundary values.

### Production verification

- Exercise refresh, rapid interaction, delayed API responses, and navigation away.
- Verify keyboard, focus, labels, disabled state, and screen-reader semantics.
- Profile a realistic list rather than a ten-row demo.
- Test 401, 403, 404, 409, validation failure, and transient server failure.
- Confirm the browser never receives secrets merely hidden by a directive or pipe.
- Confirm logs use correlation IDs and avoid account, card, and payment credentials.

---

## 7. Important design decisions

- Native behavior first.
- One responsibility.
- CVA component if markup/control contract is owned.
- Do not silently change monetary meaning.
- Keep API validation authoritative.

A senior answer should state the rejected alternative and its failure mode. Naming an Angular API is not enough; explain identity, ownership, lifetime, performance, accessibility, and server authority.

---

## 8. When to use and when not to use it

### Use it when

- Repeated host/view behavior with a clear opt-in selector.

### Avoid or reconsider it when

- One consumer, visual component ownership, business workflow, or features native HTML handles.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Custom directive | Adds reusable host/view behavior |
| CVA component | Owns a reusable form control UI |
| Service | Non-DOM logic |
| CSS class | Appearance without behavior |

---

## 10. Common production mistakes

- Reinventing native controls.
- API calls in directive.
- Breaking form/touched state.
- No IME/accessibility testing.
- Silent financial rounding.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

Three teams need a currency-entry behavior. Decide between directive, pipe, and ControlValueAccessor component, including precision and server-validation boundaries.

---

## Quick revision card

- **Core answer:** Create a custom directive when several elements need the same focused host or view behavior and a component would add the wrong visual abstraction. First check whether native HTML, CSS, Angular control flow, or an existing accessible component already solves it.
- **Memory rule:** Create a directive for reusable behavior, not reusable business workflow.
- **Senior checks:** identity, ownership, lifetime, accessibility, performance, and backend authority.
- **Failure checks:** mutation, stale view, duplicate action, unauthorized API call, and contract drift.

## Official Angular references

- [Control flow](https://angular.dev/guide/templates/control-flow)
- [Structural directives](https://angular.dev/guide/directives/structural-directives)
- [Pipes](https://angular.dev/guide/templates/pipes)
