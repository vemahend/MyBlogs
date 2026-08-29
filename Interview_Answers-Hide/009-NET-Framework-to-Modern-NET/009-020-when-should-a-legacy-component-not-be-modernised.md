# 20. When should a legacy component not be modernised?

**Technology:** .NET Framework to Modern .NET

**Source question:** 20. When should a legacy component not be modernised?

## 1. What is it?

A legacy component should not be modernised simply because it is old. It may be better to leave it unchanged when it is stable, secure, supported well enough, and provides little business value compared with the cost and risk of changing it.

The decision is not always “modernise” or “do nothing.” A practical option is to isolate the component behind an API, queue, or adapter while keeping the rest of the system on modern .NET.

## 2. Why is it important?

Modernisation uses time, money, and experienced developers. Rewriting a stable component can introduce new defects without improving the customer experience or reducing operating cost.

Architects should compare business value, security, supportability, compliance, dependency risk, change frequency, and migration cost. A component is usually a poor modernisation candidate when:

- It is stable and rarely changes.
- It has few incidents and acceptable performance.
- It is isolated from internet-facing traffic.
- Replacing it could affect critical calculations or regulatory behaviour.
- A vendor does not provide a compatible modern .NET version.
- The component will soon be retired with the product that uses it.
- The migration cost is higher than the expected benefit.

However, an unsupported runtime or a known security weakness cannot be ignored. In that case, the team must modernise, replace, contain, or retire the risk.

## 3. How does it work?

I use a risk-and-value assessment rather than making the decision from the framework version alone:

1. Identify the component's business purpose, owners, users, and expected retirement date.
2. Measure incidents, change frequency, operating cost, performance, and security findings.
3. Map its dependencies, such as COM libraries, Windows-only APIs, databases, and vendor software.
4. Estimate the cost and risk of retaining, rehosting, wrapping, rewriting, replacing, or retiring it.
5. Choose the option with the best business outcome and record the decision.
6. If it stays, isolate it, restrict access, monitor it, back it up, and define a review or retirement date.

This is a time-bound decision. The team should review it when support ends, threats change, incidents increase, or the business needs new features.

## 4. Practical example

A bank has a .NET Framework service that calculates interest for an old mortgage product. The calculation has been audited, the product is closed to new customers, and the remaining accounts will finish within three years. The service is stable and depends on a certified third-party calculation library that does not support modern .NET.

Rewriting it would require expensive regulatory testing and could change rounding behaviour. The bank keeps the calculation component unchanged, runs it on a patched and restricted Windows environment, and exposes it through a small internal adapter. New services use modern .NET and call the adapter through a private queue. The bank adds monitoring, reconciliation, and a retirement date linked to the final mortgage account.

## 5. Scenario-based interview answer

“In one banking system, we had a .NET Framework component that calculated fees for a product being retired. It was stable, audited, and depended on a vendor library that was not available for modern .NET. A rewrite had high financial and compliance risk, but very little business benefit.

I recommended that we should not modernise the calculation engine at that time. We isolated it behind a narrow internal contract, removed direct access from new applications, restricted its network and service-account permissions, and added health checks, audit logs, result reconciliation, and support documentation. We also recorded the decision and agreed on a retirement date.

This allowed the wider platform to move to modern .NET without changing proven financial rules. It reduced migration risk and cost while keeping the legacy risk visible and controlled. I would reconsider the decision if security support ended, the component became unreliable, or the retirement plan changed.”

## 6. Code example

When a legacy component must remain, an interface can stop modern code from depending directly on its implementation:

```csharp
public sealed record FeeRequest(string AccountId, decimal Balance);
public sealed record FeeResult(decimal Amount, string RuleVersion);

public interface ILegacyFeeCalculator
{
    Task<FeeResult> CalculateAsync(
        FeeRequest request,
        CancellationToken cancellationToken);
}

// This adapter can call an isolated .NET Framework service over HTTP or messaging.
public sealed class LegacyFeeCalculatorClient(HttpClient httpClient)
    : ILegacyFeeCalculator
{
    public async Task<FeeResult> CalculateAsync(
        FeeRequest request,
        CancellationToken cancellationToken)
    {
        using var response = await httpClient.PostAsJsonAsync(
            "fees/calculate", request, cancellationToken);

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<FeeResult>(
                   cancellationToken: cancellationToken)
               ?? throw new InvalidOperationException("The legacy service returned no result.");
    }
}
```

The interface creates a clear boundary. Modern code knows only the contract, while the adapter owns communication with the legacy service. Timeouts, retries, authentication, monitoring, and circuit-breaking policies should be configured around the client in production. This example uses APIs available in supported modern .NET releases; the exact resilience setup depends on the application's .NET version and chosen resilience library.

## 7. Common mistakes

- Keeping a component only because the team is afraid to change it, without measuring risk or cost.
- Rewriting a stable component because “newer is better,” without a business case.
- Treating “do not modernise now” as a permanent decision.
- Leaving unsupported software exposed without compensating security controls.
- Allowing new systems to take direct dependencies on the legacy implementation.
- Ignoring vendor licensing, operating-system support, compliance, and disaster recovery.
- Modernising code but failing to preserve financial rules, rounding, audit data, or transaction behaviour.
- Having no owner, monitoring, documentation, or retirement plan for the retained component.

## 8. Follow-up interview questions

### How do you justify keeping a legacy component?

Use evidence: incident history, security status, support dates, change frequency, migration cost, business benefit, and retirement plans. Record the decision and its review date in an architecture decision record.

### How do you reduce the risk of a component that cannot be modernised?

Isolate it behind a small contract, restrict network and identity access, patch its environment, monitor it, reconcile important results, and prevent new direct dependencies.

### When would you reverse the decision and modernise it?

When the runtime or vendor support ends, security risk becomes unacceptable, incidents or operating costs rise, business changes are blocked, or the planned retirement no longer makes sense.
