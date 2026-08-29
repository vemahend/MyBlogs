# 20. First versus FirstOrDefault?

**Technology:** C# Live Coding and LINQ

**Source question:** 20. First versus FirstOrDefault?

## 1. What is it?

`First()` and `FirstOrDefault()` are LINQ methods that return the first item in a sequence, optionally matching a condition.

- `First()` throws an `InvalidOperationException` when the sequence is empty or no item matches the condition.
- `FirstOrDefault()` returns the type's default value when no item is found. For a reference type this is normally `null`; for a non-nullable value type it is values such as `0`, `false`, or the default struct value.

Both methods allow multiple matching items. They only return the first one. They do not check that the result is unique.

## 2. Why is it important?

The choice communicates an important business rule:

- Use `First()` when an item must exist and its absence means the data or program state is invalid.
- Use `FirstOrDefault()` when finding no item is a normal outcome that the code is prepared to handle.

Choosing correctly makes missing-data behavior explicit. It prevents unexpected exceptions, but it also prevents required data from being silently treated as optional.

## 3. How does it work?

With LINQ to Objects, both methods start enumerating the source and stop as soon as the first suitable item is found. Without a predicate, the first item is suitable. With a predicate, items are checked in sequence until one matches.

If enumeration finishes without a result, `First()` throws and `FirstOrDefault()` returns `default(T)`. Neither method reads the remaining items after finding a result.

With Entity Framework Core, these methods are terminal operations. The provider normally translates the query into SQL that asks for one row. The database still needs an `OrderBy` if “first” must have a defined business meaning; without ordering, the selected row is not guaranteed.

## 4. Practical example

An authentication service looks for the latest active refresh token belonging to a user. A user may have no active token, so that is a valid result rather than a system failure. The query uses `OrderByDescending` and `FirstOrDefaultAsync`. If the result is `null`, the service rejects the refresh request cleanly.

For required configuration, such as the bank's settlement account, `First()` may be more suitable because continuing without that record would indicate broken system configuration. In production code, a domain-specific exception can provide a clearer error than allowing the raw LINQ exception to escape.

## 5. Scenario-based interview answer

“In a payment service, we needed to find the latest successful authorization for a payment. Some payments legitimately had no successful authorization yet, so using `First()` caused avoidable exceptions.

I used `FirstOrDefaultAsync` because absence was part of the normal workflow. I ordered by creation time and then by ID to make the result deterministic, and explicitly handled a `null` result by returning the correct business outcome.

This removed exception-driven control flow and made the missing-authorization case clear. If the record had been mandatory, I would have used `FirstAsync` or thrown a domain-specific exception after the lookup so the invariant was visible.”

## 6. Code example

```csharp
var payments = new List<Payment>
{
    new(101, "Pending"),
    new(102, "Completed"),
    new(103, "Completed")
};

Payment firstCompleted = payments.First(p => p.Status == "Completed");
// Returns payment 102. More than one match is allowed.

Payment? failedPayment = payments.FirstOrDefault(p => p.Status == "Failed");

if (failedPayment is null)
{
    Console.WriteLine("No failed payment was found.");
}

public sealed record Payment(int Id, string Status);
```

`First()` returns payment 102 because it is the first match in this ordered in-memory list. `FirstOrDefault()` returns `null` because no payment has a `Failed` status, and the code handles that expected result.

For an EF Core query, order explicitly and use the asynchronous method for database I/O:

```csharp
Payment? latestPayment = await dbContext.Payments
    .AsNoTracking()
    .Where(p => p.CustomerId == customerId)
    .OrderByDescending(p => p.CreatedAtUtc)
    .ThenByDescending(p => p.Id)
    .FirstOrDefaultAsync(cancellationToken);
```

The ordering defines exactly what “first” means. `ThenByDescending` also resolves ties in the creation time.

## 7. Common mistakes

- Using `First()` when no match is expected sometimes, then using exceptions as normal control flow.
- Using `FirstOrDefault()` for required data and continuing without checking the result.
- Forgetting that the default of a value type may be a valid value. For example, `FirstOrDefault()` returning `0` does not clearly show whether an integer sequence was empty. A nullable projection or an explicit fallback can remove this ambiguity.
- Assuming either method checks uniqueness. Use `Single()` or `SingleOrDefault()` when more than one match must be treated as an error.
- Calling `First()` after `Where()` when `First(predicate)` would express the same operation more directly in LINQ to Objects.
- Using `First` in a database query without `OrderBy` when a deterministic result is required.
- Using synchronous EF Core query methods during asynchronous web request handling instead of `FirstAsync` or `FirstOrDefaultAsync`.

## 8. Follow-up interview questions

### What is the difference between `FirstOrDefault()` and `SingleOrDefault()`?

`FirstOrDefault()` accepts multiple matches and returns the first. `SingleOrDefault()` returns the only match, but throws if more than one match exists. Both return a default value when there is no match.

### How can I avoid an ambiguous default value for a value-type sequence?

Project to a nullable type, such as `numbers.Select(n => (int?)n).FirstOrDefault()`, so an empty result is `null`. On .NET 6 and later, LINQ to Objects also provides `FirstOrDefault` overloads that accept an explicit default value.

### Does `FirstOrDefault()` catch exceptions raised while reading the sequence?

No. It only changes what happens when no matching item exists. Exceptions from the predicate, source enumeration, query translation, database, or network still propagate to the caller.
