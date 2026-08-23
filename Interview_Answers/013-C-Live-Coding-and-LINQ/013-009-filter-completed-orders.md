# 9. Filter completed orders.

**Technology:** C# Live Coding and LINQ

**Source question:** 9. Filter completed orders.

## 1. What is it?

Filtering completed orders means selecting only the orders whose status shows that processing has finished.

In C#, LINQ provides the `Where` method for this. `Where` checks each order against a condition and returns only the matching orders.

## 2. Why is it important?

Applications often hold orders in several states, such as pending, processing, completed, cancelled, or failed. Filtering lets us work only with the records needed for a report, payment settlement, customer history, or another business process.

Using LINQ keeps this logic short and readable. It also reduces the risk of accidentally processing pending or failed orders as completed.

## 3. How does it work?

The `Where` method receives a predicate: a function that returns `true` or `false` for each order.

- If the predicate returns `true`, the order is included.
- If it returns `false`, the order is skipped.
- For an in-memory collection, LINQ normally uses deferred execution. The filtering happens when the result is enumerated, for example by `foreach` or `ToList()`.
- With Entity Framework Core and `IQueryable<Order>`, the provider usually translates the filter into a SQL `WHERE` clause, so the database returns only matching rows.

An enum is usually safer than comparing status text because it prevents spelling and casing errors.

## 4. Practical example

A payment service creates orders while customers make payments. At the end of the day, the settlement job must include only successfully completed orders. It filters by `OrderStatus.Completed`, then calculates the total amount to settle. Pending, failed, and cancelled orders are excluded.

## 5. Scenario-based interview answer

“In a payment system, we had to prepare a settlement report without including pending or failed orders. I used a strongly typed `OrderStatus` enum and filtered the query with `Where(o => o.Status == OrderStatus.Completed)`. Because the data came from Entity Framework Core, I kept the query as `IQueryable` until the final `ToListAsync`, allowing the condition to run in the database. I also added the required date and tenant filters before materializing the results. This reduced transferred data and prevented incomplete payments from entering the settlement report.”

## 6. Code example

```csharp
public enum OrderStatus
{
    Pending,
    Processing,
    Completed,
    Cancelled,
    Failed
}

public sealed record Order(
    int Id,
    decimal Amount,
    OrderStatus Status);

var orders = new List<Order>
{
    new(1, 120.00m, OrderStatus.Completed),
    new(2, 75.50m, OrderStatus.Pending),
    new(3, 210.00m, OrderStatus.Completed),
    new(4, 40.00m, OrderStatus.Failed)
};

List<Order> completedOrders = orders
    .Where(order => order.Status == OrderStatus.Completed)
    .ToList();
```

`Where` contains the filtering rule. `ToList` executes the query immediately and creates a separate list containing orders 1 and 3. The original `orders` collection is not changed.

For Entity Framework Core, the same idea can be applied asynchronously:

```csharp
List<OrderEntity> completedOrders = await dbContext.Orders
    .Where(order => order.Status == OrderStatus.Completed)
    .AsNoTracking()
    .ToListAsync(cancellationToken);
```

Here, Entity Framework Core translates the predicate into SQL. `AsNoTracking` is suitable when the results are read-only.

## 7. Common mistakes

- Comparing strings such as `order.Status == "complete"` when the stored value is `"Completed"`. Prefer an enum or another controlled status type.
- Calling `ToList()` before `Where` on an Entity Framework Core query. That can load every order into application memory before filtering.
- Forgetting that `Where` uses deferred execution and assuming the result is a fixed snapshot. Use `ToList` when a snapshot is required.
- Treating cancelled, refunded, or payment-authorized orders as completed without confirming the business definition.
- Forgetting other required boundaries, such as customer, tenant, account, or date filters.
- Using a synchronous database call in an asynchronous request path. Use `ToListAsync` with a cancellation token for EF Core queries.

## 8. Follow-up interview questions

### What is the difference between `Where` and `FirstOrDefault`?

`Where` returns all matching items as a sequence. `FirstOrDefault` returns only the first match, or the default value when no match exists.

### Does `Where` change the original collection?

No. It returns a filtered sequence. The source collection remains unchanged.

### How would you make this efficient with Entity Framework Core?

Apply `Where` while the query is still `IQueryable`, select only required columns, use `AsNoTracking` for read-only data, and materialize at the end with `ToListAsync`. A suitable database index can also help when the status filter is selective and matches the wider query pattern.
