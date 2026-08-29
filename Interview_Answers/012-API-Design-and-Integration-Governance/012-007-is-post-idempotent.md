# 7. Is POST idempotent?

**Technology:** API Design and Integration Governance

**Source question:** 7. Is POST idempotent?

## 1. What is it?

No, `POST` is **not idempotent by definition**.

An operation is idempotent when sending the same request multiple times has the same intended effect as sending it once. A normal `POST` often creates a new resource, so repeating it may create multiple records.

However, an API can make a specific `POST` operation idempotent. A common approach is to require an idempotency key and return the original result when the same key is received again.

## 2. Why is it important?

Clients sometimes retry requests because of timeouts, temporary network failures, or service restarts. The first request may have succeeded even though its response never reached the client.

Without idempotency, retrying a payment request could charge a customer twice. Architects therefore need an explicit retry strategy for important `POST` operations instead of assuming that every retry is safe.

## 3. How does it work?

For an idempotent `POST` using an idempotency key:

1. The client creates a unique key for one logical operation and sends it with the request.
2. The server checks its durable store for that key.
3. If the key is new, the server processes the operation and stores the key, request fingerprint, status, and response.
4. If the same key and same request arrive again, the server returns the stored result without repeating the operation.
5. If the same key is reused with different request data, the server rejects it, usually with `409 Conflict` or `422 Unprocessable Content`, according to the API contract.

The key check and business operation must be protected by a database transaction or a unique constraint. A simple check followed by an insert is vulnerable to concurrent requests.

## 4. Practical example

A mobile banking app sends `POST /payments` to transfer $100. The bank completes the transfer, but the response is lost because the connection drops. The app retries with the same `Idempotency-Key`.

The payment API finds the completed request and returns the original payment ID and status. It does not create a second transfer. A genuinely new payment must use a new key.

## 5. Scenario-based interview answer

“`POST` is not naturally idempotent because repeated calls can create multiple resources. In a payment system, we had clients retry after timeouts, which created a risk of duplicate charges.

I decided to make the payment-creation operation idempotent at the application level. Each logical payment included an idempotency key. We stored that key with a hash of the request and the final response, and enforced a unique database constraint. A retry with the same key and payload received the original response, while reuse of the key with a different payload was rejected.

This allowed safe retries during transient failures and prevented duplicate payments. I would still document the endpoint as `POST`; idempotency describes its behavior, not a change to the HTTP method.”

## 6. Code example

```csharp
public sealed record CreatePayment(decimal Amount, string AccountId);
public sealed record PaymentResponse(Guid PaymentId, string Status);

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
    var requestHash = Convert.ToHexString(
        System.Security.Cryptography.SHA256.HashData(
            System.Text.Json.JsonSerializer.SerializeToUtf8Bytes(request)));

    var previous = await db.IdempotencyRecords
        .SingleOrDefaultAsync(x => x.Key == key, cancellationToken);

    if (previous is not null)
    {
        if (previous.RequestHash != requestHash)
            return Results.Conflict("The key was already used for another request.");

        var savedResponse = System.Text.Json.JsonSerializer
            .Deserialize<PaymentResponse>(previous.ResponseJson)!;

        return Results.Ok(savedResponse);
    }

    await using var transaction =
        await db.Database.BeginTransactionAsync(cancellationToken);

    var payment = new Payment
    {
        Id = Guid.NewGuid(),
        Amount = request.Amount,
        AccountId = request.AccountId,
        Status = "Created"
    };

    var response = new PaymentResponse(payment.Id, payment.Status);

    db.Payments.Add(payment);
    db.IdempotencyRecords.Add(new IdempotencyRecord
    {
        Key = key,
        RequestHash = requestHash,
        ResponseJson = System.Text.Json.JsonSerializer.Serialize(response)
    });

    await db.SaveChangesAsync(cancellationToken);
    await transaction.CommitAsync(cancellationToken);

    return Results.Created($"/payments/{payment.Id}", response);
});
```

`IdempotencyRecords.Key` must have a unique database index. The transaction saves the payment and its idempotency record together. Production code should also handle a unique-key conflict caused by two simultaneous requests, then load and return the winning request’s stored result.

## 7. Common mistakes

- Assuming all `POST` requests are automatically unsafe to retry, or automatically idempotent.
- Retrying a payment `POST` without an idempotency key.
- Storing keys only in memory, which fails after a restart and does not work across multiple service instances.
- Performing “check then insert” without a transaction or unique database constraint.
- Allowing the same key to be reused with different request data.
- Recording the key before the business transaction succeeds, leaving an incomplete result.
- Keeping keys forever without a documented retention and cleanup policy.
- Confusing an identical HTTP response with idempotency; idempotency concerns the intended server-side effect.

## 8. Follow-up interview questions

### Is PUT idempotent?

Yes, by HTTP semantics, repeating the same `PUT` should leave the resource in the same intended state. The response status may differ, but the intended effect should not.

### Can an idempotent POST return different responses?

Idempotency is mainly about the intended effect, not byte-for-byte identical responses. With an idempotency-key design, returning the stored original status and response is usually the clearest client contract.

### How long should an idempotency key be stored?

It depends on the retry window and business risk. The API should document the retention period; high-value payment systems may keep keys or business transaction identifiers much longer than ordinary APIs.
