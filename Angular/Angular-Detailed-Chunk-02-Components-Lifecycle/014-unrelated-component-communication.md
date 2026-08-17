# How Do You Pass Data Between Unrelated Components?

## 1. What problem does it solve?

Components outside a direct parent-child relationship cannot use a simple input/output chain without prop drilling. A global event bus solves the immediate message but loses ownership, lifetime, replay, and traceability.

---

## 2. Explain it in simple language

Choose a shared boundary based on lifetime: URL for shareable navigation state, a scoped service/store for in-memory workflow state, and backend persistence for state that must survive refresh, session, or device changes.

### Memory rule

> **Choose the lifetime first; then choose the communication mechanism.**

### Interview-ready answer

> Choose a shared boundary based on lifetime: URL for shareable navigation state, a scoped service/store for in-memory workflow state, and backend persistence for state that must survive refresh, session, or device changes. In a production Angular application I would apply it by identifying the state owner and lifetime first, keeping the component contract typed and explicit, and delegating authoritative payment and security rules to the ASP.NET Core API.

---

## 3. How does it work internally?

1. A provider scope creates one store instance for its consumers.
2. Private writable signal/subject owns mutation.
3. Consumers read readonly state or derived values.
4. Commands make changes explicit.
5. When the route/component scope is destroyed, its store and resources are destroyed too.

### Practical interpretation

Unrelated does not automatically mean global. Ask whether state should survive child navigation, route exit, refresh, logout, or device change. Persist only what policy permits, with versioning, expiry, and cleanup.

### Incorrect versus improved approach

```typescript
// Avoid public global event bus
public events=new Subject<any>();
// Prefer readonly scoped state + commands
readonly account=this.selected.asReadonly();
```

### What happens at runtime

1. Angular creates the relevant component and resolves dependencies from the nearest injector.
2. Inputs, route values, or reactive state provide the current screen data.
3. The component executes only its owned presentation or orchestration responsibility.
4. Signals, Observable emissions, input changes, or events cause the affected view to synchronize.
5. When the component is removed, view-owned resources must stop so an old screen cannot keep reacting.

The important point is not merely when Angular calls a method. It is whether the code is running under the correct **owner and lifetime**. Code placed in the wrong component or lifecycle stage can appear correct on first load but fail after input changes, navigation, refresh, rapid actions, or destruction.

---

## 4. Realistic payment or banking example

A dashboard account selector and transfer form share SelectedAccountStore provided at the payments route. The filter is safe in the URL, while sensitive transfer draft details are not placed in query parameters or localStorage.

### Full-stack responsibility split

| Angular responsibility | ASP.NET Core responsibility |
|---|---|
| Render the current view state | Return only data the user may access |
| Capture and validate user input for usability | Repeat authoritative validation |
| Prevent accidental repeated clicks | Enforce idempotency and concurrency |
| Display 401, 403, 404, 409, and transient failures | Produce correct status codes and safe problem details |
| Cancel stale reads and clean view resources | Honour cancellation where possible and protect server capacity |

A user can bypass the Angular component and call the endpoint directly. Therefore component design can improve safety and clarity, but it cannot replace backend authorization or financial invariants.

---

## 5. Successful flow and failure flow

### Successful flow

1. Payments route creates scoped store.
2. Selector calls select(account).
3. Transfer page reads selected account signal.
4. Navigation within feature preserves it.
5. Leaving feature destroys it.

### Failure flow

1. Root singleton stores a transfer draft forever.
2. Another workflow sees stale customer/account data.
3. Refresh behaviour is undefined.
4. Sensitive values remain on shared device.
5. Scope state and deliberately choose persistence.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
@Injectable()
export class SelectedAccountStore {
 private readonly selected=signal<AccountVm|null>(null);
 readonly account=this.selected.asReadonly();
 select(value:AccountVm){this.selected.set(value)}
 clear(){this.selected.set(null)}
}

export const routes:Routes=[{path:'payments',providers:[SelectedAccountStore],children:[...]}];
```

### ASP.NET Core boundary

```csharp
[Authorize]
[HttpPut("drafts/{draftId:guid}")]
public async Task<IActionResult> SaveDraft(Guid draftId,SaveDraftRequest request,CancellationToken ct)
{
 await drafts.SaveForUserAsync(draftId,request,User,ct);
 return NoContent();
}
```

### How to test this practically

Create two consumers under one route injector and prove they share the store; create a new scope and prove isolation. Test cleanup on route exit and verify sensitive fields are never written to URL/storage.

### Production verification

- Repeat the interaction after browser refresh and direct URL navigation.
- Trigger rapid clicks and deliberately delayed responses.
- Navigate away while work is in progress and check for stale updates.
- Exercise unauthorized, forbidden, missing, concurrency-conflict, and server-error responses.
- Confirm logs contain a correlation identifier but no account secrets or payment credentials.
- Use Angular DevTools, browser Network/Performance panels, and heap snapshots when timing or cleanup is involved.

---

## 7. Important design decisions

- Match provider scope to state lifetime.
- Hide writable state.
- Use URL for shareable safe filters.
- Use backend for durable drafts.
- Clear state on logout/success.

For a senior-level answer, explain the trade-off rather than only naming the API. State why this component or hook owns the work, what alternative you rejected, and how your choice behaves during failure and cleanup.

---

## 8. When to use and when not to use it

### Use it when

- Genuine multi-consumer state or workflow coordination.

### Avoid or reconsider it when

- Replacing a clear direct input/output relationship or building an event bus.

---

## 9. Compare it with related concepts

| Concept | Responsibility |
|---|---|
| URL | Refresh/share/back-safe state |
| Scoped store | In-memory feature state |
| Root store | True app/session state |
| Backend draft | Durable cross-device state |

---

## 10. Common production mistakes

- Root for everything.
- Public Subject.
- No refresh policy.
- Secrets in URL/localStorage.
- No expiry or clear action.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

An account selector and transfer wizard are on different route branches. The selection must survive wizard steps but disappear after leaving Payments. Design the state boundary and tests.

---

## Quick revision card

- **Definition:** Choose a shared boundary based on lifetime: URL for shareable navigation state, a scoped service/store for in-memory workflow state, and backend persistence for state that must survive refresh, session, or device changes.
- **Memory rule:** Choose the lifetime first; then choose the communication mechanism.
- **Design check:** owner, direction, lifetime, failure path, and API authority.
- **Production check:** refresh, rapid action, stale result, navigation cleanup, API rejection, and telemetry.
