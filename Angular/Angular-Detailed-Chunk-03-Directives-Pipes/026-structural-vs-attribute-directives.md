# Structural vs Attribute Directives

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

Developers need to distinguish changing an existing element from changing the view structure. Choosing the wrong kind leads to wrapper components, unsafe DOM manipulation, confusing lifetimes, and brittle templates.

---

## 2. Explain it in simple language

An attribute directive changes the behavior, properties, classes, or events of an existing host element. A structural directive receives a template and creates, removes, or repeats embedded views.

### Memory rule

> **Attribute changes the host; structural changes whether a view exists.**

### Interview-ready answer

> An attribute directive changes the behavior, properties, classes, or events of an existing host element. A structural directive receives a template and creates, removes, or repeats embedded views. In production I would also explain who owns the state, how the view behaves during change and destruction, and which validation or authorization must remain authoritative in ASP.NET Core.

---

## 3. How does it work internally?

1. Attribute directive is instantiated alongside its host node.
2. It uses host bindings/listeners and injected collaborators to affect that node.
3. Structural shorthand expands to an `ng-template`.
4. TemplateRef represents the fragment; ViewContainerRef is the insertion location.
5. Creating or clearing embedded views also creates or destroys their child directives/components.

### Practical interpretation

The `*` syntax is microsyntax for a generated template, which is why only one shorthand structural directive can directly occupy an element. Modern `@if`/`@for` avoid much of that nesting. Use `ng-container` when grouping legacy structure without adding DOM.

### Incorrect versus improved approach

```typescript
<button appHasPermission="approve" style="display:none">Approve</button>
// CSS hiding is not structural removal and neither is API authorization.
```

### Runtime mental model

1. Angular compiles the template and identifies directives, pipes, bindings, and embedded views.
2. Runtime values are evaluated during view synchronization.
3. Angular updates the host node or reconciles embedded views using the declared identity and state.
4. Child components, subscriptions, and DOM resources follow the lifetime of the view that owns them.
5. Browser behavior remains a user-experience layer; backend policies protect money and data.

---

## 4. Realistic payment or banking example

`appCurrencyInput` is an attribute directive that normalizes a text input. `*appHasPermission` is structural because an unauthorized action should not be instantiated in the UI. Neither performs financial validation or authorization for the API.

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

1. Correct directive type matches intent.
2. Currency input preserves native label/focus semantics.
3. Permission directive creates view only when UI entitlement allows.
4. Lifecycle cleanup follows host/view.
5. API independently validates amount and permission.

### Failure flow

1. Attribute directive merely hides button with CSS.
2. Hidden control remains focusable or script-invocable.
3. API assumes hidden means protected.
4. Unauthorized request succeeds.
5. Use structural UI removal plus mandatory server policy.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
@Directive({selector:'input[appCurrencyInput]'})
export class CurrencyInputDirective {
 @HostListener('blur') normalize(){ /* display normalization only */ }
}

@Directive({selector:'[appHasPermission]'})
export class HasPermissionDirective {
 private tpl=inject(TemplateRef<unknown>); private vc=inject(ViewContainerRef);
 // createEmbeddedView(tpl) or clear()
}
```

### ASP.NET Core boundary

```csharp
[Authorize(Policy="CreatePayment")]
[HttpPost]
public Task<IActionResult> Create(CreatePaymentRequest request,CancellationToken ct)
 => payments.CreateValidatedAsync(request,User,ct);
```

### How to test it

For attribute directives assert host properties, events, focus, and cleanup. For structural directives assert embedded view count, content, service scope, and child destruction as the condition changes.

### Production verification

- Exercise refresh, rapid interaction, delayed API responses, and navigation away.
- Verify keyboard, focus, labels, disabled state, and screen-reader semantics.
- Profile a realistic list rather than a ten-row demo.
- Test 401, 403, 404, 409, validation failure, and transient server failure.
- Confirm the browser never receives secrets merely hidden by a directive or pipe.
- Confirm logs use correlation IDs and avoid account, card, and payment credentials.

---

## 7. Important design decisions

- Match mechanism to DOM/view intent.
- Preserve native semantics.
- Avoid unnecessary wrapper DOM.
- Keep structural context typed.
- Do not conflate rendering policy and authorization.

A senior answer should state the rejected alternative and its failure mode. Naming an Angular API is not enough; explain identity, ownership, lifetime, performance, accessibility, and server authority.

---

## 8. When to use and when not to use it

### Use it when

- Attribute for host behavior; structural for conditional/repeated/deferred fragments.

### Avoid or reconsider it when

- Using a directive where a cohesive component or native feature is clearer.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Attribute directive | Existing host remains |
| Structural directive | Embedded view lifecycle |
| @if/@for | Built-in control-flow blocks |
| Component | Own template and host |

---

## 10. Common production mistakes

- CSS hiding for security.
- Two `*` directives on one element.
- Leaking embedded views.
- Direct DOM mutation.
- Unclear directive selector.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

You need currency formatting and permission-based visibility on a payment button. Identify the correct directive types and the backend controls.

---

## Quick revision card

- **Core answer:** An attribute directive changes the behavior, properties, classes, or events of an existing host element. A structural directive receives a template and creates, removes, or repeats embedded views.
- **Memory rule:** Attribute changes the host; structural changes whether a view exists.
- **Senior checks:** identity, ownership, lifetime, accessibility, performance, and backend authority.
- **Failure checks:** mutation, stale view, duplicate action, unauthorized API call, and contract drift.

## Official Angular references

- [Control flow](https://angular.dev/guide/templates/control-flow)
- [Structural directives](https://angular.dev/guide/directives/structural-directives)
- [Pipes](https://angular.dev/guide/templates/pipes)
