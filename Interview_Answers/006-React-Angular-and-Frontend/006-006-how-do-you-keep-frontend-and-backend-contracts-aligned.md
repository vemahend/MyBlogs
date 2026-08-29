# 6. How do you keep frontend and backend contracts aligned?

**Technology:** React, Angular, and Frontend

**Source question:** 6. How do you keep frontend and backend contracts aligned?

## 1. What is it?

A frontend-backend contract is the agreed shape and behavior of an API. It covers URLs, HTTP methods, request and response fields, data types, validation rules, status codes, error formats, authentication, and versioning.

I keep the contract aligned by making one machine-readable API definition—normally OpenAPI—the source of truth. The backend publishes it, the React or Angular application generates a typed client from it, and the build pipeline checks that both sides still follow it.

## 2. Why is it important?

Without a shared contract, the backend may rename a field, change a type, or return a different error while the frontend still expects the old behavior. The code may compile in separate repositories but fail when the systems meet.

An aligned contract gives the team:

- compile-time feedback through generated TypeScript types;
- fewer integration defects and less duplicated interface code;
- safer deployments when frontend and backend releases happen at different times;
- clear documentation for developers, testers, and other API consumers;
- a controlled way to make backward-compatible or versioned changes.

## 3. How does it work?

A practical flow is:

1. The team agrees on the API contract before or during implementation.
2. ASP.NET Core exposes an OpenAPI document containing schemas, routes, status codes, and security requirements.
3. A generator such as NSwag or OpenAPI Generator creates the TypeScript models and API client used by React or Angular.
4. Developers import those generated types instead of manually creating similar interfaces.
5. CI regenerates or validates the client and fails if committed generated code is out of date.
6. Backend integration tests verify real responses, while frontend tests use examples that match the same contract.
7. A breaking-change check compares the new OpenAPI document with the released version.
8. Breaking changes use a new API version or a coordinated migration. Additive changes are preferred because old clients can usually ignore new response fields.

OpenAPI describes structure well, but it does not replace business-rule tests. Rules such as transfer limits, field relationships, and authorization still need automated tests and clear documentation.

## 4. Practical example

Consider a banking screen that submits a money transfer. The contract defines `fromAccountId`, `toAccountId`, `amount`, and `currency`, and documents `201`, `400`, `401`, `409`, and `422` responses. Errors use one consistent `ProblemDetails` shape.

The Angular or React application uses a generated `TransfersClient`. If the backend changes `amount` from a number to a structured money object, regeneration causes TypeScript compile errors immediately. The team can then keep the old field temporarily, introduce `/api/v2/transfers`, or release both applications in a controlled order. The mismatch is found in development or CI rather than by a customer making a payment.

## 5. Scenario-based interview answer

“On one payment project, the frontend and API were deployed independently. We had incidents because developers maintained C# DTOs and TypeScript interfaces by hand, and the two models slowly became different.

I decided to treat the ASP.NET Core OpenAPI document as the executable contract. We documented request and response types, status codes, validation errors, and authentication, then generated the TypeScript client for the frontend. In CI, we generated the OpenAPI file, checked for breaking changes against the released contract, and ran API integration tests. We also required backward-compatible changes unless a new API version had been agreed.

For rollout, the API accepted both old and new fields while the frontend moved to the new generated client. After all consumers migrated, we removed the old contract in a planned version. This reduced integration defects, allowed independent deployments, and made contract changes visible during code review instead of production.”

## 6. Code example

The backend can publish a clear contract from typed request and response models:

```csharp
public sealed record CreateTransferRequest(
    Guid FromAccountId,
    Guid ToAccountId,
    decimal Amount,
    string Currency);

public sealed record TransferResponse(Guid Id, string Status);

app.MapPost("/api/v1/transfers", async (
    CreateTransferRequest request,
    ITransferService service,
    CancellationToken cancellationToken) =>
{
    if (request.Amount <= 0)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            [nameof(request.Amount)] = ["Amount must be greater than zero."]
        });
    }

    var transfer = await service.CreateAsync(request, cancellationToken);

    return Results.Created(
        $"/api/v1/transfers/{transfer.Id}",
        new TransferResponse(transfer.Id, transfer.Status));
})
.Produces<TransferResponse>(StatusCodes.Status201Created)
.ProducesValidationProblem(StatusCodes.Status400BadRequest)
.WithOpenApi();
```

The typed request and response records provide stable schemas. `Produces` and `ProducesValidationProblem` make the expected outcomes visible in the OpenAPI document. The frontend client is then generated from that document; it should not contain a separately handwritten copy of these models.

The exact OpenAPI setup depends on the supported ASP.NET Core version and the selected tooling. For example, a team may use the built-in OpenAPI support in modern ASP.NET Core or an established package such as NSwag, but it should pin the tool version so local and CI generation are repeatable.

## 7. Common mistakes

- Handwriting TypeScript interfaces that duplicate backend DTOs.
- Generating a client once but not checking regeneration in CI.
- Treating every OpenAPI change as safe; removing fields, changing types, and making optional fields required can break existing clients.
- Documenting only successful responses and leaving error formats unclear.
- Reusing database entities as API models, which leaks internal changes into the contract.
- Deploying a breaking backend change before all frontend versions and other consumers have migrated.
- Assuming generated types validate runtime data. Responses from external or older services may still need runtime validation.
- Relying only on end-to-end tests; they detect mismatches late and can be slow or unreliable.
- Changing generated client code manually instead of changing the contract or generator configuration.

## 8. Follow-up interview questions

### What changes are usually backward-compatible?

Adding an optional request field, adding a response field that clients can ignore, or adding a new endpoint is usually safer. The team should still verify its actual clients and tooling.

### How do you detect breaking API changes in CI?

Export the new OpenAPI document and compare it with the last released version using an OpenAPI diff tool. Fail the pipeline for changes such as removed operations, removed fields, changed types, or newly required inputs.

### Are consumer-driven contract tests still useful with OpenAPI?

Yes. OpenAPI checks the general API shape, while consumer-driven tests confirm that specific consumer expectations are supported. They are especially useful when one API serves several independently deployed applications.
