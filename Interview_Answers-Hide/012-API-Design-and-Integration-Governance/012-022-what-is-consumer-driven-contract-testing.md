# 22. What is consumer-driven contract testing?

**Technology:** API Design and Integration Governance

**Source question:** 22. What is consumer-driven contract testing?

## 1. What is it?

Consumer-driven contract testing checks that two services can communicate without running a full end-to-end environment.

The **consumer** is the application that calls an API or receives a message. It records the requests and responses it actually needs as a contract. The **provider** is the API or message producer. Its build verifies that it still satisfies that contract.

It is called consumer-driven because the required behaviour comes from real consumer needs, rather than from every possible field in the provider's API definition. Pact is a common tool for this approach. An OpenAPI specification is still useful for API design and documentation, but it does not by itself prove that a particular consumer and provider remain compatible.

## 2. Why is it important?

In a distributed system, one team can make a small API change that compiles and passes its own tests but breaks another service in production. For example, renaming `status` to `paymentStatus` can break a payment consumer.

Consumer-driven contract tests provide fast feedback before deployment. They help teams:

- detect breaking request, response, header, status-code, and message changes;
- deploy services independently with more confidence;
- use fewer slow and fragile end-to-end tests;
- see which consumers rely on a provider behaviour;
- manage API evolution with evidence instead of assumptions.

They complement unit, integration, security, performance, and end-to-end tests; they do not replace them.

## 3. How does it work?

1. The consumer test describes an interaction, such as `GET /payments/123`, and the minimum response the consumer requires.
2. A contract tool starts a mock provider. The real consumer client calls this mock, so the test also checks the client's request and response handling.
3. After the test passes, the tool writes a machine-readable contract, often called a pact.
4. The consumer publishes the contract to a shared broker with its application version and branch information.
5. The provider pipeline downloads the relevant contracts, puts the provider into any required test state, and sends each recorded request to the real provider running on a reachable test port.
6. Verification fails if the provider's response does not match the contract. Successful results are published back to the broker.
7. Before deployment, a compatibility check allows a release only when the planned consumer and provider versions have been verified together.

Matching rules should describe what matters. For example, the consumer may require `status` to be a string but allow the provider to add unrelated response fields.

## 4. Practical example

A mobile-banking backend calls a Payment API to display a transfer's state. It depends on:

- `GET /payments/{id}`;
- an HTTP `200` response for an existing payment;
- a JSON body containing string fields `paymentId` and `status`.

The banking backend publishes this contract. The Payment API team later refactors its response and accidentally removes `status`. Provider verification fails in the Payment API pipeline before the change is deployed. Adding a new optional field such as `processedAt`, however, does not break the consumer contract because the consumer did not require an exact response body.

## 5. Scenario-based interview answer

**Problem:** “In one project, several services consumed our Payment API, and shared test environments were slow and often unavailable. Provider changes were reaching integration testing late and breaking consumers.”

**Decision:** “I introduced consumer-driven contract testing with Pact. Each consumer described only the Payment API interactions it genuinely used. I kept a small number of end-to-end tests for complete business journeys.”

**Implementation:** “The consumer tests exercised the real .NET HTTP clients against Pact's mock server and published versioned contracts to a Pact Broker. The Payment API pipeline verified those contracts against a real instance of the ASP.NET Core API. We implemented provider-state handlers for data setup and added the broker's deployment compatibility check to both pipelines. We also required provider verification before merging a breaking API change.”

**Result:** “Breaking response and status-code changes were found in pull requests instead of the shared environment. The teams could deploy independently more often, integration failures reduced, and the remaining end-to-end suite became smaller and more reliable.”

## 6. Code example

The following xUnit consumer test uses the stable PactNet 5.x API and Pact Specification V4:

```csharp
using System.Net;
using System.Net.Http.Json;
using PactNet;
using Xunit;

public sealed record PaymentStatus(string PaymentId, string Status);

public sealed class PaymentClient(HttpClient httpClient)
{
    public async Task<PaymentStatus> GetStatusAsync(
        string paymentId,
        CancellationToken cancellationToken = default)
    {
        return await httpClient.GetFromJsonAsync<PaymentStatus>(
                   $"/payments/{paymentId}", cancellationToken)
               ?? throw new InvalidOperationException("Payment response was empty.");
    }
}

public sealed class PaymentConsumerContractTests
{
    private readonly IPactBuilderV4 _pact;

    public PaymentConsumerContractTests()
    {
        var pact = Pact.V4(
            "Banking Backend",
            "Payment API",
            new PactConfig { PactDir = "../../../pacts" });

        _pact = pact.WithHttpInteractions();
    }

    [Fact]
    public async Task Gets_the_status_of_an_existing_payment()
    {
        _pact
            .UponReceiving("a request for an existing payment")
                .Given("payment PAY-123 exists")
                .WithRequest(HttpMethod.Get, "/payments/PAY-123")
            .WillRespond()
                .WithStatus(HttpStatusCode.OK)
                .WithHeader("Content-Type", "application/json; charset=utf-8")
                .WithJsonBody(new
                {
                    paymentId = "PAY-123",
                    status = "Completed"
                });

        await _pact.VerifyAsync(async context =>
        {
            var httpClient = new HttpClient { BaseAddress = context.MockServerUri };
            var client = new PaymentClient(httpClient);

            var result = await client.GetStatusAsync("PAY-123");

            Assert.Equal("Completed", result.Status);
        });
    }
}
```

`UponReceiving` defines one consumer interaction. `Given` names a provider state; the provider verification environment must arrange that state. `VerifyAsync` starts the mock server and checks that the real `PaymentClient` sends the expected request. A successful test writes the contract to the configured pact directory.

In CI, publish that pact and verify it from the Payment API pipeline. With PactNet 5.x, provider verification uses `new PactVerifier("Payment API")`, `WithHttpEndpoint(...)`, a broker or file source, and `Verify()`. The ASP.NET Core provider must listen on a real TCP port; PactNet's native verifier cannot call an in-memory `TestServer` directly.

## 7. Common mistakes

- Generating contracts from DTOs or OpenAPI only, instead of exercising the real consumer client.
- Expecting exact large response bodies. This makes tests brittle and treats unused fields as requirements.
- Allowing broad matchers such as “any string” when the consumer supports only known values.
- Testing imagined future needs rather than behaviour the consumer actually uses.
- Forgetting provider states, which leads to tests that depend on shared or random data.
- Publishing unversioned contracts or not publishing provider verification results.
- Running verification but not enforcing a deployment compatibility check in CI/CD.
- Assuming contract tests cover business workflows, authentication, authorization, performance, or network failure behaviour.
- Treating every provider change as safe when all current consumers pass; unknown or external consumers still require API versioning and governance.

## 8. Follow-up interview questions

### How is consumer-driven contract testing different from integration testing?

A contract test checks the agreed boundary between a consumer and provider in isolation. An integration test runs real components together and can also detect infrastructure, configuration, authentication, and networking problems.

### Who owns the contract?

The consumer defines the behaviour it needs, but both teams own compatibility. The provider must verify every supported consumer contract, and both pipelines should publish versioned results.

### How should a provider make a breaking change?

First identify affected consumers through the broker. Add the new behaviour in a backward-compatible way, migrate and verify consumers, then remove the old behaviour only after no supported consumer depends on it. Use a new API version when compatibility cannot be maintained.
