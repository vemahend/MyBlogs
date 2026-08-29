# 15. How do you maintain backward compatibility?

**Technology:** API Design and Integration Governance

**Source question:** 15. How do you maintain backward compatibility?

## 1. What is it?

Backward compatibility means changing an API without breaking clients that already use its older contract.

For example, an existing mobile app should continue to work after the server adds a new response field or introduces a new payment feature. Compatibility covers request and response formats, URLs, HTTP status codes, validation rules, authentication, events, and business behaviour.

It does not mean that an API can never change. It means that we make safe, additive changes where possible and use versioning and a planned migration when a breaking change is necessary.

## 2. Why is it important?

API consumers are not normally upgraded at the same time as the server. They may include mobile apps, partner systems, internal services, or customers that release on their own schedules.

If a server makes an unexpected breaking change, clients may fail in production. This can cause payment failures, incomplete transactions, support calls, and loss of trust. Maintaining compatibility lets teams release independently and gives consumers enough time to move to a newer contract.

For architects, this is also an integration-governance concern. Clear compatibility rules reduce unplanned dependencies between teams and make API changes predictable.

## 3. How does it work?

I normally use the following approach:

1. Treat the published API contract as a product. Document it with OpenAPI and define which changes are compatible or breaking.
2. Prefer additive changes. Add optional request fields, new endpoints, or new response fields. Do not rename or remove fields that clients may still use.
3. Preserve existing behaviour. Avoid silently changing field meaning, default values, validation rules, status codes, or enum handling.
4. Make clients tolerant where possible. They should ignore unknown response properties and handle unknown enum values safely.
5. Introduce a new API version for a genuine breaking change. Common choices are a URL such as `/api/v2/payments` or a version in a header.
6. Run old and new versions together during a migration period. Share the same core business logic so that versions do not produce inconsistent results.
7. Publish a deprecation date, migration guide, and change log. Measure usage of the old version before retiring it.
8. Protect the contract with consumer-driven contract tests, integration tests, and automated OpenAPI breaking-change checks in CI.

Database changes behind the API should also use an expand-and-contract approach: add the new schema first, support both shapes during migration, and remove the old schema only after all users have moved.

## 4. Practical example

Assume a payment API returns this response:

```json
{
  "paymentId": "pay-1042",
  "amount": 125.00,
  "status": "Completed"
}
```

The business now needs to show the payment currency. Adding an optional `currency` property is normally backward compatible because existing clients can ignore it:

```json
{
  "paymentId": "pay-1042",
  "amount": 125.00,
  "status": "Completed",
  "currency": "NZD"
}
```

Changing `amount` from a number to an object would be breaking because old clients expect a number. I would either keep the old field and add a new field such as `money`, or introduce a v2 contract. I would monitor v1 traffic and remove v1 only after consumers have migrated and the agreed support period has ended.

## 5. Scenario-based interview answer

**Problem:** In one payment platform, we needed to replace a simple payment status with richer status and failure information. Several mobile applications and external merchants still depended on the old response.

**Decision:** I did not change or remove the existing `status` field. We kept its existing values and added optional fields for `statusReason` and `failureCode`. A later requirement needed a different status model, so we placed that contract in v2 instead of changing v1.

**Implementation:** We mapped both v1 and v2 controllers to the same application service, added OpenAPI contract checks and integration tests for both versions, and published examples and a migration guide. We also recorded the calling client and API version in telemetry. The old version received a deprecation header and an agreed retirement date.

**Result:** Existing consumers continued to work, new consumers received the richer information, and we could contact the remaining v1 users using real usage data. The migration completed without a coordinated release or payment outage.

In an interview, I would summarise it like this: “I prefer additive contract changes, protect existing behaviour with automated tests, and introduce a new version only when the change is truly breaking. I run versions side by side, communicate deprecation clearly, and use telemetry rather than assumptions before retiring the old contract.”

## 6. Code example

This example keeps the original response properties and adds a nullable property. It works with the built-in `System.Text.Json` support in currently supported ASP.NET Core versions, including .NET 8, .NET 9, and .NET 10.

```csharp
using System.Text.Json.Serialization;

public sealed record PaymentResponseV1(
    string PaymentId,
    decimal Amount,
    string Status,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    string? Currency = null);

app.MapGet("/api/v1/payments/{id}", (string id) =>
{
    var response = new PaymentResponseV1(
        PaymentId: id,
        Amount: 125.00m,
        Status: "Completed",
        Currency: "NZD");

    return Results.Ok(response);
});
```

`Currency` is optional and appears at the end of the constructor, so existing server-side calls can still create the record without supplying it. Existing JSON clients should continue to read `paymentId`, `amount`, and `status`; well-behaved clients ignore the new property.

This is safe only if `currency` does not change the meaning of the existing `amount`. If the old contract assumed a fixed currency and that assumption is no longer valid, I would document the rule carefully or create a v2 contract instead of presenting the change as harmless.

## 7. Common mistakes

- Renaming, removing, or changing the type of an existing field without creating a new version.
- Assuming that adding a required request field is backward compatible. Old clients will not send it.
- Adding a new enum value without checking whether clients fail on unknown values.
- Changing validation, rounding rules, defaults, status codes, or field meaning while leaving the schema unchanged.
- Returning `null` where the old API always returned a value, or changing an empty collection to `null`.
- Versioning every small additive change, which creates unnecessary versions and maintenance work.
- Copying business logic into each API version instead of sharing the core service and mapping separate contracts.
- Removing an old version based only on its age, without usage telemetry, communication, and a migration period.
- Testing only the latest version and allowing an infrastructure or serializer change to break older contracts.

## 8. Follow-up interview questions

### What changes are usually backward compatible?

Adding an optional request field, a response field that tolerant clients can ignore, or a new endpoint is usually compatible. The exact answer still depends on documented client behaviour and business meaning.

### When should you create a new API version?

Create a new version when you must remove or rename fields, change data types or meanings, make optional input required, or significantly change workflow behaviour. Prefer an additive change when it expresses the requirement clearly.

### How do you know when an old version can be retired?

Use per-version telemetry to confirm that active consumers have migrated. Then follow the published support policy, notify remaining owners, allow the agreed notice period, and remove the version only after contract and operational checks pass.
