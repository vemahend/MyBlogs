# What Is the Difference Between CanActivate and CanDeactivate?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

Some navigation decisions happen before entering a route; others happen before leaving it. Treating both the same creates lost edits, redirect loops, or components that load before access checks complete.

---

## 2. Explain it in simple language

CanActivate decides whether a target route may be entered. CanDeactivate decides whether the currently active component may be left, commonly because it has unsaved changes or an operation that requires confirmation.

### Memory rule

> **Activate protects entry; deactivate protects exit.**

### Interview-ready answer

> CanActivate decides whether a target route may be entered. CanDeactivate decides whether the currently active component may be left, commonly because it has unsaved changes or an operation that requires confirmation. In production I would also explain deep-link refresh, navigation cancellation, route/provider lifetime, failure behavior, and why ASP.NET Core remains the authorization boundary.

---

## 3. How does it work internally?

1. For target activation, router runs CanActivate with target route/state snapshots.
2. It continues, cancels, or redirects based on the return value.
3. For current-route exit, CanDeactivate receives the component instance plus current and next state.
4. It can inspect a narrow dirty-state contract and return the same guard result types.
5. Only after approval does the router destroy the old view and activate the new tree.

### Practical interpretation

CanDeactivate protects Angular router navigation, but closing the tab, crashing, or losing power is different. Use backend drafts/autosave when data durability matters. Avoid prompts when nothing meaningful changed or after a successful save.

### Incorrect versus improved approach

```typescript
canDeactivate:()=>{navigator.sendBeacon('/api/payments',...);return true;}
// Do not rely on unload/deactivation for a must-succeed financial save.
```

### Navigation mental model

1. A link, browser history event, or programmatic call starts navigation.
2. Angular parses the URL and recognizes the first matching route tree.
3. Lazy configuration loads, then guards/resolvers make navigation decisions.
4. The router deactivates obsolete views and activates new components in outlets.
5. Components react to parameter changes and call APIs that independently authorize every resource/action.

---

## 4. Realistic payment or banking example

CanActivate checks that UI session/permission state allows opening Approve Payment. CanDeactivate asks before abandoning an unsaved transfer draft. API policies still authorize approval; durable drafts should be saved explicitly, not trusted to unload timing.

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

1. Entry guard resolves known auth state.
2. Page activates.
3. User edits transfer.
4. Exit guard detects dirty state and asks once.
5. User saves/discards, then navigation proceeds.

### Failure flow

1. CanDeactivate always returns true because dirty state lives in another service instance.
2. Or native confirm fires for programmatic save navigation.
3. Or app tries to save asynchronously during browser unload.
4. Data is lost or navigation loops.
5. Centralize dirty contract and explicit save/discard flow.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
export interface DirtyAware { hasUnsavedChanges():boolean; }

export const unsavedGuard:CanDeactivateFn<DirtyAware>=(component)=>
 component.hasUnsavedChanges()?confirm('Discard unsaved transfer changes?'):true;

export const authGuard:CanActivateFn=()=>
 inject(AuthStore).isAuthenticated() || inject(Router).createUrlTree(['/login']);

{path:'transfer',component:TransferPage,canActivate:[authGuard],canDeactivate:[unsavedGuard]}
```

### ASP.NET Core boundary

```csharp
[Authorize]
[HttpPut("drafts/{id:guid}")]
public Task<IActionResult> SaveDraft(Guid id,SaveDraftRequest request,CancellationToken ct)
 => drafts.SaveForUserAsync(id,request,User,ct);
```

### How to test it

Test clean, dirty-confirm-cancel, dirty-confirm-accept, successful-save navigation, browser refresh/tab-close policy, and correct provider instance. Test draft ownership and version conflicts on the API.

### Production verification

- Open the URL directly and refresh it through the deployed web server.
- Use back, forward, sibling navigation, malformed parameters, and unknown routes.
- Simulate slow lazy chunks, delayed APIs, navigation cancellation, and offline failure.
- Test anonymous, expired-token, forbidden, missing-resource, and concurrency scenarios.
- Verify no token, full account number, or sensitive payment detail appears in a URL.
- Confirm API authorization still works when guards/menu visibility are bypassed.

---

## 7. Important design decisions

- Narrow DirtyAware contract.
- Prompt only for meaningful changes.
- Clear dirty state after save.
- Use durable drafts for important data.
- Keep entry security on API.

A technical-lead answer must separate URL/view orchestration from security. The browser is controlled by the user, so route guards and hidden links can never prove authorization.

---

## 8. When to use and when not to use it

### Use it when

- CanActivate for entry prerequisites; CanDeactivate for loss-prevention on exit.

### Avoid or reconsider it when

- CanDeactivate as guaranteed persistence or CanActivate as sole authorization.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| CanActivate | Future target entry |
| CanDeactivate | Current component exit |
| beforeunload | Browser/tab exit warning |
| Backend draft | Durable recoverable state |

---

## 10. Common production mistakes

- Prompt loop after save.
- Wrong scoped dirty service.
- Assuming router guard covers tab close.
- Saving financial command on unload.
- Client-only entry authorization.

> **The router controls navigation; the API controls access.**

---

## 11. Scenario-based interview question

A transfer form warns even after save, but loses data when the tab closes. Explain what CanDeactivate can guarantee and design a durable draft strategy.

---

## Quick revision card

- **Core answer:** CanActivate decides whether a target route may be entered. CanDeactivate decides whether the currently active component may be left, commonly because it has unsaved changes or an operation that requires confirmation.
- **Memory rule:** Activate protects entry; deactivate protects exit.
- **Design checks:** URL contract, route order, lifetime, refresh, cancellation, and API authority.
- **Failure checks:** deep link, stale response, unauthorized call, invalid parameter, and chunk failure.

## Official Angular references

- [Angular routing](https://angular.dev/guide/routing)
- [Define routes](https://angular.dev/guide/routing/define-routes)
- [Route guards](https://angular.dev/guide/routing/route-guards)
- [Lazy-loaded routes](https://angular.dev/best-practices/performance/lazy-loaded-routes)
- [Testing routing and navigation](https://angular.dev/guide/routing/testing)
