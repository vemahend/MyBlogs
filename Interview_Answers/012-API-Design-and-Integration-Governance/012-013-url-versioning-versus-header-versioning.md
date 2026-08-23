# 13. URL versioning versus header versioning?

**Technology:** API Design and Integration Governance

**Source question:** 13. URL versioning versus header versioning?

## 1. What is it?

URL versioning and header versioning are two ways for a client to tell an API which contract it wants.

With **URL versioning**, the version is part of the address:

```http
GET /api/v1/payments/123
GET /api/v2/payments/123
```

With **header versioning**, the URL stays the same and the version is sent in an HTTP request header:

```http
GET /api/payments/123
X-Api-Version: 2.0
```

Both approaches can support the same versioned behavior. The main difference is where the client supplies the version and how visible that choice is to developers, gateways, caches, logs, and support teams.

## 2. Why is it important?

Clients cannot always upgrade at the same time. An API may need to support an old contract while introducing a breaking change in a new contract.

The versioning style affects daily development and production support:

- URL versions are easy to see, test, document, route, and search for in logs.
- Header versions keep resource URLs clean and stable.
- Header versions require tools, gateways, caches, and monitoring to preserve and record the version header correctly.
- A poor or inconsistent choice can cause the wrong contract to be selected or cached.

For many public or partner APIs, URL versioning is the practical default because it is explicit. Header versioning can work well for controlled internal APIs where the organization has mature gateway and observability standards.

## 3. How does it work?

For URL versioning, the flow is:

1. The client calls a route such as `/api/v2/payments/123`.
2. The router reads `v2` from the URL.
3. The API selects the endpoint that supports version 2.
4. That endpoint maps the shared payment data to the version 2 response contract.

For header versioning, the flow is similar:

1. The client calls `/api/payments/123` and sends `X-Api-Version: 2.0`.
2. Versioning middleware reads the header.
3. The API selects the endpoint that supports version 2.
4. The response uses the version 2 contract.

Important operational differences are:

| Area | URL versioning | Header versioning |
|---|---|---|
| Visibility | Version is obvious in the URL | Version is hidden in request metadata |
| Browser and manual testing | Simple | Requires adding a header |
| Routing and gateway rules | Usually straightforward | Gateway must inspect and forward the header |
| Caching | Different URLs naturally produce different cache keys | Cache must vary by the version header |
| URL stability | URL changes between versions | Resource URL remains stable |
| Documentation | Easy to show separate versioned URLs | Header requirement must be clearly documented |

A custom header such as `X-Api-Version` is simple to understand. Another header-based option is media-type versioning, for example `Accept: application/vnd.example.payment-v2+json`, but that is more complex and should be used only when there is a clear organizational standard.

## 4. Practical example

A bank has a payment details API. Version 1 returns a flat amount:

```json
{ "paymentId": "123", "amount": 250.00 }
```

Version 2 returns a money object so that it can support multiple currencies:

```json
{ "paymentId": "123", "money": { "amount": 250.00, "currency": "NZD" } }
```

For external banking partners, the team chooses `/api/v1/payments/123` and `/api/v2/payments/123`. Partners can see the selected contract in their configuration and support staff can identify it directly from gateway logs.

If this were an internal API behind a gateway that already enforced `X-Api-Version`, header versioning could be reasonable. The gateway would need to forward that header, include it in logs, and use it in any cache key so that a version 1 response is never returned to a version 2 request.

## 5. Scenario-based interview answer

“On a payment platform, we needed a new response contract that included amount and currency, but existing partners expected the old flat amount response.

The problem was not only supporting two contracts; we also had to choose a versioning style that partners and support teams could use reliably. I compared URL and header versioning. Header versioning gave us cleaner URLs, but the version was less visible and required every gateway, cache, test tool, and monitoring rule to handle the custom header correctly.

I chose URL versioning for the partner API because it was explicit and operationally simpler. We exposed `/api/v1/payments/{id}` and `/api/v2/payments/{id}`, kept separate DTOs and OpenAPI documents, and reused the same application service underneath. We measured traffic by URL version and gave partners a clear migration and retirement date.

As a result, both contracts ran safely during migration, support teams could identify the requested version immediately, and we retired version 1 after its traffic reached zero. For a controlled internal API with strong gateway standards, I would still consider header versioning, but I would make the cache and observability requirements part of the design.”

## 6. Code example

ASP.NET Core does not include complete API-version selection by default. A common current option is the `Asp.Versioning.Mvc` package. The maintained namespaces use `Asp.Versioning`; older examples using `Microsoft.AspNetCore.Mvc.Versioning` refer to the previous package line.

The following configuration uses URL versioning:

```csharp
using Asp.Versioning;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services
    .AddApiVersioning(options =>
    {
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
    public IActionResult Get(Guid id) =>
        Ok(new { paymentId = id, amount = 250.00m });
}

[ApiController]
[ApiVersion(2.0)]
[Route("api/v{version:apiVersion}/payments")]
public sealed class PaymentsV2Controller : ControllerBase
{
    [HttpGet("{id:guid}")]
    public IActionResult Get(Guid id) => Ok(new
    {
        paymentId = id,
        money = new { amount = 250.00m, currency = "NZD" }
    });
}
```

To use header versioning instead, change the reader and remove the version segment from both controller routes:

```csharp
options.ApiVersionReader = new HeaderApiVersionReader("X-Api-Version");

// On both controllers:
[Route("api/payments")]
```

The client would then send `X-Api-Version: 1.0` or `X-Api-Version: 2.0`. Requiring an explicit version avoids silently giving an unversioned client a contract it did not request. With header versioning, the gateway must forward the header, and shared caches must include it in their cache key or correctly honor an appropriate `Vary` policy.

In production, both controllers should call the same application service. Only the API DTOs and mapping should differ where the public contracts differ.

## 7. Common mistakes

- Choosing header versioning for clean URLs without considering gateways, caches, logs, and test tools.
- Allowing a proxy or API gateway to remove the version header.
- Caching responses only by URL when the response also depends on a version header.
- Defaulting a missing version to the latest version, which can silently break clients.
- Supporting both URL and header versioning without defining what happens when they conflict.
- Treating every deployment as a new API version instead of versioning only contract-breaking changes.
- Duplicating business logic for each version instead of sharing application and domain services.
- Publishing unclear documentation that does not show the URL or required header for every version.
- Keeping old versions forever without usage monitoring, a deprecation policy, or a retirement date.

## 8. Follow-up interview questions

### Which approach would you normally choose for a public API?

I normally choose URL versioning because it is visible and simple for consumers, routing, documentation, and production support. I would follow an established organization-wide standard if it already solves those concerns well.

### Is header versioning more RESTful?

Some teams prefer it because the resource URL stays stable and representation details can be negotiated through headers. However, “more RESTful” does not automatically mean better for a particular system. Reliability, consumer experience, caching, and operational support matter more.

### Can an API support both URL and header versioning?

Yes, version readers can be combined, but it increases ambiguity. The API must reject conflicting values and documentation must be very clear. In most systems, one consistent approach is easier to govern and support.
