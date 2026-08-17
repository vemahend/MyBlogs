# What Is the Difference Between Pure and Impure Pipes?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

Angular must decide how often a template transformation is recalculated. Recomputing expensive work on every synchronization hurts performance, while skipping changes to a mutated object can show stale output.

---

## 2. Explain it in simple language

Pure pipes are the default and run when a primitive input changes or an object/array reference changes. Impure pipes use `pure:false` and may run during every template synchronization, so they can notice in-place mutation but are easy to make expensive.

### Memory rule

> **Pure watches identity; impure pays repeatedly.**

### Interview-ready answer

> Pure pipes are the default and run when a primitive input changes or an object/array reference changes. Impure pipes use `pure:false` and may run during every template synchronization, so they can notice in-place mutation but are easy to make expensive. In production I would also explain who owns the state, how the view behaves during change and destruction, and which validation or authorization must remain authoritative in ASP.NET Core.

---

## 3. How does it work internally?

1. Angular stores prior pipe arguments for a pure binding.
2. If primitive values and object references are unchanged, the previous result can be reused.
3. Replacing an array reference causes a pure pipe to run.
4. Mutating the same array does not change its reference.
5. An impure pipe is invoked frequently and must therefore be extremely cheap and side-effect-free.

### Practical interpretation

Pure does not mean Angular proves mathematical purity; it is the execution strategy you promise is safe. A pipe should still avoid side effects. The built-in AsyncPipe is intentionally impure but internally manages subscription state and only marks the view when new values arrive.

### Incorrect versus improved approach

```typescript
@Pipe({name:'filterTransactions',pure:false})
transform(items:Tx[],term:string){ return items.filter(x=>JSON.stringify(x).includes(term)); }
// Move heavy filtering to computed state or paged API query.
```

### Runtime mental model

1. Angular compiles the template and identifies directives, pipes, bindings, and embedded views.
2. Runtime values are evaluated during view synchronization.
3. Angular updates the host node or reconciles embedded views using the declared identity and state.
4. Child components, subscriptions, and DOM resources follow the lifetime of the view that owns them.
5. Browser behavior remains a user-experience layer; backend policies protect money and data.

---

## 4. Realistic payment or banking example

A transaction-status label pipe is pure: the status code changes from `Pending` to `Settled`, so the primitive input changes. Filtering 20,000 transactions with an impure pipe is a poor design; filter in a computed/store or on the server with pagination.

### Full-stack responsibility split

| Angular | ASP.NET Core |
|---|---|
| Render explicit loading, empty, ready, and error states | Return authorized, least-privilege DTOs |
| Format values and guide input | Validate authoritative currency, precision, limits, and status |
| Hide/disable actions for usability | Enforce authorization, concurrency, and idempotency |
| Reconcile rows with stable IDs | Provide stable resource identity |
| Avoid stale work and release view resources | Honour cancellation and protect server capacity |

---

## 5. Successful flow and failure flow

### Successful flow

1. State updates immutably.
2. Array/object references change when content changes.
3. Pure pipe recalculates only for relevant input identity changes.
4. Rendering stays predictable.
5. Large datasets are filtered/paged outside the pipe.

### Failure flow

1. Code pushes into the same array.
2. Pure pipe does not rerun and UI looks stale.
3. Developer sets `pure:false`.
4. Now filtering runs across every check and keystroke.
5. CPU usage rises; fix immutable state and move heavy work.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
@Pipe({name:'paymentStatus',standalone:true})
export class PaymentStatusPipe implements PipeTransform {
 transform(value:PaymentStatus):string {
  return ({Pending:'Pending review',Settled:'Settled',Rejected:'Rejected'} as const)[value];
 }
}

// Prefer immutable list updates:
transactions.update(items => [...items, newTransaction]);
```

### ASP.NET Core boundary

```csharp
[HttpGet]
public Task<PagedResult<TransactionDto>> Search([FromQuery]TransactionQuery query,CancellationToken ct)
 => transactions.SearchAuthorizedAsync(query,User,ct);
```

### How to test it

Count transform invocations in a host test for same reference, replaced reference, and mutation. Benchmark realistic list sizes rather than tiny fixtures. Verify server paging/filter authorization independently.

### Production verification

- Exercise refresh, rapid interaction, delayed API responses, and navigation away.
- Verify keyboard, focus, labels, disabled state, and screen-reader semantics.
- Profile a realistic list rather than a ten-row demo.
- Test 401, 403, 404, 409, validation failure, and transient server failure.
- Confirm the browser never receives secrets merely hidden by a directive or pipe.
- Confirm logs use correlation IDs and avoid account, card, and payment credentials.

---

## 7. Important design decisions

- Default to pure.
- Use immutable updates.
- Move heavy transformations out of templates.
- Use server-side filtering for large datasets.
- Require measured justification for impure pipes.

A senior answer should state the rejected alternative and its failure mode. Naming an Angular API is not enough; explain identity, ownership, lifetime, performance, accessibility, and server authority.

---

## 8. When to use and when not to use it

### Use it when

- Pure: deterministic display transforms; impure: rare cheap cases requiring framework-aware repeated checks.

### Avoid or reconsider it when

- Impure collection filtering, network calls, mutable sorting, or hidden external-state dependency.

---

## 9. Compare it with related concepts

| Concept | Primary responsibility |
|---|---|
| Pure pipe | Runs on primitive/reference change |
| Impure pipe | Runs very frequently |
| Computed signal | Caches based on tracked reactive dependencies |
| Server query | Filters/paginates near the data |

---

## 10. Common production mistakes

- In-place mutation with pure pipe.
- Switching to impure as a patch.
- Sorting input array.
- Heavy work per row.
- Side effects in transform.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

A pure filter pipe appears stale after `items.push`, so a developer marks it impure and the table becomes slow. Give a root-cause fix and a scalable design.

---

## Quick revision card

- **Core answer:** Pure pipes are the default and run when a primitive input changes or an object/array reference changes. Impure pipes use `pure:false` and may run during every template synchronization, so they can notice in-place mutation but are easy to make expensive.
- **Memory rule:** Pure watches identity; impure pays repeatedly.
- **Senior checks:** identity, ownership, lifetime, accessibility, performance, and backend authority.
- **Failure checks:** mutation, stale view, duplicate action, unauthorized API call, and contract drift.

## Official Angular references

- [Control flow](https://angular.dev/guide/templates/control-flow)
- [Structural directives](https://angular.dev/guide/directives/structural-directives)
- [Pipes](https://angular.dev/guide/templates/pipes)
