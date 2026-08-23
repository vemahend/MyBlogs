# 34. What happens internally when await is reached?

**Technology:** C# Live Coding and LINQ

**Source question:** 34. What happens internally when await is reached?

## 1. What is it?

`await` pauses the current async method until an awaited operation finishes, without blocking the thread. The method keeps enough information to continue from the next line later.

The method may not actually pause. If the awaited task is already complete, execution usually continues immediately on the same thread.

## 2. Why is it important?

Many applications spend time waiting for databases, HTTP services, files, or queues. Blocking a thread during that wait wastes resources and reduces scalability.

With `await`, the thread can return to the thread pool and do other work. This is especially important in ASP.NET Core services handling many concurrent requests. It also lets developers write asynchronous code in a clear, step-by-step style instead of manually creating callbacks.

## 3. How does it work?

The C# compiler transforms an `async` method into a state machine. When execution reaches `await`:

1. The generated code gets an awaiter from the awaitable object and checks whether the operation is already complete.
2. If it is complete, the method continues synchronously and obtains the result.
3. If it is not complete, the state machine stores its current state, including local variables needed later.
4. It registers a continuation with the awaiter and returns an incomplete `Task` to its caller. The current thread is not kept waiting.
5. When the operation completes, the continuation runs and moves the state machine forward from the line after `await`.
6. The awaiter supplies the result. If the operation failed, its exception is rethrown at the `await` line. When the method finishes, its returned task is completed with a result, exception, or cancellation.

Where the continuation runs depends on the environment. A UI application normally captures its `SynchronizationContext` so it can resume on the UI thread. ASP.NET Core does not install a request `SynchronizationContext`, so continuations normally run on an available thread-pool thread. `ConfigureAwait(false)` avoids requesting a captured context when one exists; it does not create a new thread.

## 4. Practical example

A payment API saves a transaction and then calls a bank gateway. While it is waiting for the gateway's HTTP response, `await` returns control to ASP.NET Core. The request thread can process other requests instead of sitting idle. When the response arrives, the payment method resumes, checks the result, and updates the transaction status.

This improves throughput, but it does not make the bank call itself faster.

## 5. Scenario-based interview answer

**Problem:** A payment endpoint used synchronous HTTP and database calls. During traffic peaks, many threads were blocked, thread-pool queues grew, and response times became unstable.

**Decision:** I changed the complete request path to async, rather than making only the controller async while lower layers still blocked.

**Implementation:** The controller, service, HTTP client, and repository all returned `Task` and awaited their I/O operations. When an incomplete operation was awaited, the generated state machine saved the method state, returned the thread to the pool, and registered the remaining code as a continuation. I also passed the request cancellation token through every supported API.

**Result:** The external dependencies took roughly the same time, but the service handled more concurrent requests with fewer blocked threads and more stable latency.

In an interview, I would summarize it like this: "`await` does not block the thread and it does not automatically start a new thread. The compiler-generated state machine either continues immediately if the task has finished, or stores the current state and registers a continuation. The method returns an incomplete task, and resumes when the awaited work completes."

## 6. Code example

```csharp
public sealed record PaymentResult(string Status);

public sealed class PaymentService(HttpClient bankClient)
{
    public async Task<PaymentResult> AuthorizeAsync(
        string paymentId,
        CancellationToken cancellationToken)
    {
        using HttpResponseMessage response = await bankClient.PostAsJsonAsync(
            "payments/authorize",
            new { PaymentId = paymentId },
            cancellationToken);

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<PaymentResult>(
                   cancellationToken: cancellationToken)
               ?? throw new InvalidOperationException("The bank returned no result.");
    }
}
```

At the first `await`, if the HTTP task is incomplete, `AuthorizeAsync` returns an incomplete `Task<PaymentResult>` to its caller. The thread is free to do other work. After the HTTP response arrives, execution resumes at `response.EnsureSuccessStatusCode()`. The second `await` behaves in the same way while the response body is read. The cancellation token allows client disconnects or request cancellation to flow to supported I/O operations.

## 7. Common mistakes

- Saying that `await` creates a new thread. It normally waits for an existing asynchronous operation; no dedicated waiting thread is required.
- Calling `.Result`, `.Wait()`, or `.GetAwaiter().GetResult()` in async request code. This blocks threads and can cause deadlocks in environments with a synchronization context.
- Using `async void` except for event handlers. Callers cannot reliably await it or observe its failures.
- Forgetting to await a returned task. Work may still be running, and exceptions can be missed.
- Mixing async code with blocking database, HTTP, or file APIs. The blocked lower layer removes much of the scalability benefit.
- Assuming every `await` causes a thread switch. A completed task can continue synchronously, and an incomplete task may later resume on the same or a different thread.
- Ignoring cancellation and timeouts for remote calls.

## 8. Follow-up interview questions

### Does `await` always release the current thread?

No. If the awaited task is already complete, execution can continue synchronously. If it is incomplete, the method returns control and does not block the thread while waiting.

### What is captured across an `await`?

The generated state machine stores its position and any local variables needed after the await. Depending on the environment and await configuration, a synchronization context or task scheduler may also be used for the continuation.

### How are exceptions handled in an async method?

An exception is stored in the returned task. Awaiting that task rethrows the original exception at the `await` expression, so normal `try`/`catch` can handle it.
