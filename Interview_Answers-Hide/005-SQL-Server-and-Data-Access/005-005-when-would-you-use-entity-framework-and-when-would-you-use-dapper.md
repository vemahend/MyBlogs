# 5. When would you use Entity Framework, and when would you use Dapper?

**Technology:** SQL Server and Data Access

**Source question:** 5. When would you use Entity Framework, and when would you use Dapper?

## 1. What is it?

Entity Framework Core, usually called EF Core, and Dapper are two ways for a .NET application to work with a relational database such as SQL Server.

- **EF Core** is a full object-relational mapper (ORM). We work mainly with C# entities and LINQ, and EF Core generates SQL, tracks changes, manages relationships, and supports migrations.
- **Dapper** is a small data mapper built on ADO.NET. We write the SQL ourselves, and Dapper maps the returned rows to C# objects.

I normally use EF Core for most business operations and Dapper when a query needs precise SQL control or has a proven performance or reporting requirement. They are not mutually exclusive; using both in the same application can be a sensible design.

## 2. Why is it important?

Choosing the right tool affects development speed, code clarity, SQL control, and production performance.

EF Core removes repetitive database code. It is useful when a system has many normal create, read, update, and delete operations, domain relationships, and transactional business rules. Change tracking and migrations also make application development easier.

Dapper keeps the database interaction explicit. It is useful for read-heavy endpoints, complex joins, stored procedures, bulk-style queries, or carefully tuned SQL where the generated SQL must be predictable.

The choice should not be based on the idea that one tool is always faster or better. EF Core is fast enough for many systems, especially when queries are well designed. Dapper usually has less mapping overhead, but poorly written SQL can still be slow. Database design, indexes, query shape, network traffic, and the number of round trips usually matter more.

## 3. How does it work?

With EF Core, the application creates a `DbContext` and builds a LINQ query. EF Core translates the supported LINQ expression into parameterized SQL. SQL Server executes it, and EF Core materializes the rows as entities or projections. By default, entity queries are tracked, so `SaveChangesAsync` can detect changes and generate `INSERT`, `UPDATE`, or `DELETE` statements. For read-only work, `AsNoTracking` avoids change-tracking overhead.

With Dapper, the application opens an `IDbConnection`, supplies SQL and parameters, and calls methods such as `QueryAsync`, `QuerySingleAsync`, or `ExecuteAsync`. Dapper sends the command through ADO.NET and maps column values to properties. It does not provide change tracking, relationship management, or migrations. The application owns the SQL and update logic.

A practical selection rule is:

- Use EF Core for normal domain persistence, aggregate updates, relationships, unit-of-work behavior, and maintainable LINQ queries.
- Use Dapper for complex or highly optimized reads, existing stored procedures, reporting queries, and cases where exact SQL control is valuable.
- Use evidence from logs, execution plans, and benchmarks before replacing EF Core purely for performance.

## 4. Practical example

Consider a banking application.

When a customer changes a payment beneficiary, I would use EF Core. The operation loads the customer and beneficiary, applies validation, updates related data, writes an audit record, and saves everything in one transaction. EF Core's change tracking and relationship handling make this code easier to maintain.

For an operations dashboard showing daily payment totals by status, currency, bank, and risk category, I might use Dapper. The query could contain several joins, grouped totals, common table expressions, and SQL Server-specific tuning. Writing the SQL directly makes its shape clear and allows the database team to review its execution plan.

Both approaches can share the same SQL Server database. They should still have clear ownership boundaries so that business updates do not become scattered across unrelated SQL statements.

## 5. Scenario-based interview answer

“In a payment platform, most of our write operations involved aggregates such as a payment, its status history, and audit records. I chose EF Core for those operations because change tracking, relationships, and transaction handling reduced boilerplate and kept the business logic readable.

We also had a settlement dashboard that joined several large tables and returned grouped projections. The EF Core version worked, but the generated query was difficult to tune and the endpoint missed its latency target under production-like load. After checking the SQL Server execution plan and measuring the query, I implemented that specific read with Dapper and explicit parameterized SQL. I selected only the required columns and added the appropriate index.

The result was simpler SQL for the database team to review and a faster dashboard, while EF Core remained the default for transactional workflows. I would not introduce Dapper everywhere just because it has lower overhead; I use it when direct SQL gives a clear, measured benefit.”

## 6. Code example

The following example uses EF Core for a transactional update and Dapper for a read-only summary query:

```csharp
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

public sealed record PaymentSummary(string Status, int PaymentCount, decimal TotalAmount);

public sealed class PaymentService
{
    private readonly PaymentsDbContext _db;
    private readonly string _connectionString;

    public PaymentService(PaymentsDbContext db, IConfiguration configuration)
    {
        _db = db;
        _connectionString = configuration.GetConnectionString("Payments")
            ?? throw new InvalidOperationException("Payments connection string is missing.");
    }

    public async Task MarkAsSettledAsync(Guid paymentId, CancellationToken cancellationToken)
    {
        var payment = await _db.Payments
            .SingleOrDefaultAsync(p => p.Id == paymentId, cancellationToken)
            ?? throw new InvalidOperationException("Payment was not found.");

        payment.MarkAsSettled(DateTimeOffset.UtcNow);
        _db.PaymentAuditEntries.Add(
            new PaymentAuditEntry(paymentId, "Settled", DateTimeOffset.UtcNow));

        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<PaymentSummary>> GetDailySummaryAsync(
        DateOnly businessDate,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT Status,
                   COUNT(*) AS PaymentCount,
                   SUM(Amount) AS TotalAmount
            FROM dbo.Payments
            WHERE BusinessDate = @BusinessDate
            GROUP BY Status
            ORDER BY Status;
            """;

        await using var connection = new SqlConnection(_connectionString);
        var command = new CommandDefinition(
            sql,
            new { BusinessDate = businessDate },
            cancellationToken: cancellationToken);

        var rows = await connection.QueryAsync<PaymentSummary>(command);
        return rows.AsList();
    }
}
```

`SaveChangesAsync` lets EF Core persist the entity and audit changes as one unit of work. In a real financial workflow, I would also configure a transaction strategy and optimistic concurrency where required.

The Dapper query uses a named parameter instead of joining values into the SQL string, which prevents SQL injection and helps SQL Server reuse query plans. `CommandDefinition` passes the cancellation token. These APIs are available in modern supported .NET and EF Core versions; exact provider behavior should be checked when upgrading `Microsoft.EntityFrameworkCore.SqlServer`, `Microsoft.Data.SqlClient`, or Dapper.

## 7. Common mistakes

- Choosing Dapper everywhere because it is “faster” without measuring the real bottleneck.
- Loading large tracked entity graphs in EF Core when a small read-only projection and `AsNoTracking` would be enough.
- Calling `SaveChangesAsync` repeatedly inside a loop, causing unnecessary database round trips.
- Hiding inefficient EF Core queries behind repositories and never inspecting the generated SQL or execution plan.
- Building Dapper SQL with string concatenation instead of parameters, creating SQL injection and plan-cache problems.
- Using `SELECT *` in Dapper queries and transferring columns the application does not need.
- Forgetting that Dapper does not provide change tracking, automatic relationship updates, or migrations.
- Mixing EF Core and Dapper inside one transaction without deliberately sharing the same connection and transaction.
- Returning database entities directly from APIs, which couples the external contract to the persistence model.

## 8. Follow-up interview questions

### Can EF Core and Dapper be used in the same application?

Yes. A common approach is EF Core for transactional writes and standard queries, with Dapper for selected complex or performance-sensitive reads. Keep the boundaries clear and handle shared transactions carefully.

### Is Dapper always faster than EF Core?

No. Dapper generally has less mapping and tracking overhead, but total response time depends heavily on SQL, indexes, returned data, and network round trips. Use measurements and SQL Server execution plans before changing tools.

### How would you improve an EF Core read query before replacing it with Dapper?

Project only the required columns, use `AsNoTracking`, avoid N+1 queries, review generated SQL, reduce round trips, check indexes, and measure the result. If the query is still difficult to express or tune, Dapper may then be appropriate.
