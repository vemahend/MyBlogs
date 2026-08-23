# 45. What problems do you see in this code?

**Technology:** C# Live Coding and LINQ

**Source question:** 45. What problems do you see in this code?

## 1. What is it?

This is a code-review question. The interviewer wants to see whether I can find correctness, performance, reliability, security, and maintainability problems—not only syntax errors.

No code snippet is included with the source question, so I would not claim that a particular defect exists. In an interview, I would ask to see the code and understand what it is expected to do. I would then explain each issue with its impact and suggest the smallest safe improvement.

## 2. Why is it important?

Code can compile and still fail in production. For example, it may load an entire table into memory, block a request thread, process the same payment twice, expose customer data in logs, or ignore cancellation.

A senior developer should review more than the happy path. The important questions are:

- Does it produce the correct result for empty, null, duplicate, and concurrent input?
- Does it perform database and network work efficiently?
- Does it handle failure, timeout, and cancellation safely?
- Are security-sensitive values protected?
- Can the behaviour be tested and observed?

The severity matters too. A duplicate charge is more urgent than a naming issue.

## 3. How does it work?

I normally review the code in this order:

1. Confirm the required behaviour and assumptions.
2. Trace inputs, branches, side effects, and returned values.
3. Check nulls, boundaries, duplicates, exceptions, and concurrency.
4. Mark database, HTTP, file, and messaging calls. Check whether they are asynchronous, cancellable, and bounded by timeouts.
5. Inspect LINQ execution. `IQueryable<T>` may become SQL, while `IEnumerable<T>` runs in memory. Operators such as `ToList`, `First`, `Single`, and repeated enumeration affect behaviour and cost.
6. Check transaction and idempotency boundaries for operations that change money or state.
7. Check logging, secrets, authorization, and personal data.
8. Suggest changes in risk order and add tests that prove the important behaviour.

I also separate facts from possibilities. For example, `ToListAsync` is not automatically wrong; it is a problem when it materializes more rows or columns than the operation needs.

## 4. Practical example

Imagine a payment API that loads all payments, filters them in memory, checks whether an idempotency key already exists, calls a gateway with `.Result`, and then saves a new record.

Several problems may occur:

- Loading all rows wastes memory and database bandwidth.
- `.Result` blocks a thread and can contribute to thread-pool starvation.
- A check followed by an insert has a race condition: two requests can both pass the check.
- A missing cancellation token keeps work running after the client disconnects.
- Logging the full request could expose card or customer data.
- Charging before durable state is recorded makes recovery difficult if saving fails.

For production, I would query only what is needed, use async calls end to end, enforce idempotency with a database unique constraint, propagate cancellation, redact logs, and design the payment workflow so retries are safe.

## 5. Scenario-based interview answer

“I would first confirm the intended behaviour because a review needs context. Then I would trace the code from input to every database or external side effect.

In a payment service I reviewed, the method called `ToList` before filtering, used `.Result` on a gateway call, and performed an application-level duplicate check before inserting. The main risks were excessive data loading, blocked request threads, and duplicate charges under concurrent requests.

I kept the query as `IQueryable`, projected only the required data, and used `AnyAsync` and async gateway calls with the request cancellation token. More importantly, I added a unique database constraint for the idempotency key and made the gateway request idempotent. I also replaced sensitive request logging with structured, redacted fields and added tests for concurrent duplicate requests and gateway timeouts.

The result was a bounded query, no sync-over-async, and a payment flow that could be retried without charging the customer twice. I would report those correctness and reliability risks before discussing style improvements.”

## 6. Code example

This example represents the kind of code I would challenge:

```csharp
public Payment Process(PaymentRequest request)
{
    var payments = db.Payments.ToList();

    if (payments.Any(p => p.IdempotencyKey == request.IdempotencyKey))
        return payments.First(p =>
            p.IdempotencyKey == request.IdempotencyKey);

    var reference = gateway.ChargeAsync(request.Amount).Result;
    var payment = new Payment(request.IdempotencyKey, request.Amount, reference);

    db.Payments.Add(payment);
    db.SaveChanges();
    return payment;
}
```

A safer shape is:

```csharp
public async Task<Payment> ProcessAsync(
    PaymentRequest request,
    CancellationToken cancellationToken)
{
    ArgumentException.ThrowIfNullOrWhiteSpace(request.IdempotencyKey);

    if (request.Amount <= 0)
        throw new ArgumentOutOfRangeException(
            nameof(request.Amount), "Amount must be positive.");

    var existing = await db.Payments
        .SingleOrDefaultAsync(
            p => p.IdempotencyKey == request.IdempotencyKey,
            cancellationToken);

    if (existing is not null)
        return existing;

    var reference = await gateway.ChargeAsync(
        request.IdempotencyKey,
        request.Amount,
        cancellationToken);

    var payment = new Payment(
        request.IdempotencyKey,
        request.Amount,
        reference);

    db.Payments.Add(payment);
    await db.SaveChangesAsync(cancellationToken);
    return payment;
}
```

The query now runs in the database and returns at most one matching payment. The method is asynchronous end to end, validates input, and propagates cancellation. `SingleOrDefaultAsync` is appropriate only if the idempotency key is unique; the database must enforce that with a unique index.

The check alone still does not remove the concurrency race. Production code must handle a unique-constraint conflict by reading the winning record, and the external gateway must accept the same idempotency key so two concurrent requests cannot create two charges. `SingleOrDefaultAsync` and `SaveChangesAsync` are supported EF Core APIs; exact database exception handling depends on the EF Core provider.

## 7. Common mistakes

- Commenting only on formatting and missing correctness or production risks.
- Assuming code is wrong without asking what behaviour is required.
- Calling `ToList` before database filters and projections.
- Enumerating the same LINQ query several times, causing repeated work or repeated SQL.
- Using `First` when no match is valid, or using `Single` without a real uniqueness guarantee.
- Mixing `IEnumerable<T>` and `IQueryable<T>` without knowing where execution occurs.
- Calling `.Result` or `.Wait()` in asynchronous request code.
- Starting independent work concurrently when the operations actually require ordering or one transaction.
- Treating an application-level “exists” check as protection against concurrent duplicates.
- Ignoring cancellation, timeouts, retries, and partial failure.
- Logging tokens, card data, passwords, or full personal details.
- Proposing a large rewrite before adding tests around current behaviour.

## 8. Follow-up interview questions

### Is calling `ToList` always a problem?

No. Materialization is required when the caller needs a snapshot or in-memory processing. It should happen after database-supported filtering, ordering, projection, and pagination so only necessary data is loaded.

### Would `AnyAsync` followed by `FirstAsync` be a good improvement?

Usually not. That sends two queries and the data can change between them. Use one `SingleOrDefaultAsync` or `FirstOrDefaultAsync` query, based on whether uniqueness is guaranteed.

### Does `async` solve the duplicate-payment race?

No. Async improves thread usage; it does not provide atomicity. Use a unique database constraint, handle the conflict, and pass an idempotency key to the payment provider.
