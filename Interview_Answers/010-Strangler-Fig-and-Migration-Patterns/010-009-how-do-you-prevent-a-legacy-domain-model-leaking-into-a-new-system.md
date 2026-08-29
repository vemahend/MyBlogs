# 9. How do you prevent a legacy domain model leaking into a new system?

**Technology:** Strangler Fig and Migration Patterns

**Source question:** 9. How do you prevent a legacy domain model leaking into a new system?

## 1. What is it?

Preventing a legacy domain model from leaking means keeping legacy names, data structures, rules, and technical limitations outside the new system's core business model.

The usual solution is an **anti-corruption layer (ACL)**. It sits at the boundary between the systems and translates legacy messages into concepts owned by the new system. The new code works with its own domain objects and language instead of using legacy database entities, status codes, or generated client classes directly.

This is not only DTO mapping. The boundary may also translate meaning. For example, a legacy value of `A` may mean an account is usable, while the new domain expresses that as `AccountStatus.Active` and applies its own validation rules.

## 2. Why is it important?

A legacy model often reflects old business processes and years of technical compromises. If the new system uses that model directly, it inherits the same coupling:

- Legacy field names and codes spread through new business logic.
- A change to the legacy API or database forces changes across the new system.
- The new design cannot use clearer business concepts or stronger types.
- Legacy nulls, invalid states, and overloaded fields become accepted by default.
- Removing the legacy system later becomes much harder.

During a Strangler Fig migration, both systems may coexist for a long time. A clear boundary lets the new system evolve independently while still exchanging data safely with the legacy application.

## 3. How does it work?

1. Define the new domain model using the language and rules required by the current business.
2. Keep legacy contracts in an infrastructure or integration area, not in the domain project.
3. Access the legacy system through a small interface owned by the new application.
4. Translate legacy requests, responses, status codes, identifiers, dates, and errors at the boundary.
5. Validate incoming data before creating new domain objects. Reject or quarantine values that cannot be translated safely.
6. Return only new-system types to application and domain code.
7. Add contract tests for the legacy integration and unit tests for every important mapping rule.
8. Monitor unknown codes and translation failures because they often reveal undocumented legacy behaviour.

The dependency direction matters. The new domain defines the interface it needs; an infrastructure adapter implements that interface using the legacy API. Domain projects should not reference legacy SDKs, database entities, or transport DTOs.

For event-based integration, the same rule applies: consume the legacy event into an integration handler, translate it into a new command or event, and do not publish the legacy payload as the new system's contract.

## 4. Practical example

Suppose a bank is moving customer payment controls out of a legacy application. The legacy API returns this record:

- `CUST_NO` as a padded string
- `PAY_FLAG` with values `Y`, `N`, or `H`
- `DAY_MAX` as a nullable decimal
- `ERR_CD` for both business and technical errors

The new payment service does not expose those fields to its domain. Its adapter converts `CUST_NO` into a `CustomerId`, maps `PAY_FLAG` to `PaymentPermission`, converts `DAY_MAX` into a validated `Money` value, and turns known error codes into explicit results.

If the legacy system sends an unknown flag, the adapter does not silently treat it as allowed. It records the value with a correlation ID and fails safely. The payment domain therefore contains only meaningful states and remains independent of the legacy contract.

## 5. Scenario-based interview answer

“I prevent leakage by treating the legacy system as an external system, even when it is owned by the same company.

**Problem:** In one payment migration, generated legacy client types and one-letter status codes were being passed into the new application services. That meant new rules were starting to depend on the old model, and every legacy contract change affected several projects.

**Decision:** I introduced an anti-corruption layer and made the new payment domain own its language and integration interface. We agreed that no legacy DTO or database entity could cross that boundary.

**Implementation:** The infrastructure adapter called the legacy API, mapped identifiers and status codes to strongly typed domain values, normalised dates and money, and translated errors into explicit application results. Unknown values failed safely and produced metrics and structured logs. We added mapping unit tests, legacy contract tests, and architecture tests to stop domain projects from referencing the generated legacy client.

**Result:** Changes to the legacy API were contained in one adapter, the new domain rules became easier to understand and test, and we could replace the legacy source later without changing the payment use cases. The extra mapping code was deliberate migration code, with an owner and a removal plan.”

## 6. Code example

The following example keeps the legacy contract inside the infrastructure boundary and exposes only a new-system model to the application.

```csharp
// New system types: owned by the new domain/application.
public readonly record struct CustomerId(Guid Value);

public enum PaymentPermission
{
    Allowed,
    Blocked,
    ManualReview
}

public sealed record PaymentPolicy(
    CustomerId CustomerId,
    PaymentPermission Permission,
    decimal DailyLimit,
    string Currency);

public interface IPaymentPolicyReader
{
    Task<PaymentPolicy> GetAsync(
        CustomerId customerId,
        CancellationToken cancellationToken);
}

// Infrastructure-only contract returned by the legacy API.
internal sealed record LegacyPaymentRecord(
    string CUST_NO,
    string PAY_FLAG,
    decimal? DAY_MAX,
    string? CCY);

internal interface ILegacyPaymentsClient
{
    Task<LegacyPaymentRecord> GetPolicyAsync(
        string customerNumber,
        CancellationToken cancellationToken);
}

internal sealed class LegacyPaymentPolicyAdapter(
    ILegacyPaymentsClient client) : IPaymentPolicyReader
{
    public async Task<PaymentPolicy> GetAsync(
        CustomerId customerId,
        CancellationToken cancellationToken)
    {
        var legacy = await client.GetPolicyAsync(
            customerId.Value.ToString("N"), cancellationToken);

        var permission = legacy.PAY_FLAG.Trim().ToUpperInvariant() switch
        {
            "Y" => PaymentPermission.Allowed,
            "N" => PaymentPermission.Blocked,
            "H" => PaymentPermission.ManualReview,
            var value => throw new LegacyContractException(
                $"Unknown payment flag '{value}'.")
        };

        var limit = legacy.DAY_MAX
            ?? throw new LegacyContractException("Daily limit is missing.");

        if (limit < 0)
            throw new LegacyContractException("Daily limit cannot be negative.");

        var currency = legacy.CCY?.Trim().ToUpperInvariant();
        if (currency is null || currency.Length != 3)
            throw new LegacyContractException("Currency is invalid.");

        return new PaymentPolicy(customerId, permission, limit, currency);
    }
}

internal sealed class LegacyContractException(string message)
    : Exception(message);
```

`IPaymentPolicyReader` is owned by the new application, so its callers know nothing about the legacy transport. `LegacyPaymentPolicyAdapter` contains all translation and validation. The example uses the primary-constructor syntax available in C# 12, which ships with .NET 8; a normal constructor can be used on earlier C# versions.

In production, sensitive legacy values should not be placed in exception messages or logs. Expected integration failures may also be represented with a result type instead of exceptions, depending on the application's error-handling approach.

## 7. Common mistakes

- Referencing generated legacy API classes from the domain or application project.
- Sharing legacy database entities with the new system because it seems faster initially.
- Renaming fields without translating their business meaning.
- Copying every legacy field into the new model, including fields the new capability does not need.
- Silently mapping unknown codes to a convenient default, especially in payment or security flows.
- Allowing new business rules to be implemented inside the mapper. The mapper translates; the domain owns new business behaviour.
- Reading and writing the legacy database directly without a clear ownership and consistency plan.
- Creating one very large, shared ACL for unrelated domains, which becomes another tightly coupled system.
- Missing contract, mapping, and architecture tests.
- Treating the ACL as permanent without tracking when adapters and temporary mappings can be removed.

## 8. Follow-up interview questions

### Is an anti-corruption layer just an object mapper?

No. Object mapping changes shape. An ACL also translates business meaning, identifiers, errors, protocols, and sometimes interaction patterns so the new domain remains independent.

### Where should the translation code live?

Place it in an integration or infrastructure adapter at the boundary. The new domain should own the interface and its own types, while the adapter depends on the legacy client or contract.

### How do you stop developers from bypassing the boundary?

Use separate projects, keep legacy types internal where possible, enforce dependency rules with architecture tests, review public contracts, and monitor direct legacy database or client usage. Team conventions help, but automated checks make the boundary reliable.
