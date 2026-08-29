# 33. Does await create a thread?

**Technology:** C# Live Coding and LINQ

**Source question:** 33. Does await create a thread?

## 1. What is it?

No. `await` does not create a new thread.

`await` pauses the current async method until an operation finishes, without blocking the current thread. The method can continue later when the awaited `Task` completes.

Some operations may use threads internally, but that is decided by the operation being awaited, not by the `await` keyword.

## 2. Why is it important?

This distinction matters because async code is mainly about avoiding blocked threads, not creating more threads.

For I/O operations such as database calls, HTTP requests, and file access, the application can return the thread to the thread pool while it waits. In ASP.NET Core, this allows a smaller number of threads to handle many concurrent requests and improves scalability.

If a developer assumes that `await` automatically moves work to another thread, they may accidentally run CPU-heavy work on a request thread and reduce application performance.

## 3. How does it work?

When execution reaches `await`:

1. The method checks whether the awaited task is already complete.
2. If it is complete, the method continues immediately, usually on the same thread.
3. If it is incomplete, the compiler-generated async state machine stores the method's current state and returns control to the caller.
4. The current thread is free to do other work.
5. When the task completes, the remaining code is scheduled as a continuation.

In a UI application, the continuation normally returns to the captured synchronization context unless `ConfigureAwait(false)` is used. ASP.NET Core does not install a custom synchronization context, so the continuation may run on any available thread-pool thread. A change in thread ID does not mean that `await` created a thread.

`Task.Run` is different. It schedules work on the .NET thread pool and is mainly useful for CPU-bound work when offloading is appropriate. Even `Task.Run` normally reuses an existing pool thread rather than creating a dedicated new thread.

## 4. Practical example

Consider a payment API that calls a bank service to verify an account. While the API waits for the bank's HTTP response, no application thread needs to sit blocked. `await` lets the request method yield, and ASP.NET Core can use that thread to serve another request.

When the bank response arrives, the task completes and the payment method continues. This improves throughput, especially when many payments are being processed at the same time.

## 5. Scenario-based interview answer

**Problem:** A payment endpoint became slow under load because it used `.Result` when calling an external fraud-check service. Request threads stayed blocked while waiting for network responses, which caused thread-pool pressure.

**Decision:** I changed the full call path to async and used `await`. I explained that `await` would not create one thread per request; it would release the request thread while the network operation was in progress.

**Implementation:** The controller, application service, and HTTP client methods returned `Task` or `Task<T>`. We awaited `HttpClient.SendAsync`, passed cancellation tokens, and avoided `Task.Run` because the work was I/O-bound.

**Result:** The service handled more concurrent payment requests with fewer blocked threads, and latency under peak load improved.

A natural interview answer would be: "No, `await` does not create a thread. It waits for a `Task` without blocking the current thread. For an incomplete I/O task, the async method saves its state and returns. When the operation finishes, the rest of the method runs as a continuation, possibly on a different existing thread-pool thread. If I need to schedule CPU-bound work on the thread pool, that is a separate decision, usually made with `Task.Run`."

## 6. Code example

```csharp
public async Task<PaymentStatus> GetPaymentStatusAsync(
    string paymentId,
    CancellationToken cancellationToken)
{
    using HttpResponseMessage response = await httpClient.GetAsync(
        $"payments/{paymentId}",
        cancellationToken);

    response.EnsureSuccessStatusCode();

    return await response.Content.ReadFromJsonAsync<PaymentStatus>(
               cancellationToken: cancellationToken)
           ?? throw new InvalidOperationException("Payment status was empty.");
}
```

`GetAsync` performs asynchronous network I/O. While the response is pending, `await` does not block a thread and does not create one. After the response arrives, an available thread continues the method.

The cancellation token allows the work to stop when the caller cancels the request. There is no `Task.Run` because wrapping naturally asynchronous I/O in `Task.Run` adds unnecessary thread-pool work.

## 7. Common mistakes

- Saying that `await` starts a new thread. It does not; it registers a continuation for an incomplete task.
- Assuming the code after `await` must run on the same thread. That depends on the application's synchronization context and task scheduling.
- Using `.Result`, `.Wait()`, or `.GetAwaiter().GetResult()` in an async call path. These calls block a thread and can cause deadlocks in context-based applications or thread-pool starvation in server applications.
- Wrapping database, HTTP, or file async APIs in `Task.Run`. These APIs already provide asynchronous I/O.
- Using `Task.Run` for long-running work inside ASP.NET Core without considering queues, background services, cancellation, and capacity limits.
- Forgetting that CPU-bound code still consumes a thread even when it is placed inside an `async` method.

## 8. Follow-up interview questions

**1. Can execution continue on a different thread after `await`?**  
Yes. It depends on the captured synchronization context and task scheduler. In ASP.NET Core, the continuation can run on any available thread-pool thread.

**2. What is the difference between `await` and `Task.Run`?**  
`await` asynchronously waits for a task. `Task.Run` schedules work on the thread pool, usually for CPU-bound work that should be offloaded.

**3. Does an asynchronous I/O operation use no threads at all?**  
No thread is normally blocked while supported operating-system I/O is pending. Threads are still used briefly to start the operation and run its completion code, and implementation details can vary by API.
