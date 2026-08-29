# 8. How do you make a POST request idempotent?

**Technology:** API Design and Integration Governance

**Source question:** 8. How do you make a POST request idempotent?

## 1. What is it?

A POST request is idempotent when sending the same logical request more than once produces the same business result as sending it once.

POST is not idempotent by default. We normally make it idempotent by asking the client to send a unique **idempotency key**, such as `Idempotency-Key: 8b9...`. The server stores that key with the request fingerprint and final response. If the same request arrives again, the server returns the stored response instead of repeating the operation.

## 2. Why is it important?

Clients often retry requests because of timeouts, network failures, or temporary service errors. The first request may have succeeded even though the client did not receive the response.

Without idempotency, a retry could create two orders, charge a card twice, or transfer money twice. For architects, this is especially important in distributed systems because delivery is often **at least once**, not exactly once.

## 3. How does it work?

A typical flow is:

1. The client creates a unique key for one business operation and sends it with the POST request.
2. The server validates the key and calculates a fingerprint, usually a hash of the important request fields.
3. The server atomically reserves the key in durable storage. A unique database constraint prevents two concurrent requests from owning the same key.
4. The server performs the business operation and stores the HTTP status and response against the key, ideally in the same database transaction when possible.
5. A retry with the same key and same fingerprint receives the stored response.
6. The same key with a different request is rejected, commonly with `409 Conflict` or `422 Unprocessable Entity`.
7. If another request with that key is still running, the API can return `409 Conflict`, `425 Too Early`, or wait briefly, based on the API contract.

The key should be scoped to the caller, such as `(CustomerId, IdempotencyKey)`, and retained for a documented period. An in-memory cache alone is not reliable because entries disappear during restarts and are not shared safely across service instances.

## 4. Practical example

A mobile banking app sends `POST /transfers` with an idempotency key. The bank creates the transfer, but the response is lost because the mobile connection drops. The app retries with the same key.

The API finds the completed record and returns the original `201 Created` response with the same transfer ID. It does not debit the account again. If the app reuses that key with a different amount or destination account, the API rejects it.

## 5. Scenario-based interview answer

“In a payment API, we saw clients retry after gateway timeouts. The original payment sometimes completed, so a normal retry risked a duplicate charge.

I decided to require an idempotency key for payment creation. We stored the key, merchant ID, request hash, processing state, and final response in SQL. A unique constraint on merchant ID and key handled concurrent duplicates. The payment record and completed idempotency response were committed in one transaction, while external gateway calls used our payment ID as the gateway’s idempotency reference.

When a duplicate arrived, we returned the saved response. We rejected the key if its request hash did not match. This made client retries safe and removed duplicate charges caused by network failures.”

## 6. Code example

The following ASP.NET Core minimal API example shows the main pattern. Minimal APIs are supported in ASP.NET Core 6 and later; the example fits current ASP.NET Core 8+ applications.

```csharp
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

app.MapPost("/payments", async (
    HttpRequest httpRequest,
    CreatePayment request,
    IIdempotencyStore store,
    PaymentService payments,
    CancellationToken cancellationToken) =>
{
    if (!httpRequest.Headers.TryGetValue("Idempotency-Key", out var values) ||
        string.IsNullOrWhiteSpace(values.ToString()))
    {
        return Results.BadRequest("Idempotency-Key is required.");
    }

    var key = values.ToString();
    var requestJson = JsonSerializer.Serialize(request);
    var requestHash = Convert.ToHexString(
        SHA256.HashData(Encoding.UTF8.GetBytes(requestJson)));

    // Reserve must be atomic and backed by a unique constraint on (ClientId, Key).
    var reservation = await store.ReserveAsync(
        request.ClientId, key, requestHash, cancellationToken);

    if (reservation.HashMismatch)
        return Results.Conflict("The idempotency key was used for another request.");

    if (reservation.CompletedResponse is not null)
    {
        return Results.Json(
            reservation.CompletedResponse.Body,
            statusCode: reservation.CompletedResponse.StatusCode);
    }

    if (!reservation.OwnedByThisRequest)
        return Results.Conflict("A request with this key is still being processed.");

    var payment = await payments.CreateAsync(request, cancellationToken);
    var response = new PaymentResponse(payment.Id, payment.Status);

    await store.CompleteAsync(
        request.ClientId, key, StatusCodes.Status201Created,
        response, cancellationToken);

    return Results.Created($"/payments/{payment.Id}", response);
});

public sealed record CreatePayment(string ClientId, decimal Amount, string Currency);
public sealed record PaymentResponse(Guid Id, string Status);
```

The important part is not the header alone. `ReserveAsync` must perform an atomic insert into shared, durable storage with a unique constraint. It must compare the saved request hash, while `CompleteAsync` saves the response for later retries. In a real payment system, transaction boundaries and recovery for a process crash must also be designed carefully, often with an outbox or a payment state machine.

## 7. Common mistakes

- Treating the idempotency key as optional for operations that must not be duplicated.
- Checking whether a key exists and then inserting it in separate steps. Two concurrent requests can both pass the check.
- Storing keys only in memory or on one server instance.
- Reusing a key without comparing the original request fingerprint.
- Marking the key complete before the business operation commits, or committing the operation without a recoverable idempotency record.
- Caching only successful responses without defining what happens for validation failures, server failures, and requests still in progress.
- Keeping keys forever, or deleting them before the documented retry window ends.
- Assuming an idempotent API automatically makes calls to an external payment provider idempotent.

## 8. Follow-up interview questions

### Should every POST require an idempotency key?

No. It is most valuable for operations where retries could cause harmful duplicates, such as payments, transfers, orders, and account creation.

### How do you handle two requests with the same key at the same time?

Use an atomic insert and a database unique constraint. One request becomes the owner; the other returns the completed response, waits, or receives an “in progress” response according to the API contract.

### Is an idempotency key the same as a correlation ID?

No. An idempotency key prevents the same business operation from running twice. A correlation ID connects logs and traces across services; it does not normally control execution.
