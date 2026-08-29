# 15. How would you separate data ownership incrementally?

**Technology:** Strangler Fig and Migration Patterns

**Source question:** 15. How would you separate data ownership incrementally?

## 1. What is it?

Separating data ownership incrementally means moving responsibility for data from a legacy system to a new service in small, controlled steps.

For each business area, one system becomes the **single owner**. That owner controls writes, validation, and schema changes. Other systems use its API or consume published events instead of changing its tables directly.

Ownership does not always require moving the tables immediately. A useful first step is to establish one logical owner and one writer while the data is still in the shared database. Physical separation into another schema or database can happen later.

## 2. Why is it important?

Moving all data at once is risky. Legacy tables often have hidden users such as reports, batch jobs, stored procedures, and external integrations. A big-bang move can break these dependencies and make rollback difficult.

Incremental separation helps teams:

- reduce migration risk by changing one business capability at a time;
- keep business rules in one place;
- prevent the legacy and new systems from overwriting each other's changes;
- test, reconcile, and monitor data before removing the old path;
- deploy services more independently;
- apply narrower database permissions; and
- create a clear route from a shared database to service-owned storage.

This matters in real systems because code is not truly separated if several applications can still update the same records directly.

## 3. How does it work?

A practical migration flow is:

1. **Map the data and dependencies.** Find every application, report, job, trigger, stored procedure, and integration that reads or writes the selected data.
2. **Choose a business boundary.** Migrate a coherent capability, such as payment instructions, rather than moving unrelated tables one by one.
3. **Declare an owner.** Document which service controls commands, validation, schema changes, and data quality.
4. **Create a service interface.** Add APIs or commands so callers no longer need direct table writes.
5. **Move to a single writer.** Route all new writes through the owner. Remove write permissions from other applications after verifying the new path.
6. **Replace external reads.** Use the owner's API for fresh data, or publish events to build local read models for reporting and high-volume queries.
7. **Backfill and reconcile.** Copy historical data when needed, compare counts and business totals, and investigate differences.
8. **Physically separate the data.** Move the owned tables to a dedicated schema or database once old dependencies have been removed.
9. **Observe and retire.** Monitor errors, event lag, reconciliation results, and business metrics before deleting legacy code and access.

During a transition, change data capture can help feed a new read model from legacy changes. The transactional outbox pattern is usually safer once the new service owns writes because the data change and event record can be committed together. Neither technique should leave two systems as permanent, independent writers.

## 4. Practical example

A bank wants to extract beneficiary management from a legacy online-banking application.

First, the team identifies that the web application, a fraud job, and two reports use the `Beneficiaries` tables. The new Beneficiary service is declared the owner, but the tables remain in the shared database initially.

The team routes add, change, and delete operations through the new service. The legacy application becomes read-only for those tables. The service validates account details, writes an audit record, and stores an outbox event in one transaction.

Consumers use `BeneficiaryChanged` events to maintain their own read models. After historical records are copied and reconciled, the tables move to the service's database. Database permissions then prevent the legacy application from accessing them, and the old stored procedures are removed.

## 5. Scenario-based interview answer

**Problem:** "In a banking migration, both the legacy application and a new Beneficiary service could update beneficiary records. That created conflicting changes, duplicated validation, and uncertainty about which system held the correct value."

**Decision:** "I separated ownership by business capability and made the new service the single writer before trying to move the physical tables. This reduced risk because existing reads could be migrated gradually."

**Implementation:** "We mapped all SQL dependencies, exposed commands through the Beneficiary API, and routed legacy writes to it. The service saved domain changes and outbox events in one local transaction. Reports received a read-only projection from those events. We backfilled historical data, ran reconciliation on counts and business fields, removed direct write permissions, and finally moved the tables to a dedicated database. Each stage had monitoring and a rollback plan."

**Result:** "We gained clear ownership without a big-bang cutover. Validation and auditing became consistent, consumers were less coupled to the schema, and the team could deploy and evolve the Beneficiary service independently."

## 6. Code example

The owning service can accept a command and save both the business change and an outbox event in one transaction:

```csharp
app.MapPost("/beneficiaries", async (
    CreateBeneficiary request,
    BeneficiaryDbContext db,
    CancellationToken cancellationToken) =>
{
    var beneficiary = Beneficiary.Create(
        request.CustomerId,
        request.AccountNumber,
        request.Name);

    db.Beneficiaries.Add(beneficiary);
    db.OutboxMessages.Add(OutboxMessage.Create(
        "BeneficiaryCreated",
        new
        {
            beneficiary.Id,
            beneficiary.CustomerId,
            beneficiary.Name
        }));

    await db.SaveChangesAsync(cancellationToken);

    return Results.Created($"/beneficiaries/{beneficiary.Id}",
        new { beneficiary.Id });
});

public sealed record CreateBeneficiary(
    Guid CustomerId,
    string AccountNumber,
    string Name);
```

The legacy application calls this endpoint instead of inserting into the table. `SaveChangesAsync` commits the beneficiary and outbox record through the same EF Core transaction. A background publisher later sends the event, and consumers update their own read models.

In production, the endpoint should also include authentication, authorization, input validation, idempotency, and concurrency handling. The `OutboxMessage.Create` method represents application-specific outbox code rather than a built-in .NET API.

## 7. Common mistakes

- Moving tables before discovering reports, jobs, stored procedures, and integrations that depend on them.
- Allowing the legacy and new systems to remain active writers for too long.
- Using timestamp-based conflict resolution instead of defining a clear owner.
- Treating a separate schema as sufficient while other applications still have unrestricted access.
- Publishing an event separately from the database commit, which can lose an event after a partial failure.
- Exposing the new database schema as the service contract.
- Replacing every read with a synchronous API call and creating latency or availability problems.
- Copying data without validating record counts, totals, missing records, duplicates, and event lag.
- Removing the old path without monitoring, rollback steps, or an agreed cutover point.
- Migrating technical tables instead of a complete business capability.

## 8. Follow-up interview questions

### Which should move first: data ownership or the physical database?

Usually establish logical ownership and a single writer first. Move the physical data after callers no longer depend on direct database access. This makes the cutover smaller and safer.

### How do you keep data consistent during the transition?

Use one authoritative writer, transactional outbox events, idempotent consumers, and regular reconciliation. Avoid uncontrolled dual writes because one write can succeed while the other fails.

### How should another service read data owned by this service?

Use an API when it needs current data and can accept runtime coupling. Use events and a local read model for high-volume queries, reporting, or better resilience. The consumer should not query the owner's tables directly.
