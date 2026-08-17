# How Do You Read Query String Values in Angular?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

Components need optional URL values for filters, paging, tabs, and return navigation. Reading once from a snapshot can become stale when Angular reuses the same component for a new query string.

---

## 2. Explain it in simple language

Use `ActivatedRoute.queryParamMap` reactively, or router component input binding when configured. Parse strings into validated domain values, apply defaults, and react to changes with cancellation for dependent API calls.

### Memory rule

> **URL values are untrusted strings—parse, validate, react.**

### Interview-ready answer

> Use `ActivatedRoute.queryParamMap` reactively, or router component input binding when configured. Parse strings into validated domain values, apply defaults, and react to changes with cancellation for dependent API calls. In production I would also explain deep-link refresh, navigation cancellation, route/provider lifetime, failure behavior, and why ASP.NET Core remains the authorization boundary.

---

## 3. How does it work internally?

1. Router parses the URL and creates query parameter maps.
2. ActivatedRoute publishes changes without necessarily recreating the component.
3. RxJS operators map strings to typed state and remove duplicates.
4. switchMap cancels stale reads when a query changes.
5. The latest validated result updates the view.

### Practical interpretation

`queryParams` gives a plain object; `queryParamMap` provides `get`, `getAll`, and clearer absence handling. Do not use non-null assertions on user-controlled URL values. If the component truly cannot be reused, snapshot can be acceptable for a one-time read, but state the assumption.

### Incorrect versus improved approach

```typescript
ngOnInit(){this.page=Number(this.route.snapshot.queryParams['page']);}
// Snapshot is a point in time and may become stale.
```

### Navigation mental model

1. A link, browser history event, or programmatic call starts navigation.
2. Angular parses the URL and recognizes the first matching route tree.
3. Lazy configuration loads, then guards/resolvers make navigation decisions.
4. The router deactivates obsolete views and activates new components in outlets.
5. Components react to parameter changes and call APIs that independently authorize every resource/action.

---

## 4. Realistic payment or banking example

A transaction search reads status, page, and date range. Invalid dates fall back or produce a validation state; page size is capped on both client and server.

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

1. Deep link loads validated filters.
2. Query stream emits initial values.
3. API request uses normalized query.
4. Back navigation emits older parameters.
5. switchMap prevents stale result overwrite.

### Failure flow

1. Component reads `snapshot` only in ngOnInit.
2. User changes query params on the same component.
3. OnInit does not rerun.
4. Old filter/results remain.
5. Subscribe/react to queryParamMap.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
readonly results=toSignal(inject(ActivatedRoute).queryParamMap.pipe(
 map(q=>normalizeQuery({status:q.get('status'),page:q.get('page')})),
 distinctUntilChanged(sameQuery),
 switchMap(query=>this.api.search(query).pipe(
  map(data=>({kind:'ready' as const,data})),
  catchError(()=>of({kind:'error' as const}))
 ))
),{initialValue:{kind:'loading'} as SearchState});
```

### ASP.NET Core boundary

```csharp
[HttpGet]
public Task<Paged<TransactionDto>> Search([FromQuery]TransactionQuery query,CancellationToken ct)
{
 query=query with {PageSize=Math.Clamp(query.PageSize,1,100)};
 return service.SearchAuthorizedAsync(query,User,ct);
}
```

### How to test it

Navigate between two query strings without recreating the component, simulate rapid changes and delayed responses, test duplicate/missing/malformed values, and verify the server caps query cost.

### Production verification

- Open the URL directly and refresh it through the deployed web server.
- Use back, forward, sibling navigation, malformed parameters, and unknown routes.
- Simulate slow lazy chunks, delayed APIs, navigation cancellation, and offline failure.
- Test anonymous, expired-token, forbidden, missing-resource, and concurrency scenarios.
- Verify no token, full account number, or sensitive payment detail appears in a URL.
- Confirm API authorization still works when guards/menu visibility are bypassed.

---

## 7. Important design decisions

- Prefer ParamMap.
- Parse into typed state once.
- Use defaults/canonical values.
- Cancel stale API calls.
- Apply server-side bounds.

A technical-lead answer must separate URL/view orchestration from security. The browser is controlled by the user, so route guards and hidden links can never prove authorization.

---

## 8. When to use and when not to use it

### Use it when

- Reactive optional URL state.

### Avoid or reconsider it when

- Blind casts, unvalidated numbers/dates, or snapshots when values can change.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| queryParamMap | Reactive optional URL values |
| paramMap | Reactive path values |
| snapshot | One point-in-time view |
| component input binding | Router binds route data to inputs |

---

## 10. Common production mistakes

- Snapshot staleness.
- NaN/invalid date propagation.
- No getAll for repeated params.
- Nested subscriptions.
- Unbounded page size.

> **The router controls navigation; the API controls access.**

---

## 11. Scenario-based interview question

Changing `?status=pending` to `?status=settled` leaves the same component showing old data. Explain reuse, snapshot staleness, and a cancellation-safe solution.

---

## Quick revision card

- **Core answer:** Use `ActivatedRoute.queryParamMap` reactively, or router component input binding when configured. Parse strings into validated domain values, apply defaults, and react to changes with cancellation for dependent API calls.
- **Memory rule:** URL values are untrusted strings—parse, validate, react.
- **Design checks:** URL contract, route order, lifetime, refresh, cancellation, and API authority.
- **Failure checks:** deep link, stale response, unauthorized call, invalid parameter, and chunk failure.

## Official Angular references

- [Angular routing](https://angular.dev/guide/routing)
- [Define routes](https://angular.dev/guide/routing/define-routes)
- [Route guards](https://angular.dev/guide/routing/route-guards)
- [Lazy-loaded routes](https://angular.dev/best-practices/performance/lazy-loaded-routes)
- [Testing routing and navigation](https://angular.dev/guide/routing/testing)
