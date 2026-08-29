# 27. How does EF Core translate LINQ to SQL?

**Technology:** C# Live Coding and LINQ

**Source question:** 27. How does EF Core translate LINQ to SQL?

## 1. What is it?

Entity Framework Core lets us write database queries using C# LINQ. It reads the LINQ expression, converts the supported parts into a database-specific SQL command, sends that command to the database, and turns the returned rows into .NET objects.

EF Core does not translate ordinary compiled C# code. It translates an **expression tree** created from an `IQueryable<T>` query. The database provider, such as SQL Server or PostgreSQL, produces the final SQL for its database.

## 2. Why is it important?

LINQ gives developers a strongly typed way to query data without building SQL strings by hand. The compiler can catch many property-name and type errors, and queries can be composed from reusable parts.

Translation also matters for performance. Operations such as filtering, joining, sorting, grouping, and selecting should normally run in the database, where indexes and the query optimizer can be used. A senior developer needs to know where execution happens and must still inspect the generated SQL for important queries. LINQ makes data access easier, but it does not guarantee efficient SQL.

## 3. How does it work?

The normal flow is:

1. A `DbSet<T>` exposes `IQueryable<T>`.
2. LINQ methods such as `Where`, `OrderBy`, and `Select` build an expression tree. They do not usually execute the query yet.
3. A terminal operation such as `ToListAsync`, `FirstAsync`, or `CountAsync` starts execution.
4. EF Core processes the expression tree, translates supported .NET operations into its internal query representation, and lets the configured provider generate parameterized SQL.
5. The database executes the SQL and returns rows.
6. EF Core materializes those rows into entities, anonymous objects, DTOs, or scalar values. Entity results are tracked unless the query is configured otherwise.

EF Core caches the compiled form of reusable query shapes, while values such as an account ID are normally sent as SQL parameters. Parameterization improves plan reuse and protects against SQL injection for values.

Not every .NET method has a SQL equivalent. In modern EF Core, an expression that cannot be translated normally causes an exception if it appears in a filter or another server-side part of the query. Limited client evaluation is allowed only in the final projection. This behavior has applied since EF Core 3.0; provider and EF Core version can still affect which expressions are supported.

## 4. Practical example

Suppose a banking API needs the ten most recent completed payments for one account. The application should not load every payment and then filter in memory. It should keep the query as `IQueryable`, apply the account filter, status filter, ordering, projection, and limit, and only then call `ToListAsync`.

EF Core can translate that query into parameterized SQL containing `WHERE`, `ORDER BY`, and a provider-specific row limit such as `TOP`. The database returns only the required columns and rows, reducing network traffic, memory use, and response time.

## 5. Scenario-based interview answer

**Problem:** A payment-history endpoint was slow because it called `ToListAsync` before applying its filters. Thousands of tracked payment entities were loaded, and the remaining LINQ ran in application memory.

**Decision:** I kept the query as `IQueryable` until all database-supported operations had been added. I projected directly to a response DTO, used `AsNoTracking` for this read-only endpoint, and limited the result set.

**Implementation:** I checked the SQL with `ToQueryString`, enabled command logging in a safe development environment, and reviewed the actual database execution plan and indexes. I also passed the request cancellation token to `ToListAsync`.

**Result:** The database filtered and sorted the data, only the required ten rows were transferred, and the endpoint used much less memory.

In an interview, I would summarize it like this: “EF Core translates the expression tree behind an `IQueryable` into provider-specific, parameterized SQL when the query is executed. I keep filtering and projection in the query, inspect generated SQL for critical paths, and avoid assuming that every C# method can be translated efficiently.”

## 6. Code example

```csharp
public sealed record PaymentSummary(
    Guid Id,
    decimal Amount,
    DateTime CreatedUtc);

public async Task<List<PaymentSummary>> GetRecentPaymentsAsync(
    Guid accountId,
    CancellationToken cancellationToken)
{
    IQueryable<PaymentSummary> query = dbContext.Payments
        .AsNoTracking()
        .Where(p => p.AccountId == accountId &&
                    p.Status == PaymentStatus.Completed)
        .OrderByDescending(p => p.CreatedUtc)
        .Select(p => new PaymentSummary(
            p.Id,
            p.Amount,
            p.CreatedUtc))
        .Take(10)
        .TagWith("Recent completed payments");

    // Useful during development; it does not execute the query.
    string sql = query.ToQueryString();

    return await query.ToListAsync(cancellationToken);
}
```

Until `ToListAsync` is called, `query` is an expression tree rather than a list of payments. For SQL Server, EF Core typically translates the query into SQL shaped like this:

```sql
SELECT TOP(@__p_1) [p].[Id], [p].[Amount], [p].[CreatedUtc]
FROM [Payments] AS [p]
WHERE [p].[AccountId] = @__accountId_0
  AND [p].[Status] = 1
ORDER BY [p].[CreatedUtc] DESC;
```

The exact SQL, parameter names, and status representation depend on the EF Core version, provider, and model configuration. `AsNoTracking` avoids tracking overhead for a read-only query. `Select` fetches only required columns, `Take` limits rows in the database, and `ToQueryString` helps inspect the generated command during development.

## 7. Common mistakes

- Calling `ToList`, `AsEnumerable`, or another materializing/client boundary too early, then filtering and sorting in memory.
- Using custom C# methods inside `Where` and expecting every method to translate to SQL.
- Returning full tracked entities when a small read-only DTO is enough.
- Creating an N+1 query problem by loading related data once per row.
- Using `Include` for several collection relationships without checking for large joins and duplicated result data. Split queries may help, but their consistency and round-trip trade-offs must be considered.
- Logging sensitive parameter values in production. Detailed or sensitive-data logging should be used carefully.
- Assuming readable LINQ always creates fast SQL instead of checking generated SQL, execution plans, indexes, and row counts.
- Building predicates with raw SQL string concatenation. Use LINQ parameters or safe parameterized raw-SQL APIs when raw SQL is genuinely required.

## 8. Follow-up interview questions

### What is the difference between `IQueryable<T>` and `IEnumerable<T>` here?

`IQueryable<T>` keeps an expression tree that EF Core can translate and run in the database. After switching to `IEnumerable<T>`, later LINQ normally runs as .NET code in application memory.

### How can you see the SQL generated by EF Core?

Use `ToQueryString()` while developing, or configure EF Core command logging and diagnostics. For performance problems, also inspect the database's actual execution plan because generated SQL alone does not show the real runtime cost.

### What happens when part of a query cannot be translated?

In modern EF Core, an untranslatable server-side expression normally throws an exception. Rewrite it using supported expressions, map a database function, or explicitly move to client evaluation only after the database has reduced the result to a safely bounded data set.
