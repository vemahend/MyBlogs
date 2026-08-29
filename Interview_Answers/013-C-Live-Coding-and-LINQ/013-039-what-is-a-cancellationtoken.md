# 39. What is a CancellationToken?

**Technology:** C# Live Coding and LINQ

**Source question:** 39. What is a CancellationToken?

## 1. What is it?

A `CancellationToken` is a .NET value that tells an operation that cancellation has been requested.

It does not forcibly stop code. The operation must observe the token and stop safely. This is called **cooperative cancellation**.

Usually, a `CancellationTokenSource` creates and controls the token. The caller requests cancellation through the source, while the called method receives only the token.

## 2. Why is it important?

Long-running work may no longer be needed. For example, a user may close a page, an HTTP request may be disconnected, or a service timeout may expire.

Without cancellation, the application can continue using database connections, network bandwidth, CPU, and memory for work whose result will never be used. In busy systems, this can reduce performance and stability.

Cancellation also allows an operation to stop at a safe point, release resources, and avoid leaving partial business changes.

## 3. How does it work?

1. A caller creates a `CancellationTokenSource` or receives a token from the framework.
2. The caller passes the token through every method involved in the operation.
3. Supported async APIs, such as `HttpClient.SendAsync`, `Task.Delay`, and Entity Framework Core async methods, monitor the token.
4. Custom code can check `IsCancellationRequested` or call `ThrowIfCancellationRequested()`.
5. When cancellation is requested, the operation stops cooperatively. Async APIs normally complete with an `OperationCanceledException` or a derived `TaskCanceledException`.

`CancellationToken` is a `struct`, so passing it is inexpensive. A single token can notify several operations. Cancellation is a signal, not a rollback mechanism, and a `CancellationTokenSource` cannot be reset for general reuse after cancellation.

## 4. Practical example

Consider a payment API that calls a fraud-check service before authorizing a card payment. If the client disconnects or the request times out, ASP.NET Core sets `HttpContext.RequestAborted`.

The API passes that token to the fraud service and database calls. Those operations can stop early instead of holding connections and continuing work for an abandoned request.

Cancellation must still respect the business boundary. After the bank has accepted the payment, the API should not assume cancellation reversed it. It should store the payment state and use an idempotency key or reconciliation process to handle an uncertain result safely.

## 5. Scenario-based interview answer

“In a payment service, we found that timed-out requests were still running fraud checks and database queries. This increased connection usage during traffic peaks.

I decided to propagate the ASP.NET Core request cancellation token through the service and repository layers. We passed it to `HttpClient`, Entity Framework Core, and any cancellable delays. In our own loops, we checked the token at sensible points rather than on every instruction.

We allowed cancellation before the payment was submitted. After crossing the external payment boundary, we recorded the operation state and used idempotency and reconciliation, because cancellation cannot undo a request that the provider may already have processed.

As a result, abandoned requests released resources earlier, while payment consistency remained protected.”

## 6. Code example

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("payments")]
public sealed class PaymentsController : ControllerBase
{
    private readonly FraudClient _fraudClient;
    private readonly PaymentsDbContext _db;

    public PaymentsController(FraudClient fraudClient, PaymentsDbContext db)
    {
        _fraudClient = fraudClient;
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> CreatePayment(
        PaymentRequest request,
        CancellationToken cancellationToken)
    {
        var approved = await _fraudClient.CheckAsync(
            request,
            cancellationToken);

        if (!approved)
        {
            return BadRequest("Payment failed the fraud check.");
        }

        var payment = new Payment(request.Amount, request.IdempotencyKey);
        _db.Payments.Add(payment);

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new { payment.Id });
    }
}

public sealed class FraudClient
{
    private readonly HttpClient _httpClient;

    public FraudClient(HttpClient httpClient) => _httpClient = httpClient;

    public async Task<bool> CheckAsync(
        PaymentRequest request,
        CancellationToken cancellationToken)
    {
        using var response = await _httpClient.PostAsJsonAsync(
            "fraud/check",
            request,
            cancellationToken);

        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<bool>(
            cancellationToken: cancellationToken);
    }
}
```

ASP.NET Core automatically binds the action's `CancellationToken` to `HttpContext.RequestAborted`. The same token is passed to the HTTP and EF Core async calls, so cancellation flows through the whole request. Production code may handle `OperationCanceledException` at an application boundary for logging, but it should not convert expected cancellation into a server error.

## 7. Common mistakes

- Accepting a token but not passing it to downstream async methods.
- Using `CancellationToken.None` when the caller already supplied a token.
- Expecting cancellation to interrupt code immediately or roll back completed external work.
- Catching `OperationCanceledException` and treating it as an unexpected failure.
- Starting background work with an HTTP request token when that work must continue after the request ends.
- Forgetting to dispose a manually created `CancellationTokenSource`, especially one created with `CreateLinkedTokenSource`.
- Reusing a source that has already been cancelled.
- Cancelling after a critical external side effect without using idempotency or reconciliation.

## 8. Follow-up interview questions

### What is the difference between `CancellationTokenSource` and `CancellationToken`?

`CancellationTokenSource` owns the cancellation request and calls `Cancel()`. `CancellationToken` is the read-only signal passed to operations so they can observe that request.

### How can I combine a request cancellation token with a timeout?

Create a timeout source with `CancelAfter`, then use `CancellationTokenSource.CreateLinkedTokenSource` to combine it with the request token. Dispose both sources when finished.

### Should a cancelled operation return `false` or throw an exception?

Normally, cancellable async methods should throw `OperationCanceledException` by calling `ThrowIfCancellationRequested()` or by passing the token to a cancellable API. This keeps cancellation separate from a normal business result such as `false`.
