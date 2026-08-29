# 6. Group orders by customer.

**Technology:** C# Live Coding and LINQ

**Source question:** 6. Group orders by customer.

## 1. What is it?

Grouping orders by customer means collecting all orders that belong to the same customer into one group.

In LINQ, `GroupBy` is commonly used for this. Each group has a key, such as `CustomerId`, and contains the orders that match that key.

## 2. Why is it important?

Business systems often need a customer-level view instead of a flat list of orders. For example, a payment platform may need the total amount, number of orders, or latest order for every customer.

Grouping solves this without writing manual nested loops. It makes aggregation rules easier to read and reduces the risk of mixing one customer's data with another customer's data.

## 3. How does it work?

For an in-memory collection, LINQ follows this flow:

1. Read each order.
2. Use the selected key, such as `CustomerId`, to decide which group receives the order.
3. Create one group for each distinct key.
4. Apply operations such as `Count`, `Sum`, or `OrderByDescending` to each group.

`GroupBy` uses the key's equality rules. For a string key, matching is case-sensitive by default. A stable identifier such as a numeric customer ID or `Guid` is normally safer than a customer name.

With LINQ to Objects, `GroupBy` uses deferred execution: the source is processed when the result is enumerated. With Entity Framework Core, a query that projects aggregate values can usually be translated into SQL `GROUP BY`, but translation depends on the exact query shape and EF Core version.

## 4. Practical example

A banking system receives card-payment orders from many customers. At the end of the day, it needs a summary containing each customer's number of orders and total payment amount.

The system groups orders by `CustomerId`, counts the orders in each group, and sums their amounts. The result can be used for reconciliation, daily limits, or fraud monitoring.

## 5. Scenario-based interview answer

**Problem:** A payment operations team was loading every order and calculating customer totals with repeated loops. The code was slow, difficult to test, and sometimes produced duplicate customer rows.

**Decision:** I grouped by the immutable `CustomerId`, not by customer name, and projected only the summary fields the team needed.

**Implementation:** I used `GroupBy` followed by `Select` to calculate the order count, total amount, and latest order time for each customer. Because the data came from Entity Framework Core, I kept the query as `IQueryable` until `ToListAsync` so the database could perform the grouping and return only the summaries.

**Result:** The application transferred less data, produced one consistent row per customer, and the aggregation rule became simple to test and maintain.

## 6. Code example

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

public sealed record Order(
    int Id,
    int CustomerId,
    decimal Amount,
    DateTimeOffset CreatedAt);

public sealed record CustomerOrderSummary(
    int CustomerId,
    int OrderCount,
    decimal TotalAmount,
    DateTimeOffset LatestOrderAt);

public static class OrderGrouping
{
    public static IReadOnlyList<CustomerOrderSummary> SummarizeByCustomer(
        IEnumerable<Order> orders)
    {
        ArgumentNullException.ThrowIfNull(orders);

        return orders
            .GroupBy(order => order.CustomerId)
            .Select(group => new CustomerOrderSummary(
                CustomerId: group.Key,
                OrderCount: group.Count(),
                TotalAmount: group.Sum(order => order.Amount),
                LatestOrderAt: group.Max(order => order.CreatedAt)))
            .OrderBy(summary => summary.CustomerId)
            .ToList();
    }
}

var orders = new[]
{
    new Order(1, 101, 120.50m, DateTimeOffset.Parse("2026-08-20T09:00:00Z")),
    new Order(2, 102, 75.00m,  DateTimeOffset.Parse("2026-08-20T10:00:00Z")),
    new Order(3, 101, 30.00m,  DateTimeOffset.Parse("2026-08-21T08:30:00Z"))
};

var summaries = OrderGrouping.SummarizeByCustomer(orders);
```

`GroupBy(order => order.CustomerId)` creates one group per customer. `group.Key` is the customer ID, while `Count`, `Sum`, and `Max` calculate values from that customer's orders. `ToList` materializes the result so it is evaluated once. `ArgumentNullException.ThrowIfNull` is available in .NET 6 and later.

The normal time complexity is O(n), plus O(g log g) for the final ordering, where `n` is the number of orders and `g` is the number of customers.

## 7. Common mistakes

- Grouping by customer name or email instead of a stable customer ID.
- Ignoring case rules when a string must be used as the grouping key.
- Grouping by the whole customer object when different object instances represent the same customer.
- Calling `ToList` before an Entity Framework Core `GroupBy`, which loads all orders and performs the grouping in application memory.
- Using `double` for money instead of `decimal` or a well-defined money value type.
- Assuming groups or items have a guaranteed order. Apply `OrderBy` explicitly when order matters.
- Forgetting that deferred execution may enumerate a changing source more than once.
- Returning every order when the caller needs only totals, causing unnecessary memory and network use.

## 8. Follow-up interview questions

### How would you group by both customer and order date?

Use a composite key, for example `GroupBy(order => new { order.CustomerId, Date = order.CreatedAt.UtcDateTime.Date })`. First confirm which time zone defines the business date.

### How would you make a string customer key case-insensitive?

For LINQ to Objects, pass `StringComparer.OrdinalIgnoreCase` to `GroupBy`. For a database query, use a normalized key or an appropriate database collation because a .NET comparer is not generally translated to SQL.

### Should grouping happen in the application or the database?

For large database-backed data sets, group and aggregate in the database and return only the summary rows. In-memory grouping is suitable when the data is already loaded or when the rule cannot be translated safely by the data provider.
