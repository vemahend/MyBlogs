# 20. What is OpenAPI?

**Technology:** API Design and Integration Governance

**Source question:** 20. What is OpenAPI?

## 1. What is it?

OpenAPI is a standard way to describe an HTTP API in a machine-readable document. The document is usually JSON or YAML and explains:

- Available URLs and HTTP methods.
- Request parameters, headers, and body schemas.
- Response status codes and body schemas.
- Authentication and authorization schemes.
- Validation rules, descriptions, and examples.

It acts as a contract that both people and tools can understand. OpenAPI is the specification; Swagger is a group of tools originally built around that specification. The names are often used as if they mean the same thing, but they are not exactly the same.

OpenAPI 3.0 and 3.1 are common in existing systems. OpenAPI 3.2 is the newer specification line, but a team should choose a version supported by all its documentation, validation, and code-generation tools.

## 2. Why is it important?

Without a clear API contract, consumers may guess field names, data types, validation rules, error formats, or security requirements. This causes integration defects and repeated discussions between teams.

OpenAPI helps teams to:

- Give developers accurate, interactive API documentation.
- Review an API before or during implementation.
- Generate typed client code and server stubs.
- Create mock servers so consumers can start early.
- Validate requests, responses, and contract changes.
- Detect breaking changes in CI.
- Apply common rules for security, errors, naming, pagination, and versioning.

For architects, it makes API governance practical because the contract can be stored in source control, reviewed, tested, and released with the service.

## 3. How does it work?

An OpenAPI document starts with an `openapi` version and basic API information. Its main sections describe paths, operations, reusable schemas, and security schemes.

A typical flow is:

1. The API team writes the document first, or generates it from endpoint metadata in code.
2. Each operation describes its inputs, possible responses, security requirements, and data schemas.
3. Tools read the document to render documentation, generate clients, create mocks, or run validation tests.
4. Consumers use the published document to understand and call the API.
5. CI compares a proposed document with the released version and reports breaking changes.

OpenAPI describes the API contract; it does not implement business logic, guarantee that the running API follows the document, or secure an endpoint by itself. Contract tests and runtime security are still required.

## 4. Practical example

A bank exposes `POST /api/payments` to mobile and web applications. Its OpenAPI contract defines:

- An OAuth 2.0 bearer token.
- A required `Idempotency-Key` header.
- A request containing the account, amount, currency, and payee.
- `201 Created` for a successful payment.
- `400 Bad Request`, `401 Unauthorized`, `409 Conflict`, and `422 Unprocessable Content` error responses.
- A shared `ProblemDetails` error schema.

The mobile team generates a typed client from the contract, while testers create negative tests from the documented responses. Before release, CI detects if the payment team accidentally removes a required response property. This prevents an unnoticed breaking change from reaching production.

## 5. Scenario-based interview answer

**Problem:** “On a payment platform, several consuming teams used manually maintained wiki pages. The pages became outdated, and consumers made different assumptions about validation and error responses.”

**Decision:** “I made the OpenAPI document the reviewed API contract and stored it with the service in source control.”

**Implementation:** “We documented every operation, request and response schema, authentication requirement, idempotency header, and important failure response. We published the document through the API gateway, generated typed clients where useful, and added linting and breaking-change checks to CI. We also added integration tests to confirm that the implementation matched the contract. Production access to API documentation was controlled separately from access to the API itself.”

**Result:** “Frontend and service teams could work in parallel, integration defects reduced, and breaking changes were found during pull-request review rather than after deployment. The contract also gave security and architecture teams a consistent artifact to review.”

## 6. Code example

ASP.NET Core includes OpenAPI document generation. In a .NET 10 minimal API, the core setup can be concise:

```csharp
using System.ComponentModel.DataAnnotations;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi(); // Default document: /openapi/v1.json
}

app.MapPost("/api/payments", (
    CreatePaymentRequest request) =>
{
    var payment = new PaymentResponse(
        Guid.NewGuid(),
        "Accepted");

    return Results.Created(
        $"/api/payments/{payment.Id}",
        payment);
})
.WithName("CreatePayment")
.WithSummary("Creates a payment")
.Produces<PaymentResponse>(StatusCodes.Status201Created)
.ProducesValidationProblem();

app.Run();

public sealed record CreatePaymentRequest(
    [property: Required] string AccountId,
    [property: Range(0.01, 1_000_000)] decimal Amount,
    [property: Required, StringLength(3, MinimumLength = 3)]
    string Currency);

public sealed record PaymentResponse(Guid Id, string Status);
```

Important parts:

- `AddOpenApi()` registers the built-in ASP.NET Core document generator.
- `MapOpenApi()` exposes the generated document. Limiting it to development avoids publishing internal API details accidentally; another controlled approach can be used when consumers need the document in production.
- Endpoint metadata such as `WithSummary`, `Produces`, validation attributes, and request and response types becomes part of the document.
- In .NET 10, the built-in generator produces OpenAPI 3.1 by default. Exact defaults and customization APIs depend on the target .NET version.
- This generates the description from code, but tests should still verify that real behavior and documented responses agree.

## 7. Common mistakes

- Saying OpenAPI and Swagger are exactly the same thing.
- Documenting only successful responses and ignoring validation, authorization, conflict, and server errors.
- Generating a document but never checking whether the running API follows it.
- Exposing database entities directly instead of stable API request and response DTOs.
- Publishing sensitive examples, internal host names, or unrestricted documentation endpoints.
- Defining an OAuth or API-key scheme in OpenAPI and assuming that this secures the API.
- Making a breaking contract change without versioning, compatibility checks, or a consumer migration plan.
- Generating clients manually and allowing generated code to become stale.
- Upgrading the OpenAPI version before confirming that gateways and code generators support it.

## 8. Follow-up interview questions

### What is the difference between OpenAPI and Swagger?

OpenAPI is the standard that describes HTTP APIs. Swagger is a set of tools, such as Swagger UI, that can create, display, or work with OpenAPI documents.

### What is the difference between code-first and contract-first OpenAPI?

Code-first generates the document from controllers or endpoint metadata. Contract-first creates and reviews the OpenAPI document before implementation. Both can work, but contract-first is often useful when independent teams must agree and develop in parallel.

### Does OpenAPI replace API testing?

No. It describes the expected interface. Teams still need unit, integration, security, consumer contract, and end-to-end tests to prove that the implementation behaves correctly.
