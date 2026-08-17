# How Do You Mock HttpClient Calls?

> Senior Angular/.NET testing interview guide using payment and banking examples.

## 1. What problem does it solve?

A test should detect a meaningful regression, fail for one understandable reason, and run deterministically. Angular applications combine TypeScript, dependency injection, templates, forms, RxJS, routing, HTTP, and browser behavior, so the key is choosing the smallest realistic boundary that covers the risk.

---

## 2. Explain it in simple language

Configure the real HttpClient with the Angular testing backend, inject HttpTestingController, call the service, expect the exact request, flush success or failure, and verify that no requests remain.

### Memory rule

> **Call first, expect second, flush third, verify last.**

### Interview-ready answer

> Configure the real HttpClient with the Angular testing backend, inject HttpTestingController, call the service, expect the exact request, flush success or failure, and verify that no requests remain. For a banking system I focus on observable behavior, deterministic failures, exact request contracts, authorization boundaries, and idempotent command behavior rather than chasing coverage percentage alone.

---

## 3. How does it work internally?

1. The test constructs either a plain class or an Angular testing environment.
2. Controlled dependencies supply success, delay, error, or concurrency behavior.
3. The test performs one user action or invokes one public contract.
4. Angular/RxJS work is advanced explicitly through rendering, timers, navigation, or HTTP flushing.
5. Assertions verify visible state, emitted intent, request contract, cleanup, and absence of unexpected work.

### Practical interpretation

Mocking the PaymentApi itself in its own test proves nothing about URL, method, headers, serialization, interceptor order, request count, or error mapping.

### Practical code

```typescript
beforeEach(()=>TestBed.configureTestingModule({providers:[
 provideHttpClient(),provideHttpClientTesting(),PaymentApi
]}));
it('creates once',()=>{
 const api=TestBed.inject(PaymentApi),http=TestBed.inject(HttpTestingController);
 api.create(request,'attempt-1').subscribe();
 const req=http.expectOne('/api/payments');
 expect(req.request.method).toBe('POST');
 expect(req.request.headers.get('Idempotency-Key')).toBe('attempt-1');
 req.flush(response); http.verify();
});
```

Tests should not repeat implementation line by line. They should protect decisions: the correct request is sent once, stale work cannot win, errors remain distinguishable, forms retain data after failure, and an unauthorized caller cannot access the API.

---

## 4. Realistic payment or banking example

A PaymentApi test asserts POST URL, sanitized DTO, authorization added by the configured interceptor, and idempotency header; it flushes 201, 400, 409, timeout-like errors, and verifies one request.

### Full-stack test responsibility split

| Angular tests | ASP.NET Core tests |
|---|---|
| Form and component user behavior | Authoritative validation and authorization |
| Typed request mapping and headers | Idempotency, concurrency, transaction atomicity |
| Loading/error/empty/forbidden rendering | Correct 400/401/403/404/409 ProblemDetails |
| Cancellation and duplicate UI intent | Lost-response retry creates one effect |
| Route/menu access experience | Direct API call remains secure |

---

## 5. Successful flow and failure flow

### Successful flow

1. Arrange only the state and boundary needed by the behavior.
2. Act through a public method, DOM interaction, navigation, or HTTP client.
3. Advance async work deterministically.
4. Assert user-visible result and important collaboration.
5. Verify cleanup and no unexpected requests/timers.

### Failure flow

1. Test depends on real time, shared state, or network.
2. It asserts before work completes or after an arbitrary sleep.
3. It passes locally but races in CI.
4. Retrying the test hides the defect.
5. Replace uncontrolled dependency and assert the exact completion signal.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
beforeEach(()=>TestBed.configureTestingModule({providers:[
 provideHttpClient(),provideHttpClientTesting(),PaymentApi
]}));
it('creates once',()=>{
 const api=TestBed.inject(PaymentApi),http=TestBed.inject(HttpTestingController);
 api.create(request,'attempt-1').subscribe();
 const req=http.expectOne('/api/payments');
 expect(req.request.method).toBe('POST');
 expect(req.request.headers.get('Idempotency-Key')).toBe('attempt-1');
 req.flush(response); http.verify();
});
```

### ASP.NET Core integration boundary

```csharp
[Fact]
public async Task Same_idempotency_key_creates_one_payment()
{
    var first = await client.PostPaymentAsync(request, key);
    var retry = await client.PostPaymentAsync(request, key);
    first.PaymentId.Should().Be(retry.PaymentId);
    (await db.Payments.CountAsync()).Should().Be(1);
}
```

### How to test it

Use a risk matrix covering success, validation, unauthenticated, forbidden, missing, conflict, transient failure, timeout, duplicate action, stale response, navigation cleanup, and accessibility. Keep data builders explicit and deterministic.

### Production verification

- Run tests in randomized order and repeat the suspected test.
- Fail on unexpected HTTP requests and unhandled errors.
- Use deterministic clocks, IDs, and data builders.
- Keep a small deployed smoke suite for login and critical payment flows.
- Track duration and flaky retry rate, not coverage alone.
- Never use real production credentials or customer data.

---

## 7. Important design decisions

- Provider order
-  exact request
-  success/error
-  verify leftovers
-  no real network

Current Angular note: new CLI projects use Vitest and jsdom by default; older enterprise suites may use Karma/Jasmine. The testing principles remain the same, but timer, spy, and async APIs differ.

---

## 8. When to use and when not to use it

### Use it when

- The chosen level is the cheapest one that can catch the target defect.
- Dependencies and time can be controlled without removing the behavior under test.

### Avoid or reconsider it when

- The test duplicates implementation, asserts private details, or mocks away the contract it claims to verify.
- A broad E2E test is used for logic that a fast deterministic unit test can prove better.

---

## 9. Compare it with related concepts

| Test/tool | Primary responsibility |
|---|---|
| HttpTestingController | HTTP boundary test |
| service fake | Component isolation |
| contract test | Frontend/backend schema |
| E2E | Deployed behavior |

---

## 10. Common production mistakes

- Testing private methods instead of behavior.
- Real timers, arbitrary sleeps, and unfinished async work.
- Wrong injector/provider instance.
- Over-mocking request or framework wiring.
- High coverage with missing failure, authorization, and idempotency tests.

> **A good test fails because behavior changed, not because timing changed.**

---

## 11. Scenario-based interview question

A payment test passes locally, fails randomly in CI, and is fixed temporarily by a two-second sleep. Explain how you would find the uncontrolled dependency, make completion deterministic, and decide the correct test level.

---

## Quick revision card

- **Core answer:** Configure the real HttpClient with the Angular testing backend, inject HttpTestingController, call the service, expect the exact request, flush success or failure, and verify that no requests remain.
- **Memory rule:** Call first, expect second, flush third, verify last.
- **Checks:** behavior, boundary, deterministic time/network, failure matrix, cleanup, and backend authority.

## Official Angular references

- [Testing overview](https://angular.dev/guide/testing)
- [Component testing](https://angular.dev/guide/testing/components-basics)
- [Testing services](https://angular.dev/guide/testing/services)
- [HTTP testing](https://angular.dev/guide/http/testing)
- [Routing tests](https://angular.dev/guide/routing/testing)
