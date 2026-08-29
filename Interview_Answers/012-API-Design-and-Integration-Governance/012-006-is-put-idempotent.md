# 6. Is PUT idempotent?

**Technology:** API Design and Integration Governance

**Source question:** 6. Is PUT idempotent?

## 1. What is it?

Yes. In HTTP, `PUT` is defined as an idempotent method.

Idempotent means that sending the same request once or several times should leave the resource in the same intended state. For example, repeatedly setting an account preference to `Email` should still leave it set to `Email`.

This does **not** mean every response must be identical. The first request might return `201 Created`, while a retry returns `200 OK` or `204 No Content`. Logging, metrics, and audit timestamps may also change. The important point is that the requested resource state is not changed again by an identical retry.

## 2. Why is it important?

Networks are unreliable. A client may send a request successfully but lose the response because of a timeout. It then does not know whether the server completed the operation.

Because `PUT` is idempotent, the client can normally retry the same request without creating another resource or applying the same business change twice. This is valuable in distributed systems, where gateways, client libraries, and resilience policies often perform retries.

Architects still need to implement the endpoint correctly. Merely using the `PUT` verb does not automatically make unsafe business logic idempotent.

## 3. How does it work?

A typical flow is:

1. The client chooses a known resource URI, such as `/api/payment-instructions/PI-123`.
2. It sends the desired resource representation with `PUT`.
3. The server creates that resource if the contract allows creation, or replaces/updates the resource at that URI.
4. If the identical request is received again, the server writes the same desired state.
5. The resource therefore ends in the same state as it did after the first successful request.

For concurrent updates, the API can use an `ETag` and the `If-Match` header. This prevents a retry or an older client request from silently overwriting a newer version.

## 4. Practical example

Consider a banking API that stores a payment instruction:

```http
PUT /api/payment-instructions/PI-123
Content-Type: application/json

{
  "fromAccount": "ACC-10",
  "toAccount": "ACC-20",
  "amount": 100.00,
  "currency": "NZD",
  "status": "Pending"
}
```

If the client times out and sends the same request again, there should still be only one instruction named `PI-123`. The endpoint must set the instruction's state, not insert a new payment row on every call.

Executing the actual transfer is different. Repeating a command such as `POST /payments` could debit the account twice unless the API uses a separate idempotency key or another deduplication mechanism.

## 5. Scenario-based interview answer

“In one payment integration, clients retried requests when they did not receive a response. The existing endpoint inserted a new instruction on every retry, so a timeout could produce duplicates.

I changed the design so the client supplied a stable payment-instruction ID and used `PUT /payment-instructions/{id}`. The service stored that ID under a unique database constraint and treated the request as the desired state of that instruction. An identical retry updated the same row and returned success. We also used optimistic concurrency for conflicting updates and kept execution of the money transfer as a separate protected operation.

As a result, transport retries no longer created duplicate instructions. My key point is that PUT is idempotent by HTTP semantics, but the implementation and database constraints must preserve that behavior.”

## 6. Code example

```csharp
public sealed record PutPaymentInstructionRequest(
    string FromAccount,
    string ToAccount,
    decimal Amount,
    string Currency);

[ApiController]
[Route("api/payment-instructions")]
public sealed class PaymentInstructionsController(AppDbContext db) : ControllerBase
{
    [HttpPut("{id}")]
    public async Task<IActionResult> Put(
        string id,
        PutPaymentInstructionRequest request,
        CancellationToken cancellationToken)
    {
        var instruction = await db.PaymentInstructions
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

        var created = instruction is null;
        if (created)
        {
            instruction = new PaymentInstruction { Id = id };
            db.PaymentInstructions.Add(instruction);
        }

        // Set the desired state; do not add the amount or create a new ID.
        instruction.FromAccount = request.FromAccount;
        instruction.ToAccount = request.ToAccount;
        instruction.Amount = request.Amount;
        instruction.Currency = request.Currency;

        await db.SaveChangesAsync(cancellationToken);

        return created
            ? CreatedAtAction(nameof(Get), new { id }, instruction)
            : NoContent();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PaymentInstruction>> Get(
        string id,
        CancellationToken cancellationToken)
    {
        var instruction = await db.PaymentInstructions.FindAsync([id], cancellationToken);
        return instruction is null ? NotFound() : Ok(instruction);
    }
}
```

The route ID is the stable identity of the resource. A unique key on `PaymentInstruction.Id` should also be enforced in the database to handle concurrent requests safely. Repeating the same `PUT` sets the same field values; it does not create another instruction or increment an amount.

In production, creation should also handle a race where two requests both initially see no row. A unique constraint plus suitable exception handling or a database-native upsert closes that gap.

## 7. Common mistakes

- Assuming an endpoint is idempotent just because it uses `PUT`.
- Generating a new resource ID on every request instead of using the ID in the URI.
- Performing an additive action, such as `balance += amount`, inside a `PUT` handler.
- Sending an email, publishing a business event, or executing a payment again on every retry without deduplication.
- Treating idempotent as “the response must always be identical.”
- Ignoring concurrent requests and relying only on a read-then-insert check without a unique database constraint.
- Using `PUT` as a partial update without defining the contract clearly. `PATCH` is usually clearer for partial changes, although either method's real behavior must match its documented semantics.

## 8. Follow-up interview questions

### Is POST idempotent?

Not by default. Repeating a `POST` may create multiple resources or execute an action multiple times. It can be made safely repeatable by using an idempotency key and storing the result of the first request.

### What is the difference between PUT and PATCH?

`PUT` normally creates or replaces the state of a resource at a known URI and is idempotent. `PATCH` applies partial changes and is not guaranteed to be idempotent; it depends on the patch operation and API design.

### Can an idempotent PUT return different status codes?

Yes. For example, the first call can return `201 Created`, and a later identical call can return `204 No Content`. Idempotency concerns the intended server state, not identical responses.
