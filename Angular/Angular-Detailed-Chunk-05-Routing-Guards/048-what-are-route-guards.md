# What Are Route Guards?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

Navigation sometimes requires a decision: user session ready, feature enabled, child section allowed, or unsaved changes confirmed. Components should not briefly render and then redirect themselves.

---

## 2. Explain it in simple language

Route guards are functions that participate in matching, activation, child activation, or deactivation. They return a boolean, UrlTree/RedirectCommand, Promise, or Observable. They control navigation UX, not backend security.

### Memory rule

> **A guard decides navigation, not authorization truth.**

### Interview-ready answer

> Route guards are functions that participate in matching, activation, child activation, or deactivation. They return a boolean, UrlTree/RedirectCommand, Promise, or Observable. They control navigation UX, not backend security. In production I would also explain deep-link refresh, navigation cancellation, route/provider lifetime, failure behavior, and why ASP.NET Core remains the authorization boundary.

---

## 3. How does it work internally?

1. Router reaches the relevant navigation phase.
2. Guard executes in the route injection context.
3. It reads route snapshots and injected state/services.
4. For async values the router uses the first emission and unsubscribes.
5. True continues; false cancels (or CanMatch falls through); UrlTree/RedirectCommand redirects.

### Practical interpretation

Current primary guard types are CanActivate, CanActivateChild, CanDeactivate, and CanMatch. Resolver is related but loads data rather than granting navigation. CanMatch false asks the router to try another matching definition, which is useful for conditional routes.

### Incorrect versus improved approach

```typescript
auth.load().subscribe(ok=>{if(ok)router.navigateByUrl(state.url)}); return false;
// Return the Observable/UrlTree to the router.
```

### Navigation mental model

1. A link, browser history event, or programmatic call starts navigation.
2. Angular parses the URL and recognizes the first matching route tree.
3. Lazy configuration loads, then guards/resolvers make navigation decisions.
4. The router deactivates obsolete views and activates new components in outlets.
5. Components react to parameter changes and call APIs that independently authorize every resource/action.

---

## 4. Realistic payment or banking example

CanMatch selects a new payment dashboard only for a feature flag. CanActivate checks logged-in UI state. CanDeactivate warns about an unsaved transfer. Every payment API independently authorizes and validates.

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

1. Guard has one navigation responsibility.
2. It returns a declarative redirect when necessary.
3. Async source completes/emits once.
4. Navigation produces predictable URL/history.
5. Server denies forbidden direct requests.

### Failure flow

1. Guard subscribes internally and immediately returns false.
2. Result arrives after navigation canceled.
3. Or it calls router.navigate and returns false, causing competing navigations.
4. Or role check exists only in browser.
5. Return the async guard result/UrlTree and enforce API policy.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
export const permissionGuard:CanActivateFn=(route,state)=>{
 const auth=inject(AuthStore),router=inject(Router);
 const permission=route.data['permission'] as string;
 return auth.permissionsReady$.pipe(take(1),map(()=>
  auth.has(permission)?true:router.createUrlTree(['/forbidden'])
 ));
};
```

### ASP.NET Core boundary

```csharp
[Authorize(Policy="ViewPayments")]
[HttpGet]
public Task<IReadOnlyList<PaymentDto>> Get(CancellationToken ct)
 => query.ForUserAsync(User,ct);
```

### How to test it

Test each return branch and asynchronous race with RouterTestingHarness. Verify redirects and final URLs, not private guard calls only. Test backend authorization with forged/direct requests.

### Production verification

- Open the URL directly and refresh it through the deployed web server.
- Use back, forward, sibling navigation, malformed parameters, and unknown routes.
- Simulate slow lazy chunks, delayed APIs, navigation cancellation, and offline failure.
- Test anonymous, expired-token, forbidden, missing-resource, and concurrency scenarios.
- Verify no token, full account number, or sensitive payment detail appears in a URL.
- Confirm API authorization still works when guards/menu visibility are bypassed.

---

## 7. Important design decisions

- One responsibility per guard.
- Return, do not imperatively navigate.
- Use finite async sources.
- Handle unknown auth state.
- Never replace server authorization.

A technical-lead answer must separate URL/view orchestration from security. The browser is controlled by the user, so route guards and hidden links can never prove authorization.

---

## 8. When to use and when not to use it

### Use it when

- Login UX, feature matching, section access UX, and unsaved-change prompts.

### Avoid or reconsider it when

- Data fetching better suited to component/facade/resolver or business/security enforcement.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| CanActivate | Enter one route |
| CanActivateChild | Enter descendants |
| CanDeactivate | Leave current route |
| CanMatch | Choose whether route definition matches |

---

## 10. Common production mistakes

- Internal subscribe.
- false plus navigate.
- Never-emitting stream.
- Guard depends on component side effect.
- Client-only role security.

> **The router controls navigation; the API controls access.**

---

## 11. Scenario-based interview question

A guard works sometimes but hangs navigation after refresh. Its Observable never emits until a component loads. Diagnose the dependency cycle and redesign session restoration.

---

## Quick revision card

- **Core answer:** Route guards are functions that participate in matching, activation, child activation, or deactivation. They return a boolean, UrlTree/RedirectCommand, Promise, or Observable. They control navigation UX, not backend security.
- **Memory rule:** A guard decides navigation, not authorization truth.
- **Design checks:** URL contract, route order, lifetime, refresh, cancellation, and API authority.
- **Failure checks:** deep link, stale response, unauthorized call, invalid parameter, and chunk failure.

## Official Angular references

- [Angular routing](https://angular.dev/guide/routing)
- [Define routes](https://angular.dev/guide/routing/define-routes)
- [Route guards](https://angular.dev/guide/routing/route-guards)
- [Lazy-loaded routes](https://angular.dev/best-practices/performance/lazy-loaded-routes)
- [Testing routing and navigation](https://angular.dev/guide/routing/testing)
