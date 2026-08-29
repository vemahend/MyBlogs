# 4. Reverse a string.

**Technology:** C# Live Coding and LINQ

**Source question:** 4. Reverse a string.

## 1. What is it?

Reversing a string means returning its characters in the opposite order. For example, `"Payment"` becomes `"tnemyaP"`.

In C#, strings are immutable, so the original string cannot be changed. The solution creates and returns a new string.

## 2. Why is it important?

This is a common live-coding question because it checks whether a developer understands strings, loops, indexing, memory allocation, and edge cases such as `null` or an empty value.

Although applications rarely reverse ordinary business text, the same techniques are useful when processing fixed-format messages, checking palindromes, or scanning data from the end.

## 3. How does it work?

A simple and efficient approach is:

1. Return early for `null`, empty, or one-character input.
2. Copy the string into a character array.
3. Keep one index at the start and another at the end.
4. Swap those two characters and move both indexes toward the centre.
5. Create a new string from the changed array.

The algorithm visits each character once, so its time complexity is **O(n)**. The character array and returned string require **O(n)** additional space.

One important detail is that a .NET `char` is a UTF-16 code unit, not always a complete visible character. Reversing individual `char` values can break emoji and some international text.

## 4. Practical example

Suppose a payment gateway receives a legacy reference whose checksum rule requires the reference to be read from right to left. Before calculating the checksum, the service reverses the reference, such as `"PAY12345"` to `"54321YAP"`.

In production, I would first confirm that the reference contains only the documented ASCII characters. If it can contain general Unicode text, I would use a Unicode-aware implementation instead of reversing individual `char` values.

## 5. Scenario-based interview answer

**Problem:** A legacy banking interface required a transaction reference in reverse order before applying its checksum algorithm.

**Decision:** I used a two-pointer character-array solution because it is easy to read, runs in linear time, and avoids the extra iterator and array allocations of a short LINQ solution. I also defined the expected behaviour for `null` input instead of leaving it unclear.

**Implementation:** I copied the reference to a `char[]`, swapped the first and last characters while moving toward the centre, and returned a new string. Because the interface allowed only ASCII letters and digits, UTF-16 character splitting was not a risk.

**Result:** The implementation was predictable, easy to test, and handled empty and single-character references correctly. I added tests for even-length, odd-length, empty, and `null` inputs.

## 6. Code example

```csharp
public static string? Reverse(string? value)
{
    if (string.IsNullOrEmpty(value) || value.Length == 1)
    {
        return value;
    }

    char[] characters = value.ToCharArray();
    int left = 0;
    int right = characters.Length - 1;

    while (left < right)
    {
        (characters[left], characters[right]) =
            (characters[right], characters[left]);

        left++;
        right--;
    }

    return new string(characters);
}
```

The method keeps `null` as `null`, returns trivial values without extra work, and swaps characters in one array. The tuple assignment makes the swap concise without needing a temporary variable.

For a short LINQ-based answer, `new string(value.Reverse().ToArray())` works for non-null input, but it normally creates more intermediate objects and still reverses UTF-16 code units rather than user-perceived characters.

## 7. Common mistakes

- Repeatedly using `result += character` in a loop. Because strings are immutable, this can create many temporary strings and lead to **O(n²)** work.
- Forgetting to define how `null` should be handled. The method should either return `null` or throw a documented exception.
- Using LINQ automatically without discussing its extra allocations in performance-sensitive code.
- Assuming one `char` always represents one visible character. Emoji, surrogate pairs, and combining marks need Unicode-aware handling.
- Reversing security tokens, passwords, or encrypted values as if reversal provided protection. Reversal is not encryption or hashing.

## 8. Follow-up interview questions

### How would you reverse the words but keep each word unchanged?

Split the sentence into words, reverse the word collection, and join it again. The exact solution must define how repeated spaces and punctuation should be preserved.

### Can a C# string be reversed in place?

No. A C# string is immutable. We must create a new result, usually by working with a `char[]`, `Span<char>`, or another buffer.

### How would you handle emoji and international text safely?

I would reverse text elements rather than individual `char` values. In modern .NET, `System.Text.Rune` helps preserve Unicode scalar values, while `System.Globalization.StringInfo` is more suitable when user-perceived characters, including combining sequences, must stay together.
