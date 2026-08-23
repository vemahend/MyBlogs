# 3. Find the first non-repeating character.

**Technology:** C# Live Coding and LINQ

**Source question:** 3. Find the first non-repeating character.

## 1. What is it?

The first non-repeating character is the first character in a string that appears only once in the entire string.

For example, in `swiss`, the answer is `w`. The character `s` repeats, while `w` appears once and comes before the other unique character, `i`.

## 2. Why is it important?

This is a common coding exercise because it tests whether a developer can:

- Count values efficiently.
- Preserve the original order of the input.
- Choose suitable data structures.
- Handle empty input and the case where no answer exists.

The same pattern is useful in real systems when finding the first unique event, reference, token, or identifier in an ordered data set.

## 3. How does it work?

A clear solution uses two passes through the string:

1. Read every character and store its count in a dictionary.
2. Read the string again in its original order and return the first character whose count is `1`.

The dictionary gives fast count lookups. The second pass is important because a dictionary should not be used to decide which character appeared first.

This approach takes **O(n)** time and **O(k)** extra space, where `n` is the string length and `k` is the number of different characters.

## 4. Practical example

Suppose a payment service receives a short sequence of routing markers, such as `AABCDCB`. It needs the first marker that was sent only once so that support staff can identify the earliest unusual routing step.

The service counts all markers and then checks them in arrival order. `A`, `B`, and `C` repeat, so `D` is returned as the first non-repeating marker.

## 5. Scenario-based interview answer

“I was asked to find the first character that occurs only once. I needed to keep the original order and avoid repeatedly scanning the whole string. I chose a dictionary to count each character in one pass. I then made a second pass over the original string and returned the first character with a count of one. If there was no such character, I returned `null`. This keeps the code easy to explain and gives O(n) time instead of the O(n²) time of counting every character again inside a loop.”

## 6. Code example

```csharp
public static char? FindFirstNonRepeatingCharacter(string? text)
{
    if (string.IsNullOrEmpty(text))
    {
        return null;
    }

    var counts = new Dictionary<char, int>();

    foreach (char character in text)
    {
        counts.TryGetValue(character, out int currentCount);
        counts[character] = currentCount + 1;
    }

    foreach (char character in text)
    {
        if (counts[character] == 1)
        {
            return character;
        }
    }

    return null;
}

Console.WriteLine(FindFirstNonRepeatingCharacter("swiss")); // w
Console.WriteLine(FindFirstNonRepeatingCharacter("aabb"));  // blank: null
```

The nullable return type, `char?`, clearly represents “no unique character.” `TryGetValue` reads the existing count without requiring a separate key check.

This version treats a character as a .NET `char`, which is one UTF-16 code unit. That is suitable for typical interview inputs such as letters and digits. If the input can contain emoji or other characters outside the Basic Multilingual Plane, use `System.Text.Rune` and `text.EnumerateRunes()` instead. `Rune` and `EnumerateRunes()` are available in modern .NET, including currently supported .NET versions.

A concise LINQ version is possible:

```csharp
char? result = text?
    .GroupBy(character => character)
    .FirstOrDefault(group => group.Count() == 1)?
    .Key;
```

However, the two-pass dictionary version makes the complexity and edge-case behavior clearer in a live coding interview.

## 7. Common mistakes

- Using `text.Count(x => x == character)` for every character. This repeatedly scans the string and can take O(n²) time.
- Returning the first dictionary entry with a count of one instead of checking the original string order.
- Returning a default `char` such as `\0` without explaining what it means. A nullable `char` is clearer.
- Forgetting to handle `null`, an empty string, or a string where every character repeats.
- Assuming `char` always represents a complete visible Unicode character. Emoji may use multiple UTF-16 code units.
- Changing case or ignoring spaces without confirming whether the comparison should be case-insensitive or should exclude whitespace.

## 8. Follow-up interview questions

### 1. Can this be solved with LINQ?

Yes. `GroupBy` can group equal characters, and the first group with one item gives the answer. It is concise, but the dictionary approach is usually easier to analyze and control.

### 2. How would you make the search case-insensitive?

Normalize each character before counting and checking, for example with `char.ToUpperInvariant`. First confirm whether the method should return the original character or the normalized one.

### 3. Can it be solved in one pass?

Counts can be updated in one pass, but deciding the first unique character normally requires stored order or a second pass because a character that looks unique now may repeat later. Two passes are simple and still O(n).
