# 16. How do you handle transactions across old and new components?

**Technology:** Strangler Fig and Migration Patterns

**Source question:** 16. How do you handle transactions across old and new components?

## 1. What is it?

Handling transactions across old and new components means keeping a business operation reliable when its steps run in both a legacy system and a newly extracted service.

A normal database transaction works well inside one component and one database. It does not safely cover separate databases, APIs, and message brokers. During a Strangler Fig migration, I therefore use a **local transaction in each component** and coordinate the overall business process with messages, a saga, idempotency, and compensation where needed.

The aim is usually **eventual consistency**, not one large ACID transaction across every system.

## 2. Why is it important?

A cross-system operation can fail halfway through. For example, the new payment service may reserve funds successfully, but the legacy ledger may be unavailable before it posts the entry. Without a clear design, the systems can disagree, requests can be processed twice, or money can appear to be lost.

A good transaction strategy provides:

- a known owner for the business workflow;
- reliable delivery of work between components;
- safe retries without duplicate business effects;
- a way to compensate for completed steps when a later step fails;
- visible states such as `Pending`, `Completed`, and `Failed`; and
- reconciliation for rare failures that automation cannot resolve.

This lets teams extract components gradually without depending on a fragile distributed transaction.

## 3. How does it work?

A practical flow is:

1. **Choose the process owner.** A new service or migration orchestrator owns the workflow state and correlation ID.
2. **Define the consistency need.** Keep rules that require immediate atomic consistency inside one boundary where possible. Do not split a critical invariant casually.
3. **Commit locally.** The owner saves its data, workflow state, and an outbox message in one database transaction.
4. **Publish reliably.** A background worker reads the outbox and sends the command or event. It retries until the broker accepts it.
5. **Call the legacy boundary.** An adapter translates the modern message into the legacy API, queue, or stored procedure. The legacy operation uses its own local transaction.
6. **Make processing idempotent.** The legacy component records the message or operation ID so a retry cannot post the same change twice.
7. **Continue the saga.** A success event moves the workflow to the next state. A permanent failure starts a compensating action, such as releasing reserved funds.
8. **Reconcile and monitor.** Alerts find stuck workflows, while scheduled checks compare important business totals between systems.

I avoid synchronous dual writes such as “save in the new database, then call the old database.” If the second action fails, the first cannot simply be rolled back. I also avoid two-phase commit in most migrations because many modern brokers, cloud services, and databases do not share the same transaction coordinator, and it adds availability and operational coupling.

## 4. Practical example

A bank moves payment initiation into a new Payment service while account posting remains in the legacy core banking system.

The Payment service creates a payment with status `PendingPosting` and writes a `PostPaymentToLegacy` outbox message in the same local transaction. A publisher sends the message to a queue. A legacy adapter posts the debit and credit through the core system's supported interface, passing the payment ID as an idempotency key.

If posting succeeds, the adapter publishes `LegacyPaymentPosted`, and the Payment service marks the payment `Completed`. A timeout is retried because the adapter can safely recognize an already-posted payment. If the legacy system rejects the payment permanently, the workflow marks it `Failed` and releases any reservation. Operations staff can see and reconcile payments that remain pending beyond an agreed time.

## 5. Scenario-based interview answer

**Problem:** "During a payment migration, the new service created the payment, but the legacy core still owned ledger posting. A direct API call between two database writes could leave us with a completed step on only one side."

**Decision:** "I did not try to create one distributed database transaction. We kept each system's update local and used an orchestrated saga with a transactional outbox. The payment ID was the correlation and idempotency key."

**Implementation:** "The new service saved the pending payment, saga state, and outbox command in one EF Core transaction. A worker delivered the command to a legacy adapter. The adapter recorded processed operation IDs and posted to the core in its own transaction. Success and failure events advanced the saga. We used bounded retries for transient faults, compensation for permanent failures, and alerts plus reconciliation for stuck cases."

**Result:** "A temporary outage no longer created silent data loss or duplicate ledger postings. The business could see the payment's current state, recover safely, and migrate the legacy boundary in smaller steps."

## 6. Code example

This simplified command handler saves the new payment and its outgoing command atomically:

```csharp
app.MapPost("/payments", async (
    CreatePayment request,
    PaymentsDbContext db,
    CancellationToken cancellationToken) =>
{
    var paymentId = Guid.NewGuid();
    var payment = Payment.CreatePending(
        paymentId,
        request.FromAccount,
        request.ToAccount,
        request.Amount);

    db.Payments.Add(payment);
    db.OutboxMessages.Add(OutboxMessage.Create(
        messageId: Guid.NewGuid(),
        type: "PostPaymentToLegacy",
        payload: new
        {
            PaymentId = paymentId,
            request.FromAccount,
            request.ToAccount,
            request.Amount
        }));

    await db.SaveChangesAsync(cancellationToken);

    return Results.Accepted($"/payments/{paymentId}", new
    {
        paymentId,
        status = "PendingPosting"
    });
});

public sealed record CreatePayment(
    string FromAccount,
    string ToAccount,
    decimal Amount);
```

EF Core wraps this single `SaveChangesAsync` call in a transaction when the provider supports transactions. Therefore, the payment and outbox record are both saved or neither is saved. A hosted background worker publishes the outbox message and marks it as dispatched.

The legacy consumer must also be idempotent: before posting, it checks whether `PaymentId` has already been processed, and it stores that ID in the same local transaction as the ledger update. The outbox publisher and consumer logic are application patterns, not built-in automatic EF Core features.

## 7. Common mistakes

- Performing an uncontrolled dual write to the new database and legacy API.
- Assuming an HTTP success response proves the full business process is complete.
- retrying a non-idempotent legacy operation and creating duplicate payments or postings.
- Publishing a message after committing data without using an outbox, so a crash can lose the message.
- Treating eventual consistency as an excuse to leave records pending with no timeout or support process.
- Compensating blindly when the outcome is unknown; first query by the operation ID because the original action may have succeeded.
- Trying to compensate an irreversible action without a business-approved reversal process.
- Using two-phase commit without confirming provider support, failure behaviour, and operational cost.
- Keeping immediate-consistency business rules split across old and new ownership boundaries.
- Missing correlation IDs, audit history, metrics, dead-letter handling, and reconciliation.

## 8. Follow-up interview questions

### When would you use a saga instead of a distributed transaction?

Use a saga when a business operation spans independently deployed components or databases. Each step commits locally, and later failures are handled through retries or business compensation. This is usually the practical choice for service and cloud migrations.

### What is the difference between an outbox and a saga?

An outbox reliably connects a local database commit to message publication. A saga coordinates several business steps and tracks their overall state. A saga commonly uses an outbox, but the patterns solve different problems.

### How do you handle an unknown result from the legacy system?

Do not immediately repeat a non-idempotent action or compensate it. Query the legacy system using the operation ID, retry safely if the operation is idempotent, and move unresolved cases to reconciliation or manual review.
