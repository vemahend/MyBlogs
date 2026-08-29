# 31. Refactor .Wait to await.

**Technology:** C# Live Coding and LINQ

**Source question:** 31. Refactor .Wait to await.

## 1. What is it?

Refactoring `.Wait()` to `await` means replacing synchronous blocking with asynchronous waiting.

This code blocks the current thread until the task completes:

```csharp
paymentService.ProcessAsync(request).Wait();
```

The asynchronous version lets the thread do other work while the operation is waiting:

```csharp
await paymentService.ProcessAsync(request, cancellationToken);
```

The containing method normally needs the `async` keyword and must return `Task` instead of `void`. Its callers should also await it. This is often called **async all the way**.

## 2. Why is it important?

`.Wait()` holds a thread until the task finishes. This can cause:

- Deadlocks in UI applications and older ASP.NET applications when the task needs to continue on the context owned by the blocked thread.
- Thread-pool starvation in server applications when many requests block at the same time.
- Higher latency and lower throughput under load.
- Less natural error handling because failures are normally wrapped in `AggregateException`.

`await` pauses the method without blocking its thread. This is especially useful for database, HTTP, file, and messaging operations. In an ASP.NET Core service, the released thread can process another request while the I/O operation is incomplete.

## 3. How does it work?

With `.Wait()`, the calling thread stops and synchronously waits for the `Task` to reach a completed, failed, or cancelled state.

With `await`:

1. The asynchronous operation returns a `Task`.
2. If the task is already complete, execution continues immediately.
3. If it is incomplete, the method returns its own incomplete task to its caller.
4. The current thread is released instead of being blocked.
5. When the operation finishes, execution continues after the `await`.
6. A failure is rethrown as its original exception, and cancellation normally appears as `OperationCanceledException`.

Changing only `.Wait()` is not always enough. The containing method and its callers usually need to become asynchronous until the chain reaches a natural async boundary, such as an ASP.NET Core endpoint.

## 4. Practical example

A banking API publishes a transfer command to a message broker. The original endpoint calls `.Wait()` after publishing. During a busy period, many request threads sit blocked while waiting for network responses from the broker.

The publish method is changed to return `Task`, and the endpoint awaits it. The request cancellation token is passed to the broker client. The API can then use its threads for other requests while the publish operation is waiting, improving throughput without changing the business flow.

## 5. Scenario-based interview answer

**Problem:** A payment endpoint called `.Wait()` on an asynchronous fraud check. It passed functional tests, but load testing showed increasing thread-pool usage, slow responses, and occasional timeouts.

**Decision:** I changed the complete request path to asynchronous code. Because the work was network I/O, I used the existing asynchronous API directly rather than wrapping it in `Task.Run`.

**Implementation:** I changed the service method from `void` to `async Task`, replaced `.Wait()` with `await`, updated its callers to await it, and passed the request cancellation token through the call chain. I also adjusted exception handling to catch the original service exception instead of `AggregateException`.

**Result:** Request threads were no longer blocked during the fraud check. The service handled more concurrent payments, response times became more stable, and failures were easier to log and diagnose.

## 6. Code example

Before refactoring:

```csharp
public void ConfirmTransfer(TransferRequest request)
{
    _fraudClient.ValidateAsync(request).Wait();
    _repository.MarkAsConfirmedAsync(request.TransferId).Wait();
}
```

This method blocks twice and cannot be awaited by its caller.

Refactored version:

```csharp
public sealed record TransferRequest(Guid TransferId, decimal Amount);

public sealed class TransferService(
    FraudClient fraudClient,
    TransferRepository repository)
{
    public async Task ConfirmTransferAsync(
        TransferRequest request,
        CancellationToken cancellationToken)
    {
        await fraudClient.ValidateAsync(request, cancellationToken);

        await repository.MarkAsConfirmedAsync(
            request.TransferId,
            cancellationToken);
    }
}
```

An ASP.NET Core endpoint can await the service:

```csharp
app.MapPost("/transfers/confirm", async (
    TransferRequest request,
    TransferService service,
    CancellationToken cancellationToken) =>
{
    await service.ConfirmTransferAsync(request, cancellationToken);
    return Results.NoContent();
});
```

Important points:

- The method returns `Task`, not `void`, so completion and errors can be observed.
- Each asynchronous operation is awaited instead of blocked.
- The `Async` suffix makes the asynchronous contract clear.
- Cancellation flows from the HTTP request to the downstream operations.
- The two operations remain sequential because confirmation must happen only after fraud validation succeeds.

## 7. Common mistakes

- Replacing `.Wait()` in one method but blocking again in its caller. Update the call chain where possible.
- Changing the method to `async void`. Except for event handlers, return `Task` so callers can await it and observe failures.
- Using `Task.Run` around an asynchronous I/O operation. This uses an extra thread and does not solve the design problem.
- Starting the task without awaiting or returning it. The caller may report success before the work finishes, and exceptions may be lost.
- Forgetting to pass `CancellationToken` through supported APIs.
- Keeping exception handling for `AggregateException`. With `await`, handle the original exception type at the correct boundary.
- Replacing `.Wait()` with `.GetAwaiter().GetResult()` and calling it asynchronous. It changes exception wrapping but still blocks the thread.
- Running independent tasks one after another when they could safely run together. Use `Task.WhenAll` only when the operations have no required order and concurrent execution is safe.

## 8. Follow-up interview questions

### What is the difference between `.Wait()` and `await`?

`.Wait()` blocks the calling thread. `await` asynchronously pauses the method and allows the thread to do other work until the task completes.

### Why should an async method return `Task` instead of `void`?

A returned `Task` lets the caller await completion, handle errors, and compose the operation with other tasks. `async void` should normally be limited to event handlers.

### Is `.Wait()` safe in ASP.NET Core because it has no synchronization context?

It is less likely to cause the classic synchronization-context deadlock, but it still blocks a thread. Under load, this can cause thread-pool starvation, poor throughput, and high latency, so `await` is still the correct approach for asynchronous I/O.
