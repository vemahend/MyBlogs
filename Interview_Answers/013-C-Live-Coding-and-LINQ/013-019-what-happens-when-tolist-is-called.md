# 19. What happens when ToList is called?

**Technology:** C# Live Coding and LINQ

**Source question:** 19. What happens when ToList is called?

## 1. What is it?

`ToList()` is a LINQ materialization method. It immediately reads every item from a source sequence and puts the items into a new `List<T>`.

Before `ToList()` is called, a LINQ query may only describe work that will happen later. After `ToList()` finishes, the result is an in-memory list that can be reused without enumerating the original query again.

## 2. Why is it important?

`ToList()` creates a clear execution point. This is useful when the application needs to:

- Execute a deferred query now.
- Reuse results without running the query again.
- Pass a stable collection to another part of the application.
- Close a database or network resource after reading its results.

It also has a cost. The whole result must be read and stored in memory. In a real system, calling `ToList()` too early can load far more data than needed or cause filtering to happen in the application instead of the database.

## 3. How does it work?

For LINQ to Objects, `Enumerable.ToList()` enumerates the source from beginning to end and adds each item to a new `List<T>`. Enumeration happens during the call, so any filtering, mapping, ordering, or other deferred work in the query runs at that time.

The new list contains the item values returned by the source. For reference types, it is a new list containing the same object references; it does not make deep copies of the objects.

For an Entity Framework Core `IQueryable<T>`, enumeration causes the provider to translate the expression tree, send the query to the database, read the rows, and create entity or projection objects. In asynchronous application code, `ToListAsync(cancellationToken)` should normally be used so the thread is not blocked while database I/O is in progress.

If enumeration fails, for example because the query throws or the database call fails, `ToList()` does not return a partially completed list to the caller. The exception is passed to the caller.

## 4. Practical example

Suppose a payment API needs the latest 100 failed payments for one merchant. The service first builds an EF Core query with the merchant, status, ordering, and row-limit conditions. It then calls `ToListAsync` once.

At that point, EF Core sends the query to the database and materializes at most 100 results. The service can use that list for response mapping and logging without executing the database query again.

## 5. Scenario-based interview answer

“In a payment-reporting service, a query was converted to a list before the merchant and date filters were applied. That caused a large number of payment rows to be loaded into application memory and then filtered locally.

I kept the data as `IQueryable<Payment>` while applying all database-supported filters, ordering, and paging. I called `ToListAsync` only at the boundary where the API actually needed the results, and I passed the request cancellation token.

This produced one bounded SQL query, reduced memory use and data transfer, and gave the rest of the method a stable list that could be reused without another database call.”

## 6. Code example

```csharp
var payments = new List<Payment>
{
    new(1, "Failed", 125m),
    new(2, "Completed", 80m)
};

IEnumerable<Payment> failedQuery =
    payments.Where(payment => payment.Status == "Failed");

// ToList executes the deferred Where query now.
List<Payment> failedSnapshot = failedQuery.ToList();

payments.Add(new Payment(3, "Failed", 250m));

Console.WriteLine(failedSnapshot.Count); // 1
Console.WriteLine(failedQuery.Count());   // 2; the original query runs again

public sealed record Payment(int Id, string Status, decimal Amount);
```

`failedSnapshot` is a new list containing the result at the time `ToList()` was called. Adding another payment to the source does not add it to that list. Enumerating `failedQuery` later runs the deferred query again and sees the updated source.

An EF Core version would normally materialize asynchronously after all filters are applied:

```csharp
List<Payment> failedPayments = await dbContext.Payments
    .AsNoTracking()
    .Where(payment => payment.MerchantId == merchantId)
    .Where(payment => payment.Status == PaymentStatus.Failed)
    .OrderByDescending(payment => payment.CreatedAtUtc)
    .Take(100)
    .ToListAsync(cancellationToken);
```

Here, the filtering, ordering, and limit remain part of the database query. `ToListAsync` executes it and creates the in-memory list.

## 7. Common mistakes

- Calling `ToList()` before `Where`, `Select`, `Take`, or paging, which can load unnecessary data into memory.
- Assuming `ToList()` makes deep copies. Objects in the new list can still refer to the same mutable instances as the source.
- Calling `ToList()` repeatedly on the same database query and causing repeated database calls.
- Using synchronous `ToList()` for EF Core database work in an asynchronous web request instead of `ToListAsync`.
- Materializing a very large or unbounded result set and causing high memory use or an out-of-memory failure.
- Forgetting to pass a cancellation token to `ToListAsync` in request-based code.
- Assuming an EF Core query must succeed because it compiled. Translation and database errors can occur only when the query is materialized.

## 8. Follow-up interview questions

### What is the difference between `ToList()` and `ToArray()`?

Both enumerate the source immediately and store all results in memory. `ToList()` returns a resizable `List<T>`, while `ToArray()` returns a fixed-size array.

### Does `ToList()` always execute a database query?

No. It executes whatever source it receives. For an in-memory `IEnumerable<T>`, it enumerates objects in the process. For an unexecuted EF Core query, materialization normally causes a database query.

### When should `ToList()` be called in an EF Core query?

Usually after all translatable filters, projections, ordering, and paging have been applied, at the point where the application actually needs the results. In asynchronous code, prefer `ToListAsync` and pass a cancellation token.
