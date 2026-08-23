# 37. How do you run independent asynchronous operations concurrently?

**Technology:** C# Live Coding and LINQ

**Source question:** 37. How do you run independent asynchronous operations concurrently?

## 1. What is it?

When asynchronous operations do not depend on each other, start all of them first and then wait for them together with `Task.WhenAll`.

This allows the operations to overlap. It does not necessarily create new threads; for I/O work, such as HTTP or database calls, each operation normally waits without blocking a thread.

## 2. Why is it important?

Awaiting independent operations one at a time adds their waiting times together. Running them concurrently can reduce the total response time to roughly the duration of the slowest operation.

This is useful in APIs that must collect data from several services. It improves latency while keeping the code readable. However, concurrency must be controlled so that the application does not overload databases, external services, or connection pools.

## 3. How does it work?

The usual flow is:

1. Call each asynchronous method without immediately awaiting it. Each call returns a `Task` and begins its work.
2. Pass the tasks to `Task.WhenAll`.
3. `Task.WhenAll` returns a task that completes only after every supplied task has completed.
4. Await that combined task, and then read the individual results or use the result array.

`Task.WhenAll` provides concurrency, not parallel CPU execution. For naturally asynchronous I/O, avoid wrapping calls in `Task.Run`. For CPU-bound work, parallel processing is a separate decision.

If one or more operations fail, the task returned by `WhenAll` completes in a faulted state after all operations finish. The returned task retains all exceptions, although a normal `await` throws one of them. Cancellation should normally be passed to every underlying operation.

## 4. Practical example

A banking dashboard needs the customer's account balance, recent transactions, and reward points. These calls use different services and none needs the result of another.

Starting the three calls together avoids waiting for each network round trip in sequence. The API waits once for all three results and then builds the dashboard response. If the services take 200 ms, 350 ms, and 150 ms, the waiting time is close to 350 ms rather than 700 ms, excluding other processing.

## 5. Scenario-based interview answer

“In a payment-status API, we had to retrieve the payment record, fraud review, and settlement status from three independent services. The endpoint was slow because the calls were awaited one after another.

I changed the flow so that all three asynchronous calls started first, using the same request cancellation token, and then awaited them with `Task.WhenAll`. I did not use `Task.Run` because these were already asynchronous I/O operations. I also kept timeouts and logging around each dependency and limited concurrency where the downstream system required it.

This reduced the endpoint latency because the network waits overlapped. We also defined how to handle partial failures instead of silently returning incomplete payment information.”

## 6. Code example

```csharp
public sealed record AccountSummary(
    decimal Balance,
    IReadOnlyList<Transaction> Transactions,
    int RewardPoints);

public async Task<AccountSummary> GetAccountSummaryAsync(
    Guid customerId,
    CancellationToken cancellationToken)
{
    Task<decimal> balanceTask =
        balanceClient.GetBalanceAsync(customerId, cancellationToken);

    Task<IReadOnlyList<Transaction>> transactionsTask =
        transactionClient.GetRecentAsync(customerId, cancellationToken);

    Task<int> rewardPointsTask =
        rewardsClient.GetPointsAsync(customerId, cancellationToken);

    await Task.WhenAll(balanceTask, transactionsTask, rewardPointsTask);

    return new AccountSummary(
        await balanceTask,
        await transactionsTask,
        await rewardPointsTask);
}
```

All three calls are started before the first `await`, so their I/O waits can overlap. `Task.WhenAll` ensures that every task has completed. Awaiting each task afterward retrieves its typed result; because the tasks are already complete, those awaits do not start the operations again.

The same `CancellationToken` is passed to each dependency so an abandoned HTTP request can cancel all related work. In production, each client should also have an appropriate timeout and resilience policy.

## 7. Common mistakes

- Awaiting each independent call immediately, which makes the operations run sequentially.
- Using `Task.Run` around methods that already perform asynchronous I/O.
- Starting unlimited operations for a large collection. Use bounded concurrency, such as `Parallel.ForEachAsync` in .NET 6+ or a `SemaphoreSlim`, when load must be limited.
- Sharing one Entity Framework Core `DbContext` across concurrent operations. A `DbContext` does not support concurrent use; use separate contexts or run those queries sequentially.
- Ignoring cancellation, timeouts, rate limits, and downstream capacity.
- Assuming `WhenAll` stops the remaining tasks after one failure. It waits for all supplied tasks; cancellation must be designed explicitly.
- Losing information about multiple failures. Inspect the combined task's `Exception` when every underlying exception must be logged or handled.
- Blocking with `.Result` or `.Wait()` instead of using `await` throughout the call chain.

## 8. Follow-up interview questions

### Is `Task.WhenAll` the same as running work on multiple threads?

No. It coordinates tasks concurrently. Asynchronous I/O usually does not occupy a thread while waiting. CPU-bound parallelism may use multiple threads, but that is a different use case.

### What is the difference between `Task.WhenAll` and `Task.WhenAny`?

`Task.WhenAll` completes after every task finishes. `Task.WhenAny` completes when the first task finishes and returns that completed task; the other tasks continue unless they are explicitly cancelled.

### How would you limit concurrency for hundreds of operations?

Use bounded concurrency rather than starting every operation at once. In .NET 6 or later, `Parallel.ForEachAsync` supports `MaxDegreeOfParallelism`; `SemaphoreSlim` is another common option when more control is needed.
