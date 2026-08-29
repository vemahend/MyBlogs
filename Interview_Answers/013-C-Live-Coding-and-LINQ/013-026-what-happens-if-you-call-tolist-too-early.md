# 26. What happens if you call ToList too early?

**Technology:** C# Live Coding and LINQ

**Source question:** 26. What happens if you call ToList too early?

## 1. What is it?

Calling `ToList()` too early means converting a LINQ query into an in-memory `List<T>` before all useful filters, sorting, joins, or projections have been added.

`ToList()` is a materialization method. It runs the query immediately and stores every returned item in memory. Any LINQ operations written after it run against that in-memory list rather than against the original source.

## 2. Why is it important?

The position of `ToList()` can change performance significantly.

For an EF Core query, calling it after `Where` and `Select` usually lets the database filter rows and return only the required columns. Calling it before those operations may load a large table into application memory and then filter it locally. This increases database traffic, memory use, response time, and possibly cloud cost.

For LINQ to Objects, an early `ToList()` can also waste memory and processing. However, it can be intentional when the application needs a snapshot or must enumerate the results several times.

## 3. How does it work?

Most LINQ operators such as `Where`, `Select`, and `OrderBy` use deferred execution. They build a query but do not read the data immediately.

When `ToList()` is called:

1. The query is executed.
2. All results produced at that point are read.
3. The results are copied into a new `List<T>`.
4. Later operations work on that list in the application process.

With EF Core, operations before `ToList()` can normally be translated into SQL. Operations after `ToList()` use LINQ to Objects and cannot reduce the rows already transferred from the database.

## 4. Practical example

Suppose a payment service needs the 100 failed payments from the last hour. If it first calls `ToList()` on the entire `Payments` table, it may load millions of records and then filter them in memory. Under production traffic, that can cause high memory usage, slower requests, and extra database load.

A better approach is to apply the date, status, ordering, limit, and projection first. The database then returns only the small result set the service needs.

## 5. Scenario-based interview answer

“In a payment-reporting API, I found that the repository called `ToListAsync()` before applying the merchant and date filters. That caused the service to retrieve far more payment rows than required.

I kept the query as `IQueryable` while adding the filters, projection, ordering, and row limit. I called `ToListAsync()` only at the application boundary where we actually needed the results. I also checked the generated SQL and query timing.

The database then performed the filtering, less data crossed the network, and the endpoint used much less memory. I would still materialize earlier if I deliberately needed a stable snapshot or if the remaining logic could not be translated, but that would be a conscious and measured decision.”

## 6. Code example

```csharp
// Too early: all payment rows are loaded before filtering.
var allPayments = await dbContext.Payments
    .ToListAsync(cancellationToken);

var failedPayments = allPayments
    .Where(p => p.Status == PaymentStatus.Failed &&
                p.CreatedAt >= cutoff)
    .Take(100)
    .ToList();

// Better: filtering, ordering, limiting, and projection happen in SQL.
var failedPaymentSummaries = await dbContext.Payments
    .AsNoTracking()
    .Where(p => p.Status == PaymentStatus.Failed &&
                p.CreatedAt >= cutoff)
    .OrderByDescending(p => p.CreatedAt)
    .Select(p => new PaymentSummary(
        p.Id,
        p.Amount,
        p.CreatedAt))
    .Take(100)
    .ToListAsync(cancellationToken);
```

In the better query, EF Core builds one SQL query. `AsNoTracking()` avoids change-tracking overhead for read-only data, `Select` limits the columns returned, and `ToListAsync()` executes the query only after it is fully shaped.

## 7. Common mistakes

- Calling `ToList()` inside a repository before the caller has applied filters.
- Assuming later `Where` or `Take` calls still run in the database.
- Loading full entities when a small projection is enough.
- Materializing data before pagination, which defeats database-side `Skip` and `Take`.
- Calling `ToList()` repeatedly and executing equivalent queries more than once.
- Believing `ToList()` is always wrong. It is useful when a snapshot is required, the data set is known to be small, or repeated enumeration should not repeat an expensive query.
- Using synchronous `ToList()` for database work in an asynchronous web request when `ToListAsync(cancellationToken)` is appropriate.

## 8. Follow-up interview questions

### What is deferred execution in LINQ?

It means the query is defined first but is not executed until it is enumerated or materialized by an operation such as `ToList()`, `First()`, or `Count()`.

### Is `ToList()` always a database call?

No. For EF Core `IQueryable` data, it normally executes a database query. For an in-memory `IEnumerable`, it enumerates the source and copies the items into a list.

### When is calling `ToList()` early reasonable?

It can be reasonable when the source is small, a stable snapshot is needed, the results will be reused several times, or later processing must use application-only logic. The cost should still be understood and measured.
