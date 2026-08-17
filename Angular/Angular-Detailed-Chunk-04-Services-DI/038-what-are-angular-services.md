# What Are Angular Services?

> Senior Angular/.NET interview guide using payment and banking examples.

## 1. What problem does it solve?

Logic and state that do not belong to one view must be reusable, testable, and shareable with an explicit lifetime. Components otherwise become tightly coupled god objects.

---

## 2. Explain it in simple language

An Angular service is usually an injectable class that owns a focused non-template responsibility—such as API access, workflow coordination, state, logging, or configuration. “Service” does not automatically mean global singleton.

### Memory rule

> **A service owns capability or state; a component owns presentation.**

### Interview-ready answer

> An Angular service is usually an injectable class that owns a focused non-template responsibility—such as API access, workflow coordination, state, logging, or configuration. “Service” does not automatically mean global singleton. For production I would also explain the dependency owner, injector scope, failure behavior, testing boundary, and which security or financial rules remain authoritative on the ASP.NET Core API.

---

## 3. How does it work internally?

1. Decorator/provider metadata makes the class constructible by DI.
2. Injector creates it on first resolution or according to provider behavior.
3. Its dependencies are resolved recursively.
4. Consumers receive the instance from the nearest provider.
5. Its state/resources live as long as that provider scope.

### Practical interpretation

A TypeScript class need not be a service merely because it is injectable. Use DI when construction, replacement, configuration, or lifetime matters. Keep pure stateless transformations as functions when that is clearer.

### Incorrect versus improved approach

```typescript
@Injectable({providedIn:'root'}) class AppService { /* everything */ }
// Split transport, workflow, state, and pure mapping responsibilities.
```

### Runtime mental model

1. A consumer requests a token while Angular has an active injection context.
2. Angular searches the nearest element/environment injector and then walks upward.
3. The matching provider creates or returns an instance and that injector owns its lifetime.
4. Services collaborate through typed boundaries; view state returns to components through signals or Observables.
5. When a route/component injector is destroyed, scoped resources must stop and sensitive state must disappear.

---

## 4. Realistic payment or banking example

PaymentApi owns typed HTTP calls; PaymentFacade owns page workflow; TransferDraftStore owns route-scoped draft state. The ASP.NET API still owns authoritative financial rules.

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

1. Responsibility has one sentence.
2. Scope matches lifetime.
3. Public API is typed and small.
4. Components delegate and render readonly state.
5. Service failures map to explicit states.

### Failure flow

1. PaymentService handles HTTP, modal dialogs, routing, formatting, auth, and every payment screen.
2. It becomes root-scoped mutable global state.
3. Changes break unrelated pages.
4. Tests require dozens of mocks.
5. Split by cohesive responsibility.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
@Injectable({providedIn:'root'})
export class PaymentApi {
 private readonly http=inject(HttpClient);
 get(id:string){return this.http.get<PaymentDto>('/api/payments/' + id);}
}

@Injectable()
export class PaymentPageFacade { /* scoped workflow state */ }
```

### ASP.NET Core boundary

```csharp
public sealed class PaymentQueryService(IPaymentRepository repository)
{
 public Task<PaymentDto?> GetAsync(Guid id,ClaimsPrincipal user,CancellationToken ct)
  => repository.GetAuthorizedAsync(id,user,ct);
}
```

### How to test it

Test pure logic without TestBed; service classes with injected fakes; HttpClient services with HTTP testing; scoped state with injector-lifetime tests; components with a fake facade.

### Production verification

- Test direct URL refresh, route exit, logout, and a second-user session.
- Delay and reorder API responses; test cancellation and stale-result handling.
- Exercise 401, 403, 404, validation, 409 concurrency, timeout, and 500 responses.
- Verify retries never duplicate financial commands and the API enforces idempotency.
- Inspect the injector hierarchy when instances unexpectedly differ.
- Ensure logs include correlation IDs but exclude tokens, account details, and payment credentials.

---

## 7. Important design decisions

- One cohesive responsibility.
- Explicit scope.
- Readonly state exposure.
- Typed errors/results.
- No hidden UI or navigation side effects in low-level clients.

A technical-lead answer should explain why a particular injector owns the instance, what happens during navigation or logout, and why the design stays testable without weakening backend authority.

---

## 8. When to use and when not to use it

### Use it when

- API clients, facades, stores, logging/configuration, reusable non-view behavior.

### Avoid or reconsider it when

- Formatting suited to a pipe, DOM behavior suited to a directive, or trivial pure helpers.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Service | Non-view capability/state |
| Component | View and user interaction |
| Directive | Host/view behavior |
| Pipe | Display transformation |

---

## 10. Common production mistakes

- Every service root-scoped.
- God service.
- Service opens UI unexpectedly.
- Subscriptions inside subscriptions.
- Business rules trusted only in client.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

A PaymentService has 70 methods and controls HTTP, dialogs, routing, state, and formatting. Identify boundaries and a safe refactoring sequence.

---

## Quick revision card

- **Core answer:** An Angular service is usually an injectable class that owns a focused non-template responsibility—such as API access, workflow coordination, state, logging, or configuration. “Service” does not automatically mean global singleton.
- **Memory rule:** A service owns capability or state; a component owns presentation.
- **Design checks:** token, provider, injector, scope, ownership, failure, cleanup, and API authority.
- **Production checks:** refresh, logout, duplicate action, stale response, unauthorized call, and telemetry.

## Official Angular references

- [Dependency injection](https://angular.dev/guide/di)
- [Defining dependency providers](https://angular.dev/guide/di/defining-dependency-providers)
- [Hierarchical injectors](https://angular.dev/guide/di/hierarchical-dependency-injection)
- [HTTP interceptors](https://angular.dev/guide/http/interceptors)
- [Testing services](https://angular.dev/guide/testing/services)
