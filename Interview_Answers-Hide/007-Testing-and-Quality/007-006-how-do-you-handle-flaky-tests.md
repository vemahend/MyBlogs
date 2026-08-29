# 6. How do you handle flaky tests?

**Technology:** Testing and Quality

**Source question:** 6. How do you handle flaky tests?

## 1. What is it?

A flaky test sometimes passes and sometimes fails even though the application code has not changed.

Common causes include timing problems, shared test data, random values, dependency on test order, real network calls, machine-specific settings, and background work that has not finished.

I treat a flaky test as a defect in the test or the product. I do not simply keep rerunning it until it passes.

## 2. Why is it important?

Flaky tests make a build unreliable. When developers see false failures often, they start ignoring failures or rerunning pipelines without investigation. A real production defect can then be missed.

For a senior developer or architect, the goal is to keep the test suite trustworthy, fast, and repeatable. The same code should give the same result on a laptop and in CI.

## 3. How does it work?

I normally handle a flaky test in this order:

1. **Confirm and measure it.** Record the failing test, error, environment, seed, and frequency. Run that test repeatedly and with the full suite to check for test-order or shared-state problems.
2. **Find the source of non-determinism.** Check clocks, time zones, random data, static state, database records, ports, file paths, asynchronous work, thread safety, and external services.
3. **Make dependencies controllable.** Inject a clock, generate unique test data, isolate the database, replace real remote calls with a stub, and wait for an observable condition instead of using fixed sleeps.
4. **Fix cleanup and isolation.** Each test must arrange and clean up its own state. Parallel tests must not update the same records or resources.
5. **Quarantine only when necessary.** If the test blocks delivery and cannot be fixed immediately, move it to a visible quarantine suite, assign an owner and deadline, and keep tracking it. Quarantine is temporary, not deletion.
6. **Verify the fix.** Run the test many times, in random order, under parallel execution, and in CI.

A limited automatic retry can help collect diagnostic evidence for a genuinely unstable external environment. It should not turn a failed test into a successful build because that hides the problem.

## 4. Practical example

A payment integration test submitted a payment and then used `Task.Delay(1000)` before checking whether an asynchronous status update had completed. It passed locally but failed on busy CI agents.

The test was changed to publish the status event through a controlled test message broker and wait until the payment record reached `Completed`, with an overall timeout. Every test used a unique payment ID and its own database data. This removed the dependency on machine speed while still testing the real processing flow.

## 5. Scenario-based interview answer

**Problem:** In one project, an authentication test failed randomly in CI because it created a token close to its expiry boundary and compared it with the machine's current time.

**Decision:** I treated the failure as a reliability defect. I did not add retries or increase a sleep because either change would only reduce how often we saw it.

**Implementation:** I reproduced the issue by running the test repeatedly, then replaced direct calls to `DateTime.UtcNow` with .NET's `TimeProvider`. The test supplied a fixed time, created a token with a known expiry, and explicitly moved the time across the expiry boundary. I also checked the suite for time-zone assumptions and shared token data.

**Result:** The test became deterministic and faster. More importantly, the team trusted CI failures again because the same input always produced the same result.

## 6. Code example

This example uses `TimeProvider`, available in .NET 8 and later, so the test controls the current time.

```csharp
public sealed class TokenValidator(TimeProvider timeProvider)
{
    public bool IsValid(DateTimeOffset expiresAt) =>
        expiresAt > timeProvider.GetUtcNow();
}

public sealed class FixedTimeProvider(DateTimeOffset utcNow) : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => utcNow;
}

public class TokenValidatorTests
{
    [Fact]
    public void IsValid_ReturnsFalse_WhenTokenHasExpired()
    {
        var now = new DateTimeOffset(2026, 8, 21, 10, 0, 0, TimeSpan.Zero);
        var validator = new TokenValidator(new FixedTimeProvider(now));

        var result = validator.IsValid(now.AddSeconds(-1));

        Assert.False(result);
    }
}
```

The production class does not read the system clock directly. The test supplies a fixed UTC value, so its result does not depend on execution speed, local time zone, or the current date. For tests that need to advance time or control timers, `FakeTimeProvider` is available from the `Microsoft.Extensions.TimeProvider.Testing` package.

## 7. Common mistakes

- Adding unlimited retries and calling the test fixed.
- Using `Thread.Sleep` or arbitrary `Task.Delay` values to coordinate asynchronous work.
- Depending on the current date, local time zone, random data, or test execution order.
- Letting parallel tests share database rows, queues, files, ports, or static state.
- Calling real third-party APIs in unit tests.
- Catching exceptions in a test without failing it.
- Quarantining a test without an owner, tracking issue, or deadline.
- Deleting a flaky test and losing important coverage before replacing it.

## 8. Follow-up interview questions

### Should a CI pipeline retry failed tests?

Retries may be used briefly to gather evidence, but the original failure must remain visible. A retry should not hide a flaky test or make an unreliable build appear healthy.

### How do you test asynchronous processing without fixed delays?

Wait for an observable condition, such as a database status or received event, and apply a clear maximum timeout. For unit tests, use controllable tasks, clocks, and test doubles so no real waiting is required.

### When would you quarantine a flaky test?

Only when it is blocking the delivery pipeline and an immediate fix is not practical. I keep it in a separate visible suite, assign an owner and deadline, and restore it to the main suite after the root cause is fixed.
