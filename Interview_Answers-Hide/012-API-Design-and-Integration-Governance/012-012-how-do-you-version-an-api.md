# 12. How do you version an API?

**Technology:** API Design and Integration Governance

**Source question:** 12. How do you version an API?

## 1. What is it?

API versioning is a way to change an API without unexpectedly breaking applications that already use it.

Each public contract is given a version, such as `v1` or `v2`. Existing clients can continue calling `v1`, while new or upgraded clients use `v2`.

A version should represent the API contract, not every internal release. Fixing a bug or improving database code normally does not need a new API version. A new version is mainly needed for a breaking contract change.

## 2. Why is it important?

An API can have mobile apps, partner systems, web clients, and other services as consumers. They cannot always upgrade at the same time.

Versioning allows a team to:

- release breaking changes safely;
- migrate consumers in stages;
- keep old integrations working during an agreed support period;
- document and monitor each contract separately;
- retire an old contract in a controlled way.

Without a clear versioning policy, a small response or validation change can cause failures across several systems.

## 3. How does it work?

A practical flow is:

1. Define what counts as a breaking change. Examples include removing or renaming a field, changing its type, changing status-code meaning, or making an optional field required.
2. Choose how clients send the version. Common choices are a URL segment (`/api/v1/payments`), a request header, a query string, or media-type negotiation.
3. Let the API route the request to the matching contract and implementation.
4. Keep non-breaking additions in the current version where possible. For example, adding an optional response field is usually safe when clients ignore unknown fields.
5. Publish separate OpenAPI documentation and tests for each supported version.
6. Mark the old version as deprecated, communicate an end-of-support date, monitor its usage, and remove it only after the agreed migration period.

For public HTTP APIs, I normally prefer URL versioning because it is visible, easy to route, and simple for consumers to test. Header versioning can keep URLs cleaner, but it is less obvious during troubleshooting and requires careful cache configuration.

Versioning the API contract does not require duplicating the whole application. Controllers or endpoints may differ by version, while both reuse the same domain and application services.

## 4. Practical example

Suppose a payment API has this `v1` endpoint:

```http
POST /api/v1/payments
```

It accepts an amount as a decimal and assumes one currency. The business later needs multi-currency payments and requires both an amount and an ISO currency code. Making `currency` mandatory in `v1` would break existing clients.

The team keeps `v1` unchanged and introduces:

```http
POST /api/v2/payments
```

Version 2 requires `amount` and `currency`, but both versions call the same payment-processing service. Partners migrate to `v2` during a six-month window. Usage dashboards identify consumers still calling `v1`, and `v1` responses include a deprecation warning before retirement.

## 5. Scenario-based interview answer

“In one payment platform, we needed to change the request contract from a single-currency amount to a multi-currency money object.

The problem was that several partner systems deployed on their own schedules, so changing the existing endpoint would have broken live payments. I decided to introduce a URL-based `v2` contract and leave `v1` stable. This made the selected contract clear in logs, documentation, and gateway routes.

We created separate versioned controllers and DTOs, but reused the same application and domain services. We published a separate OpenAPI document for each version, added consumer contract tests, announced a migration deadline, and measured calls by version. We also avoided putting internal release numbers into the URL; we created a new API version only for the breaking contract change.

As a result, partners migrated independently, we had no forced cutover, and we retired `v1` only after traffic had reached zero and the support window had ended.”

## 6. Code example

ASP.NET Core does not provide full API-version selection by itself. A common approach in modern ASP.NET Core applications is the `Asp.Versioning.Mvc` package, using the `Asp.Versioning` APIs rather than the older `Microsoft.AspNetCore.Mvc.Versioning` package.

```csharp
// Program.cs
using Asp.Versioning;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services
    .AddApiVersioning(options =>
    {
        options.DefaultApiVersion = new ApiVersion(1, 0);
        options.AssumeDefaultVersionWhenUnspecified = false;
        options.ReportApiVersions = true;
        options.ApiVersionReader = new UrlSegmentApiVersionReader();
    })
    .AddMvc();

var app = builder.Build();
app.MapControllers();
app.Run();
```

```csharp
using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[ApiVersion(1.0)]
[Route("api/v{version:apiVersion}/payments")]
public sealed class PaymentsV1Controller : ControllerBase
{
    [HttpGet("{id:guid}")]
    public IActionResult Get(Guid id) => Ok(new
    {
        id,
        amount = 125.50m
    });
}

[ApiController]
[ApiVersion(2.0)]
[Route("api/v{version:apiVersion}/payments")]
public sealed class PaymentsV2Controller : ControllerBase
{
    [HttpGet("{id:guid}")]
    public IActionResult Get(Guid id) => Ok(new
    {
        id,
        money = new { amount = 125.50m, currency = "NZD" }
    });
}
```

`UrlSegmentApiVersionReader` reads the version from the route. The `ApiVersion` attributes declare which contract each controller supports, and the `apiVersion` route constraint selects the correct controller. Requiring an explicit version avoids silently changing behavior for a client that omitted it.

In a real system, both controllers should call a shared service instead of containing business logic. Version-specific DTOs should remain at the API boundary.

## 7. Common mistakes

- Creating a new API version for every deployment or internal code change.
- Making a breaking change inside an existing version because the change looks small.
- Assuming that adding a required request field or a new enum value is always backward compatible.
- Copying the complete business layer for each version, which creates duplicated logic and inconsistent fixes.
- Supporting old versions forever without an owner, support policy, or retirement date.
- Deprecating a version without informing consumers or measuring which clients still use it.
- Returning different behavior for the same version without updating its contract tests and documentation.
- Defaulting an omitted version to the latest version, which can silently break older clients.
- Publishing one mixed OpenAPI document that does not clearly separate versioned contracts.

## 8. Follow-up interview questions

### Which versioning style would you choose?

For many public APIs, I choose URL versioning because it is explicit and operationally simple. I may choose header or media-type versioning when the organization already has strong standards and gateway support for it.

### What changes require a new API version?

Changes that can break an existing client require a new version. Examples are removing or renaming fields, changing data types or meanings, requiring previously optional input, and changing established status-code behavior.

### Can two API versions share the same business logic?

Yes. Keep version-specific request and response models at the transport boundary, map them to shared application commands or domain models, and reuse the core business services. This limits duplication while preserving each public contract.
