# How Do Interceptors Fit with Services?

> Senior Angular/.NET interview guide using payment and banking examples.

## 1. What problem does it solve?

Every API service needs common HTTP concerns such as authentication headers, correlation IDs, telemetry, standardized error observation, and sometimes safe retry. Repeating these in each method creates inconsistent behavior.

---

## 2. Explain it in simple language

Services express domain-oriented HTTP operations; interceptors wrap the HttpClient pipeline for cross-cutting transport behavior. Current Angular guidance recommends functional interceptors because ordering is more predictable.

### Memory rule

> **Service says what request means; interceptor applies transport policy.**

### Interview-ready answer

> Services express domain-oriented HTTP operations; interceptors wrap the HttpClient pipeline for cross-cutting transport behavior. Current Angular guidance recommends functional interceptors because ordering is more predictable. For production I would also explain the dependency owner, injector scope, failure behavior, testing boundary, and which security or financial rules remain authoritative on the ASP.NET Core API.

---

## 3. How does it work internally?

1. HttpClient creates an immutable HttpRequest.
2. Registered interceptors run in order on the outgoing path.
3. Each interceptor clones a request if it needs modification and calls `next`.
4. The backend executes and response events return through the chain in reverse nesting.
5. The service maps transport DTOs/errors into a feature-friendly contract.

### Practical interpretation

An interceptor should remain a transport middleware, not become a business workflow. Token refresh needs single-flight coordination and loop prevention. Error interceptors may log/normalize common metadata, but services or facades still interpret domain conflicts such as insufficient funds or stale version.

### Incorrect versus improved approach

```typescript
retry({count:3}) // applied globally to every method/status
// Retry only transient, safe/idempotent operations with bounded backoff.
```

### Runtime mental model

1. A consumer requests a token while Angular has an active injection context.
2. Angular searches the nearest element/environment injector and then walks upward.
3. The matching provider creates or returns an instance and that injector owns its lifetime.
4. Services collaborate through typed boundaries; view state returns to components through signals or Observables.
5. When a route/component injector is destroyed, scoped resources must stop and sensitive state must disappear.

---

## 4. Realistic payment or banking example

PaymentApi posts a CreatePaymentRequest. An auth interceptor adds the access token; a correlation interceptor adds a trace ID. A retry policy must not blindly retry POST because duplicate financial effects require an idempotency contract.

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

1. Service creates one typed request.
2. Interceptor adds token and correlation ID.
3. API authorizes and processes idempotently.
4. Response returns through telemetry/error observation.
5. Service maps DTO to a view model.

### Failure flow

1. Retry interceptor retries every failure three times.
2. A POST reaches the API twice after a lost response.
3. No idempotency key exists.
4. Two payments are created.
5. Restrict retries and enforce server idempotency.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
export const authInterceptor:HttpInterceptorFn=(req,next)=>{
 const token=inject(AuthStore).accessToken();
 return next(token?req.clone({setHeaders:{Authorization:'Bearer ' + token}}):req);
};

provideHttpClient(withInterceptors([correlationInterceptor,authInterceptor]));

@Injectable({providedIn:'root'})
export class PaymentApi {
 private http=inject(HttpClient);
 create(body:CreatePaymentRequest,key:string){
  return this.http.post<PaymentDto>('/api/payments',body,{headers:{'Idempotency-Key':key}});
 }
}
```

### ASP.NET Core boundary

```csharp
[Authorize]
[HttpPost]
public Task<IActionResult> Create(CreatePaymentRequest request,
 [FromHeader(Name="Idempotency-Key")]string key,CancellationToken ct)
 => payments.CreateIdempotentlyAsync(key,request,User,ct);
```

### How to test it

Use Angular HTTP testing utilities: call the service, expect the request, inspect headers, flush success/error, and verify no unexpected requests. Test interceptor order and token-refresh concurrency separately.

### Production verification

- Test direct URL refresh, route exit, logout, and a second-user session.
- Delay and reorder API responses; test cancellation and stale-result handling.
- Exercise 401, 403, 404, validation, 409 concurrency, timeout, and 500 responses.
- Verify retries never duplicate financial commands and the API enforces idempotency.
- Inspect the injector hierarchy when instances unexpectedly differ.
- Ensure logs include correlation IDs but exclude tokens, account details, and payment credentials.

---

## 7. Important design decisions

- Prefer functional interceptors.
- Make ordering explicit.
- Clone immutable requests.
- Never retry unsafe commands blindly.
- Do not swallow errors globally.

A technical-lead answer should explain why a particular injector owns the instance, what happens during navigation or logout, and why the design stays testable without weakening backend authority.

---

## 8. When to use and when not to use it

### Use it when

- Authentication, tracing, transport telemetry, bounded generic policy.

### Avoid or reconsider it when

- Domain decisions, component navigation policy, or one endpoint’s unique mapping.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| API service | Endpoint/domain contract |
| Interceptor | Cross-cutting HTTP pipeline |
| Facade | Screen workflow/state |
| ASP.NET middleware | Server request pipeline |

---

## 10. Common production mistakes

- Global POST retry.
- Infinite refresh loop.
- Logging secrets.
- Interceptor redirects on every 401.
- Business errors converted to generic strings.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

Users occasionally create duplicate transfers after network timeouts. The team has a global retry interceptor. Diagnose the complete frontend and backend fix.

---

## Quick revision card

- **Core answer:** Services express domain-oriented HTTP operations; interceptors wrap the HttpClient pipeline for cross-cutting transport behavior. Current Angular guidance recommends functional interceptors because ordering is more predictable.
- **Memory rule:** Service says what request means; interceptor applies transport policy.
- **Design checks:** token, provider, injector, scope, ownership, failure, cleanup, and API authority.
- **Production checks:** refresh, logout, duplicate action, stale response, unauthorized call, and telemetry.

## Official Angular references

- [Dependency injection](https://angular.dev/guide/di)
- [Defining dependency providers](https://angular.dev/guide/di/defining-dependency-providers)
- [Hierarchical injectors](https://angular.dev/guide/di/hierarchical-dependency-injection)
- [HTTP interceptors](https://angular.dev/guide/http/interceptors)
- [Testing services](https://angular.dev/guide/testing/services)
