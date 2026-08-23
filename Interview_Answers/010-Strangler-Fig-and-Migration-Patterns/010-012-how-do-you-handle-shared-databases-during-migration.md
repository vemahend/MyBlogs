# 12. How do you handle shared databases during migration?

**Technology:** Strangler Fig and Migration Patterns

**Source question:** 12. How do you handle shared databases during migration?

## 1. What is it?

A shared database exists when the legacy application and one or more new services read or write the same database during a migration.

This may be necessary for a short transition period, but it should not be the final design. The long-term goal is clear data ownership: one service owns its tables and other services use its API or events instead of accessing those tables directly.

## 2. Why is it important?

A database is often the hardest part of a Strangler Fig migration. Application code can be routed gradually, but years of business rules, reports, stored procedures, and integrations may depend on the same tables.

Uncontrolled sharing creates several risks:

- A schema change made by one application can break another.
- Two applications may apply different validation rules to the same data.
- Concurrent writes can cause lost updates or inconsistent records.
- Direct table access keeps the new service coupled to the legacy schema.
- It becomes unclear which application owns a piece of data.

A controlled database migration lets the team release in small steps, keep the system available, reconcile data, and roll back traffic without losing transactions.

## 3. How does it work?

I normally handle the migration in stages:

1. **Map ownership and dependencies.** Identify which application writes each table, which components only read it, and which jobs, reports, or stored procedures depend on it.
2. **Choose one writer.** For each business entity, make either the legacy application or the new service the system of record. Avoid having both write the same fields.
3. **Protect the boundary.** Give each application a separate database account and the minimum permissions it needs. Put any temporary legacy access behind a repository or anti-corruption layer so it does not spread through the new code.
4. **Move reads first when practical.** Copy data to a new schema or database using an outbox, change data capture (CDC), or a migration job. Initially, the new copy can be a read-only projection.
5. **Validate continuously.** Compare record counts, key balances, timestamps, and business totals. Monitor replication delay and rejected events.
6. **Move writes by business capability.** Route writes for one capability to the new service. The owning service publishes events so the legacy application can receive the data it still needs.
7. **Remove old access.** After a stable period, stop synchronization, remove legacy permissions, and delete temporary compatibility code.

If a shared database cannot be avoided temporarily, I use additive schema changes. For example, I add a nullable column first, deploy code that understands both formats, backfill the data, switch all readers, and only then remove the old column. This is the expand-and-contract pattern.

## 4. Practical example

Suppose a bank is extracting the customer-notification capability from a legacy payments application. The legacy application owns the `Payments` table, and the new notification service needs payment status changes.

I would not let the notification service query `Payments` forever. The legacy payment transaction would also insert a `PaymentStatusChanged` message into an outbox table in the same database transaction. A background publisher would send that message to a broker. The notification service would consume it and maintain its own small read model.

During the transition, the team would compare payment status counts and event IDs between the two systems. Once the new service had processed events reliably and caught up, notification traffic would move to it. The service would then need no permission on the legacy `Payments` table.

## 5. Scenario-based interview answer

“In one migration, both a legacy payment application and a new payment-history service needed the same transaction data.

**Problem:** Allowing both applications to update the shared tables would have created unclear ownership and made rollback unsafe.

**Decision:** We kept the legacy application as the only writer while the new service built its own data store. We treated shared-table access as a temporary migration state, not as the target architecture.

**Implementation:** We documented table ownership, used separate database users, and gave the new service read-only access during its initial validation. We added an outbox record in the same transaction as each payment change. An idempotent consumer populated the new store, and a reconciliation job compared transaction counts and financial totals. We used expand-and-contract for schema changes. After the new store was stable, we routed payment-history reads to the new service. Later, write ownership moved capability by capability, and we removed the temporary database permissions.

**Result:** We migrated without downtime, avoided dual-write data loss, and ended with a clear service-owned database rather than a permanently shared schema.”

## 6. Code example

The following EF Core example saves a payment change and an outbox message in one database transaction:

```csharp
public async Task MarkPaymentSettledAsync(
    Guid paymentId,
    CancellationToken cancellationToken)
{
    await using var transaction =
        await db.Database.BeginTransactionAsync(cancellationToken);

    var payment = await db.Payments.SingleAsync(
        p => p.Id == paymentId,
        cancellationToken);

    payment.MarkSettled();

    var message = new PaymentStatusChanged(
        payment.Id,
        payment.Status,
        DateTimeOffset.UtcNow);

    db.OutboxMessages.Add(new OutboxMessage
    {
        Id = Guid.NewGuid(),
        Type = nameof(PaymentStatusChanged),
        Payload = JsonSerializer.Serialize(message),
        OccurredAtUtc = DateTimeOffset.UtcNow
    });

    await db.SaveChangesAsync(cancellationToken);
    await transaction.CommitAsync(cancellationToken);
}
```

The payment update and outbox insert either both commit or both roll back. A separate background worker publishes pending outbox messages and marks them as processed. The consumer must store the message ID and ignore duplicates because message delivery can happen more than once.

This avoids an unsafe dual write such as saving to the database and then directly publishing an event. In that design, the process could fail between the two operations and leave the systems inconsistent.

## 7. Common mistakes

- Treating a shared database as the permanent architecture instead of a temporary migration step.
- Allowing the legacy application and the new service to write the same columns.
- Publishing an event separately from the database transaction without an outbox or another reliable consistency mechanism.
- Giving the new service broad database permissions instead of least-privilege access.
- Letting new domain code depend directly on legacy table names and stored procedures.
- Making destructive schema changes before every consumer has moved to the new format.
- Migrating data without reconciliation, audit totals, replication-lag monitoring, or a rollback plan.
- Assuming distributed transactions will solve ownership and coupling problems.
- Removing the old path before background jobs, reports, and integrations have also been migrated.

## 8. Follow-up interview questions

**1. Is dual writing to the old and new databases acceptable?**  
Usually no. One write can succeed while the other fails. Prefer one system of record plus an outbox, CDC, or an idempotent synchronization process. If temporary dual writing is unavoidable, add retries, idempotency, reconciliation, and a clear end date.

**2. When would you choose CDC instead of an outbox?**  
CDC is useful when the legacy application cannot be changed because it reads committed database changes from the transaction log. An outbox is better when the application can publish meaningful business events and you want explicit event contracts.

**3. How do you know it is safe to cut over?**  
Run both paths long enough to compare results, verify business totals, measure synchronization lag, test rollback, and confirm that all consumers are compatible. Cut over gradually and monitor errors, missing events, duplicates, and key business metrics.
