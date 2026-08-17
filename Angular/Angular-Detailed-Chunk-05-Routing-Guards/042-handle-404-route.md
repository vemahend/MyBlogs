# How Do You Handle a 404 Route?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

Users can enter stale, mistyped, or malicious URLs. Without a fallback, navigation may appear blank or redirect misleadingly, and resource-not-found responses can be confused with route-not-found.

---

## 2. Explain it in simple language

Add a wildcard `**` route last and render a clear NotFound page. Separately handle an API 404 for a valid route whose resource does not exist or is not visible to the current user.

### Memory rule

> **Unknown URL and missing resource are two different 404s.**

### Interview-ready answer

> Add a wildcard `**` route last and render a clear NotFound page. Separately handle an API 404 for a valid route whose resource does not exist or is not visible to the current user. In production I would also explain deep-link refresh, navigation cancellation, route/provider lifetime, failure behavior, and why ASP.NET Core remains the authorization boundary.

---

## 3. How does it work internally?

1. Router evaluates routes in order using first-match-wins.
2. If no earlier route consumes the URL, the wildcard matches.
3. The NotFound component renders inside the active outlet.
4. For `/payments/:id`, the route may match while the API returns 404.
5. The page/facade maps that resource failure to an appropriate state or navigation.

### Practical interpretation

An SPA fallback on the web server must still serve `index.html` for client routes such as `/payments/123`; otherwise refresh returns the server’s static 404 before Angular starts. Do not rewrite real `/api/*` 404 responses to index.html.

### Incorrect versus improved approach

```typescript
[{path:'**',component:NotFoundPage},{path:'payments',component:PaymentsPage}]
// Wildcard must be last because route order matters.
```

### Navigation mental model

1. A link, browser history event, or programmatic call starts navigation.
2. Angular parses the URL and recognizes the first matching route tree.
3. Lazy configuration loads, then guards/resolvers make navigation decisions.
4. The router deactivates obsolete views and activates new components in outlets.
5. Components react to parameter changes and call APIs that independently authorize every resource/action.

---

## 4. Realistic payment or banking example

`/unknown-page` uses the wildcard route. `/payments/abc-valid-guid` matches PaymentDetail, but the API may return 404 because the payment is missing or deliberately concealed from an unauthorized caller.

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

1. Specific routes are ordered first.
2. Wildcard is last.
3. NotFound page offers safe navigation and correlation/help details.
4. Resource page distinguishes 404 from transient failure.
5. API avoids leaking existence across authorization boundaries.

### Failure flow

1. Wildcard appears near the top.
2. It captures every URL.
3. Application looks completely broken.
4. Or all 404s redirect home, hiding broken links.
5. Fix ordering and preserve diagnostic meaning.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
export const routes:Routes=[
 {path:'',loadComponent:()=>import('./home.page').then(m=>m.HomePage)},
 {path:'payments',loadChildren:()=>import('./payments.routes').then(m=>m.PAYMENT_ROUTES)},
 {path:'not-found',loadComponent:()=>import('./not-found.page').then(m=>m.NotFoundPage)},
 {path:'**',redirectTo:'not-found'}
];
```

### ASP.NET Core boundary

```csharp
[Authorize]
[HttpGet("{id:guid}")]
public async Task<IActionResult> Get(Guid id,CancellationToken ct)
{
 var payment=await queries.GetForUserAsync(id,User,ct);
 return payment is null ? NotFound() : Ok(payment);
}
```

### How to test it

Navigate to an unknown URL, refresh it through the deployed host, and assert the NotFound page. Separately flush API 404 for a valid payment route and verify the resource-not-found UI and no data leakage.

### Production verification

- Open the URL directly and refresh it through the deployed web server.
- Use back, forward, sibling navigation, malformed parameters, and unknown routes.
- Simulate slow lazy chunks, delayed APIs, navigation cancellation, and offline failure.
- Test anonymous, expired-token, forbidden, missing-resource, and concurrency scenarios.
- Verify no token, full account number, or sensitive payment detail appears in a URL.
- Confirm API authorization still works when guards/menu visibility are bypassed.

---

## 7. Important design decisions

- Wildcard last.
- Keep API and SPA fallback rules separate.
- Preserve useful URL/context.
- Avoid existence leaks.
- Log route misses safely.

A technical-lead answer must separate URL/view orchestration from security. The browser is controlled by the user, so route guards and hidden links can never prove authorization.

---

## 8. When to use and when not to use it

### Use it when

- Every routed SPA needs a final fallback.

### Avoid or reconsider it when

- Redirecting every failure to home or intercepting API paths with SPA rewrites.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Wildcard 404 | No client route matched |
| API 404 | Route valid, resource absent/hidden |
| 403 | Identity known but action forbidden |
| Server fallback | Returns SPA shell for client routes |

---

## 10. Common production mistakes

- Wildcard first.
- Host refresh not configured.
- API rewritten to index.html.
- 404 redirected silently home.
- Sensitive existence disclosure.

> **The router controls navigation; the API controls access.**

---

## 11. Scenario-based interview question

Navigation works in-app, but refreshing `/payments/123` returns an nginx/IIS 404. Explain the frontend route and hosting rewrite fix without breaking API 404s.

---

## Quick revision card

- **Core answer:** Add a wildcard `**` route last and render a clear NotFound page. Separately handle an API 404 for a valid route whose resource does not exist or is not visible to the current user.
- **Memory rule:** Unknown URL and missing resource are two different 404s.
- **Design checks:** URL contract, route order, lifetime, refresh, cancellation, and API authority.
- **Failure checks:** deep link, stale response, unauthorized call, invalid parameter, and chunk failure.

## Official Angular references

- [Angular routing](https://angular.dev/guide/routing)
- [Define routes](https://angular.dev/guide/routing/define-routes)
- [Route guards](https://angular.dev/guide/routing/route-guards)
- [Lazy-loaded routes](https://angular.dev/best-practices/performance/lazy-loaded-routes)
- [Testing routing and navigation](https://angular.dev/guide/routing/testing)
