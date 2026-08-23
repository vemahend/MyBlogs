# 18. Should the domain layer reference Entity Framework?

**Technology:** Architecture and Design

**Source question:** 18. Should the domain layer reference Entity Framework?

## 1. What is it?

In a clean or layered architecture, the domain layer should normally **not reference Entity Framework Core**.

The domain layer contains the business model and business rules: entities, value objects, domain services, and domain events. Entity Framework Core is a persistence framework, so it belongs in the infrastructure layer.

This is a design guideline, not an absolute rule. A small CRUD application may accept a direct dependency for simplicity. For a complex business system, keeping the domain independent is usually the better choice.

## 2. Why is it important?

Keeping Entity Framework Core outside the domain layer provides several benefits:

- Business rules do not depend on a database framework.
- Domain code can be tested without creating a `DbContext` or database.
- Persistence details can change without rewriting core business logic.
- The model stays focused on business language instead of tables, tracking, and queries.
- Dependency direction remains clear: infrastructure depends on the domain, not the other way around.

This matters most in long-lived systems where business rules change independently from database technology.

## 3. How does it work?

A common dependency flow is:

1. The domain project defines entities and business behaviour using plain C#.
2. The application layer coordinates use cases and depends on domain abstractions.
3. The infrastructure project references the domain and Entity Framework Core.
4. The infrastructure project contains the `DbContext`, entity configurations, migrations, and repository implementations.
5. Dependency injection connects the application abstractions to the EF Core implementations at runtime.

EF Core can map domain classes without the domain referencing EF Core. Fluent configuration through `IEntityTypeConfiguration<T>` keeps table names, keys, column types, relationships, and indexes in infrastructure.

The domain may define a repository interface when that interface represents a domain need, although some teams place repository interfaces in the application layer. Either approach can work if EF-specific types such as `DbSet`, `DbContext`, `IQueryable`, and `EntityTypeBuilder` do not leak into the domain model.

## 4. Practical example

Consider a payment system. A `Payment` entity enforces rules such as:

- A completed payment cannot be completed again.
- A rejected payment cannot be captured.
- The captured amount must be positive.

These rules belong in the domain and should work even when no database is available. The infrastructure layer maps `Payment` to a SQL table and saves it with EF Core.

If the team later changes the database schema, adds an outbox table, or changes how payments are loaded, the payment rules remain unchanged.

## 5. Scenario-based interview answer

**Problem:** In a banking platform, our domain project referenced EF Core directly. Entities contained persistence attributes, services accepted `DbContext`, and unit tests required EF setup. Database concerns were spreading into business logic.

**Decision:** I removed the EF Core dependency from the domain because the transaction rules were important and needed to remain independent of persistence. I kept the entities as plain C# classes and moved all mappings to infrastructure.

**Implementation:** The application layer used a repository abstraction for the required use cases. Infrastructure implemented it with EF Core, placed `DbContext`, fluent configurations, and migrations in the same project, and registered the implementation through dependency injection. We returned domain objects rather than exposing `DbSet` or `IQueryable` across the boundary.

**Result:** Domain tests became fast and simple, persistence changes were isolated, and the business model was easier to understand. I would still consider a simpler structure for a small CRUD service, because architecture should match the system's complexity.

## 6. Code example

The domain project contains only business behaviour:

```csharp
// Domain project - no EF Core reference
public sealed class Payment
{
    public Guid Id { get; private set; }
    public decimal Amount { get; private set; }
    public PaymentStatus Status { get; private set; }

    private Payment() { } // Allows materialization without exposing invalid creation

    public Payment(Guid id, decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(amount));

        Id = id;
        Amount = amount;
        Status = PaymentStatus.Pending;
    }

    public void Complete()
    {
        if (Status != PaymentStatus.Pending)
            throw new InvalidOperationException("Only a pending payment can be completed.");

        Status = PaymentStatus.Completed;
    }
}

public enum PaymentStatus
{
    Pending,
    Completed,
    Rejected
}
```

The infrastructure project owns the EF Core mapping:

```csharp
// Infrastructure project - references Domain and EF Core
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

internal sealed class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments");
        builder.HasKey(payment => payment.Id);
        builder.Property(payment => payment.Amount)
            .HasPrecision(18, 2);
        builder.Property(payment => payment.Status)
            .HasConversion<string>()
            .HasMaxLength(20);
    }
}

public sealed class PaymentsDbContext(DbContextOptions<PaymentsDbContext> options)
    : DbContext(options)
{
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PaymentsDbContext).Assembly);
    }
}
```

The private parameterless constructor supports EF Core materialization while preventing normal application code from creating an empty payment. Fluent configuration keeps EF Core types and database mapping out of the domain project. This approach works with current supported EF Core versions, including EF Core 8, 9, and 10.

## 7. Common mistakes

- Injecting `DbContext` into domain entities or domain services.
- Returning `DbSet<T>` or `IQueryable<T>` from a domain repository, which leaks EF Core and query behaviour across the boundary.
- Putting migrations and EF Core configurations in the domain project.
- Adding persistence attributes everywhere even when fluent configuration would keep the domain cleaner.
- Creating a generic repository that only copies every `DbSet` method and adds no business meaning.
- Making every property publicly settable only to satisfy the ORM, which allows invalid domain state.
- Hiding EF Core completely at the cost of poor performance, such as loading a large object graph for a simple read. Read-only queries can use projections in the application or infrastructure layer.
- Applying strict domain isolation to a basic CRUD application where the extra abstractions add cost without useful business protection.

## 8. Follow-up interview questions

### Can EF Core map entities that have private setters?

Yes. EF Core can map properties with private setters and can use fields or suitable constructors. Fluent configuration can handle mappings without adding EF Core references to the domain.

### Where should repository interfaces be placed?

Place them in the domain when they express a domain-level collection or business need. Place them in the application layer when they exist mainly to support application use cases. Their implementations belong in infrastructure.

### Is using EF Core directly in the application layer always wrong?

No. For a small CRUD service, direct `DbContext` use can be a reasonable and simpler choice. For a complex domain, separating persistence usually improves testability, clarity, and long-term maintainability.
