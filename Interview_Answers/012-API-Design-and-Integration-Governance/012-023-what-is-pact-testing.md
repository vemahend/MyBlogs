# 23. What is Pact testing?

**Technology:** API Design and Integration Governance

**Source question:** 23. What is Pact testing?

## 1. What is it?

Pact testing is a form of consumer-driven contract testing for services that communicate through HTTP APIs or messages.

The **consumer** writes a test that describes the request it will send and the response it needs. Pact runs a mock provider during this test and saves the successful interaction in a contract file called a **pact**. The **provider** then verifies that its real implementation can satisfy that contract.

Pact checks the boundary between services. It is not an end-to-end test, and it does not prove that the complete business journey works in production.

## 2. Why is it important?

In a distributed system, a provider can make a change that passes its own tests but breaks a consumer. For example, a Payment API may rename `status` to `paymentStatus`, while the banking application still expects `status`.

Pact helps teams to:

- Find incompatible API or message changes before deployment.
- Test each service independently without a shared test environment.
- Show exactly which provider behaviour each consumer depends on.
- Release consumer and provider services independently with more confidence.
- Replace many slow, fragile end-to-end integration tests with faster contract tests.

Pact complements unit, integration, security, performance, and a small number of end-to-end tests. It does not replace them.

## 3. How does it work?

A typical Pact flow is:

1. The consumer test defines an interaction, including the provider state, request, expected status, headers, body, and matching rules.
2. Pact starts a mock HTTP provider. The real consumer client sends its request to this mock.
3. Pact checks the request and returns the configured response. If the test succeeds, it writes a pact contract.
4. The consumer pipeline publishes the pact to a Pact Broker or PactFlow with the consumer version and branch or environment details.
5. The provider pipeline downloads the relevant pacts and starts the real provider application.
6. Before each interaction, a provider-state handler prepares required test data, such as an existing payment.
7. Pact replays the recorded request against the real provider and checks that the response matches the contract.
8. The provider publishes the verification result. A deployment check such as `can-i-deploy` confirms that the intended consumer and provider versions are compatible.

Pact normally uses flexible matching rules. For example, a consumer can require `paymentId` to be a non-empty string without requiring one fixed ID. This keeps contracts focused on shape and behaviour instead of test data.

Modern Pact implementations use Pact Specification V4, which supports synchronous HTTP interactions and asynchronous or synchronous messages. Teams should confirm language-library feature support before choosing a specification feature.

## 4. Practical example

A mobile-banking backend calls `GET /payments/PAY-123` on a Payment API. It requires:

- HTTP `200 OK`.
- A JSON response containing `paymentId` and `status` as strings.
- `application/json` as the content type.

The banking backend runs its real `PaymentClient` against Pact's mock provider and publishes the generated pact. The Payment API pipeline verifies that pact against the real ASP.NET Core API.

Later, a developer removes `status` from the Payment API response. The provider build fails because it no longer satisfies the consumer contract. Adding an unrelated optional field does not normally fail the test because the consumer did not say it depended on an exact body.

## 5. Scenario-based interview answer

**Problem:** “On a payment platform, our account service depended on a Payment API owned by another team. Small provider changes often failed late in the shared test environment, and that environment was slow and unreliable.”

**Decision:** “I introduced Pact for the critical service boundaries. The consumer would own a contract describing only the interactions it really used, and the provider would verify those contracts in its build.”

**Implementation:** “We tested the real .NET HTTP client against Pact's mock server and published versioned pacts to a Pact Broker. In the Payment API pipeline, we started the real ASP.NET Core service, used provider-state handlers to create predictable payment data, and verified all relevant consumer contracts. We published the results and added the broker's deployment compatibility check before release. We kept a few end-to-end tests for complete payment journeys.”

**Result:** “Breaking API changes were found during pull requests instead of after deployment. Both teams could release more independently, the shared test suite became smaller, and the broker gave us clear evidence about which application versions were safe to deploy together.”

## 6. Code example

The following consumer test uses the PactNet 5.x API and Pact Specification V4. Exact minor-version APIs can change, so the project should pin a supported PactNet version.

```csharp
using System.Net;
using System.Net.Http.Json;
using PactNet;
using Xunit;

public sealed record PaymentStatus(string PaymentId, string Status);

public sealed class PaymentClient(HttpClient httpClient)
{
    public async Task<PaymentStatus?> GetAsync(string paymentId) =>
        await httpClient.GetFromJsonAsync<PaymentStatus>(
            $"/payments/{paymentId}");
}

public sealed class PaymentClientPactTests
{
    [Fact]
    public async Task GetPayment_returns_the_status_needed_by_the_consumer()
    {
        var pact = Pact.V4("Account Service", "Payment API", new PactConfig())
            .WithHttpInteractions();

        pact.UponReceiving("a request for an existing payment")
            .Given("payment PAY-123 exists")
            .WithRequest(HttpMethod.Get, "/payments/PAY-123")
            .WillRespond()
            .WithStatus(HttpStatusCode.OK)
            .WithHeader("Content-Type", "application/json; charset=utf-8")
            .WithJsonBody(new
            {
                paymentId = Match.Type("PAY-123"),
                status = Match.Type("Completed")
            });

        await pact.VerifyAsync(async context =>
        {
            using var httpClient = new HttpClient
            {
                BaseAddress = context.MockServerUri
            };

            var client = new PaymentClient(httpClient);
            var result = await client.GetAsync("PAY-123");

            Assert.NotNull(result);
            Assert.Equal("Completed", result.Status);
        });
    }
}
```

Important points:

- The real `PaymentClient` calls Pact's mock server; the test is not mocking `HttpClient` itself.
- `Given` names a provider state. During provider verification, the provider test setup must make that state true.
- `Match.Type` checks the JSON value's type while allowing realistic provider values to differ from the example.
- Passing this consumer test creates the pact, but the provider must still verify it against the real API.

## 7. Common mistakes

- Writing contracts from the provider's view instead of testing what the consumer actually uses.
- Asserting the complete response body when the consumer needs only a few fields. This creates brittle contracts.
- Using fixed values everywhere instead of type, format, or pattern matchers.
- Mocking the consumer client instead of running the real client against Pact's mock server.
- Publishing pacts but never running provider verification in CI.
- Using provider states to describe test steps rather than business preconditions, or letting them depend on shared mutable data.
- Sharing one pact test suite between consumer and provider repositories. Each side should test its own code and exchange the generated contract.
- Treating Pact as API documentation, schema validation, performance testing, or a replacement for all end-to-end tests.
- Allowing old or branch pacts to block releases because broker version, branch, environment, and retention rules are not managed properly.
- Deploying based only on a successful local test instead of checking the broker's published verification results for the exact versions being released.

## 8. Follow-up interview questions

### 1. How is Pact different from an OpenAPI specification?

OpenAPI describes the designed HTTP API and is useful for documentation, governance, and client generation. Pact records concrete interactions that a consumer depends on and verifies them against the provider. Many teams use both.

### 2. What is a provider state in Pact?

A provider state is a named precondition for an interaction, such as “payment PAY-123 exists.” During provider verification, setup code creates that state before Pact sends the request.

### 3. Does Pact replace end-to-end testing?

No. Pact checks compatibility at service boundaries. End-to-end tests are still useful for a small number of important business journeys, infrastructure behaviour, and problems that cross several services.
