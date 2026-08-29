# 33. What is a correlation ID?

**Technology:** API Design and Integration Governance

**Source question:** 33. What is a correlation ID?

## 1. What is it?

A correlation ID is a value used to connect related work across logs, API calls, messages, and services.

For example, one payment request may pass through an API gateway, payment service, fraud service, database, and message broker. If every component records the same correlation ID, support teams can search for that value and see the whole journey.

A correlation ID is not necessarily the same as a distributed tracing ID. In modern .NET systems, W3C Trace Context uses the `traceparent` header and `Activity.TraceId` for technical tracing. A separate business correlation ID can represent a longer process, such as a payment or order workflow, which may continue across several traces.

## 2. Why is it important?

In a distributed system, one user action creates logs in many places. Timestamps alone are not reliable enough to connect them, especially when many requests run at the same time.

A correlation ID helps teams:

- Find all events related to one request or business process.
- Investigate failures and performance problems faster.
- Connect synchronous HTTP calls with asynchronous messages.
- Give support teams a safe reference for troubleshooting.
- Build useful log searches, dashboards, and traces.

It improves observability, but it does not replace structured logging, metrics, or distributed tracing.

## 3. How does it work?

A typical flow is:

1. The trusted entry point receives a correlation ID or creates one when it is missing.
2. It validates the value and stores it in the request context.
3. Every log entry includes the value as a structured property.
4. The application passes it to downstream HTTP services and includes it in message metadata.
5. Downstream services keep the same value rather than generating a new one for the same business flow.
6. The API may return the value in the response so the caller can report it when asking for support.

The ID should be opaque and unique, commonly a GUID. It must not contain customer names, account numbers, tokens, or other sensitive data.

For HTTP tracing, prefer the standard W3C `traceparent` header. If the organisation also needs a business-level ID, use a clearly defined custom header such as `X-Correlation-ID` and document its validation and propagation rules. Message brokers should carry it as message metadata, not only inside the message body.

## 4. Practical example

A customer submits a bank transfer. The API creates correlation ID `7f2...`, records it in structured logs, and forwards it to the fraud and ledger services. It also puts the same ID in the metadata of the `TransferRequested` message.

The ledger update later fails in a background consumer. An engineer searches the central logging system for `7f2...` and finds the original API request, fraud decision, published event, retry attempts, and final error. The customer does not need to explain every step; support can use the returned reference to locate the complete flow.

## 5. Scenario-based interview answer

**Problem:** In a payment platform, an API request crossed several services and then continued through a message broker. When a payment failed, the team had to search separate log stores by timestamp, which was slow and sometimes matched the wrong request.

**Decision:** I introduced a correlation ID at the API gateway and kept W3C trace context for detailed distributed tracing. The correlation ID represented the payment workflow, while trace IDs represented individual technical executions and retries.

**Implementation:** We accepted only a short, valid ID from trusted callers; otherwise, the gateway generated a GUID. ASP.NET Core middleware added it to a structured logging scope and the response. HTTP clients and message publishers propagated it through headers or message metadata. Consumers restored it into their logging scope. We also indexed the field in the central logging platform and made sure the value contained no customer data.

**Result:** Support could find the complete payment history with one search, including asynchronous retries, while engineers could still use trace IDs and span IDs for detailed timing analysis.

## 6. Code example

This ASP.NET Core middleware works with supported ASP.NET Core versions, including .NET 8 and later:

```csharp
using System.Text.RegularExpressions;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

const string HeaderName = "X-Correlation-ID";

app.Use(async (context, next) =>
{
    var suppliedId = context.Request.Headers[HeaderName].FirstOrDefault();

    // Limit accepted values so untrusted input cannot create huge or malformed logs.
    var correlationId = suppliedId is not null &&
                        Regex.IsMatch(suppliedId, "^[A-Za-z0-9._-]{1,64}$")
        ? suppliedId
        : Guid.NewGuid().ToString("N");

    context.Items[HeaderName] = correlationId;
    context.Response.OnStarting(() =>
    {
        context.Response.Headers[HeaderName] = correlationId;
        return Task.CompletedTask;
    });

    using (app.Logger.BeginScope(
        new Dictionary<string, object> { ["CorrelationId"] = correlationId }))
    {
        await next(context);
    }
});

app.MapPost("/payments", (HttpContext context) =>
{
    var correlationId = context.Items[HeaderName]?.ToString();
    app.Logger.LogInformation("Payment request accepted");

    return Results.Accepted(value: new { correlationId });
});

app.Run();
```

The middleware validates a caller-supplied value or creates a new GUID. `BeginScope` adds `CorrelationId` to logs written during the request when the logging provider supports scopes. `OnStarting` adds the ID to the response before headers are sent.

Production code should place this logic in a reusable middleware class and use a precompiled or source-generated regular expression. Downstream HTTP and message propagation must also be implemented. For technical tracing, ASP.NET Core and `HttpClient` already integrate with `System.Diagnostics.Activity` and W3C trace context; do not replace `traceparent` with this custom header.

## 7. Common mistakes

- Generating a new correlation ID in every service, which breaks the connection between logs.
- Treating a correlation ID as an authentication or idempotency key. It proves neither identity nor uniqueness of an operation.
- Putting account numbers, email addresses, access tokens, or other sensitive data in the ID.
- Trusting any client-supplied value without length and character validation, causing log injection or very large log fields.
- Propagating the ID through HTTP calls but forgetting events, queues, scheduled work, and retry messages.
- Logging the ID only inside free-text messages instead of as an indexed structured field.
- Using one correlation ID forever for a user session, which produces noisy and overly broad searches.
- Replacing W3C distributed tracing with a custom header instead of using both concepts for their intended purposes.
- Returning internal trace details or stack traces to callers. A safe opaque reference is enough.

## 8. Follow-up interview questions

### Is a correlation ID the same as a trace ID?

Not always. A trace ID connects spans in one distributed trace. A business correlation ID can connect a longer workflow across separate traces, delayed messages, and retries. For a simple synchronous request, the trace ID may be enough.

### Who should create the correlation ID?

The first trusted entry point, usually an API gateway or the first service, should create it when a valid one is not already present. All downstream components should propagate it.

### Is a correlation ID the same as an idempotency key?

No. A correlation ID helps observe related work. An idempotency key helps the server recognize repeated commands and avoid processing the same operation twice. They have different lifecycles and should not be reused as each other.
