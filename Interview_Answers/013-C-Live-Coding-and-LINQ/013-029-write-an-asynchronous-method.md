# 29. Write an asynchronous method.

**Technology:** C# Live Coding and LINQ

**Source question:** 29. Write an asynchronous method.

## 1. What is it?

An asynchronous method can start an operation, such as an HTTP call or database query, and wait for it without blocking the current thread.

In C#, it normally:

- Uses the `async` keyword.
- Uses `await` for asynchronous operations.
- Returns `Task`, `Task<T>`, `ValueTask`, or `ValueTask<T>` rather than `void`.
- Has a name ending in `Async`, by convention.

`async` does not automatically create a new thread. Its main benefit is that the thread can do other work while an I/O operation is in progress.

## 2. Why is it important?

Many application operations spend time waiting for external resources. Examples include calling a payment provider, reading from a database, or accessing cloud storage.

If a web request blocks a thread during that wait, the application needs more threads and handles fewer users under load. Asynchronous code releases the thread while waiting, which improves scalability and responsiveness.

It also makes cancellation and timeout handling easier, which is important in reliable production systems.

## 3. How does it work?

When execution reaches an incomplete task at `await`:

1. The method returns an incomplete task to its caller.
2. Control returns to the caller, and the current thread is free to do other work.
3. The I/O operation continues through the operating system or external service.
4. When the operation completes, the rest of the method continues.
5. The returned task completes with a result or an exception.

If the awaited task has already completed, the method may continue immediately. Exceptions raised by an awaited operation are rethrown at the `await` statement and can be handled with normal `try`/`catch` logic.

In modern ASP.NET Core, there is normally no request synchronization context, so a continuation does not need to return to the original request thread.

## 4. Practical example

Consider a banking API that verifies an account before creating a transfer. It must call an account service over HTTP. While that service is responding, the banking API should not keep a request thread blocked.

The verification method therefore returns `Task<AccountStatus>`, awaits `HttpClient`, and accepts the request's `CancellationToken`. If the customer disconnects or the request times out, the unnecessary downstream call can be cancelled.

## 5. Scenario-based interview answer

**Problem:** A payment endpoint was calling a fraud service synchronously. During traffic peaks, request threads waited on network I/O, thread-pool pressure increased, and response times became unstable.

**Decision:** I changed the complete request path to be asynchronous rather than wrapping the synchronous call in `Task.Run`. Network I/O already has proper asynchronous APIs, so using another thread would only add overhead.

**Implementation:** I used `HttpClient.SendAsync`, awaited the response, returned `Task<FraudDecision>`, and passed a `CancellationToken` from the controller through every layer. I also kept timeout handling separate from user cancellation and allowed unexpected exceptions to reach the central exception handler.

**Result:** Threads were no longer blocked while waiting for the fraud provider. The service handled more concurrent requests and behaved more predictably when the downstream service was slow.

## 6. Code example

```csharp
using System.Net;
using System.Net.Http.Json;

public sealed record AccountStatus(string AccountId, bool IsActive);

public sealed class AccountClient(HttpClient httpClient)
{
    public async Task<AccountStatus?> GetAccountStatusAsync(
        string accountId,
        CancellationToken cancellationToken)
    {
        using HttpResponseMessage response = await httpClient.GetAsync(
            $"accounts/{Uri.EscapeDataString(accountId)}",
            cancellationToken);

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<AccountStatus>(
            cancellationToken: cancellationToken);
    }
}
```

Important points:

- `Task<AccountStatus?>` represents a result that will be available later.
- Both asynchronous calls are awaited; no thread is deliberately blocked.
- The same `CancellationToken` is passed to the downstream operations.
- The response is disposed, non-success responses are handled, and `404` has an explicit business meaning.
- `HttpClient` should normally come from dependency injection or `IHttpClientFactory`, not be created for every call.

## 7. Common mistakes

- Calling `.Result`, `.Wait()`, or `.GetAwaiter().GetResult()` in an asynchronous flow. This blocks a thread and can cause deadlocks in environments with a synchronization context.
- Using `async void` except for event handlers. The caller cannot await it or reliably observe its exceptions.
- Using `Task.Run` around database or HTTP I/O. Use the real asynchronous API instead.
- Forgetting to await a task, causing work and exceptions to be missed.
- Ignoring `CancellationToken`, especially across database and HTTP boundaries.
- Catching exceptions only to hide them or return a misleading successful result.
- Assuming async makes CPU-heavy work faster. It mainly helps with non-blocking waits; CPU-bound work needs a different design.
- Using `ValueTask<T>` by default. `Task<T>` is simpler and is usually the right choice unless measurement shows a specific allocation problem.

## 8. Follow-up interview questions

### What is the difference between `Task` and `Task<T>`?

`Task` represents asynchronous completion with no return value. `Task<T>` completes with a value of type `T`.

### When should `ConfigureAwait(false)` be used?

It is useful mainly in reusable library code that does not need to resume on the captured context. ASP.NET Core does not normally have a synchronization context, so it usually provides no practical benefit in application request code.

### Should an asynchronous method always use the `async` keyword?

No. A method can directly return an existing task when it has nothing to do before or after that task completes. Use `async` when the method needs `await`, for example for multiple steps, `try`/`catch`, or `using` logic around the awaited operation.
