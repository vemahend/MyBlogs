# 11. Find duplicate transactions.

**Technology:** C# Live Coding and LINQ

**Source question:** 11. Find duplicate transactions.

## 1. What is it?

Finding duplicate transactions means identifying two or more transaction records that represent the same business event.

The important first step is to define what “same” means. If every transaction has a reliable transaction ID, that ID should normally be the duplicate key. If no reliable ID exists, the key might be a combination such as account ID, amount, currency, merchant reference, and payment date.

## 2. Why is it important?

Duplicate transactions can cause customers to be charged twice, balances to be incorrect, and reconciliation reports to fail. They may appear because a client retries a timed-out request, a message is delivered more than once, or the same input file is imported twice.

Developers need a clear duplicate rule so they can detect bad data without incorrectly marking valid repeated payments as duplicates. In production, prevention through idempotency and database constraints is usually more reliable than finding duplicates after they have been saved.

## 3. How does it work?

With LINQ, the usual flow is:

1. Choose the fields that form the duplicate key.
2. Normalize values when needed, for example by trimming a reference or converting currency to upper case.
3. Use `GroupBy` to place matching transactions in the same group.
4. Keep groups whose count is greater than one.
5. Return either the duplicate groups or flatten them with `SelectMany` if every matching record is required.

For an in-memory collection, LINQ to Objects builds the groups while enumerating the source. This uses additional memory proportional to the number of records and distinct keys. With Entity Framework Core, a suitable grouping query can be translated to SQL, but translation depends on the query shape and provider, so the generated SQL should be checked.

## 4. Practical example

A payment API receives the same request twice because the mobile app did not receive the first response. Both records have the same merchant reference, customer account, amount, and currency.

A reconciliation job groups transactions by those business fields and reports groups containing more than one record. Operations can then investigate them. The permanent fix is to require an idempotency key and enforce its uniqueness in the database so the second request returns the original result instead of creating another charge.

## 5. Scenario-based interview answer

“In a payment system, we found that network retries sometimes created two transaction rows. My first decision was to agree on the business definition of a duplicate with the payments team. We could not use amount alone because a customer may legitimately make two payments for the same amount.

We treated the provider reference as the primary duplicate key. For older records where it was missing, we used a carefully defined composite key containing account, amount, currency, merchant reference, and booking date. I used a LINQ `GroupBy` query in the reconciliation process and retained groups with more than one item.

For prevention, I added an idempotency key to the API flow and a unique database constraint. I also handled the unique-key conflict safely, because two identical requests could arrive at the same time. This stopped new duplicate charges, while the report helped operations resolve the historical records.”

## 6. Code example

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

public sealed record Transaction(
    long Id,
    string AccountId,
    decimal Amount,
    string Currency,
    string MerchantReference,
    DateTimeOffset BookedAt);

public sealed record DuplicateTransactionGroup(
    string AccountId,
    decimal Amount,
    string Currency,
    string MerchantReference,
    DateOnly BookingDate,
    IReadOnlyList<Transaction> Transactions);

public static IReadOnlyList<DuplicateTransactionGroup> FindDuplicates(
    IEnumerable<Transaction> transactions)
{
    ArgumentNullException.ThrowIfNull(transactions);

    return transactions
        .GroupBy(t => new
        {
            AccountId = t.AccountId.Trim(),
            t.Amount,
            Currency = t.Currency.Trim().ToUpperInvariant(),
            MerchantReference = t.MerchantReference.Trim().ToUpperInvariant(),
            BookingDate = DateOnly.FromDateTime(t.BookedAt.UtcDateTime)
        })
        .Where(group => group.Count() > 1)
        .Select(group => new DuplicateTransactionGroup(
            group.Key.AccountId,
            group.Key.Amount,
            group.Key.Currency,
            group.Key.MerchantReference,
            group.Key.BookingDate,
            group.OrderBy(t => t.BookedAt).ToList()))
        .ToList();
}
```

The anonymous object is the composite duplicate key. `GroupBy` collects records with the same key, and `Where` keeps only groups containing multiple records. Returning groups is useful because it preserves all records for investigation. `DateOnly` and `ArgumentNullException.ThrowIfNull` are available in .NET 6 and later.

In a real payment system, prefer a stable provider reference or idempotency key over this fallback composite key. Converting a timestamp to a date is a business decision; it can create false matches if the permitted time window is not defined carefully.

## 7. Common mistakes

- Treating matching amounts as proof of duplication. Customers can make valid payments for the same amount.
- Including the database row ID in the grouping key. Every row ID is normally unique, so no duplicates will be found.
- Using an imprecise time rule without agreeing on the time zone or matching window.
- Comparing unnormalized references or currency codes and missing matches because of spaces or letter casing.
- Calling `ToList` before filtering a large database query, which loads unnecessary data into application memory.
- Detecting duplicates but not preventing them with idempotency and a unique database constraint.
- Checking whether a record exists and then inserting it without a unique constraint. Concurrent requests can both pass the check.
- Automatically deleting a duplicate without considering audit, settlement, refund, and regulatory requirements.

## 8. Follow-up interview questions

### How would you return every duplicate record instead of groups?

After filtering the groups, use `SelectMany(group => group)`. This flattens the matching groups into one sequence of transactions.

### How would you prevent duplicate payments?

Accept a client-generated idempotency key, store it with the payment result, and enforce a unique constraint on the correct business scope, such as merchant ID plus idempotency key. A repeated request can then return the original result.

### How would you handle millions of transactions?

Run the grouping and filtering in the database, select only required columns, limit the query to a sensible reconciliation period, and index the duplicate-key columns. Review the generated SQL and query plan instead of loading all rows into memory.
