# 12. Merge two collections.

**Technology:** C# Live Coding and LINQ

**Source question:** 12. Merge two collections.

## 1. What is it?

Merging two collections means producing one result from both collections.

The correct LINQ method depends on the required result:

- `Concat` appends the second collection and keeps duplicates.
- `Union` combines collections and removes duplicate values.
- `UnionBy` removes duplicates using a selected key, such as `TransactionId`.
- `Join` matches related items from both collections; it does not simply append them.

So, before writing code, I clarify what “merge” means and how duplicates should be handled.

## 2. Why is it important?

Applications often receive related data from more than one source. For example, a payment service may load recent transactions from a database and older transactions from an archive.

Choosing the correct merge method prevents:

- duplicate payments or transactions in the result;
- missing records;
- incorrect ordering;
- unnecessary database or memory work.

For a senior developer, the important part is not only combining the lists. It is defining clear rules for duplicates, conflicts, ordering, and collection size.

## 3. How does it work?

`Concat` returns an `IEnumerable<T>` that reads every item from the first source and then every item from the second source. It uses deferred execution, so enumeration normally starts only when the result is iterated or materialized with a method such as `ToList()`.

`Union` also uses deferred execution, but it keeps a set of values already returned. Equality is based on the default comparer or a supplied `IEqualityComparer<T>`.

`UnionBy`, available from .NET 6, works in a similar way but tracks a selected key. When the same key appears more than once, the first item encountered is kept.

`Join` builds matches using keys from both sources. It is appropriate when the two collections contain different types of related data, such as payments and customer records.

## 4. Practical example

A payment API receives settled payments from the main database and pending payments from a cache. A payment may briefly exist in both places during a status change.

The API can place settled payments first and use `UnionBy(p => p.PaymentId)` to create one collection. Because the first matching item wins, the settled version is kept when the same payment ID is present in both sources.

The service can then sort the merged result by creation time before returning it.

## 5. Scenario-based interview answer

“In one payment service, we had settled payments in SQL and recent pending payments in a cache. During processing, the same payment could appear in both collections.

The problem was that a simple `Concat` produced duplicate payment IDs. I decided that the settled database record should take priority. I put the settled collection first, applied `UnionBy` using `PaymentId`, sorted the result, and materialized it once with `ToList()`.

This gave the API one predictable collection with no duplicate IDs. I also documented that the first record wins, because changing the source order would change the result.”

## 6. Code example

```csharp
public sealed record Payment(
    Guid PaymentId,
    decimal Amount,
    string Status,
    DateTimeOffset CreatedAt);

IEnumerable<Payment> settledPayments = GetSettledPayments();
IEnumerable<Payment> pendingPayments = GetPendingPayments();

List<Payment> mergedPayments = settledPayments
    .UnionBy(pendingPayments, payment => payment.PaymentId)
    .OrderByDescending(payment => payment.CreatedAt)
    .ToList();
```

Important points:

- `UnionBy` uses `PaymentId` to identify duplicates.
- Settled payments come first, so they win when both sources contain the same ID.
- `OrderByDescending` makes the final order explicit.
- `ToList()` executes the query and creates a stable result.
- `UnionBy` is built into .NET 6 and later. On older .NET versions, use `Concat`, `GroupBy`, and an explicit rule for choosing one item from each group.

If duplicates must be kept, the simpler solution is:

```csharp
List<Payment> allPayments = settledPayments
    .Concat(pendingPayments)
    .ToList();
```

## 7. Common mistakes

- Using `Union` when duplicates should be kept, or using `Concat` when they should be removed.
- Assuming `Union` compares objects by a business key. Equality for classes depends on their equality implementation or comparer.
- Using `UnionBy` without understanding that the first item with a key wins.
- Relying on source order without documenting the conflict rule.
- Enumerating an `IEnumerable<T>` several times when it performs a database query or remote call.
- Calling `ToList()` too early and loading more data into memory than needed.
- Using LINQ to Objects for very large collections when the merge can be performed more efficiently in the database.

## 8. Follow-up interview questions

### What is the difference between `Concat` and `Union`?

`Concat` keeps every item. `Union` removes duplicates using equality comparison.

### How do you merge collections and remove duplicates by one property?

Use `UnionBy(secondCollection, item => item.Id)` on .NET 6 or later. The first item found for each key is kept.

### When would you use `Join` instead?

Use `Join` when items from the two collections are related by a key and their fields need to be combined, such as joining payments with customer details.
