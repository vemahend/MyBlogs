# What Are Directives in Angular?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

Many UI concerns alter an element or the view structure without deserving a new wrapper component. Directives provide a framework-owned extension point instead of ad-hoc DOM querying and event wiring.

---

## 2. Explain it in simple language

A directive is a class Angular attaches to matching template elements. Attribute directives change host behavior or appearance; structural directives control whether and how embedded views are created. A component is a special directive with its own template.

### Memory rule

> **Directive attaches; component renders; structural directive reshapes.**

### Interview-ready answer

> A directive is a class Angular attaches to matching template elements. Attribute directives change host behavior or appearance; structural directives control whether and how embedded views are created. A component is a special directive with its own template. In production I would also explain who owns the state, how the view behaves during change and destruction, and which validation or authorization must remain authoritative in ASP.NET Core.

---

## 3. How does it work internally?

1. The compiler finds selectors and records directive definitions.
2. Angular creates directive instances when matching nodes are instantiated.
3. Dependency injection supplies ElementRef, TemplateRef, ViewContainerRef, or services from the local context.
4. Inputs, host bindings, and host listeners connect template state and DOM behavior.
5. Directive teardown follows view teardown.

### Practical interpretation

Use ElementRef cautiously and prefer Renderer2 or host bindings where DOM abstraction matters. Structural directives receive a template and decide when to instantiate it. Do not combine multiple structural-directive shorthand forms on one element; use modern blocks or `ng-container`/nested templates.

### Incorrect versus improved approach

```typescript
// Avoid direct document queries and hidden security assumptions
document.querySelectorAll('.approve').forEach(...);
// Prefer a directive for UI behavior and an API policy for authority.
```

### Runtime mental model

1. Angular compiles the template and identifies directives, pipes, bindings, and embedded views.
2. Runtime values are evaluated during view synchronization.
3. Angular updates the host node or reconciles embedded views using the declared identity and state.
4. Child components, subscriptions, and DOM resources follow the lifetime of the view that owns them.
5. Browser behavior remains a user-experience layer; backend policies protect money and data.

---

## 4. Realistic payment or banking example

`appHasPermission` can remove an Approve button when the current UI entitlement lacks `payments.approve`. This prevents confusing navigation, but the approve endpoint must authorize the user and validate payment status again.

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

1. Entitlements load into a scoped permission service.
2. Structural directive evaluates the required permission.
3. Authorized user receives the embedded button view.
4. Click calls the component workflow.
5. API independently authorizes and approves.

### Failure flow

1. Directive is treated as the security boundary.
2. Attacker calls endpoint directly.
3. API trusts the client and approves unauthorized payment.
4. Audit detects a privilege breach.
5. Authorization must be enforced in ASP.NET Core policy/handler.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
@Directive({selector:'[appHasPermission]'})
export class HasPermissionDirective {
 private readonly tpl=inject(TemplateRef<unknown>);
 private readonly view=inject(ViewContainerRef);
 private readonly auth=inject(PermissionStore);
 readonly permission=input.required<string>({alias:'appHasPermission'});
 private readonly visible=effect(()=>{
   this.view.clear();
   if(this.auth.has(this.permission())) this.view.createEmbeddedView(this.tpl);
 });
}

<button *appHasPermission="'payments.approve'">Approve</button>
```

### ASP.NET Core boundary

```csharp
builder.Services.AddAuthorization(o =>
 o.AddPolicy("ApprovePayments",p=>p.RequireClaim("permission","payments.approve")));

[Authorize(Policy="ApprovePayments")]
[HttpPost("{id:guid}/approve")]
public Task<IActionResult> Approve(Guid id,CancellationToken ct) => workflow.Approve(id,User,ct);
```

### How to test it

Render a host with and without permission; assert view creation/removal and cleanup. Then call the API under allowed and denied principals to prove UI and security layers are independent.

### Production verification

- Exercise refresh, rapid interaction, delayed API responses, and navigation away.
- Verify keyboard, focus, labels, disabled state, and screen-reader semantics.
- Profile a realistic list rather than a ten-row demo.
- Test 401, 403, 404, 409, validation failure, and transient server failure.
- Confirm the browser never receives secrets merely hidden by a directive or pipe.
- Confirm logs use correlation IDs and avoid account, card, and payment credentials.

---

## 7. Important design decisions

- Pick attribute versus structural semantics deliberately.
- Keep selector specific to avoid accidental matches.
- Keep input aliases clear.
- Avoid direct global DOM access.
- Make server authority explicit in documentation.

A senior answer should state the rejected alternative and its failure mode. Naming an Angular API is not enough; explain identity, ownership, lifetime, performance, accessibility, and server authority.

---

## 8. When to use and when not to use it

### Use it when

- Reusable element behavior or view-creation policy.

### Avoid or reconsider it when

- A new visual unit needing its own template, or domain workflow/business authorization.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Attribute directive | Changes host behavior/attributes |
| Structural directive | Creates/removes embedded views |
| Component | Directive with template |
| Decorator | TypeScript metadata mechanism, not UI behavior |

---

## 10. Common production mistakes

- DOM manipulation outside Angular.
- Overbroad selector.
- Multiple responsibilities.
- No teardown.
- Client permission treated as security.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

Your team wants a permission directive for action buttons. Explain its internal design, reactive updates, and the exact security limitation.

---

## Quick revision card

- **Core answer:** A directive is a class Angular attaches to matching template elements. Attribute directives change host behavior or appearance; structural directives control whether and how embedded views are created. A component is a special directive with its own template.
- **Memory rule:** Directive attaches; component renders; structural directive reshapes.
- **Senior checks:** identity, ownership, lifetime, accessibility, performance, and backend authority.
- **Failure checks:** mutation, stale view, duplicate action, unauthorized API call, and contract drift.

## Official Angular references

- [Control flow](https://angular.dev/guide/templates/control-flow)
- [Structural directives](https://angular.dev/guide/directives/structural-directives)
- [Pipes](https://angular.dev/guide/templates/pipes)
