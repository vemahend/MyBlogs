# 4. How do you avoid overengineering?

**Technology:** Architecture and Design

**Source question:** 4. How do you avoid overengineering?

## 1. What is it?

Overengineering means building more complexity than the current problem needs. Examples include adding unnecessary layers, creating a generic framework for one use case, or introducing microservices before the system needs independent scaling.

I avoid it by choosing the simplest design that meets the known requirements while keeping important future changes possible. Simple does not mean careless. The solution must still be secure, testable, observable, and reliable.

## 2. Why is it important?

Every extra abstraction, service, dependency, and configuration has a cost. Developers must understand it, test it, deploy it, monitor it, and support it in production.

Avoiding unnecessary complexity gives a team:

- Faster delivery and easier code reviews.
- Fewer defects and simpler production support.
- Lower hosting and operational costs.
- Code that new developers can understand more quickly.
- Freedom to improve the design later using real evidence instead of guesses.

Senior developers need this judgement because an architecture can be technically impressive but still be a poor business decision.

## 3. How does it work?

I use a small set of practical checks:

1. Start with the business requirement, expected load, security needs, and failure risks.
2. Build the smallest end-to-end design that satisfies those needs.
3. Use proven platform features before creating custom frameworks.
4. Add an abstraction only when it removes real duplication, protects an important boundary, or makes testing meaningfully easier.
5. Record major design decisions and the reason for them.
6. Measure production behaviour, then evolve the architecture when there is evidence such as slow performance, deployment bottlenecks, or team ownership problems.

I also ask questions such as: “What problem does this component solve today?”, “What is the cost of removing it?”, and “Can we add it later without a risky rewrite?” If there is no clear answer, the component probably should not be added yet.

## 4. Practical example

Suppose a bank needs an internal service to maintain daily transfer limits. It has a small number of requests and is owned by one team.

Instead of creating several microservices, a message broker, event sourcing, and a custom rules engine, I would begin with a modular ASP.NET Core application and a relational database. The transfer-limit rules would live in a focused domain service, with clear interfaces at external boundaries such as the account system.

The application would still include authentication, authorization, audit logging, validation, monitoring, and automated tests because those are real banking requirements. If transaction volume or team ownership later requires independent deployment, the module has a clear boundary and can be extracted into a service with evidence supporting the cost.

## 5. Scenario-based interview answer

“On one payment project, the initial proposal included separate services for payment validation, fee calculation, and notification, even though one team owned all three and the expected volume was modest.

The problem was that this design introduced distributed transactions, message handling, additional deployments, and more production monitoring before we had a need for them.

I decided to use a modular monolith in ASP.NET Core. We kept validation, fee calculation, and notification as separate modules with clear responsibilities, but deployed them as one application. We used a database transaction for payment state changes and an outbox only for the external notification that needed reliable asynchronous delivery.

This allowed us to release sooner, reduced operational complexity, and kept the code easy to test. Later, notification traffic increased significantly, so we extracted only that module into a separate worker. The decision was based on production data rather than an imagined future requirement.”

## 6. Code example

This example keeps a payment fee rule simple and explicit:

```csharp
public sealed record Payment(decimal Amount, bool IsInternational);

public sealed class PaymentFeeCalculator
{
    public decimal Calculate(Payment payment)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(payment.Amount);

        var rate = payment.IsInternational ? 0.02m : 0.005m;
        return decimal.Round(payment.Amount * rate, 2, MidpointRounding.AwayFromZero);
    }
}
```

The rule is readable, uses `decimal` for money, and can be unit tested directly. I would not introduce a generic rule engine, reflection, or a plug-in framework for these two stable rules.

If the business later needs many independently configured rules, effective dates, or non-developer rule changes, that evidence may justify a richer design. The key is to evolve the implementation when the requirement becomes real.

## 7. Common mistakes

- Treating “simple” as permission to ignore security, auditability, error handling, tests, or monitoring.
- Designing for imagined scale without measuring expected or actual traffic.
- Creating interfaces for every class even when there is no boundary, alternate implementation, or testing benefit.
- Building a generic framework before understanding two or three real use cases.
- Choosing microservices because they are popular rather than because independent deployment, scaling, or ownership is required.
- Removing all structure from the code. A large, tightly coupled application is also hard to change.
- Refusing to revisit a simple design after production evidence shows that it no longer fits.

## 8. Follow-up interview questions

### How do you balance YAGNI with future extensibility?

I implement the current requirement and keep likely change points clear, but I do not build unused features. Good naming, small modules, tests, and clear boundaries usually provide enough room to evolve.

### When is an abstraction justified?

It is justified when it hides real external complexity, supports multiple genuine implementations, removes proven duplication, or protects an important business boundary. It should make the code easier to understand, not merely add another layer.

### How do you know when a monolith should become microservices?

I look for evidence such as independent scaling needs, separate team ownership, different release cycles, strong domain boundaries, or reliability isolation requirements. I also confirm that the team can handle the additional operational complexity.
