# 1. How do you design a REST API?

**Technology:** API Design and Integration Governance

**Source question:** 1. How do you design a REST API?

## 1. What is it?

Designing a REST API means defining a clear HTTP contract that lets clients work with business resources such as customers, accounts, or payments.

A good REST API usually:

- Uses resource-based URLs, such as `/api/accounts/123/transactions`.
- Uses HTTP methods for actions: `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`.
- Returns meaningful HTTP status codes and consistent JSON responses.
- Is stateless: every request contains the information needed to process it.
- Has clear rules for validation, security, versioning, filtering, pagination, and errors.

REST is an architectural style, not a strict protocol. The goal is a predictable API, not simply an HTTP wrapper around database tables.

## 2. Why is it important?

A well-designed API gives web applications, mobile applications, partners, and internal services a stable way to communicate.

It is important because it:

- Reduces client-side guesswork through consistent URLs, status codes, and response shapes.
- Keeps the public contract separate from internal database and domain models.
- Makes security, monitoring, testing, and documentation easier.
- Allows the implementation to change without breaking consumers.
- Supports safe growth through versioning, pagination, idempotency, and backward-compatible changes.

For architects, API design is also a governance concern. Shared standards prevent every team from implementing authentication, errors, naming, and versioning differently.

## 3. How does it work?

I normally design a REST API in this order:

1. **Understand the use cases.** Identify consumers, business operations, expected traffic, security needs, and service-level expectations.
2. **Model business resources.** Use nouns such as `customers`, `accounts`, and `payments`. Avoid RPC-style URLs such as `/createPayment` when `POST /payments` expresses the same operation.
3. **Define operations and semantics.** For example, `GET` reads, `POST` creates or starts processing, `PUT` replaces, `PATCH` partially updates, and `DELETE` removes when deletion is valid.
4. **Define the contract first.** Specify request and response DTOs, validation rules, status codes, headers, and examples in OpenAPI.
5. **Design errors consistently.** In ASP.NET Core, RFC 7807-style `ProblemDetails` is a practical standard for machine-readable errors.
6. **Add cross-cutting controls.** Apply authentication, authorization, input limits, rate limiting, correlation IDs, structured logging, metrics, and audit rules.
7. **Plan for scale and reliability.** Use pagination for collections, caching where safe, timeouts, and idempotency keys for retryable create operations such as payments.
8. **Manage change.** Prefer backward-compatible additions. Introduce a new version only for an unavoidable breaking contract change, and publish a deprecation period.
9. **Test the contract.** Use unit, integration, security, and consumer contract tests before publishing the API.

A typical request flows through the gateway or load balancer, authentication and authorization, validation, the application service, the domain and data layers, and finally response mapping. The API returns a DTO and the correct HTTP status; it should not expose internal entities or exception details.

## 4. Practical example

Consider a payment API:

- `POST /api/v1/payments` submits a payment.
- `GET /api/v1/payments/{paymentId}` returns its current status.
- `GET /api/v1/accounts/{accountId}/payments?cursor=...&limit=50` returns a paged list.

The create request contains the source account, destination, amount, currency, and an idempotency key. The API validates the request and the caller's permission, stores the payment, and returns `201 Created` with a `Location` header when the payment resource is created immediately. If processing is asynchronous, `202 Accepted` may be more accurate.

If a client retries the same request after a timeout, the idempotency key ensures that the service returns the original result instead of creating a second payment. Invalid input returns `400 Bad Request`, missing authentication returns `401 Unauthorized`, insufficient permission returns `403 Forbidden`, and an unknown payment returns `404 Not Found`.

## 5. Scenario-based interview answer

**Problem:** “In one project, mobile and partner applications used a payment API, but endpoints were inconsistent and client retries sometimes created duplicate payments.”

**Decision:** “I designed the API around payment resources and wrote the OpenAPI contract before implementation. I standardized status codes and `ProblemDetails`, and required an idempotency key for payment creation. I also kept external DTOs separate from domain and database models.”

**Implementation:** “We used `POST /api/v1/payments` to create a payment and `GET /api/v1/payments/{id}` to check it. Authentication used OAuth 2.0 access tokens, while authorization checked account ownership and payment permissions. We stored each idempotency key with a request fingerprint and result, added cursor pagination for payment history, and used correlation IDs, audit logs, metrics, and rate limiting. Contract and integration tests protected the published behavior.”

**Result:** “Retries became safe, client integration was simpler, and support teams could trace requests end to end. We could also change the internal payment workflow without breaking consumers because the public contract was independent of the domain model.”

## 6. Code example

The following example uses ASP.NET Core Minimal APIs available in supported modern .NET versions, including .NET 8 and later:

```csharp
using Microsoft.AspNetCore.Http.HttpResults;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddProblemDetails();
builder.Services.AddScoped<IPaymentService, PaymentService>();

var app = builder.Build();
app.UseExceptionHandler();

var payments = app.MapGroup("/api/v1/payments")
    .RequireAuthorization();

payments.MapPost("/", async Task<Results<CreatedAtRoute<PaymentResponse>,
        ValidationProblem>> (
    CreatePaymentRequest request,
    IPaymentService service,
    CancellationToken cancellationToken) =>
{
    var errors = Validate(request);
    if (errors.Count > 0)
        return TypedResults.ValidationProblem(errors);

    var payment = await service.CreateAsync(request, cancellationToken);

    return TypedResults.CreatedAtRoute(
        payment,
        routeName: "GetPayment",
        routeValues: new { paymentId = payment.Id });
});

payments.MapGet("/{paymentId:guid}", async Task<Results<Ok<PaymentResponse>,
        NotFound>> (
    Guid paymentId,
    IPaymentService service,
    CancellationToken cancellationToken) =>
{
    var payment = await service.GetAsync(paymentId, cancellationToken);
    return payment is null
        ? TypedResults.NotFound()
        : TypedResults.Ok(payment);
}).WithName("GetPayment");

app.Run();

static Dictionary<string, string[]> Validate(CreatePaymentRequest request)
{
    var errors = new Dictionary<string, string[]>();

    if (request.Amount <= 0)
        errors[nameof(request.Amount)] = ["Amount must be greater than zero."];

    if (string.IsNullOrWhiteSpace(request.Currency))
        errors[nameof(request.Currency)] = ["Currency is required."];

    return errors;
}

public sealed record CreatePaymentRequest(
    Guid SourceAccountId,
    string DestinationAccount,
    decimal Amount,
    string Currency);

public sealed record PaymentResponse(
    Guid Id,
    decimal Amount,
    string Currency,
    string Status);
```

Important points:

- The route represents a `payments` resource and is versioned explicitly.
- Request and response DTOs protect the external contract from internal model changes.
- Typed results document the possible success and error outcomes clearly.
- `CreatedAtRoute` returns `201 Created` and a `Location` header for the new resource.
- Authorization is applied to the route group, and the cancellation token is passed to downstream work.

In a production payment API, the create endpoint should also read and validate an idempotency key, enforce account-level authorization, and persist the payment and idempotency record safely.

## 7. Common mistakes

- Designing endpoints around controller methods or database tables instead of business resources.
- Returning `200 OK` for every outcome rather than using correct HTTP status codes.
- Exposing database entities, internal IDs, stack traces, or sensitive data directly.
- Breaking existing clients by renaming or removing fields without a versioning and deprecation plan.
- Allowing unbounded collection queries instead of using pagination and maximum page sizes.
- Retrying payment creation without idempotency protection.
- Confusing `401 Unauthorized` with `403 Forbidden`: `401` means valid authentication is missing; `403` means the authenticated caller lacks permission.
- Relying only on API documentation and skipping contract, authorization, failure, and load tests.
- Logging access tokens, personal data, card details, or other secrets.

## 8. Follow-up interview questions

### How do you version a REST API?

Prefer backward-compatible changes first. For a real breaking change, publish a new version using a consistent approach such as a URL segment or header, support both versions during migration, and communicate a deprecation date.

### How do you make a payment creation endpoint safe to retry?

Require an idempotency key. Store it with a fingerprint of the request and the original result. Repeated identical requests return the same result, while reuse of the key with different content is rejected.

### What is the difference between `PUT` and `PATCH`?

`PUT` normally replaces the complete resource representation and is idempotent. `PATCH` applies a partial change. Both need clear validation and concurrency rules, often using an ETag or version value to prevent lost updates.
