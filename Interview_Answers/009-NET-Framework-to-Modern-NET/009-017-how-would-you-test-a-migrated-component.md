# 17. How would you test a migrated component?

**Technology:** .NET Framework to Modern .NET

**Source question:** 17. How would you test a migrated component?

## 1. What is it?

Testing a migrated component means proving that its behaviour is still correct after moving it from .NET Framework to modern .NET.

The goal is not only to make the new code compile or pass new unit tests. We must show that, for the same valid input, the modern component produces the same expected business result as the legacy component. We must also test failure cases, integrations, performance, security, logging, and deployment behaviour.

## 2. Why is it important?

A migration can change behaviour even when the business code looks almost identical. Common causes include differences in configuration, dependency injection, JSON serialization, date and time handling, database providers, authentication, globalization, and third-party libraries.

Good migration testing helps a team:

- Protect important business rules that may not be documented.
- Detect small compatibility changes before production.
- Separate existing legacy defects from defects introduced by the migration.
- Release the new component gradually with measurable evidence.
- Build confidence that rollback is possible if production results differ.

For financial systems, a small difference in rounding, duplicate handling, or transaction behaviour can directly affect customer balances, so functional tests alone are not enough.

## 3. How does it work?

I use a layered test approach:

1. **Record the current behaviour.** Before changing the component, add characterization tests around the legacy implementation. These tests capture what it actually does, including important edge cases.
2. **Define the contract.** List the accepted inputs, outputs, errors, side effects, database changes, messages, and service-level targets. Agree which legacy defects should be preserved temporarily and which should be intentionally fixed.
3. **Run fast tests.** Add unit tests for business rules and component tests for the public API. Where possible, run the same test cases against both implementations.
4. **Test real boundaries.** Use integration tests for the actual database provider, message broker, file handling, HTTP dependencies, authentication, and configuration. Mocks alone cannot prove provider compatibility.
5. **Compare results.** Use golden-master or differential tests to send representative inputs to the legacy and modern components, then compare normalized outputs and side effects. Ignore only known non-business values such as correlation IDs or generated timestamps.
6. **Test operational qualities.** Run performance, load, security, resilience, cancellation, timeout, and concurrency tests. Confirm logs, metrics, traces, health checks, and alerts.
7. **Validate safely in production.** For a high-risk component, mirror sanitized production traffic or run both versions in parallel without allowing both to perform the same side effect. Compare results, release to a small group, monitor, and keep a rollback path.

Tests should target observable behaviour rather than private methods. This allows the internal design to improve without making every refactoring break the test suite.

## 4. Practical example

Suppose a bank migrates an interest-calculation component from .NET Framework to modern .NET. The team first captures test cases for normal accounts, leap years, month-end processing, negative balances, different currencies, and rounding boundaries.

The same cases are executed against both implementations. The team compares the calculated interest and posted ledger entries, but removes generated IDs and timestamps before comparison. Integration tests use the same database engine as production and verify that a retry cannot post interest twice.

Load tests then confirm that the modern component completes the nightly batch within its time limit. During a controlled parallel run, the new version calculates results but does not post them. Differences are sent to a reconciliation report. Traffic is switched only after the agreed comparison period has no unexplained differences.

## 5. Scenario-based interview answer

“I would begin by treating the legacy component as the behavioural baseline, not by assuming that a successful build proves the migration.

**Problem:** In one payment migration, the component had important rules for currency rounding, duplicate requests, and gateway errors, but the rules were only partly documented.

**Decision:** I created a test matrix from production scenarios and added characterization tests before replacing the implementation. I also defined which outputs and side effects had to remain identical. We agreed not to copy one known legacy defect into the new system; that difference was documented and tested as an intentional change.

**Implementation:** We ran shared contract tests against the old and new implementations, integration tests against the real database provider and a gateway test environment, and end-to-end tests for payment authorization and reversal. We tested timeouts, duplicate requests, concurrency, authentication, serialization, and decimal rounding. For production confidence, we mirrored traffic to the new component in read-only mode and compared normalized results. We also added metrics, alerts, a canary release, and a rollback switch.

**Result:** We found a JSON casing difference and a rounding difference before release. After fixing them, the canary showed matching business results and acceptable latency, so we increased traffic gradually without payment duplication or customer impact.”

## 6. Code example

The following xUnit test runs the same business cases against both implementations. It compares business values rather than generated metadata:

```csharp
public interface IFeeCalculator
{
    FeeResult Calculate(Payment payment);
}

public sealed record Payment(decimal Amount, string Currency);
public sealed record FeeResult(decimal Fee, decimal Total, string Decision);

public sealed class FeeMigrationTests
{
    public static IEnumerable<object[]> Cases()
    {
        yield return new object[] { new Payment(100.00m, "NZD") };
        yield return new object[] { new Payment(0.01m, "NZD") };
        yield return new object[] { new Payment(9999.99m, "USD") };
    }

    [Theory]
    [MemberData(nameof(Cases))]
    public void Modern_calculator_matches_legacy_business_result(Payment payment)
    {
        IFeeCalculator legacy = new LegacyFeeCalculator();
        IFeeCalculator modern = new ModernFeeCalculator();

        FeeResult expected = legacy.Calculate(payment);
        FeeResult actual = modern.Calculate(payment);

        Assert.Equal(expected.Fee, actual.Fee);
        Assert.Equal(expected.Total, actual.Total);
        Assert.Equal(expected.Decision, actual.Decision);
    }
}
```

The shared interface lets the test execute identical cases against both versions. `decimal` is used for money, and boundary values are included. In a real test suite, I would also add invalid inputs and compare database or message side effects. The legacy result is a temporary migration oracle; after behaviour is approved, explicit expected values should remain so that a future legacy defect does not become the permanent specification.

## 7. Common mistakes

- Testing only whether the modern project compiles or starts.
- Writing tests only after migration and losing the legacy behaviour baseline.
- Comparing only HTTP status codes while ignoring response fields and side effects.
- Mocking every dependency and missing database, serialization, authentication, or messaging differences.
- Copying a legacy bug into the new component without an explicit business decision.
- Ignoring edge cases such as time zones, cultures, null values, decimal rounding, large payloads, and concurrent requests.
- Letting legacy and modern versions both execute irreversible side effects during parallel testing.
- Using production traffic without masking sensitive customer data.
- Skipping performance, security, observability, canary, and rollback testing.
- Accepting flaky comparisons caused by generated timestamps or IDs instead of normalizing only those fields.

## 8. Follow-up interview questions

### What is a characterization test?

It records the current observable behaviour of legacy code before it is changed. It is especially useful when documentation and existing tests are incomplete.

### How would you compare old and new implementations safely in production?

I would mirror or replay sanitized traffic to the new version, prevent it from performing irreversible side effects, normalize non-business fields, and report meaningful differences. I would then use a canary release with monitoring and rollback.

### Should every legacy behaviour be preserved?

No. A known defect or unsafe behaviour should be reviewed with the business and security teams. Any intentional difference must be documented, approved, and covered by a test with the new expected result.
