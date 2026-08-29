# 17. Write a LINQ GroupBy.

**Technology:** C# Live Coding and LINQ

**Source question:** 17. Write a LINQ GroupBy.

## 1. What is it?

LINQ `GroupBy` takes a sequence of items and places items with the same key into a group.

For example, payment records can be grouped by currency. The result contains one group for `NZD`, one for `USD`, and so on. Each group has:

- a `Key`, such as `"NZD"`; and
- the payment records that have that key.

For LINQ to Objects, the result is an `IEnumerable<IGrouping<TKey, TElement>>`. It is not automatically a dictionary.

## 2. Why is it important?

Applications often need to calculate or display data by category. Examples include transaction totals per account, payment counts by status, failed logins by user, or orders by customer.

Without `GroupBy`, developers usually need loops and dictionaries to build the groups manually. LINQ expresses the business intention clearly and makes it easy to apply operations such as `Count`, `Sum`, `Average`, or `Max` to every group.

For senior developers, the important decisions are choosing the correct grouping key, handling inconsistent data, and deciding whether grouping should happen in the database or in application memory.

## 3. How does it work?

For an in-memory collection, the flow is:

1. The key selector runs for each source item.
2. LINQ compares that key with keys already found, using the default equality comparer or a comparer supplied by the developer.
3. Items with equal keys are placed in the same group.
4. Each group exposes its key through `Key` and can be enumerated to read its items.
5. A later `Select` can turn each group into a summary or response model.

`GroupBy` uses deferred execution. Creating the query does not run it. When the query is enumerated, LINQ to Objects reads the complete source and builds the groups before producing results. `ToList`, `ToArray`, or `ToDictionary` materializes the result.

For `IQueryable`, such as an Entity Framework Core query, the provider tries to translate the grouping into SQL or another query language. Simple aggregate projections normally translate well, but support for complex group shapes depends on the EF Core version and database provider. The generated SQL should be checked for production queries.

## 4. Practical example

A payment service needs an end-of-day summary for each currency. It has many successful payments containing an amount and currency code.

The service filters successful payments first, groups them by currency, and calculates the number of payments and total value in each group. Finance receives compact rows such as `NZD: 2 payments, $275.50` instead of every individual payment.

## 5. Scenario-based interview answer

**Problem:** “In a payment reporting service, we needed successful payment counts and totals grouped by currency. The old code repeatedly scanned the same collection for every currency.”

**Decision:** “I chose LINQ `GroupBy` because the records were already in memory and currency was the natural key. I also normalized currency codes so values such as `nzd` and `NZD` did not create separate groups.”

**Implementation:** “I filtered successful payments first, grouped by the normalized currency code, and projected every group into a summary containing the group key, count, and sum. I materialized the final result once with `ToList`.”

**Result:** “The code became easier to read and test, and the collection was no longer scanned once per currency. If the source were a large EF Core query, I would keep the filter, grouping, and aggregate projection in the database and inspect the generated SQL.”

## 6. Code example

```csharp
public enum PaymentStatus
{
    Pending,
    Completed,
    Failed
}

public sealed record Payment(
    Guid Id,
    string Currency,
    decimal Amount,
    PaymentStatus Status);

public sealed record CurrencySummary(
    string Currency,
    int PaymentCount,
    decimal TotalAmount);

var payments = new List<Payment>
{
    new(Guid.NewGuid(), "NZD", 125.50m, PaymentStatus.Completed),
    new(Guid.NewGuid(), "nzd", 150.00m, PaymentStatus.Completed),
    new(Guid.NewGuid(), "USD",  80.00m, PaymentStatus.Completed),
    new(Guid.NewGuid(), "NZD",  40.00m, PaymentStatus.Failed)
};

var summaries = payments
    .Where(payment => payment.Status == PaymentStatus.Completed)
    .GroupBy(payment => payment.Currency.Trim().ToUpperInvariant())
    .Select(group => new CurrencySummary(
        Currency: group.Key,
        PaymentCount: group.Count(),
        TotalAmount: group.Sum(payment => payment.Amount)))
    .OrderBy(summary => summary.Currency)
    .ToList();

foreach (var summary in summaries)
{
    Console.WriteLine(
        $"{summary.Currency}: {summary.PaymentCount} payment(s), " +
        $"total {summary.TotalAmount:N2}");
}
```

Important parts:

- `Where` removes failed and pending payments before grouping.
- `GroupBy` uses a normalized currency code as its key.
- `group.Key` is the currency shared by the records in that group.
- `Count` and `Sum` calculate values independently for every group.
- `Select` returns a small summary model instead of exposing grouping objects to the caller.
- `decimal` is used for money to avoid the binary rounding behavior of `double`.

If the source can contain null or blank currency codes, validate them or map them to an agreed value such as `"UNKNOWN"` before grouping.

## 7. Common mistakes

- Assuming `GroupBy` returns a `Dictionary`. It returns a sequence of grouping objects.
- Grouping by display text when a stable ID or code is available.
- Failing to normalize case, spaces, nulls, or invalid keys, which creates unexpected groups.
- Applying filters after grouping when unwanted records should never be included in the groups.
- Enumerating the same deferred query several times, which repeats the work and may observe changed source data.
- Calling `ToList` too early on an EF Core query, causing unnecessary rows to be loaded and grouped in memory.
- Returning entire groups when the caller only needs counts or totals, which wastes memory and network bandwidth.
- Assuming every complex `GroupBy` expression translates efficiently for every EF Core database provider. Inspect the SQL and test with realistic data.
- Forgetting that a source with no matching items produces no groups.

## 8. Follow-up interview questions

### 1. How do you group by more than one field?

Use a composite key, such as an anonymous object or tuple:

```csharp
var groups = payments.GroupBy(payment => new
{
    payment.Currency,
    payment.Status
});
```

This creates a separate group for each currency-and-status combination.

### 2. What is the difference between `GroupBy` and `ToLookup`?

Both organize items by key. `GroupBy` returns a deferred query, while `ToLookup` executes immediately and creates a read-only, dictionary-like lookup. Accessing a missing lookup key returns an empty sequence rather than throwing an exception.

### 3. When should grouping run in the database?

Database-side grouping is usually better for large data sets when only aggregates such as `Count`, `Sum`, or `Average` are required. It reduces data transfer and application memory use. Keep the query as `IQueryable`, project the aggregates, and review the generated SQL and execution plan.
