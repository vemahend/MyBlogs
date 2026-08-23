# 7. Calculate total order value per customer.

**Technology:** C# Live Coding and LINQ

**Source question:** 7. Calculate total order value per customer.

## 1. What is it?

Calculating total order value per customer means grouping orders by customer and adding the value of all orders in each group.

In LINQ, this is normally done with `GroupBy` and `Sum`. The result contains one row for each customer and that customer's total order value.

## 2. Why is it important?

This calculation is used in customer statements, sales reports, loyalty programs, credit checks, and account dashboards.

Without grouping, the application only has individual orders. Grouping and summing turns those details into useful business information, such as how much each customer has spent. A senior developer must also make sure that money uses `decimal`, cancelled orders are handled correctly, and large datasets are aggregated in the database rather than loaded into application memory.

## 3. How does it work?

The usual LINQ flow is:

1. Filter out orders that should not be counted, such as cancelled orders.
2. Group the remaining orders by `CustomerId`.
3. Calculate the value of each order, if it is not already stored.
4. Use `Sum` to add the values inside each customer group.
5. Project the result into a small result object.

With LINQ to Objects, this work runs in the .NET process. With Entity Framework Core and `IQueryable`, supported `GroupBy` and `Sum` expressions are translated into SQL, so the database performs the aggregation.

The business definition of “order value” must be clear. It may mean the stored order total, or it may be calculated from line items as quantity multiplied by unit price, less discounts, plus tax and shipping.

## 4. Practical example

A payment platform needs a dashboard showing the total value of completed orders for every merchant customer. Cancelled and failed orders must not be included.

The service filters for completed orders, groups them by customer ID, and sums their final charged amounts. Finance can then use the result for reporting, while the customer dashboard can show a reliable lifetime payment total.

## 5. Scenario-based interview answer

“In one payment reporting service, we needed to show the total completed order value for each customer.

The problem was that the source table contained completed, failed, and cancelled orders, and the report could contain millions of rows. I decided to keep the query as `IQueryable`, filter by status first, then use `GroupBy` and `Sum`. This allowed Entity Framework Core to translate the aggregation into SQL instead of loading all orders into memory.

I used `decimal` for money and grouped by the stable `CustomerId`, not the customer name. I also confirmed with the product owner whether tax, shipping, refunds, and discounts belonged in the total. The implementation returned a small DTO containing the customer ID and total value.

As a result, the report was accurate, used much less application memory, and remained fast as the order volume increased.”

## 6. Code example

```csharp
public sealed record Order(
    int Id,
    int CustomerId,
    decimal TotalValue,
    OrderStatus Status);

public enum OrderStatus
{
    Pending,
    Completed,
    Cancelled
}

public sealed record CustomerOrderTotal(
    int CustomerId,
    decimal TotalOrderValue);

List<Order> orders =
[
    new(1, 101, 120.50m, OrderStatus.Completed),
    new(2, 102, 75.00m, OrderStatus.Completed),
    new(3, 101, 30.00m, OrderStatus.Completed),
    new(4, 102, 20.00m, OrderStatus.Cancelled)
];

List<CustomerOrderTotal> totals = orders
    .Where(order => order.Status == OrderStatus.Completed)
    .GroupBy(order => order.CustomerId)
    .Select(group => new CustomerOrderTotal(
        CustomerId: group.Key,
        TotalOrderValue: group.Sum(order => order.TotalValue)))
    .OrderBy(result => result.CustomerId)
    .ToList();

foreach (CustomerOrderTotal total in totals)
{
    Console.WriteLine(
        $"Customer {total.CustomerId}: {total.TotalOrderValue:C}");
}
```

Output:

```text
Customer 101: $150.50
Customer 102: $75.00
```

`Where` removes orders that should not contribute to the total. `GroupBy` creates one group per customer. `Sum` adds the `TotalValue` values in each group, and `Select` creates a clear result object.

The collection expression syntax used for `orders` is available in C# 12 and later. In older C# versions, use `new List<Order> { ... }` instead. The LINQ operations themselves are available in supported .NET versions.

For Entity Framework Core, keep the query as `IQueryable` until the final asynchronous materialization:

```csharp
List<CustomerOrderTotal> totals = await dbContext.Orders
    .Where(order => order.Status == OrderStatus.Completed)
    .GroupBy(order => order.CustomerId)
    .Select(group => new CustomerOrderTotal(
        group.Key,
        group.Sum(order => order.TotalValue)))
    .ToListAsync(cancellationToken);
```

## 7. Common mistakes

- Using `double` or `float` for money instead of `decimal`.
- Grouping by customer name, which may not be unique or may change, instead of `CustomerId`.
- Including cancelled, failed, or refunded orders without checking the business rule.
- Calling `ToList` before `GroupBy` when using Entity Framework Core, which can load a large order table into memory.
- Summing line values without accounting for discounts, tax, shipping, or refunds.
- Joining customer and order data incorrectly and accidentally counting an order more than once.
- Assuming customers with no orders will appear. Starting from `Orders` returns only customers that have matching orders; include all customers with a left join or a customer-based query when zero totals are required.

## 8. Follow-up interview questions

### How would you include customers who have no orders?

Start from the customer collection or table, use a left join or a correlated sum, and return `0m` when no matching orders exist.

### Why should money be stored as `decimal`?

`decimal` represents base-10 values more accurately than `float` or `double`, so it avoids many binary floating-point rounding problems in financial calculations.

### How would you handle a very large order table?

Keep the LINQ query as `IQueryable` so the database performs the filtering and aggregation. Also check the generated SQL and add suitable indexes, commonly around the filter and grouping columns such as status and customer ID.
