# 18. How would you validate that the new component behaves like the legacy component?

**Technology:** Strangler Fig and Migration Patterns

**Source question:** 18. How would you validate that the new component behaves like the legacy component?

## 1. What is it?

Validating a new component means proving that, for the same meaningful input, it produces the same expected business outcome as the legacy component.

This is often called **parallel testing**, **shadow testing**, or **differential testing**. During a Strangler Fig migration, production traffic can still go to the legacy component while a copy is sent to the new component. The new result is not returned to the customer at first; it is compared with the legacy result.

The goal is business equivalence, not necessarily byte-for-byte equality. For example, response timestamps, generated IDs, field order, and harmless text differences may legitimately differ.

## 2. Why is it important?

Legacy systems often contain undocumented business rules and edge cases. Unit tests based only on written requirements may therefore miss important behaviour.

Comparing both implementations with realistic traffic helps us:

- find missing rules before customers are affected;
- measure confidence using real evidence rather than assumptions;
- migrate one operation or customer group at a time;
- detect differences in responses, database changes, emitted events, and performance;
- keep a quick rollback path while the legacy component remains available.

For architects, this makes the migration safer and gives clear acceptance criteria for increasing traffic to the new component.

## 3. How does it work?

A practical validation flow is:

1. Define the contract and the business behaviours that must remain the same.
2. Build contract, unit, integration, and regression tests from known legacy examples, including boundary and failure cases.
3. Run the same recorded or generated inputs against both components in a test environment.
4. Normalize values that are allowed to differ, such as timestamps, correlation IDs, and field ordering.
5. Compare HTTP status, business data, errors, database effects, emitted events, and important performance measures.
6. In production, mirror eligible requests to the new component. Keep the legacy response as the customer-facing response.
7. Store mismatches with a correlation ID, but mask sensitive information.
8. Classify each mismatch as a defect, an accepted difference, or a legacy defect that should not be copied.
9. Move a small percentage of real traffic to the new component only after agreed thresholds are met. Monitor it and retain a rollback switch.

Commands that create side effects need special handling. A payment request must not charge the customer twice. For those operations, use a sandbox, replay against isolated data, make the shadow execution non-committing, or compare the resulting decisions and intended events instead of performing the external action.

## 4. Practical example

Suppose a bank is replacing a legacy funds-transfer eligibility service. The API decides whether a transfer is allowed and returns a reason when it is rejected.

The team first runs historical, anonymized requests against both services. It compares the decision, rejection code, fees, currency rounding, and daily-limit calculation. It ignores generated trace IDs and response timestamps.

Next, the gateway mirrors production requests to the new service. Only the legacy decision is used, so the new service cannot approve, reject, or execute a transfer. Differences are sent to a secure comparison store and grouped by rule. This exposes an undocumented legacy rule for transfers made close to midnight in the account's local time.

After fixing that rule, the team requires a very low unexplained mismatch rate, acceptable latency, and no critical differences for a sustained period. Traffic then moves gradually from internal users to 5%, 25%, and finally 100%, with automatic monitoring and a route-back switch.

## 5. Scenario-based interview answer

“In one migration, we replaced a legacy payment-validation component that had many undocumented rules.

**Problem:** Reimplementing the documented rules was not enough because we could not prove that unusual currencies, rounding, limits, and rejection cases behaved the same way.

**Decision:** I treated the legacy component as a temporary behavioural reference, not as a perfect specification. We created contract and regression tests, then added shadow traffic so both implementations received equivalent inputs while only the legacy response affected customers.

**Implementation:** We compared business fields, status codes, error categories, intended events, and latency. We normalized timestamps and generated IDs. We did not execute payment side effects in the shadow path; the new component ran in validation mode and recorded its intended decision. Every mismatch had a correlation ID and was classified as a new-service defect, an accepted difference, or an existing legacy bug. We then used feature flags to send small traffic percentages to the new component and kept an immediate rollback route.

**Result:** We found several hidden rounding and timeout behaviours before cutover. After the unexplained mismatch rate and operational metrics stayed within our agreed limits, we increased traffic in stages and completed the migration without customer-visible payment errors.”

## 6. Code example

The following simplified .NET 8 example returns the legacy result and compares the new result in the background. In a real system, the work should be placed on a durable queue rather than started as an untracked task inside the HTTP request.

```csharp
public sealed record QuoteRequest(decimal Amount, string Currency);
public sealed record QuoteResult(decimal Fee, decimal Total, string Decision,
    DateTimeOffset CalculatedAt, string TraceId);

public sealed record ComparableQuote(decimal Fee, decimal Total, string Decision);

public static ComparableQuote Normalize(QuoteResult result) =>
    new(result.Fee, result.Total, result.Decision);

app.MapPost("/quotes", async (
    QuoteRequest request,
    ILegacyQuoteService legacy,
    INewQuoteService replacement,
    IShadowComparisonQueue comparisons,
    CancellationToken cancellationToken) =>
{
    QuoteResult legacyResult = await legacy.CalculateAsync(request, cancellationToken);

    // A durable worker executes the new service without affecting the client.
    await comparisons.EnqueueAsync(
        new ShadowComparisonCommand(request, Normalize(legacyResult)),
        cancellationToken);

    return Results.Ok(legacyResult);
});

public sealed class ShadowComparisonWorker(
    INewQuoteService replacement,
    IMismatchStore mismatchStore)
{
    public async Task CompareAsync(
        ShadowComparisonCommand command,
        CancellationToken cancellationToken)
    {
        QuoteResult newResult =
            await replacement.CalculateAsync(command.Request, cancellationToken);

        ComparableQuote actual = Normalize(newResult);

        if (actual != command.Expected)
        {
            await mismatchStore.SaveAsync(
                command.Request, command.Expected, actual, cancellationToken);
        }
    }
}
```

`Normalize` removes fields that are expected to differ, so the comparison focuses on business behaviour. The queue keeps shadow processing outside the customer response path and supports retries and monitoring. Requests and mismatch records must exclude or mask account numbers, tokens, and other sensitive data.

## 7. Common mistakes

- Comparing only successful responses and missing validation, timeout, retry, and failure behaviour.
- Requiring byte-for-byte equality when generated IDs, timestamps, or response formatting can validly differ.
- Ignoring side effects such as database writes, messages, emails, or external payment calls.
- Sending a command to both systems and accidentally charging, booking, or notifying twice.
- Treating every legacy behaviour as correct instead of reviewing known legacy defects.
- Using only small, clean test data rather than boundary cases and representative production traffic.
- Running shadow work in the request path and increasing customer latency or failure rates.
- Logging personal or financial data without masking, access control, and retention rules.
- Cutting over based on a few examples instead of agreed mismatch, error-rate, and latency thresholds.
- Migrating all traffic at once without feature flags, observability, or a tested rollback path.

## 8. Follow-up interview questions

### How do you compare results when IDs and timestamps are different?

Create a normalization layer. Remove or transform non-deterministic fields, sort unordered collections, apply defined numeric tolerances, and compare the remaining business values.

### How would you validate a write operation without causing duplicate side effects?

Run the new component in a non-committing validation mode, use isolated test data or a sandbox, or compare its intended state changes and events. Do not call the real external side effect twice.

### When is it safe to move traffic to the new component?

Use agreed evidence: no critical unexplained mismatches, mismatch and error rates below the threshold, acceptable latency and resource use, enough coverage across important scenarios, and a tested rollback mechanism.
