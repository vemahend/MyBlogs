# 14. What problems can a shared database create?

**Technology:** Strangler Fig and Migration Patterns

**Source question:** 14. What problems can a shared database create?

## 1. What is it?

A shared database means that two or more applications or services read from and write to the same database tables.

This can be useful as a temporary step during a Strangler Fig migration, but it creates tight coupling. One service can depend on another service's tables, columns, constraints, stored procedures, or transaction rules. The database then becomes a hidden integration layer between the services.

## 2. Why is it important?

A shared database can create several problems:

- **Schema coupling:** A column rename or table change for one service can break another service.
- **Unsafe data ownership:** It is unclear which service is allowed to change a record or enforce a business rule.
- **Bypassed business logic:** One service can update another service's tables without using its validation or authorization rules.
- **Release coupling:** Teams must coordinate database changes and deployments, so services cannot evolve independently.
- **Performance interference:** A slow query, lock, or large transaction from one application can affect every application using the database.
- **Security risk:** Applications often receive broader database permissions than they really need.
- **Harder migration:** Direct joins and stored procedures across domains make it difficult to separate a legacy system into independent services.
- **Unclear failure handling:** A partially completed cross-service update can leave data inconsistent.

Architects need to understand these risks because simply moving code into services does not create real service boundaries if all services still share and directly modify the same data.

## 3. How does it work?

The coupling usually grows in this way:

1. Two applications connect to the same database.
2. Each application starts querying tables owned by the other application because it is quick and convenient.
3. Business rules become spread across application code, triggers, and stored procedures.
4. A team changes a table for its own feature.
5. Another application fails, returns incorrect data, or suffers a performance problem because it depended on that table.

During a migration, a safer direction is:

1. Define which system owns each set of data.
2. Stop new direct writes to data owned by another system.
3. Route commands through the owning service's API.
4. Share required data through events, a read model, or a controlled integration view.
5. Move the owned tables to a separate schema or database when practical.
6. Remove old database access only after dependencies have been migrated and monitored.

A separate schema can help with ownership and permissions, but a separate database gives a stronger boundary. The right choice depends on migration risk and operational needs.

## 4. Practical example

Assume a bank is extracting a new Payments service from a legacy application. Both systems initially use the same database. The legacy application updates the `Payments` table directly when it cancels a payment.

The new service later adds a rule that settled payments cannot be cancelled. Requests through the Payments API follow this rule, but the legacy SQL update bypasses it. A settled payment is cancelled incorrectly, and the audit event that the new service normally publishes is also missing.

The team makes the Payments service the owner of payment data. The legacy application sends cancellation commands to the service instead of updating its tables. Payment status required for legacy reports is copied to a read-only reporting model through events. This keeps validation and audit behavior in one place while allowing the legacy system to be replaced gradually.

## 5. Scenario-based interview answer

**Problem:** "In one migration, the legacy banking application and a new Payments service shared a database. Both could update payment records. That caused unclear ownership, bypassed validation, and lock contention during batch processing."

**Decision:** "I treated the shared database as a temporary migration constraint, not the final architecture. We made the Payments service the single writer for payment data and documented the remaining legacy dependencies."

**Implementation:** "We replaced direct legacy writes with API commands, introduced optimistic concurrency for conflicting updates, and published payment events through an outbox. Consumers built their own read models from those events. We then restricted database permissions and removed cross-domain SQL one dependency at a time."

**Result:** "Payment rules and audit events became consistent, deployments needed less coordination, and reporting workloads no longer affected payment transactions. It also gave us a safe path to move the Payments data into its own database."

## 6. Code example

Instead of letting another application run an update against the Payments tables, expose the operation through the owning service:

```csharp
app.MapPost("/payments/{id:guid}/cancel", async (
    Guid id,
    PaymentsDbContext db,
    CancellationToken cancellationToken) =>
{
    var payment = await db.Payments.FindAsync([id], cancellationToken);

    if (payment is null)
        return Results.NotFound();

    if (payment.Status == PaymentStatus.Settled)
        return Results.Conflict(new { message = "A settled payment cannot be cancelled." });

    payment.Cancel();

    db.OutboxMessages.Add(OutboxMessage.Create(
        "PaymentCancelled",
        new { PaymentId = payment.Id }));

    await db.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
});
```

The endpoint keeps the cancellation rule inside the service that owns payment data. The payment change and outbox message are saved in the same local transaction. A background worker can publish the outbox message later, so other systems receive the change without writing directly to the Payments database.

The exact outbox implementation depends on the messaging and persistence libraries used; the important point is ownership and atomic local persistence, not the sample helper method.

## 7. Common mistakes

- Treating a shared database as the permanent design without defining an exit plan.
- Allowing every service to read and write every table.
- Assuming separate schemas alone provide full service independence.
- Changing a shared table without checking all queries, jobs, reports, and stored procedures that use it.
- Replacing direct SQL with many synchronous service calls and creating a fragile distributed chain.
- Using dual writes to update a database and publish an event separately, which can lose events or create inconsistent state.
- Moving tables too early without identifying hidden dependencies and reconciliation needs.
- Ignoring database locks, connection-pool usage, backups, security permissions, and noisy-neighbour performance issues.

## 8. Follow-up interview questions

### Is sharing a database always wrong?

No. It may be a reasonable temporary migration step or a practical choice for a modular monolith. The important points are clear ownership, restricted access, controlled schema changes, and a plan that matches the required level of independence.

### How can services share data without sharing tables?

Use the owning service's API for current commands or queries. Use integration events, replicated read models, or a reporting store when consumers need local or historical data.

### How would you remove a shared database safely?

Map all database dependencies, assign table ownership, stop cross-domain writes first, replace reads with APIs or read models, migrate and reconcile the data, restrict permissions, monitor the change, and then remove the old access path.
