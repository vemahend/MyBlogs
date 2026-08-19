# 1. Explain IEnumerable, IQueryable, and List. When can IQueryable cause performance issues?

**Technology:** C# and .NET

**Source question:** 1. Explain IEnumerable, IQueryable, and List. When can IQueryable cause performance issues?

## 1. What problem does it solve?

Applications need to represent both data that already exists in memory and a recipe for retrieving data from somewhere else. Treating those as identical causes expensive mistakes.

- `IEnumerable<T>` provides a common way to iterate a sequence. LINQ-to-Objects operators run as .NET code, normally when enumeration begins.
- `IQueryable<T>` represents a query as an expression tree that a provider can translate, commonly into SQL.
- `List<T>` is a concrete, mutable, indexable in-memory collection that has already been materialized.

In transaction search, filtering 20 rows in SQL scales; loading ten million and filtering in the API does not. An escaping `IQueryable` can also cause accidental joins, repeated calls, or unreviewed SQL.

## 2. Explain it in simple language

Think of a bank statement:

- `IQueryable<Transaction>` is an order form describing which records the archive should find.
- `IEnumerable<Transaction>` is something you can read one item at a time; it may be lazy and is not necessarily already stored.
- `List<Transaction>` is the stack of statement rows already delivered to your desk.

**One-sentence definition:** `IEnumerable<T>` is an iteration contract, `IQueryable<T>` is a provider-translatable query description, and `List<T>` is a materialized in-memory collection.

**Memory rule:** query remotely with `IQueryable`, enumerate generally with `IEnumerable`, store locally with `List`.

A common misunderstanding is that `IEnumerable` means “in memory”; it can generate values, read a file, or wrap a database query. Converting `IQueryable` to `IEnumerable` does not execute it; enumeration or a terminal operator normally does.

## 3. How does it work internally?

With LINQ-to-Objects, operators such as `Where` build iterators. Deferred operators run as the consumer calls `MoveNext`; `ToList` enumerates and allocates storage.

`IQueryable<T>` implements `IEnumerable<T>` but additionally exposes `Expression` and `Provider`. Calls such as `Where(x => x.Amount > 100)` build an expression tree rather than merely storing a compiled delegate. On a terminal operation, EF Core’s provider analyzes and translates the supported expression, parameterizes values, sends SQL through the database driver, and materializes result objects.

```mermaid
flowchart LR
    A[Compose IQueryable] --> B[Expression tree]
    B -->|ToListAsync| C[EF Core translates]
    C --> D[Database executes SQL]
    D --> E[List of DTOs]
```

Queries are deferred, so each enumeration may execute again. `AsEnumerable()` makes subsequent operators LINQ-to-Objects but does not fetch immediately. `ToListAsync` executes and buffers. One `DbContext` is not thread-safe; async frees the request thread during I/O but makes SQL neither parallel nor cheaper.

Modern EF Core rejects most non-translatable expressions outside the final projection. Translation depends on version and provider, so test generated SQL against the production provider.

## 4. Realistic payment or banking example

Angular sends account ID, date range, page size, and cursor. Frontend validation improves usability but is not a security boundary.

ASP.NET Core authenticates, authorizes account access, validates limits, and requests a page. The service composes an EF Core query, filters, orders, projects to a DTO, and calls `ToListAsync`. SQL Server is authoritative. A broker may publish posting events, but consumers and indexes remain derived views.

The repository may use `IQueryable` internally, but should return `IReadOnlyList<TransactionSummary>` or a page result. This prevents controllers from appending arbitrary database work.

## 5. Successful flow and failure flow

### Successful flow

1. Angular sends bounded criteria and a correlation ID.
2. ASP.NET Core validates and authorizes account access.
3. The service builds a no-tracking, filtered, ordered projection.
4. `ToListAsync(cancellationToken)` executes one parameterized command.
5. The database returns an indexed page; the API returns DTOs and disposes its scoped context.

### Failure flow

- **Validation or authorization:** return 400/403 `ProblemDetails` without revealing another customer’s account.
- **Timeout or cancellation:** pass the token to EF Core. Cancellation requests work to stop; it does not roll back completed work. Reads can be retried within rate limits.
- **Database failure:** log duration, correlation ID, and safe metadata—not account data—then return a sanitized 5xx. Retry only provider-classified transient faults with a retry budget.
- **Duplicate request:** reads are normally harmless, but repeated enumeration issues duplicate SQL. Materialize once for a shared snapshot.
- **Concurrent posting:** offset pages can skip or repeat rows. Prefer deterministic keyset pagination, such as `(BookedAt, Id)`, and define the consistency expected by the product.
- **Broker or partial completion:** not part of the direct read. A broker-fed read model must expose staleness and reconcile from the authoritative ledger.

## 6. Practical C#/.NET implementation

Keep query composition in infrastructure and return an application-owned model:

```csharp
public sealed record TransactionQuery(
    Guid AccountId, DateTimeOffset From, DateTimeOffset To,
    int PageSize, DateTimeOffset? Before, Guid? BeforeId);

public interface ITransactionReader
{
    Task<IReadOnlyList<TransactionSummary>> SearchAsync(
        TransactionQuery request, CancellationToken cancellationToken);
}

public sealed class EfTransactionReader(BankingDbContext db) : ITransactionReader
{
    public async Task<IReadOnlyList<TransactionSummary>> SearchAsync(
        TransactionQuery r, CancellationToken ct)
    {
        if (r.PageSize is < 1 or > 200 || r.From >= r.To)
            throw new ArgumentException("Invalid transaction search range.");

        var query = db.Transactions
            .AsNoTracking()
            .Where(x => x.AccountId == r.AccountId &&
                        x.BookedAt >= r.From && x.BookedAt < r.To);

        if (r.Before is { } time && r.BeforeId is { } id)
            query = query.Where(x => x.BookedAt < time ||
                (x.BookedAt == time && x.Id.CompareTo(id) < 0));

        return await query
            .OrderByDescending(x => x.BookedAt)
            .ThenByDescending(x => x.Id)
            .Select(x => new TransactionSummary(x.Id, x.BookedAt, x.Amount, x.Currency))
            .Take(r.PageSize)
            .ToListAsync(ct);
    }
}
```

The endpoint authorizes `AccountId`, calls the reader, and maps expected validation failures to `ProblemDetails`; centralized handling covers unexpected failures. Projection avoids entities and excess columns. `AsNoTracking` removes tracking overhead, `Take` bounds work, and stable ordering makes pagination deterministic.

Integration tests should use the real provider—not only EF Core’s in-memory provider—and cover authorization, boundaries, ordering, cancellation, query counts, and realistic volumes. Telemetry should record duration, row count, timeout, and query identity without personal data.

## 7. Important design decisions

**Expose `IQueryable` or a specific API.** Exposing it is flexible but leaks persistence, provider, and lifetime concerns. Prefer intention-revealing reader methods. Internal query objects can preserve controlled composability.

**Buffer or stream.** `ToListAsync` gives a reusable page and promptly releases the reader, at an allocation cost. `AsAsyncEnumerable` reduces buffering for exports but holds resources longer and complicates failures and backpressure. Buffer normal pages; stream deliberate export workloads.

**Tracking or no tracking.** Tracking supports updates and identity resolution but costs CPU and memory. Default to `AsNoTracking` for read DTOs; tracking is not authorization or concurrency control.

**Pagination strategy.** Offset pagination permits page jumps, but large offsets cost more and inserts destabilize results. Keyset pagination is stable but needs a unique ordered key and cannot naturally jump. Prefer it for transaction feeds.

**Compiled queries.** EF Core caches by query shape. Explicit compiled queries may help hot, stable paths but add restrictions; measure first because database work usually dominates.

## 8. When to use it and when not to use it

Use `IQueryable` to compose within the data-access boundary, `IEnumerable` for provider-independent iteration, and `List` for a materialized snapshot, indexing, repeated traversal, or mutation.

Do not expose `IQueryable` after its `DbContext` may be disposed or pretend providers share identical semantics. Use LINQ-to-Objects for tiny loaded collections and consider a bounded async stream for large exports.

Warning signs include calling `AsEnumerable` before filters, unbounded `ToListAsync`, accepting arbitrary client expressions, repository methods returning queries that controllers extend, or enumerating the same query repeatedly.

## 9. Compare it with related concepts

| Concept | Purpose and ownership | Lifecycle | Performance and reliability | Typical use and limitation |
|---|---|---|---|---|
| `IEnumerable<T>` | Iteration contract | Often lazy | May recompute or perform I/O | In-memory pipelines; no translation contract |
| `IQueryable<T>` | Provider query description | Deferred | Pushes work down, but may produce costly SQL | EF Core composition; leaks provider/lifetime if exposed |
| `List<T>` | Mutable buffer | Materialized | Fast indexing; consumes row-proportional memory | Bounded results; no remote filtering |
| `IAsyncEnumerable<T>` | Async pull sequence | Incremental | Lower buffering; longer-lived resources | Large streams; not parallel by itself |

For transaction search, compose an internal `IQueryable`, project and materialize one bounded `List`, then expose it as `IReadOnlyList`. That combines database-side execution with a clean application contract.

## 10. Common production mistakes

- **Premature materialization:** `ToList()` before `Where` transfers excess rows. Detect through SQL telemetry, row counts, and memory profiles; filter/project before materializing.
- **N+1 queries:** navigation access or per-row queries create many round trips. Detect query counts and traces; project required shapes, or deliberately eager-load when entities are truly needed.
- **Cartesian explosion:** collection joins/includes multiply rows. Inspect SQL and plans; reshape, project, or evaluate split queries and their extra round trips.
- **Client-side boundary mistakes:** `AsEnumerable` makes later filters run in .NET. Keep translatable filtering before it and make any client processing explicit and bounded.
- **Repeated enumeration:** `Count()` followed by `ToList()` executes twice. Materialize once or issue intentionally separate optimized queries.
- **Unsafe dynamic queries:** raw SQL or unrestricted fields risk injection or denial of service. Parameterize values, allow-list fields, cap complexity, and set timeouts.
- **Context lifetime leaks:** returning a query beyond a scoped `DbContext` produces runtime failures and unclear ownership. Execute inside infrastructure and return data.
- **Missing indexes:** correct LINQ can still scan. Review plans with realistic cardinality and monitor latency, rows, timeouts, and database load.

## 11. Interview-ready answer

### 30-second answer

`IEnumerable<T>` is the basic iteration abstraction and LINQ operators normally execute as .NET code when enumerated. `IQueryable<T>` carries an expression tree that a provider such as EF Core can translate into SQL. `List<T>` is an already materialized, mutable in-memory collection. I keep `IQueryable` inside the data layer, filter, order, project, and page there, then materialize once. It becomes dangerous when it creates unbounded or repeated queries, N+1 round trips, poor SQL, client-side work, or escapes the `DbContext` lifetime.

### Two-minute senior-level answer

The key distinction is execution ownership. An `IEnumerable` lets a consumer pull items; it says neither that data is already in memory nor that operations translate remotely. An `IQueryable` captures operations as an expression tree, and its provider decides whether and how to translate them. With EF Core, execution is deferred until enumeration or a terminal operator. A `List` is concrete storage created after enumeration.

For transaction search, I compose inside infrastructure: authorize, filter, use `AsNoTracking`, apply keyset pagination, project DTO columns, cap the page, and call `ToListAsync` with cancellation. I return a read-only page, not `IQueryable`, so callers cannot alter SQL or outlive the context.

Problems arise from fetching before filtering, repeated enumeration, N+1 queries, cartesian joins, non-sargable predicates, large offsets, missing indexes, or arbitrary client queries. Async avoids blocking a request thread; it does not reduce database cost. I verify SQL, plans, query counts, and latency with the real provider and realistic volumes. In-memory tests cannot validate translation.

### Three follow-up questions an interviewer may ask

1. What exactly triggers execution of an EF Core `IQueryable`?
2. How do `AsEnumerable`, `ToList`, and `AsAsyncEnumerable` differ?
3. How would you diagnose and fix an N+1 query or cartesian explosion?

### Important keywords

Deferred execution, expression tree, query provider, materialization, server-side projection, `AsNoTracking`, bounded result, keyset pagination, N+1, generated SQL, execution plan, cancellation, `DbContext` lifetime.

### Red-flag answers

Claiming `IEnumerable` always loads everything into memory; saying `IQueryable` is always faster; exposing it through every layer; assuming async makes SQL faster; ignoring repeated enumeration; or optimizing without examining generated SQL and database plans.

## 12. Test my understanding interactively

During revision, answer this scenario-based interview question:

> A transaction endpoint returns `repository.GetAll().AsEnumerable().Where(IsVisibleToUser).Take(50).ToList()`, becomes slow as the ledger grows, and occasionally exposes transactions from another account; how would you redesign it, and what would you verify before production release?

## Revision card

- **One-sentence definition:** `IEnumerable` iterates, `IQueryable` describes provider-executed work, and `List` stores materialized items.
- **Memory rule:** query remotely, enumerate generally, store locally.
- **Recommended use:** keep EF Core queries inside infrastructure; filter, authorize, project, order, bound, and materialize once.
- **Main danger:** deferred, remotely translated code can hide expensive, repeated, unbounded, or incorrectly secured database work.
- **Interview takeaway:** discuss execution ownership and SQL behavior—not merely interface inheritance—and show how you verify performance and security in production.
