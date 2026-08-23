# 2. What makes a good REST API?

**Technology:** API Design and Integration Governance

**Source question:** 2. What makes a good REST API?

## 1. What is it?

A good REST API exposes business resources through clear URLs and uses standard HTTP behaviour consistently. For example, `/accounts/123/transactions` represents transactions for an account, while HTTP methods describe the action: `GET` reads, `POST` creates, `PUT` replaces, `PATCH` updates part of a resource, and `DELETE` removes it.

REST is an architectural style, not a strict protocol. A practical REST API should be easy to understand, predictable, stateless, secure, well documented, and safe to change over time.

## 2. Why is it important?

A well-designed API gives web, mobile, partner, and internal clients one consistent way to use a system. Developers can integrate faster because resource names, status codes, errors, pagination, and security work in a predictable way.

It also reduces production risk. Clear contracts prevent clients from depending on internal database details, stateless requests make horizontal scaling easier, and compatibility rules allow the server to evolve without unexpectedly breaking consumers.

For architects, a good REST API is also a governance boundary. It makes standards such as authentication, authorization, idempotency, observability, rate limiting, and versioning consistent across teams.

## 3. How does it work?

A typical request follows this flow:

1. The client sends an HTTPS request to a resource URI, including authentication and any required headers.
2. The API authenticates the caller, authorizes access to the resource, and validates the input.
3. The application layer runs the business rule. The controller or endpoint stays thin and does not contain core business logic.
4. The API returns a suitable HTTP status code, response headers, and a consistent JSON representation.
5. Logs, traces, and metrics record the request using a correlation or trace identifier without exposing secrets.

Important design qualities include:

- Resource-based, stable URLs using nouns rather than action names.
- Correct HTTP method semantics and status codes.
- Stateless requests; each request carries the context needed to process it.
- Consistent validation errors, ideally using RFC 9457 Problem Details.
- Pagination, filtering, and sorting for collections.
- Idempotency for operations that clients may safely retry, especially payments.
- Secure defaults: HTTPS, least-privilege authorization, input limits, and no sensitive data in URLs or logs.
- A documented, testable contract, commonly described with OpenAPI.
- Backward-compatible evolution, with explicit versioning only when a breaking change is unavoidable.

## 4. Practical example

Consider a payment API:

- `POST /api/v1/payments` creates a payment.
- The client supplies an `Idempotency-Key` so retrying after a timeout does not charge the customer twice.
- A valid request returns `201 Created`, a `Location` header such as `/api/v1/payments/pay_123`, and the payment representation.
- Invalid input returns `400 Bad Request` with Problem Details.
- An unknown payment returns `404 Not Found`.
- A valid request that violates a business rule, such as paying an already settled invoice, returns `409 Conflict`.
- `GET /api/v1/payments?customerId=42&cursor=abc&limit=50` returns a bounded, paginated collection.

The API never exposes card details in URLs, responses, or application logs. Authorization also checks that the caller is allowed to access the requested customer or payment; authentication alone is not enough.

## 5. Scenario-based interview answer

“In one payment platform, clients were calling action-style endpoints such as `/makePayment`, every team returned different error shapes, and mobile retries could create duplicate charges.

My decision was to define a resource-based contract and shared API standards before adding more consumers. We introduced `/payments` and `/payments/{id}`, documented the contract with OpenAPI, used normal HTTP status codes, and returned Problem Details consistently. For payment creation, we required an idempotency key and stored its result against the caller so the same request could return the original outcome rather than process twice. We also added OAuth-based authentication, resource-level authorization, request limits, correlation IDs, and contract tests.

The result was simpler client code, safer retries, fewer integration defects, and a contract that new teams could follow. I would describe that as a good REST API because it is not only clean at the URL level; it remains predictable, secure, observable, and evolvable in production.”

## 6. Code example

The following example uses ASP.NET Core minimal APIs and APIs available in supported modern .NET versions:

```csharp
using Microsoft.AspNetCore.Http.HttpResults;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddProblemDetails();
builder.Services.AddScoped<IPaymentService, PaymentService>();

var app = builder.Build();
app.UseExceptionHandler();
app.UseHttpsRedirection();

var payments = app.MapGroup("/api/v1/payments")
    .RequireAuthorization();

payments.MapPost("/", async Task<Results<Created<PaymentResponse>,
    ValidationProblem, Conflict<ProblemDetails>>>(
    CreatePaymentRequest request,
    HttpRequest httpRequest,
    IPaymentService service,
    CancellationToken cancellationToken) =>
{
    var errors = Validate(request);
    if (errors.Count > 0)
        return TypedResults.ValidationProblem(errors);

    if (!httpRequest.Headers.TryGetValue("Idempotency-Key", out var key) ||
        string.IsNullOrWhiteSpace(key))
    {
        return TypedResults.ValidationProblem(new Dictionary<string, string[]>
        {
            ["Idempotency-Key"] = ["The Idempotency-Key header is required."]
        });
    }

    var result = await service.CreateAsync(request, key.ToString(), cancellationToken);

    if (result.IsConflict)
    {
        return TypedResults.Conflict(new ProblemDetails
        {
            Title = "Payment conflict",
            Detail = result.Error,
            Status = StatusCodes.Status409Conflict
        });
    }

    return TypedResults.Created($"/api/v1/payments/{result.Payment!.Id}",
        result.Payment);
});

app.Run();

static Dictionary<string, string[]> Validate(CreatePaymentRequest request) =>
    request.Amount <= 0
        ? new() { ["amount"] = ["Amount must be greater than zero."] }
        : new();

public sealed record CreatePaymentRequest(decimal Amount, string Currency);
public sealed record PaymentResponse(Guid Id, decimal Amount, string Currency,
    string Status);
```

The endpoint uses a resource URL, requires authorization, validates input, accepts cancellation, requires an idempotency key, and returns typed results with meaningful status codes. In a real system, the service would persist the idempotency key and payment result atomically. Authentication, rate limiting, persistence, and service implementations are omitted to keep the example focused.

## 7. Common mistakes

- Designing URLs as remote procedure calls, such as `/getCustomer` or `/approvePayment`, without considering resources and HTTP semantics.
- Returning `200 OK` for every outcome instead of meaningful status codes.
- Using `POST` for all operations or assuming every `PUT`/`DELETE` implementation is automatically idempotent.
- Exposing database entities directly, which leaks internal fields and tightly couples clients to the schema.
- Creating breaking response changes without compatibility checks or a migration plan.
- Returning different error formats from different endpoints, or leaking stack traces and sensitive details.
- Loading an entire collection instead of using bounded pagination.
- Treating authentication as authorization and failing to check access to the specific resource.
- Retrying payment creation without an idempotency design.
- Logging tokens, personal data, card data, or request bodies without redaction.
- Publishing OpenAPI documentation that is incomplete or no longer matches runtime behaviour.

## 8. Follow-up interview questions

### What is the difference between `PUT` and `PATCH`?

`PUT` normally replaces the complete resource representation at a known URI and should be idempotent. `PATCH` applies a partial update. The API must clearly document the supported patch format and validation rules.

### How should a REST API handle versioning?

Prefer backward-compatible additions first. When a breaking change is necessary, use a clear strategy such as a URL or header version, support an agreed migration period, publish deprecation information, and monitor remaining consumers before retiring the old version.

### How do you make a payment API safe to retry?

Require a client-generated idempotency key, scope it to the caller and operation, and store the key, request fingerprint, and outcome atomically. Reusing the key with the same request returns the original result; reusing it with different input should be rejected.
