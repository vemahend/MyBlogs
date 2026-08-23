# 28. How do you handle pagination?

**Technology:** API Design and Integration Governance

**Source question:** 28. How do you handle pagination?

## 1. What is it?

Pagination means returning a large collection in smaller parts, called pages, instead of sending every record in one response.

The two common approaches are:

- **Offset pagination:** The client sends values such as `page=3&pageSize=50`, and the server skips the earlier rows.
- **Cursor or keyset pagination:** The client sends an opaque cursor that identifies where the previous page ended. The server continues from that point.

I normally use offset pagination for small, stable, user-facing lists and cursor pagination for large or frequently changing data sets.

## 2. Why is it important?

Without pagination, a request may load thousands or millions of rows. This increases database work, memory use, response size, network time, and the risk of timeouts.

Pagination gives clients predictable response sizes and protects the API and database. It is also important for governance because APIs should use consistent parameter names, maximum page sizes, response metadata, and error rules.

## 3. How does it work?

A typical flow is:

1. The client requests a page and supplies either an offset or a cursor.
2. The API validates the requested size and applies a safe maximum, for example 100 items.
3. The database query applies filters and a **stable, unique order**, such as `CreatedAt DESC, Id DESC`.
4. The server reads one extra row. If the client requested 50 items, it reads 51 to determine whether another page exists.
5. The API returns 50 items and, when more data exists, a `nextCursor` or next-page link.

Offset pagination usually becomes slower for deep pages because the database still has to find and skip earlier rows. It can also produce duplicates or missing items when rows are inserted or deleted between requests.

Cursor pagination uses the last ordered values in a predicate, for example "created before this time, or at the same time with a lower ID." It performs well with a matching database index and is more stable while data changes. The cursor should be opaque to clients; it may be encoded and should be signed or otherwise protected if changing it could expose data or bypass rules.

## 4. Practical example

Consider a banking API that returns account transactions. The table contains millions of records and new transactions arrive continuously.

The API orders results by `BookedAt DESC, TransactionId DESC` and returns the latest 50 transactions. Its response includes a cursor built from the last returned row. The mobile app sends that cursor to get the next 50 records. An index on `(AccountId, BookedAt DESC, TransactionId DESC)` supports both the account filter and ordering.

The cursor is scoped to the same account and filters. If the client changes the date range or transaction type, it starts again without the old cursor.

## 5. Scenario-based interview answer

**Problem:** In a payment platform, our transaction-history endpoint used offset pagination. Large merchants could request deep pages, which caused slow SQL queries. New payments arriving between page requests also caused some transactions to appear twice or be skipped.

**Decision:** I moved the endpoint to cursor-based pagination because the data was large, time-ordered, and constantly changing. I kept a strict maximum page size and a stable secondary sort by transaction ID.

**Implementation:** We queried by merchant, ordered by `CreatedAt` and `Id` descending, and used the values from the last returned record as the next cursor. We fetched one extra row to calculate `hasMore`, added a matching composite index, treated the cursor as opaque, and rejected invalid cursors with a clear `400 Bad Request` response.

**Result:** Query time stayed predictable even after the table grew significantly, response sizes remained controlled, and clients no longer saw the common duplicate and missing-item problems caused by deep offset paging.

In an interview, I would also explain that cursor pagination is not automatically correct: the sort must be deterministic, the cursor must include every sort key, and the same authorization and filter rules must be applied on every request.

## 6. Code example

This example uses an ASP.NET Core minimal API with EF Core. The cursor contains the last row's timestamp and ID. Production code may sign the cursor and should handle malformed values through a validation result rather than exposing an exception.

```csharp
using System.Text;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;

app.MapGet("/accounts/{accountId:long}/transactions", async (
    long accountId,
    string? cursor,
    int? pageSize,
    PaymentsDbContext db,
    CancellationToken cancellationToken) =>
{
    var size = Math.Clamp(pageSize ?? 50, 1, 100);
    var query = db.Transactions
        .AsNoTracking()
        .Where(x => x.AccountId == accountId);

    if (!string.IsNullOrWhiteSpace(cursor))
    {
        if (!TransactionCursor.TryParse(cursor, out var last))
            return Results.BadRequest(new { error = "Invalid pagination cursor." });

        query = query.Where(x =>
            x.BookedAt < last.BookedAt ||
            (x.BookedAt == last.BookedAt && x.Id < last.Id));
    }

    var rows = await query
        .OrderByDescending(x => x.BookedAt)
        .ThenByDescending(x => x.Id)
        .Take(size + 1)
        .Select(x => new TransactionItem(x.Id, x.BookedAt, x.Amount))
        .ToListAsync(cancellationToken);

    var hasMore = rows.Count > size;
    var items = rows.Take(size).ToList();
    var nextCursor = hasMore
        ? TransactionCursor.Create(items[^1].BookedAt, items[^1].Id)
        : null;

    return Results.Ok(new { items, nextCursor, hasMore });
});

public record TransactionItem(long Id, DateTimeOffset BookedAt, decimal Amount);
public record TransactionCursor(DateTimeOffset BookedAt, long Id)
{
    public static string Create(DateTimeOffset bookedAt, long id) =>
        WebEncoders.Base64UrlEncode(
            Encoding.UTF8.GetBytes($"{bookedAt.UtcTicks}:{id}"));

    public static bool TryParse(string value, out TransactionCursor result)
    {
        result = default!;
        try
        {
            var text = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(value));
            var parts = text.Split(':', 2);
            if (parts.Length != 2 ||
                !long.TryParse(parts[0], out var ticks) ||
                !long.TryParse(parts[1], out var id)) return false;

            result = new TransactionCursor(
                new DateTimeOffset(ticks, TimeSpan.Zero), id);
            return true;
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
```

The unique `Id` is the tie-breaker when several transactions have the same timestamp. `Take(size + 1)` detects another page without running a potentially expensive total-count query. A composite index matching the filter and sort is essential for good performance.

## 7. Common mistakes

- Returning an unlimited or client-controlled page size.
- Paginating without an explicit, deterministic order.
- Sorting only by a non-unique value such as a timestamp and not adding a unique tie-breaker.
- Using large `Skip`/`OFFSET` values on a high-volume table without checking query performance.
- Running `COUNT(*)` on every request when the client only needs `hasMore`.
- Exposing database details in the cursor or trusting unsigned cursor values for authorization.
- Reusing a cursor after changing filters, sort order, tenant, or account scope.
- Loading all rows into memory and paginating in application code instead of in the database.
- Forgetting a database index that matches the filter and ordering columns.

## 8. Follow-up interview questions

### When would you still use offset pagination?

I use it for small or mostly static result sets where users need direct page numbers or must jump to an arbitrary page. It is simple and works well when deep offsets are not expected.

### Should every paginated response include a total count?

No. A total count can be useful for admin screens, but it may be expensive on large or complex queries. For scrolling feeds, `hasMore` and `nextCursor` are usually enough.

### How do you prevent duplicates when records have the same timestamp?

Use a unique secondary key in both the ordering and cursor, such as `ORDER BY BookedAt DESC, Id DESC`. The next-page predicate must compare both values in the same order.
