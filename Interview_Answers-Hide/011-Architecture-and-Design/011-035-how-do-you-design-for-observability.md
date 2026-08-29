# 35. How do you design for observability?

**Technology:** Architecture and Design

**Source question:** 35. How do you design for observability?

## 1. What is it?

Observability is the ability to understand what is happening inside a running system by looking at the information it produces.

The three main signals are:

- **Logs:** detailed records of events, such as a payment being rejected.
- **Metrics:** numeric measurements over time, such as request rate, error rate, and response time.
- **Traces:** the path of one request across APIs, databases, queues, and other services.

Good observability lets a team investigate new and unexpected problems without adding code and redeploying first. It is broader than monitoring. Monitoring usually tells us that a known condition is wrong; observability also helps us discover why it is wrong.

## 2. Why is it important?

Distributed systems can fail in ways that are difficult to reproduce. A customer may see a payment timeout even though every service instance looks healthy on its own. Without connected telemetry, developers must search separate logs and guess where time was spent.

Developers and architects need observability to:

- detect incidents before many customers are affected;
- follow one request across service boundaries;
- find slow dependencies and production bottlenecks;
- distinguish application faults from infrastructure or third-party faults;
- measure service-level objectives, such as availability and latency;
- confirm whether a release improved or damaged the system;
- understand business outcomes, such as payment success and decline rates.

It reduces recovery time, but it also supports design and capacity decisions using real evidence.

## 3. How does it work?

I design observability as part of the system rather than adding it after release:

1. **Start with important user journeys.** For example, define what success, failure, and acceptable latency mean for making a payment.
2. **Create structured logs.** Log named fields such as `PaymentId`, `Outcome`, and `Provider`, not only sentences. Never log secrets or full card details.
3. **Measure useful metrics.** Record request count, error rate, duration, queue depth, dependency health, and important business results.
4. **Add distributed tracing.** Create spans for important work and propagate W3C trace context through HTTP calls and message headers.
5. **Correlate the signals.** Include trace and span identifiers so an alert can lead from a metric to a trace and then to relevant logs.
6. **Use consistent standards.** OpenTelemetry provides common APIs and formats, reducing dependence on one monitoring vendor.
7. **Export centrally.** Send telemetry through an OpenTelemetry Collector or directly to an approved backend. Apply filtering, sampling, retention, and access controls.
8. **Build actionable dashboards and alerts.** Alert on customer impact and service-level objectives, not every technical event. Each important alert should have an owner and a runbook.
9. **Test the design.** During load tests and failure exercises, confirm that the team can find the affected request, dependency, cause, and business impact.

A typical request receives a trace identifier at the system boundary. Each service creates child spans and records structured logs and metrics. Context travels with the request or message. The backend then joins those signals so engineers can see the complete flow.

## 4. Practical example

Consider an online payment that passes through an API gateway, payment service, fraud service, database, and external card provider.

The payment service records a trace for the complete request and a child span for each dependency. Structured logs include the payment identifier, provider, result code, and trace identifier. Metrics track payment attempts, success rate, decline rate, technical failure rate, and duration by provider.

An alert fires because successful payments have dropped below the agreed service-level objective. The on-call engineer opens an example failed trace and sees that the card-provider span is taking eight seconds and timing out. Related logs show provider timeout codes, while other dependencies remain healthy.

The team can quickly identify the affected provider and use the approved failover or incident procedure. The signals show both the technical cause and the number of customers affected.

## 5. Scenario-based interview answer

**Scenario:** Customers reported occasional payment timeouts, but the team could not reproduce them and each service had separate text logs.

**Natural interview answer:**

“The problem was not a complete lack of logs. The problem was that our signals were inconsistent and could not show one payment moving through the system.

I started with the payment journey and agreed the key service-level indicators: success rate, technical error rate, and end-to-end latency. We standardized on OpenTelemetry and W3C trace context. Each API and background consumer created spans, propagated context through HTTP and message headers, and used structured logging with safe identifiers. We also added RED metrics—rate, errors, and duration—for the APIs, plus queue depth and payment outcome metrics.

We sent the telemetry to a central platform, added retention and sampling rules, and prevented personal and card data from being recorded. Dashboards showed the customer journey, and alerts were based on sustained customer impact rather than individual exceptions. Every alert linked to a runbook and relevant traces.

The next time the issue occurred, we traced it to one slow fraud-provider endpoint in minutes. Mean time to recovery reduced significantly, alerts became less noisy, and the team could measure the effect of each fix.”

## 6. Code example

Modern .NET supports the main observability building blocks through `ILogger`, `System.Diagnostics.ActivitySource`, `System.Diagnostics.Metrics`, and OpenTelemetry packages.

```csharp
using System.Diagnostics;
using System.Diagnostics.Metrics;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource.AddService("Payment.Api"))
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddSource(PaymentTelemetry.ActivitySourceName)
        .AddOtlpExporter())
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddMeter(PaymentTelemetry.MeterName)
        .AddOtlpExporter());

var app = builder.Build();

app.MapPost("/payments/{paymentId}", (
    string paymentId,
    ILogger<Program> logger) =>
{
    using var activity = PaymentTelemetry.ActivitySource.StartActivity(
        "Process payment",
        ActivityKind.Internal);

    activity?.SetTag("payment.id", paymentId);

    using (logger.BeginScope(new Dictionary<string, object>
    {
        ["PaymentId"] = paymentId
    }))
    {
        logger.LogInformation("Payment accepted for processing");
        PaymentTelemetry.Attempts.Add(1,
            new KeyValuePair<string, object?>("outcome", "accepted"));
    }

    return Results.Accepted($"/payments/{paymentId}");
});

app.Run();

static class PaymentTelemetry
{
    public const string ActivitySourceName = "Payments.Processing";
    public const string MeterName = "Payments.Business";

    public static readonly ActivitySource ActivitySource =
        new(ActivitySourceName);

    private static readonly Meter Meter = new(MeterName);

    public static readonly Counter<long> Attempts =
        Meter.CreateCounter<long>("payments.attempts");
}
```

`ActivitySource` creates a trace span, `ILogger` produces a structured log, and `Meter` records a business metric. ASP.NET Core and `HttpClient` instrumentation automatically capture incoming and outgoing request activity. The OTLP exporter sends the signals to a configured OpenTelemetry endpoint.

In a real system, I would avoid placing high-cardinality values such as `paymentId` in metric labels. They are useful in controlled logs and traces, but metric dimensions should use bounded values such as `outcome` or `provider`. I would also configure the exporter endpoint, sampling, and resource attributes outside the code for each environment. OpenTelemetry support and package APIs can vary by package version, so all package versions should be kept compatible with the target supported .NET release.

## 7. Common mistakes

- Collecting large amounts of telemetry without deciding which questions it must answer.
- Writing unstructured text logs that cannot be searched by fields.
- Logging passwords, tokens, personal data, or full payment details.
- Using request IDs that are not propagated across HTTP calls and messages.
- Putting unique customer or transaction identifiers in metric labels, causing high cost and poor performance.
- Recording only technical metrics and missing customer or business outcomes.
- Sampling all traces randomly and losing rare errors or important high-value operations.
- Alerting on every exception instead of sustained customer impact, which creates alert fatigue.
- Using logs as an audit ledger. Audit records have different security, integrity, and retention requirements.
- Depending on a telemetry backend during application execution. Telemetry export should not block or fail the business request.
- Creating dashboards and alerts without owners, runbooks, retention rules, or regular review.

## 8. Follow-up interview questions

### What is the difference between monitoring and observability?

Monitoring checks known conditions through dashboards and alerts. Observability uses logs, metrics, traces, and other context to investigate both known and unexpected behaviour. Monitoring is one use of observability data.

### How do you control observability cost?

Collect signals based on business value, use sensible log levels, limit metric dimensions, sample traces, and set appropriate retention periods. Keep errors and important transactions at a higher sampling rate where the platform supports it.

### What should never be included in telemetry?

Secrets, access tokens, passwords, full card data, and unnecessary personal information should never be recorded. Use approved masking or safe identifiers, restrict access, encrypt telemetry, and apply the organisation’s retention and compliance rules.
