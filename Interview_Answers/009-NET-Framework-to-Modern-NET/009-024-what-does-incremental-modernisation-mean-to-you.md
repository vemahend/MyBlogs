# 24. What does incremental modernisation mean to you?

**Technology:** .NET Framework to Modern .NET

**Source question:** 24. What does incremental modernisation mean to you?

## 1. What is it?

Incremental modernisation means improving or replacing a legacy system in small, controlled steps instead of rewriting everything at once.

For a .NET Framework application, this could mean moving one business capability at a time to modern .NET, while the remaining features continue to run on .NET Framework. The goal is to deliver value early, learn from each migration, and reduce risk.

It is not simply upgrading project files. It may include separating tightly coupled code, replacing unsupported libraries, improving tests, changing hosting, and moving suitable parts into services or modern applications.

## 2. Why is it important?

A large rewrite can take years and may deliver no business value until the end. During that time, requirements change, defects appear, and the old system still needs maintenance.

Incremental modernisation helps because it:

- Keeps important business services running during the migration.
- Allows normal feature delivery to continue.
- Limits each release to a smaller and more understandable risk.
- Produces feedback before the team commits to the next migration.
- Makes rollback easier because only one capability changes at a time.
- Lets the business stop or change direction if the expected value is not being achieved.

For architects, it turns modernisation into a managed delivery programme rather than one large technical gamble.

## 3. How does it work?

A typical flow is:

1. Assess the legacy system, dependencies, business risk, usage, and test coverage.
2. Define measurable goals, such as reducing release time, removing unsupported components, or improving scalability.
3. Create clear boundaries around business capabilities such as payments, customer profiles, or notifications.
4. Add tests and monitoring around the capability before changing it.
5. Introduce a stable boundary such as an HTTP API, message contract, or internal facade.
6. Build or migrate one capability on modern .NET.
7. Route a small amount of traffic to it using a feature flag, gateway rule, or strangler pattern.
8. Compare technical and business results, increase traffic gradually, and keep a tested rollback route.
9. Remove the old implementation only after the new path has proved stable and no consumers depend on the old one.

This cycle is repeated until the valuable parts are modernised. Some stable legacy parts may remain if changing them has no clear business benefit.

## 4. Practical example

Consider a bank with a large .NET Framework internet banking application. Its payment processing, account pages, authentication, and reporting all run in the same deployment.

The team first extracts payment notifications because they are well understood and have few dependencies. The legacy application publishes a versioned `PaymentCompleted` message. A new worker running on modern .NET consumes the message and sends email or SMS notifications.

The team initially enables the new worker for internal accounts, then for 5% of customers, and finally for everyone. Metrics compare delivery rate, processing time, retries, and duplicate messages. If problems occur, publishing remains unchanged and consumption can be switched back to the legacy notification component.

Once the new worker is stable, the old notification code is removed. The team then applies the same approach to the next suitable capability.

## 5. Scenario-based interview answer

“In one payment platform, the main .NET Framework application had grown into a tightly coupled deployment. A full rewrite would have delayed business features and created too much operational risk.

I recommended incremental modernisation. We first mapped dependencies and selected payment notifications because they had clear boundaries and lower financial risk than transaction posting. We added contract and end-to-end tests, introduced a versioned message, and implemented the consumer on modern .NET. We released it behind a feature flag, used idempotency to handle repeated messages, and increased traffic in stages while monitoring delivery failures and processing time. The old consumer stayed available as the rollback path.

The migration reduced notification deployment time and isolated failures without interrupting payment processing. More importantly, it gave us a repeatable approach for modernising the next capability. To me, that is incremental modernisation: small business-aligned changes, measurable outcomes, and a safe route forward or back.”

## 6. Code example

The following simplified facade allows a legacy application to move callers gradually to a modern payment API:

```csharp
public interface IPaymentProcessor
{
    Task<PaymentResult> ProcessAsync(
        PaymentRequest request,
        CancellationToken cancellationToken);
}

public sealed class IncrementalPaymentProcessor(
    LegacyPaymentProcessor legacyProcessor,
    ModernPaymentApiClient modernClient,
    IFeatureDecisions featureDecisions) : IPaymentProcessor
{
    public async Task<PaymentResult> ProcessAsync(
        PaymentRequest request,
        CancellationToken cancellationToken)
    {
        if (!featureDecisions.UseModernPayments(request.CustomerId))
        {
            return await legacyProcessor.ProcessAsync(request, cancellationToken);
        }

        return await modernClient.ProcessAsync(request, cancellationToken);
    }
}
```

Callers depend on `IPaymentProcessor`, not on either implementation. The decision service can move selected customers to the modern path in stages. Both implementations must follow the same contract, and payment requests need an idempotency key so a retry or rollback cannot charge a customer twice.

The primary-constructor syntax shown here requires C# 12 or later. The same pattern also works with a normal constructor when the legacy project uses an older C# language version.

## 7. Common mistakes

- Treating modernisation as a technical upgrade with no measurable business goal.
- Starting with the largest or most critical component before proving the migration approach.
- Moving code without first separating its database, library, and runtime dependencies.
- Sharing database tables between old and new components indefinitely, which preserves tight coupling.
- Changing behaviour and technology at the same time without tests to show which change caused a defect.
- Using a feature flag without a tested rollback process or clear removal date.
- Ignoring data migration, observability, security, operational support, and disaster recovery.
- Declaring migration complete but leaving unused legacy code, infrastructure, and flags in production.
- Creating too many small services when a modular modern application would be simpler to operate.

## 8. Follow-up interview questions

### How do you choose the first component to modernise?

Choose a component with clear boundaries, useful business value, manageable dependencies, and moderate risk. It should be meaningful enough to prove the approach but not so critical that the first migration becomes dangerous.

### Which patterns support incremental modernisation?

Common choices include the strangler pattern, an anti-corruption layer, branch by abstraction, feature flags, versioned APIs, and asynchronous messaging. The right choice depends on coupling, data ownership, and rollback needs.

### How do you know whether incremental modernisation is succeeding?

Track business and engineering measures, such as incident rate, release frequency, lead time, latency, operating cost, migrated traffic, and retired legacy dependencies. Lines of code moved are not a useful success measure by themselves.
