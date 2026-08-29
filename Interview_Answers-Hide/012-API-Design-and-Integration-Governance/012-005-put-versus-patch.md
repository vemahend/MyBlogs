# 5. PUT versus PATCH?

**Technology:** API Design and Integration Governance

**Source question:** 5. PUT versus PATCH?

## 1. What is it?

`PUT` and `PATCH` are HTTP methods used to update a resource through an API.

- **PUT** normally replaces the complete resource representation at a known URL. The client sends the full state it wants the resource to have.
- **PATCH** changes only selected parts of a resource. The client sends the fields or operations that need to change.

For example, updating a customer's complete profile is a good fit for `PUT`. Changing only the customer's phone number is a good fit for `PATCH`.

`PUT` is defined as idempotent: sending the same request several times should leave the resource in the same final state. `PATCH` is not automatically idempotent. Its behavior depends on the patch document and the server implementation.

## 2. Why is it important?

Choosing the correct method makes the API contract clear and prevents accidental data loss.

- `PUT` is useful when the client owns and sends the complete resource state.
- `PATCH` is useful when clients need small updates without sending or overwriting unrelated fields.
- Correct semantics help with retries, caching, logging, authorization, and API documentation.
- In distributed systems, idempotent updates are especially valuable because a client may retry after a timeout without knowing whether the first request succeeded.

Developers must also define what omitted fields mean. With `PUT`, an omitted field usually means it should be reset or removed according to the contract. With `PATCH`, an omitted field normally means "leave it unchanged."

## 3. How does it work?

For a typical `PUT /customers/123` request:

1. The server authenticates and authorizes the caller.
2. It validates the complete request representation.
3. It loads customer `123`, or creates it only if the API contract allows creation through `PUT`.
4. It replaces the editable state with the supplied values.
5. It saves the resource and returns a suitable status such as `200 OK`, `204 No Content`, or `201 Created`.

For a typical `PATCH /customers/123` request:

1. The server authenticates and authorizes the caller.
2. It validates the patch format and checks that every requested field may be changed.
3. It loads customer `123`.
4. It applies only the requested changes.
5. It validates the final resource, saves it, and returns `200 OK` or `204 No Content`.

Common PATCH formats include **JSON Patch** (`application/json-patch+json`, RFC 6902), which contains operations such as `replace` and `remove`, and **JSON Merge Patch** (`application/merge-patch+json`, RFC 7396), which looks more like a partial JSON object. A plain partial DTO can also be used, but it is a custom API contract rather than one of those standard patch formats.

For concurrent updates, both methods should support optimistic concurrency, usually with an `ETag` response header and an `If-Match` request header. The server rejects stale updates with `412 Precondition Failed`.

## 4. Practical example

Consider a banking customer profile containing name, address, phone number, risk category, and account status.

A mobile app needs to change only the phone number. Sending a full `PUT` would force the app to read and resend every field. It could also overwrite a risk-category update made at the same time by a compliance service.

The API therefore accepts `PATCH /customers/123` with a phone-number change. The server allows the customer to update `phoneNumber`, but rejects changes to protected fields such as `riskCategory` and `accountStatus`. It also requires `If-Match` so that an old mobile screen cannot overwrite a newer change.

An internal administration client may use `PUT` when it deliberately submits the complete editable customer profile.

## 5. Scenario-based interview answer

**Problem:** In a payment platform, the web portal sent complete merchant records whenever a user changed one setting. That caused unrelated values to be overwritten when another service updated the same merchant at nearly the same time.

**Decision:** I kept `PUT` for clients that intentionally replace the full editable representation and introduced `PATCH` for small settings changes. I did not treat PATCH as automatically safe; I defined the allowed operations and concurrency rules explicitly.

**Implementation:** We used JSON Patch for explicit operations, allowed only approved paths, validated the resource after applying the patch, and used `ETag` and `If-Match` for optimistic concurrency. Sensitive fields such as settlement status could only be changed through dedicated business operations. We also made replacement-style patch operations idempotent where practical, so retries were predictable.

**Result:** Payloads became smaller, clients stopped overwriting unrelated changes, and the API contract clearly showed whether an endpoint replaced a complete resource or changed selected fields.

In an interview, I would summarize it like this: "I use PUT when the client sends the complete desired state of a resource, and PATCH when it sends only specific changes. I also consider validation, field-level authorization, concurrency, and retry behavior. The HTTP verb alone does not solve those production concerns."

## 6. Code example

This ASP.NET Core example uses a small partial-update DTO. It is intentionally a custom PATCH contract, not JSON Patch. The nullable properties mean that omitted JSON properties are left unchanged; this simple shape cannot distinguish an omitted property from an explicit `null`, so a different DTO or a standard patch format is needed if clearing a value must be supported.

```csharp
public sealed record UpdateCustomerRequest(
    string Name,
    string PhoneNumber,
    string Address);

public sealed record PatchCustomerRequest(
    string? PhoneNumber,
    string? Address);

[ApiController]
[Route("api/customers")]
public sealed class CustomersController(AppDbContext db) : ControllerBase
{
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Put(
        Guid id,
        UpdateCustomerRequest request,
        CancellationToken cancellationToken)
    {
        var customer = await db.Customers.FindAsync([id], cancellationToken);
        if (customer is null) return NotFound();

        customer.Name = request.Name;
        customer.PhoneNumber = request.PhoneNumber;
        customer.Address = request.Address;

        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Patch(
        Guid id,
        PatchCustomerRequest request,
        CancellationToken cancellationToken)
    {
        var customer = await db.Customers.FindAsync([id], cancellationToken);
        if (customer is null) return NotFound();

        if (request.PhoneNumber is not null)
            customer.PhoneNumber = request.PhoneNumber;

        if (request.Address is not null)
            customer.Address = request.Address;

        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
```

The `PUT` action assigns every editable field from the request. The `PATCH` action changes only supplied values. In production, validation, authorization policies, error handling, and optimistic concurrency should also be included.

ASP.NET Core supports binding normal partial DTOs directly. JSON Patch support depends on the ASP.NET Core version and configured JSON formatter/package, so the API should document and test its chosen patch format instead of assuming every JSON PATCH body is supported automatically.

## 7. Common mistakes

- Using `PUT` with a partial body but leaving omitted fields unchanged. That gives PUT unclear, PATCH-like behavior.
- Treating PATCH as automatically idempotent. An operation such as "increment balance" can produce a different result on every retry.
- Updating database entities directly from client JSON, which can allow over-posting of protected fields.
- Failing to distinguish an omitted property from a property explicitly set to `null`.
- Applying patch operations before checking whether the caller may change those fields.
- Validating only individual patch values instead of validating the complete resource after the patch.
- Ignoring concurrent updates and allowing the last request to silently overwrite earlier work.
- Using PATCH for business commands such as `approve-payment` or `close-account`. Dedicated action endpoints often express those workflows more clearly.
- Returning `200 OK` without a response body; use `204 No Content`, or return the updated representation with `200 OK`.

## 8. Follow-up interview questions

### Is PATCH always better because its payload is smaller?

No. Use PATCH when partial-update semantics are useful. PUT is simpler and clearer when the client owns the complete representation and wants to replace it.

### Can PUT create a resource?

Yes, if the client knows the resource URL and the API contract allows it. A successful creation normally returns `201 Created`. Many APIs choose to support only updates through PUT, so this must be documented.

### How do you prevent lost updates with PUT or PATCH?

Return an `ETag` for the current version and require the client to send it in `If-Match`. If the resource has changed, reject the update with `412 Precondition Failed` and let the client reload or resolve the conflict.
