# 13. Would the legacy and modern applications share the same database?

**Technology:** Strangler Fig and Migration Patterns

**Source question:** 13. Would the legacy and modern applications share the same database?

## 1. What is it?

The legacy and modern applications **may share a database temporarily**, but I would normally avoid making that the long-term design.

During a Strangler Fig migration, sharing can help the new application start delivering value before all data has been moved. However, the preferred end state is clear data ownership: each business capability owns its data, and other applications access that capability through an API or events rather than its tables.

Sharing a database does not have to mean sharing every table or allowing both applications to update the same records. A safer temporary arrangement is separate schemas, separate database users, and one clear writer for each piece of data.

## 2. Why is it important?

This decision affects how safely the two applications can change and how easily the legacy application can eventually be removed.

A shared database can make an early migration quicker because existing data, reports, and stored procedures remain available. It can also avoid a large data cutover on day one. However, permanent sharing creates strong coupling:

- A schema change for one application may break the other.
- Both applications may apply different business rules to the same record.
- Concurrent writes may overwrite data or produce invalid states.
- The modern application becomes tied to legacy table names and data formats.
- It becomes unclear which application owns and supports the data.

Architects therefore need to treat database sharing as a controlled migration stage with an exit plan, not as the target architecture.

## 3. How does it work?

I would use these rules while both applications coexist:

1. Map the tables, stored procedures, reports, jobs, and applications that read or write the data.
2. Assign one owner and one writer for each business entity or field. For example, the legacy application may own customer details while the modern service owns notification preferences.
3. Create separate database accounts with minimum permissions. Read-only access should also be enforced by the database, not only by application code.
4. Put temporary legacy-table access behind a repository or anti-corruption layer. Do not expose legacy database entities to the new domain model.
5. Use additive, backward-compatible schema changes while both versions run. Add and backfill a new column before removing or renaming the old one.
6. Move data to a schema or database owned by the modern application. Use events, an outbox, change data capture, or a controlled migration job where appropriate.
7. Reconcile important values, monitor synchronization delay, and make consumers idempotent.
8. Remove the modern application's access to legacy tables once the data and callers have moved.

If both applications must update related data, I would still avoid letting them update the same fields. Cross-application changes should go through the owning application's API or reliable events. Temporary dual writes need retries, idempotency, reconciliation, and a clear plan for partial failures.

## 4. Practical example

Suppose a bank is extracting customer notification preferences from a legacy payments application.

At first, the modern notification service may read customer IDs and contact details from the legacy database using a read-only account. It stores notification preferences in its own schema and is the only writer for those tables. The legacy application requests preference changes through the modern service's API instead of updating those tables directly.

Next, the customer capability publishes `CustomerContactChanged` events through an outbox. The notification service consumes the events and keeps the contact details it needs in its own database. After reconciliation proves the data is correct, its read access to the legacy customer tables is removed.

The applications briefly use the same database server, but they do not have uncontrolled shared ownership. This makes the final separation much safer.

## 5. Scenario-based interview answer

“I would not give a simple yes or no without understanding the migration stage. Sharing the same database can be acceptable for a short transition, but I would not choose it as the final architecture.

In one payment migration, the new service needed legacy customer data before the customer domain had been extracted. We decided to allow temporary read-only access through an anti-corruption layer. Each application had its own database account, and only the legacy application could update the customer tables. The new service owned its new tables from day one.

We then published customer changes through an outbox, built a local read model in the new service, and ran reconciliation checks on counts and key business fields. Once the results were stable, we removed the legacy-table access.

That decision let us migrate incrementally without creating two writers or permanently coupling the new service to the legacy schema. So my answer is: temporarily, if necessary and tightly controlled; permanently, preferably not.”

## 6. Code example

The following EF Core example keeps temporary legacy access behind a small read-only adapter:

```csharp
public sealed record CustomerContact(Guid CustomerId, string Email);

internal sealed class LegacyCustomerRow
{
    public Guid CustomerId { get; init; }
    public string EmailAddress { get; init; } = string.Empty;
}

internal sealed class LegacyReadDbContext(
    DbContextOptions<LegacyReadDbContext> options) : DbContext(options)
{
    internal DbSet<LegacyCustomerRow> Customers => Set<LegacyCustomerRow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<LegacyCustomerRow>(entity =>
        {
            entity.ToTable("Customer", "legacy");
            entity.HasKey(x => x.CustomerId);
            entity.Property(x => x.EmailAddress).HasColumnName("Email");
        });
    }
}

public interface ICustomerContactReader
{
    Task<CustomerContact?> FindAsync(Guid customerId, CancellationToken cancellationToken);
}

internal sealed class LegacyCustomerContactReader(LegacyReadDbContext db)
    : ICustomerContactReader
{
    public async Task<CustomerContact?> FindAsync(
        Guid customerId,
        CancellationToken cancellationToken)
    {
        return await db.Customers
            .AsNoTracking()
            .Where(x => x.CustomerId == customerId)
            .Select(x => new CustomerContact(x.CustomerId, x.EmailAddress))
            .SingleOrDefaultAsync(cancellationToken);
    }
}
```

`LegacyCustomerRow` remains inside the infrastructure boundary. The rest of the modern application receives `CustomerContact`, so the legacy schema does not spread into the new domain. `AsNoTracking()` expresses read-only intent and avoids change tracking, but it is not a security control; the connection's database user must have only `SELECT` permission.

## 7. Common mistakes

- Treating a temporary shared database as the finished architecture.
- Allowing both applications to update the same rows or fields without one clear owner.
- Giving both applications broad database permissions.
- Letting legacy EF entities or table structures become the modern domain model.
- Making breaking schema changes while the other application still uses the old structure.
- Assuming `AsNoTracking()` or repository conventions prevent writes; database permissions must enforce this.
- Using dual writes without handling partial failure, retries, duplicate messages, and reconciliation.
- Moving data without monitoring record counts, business totals, replication delay, and failed events.
- Forgetting an exit condition and a date for removing shared access.

## 8. Follow-up interview questions

### How would you stop both applications from writing the same data?

Assign one system as the owner, use separate database users with restricted permissions, and make the other system request changes through the owner's API or events.

### How would you move reads away from the legacy database?

Build a local read model in the modern application, populate it with an initial data load, and keep it current using an outbox, events, or change data capture. Reconcile it before switching reads.

### Is using different schemas in the same database enough?

It is a useful intermediate boundary, especially with separate users and permissions, but both applications still share infrastructure and deployment concerns. Separate databases provide stronger long-term ownership and isolation when that level of separation is needed.
