# How Do switchMap, mergeMap, concatMap, and exhaustMap Differ?

> Senior Angular/.NET interview guide with payment and banking examples.

## 1. What problem does it solve?

Angular applications coordinate values arriving over time: route changes, form input, HTTP responses, WebSockets, timers, and user commands. Without an explicit execution, concurrency, error, and lifetime model, stale results overwrite new state, duplicate requests occur, and destroyed views continue working.

---

## 2. Explain it in simple language

switchMap keeps the latest inner stream, mergeMap runs inner streams concurrently, concatMap queues them in order, and exhaustMap ignores new source values while one inner stream is active.

### Memory rule

> **Switch latest; merge parallel; concat queue; exhaust busy.**

### Interview-ready answer

> switchMap keeps the latest inner stream, mergeMap runs inner streams concurrently, concatMap queues them in order, and exhaustMap ignores new source values while one inner stream is active. In production I also state who subscribes, what cancels, whether the source is cold or shared, how errors are represented, and which correctness guarantees remain on ASP.NET Core.

---

## 3. How does it work internally?

1. An Observable describes a producer and normally waits for subscription.
2. Operators build a new pipeline for timing, mapping, concurrency, errors, and teardown.
3. AsyncPipe, toSignal, or explicit subscribe owns the running execution.
4. Error or completion terminates a stream; unsubscription runs teardown early.
5. For HttpClient, unsubscribe can abort transport, but cannot reverse a server commit.

### Practical interpretation

Using switchMap for payment creation may unsubscribe the browser request after the server has already committed; cancellation is not rollback.

### Runtime example

```typescript
search$.pipe(switchMap(q=>api.search(q)));
ids$.pipe(mergeMap(id=>api.get(id),4));
audit$.pipe(concatMap(e=>api.send(e)));
submit$.pipe(exhaustMap(c=>api.create(c,idempotencyKey)));
```

A senior developer distinguishes client cancellation from server correctness. If the browser stops listening after a transfer request reached the API, the API may still complete. Financial commands therefore require authorization, validation, concurrency control, and idempotency independently of RxJS.

---

## 4. Realistic payment or banking example

Use switchMap for beneficiary search, bounded mergeMap for independent reads, concatMap for ordered uploads, and exhaustMap for payment submission. A submitted command still requires API idempotency.

### Full-stack responsibility split

| Angular/RxJS | ASP.NET Core |
|---|---|
| Cancel stale reads and model explicit states | Bound query work and honor cancellation |
| Choose switch/merge/concat/exhaust semantics | Enforce command idempotency and concurrency |
| Map safe failures for the UI | Return safe ProblemDetails/status codes |
| Scope caches and subscriptions to owner/user | Authorize every resource and action |
| Prevent accidental duplicate UI intent | Remain correct under retries and lost responses |

---

## 5. Successful flow and failure flow

### Successful flow

1. A typed trigger emits a route value, search term, refresh, or command.
2. Operators normalize it and apply the intended concurrency policy.
3. One deliberate owner subscribes.
4. Success, empty, or typed error state reaches the view.
5. Navigation/destruction tears down view-owned work.

### Failure flow

1. The wrong operator or duplicate subscription starts unintended work.
2. Responses arrive out of order or a command is repeated.
3. A generic error handler hides the real state.
4. Navigation leaves a long-lived producer active.
5. Fix ownership, operator semantics, teardown, and backend guarantees.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
search$.pipe(switchMap(q=>api.search(q)));
ids$.pipe(mergeMap(id=>api.get(id),4));
audit$.pipe(concatMap(e=>api.send(e)));
submit$.pipe(exhaustMap(c=>api.create(c,idempotencyKey)));
```

### ASP.NET Core boundary

```csharp
[Authorize]
[HttpGet]
public Task<IActionResult> Get(CancellationToken ct)
    => query.GetAuthorizedAsync(User,ct);

[HttpPost]
public Task<IActionResult> Create(CreatePayment request,string idempotencyKey,CancellationToken ct)
    => workflow.CreateIdempotentlyAsync(request,idempotencyKey,User,ct);
```

### How to test it

Use controlled or marble-style streams. Delay and reverse responses, create multiple subscriptions, destroy the component, and assert request count, emitted state, teardown, and error continuation. For commands, simulate a lost response and retry with the same idempotency key, then assert one server effect.

### Production verification

- Count actual requests and subscribers.
- Navigate away during active work.
- Test offline, timeout, 401, 403, 409, 429, and 500.
- Inspect memory, sockets, timers, and listeners after repeated visits.
- Verify caches clear on logout and tenant change.
- Ensure logs never contain tokens or account credentials.

---

## 7. Important design decisions

- Match operator to domain
-  bound concurrency
-  prevent queues
-  place errors correctly
-  server idempotency

Also document source cardinality, cold/hot behavior, subscription owner, error boundary, and server guarantees.

---

## 8. When to use and when not to use it

### Use it when

- The behavior matches the stated concurrency and lifetime semantics.
- The stream improves composition of events, HTTP, routes, forms, or live updates.

### Avoid or reconsider it when

- It hides a simple synchronous value or introduces a subscription with no clear owner.
- It is being used to pretend client cancellation provides server rollback or security.

---

## 9. Compare it with related concepts

| Concept | Responsibility |
|---|---|
| switchMap | Latest wins |
| mergeMap | Parallel |
| concatMap | Sequential queue |
| exhaustMap | Ignore while active |

---

## 10. Common production mistakes

- Nested or duplicate subscriptions.
- Wrong flattening operator for a write.
- Catching errors at the wrong level.
- Unbounded cache, concurrency, or queue.
- Missing teardown or cross-user cache isolation.

> **Cancellation controls client work; idempotency protects server effects.**

---

## 11. Scenario-based interview question

A payment screen makes duplicate requests, stale responses overwrite current data, and subscriptions remain after navigation. Explain how you would identify the owner, source type, operator, error boundary, teardown, and server-side protection.

---

## Quick revision card

- **Core answer:** switchMap keeps the latest inner stream, mergeMap runs inner streams concurrently, concatMap queues them in order, and exhaustMap ignores new source values while one inner stream is active.
- **Memory rule:** Switch latest; merge parallel; concat queue; exhaust busy.
- **Checks:** source, owner, cold/hot, operator, error, teardown, cache, and API authority.

## Official references

- [Angular HTTP requests](https://angular.dev/guide/http/making-requests)
- [AsyncPipe](https://angular.dev/api/common/AsyncPipe)
- [RxJS interop](https://angular.dev/ecosystem/rxjs-interop)
- [takeUntilDestroyed](https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed)
- [RxJS operators](https://rxjs.dev/guide/operators)
