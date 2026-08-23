# 30. How do you handle filtering and sorting?

**Technology:** API Design and Integration Governance

**Source question:** 30. How do you handle filtering and sorting?

## 1. What is it?

Filtering and sorting are API features used to control a collection response.

- **Filtering** limits the records returned. For example, `status=Completed` returns only completed payments.
- **Sorting** controls their order. For example, `sort=-createdAt` means newest first, while `sort=amount` means lowest amount first.

The API should define which fields and operators clients may use. It should not expose unrestricted database queries or accept arbitrary property names.

## 2. Why is it important?

Without server-side filtering, clients may need to download large data sets and discard most of the records. That wastes database, network, and client resources. Without sorting, the result order may change between requests, which makes screens and pagination unreliable.

A well-designed contract gives clients useful search options while keeping the API safe and predictable. It also lets the team:

- enforce tenant and authorization rules before returning data;
- use database indexes efficiently;
- cap query cost and protect the service from abusive requests;
- add new filter or sort fields without exposing the storage model;
- document consistent behavior across APIs.

## 3. How does it work?

A common flow is:

1. The client sends documented query parameters, such as `status=Completed&from=2026-08-01&sort=-createdAt&pageSize=50`.
2. The API parses and validates every value. Unknown fields, invalid operators, impossible date ranges, and excessive page sizes return `400 Bad Request`.
3. The service first applies mandatory security filters, such as `TenantId` and the accounts the user may access.
4. It adds optional business filters to an `IQueryable`. EF Core translates the combined expression into parameterized SQL.
5. It maps the public sort name to an allow-listed expression. A leading `-` can represent descending order.
6. It adds a unique tie-breaker, such as `Id`, so the order is deterministic.
7. It applies pagination, projects only the required columns, and executes the query asynchronously.

For more complex APIs, filters can use a documented format such as `amount[gte]=100`. The allowed operators should remain small and meaningful. If clients need unrestricted analytics or complex Boolean expressions, a reporting service or a governed query standard such as OData may be more suitable than inventing a large custom syntax.

Filter and sort behavior is part of the public API contract. Field names, case sensitivity, null ordering, time-zone handling, default order, and maximum limits should be documented and tested.

## 4. Practical example

Consider a payment operations API:

```http
GET /api/payments?status=Failed&from=2026-08-01T00:00:00Z&to=2026-08-22T00:00:00Z&sort=-createdAt&pageSize=50
```

The authenticated operator belongs to merchant 42. The server always adds `MerchantId = 42`; it never accepts that scope only from the query string. It then filters failed payments in the UTC date range and sorts by `CreatedAt DESC, Id DESC`.

The database has an index designed for the common access path, for example `(MerchantId, Status, CreatedAt DESC, Id DESC)`. The API returns a bounded page rather than every matching payment. The stable secondary sort by `Id` prevents two payments with the same timestamp from moving unpredictably between pages.

## 5. Scenario-based interview answer

**Problem:** "A payment-support endpoint returned all transactions and the web application filtered them in memory. It became slow for large merchants, and different screens used different names and rules for the same filters. Sorting by user-supplied property names also created fragile queries."

**Decision:** "I moved filtering and sorting to the server and treated them as a governed API contract. We chose a small set of business-friendly filter fields and sort keys instead of exposing entity properties directly."

**Implementation:** "We defined typed request parameters for status, UTC date range, minimum amount, and sort. We validated them at the API boundary, applied merchant and authorization scope first, and composed an EF Core query without materializing it early. Sort keys were mapped through a switch to known expressions, followed by the transaction ID as a tie-breaker. We capped page size, used cursor pagination for the large history view, added indexes for measured query patterns, and returned a clear `400` response for unsupported options."

**Result:** "Response sizes and database work dropped significantly, page navigation became stable, and clients had one documented search contract. We also monitored slow-query data before adding indexes, because indexing every possible filter combination would have increased write cost."

## 6. Code example

This example uses ASP.NET Core with EF Core. It supports a controlled set of filters and sort options rather than dynamically using a client value as a property or SQL fragment.

```csharp
using Microsoft.EntityFrameworkCore;

public sealed record PaymentQuery(
    PaymentStatus? Status,
    DateTimeOffset? From,
    DateTimeOffset? To,
    decimal? MinimumAmount,
    string Sort = "-createdAt",
    int PageSize = 50);

public static async Task<IResult> GetPaymentsAsync(
    PaymentQuery request,
    PaymentsDbContext db,
    ICurrentMerchant currentMerchant,
    CancellationToken cancellationToken)
{
    if (request.From > request.To)
        return Results.BadRequest("'from' must be earlier than 'to'.");

    if (request.MinimumAmount is < 0)
        return Results.BadRequest("'minimumAmount' cannot be negative.");

    if (request.PageSize is < 1 or > 100)
        return Results.BadRequest("'pageSize' must be between 1 and 100.");

    var query = db.Payments
        .AsNoTracking()
        .Where(p => p.MerchantId == currentMerchant.Id);

    if (request.Status is not null)
        query = query.Where(p => p.Status == request.Status);

    if (request.From is not null)
        query = query.Where(p => p.CreatedAt >= request.From);

    if (request.To is not null)
        query = query.Where(p => p.CreatedAt < request.To);

    if (request.MinimumAmount is not null)
        query = query.Where(p => p.Amount >= request.MinimumAmount);

    query = request.Sort switch
    {
        "createdAt"  => query.OrderBy(p => p.CreatedAt).ThenBy(p => p.Id),
        "-createdAt" => query.OrderByDescending(p => p.CreatedAt)
                             .ThenByDescending(p => p.Id),
        "amount"     => query.OrderBy(p => p.Amount).ThenBy(p => p.Id),
        "-amount"    => query.OrderByDescending(p => p.Amount)
                             .ThenByDescending(p => p.Id),
        _ => null!
    };

    if (query is null)
        return Results.BadRequest("Supported sort values are createdAt, -createdAt, amount, and -amount.");

    var items = await query
        .Take(request.PageSize)
        .Select(p => new PaymentDto(p.Id, p.Status, p.Amount, p.CreatedAt))
        .ToListAsync(cancellationToken);

    return Results.Ok(items);
}
```

The merchant restriction is mandatory and comes from the authenticated context. The `switch` is an allow-list, so public sort names are not passed into raw SQL. Filters remain on `IQueryable`, allowing EF Core to build one parameterized database query. `ThenBy` supplies a stable tie-breaker, and projection avoids loading unused entity data.

For a production collection endpoint, the same ordered query should also use the API's chosen pagination strategy and return its page metadata or cursor.

## 7. Common mistakes

- Filtering in application memory after loading the whole table.
- Passing client-supplied field names or SQL fragments directly to the database.
- Exposing every entity property as a public filter or sort field.
- Forgetting tenant, ownership, soft-delete, or authorization filters.
- Sorting without a unique tie-breaker, which causes unstable pagination.
- Applying pagination before filtering and ordering.
- Allowing unbounded page sizes, date ranges, text searches, or filter complexity.
- Using string comparisons for dates, money, enums, or identifiers instead of typed values.
- Failing to define UTC and inclusive or exclusive date-boundary rules.
- Calling `ToListAsync` before all filters, ordering, projection, and pagination are applied.
- Adding many indexes without checking real query plans and write overhead.
- Silently ignoring unknown filters or sort values; this hides client errors.
- Returning internal database column names as part of the public contract.

## 8. Follow-up interview questions

### How do you prevent SQL injection in dynamic filtering and sorting?

Use typed values and let EF Core parameterize them. Map filter and sort names to allow-listed expressions. Never concatenate user input into raw SQL, column names, or operators.

### Why do you add a unique secondary sort field?

The main field may contain duplicates. Adding a unique field such as `Id` creates deterministic ordering, which prevents missing or repeated records during pagination.

### When would you use OData instead of custom query parameters?

OData can help when trusted clients genuinely need rich, standardized querying. I would still restrict allowed fields, operators, expansion depth, page size, and query cost. For a public API with a few known use cases, a smaller custom contract is usually easier to secure, optimize, and evolve.
