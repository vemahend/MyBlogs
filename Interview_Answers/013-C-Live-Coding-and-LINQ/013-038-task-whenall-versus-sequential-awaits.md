# 38. Task.WhenAll versus sequential awaits?

**Technology:** C# Live Coding and LINQ

**Source question:** 38. Task.WhenAll versus sequential awaits?

## 1. What is it?

Sequential awaits wait for one asynchronous operation to finish before starting or awaiting the next one. This is correct when one operation depends on the result of another.

`Task.WhenAll` combines several tasks into one task that completes when every supplied task has completed. If the operations are independent and their tasks have already been started, they can spend their waiting time concurrently.

`Task.WhenAll` does not create threads and does not itself start the work. It only observes the tasks passed to it.

## 2. Why is it important?

Many .NET applications call several databases or remote services. If independent calls are awaited one after another, the total response time is roughly the sum of their durations. Running them concurrently can reduce that time to roughly the duration of the slowest call.

The choice also affects correctness and system stability. Sequential execution preserves dependencies and naturally limits pressure on downstream services. Concurrent execution improves latency, but too much concurrency can exhaust connections, trigger rate limits, or overload another system.

## 3. How does it work?

Consider two independent asynchronous calls:

```csharp
var account = await GetAccountAsync(accountId, cancellationToken);
var payments = await GetPaymentsAsync(accountId, cancellationToken);
```

The second method is not called until the first await completes, so the calls are sequential.

For concurrent execution, call both methods first and keep their returned tasks. Then await them together:

```csharp
Task<Account> accountTask = GetAccountAsync(accountId, cancellationToken);
Task<IReadOnlyList<Payment>> paymentsTask =
    GetPaymentsAsync(accountId, cancellationToken);

await Task.WhenAll(accountTask, paymentsTask);
```

Both I/O operations are now in progress before the combined await. The current method is suspended without blocking its request thread. It resumes after both tasks finish.

If any supplied task faults, the task returned by `WhenAll` faults. If none fault but at least one is cancelled, it ends in the cancelled state. All supplied tasks are allowed to reach a final state; `WhenAll` is not fail-fast and does not cancel the remaining work automatically.

## 4. Practical example

A banking dashboard needs an account summary, recent payments, and active fraud alerts. These calls use separate services and do not depend on one another. Starting all three calls and awaiting `Task.WhenAll` reduces dashboard latency.

However, transferring money is different. The system may first validate the account and then create the transfer using the validation result. Those steps must remain sequential because the second operation depends on the first.

## 5. Scenario-based interview answer

**Problem:** A payment-details API made three independent service calls sequentially. Each call took about 300 milliseconds, so the endpoint often took close to 900 milliseconds.

**Decision:** I used `Task.WhenAll` because the customer, payment, and risk lookups had no data dependency. I did not use it for later steps that depended on the risk decision.

**Implementation:** I started the three asynchronous I/O calls, passed the request cancellation token to each call, and awaited them with `Task.WhenAll`. I also kept the individual tasks so their typed results were easy to read after the combined await. We set sensible HTTP timeouts and monitored downstream load.

**Result:** Response time moved closer to the slowest individual call rather than the sum of all three. We gained lower latency without blocking threads, while keeping dependent payment processing steps in the correct order.

## 6. Code example

```csharp
public async Task<PaymentView> GetPaymentViewAsync(
    Guid paymentId,
    CancellationToken cancellationToken)
{
    Task<Payment> paymentTask =
        paymentClient.GetPaymentAsync(paymentId, cancellationToken);
    Task<Customer> customerTask =
        customerClient.GetCustomerForPaymentAsync(paymentId, cancellationToken);
    Task<RiskStatus> riskTask =
        riskClient.GetStatusAsync(paymentId, cancellationToken);

    await Task.WhenAll(paymentTask, customerTask, riskTask);

    return new PaymentView(
        await paymentTask,
        await customerTask,
        await riskTask);
}
```

The three methods are called before the first await, so their I/O can overlap. `Task.WhenAll` waits for all of them. After it completes successfully, awaiting each task again returns its already available, strongly typed result and does not repeat the operation.

For a dynamic collection, concurrency should usually be bounded:

```csharp
var options = new ParallelOptions
{
    MaxDegreeOfParallelism = 8,
    CancellationToken = cancellationToken
};

await Parallel.ForEachAsync(paymentIds, options, async (id, token) =>
{
    await paymentClient.RefreshAsync(id, token);
});
```

`Parallel.ForEachAsync` is available from .NET 6. It is useful when a large collection needs an explicit concurrency limit; creating thousands of tasks and passing all of them to `WhenAll` can overload dependencies.

## 7. Common mistakes

- Writing `await Operation1Async(); await Operation2Async();` for independent calls and assuming they run concurrently.
- Using `Task.WhenAll` when the second operation needs the first operation's result.
- Calling `.Result`, `.Wait()`, or `Task.WaitAll` in asynchronous request code, which blocks a thread and can cause deadlocks in some synchronization contexts.
- Wrapping naturally asynchronous I/O in `Task.Run`. This normally wastes thread-pool capacity and does not make the I/O more asynchronous.
- Starting an unbounded number of tasks. Use throttling for large collections and respect connection pools and downstream rate limits.
- Assuming one failure cancels the other tasks. `WhenAll` waits for all tasks; cancellation must be designed and passed explicitly.
- Losing failure details. Awaiting a faulted `WhenAll` throws an exception, while the returned task's `Exception` property contains an `AggregateException` with all recorded failures.
- Starting concurrent operations on one Entity Framework Core `DbContext`. A `DbContext` does not support multiple parallel operations; use sequential queries or separate scoped contexts where appropriate.

## 8. Follow-up interview questions

### Does `Task.WhenAll` create a new thread?

No. It creates a task that represents completion of the supplied tasks. Naturally asynchronous I/O usually does not occupy a thread while waiting.

### When should sequential awaits be preferred?

Use them when operations depend on earlier results, must happen in order, share a non-thread-safe resource, or when concurrency would put unsafe pressure on a downstream system.

### How do you handle multiple failures from `Task.WhenAll`?

Keep the combined task, await it in a `try`/`catch`, and inspect its `Exception` property when every individual failure must be logged or processed. Also decide whether partial results are valid for the business operation.
