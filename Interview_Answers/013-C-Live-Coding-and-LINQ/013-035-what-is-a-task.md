# 35. What is a Task?

**Technology:** C# Live Coding and LINQ

**Source question:** 35. What is a Task?

## 1. What is it?

A `Task` in .NET represents an operation that may finish later. It can complete successfully, fail with an exception, or be cancelled.

`Task` does not mean “a new thread.” For I/O work, such as calling a payment API or reading a database, a task can wait without keeping a thread blocked. For CPU-heavy work, a task may run code on a thread-pool thread.

`Task` represents an operation with no return value. `Task<T>` represents an operation that eventually produces a value of type `T`.

## 2. Why is it important?

Tasks are the foundation of asynchronous programming in modern .NET. They help an application stay responsive and use threads efficiently while operations are waiting for external resources.

In an ASP.NET Core service, this matters because blocked request threads reduce throughput. Using tasks with `async` and `await` allows those threads to serve other requests while the database, network, or file operation is in progress.

Tasks also provide a standard way to:

- Wait for an operation without blocking the current thread.
- Return a future result with `Task<T>`.
- Report exceptions and cancellation.
- coordinate multiple operations with APIs such as `Task.WhenAll` and `Task.WhenAny`.

## 3. How does it work?

An asynchronous method normally returns a `Task` immediately. When execution reaches an `await`:

1. If the task is already complete, the method continues immediately.
2. If it is not complete, the method records the remaining work as a continuation and returns control to its caller.
3. The underlying operation continues. For true asynchronous I/O, no thread needs to sit and wait for it.
4. When the operation completes, .NET schedules the continuation and the method resumes.
5. The returned task becomes successful, faulted, or cancelled when the whole method finishes.

Exceptions thrown inside an asynchronous method are stored in its returned task. `await` observes the task and rethrows the original exception in a natural way. Cancellation is cooperative and is usually requested through a `CancellationToken`.

## 4. Practical example

Consider a payment API that checks an account and then sends a request to an external payment provider. Both database and HTTP calls spend most of their time waiting for I/O.

The service returns `Task<PaymentResult>` and awaits those calls. While it waits, ASP.NET Core can reuse the request thread for other work. This improves throughput during busy periods without creating one thread for every payment request.

## 5. Scenario-based interview answer

“In one payment service, response times became unstable during peak traffic because database and provider calls were being made synchronously. Request threads were blocked while waiting for I/O, so the server experienced thread-pool pressure.

I changed the workflow to return `Task<PaymentResult>` and used async database and HTTP APIs end to end. I passed the request cancellation token through every layer and awaited each task instead of using `.Result` or `.Wait()`. Independent fraud and limit checks were run together with `Task.WhenAll` after confirming that they did not share a non-thread-safe EF Core `DbContext`.

As a result, the service handled more concurrent requests with fewer blocked threads. I would describe a task as a handle for an operation that will complete later, not as a dedicated thread.”

## 6. Code example

```csharp
public sealed record PaymentResult(bool Approved, string Reference);

public async Task<PaymentResult> ProcessPaymentAsync(
    decimal amount,
    CancellationToken cancellationToken)
{
    Account account = await accountRepository.GetCurrentAsync(cancellationToken);

    if (account.AvailableBalance < amount)
    {
        return new PaymentResult(false, "Insufficient funds");
    }

    string reference = await paymentGateway.ChargeAsync(
        account.Id,
        amount,
        cancellationToken);

    return new PaymentResult(true, reference);
}
```

The method returns `Task<PaymentResult>` because the final result is available only after asynchronous operations finish. Each `await` waits without synchronously blocking the request thread. The `CancellationToken` lets the caller request cancellation if, for example, the HTTP client disconnects or its timeout expires.

The method does not use `Task.Run` because repository and HTTP operations should already provide true asynchronous I/O APIs.

## 7. Common mistakes

- Treating every task as a new thread. A task represents an operation; it does not guarantee a dedicated thread.
- Calling `.Result`, `.Wait()`, or `.GetAwaiter().GetResult()` in asynchronous request code. This blocks threads and can cause deadlocks in environments with a synchronization context.
- Using `Task.Run` around database or HTTP calls. It wastes a thread instead of using the existing asynchronous API.
- Starting a task and never awaiting or returning it. Exceptions may be missed, and the caller cannot know when the operation completes.
- Using `async void` except for event handlers. Callers cannot await it or handle its exceptions normally.
- Ignoring cancellation or failing to pass the `CancellationToken` to downstream operations.
- Running EF Core queries concurrently on the same `DbContext`. A `DbContext` does not support parallel operations.
- Creating a task with `new Task(...)` and forgetting to start it. Application code should normally call an async API or use `Task.Run` only for suitable CPU-bound work.

## 8. Follow-up interview questions

### What is the difference between `Task` and `Task<T>`?

`Task` signals completion but returns no value. `Task<T>` signals completion and provides a result of type `T` when awaited.

### Does `async` automatically run code on another thread?

No. `async` enables the use of `await`. Asynchronous I/O normally does not require a thread while it is waiting, and code before the first incomplete `await` runs on the calling thread.

### When should `Task.Run` be used?

Use it mainly to move CPU-bound work away from a UI thread. In ASP.NET Core request code, it usually does not improve scalability and should not wrap naturally asynchronous I/O.
