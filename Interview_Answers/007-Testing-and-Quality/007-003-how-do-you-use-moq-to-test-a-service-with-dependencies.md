# 3. How do you use MOQ to test a service with dependencies?

**Technology:** Testing and Quality

**Source question:** 3. How do you use MOQ to test a service with dependencies?

## 1. What is it?

Moq is a .NET mocking library used to replace a service's real dependencies with controlled test objects. Although the question writes it as “MOQ,” the library's official name is **Moq**.

For example, if a payment service depends on a repository and a payment gateway, a unit test can use Moq instead of calling a real database or bank. The test controls what each dependency returns and can check whether an important method was called.

## 2. Why is it important?

A service often depends on databases, external APIs, queues, email providers, or the current time. Using those real systems in every unit test would make tests slow, unreliable, and difficult to set up.

Moq helps developers:

- Test the service's business logic in isolation.
- Simulate success, failure, timeout, and missing-data cases.
- Avoid real side effects such as charging a card or sending a message.
- Verify important interactions, such as saving a payment only after a successful charge.

Moq-based tests do not replace integration tests. Integration tests are still needed to prove that database mappings, HTTP requests, authentication, and other real components work together.

## 3. How does it work?

The normal flow is:

1. The production service receives dependencies through constructor injection.
2. The test creates a `Mock<T>` for each external dependency.
3. `Setup` defines what a dependency should return for a specific call.
4. The test passes each mock's `.Object` into the service.
5. The test calls the public service method.
6. It asserts the returned result or state.
7. `Verify` checks an important interaction when that interaction is part of the requirement.

Common Moq members include:

- `Setup(...)` to describe an expected call.
- `ReturnsAsync(...)` to provide an asynchronous result.
- `ThrowsAsync(...)` to simulate a dependency failure.
- `It.Is<T>(...)` to match an argument by its values.
- `Verify(...)` with `Times.Once`, `Times.Never`, or another count.

Tests should normally assert the business outcome first. Verify calls only when they represent meaningful behavior, rather than checking every internal interaction.

## 4. Practical example

Consider a bank transfer service. It loads a transfer from a repository, asks an external payment gateway to move the money, marks the transfer as completed, and saves it.

In a unit test, the repository mock returns a known pending transfer and the gateway mock returns a successful transaction ID. The test then checks that the service reports success, sends the correct amount to the gateway, and saves the completed transfer once.

A separate failure test can make the gateway return a declined result and verify that the repository is never asked to save a completed transfer. No real database or banking system is called.

## 5. Scenario-based interview answer

**Problem:** In a payment project, we needed to test a service that read an order, called an external gateway, and updated the order after a successful charge. Tests that used the real systems were slow and could not safely cover declined-payment cases.

**Decision:** I used Moq for the repository and gateway boundaries, while keeping the payment service and domain objects real. This kept the unit test focused on the service's decision-making.

**Implementation:** I configured the repository to return a known unpaid order and the gateway to return a controlled success or decline response. I called the service, asserted its result, and verified only the important side effect: a successful payment was saved once, while a declined payment was not saved as completed.

**Result:** The tests became fast and repeatable, and we could cover success and failure paths without making real charges. We kept separate integration tests for database mappings and the real gateway client.

In an interview, I would say: “I inject dependencies into the service, create `Mock<T>` objects for external boundaries, configure them with `Setup`, and pass their `.Object` values to the service. After calling the public method, I assert the business result and use `Verify` only for important interactions. I do not treat mocked tests as proof that the real integrations work, so I also keep integration tests.”

## 6. Code example

This example uses xUnit and Moq with an asynchronous payment service.

```csharp
public sealed record Order(Guid Id, decimal Amount, bool IsPaid = false);
public sealed record ChargeResult(bool Succeeded, string? TransactionId);

public interface IOrderRepository
{
    Task<Order?> GetAsync(Guid orderId, CancellationToken cancellationToken);
    Task SaveAsync(Order order, CancellationToken cancellationToken);
}

public interface IPaymentGateway
{
    Task<ChargeResult> ChargeAsync(
        decimal amount,
        CancellationToken cancellationToken);
}

public sealed class PaymentService(
    IOrderRepository repository,
    IPaymentGateway gateway)
{
    public async Task<bool> PayAsync(
        Guid orderId,
        CancellationToken cancellationToken)
    {
        var order = await repository.GetAsync(orderId, cancellationToken)
            ?? throw new InvalidOperationException("Order was not found.");

        if (order.IsPaid)
            return true;

        var charge = await gateway.ChargeAsync(
            order.Amount,
            cancellationToken);

        if (!charge.Succeeded)
            return false;

        await repository.SaveAsync(
            order with { IsPaid = true },
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
    public async Task PayAsync_SavesPaidOrder_WhenChargeSucceeds()
    {
        var orderId = Guid.NewGuid();
        var repository = new Mock<IOrderRepository>();
        var gateway = new Mock<IPaymentGateway>();

        repository
            .Setup(x => x.GetAsync(orderId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Order(orderId, 125m));

        gateway
            .Setup(x => x.ChargeAsync(125m, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ChargeResult(true, "txn-123"));

        var service = new PaymentService(repository.Object, gateway.Object);

        var result = await service.PayAsync(orderId, CancellationToken.None);

        Assert.True(result);
        gateway.Verify(
            x => x.ChargeAsync(125m, It.IsAny<CancellationToken>()),
            Times.Once);
        repository.Verify(
            x => x.SaveAsync(
                It.Is<Order>(order =>
                    order.Id == orderId && order.IsPaid),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
```

`ReturnsAsync` supplies controlled dependency results. `repository.Object` and `gateway.Object` are the test implementations passed into the real `PaymentService`. `It.Is<Order>` verifies the important saved state without requiring the test to use the same object instance.

The primary assertion is that `PayAsync` returns `true`. The two verifications confirm the required side effects: one charge and one save of a paid order.

## 7. Common mistakes

- Mocking the service under test instead of creating a real instance of it.
- Forgetting to pass `.Object` from `Mock<T>` into the constructor.
- Setting up arguments that do not match the actual call, which causes Moq to return the default value.
- Verifying every method call and making the test depend on implementation details.
- Using `It.IsAny<T>()` for every argument and failing to check important values such as the amount or order ID.
- Testing only the successful path and missing decline, exception, cancellation, and missing-order cases.
- Mocking domain objects and simple value objects that should be real in the test.
- Using mocks as a replacement for database, HTTP, or contract integration tests.
- Sharing mutable mocks between tests, which can make tests affect each other.
- Using `MockBehavior.Strict` everywhere; it can be useful in selected cases, but often makes tests fragile when harmless implementation calls change.

## 8. Follow-up interview questions

### What is the difference between `Setup` and `Verify` in Moq?

`Setup` controls how a mock behaves when it is called. `Verify` checks whether a call happened with the expected arguments and count.

### How do you test that a dependency must not be called?

Call the service for the relevant scenario, assert the result, and use `Verify` with `Times.Never`. For example, verify that `SaveAsync` is never called when the gateway declines the payment.

### Should every dependency be mocked?

No. Mock external boundaries or collaborators that need controlled behavior. Use real domain objects and pure logic, and use integration tests when the risk is in the actual database, HTTP client, queue, or framework behavior.
