# 10. Sort customers by total spend.

**Technology:** C# Live Coding and LINQ

**Source question:** 10. Sort customers by total spend.

## 1. What is it?

Sorting customers by total spend means adding all qualifying order amounts for each customer and then ordering the customers by that calculated total.

Usually, the highest-spending customer is shown first. In LINQ, this commonly uses `GroupBy`, `Sum`, and `OrderByDescending`.

## 2. Why is it important?

Order data normally contains many rows for the same customer. Sorting those individual orders does not tell us which customer has spent the most. We first need a customer-level total.

This is useful for loyalty tiers, account reviews, sales reports, and customer support. In a real system, developers must also apply the correct rules for completed orders, refunds, currencies, date ranges, and equal totals.

## 3. How does it work?

The query normally follows this flow:

1. Filter the orders that count toward spend, such as completed orders in a given period.
2. Group those orders by a stable customer ID.
3. Use `Sum` to calculate the total for each group.
4. Project each group into a simple result containing the customer and total spend.
5. Sort by total spend with `OrderByDescending`.
6. Add `ThenBy` as a tie-breaker so equal totals have a predictable order.

For `IEnumerable<T>`, LINQ performs the work in application memory when the result is enumerated. For an Entity Framework Core `IQueryable<T>`, the provider can normally translate this query shape into SQL so the database performs the filtering, grouping, summing, and sorting.

## 4. Practical example

A bank's card-payment platform needs a monthly customer-spend report. Only settled purchases should count. Pending and declined payments are excluded, while refunds reduce spend according to the business rule.

The service groups the eligible transactions by customer, calculates each customer's net spend, and sorts the results from highest to lowest. The relationship team can then review the most active accounts.

## 5. Scenario-based interview answer

**Problem:** A payment dashboard needed to display customers in descending order of completed spend, but the source contained multiple orders per customer and several order statuses.

**Decision:** I filtered the data using the agreed business rules, grouped by customer ID, summed each customer's amounts, and sorted by the calculated total. I used customer ID as a secondary sort to make ties predictable.

**Implementation:** I kept the Entity Framework Core query as `IQueryable`, projected only the required fields, and materialized it asynchronously at the end. I used `decimal` for amounts and kept currencies separate rather than adding unlike currencies together.

**Result:** The database returned an already aggregated and sorted result, which reduced application memory use and gave the dashboard stable, correct ordering.

## 6. Code example

```csharp
public enum OrderStatus
{
    Pending,
    Completed,
    Cancelled,
    Refunded
}

public sealed record Order(
    int CustomerId,
    decimal Amount,
    OrderStatus Status);

public sealed record CustomerSpend(
    int CustomerId,
    decimal TotalSpend);

static IReadOnlyList<CustomerSpend> SortCustomersByTotalSpend(
    IEnumerable<Order> orders)
{
    return orders
        .Where(order => order.Status == OrderStatus.Completed)
        .GroupBy(order => order.CustomerId)
        .Select(group => new CustomerSpend(
            group.Key,
            group.Sum(order => order.Amount)))
        .OrderByDescending(customer => customer.TotalSpend)
        .ThenBy(customer => customer.CustomerId)
        .ToList();
}
```

`Where` applies the business rule before aggregation. `GroupBy` creates one group per customer, and `Sum` calculates that customer's spend. `OrderByDescending` puts the largest total first. `ThenBy` produces consistent output when customers have the same total.

This version returns only customers who have at least one completed order. If customers with no completed orders must also appear with a total of zero, start from the customer collection and use a left join or a grouped navigation-property query.

With Entity Framework Core, keep the equivalent query as `IQueryable` and finish with `ToListAsync(cancellationToken)` so the work runs in the database.

## 7. Common mistakes

- Sorting individual orders before calculating a total for each customer.
- Using `OrderBy` when the requirement is highest spend first; `OrderByDescending` is needed.
- Calling `ToList()` before filtering and grouping an Entity Framework Core query, which can load unnecessary rows into memory.
- Using `double` or `float` for money instead of `decimal`.
- Grouping by customer name instead of a stable customer ID. Names can be duplicated or changed.
- Counting pending, cancelled, failed, or fully refunded orders without confirming the business rule.
- Adding amounts in different currencies without first converting them using an agreed exchange-rate rule.
- Omitting a secondary sort, which can make the order of equal totals unstable.
- Assuming customers with no qualifying orders will appear in an order-based `GroupBy` result.

## 8. Follow-up interview questions

### How would you sort from lowest spend to highest?

Use `OrderBy(customer => customer.TotalSpend)` instead of `OrderByDescending`.

### How would you include customers who have never placed an order?

Start from the customer list, left join the qualifying orders, and use zero when a customer has no matching amounts. This keeps every customer in the result.

### How would you handle customers with the same total spend?

Add a deterministic secondary sort, such as `ThenBy(customer => customer.CustomerId)`. If the requirement is ranking, also agree whether tied customers share the same rank.
