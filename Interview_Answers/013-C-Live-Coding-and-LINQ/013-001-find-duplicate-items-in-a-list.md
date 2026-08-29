# 1. Find duplicate items in a list.

**Technology:** C# Live Coding and LINQ

**Source question:** 1. Find duplicate items in a list.

## 1. What is it?

Finding duplicate items means identifying values that appear more than once in a list.

For example, in `[101, 205, 101, 310, 205]`, the duplicate values are `101` and `205`. Usually, the required result contains each duplicated value only once.

## 2. Why is it important?

Duplicate detection helps us find data-quality and processing problems. A duplicate may represent a payment submitted twice, a repeated transaction reference, or the same user imported more than once.

In real systems, developers must also decide what “the same” means. Two primitive values can be compared directly, but business objects may need comparison by a key such as transaction ID, email address, or account number.

## 3. How does it work?

A clear LINQ approach is:

1. Use `GroupBy` to put equal items into groups.
2. Keep groups whose count is greater than one.
3. Select the key from each remaining group.

`GroupBy` uses the default equality comparer unless an `IEqualityComparer<T>` is supplied. It processes the source when the result is enumerated because LINQ uses deferred execution. It also keeps groups in memory, so for a very large or streaming input, a `HashSet<T>` approach may be more suitable.

## 4. Practical example

Suppose a payment service receives a batch containing transaction references. Before processing the batch, it checks for repeated references. If `PAY-1042` appears more than once, the service rejects or reviews the batch instead of risking two charges for the same payment request.

This check supports data validation, but it does not replace database uniqueness constraints or idempotency handling. Two requests can still arrive at the same time, so production payment systems should also enforce uniqueness at the persistence boundary.

## 5. Scenario-based interview answer

“In a payment-import feature, we found that the same transaction reference could appear multiple times in one file. I first clarified that the business wanted a distinct list of repeated references, using case-insensitive comparison.

I grouped the references with `StringComparer.OrdinalIgnoreCase`, filtered groups with more than one item, and returned each group key. I also kept the database unique constraint because an in-memory check cannot prevent duplicates across concurrent requests.

This gave users a clear validation message before processing and made the database the final safeguard against duplicate payments.”

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

var duplicates = transactionReferences
    .GroupBy(reference => reference, StringComparer.OrdinalIgnoreCase)
    .Where(group => group.Count() > 1)
    .Select(group => group.Key)
    .ToList();

Console.WriteLine(string.Join(", ", duplicates));
// PAY-1042, PAY-2048
```

`GroupBy` creates one group per transaction reference. `StringComparer.OrdinalIgnoreCase` makes values such as `PAY-1042` and `pay-1042` equal. `Where` keeps repeated groups, and `Select` returns one value for each duplicate. `ToList` executes the query immediately and stores the result.

For complex objects, group by the business key instead:

```csharp
var duplicatePaymentIds = payments
    .GroupBy(payment => payment.TransactionId)
    .Where(group => group.Count() > 1)
    .Select(group => group.Key)
    .ToList();
```

## 7. Common mistakes

- Returning every repeated occurrence when the requirement is one distinct duplicate value.
- Using `Distinct()` alone. It removes duplicates but does not tell us which values were duplicated.
- Relying on reference equality for custom objects instead of comparing a business key or supplying an equality comparer.
- Ignoring case, whitespace, or normalization rules for strings.
- Enumerating a database-backed LINQ query repeatedly, which can cause extra database calls.
- Using only an in-memory duplicate check for payments. A unique constraint or idempotency mechanism is still needed for concurrent requests.
- Using `GroupBy` for an extremely large stream without considering its memory usage.

## 8. Follow-up interview questions

### How would you return each duplicate and its count?

Project the group key and count: `Select(group => new { Item = group.Key, Count = group.Count() })`.

### How would you find duplicates in a very large sequence?

Scan it once with two `HashSet<T>` collections: one for values already seen and one for duplicates. This avoids storing full groups and has average O(n) time.

### What is the time complexity of the LINQ approach?

With normal hash-based equality, it is approximately O(n) time and O(n) additional memory. Poor hash functions or expensive equality checks can affect performance.
