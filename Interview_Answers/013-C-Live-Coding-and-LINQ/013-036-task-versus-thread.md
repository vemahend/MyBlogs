# 36. Task versus Thread?

**Technology:** C# Live Coding and LINQ

**Source question:** 36. Task versus Thread?

## 1. What is it?

A `Thread` is an operating-system execution path. It has its own stack, is scheduled by the OS, and is relatively expensive to create and keep alive.

A `Task` represents work that may finish now or later and may produce a result. It is a higher-level .NET abstraction. A task does **not** always mean a new thread:

- CPU-bound work scheduled with `Task.Run` normally uses a .NET thread-pool thread.
- I/O-bound work using `await`, such as an HTTP or database call, normally does not hold a thread while waiting.
- A task can even complete synchronously if its result is already available.

In application code, `Task` is usually the correct choice. Use `Thread` only when the application truly needs direct control over a dedicated thread.

## 2. Why is it important?

Choosing correctly affects scalability, responsiveness, cancellation, error handling, and resource use.

Tasks work naturally with `async`/`await`, return values through `Task<T>`, propagate exceptions, and support composition through methods such as `Task.WhenAll`. This makes them suitable for APIs, services, and most background operations.

Creating a thread for every request or I/O call wastes memory and can exhaust server resources. However, a dedicated thread can be useful for rare cases such as thread-affine native code, a component requiring a particular apartment state, or a long-running blocking operation that must be isolated from the thread pool.

## 3. How does it work?

For a task-based asynchronous I/O operation, the flow is usually:

1. The method starts the I/O operation.
2. If the operation is not finished, `await` returns control to the caller.
3. No application thread needs to sit blocked while the database, network, or operating system completes the I/O.
4. When completion is reported, the remaining code is scheduled to continue.
5. The task completes with a result, an exception, or cancellation.

For CPU-bound work, `Task.Run` queues a delegate to the .NET thread pool. A pool thread executes it. The pool reuses threads instead of creating a new operating-system thread for every operation.

By contrast, `new Thread(...)` creates a dedicated OS thread. The application controls its start and some thread-level settings, but it must also manage its lifetime, errors, coordination, and shutdown. `Thread` has no built-in result value or `await` support.

## 4. Practical example

Suppose a payment API must load the customer's fraud profile and current account limits from two independent remote services. Both calls are I/O-bound, so the API can start both tasks and await them together. While the services are responding, request threads are free to process other work.

Creating two dedicated threads would add memory and scheduling overhead without making the network calls faster. It would also make cancellation and exception handling harder.

## 5. Scenario-based interview answer

**Problem:** A payment endpoint was slow under peak load because it used blocking calls and created worker threads for downstream service requests.

**Decision:** I changed the downstream clients to return `Task<T>` and used asynchronous I/O end to end. Because the fraud and limit checks were independent, I ran them concurrently with `Task.WhenAll`. I did not use `Task.Run` around the HTTP calls because they were already asynchronous.

**Implementation:** I passed the request cancellation token to both calls, awaited their completion, and handled timeout, cancellation, and downstream failures at the API boundary. I kept CPU-heavy calculation separate and would use bounded background processing if that work became significant.

**Result:** The individual network latency did not disappear, but the endpoint used far fewer blocked threads and handled more concurrent payment requests reliably.

In an interview, I would summarize it like this: “A thread is an OS execution resource; a task is a representation of asynchronous work. I prefer tasks for application workflows because they compose well and work with `async`/`await`. I use a raw thread only when I have a real requirement for a dedicated or thread-affine execution context.”

## 6. Code example

```csharp
public sealed record FraudProfile(bool IsBlocked);
public sealed record AccountLimits(decimal DailyRemaining);
public sealed record PaymentChecks(bool Allowed, string Reason);

public async Task<PaymentChecks> CheckPaymentAsync(
    string customerId,
    decimal amount,
    CancellationToken cancellationToken)
{
    Task<FraudProfile> fraudTask =
        fraudClient.GetProfileAsync(customerId, cancellationToken);

    Task<AccountLimits> limitsTask =
        accountsClient.GetLimitsAsync(customerId, cancellationToken);

    await Task.WhenAll(fraudTask, limitsTask);

    FraudProfile fraud = await fraudTask;
    AccountLimits limits = await limitsTask;

    if (fraud.IsBlocked)
        return new(false, "Customer is blocked");

    if (amount > limits.DailyRemaining)
        return new(false, "Daily limit exceeded");

    return new(true, "Approved");
}
```

Both remote calls begin before either is awaited, so their waiting time can overlap. `Task.WhenAll` provides one task representing their combined completion. The cancellation token allows work to stop when the request is cancelled. There is no `Task.Run` because the client methods already perform asynchronous I/O.

If the application genuinely requires a dedicated thread, it can create one explicitly:

```csharp
var thread = new Thread(RunThreadAffineNativeComponent)
{
    IsBackground = true,
    Name = "Native component worker"
};

thread.Start();
```

This is an exceptional infrastructure choice, not the normal pattern for request processing.

## 7. Common mistakes

- Assuming every task creates a new thread.
- Wrapping naturally asynchronous database or HTTP calls in `Task.Run`.
- Creating a raw thread per web request, which does not scale.
- Calling `.Result`, `.Wait()`, or `Thread.Sleep` in asynchronous code instead of using `await` or `Task.Delay`.
- Starting tasks without observing their completion or exceptions.
- Using `async void` except for event handlers.
- Ignoring cancellation and graceful shutdown for tasks or dedicated threads.
- Using unbounded parallel tasks for CPU-heavy work and exhausting the thread pool or a downstream service.
- Using `TaskCreationOptions.LongRunning` automatically. With the default scheduler it is only a hint that may cause a dedicated thread, so it should be based on measurement and a genuine long-running synchronous workload.

## 8. Follow-up interview questions

### Does `async`/`await` create a new thread?

No. `await` coordinates completion. Asynchronous I/O can wait without occupying a thread, while CPU-bound work still needs a thread to execute.

### When should I use `Task.Run`?

Use it mainly to move CPU-bound work away from a UI thread. In ASP.NET Core request code, it usually does not improve scalability because it only moves work to another thread-pool thread.

### When is a raw `Thread` reasonable?

When code requires a dedicated thread, thread affinity, a specific apartment state, or careful integration with a blocking native component. These cases are uncommon in normal business services.
