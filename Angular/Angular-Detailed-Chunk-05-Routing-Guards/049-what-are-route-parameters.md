# What Are Route Parameters?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

The same screen must display different resources using stable, bookmarkable URLs. Creating one route per account/payment is impossible, and hiding identity only in component state breaks refresh and sharing.

---

## 2. Explain it in simple language

A route parameter is a dynamic path segment declared with a colon, such as `payments/:paymentId`. Read it reactively from `paramMap` or bind it to a component input, validate its format, and use it only as an identifier—not proof of access.

### Memory rule

> **The URL names the resource; the API decides whether you may see it.**

### Interview-ready answer

> A route parameter is a dynamic path segment declared with a colon, such as `payments/:paymentId`. Read it reactively from `paramMap` or bind it to a component input, validate its format, and use it only as an identifier—not proof of access. In production I would also explain deep-link refresh, navigation cancellation, route/provider lifetime, failure behavior, and why ASP.NET Core remains the authorization boundary.

---

## 3. How does it work internally?

1. Route matcher consumes static and parameter segments.
2. Captured strings are stored in the ActivatedRoute parameter map.
3. Navigation to another ID may reuse the same component.
4. Reactive parameter handling starts a new data request and cancels stale work.
5. API looks up the resource within the current user/tenant authorization scope.

### Practical interpretation

Path parameters represent essential resource hierarchy; query parameters represent optional view modifiers. IDs do not need reversible “encryption” to be secure—unguessable identifiers reduce enumeration but never replace object-level authorization.

### Incorrect versus improved approach

```typescript
this.api.get(this.route.snapshot.params['paymentId']); // stale if component reused
// React to paramMap and authorize object access server-side.
```

### Navigation mental model

1. A link, browser history event, or programmatic call starts navigation.
2. Angular parses the URL and recognizes the first matching route tree.
3. Lazy configuration loads, then guards/resolvers make navigation decisions.
4. The router deactivates obsolete views and activates new components in outlets.
5. Components react to parameter changes and call APIs that independently authorize every resource/action.

---

## 4. Realistic payment or banking example

`/payments/7b.../history` carries paymentId. A user can edit the URL, so the API must prevent insecure direct object reference by querying only payments accessible to that principal.

### Full-stack responsibility split

| Angular Router | ASP.NET Core API |
|---|---|
| Match URL and render a view | Authenticate and authorize every request |
| Preserve safe navigation/filter state | Validate resource ownership and commands |
| Redirect or warn during navigation | Enforce idempotency and concurrency |
| Cancel stale reads and show failures | Return safe 401/403/404/409 responses |
| Improve user experience with guards | Protect money and data even if JavaScript is modified |

---

## 5. Successful flow and failure flow

### Successful flow

1. Parameter is syntactically validated.
2. Reactive stream emits ID.
3. switchMap requests the latest payment.
4. API performs object-level authorization.
5. 404/403/error state is rendered safely.

### Failure flow

1. Component trusts paymentId because it came from a guarded route.
2. Attacker changes ID in devtools/address bar.
3. API queries by ID without user scope.
4. Another customer’s payment is exposed.
5. Fix backend object authorization.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
readonly payment=toSignal(inject(ActivatedRoute).paramMap.pipe(
 map(p=>p.get('paymentId')),
 filter((id):id is string=>isGuid(id)),
 distinctUntilChanged(),
 switchMap(id=>this.api.get(id))
),{initialValue:null});

// Route: {path:'payments/:paymentId',component:PaymentPage}
```

### ASP.NET Core boundary

```csharp
[Authorize]
[HttpGet("{paymentId:guid}")]
public async Task<IActionResult> Get(Guid paymentId,CancellationToken ct)
{
 var result=await db.Payments.Where(p=>p.Id==paymentId && p.CustomerId==User.CustomerId()).SingleOrDefaultAsync(ct);
 return result is null?NotFound():Ok(mapper.ToDto(result));
}
```

### How to test it

Navigate from ID A to B using the same component, delay A so it returns last, and ensure B remains displayed. Test malformed IDs and cross-customer IDs against the API.

### Production verification

- Open the URL directly and refresh it through the deployed web server.
- Use back, forward, sibling navigation, malformed parameters, and unknown routes.
- Simulate slow lazy chunks, delayed APIs, navigation cancellation, and offline failure.
- Test anonymous, expired-token, forbidden, missing-resource, and concurrency scenarios.
- Verify no token, full account number, or sensitive payment detail appears in a URL.
- Confirm API authorization still works when guards/menu visibility are bypassed.

---

## 7. Important design decisions

- Stable opaque identifiers.
- Reactive reuse handling.
- Cancel stale loads.
- Object-level server authorization.
- Safe not-found semantics.

A technical-lead answer must separate URL/view orchestration from security. The browser is controlled by the user, so route guards and hidden links can never prove authorization.

---

## 8. When to use and when not to use it

### Use it when

- Resource identity and meaningful URL hierarchy.

### Avoid or reconsider it when

- Secrets, large payloads, or optional filters better represented as query parameters.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Route parameter | Required path identity |
| Query parameter | Optional filter/view state |
| Matrix parameter | Segment-specific optional data |
| Route data | Static/resolved metadata |

---

## 10. Common production mistakes

- Snapshot staleness.
- Trusting ID ownership.
- Sequential nested subscriptions.
- Sensitive values in path.
- No malformed-ID handling.

> **The router controls navigation; the API controls access.**

---

## 11. Scenario-based interview question

A user changes a payment ID in the URL and sees another customer’s payment. Explain why guards and opaque IDs are insufficient and give the API query fix.

---

## Quick revision card

- **Core answer:** A route parameter is a dynamic path segment declared with a colon, such as `payments/:paymentId`. Read it reactively from `paramMap` or bind it to a component input, validate its format, and use it only as an identifier—not proof of access.
- **Memory rule:** The URL names the resource; the API decides whether you may see it.
- **Design checks:** URL contract, route order, lifetime, refresh, cancellation, and API authority.
- **Failure checks:** deep link, stale response, unauthorized call, invalid parameter, and chunk failure.

## Official Angular references

- [Angular routing](https://angular.dev/guide/routing)
- [Define routes](https://angular.dev/guide/routing/define-routes)
- [Route guards](https://angular.dev/guide/routing/route-guards)
- [Lazy-loaded routes](https://angular.dev/best-practices/performance/lazy-loaded-routes)
- [Testing routing and navigation](https://angular.dev/guide/routing/testing)
