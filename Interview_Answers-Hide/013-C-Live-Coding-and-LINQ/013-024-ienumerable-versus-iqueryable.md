# 24. IEnumerable versus IQueryable?

**Technology:** C# Live Coding and LINQ

**Source question:** 24. IEnumerable versus IQueryable?

## 1. What is it?

`IEnumerable<T>` and `IQueryable<T>` both represent a sequence of items, but they are designed for different kinds of execution.

- `IEnumerable<T>` runs LINQ operations as .NET code against objects in memory. It is commonly used with arrays, lists, and other in-memory collections.
- `IQueryable<T>` builds an expression tree that a query provider can translate into another query language. Entity Framework Core, for example, usually translates it into SQL and sends it to a database.

`IQueryable<T>` inherits from `IEnumerable<T>`, but that does not mean they behave the same way. The important difference is where the query is executed.

## 2. Why is it important?

Choosing the correct interface affects performance, memory use, database traffic, and application design.

With `IQueryable<T>`, filters, sorting, projections, and paging can be translated and executed by the database. This avoids loading unnecessary rows and columns into the application.

With `IEnumerable<T>`, later LINQ operations run in the application process. That is suitable when the data is already in memory or when an operation cannot be translated by the database provider.

In real systems, accidentally changing from `IQueryable<T>` to `IEnumerable<T>` too early can turn a small database query into a large data transfer and cause slow responses or high memory usage.

## 3. How does it work?

Both interfaces commonly use deferred execution: defining a query does not normally run it immediately. Execution starts when the sequence is enumerated, for example by `foreach`, `ToListAsync()`, `FirstAsync()`, or `CountAsync()`.

For `IEnumerable<T>`:

1. LINQ operators such as `Where` use delegates such as `Func<T, bool>`.
2. When enumeration starts, .NET processes the items in the application.
3. Each item passes through the LINQ pipeline as needed.

For `IQueryable<T>`:

1. LINQ operators receive expressions such as `Expression<Func<T, bool>>`.
2. They build an expression tree describing the query.
3. The provider, such as EF Core, translates the supported expression into SQL.
4. The database executes the SQL and returns the result.
5. EF Core materializes the returned rows as .NET objects or projected values.

Calling `ToList()`, `ToListAsync()`, `AsEnumerable()`, or another materializing or boundary operation changes what happens next. `ToListAsync()` executes the database query and creates an in-memory list. `AsEnumerable()` does not itself fetch all rows immediately, but operators added after it use LINQ to Objects and are no longer translated to SQL.

## 4. Practical example

Consider a banking API that displays the latest 20 completed transactions for one account.

Using `IQueryable<Transaction>` allows the application to add the account filter, status filter, ordering, projection, and `Take(20)` before executing the query. The database returns only the required 20 rows and selected columns.

If the application calls `ToListAsync()` before adding those filters, it may load thousands of transactions into memory and then filter them with `IEnumerable<T>`. The final result may be correct, but the implementation wastes database bandwidth, application memory, and processing time.

## 5. Scenario-based interview answer

**Problem:** A transaction-history endpoint became slow because the repository loaded all transactions and the service then applied filtering and paging in memory.

**Decision:** I kept the query as `IQueryable<Transaction>` while composing database-supported filters, ordering, projection, and paging. I exposed a task-specific repository method rather than allowing an unrestricted query to leak across application boundaries.

**Implementation:** I filtered by account and transaction status, ordered by booking date, projected directly to a response DTO, applied `Take`, and finally executed the query with `ToListAsync()`. I also used `AsNoTracking()` because the endpoint was read-only.

**Result:** The database returned only the requested records and columns. Response time, memory use, and network traffic dropped, while the service still returned the same business result.

In an interview, I would summarize it like this: “I use `IQueryable` while I want the data source to translate and execute the query. I use `IEnumerable` when the data is already in memory or when I deliberately need .NET-only logic. I place the execution boundary carefully and inspect the generated SQL for important queries.”

## 6. Code example

```csharp
public sealed record TransactionSummary(
    Guid Id,
    decimal Amount,
    DateTime BookedAtUtc);

public async Task<IReadOnlyList<TransactionSummary>> GetRecentTransactionsAsync(
    Guid accountId,
    CancellationToken cancellationToken)
{
    IQueryable<Transaction> query = dbContext.Transactions
        .AsNoTracking()
        .Where(t => t.AccountId == accountId &&
                    t.Status == TransactionStatus.Completed);

    return await query
        .OrderByDescending(t => t.BookedAtUtc)
        .Select(t => new TransactionSummary(
            t.Id,
            t.Amount,
            t.BookedAtUtc))
        .Take(20)
        .ToListAsync(cancellationToken);
}
```

The query remains `IQueryable<Transaction>` until `ToListAsync()` is called. EF Core can therefore translate the filtering, ordering, projection, and limit into SQL. `AsNoTracking()` avoids change-tracking overhead for this read-only operation, and the cancellation token lets the database work be cancelled if the request ends.

For comparison, this introduces an in-memory execution boundary too early:

```csharp
IEnumerable<Transaction> transactions =
    await dbContext.Transactions.ToListAsync(cancellationToken);

var recent = transactions
    .Where(t => t.AccountId == accountId)
    .Take(20);
```

Here, the database returns every transaction before .NET applies the filter and limit.

## 7. Common mistakes

- Calling `ToList()` or `ToListAsync()` before applying filters, projections, sorting, or paging.
- Calling `AsEnumerable()` without realizing that later operators will execute as LINQ to Objects.
- Assuming every .NET method can be translated by an `IQueryable` provider. In current EF Core versions, an unsupported expression normally causes a runtime translation exception rather than silently applying a filter on the client.
- Returning `IQueryable<T>` from a repository or API boundary and allowing callers to build uncontrolled, inefficient, or security-sensitive queries.
- Enumerating the same deferred query several times, which may execute it several times.
- Using synchronous database enumeration in an asynchronous web request when async EF Core methods are available.
- Forgetting stable ordering before paging, which can produce inconsistent pages.
- Thinking that `IEnumerable<T>` always means all data is already loaded. It can also represent a lazy stream; the key point is that its LINQ operators execute as .NET code.

## 8. Follow-up interview questions

### Does assigning an EF Core query to `IEnumerable<T>` immediately run it?

No. Assignment alone does not normally execute the query. However, LINQ operators selected after the switch use `Enumerable` methods and run in .NET when enumeration occurs. Materialization methods such as `ToListAsync()` execute the query immediately.

### What is the difference between `AsEnumerable()` and `ToList()`?

`AsEnumerable()` changes subsequent LINQ processing to LINQ to Objects but does not itself materialize the sequence. `ToList()` enumerates the source immediately and stores all returned items in a list.

### Should a repository return `IQueryable<T>`?

Usually I prefer task-specific methods or specifications so the data-access layer controls query shape, performance, and security. Returning `IQueryable<T>` can be reasonable inside a tightly controlled data-access boundary, but exposing it widely leaks persistence concerns and makes generated queries harder to govern.
