# 15. How do you migrate Entity Framework to EF Core?

**Technology:** .NET Framework to Modern .NET

**Source question:** 15. How do you migrate Entity Framework to EF Core?

## 1. What is it?

Migrating Entity Framework usually means replacing Entity Framework 6 (EF6) in a .NET Framework application with Entity Framework Core in a modern .NET application.

EF Core is not simply a newer EF6 assembly. It has different packages, configuration, APIs, query behavior, and migration history. Therefore, this should be treated as a controlled application migration rather than a package upgrade.

## 2. Why is it important?

EF Core allows the data layer to run on modern .NET and supports current features such as dependency injection, improved performance, compiled models, efficient bulk updates with `ExecuteUpdate` and `ExecuteDelete`, and better cloud and container support.

The migration matters because an incorrect conversion can change generated SQL or application behavior. In banking and payment systems, that can cause duplicate updates, incorrect totals, timeouts, or lost concurrency checks. A senior developer must protect the existing database and business behavior while changing the data-access technology.

## 3. How does it work?

A safe migration normally follows these steps:

1. **Assess the EF6 usage.** List the entities, mappings, stored procedures, raw SQL, lazy loading, migrations, interceptors, custom conventions, and provider-specific features.
2. **Choose an approach.** For a smaller system, migrate the whole data layer. For a large system, run EF6 and EF Core side by side and move one bounded area at a time.
3. **Create the EF Core model.** Port POCO entities and rebuild mappings with data annotations or `IEntityTypeConfiguration<T>`. For an existing database, `dotnet ef dbcontext scaffold` can create a starting model, but the generated code must be reviewed.
4. **Replace configuration.** Install the required EF Core provider and configure `DbContext` through dependency injection. For SQL Server, use `Microsoft.EntityFrameworkCore.SqlServer` and `UseSqlServer`.
5. **Rewrite incompatible code.** Replace EF6 namespaces and APIs, then review LINQ queries, relationship loading, transactions, value generation, cascade deletes, and concurrency handling.
6. **Handle migrations carefully.** EF6 migration files cannot be directly converted into EF Core migrations. For an existing production database, establish an EF Core baseline that represents the current schema without trying to recreate it.
7. **Test behavior and SQL.** Use integration tests against the real database engine. Compare results, generated SQL, execution plans, query counts, transaction behavior, and performance.
8. **Release gradually.** Deploy with monitoring and a rollback plan. Move ownership of schema changes to EF Core only after the new path is proven.

EF Core usually translates a LINQ query into SQL when the query is executed, materializes the returned rows into entities, tracks changes when tracking is enabled, and generates `INSERT`, `UPDATE`, or `DELETE` commands during `SaveChangesAsync`.

## 4. Practical example

Consider a payment service being moved from .NET Framework and EF6 to modern .NET. The service reads a payment, changes its status, and saves the result.

The team first maps `Payment` and its row-version column in EF Core. It uses `AsNoTracking` for read-only search screens, but keeps tracking for the payment update. The row version is configured as a concurrency token so that two workers cannot silently overwrite each other's changes. Integration tests run against SQL Server and verify the generated SQL and transaction boundaries before traffic is moved to the new service.

## 5. Scenario-based interview answer

**Problem:** “In one modernization project, a large .NET Framework application used EF6, lazy loading, EDMX mappings, and several years of EF6 migrations. A direct replacement was too risky because the payment database could not be rebuilt.”

**Decision:** “I treated EF Core as a separate data-access implementation. We kept the existing schema and migrated one business module at a time. We also decided that EF Core would not apply schema changes until its model had been verified against production-like data.”

**Implementation:** “We inventoried EF6 features, scaffolded the existing SQL Server schema as a reference, and then created explicit Fluent API mappings. We replaced implicit lazy loading with explicit `Include` or projection queries, preserved row-version concurrency, and rewrote queries that EF Core translated differently. We created a baseline for the current schema instead of replaying the EF6 migration history. Contract and integration tests compared the EF6 and EF Core results, SQL, and performance.”

**Result:** “We moved the module gradually without rebuilding the database. Query counts fell because loading was explicit, production behavior remained stable, and EF Core became the only owner of future schema migrations after the final cutover.”

## 6. Code example

The following example shows a small EF Core data layer for an existing payment table:

```csharp
using Microsoft.EntityFrameworkCore;

public sealed class Payment
{
    public long Id { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public byte[] RowVersion { get; set; } = [];
}

public sealed class PaymentsDbContext(DbContextOptions<PaymentsDbContext> options)
    : DbContext(options)
{
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.ToTable("Payments");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Amount).HasPrecision(18, 2);
            entity.Property(x => x.Status).HasMaxLength(30).IsRequired();
            entity.Property(x => x.RowVersion).IsRowVersion();
        });
    }
}

// Program.cs
builder.Services.AddDbContext<PaymentsDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("Payments")));

public static async Task CompletePaymentAsync(
    long paymentId,
    PaymentsDbContext db,
    CancellationToken cancellationToken)
{
    var payment = await db.Payments.SingleAsync(
        x => x.Id == paymentId,
        cancellationToken);

    payment.Status = "Completed";

    try
    {
        await db.SaveChangesAsync(cancellationToken);
    }
    catch (DbUpdateConcurrencyException)
    {
        throw new InvalidOperationException(
            "The payment was changed by another process.");
    }
}
```

`AddDbContext` creates a scoped context for each web request. The Fluent API makes database rules explicit. `IsRowVersion()` adds optimistic concurrency protection, and `SaveChangesAsync` throws when another process has changed the same row.

For a supported production release, keep all EF Core packages on the same major and patch version. EF Core 8 and EF Core 10 are LTS releases; choose the version that matches the application's supported .NET runtime and database provider.

## 7. Common mistakes

- Treating the work as a NuGet package rename and expecting EF6 behavior to remain unchanged.
- Trying to replay or directly convert EF6 migration files in EF Core.
- Allowing a first EF Core migration to recreate, rename, or delete objects in an existing production database.
- Assuming every EF6 LINQ query generates equivalent SQL in EF Core without testing it.
- Keeping accidental lazy loading and creating N+1 query problems. EF Core lazy loading requires explicit proxy or `ILazyLoader` configuration; it is not automatically enabled.
- Missing cascade-delete, required/optional relationship, decimal precision, date/time, or value-generation differences.
- Using one `DbContext` concurrently across threads or keeping it alive for too long. `DbContext` is not thread-safe and should normally represent one unit of work.
- Forgetting concurrency tokens and transaction boundaries for financial updates.
- Testing only with EF Core's in-memory provider. It does not reproduce relational SQL, constraints, or transaction behavior.
- Switching schema-migration ownership before rollback and deployment procedures are agreed.

## 8. Follow-up interview questions

### Can EF6 and EF Core run in the same application?

Yes. They use different packages and namespaces, so they can run side by side during an incremental migration. Keep their contexts, registrations, and migration ownership clearly separated.

### Can EF6 migrations be converted directly to EF Core migrations?

No reliable automatic conversion exists. Keep the existing database and EF6 history as historical records, then create and verify an EF Core baseline for the current schema before using EF Core for future changes.

### Should we scaffold the database or manually port the model?

Scaffolding is useful for a database-first system and gives a quick starting point. Manual mapping gives more control over names, domain design, and behavior. In a critical system, a common approach is to scaffold for comparison and then maintain reviewed entity and Fluent API mappings.
