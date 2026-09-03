# Handling Concurrent Updates in ASP.NET Core and EF Core

## 1. What is a concurrent update?

A concurrent update happens when two or more requests read and attempt to change the same data at nearly the same time.

For example, an order currently has this state:

```text
Order ID: 101
Status: Pending
Version: 5
```

Two requests read version 5:

```text
Request A reads version 5 and changes Status to Approved.
Request B reads version 5 and changes Status to Cancelled.
```

Without concurrency protection, the last request to save may overwrite the first request. This is called a **lost update**.

```text
Initial state: Pending
Request A saves: Approved
Request B saves: Cancelled
Final state: Cancelled

Request A's update has been silently lost.
```

This is especially dangerous for balances, stock quantities, order states, expense approvals and payments.

## 2. Why an application-level `lock` is usually not enough

C# provides `lock`, `SemaphoreSlim` and other synchronization mechanisms. They can coordinate code running inside one application process, but modern systems often have multiple instances:

```text
Request A -> Application instance 1
Request B -> Application instance 2
                    |
                    v
              Same database
```

Each instance has its own memory and its own lock. Therefore, an in-memory lock in instance 1 cannot block work in instance 2.

Concurrency should normally be enforced by the database, because the database is the shared consistency boundary.

## 3. Main concurrency strategies

| Strategy | How it works | Suitable for |
|---|---|---|
| Optimistic concurrency | Allows concurrent reads but detects a conflict when saving | Most web and API updates |
| Pessimistic locking | Locks data before it is changed | Short, critical operations with frequent conflicts |
| Atomic database update | Performs the validation and update in one SQL statement | Balances, inventory and counters |
| Serializable transaction | Makes concurrent transactions behave as if executed sequentially | Complex critical invariants, used carefully |

## 4. Optimistic concurrency

Optimistic concurrency assumes conflicts are uncommon. Requests are allowed to read data normally, but the database verifies that the record has not changed before accepting an update.

The flow is:

```text
1. Request A reads Order 101 with version 5.
2. Request B reads Order 101 with version 5.
3. Request A updates WHERE version = 5 -> succeeds; version becomes 6.
4. Request B updates WHERE version = 5 -> affects zero rows.
5. EF Core throws DbUpdateConcurrencyException for Request B.
```

The important concept is that Request B is not allowed to silently overwrite Request A.

### SQL Server `rowversion`

With SQL Server, a `rowversion` column is commonly used as the concurrency token:

```csharp
public class Order
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal Amount { get; set; }

    [Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}
```

It can also be configured with the Fluent API:

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Order>()
        .Property(x => x.RowVersion)
        .IsRowVersion();
}
```

EF Core generates an update conceptually similar to:

```sql
UPDATE Orders
SET Status = @newStatus
WHERE Id = @id
  AND RowVersion = @originalRowVersion;
```

If another request has already changed the row version, the statement affects zero rows. EF Core interprets this as a concurrency conflict and throws `DbUpdateConcurrencyException`.

> `rowversion` is not a date or time. It is a database-generated binary value that changes when the row is updated.

## 5. The client must return the version it originally read

When the API returns an order, it should also return its version:

```json
{
  "id": "87bd5fab-e773-4d68-9534-518e2fde98d8",
  "status": "Pending",
  "rowVersion": "AAAAAAAAB9E="
}
```

The client keeps this version and returns it with the update request:

```csharp
public record UpdateOrderRequest(
    string Status,
    byte[] RowVersion);
```

This matters because the version represents the state on which the user's decision was based.

If the API loads the latest record and uses only its newly loaded version, it may fail to detect that the client was editing stale information.

## 6. EF Core implementation

```csharp
[HttpPut("orders/{orderId:guid}")]
public async Task<IActionResult> UpdateOrder(
    Guid orderId,
    UpdateOrderRequest request,
    CancellationToken cancellationToken)
{
    var order = await _dbContext.Orders
        .SingleOrDefaultAsync(x => x.Id == orderId, cancellationToken);

    if (order is null)
        return NotFound();

    order.Status = request.Status;

    _dbContext.Entry(order)
        .Property(x => x.RowVersion)
        .OriginalValue = request.RowVersion;

    try
    {
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            order.Id,
            order.Status,
            order.RowVersion
        });
    }
    catch (DbUpdateConcurrencyException ex)
    {
        _logger.LogWarning(
            ex,
            "Concurrency conflict while updating Order {OrderId}",
            orderId);

        return Conflict(new
        {
            message = "This order was changed by another request. Reload it and try again."
        });
    }
}
```

The normal API response for a detected state conflict is **409 Conflict**.

## 7. Ways to resolve an optimistic concurrency conflict

There is no single correct resolution for every business operation.

### Reject and ask the client to reload

This is the safest default for important business changes:

```text
409 Conflict
-> Client reloads the latest record
-> User reviews the changes
-> Client submits a new update with the latest version
```

Use this for order status, approvals, permissions and other decisions where silently replacing another user's update would be unsafe.

### Client wins

The client overwrites the latest database values. This may be acceptable for low-risk fields but can lose another user's changes. It should be an explicit business decision, not an accidental default.

### Database wins

Discard the client's update and return the newest database state.

### Merge

Combine changes when the two requests changed different fields. For example, one user changes a phone number while another changes an address. Automatic merging becomes risky when the fields influence one another.

### Reload and retry

An application can reload current database values, reapply the operation and retry. A retry limit is essential.

```csharp
const int maxAttempts = 3;

for (var attempt = 1; attempt <= maxAttempts; attempt++)
{
    try
    {
        await _dbContext.SaveChangesAsync(cancellationToken);
        break;
    }
    catch (DbUpdateConcurrencyException) when (attempt < maxAttempts)
    {
        foreach (var entry in _dbContext.ChangeTracker.Entries())
        {
            await entry.ReloadAsync(cancellationToken);
        }

        // Reapply the intended business operation to the current data here.
    }
}
```

Blind retries are dangerous. Reloading replaces the attempted changes, so the business operation must be recalculated against current values.

## 8. Pessimistic locking

Pessimistic locking assumes that conflicts are likely or too costly. The database locks the selected row while a transaction performs its work.

Conceptually:

```sql
BEGIN TRANSACTION;

SELECT *
FROM Orders WITH (UPDLOCK, ROWLOCK)
WHERE Id = @orderId;

UPDATE Orders
SET Status = @status
WHERE Id = @orderId;

COMMIT;
```

While Request A holds the lock, Request B may wait, time out or become involved in a deadlock.

### Advantages

- Prevents another transaction from modifying the locked data during the operation.
- Can simplify very short, highly contested critical sections.

### Risks

- Reduced throughput
- Increased waiting
- Lock timeouts
- Database deadlocks
- Larger impact if a transaction remains open too long

Never hold a database transaction open while calling a slow external payment gateway. Database locks should be held for the shortest possible period.

## 9. Atomic database updates

For values such as balance or stock quantity, reading first and updating later is unsafe:

```csharp
var account = await db.Accounts.FindAsync(accountId);

if (account.Balance >= amount)
    account.Balance -= amount;

await db.SaveChangesAsync();
```

Two requests can both read the same balance and both pass the check.

Instead, combine the condition and modification in one database statement:

```sql
UPDATE Accounts
SET Balance = Balance - @amount
WHERE Id = @accountId
  AND Balance >= @amount;
```

Then inspect the affected-row count:

```csharp
var affectedRows = await _dbContext.Accounts
    .Where(x => x.Id == accountId && x.Balance >= amount)
    .ExecuteUpdateAsync(
        updates => updates.SetProperty(
            x => x.Balance,
            x => x.Balance - amount),
        cancellationToken);

if (affectedRows == 0)
{
    return Conflict(new
    {
        message = "The account does not exist or has insufficient funds."
    });
}
```

The database evaluates the condition and applies the change atomically.

## 10. Transactions and isolation levels

A transaction groups multiple database operations into one unit:

```csharp
await using var transaction = await _dbContext.Database
    .BeginTransactionAsync(cancellationToken);

try
{
    // Perform related database operations.
    await _dbContext.SaveChangesAsync(cancellationToken);
    await transaction.CommitAsync(cancellationToken);
}
catch
{
    await transaction.RollbackAsync(CancellationToken.None);
    throw;
}
```

Isolation level controls how transactions interact. Stronger isolation offers more consistency but can cause more blocking and reduced throughput.

`Serializable` can prevent certain race conditions by making transactions behave as though they ran sequentially. It should be used only when the business invariant requires it and after considering its performance cost.

A transaction alone does not automatically solve every lost-update problem. The queries, isolation level and update conditions must enforce the required invariant.

## 11. Concurrency versus idempotency

These solve related but different problems.

| Protection | Problem solved |
|---|---|
| Concurrency control | Different requests attempt conflicting changes to the same state |
| Idempotency | The same business request is delivered more than once |

Example:

```text
Concurrency problem:
User A approves an expense while User B rejects it.

Idempotency problem:
The client times out and sends the same payment request again.
```

A payment system commonly needs both:

1. The client supplies an idempotency key.
2. The database has a unique constraint on that key.
3. The server atomically creates or claims the operation.
4. Repeated requests return the existing result rather than charging again.
5. Balance or state updates use concurrency-safe database operations.

A simple `if (!exists) insert` check is unsafe because two concurrent requests can both observe that the record does not exist. A unique database constraint makes the claim atomic.

## 12. Concurrent order-state transitions

Order updates should also validate the allowed state transition. A version check alone detects stale data, but domain rules decide whether the requested transition is legal.

```csharp
public void Approve()
{
    if (Status != OrderStatus.Pending)
        throw new InvalidOperationException(
            $"An order in {Status} state cannot be approved.");

    Status = OrderStatus.Approved;
}
```

You can also enforce the state in an atomic update:

```sql
UPDATE Orders
SET Status = 'Approved'
WHERE Id = @orderId
  AND Status = 'Pending';
```

If zero rows are affected, the order either does not exist or is no longer pending. The API should load enough information to return the correct business response.

## 13. Cancellation considerations

Pass `CancellationToken` to database operations so unnecessary work can stop when the HTTP request is abandoned:

```csharp
await _dbContext.SaveChangesAsync(cancellationToken);
```

However, cancellation is not a rollback guarantee. The database might commit just before cancellation is observed. After a potentially committed financial operation, do not assume that an `OperationCanceledException` means nothing happened. Use an operation ID or idempotency key to determine the final state safely.

Rollback and cleanup sometimes use `CancellationToken.None`, because the original token is already cancelled and cleanup still needs an opportunity to finish.

## 14. Testing concurrent behaviour

Normal unit tests often miss concurrency issues. Add integration tests that use the real database provider and two separate `DbContext` instances.

Example test scenario:

```text
1. Context A loads Order 101, version 5.
2. Context B loads Order 101, version 5.
3. Context A changes and saves the order.
4. Context B changes and saves the stale order.
5. Verify that Context B throws DbUpdateConcurrencyException.
6. Verify that Context A's change remains in the database.
```

Also test:

- Two simultaneous requests using the same idempotency key
- Two different requests attempting conflicting state transitions
- Insufficient balance under concurrent withdrawals
- Retry limits and conflict responses
- Cancellation occurring before, during and after a commit
- Multiple application instances, not only multiple threads

Do not rely only on EF Core's in-memory provider for these tests; it does not reproduce all relational database concurrency behaviour.

## 15. Common mistakes

- Using an in-memory `lock` as the only protection in a multi-instance system
- Assuming `DbContext` is thread-safe
- Running parallel operations on the same `DbContext`
- Loading the newest version instead of using the version supplied by the client
- Catching `DbUpdateConcurrencyException` and silently ignoring it
- Retrying financial operations without idempotency
- Holding database locks while waiting for an external API
- Assuming request cancellation proves that the database did not commit
- Using a check-then-update sequence without a transaction or atomic condition

## 16. Choosing an approach

| Scenario | Recommended starting point |
|---|---|
| User edits an order or profile | Optimistic concurrency and `409 Conflict` |
| Expense approval versus rejection | Version check plus valid state-transition rules |
| Deducting account balance | Atomic conditional update, transaction and idempotency |
| Reducing inventory | Atomic conditional update or carefully designed optimistic concurrency |
| Frequently contested, very short database operation | Consider pessimistic locking |
| Duplicate payment submission | Idempotency key with a database unique constraint |
| Multiple independent database changes | Transaction with suitable isolation and concurrency rules |

## 17. Interview-ready answer

> I would normally handle concurrent updates with optimistic concurrency. I would add a database-managed row-version column and return that version to the client. When the client updates the resource, it sends the version it originally read. EF Core includes that original version in the update condition. If another request has already changed the record, no row is updated and EF Core throws `DbUpdateConcurrencyException`. I would usually return `409 Conflict` and ask the client to reload, although merging or retrying depends on the business operation. For balances and inventory, I prefer an atomic conditional database update. For highly contested, short critical operations, pessimistic locking may be appropriate, but locks and transactions must remain short. In payment systems, I also use an idempotency key, because optimistic concurrency prevents lost updates while idempotency prevents duplicate execution.

## 18. Easy way to remember it

```text
Version check   -> Has somebody changed this data?
Atomic update   -> Is the condition still true while I change it?
Database lock   -> Can I temporarily stop others changing it?
Idempotency key -> Have I already processed this business request?
```
