# How Do Service Scopes Work in Angular?

> Senior Angular/.NET interview guide using payment and banking examples.

## 1. What problem does it solve?

State and resources need an owner and lifetime. A global instance can leak customer data or stale workflow state; a component instance can be too short-lived; accidental duplicate providers split state unexpectedly.

---

## 2. Explain it in simple language

An Angular service is singleton only within the injector that provides it. Root providers live for the application, route providers for that route environment, and component providers create an instance for each component subtree.

### Memory rule

> **Singleton is relative to an injector.**

### Interview-ready answer

> An Angular service is singleton only within the injector that provides it. Root providers live for the application, route providers for that route environment, and component providers create an instance for each component subtree. For production I would also explain the dependency owner, injector scope, failure behavior, testing boundary, and which security or financial rules remain authoritative on the ASP.NET Core API.

---

## 3. How does it work internally?

1. Root EnvironmentInjector contains application-wide providers.
2. A route can introduce a child EnvironmentInjector.
3. Components/directives can add ElementInjector providers.
4. Resolution chooses the nearest matching provider while walking upward.
5. Destroying a route/component injector destroys services owned by that injector.

### Practical interpretation

Do not mechanically equate Angular root with .NET singleton or Angular route with .NET scoped—the owners are different. Ask what should survive child navigation, route exit, refresh, logout, tab close, and user change.

### Incorrect versus improved approach

```typescript
@Injectable({providedIn:'root'}) export class EveryScreenDraftStore {}
// Root is not the default answer for workflow state.
```

### Runtime mental model

1. A consumer requests a token while Angular has an active injection context.
2. Angular searches the nearest element/environment injector and then walks upward.
3. The matching provider creates or returns an instance and that injector owns its lifetime.
4. Services collaborate through typed boundaries; view state returns to components through signals or Observables.
5. When a route/component injector is destroyed, scoped resources must stop and sensitive state must disappear.

---

## 4. Realistic payment or banking example

A TransferDraftStore is provided on the Payments route so wizard steps share it, but it disappears when leaving Payments. AuthSession may be root-scoped. A row editor service can be component-scoped per row.

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

1. State lifetime is written down.
2. Nearest suitable injector provides the service.
3. All intended consumers share one instance.
4. Leaving scope clears sensitive draft state.
5. Tests prove isolation between scopes.

### Failure flow

1. TransferDraftStore uses providedIn root.
2. One customer logs out and another signs in.
3. Old beneficiary/amount remains.
4. Shared-device exposure occurs.
5. Scope and explicit logout cleanup are corrected.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
export const routes:Routes=[{
 path:'payments',
 providers:[TransferDraftStore],
 children:[{path:'new',component:TransferWizard}]
}];

@Injectable({providedIn:'root'}) export class AuthSession {}

@Component({providers:[RowEditState]}) export class TransactionRow {}
```

### ASP.NET Core boundary

```csharp
builder.Services.AddSingleton<ReferenceDataCache>();
builder.Services.AddScoped<PaymentUnitOfWork>(); // per HTTP request
builder.Services.AddTransient<PaymentCommandValidator>();
```

### How to test it

Create multiple component/route injectors and compare instance identity. Destroy the scope and assert cleanup. Test logout and a second-user session so stale sensitive state cannot survive.

### Production verification

- Test direct URL refresh, route exit, logout, and a second-user session.
- Delay and reorder API responses; test cancellation and stale-result handling.
- Exercise 401, 403, 404, validation, 409 concurrency, timeout, and 500 responses.
- Verify retries never duplicate financial commands and the API enforces idempotency.
- Inspect the injector hierarchy when instances unexpectedly differ.
- Ensure logs include correlation IDs but exclude tokens, account details, and payment credentials.

---

## 7. Important design decisions

- Define lifetime before provider location.
- Root only for genuine application state/stateless services.
- Route scope feature workflow state.
- Component scope isolated instances.
- Add explicit security cleanup.

A technical-lead answer should explain why a particular injector owns the instance, what happens during navigation or logout, and why the design stays testable without weakening backend authority.

---

## 8. When to use and when not to use it

### Use it when

- Deliberately matching state/resource lifetime to UI ownership.

### Avoid or reconsider it when

- Adding a provider in multiple places without understanding instance splits.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Root | Application injector lifetime |
| Route | Feature/navigation scope |
| Component | One component subtree |
| .NET scoped | Usually one server request |

---

## 10. Common production mistakes

- Root for all state.
- Duplicate provider shadowing.
- Assuming lazy route always means desired isolation.
- No logout clear.
- Component provider when siblings must share.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

A transfer draft must survive wizard steps but not survive leaving Payments or changing user. Select a provider scope and prove it with tests.

---

## Quick revision card

- **Core answer:** An Angular service is singleton only within the injector that provides it. Root providers live for the application, route providers for that route environment, and component providers create an instance for each component subtree.
- **Memory rule:** Singleton is relative to an injector.
- **Design checks:** token, provider, injector, scope, ownership, failure, cleanup, and API authority.
- **Production checks:** refresh, logout, duplicate action, stale response, unauthorized call, and telemetry.

## Official Angular references

- [Dependency injection](https://angular.dev/guide/di)
- [Defining dependency providers](https://angular.dev/guide/di/defining-dependency-providers)
- [Hierarchical injectors](https://angular.dev/guide/di/hierarchical-dependency-injection)
- [HTTP interceptors](https://angular.dev/guide/http/interceptors)
- [Testing services](https://angular.dev/guide/testing/services)
