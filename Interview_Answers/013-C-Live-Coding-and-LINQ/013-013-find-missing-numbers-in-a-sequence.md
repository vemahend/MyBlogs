# 13. Find missing numbers in a sequence.

**Technology:** C# Live Coding and LINQ

**Source question:** 13. Find missing numbers in a sequence.

## 1. What is it?

Finding missing numbers means comparing the numbers we received with the numbers we expected and returning the gaps.

For example, if the expected sequence is `1, 2, 3, 4, 5` and the input is `1, 2, 4, 5`, the missing number is `3`.

The expected start and end should be stated clearly. Without that range, we can find gaps only between the smallest and largest input values; we cannot know whether values are missing before or after them.

## 2. Why is it important?

Sequence gaps can show that data was lost, skipped, or not processed. Finding them is useful when checking payment batches, message sequence numbers, invoice numbers, or imported records.

In a real system, this check can identify incomplete processing before reconciliation or settlement. A senior developer should also consider duplicate values, unordered input, an empty sequence, invalid ranges, and very large ranges.

## 3. How does it work?

For a known range, the flow is simple:

1. Validate the expected start and end values.
2. Generate every number in the expected range.
3. Compare that range with the received numbers.
4. Return the expected numbers that are not present.

LINQ's `Except` operator performs this comparison and returns distinct missing values. It uses set-style comparison, so duplicate input values do not create duplicate results. For a very large or sparse range, generating every possible number may use too much time and memory; sorting the received values and walking through the gaps can be more suitable.

## 4. Practical example

Suppose a payment gateway expects batch sequence numbers `5001` through `5006`. It receives `5001, 5002, 5004, 5006`. The missing values are `5003` and `5005`.

The reconciliation service can flag those batches for investigation instead of assuming that all payments were received. The service should use the expected range from trusted batch metadata, not infer it only from the received data.

## 5. Scenario-based interview answer

“In a payment reconciliation job, we found that some settlement files were not being processed, but the job still completed successfully. Each file had a sequence number and the provider also supplied the expected start and end.

I decided to compare the received sequence numbers with that trusted range. I validated the range, used a set-based comparison to find missing values, and logged the gaps with the settlement date and provider reference. I also allowed unordered input and duplicates because file notifications could be delivered more than once.

As a result, the operations team could identify missing files before settlement closed. For a small daily range, a LINQ solution was clear and fast enough. If the range had contained millions of values, I would have used a sorted streaming approach instead of creating the full range in memory.”

## 6. Code example

```csharp
public static IReadOnlyList<int> FindMissingNumbers(
    IEnumerable<int> receivedNumbers,
    int expectedStart,
    int expectedEnd)
{
    ArgumentNullException.ThrowIfNull(receivedNumbers);

    long count = (long)expectedEnd - expectedStart + 1;
    if (count <= 0 || count > int.MaxValue)
    {
        throw new ArgumentOutOfRangeException(
            nameof(expectedEnd),
            "The expected range is invalid or too large.");
    }

    return Enumerable
        .Range(expectedStart, (int)count)
        .Except(receivedNumbers)
        .ToArray();
}

var received = new[] { 5006, 5002, 5001, 5004, 5004 };
var missing = FindMissingNumbers(received, 5001, 5006);

Console.WriteLine(string.Join(", ", missing)); // 5003, 5005
```

`Enumerable.Range` creates the expected values. `Except` removes values found in `receivedNumbers` and returns the remaining numbers in expected-range order. Calculating `count` as a `long` prevents integer overflow during range validation. `ToArray` executes the LINQ query immediately and returns a stable result.

This example uses APIs available in supported modern .NET versions. `ArgumentNullException.ThrowIfNull` is available from .NET 6 onward.

## 7. Common mistakes

- Inferring the range from the minimum and maximum input values when the real expected range is known elsewhere.
- Assuming the input is sorted or contains no duplicates.
- Using `list.Contains` for every expected number. With a list, repeated searches can make the solution slow.
- Forgetting that LINQ queries use deferred execution unless they are materialized with `ToArray`, `ToList`, or another terminal operation.
- Generating a huge expected range in memory. Use a sorted scan, database query, or streaming process for large data sets.
- Ignoring invalid ranges and integer overflow when calculating the number of expected values.

## 8. Follow-up interview questions

### How would you solve it without LINQ?

Store the received values in a `HashSet<int>`, loop from the expected start to the expected end, and collect values that are not in the set. This gives fast average lookup and makes the execution flow explicit.

### What is the time complexity of this LINQ solution?

For an expected range of `R` values and `N` received values, it is approximately `O(R + N)` time because `Except` uses a set internally. Memory usage is approximately `O(N)` plus the materialized result and generated iteration state.

### How would you handle a very large, sorted sequence?

Walk through the sorted values once, keep the next expected number, and yield gaps as they are found. This avoids creating the entire expected range or storing every missing value at once.
