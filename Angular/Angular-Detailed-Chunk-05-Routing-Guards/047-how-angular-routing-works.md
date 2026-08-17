# How Does Angular Routing Work?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

A single-page application must map browser URLs to views, support history and deep links, and change screens without full document reloads while retaining meaningful navigation state.

---

## 2. Explain it in simple language

Angular Router compares the URL with ordered route definitions, runs matching/guards/resolvers, lazy-loads needed code, and activates components in router outlets. RouterLink and Router navigation update browser history without reloading the page.

### Memory rule

> **URL → match → checks → activate outlet.**

### Interview-ready answer

> Angular Router compares the URL with ordered route definitions, runs matching/guards/resolvers, lazy-loads needed code, and activates components in router outlets. RouterLink and Router navigation update browser history without reloading the page. In production I would also explain deep-link refresh, navigation cancellation, route/provider lifetime, failure behavior, and why ASP.NET Core remains the authorization boundary.

---

## 3. How does it work internally?

1. Navigation starts from link, code, popstate, or initial URL.
2. Router parses the URL into an UrlTree and recognizes the first matching route tree.
3. It lazy-loads configuration and runs guards/resolvers.
4. If accepted, it deactivates obsolete views and activates new components/outlets.
5. It updates location/history and emits router events; canceled/error navigation follows another path.

### Practical interpretation

Routes are ordered; first match wins. The URL is application state, not authorization. Browser/server coordination matters on initial load and refresh. Observe NavigationCancel/Error and chunk-load failures instead of assuming every navigation completes.

### Incorrect versus improved approach

```typescript
<a href="/payments">Payments</a> // may cause full document navigation
// Use routerLink for normal in-app SPA navigation.
```

### Navigation mental model

1. A link, browser history event, or programmatic call starts navigation.
2. Angular parses the URL and recognizes the first matching route tree.
3. Lazy configuration loads, then guards/resolvers make navigation decisions.
4. The router deactivates obsolete views and activates new components in outlets.
5. Components react to parameter changes and call APIs that independently authorize every resource/action.

---

## 4. Realistic payment or banking example

`/accounts/42/transactions?status=pending` matches an account shell, transaction child, account ID parameter, and status query. The UI then calls authorized APIs; the router never grants access to account 42.

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

1. Deep link reaches hosting fallback/index.html.
2. Router recognizes routes.
3. Guard resolves known session state.
4. Lazy feature loads and component activates.
5. API returns authorized data.

### Failure flow

1. Host lacks SPA fallback.
2. Refresh asks server for a physical `/accounts/42` file.
3. Server returns 404 before Angular loads.
4. Or guard/API errors are conflated with routing.
5. Configure layers separately.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
export const appConfig:ApplicationConfig={providers:[
 provideRouter(routes,withComponentInputBinding(),withInMemoryScrolling({scrollPositionRestoration:'enabled'}))
]};

<a [routerLink]="['/accounts',account.id,'transactions']"
   [queryParams]="{status:'pending'}">Pending</a>
<router-outlet />
```

### ASP.NET Core boundary

```csharp
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapControllers();
app.MapFallbackToFile("index.html"); // exclude API/static handling by ordering/pattern
```

### How to test it

Test deep links, links, programmatic navigation, back/forward, redirects, guards, lazy-load errors, scroll/title behavior, and deployed-host refresh. Assert API security separately.

### Production verification

- Open the URL directly and refresh it through the deployed web server.
- Use back, forward, sibling navigation, malformed parameters, and unknown routes.
- Simulate slow lazy chunks, delayed APIs, navigation cancellation, and offline failure.
- Test anonymous, expired-token, forbidden, missing-resource, and concurrency scenarios.
- Verify no token, full account number, or sensitive payment detail appears in a URL.
- Confirm API authorization still works when guards/menu visibility are bypassed.

---

## 7. Important design decisions

- Design stable meaningful URLs.
- Order routes deliberately.
- Choose route boundaries/lifetimes.
- Handle navigation cancellation/error.
- Configure hosting fallback safely.

A technical-lead answer must separate URL/view orchestration from security. The browser is controlled by the user, so route guards and hidden links can never prove authorization.

---

## 8. When to use and when not to use it

### Use it when

- Multi-view SPAs needing deep links, history, lazy loading, and nested layouts.

### Avoid or reconsider it when

- Using the router for tiny local component toggles that are not navigation state.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Route | URL-to-view configuration |
| Router outlet | Activation placeholder |
| RouterLink | Declarative SPA navigation |
| ActivatedRoute | Current route data/streams |

---

## 10. Common production mistakes

- Wildcard ordering.
- href for every internal link.
- No server fallback.
- Router as security boundary.
- Ignoring navigation errors.

> **The router controls navigation; the API controls access.**

---

## 11. Scenario-based interview question

Explain the complete sequence when a user refreshes a guarded, lazy `/payments/123/history` URL in production.

---

## Quick revision card

- **Core answer:** Angular Router compares the URL with ordered route definitions, runs matching/guards/resolvers, lazy-loads needed code, and activates components in router outlets. RouterLink and Router navigation update browser history without reloading the page.
- **Memory rule:** URL → match → checks → activate outlet.
- **Design checks:** URL contract, route order, lifetime, refresh, cancellation, and API authority.
- **Failure checks:** deep link, stale response, unauthorized call, invalid parameter, and chunk failure.

## Official Angular references

- [Angular routing](https://angular.dev/guide/routing)
- [Define routes](https://angular.dev/guide/routing/define-routes)
- [Route guards](https://angular.dev/guide/routing/route-guards)
- [Lazy-loaded routes](https://angular.dev/best-practices/performance/lazy-loaded-routes)
- [Testing routing and navigation](https://angular.dev/guide/routing/testing)
