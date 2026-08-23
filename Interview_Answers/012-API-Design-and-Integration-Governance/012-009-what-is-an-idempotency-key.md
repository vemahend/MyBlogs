# 9. What is an idempotency key?

**Technology:** API Design and Integration Governance

**Source question:** 9. What is an idempotency key?

## 1. What is it?

An idempotency key is a unique value that a client sends with a request, usually in an HTTP header such as `Idempotency-Key`.

The server uses the key to recognize repeated attempts of the same operation. If the client sends the same request again with the same key, the server returns the result of the first attempt instead of performing the operation again.

It is commonly used with `POST` requests because `POST` is not idempotent by default.

## 2. Why is it important?

In distributed systems, a client may not receive a response even though the server completed the operation. This can happen because of a timeout, lost network connection, or application restart. The client then retries, which could create a duplicate payment, order, or bank transfer.

An idempotency key makes retries safe. It is important because retry policies are common in mobile applications, payment systems, message processing, and service-to-service communication.

## 3. How does it work?

A typical flow is:

1. The client generates a unique key, such as a GUID, for one logical operation.
2. The client sends the request with that key, for example `Idempotency-Key: 8d62...`.
3. The server looks up the key in durable storage.
4. If the key is new, the server processes the operation and stores the key, a request fingerprint, the status, and the response.
5. If the same key is received again with the same request data, the server returns the stored response without repeating the operation.
6. If the key is reused with different request data, the server rejects it, commonly with `409 Conflict` or `422 Unprocessable Content` according to the API contract.

The key check, business operation, and saved result should be coordinated atomically where possible. A unique database constraint on the key protects against two identical requests arriving at the same time. Keys should also have a documented retention period.

## 4. Practical example

A banking app sends a request to transfer $500. The bank completes the transfer, but the response is lost because the connection drops. The app retries with the same idempotency key.

The API finds that the key has already completed successfully and returns the original transfer response. It does not debit the account a second time. A genuinely new transfer must use a new key.

## 5. Scenario-based interview answer

**Problem:** In a payment API, customers were occasionally charged twice when a client retried a timed-out `POST /payments` request.

**Decision:** I introduced an idempotency key for payment creation. Each key represented one payment attempt, and I scoped it to the authenticated merchant so different merchants could safely use the same value.

**Implementation:** The API stored the merchant ID, key, hash of the important request fields, processing state, HTTP status, and serialized response. A unique constraint on merchant ID plus key handled concurrent requests. A repeated key with the same payload returned the original response; the same key with a different payload was rejected. We also documented the retention time and what clients should do while the first request was still processing.

**Result:** Clients could safely retry after timeouts, duplicate charges stopped, and support teams could trace each payment attempt by its key.

In an interview, I would summarize it as: “An idempotency key gives the server a stable identity for one client operation. It does not make every `POST` automatically safe; the server must persist the outcome, validate key reuse, and handle concurrent requests correctly.”

## 6. Code example

The following simplified ASP.NET Core example uses an EF Core table with a unique index. The same approach works with supported ASP.NET Core versions such as .NET 8 and .NET 10.

```csharp
public sealed record CreatePayment(decimal Amount, string Currency);

public sealed class IdempotentResponse
{
    public int Id { get; set; }
    public required string ClientId { get; set; }
    public required string Key { get; set; }
    public required string RequestHash { get; set; }
    public int StatusCode { get; set; }
    public required string ResponseJson { get; set; }
}

// In OnModelCreating:
// modelBuilder.Entity<IdempotentResponse>()
//     .HasIndex(x => new { x.ClientId, x.Key }).IsUnique();

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

    string key = values.ToString();
    string clientId = "authenticated-client-id"; // Normally read from a claim.
    string requestJson = JsonSerializer.Serialize(request);
    string requestHash = Convert.ToHexString(
        SHA256.HashData(Encoding.UTF8.GetBytes(requestJson)));

    var saved = await db.IdempotentResponses.SingleOrDefaultAsync(
        x => x.ClientId == clientId && x.Key == key,
        cancellationToken);

    if (saved is not null)
    {
        return saved.RequestHash == requestHash
            ? Results.Content(saved.ResponseJson, "application/json",
                statusCode: saved.StatusCode)
            : Results.Conflict(new { error = "Key was used with different data." });
    }

    await using var transaction = await db.Database.BeginTransactionAsync(
        cancellationToken);

    var payment = new Payment
    {
        Id = Guid.NewGuid(),
        Amount = request.Amount,
        Currency = request.Currency
    };

    db.Payments.Add(payment);
    string responseJson = JsonSerializer.Serialize(payment);
    db.IdempotentResponses.Add(new IdempotentResponse
    {
        ClientId = clientId,
        Key = key,
        RequestHash = requestHash,
        StatusCode = StatusCodes.Status201Created,
        ResponseJson = responseJson
    });

    await db.SaveChangesAsync(cancellationToken);
    await transaction.CommitAsync(cancellationToken);

    return Results.Content(responseJson, "application/json",
        statusCode: StatusCodes.Status201Created);
});
```

The request hash prevents accidental reuse of a key for different payment data. The database transaction saves the payment and idempotency result together. The unique index is essential for concurrency; production code must also catch a unique-constraint race, reload the winning record, and return its result. For long-running external payment calls, use a processing state and a durable workflow rather than keeping a database transaction open across the network call.

## 7. Common mistakes

- Keeping keys only in application memory. The protection is lost after a restart and does not work across multiple API instances.
- Checking for a key and then inserting without a unique constraint. Concurrent requests can both pass the check and create duplicates.
- Reusing one key for different request bodies without validating a request hash.
- Trusting a client-supplied key globally instead of scoping it to the authenticated customer, merchant, or operation.
- Deleting records too quickly or having no documented expiration policy.
- Returning a different result for a retry instead of preserving the original status and response.
- Assuming the key alone gives exactly-once processing. External side effects and failures still need transactions, state management, or reconciliation.

## 8. Follow-up interview questions

**1. Who should generate the idempotency key?**  
Usually the client generates a high-entropy unique value, such as a UUID, once per logical operation and reuses it only for retries of that operation.

**2. How long should the server store an idempotency key?**  
It depends on the business retry window. The API should publish a clear retention period; high-risk payment operations may require longer retention than ordinary requests.

**3. Is an idempotency key the same as a correlation ID?**  
No. An idempotency key prevents a logical operation from being repeated. A correlation ID links logs and calls for tracing and does not normally prevent duplicate processing.
