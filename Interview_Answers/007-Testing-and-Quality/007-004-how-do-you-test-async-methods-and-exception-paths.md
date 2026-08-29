# 4. How do you test async methods and exception paths?

**Technology:** Testing and Quality

**Source question:** 4. How do you test async methods and exception paths?

## 1. What is it?

Testing an async method means calling it from an async test and awaiting the returned `Task` or `Task<T>`. This allows the test framework to observe the final result and any exception raised after an `await`.

Testing exception paths means deliberately arranging a failure, such as a payment gateway timeout, and checking that the method throws, translates, logs, or handles that failure as required.

## 2. Why is it important?

Async code often performs database, HTTP, messaging, or file operations. These operations can fail after the method has returned its `Task`. If a test does not await that task, it may pass before the real work finishes and miss the exception.

Failure paths are also part of the service contract. A production service must behave correctly when a dependency times out, rejects a request, or receives cancellation. Tests confirm that the service does not hide failures, return a false success, or convert cancellation into the wrong exception.

## 3. How does it work?

A reliable async test normally follows these steps:

1. Arrange the dependency to return a completed task, a delayed task, a cancelled task, or a faulted task.
2. Call the system under test and `await` it.
3. For success, assert the returned value and important side effects.
4. For failure, pass the async call to the test framework's async exception assertion and inspect the exception.
5. Verify important behavior, such as whether a repository update was skipped after the failure.

In xUnit, the test itself should return `Task`, not `void`. `Assert.ThrowsAsync<TException>` awaits the delegate and checks the exception. In xUnit v3, this assertion checks for the exact exception type; use `Assert.ThrowsAnyAsync<TException>` when a derived type is also valid.

Avoid real delays and unreliable timing. Control dependencies with fakes or mocks so each path finishes immediately and deterministically.

## 4. Practical example

A payment service first calls an external gateway and then marks an order as paid. The important tests are:

- The gateway approves the charge: the service returns a payment ID and marks the order as paid.
- The gateway times out: the service throws a domain-level `PaymentUnavailableException` and does not mark the order as paid.
- The request is cancelled: the service allows `OperationCanceledException` to flow and does not treat it as a gateway failure.

These tests cover both the returned result and the business side effects. Checking only the exception is not enough if the order could still be updated incorrectly.

## 5. Scenario-based interview answer

“In one payment flow, the service called an external gateway and then updated the order. The risk was that a timeout could be swallowed or the order could be marked as paid even though the charge result was unknown.

I made every async test return `Task` and awaited the service call. I configured the gateway mock to return success for the normal path and to throw `TimeoutException` for the failure path. I used the test framework's async exception assertion to verify that the service translated the technical timeout into our `PaymentUnavailableException`. I also verified that the repository was never called after the gateway failure.

I added a separate cancellation test because cancellation is not the same as a system fault. The service preserved `OperationCanceledException` when the supplied token was cancelled. This gave us deterministic tests for success, dependency failure, and cancellation, and prevented a false paid status during gateway incidents.”

## 6. Code example

The example below uses xUnit and Moq. The same arrange, await, and assert pattern applies to NUnit or MSTest, although their assertion syntax differs.

```csharp
public sealed record ChargeResult(string PaymentId);

public interface IPaymentGateway
{
    Task<ChargeResult> ChargeAsync(decimal amount, CancellationToken token);
}

public interface IOrderRepository
{
    Task MarkPaidAsync(Guid orderId, string paymentId, CancellationToken token);
}

public sealed class PaymentUnavailableException : Exception
{
    public PaymentUnavailableException(string message, Exception innerException)
        : base(message, innerException) { }
}

public sealed class PaymentService
{
    private readonly IPaymentGateway _gateway;
    private readonly IOrderRepository _orders;

    public PaymentService(IPaymentGateway gateway, IOrderRepository orders)
    {
        _gateway = gateway;
        _orders = orders;
    }

    public async Task<string> PayAsync(
        Guid orderId,
        decimal amount,
        CancellationToken token)
    {
        try
        {
            var charge = await _gateway.ChargeAsync(amount, token);
            await _orders.MarkPaidAsync(orderId, charge.PaymentId, token);
            return charge.PaymentId;
        }
        catch (TimeoutException ex)
        {
            throw new PaymentUnavailableException(
                "The payment provider did not respond.", ex);
        }
    }
}
```

```csharp
using Moq;
using Xunit;

public sealed class PaymentServiceTests
{
    [Fact]
    public async Task PayAsync_WhenGatewayApproves_MarksOrderAsPaid()
    {
        var orderId = Guid.NewGuid();
        var gateway = new Mock<IPaymentGateway>();
        var orders = new Mock<IOrderRepository>();

        gateway
            .Setup(x => x.ChargeAsync(50m, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ChargeResult("pay-123"));

        var sut = new PaymentService(gateway.Object, orders.Object);

        var paymentId = await sut.PayAsync(orderId, 50m, CancellationToken.None);

        Assert.Equal("pay-123", paymentId);
        orders.Verify(
            x => x.MarkPaidAsync(orderId, "pay-123", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task PayAsync_WhenGatewayTimesOut_ThrowsAndDoesNotUpdateOrder()
    {
        var gateway = new Mock<IPaymentGateway>();
        var orders = new Mock<IOrderRepository>();

        gateway
            .Setup(x => x.ChargeAsync(50m, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new TimeoutException("Gateway timed out"));

        var sut = new PaymentService(gateway.Object, orders.Object);

        var exception = await Assert.ThrowsAsync<PaymentUnavailableException>(
            () => sut.PayAsync(Guid.NewGuid(), 50m, CancellationToken.None));

        Assert.IsType<TimeoutException>(exception.InnerException);
        orders.Verify(
            x => x.MarkPaidAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PayAsync_WhenCancelled_PreservesCancellation()
    {
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();

        var gateway = new Mock<IPaymentGateway>();
        var orders = new Mock<IOrderRepository>();

        gateway
            .Setup(x => x.ChargeAsync(50m, cancellation.Token))
            .ThrowsAsync(new OperationCanceledException(cancellation.Token));

        var sut = new PaymentService(gateway.Object, orders.Object);

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => sut.PayAsync(Guid.NewGuid(), 50m, cancellation.Token));

        orders.VerifyNoOtherCalls();
    }
}
```

The tests return `Task`, await all work, and use async exception assertions. The timeout test also checks the inner cause and confirms that no order update occurred. The cancellation test uses `ThrowsAnyAsync` because cancellation APIs may produce `OperationCanceledException` or its derived type, `TaskCanceledException`.

## 7. Common mistakes

- Writing `async void` tests. The test runner may finish before the assertion or may not capture the exception correctly. Use `async Task`.
- Calling `.Result`, `.Wait()`, or `GetAwaiter().GetResult()` in a test. This blocks the thread, can wrap exceptions, and can cause deadlocks in some environments.
- Forgetting to await `Assert.ThrowsAsync`. The assertion itself returns a task.
- Using `Assert.Throws` for code that returns a task. Exceptions raised during asynchronous work must be observed with an async assertion.
- Testing only the exception type and ignoring side effects. Also verify that no database update, event publication, or retry happened when it should not.
- Using `Task.Delay` or real external services to create timing failures. Such tests are slow and flaky; control the dependency instead.
- Catching every `Exception` in production code and wrapping cancellation as an application error. Handle expected failures narrowly and preserve cancellation.
- Mocking a method to throw synchronously when the real dependency faults asynchronously, if that timing difference matters. Use the mocking library's async return or throw support.

## 8. Follow-up interview questions

### How do you test cancellation in an async method?

Pass a cancelled or controllable `CancellationToken`, await the method, assert `OperationCanceledException`, and verify that later side effects did not run. Avoid relying on a real timeout.

### Should an async test ever use `.Result` or `.Wait()`?

Normally, no. Make the test return `Task` and use `await`. This keeps the exception behavior clear and avoids blocking-related deadlocks.

### How do you test retry logic without making the test slow?

Inject or configure the retry policy, mock the dependency to fail a known number of times, and remove real delays through a test-friendly delay or time abstraction. Then verify the attempt count and final result or exception.
