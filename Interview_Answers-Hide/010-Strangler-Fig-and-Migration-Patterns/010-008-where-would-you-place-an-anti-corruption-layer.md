# 8. Where would you place an anti-corruption layer?

**Technology:** Strangler Fig and Migration Patterns

**Source question:** 8. Where would you place an anti-corruption layer?

## 1. What is it?

An anti-corruption layer, or ACL, is a boundary between two systems that use different domain models, terminology, or data formats. It translates between them so that one system does not have to adopt the other system's design.

During a Strangler Fig migration, I normally place the ACL on the **new system's side of the boundary**, between the new application and the legacy system. This protects the new domain model from legacy concepts. If the legacy system must call the new system, I may also add a small adapter at that inbound boundary.

An ACL is not mainly a security feature. The word “corruption” means unwanted influence on the new domain model, not malicious data.

## 2. Why is it important?

Legacy systems often have old names, overloaded status codes, unusual data types, and business rules that no longer match the target design. Allowing those details to spread into new code makes the new system tightly coupled to the legacy system.

An ACL is important because it:

- keeps the new domain model clean and meaningful;
- gives legacy translation logic one clear home;
- reduces the number of components affected when the legacy contract changes;
- makes the legacy dependency easier to test, monitor, and eventually remove; and
- supports gradual migration without requiring both systems to use the same model.

Without this boundary, a Strangler migration can produce a modern-looking service that still behaves like the monolith internally.

## 3. How does it work?

A typical flow is:

1. The new application calls an interface expressed in its own business language, such as `ILegacyAccountGateway`.
2. The ACL implements that interface and calls the legacy API, database wrapper, or messaging endpoint.
3. It converts the new request into the legacy contract.
4. It converts the legacy response, status codes, and errors into the new domain model.
5. The new application's business logic works only with its own types and does not know the legacy contract.

The ACL can run inside the new service when the translation is small and belongs to only that service. It can be a separate service when several consumers need the same translation, independent deployment is useful, or special scaling and security controls are required. I would avoid a shared ACL becoming a large integration hub with unrelated business rules.

## 4. Practical example

Assume a bank is moving customer accounts from a monolith to a new Account Service. The monolith represents an account with fields such as `ACCT_NO`, `CUST_REF`, and status codes `1`, `7`, and `9`. The new service uses `AccountId`, `CustomerId`, and an `AccountStatus` enum containing `Active`, `Frozen`, and `Closed`.

The ACL sits between the new Account Service and the legacy monolith. It calls the legacy endpoint and maps:

- `ACCT_NO` to `AccountId`;
- `CUST_REF` to `CustomerId`;
- `1` to `Active`, `7` to `Frozen`, and `9` to `Closed`; and
- legacy error codes to typed exceptions or result values used by the new service.

When the account capability is fully migrated, the Account Service can replace the ACL's legacy implementation with a new repository or API implementation. Its domain logic and callers do not need to change.

## 5. Scenario-based interview answer

“In a banking migration, our new payment service still needed customer and account data from a legacy monolith. The legacy model had numeric status codes and combined customer, account, and branch details in one response.

I placed an anti-corruption layer at the new payment service's outbound boundary. The payment domain called a gateway using terms such as `AccountId` and `AccountStatus`; the gateway implementation translated those requests to the legacy contract and mapped the responses and errors back to our domain types.

We kept translation in the infrastructure layer and kept business decisions in the domain or application layer. We also added contract tests using captured, sanitised legacy responses and metrics for mapping failures and unknown status codes.

As a result, the payment code did not depend on legacy DTOs, later legacy contract changes were isolated, and we could replace the legacy gateway after migration without rewriting the payment rules.”

## 6. Code example

```csharp
public enum AccountStatus
{
    Active,
    Frozen,
    Closed
}

public sealed record Account(
    string AccountId,
    string CustomerId,
    AccountStatus Status);

// The application depends on its own language, not legacy DTOs.
public interface IAccountGateway
{
    Task<Account?> GetAsync(
        string accountId,
        CancellationToken cancellationToken);
}

public sealed record LegacyAccountDto(
    string ACCT_NO,
    string CUST_REF,
    int STATUS_CD);

public interface ILegacyBankClient
{
    Task<LegacyAccountDto?> GetAccountAsync(
        string accountNumber,
        CancellationToken cancellationToken);
}

// This adapter is the anti-corruption layer.
public sealed class LegacyAccountAdapter(ILegacyBankClient client)
    : IAccountGateway
{
    public async Task<Account?> GetAsync(
        string accountId,
        CancellationToken cancellationToken)
    {
        var legacy = await client.GetAccountAsync(accountId, cancellationToken);

        return legacy is null
            ? null
            : new Account(
                legacy.ACCT_NO,
                legacy.CUST_REF,
                MapStatus(legacy.STATUS_CD));
    }

    private static AccountStatus MapStatus(int code) => code switch
    {
        1 => AccountStatus.Active,
        7 => AccountStatus.Frozen,
        9 => AccountStatus.Closed,
        _ => throw new InvalidOperationException(
            $"Unknown legacy account status: {code}")
    };
}
```

`IAccountGateway` belongs to the new application and uses its domain terms. `LegacyAccountAdapter` contains the legacy dependency and mapping. Unknown codes fail explicitly instead of being silently treated as a valid status. In production, the client should also have suitable timeouts, resilience rules, logging, and metrics.

## 7. Common mistakes

- Allowing legacy DTOs or numeric codes to escape from the ACL into controllers, domain objects, or events.
- Putting new business decisions in the ACL. It should translate contracts and meaning; business rules belong in the application or domain layer.
- Placing the ACL inside the legacy system when the main goal is to protect the new model. The new team then loses control of its boundary and deployment.
- Using one large shared ACL for every integration, which can become another monolith and a release bottleneck.
- Silently mapping unknown values to a default. This can create incorrect financial behaviour; unknown values should be handled explicitly and monitored.
- Reading the legacy database directly without a controlled adapter, ownership agreement, or plan for schema changes.
- Forgetting timeouts, retries, idempotency, tracing, and failure handling around remote legacy calls. Retries must be safe for the operation.
- Treating the ACL as permanent infrastructure and never planning its removal after the legacy capability is retired.

## 8. Follow-up interview questions

### Should an anti-corruption layer be a separate microservice?

Not always. Keep it inside the consuming service when it is small and consumer-specific. Use a separate service when multiple consumers need the same translation or when deployment, scaling, ownership, or security requirements justify it.

### What is the difference between an ACL and an API gateway?

An API gateway mainly routes and manages external traffic, authentication, throttling, and similar concerns. An ACL translates between domain models and protects one model from another. An API gateway can host simple translation, but the responsibilities are different.

### When can the anti-corruption layer be removed?

Remove it when the legacy dependency has gone and no translation is needed. Because the application depends on its own interface, its legacy adapter can usually be deleted or replaced without changing the domain logic.
