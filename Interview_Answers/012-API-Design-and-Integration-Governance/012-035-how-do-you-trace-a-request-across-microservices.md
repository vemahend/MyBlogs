# 35. How do you trace a request across microservices?

**Technology:** API Design and Integration Governance

**Source question:** 35. How do you trace a request across microservices?

## 1. What is it?

Tracing a request across microservices means following one request as it moves through several services, databases, queues, and external APIs.

We normally use **distributed tracing**. The first service creates a trace ID, and every downstream operation records a span under that trace. A span represents one unit of work, such as an HTTP call, a database query, or processing a message. Together, the spans show the complete journey of the request.

In modern .NET, tracing is based on `System.Diagnostics.Activity`. OpenTelemetry can collect these activities and export them to tools such as Azure Monitor Application Insights, Jaeger, Grafana Tempo, or another observability platform.

## 2. Why is it important?

A user may see only one slow or failed API call, while the real problem is several services away. Normal logs from a single service do not show the full path.

Distributed tracing helps teams:

- Find which service, dependency, or database caused a failure or delay.
- Understand the order and duration of calls.
- Connect logs and metrics to the same request.
- Investigate production problems without reproducing them locally.
- See the effect of retries, timeouts, and external dependencies.

For architects, it also shows whether service boundaries and dependencies are creating unnecessary latency or tight coupling.

## 3. How does it work?

1. An incoming request contains trace context, or the first service creates it.
2. The service starts a server span for the request.
3. When it calls another service, the current trace context is added to the outgoing request.
4. The next service reads that context and creates a child span with the same trace ID.
5. Database calls, HTTP calls, and custom business operations create more child spans.
6. Each service exports its spans to a central tracing backend.
7. The backend joins spans by trace ID and displays the end-to-end timeline.

OpenTelemetry commonly carries context using the W3C Trace Context headers `traceparent` and `tracestate`. ASP.NET Core and `HttpClient` support this context flow through .NET diagnostics. OpenTelemetry instrumentation captures and exports it. For asynchronous messaging, trace context must also be placed in message headers and restored by the consumer.

A trace ID identifies the whole request. A span ID identifies one operation inside that request. A correlation ID may still be useful as a business or support reference, but it should not replace the standard trace context.

## 4. Practical example

A customer submits a bank transfer through an API gateway. The request travels through the Transfer API, Account Service, Fraud Service, Ledger Service, and Notification Service.

All operations share one trace ID. The trace shows that the Transfer API took 2.8 seconds and that 2.5 seconds were spent waiting for the Fraud Service. Inside that service, a span shows a slow third-party risk check. The team can identify the real dependency immediately instead of searching unrelated log files in five services.

If the Notification Service receives a queued event later, the message carries the trace context. Its consumer span can therefore be connected to the original transfer trace.

## 5. Scenario-based interview answer

“In one payment platform, customers sometimes received a timeout even though the payment was eventually completed.

**Problem:** We had logs in each service, but it was difficult to connect the API request to the payment, fraud, ledger, and message-processing operations.

**Decision:** I standardized distributed tracing with OpenTelemetry and W3C trace context. We used automatic instrumentation for ASP.NET Core, `HttpClient`, and database access, then added custom spans around important payment steps. We also included trace context in message headers.

**Implementation:** Every service exported traces to our central observability platform. Structured logs included the current trace ID and span ID. We added useful tags such as operation type and payment provider, but never card numbers, tokens, or personal data. We used sampling to control cost while retaining errors and important transactions.

**Result:** The trace showed that a retry in the provider adapter continued after the gateway timeout. We aligned the timeout and retry policies and added idempotency protection. Investigation time dropped from hours to minutes, and duplicate payment risk was reduced.”

## 6. Code example

The following example works with the `System.Diagnostics` tracing APIs used by current supported .NET versions. OpenTelemetry packages provide collection and export. Package versions should be kept compatible with the application’s target framework.

```csharp
using System.Diagnostics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient("fraud", client =>
{
    client.BaseAddress = new Uri("https://fraud-service");
});

builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource.AddService("payment-api"))
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddSource(PaymentTracing.SourceName)
        .AddOtlpExporter());

var app = builder.Build();

app.MapPost("/payments", async (
    PaymentRequest request,
    IHttpClientFactory clientFactory,
    ILogger<Program> logger) =>
{
    using var activity = PaymentTracing.Source.StartActivity("Validate payment");
    activity?.SetTag("payment.method", request.Method);

    logger.LogInformation(
        "Validating payment. TraceId: {TraceId}",
        Activity.Current?.TraceId.ToString());

    var client = clientFactory.CreateClient("fraud");
    var response = await client.PostAsJsonAsync("/checks", request);
    response.EnsureSuccessStatusCode();

    return Results.Accepted();
});

app.Run();

public static class PaymentTracing
{
    public const string SourceName = "Payments.BusinessOperations";
    public static readonly ActivitySource Source = new(SourceName);
}

public sealed record PaymentRequest(decimal Amount, string Method);
```

Important points:

- ASP.NET Core instrumentation creates the incoming request span.
- `HttpClient` instrumentation creates an outgoing span and propagates W3C trace context automatically.
- `ActivitySource` creates a custom span for a meaningful business operation.
- The source name passed to `AddSource` must match the `ActivitySource` name.
- Tags must contain safe, low-cardinality data. Do not attach card details, access tokens, or customer data.
- `AddOtlpExporter` sends spans through OTLP to the configured collector or backend. Its endpoint and credentials should be configured outside the source code.

## 7. Common mistakes

- Creating a new correlation ID in every service instead of propagating the incoming trace context.
- Forwarding a custom header but not the standard W3C trace context.
- Instrumenting HTTP calls but forgetting queues, background jobs, or custom business operations.
- Logging sensitive information in span tags or baggage.
- Using high-cardinality tags, such as a customer ID or full URL with identifiers, which increases cost and reduces query performance.
- Recording every trace in a high-volume system without a sampling and retention plan.
- Sampling so aggressively that errors and rare slow requests disappear.
- Adding tracing without consistent service names, environment tags, clocks, dashboards, or alerts.
- Assuming tracing replaces logs and metrics. The three signals solve different parts of an incident.

## 8. Follow-up interview questions

### What is the difference between a trace ID and a span ID?

The trace ID identifies the complete request across all services. A span ID identifies one operation within that trace. Parent and child span IDs describe the call hierarchy.

### How do you trace asynchronous messages?

Inject the current trace context into message headers when publishing. The consumer extracts it, starts a consumer span, and makes that context current while processing the message. Use the messaging system’s OpenTelemetry instrumentation when available.

### How do you control tracing cost in production?

Use sampling, sensible retention, and limited safe tags. Keep error and high-value traces where possible, and use a collector so sampling and export rules can be managed centrally.
