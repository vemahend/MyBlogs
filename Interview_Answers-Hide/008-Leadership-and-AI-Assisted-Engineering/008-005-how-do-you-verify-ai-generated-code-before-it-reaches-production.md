# 5. How do you verify AI-generated code before it reaches production?

**Technology:** Leadership and AI-Assisted Engineering

**Source question:** 5. How do you verify AI-generated code before it reaches production?

## 1. What is it?

Verifying AI-generated code means treating it like code written by any other developer: we review it, test it, scan it, and prove that it meets our requirements before it can reach production.

AI can produce a useful starting point, but it does not understand the full business context. It may generate code that compiles but is insecure, inefficient, or incorrect for an important edge case. The developer who accepts the code remains responsible for it.

## 2. Why is it important?

AI-generated code can fail in ways that are difficult to notice during a quick review. For example, it may:

- Use an API incorrectly or invent an API that does not exist.
- Miss authentication, authorization, validation, or audit requirements.
- Introduce race conditions, data leaks, or poor error handling.
- Create tests that only confirm its own incorrect assumptions.
- Use outdated or vulnerable packages.

In a real system, especially banking or payments, a small mistake can cause financial loss, expose customer data, or break a compliance rule. A clear verification process lets a team use AI for speed without lowering its engineering standards.

## 3. How does it work?

I use several checks before AI-generated code can be merged:

1. **Understand the change:** The developer must be able to explain every important line and confirm that the code matches the acceptance criteria. Code that nobody understands is not ready.
2. **Check the source:** I verify unfamiliar APIs against official documentation and inspect any new NuGet package, license, version, and known vulnerabilities. I never trust an AI citation by itself.
3. **Review the design:** I check boundaries, failure paths, concurrency, cancellation, logging, performance, and whether the change follows the existing architecture.
4. **Review security and privacy:** I look for injection risks, broken authorization, secret exposure, unsafe logging, weak cryptography, and personal or financial data being sent to an unapproved AI service.
5. **Test independently:** I add tests based on the business rules, including negative cases, boundaries, and failures. The expected results come from the requirements, not from the generated implementation.
6. **Run automated gates:** The normal CI pipeline must build the code, run unit and integration tests, apply formatting and static analysis, scan dependencies and secrets, and enforce coverage or quality rules where useful.
7. **Require human approval:** A qualified reviewer checks the change. Higher-risk changes, such as payment calculation or authorization code, receive deeper review or approval from a domain or security specialist.
8. **Release safely:** For significant changes, I use a feature flag, canary release, monitoring, and a tested rollback plan.

The level of checking should match the risk. AI-generated documentation may need a light review; code that moves money needs strong tests, independent review, and controlled release.

## 4. Practical example

Suppose AI generates a .NET method that retries a card payment when a gateway times out. The code looks clean, but retrying the request could charge the customer twice if the gateway processed the first request before the connection failed.

Before accepting it, I would confirm the gateway's official retry rules and require an idempotency key for every payment request. I would add integration tests that simulate a timeout after the gateway has accepted the payment. I would also check that the key is stored with the payment record, that concurrent retries cannot create two payments, and that logs do not contain card details.

The change would then pass normal CI checks and peer review. In production, I would enable it gradually and monitor duplicate-payment, timeout, and retry metrics.

## 5. Scenario-based interview answer

**Problem:** In one project, a developer used an AI assistant to generate retry logic for a payment gateway. The happy path worked, but the proposed implementation retried every failure and did not consider duplicate charges.

**Decision:** I treated the output as an untrusted draft and classified the change as high risk because it could move money more than once.

**Implementation:** I checked the gateway documentation, changed the design to use a stable idempotency key, and limited retries to failures that were documented as transient. We added unit tests for retry decisions and integration tests for timeouts, duplicate requests, and concurrent requests. A second senior developer reviewed the payment flow, and our CI pipeline ran static analysis, dependency scanning, and all automated tests. We released the change behind a feature flag and monitored payment and duplicate-request metrics.

**Result:** We kept the development speed gained from the AI assistant, but the production decision was based on evidence rather than trust in generated code. The feature was released without duplicate charges.

A natural interview summary would be: “I do not create a separate lower standard for AI code. I assume it may be wrong, make sure a developer can explain it, verify unfamiliar details against primary sources, and test from the business requirements. I then use the same CI, security, peer-review, and release controls as any other change, with extra checks when the risk is high.”

## 6. Code example

The following example shows one useful verification technique: write tests from the payment rule, not from the generated implementation. It uses APIs available in supported modern .NET versions, including .NET 8 and later.

```csharp
public enum PaymentFailure
{
    Timeout,
    ServiceUnavailable,
    CardDeclined,
    InvalidRequest
}

public static class PaymentRetryPolicy
{
    public static bool ShouldRetry(PaymentFailure failure) => failure switch
    {
        PaymentFailure.Timeout or PaymentFailure.ServiceUnavailable => true,
        PaymentFailure.CardDeclined or PaymentFailure.InvalidRequest => false,
        _ => false // Fail safely if a new value is introduced.
    };
}
```

```csharp
public class PaymentRetryPolicyTests
{
    [Theory]
    [InlineData(PaymentFailure.Timeout, true)]
    [InlineData(PaymentFailure.ServiceUnavailable, true)]
    [InlineData(PaymentFailure.CardDeclined, false)]
    [InlineData(PaymentFailure.InvalidRequest, false)]
    public void ShouldRetry_MatchesTheApprovedGatewayRules(
        PaymentFailure failure,
        bool expected)
    {
        Assert.Equal(expected, PaymentRetryPolicy.ShouldRetry(failure));
    }
}
```

The test cases represent approved business and gateway rules. They check both positive and negative paths, so an AI-generated implementation cannot pass merely by retrying every failure. In the real payment flow, I would also add integration tests for idempotency and concurrent requests; this small unit test is not enough on its own.

## 7. Common mistakes

- Accepting code because it compiles or because the AI sounded confident.
- Asking AI to generate both the implementation and all tests, then treating those tests as independent proof.
- Reviewing only the happy path and ignoring timeouts, cancellation, concurrency, and partial failure.
- Copying customer data, source code, secrets, or logs into an AI tool that the organisation has not approved.
- Adding unknown packages or copied code without checking ownership, license, maintenance, and vulnerabilities.
- Approving code that the developer cannot explain or support.
- Relying only on code coverage; high coverage does not prove that the assertions or business assumptions are correct.
- Sending every change through the same process instead of applying stronger controls to security, money movement, and personal data.
- Merging generated code without peer review, production monitoring, or a rollback plan.

## 8. Follow-up interview questions

### How is reviewing AI-generated code different from reviewing human-written code?

The engineering quality bar should be the same. With AI code, I pay extra attention to invented APIs, outdated patterns, copied dependencies, and code that looks convincing but does not match the business rule.

### Would you allow AI-generated code in a security-sensitive service?

Yes, as a draft, if company policy allows the tool and no sensitive data is exposed. The final code still needs threat-focused review, strong automated tests, security scanning, and approval from the right people. Some critical areas may require manual implementation or formal controls.

### Who is accountable when AI-generated code causes a production issue?

The engineering team remains accountable. The AI tool is not an approver or an owner; the developer and reviewers must understand the change and provide evidence that it is safe to release.
