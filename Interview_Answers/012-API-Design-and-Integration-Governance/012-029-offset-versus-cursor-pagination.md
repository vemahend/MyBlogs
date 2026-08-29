# 29. Offset versus cursor pagination?

**Technology:** API Design and Integration Governance

**Source question:** 29. Offset versus cursor pagination?

## 1. What is it?

Offset and cursor pagination are two ways to return a large result set in smaller pages.

- **Offset pagination** tells the server how many rows to skip. For example, `?offset=100&limit=20` skips 100 rows and returns the next 20. Page-number pagination, such as `?page=6&pageSize=20`, is normally converted to an offset.
- **Cursor pagination**, also called keyset pagination, tells the server where the previous page ended. For example, a cursor may represent the last transaction's `CreatedAt` and `Id`, so the next query continues after that transaction.

Offset pagination is simple and supports jumping to a page. Cursor pagination is usually faster and more stable for large, frequently changing data sets.

## 2. Why is it important?

The choice affects performance, correctness, and the client experience.

With offset pagination, a database often has to locate and skip all earlier rows before returning a deep page. An offset of 500,000 can therefore be expensive even if the API returns only 20 rows. If records are inserted or deleted between requests, items can also move between offsets, causing duplicates or missing results.

Cursor pagination seeks from indexed sort values instead of counting past earlier rows. Its performance is normally more predictable as the user moves deeper into a large result set. It also behaves better when new records are added, although it does not by itself provide a fully consistent snapshot of changing data.

Architects need to choose based on API behavior:

- Use offset pagination for small or stable data, admin grids, and screens that need page numbers or arbitrary page jumps.
- Use cursor pagination for transaction histories, activity feeds, audit events, and other large or fast-changing ordered data.

## 3. How does it work?

### Offset pagination

The client sends `offset` and `limit`. The server applies a stable order and executes the equivalent of:

```sql
ORDER BY CreatedAt DESC, Id DESC
OFFSET 100 ROWS FETCH NEXT 20 ROWS ONLY
```

The next request uses an offset of 120. The API can also return a total count and page number, but calculating an exact count may be expensive.

### Cursor pagination

The first request sends only a page size. The server:

1. Applies a deterministic order, such as `CreatedAt DESC, Id DESC`.
2. Reads one more row than requested to determine whether another page exists.
3. Builds an opaque `nextCursor` from the last returned row's sort values.
4. On the next request, decodes and validates that cursor.
5. Adds a seek condition using the same sort columns.

For descending order, the next-page condition is:

```text
CreatedAt < lastCreatedAt
OR (CreatedAt = lastCreatedAt AND Id < lastId)
```

The unique `Id` is a tie-breaker. Without it, rows sharing the same timestamp could be skipped or repeated. A matching database index is also important.

The cursor should be opaque to clients. In a production API, it commonly includes the sort values, filter identity, and sometimes an expiry time. It should be signed or otherwise protected when clients must not alter it.

## 4. Practical example

Consider a payment API that lists a merchant's transactions. A large merchant may have tens of millions of records, and new payments arrive every second.

An offset-based request such as `?page=10000&pageSize=50` makes the database skip almost 500,000 ordered rows. Also, if a new payment arrives after page one is read, the row positions change and the client may see the last item from page one again on page two.

With cursor pagination, the API orders by `ProcessedAt DESC, TransactionId DESC`. Page one returns 50 transactions and a cursor representing its last transaction. Page two asks for records older than that cursor. New payments added at the front do not change this boundary, so scrolling remains stable and the database can seek through an index on `(MerchantId, ProcessedAt DESC, TransactionId DESC)`.

If the business needs an exact, unchanging export rather than normal browsing, I would use a snapshot, an `asOf` boundary, or a background export job. Cursor pagination alone does not freeze records that are updated or deleted.

## 5. Scenario-based interview answer

**Problem:** "In a banking platform, our account-history endpoint used page numbers. Normal pages were fast, but customers with long histories saw slow responses on deep pages. Because new transactions arrived continuously, users also occasionally saw duplicates while scrolling."

**Decision:** "I chose cursor pagination for the customer-facing history because users moved forward sequentially and did not need to jump to page 500. I kept offset pagination only on a smaller internal admin screen where direct page navigation was useful."

**Implementation:** "We ordered transactions by `BookedAt DESC` and then by the unique transaction ID. The next cursor contained both values and was treated as an opaque, signed token. Every request reapplied the account, tenant, and date filters, fetched `pageSize + 1` rows, and returned `nextCursor` only when another page existed. We added an index matching the account filter and sort order and capped the page size at 100."

**Result:** "Database time stayed predictable as the transaction table grew, and new transactions no longer shifted the boundary between pages. I also made it clear that cursor pagination gives stable traversal, not snapshot isolation; for regulatory exports we used a separate snapshot-based process."

That answer shows that the choice is not simply "cursor is always better." It depends on data size, how often the data changes, and whether the client needs random page access.

## 6. Code example

This ASP.NET Core and EF Core example shows the main query difference. The cursor uses the last row's timestamp and ID. The API should return a validation error if cursor parsing fails.

```csharp
using Microsoft.EntityFrameworkCore;

public sealed record TransactionCursor(DateTimeOffset CreatedAt, long Id);

// Offset pagination
static async Task<List<TransactionDto>> GetByOffsetAsync(
    PaymentsDbContext db,
    long accountId,
    int offset,
    int limit,
    CancellationToken cancellationToken)
{
    offset = Math.Max(offset, 0);
    limit = Math.Clamp(limit, 1, 100);

    return await db.Transactions
        .AsNoTracking()
        .Where(x => x.AccountId == accountId)
        .OrderByDescending(x => x.CreatedAt)
        .ThenByDescending(x => x.Id)
        .Skip(offset)
        .Take(limit)
        .Select(x => new TransactionDto(x.Id, x.CreatedAt, x.Amount))
        .ToListAsync(cancellationToken);
}

// Cursor pagination; request one extra row to calculate HasMore.
static async Task<CursorPage<TransactionDto>> GetByCursorAsync(
    PaymentsDbContext db,
    long accountId,
    TransactionCursor? cursor,
    int limit,
    CancellationToken cancellationToken)
{
    limit = Math.Clamp(limit, 1, 100);

    var query = db.Transactions
        .AsNoTracking()
        .Where(x => x.AccountId == accountId);

    if (cursor is not null)
    {
        query = query.Where(x =>
            x.CreatedAt < cursor.CreatedAt ||
            (x.CreatedAt == cursor.CreatedAt && x.Id < cursor.Id));
    }

    var rows = await query
        .OrderByDescending(x => x.CreatedAt)
        .ThenByDescending(x => x.Id)
        .Take(limit + 1)
        .Select(x => new TransactionDto(x.Id, x.CreatedAt, x.Amount))
        .ToListAsync(cancellationToken);

    var hasMore = rows.Count > limit;
    var items = rows.Take(limit).ToList();
    var next = hasMore
        ? new TransactionCursor(items[^1].CreatedAt, items[^1].Id)
        : null;

    return new CursorPage<TransactionDto>(items, next, hasMore);
}

public sealed record TransactionDto(
    long Id,
    DateTimeOffset CreatedAt,
    decimal Amount);

public sealed record CursorPage<T>(
    IReadOnlyList<T> Items,
    TransactionCursor? NextCursor,
    bool HasMore);
```

`Skip` makes the offset approach easy to understand but can become costly for deep pages. The cursor query uses a seek predicate and the same columns as its ordering. In a real HTTP contract, `TransactionCursor` would be encoded into an opaque string rather than returned as a public object. Encoding is not encryption or tamper protection, so sensitive or security-relevant cursor data should be protected appropriately.

## 7. Common mistakes

- Paginating without a fixed, deterministic sort order.
- Using a non-unique cursor field, such as only `CreatedAt`, without a unique tie-breaker.
- Using deep offsets on a very large table and assuming `Take(20)` makes the query cheap.
- Claiming that cursor pagination provides snapshot consistency. Updates and deletes can still affect later results.
- Allowing unlimited page sizes.
- Building a cursor from values that do not match the query's sort order.
- Accepting a cursor with different filters, tenant, account, or user permissions from the original request.
- Treating Base64 encoding as protection against tampering.
- Forgetting an index that matches the filter and ordered cursor columns.
- Always running an exact `COUNT(*)` even when the client only needs `hasMore`.
- Choosing cursor pagination when the product must support direct jumps to arbitrary page numbers.

## 8. Follow-up interview questions

### Which pagination style would you choose for an admin search grid?

Usually offset pagination, if the filtered result is reasonably small and users need page numbers or direct page jumps. I would still cap the page size and measure deep-page performance.

### Can cursor pagination return a total page count?

Not naturally. It is designed for sequential traversal and usually returns `hasMore` and a next cursor. An exact total requires a separate count query, which can be costly and can change while the user is browsing.

### How do you support both next and previous navigation with cursors?

Create direction-aware cursors and reverse the comparison and ordering for a previous-page query. After fetching, return items in the API's documented display order. Test boundary rows carefully, especially when sort values are duplicated.
