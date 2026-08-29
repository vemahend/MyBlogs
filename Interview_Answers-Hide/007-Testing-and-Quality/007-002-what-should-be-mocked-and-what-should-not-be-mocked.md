# 2. What should be mocked, and what should not be mocked?

**Technology:** Testing and Quality

**Source question:** 2. What should be mocked, and what should not be mocked?

## 1. What is it?

Mocking means replacing a real dependency with a controlled test object. The test can tell that object what to return and can check how it was called.

A good rule is to mock dependencies at the boundary of the code being tested, especially when they are slow, external, unavailable, non-deterministic, or have side effects. Examples include payment gateways, email services, message publishers, file systems, and the current clock.

Do not normally mock simple data objects, value objects, collections, or the internal methods of the class under test. Also avoid mocking framework types such as `HttpClient` or Entity Framework `DbSet` directly when a more realistic test or a proper boundary is available.

## 2. Why is it important?

Good mocking keeps a unit test fast, repeatable, and focused on one piece of business logic. A payment test should not make a real bank call or publish a real message.

However, too much mocking makes a test closely follow the implementation. Such a test can pass even when the real components do not work together, and harmless refactoring can break it. Senior developers therefore choose the smallest useful test double and use integration tests for important infrastructure behavior.

## 3. How does it work?

The usual flow is:

1. The production class receives dependencies through constructor injection.
2. The unit test replaces external collaborators with mocks, stubs, or fakes.
3. The test configures only the behavior needed for that scenario.
4. It calls the public method being tested.
5. It checks the returned result or state change first.
6. It verifies an interaction only when that interaction is part of the requirement, such as publishing an event exactly once.

Choose the test double based on its purpose:

- A **stub** returns controlled data.
- A **fake** is a small working implementation, such as an in-memory repository.
- A **mock** records calls so that the test can verify an important interaction.

Do not mock code that is part of the behavior you want to prove. For example, an Entity Framework query should usually be tested against a real test database provider that matches production closely. Mocking `DbSet` can hide translation, constraint, transaction, and mapping problems. EF Core's InMemory provider is also not a relational database; SQLite or a containerized instance of the production database is often a better integration-test choice.

## 4. Practical example

Consider a payment service that checks whether an order is already paid, calls an external payment gateway, saves the new payment status, and publishes a `PaymentCompleted` event.

In a unit test, mock the external gateway and event publisher because they cross process boundaries and cause side effects. A repository may be stubbed or replaced by a small fake when testing business decisions.

Do not mock the `Payment` entity, the `Money` value object, or private calculation methods. Use real instances so the test exercises the actual domain rules. Separately, use integration tests to prove that repository mappings, database transactions, and the real HTTP gateway client behave correctly.

## 5. Scenario-based interview answer

**Problem:** In one payment system, the unit tests mocked the controller, service, repository, EF Core query, mapper, and domain objects. The suite was fragile, but it still missed database mapping errors.

**Decision:** I limited unit-test mocks to true system boundaries and important side effects. I kept domain objects and pure business logic real. I moved database and HTTP serialization behavior into integration tests.

**Implementation:** For the payment use case, I stubbed the gateway response and mocked the event publisher. The test asserted the payment result and verified that an event was published only after a successful charge. Repository tests ran against the same database engine as production in a disposable test environment.

**Result:** The unit tests became easier to read and survived internal refactoring. The integration tests caught mapping and transaction issues that mocks could never detect.

In an interview, I would summarize it like this: "I mock boundaries, not business logic. I use mocks when I need to control an external dependency or verify an important side effect. I use real domain objects and prefer integration tests for framework and infrastructure behavior. The goal is confidence, not the highest possible mock count."

## 6. Code example

The following example uses xUnit and Moq. The service depends on small application-owned interfaces rather than directly on a third-party SDK.

```csharp
public interface IPaymentGateway
{
    Task<ChargeResult> ChargeAsync(
        decimal amount,
        CancellationToken cancellationToken);
}

public interface IEventPublisher
{
    Task PublishAsync(
        PaymentCompleted message,
        CancellationToken cancellationToken);
}

public sealed record ChargeResult(bool Succeeded, string? TransactionId);
public sealed record PaymentCompleted(string TransactionId);

public sealed class PaymentService(
    IPaymentGateway gateway,
    IEventPublisher publisher)
{
    public async Task<bool> PayAsync(
        decimal amount,
        CancellationToken cancellationToken)
    {
        if (amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(amount));

        var charge = await gateway.ChargeAsync(amount, cancellationToken);

        if (!charge.Succeeded)
            return false;

        await publisher.PublishAsync(
            new PaymentCompleted(charge.TransactionId!),
            cancellationToken);

        return true;
    }
}
```

```csharp
using Moq;
using Xunit;

public sealed class PaymentServiceTests
{
    [Fact]
    public async Task PayAsync_PublishesEvent_WhenChargeSucceeds()
    {
        var gateway = new Mock<IPaymentGateway>();
        var publisher = new Mock<IEventPublisher>();

        gateway
            .Setup(x => x.ChargeAsync(100m, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ChargeResult(true, "txn-123"));

        var service = new PaymentService(gateway.Object, publisher.Object);

        var paid = await service.PayAsync(100m, CancellationToken.None);

        Assert.True(paid);
        publisher.Verify(
            x => x.PublishAsync(
                new PaymentCompleted("txn-123"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
```

`IPaymentGateway` is stubbed to return a controlled result. `IEventPublisher` is mocked because publishing the event is an important observable side effect. The test does not mock `PaymentCompleted` or the `PaymentService` itself. It checks the business result and only one meaningful interaction.

## 7. Common mistakes

- Mocking every dependency, even simple and reliable objects.
- Mocking the class under test or its private methods instead of testing its public behavior.
- Verifying every method call and call order, which couples tests to implementation details.
- Returning unrealistic values from mocks, so production edge cases are missed.
- Mocking `DbSet`, LINQ behavior, `HttpClient`, or framework internals instead of testing through a stable boundary.
- Using only mocked unit tests and having no integration or contract tests.
- Making interfaces only to enable mocking, even when there is no useful architectural boundary.
- Using strict mocks everywhere, causing harmless internal changes to break many tests.
- Forgetting failure, timeout, cancellation, retry, and duplicate-message scenarios at external boundaries.

## 8. Follow-up interview questions

### What is the difference between a mock, stub, and fake?

A stub supplies fixed answers, a fake provides a lightweight working implementation, and a mock records interactions for verification. Teams often use the word "mock" for all three, but their purposes are different.

### Should repositories always be mocked in unit tests?

No. Mock one when the unit test only needs controlled repository behavior. Use an integration test when the important risk is SQL translation, mapping, constraints, concurrency, or transactions.

### Should we verify every call made to a mock?

No. Verify only interactions that express a business requirement or important side effect. Prefer asserting the returned result or final state; otherwise the test becomes tied to the current implementation.
