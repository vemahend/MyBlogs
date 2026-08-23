# 6. How do you avoid the N+1 query problem in EF?

**Technology:** SQL Server and Data Access

**Source question:** 6. How do you avoid the N+1 query problem in EF?

## 1. What is it?

The N+1 query problem happens when Entity Framework first runs one query to load a list of parent records and then runs one extra query for each parent to load related data.

For example, one query loads 100 customers. Accessing each customer's accounts then causes another 100 queries. The application sends 101 database queries when it could usually get the required data with one query, or a small fixed number of queries.

This most often happens when lazy loading is enabled, but it can also happen when a query is executed inside a loop.

## 2. Why is it important?

Every database call has a cost: network time, SQL parsing, connection-pool usage, and database work. The N+1 pattern may look harmless with a few local test records, but it becomes slow and expensive when production data grows.

Avoiding it gives us:

- Faster and more predictable response times.
- Less load on SQL Server and the connection pool.
- Fewer timeouts during busy periods.
- Queries whose cost does not unexpectedly grow with the number of returned records.

A senior developer should also avoid blindly loading every related entity. The goal is to fetch the data the use case needs with a controlled number of efficient queries.

## 3. How does it work?

A typical N+1 flow is:

1. EF loads a collection of parent entities with one SQL query.
2. Application code loops through those entities.
3. A navigation property is accessed during each loop iteration.
4. Lazy loading, or an explicit query inside the loop, sends a separate SQL query for every parent.

I avoid this by choosing the loading strategy before executing the query:

- **Projection:** Use `Select` to retrieve only the fields needed by the response. This is normally my first choice for read-only API queries.
- **Eager loading:** Use `Include` and `ThenInclude` when the application genuinely needs a tracked entity graph.
- **Explicit batch loading:** Collect the required keys and load all related rows with one `Contains` query, rather than querying inside a loop.
- **Disable or tightly control lazy loading:** Lazy loading is convenient, but it can hide database calls behind normal property access.

In EF Core, `AsSplitQuery()` can prevent a large joined `Include` query from producing a cartesian explosion. It runs a fixed query for each included collection, not one query per parent. It is therefore not the same as N+1, although the extra round trips should still be measured. `AsSingleQuery()` and `AsSplitQuery()` are supported in current EF Core versions.

## 4. Practical example

Consider a banking dashboard that lists 50 customer accounts with the latest five transactions for each account.

If the code loads the accounts and then queries transactions inside a loop, it sends 51 queries. Under normal traffic, that can consume many connections and make the dashboard slow.

Instead, I use a projection that asks SQL Server for the account summary and the required transaction fields as one planned operation. I also use `AsNoTracking()` because the dashboard is read-only. The API returns only the required columns and does not create a large tracked entity graph.

## 5. Scenario-based interview answer

**Problem:** In a payment service, an endpoint that returned merchants and their recent payments became slow as the number of merchants increased. Logging showed one query for the merchant list followed by one payment query per merchant.

**Decision:** I removed the hidden per-merchant loading and used an explicit projection because the endpoint only needed a response model, not editable EF entities.

**Implementation:** I projected merchant name, payment count, and recent payment details in the database query, added `AsNoTracking()`, and checked the generated SQL with `ToQueryString()` during development. I also enabled command logging and added an integration test that checked the endpoint did not issue a growing number of commands.

**Result:** The query count became fixed instead of increasing with the number of merchants. Response time became more stable, and SQL Server and connection-pool usage dropped during peak traffic.

In an interview, I would summarize it like this: "I prevent N+1 by treating navigation loading as an explicit query-design decision. For read APIs I normally project directly to a DTO. For domain operations that need entities, I use a focused `Include` or batch-load related data. I verify the generated SQL and query count because an `Include` alone is not always the most efficient answer."

## 6. Code example

```csharp
public sealed record AccountSummaryDto(
    long AccountId,
    string AccountNumber,
    decimal Balance,
    IReadOnlyList<TransactionDto> RecentTransactions);

public sealed record TransactionDto(
    long TransactionId,
    decimal Amount,
    DateTime CreatedUtc);

public async Task<List<AccountSummaryDto>> GetAccountSummariesAsync(
    long customerId,
    CancellationToken cancellationToken)
{
    return await dbContext.Accounts
        .AsNoTracking()
        .Where(account => account.CustomerId == customerId)
        .Select(account => new AccountSummaryDto(
            account.Id,
            account.AccountNumber,
            account.Balance,
            account.Transactions
                .OrderByDescending(transaction => transaction.CreatedUtc)
                .Take(5)
                .Select(transaction => new TransactionDto(
                    transaction.Id,
                    transaction.Amount,
                    transaction.CreatedUtc))
                .ToList()))
        .ToListAsync(cancellationToken);
}
```

Important points:

- `Select` tells EF Core exactly which columns and related rows are needed.
- The navigation property is used inside the expression tree, so EF Core translates it to SQL; it is not accessed later in a C# loop.
- `Take(5)` limits the transaction data for each account.
- `AsNoTracking()` reduces tracking overhead for this read-only operation.
- `ToListAsync()` executes the composed query only after all filters and projections have been added.

The exact SQL shape can vary by EF Core version and database provider, so I inspect the generated SQL and test it with realistic data.

## 7. Common mistakes

- Enabling lazy-loading proxies and accessing navigation properties inside loops without monitoring the generated commands.
- Calling `ToListAsync()` too early and then querying related data one item at a time.
- Replacing N+1 with a huge `Include` graph that returns duplicated rows and too much data.
- Using `Include` when projecting to a DTO; the projection should describe the required related data directly.
- Assuming `AsSplitQuery()` is N+1. It normally produces a fixed number of queries based on included collections, but its consistency and round-trip trade-offs still need consideration.
- Loading entire entities when the endpoint needs only a few columns.
- Testing only with small datasets and not reviewing command logs, generated SQL, execution plans, or query counts.
- Forgetting indexes on foreign keys and filter or sort columns. Removing N+1 does not automatically make the remaining SQL efficient.

## 8. Follow-up interview questions

### What is the difference between eager, explicit, and lazy loading?

Eager loading fetches related data as part of the planned query using `Include`. Explicit loading asks EF to load a navigation at a chosen time. Lazy loading automatically queries when a navigation property is accessed. Lazy loading is the easiest option to trigger an unnoticed N+1 problem.

### Should I always use `Include` to solve N+1?

No. Use `Include` when you need a tracked entity graph. For read-only endpoints, projection is often better because it returns only the fields and related rows required by the response.

### When would you use `AsSplitQuery()`?

I consider it when multiple collection `Include`s create a very large joined result with repeated data. It trades one large join for a small, fixed set of queries. I measure both approaches and consider consistency if related data can change between those queries.
