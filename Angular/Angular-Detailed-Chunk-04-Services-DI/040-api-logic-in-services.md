# Why Should API Logic Usually Live in Services Instead of Components?

> Senior Angular/.NET interview guide using payment and banking examples.

## 1. What problem does it solve?

When components know URLs, headers, DTOs, error codes, cancellation, caching, and mapping, presentation becomes tied to transport. Reuse and testing suffer, and every screen handles failures differently.

---

## 2. Explain it in simple language

Keep components focused on view events and rendering. Put typed HTTP transport in API services, mapping at the boundary, and multi-step screen workflow/state in a facade or store. Keep authoritative business rules in ASP.NET Core.

### Memory rule

> **Component renders; client transports; facade coordinates; API decides.**

### Interview-ready answer

> Keep components focused on view events and rendering. Put typed HTTP transport in API services, mapping at the boundary, and multi-step screen workflow/state in a facade or store. Keep authoritative business rules in ASP.NET Core. For production I would also explain the dependency owner, injector scope, failure behavior, testing boundary, and which security or financial rules remain authoritative on the ASP.NET Core API.

---

## 3. How does it work internally?

1. Component emits a user intent.
2. Facade validates local readiness and enters submitting state.
3. API client uses HttpClient; interceptors add common transport concerns.
4. Client maps transport response/error into typed results.
5. Facade updates readonly view state; component renders it.

### Practical interpretation

Do not merely move messy component code into one giant service. Separate transport from workflow when complexity justifies it. A tiny page can inject an API client directly; add a facade when it owns meaningful state transitions or coordination.

### Incorrect versus improved approach

```typescript
this.http.post('/api/payments',this.form.value).subscribe({
 next:x=>{this.loading=false;this.router.navigate(...)}, error:e=>{/* repeated mapping */}
});
```

### Runtime mental model

1. A consumer requests a token while Angular has an active injection context.
2. Angular searches the nearest element/environment injector and then walks upward.
3. The matching provider creates or returns an instance and that injector owns its lifetime.
4. Services collaborate through typed boundaries; view state returns to components through signals or Observables.
5. When a route/component injector is destroyed, scoped resources must stop and sensitive state must disappear.

---

## 4. Realistic payment or banking example

TransferPage calls facade.submit. PaymentApi sends the request with an idempotency key. ASP.NET Core authorizes, validates balance/limits, uses concurrency control, commits transaction/outbox, and returns a safe result.

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

1. Component handles submit event.
2. Facade prevents local duplicate intent.
3. Client sends typed command.
4. API atomically processes and returns result.
5. Facade renders success or recoverable error.

### Failure flow

1. Component nests three subscriptions and mutates five flags.
2. Navigation leaves work running.
3. 409 is displayed as unknown error.
4. A second component copies different behavior.
5. Extract client/facade and explicit state machine.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
@Component({templateUrl:'./transfer.page.html'})
export class TransferPage {
 private readonly facade=inject(TransferFacade);
 readonly state=this.facade.state;
 submit(){this.facade.submit(this.form.getRawValue());}
}

@Injectable({providedIn:'root'})
export class PaymentApi {
 private http=inject(HttpClient);
 create(request:CreatePaymentRequest,key:string){
  return this.http.post<PaymentDto>('/api/payments',request,{headers:{'Idempotency-Key':key}});
 }
}
```

### ASP.NET Core boundary

```csharp
[Authorize]
[HttpPost]
public async Task<IActionResult> Create(CreatePaymentRequest request,
 [FromHeader(Name="Idempotency-Key")]string key,CancellationToken ct)
{
 var result=await workflow.CreateAsync(request,key,User,ct);
 return result.ToActionResult();
}
```

### How to test it

Test component DOM with fake facade, facade transitions with fake API, API client with HTTP testing, and backend integration for authorization/idempotency/concurrency. Include delayed and out-of-order responses.

### Production verification

- Test direct URL refresh, route exit, logout, and a second-user session.
- Delay and reorder API responses; test cancellation and stale-result handling.
- Exercise 401, 403, 404, validation, 409 concurrency, timeout, and 500 responses.
- Verify retries never duplicate financial commands and the API enforces idempotency.
- Inspect the injector hierarchy when instances unexpectedly differ.
- Ensure logs include correlation IDs but exclude tokens, account details, and payment credentials.

---

## 7. Important design decisions

- Thin component, not empty component.
- Typed DTO/VM mapping.
- Explicit screen state.
- Cancellation and stale-result policy.
- Server authority for money/security.

A technical-lead answer should explain why a particular injector owns the instance, what happens during navigation or logout, and why the design stays testable without weakening backend authority.

---

## 8. When to use and when not to use it

### Use it when

- Almost all reusable endpoint integration and nontrivial workflows.

### Avoid or reconsider it when

- Adding pass-through layers with no responsibility in a trivial screen.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Component | Presentation and user intent |
| API service | HTTP/DTO boundary |
| Facade/store | Workflow and view state |
| Backend service | Authoritative domain transaction |

---

## 10. Common production mistakes

- HttpClient in many components.
- Nested subscriptions.
- Raw DTO in template.
- Duplicated error mapping.
- Client-only financial validation.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

A 1,200-line transfer component performs HTTP, mapping, retries, navigation, and flags. Design an incremental extraction with tests and clear failure ownership.

---

## Quick revision card

- **Core answer:** Keep components focused on view events and rendering. Put typed HTTP transport in API services, mapping at the boundary, and multi-step screen workflow/state in a facade or store. Keep authoritative business rules in ASP.NET Core.
- **Memory rule:** Component renders; client transports; facade coordinates; API decides.
- **Design checks:** token, provider, injector, scope, ownership, failure, cleanup, and API authority.
- **Production checks:** refresh, logout, duplicate action, stale response, unauthorized call, and telemetry.

## Official Angular references

- [Dependency injection](https://angular.dev/guide/di)
- [Defining dependency providers](https://angular.dev/guide/di/defining-dependency-providers)
- [Hierarchical injectors](https://angular.dev/guide/di/hierarchical-dependency-injection)
- [HTTP interceptors](https://angular.dev/guide/http/interceptors)
- [Testing services](https://angular.dev/guide/testing/services)
