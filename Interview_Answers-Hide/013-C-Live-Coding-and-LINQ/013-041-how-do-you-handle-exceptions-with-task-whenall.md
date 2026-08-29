# 41. How do you handle exceptions with Task.WhenAll?

**Technology:** C# Live Coding and LINQ

**Source question:** 41. How do you handle exceptions with Task.WhenAll?

## 1. What is it?

`Task.WhenAll` creates one task that completes after every supplied task has completed.

If one or more operations fail, the combined task is faulted. A normal `await` throws an exception, so we handle it with `try`/`catch`. If we need every failure, we also inspect the combined task's `Exception` property because it contains the exceptions from all faulted tasks.

## 2. Why is it important?

Independent operations can run concurrently, which reduces total waiting time. For example, a payment API may call fraud, customer, and limit services at the same time.

The important detail is that several operations can fail together. If we only log the exception thrown by `await`, we may miss other failures. In production, we normally need to log all failures, preserve cancellation behavior, and return a safe response without hiding the root causes.

## 3. How does it work?

1. Start the independent tasks without awaiting each one immediately.
2. Pass them to `Task.WhenAll` and keep a reference to the returned task.
3. Await the combined task inside `try`/`catch`.
4. `WhenAll` waits until every supplied task reaches a final state, even if one fails early.
5. If any task faults, the combined task is faulted. Its `Exception` is an `AggregateException` containing the failures.
6. `await` throws one of the underlying exceptions. It does not throw the full `AggregateException` in the usual case, so inspect the combined task to process every failure.
7. If no task faults but at least one is cancelled, the combined task is cancelled. Otherwise, it completes successfully.

## 4. Practical example

A payment service must obtain a fraud score, the customer's daily limit, and the merchant status before approving a payment. These calls are independent, so the service starts them together and awaits `Task.WhenAll`.

If both the fraud service and merchant service fail, the payment is not approved. The service logs both failures from the combined task, adds the payment correlation ID, and returns a controlled temporary-error response. This gives support teams the complete picture instead of recording only one downstream failure.

## 5. Scenario-based interview answer

“In a payment workflow, I had three independent downstream checks running in parallel. Sometimes more than one service failed during the same request.

I kept a reference to the task returned by `Task.WhenAll` and awaited it inside a `try`/`catch`. In the catch block, I treated cancellation separately. For a real failure, I inspected `allTasks.Exception.Flatten().InnerExceptions` and logged every exception with the payment correlation ID. I did not retry the complete group blindly because that could repeat successful calls or cause duplicate side effects; retries were applied to suitable individual calls using an idempotency key.

This kept the fast parallel execution, captured all downstream failures, and made production diagnosis much easier.”

## 6. Code example

```csharp
public async Task CheckPaymentAsync(
    string paymentId,
    CancellationToken cancellationToken)
{
    Task fraudTask = CheckFraudAsync(paymentId, cancellationToken);
    Task limitTask = CheckLimitAsync(paymentId, cancellationToken);
    Task merchantTask = CheckMerchantAsync(paymentId, cancellationToken);

    Task allTasks = Task.WhenAll(fraudTask, limitTask, merchantTask);

    try
    {
        await allTasks;
    }
    catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
    {
        // Preserve cancellation so the caller can handle it correctly.
        throw;
    }
    catch
    {
        foreach (Exception error in
                 allTasks.Exception?.Flatten().InnerExceptions
                 ?? Enumerable.Empty<Exception>())
        {
            Console.Error.WriteLine(
                $"Payment {paymentId} check failed: {error.Message}");
        }

        throw;
    }
}
```

The three operations start before the first `await`, so they can run concurrently. Keeping `allTasks` allows the catch block to access all collected failures. `Flatten()` is useful if an operation produced nested `AggregateException` objects. The final `throw;` preserves the original stack trace.

In real code, use structured logging rather than `Console.Error`, and avoid logging sensitive payment data.

## 7. Common mistakes

- Assuming the exception caught from `await Task.WhenAll(...)` represents every failure. Inspect the combined task's `Exception` when all failures matter.
- Awaiting each task immediately after creating it. That can make independent operations run one after another instead of concurrently.
- Using `.Wait()` or `.Result`, which wraps failures in `AggregateException` and can block threads or cause deadlocks in some application environments.
- Catching `Exception` and continuing as if the operation succeeded.
- Swallowing `OperationCanceledException` or reporting a caller-requested cancellation as a system error.
- Retrying the complete batch without checking idempotency. Successful payment-related operations may run twice.
- Starting unbounded numbers of tasks. Large batches should use controlled concurrency.

## 8. Follow-up interview questions

### Does `Task.WhenAll` stop the remaining tasks when one task fails?

No. It waits for all supplied tasks to complete. It also does not cancel them automatically; cancellation must be designed explicitly, usually with a shared `CancellationToken`.

### How do you get all exceptions from `Task.WhenAll`?

Keep the combined task in a variable. After catching the failure from `await`, inspect `combinedTask.Exception?.Flatten().InnerExceptions`.

### What happens when some tasks fail and others are cancelled?

If at least one task faults, the combined task is faulted. If none fault but at least one is cancelled, the combined task is cancelled. It succeeds only when all tasks succeed.
