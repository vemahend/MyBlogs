# 31. What quality attributes do you consider?

**Technology:** Architecture and Design

**Source question:** 31. What quality attributes do you consider?

## 1. What is it?

Quality attributes are the characteristics that describe **how well** a system works. Functional requirements say what the system must do, such as transfer money. Quality attributes say how the system should do it, such as securely, quickly, reliably, and at the expected scale.

The main attributes I normally consider are:

- **Availability:** Is the service accessible when users need it?
- **Reliability and resilience:** Does it produce correct results and recover from failures?
- **Performance:** Does it respond within an acceptable time?
- **Scalability:** Can it handle growth in users, requests, and data?
- **Security and privacy:** Are data and operations protected?
- **Maintainability:** Can developers understand and safely change it?
- **Testability:** Can important behavior be verified automatically?
- **Observability:** Can we understand the system through logs, metrics, and traces?
- **Interoperability:** Can it communicate with required internal and external systems?
- **Deployability:** Can changes be released safely and frequently?
- **Data integrity:** Does the system keep business data correct and consistent?
- **Usability and accessibility:** Can the intended users use it effectively?
- **Cost efficiency:** Does it meet its goals at a reasonable operating cost?

Not every attribute has the same priority. The important task is to identify the few that matter most for the business and make them measurable.

## 2. Why is it important?

A system may implement every business feature and still fail in production. A payment API that returns the right result but takes 30 seconds, goes down during peak traffic, or charges a customer twice is not a successful system.

Quality attributes guide important architecture decisions, such as database choice, caching, redundancy, security controls, messaging, monitoring, and deployment strategy. They also expose trade-offs early. For example, stronger consistency may increase latency, and very high availability may increase cost and complexity.

Clear, measurable attributes give product owners, architects, developers, testers, and operations teams the same definition of success.

## 3. How does it work?

I handle quality attributes as requirements, not as a final checklist:

1. Identify the important business journeys and failure risks.
2. Ask stakeholders what level of service is actually needed.
3. Express each important attribute as a measurable scenario.
4. Rank the attributes because they often conflict.
5. Choose architecture patterns that support the priorities.
6. Validate them with automated tests, load tests, security tests, failure testing, and production monitoring.
7. Review the targets when traffic, regulations, or business needs change.

A useful scenario contains a trigger, operating conditions, expected response, and a measurable target. Instead of saying “the API must be fast,” I might say: “During normal traffic of 500 requests per second, 95% of balance enquiries must complete within 300 milliseconds.”

I also record trade-offs in an Architecture Decision Record (ADR). This makes it clear why a decision was made and what cost or limitation the team accepted.

## 4. Practical example

Consider a bank funds-transfer service. Its most important quality attributes could be:

- **Integrity:** The same transfer must never be posted twice.
- **Security:** Only an authenticated and authorised customer can transfer funds; sensitive data must be encrypted and audited.
- **Availability:** The API has a target of 99.95% monthly availability.
- **Performance:** 95% of accepted transfer requests should respond within 500 milliseconds under the agreed load.
- **Resilience:** A temporary notification failure must not roll back a completed transfer.
- **Observability:** Every request must have a correlation ID, trace, result metric, and audit record without exposing account details.
- **Recoverability:** Recovery-time and recovery-point objectives must be agreed and tested.

To meet these goals, I would use an idempotency key for requests, a database transaction for the ledger entries, an outbox for reliable event publication, least-privilege access, timeouts, controlled retries, health checks, metrics, and distributed tracing. I would not blindly retry the money movement because that could create a duplicate transaction.

## 5. Scenario-based interview answer

“On one payment platform, the business initially said it wanted the service to be fast, secure, and always available. Those statements were too vague to design or test.

The problem was that payment traffic increased sharply on billing days, and a client retry could submit the same payment more than once. I worked with product, security, operations, and compliance to rank the quality attributes. We agreed that payment integrity and security came first, followed by availability, latency, observability, and maintainability. We then converted them into measurable targets, including a latency percentile, peak throughput, availability target, and recovery objectives.

We implemented idempotency keys, transactional ledger updates, the outbox pattern, horizontal scaling, timeouts, circuit breakers for suitable remote calls, and end-to-end tracing. We tested peak load and dependency failures before release and added alerts based on user-visible service indicators.

As a result, duplicate processing was prevented, peak traffic stayed within the agreed latency target, and support could trace failed requests much faster. The key lesson was that I do not select quality attributes from a generic list; I make the business-critical ones measurable and use them to drive trade-offs.”

## 6. Code example

The following modern ASP.NET Core example shows a small part of a quality-attribute strategy. It uses standard APIs available in ASP.NET Core 8 and later. The durable idempotency store would normally be implemented with a database and a unique constraint, not an in-memory dictionary.

```csharp
using System.Collections.Concurrent;
using Microsoft.Extensions.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy());
builder.Services.AddSingleton<IIdempotencyStore, IdempotencyStore>();
builder.Services.AddScoped<PaymentService>();

var app = builder.Build();

app.MapHealthChecks("/health/ready");

app.MapPost("/payments", async (
    PaymentRequest request,
    HttpContext context,
    IIdempotencyStore idempotency,
    PaymentService payments,
    CancellationToken cancellationToken) =>
{
    if (!context.Request.Headers.TryGetValue("Idempotency-Key", out var key) ||
        string.IsNullOrWhiteSpace(key))
    {
        return Results.BadRequest("Idempotency-Key is required.");
    }

    var result = await idempotency.ExecuteOnceAsync(
        key!,
        () => payments.ProcessAsync(request, cancellationToken));

    return Results.Ok(result);
});

app.Run();

public sealed record PaymentRequest(Guid AccountId, decimal Amount);
public sealed record PaymentResult(Guid PaymentId, string Status);

public interface IIdempotencyStore
{
    Task<PaymentResult> ExecuteOnceAsync(
        string key, Func<Task<PaymentResult>> operation);
}

public sealed class IdempotencyStore : IIdempotencyStore
{
    private readonly ConcurrentDictionary<string, Lazy<Task<PaymentResult>>> _items = new();

    public Task<PaymentResult> ExecuteOnceAsync(
        string key, Func<Task<PaymentResult>> operation)
    {
        var work = _items.GetOrAdd(
            key,
            _ => new Lazy<Task<PaymentResult>>(
                operation,
                LazyThreadSafetyMode.ExecutionAndPublication));

        return work.Value;
    }
}

public sealed class PaymentService
{
    public Task<PaymentResult> ProcessAsync(
        PaymentRequest request, CancellationToken token) =>
        Task.FromResult(new PaymentResult(Guid.NewGuid(), "Accepted"));
}
```

The idempotency key supports reliability by protecting against repeated client requests, including concurrent requests to this single process. The cancellation token prevents abandoned work from running without control. The readiness health check supports availability and operations. In production, the store must be durable and shared by all service instances, and saving the payment and idempotency result must be atomic. Authentication, authorisation, audit logging, metrics, tracing, and failure handling would also be required.

## 7. Common mistakes

- Using vague goals such as “high performance” or “high availability” without measurable targets.
- Treating every quality attribute as equally important instead of agreeing on priorities.
- Choosing technology before understanding the business risks and workload.
- Ignoring trade-offs, such as consistency versus availability or performance versus cost.
- Designing only for the normal path and not for dependency failure, retries, or recovery.
- Assuming a code pattern alone guarantees an attribute; operational processes and infrastructure also matter.
- Measuring only average latency instead of percentiles such as p95 and p99.
- Adding logs without metrics, traces, correlation IDs, useful alerts, or data-redaction rules.
- Setting availability and recovery targets that the business does not need or cannot afford.
- Failing to test quality requirements continuously after the system changes.

## 8. Follow-up interview questions

### How do you prioritise quality attributes?

I start with business impact, legal and security obligations, critical user journeys, expected load, and the cost of failure. I then agree on the highest priorities and document trade-offs with the stakeholders.

### How do you make a quality attribute measurable?

I define the conditions, workload, expected response, and target. For example: “At 1,000 requests per second, 99% of authorised payment requests complete within one second, excluding planned maintenance.”

### Can all quality attributes be maximised at the same time?

No. They often conflict and improving them costs time, money, or complexity. Architecture is about finding an acceptable balance based on business priorities and validating that balance with evidence.
