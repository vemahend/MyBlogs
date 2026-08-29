# 2. Remove duplicates from a list.

**Technology:** C# Live Coding and LINQ

**Source question:** 2. Remove duplicates from a list.

## 1. What is it?

Removing duplicates means creating a collection in which each value appears only once.

For example, `[101, 205, 101, 310, 205]` becomes `[101, 205, 310]`. In C#, LINQ's `Distinct()` method is the simplest solution for values that can be compared directly.

## 2. Why is it important?

Duplicate data can cause repeated processing, incorrect totals, confusing reports, and unnecessary database or API calls. In a payment system, processing the same transaction reference twice could even charge a customer twice.

Senior developers must define what makes two items equal. For simple values, default equality may be enough. For business objects, equality is usually based on a key such as transaction ID, customer ID, or email address.

## 3. How does it work?

`Distinct()` reads the source sequence and uses an internal set to track values already seen. It returns the first occurrence of each value and skips later equal values.

By default, it uses `EqualityComparer<T>.Default`. For strings or custom objects, we can pass an `IEqualityComparer<T>`. For objects that should be unique by one property, `DistinctBy()` is clearer and is available from .NET 6.

Both methods use deferred execution: the source is processed when the result is enumerated. Calling `ToList()` executes the query immediately and creates a new list. The original list is not changed.

## 4. Practical example

Suppose a payment service receives a batch of transaction references from a partner. The same reference may appear more than once because the partner retried an upload.

The service can remove repeated references before querying the database or starting validation. This avoids unnecessary work. However, deduplicating a list is not enough to guarantee payment safety; the system should still use idempotency and a database unique constraint to protect against concurrent requests.

## 5. Scenario-based interview answer

“In a payment-import service, we received duplicate transaction records when a partner retried a batch. The business rule said transaction IDs were case-insensitive, and when duplicates existed, we should keep the first record.

I used `DistinctBy` with the transaction ID and `StringComparer.OrdinalIgnoreCase`, then materialized the result once with `ToList()`. I also kept the database unique constraint and idempotency check because in-memory deduplication only protects one batch, not concurrent requests.

This reduced repeated validation and database calls, while the persistence controls ensured that the same payment could not be processed twice.”

## 6. Code example

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

var transactionReferences = new List<string>
{
    "PAY-1042",
    "PAY-2048",
    "pay-1042",
    "PAY-3099",
    "PAY-2048"
};

var uniqueReferences = transactionReferences
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToList();

Console.WriteLine(string.Join(", ", uniqueReferences));
// PAY-1042, PAY-2048, PAY-3099
```

`StringComparer.OrdinalIgnoreCase` treats `PAY-1042` and `pay-1042` as equal. `Distinct()` keeps the first value it encounters, and `ToList()` creates the final list.

For complex objects, use a business key with `DistinctBy()` in .NET 6 or later:

```csharp
public sealed record Payment(string TransactionId, decimal Amount);

var uniquePayments = payments
    .DistinctBy(
        payment => payment.TransactionId,
        StringComparer.OrdinalIgnoreCase)
    .ToList();
```

This keeps the first payment for each transaction ID. If the correct record should be chosen by date, status, or another rule, sort or group the records explicitly instead of relying on their current order.

## 7. Common mistakes

- Calling `Distinct()` on custom reference types without defining value equality or supplying a comparer. Different objects may remain even when their business keys match.
- Ignoring business rules for case, whitespace, or normalized values.
- Assuming `Distinct()` changes the original list. It returns a new sequence.
- Enumerating the deferred query several times, causing repeated processing or database calls.
- Using `DistinctBy()` without deciding which duplicate record should be kept. It keeps the first occurrence.
- Removing duplicates in memory and treating that as full idempotency protection in a payment system.
- Using `GroupBy()` when only unique values are needed. It works, but `Distinct()` or `DistinctBy()` communicates the intention more clearly.

## 8. Follow-up interview questions

### How do you remove duplicates from a list of custom objects?

Use `DistinctBy()` with a business key, or implement/pass an `IEqualityComparer<T>` when equality depends on multiple fields.

### Does `Distinct()` preserve order?

Current LINQ-to-Objects behavior returns the first occurrence of each value in source order, but the API documentation describes the result as unordered. If order is a business requirement, apply an explicit `OrderBy()`.

### What is the expected time and space complexity?

For LINQ-to-Objects with normal hash-based equality, it is approximately O(n) time and O(n) additional memory because the method tracks values it has already seen.
