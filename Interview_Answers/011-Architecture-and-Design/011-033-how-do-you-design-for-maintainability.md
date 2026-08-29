# 33. How do you design for maintainability?

**Technology:** Architecture and Design

**Source question:** 33. How do you design for maintainability?

## 1. What is it?

Designing for maintainability means building software that developers can understand, change, test, and operate safely over many years.

It is not only about writing clean code. It includes clear boundaries, simple designs, useful tests, documentation, logging, deployment practices, and ownership. A maintainable system makes the normal change easy and limits the effect when something goes wrong.

## 2. Why is it important?

Most production systems spend much more time being changed than being initially built. Business rules change, security issues are found, dependencies are upgraded, and new developers join the team.

Good maintainability helps a team:

- Deliver changes faster and with fewer regressions.
- Understand where a change belongs.
- Test business rules without starting the whole application.
- Replace infrastructure without rewriting core logic.
- Diagnose production issues quickly.
- Reduce dependence on one person who knows the system.

Without it, even a small change can affect unrelated features and require a risky release.

## 3. How does it work?

I design for maintainability at several levels:

1. **Clear responsibilities:** Each module, class, and method should have one clear purpose.
2. **Business-based boundaries:** Group code around capabilities such as Payments, Accounts, or Authentication, rather than creating one large shared layer.
3. **Dependency direction:** Keep business rules independent from databases, message brokers, and web frameworks. Infrastructure implements interfaces owned by the application or domain.
4. **Simple contracts:** Use small, explicit APIs and events. Validate inputs at system boundaries and avoid exposing database entities directly.
5. **Controlled coupling:** Share only stable concepts. A little duplication is often safer than coupling unrelated modules through a large common library.
6. **Automated tests:** Put most tests around business behavior, with focused integration and end-to-end tests for important boundaries.
7. **Operational visibility:** Add structured logs, metrics, tracing, health checks, and meaningful error handling.
8. **Safe evolution:** Use code reviews, static analysis, automated builds, backward-compatible database changes, and small releases.

The aim is not to add an abstraction everywhere. I introduce an abstraction when it protects a real boundary, represents a business concept, or makes likely changes safer.

## 4. Practical example

Consider a payment service that can use different payment providers. The payment workflow should not contain provider-specific HTTP calls.

The application layer accepts a payment request, checks the business rules, and calls an `IPaymentGateway`. Stripe, Adyen, or a bank gateway can implement that interface in the infrastructure layer. The application stores the payment result through a separate repository and publishes a payment event through an outbox.

If the bank changes its API, only its adapter and related contract tests should change. The payment rules and callers remain stable. Structured logs include the payment ID and correlation ID, so support teams can follow a failed request without reading the code.

## 5. Scenario-based interview answer

**Problem:** In one payment platform, fee calculation, database access, and provider HTTP calls were all inside the API controller. Every pricing change required broad regression testing, and provider failures were difficult to diagnose.

**Decision:** I separated the payment business flow from transport and infrastructure concerns. I kept the design modular rather than immediately splitting everything into microservices, because independent deployment was not yet required.

**Implementation:** I moved fee and payment rules into focused domain services, introduced small interfaces for the gateway and persistence boundaries, and created provider-specific adapters. We added unit tests for business rules, integration tests for SQL and provider contracts, and correlation IDs with structured logs. We also recorded architecture decisions so future developers understood why the boundaries existed.

**Result:** Pricing changes became local and quick to test. A provider integration could be upgraded without changing the core workflow, production diagnosis became faster, and the team released smaller changes with fewer regressions.

In an interview, I would summarize it like this: “I design for maintainability by making responsibilities and boundaries clear, keeping business logic independent from infrastructure, and supporting the design with automated tests and observability. I prefer the simplest design that handles known change points. I also review maintainability continuously, because a clean initial design can still degrade as the system grows.”

## 6. Code example

```csharp
public sealed record PaymentRequest(Guid PaymentId, decimal Amount, string Currency);
public sealed record GatewayResult(string Reference);

public interface IPaymentGateway
{
    Task<GatewayResult> ChargeAsync(
        decimal amount,
        string currency,
        CancellationToken cancellationToken);
}

public interface IPaymentRepository
{
    Task<bool> ExistsAsync(Guid paymentId, CancellationToken cancellationToken);
    Task SaveAsync(Payment payment, CancellationToken cancellationToken);
}

public sealed class PaymentService(
    IPaymentGateway gateway,
    IPaymentRepository repository)
{
    public async Task<string> PayAsync(
        PaymentRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(request.Amount));

        if (await repository.ExistsAsync(request.PaymentId, cancellationToken))
            throw new InvalidOperationException("Payment already exists.");

        var result = await gateway.ChargeAsync(
            request.Amount,
            request.Currency,
            cancellationToken);

        var payment = Payment.Completed(
            request.PaymentId,
            request.Amount,
            request.Currency,
            result.Reference);

        await repository.SaveAsync(payment, cancellationToken);
        return result.Reference;
    }
}
```

The service contains the use-case flow but knows nothing about HTTP clients or a specific database. Small interfaces protect real external boundaries, and constructor injection makes the behavior easy to test. `CancellationToken` is passed through every I/O operation so cancelled requests do not continue doing unnecessary work.

In a production payment flow, I would also handle idempotency and consistency between saving the payment and publishing events, commonly with a database transaction and the outbox pattern.

## 7. Common mistakes

- Adding interfaces and design patterns to every class without a real reason.
- Creating one large “common” project that tightly couples unrelated modules.
- Putting business rules in controllers, database procedures, or provider adapters.
- Allowing database entities to become API contracts.
- Writing only unit tests and ignoring database, messaging, and external API boundaries.
- Building many microservices before the team needs independent deployment or scaling.
- Ignoring logs, metrics, traces, and runbooks until a production incident occurs.
- Keeping outdated documentation that is more misleading than no documentation.
- Treating maintainability as a one-time architecture activity instead of managing technical debt continuously.

## 8. Follow-up interview questions

### How do you measure maintainability?

I combine engineering and delivery signals: change lead time, defect rate, build and test reliability, code complexity, coupling, duplicated code, incident recovery time, and how much of the system only one person understands. No single metric is enough.

### Does maintainability always require Clean Architecture?

No. Clean Architecture offers useful dependency rules, but applying all its layers to a small service may add unnecessary complexity. The design should match the system's size, risk, and expected change.

### How do you balance maintainability with delivery speed?

I protect the high-risk and frequently changing areas first, keep solutions simple, and make improvements in small steps. I avoid both shortcuts that create immediate operational risk and abstractions based only on imagined future needs.
