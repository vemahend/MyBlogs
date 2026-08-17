# How Do You Lazy Load Angular Routes?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

If every feature is bundled into the initial JavaScript, users download and parse code they may never use. Large banking portals suffer slower startup, especially on mobile or constrained networks.

---

## 2. Explain it in simple language

Use `loadComponent` for a standalone route component and `loadChildren` for a route collection. Dynamic import creates a separate chunk that Angular downloads when navigation needs it; selective preloading can reduce later delay.

### Memory rule

> **Eager for the landing path; lazy for feature weight.**

### Interview-ready answer

> Use `loadComponent` for a standalone route component and `loadChildren` for a route collection. Dynamic import creates a separate chunk that Angular downloads when navigation needs it; selective preloading can reduce later delay. In production I would also explain deep-link refresh, navigation cancellation, route/provider lifetime, failure behavior, and why ASP.NET Core remains the authorization boundary.

---

## 3. How does it work internally?

1. Build tool detects dynamic `import()` boundaries.
2. It emits one or more JavaScript chunks.
3. Router begins matching/navigation.
4. When lazy config/component is required, the chunk is fetched and evaluated.
5. Router continues guards/resolvers and activates the component.

### Practical interpretation

Lazy loading improves initial cost but adds first-navigation network cost. Inspect actual build output because shared imports or barrels can defeat boundaries. Preload based on likelihood, connection, role, and bundle size—not automatically everything.

### Incorrect versus improved approach

```typescript
import {ReportsPage} from './reports/reports.page';
{path:'reports',component:ReportsPage} // eager reference keeps it in initial graph
```

### Navigation mental model

1. A link, browser history event, or programmatic call starts navigation.
2. Angular parses the URL and recognizes the first matching route tree.
3. Lazy configuration loads, then guards/resolvers make navigation decisions.
4. The router deactivates obsolete views and activates new components in outlets.
5. Components react to parameter changes and call APIs that independently authorize every resource/action.

---

## 4. Realistic payment or banking example

Login and dashboard shell may be eager. Payments, disputes, reporting, and administration are lazy features. A role guard improves UX, but downloaded/not-downloaded code is not a security boundary; APIs authorize every request.

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

1. Initial bundle excludes heavy report feature.
2. User sees landing page sooner.
3. Idle-time preloading fetches likely next feature.
4. Navigation telemetry shows acceptable chunk delay.
5. API remains protected.

### Failure flow

1. Every tiny nested route is lazy.
2. Navigation triggers a waterfall of sequential chunk requests.
3. Users see repeated spinners.
4. Or one shared barrel pulls lazy feature into main bundle.
5. Rebalance boundaries and inspect bundle graph.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
export const routes:Routes=[
 {path:'',component:DashboardPage},
 {path:'payments',loadChildren:()=>import('./payments/payment.routes').then(m=>m.PAYMENT_ROUTES)},
 {path:'profile',loadComponent:()=>import('./profile/profile.page').then(m=>m.ProfilePage)}
];

bootstrapApplication(App,{providers:[provideRouter(routes,withPreloading(PreloadAllModules))]});
```

### ASP.NET Core boundary

```csharp
[Authorize]
[Route("api/payments")]
public sealed class PaymentsController:ControllerBase { /* protected independently */ }
```

### How to test it

Build production, inspect chunks and source maps, measure cold startup and first lazy navigation under throttling, test chunk-load failure/retry UX, and verify every backend endpoint rejects unauthorized access.

### Production verification

- Open the URL directly and refresh it through the deployed web server.
- Use back, forward, sibling navigation, malformed parameters, and unknown routes.
- Simulate slow lazy chunks, delayed APIs, navigation cancellation, and offline failure.
- Test anonymous, expired-token, forbidden, missing-resource, and concurrency scenarios.
- Verify no token, full account number, or sensitive payment detail appears in a URL.
- Confirm API authorization still works when guards/menu visibility are bypassed.

---

## 7. Important design decisions

- Choose feature-sized boundaries.
- Keep common dependencies genuinely shared.
- Avoid nested request waterfalls.
- Use measured preloading.
- Never treat code splitting as authorization.

A technical-lead answer must separate URL/view orchestration from security. The browser is controlled by the user, so route guards and hidden links can never prove authorization.

---

## 8. When to use and when not to use it

### Use it when

- Large, infrequently visited features and route collections.

### Avoid or reconsider it when

- Tiny critical landing screens or excessive nested boundaries.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| loadComponent | Lazy standalone component |
| loadChildren | Lazy route collection |
| Preloading | Background fetch after startup |
| @defer | Lazy template content, not route config |

---

## 10. Common production mistakes

- Eager import defeats lazy load.
- Too many micro-chunks.
- Preload everything on slow network.
- No chunk-load error state.
- Security by hidden bundle.

> **The router controls navigation; the API controls access.**

---

## 11. Scenario-based interview question

Your reports route is marked lazy but still appears in the main bundle. Describe how you would prove why and fix the dependency graph.

---

## Quick revision card

- **Core answer:** Use `loadComponent` for a standalone route component and `loadChildren` for a route collection. Dynamic import creates a separate chunk that Angular downloads when navigation needs it; selective preloading can reduce later delay.
- **Memory rule:** Eager for the landing path; lazy for feature weight.
- **Design checks:** URL contract, route order, lifetime, refresh, cancellation, and API authority.
- **Failure checks:** deep link, stale response, unauthorized call, invalid parameter, and chunk failure.

## Official Angular references

- [Angular routing](https://angular.dev/guide/routing)
- [Define routes](https://angular.dev/guide/routing/define-routes)
- [Route guards](https://angular.dev/guide/routing/route-guards)
- [Lazy-loaded routes](https://angular.dev/best-practices/performance/lazy-loaded-routes)
- [Testing routing and navigation](https://angular.dev/guide/routing/testing)
