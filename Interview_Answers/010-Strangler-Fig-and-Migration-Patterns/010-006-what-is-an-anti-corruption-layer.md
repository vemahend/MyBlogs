# 6. What is an anti-corruption layer?

**Technology:** Strangler Fig and Migration Patterns

**Source question:** 6. What is an anti-corruption layer?

## 1. What is it?

An **anti-corruption layer (ACL)** is a boundary that translates between two systems with different models, terms, or data formats.

During a migration, the new system should use its own clean business model. The ACL hides legacy details behind adapters and translators, so old names, rules, status codes, and technical limitations do not spread into the new code.

Despite its name, an anti-corruption layer is not mainly a security feature or an access-control list. Its purpose is to protect one domain model from being distorted by another system's model.

## 2. Why is it important?

Legacy systems often expose database-shaped messages, unclear field names, special status codes, and historical business rules. If the new application uses those details directly, it becomes tightly coupled to the legacy system and is difficult to change or retire.

An ACL helps teams:

- Keep the new domain model clear and meaningful.
- Isolate legacy formats and rules in one place.
- Change or replace the legacy integration with less impact.
- Validate and normalize old data before it reaches new code.
- Test translation rules separately from business logic.
- Support gradual migration while both systems are running.

For architects, it also makes ownership clear: the new service owns its internal model, while the ACL owns the translation at the boundary.

## 3. How does it work?

A typical request flow is:

1. New application code calls an interface expressed in its own business language.
2. An ACL adapter converts that request into the legacy system's format.
3. The adapter calls the legacy API, queue, or other supported integration point.
4. The ACL maps legacy responses, codes, and errors into the new system's model.
5. The new application continues processing without knowing the legacy contract.

The same idea applies to incoming events. The ACL consumes a legacy event, validates it, translates it into a modern domain event, and publishes or passes on the translated result.

The ACL may be a library inside the new service, a dedicated adapter service, or part of an integration layer. A separate service is useful when several consumers need the same translation, but it adds another network dependency. The boundary should remain narrow and should not become a second copy of the legacy system.

## 4. Practical example

A bank is replacing a legacy customer system. The legacy API represents account state with codes such as `A`, `F`, and `C`, uses `CUST_NO` as the customer identifier, and returns the available balance as text in minor currency units.

The new account service uses `AccountId`, a typed `AccountStatus`, and a decimal amount with a currency. It does not expose the old codes to its domain logic.

An ACL calls the legacy API and translates:

- `CUST_NO` into `AccountId`.
- `A`, `F`, and `C` into `Active`, `Frozen`, and `Closed`.
- `"125050"` minor units into `1250.50` with the correct currency.
- Legacy error `E42` into a meaningful `AccountNotFound` result.

When the bank later moves account data to a modern service, only the adapter changes. The rest of the application continues using the same clean interface and domain model.

## 5. Scenario-based interview answer

**Problem:** "In a payment migration, the legacy platform used numeric transaction codes, inconsistent date formats, and a single status field that mixed payment and settlement state. The new service initially started using those values directly, which was spreading legacy rules across controllers and business services."

**Decision:** "I introduced an anti-corruption layer between the new payment domain and the legacy API. The new domain kept meaningful types such as `PaymentStatus` and `SettlementStatus`, while the ACL became responsible for the old contract."

**Implementation:** "We defined a port in the new service using our business language and implemented it with a legacy adapter. The adapter mapped requests, normalized timestamps, translated status and error codes, and rejected invalid combinations. We added contract tests using captured, anonymized legacy responses and metrics for unknown codes. During the Strangler Fig migration, the application could use either the legacy adapter or the modern provider behind the same interface."

**Result:** "Legacy changes were contained in one place, the new domain stayed clean, and migration defects became easier to diagnose. When the modern payment provider took ownership, we replaced the adapter without rewriting the core business logic."

## 6. Code example

This example keeps the application-facing contract independent of the legacy DTO. It uses ordinary C# features available in currently supported .NET versions.

```csharp
public enum AccountStatus
{
    Active,
    Frozen,
    Closed
}

public sealed record AccountSnapshot(
    string AccountId,
    AccountStatus Status,
    decimal AvailableBalance,
    string Currency);

// The new application depends on this clean contract.
public interface IAccountReader
{
    Task<AccountSnapshot> GetAsync(
        string accountId,
        CancellationToken cancellationToken);
}

// This DTO mirrors the legacy API only inside the integration boundary.
internal sealed record LegacyAccountDto(
    string CUST_NO,
    string STATE_CD,
    long AVAIL_BAL_MINOR,
    string CCY);

internal interface ILegacyAccountClient
{
    Task<LegacyAccountDto> GetAsync(
        string customerNumber,
        CancellationToken cancellationToken);
}

internal sealed class LegacyAccountAdapter(
    ILegacyAccountClient client) : IAccountReader
{
    public async Task<AccountSnapshot> GetAsync(
        string accountId,
        CancellationToken cancellationToken)
    {
        LegacyAccountDto legacy =
            await client.GetAsync(accountId, cancellationToken);

        AccountStatus status = legacy.STATE_CD switch
        {
            "A" => AccountStatus.Active,
            "F" => AccountStatus.Frozen,
            "C" => AccountStatus.Closed,
            _ => throw new InvalidOperationException(
                $"Unknown legacy account state: {legacy.STATE_CD}")
        };

        return new AccountSnapshot(
            AccountId: legacy.CUST_NO,
            Status: status,
            AvailableBalance: legacy.AVAIL_BAL_MINOR / 100m,
            Currency: legacy.CCY);
    }
}
```

`IAccountReader` uses the language of the new application. `LegacyAccountDto` and the code mapping remain internal to the ACL. An unknown state fails explicitly instead of silently being treated as a valid status. In production, currency metadata should determine the number of minor-unit digits rather than assuming every currency uses two.

## 7. Common mistakes

- Treating an ACL as a security access-control list instead of a model translation boundary.
- Allowing legacy DTOs or status codes to escape into controllers and domain services.
- Performing simple field mapping but ignoring differences in business meaning.
- Copying large amounts of business logic into the ACL until it becomes another legacy system.
- Hiding unknown values with unsafe defaults instead of logging, measuring, and handling them explicitly.
- Sharing the legacy database directly, which bypasses the boundary and couples the new service to its schema.
- Forgetting time zones, currency precision, null handling, identifier formats, and error translation.
- Using one shared ACL for unrelated domains, creating a bottleneck and unwanted coupling.
- Omitting contract tests and monitoring for new or changed legacy codes.
- Keeping the ACL after migration without reviewing whether it can be simplified or removed.

## 8. Follow-up interview questions

### Is an anti-corruption layer always a separate microservice?

No. It can be an adapter inside the consuming service when only that service needs it. A separate service can help multiple consumers, but it adds deployment, latency, availability, and ownership concerns.

### What is the difference between an ACL and an API gateway?

An API gateway mainly handles traffic concerns such as routing, authentication, throttling, and aggregation. An ACL translates concepts and contracts between domain models. A gateway can host some translation, but the responsibilities are different.

### Should the anti-corruption layer contain business logic?

It should contain integration-specific translation and validation, including semantic mapping where meanings differ. Core business decisions should stay in the domain or application layer so the ACL remains focused and replaceable.
