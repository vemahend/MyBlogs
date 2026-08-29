# 43. How would you make this code testable?

**Technology:** C# Live Coding and LINQ

**Source question:** 43. How would you make this code testable?

## 1. What is it?

Making code testable means designing it so that we can check its behaviour with fast, reliable, automated tests.

The main idea is to separate business logic from things outside the process, such as databases, HTTP services, the system clock, random values, and static global state. These external dependencies should be passed into the class so a test can replace them with controlled versions.

## 2. Why is it important?

Code that directly creates a database connection, calls a payment API, or reads `DateTime.UtcNow` is difficult to test in isolation. Tests may become slow, unpredictable, or dependent on external systems.

Testable code helps a team:

- Verify business rules without calling real infrastructure.
- Reproduce edge cases such as a declined payment or expired request.
- Refactor safely because tests detect changed behaviour.
- Keep tests fast enough to run during local development and in CI.

For a senior developer, testability is also a design signal. A class that is difficult to test often has too many responsibilities or hidden dependencies.

## 3. How does it work?

A practical approach is:

1. Identify the behaviour that must be verified.
2. Move business decisions into a small class or pure function.
3. Replace hidden dependencies with constructor parameters.
4. Put database, HTTP, clock, and messaging operations behind small interfaces.
5. Return useful results instead of hiding outcomes in side effects.
6. In tests, provide fakes or mocks with known responses and verify the result and important interaction.

Dependency injection does not make code testable by itself. The class must also have a clear responsibility, explicit inputs, and observable outputs.

For LINQ code, keep the query separate from data access when possible. Business transformations over `IEnumerable<T>` are easy to test in memory. Database queries using `IQueryable<T>` should also have integration tests because the LINQ provider translates expressions differently from normal in-memory execution.

## 4. Practical example

Consider a payment service that approves a payment only when the amount is positive, the request has not expired, and the payment gateway accepts it.

If the method directly reads the system clock and creates an HTTP client for the gateway, a unit test cannot easily control expiry or gateway responses. Instead, inject a clock and a gateway abstraction. The test can then set an exact time and simulate approval or rejection without making a network call.

The real application uses production implementations. Unit tests use small fakes. A separate integration test verifies that the real gateway adapter sends and reads the correct HTTP contract.

## 5. Scenario-based interview answer

“I first look for hidden dependencies and mixed responsibilities. For example, I once worked on payment code that validated a request, read the current time, called an external gateway, and wrote to a database in one method. Its tests needed several external systems and were unreliable.

I separated the payment rules from infrastructure and injected small abstractions for the clock, gateway, and repository. I made the service return an explicit payment result, which gave the tests a clear outcome to assert. Unit tests then covered expiry, invalid amounts, approval, and decline with controlled fakes. I kept integration tests for the actual HTTP and database adapters.

As a result, the main test suite became fast and deterministic, while the smaller integration suite still verified the infrastructure contracts. I would apply the same steps during live coding: expose dependencies, isolate the decision logic, and test behaviour rather than private implementation details.”

## 6. Code example

```csharp
public interface IPaymentGateway
{
    Task<bool> ChargeAsync(decimal amount, CancellationToken cancellationToken);
}

public interface IClock
{
    DateTimeOffset UtcNow { get; }
}

public sealed record PaymentRequest(decimal Amount, DateTimeOffset ExpiresAt);
public sealed record PaymentResult(bool Succeeded, string Reason);

public sealed class PaymentService(IPaymentGateway gateway, IClock clock)
{
    public async Task<PaymentResult> ProcessAsync(
        PaymentRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Amount <= 0)
            return new(false, "Amount must be positive.");

        if (request.ExpiresAt <= clock.UtcNow)
            return new(false, "Payment request has expired.");

        var charged = await gateway.ChargeAsync(request.Amount, cancellationToken);
        return charged
            ? new(true, "Approved.")
            : new(false, "Gateway declined the payment.");
    }
}
```

Example xUnit test using simple fakes:

```csharp
public sealed class FixedClock(DateTimeOffset now) : IClock
{
    public DateTimeOffset UtcNow => now;
}

public sealed class StubGateway(bool result) : IPaymentGateway
{
    public Task<bool> ChargeAsync(decimal amount, CancellationToken cancellationToken) =>
        Task.FromResult(result);
}

public class PaymentServiceTests
{
    [Fact]
    public async Task ProcessAsync_DoesNotChargeAnExpiredRequest()
    {
        var now = new DateTimeOffset(2026, 8, 23, 10, 0, 0, TimeSpan.Zero);
        var gateway = new StubGateway(result: true);
        var service = new PaymentService(gateway, new FixedClock(now));

        var result = await service.ProcessAsync(
            new PaymentRequest(100m, now.AddMinutes(-1)));

        Assert.False(result.Succeeded);
        Assert.Equal("Payment request has expired.", result.Reason);
    }
}
```

Constructor injection makes both external dependencies visible. The fixed clock removes time-based randomness, and the stub gateway removes the real network call. The returned `PaymentResult` gives the test a clear business outcome. In production on .NET 8 or later, `TimeProvider` and `Microsoft.Extensions.TimeProvider.Testing` can be used instead of a custom clock abstraction.

## 7. Common mistakes

- Testing private methods instead of testing public behaviour.
- Hiding dependencies inside methods with `new`, static calls, service locators, or global state.
- Creating one large interface that exposes unrelated infrastructure operations.
- Mocking every class, including simple value objects and pure logic.
- Verifying too many internal method calls, which makes tests break during harmless refactoring.
- Using an in-memory LINQ query as proof that an Entity Framework Core query will translate and behave correctly against the real database.
- Ignoring failure paths, cancellation, timeouts, duplicate requests, and boundary values.
- Making production methods public only so tests can call their internal implementation.

## 8. Follow-up interview questions

### What is the difference between a unit test and an integration test?

A unit test checks one behaviour with controlled dependencies and normally runs in memory. An integration test checks that real components, such as the application and database or HTTP adapter, work together.

### Should every dependency be wrapped in an interface?

No. Create an abstraction where the code crosses a meaningful boundary or where behaviour must vary, such as a gateway, database, clock, or message publisher. Wrapping simple framework types without a testing or design need adds noise.

### How would you test LINQ code that uses Entity Framework Core?

Unit-test pure business transformations separately. For provider-specific queries, use integration tests with the same database engine used in production, often through a temporary container. This verifies SQL translation, null behaviour, collation, and database constraints that an in-memory collection cannot reproduce.
