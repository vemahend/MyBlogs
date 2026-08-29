# 46. How would you improve this code for production?

**Technology:** C# Live Coding and LINQ

**Source question:** 46. How would you improve this code for production?

## 1. What is it?

This is a production-readiness question. The interviewer wants to know how I would turn working code into code that is safe, fast, secure, observable, and easy to maintain in a real system.

No code snippet is included with the source question, so I would not invent defects and present them as facts. I would first ask to see the code, understand its expected behaviour, and learn its production constraints. I would then improve the highest risks first rather than perform a large rewrite.

## 2. Why is it important?

Code that works in a demo may fail under real traffic, bad input, concurrent requests, network delays, or partial outages. In a payment system, one missed concurrency issue can be more serious than many style problems because it may charge a customer twice.

A production implementation normally needs:

- Correct input validation and business rules.
- Efficient database queries and bounded result sets.
- Async I/O, cancellation, and sensible timeouts.
- Safe handling of retries, concurrency, and partial failure.
- Authorization and protection of sensitive data.
- Structured logs, metrics, and traces without exposing secrets.
- Clear dependencies and automated tests.

These qualities make incidents less likely and make failures easier to diagnose and recover from.

## 3. How does it work?

I would improve the code in this order:

1. Confirm what the method must do, including empty input, duplicates, and failure cases.
2. Protect correctness first. Validate input and identify transaction, concurrency, and idempotency requirements.
3. Inspect I/O. Use async APIs end to end, propagate `CancellationToken`, and apply timeouts to remote calls.
4. Inspect LINQ and database access. Keep filters and projections on `IQueryable<T>`, avoid early `ToList`, select only needed columns, and use pagination for large results.
5. Make dependencies explicit through interfaces and dependency injection so business behaviour can be tested.
6. Add structured logging, metrics, tracing, and useful error handling. Expected failures should become clear application results; unexpected failures should be logged centrally.
7. Add tests for the happy path, boundaries, concurrency, cancellation, and dependency failures.
8. Measure the result with profiling, query plans, and load tests before making further optimizations.

The exact changes depend on the code. For example, parallel execution helps only when operations are independent, and retries are safe only when an operation is idempotent.

## 4. Practical example

Suppose an API returns a customer's completed payments. The initial code loads every payment with `ToList`, filters in memory, has no result limit, and returns database entities directly.

For production, I would authorize access to the requested customer, keep the filtering in the database, use `AsNoTracking` for the read-only query, project to a response DTO, order the result consistently, and apply a page-size limit. I would use `ToListAsync` with the request cancellation token and log only safe identifiers and timing information.

This reduces memory use and database traffic, prevents accidental exposure of entity fields, and stops unnecessary work when the request is cancelled.

## 5. Scenario-based interview answer

“I would first confirm the expected behaviour and traffic profile because production improvements depend on context. I would then rank changes by risk: correctness and security first, followed by reliability, performance, observability, and maintainability.

For example, I worked on a payment-history endpoint that materialized the full table before filtering and returned persistence entities. It was correct with test data but used too much memory and could expose fields that were not part of the API contract.

I kept the query as `IQueryable`, added customer and status filters before materialization, projected only the required fields, used `AsNoTracking`, and enforced bounded pagination with stable ordering. I also propagated the request cancellation token, checked authorization before querying, added structured timing logs, and covered empty pages and cancellation in tests.

The result was less data transferred, predictable memory use, a stable API response, and better diagnostics. I would make small, measurable changes like these and preserve behaviour with tests rather than rewrite everything at once.”

## 6. Code example

This simplified code has several common production concerns:

```csharp
public List<Payment> GetCompletedPayments(Guid customerId)
{
    return db.Payments
        .ToList()
        .Where(p => p.CustomerId == customerId && p.Status == "Completed")
        .ToList();
}
```

A more production-ready read path could be:

```csharp
public sealed record PaymentSummary(
    Guid Id,
    decimal Amount,
    DateTimeOffset CompletedAt);

public async Task<IReadOnlyList<PaymentSummary>> GetCompletedPaymentsAsync(
    Guid customerId,
    int page,
    int pageSize,
    CancellationToken cancellationToken)
{
    if (customerId == Guid.Empty)
        throw new ArgumentException("Customer ID is required.", nameof(customerId));

    if (page < 1)
        throw new ArgumentOutOfRangeException(nameof(page));

    pageSize = Math.Clamp(pageSize, 1, 100);

    return await db.Payments
        .AsNoTracking()
        .Where(p => p.CustomerId == customerId &&
                    p.Status == PaymentStatus.Completed)
        .OrderByDescending(p => p.CompletedAt)
        .ThenByDescending(p => p.Id)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(p => new PaymentSummary(p.Id, p.Amount, p.CompletedAt))
        .ToListAsync(cancellationToken);
}
```

The database now performs the filtering, ordering, projection, and pagination. `AsNoTracking` avoids change-tracking overhead for a read-only operation. The DTO exposes only required data, the enum avoids a fragile status string, and the cancellation token reaches EF Core. `ToListAsync` and `AsNoTracking` are supported EF Core APIs, including current supported EF Core versions.

For very deep pages or rapidly changing data, I would consider keyset pagination instead of `Skip` and `Take`. Authorization must also be enforced by the API or application layer; accepting a `customerId` is not proof that the caller may view that customer's payments.

## 7. Common mistakes

- Changing code before confirming its required behaviour.
- Treating formatting or naming as more important than correctness and security.
- Rewriting the whole method without characterization tests.
- Calling `ToList` before database filters, projections, and limits.
- Returning database entities directly from an API.
- Adding async methods but still using `.Result`, `.Wait()`, or synchronous I/O inside them.
- Accepting a cancellation token but not passing it to database and HTTP calls.
- Adding retries to non-idempotent payment operations.
- Running dependent operations in parallel or sharing one EF Core `DbContext` across concurrent tasks.
- Logging passwords, tokens, card details, or personal information.
- Catching `Exception`, hiding the failure, and returning a successful response.
- Optimizing without measurements or checking the generated SQL and query plan.

## 8. Follow-up interview questions

### What would you improve first?

I would fix issues that can cause wrong results, security breaches, data loss, or duplicate side effects first. I would then address reliability and measured performance problems before lower-risk cleanup.

### Should every database query use `AsNoTracking`?

No. It is useful for read-only queries. If the loaded entity will be updated through the same `DbContext`, normal tracking may be the simpler and correct choice.

### How would you prove the code is production-ready?

I would use automated tests, integration tests against the real data store, query and dependency telemetry, security checks, and load tests based on expected traffic. Production readiness is supported by evidence, not by code appearance alone.
