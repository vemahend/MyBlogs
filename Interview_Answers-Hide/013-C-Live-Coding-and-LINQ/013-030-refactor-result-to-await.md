# 30. Refactor .Result to await.

**Technology:** C# Live Coding and LINQ

**Source question:** 30. Refactor .Result to await.

## 1. What is it?

Refactoring `.Result` to `await` means replacing synchronous blocking with asynchronous waiting.

For example, this code blocks the current thread:

```csharp
Payment payment = paymentClient.GetPaymentAsync(id).Result;
```

The asynchronous version does not block the thread while the operation is incomplete:

```csharp
Payment payment = await paymentClient.GetPaymentAsync(id, cancellationToken);
```

Usually, the containing method must become `async`, return `Task` or `Task<T>`, and its callers must also use `await`. This is often called **async all the way**.

## 2. Why is it important?

`.Result` blocks a thread until a task finishes. This creates two important risks:

- In UI applications and older ASP.NET applications, it can deadlock when the task continuation needs the context that the blocked thread owns.
- In ASP.NET Core and other server applications, it can cause thread-pool starvation under load. Requests wait for threads, latency grows, and throughput falls.

`await` pauses the method instead of blocking its thread. The thread can process other work while a database, HTTP service, or file operation is running. This makes I/O-heavy applications more responsive and scalable.

## 3. How does it work?

When code reads `.Result`, the calling thread waits synchronously for the task. If the task fails, `.Result` commonly exposes the failure through an `AggregateException`, which makes error handling less natural.

When code uses `await`:

1. The operation returns a `Task` or `Task<T>`.
2. If the task is incomplete, the async method returns its own incomplete task to its caller.
3. The current thread is released instead of waiting.
4. When the operation completes, execution continues after the `await`.
5. The result is returned, or the original exception is rethrown at the `await` statement.

Refactoring only one line is sometimes insufficient. The method signature and each caller up to an asynchronous boundary, such as an ASP.NET Core endpoint, usually need to change.

## 4. Practical example

A payment API calls a fraud-check service before approving a card payment. The original service uses `.Result` on the HTTP call. During a traffic peak, many request threads become blocked while the fraud provider responds.

The service is changed to return `Task<FraudDecision>` and await the HTTP operation. The controller also awaits the service and passes its `CancellationToken` through the call chain. While the fraud check is in progress, ASP.NET Core can use the thread for another request.

## 5. Scenario-based interview answer

**Problem:** A payment endpoint used `.Result` to read a fraud service response. It worked in light testing, but under load we saw high thread counts, increasing request latency, and timeouts.

**Decision:** I replaced synchronous blocking with asynchronous calls through the complete request path. I did not use `Task.Run`, because the work was network I/O and `HttpClient` already provides asynchronous APIs.

**Implementation:** I changed the service to return `Task<FraudDecision>`, awaited `SendAsync` and response deserialization, then updated the endpoint to await the service. I also passed the request cancellation token to every supported operation and kept normal exception handling around the awaited calls.

**Result:** Request threads were no longer held while waiting for the external provider. The API handled more concurrent requests, latency was more stable, and exceptions were easier to observe and diagnose.

## 6. Code example

Before refactoring, the method blocks twice:

```csharp
public FraudDecision CheckPayment(PaymentRequest request)
{
    HttpResponseMessage response = _httpClient
        .PostAsJsonAsync("fraud/check", request)
        .Result;

    response.EnsureSuccessStatusCode();
    return response.Content.ReadFromJsonAsync<FraudDecision>().Result!;
}
```

Refactored version:

```csharp
using System.Net.Http.Json;

public sealed record PaymentRequest(string PaymentId, decimal Amount);
public sealed record FraudDecision(bool Approved, string? Reason);

public sealed class FraudClient(HttpClient httpClient)
{
    public async Task<FraudDecision> CheckPaymentAsync(
        PaymentRequest request,
        CancellationToken cancellationToken)
    {
        using HttpResponseMessage response = await httpClient.PostAsJsonAsync(
            "fraud/check",
            request,
            cancellationToken);

        response.EnsureSuccessStatusCode();

        FraudDecision? decision = await response.Content
            .ReadFromJsonAsync<FraudDecision>(cancellationToken);

        return decision
            ?? throw new InvalidOperationException("The fraud service returned no decision.");
    }
}
```

An ASP.NET Core endpoint can continue the asynchronous chain:

```csharp
app.MapPost("/payments/check", async (
    PaymentRequest request,
    FraudClient fraudClient,
    CancellationToken cancellationToken) =>
{
    FraudDecision decision = await fraudClient.CheckPaymentAsync(
        request,
        cancellationToken);

    return Results.Ok(decision);
});
```

Important points:

- The service now returns `Task<FraudDecision>` and follows the `Async` naming convention.
- Every asynchronous operation is awaited rather than blocked.
- Cancellation flows from the HTTP request to the downstream HTTP call.
- `await` preserves normal exception behavior; production code can handle failures in middleware or at an appropriate boundary.

## 7. Common mistakes

- Replacing `.Result` in one method but then using `.Result` in its caller. Update the full call chain where possible.
- Changing the method to `async void`. Except for event handlers, use `Task` or `Task<T>` so callers can await completion and observe errors.
- Wrapping an asynchronous I/O call in `Task.Run`. This consumes another thread and does not fix the underlying design.
- Forgetting to pass `CancellationToken` to HTTP, database, and other supported asynchronous APIs.
- Starting a task without awaiting or returning it. Work may outlive the request, and failures may be lost.
- Assuming `.GetAwaiter().GetResult()` is an asynchronous fix. It avoids the `AggregateException` wrapper but still blocks and can still deadlock or starve threads.
- Adding `ConfigureAwait(false)` everywhere in ASP.NET Core application code. ASP.NET Core normally has no request synchronization context; it is mainly a consideration for reusable library code.
- Converting CPU-heavy work to `async` and expecting it to run faster. `await` mainly helps when an operation spends time waiting for I/O.

## 8. Follow-up interview questions

### Can `.Result` always cause a deadlock?

No. The risk depends on the execution context and how the awaited code captures it. Modern ASP.NET Core normally has no request synchronization context, but `.Result` still blocks a thread and can cause thread-pool starvation.

### Why not replace `.Result` with `Task.Run`?

`Task.Run` moves blocking work to another thread; it does not make I/O asynchronous. Use the underlying asynchronous HTTP, database, or file API and await it.

### What if a synchronous interface cannot be changed?

Keep the synchronous boundary small and avoid calling asynchronous code synchronously where possible. A proper long-term fix is usually to add an asynchronous contract and migrate callers. If blocking is unavoidable in legacy integration code, treat it as a documented compromise and never assume it is equivalent to `await`.
