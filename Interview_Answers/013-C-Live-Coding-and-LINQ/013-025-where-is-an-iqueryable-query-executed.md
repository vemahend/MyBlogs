# 25. Where is an IQueryable query executed?

**Technology:** C# Live Coding and LINQ

**Source question:** 25. Where is an IQueryable query executed?

## 1. What is it?

An `IQueryable<T>` query is executed by its query provider when the result is requested.

For example, with Entity Framework Core, the provider normally translates the query into SQL, sends it to the database, and the database does most of the filtering, sorting, grouping, and paging. The returned rows are then converted into .NET objects.

`IQueryable<T>` does not always mean “executed in a database.” The actual location depends on the provider. A database provider may execute it on a database server, while an in-memory provider may execute it inside the application.

## 2. Why is it important?

The execution location directly affects performance, memory use, network traffic, and scalability.

If filtering and paging run in the database, the application receives only the rows it needs. If data is loaded too early and then filtered in .NET, the application may transfer and hold thousands of unnecessary records.

Senior developers need to understand the query boundary so they can predict generated SQL, avoid accidental client-side work, and keep production endpoints efficient.

## 3. How does it work?

Building an `IQueryable<T>` usually does not execute it immediately. Each LINQ operator adds another expression to an expression tree.

Execution normally follows this flow:

1. The application builds the query with operators such as `Where`, `OrderBy`, `Select`, and `Take`.
2. A terminal operation such as `ToListAsync()`, `FirstAsync()`, `CountAsync()`, or enumeration asks for the result.
3. The query provider reads the expression tree.
4. With EF Core, the provider translates supported expressions into a database command, usually SQL.
5. The database executes that command.
6. EF Core reads the returned data and materializes the result in the application.

Some work always happens in the application, such as building the expression tree and materializing returned rows. A final projection may also contain limited client-side calculation, but EF Core requires filters and most other query operations to be translatable. An unsupported expression in those parts normally causes a runtime translation exception.

Calling `AsEnumerable()` creates an important boundary: operators added after it use LINQ to Objects and run in the application when enumerated. Calling `ToListAsync()` executes and materializes the query immediately.

## 4. Practical example

A payment service needs the latest 50 failed payments for one merchant.

The service builds an EF Core `IQueryable<Payment>` with the merchant and status filters, orders by failure time, selects only the fields needed by the response, and applies `Take(50)`. When it calls `ToListAsync()`, EF Core sends the translated command to the database. The database returns only those 50 projected records.

This is much more efficient than loading every payment into the service and filtering them in memory.

## 5. Scenario-based interview answer

**Problem:** A payment-history endpoint was slow and used too much memory. The code materialized every payment before applying the merchant filter and paging.

**Decision:** I kept the query as `IQueryable<Payment>` until all database-supported filtering, ordering, projection, and paging had been added.

**Implementation:** I used `AsNoTracking()` for the read-only request, applied `Where`, `OrderByDescending`, `Select`, and `Take`, and then called `ToListAsync()` with a cancellation token. I also checked the generated SQL for this important query.

**Result:** The database performed the heavy work and returned only the required rows and columns. The endpoint used less memory, transferred less data, and responded faster.

In an interview, I would say: “An `IQueryable` query is executed by its provider when the query is enumerated or a terminal method is called. With EF Core, supported operations are normally translated to SQL and executed by the database. The application still builds the query and materializes the result. I avoid materializing or switching to `IEnumerable` before filters and paging have been applied.”

## 6. Code example

```csharp
public sealed record FailedPaymentSummary(
    Guid PaymentId,
    decimal Amount,
    DateTime FailedAtUtc);

public async Task<IReadOnlyList<FailedPaymentSummary>> GetFailedPaymentsAsync(
    Guid merchantId,
    CancellationToken cancellationToken)
{
    IQueryable<FailedPaymentSummary> query = dbContext.Payments
        .AsNoTracking()
        .Where(p => p.MerchantId == merchantId &&
                    p.Status == PaymentStatus.Failed)
        .OrderByDescending(p => p.FailedAtUtc)
        .Select(p => new FailedPaymentSummary(
            p.Id,
            p.Amount,
            p.FailedAtUtc))
        .Take(50);

    return await query.ToListAsync(cancellationToken);
}
```

The statements before `ToListAsync()` build an expression tree; they do not normally query the database. `ToListAsync()` triggers execution. EF Core translates the supported operations, the database applies them, and the application materializes the returned rows as `FailedPaymentSummary` records.

By contrast, this moves later processing into the application:

```csharp
IEnumerable<Payment> payments = dbContext.Payments.AsEnumerable();

IEnumerable<Payment> failedPayments = payments
    .Where(p => IsFailedPayment(p));
```

`AsEnumerable()` does not fetch the rows by itself, but the custom filter after it is LINQ to Objects. When `failedPayments` is enumerated, the database query supplies rows and `IsFailedPayment` runs in the application. This can be expensive if the database query was not narrowed first.

## 7. Common mistakes

- Saying that every `IQueryable<T>` always executes on a database server. Execution depends on its provider.
- Calling `ToList()` or `ToListAsync()` before adding filters, projection, sorting, or paging.
- Calling `AsEnumerable()` too early and unknowingly moving later operations into the application.
- Assuming that creating an `IQueryable<T>` executes it immediately. Most queries use deferred execution.
- Enumerating the same query more than once and causing multiple database calls.
- Using custom .NET methods inside a database query and assuming the provider can translate them.
- Ignoring the generated SQL, query plan, or number of database round trips for critical queries.
- Returning an unrestricted `IQueryable<T>` across application boundaries, making performance and security harder to control.

## 8. Follow-up interview questions

### What triggers an `IQueryable<T>` query to execute?

Enumeration or a terminal operator triggers it. Examples include `foreach`, `ToListAsync()`, `FirstAsync()`, `SingleAsync()`, `AnyAsync()`, and `CountAsync()`.

### Does `AsEnumerable()` execute the query immediately?

No. It changes subsequent operators to LINQ to Objects but keeps deferred execution. The source is queried when the sequence is later enumerated.

### What happens if EF Core cannot translate part of the query?

If the unsupported expression is outside the final projection, current EF Core versions normally throw a runtime exception. A developer must rewrite it into a translatable form or deliberately move to client-side processing after first limiting the data appropriately.
