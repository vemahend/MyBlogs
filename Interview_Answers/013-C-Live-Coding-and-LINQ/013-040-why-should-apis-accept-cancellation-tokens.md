# 40. Why should APIs accept cancellation tokens?

**Technology:** C# Live Coding and LINQ

**Source question:** 40. Why should APIs accept cancellation tokens?

## 1. What is it?

A `CancellationToken` lets a caller tell an API, “I no longer need this work.” An asynchronous API should accept a token when its operation may take time, wait for I/O, or call another service.

Cancellation is cooperative. The token does not forcibly stop a thread. The API and every operation it calls must observe the token and stop safely.

## 2. Why is it important?

Without cancellation, work can continue after an HTTP client disconnects, a timeout expires, or an application starts shutting down. That wastes database connections, network capacity, memory, CPU, and thread-pool resources.

Accepting a token also gives the caller control over the lifetime of an operation. In a distributed system, this helps prevent abandoned work from building up and making an already busy service less stable.

Cancellation is not the same as rollback. If an operation has already changed data or sent a payment request, cancelling the remaining work does not automatically undo those effects. Such workflows still need transactions, idempotency, or compensation.

## 3. How does it work?

The caller creates or receives a `CancellationToken` and passes it down the complete call chain. For example, an ASP.NET Core endpoint can receive `HttpContext.RequestAborted` and pass it to application code, EF Core, and `HttpClient`.

When cancellation is requested:

1. APIs that support the token stop waiting or processing as soon as they safely can.
2. Application code can check `token.ThrowIfCancellationRequested()` between meaningful units of work.
3. The operation normally ends with `OperationCanceledException` or a derived `TaskCanceledException`.
4. The caller distinguishes expected cancellation from a genuine failure by checking the relevant token.

Passing the token to real asynchronous I/O is usually more useful than checking it repeatedly in ordinary code. Current supported .NET and ASP.NET Core versions provide token-aware overloads for common APIs such as EF Core queries, `HttpClient.SendAsync`, `Task.Delay`, and stream operations.

## 4. Practical example

Consider a banking endpoint that displays recent transactions. The user closes the mobile app while the API is querying the database and calling a fraud-profile service.

ASP.NET Core signals `RequestAborted`. The endpoint passes that token to EF Core and `HttpClient`, so the database query or HTTP wait can finish early. The server releases resources instead of completing a response that nobody will read.

However, for a money-transfer endpoint, the service should not assume that a client disconnect means the transfer must be reversed. Once the transfer has crossed the commit boundary, it should finish or recover reliably using an idempotency key and durable workflow state.

## 5. Scenario-based interview answer

“In a payment reporting API, we found that requests timed out at the gateway but the service continued running database queries and downstream calls. During peak traffic, those abandoned operations increased connection-pool pressure and made later requests slower.

I decided to make cancellation part of the contract for every long-running asynchronous method. We passed ASP.NET Core’s request cancellation token through the application layer to EF Core and `HttpClient`, and we used linked tokens where an operation also needed an internal timeout. We checked cancellation between batches, but not after crossing an irreversible payment commit without first recording durable state.

As a result, read-only abandoned work stopped earlier, resource usage fell during traffic spikes, and cancellation was logged separately from real system errors. For financial writes, we kept correctness through idempotency and recovery rather than treating cancellation as rollback.”

## 6. Code example

```csharp
app.MapGet("/accounts/{accountId}/transactions", async (
    Guid accountId,
    BankingDbContext db,
    HttpClient fraudClient,
    CancellationToken cancellationToken) =>
{
    var transactions = await db.Transactions
        .AsNoTracking()
        .Where(t => t.AccountId == accountId)
        .OrderByDescending(t => t.CreatedAt)
        .Take(50)
        .ToListAsync(cancellationToken);

    using var response = await fraudClient.GetAsync(
        $"fraud/accounts/{accountId}/profile",
        cancellationToken);

    response.EnsureSuccessStatusCode();

    return Results.Ok(transactions);
});
```

In an ASP.NET Core minimal API, a `CancellationToken` parameter is bound to `HttpContext.RequestAborted`. The same token is passed to EF Core and `HttpClient`, so both I/O operations can react when the request is cancelled.

For a reusable service method, place the token last and commonly give it a default only when cancellation is optional at that API boundary:

```csharp
public Task<IReadOnlyList<Transaction>> GetRecentAsync(
    Guid accountId,
    CancellationToken cancellationToken = default)
{
    return repository.GetRecentAsync(accountId, cancellationToken);
}
```

Inside application code, do not replace the received token with `CancellationToken.None`; forward the original token to every operation that supports it.

## 7. Common mistakes

- Accepting a token but never passing it to EF Core, `HttpClient`, delays, streams, or child methods.
- Starting background work with a request token when that work is expected to continue after the request ends. Durable background work needs its own lifetime and queue.
- Treating `OperationCanceledException` as an application error and logging it at error level even when cancellation was expected.
- Assuming cancellation immediately terminates code or automatically rolls back completed side effects.
- Checking cancellation after a critical write without defining the operation’s commit boundary and recovery behavior.
- Creating a timeout `CancellationTokenSource` but forgetting to dispose it, or linking tokens unnecessarily in frequently called code.
- Catching `Exception` and converting cancellation into a generic HTTP 500 response.

## 8. Follow-up interview questions

**1. Should every method accept a `CancellationToken`?**  
No. It is most useful for asynchronous I/O, long-running work, loops, and operations that call cancellable APIs. Very small synchronous methods usually do not need one.

**2. What is the difference between cancellation and a timeout?**  
Cancellation is a general signal that work is no longer wanted. A timeout is one reason to request cancellation. `CancellationTokenSource.CancelAfter` or a linked token can combine an internal timeout with a caller’s token.

**3. When should `OperationCanceledException` be caught?**  
Usually let it propagate. Catch it only when adding useful context, cleaning up, translating it at a boundary, or distinguishing cancellation from failure. Do not swallow it and report success.
