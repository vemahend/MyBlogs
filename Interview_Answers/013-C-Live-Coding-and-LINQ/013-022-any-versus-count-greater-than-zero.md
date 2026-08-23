# 22. Any versus Count greater than zero?

**Technology:** C# Live Coding and LINQ

**Source question:** 22. Any versus Count greater than zero?

## 1. What is it?

`Any()` and `Count() > 0` can both check whether a sequence contains at least one item, but they express different intentions.

- `Any()` asks, “Does at least one item exist?”
- `Count()` asks, “How many items exist?” and then compares that number with zero.

When the requirement is only to check for existence, `Any()` is normally the clearer and more efficient choice.

## 2. Why is it important?

Choosing the correct operation improves readability and can avoid unnecessary work.

For an in-memory collection, both approaches may be fast when the collection exposes its count directly. However, for a lazy `IEnumerable<T>`, `Any()` can stop after finding the first item, while `Count()` may enumerate the entire sequence.

The difference is also important with Entity Framework Core. `AnyAsync()` is normally translated into an SQL existence check, while `CountAsync() > 0` asks the database to count matching rows. Counting rows does more work when the application only needs a yes-or-no answer.

## 3. How does it work?

For `IEnumerable<T>`, `Any()` checks whether the sequence has at least one element. It returns as soon as existence is known. With a predicate, such as `Any(x => x.IsActive)`, it examines items only until it finds the first match.

`Count()` returns the total number of elements. It may use a collection's available count without enumeration, but for a general sequence it can iterate through every item. `Count(predicate)` must normally inspect the sequence to calculate the full number of matches.

For `IQueryable<T>`, such as an EF Core query, the LINQ provider translates the expression. `AnyAsync()` is designed as an existence query and is commonly translated to SQL using `EXISTS`. The exact SQL depends on the database provider and EF Core version.

## 4. Practical example

In a payment service, suppose we need to reject a new transfer when another pending transfer already uses the same idempotency key.

The service does not need the number of matching transfers. It only needs to know whether one exists. Using `AnyAsync()` makes that intent clear and allows the database to stop searching after it finds a match, especially when the idempotency key is indexed.

## 5. Scenario-based interview answer

“In a payment API, I found code using `CountAsync() > 0` to check whether an idempotency key already existed. The problem was that we only needed a Boolean result, but the query asked the database to calculate a count.

I changed the query to `AnyAsync()` because the decision was based only on existence. I kept the filter in the database query and made sure the idempotency-key column had an appropriate index. This produced a simpler existence query and made the code’s intention obvious.

The result was less unnecessary database work and clearer application code. I would still use `Count()` when the actual number is needed, but not merely to compare it with zero.”

## 6. Code example

```csharp
public async Task<bool> IsDuplicatePaymentAsync(
    string idempotencyKey,
    CancellationToken cancellationToken)
{
    return await dbContext.Payments.AnyAsync(
        payment => payment.IdempotencyKey == idempotencyKey,
        cancellationToken);
}
```

`AnyAsync()` keeps the filtering and existence check in the database. It returns a `bool`, which is exactly what the method needs. Passing the `CancellationToken` also allows the database operation to be cancelled if the request ends.

For a normal in-memory or lazy sequence, the same rule is simple:

```csharp
bool hasFailedPayment = payments.Any(payment => payment.Status == PaymentStatus.Failed);
```

This stops at the first failed payment. `payments.Count(payment => payment.Status == PaymentStatus.Failed) > 0` may continue through the whole sequence to calculate a number that is never used.

## 7. Common mistakes

- Using `Count() > 0` when only existence is required.
- Assuming `Any()` is always faster for every concrete collection. Some collections expose `Count` in constant time, so readability may be the main benefit.
- Calling `Count()` or `Any()` several times on a lazy sequence, which can repeat enumeration or execute a query more than once.
- Materializing data with `ToList()` before calling `Any()`, causing unnecessary rows and columns to be loaded into memory.
- Writing `query.Any()` in synchronous EF Core request code when `AnyAsync()` should be used to avoid blocking a server thread.
- Ignoring database indexes. `AnyAsync()` helps query intent, but a poorly indexed filter can still be slow.

## 8. Follow-up interview questions

**1. When should I use `Count()` instead of `Any()`?**  
Use `Count()` when the actual number of items is required, such as showing the number of pending transactions.

**2. Is `collection.Count > 0` wrong?**  
No. For types such as `List<T>`, the `Count` property is an inexpensive direct lookup. `Any()` often communicates the existence check more clearly, while `Count` may be reasonable when the variable is known to be a collection.

**3. What is the difference between `Any()` and `FirstOrDefault() != null`?**  
`Any()` directly expresses an existence check and works correctly for value types. Comparing `FirstOrDefault()` with a default value can be ambiguous because the default value may also be a valid item.
