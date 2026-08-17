# How Do You Preserve Filters or Tabs in the URL?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

If filters, sorting, pagination, or selected tabs live only in component memory, refresh, bookmark, back/forward, and shared links lose the user’s context.

---

## 2. Explain it in simple language

Store safe, serializable navigation state in query parameters, path segments, or child routes. Read it reactively and update it through the Router, usually with query parameter merging for unrelated values.

### Memory rule

> **If users should bookmark it, put it in the URL—if it is safe.**

### Interview-ready answer

> Store safe, serializable navigation state in query parameters, path segments, or child routes. Read it reactively and update it through the Router, usually with query parameter merging for unrelated values. In production I would also explain deep-link refresh, navigation cancellation, route/provider lifetime, failure behavior, and why ASP.NET Core remains the authorization boundary.

---

## 3. How does it work internally?

1. Router parses URL into an UrlTree.
2. ActivatedRoute exposes query/path parameter streams or component input binding.
3. The component maps strings into validated typed filter state.
4. Navigation creates a new UrlTree and updates browser history.
5. Back/forward emits the earlier state and the data query reruns.

### Practical interpretation

Use path/child routes when the value identifies the resource or primary view; query parameters suit optional filters/sort/page. Decide whether changes should push history or replace the current entry. Canonicalize invalid values to prevent ambiguous URLs.

### Incorrect versus improved approach

```typescript
localStorage.setItem('filters',JSON.stringify({...sensitiveData}));
// Prefer validated, non-sensitive URL state for navigation context.
```

### Navigation mental model

1. A link, browser history event, or programmatic call starts navigation.
2. Angular parses the URL and recognizes the first matching route tree.
3. Lazy configuration loads, then guards/resolvers make navigation decisions.
4. The router deactivates obsolete views and activates new components in outlets.
5. Components react to parameter changes and call APIs that independently authorize every resource/action.

---

## 4. Realistic payment or banking example

`/transactions?account=display-id&status=pending&page=2&tab=fees` is bookmarkable. Never put access tokens, full account numbers, payment notes, or sensitive search values in URLs because URLs reach history, logs, analytics, and referrers.

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

1. Component validates query values.
2. Defaults apply to missing/unknown values.
3. Router updates only after meaningful changes.
4. Back button restores previous filter.
5. API authorizes filters and limits paging.

### Failure flow

1. Every keystroke adds a history entry.
2. Sensitive beneficiary data is placed in query string.
3. Malformed page values cause huge queries.
4. Browser history becomes unusable.
5. Debounce/replace URL and validate safe values.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
const route=inject(ActivatedRoute), router=inject(Router);
readonly filters=toSignal(route.queryParamMap.pipe(map(q=>({
 status:parseStatus(q.get('status')),
 page:Math.max(1,Number(q.get('page'))||1),
 tab:parseTab(q.get('tab'))
}))));

setStatus(status:Status|null){
 router.navigate([],{relativeTo:route,queryParams:{status,page:1},queryParamsHandling:'merge',replaceUrl:true});
}
```

### ASP.NET Core boundary

```csharp
public sealed record TransactionQuery(string? Status,int Page=1,int PageSize=50);
[HttpGet]
public Task<Paged<TransactionDto>> Search([FromQuery]TransactionQuery query,CancellationToken ct)
 => service.SearchAuthorizedAsync(query,User,ct);
```

### How to test it

Start from a deep link, refresh, use back/forward, paste malformed values, change filters rapidly, and assert the exact API query. Verify secrets never appear in URL, telemetry, or referrer headers.

### Production verification

- Open the URL directly and refresh it through the deployed web server.
- Use back, forward, sibling navigation, malformed parameters, and unknown routes.
- Simulate slow lazy chunks, delayed APIs, navigation cancellation, and offline failure.
- Test anonymous, expired-token, forbidden, missing-resource, and concurrency scenarios.
- Verify no token, full account number, or sensitive payment detail appears in a URL.
- Confirm API authorization still works when guards/menu visibility are bypassed.

---

## 7. Important design decisions

- Only safe serializable state.
- Validate and canonicalize.
- Choose push versus replace history.
- Reset page when filter changes.
- Keep API limits authoritative.

A technical-lead answer must separate URL/view orchestration from security. The browser is controlled by the user, so route guards and hidden links can never prove authorization.

---

## 8. When to use and when not to use it

### Use it when

- Bookmarkable filters, sorting, pagination, tabs, and shareable view state.

### Avoid or reconsider it when

- Secrets, large drafts, ephemeral hover/modal state, or data requiring protected persistence.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Path parameter | Resource identity |
| Query parameter | Optional view/filter state |
| Child route | Navigable tab/view |
| Service store | Non-URL in-memory workflow state |

---

## 10. Common production mistakes

- Secrets in URL.
- No parsing/defaults.
- History entry per keystroke.
- Forgetting query merge.
- Trusting page size from client.

> **The router controls navigation; the API controls access.**

---

## 11. Scenario-based interview question

A transaction filter must survive refresh and back navigation without exposing sensitive account data. Design the URL contract and parsing rules.

---

## Quick revision card

- **Core answer:** Store safe, serializable navigation state in query parameters, path segments, or child routes. Read it reactively and update it through the Router, usually with query parameter merging for unrelated values.
- **Memory rule:** If users should bookmark it, put it in the URL—if it is safe.
- **Design checks:** URL contract, route order, lifetime, refresh, cancellation, and API authority.
- **Failure checks:** deep link, stale response, unauthorized call, invalid parameter, and chunk failure.

## Official Angular references

- [Angular routing](https://angular.dev/guide/routing)
- [Define routes](https://angular.dev/guide/routing/define-routes)
- [Route guards](https://angular.dev/guide/routing/route-guards)
- [Lazy-loaded routes](https://angular.dev/best-practices/performance/lazy-loaded-routes)
- [Testing routing and navigation](https://angular.dev/guide/routing/testing)
