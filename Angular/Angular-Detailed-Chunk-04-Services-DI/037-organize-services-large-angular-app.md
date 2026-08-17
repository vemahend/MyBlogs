# How Would You Organize Services in a Large Angular App?

> Senior Angular/.NET interview guide using payment and banking examples.

## 1. What problem does it solve?

A flat `/services` folder becomes a dumping ground of unrelated APIs, state, utilities, and workflows. Cross-feature imports grow, ownership disappears, circular dependencies form, and changes have a large blast radius.

---

## 2. Explain it in simple language

Organize services by feature and responsibility. Keep endpoint clients, facades/stores, mappers, and domain-oriented helpers near the feature; reserve app core for genuine singletons and shared for reusable UI/pure utilities.

### Memory rule

> **Organize by business ownership, then by technical role.**

### Interview-ready answer

> Organize services by feature and responsibility. Keep endpoint clients, facades/stores, mappers, and domain-oriented helpers near the feature; reserve app core for genuine singletons and shared for reusable UI/pure utilities. For production I would also explain the dependency owner, injector scope, failure behavior, testing boundary, and which security or financial rules remain authoritative on the ASP.NET Core API.

---

## 3. How does it work internally?

1. Feature routes define lazy boundaries and providers.
2. Components depend on feature facades/stores.
3. Facades coordinate feature API clients and state.
4. Clients handle typed transport; mappers isolate DTOs.
5. Core composition provides auth/config/telemetry without importing feature workflows.

### Practical interpretation

Not every layer needs a class. Use a pure function for mapping/calculation. A facade is useful when it owns screen workflow, not merely as a pass-through to another service. Enforce boundaries with lint rules, path aliases, and public entry points.

### Incorrect versus improved approach

```typescript
app/services/shared.service.ts // 4,000 lines, every endpoint and state
// Prefer cohesive feature-owned services.
```

### Runtime mental model

1. A consumer requests a token while Angular has an active injection context.
2. Angular searches the nearest element/environment injector and then walks upward.
3. The matching provider creates or returns an instance and that injector owns its lifetime.
4. Services collaborate through typed boundaries; view state returns to components through signals or Observables.
5. When a route/component injector is destroyed, scoped resources must stop and sensitive state must disappear.

---

## 4. Realistic payment or banking example

Payments contains payment-api, payment-facade, payment-store, payment.mapper, and routes. Accounts owns accounts. A shared Money component is domain-neutral. Auth/token handling belongs in core, while approve-payment rules remain on the backend.

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

1. Dependency direction is documented.
2. Feature public API is small.
3. Lazy route loads only required code/providers.
4. DTO changes are absorbed by one mapper/client.
5. Teams own clear boundaries.

### Failure flow

1. Everything imports SharedService.
2. SharedService reaches every endpoint and stores all state.
3. Features depend on each other bidirectionally.
4. Testing and lazy loading collapse.
5. Split by ownership and explicit ports.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
app/
  core/                 # auth, config, telemetry, interceptors
  shared/ui/            # reusable presentational components
  features/payments/
    data-access/payment-api.ts
    state/payment-store.ts
    application/payment-facade.ts
    models/payment.vm.ts
    payment.routes.ts
  features/accounts/...
```

### ASP.NET Core boundary

```csharp
src/
 Payments.Api/
 Payments.Application/
 Payments.Domain/
 Payments.Infrastructure/
// Frontend boundaries need not copy backend projects exactly, but language/ownership should align.
```

### How to test it

Unit-test mappers/policies cheaply, facade state transitions with fake clients, clients with HTTP testing, and route composition with targeted integration tests. Add architecture checks preventing forbidden feature imports.

### Production verification

- Test direct URL refresh, route exit, logout, and a second-user session.
- Delay and reorder API responses; test cancellation and stale-result handling.
- Exercise 401, 403, 404, validation, 409 concurrency, timeout, and 500 responses.
- Verify retries never duplicate financial commands and the API enforces idempotency.
- Inspect the injector hierarchy when instances unexpectedly differ.
- Ensure logs include correlation IDs but exclude tokens, account details, and payment credentials.

---

## 7. Important design decisions

- Feature ownership first.
- Small public entry points.
- Core stays small.
- Avoid pass-through layers.
- Enforce dependency rules automatically.

A technical-lead answer should explain why a particular injector owns the instance, what happens during navigation or logout, and why the design stays testable without weakening backend authority.

---

## 8. When to use and when not to use it

### Use it when

- Applications with multiple features/teams and lazy boundaries.

### Avoid or reconsider it when

- Premature layer ceremony in a tiny application.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| API client | Transport contract |
| Facade | Use-case/screen coordination |
| Store | State ownership |
| Core service | True app-wide infrastructure |

---

## 10. Common production mistakes

- Global services folder.
- God facade.
- Feature logic in shared.
- Raw DTO everywhere.
- Bidirectional imports.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

A 100-service application has circular feature imports and one enormous SharedService. Propose an incremental reorganization without stopping delivery.

---

## Quick revision card

- **Core answer:** Organize services by feature and responsibility. Keep endpoint clients, facades/stores, mappers, and domain-oriented helpers near the feature; reserve app core for genuine singletons and shared for reusable UI/pure utilities.
- **Memory rule:** Organize by business ownership, then by technical role.
- **Design checks:** token, provider, injector, scope, ownership, failure, cleanup, and API authority.
- **Production checks:** refresh, logout, duplicate action, stale response, unauthorized call, and telemetry.

## Official Angular references

- [Dependency injection](https://angular.dev/guide/di)
- [Defining dependency providers](https://angular.dev/guide/di/defining-dependency-providers)
- [Hierarchical injectors](https://angular.dev/guide/di/hierarchical-dependency-injection)
- [HTTP interceptors](https://angular.dev/guide/http/interceptors)
- [Testing services](https://angular.dev/guide/testing/services)
