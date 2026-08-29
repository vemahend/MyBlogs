# 19. What is parallel running?

**Technology:** Strangler Fig and Migration Patterns

**Source question:** 19. What is parallel running?

## 1. What is it?

Parallel running is a migration technique where the old system and the new system operate at the same time for a limited period.

The same request or business event is processed by both systems, and their results are compared. Usually, only one system is allowed to make the real business change. For example, the old system may remain the source of truth while the new system runs in shadow mode.

Parallel running is different from sending some users to the old system and others to the new system. In parallel running, both systems process the same logical workload so that the team can compare their behaviour.

## 2. Why is it important?

Replacing a critical system in one step is risky. Unit tests and test environments may not cover real production data, traffic patterns, rounding rules, or unusual business cases.

Parallel running helps a team:

- Check the new system against proven production behaviour.
- Find data, calculation, performance, and integration differences before cutover.
- Build confidence with measurable evidence instead of relying only on testing.
- Keep a safe fallback while the old system is still available.

It is especially useful in banking and payment systems, where a small difference can affect balances, fees, settlements, or regulatory reports.

## 3. How does it work?

A common flow is:

1. A request or event arrives at a controlled routing layer.
2. The old system processes it and remains authoritative.
3. A copy of the input is sent to the new system, often asynchronously so that the customer is not delayed.
4. The new system processes the input in shadow mode.
5. A comparison service normalizes and compares both results.
6. Differences are recorded with correlation IDs, metrics, and enough detail for investigation.
7. The team fixes unexplained differences and repeats the comparison.
8. When agreed success criteria are met, traffic or ownership moves to the new system gradually.

The two executions must not create the same external side effect twice. Shadow processing should suppress actions such as charging a card, sending an email, or publishing a settlement instruction. If both systems must write data, the design needs idempotency, isolated data stores, and a clear owner for each record.

Some differences are expected, such as generated IDs or timestamps. The comparison should normalize these fields and focus on meaningful business results.

## 4. Practical example

A bank is replacing a legacy loan-interest calculation service with a new .NET service.

For each end-of-day account event, the legacy service calculates the official interest amount. The same event is also sent to the new service, but its result is written only to a shadow results store. A comparison job checks the interest amount, rate, currency, and applied business rules.

If the values differ, the job records the account type, rule version, and correlation ID. The team may discover that the legacy system rounds after each daily calculation, while the new service rounds only at the end of the month. After fixing and validating such differences, the bank gradually makes the new service authoritative.

## 5. Scenario-based interview answer

“In one migration, we replaced a legacy payment-fee engine that had many undocumented rules.

The problem was that a direct cutover could have produced incorrect customer fees. We decided to use parallel running, with the legacy engine remaining the source of truth and the new .NET service operating in shadow mode.

For each fee request, we returned the legacy result to the payment flow and published a sanitized copy of the input for the new service. We stored both results under the same correlation ID and compared normalized values such as fee amount, currency, rule code, and tax. The shadow service was not allowed to post ledger entries or send customer notifications. We monitored mismatch rate, processing latency, and missing results, and reviewed differences with the product team because some legacy behaviour was actually incorrect.

After the unexplained mismatch rate stayed within the agreed threshold for several settlement cycles, we moved a small percentage of authoritative traffic to the new service and kept rollback available. This reduced cutover risk and gave us production evidence that the new rules were correct.”

## 6. Code example

The following simplified service returns the legacy result and runs the new calculator in shadow mode. In a real production system, the shadow work should normally be placed on a durable queue rather than started as an untracked background task.

```csharp
public sealed record FeeRequest(
    Guid RequestId,
    decimal Amount,
    string Currency);

public sealed record FeeResult(decimal Fee, string Currency, string RuleCode);

public interface IFeeCalculator
{
    Task<FeeResult> CalculateAsync(
        FeeRequest request,
        CancellationToken cancellationToken);
}

public interface IShadowWorkQueue
{
    ValueTask EnqueueAsync(
        FeeComparisonWork work,
        CancellationToken cancellationToken);
}

public sealed record FeeComparisonWork(
    FeeRequest Request,
    FeeResult LegacyResult);

public sealed class ParallelRunningFeeService(
    IFeeCalculator legacyCalculator,
    IShadowWorkQueue shadowQueue)
{
    public async Task<FeeResult> CalculateAsync(
        FeeRequest request,
        CancellationToken cancellationToken)
    {
        // The legacy result is still authoritative during this phase.
        FeeResult legacyResult = await legacyCalculator.CalculateAsync(
            request, cancellationToken);

        // A durable worker will call the new calculator and compare its result.
        await shadowQueue.EnqueueAsync(
            new FeeComparisonWork(request, legacyResult),
            cancellationToken);

        return legacyResult;
    }
}

public sealed class FeeComparisonWorker(
    IFeeCalculator newCalculator,
    ILogger<FeeComparisonWorker> logger)
{
    public async Task ProcessAsync(
        FeeComparisonWork work,
        CancellationToken cancellationToken)
    {
        FeeResult newResult = await newCalculator.CalculateAsync(
            work.Request, cancellationToken);

        bool matches =
            decimal.Round(work.LegacyResult.Fee, 2) ==
                decimal.Round(newResult.Fee, 2) &&
            work.LegacyResult.Currency == newResult.Currency &&
            work.LegacyResult.RuleCode == newResult.RuleCode;

        if (!matches)
        {
            logger.LogWarning(
                "Fee mismatch for {RequestId}. Legacy: {@Legacy}; New: {@New}",
                work.Request.RequestId,
                work.LegacyResult,
                newResult);
        }
    }
}
```

The request ID connects the two executions. The legacy result is returned to the caller, while the queue separates shadow processing from customer response time. The worker compares business fields and records mismatches. The new calculator must be configured so that it cannot create real payment or ledger side effects.

## 7. Common mistakes

- Allowing both systems to charge, publish, notify, or update the same business record.
- Calling the shadow system synchronously and making its failure or slowness affect customers.
- Using an in-memory or fire-and-forget task, which can lose comparison work when an application restarts.
- Comparing timestamps, generated IDs, or differently ordered collections without normalization.
- Comparing only the final value and missing important fields such as currency, rule version, or status.
- Sending sensitive production data to a less secure shadow environment.
- Running both systems without defined success thresholds, an end date, or a cutover plan.
- Treating every mismatch as a defect in the new system; the legacy result may contain an old bug.
- Ignoring the extra infrastructure cost and load created by processing each input twice.

## 8. Follow-up interview questions

### How is parallel running different from a canary release?

Parallel running sends the same logical work to both systems and compares the results. A canary release sends a small portion of real authoritative traffic to the new system, so each request is normally handled by only one version.

### Which system should be the source of truth?

At the start, it is usually the proven legacy system. Ownership should move only after comparison results meet agreed business and technical criteria. The decision must be explicit so that both systems do not update the same data independently.

### When should parallel running stop?

It should stop when the agreed period and sample size are complete, unexplained mismatches are below the accepted threshold, performance and operational checks pass, and rollback has been tested. Keeping it indefinitely adds cost and complexity.
