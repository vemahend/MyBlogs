# 21. How do you validate API contracts?

**Technology:** API Design and Integration Governance

**Source question:** 21. How do you validate API contracts?

## 1. What is it?

API contract validation checks that an API and its consumers follow an agreed interface. The contract normally defines:

- URLs and HTTP methods.
- Required headers, parameters, and request bodies.
- Data types and validation rules.
- Response status codes, content types, and body shapes.
- Authentication requirements and standard error responses.

For HTTP APIs, the contract is often an OpenAPI document. Consumer-driven contract tools can also record what each consumer actually needs. Validation should cover both the contract file itself and the behaviour of the running API.

## 2. Why is it important?

An API can compile and pass its own unit tests while still breaking a mobile app, website, or another service. For example, renaming a JSON property, changing a nullable field to required, or returning a different status code may break consumers.

Contract validation helps teams to:

- Find integration problems before deployment.
- Detect breaking changes during pull-request checks.
- Keep documentation and real behaviour aligned.
- Allow provider and consumer teams to release independently with confidence.
- Apply common rules for errors, security, naming, and versioning.

For a senior developer or architect, this is important because API compatibility is a shared production responsibility, not just a documentation task.

## 3. How does it work?

A practical validation flow has several layers:

1. **Validate the contract file:** Lint the OpenAPI document and check that it is valid for the chosen OpenAPI version.
2. **Check governance rules:** Verify rules such as required authentication, standard `ProblemDetails` errors, operation IDs, and approved naming conventions.
3. **Compare versions:** Compare the proposed contract with the last released contract. Fail CI for breaking changes such as removing an operation, response field, or accepted value.
4. **Test the provider:** Start the real API in an integration-test environment, send valid and invalid requests, and check that status codes, headers, and response bodies match the contract.
5. **Test consumer expectations:** Where independent teams are involved, run consumer-driven contract tests. The provider verifies every published consumer contract before release.
6. **Monitor after release:** Track schema-validation failures and unexpected responses at the gateway or observability layer without logging sensitive data.

Generated OpenAPI alone is not enough. If the document is generated from code, it may describe the same incorrect code. Important consumer behaviour still needs integration or contract tests.

## 4. Practical example

A bank has a `POST /api/payments` endpoint used by its mobile app. The contract says a valid request returns `201 Created` with `id`, `status`, and `createdAt`. A duplicate idempotency key returns `409 Conflict` using the standard `ProblemDetails` shape.

In CI, the team validates the OpenAPI file, compares it with the production version, and runs the API through integration tests. A developer changes `createdAt` to `createdOn`. The code still compiles, but the breaking-change check detects the removed property and blocks the pull request. The team either keeps `createdAt` for compatibility or introduces a properly planned new API version.

## 5. Scenario-based interview answer

**Problem:** “In a payment platform, backend changes regularly broke frontend and partner integrations. Our OpenAPI page existed, but nobody checked whether releases were compatible with it.”

**Decision:** “I treated the API contract as a versioned build artifact and added validation at both design time and runtime-test time.”

**Implementation:** “We stored the OpenAPI contract in source control, linted it, and compared every pull request with the last released contract. We added ASP.NET Core integration tests for success, validation, authentication, idempotency, and error responses. For critical external consumers, we also used consumer-driven contracts and verified them against the provider build. A genuine breaking change required a new version and a consumer migration plan rather than simply suppressing the CI warning.”

**Result:** “Most compatibility issues were caught before merge. Teams could release more independently, production integration failures reduced, and we had clear evidence of which consumers were safe to migrate.”

## 6. Code example

The following .NET 8 or later integration test checks important parts of a payment response contract against the running ASP.NET Core application:

```csharp
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.Testing;

public sealed class PaymentContractTests(
    WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task CreatePayment_matches_published_contract()
    {
        using var client = factory.CreateClient();

        using var response = await client.PostAsJsonAsync(
            "/api/payments",
            new { accountId = "ACC-100", amount = 25.50m, currency = "NZD" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal("application/json",
            response.Content.Headers.ContentType?.MediaType);

        var json = await response.Content.ReadAsStringAsync();
        var payment = JsonSerializer.Deserialize<PaymentContract>(json,
            new JsonSerializerOptions(JsonSerializerDefaults.Web)
            {
                UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow
            });

        Assert.NotNull(payment);
        Assert.NotEqual(Guid.Empty, payment.Id);
        Assert.Equal("Accepted", payment.Status);
        Assert.NotEqual(default, payment.CreatedAt);
    }

    private sealed record PaymentContract(
        Guid Id,
        string Status,
        DateTimeOffset CreatedAt);
}
```

Important parts:

- `WebApplicationFactory<Program>` hosts the real ASP.NET Core pipeline in memory, so routing, JSON serialization, filters, and middleware are included.
- The test verifies the status code and media type as well as the body.
- `UnmappedMemberHandling.Disallow`, available from .NET 8, detects unexpected JSON members. The assertions detect missing values that could otherwise deserialize to defaults.
- This focused test is useful, but it does not replace automated validation of every operation against the OpenAPI document. A production pipeline should also lint and compare the complete contract.

## 7. Common mistakes

- Validating only that the OpenAPI JSON can be generated, without testing the running API.
- Testing only successful responses and ignoring validation, authorization, conflict, and server errors.
- Comparing contracts but suppressing every breaking-change warning instead of reviewing it.
- Treating an added required request field as a safe change.
- Assuming that adding an enum value is always safe; some generated clients fail on unknown values.
- Sharing database entities as API models, which makes internal schema changes break consumers.
- Running consumer-driven tests without versioning and publishing the consumer contracts.
- Using mocks that do not come from the agreed contract and slowly drift from the provider.
- Logging complete payment or authentication payloads during runtime validation.

## 8. Follow-up interview questions

### What is the difference between schema validation and contract testing?

Schema validation checks structure, such as fields, types, and required values. Contract testing also checks observable interaction details such as the route, method, headers, status code, and consumer expectations.

### What is consumer-driven contract testing?

Each consumer publishes the interactions it relies on. The provider runs those contracts against its current implementation, which shows whether a proposed provider change will break a known consumer.

### Which API changes are usually breaking?

Removing or renaming fields or operations, adding required inputs, narrowing accepted values, and changing status codes or data types are usually breaking. Even apparently additive changes, such as new enum values, must be checked against real client behaviour.
