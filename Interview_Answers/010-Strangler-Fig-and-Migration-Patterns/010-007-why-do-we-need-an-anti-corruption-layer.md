# 7. Why do we need an anti-corruption layer?

**Technology:** Strangler Fig and Migration Patterns

**Source question:** 7. Why do we need an anti-corruption layer?

## 1. What is it?

An anti-corruption layer, or ACL, is a boundary between two systems that use different models, terminology, or rules. It translates requests and responses so that one system does not need to understand the other system's design.

The word "corruption" does not mean damaged data. It means preventing an old or external system's concepts from leaking into the new application's domain model.

An ACL commonly contains adapters, translators, and mapping code. It can be implemented inside the new service or as a separate integration service.

## 2. Why is it important?

During a Strangler Fig migration, the new system often has to communicate with the legacy system for months or years. Without an ACL, legacy field names, status codes, data formats, and business rules spread throughout the new code.

This creates tight coupling. A change in the legacy system then affects many parts of the new system, and the new design slowly starts to look like the old design.

An ACL gives developers one controlled place to:

- Translate between legacy and modern data models.
- Convert old status codes and error responses into meaningful domain values.
- Hide protocol details such as SOAP, XML, fixed-width files, or unusual date formats.
- Validate data before it enters the new domain.
- Replace the legacy integration later with less impact.

## 3. How does it work?

A typical request flow is:

1. The new application calls an interface written in its own business language, such as `ILegacyPaymentGateway.GetPaymentAsync`.
2. The ACL adapter converts that request into the format expected by the legacy system.
3. The adapter calls the legacy API or database through a dedicated client.
4. The ACL translates the legacy response, codes, and errors into the new domain model.
5. The rest of the new application receives only its own types and does not depend on legacy details.

The same translation happens in reverse when the new application sends data to the legacy system.

The ACL should contain integration translation, not core business decisions. Business rules should remain in the domain or application layer.

## 4. Practical example

Suppose a bank is replacing a legacy payment platform. The old platform returns payment states as `"00"`, `"01"`, and `"99"`, uses an amount in cents, and calls the payment identifier `TXN_NO`.

The new payment service uses `PaymentStatus.Completed`, `PaymentStatus.Pending`, and `PaymentStatus.Failed`, stores money as a decimal amount with a currency, and calls the identifier `PaymentId`.

An ACL calls the old platform and converts:

- `TXN_NO` into `PaymentId`.
- The integer amount in cents into a decimal amount.
- Legacy status codes into the new `PaymentStatus` enum.
- Legacy technical errors into exceptions or result types understood by the new service.

Controllers and business services work only with the new payment model. When the old platform is finally removed, only the adapter behind the interface needs to be replaced.

## 5. Scenario-based interview answer

"In one payment migration, the new service still needed settlement information from a legacy platform. The legacy API used unclear field names, numeric status codes, and different rules for money values.

I decided to place an anti-corruption layer between the new payment domain and the legacy client. We defined an interface using the new domain language, then implemented an adapter that called the legacy API, validated its response, translated status codes, converted amounts, and mapped legacy failures to our standard error model. We also added contract tests around the mappings and monitoring for unknown status codes.

As a result, no legacy DTOs entered our controllers or domain services. The new code remained clean, changes to the legacy contract were isolated, and we could later replace the legacy adapter without changing the payment workflow." 

## 6. Code example

```csharp
public enum PaymentStatus
{
    Pending,
    Completed,
    Failed
}

public sealed record Payment(
    string PaymentId,
    decimal Amount,
    string Currency,
    PaymentStatus Status);

// This DTO matches the legacy contract and stays inside the integration layer.
public sealed record LegacyPaymentDto(
    string TXN_NO,
    long AMT_CENTS,
    string CCY,
    string STATUS_CD);

public interface ILegacyPaymentsClient
{
    Task<LegacyPaymentDto> GetAsync(
        string transactionNumber,
        CancellationToken cancellationToken);
}

// The application depends on this interface, which uses the new domain language.
public interface IPaymentGateway
{
    Task<Payment> GetPaymentAsync(
        string paymentId,
        CancellationToken cancellationToken);
}

public sealed class LegacyPaymentAdapter(
    ILegacyPaymentsClient client) : IPaymentGateway
{
    public async Task<Payment> GetPaymentAsync(
        string paymentId,
        CancellationToken cancellationToken)
    {
        LegacyPaymentDto legacy =
            await client.GetAsync(paymentId, cancellationToken);

        PaymentStatus status = legacy.STATUS_CD switch
        {
            "00" => PaymentStatus.Completed,
            "01" => PaymentStatus.Pending,
            "99" => PaymentStatus.Failed,
            _ => throw new InvalidOperationException(
                $"Unknown legacy payment status: {legacy.STATUS_CD}")
        };

        return new Payment(
            PaymentId: legacy.TXN_NO,
            Amount: legacy.AMT_CENTS / 100m,
            Currency: legacy.CCY,
            Status: status);
    }
}
```

`LegacyPaymentDto` and the legacy client are kept inside the integration layer. The application uses `IPaymentGateway` and receives only the clean `Payment` domain type. The adapter owns all translation. It also rejects an unknown status instead of silently producing incorrect business data. `CancellationToken` allows request cancellation to flow to the external call.

The primary-constructor syntax used by `LegacyPaymentAdapter` is available in C# 12. With earlier C# versions, the dependency can be supplied through a normal constructor without changing the pattern.

## 7. Common mistakes

- Allowing legacy DTOs or status codes to leak into controllers and domain services.
- Putting new business rules inside the ACL instead of limiting it to integration and translation concerns.
- Creating a simple one-to-one field mapper without handling meaning, units, defaults, time zones, and error rules.
- Silently accepting unknown legacy values, which can cause incorrect financial decisions.
- Sharing one very large ACL across unrelated domains, creating another tightly coupled system.
- Reading and writing the legacy database directly without owning or understanding its business rules.
- Missing contract tests, logging, metrics, timeouts, retries, and trace correlation for the legacy integration.
- Treating the ACL as permanent without planning how it will be removed after migration.

## 8. Follow-up interview questions

### Is an anti-corruption layer always a separate microservice?

No. It can be an adapter inside the new service when ownership, deployment, and scaling needs are simple. A separate service is useful when several consumers need the translation or when the integration requires independent security, scaling, or release management.

### How is an ACL different from an API gateway?

An API gateway mainly handles concerns such as routing, authentication, throttling, and request aggregation. An ACL translates between different domain models and meanings. An API gateway may route to an ACL, but they solve different problems.

### How do you test an anti-corruption layer?

Use unit tests for mapping rules and edge cases, contract tests against the legacy API contract, and integration tests for the full communication flow. Include tests for unknown codes, rounding, invalid data, timeouts, and legacy error responses.
