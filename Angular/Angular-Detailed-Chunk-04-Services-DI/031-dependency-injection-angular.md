# What Is Dependency Injection in Angular?

> Senior Angular/.NET interview guide using payment and banking examples.

## 1. What problem does it solve?

Classes need collaborators such as API clients, loggers, configuration, and state stores. Constructing them directly with `new` tightly couples implementation, lifetime, configuration, and tests to the consumer.

---

## 2. Explain it in simple language

Dependency injection means a class asks Angular for a dependency instead of constructing it. Angular uses a token to find a provider in the injector hierarchy and returns the configured value or instance.

### Memory rule

> **Ask for capability; do not construct the implementation.**

### Interview-ready answer

> Dependency injection means a class asks Angular for a dependency instead of constructing it. Angular uses a token to find a provider in the injector hierarchy and returns the configured value or instance. For production I would also explain the dependency owner, injector scope, failure behavior, testing boundary, and which security or financial rules remain authoritative on the ASP.NET Core API.

---

## 3. How does it work internally?

1. Angular compiles provider metadata and creates environment and element injectors.
2. A component/service requests a class token or InjectionToken through `inject()` or a constructor.
3. Resolution starts at the current injector and walks upward.
4. A provider creates or returns a value through useClass, useValue, useFactory, or useExisting.
5. The instance is reused within that injector scope and destroyed with the owning injector when applicable.

### Practical interpretation

A token identifies what is requested; a provider explains how to supply it; an injector owns resolution and scope. Injection is not magic global access. `inject()` only works in an injection context such as construction, field initialization, or a provider factory.

### Incorrect versus improved approach

```typescript
const api = new HttpPaymentApi(new HttpClient(...)); // hard-coded graph
// Prefer: private readonly api = inject(PAYMENT_API);
```

### Runtime mental model

1. A consumer requests a token while Angular has an active injection context.
2. Angular searches the nearest element/environment injector and then walks upward.
3. The matching provider creates or returns an instance and that injector owns its lifetime.
4. Services collaborate through typed boundaries; view state returns to components through signals or Observables.
5. When a route/component injector is destroyed, scoped resources must stop and sensitive state must disappear.

---

## 4. Realistic payment or banking example

A TransferFacade depends on PaymentApi and AuditPort. Production provides real implementations; tests provide fakes. The facade knows the contracts, not HttpClient configuration or console logging.

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

1. Route creates the payment feature injector.
2. Facade requests PaymentApi.
3. Angular finds the route provider and creates one scoped instance.
4. Component and child services share that instance.
5. Leaving the feature destroys route-scoped state.

### Failure flow

1. Component calls `new PaymentApi(new HttpClient(...))`.
2. Interceptors, configuration, tests, and lifetime are bypassed.
3. Multiple inconsistent instances appear.
4. Credentials or base URLs drift.
5. Register one deliberate provider boundary.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
export const PAYMENT_API = new InjectionToken<PaymentPort>('PAYMENT_API');

@Injectable()
export class TransferFacade {
 private readonly api=inject(PAYMENT_API);
 submit(command:TransferCommand){ return this.api.create(command); }
}

{ provide: PAYMENT_API, useClass: HttpPaymentApi }
```

### ASP.NET Core boundary

```csharp
public interface IPaymentService { Task<Result> CreateAsync(CreatePayment command,CancellationToken ct); }
builder.Services.AddScoped<IPaymentService,PaymentService>();

public sealed class PaymentsController(IPaymentService payments):ControllerBase { }
```

### How to test it

Unit-test pure classes by passing fakes where practical. Use TestBed when Angular provider resolution matters. Verify overrides, route/component scope, and that the actual injected instance comes from the expected injector.

### Production verification

- Test direct URL refresh, route exit, logout, and a second-user session.
- Delay and reorder API responses; test cancellation and stale-result handling.
- Exercise 401, 403, 404, validation, 409 concurrency, timeout, and 500 responses.
- Verify retries never duplicate financial commands and the API enforces idempotency.
- Inspect the injector hierarchy when instances unexpectedly differ.
- Ensure logs include correlation IDs but exclude tokens, account details, and payment credentials.

---

## 7. Important design decisions

- Depend on narrow capabilities.
- Choose scope from state lifetime.
- Use InjectionToken for interfaces/configuration.
- Keep provider setup near composition roots.
- Avoid service-locator patterns.

A technical-lead answer should explain why a particular injector owns the instance, what happens during navigation or logout, and why the design stays testable without weakening backend authority.

---

## 8. When to use and when not to use it

### Use it when

- Replaceable collaborators, cross-cutting services, configuration, state stores, and framework integrations.

### Avoid or reconsider it when

- Plain local values or pure helpers that need no lifecycle/configuration.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Angular DI | Hierarchical browser-side object composition |
| .NET DI | Server request/application object composition |
| Service locator | Consumer pulls arbitrary dependencies |
| new | Consumer owns concrete construction |

---

## 10. Common production mistakes

- Providing everything at root.
- Calling inject outside context.
- Duplicate providers creating unexpected instances.
- Injecting a god service.
- Assuming DI itself creates abstraction.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

A payment component constructs three API clients directly and tests require real HTTP. Refactor the dependency graph and explain token, provider, injector, and scope.

---

## Quick revision card

- **Core answer:** Dependency injection means a class asks Angular for a dependency instead of constructing it. Angular uses a token to find a provider in the injector hierarchy and returns the configured value or instance.
- **Memory rule:** Ask for capability; do not construct the implementation.
- **Design checks:** token, provider, injector, scope, ownership, failure, cleanup, and API authority.
- **Production checks:** refresh, logout, duplicate action, stale response, unauthorized call, and telemetry.

## Official Angular references

- [Dependency injection](https://angular.dev/guide/di)
- [Defining dependency providers](https://angular.dev/guide/di/defining-dependency-providers)
- [Hierarchical injectors](https://angular.dev/guide/di/hierarchical-dependency-injection)
- [HTTP interceptors](https://angular.dev/guide/http/interceptors)
- [Testing services](https://angular.dev/guide/testing/services)
