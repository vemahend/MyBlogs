# How Do You Share State Using a Service?

> Senior Angular/.NET interview guide using payment and banking examples.

## 1. What problem does it solve?

Several components in one workflow need consistent current state without prop drilling or a global event bus. The design must define ownership, mutation, lifetime, replay, and cleanup.

---

## 2. Explain it in simple language

Use a deliberately scoped service as a small store: private writable signals/subjects, public readonly state, derived selectors, and explicit commands. Choose URL or backend persistence when state must survive refresh/share/device changes.

### Memory rule

> **One owner writes; many consumers read.**

### Interview-ready answer

> Use a deliberately scoped service as a small store: private writable signals/subjects, public readonly state, derived selectors, and explicit commands. Choose URL or backend persistence when state must survive refresh/share/device changes. For production I would also explain the dependency owner, injector scope, failure behavior, testing boundary, and which security or financial rules remain authoritative on the ASP.NET Core API.

---

## 3. How does it work internally?

1. Injector creates one store instance for the intended scope.
2. Private signal/subject owns the mutable source.
3. Components consume readonly or computed state.
4. Commands update state atomically or coordinate API calls.
5. Scope destruction releases state/resources.

### Practical interpretation

First decide what must survive sibling components, child navigation, route exit, refresh, logout, and device change. In-memory service state does not survive refresh. Do not place account details or secrets in query strings/localStorage merely for convenience.

### Incorrect versus improved approach

```typescript
public state$=new BehaviorSubject<any>({}); // anyone can mutate
// Expose readonly state and explicit typed commands.
```

### Runtime mental model

1. A consumer requests a token while Angular has an active injection context.
2. Angular searches the nearest element/environment injector and then walks upward.
3. The matching provider creates or returns an instance and that injector owns its lifetime.
4. Services collaborate through typed boundaries; view state returns to components through signals or Observables.
5. When a route/component injector is destroyed, scoped resources must stop and sensitive state must disappear.

---

## 4. Realistic payment or banking example

An account selector, transfer form, and review page share a route-scoped TransferDraftStore. The URL keeps only safe navigation state; sensitive durable drafts are encrypted and authorized on the backend.

### Full-stack responsibility split

| Angular | ASP.NET Core |
|---|---|
| Typed API client and screen workflow | Authorization and authoritative validation |
| User-friendly duplicate-click prevention | Idempotency and concurrency enforcement |
| DTO-to-view-model mapping | Least-privilege DTO and correct status codes |
| Loading, empty, ready, and error state | Atomic transaction and outbox where required |
| Correlation and safe client telemetry | Structured audit trail without sensitive data |

---

## 5. Successful flow and failure flow

### Successful flow

1. Route creates store.
2. Selector invokes selectAccount.
3. Form updates amount through command.
4. Review reads derived draft summary.
5. Success/route exit clears the draft.

### Failure flow

1. Public BehaviorSubject is exposed.
2. Any component calls next with partial incompatible state.
3. Root lifetime retains another customer’s details.
4. Refresh behavior is accidental.
5. Encapsulate mutation and choose persistence explicitly.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
@Injectable()
export class TransferDraftStore {
 private readonly draftState=signal<TransferDraft>(emptyDraft());
 readonly draft=this.draftState.asReadonly();
 readonly canReview=computed(()=>isComplete(this.draftState()));
 selectAccount(id:string){this.draftState.update(x=>({...x,accountId:id}));}
 clear(){this.draftState.set(emptyDraft());}
}

{path:'transfer',providers:[TransferDraftStore],children:[...]}
```

### ASP.NET Core boundary

```csharp
[Authorize]
[HttpPut("drafts/{id:guid}")]
public Task<IActionResult> Save(Guid id,SaveTransferDraft request,CancellationToken ct)
 => drafts.SaveForUserAsync(id,request,User,ct);
```

### How to test it

Instantiate one route scope with multiple consumers and prove shared state; create a second scope and prove isolation. Test command invariants, cleanup, logout, refresh expectations, and unauthorized backend draft access.

### Production verification

- Test direct URL refresh, route exit, logout, and a second-user session.
- Delay and reorder API responses; test cancellation and stale-result handling.
- Exercise 401, 403, 404, validation, 409 concurrency, timeout, and 500 responses.
- Verify retries never duplicate financial commands and the API enforces idempotency.
- Inspect the injector hierarchy when instances unexpectedly differ.
- Ensure logs include correlation IDs but exclude tokens, account details, and payment credentials.

---

## 7. Important design decisions

- Define source of truth.
- Hide writable state.
- Scope to workflow.
- Persist only by policy.
- Clear on success/logout/expiry.

A technical-lead answer should explain why a particular injector owns the instance, what happens during navigation or logout, and why the design stays testable without weakening backend authority.

---

## 8. When to use and when not to use it

### Use it when

- Multiple consumers with the same workflow lifetime.

### Avoid or reconsider it when

- Simple parent-child communication or durable state that belongs on the server.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Scoped service store | In-memory workflow state |
| URL | Shareable/back-button-safe state |
| Backend draft | Durable authorized state |
| Global event bus | Unowned transient messages |

---

## 10. Common production mistakes

- Public Subject.
- Root for all drafts.
- No refresh policy.
- Sensitive localStorage/URL data.
- Competing writers.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

A three-step transfer loses data on child navigation but must clear when leaving the feature. Design the store, provider scope, and persistence policy.

---

## Quick revision card

- **Core answer:** Use a deliberately scoped service as a small store: private writable signals/subjects, public readonly state, derived selectors, and explicit commands. Choose URL or backend persistence when state must survive refresh/share/device changes.
- **Memory rule:** One owner writes; many consumers read.
- **Design checks:** token, provider, injector, scope, ownership, failure, cleanup, and API authority.
- **Production checks:** refresh, logout, duplicate action, stale response, unauthorized call, and telemetry.

## Official Angular references

- [Dependency injection](https://angular.dev/guide/di)
- [Defining dependency providers](https://angular.dev/guide/di/defining-dependency-providers)
- [Hierarchical injectors](https://angular.dev/guide/di/hierarchical-dependency-injection)
- [HTTP interceptors](https://angular.dev/guide/http/interceptors)
- [Testing services](https://angular.dev/guide/testing/services)
