# 14. Find the second-highest value.

**Technology:** C# Live Coding and LINQ

**Source question:** 14. Find the second-highest value.

## 1. What is it?

Finding the second-highest value means finding the largest value after the maximum value.

Usually, interviewers mean the **second-highest distinct value**. For example, in `10, 20, 20, 15`, the answer is `15`, not `20`. It is important to confirm this rule before writing code.

## 2. Why is it important?

This small problem tests several practical skills:

- Clarifying requirements, especially how duplicate values should be handled.
- Choosing between a short LINQ solution and a more efficient single-pass solution.
- Handling empty input, null input, and input with fewer than two distinct values.

The same pattern appears in real systems when finding the second-largest payment, balance, score, or transaction amount.

## 3. How does it work?

A simple LINQ approach works as follows:

1. `Distinct()` removes duplicate values.
2. `OrderByDescending()` sorts the remaining values from highest to lowest.
3. `Skip(1)` ignores the highest value.
4. `FirstOrDefault()` returns the next value, or no value when it does not exist.

Sorting is easy to read, but it normally takes `O(n log n)` time. For a large or streaming collection, one loop can track the highest and second-highest distinct values in `O(n)` time and `O(1)` extra space.

## 4. Practical example

Suppose a fraud-monitoring service receives the values of successful payments for one customer. It needs the second-highest distinct payment amount for a risk rule.

For amounts `125, 500, 500, 300`, the result is `300`. The repeated `500` represents the same highest amount and must not become the second-highest distinct amount.

If the customer has only payments of `500`, there is no second-highest distinct value. The code should return a nullable result or report that case clearly instead of returning `0`, because `0` could be a valid value.

## 5. Scenario-based interview answer

“In a payment-risk service, I needed to find the second-highest distinct transaction amount for a customer. I first confirmed that duplicate maximum values should count only once. For a small in-memory list, I used `Distinct`, descending order, and then selected the second item because that code was very clear. I returned `null` when fewer than two distinct values existed, so the missing result could not be confused with a real amount. If this were a large collection or a hot path, I would use a single-pass implementation to avoid sorting the whole collection. This gave the risk rule predictable behavior for duplicates and edge cases.”

## 6. Code example

```csharp
public static int? FindSecondHighest(IEnumerable<int> values)
{
    ArgumentNullException.ThrowIfNull(values);

    return values
        .Distinct()
        .OrderByDescending(value => value)
        .Skip(1)
        .Select(value => (int?)value)
        .FirstOrDefault();
}

int? result = FindSecondHighest(new[] { 10, 20, 20, 15 });
Console.WriteLine(result); // 15
```

`Distinct()` defines the answer as the second-highest **distinct** value. Converting the remaining item to `int?` means `FirstOrDefault()` returns `null` when a second distinct value does not exist. This avoids confusing “not found” with the valid integer value `0`.

For a large collection, a single-pass version avoids sorting:

```csharp
public static int? FindSecondHighestSinglePass(IEnumerable<int> values)
{
    ArgumentNullException.ThrowIfNull(values);

    int? highest = null;
    int? secondHighest = null;

    foreach (int value in values)
    {
        if (highest is null || value > highest.Value)
        {
            secondHighest = highest;
            highest = value;
        }
        else if (value < highest.Value &&
                 (secondHighest is null || value > secondHighest.Value))
        {
            secondHighest = value;
        }
    }

    return secondHighest;
}
```

The strict comparison `value < highest.Value` prevents a duplicate maximum from being treated as the second-highest value.

## 7. Common mistakes

- Not asking whether “second-highest” means the second item or the second distinct value.
- Sorting without `Distinct()`, which may return a duplicate maximum.
- Using `First()` when fewer than two distinct values may exist; it throws `InvalidOperationException`.
- Using `FirstOrDefault()` with a non-nullable `int`, where `0` can incorrectly look like “not found.”
- Calling `Count()`, `OrderByDescending()`, and other LINQ operations separately on a database query or lazy sequence, causing extra enumeration or database work.
- Sorting a very large collection when a single-pass solution would be more efficient.

## 8. Follow-up interview questions

### 1. What should happen if all values are equal?

There is no second-highest distinct value, so return `null`, use a `Try...` method, or throw a documented exception based on the application contract.

### 2. What is the complexity of the LINQ solution?

The sorting step normally takes `O(n log n)` time. `Distinct()` also uses additional storage for unique values.

### 3. How would you do this in a database-backed LINQ query?

Keep it as an `IQueryable`, apply `Distinct()`, `OrderByDescending()`, `Skip(1)`, and `FirstOrDefaultAsync()`, and verify the generated SQL. With value types, project to a nullable type so that “no result” remains distinct from `0`.
