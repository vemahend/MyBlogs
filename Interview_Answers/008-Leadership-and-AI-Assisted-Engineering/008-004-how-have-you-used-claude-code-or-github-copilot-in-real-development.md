# 4. How have you used Claude Code or GitHub Copilot in real development?

**Technology:** Leadership and AI-Assisted Engineering

**Source question:** 4. How have you used Claude Code or GitHub Copilot in real development?

## 1. What is it?

Claude Code and GitHub Copilot are AI-assisted development tools. I use them as engineering assistants, not as replacements for developer judgement.

They can help me understand an unfamiliar codebase, suggest code, generate tests, explain errors, improve documentation, and automate repetitive changes. Claude Code is useful for repository-level tasks that involve several files and commands. GitHub Copilot is especially useful for suggestions inside the IDE, chat-based help, and small focused edits.

The developer still owns the design, security, correctness, and final review of every change.

## 2. Why is it important?

In a real project, a large amount of time is spent on work that is necessary but repetitive: writing test cases, mapping DTOs, updating validation, reading unfamiliar code, and preparing documentation. AI tools can reduce that effort and give developers more time for architecture and business decisions.

For a senior developer or architect, the main value is not simply writing code faster. It is shortening the feedback loop. I can explore alternatives, find affected components, create a first draft, and run checks more quickly.

This is useful only when proper controls are in place. Banking and payment systems contain sensitive data and high-risk business rules. Prompts must not expose customer data, credentials, or internal secrets, and generated code must go through the same review, testing, and security process as human-written code.

## 3. How does it work?

My normal workflow is:

1. I define a small task with clear acceptance criteria and constraints.
2. I give the tool only the context it needs, such as relevant interfaces, tests, and coding standards.
3. I ask it to explain its proposed approach before making a large change.
4. I keep the change small and inspect the diff carefully.
5. I run formatting, compilation, unit tests, integration tests, and security checks.
6. I manually verify business rules, failure cases, logging, concurrency, and data handling.
7. Another developer reviews the pull request in the normal way.

I use Copilot suggestions for short, local code where the intent is already clear. For broader work, I may use Claude Code to trace a flow across files or prepare a multi-file change. I do not accept generated output blindly. If I cannot explain the code, I do not merge it.

## 4. Practical example

In a payment service, we needed to add an idempotency check so that retrying the same request would not create a second payment.

I first designed the behaviour: the client sends an idempotency key, the service stores the key and the original result, and a repeated request returns that result. I then used an AI coding assistant to locate the related endpoint, handler, repository, and tests. It helped draft test cases for a first request, a repeated request, conflicting payloads, cancellation, and two concurrent requests using the same key.

I reviewed the generated implementation and found that its first suggestion used a check-then-insert flow. That had a race condition because two instances could pass the check together. I changed the design to enforce uniqueness in the database and handled the duplicate-key result safely. The tool saved time on discovery and test scaffolding, while the production decision remained mine.

No real payment data, customer information, connection strings, or secrets were included in the prompt.

## 5. Scenario-based interview answer

“I have used both Claude Code and GitHub Copilot in real development, mainly to accelerate code discovery, repetitive implementation, tests, and documentation.

One example was a .NET payment API where we needed to make payment retries idempotent. The problem was that a simple implementation could create duplicate payments under concurrent requests. I defined the expected behaviour and security constraints first. I used the AI assistant to trace the request flow and draft the handler and test cases.

During review, I rejected its initial check-then-insert approach because it was not safe across multiple service instances. I used a database unique constraint, a transaction, and explicit handling for duplicate keys. I then ran unit and integration tests, checked logs for sensitive data, and sent the change through normal peer review.

The result was faster delivery and better test coverage, without delegating architectural responsibility to the tool. My rule is that AI output is an untrusted first draft: I must understand it, test it, and be able to defend it in a code review.”

## 6. Code example

The following example shows a small pattern I might ask an AI assistant to help scaffold. The important production guarantee is the unique database index, not the initial lookup.

```csharp
public sealed record CreatePaymentCommand(
    string IdempotencyKey,
    decimal Amount,
    string Currency);

public sealed class PaymentService(PaymentsDbContext db)
{
    public async Task<Payment> CreateAsync(
        CreatePaymentCommand command,
        CancellationToken cancellationToken)
    {
        var existing = await db.Payments
            .SingleOrDefaultAsync(
                p => p.IdempotencyKey == command.IdempotencyKey,
                cancellationToken);

        if (existing is not null)
        {
            if (existing.Amount != command.Amount ||
                existing.Currency != command.Currency)
            {
                throw new InvalidOperationException(
                    "The idempotency key was already used for another request.");
            }

            return existing;
        }

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            IdempotencyKey = command.IdempotencyKey,
            Amount = command.Amount,
            Currency = command.Currency,
            Status = PaymentStatus.Pending
        };

        db.Payments.Add(payment);

        try
        {
            await db.SaveChangesAsync(cancellationToken);
            return payment;
        }
        catch (DbUpdateException ex) when (IsUniqueKeyViolation(ex))
        {
            db.Entry(payment).State = EntityState.Detached;

            return await db.Payments.SingleAsync(
                p => p.IdempotencyKey == command.IdempotencyKey,
                cancellationToken);
        }
    }

    private static bool IsUniqueKeyViolation(DbUpdateException exception)
    {
        // In production, inspect the database provider's specific error code.
        return exception.InnerException is not null;
    }
}
```

The table must have a unique index on `IdempotencyKey`. The catch filter is intentionally simplified; production code should check the exact SQL Server, PostgreSQL, or other provider error code rather than treating every database error as a duplicate key.

This example also shows why review is required. An AI tool can produce a useful draft, but a developer must confirm concurrency behaviour, transaction boundaries, provider-specific errors, and whether returning the stored payment matches the business rules.

## 7. Common mistakes

- Sending source code, customer information, credentials, or production logs to a tool without checking company policy and data controls.
- Accepting suggestions because they compile, without checking business rules, security, performance, or concurrency.
- Asking for a large feature in one prompt, which produces a large diff that is difficult to review.
- Trusting generated tests that only confirm the generated implementation instead of the actual requirements.
- Allowing an agent to run destructive commands, change infrastructure, or publish code without clear permissions and human review.
- Using AI output with outdated or invented APIs without checking the supported .NET and package versions used by the project.
- Measuring success only by lines of code or speed instead of defects, maintainability, review effort, and delivery outcome.
- Hiding AI use from reviewers when the organisation requires disclosure or traceability.

## 8. Follow-up interview questions

### How do you review AI-generated code?

I treat it as untrusted code. I inspect the diff, confirm the design, run automated tests and security checks, test failure paths, and require normal peer review. I also check that I can explain every important line.

### What work would you not delegate to an AI coding assistant?

I would not let it independently approve architecture, security controls, production access, data migrations, or financial business rules. It may help analyse or draft them, but an accountable engineer must make and review those decisions.

### How do you protect confidential information when using these tools?

I follow the organisation’s approved-tool policy, use enterprise privacy controls where available, exclude secrets and personal data, limit repository access, review retention settings, and use sanitised examples instead of production data.
