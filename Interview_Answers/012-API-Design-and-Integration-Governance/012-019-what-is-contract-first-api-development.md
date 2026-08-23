# 19. What is contract-first API development?

**Technology:** API Design and Integration Governance

**Source question:** 19. What is contract-first API development?

## 1. What is it?

Contract-first API development means defining and agreeing on the API contract before writing the API implementation.

The contract normally uses OpenAPI and describes the API's public behaviour, including:

- Paths and HTTP methods.
- Request headers, parameters, and bodies.
- Response bodies and HTTP status codes.
- Field types, required fields, validation rules, and examples.
- Authentication and a standard error format.

After consumers and providers review the contract, teams can generate documentation, mock servers, clients, and sometimes server stubs from it. The contract is the shared source of truth; it is not just documentation created after the code is finished.

## 2. Why is it important?

Contract-first development finds design problems while they are still cheap to fix. A frontend, mobile application, or another service can confirm that the API supports its needs before the provider spends time implementing it.

It also helps teams to:

- Work in parallel by using mocks and generated clients.
- Agree on naming, validation, errors, null values, dates, money, pagination, and security.
- Reduce integration surprises at the end of a sprint.
- Detect breaking changes during pull requests and CI builds.
- Keep implementations consistent across different teams and technologies.
- Separate the public API from database and domain models.

For architects, it provides practical governance: important rules become reviewable and testable instead of existing only in documents or people's memory.

## 3. How does it work?

A common flow is:

1. The provider and consumers discuss the business operation and failure cases.
2. They write an OpenAPI document with schemas, operations, status codes, security rules, and realistic examples.
3. Both sides review and approve the proposed contract in source control.
4. A mock server is created from the contract so consumers can begin integration.
5. Tools generate client code and, where useful, server interfaces or stubs.
6. The provider implements the business logic behind the agreed interface.
7. Automated tests verify that the real API matches the contract.
8. CI compares contract changes and blocks accidental breaking changes.
9. The published OpenAPI document is versioned and released with the service.

Code generation is optional. The essential rule is that the reviewed contract leads the implementation. If generated code is used, teams regenerate it from the contract rather than editing it manually.

Contract-first differs from code-first development. In code-first, the team writes controllers or endpoints first and generates an OpenAPI document from running code. Code-first can work well for small or internal APIs, but contract-first is often better when several independent consumers need to agree and work in parallel.

## 4. Practical example

A payment platform needs a new operation: `POST /api/v1/payments`.

Before implementation, the web, mobile, and payment-service teams agree on an OpenAPI contract. It defines an `Idempotency-Key` header, the amount as a decimal value with an ISO currency code, and these outcomes:

- `201 Created` when a payment is accepted.
- `400 Bad Request` for invalid input.
- `409 Conflict` when the request conflicts with an existing payment.
- `422 Unprocessable Content` when a business rule prevents the payment.
- A consistent `ProblemDetails` body for errors.

The consumer teams use a mock endpoint and generated clients while the payment team builds the real service. Contract tests later confirm that the implementation returns the agreed status codes and response shapes. This prevents each client from making different assumptions about payment states and errors.

## 5. Scenario-based interview answer

**Problem:** “In a distributed banking project, three client teams depended on a new payment API. Previously, each team worked from a ticket, so field names, validation rules, and error responses were interpreted differently. Most issues appeared during integration.”

**Decision:** “I introduced a contract-first approach. We agreed that the reviewed OpenAPI file would be the source of truth before implementation began.”

**Implementation:** “I ran a short design review with the API provider, consumers, security, and product owner. We defined request and response schemas, idempotency, authorization, examples, and all important failure responses. We stored the contract in source control, generated typed clients and a mock service, and added compatibility and implementation checks to CI. The API implementation used separate DTOs so internal domain changes did not leak into the public contract.”

**Result:** “The teams developed in parallel, integration defects fell, and breaking changes became visible during pull-request review rather than after deployment. Consumers also had a clear migration path whenever a new API version was required.”

## 6. Code example

Assume an approved OpenAPI contract has generated an `IPaymentsClient` and its request and response DTOs. Application code can depend on that generated contract:

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient<IPaymentsClient, PaymentsClient>(client =>
{
    client.BaseAddress = new Uri(
        builder.Configuration["PaymentsApi:BaseUrl"]!);
});

var app = builder.Build();

app.MapPost("/checkout", async (
    CheckoutRequest checkout,
    IPaymentsClient payments,
    CancellationToken cancellationToken) =>
{
    var request = new CreatePaymentRequest
    {
        OrderId = checkout.OrderId,
        Amount = checkout.Amount,
        Currency = checkout.Currency
    };

    var idempotencyKey = $"checkout-{checkout.OrderId}";
    var payment = await payments.CreatePaymentAsync(
        idempotencyKey,
        request,
        cancellationToken);

    return Results.Ok(new { payment.Id, payment.Status });
});

app.Run();

public sealed record CheckoutRequest(
    Guid OrderId,
    decimal Amount,
    string Currency);
```

Important parts:

- `IPaymentsClient`, `PaymentsClient`, and `CreatePaymentRequest` are generated from the approved OpenAPI contract by a tool such as NSwag or Kiota.
- The generated client owns HTTP serialization and the contract's data types, which avoids handwritten client differences.
- `HttpClient` is created through `IHttpClientFactory`, so connection management and cross-cutting handlers can be configured centrally.
- The idempotency key follows the agreed payment contract.
- Generated files should not be edited manually; change the OpenAPI document, review it, and regenerate the client.

This pattern works with supported .NET versions such as .NET 8 LTS and later. Exact generation commands and generated method signatures depend on the selected tool and its version, so they should be pinned in the build.

## 7. Common mistakes

- Calling an API “contract-first” when the OpenAPI file is generated only after implementation.
- Designing the contract without involving real consumers.
- Describing only successful responses and ignoring validation, authorization, conflicts, and server errors.
- Leaving required versus optional fields, null handling, formats, and validation limits unclear.
- Exposing database entities directly as public API schemas.
- Treating generated clients or server stubs as business logic.
- Manually editing generated code instead of changing the source contract.
- Assuming a mock proves that the real implementation follows the contract.
- Changing an existing contract without a breaking-change check, versioning decision, or consumer migration plan.
- Letting the review process become a slow central approval queue instead of using clear standards and accountable owners.

## 8. Follow-up interview questions

### What is the difference between contract-first and code-first?

Contract-first begins with a reviewed API specification and implements code from it. Code-first begins with application code and generates the specification afterward. Contract-first gives consumers earlier input and is usually stronger for parallel development and governance.

### Does contract-first mean all code must be generated?

No. Generation is helpful for models, clients, interfaces, mocks, and documentation, but business logic is still written by developers. A team can also implement the contract manually as long as automated tests prove that the implementation matches it.

### How do you prevent the contract and implementation from drifting apart?

Keep the contract in source control, pin generation tools, regenerate artifacts in the build, run implementation and consumer contract tests, and use an OpenAPI compatibility check in CI. Publish the same approved contract with the deployed API.
