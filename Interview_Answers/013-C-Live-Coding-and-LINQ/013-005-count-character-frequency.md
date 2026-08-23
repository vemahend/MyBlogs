# 5. Count character frequency.

**Technology:** C# Live Coding and LINQ

**Source question:** 5. Count character frequency.

## 1. What is it?

Counting character frequency means finding how many times each character appears in a string.

For example, in `"payment"`, the character `p` appears once and `m` appears once, while `a` appears once. The result is usually stored as a dictionary where the character is the key and its count is the value.

## 2. Why is it important?

This is a common interview problem because it checks whether a developer can work with strings, grouping, dictionaries, and LINQ.

In real systems, the same pattern is useful for validating input, detecting repeated symbols, building simple text statistics, or analysing identifiers. It also shows whether the developer thinks about case, spaces, punctuation, and Unicode instead of assuming all input is simple English text.

## 3. How does it work?

A LINQ solution follows this flow:

1. Read each character from the string.
2. Optionally normalize or filter the input, such as converting to lower case or removing spaces.
3. Group equal characters with `GroupBy`.
4. Convert each group into a dictionary entry containing the character and `Count()`.

The time complexity is normally **O(n)**, where `n` is the string length. The extra space is **O(k)**, where `k` is the number of distinct characters.

In C#, a `char` is a UTF-16 code unit, not always a complete user-visible character. A `char` solution is fine when the input is limited to ordinary letters and digits. For full Unicode text, use `System.Text.Rune` or text-element APIs.

## 4. Practical example

A payment service receives a one-time reference such as `"AB12A9"`. Before sending it to a downstream fraud-checking system, the service may count each character to produce simple input features or to detect suspicious references containing too many repeated characters.

The expected result is `A: 2`, `B: 1`, `1: 1`, `2: 1`, and `9: 1`. Whether `A` and `a` should be treated as the same character must be defined by the business rule.

## 5. Scenario-based interview answer

**Problem:** A payment platform needed to identify reference values with unusually repeated characters before sending them to a fraud service.

**Decision:** I used a frequency dictionary because it gives a clear count for each character in one logical pass. I also agreed with the business team that matching should be case-insensitive and that separators should be ignored.

**Implementation:** I normalized each reference with `ToUpperInvariant()`, filtered out separator characters, grouped the remaining characters, and converted the groups to a dictionary. I kept this validation separate from the payment-processing logic and added tests for empty input, mixed case, and punctuation.

**Result:** The fraud request contained consistent data, repeated-character rules became easy to read, and the validation remained simple to maintain.

## 6. Code example

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

public static class CharacterCounter
{
    public static IReadOnlyDictionary<char, int> CountCharacters(string input)
    {
        ArgumentNullException.ThrowIfNull(input);

        return input
            .GroupBy(character => character)
            .ToDictionary(group => group.Key, group => group.Count());
    }
}

var frequencies = CharacterCounter.CountCharacters("payment");

foreach (var item in frequencies.OrderBy(item => item.Key))
{
    Console.WriteLine($"{item.Key}: {item.Value}");
}
```

`GroupBy` creates one group for each distinct character. `ToDictionary` stores the group key and the number of items in that group. `ArgumentNullException.ThrowIfNull` is available in .NET 6 and later and makes the behavior for `null` explicit. An empty string returns an empty dictionary.

For a very large or streamed input, I would prefer a normal loop that updates a `Dictionary<char, int>`. It avoids the temporary groups created by `GroupBy` and still runs in O(n) time.

## 7. Common mistakes

- Not deciding whether counting should be case-sensitive. `A` and `a` are different keys unless the input is normalized.
- Silently ignoring spaces or punctuation when the requirement says to count every character.
- Calling `ToLower()` or `ToUpper()` with the current culture when a culture-independent technical rule requires `ToLowerInvariant()` or `ToUpperInvariant()`.
- Not defining the behavior for `null` input.
- Assuming one C# `char` always represents one displayed Unicode character. Emoji and some other characters can use multiple UTF-16 code units.
- Repeatedly calling `Count` for every distinct character, which can turn a simple O(n) solution into O(n²).

## 8. Follow-up interview questions

### How would you make the count case-insensitive?

Normalize the input with `ToUpperInvariant()` or `ToLowerInvariant()` before grouping. Confirm the expected culture rules first.

### Would you use LINQ for a very large string?

Usually I would use a `Dictionary<char, int>` and update it in a loop. It uses less temporary memory than `GroupBy` and makes the single-pass behavior clear.

### How would you correctly count Unicode characters such as emoji?

Enumerate the string with `input.EnumerateRunes()` and count `Rune` values instead of `char` values. If the requirement is to count what users see as one symbol, use text elements because one displayed symbol can contain multiple Unicode scalar values.
