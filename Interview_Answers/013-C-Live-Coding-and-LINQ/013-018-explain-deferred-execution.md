# 18. Explain deferred execution.

**Technology:** C# Live Coding and LINQ

**Source question:** 18. Explain deferred execution.

## 1. What is it?

Deferred execution means a LINQ query is usually not run when it is created. The query only describes what should happen. It runs later, when the application asks for its results.

For example, calling `Where` on an `IEnumerable<T>` creates a query. The query normally runs when it is enumerated by `foreach`, `ToList`, `Count`, `First`, or another operation that needs a result.

## 2. Why is it important?

Deferred execution lets us build a query step by step and run it only when the data is needed. This can avoid unnecessary work and allows the final query to include filters that are added later.

It is especially useful with Entity Framework Core because several LINQ operations can be combined into one database query. However, developers must understand when execution happens. Otherwise, they may run the same query many times, read changed data unexpectedly, or access a database after its `DbContext` has been disposed.

## 3. How does it work?

For LINQ to Objects, methods such as `Where`, `Select`, and `Take` usually return an `IEnumerable<T>` that stores the query logic. Each time the result is enumerated, that logic runs against the current source data.

For `IQueryable<T>`, such as an Entity Framework Core query, LINQ builds an expression tree. EF Core translates that expression into SQL when a terminal operation such as `ToListAsync`, `FirstOrDefaultAsync`, or `CountAsync` is called.

Some operations execute immediately. Examples include `ToList`, `ToArray`, `Count`, `Any`, `First`, and their supported asynchronous equivalents. `ToList` and `ToArray` also materialize a snapshot, so later enumeration uses the in-memory results instead of running the original query again.

## 4. Practical example

In a payment system, an API may start with all transactions, then add filters for account, date range, status, and page size. With EF Core, the team can compose those conditions as an `IQueryable<Transaction>` and call `ToListAsync` once at the end.

The database then receives one query containing the required filters. This avoids loading every transaction into application memory before filtering it.

## 5. Scenario-based interview answer

“In one payment-reporting service, we found that the same EF Core query was being enumerated twice: once to check whether results existed and again to build the response. That caused two database calls.

I kept the query deferred while adding the account, status, and date filters. At the application boundary, I executed it once with `ToListAsync`. I then used the materialized list for both the empty check and response mapping.

This made the execution point clear, reduced the database work from two queries to one, and gave the rest of the method a consistent snapshot of the results.”

## 6. Code example

```csharp
var transactions = new List<Transaction>
{
    new(1, "Pending", 150m),
    new(2, "Completed", 80m)
};

// This creates the query but does not run it.
IEnumerable<Transaction> pendingQuery =
    transactions.Where(t => t.Status == "Pending");

// The source changes before the query is executed.
transactions.Add(new Transaction(3, "Pending", 220m));

// ToList enumerates the query now. Both pending items are included.
List<Transaction> pendingSnapshot = pendingQuery.ToList();

// This later change does not affect the materialized snapshot.
transactions.Add(new Transaction(4, "Pending", 300m));

Console.WriteLine(pendingSnapshot.Count); // 2

public sealed record Transaction(int Id, string Status, decimal Amount);
```

`Where` is deferred, so it sees items added before `ToList` is called. `ToList` executes the query and stores its results. Changes made after that do not change `pendingSnapshot`.

With EF Core, the same idea applies, but enumeration may send SQL to the database rather than processing an in-memory collection.

## 7. Common mistakes

- Assuming the query runs when `Where` or `Select` is called.
- Enumerating the same deferred query several times and repeating expensive work or database calls.
- Returning an EF Core `IQueryable` or `IEnumerable` and enumerating it after the `DbContext` has been disposed.
- Calling `ToList` too early, which can move filtering from the database into application memory.
- Changing the source collection and being surprised that a later enumeration returns different results.
- Performing side effects inside `Where` or `Select`; repeated enumeration can repeat those side effects.
- Confusing deferred execution with lazy loading. Deferred execution controls when a query runs; lazy loading loads related data when a navigation property is accessed.

## 8. Follow-up interview questions

### Which LINQ methods normally use deferred execution?

Methods that return a sequence, such as `Where`, `Select`, `OrderBy`, and `Take`, are generally deferred. Methods that must produce a value or materialized collection, such as `Count`, `Any`, `First`, `ToList`, and `ToArray`, execute the query.

### What is the difference between `IEnumerable<T>` and `IQueryable<T>` here?

`IEnumerable<T>` normally runs .NET delegates against objects in memory. `IQueryable<T>` builds an expression tree that a provider, such as EF Core, can translate and execute against another data source.

### How do you prevent repeated execution?

Execute the query once at the correct boundary with a materializing operation such as `ToList` or `ToListAsync`, store the result, and reuse that result. Do this only after all useful filters have been applied.
