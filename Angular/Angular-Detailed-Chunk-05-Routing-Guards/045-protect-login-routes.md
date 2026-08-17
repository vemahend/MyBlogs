# How Do You Protect Routes That Require Login?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

Unauthenticated users should not enter protected UI flows, and after login they should return safely to the intended page. The browser cannot be trusted as the actual authorization boundary.

---

## 2. Explain it in simple language

Use a functional route guard to check known authentication state and return `true` or a login UrlTree/RedirectCommand. Never rely on the guard alone—ASP.NET Core must validate the token and authorize every endpoint.

### Memory rule

> **Guard the navigation; authorize the API.**

### Interview-ready answer

> Use a functional route guard to check known authentication state and return `true` or a login UrlTree/RedirectCommand. Never rely on the guard alone—ASP.NET Core must validate the token and authorize every endpoint. In production I would also explain deep-link refresh, navigation cancellation, route/provider lifetime, failure behavior, and why ASP.NET Core remains the authorization boundary.

---

## 3. How does it work internally?

1. Router matches the target route.
2. CanActivate/CanMatch executes in an injection context.
3. Guard reads AuthStore, optionally waiting for session restoration.
4. It returns the first boolean/UrlTree/RedirectCommand or async result.
5. On success activation continues; on redirect the original navigation is replaced.

### Practical interpretation

Authentication asks who the user is; authorization asks what they can do. Handle page refresh while auth state is still unknown. Validate return URLs against an internal allowlist/prefix to prevent open redirects. A token’s presence is not proof it is valid.

### Incorrect versus improved approach

```typescript
if(!auth){router.navigate(['/login']);return false;}
// Prefer returning a UrlTree; do not trigger a second imperative navigation.
```

### Navigation mental model

1. A link, browser history event, or programmatic call starts navigation.
2. Angular parses the URL and recognizes the first matching route tree.
3. Lazy configuration loads, then guards/resolvers make navigation decisions.
4. The router deactivates obsolete views and activates new components in outlets.
5. Components react to parameter changes and call APIs that independently authorize every resource/action.

---

## 4. Realistic payment or banking example

A user opens `/payments/123/approve`. The guard restores session, redirects unauthenticated users to login with a validated return URL, and the API later enforces `ApprovePayments` plus payment state and concurrency.

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

1. Auth restoration reaches a known state.
2. Unauthenticated navigation returns a login UrlTree.
3. After login, return URL is restricted to same-app paths.
4. Page calls API with token.
5. API policy authorizes the action.

### Failure flow

1. Guard treats initial unknown auth as false and redirects during refresh.
2. Or returnUrl accepts an external URL.
3. Or API trusts the visible menu/guard.
4. Users see loops, open redirects, or privilege breach.
5. Model unknown/authenticated/anonymous and validate redirect.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
export const authGuard:CanActivateFn=(_,state)=>{
 const auth=inject(AuthStore), router=inject(Router);
 return auth.ready$.pipe(
  filter(Boolean),take(1),
  map(()=>auth.isAuthenticated()?true:
   router.createUrlTree(['/login'],{queryParams:{returnUrl:safeInternalPath(state.url)}}))
 );
};
```

### ASP.NET Core boundary

```csharp
builder.Services.AddAuthentication().AddJwtBearer();
builder.Services.AddAuthorization(o=>o.AddPolicy("ApprovePayments",p=>p.RequireClaim("permission","payments.approve")));

[Authorize(Policy="ApprovePayments")]
[HttpPost("{id:guid}/approve")]
public Task<IActionResult> Approve(Guid id,CancellationToken ct)=>workflow.ApproveAsync(id,User,ct);
```

### How to test it

Test anonymous, authenticated, auth-loading, expired token, malicious external returnUrl, direct API call, and insufficient permission. Use RouterTestingHarness for navigation and backend integration tests for policies.

### Production verification

- Open the URL directly and refresh it through the deployed web server.
- Use back, forward, sibling navigation, malformed parameters, and unknown routes.
- Simulate slow lazy chunks, delayed APIs, navigation cancellation, and offline failure.
- Test anonymous, expired-token, forbidden, missing-resource, and concurrency scenarios.
- Verify no token, full account number, or sensitive payment detail appears in a URL.
- Confirm API authorization still works when guards/menu visibility are bypassed.

---

## 7. Important design decisions

- Return UrlTree instead of false+navigate.
- Model unknown auth state.
- Validate return URL.
- Separate login from permission checks.
- Enforce server policy.

A technical-lead answer must separate URL/view orchestration from security. The browser is controlled by the user, so route guards and hidden links can never prove authorization.

---

## 8. When to use and when not to use it

### Use it when

- Preventing entry into authenticated UI sections and preserving safe intended navigation.

### Avoid or reconsider it when

- Using guards as sole authorization or making every guard independently refresh tokens.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| CanActivate | Controls activation |
| CanMatch | Controls route matching |
| HTTP interceptor | Adds/refreshes credentials |
| API authorization | Actual security boundary |

---

## 10. Common production mistakes

- Client-only security.
- Redirect loop.
- Open returnUrl redirect.
- Token presence check only.
- Many simultaneous refresh calls.

> **The router controls navigation; the API controls access.**

---

## 11. Scenario-based interview question

A protected route works after in-app navigation but redirects to login on browser refresh even with a valid session. Diagnose the auth-state race and secure return flow.

---

## Quick revision card

- **Core answer:** Use a functional route guard to check known authentication state and return `true` or a login UrlTree/RedirectCommand. Never rely on the guard alone—ASP.NET Core must validate the token and authorize every endpoint.
- **Memory rule:** Guard the navigation; authorize the API.
- **Design checks:** URL contract, route order, lifetime, refresh, cancellation, and API authority.
- **Failure checks:** deep link, stale response, unauthorized call, invalid parameter, and chunk failure.

## Official Angular references

- [Angular routing](https://angular.dev/guide/routing)
- [Define routes](https://angular.dev/guide/routing/define-routes)
- [Route guards](https://angular.dev/guide/routing/route-guards)
- [Lazy-loaded routes](https://angular.dev/best-practices/performance/lazy-loaded-routes)
- [Testing routing and navigation](https://angular.dev/guide/routing/testing)
