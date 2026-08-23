# 18. How do frontend and backend teams agree on an API contract?

**Technology:** API Design and Integration Governance

**Source question:** 18. How do frontend and backend teams agree on an API contract?

## 1. What is it?

An API contract is the agreed description of how a frontend and a backend communicate. It defines:

- Endpoints and HTTP methods.
- Request parameters, headers, and JSON bodies.
- Response fields, data types, and status codes.
- Validation rules and a consistent error format.
- Authentication, authorization, pagination, and versioning rules.

The teams normally record this agreement in an OpenAPI document and review it before implementation. The contract describes externally visible behaviour; it should not expose backend database entities or internal implementation details.

Agreement is a shared activity. The backend team should not publish an API in isolation, and the frontend team should not assume fields or behaviour that are not in the contract.

## 2. Why is it important?

A clear contract removes guesswork and lets both teams work in parallel. The frontend can build against a mock server while the backend implements the real endpoint.

It also:

- Finds missing fields and unclear workflows before code is expensive to change.
- Prevents disagreements about names, null values, dates, errors, and status codes.
- Makes the API testable and easier to document.
- Reduces integration defects near the end of a sprint.
- Protects consumers when the backend changes internally.
- Provides a basis for automated contract and compatibility checks in CI.

For a senior developer or architect, the important point is governance without unnecessary delay: agree on shared standards, give consumers a review path, automate checks, and keep ownership clear.

## 3. How does it work?

A practical contract-first flow is:

1. **Discuss the user journey.** Frontend, backend, product, and security clarify what the screen or client must do, including failure and loading states.
2. **Draft the contract.** Define the OpenAPI paths, operations, schemas, examples, validation constraints, status codes, and error responses.
3. **Review both sides.** Frontend confirms that the data supports the user experience. Backend confirms that the behaviour is secure, valid, and practical to implement.
4. **Resolve details explicitly.** Agree on naming, optional versus nullable fields, date and money formats, pagination, concurrency, idempotency, and authorization.
5. **Approve and store it.** Keep the OpenAPI file in source control, with named owners and pull-request review.
6. **Develop in parallel.** The frontend uses examples, a mock server, or a generated client. The backend implements the approved contract.
7. **Verify automatically.** Backend integration tests prove that responses match the schema. Consumer contract tests protect important frontend expectations. CI detects breaking changes.
8. **Manage change.** Prefer additive, backward-compatible changes. For a breaking change, agree on a new version and migration period rather than silently changing the existing contract.

OpenAPI describes the HTTP interface, while consumer-driven contract tests verify the behaviour that a particular consumer really depends on. They complement each other rather than replace each other.

## 4. Practical example

Suppose a banking web application needs to show a customer's recent transactions. The teams agree on:

- `GET /api/v1/accounts/{accountId}/transactions?cursor=...&limit=25`.
- Amounts represented as decimal JSON numbers plus a three-letter currency code.
- Timestamps represented as UTC ISO 8601 strings.
- A response containing `items` and `nextCursor`.
- `401` when authentication is missing, `403` when the user cannot access the account, and `404` when the account is not visible to that user.
- Errors represented consistently with `ProblemDetails`.

The frontend reviews example responses and notices that it needs a transaction description and display category. Those fields are added during design rather than discovered during final integration. The frontend then develops against a mock generated from OpenAPI while the backend builds and tests the endpoint.

## 5. Scenario-based interview answer

**Problem:** “On one project, the React team and the .NET team developed from separate tickets. During integration, field names, nullable values, and error responses did not match, so each release required rework.”

**Decision:** “I introduced a contract-first workflow. For each API change, both teams reviewed an OpenAPI proposal and realistic request, success, and error examples before implementation started.”

**Implementation:** “We kept the OpenAPI document in source control and made frontend and backend owners reviewers. The frontend used a mock API and a generated TypeScript client, while the backend used DTOs rather than exposing domain entities. We added ASP.NET Core integration tests, consumer contract tests for critical behaviours, and a CI compatibility check that blocked accidental breaking changes. Optional and nullable fields, money and date formats, authorization outcomes, and pagination were explicitly documented.”

**Result:** “Both teams could work in parallel, integration defects dropped, and contract changes became visible in pull requests. When a breaking change was unavoidable, we introduced a new version and migrated the frontend safely instead of changing production behaviour without warning.”

## 6. Code example

This ASP.NET Core Minimal API example uses typed results and explicit DTOs so the implementation stays aligned with the agreed contract. The APIs shown are available in supported modern .NET versions, including .NET 8 and later.

```csharp
using Microsoft.AspNetCore.Http.HttpResults;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOpenApi();
builder.Services.AddScoped<ITransactionService, TransactionService>();

var app = builder.Build();
app.MapOpenApi();

app.MapGet(
    "/api/v1/accounts/{accountId:guid}/transactions",
    async Task<Results<Ok<TransactionPage>, NotFound, ForbidHttpResult>> (
        Guid accountId,
        string? cursor,
        int? limit,
        ITransactionService service,
        CancellationToken cancellationToken) =>
    {
        var pageSize = Math.Clamp(limit ?? 25, 1, 100);
        var result = await service.GetPageAsync(
            accountId, cursor, pageSize, cancellationToken);

        return result.Status switch
        {
            TransactionQueryStatus.Forbidden => TypedResults.Forbid(),
            TransactionQueryStatus.NotFound => TypedResults.NotFound(),
            _ => TypedResults.Ok(result.Page!)
        };
    })
    .RequireAuthorization()
    .WithName("GetAccountTransactions")
    .WithSummary("Returns a cursor-paged transaction list");

app.Run();

public sealed record TransactionPage(
    IReadOnlyList<TransactionItem> Items,
    string? NextCursor);

public sealed record TransactionItem(
    Guid Id,
    decimal Amount,
    string Currency,
    DateTimeOffset BookedAt,
    string Description);
```

Important parts:

- Dedicated DTOs keep the public contract separate from internal domain and database models.
- Typed results make the possible HTTP outcomes clear to code readers and OpenAPI tooling.
- The route constrains `accountId` to a GUID, and the page size has a safe maximum.
- `DateTimeOffset` preserves the timestamp offset; the published contract should still state that timestamps are returned in UTC.
- `AddOpenApi` and `MapOpenApi` are built-in OpenAPI support in .NET 9 and later. In .NET 8, a supported third-party package such as Swashbuckle or NSwag is commonly used to publish the document.

The code alone is not the agreement. CI should also compare the generated document with the approved contract and run integration or consumer contract tests.

## 7. Common mistakes

- Starting frontend and backend implementation before agreeing on the user flow and contract.
- Treating a generated OpenAPI document as automatically correct without consumer review.
- Documenting only successful responses and ignoring validation, authentication, authorization, and server errors.
- Leaving optional, missing, empty, and `null` values undefined.
- Using binary floating-point types for money or using local-time strings without an agreed time-zone rule.
- Exposing database entities directly, which couples consumers to internal changes.
- Generating clients but manually editing the generated code.
- Relying only on mocks; a mock can follow the specification even when the real service does not.
- Making breaking changes to an existing contract without compatibility checks, versioning, communication, and a migration period.
- Allowing an approval process to become a slow central bottleneck instead of using clear standards and lightweight peer review.

## 8. Follow-up interview questions

### Should the frontend or backend own the API contract?

Ownership should be shared. The backend usually maintains the published specification, but consumers must review whether it supports their use cases. Named owners on both sides make decisions and changes clear.

### Is OpenAPI enough for contract testing?

No. OpenAPI is the specification. Backend schema and integration tests verify the implementation, while consumer-driven contract tests protect behaviours that consumers depend on. End-to-end tests still provide value for a small number of critical journeys.

### How should teams handle a requested contract change?

First decide whether it is backward compatible. Additive optional fields are usually safe, but removing or renaming fields and changing their meaning are normally breaking. Review the change with consumers, run compatibility checks, and use a new version plus a migration period when necessary.
