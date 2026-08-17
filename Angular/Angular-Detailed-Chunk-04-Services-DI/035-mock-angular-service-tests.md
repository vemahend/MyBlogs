# How Do You Mock a Service in Unit Tests?

> Senior Angular/.NET interview guide using payment and banking examples.

## 1. What problem does it solve?

A component or service test should not call a real payment API, authentication provider, clock, or analytics system. Tests need deterministic control over results and failures without reproducing the whole implementation.

---

## 2. Explain it in simple language

Replace the dependency’s provider with a small fake, stub, or spy that implements the contract needed by the test. Assert observable behavior and important collaboration—not private implementation details.

### Memory rule

> **Fake the boundary; test the behavior.**

### Interview-ready answer

> Replace the dependency’s provider with a small fake, stub, or spy that implements the contract needed by the test. Assert observable behavior and important collaboration—not private implementation details. For production I would also explain the dependency owner, injector scope, failure behavior, testing boundary, and which security or financial rules remain authoritative on the ASP.NET Core API.

---

## 3. How does it work internally?

1. TestBed creates an isolated test injector.
2. The test registers `useValue`, `useClass`, or a provider override for the dependency token.
3. Angular injects the test double into the subject.
4. The test controls returned Observable/signal values.
5. Assertions verify DOM/state/output and only contract-critical calls.

### Practical interpretation

A mock verifies interaction, a stub returns canned values, and a fake is a lightweight working implementation. Prefer the least sophisticated double. If the service is provided by the component itself, a root TestBed override may not replace it—override the component provider or read from its injector.

### Incorrect versus improved approach

```typescript
providers:[PaymentFacade,HttpPaymentApi,RealAuthService] // accidentally integration test
// Replace the external boundary with a controlled fake.
```

### Runtime mental model

1. A consumer requests a token while Angular has an active injection context.
2. Angular searches the nearest element/environment injector and then walks upward.
3. The matching provider creates or returns an instance and that injector owns its lifetime.
4. Services collaborate through typed boundaries; view state returns to components through signals or Observables.
5. When a route/component injector is destroyed, scoped resources must stop and sensitive state must disappear.

---

## 4. Realistic payment or banking example

TransferPage receives a fake PaymentFacade. The fake exposes ready state and records `submit`. Tests cover valid submit, rejected payment, and duplicate-click prevention without HttpClient.

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

1. Fake matches a narrow interface.
2. Test arranges one business state.
3. User interacts through DOM.
4. Expected command is captured once.
5. UI renders success/error deterministically.

### Failure flow

1. Huge auto-mock returns undefined for everything.
2. Test calls private component methods.
3. Every refactor breaks call-order assertions.
4. Real user behavior remains untested.
5. Use focused fakes and behavior assertions.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
const paymentFacadeFake={
 state:signal<PageState>({kind:'ready'}),
 submit:vi.fn()
};

TestBed.configureTestingModule({
 imports:[TransferPage],
 providers:[{provide:PaymentFacade,useValue:paymentFacadeFake}]
});

// For a component-level provider, use overrideComponent or its DebugElement injector.
```

### ASP.NET Core boundary

```csharp
var service=new Mock<IPaymentService>();
service.Setup(x=>x.CreateAsync(It.IsAny<CreatePayment>(),It.IsAny<CancellationToken>()))
       .ReturnsAsync(Result.Success());
var sut=new CreatePaymentHandler(service.Object);
```

### How to test it

Cover success, validation rejection, 403/409 mapping, delayed result, and teardown. Keep one separate API-client test with HTTP testing utilities so the fake does not conceal URL/header/DTO defects.

### Production verification

- Test direct URL refresh, route exit, logout, and a second-user session.
- Delay and reorder API responses; test cancellation and stale-result handling.
- Exercise 401, 403, 404, validation, 409 concurrency, timeout, and 500 responses.
- Verify retries never duplicate financial commands and the API enforces idempotency.
- Inspect the injector hierarchy when instances unexpectedly differ.
- Ensure logs include correlation IDs but exclude tokens, account details, and payment credentials.

---

## 7. Important design decisions

- Mock external boundaries, not every class.
- Use narrow typed contracts.
- Assert outcomes first.
- Reset doubles per test.
- Keep contract/integration tests for wiring.

A technical-lead answer should explain why a particular injector owns the instance, what happens during navigation or logout, and why the design stays testable without weakening backend authority.

---

## 8. When to use and when not to use it

### Use it when

- Unit tests requiring deterministic external behavior.

### Avoid or reconsider it when

- Mocking pure value objects or using mocks to replace meaningful integration coverage.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Stub | Returns controlled data |
| Spy/mock | Records/verifies calls |
| Fake | Small working implementation |
| HTTP test backend | Captures actual HttpClient request |

---

## 10. Common production mistakes

- Untyped any mocks.
- Mocking the subject.
- Brittle call-order assertions.
- Leaking state between tests.
- Wrong injector override.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

A component provides its own facade and your TestBed root mock is ignored. Explain why and show how to obtain/override the actual instance.

---

## Quick revision card

- **Core answer:** Replace the dependency’s provider with a small fake, stub, or spy that implements the contract needed by the test. Assert observable behavior and important collaboration—not private implementation details.
- **Memory rule:** Fake the boundary; test the behavior.
- **Design checks:** token, provider, injector, scope, ownership, failure, cleanup, and API authority.
- **Production checks:** refresh, logout, duplicate action, stale response, unauthorized call, and telemetry.

## Official Angular references

- [Dependency injection](https://angular.dev/guide/di)
- [Defining dependency providers](https://angular.dev/guide/di/defining-dependency-providers)
- [Hierarchical injectors](https://angular.dev/guide/di/hierarchical-dependency-injection)
- [HTTP interceptors](https://angular.dev/guide/http/interceptors)
- [Testing services](https://angular.dev/guide/testing/services)
