# 43. What should remain in application code?

**Technology:** API Design and Integration Governance

**Source question:** 43. What should remain in application code?

## 1. What is it?

Application code should contain logic that is specific to the business and the application. Examples include payment rules, account eligibility checks, order workflows, data ownership rules, and decisions that require business context.

Shared infrastructure may handle common technical concerns such as authentication token validation, routing, rate limiting, logging, tracing, retries, and transport-level security. However, it should not become the place where the real business rules live.

A useful rule is: **platform components enforce general technical policies; application code owns business meaning and decisions.**

## 2. Why is it important?

Keeping business logic in application code gives the team clear ownership and makes changes safer.

- Business rules can be tested with normal unit and integration tests.
- A service can deploy its rule changes without coordinating a shared API gateway or integration platform release.
- Developers can understand the complete business flow in one codebase.
- Rules can use domain data and transactions correctly.
- A gateway, message broker, or low-code integration tool does not become a hidden monolith.

This separation is especially important in distributed systems. If business decisions are spread across gateways, middleware, database scripts, and services, production problems become difficult to diagnose and changes can affect unrelated applications.

## 3. How does it work?

A request normally passes through several layers:

1. The API gateway applies general policies such as TLS termination, token validation, request-size limits, rate limits, and routing.
2. The API endpoint validates the request shape and converts the transport model into an application command.
3. The application layer coordinates the use case, such as making a payment.
4. Domain code applies business rules, such as balance, account status, payment limits, and approval requirements.
5. Infrastructure code stores data or calls external systems through interfaces defined by the application.
6. The application returns a business result, which the API maps to an HTTP response.

The exact boundary is based on ownership and meaning. A maximum HTTP body size is a general platform policy. A maximum daily transfer amount is a business rule and belongs in the payment application, even if the gateway also has a protective limit.

## 4. Practical example

Consider a banking transfer API. The gateway validates the access token, limits traffic, adds a correlation ID, and routes the request to the Payments service.

The Payments service keeps these rules in its application and domain code:

- The source account must be active.
- The customer must have enough available balance.
- The transfer must not exceed the customer's daily limit.
- A high-value payment may require a second approval.
- The same idempotency key must not create two transfers.

These rules depend on customer, account, and payment state. Putting them in the gateway would duplicate domain data, weaken transaction handling, and make gateway releases dependent on payment requirements.

## 5. Scenario-based interview answer

**Problem:** In one payment platform, several business checks had been implemented as API gateway policies. A change to a transfer limit required the gateway team to deploy, and different API routes had slightly different copies of the same rule.

**Decision:** I separated technical edge policies from payment decisions. Token validation, throttling, routing, and request-size protection stayed in the gateway. Transfer limits, account status, balance checks, idempotency, and approval rules moved into the Payments service.

**Implementation:** We created a payment use case in the application layer and domain policies for the business rules. The gateway forwarded trusted identity claims and a correlation ID, but the service still performed authorization for the requested account and action. We added unit tests for the rules and integration tests for persistence and idempotency.

**Result:** Payment rules became easier to understand, test, and release. We removed duplicated gateway policies, reduced coordination between teams, and produced consistent results for HTTP requests and message-driven payment flows.

In an interview, I would summarize it like this: “I keep business decisions close to the service that owns the domain and data. I use gateways and integration tools for reusable technical controls, not for rules that define whether a payment is allowed.”

## 6. Code example

The following example uses modern C# and works with supported .NET versions such as .NET 8, .NET 9, and .NET 10. The business rule stays in the application service rather than in an API gateway policy.

```csharp
public sealed record TransferCommand(
    Guid SourceAccountId,
    Guid DestinationAccountId,
    decimal Amount,
    string IdempotencyKey);

public sealed class TransferService(
    IAccountRepository accounts,
    ITransferRepository transfers,
    IUnitOfWork unitOfWork)
{
    public async Task<Guid> ExecuteAsync(
        TransferCommand command,
        CancellationToken cancellationToken)
    {
        if (command.Amount <= 0)
            throw new BusinessRuleException("Transfer amount must be positive.");

        var existing = await transfers.FindByIdempotencyKeyAsync(
            command.IdempotencyKey, cancellationToken);

        if (existing is not null)
            return existing.Id;

        var source = await accounts.GetAsync(
            command.SourceAccountId, cancellationToken);

        if (!source.IsActive)
            throw new BusinessRuleException("Source account is not active.");

        if (source.AvailableBalance < command.Amount)
            throw new BusinessRuleException("Insufficient available balance.");

        if (source.AmountTransferredToday + command.Amount > source.DailyLimit)
            throw new BusinessRuleException("Daily transfer limit exceeded.");

        var transfer = source.CreateTransfer(
            command.DestinationAccountId,
            command.Amount,
            command.IdempotencyKey);

        await transfers.AddAsync(transfer, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return transfer.Id;
    }
}
```

`TransferService` coordinates the use case, while the account and transfer models contain business meaning. Repository interfaces hide storage details. The idempotency check and the new transfer should be protected by a database uniqueness constraint and an appropriate transaction, because an application-only check cannot prevent concurrent duplicates.

## 7. Common mistakes

- Putting business rules in an API gateway because it is quick to configure.
- Treating authentication as complete authorization. The application must still check whether the caller can act on the requested resource.
- Duplicating the same business rule in controllers, consumers, scheduled jobs, and gateway policies.
- Keeping domain rules only in UI code, which allows other clients to bypass them.
- Moving all validation into shared middleware. Request-format validation may be shared, but business validation needs application context.
- Letting controllers contain the whole workflow instead of calling an application use case.
- Using retries for non-idempotent business operations without an idempotency design.
- Relying only on application checks for concurrency rules that also require database constraints or transactions.
- Creating a large shared business library that tightly couples services and prevents independent releases.

## 8. Follow-up interview questions

### 1. Should authorization remain in the gateway or the application?

Both have roles. The gateway can validate tokens and apply broad access policies. The application must enforce resource-level and business authorization, such as whether this customer can transfer money from this account.

### 2. What logic is suitable for an API gateway?

Cross-cutting, business-neutral logic such as routing, TLS handling, token validation, rate limiting, request-size limits, correlation IDs, and basic protocol transformation is suitable for a gateway.

### 3. Can business rules be shared between applications?

Share a rule only when the applications truly share the same ownership and release lifecycle. Across independent services, prefer a service API, event, or clearly owned policy source rather than a shared library that couples every deployment.
