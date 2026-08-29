# 11. How do you handle duplicate API requests?

**Technology:** API Design and Integration Governance

**Source question:** 11. How do you handle duplicate API requests?

## 1. What is it?

A duplicate API request happens when the same business operation reaches an API more than once. This is common when a client retries after a timeout, a user clicks a button twice, or a message is delivered again.

I normally handle duplicates by making the operation **idempotent**. An idempotent operation can be repeated with the same input without producing an additional business effect. For example, retrying a payment request must not charge the customer twice.

For create or command APIs, the client usually sends an **idempotency key**: a unique value that identifies one intended operation. The server stores the key and the operation's result, then returns the same result when it receives the key again.

## 2. Why is it important?

Networks are unreliable. A server may complete a request, but its response can be lost. The client cannot tell whether the operation failed or only the response failed, so retrying is often the correct action.

Without duplicate protection, retries can cause:

- Double payments, transfers, orders, or account updates.
- Duplicate messages and downstream side effects.
- Incorrect balances and difficult reconciliation work.
- Loss of customer trust.

Senior developers should design APIs so retries are safe. Duplicate handling is a server-side responsibility; disabling a button in the UI helps the user experience but does not protect the system from network retries or concurrent callers.

## 3. How does it work?

A common flow is:

1. The client creates a unique idempotency key for one business operation and sends it in a header such as `Idempotency-Key`.
2. The API validates the key and calculates a hash of the relevant request data.
3. The API atomically reserves the key in a durable store. A unique database constraint prevents two concurrent requests from owning the same key.
4. The business operation runs once, ideally in the same database transaction as the idempotency record when both use the same database.
5. The API stores the final status and response against the key.
6. A retry with the same key and same request data receives the stored response.
7. Reusing the key with different request data is rejected, usually with `409 Conflict` or `422 Unprocessable Content` according to the API contract.

If the first request is still running, the API can return `409 Conflict`, `425 Too Early`, or a documented pending response. The exact status is less important than having a consistent contract.

Idempotency records need a retention period based on the retry window and business rules. For long-lived business operations, a permanent business identifier, such as a unique transfer reference, may be safer than a short-lived cache entry.

For distributed side effects, I also use patterns such as a transactional outbox and consumer inbox. The outbox prevents losing an event after the database commit, while each consumer records processed message IDs so repeated delivery does not repeat its work.

## 4. Practical example

Consider a banking API that transfers $100 between two accounts. The mobile app sends a request with key `transfer-7f91`. The bank commits the transfer, but the response is lost because the connection drops.

The app retries with the same key. The API finds the completed idempotency record, verifies that the request data matches, and returns the original transfer ID and result. It does not debit the source account again.

If the app accidentally sends a $200 transfer with the same key, the API rejects it because the stored request hash is different. This avoids silently treating two different operations as the same transfer.

## 5. Scenario-based interview answer

“In a payment system, we saw occasional duplicate charges when the client timed out and retried a request. The first request had often completed, but the client had not received the response.

I decided to make the payment command idempotent. The client generated one idempotency key per payment attempt, and the API stored that key with a hash of the request, its processing state, and the final response. A unique database constraint handled concurrent duplicates. The payment and idempotency state were committed atomically, and payment events were published through an outbox.

When the same request arrived again, we returned the original result. If the key was reused with different payment details, we returned a conflict. We also added a retention policy, metrics, and logs for duplicate and mismatched requests.

As a result, clients could retry safely, duplicate charges stopped, and support teams could trace every retry using the idempotency key.”

## 6. Code example

The following example uses ASP.NET Core on .NET 8 or later and Entity Framework Core. The database has a unique index on `IdempotencyKey`.

```csharp
public sealed record CreatePayment(decimal Amount, string Currency);
public sealed record PaymentResult(Guid PaymentId, string Status);

public sealed class Payment
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public required string Currency { get; set; }
}

public sealed class IdempotencyRecord
{
    public required string Key { get; set; }
    public required string RequestHash { get; set; }
    public required string ResponseJson { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class PaymentsDbContext(DbContextOptions<PaymentsDbContext> options)
    : DbContext(options)
{
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<IdempotencyRecord> IdempotencyRecords => Set<IdempotencyRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<IdempotencyRecord>()
            .HasIndex(x => x.Key)
            .IsUnique();
    }
}

app.MapPost("/payments", async (
    CreatePayment request,
    HttpRequest httpRequest,
    PaymentsDbContext db,
    CancellationToken cancellationToken) =>
{
    if (!httpRequest.Headers.TryGetValue("Idempotency-Key", out var values) ||
        string.IsNullOrWhiteSpace(values.ToString()))
    {
        return Results.BadRequest("Idempotency-Key is required.");
    }

    var key = values.ToString();
    var canonicalRequest = $"{request.Amount:F2}|{request.Currency.ToUpperInvariant()}";
    var requestHash = Convert.ToHexString(
        SHA256.HashData(Encoding.UTF8.GetBytes(canonicalRequest)));

    var existing = await db.IdempotencyRecords
        .AsNoTracking()
        .SingleOrDefaultAsync(x => x.Key == key, cancellationToken);

    if (existing is not null)
    {
        if (existing.RequestHash != requestHash)
            return Results.Conflict("The idempotency key was used for another request.");

        var previous = JsonSerializer.Deserialize<PaymentResult>(existing.ResponseJson)!;
        return Results.Ok(previous);
    }

    await using var transaction = await db.Database
        .BeginTransactionAsync(cancellationToken);

    var payment = new Payment
    {
        Id = Guid.NewGuid(),
        Amount = request.Amount,
        Currency = request.Currency.ToUpperInvariant()
    };

    var result = new PaymentResult(payment.Id, "Accepted");
    db.Payments.Add(payment);
    db.IdempotencyRecords.Add(new IdempotencyRecord
    {
        Key = key,
        RequestHash = requestHash,
        ResponseJson = JsonSerializer.Serialize(result),
        CreatedAt = DateTimeOffset.UtcNow
    });

    try
    {
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.Created($"/payments/{payment.Id}", result);
    }
    catch (DbUpdateException)
    {
        await transaction.RollbackAsync(cancellationToken);

        // Another request may have inserted the same unique key concurrently.
        var winner = await db.IdempotencyRecords.AsNoTracking()
            .SingleAsync(x => x.Key == key, cancellationToken);

        if (winner.RequestHash != requestHash)
            return Results.Conflict("The idempotency key was used for another request.");

        return Results.Ok(
            JsonSerializer.Deserialize<PaymentResult>(winner.ResponseJson)!);
    }
});
```

The unique index is essential because a read followed by an insert is not enough under concurrency. The request hash stops callers from reusing a key for different data. The transaction ensures that the payment and its saved response succeed or fail together.

In production, I would distinguish a unique-key violation from other database errors instead of catching every `DbUpdateException`. I would also validate the amount and currency, limit key length, scope the key to the authenticated client, store a processing state, and add cleanup and observability.

## 7. Common mistakes

- Relying only on UI button disabling or client-side retry control.
- Treating every `POST` request as safe to repeat without an idempotency design.
- Checking whether a key exists and then inserting without a unique constraint, which creates a race condition.
- Keeping keys only in local memory. This fails across restarts and multiple API instances.
- Reusing the same key for different request data without comparing a request hash.
- Expiring records before clients and intermediaries have stopped retrying.
- Marking a request as complete before its business transaction commits.
- Returning a different status or response for each retry without documenting that behavior.
- Making the database update idempotent but still sending duplicate emails, events, or downstream payment calls.
- Logging sensitive request or response data with the idempotency key.

## 8. Follow-up interview questions

### 1. Are all HTTP methods idempotent?

No. HTTP defines `GET`, `PUT`, and `DELETE` as idempotent in their intended semantics, although repeated responses can differ. `POST` is not idempotent by default, so create and command endpoints usually need an idempotency key or a unique business identifier.

### 2. Is a distributed lock enough to stop duplicates?

Usually not. A lock can reduce concurrent execution, but it can expire or be lost, and it does not provide a durable answer for later retries. A database uniqueness rule and stored result are stronger foundations. A lock can be an additional optimization.

### 3. How do you handle duplicates across microservices?

Use a unique operation or message ID throughout the flow. Publish events with a transactional outbox, and let each consumer keep an inbox or processed-message table with a unique constraint. Consumers should also make their business updates idempotent because most message brokers provide at-least-once delivery.
