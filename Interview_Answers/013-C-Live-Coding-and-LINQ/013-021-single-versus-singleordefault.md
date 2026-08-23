# 21. Single versus SingleOrDefault?

**Technology:** C# Live Coding and LINQ

**Source question:** 21. Single versus SingleOrDefault?

## 1. What is it?

`Single` and `SingleOrDefault` are LINQ methods used when a sequence should contain no more than one matching item.

- `Single()` returns the only item. It throws an `InvalidOperationException` if the sequence is empty or contains more than one item.
- `SingleOrDefault()` returns the only item, or the type's default value when no item exists. It still throws an `InvalidOperationException` if more than one item exists.

The important difference is how they handle **no result**. Both methods reject duplicate results.

## 2. Why is it important?

These methods express a business rule: a result must be unique. For example, one payment reference should identify at most one payment.

They help detect bad data instead of silently selecting one row. This is different from `First` or `FirstOrDefault`, which can return the first item even when several items match.

The choice also explains whether a missing item is valid:

- Use `Single` when exactly one item must exist.
- Use `SingleOrDefault` when zero or one item is acceptable.

## 3. How does it work?

For an in-memory `IEnumerable<T>`, LINQ checks enough of the sequence to determine whether there is exactly one item:

1. If there is no item, `Single` throws, while `SingleOrDefault` returns `default`.
2. If there is one item, both return it.
3. If a second item is found, both throw because the result is not unique.

The overloads with a predicate apply the same rules only to matching items.

With `IQueryable<T>`, such as Entity Framework Core, the provider translates the expression into a database query. The query retrieves enough data to detect a second match. A database unique constraint is still needed because LINQ validation alone does not prevent duplicate records from being inserted.

For reference and nullable types, the default is usually `null`. For non-nullable value types, it is a value such as `0`, which may be a valid business value and therefore can be ambiguous.

## 4. Practical example

Consider a payment service that searches by an external payment reference.

If the service is checking whether a payment already exists before processing a request, no match is a valid outcome, so `SingleOrDefault` is suitable. One match returns the payment. Multiple matches throw and expose a data-integrity problem.

If the service is loading a payment after it has already validated that the payment must exist, `Single` can be used. A missing payment then fails immediately instead of being treated as normal.

In both cases, the database should have a unique index on the external payment reference.

## 5. Scenario-based interview answer

**Problem:** In a payment system, duplicate external references caused the application to load an arbitrary payment when the code used `FirstOrDefault`.

**Decision:** I changed the lookup to `SingleOrDefault` because a reference could be absent during the initial idempotency check, but it must never identify two payments.

**Implementation:** I handled `null` as “not processed yet,” treated the multiple-match exception as a data-integrity failure, added structured logging, and enforced a unique index in the database. For workflows where the payment was required to exist, I used `Single` instead.

**Result:** Missing payments followed the expected flow, while duplicate data failed visibly and could not be created again.

A natural interview answer would be: “I use `Single` when exactly one record is required, and `SingleOrDefault` when zero or one record is valid. Both throw if more than one record matches, so they communicate a uniqueness rule. I do not rely on them as the only protection; I also enforce uniqueness in the database.”

## 6. Code example

```csharp
public sealed record Payment(Guid Id, string ExternalReference, decimal Amount);

var payments = new List<Payment>
{
    new(Guid.NewGuid(), "PAY-1001", 125.00m)
};

// Zero or one match is valid.
Payment? existingPayment = payments.SingleOrDefault(
    payment => payment.ExternalReference == "PAY-1002");

if (existingPayment is null)
{
    Console.WriteLine("The payment has not been processed yet.");
}

// Exactly one match is required.
Payment requiredPayment = payments.Single(
    payment => payment.ExternalReference == "PAY-1001");
```

`SingleOrDefault` returns `null` for `PAY-1002` because there is no match. `Single` returns the payment for `PAY-1001`. If duplicate references are added, either call throws instead of hiding the problem.

In Entity Framework Core, the asynchronous equivalents are normally preferred for database queries:

```csharp
Payment? payment = await dbContext.Payments
    .SingleOrDefaultAsync(p => p.ExternalReference == reference, cancellationToken);
```

## 7. Common mistakes

- Thinking `SingleOrDefault` returns a default value when duplicates exist. It throws when more than one item matches.
- Using `Single` when “not found” is a normal business outcome, then using exceptions for normal control flow.
- Using `SingleOrDefault` with a non-nullable value type and assuming `0` always means “not found.”
- Replacing `SingleOrDefault` with `FirstOrDefault` to avoid an exception. This can hide duplicate data.
- Assuming these methods enforce database uniqueness. A unique constraint or unique index is still required.
- Calling `Single` after materializing a large database table with `ToList`. Filter and execute the operation in the database instead.
- Catching `InvalidOperationException` without distinguishing or logging the underlying missing-data or duplicate-data problem.

## 8. Follow-up interview questions

### 1. How are `FirstOrDefault` and `SingleOrDefault` different?

`FirstOrDefault` returns the first match or a default value and does not reject additional matches. `SingleOrDefault` expects zero or one match and throws if there are several.

### 2. When should I use `Single` instead of `SingleOrDefault`?

Use `Single` when the business flow guarantees that exactly one item must exist and absence indicates an error. Use `SingleOrDefault` when absence is an expected outcome.

### 3. Does `SingleOrDefault` replace a unique database constraint?

No. It detects multiple results during a read, but it does not stop concurrent requests or other processes from inserting duplicates. Enforce the rule with a unique constraint or index.
