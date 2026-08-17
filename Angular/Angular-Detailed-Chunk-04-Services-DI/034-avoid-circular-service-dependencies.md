# How Do You Avoid Circular Dependencies Between Services?

> Senior Angular/.NET interview guide using payment and banking examples.

## 1. What problem does it solve?

Service A depending on B while B depends on A makes construction impossible or fragile and usually reveals confused responsibilities. Barrel imports can also create JavaScript module cycles even when DI tokens look valid.

---

## 2. Explain it in simple language

Break cycles by fixing ownership: extract the shared capability, invert one dependency behind a narrow port, or introduce an orchestrator that depends on both. Do not hide the cycle with Injector lookups or delayed calls.

### Memory rule

> **A cycle is an architecture smell, not a DI puzzle.**

### Interview-ready answer

> Break cycles by fixing ownership: extract the shared capability, invert one dependency behind a narrow port, or introduce an orchestrator that depends on both. Do not hide the cycle with Injector lookups or delayed calls. For production I would also explain the dependency owner, injector scope, failure behavior, testing boundary, and which security or financial rules remain authoritative on the ASP.NET Core API.

---

## 3. How does it work internally?

1. Angular recursively resolves a requested provider graph.
2. A requests B; B requests A before A can finish construction.
3. The injector detects circular resolution or runtime initialization becomes undefined.
4. Separately, ES module import cycles can expose partially initialized exports.
5. Refactoring restores a directed dependency graph.

### Practical interpretation

Use dependency direction rules: UI/facade → API port; workflow → policies/ports; low-level utilities should not call higher-level workflows. Also remove broad index/barrel imports when they create module cycles.

### Incorrect versus improved approach

```typescript
const payment=inject(Injector).get(PaymentService); // hides cycle
// Extract a port/context or orchestrator instead.
```

### Runtime mental model

1. A consumer requests a token while Angular has an active injection context.
2. Angular searches the nearest element/environment injector and then walks upward.
3. The matching provider creates or returns an instance and that injector owns its lifetime.
4. Services collaborate through typed boundaries; view state returns to components through signals or Observables.
5. When a route/component injector is destroyed, scoped resources must stop and sensitive state must disappear.

---

## 4. Realistic payment or banking example

PaymentService calls FraudService, while FraudService calls PaymentService to read amount. Extract PaymentContext/PaymentQuery and let PaymentWorkflow orchestrate both. Fraud evaluation should consume a request model, not call back into payment workflow.

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

1. Workflow owns sequence.
2. PaymentQuery supplies payment data.
3. FraudPolicy evaluates an explicit context.
4. Dependencies point one direction.
5. Each unit is independently testable.

### Failure flow

1. Services inject each other.
2. Developer uses Injector.get inside a method.
3. Cycle is hidden until a rare path runs.
4. Testing and initialization order become unpredictable.
5. Responsibilities are separated instead.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
@Injectable() class PaymentWorkflow {
 private payments=inject(PaymentApi);
 private fraud=inject(FraudPolicy);
 approve(id:string){
  return this.payments.get(id).pipe(switchMap(p=>this.fraud.evaluate(toContext(p))));
 }
}

// FraudPolicy does not inject PaymentWorkflow.
```

### ASP.NET Core boundary

```csharp
public sealed class ApprovePaymentHandler(IPaymentRepository repo,IFraudPolicy fraud)
{
 public async Task<Result> Handle(Guid id,CancellationToken ct){
  var payment=await repo.GetAsync(id,ct);
  return await fraud.EvaluateAsync(PaymentRiskContext.From(payment),ct);
 }
}
```

### How to test it

Add architecture tests or dependency-graph checks, unit-test the extracted policy with a plain context, and integration-test the orchestrator’s success/failure sequence.

### Production verification

- Test direct URL refresh, route exit, logout, and a second-user session.
- Delay and reorder API responses; test cancellation and stale-result handling.
- Exercise 401, 403, 404, validation, 409 concurrency, timeout, and 500 responses.
- Verify retries never duplicate financial commands and the API enforces idempotency.
- Inspect the injector hierarchy when instances unexpectedly differ.
- Ensure logs include correlation IDs but exclude tokens, account details, and payment credentials.

---

## 7. Important design decisions

- Identify true owner.
- Extract the smallest stable contract.
- Pass data instead of callback dependencies.
- Keep composition at the edge.
- Inspect DI and module-import graphs separately.

A technical-lead answer should explain why a particular injector owns the instance, what happens during navigation or logout, and why the design stays testable without weakening backend authority.

---

## 8. When to use and when not to use it

### Use it when

- Use orchestrators and ports to maintain directed dependencies.

### Avoid or reconsider it when

- Injector.get, forwardRef, or event buses as default cycle fixes.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| DI cycle | Provider construction graph cycle |
| Import cycle | ES module initialization cycle |
| Orchestrator | Owns sequence across capabilities |
| Domain event | Decouples completed facts, not synchronous queries |

---

## 10. Common production mistakes

- Hiding cycle with service locator.
- God shared service.
- Bidirectional feature imports.
- Using events for request/response.
- No dependency rules.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

PaymentService and FraudService inject each other. Show two valid redesigns and explain which owns orchestration.

---

## Quick revision card

- **Core answer:** Break cycles by fixing ownership: extract the shared capability, invert one dependency behind a narrow port, or introduce an orchestrator that depends on both. Do not hide the cycle with Injector lookups or delayed calls.
- **Memory rule:** A cycle is an architecture smell, not a DI puzzle.
- **Design checks:** token, provider, injector, scope, ownership, failure, cleanup, and API authority.
- **Production checks:** refresh, logout, duplicate action, stale response, unauthorized call, and telemetry.

## Official Angular references

- [Dependency injection](https://angular.dev/guide/di)
- [Defining dependency providers](https://angular.dev/guide/di/defining-dependency-providers)
- [Hierarchical injectors](https://angular.dev/guide/di/hierarchical-dependency-injection)
- [HTTP interceptors](https://angular.dev/guide/http/interceptors)
- [Testing services](https://angular.dev/guide/testing/services)
