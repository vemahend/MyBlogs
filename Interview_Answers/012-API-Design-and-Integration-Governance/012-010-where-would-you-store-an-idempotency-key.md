# 10. Where would you store an idempotency key?

**Technology:** API Design and Integration Governance

**Source question:** 10. Where would you store an idempotency key?

## 1. What is it?

An idempotency key should normally be stored in a durable, server-side data store that all instances of the API can access. For a payment API, the safest choice is often the same relational database that stores the payment, with a unique constraint on the key.

The stored record usually contains:

- The idempotency key and the caller or tenant that owns it.
- A hash of the request, so the key cannot be reused with different input.
- The processing status, such as `InProgress`, `Completed`, or `Failed`.
- The original HTTP status code and response body.
- Creation and expiry times.

Redis can be useful for high throughput and short-lived keys, but it must be configured for the required durability. An in-memory dictionary on one API server is not suitable in a load-balanced production system.

## 2. Why is it important?

Clients retry requests when they see a timeout or lose a network connection. The first request may already have succeeded even though the client did not receive the response. Without a shared idempotency record, a retry could create a second payment, order, or transfer.

Durable shared storage lets every API instance recognize the retry and return the original result. Storing the record close to the business operation also helps keep the idempotency decision and the data change consistent.

## 3. How does it work?

1. The client generates a unique key and sends it in an `Idempotency-Key` header.
2. The API identifies the caller and calculates a hash of the relevant request data.
3. The API tries to insert an idempotency record. A unique database constraint on caller plus key allows only one request to win, even when requests arrive together.
4. The winning request performs the business operation and saves the final response.
5. A retry with the same key and request hash receives the saved response.
6. The same key with different request data is rejected, normally with `409 Conflict` or `422 Unprocessable Content`, according to the API contract.
7. Old records are removed only after a documented retention period that is longer than the expected retry window.

For a database-backed operation, I prefer to save the business change and completed idempotency record in the same database transaction. If the work crosses services, one local transaction cannot cover everything; I use an inbox or outbox pattern and make downstream consumers idempotent as well.

## 4. Practical example

A mobile banking app calls `POST /payments` with key `pay-7f31`. The payment service stores the key, customer ID, request hash, status, and response in SQL Server. It creates the payment and marks the record as completed in the same transaction.

The response is lost, so the app retries through another API instance. That instance finds the completed record and returns the original `201 Created` response with the same payment ID. It does not debit the account again.

## 5. Scenario-based interview answer

“In a payment system, clients retried timed-out POST requests and we had several API instances behind a load balancer. I would not store idempotency keys in process memory because a retry could reach a different instance.

I would store each key in the payment service's durable SQL database, scoped by client or tenant, with a unique index. The record would include a request hash, processing state, original status code, response, and expiry time. Where possible, I would commit the payment and the completed idempotency record in one transaction. Concurrent requests would be controlled by the unique constraint rather than by an unreliable check-then-insert in application code.

This means a retry returns the first result, while reuse of the key for different payment details is rejected. The result is consistent behavior across instances and protection against duplicate charges. I might add Redis as an optimization, but I would not make a disposable cache the only record for a financial operation.”

## 6. Code example

This simplified .NET 8 example uses EF Core and SQL Server. The production response would normally be stored as JSON rather than as a CLR object.

```csharp
public sealed class IdempotencyRecord
{
    public long Id { get; set; }
    public required string ClientId { get; set; }
    public required string Key { get; set; }
    public required string RequestHash { get; set; }
    public required string State { get; set; }
    public int? StatusCode { get; set; }
    public string? ResponseJson { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
}

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<IdempotencyRecord>()
        .HasIndex(x => new { x.ClientId, x.Key })
        .IsUnique();
}
```

The API then handles a request inside a transaction:

```csharp
await using var transaction = await db.Database.BeginTransactionAsync(ct);

var existing = await db.IdempotencyRecords.SingleOrDefaultAsync(
    x => x.ClientId == clientId && x.Key == key, ct);

if (existing is not null)
{
    if (existing.RequestHash != requestHash)
        return Results.Conflict(new { error = "Key was used for another request." });

    if (existing.State == "Completed")
        return Results.Content(existing.ResponseJson!, "application/json",
            statusCode: existing.StatusCode!.Value);

    return Results.Conflict(new { error = "Request is still being processed." });
}

var record = new IdempotencyRecord
{
    ClientId = clientId,
    Key = key,
    RequestHash = requestHash,
    State = "InProgress",
    ExpiresAt = DateTimeOffset.UtcNow.AddHours(24)
};
db.IdempotencyRecords.Add(record);

var payment = new Payment { Amount = request.Amount };
db.Payments.Add(payment);
await db.SaveChangesAsync(ct);

record.State = "Completed";
record.StatusCode = StatusCodes.Status201Created;
record.ResponseJson = JsonSerializer.Serialize(new { payment.Id });
await db.SaveChangesAsync(ct);
await transaction.CommitAsync(ct);

return Results.Content(record.ResponseJson, "application/json",
    statusCode: record.StatusCode.Value);
```

The unique index is essential because two requests can both see no existing row. Production code must catch the unique-constraint failure, reload the winning record, and either return its completed response or report that processing is still in progress. It should also define recovery for records left `InProgress` after a crash.

## 7. Common mistakes

- Storing keys only in local memory, so different API instances do not share them.
- Performing “check then insert” without a unique constraint, allowing concurrent duplicates.
- Storing only the key and not the request hash, which permits accidental reuse with different input.
- Deleting records too early or using an expiry shorter than the client's retry window.
- Using Redis as the only store without considering eviction, restart, persistence, and failover behavior.
- Saving the business operation and idempotency result separately, leaving inconsistent state after a crash.
- Returning a different response for a retry instead of preserving the original status and body.
- Using one global key namespace instead of scoping keys by client, tenant, or API operation.
- Assuming an idempotency key alone makes downstream messages and services idempotent.

## 8. Follow-up interview questions

### Should idempotency keys be stored in SQL Server or Redis?

Use SQL Server when strong durability and a transaction with the business data are important. Redis can suit short-lived, high-volume operations if its persistence, replication, eviction, and failure behavior meet the requirement. A hybrid approach can use SQL as the source of truth and Redis for faster lookup.

### How long should an idempotency key be retained?

It depends on the API contract and client retry behavior. Choose a documented period longer than the maximum expected retry window; payment records may need longer retention than ordinary commands.

### What happens if two requests with the same key arrive together?

A unique database constraint allows only one request to create the record. The other request should load that record and return the saved result when complete, or a clear “still processing” response with an appropriate retry policy.
