# 1. Explain async and await internally.

**Technology:** Async Await and .NET Internals

**Source question:** 1. Explain async and await internally.

## 1. What is it?

`async` and `await` let us write non-blocking asynchronous code in a readable, step-by-step style.

- `async` tells the C# compiler that a method may pause at an `await` and continue later.
- `await` observes an awaitable operation, usually a `Task` or `Task<T>`. If it is not finished, the method pauses without blocking the current thread.
- When the operation finishes, the rest of the method continues.

They do not automatically create a new thread. They are mainly compiler features built around tasks, awaiters, and a generated state machine.

## 2. Why is it important?

Applications spend a lot of time waiting for databases, HTTP services, files, queues, and other I/O. Blocking a thread during that wait wastes a limited resource and reduces scalability.

With `async` and `await`, the thread can process other work while the operation is pending. This is especially important in ASP.NET Core services handling many concurrent requests. It also keeps UI applications responsive and makes asynchronous workflows easier to read, test, and maintain than manual callbacks.

`async` improves scalability for I/O-bound work; it does not make CPU-bound work inherently faster.

## 3. How does it work?

For most `async` methods, the compiler performs these steps:

1. It rewrites the method into a state machine. Local variables that must survive an `await` become fields on that state machine.
2. The method starts running synchronously on the calling thread, up to the first incomplete `await`.
3. The code gets an awaiter from the awaited value and checks `IsCompleted`.
4. If the operation is already complete, execution continues synchronously. There is no forced pause.
5. If it is incomplete, the state machine stores its current state and registers a continuation through the awaiter. The method then returns an incomplete `Task` to its caller.
6. For true asynchronous I/O, the operating system or runtime monitors the operation; no .NET thread needs to sit blocked for the whole wait.
7. When the operation completes, the continuation schedules the state machine's `MoveNext` method. `MoveNext` restores the saved state, gets the result, and runs until the next incomplete `await` or the end of the method.
8. On success, the generated async method builder completes the returned task. On failure, it stores the exception in that task. The exception is rethrown when a caller awaits the task.

Continuation location depends on the environment. A UI application normally captures its `SynchronizationContext` so code resumes on the UI thread. ASP.NET Core does not install a request `SynchronizationContext`, so a continuation normally runs on an available thread-pool thread. It is not guaranteed to be the same thread that started the method. `ConfigureAwait(false)` avoids context capture where a context exists and is commonly useful in reusable library code.

## 4. Practical example

Consider a payment API that must call a fraud service and then save the payment result. While `HttpClient.SendAsync` waits for the fraud service, the request thread is not blocked. It can return to the thread pool and serve other requests. When the HTTP response arrives, the payment method continues, validates the result, and asynchronously writes to the database.

This allows the service to support many pending payments without requiring one blocked thread per payment. The database and downstream services can still become bottlenecks, so timeouts, cancellation, connection limits, and resilience policies remain necessary.

## 5. Scenario-based interview answer

**Problem:** “A payment endpoint became slow during peak traffic. It used `.Result` for fraud checks and database calls, so request threads were blocked while waiting for I/O. Thread-pool queues grew and latency increased.”

**Decision:** “I changed the complete request path to async instead of wrapping blocking calls in `Task.Run`. These operations were I/O-bound, so extra worker threads would only add overhead.”

**Implementation:** “The controller awaited an asynchronous payment service, which awaited `HttpClient` and EF Core APIs. We passed the request cancellation token through every layer, configured outbound timeouts, and avoided sync-over-async calls. Internally, each incomplete await saved the generated state-machine state and returned control, allowing the current worker thread to handle other requests.”

**Result:** “Thread-pool pressure dropped and the service handled more concurrent requests with more stable latency. I would also explain that await did not reserve the original thread; after I/O completion, the continuation could run on another pool thread because ASP.NET Core has no request synchronization context.”

## 6. Code example

```csharp
public sealed class PaymentService(
    HttpClient fraudClient,
    PaymentsDbContext dbContext)
{
    public async Task<PaymentResult> ProcessAsync(
        PaymentRequest request,
        CancellationToken cancellationToken)
    {
        using HttpResponseMessage response = await fraudClient.PostAsJsonAsync(
            "fraud/check",
            request,
            cancellationToken);

        response.EnsureSuccessStatusCode();

        FraudResult fraudResult = (await response.Content.ReadFromJsonAsync<FraudResult>(
            cancellationToken: cancellationToken))
            ?? throw new InvalidOperationException("Fraud service returned no result.");

        if (!fraudResult.Approved)
        {
            return PaymentResult.Rejected("Fraud check failed");
        }

        var payment = new Payment(request.AccountId, request.Amount);
        dbContext.Payments.Add(payment);
        await dbContext.SaveChangesAsync(cancellationToken);

        return PaymentResult.Approved(payment.Id);
    }
}
```

Both I/O calls are awaited. If either task is incomplete, the method returns an incomplete `Task<PaymentResult>` instead of blocking the request thread. The generated state machine keeps `request`, `fraudResult`, and other required state alive. The cancellation token allows work to stop when the request is aborted or a caller cancels it. Exceptions are recorded in the returned task and appear naturally at the caller's `await`.

## 7. Common mistakes

- Calling `.Result`, `.Wait()`, or `GetAwaiter().GetResult()` in an async flow. This blocks threads and can cause deadlocks in environments with a synchronization context.
- Using `async void` except for event handlers. Its caller cannot await completion or handle exceptions normally.
- Assuming `async` creates a new thread or using `Task.Run` around naturally asynchronous I/O.
- Forgetting to await a task, which can cause lost exceptions, early responses, or incomplete work.
- Making only the controller async while lower layers still use blocking database or network APIs. Async should normally flow through the whole call chain.
- Ignoring cancellation, timeouts, and exception handling for remote calls.
- Starting many tasks without a concurrency limit. Async reduces blocked threads but does not remove database, socket, memory, or downstream capacity limits.
- Depending on thread-local state or assuming execution resumes on the original thread.

## 8. Follow-up interview questions

### Does `async` create a new thread?

No. An async method initially runs on the caller's thread. I/O can remain pending without a blocked thread, and its continuation is scheduled when the operation completes. `Task.Run` explicitly schedules work on the thread pool and is mainly useful for CPU-bound work when offloading is appropriate.

### What happens if the awaited task is already complete?

The awaiter reports `IsCompleted` as true, so the method continues synchronously without suspending the state machine or scheduling a continuation.

### Who resumes an async method after `await`?

The awaited operation completes its task, and the registered continuation schedules the generated state machine's `MoveNext` method. The continuation may use a captured synchronization context, a task scheduler, or the thread pool, depending on the environment and await configuration.
