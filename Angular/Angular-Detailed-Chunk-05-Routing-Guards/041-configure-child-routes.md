# How Do You Configure Child Routes?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

A feature often has a stable shell—navigation, account context, permissions, and layout—while its inner screen changes. Duplicating the shell for every URL causes inconsistent state and markup.

---

## 2. Explain it in simple language

Put child route definitions in the parent route’s `children` array and place a `router-outlet` in the parent component. The parent remains active while the router renders the matched child in that outlet.

### Memory rule

> **Parent owns the shell; child fills the outlet.**

### Interview-ready answer

> Put child route definitions in the parent route’s `children` array and place a `router-outlet` in the parent component. The parent remains active while the router renders the matched child in that outlet. In production I would also explain deep-link refresh, navigation cancellation, route/provider lifetime, failure behavior, and why ASP.NET Core remains the authorization boundary.

---

## 3. How does it work internally?

1. Router parses URL segments from left to right.
2. The parent route consumes its segment and creates the parent component/injector.
3. Remaining segments are matched against `children`.
4. The child component is created inside the parent router outlet.
5. Navigation between siblings can reuse the parent while destroying and replacing the child view.

### Practical interpretation

Child paths are relative and usually omit leading slashes. Decide whether the parent should remain alive across siblings, where providers belong, and whether children need `canActivateChild`. Route parameters may live on the parent, so use component input binding or traverse/inherit parameters deliberately rather than assuming every ActivatedRoute contains the same values.

### Incorrect versus improved approach

```typescript
{path:'payments/:id/history',component:HistoryPage} // repeated shells everywhere
// Prefer a parent shell with cohesive child routes.
```

### Navigation mental model

1. A link, browser history event, or programmatic call starts navigation.
2. Angular parses the URL and recognizes the first matching route tree.
3. Lazy configuration loads, then guards/resolvers make navigation decisions.
4. The router deactivates obsolete views and activates new components in outlets.
5. Components react to parameter changes and call APIs that independently authorize every resource/action.

---

## 4. Realistic payment or banking example

`/payments/:paymentId` renders PaymentShell. Child URLs `summary`, `history`, and `approve` render inside it. The shell owns safe payment context; each endpoint still verifies user access to that payment.

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

1. Router matches payment parent and ID.
2. Shell loads authorized summary context.
3. Default child redirects to summary.
4. Tab navigation changes only child outlet.
5. API authorizes each child request.

### Failure flow

1. Parent template omits router-outlet.
2. URL matches, but child has nowhere to render.
3. Developers duplicate the shell in every component.
4. State and guards drift.
5. Add one shell outlet and cohesive child config.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
export const paymentRoutes:Routes=[{
 path:':paymentId', component:PaymentShell,
 canActivate:[paymentAccessGuard],
 children:[
  {path:'',redirectTo:'summary',pathMatch:'full'},
  {path:'summary',loadComponent:()=>import('./summary.page').then(m=>m.SummaryPage)},
  {path:'history',loadComponent:()=>import('./history.page').then(m=>m.HistoryPage)},
  {path:'approve',loadComponent:()=>import('./approve.page').then(m=>m.ApprovePage)}
 ]
}];

// PaymentShell template: <nav>...</nav><router-outlet />
```

### ASP.NET Core boundary

```csharp
[Authorize]
[HttpGet("{paymentId:guid}/history")]
public Task<IActionResult> History(Guid paymentId,CancellationToken ct)
 => queries.GetAuthorizedHistoryAsync(paymentId,User,ct);
```

### How to test it

Use RouterTestingHarness to navigate to the parent default and every child. Assert the shell remains, the right child appears, invalid paths hit the feature/global 404, and API access is still denied for an unauthorized payment.

### Production verification

- Open the URL directly and refresh it through the deployed web server.
- Use back, forward, sibling navigation, malformed parameters, and unknown routes.
- Simulate slow lazy chunks, delayed APIs, navigation cancellation, and offline failure.
- Test anonymous, expired-token, forbidden, missing-resource, and concurrency scenarios.
- Verify no token, full account number, or sensitive payment detail appears in a URL.
- Confirm API authorization still works when guards/menu visibility are bypassed.

---

## 7. Important design decisions

- Use a shell only for shared layout/context.
- Place providers at the lifetime owner.
- Add a default child redirect with pathMatch full.
- Choose parent parameter access explicitly.
- Keep endpoint authorization independent.

A technical-lead answer must separate URL/view orchestration from security. The browser is controlled by the user, so route guards and hidden links can never prove authorization.

---

## 8. When to use and when not to use it

### Use it when

- Tabs, wizards, settings sections, and feature shells.

### Avoid or reconsider it when

- Nesting with no shared layout/lifetime, or deep URL hierarchies that users cannot understand.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Child route | Renders in parent outlet |
| Sibling route | Replaces at same outlet level |
| Component composition | Parent directly owns child markup |
| Named outlet | Parallel route region |

---

## 10. Common production mistakes

- Missing outlet.
- Absolute child paths.
- Wrong redirect pathMatch.
- Assuming parent parameters are local.
- Guarding UI but not API.

> **The router controls navigation; the API controls access.**

---

## 11. Scenario-based interview question

A payment shell has Summary, History, and Approval tabs. Design child routes, default navigation, provider scope, and authorization tests.

---

## Quick revision card

- **Core answer:** Put child route definitions in the parent route’s `children` array and place a `router-outlet` in the parent component. The parent remains active while the router renders the matched child in that outlet.
- **Memory rule:** Parent owns the shell; child fills the outlet.
- **Design checks:** URL contract, route order, lifetime, refresh, cancellation, and API authority.
- **Failure checks:** deep link, stale response, unauthorized call, invalid parameter, and chunk failure.

## Official Angular references

- [Angular routing](https://angular.dev/guide/routing)
- [Define routes](https://angular.dev/guide/routing/define-routes)
- [Route guards](https://angular.dev/guide/routing/route-guards)
- [Lazy-loaded routes](https://angular.dev/best-practices/performance/lazy-loaded-routes)
- [Testing routing and navigation](https://angular.dev/guide/routing/testing)
