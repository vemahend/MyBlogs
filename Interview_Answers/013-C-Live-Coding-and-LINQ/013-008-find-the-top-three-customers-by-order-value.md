# 8. Find the top three customers by order value.

**Technology:** C# Live Coding and LINQ

**Source question:** 8. Find the top three customers by order value.

## 1. What is it?

Finding the top three customers by order value means calculating how much each customer has spent, sorting the customers from highest to lowest spend, and selecting the first three.

In LINQ, this is usually done with `GroupBy`, `Sum`, `OrderByDescending`, and `Take`.

## 2. Why is it important?

This query turns detailed order records into useful customer-level information. A business can use it to identify high-value customers, offer suitable rewards, or review important accounts.

For a senior developer, the important part is not only writing the LINQ query. The solution must also handle order status, money types, equal totals, large data volumes, and database execution correctly.

## 3. How does it work?

The query follows these steps:

1. Filter the orders that should count, such as completed orders only.
2. Group the remaining orders by customer.
3. Add the order values in each group with `Sum`.
4. Sort the customer totals in descending order.
5. Apply a second sort for a stable result when totals are equal.
6. Take the first three records.

With an in-memory collection, LINQ to Objects performs this work in the application. With Entity Framework Core and `IQueryable`, the provider normally translates the query into SQL, so the database performs the grouping, sorting, and limiting.

## 4. Practical example

A payment platform wants to find its three highest-value business customers for the current month. Only completed payments should count. Pending, failed, and refunded payments must not increase a customer's total.

The service filters by status and date, groups payments by customer ID, calculates each total, sorts the totals, and returns three customers. The result can be used by the account-management team without loading every payment into application memory.

## 5. Scenario-based interview answer

**Problem:** We needed to show the top three customers by completed order value on a banking operations dashboard.

**Decision:** I grouped orders by customer, summed their monetary values, sorted by the total in descending order, and took three. I also added customer ID as a tie-breaker so the output stayed predictable when two customers had the same total.

**Implementation:** I kept the query as `IQueryable` in Entity Framework Core and projected only the customer ID and total. This allowed the database to execute the aggregation and return only three rows. I used `decimal` for money and filtered out orders that should not contribute to revenue.

**Result:** The dashboard returned the correct customers with little data transfer and stable ordering. For production, I also checked the generated SQL and ensured the filter columns had suitable indexes.

## 6. Code example

```csharp
public sealed record Order(
    int CustomerId,
    decimal Value,
    OrderStatus Status);

public enum OrderStatus
{
    Pending,
    Completed,
    Cancelled,
    Refunded
}

public sealed record CustomerTotal(int CustomerId, decimal TotalValue);

IReadOnlyList<CustomerTotal> FindTopThreeCustomers(
    IEnumerable<Order> orders)
{
    return orders
        .Where(order => order.Status == OrderStatus.Completed)
        .GroupBy(order => order.CustomerId)
        .Select(group => new CustomerTotal(
            group.Key,
            group.Sum(order => order.Value)))
        .OrderByDescending(customer => customer.TotalValue)
        .ThenBy(customer => customer.CustomerId)
        .Take(3)
        .ToList();
}
```

`GroupBy` creates one group per customer. `Sum` calculates each customer's completed order value. `OrderByDescending` puts the largest total first, while `ThenBy` makes ties deterministic. `Take(3)` safely returns fewer than three items when fewer customers exist.

For Entity Framework Core, the same query shape can start from a `DbSet<Order>` and end with `ToListAsync(cancellationToken)`. Keep it as `IQueryable` until materialization so the database can do the work.

## 7. Common mistakes

- Calling `Take(3)` before sorting, which returns any three customers rather than the top three.
- Sorting individual orders instead of grouping and summing by customer.
- Counting pending, cancelled, failed, or refunded orders when the business rule requires completed orders only.
- Using `double` or `float` for money instead of `decimal`.
- Omitting a tie-breaker, which can make the order inconsistent when totals are equal.
- Calling `ToList()` too early in an Entity Framework Core query, causing unnecessary data to be loaded into memory.
- Grouping by a customer name instead of a stable customer ID, because names may be duplicated or changed.
- Ignoring currency. Values in different currencies must be converted using an agreed business rule before they are added.

## 8. Follow-up interview questions

### What happens if there are fewer than three customers?

`Take(3)` returns all available customers. It does not throw an exception.

### How would you return all customers tied for third place?

First find the third-highest distinct total, then return every customer whose total is greater than or equal to that value. A simple `Take(3)` returns exactly three rows at most and does not include every tie.

### How would you make this efficient with Entity Framework Core?

Keep the query as `IQueryable`, filter before grouping, project only required fields, and use `ToListAsync`. Review the generated SQL and add indexes that support important filters such as status, date, and customer ID.
