# 14. How do you introduce a breaking API change?

**Technology:** API Design and Integration Governance

**Source question:** 14. How do you introduce a breaking API change?

## 1. What is it?

A breaking API change is a change that can make an existing client stop working or behave differently. Examples include removing a field, renaming an endpoint, changing a data type, making an optional field required, or changing the meaning of a response.

I introduce such a change through a new API version instead of silently changing the existing contract. The old and new versions run side by side for an agreed migration period.

## 2. Why is it important?

API consumers are often released on a different schedule from the API. A mobile application, partner system, or another microservice may continue using an older contract for months.

A controlled versioning and deprecation process:

- prevents unexpected production failures;
- gives consumers time to test and migrate;
- makes ownership, deadlines, and risks visible;
- allows rollback without forcing every client to roll back;
- protects important operations such as payments and authentication.

The best option is still to make an additive, backward-compatible change when possible. A new version is needed only when the old contract cannot reasonably be preserved.

## 3. How does it work?

A practical flow is:

1. Confirm that the change is truly breaking and cannot be made additive.
2. Identify every consumer using API telemetry, gateway logs, and the service catalogue.
3. Design a new version, such as `/api/v2/payments`, while keeping `/api/v1/payments` stable.
4. Document the contract difference in OpenAPI and provide a migration guide with request and response examples.
5. Run contract, integration, security, and performance tests for both versions.
6. Release the new version and monitor adoption, failures, latency, and business outcomes separately by version.
7. Mark the old version as deprecated. Communicate the retirement date through agreed channels and response metadata, not only in release notes.
8. Help consumers migrate and verify that traffic has moved.
9. Retire the old version only after the agreed policy and exit checks are satisfied.

The version may be carried in the URL, a header, or media type. URL versioning is often easiest for external APIs because it is visible in logs, documentation, and gateway rules. The important point is consistency across the organisation.

## 4. Practical example

A payment API originally accepts an amount in decimal form:

```json
{ "amount": 10.50, "currency": "NZD" }
```

The team wants to use integer minor units to avoid ambiguity between systems:

```json
{ "amountInMinorUnits": 1050, "currency": "NZD" }
```

Renaming the property and changing its type is breaking. The team keeps `/api/v1/payments` accepting `amount` and introduces `/api/v2/payments` accepting `amountInMinorUnits`. Both versions call the same internal payment service after mapping their requests to a shared command. Consumers receive a migration guide and a retirement date for v1. Dashboards track v1 traffic until all approved consumers have moved to v2.

## 5. Scenario-based interview answer

“In one payment platform, we needed to replace a decimal amount with minor units because different clients were applying rounding differently.

**Problem:** Changing the existing request would have broken mobile and partner clients, and they could not all deploy at the same time.

**Decision:** I treated it as a contract change and introduced v2. We kept v1 unchanged during a defined deprecation period. Both API versions mapped to the same internal payment command, so the core business logic was not duplicated.

**Implementation:** We published separate OpenAPI definitions, examples, and a migration guide. Consumer contract tests ran in the delivery pipeline. At the gateway and application levels, we measured calls and errors by API version. We contacted each consumer, agreed migration dates, and announced the v1 retirement date through our normal support channels and deprecation headers.

**Result:** Consumers migrated without an outage, rounding errors were removed, and we retired v1 only after its traffic reached zero and the owners confirmed migration. I would first look for a backward-compatible design, but when a breaking change is unavoidable, I use versioning, clear communication, telemetry, and a controlled retirement plan.”

## 6. Code example

The following minimal API example works with ASP.NET Core 8 and later. It keeps two public contracts but reuses one internal service.

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<PaymentService>();

var app = builder.Build();

app.MapPost("/api/v1/payments", async (
    CreatePaymentV1 request,
    PaymentService service,
    CancellationToken cancellationToken) =>
{
    // v1 accepts a decimal major-unit amount, for example 10.50 NZD.
    var minorUnits = checked((long)decimal.Round(
        request.Amount * 100m,
        0,
        MidpointRounding.AwayFromZero));

    var result = await service.CreateAsync(
        new CreatePaymentCommand(minorUnits, request.Currency),
        cancellationToken);

    return Results.Created($"/api/v1/payments/{result.Id}", result);
})
.WithTags("Payments v1")
.WithOpenApi(operation =>
{
    operation.Deprecated = true;
    return operation;
});

app.MapPost("/api/v2/payments", async (
    CreatePaymentV2 request,
    PaymentService service,
    CancellationToken cancellationToken) =>
{
    var result = await service.CreateAsync(
        new CreatePaymentCommand(request.AmountInMinorUnits, request.Currency),
        cancellationToken);

    return Results.Created($"/api/v2/payments/{result.Id}", result);
})
.WithTags("Payments v2")
.WithOpenApi();

app.Run();

public sealed record CreatePaymentV1(decimal Amount, string Currency);
public sealed record CreatePaymentV2(long AmountInMinorUnits, string Currency);
public sealed record CreatePaymentCommand(long AmountInMinorUnits, string Currency);
public sealed record PaymentResult(Guid Id, string Status);

public sealed class PaymentService
{
    public Task<PaymentResult> CreateAsync(
        CreatePaymentCommand command,
        CancellationToken cancellationToken)
    {
        // Validate currency and amount, apply idempotency, and persist the payment.
        return Task.FromResult(new PaymentResult(Guid.NewGuid(), "Accepted"));
    }
}
```

`CreatePaymentV1` and `CreatePaymentV2` are separate public contracts. Each endpoint converts its request into `CreatePaymentCommand`, which avoids duplicating business logic. The v1 OpenAPI operation is marked as deprecated, but it continues to behave according to its original contract until retirement.

For a larger controller-based API, an API-versioning library can reduce routing and documentation boilerplate. The team should pin a supported package version and test its behavior during framework upgrades.

## 7. Common mistakes

- Changing the existing contract and calling it a minor release.
- Creating a new version for an additive, backward-compatible field.
- Reusing one request model for v1 and v2, which can accidentally change both contracts.
- Publishing v2 without identifying consumers or giving them a migration guide.
- Setting an unrealistic retirement date without consumer agreement.
- Duplicating business logic across versions instead of using adapters and a shared internal model.
- Removing v1 because traffic looks low rather than confirming that it is zero and all consumers have migrated.
- Forgetting non-obvious breaking changes such as new validation rules, changed error codes, enum values, nullability, authentication requirements, or pagination behavior.
- Keeping old versions forever with no owner, support policy, or retirement criteria.

## 8. Follow-up interview questions

### How do you decide whether a change needs a new version?

I check whether an existing valid client can continue working with the same meaning. Removing or renaming fields, changing types, or tightening required validation normally needs a new version. Adding an optional response field is usually backward compatible if clients correctly ignore unknown fields.

### How do you know when it is safe to retire the old version?

I use version-level telemetry and a consumer register. Traffic should be zero for an agreed period, all known owners should confirm migration, and support, rollback, and communication checks should be complete.

### Where should API versioning be implemented?

The public contract should be clear at the API boundary, while the gateway may also route and enforce policies by version. I keep version-specific DTOs and adapters near that boundary and reuse the same application and domain logic wherever behavior is shared.
