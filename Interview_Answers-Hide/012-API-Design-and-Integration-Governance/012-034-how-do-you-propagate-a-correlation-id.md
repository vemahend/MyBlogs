# 34. How do you propagate a correlation ID?

**Technology:** API Design and Integration Governance

**Source question:** 34. How do you propagate a correlation ID?

## 1. What is it?

Propagating a correlation ID means carrying the same request identifier across every service involved in one business operation.

For HTTP calls, it is usually sent in a header such as `X-Correlation-ID`. For asynchronous messages, it is placed in message metadata. Each service includes it in logs and passes it to the next service.

In modern .NET, distributed tracing also uses the W3C `traceparent` header through `System.Diagnostics.Activity`. A trace ID is often the better standard for technical tracing, while a separate correlation ID can still be useful as a business-friendly identifier.

## 2. Why is it important?

A single user request may pass through an API gateway, payment service, fraud service, database worker, and notification service. Without a shared identifier, their log entries look unrelated.

Propagation allows developers and support teams to:

- find the complete path of one request;
- diagnose failures and performance problems faster;
- connect synchronous HTTP calls with asynchronous processing;
- give support teams a safe reference that they can use when investigating an incident.

It does not replace distributed tracing, but it makes logs and operational support much easier to use.

## 3. How does it work?

A typical flow is:

1. The first trusted entry point checks for an incoming correlation ID.
2. It validates and accepts the value, or creates a new ID when none is supplied.
3. Middleware stores the ID in request context and opens a logging scope.
4. Outgoing HTTP handlers add the ID to downstream requests.
5. Message producers copy it into message headers or properties.
6. Message consumers read it, add it to their logging scope, and propagate it again.
7. The API returns the ID in the response header so the caller can quote it during support.

The ID should remain unchanged for the whole operation. Each service may also create its own span ID so tracing can show individual steps.

## 4. Practical example

A customer submits a bank transfer with correlation ID `7d6a0fd4f4c84d2199b58dce4e02f394`.

The banking API logs the ID and passes it to the account and fraud services. When it publishes a `TransferRequested` event, it includes the same value in the message metadata. The payment worker and notification service then use it in their logs.

If the customer sees an error, support can search for that ID and follow the transfer from the first API request through every service and background message.

## 5. Scenario-based interview answer

“In one payment platform, an API request crossed several services and later continued through a message queue. When a payment failed, finding all related logs took too long because every service created an unrelated identifier.

I decided to establish the correlation ID at the API gateway and preserve it across the whole operation. We used ASP.NET Core middleware to validate or create the ID, placed it in a structured logging scope, returned it to the client, and used a delegating handler for outgoing HTTP calls. Message publishers stored the same value in message metadata, and consumers restored the logging scope before processing.

We also kept W3C tracing enabled, so the trace ID and span IDs gave us detailed timing while the correlation ID remained easy for support teams to search. This reduced incident investigation time and made the request path visible across APIs and background workers.”

## 6. Code example

The following example works with supported ASP.NET Core versions, including .NET 8 and later:

```csharp
using System.Diagnostics;

const string HeaderName = "X-Correlation-ID";

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHttpContextAccessor();
builder.Services.AddTransient<CorrelationIdHandler>();
builder.Services.AddHttpClient("Payments")
    .AddHttpMessageHandler<CorrelationIdHandler>();

var app = builder.Build();

app.Use(async (context, next) =>
{
    var suppliedId = context.Request.Headers[HeaderName].FirstOrDefault();
    var correlationId = IsValid(suppliedId)
        ? suppliedId!
        : Activity.Current?.TraceId.ToString() ?? Guid.NewGuid().ToString("N");

    context.Items[HeaderName] = correlationId;
    context.Response.OnStarting(() =>
    {
        context.Response.Headers[HeaderName] = correlationId;
        return Task.CompletedTask;
    });

    using (app.Logger.BeginScope(
        new Dictionary<string, object> { ["CorrelationId"] = correlationId }))
    {
        await next();
    }
});

app.Run();

static bool IsValid(string? value) =>
    value is { Length: > 0 and <= 64 } &&
    value.All(c => char.IsLetterOrDigit(c) || c is '-' or '_');

public sealed class CorrelationIdHandler(IHttpContextAccessor accessor)
    : DelegatingHandler
{
    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        var id = accessor.HttpContext?.Items["X-Correlation-ID"]?.ToString();

        if (!string.IsNullOrWhiteSpace(id))
        {
            request.Headers.TryAddWithoutValidation("X-Correlation-ID", id);
        }

        return base.SendAsync(request, cancellationToken);
    }
}
```

The middleware validates the incoming value, creates one when needed, adds it to structured logs, and returns it to the caller. The `DelegatingHandler` copies it to downstream HTTP calls.

ASP.NET Core and `HttpClient` already propagate W3C tracing headers when diagnostics are enabled. Production systems should export those traces through OpenTelemetry instead of manually creating `traceparent`. For queue-based work, copy the correlation ID into message metadata and read it at the consumer; do not depend on `HttpContext`, because background processing has no HTTP request.

## 7. Common mistakes

- Creating a new correlation ID in every service instead of preserving the incoming one.
- Logging the ID but forgetting to add it to outgoing HTTP calls or message metadata.
- Trusting an unlimited or malformed client value, which can create log-injection or storage problems.
- Reusing one ID for unrelated scheduled jobs or batch items, making searches ambiguous.
- Putting the ID only in a log message instead of a structured log property.
- Confusing a correlation ID with authentication or authorization. It is an observability value, not proof of identity.
- Manually overwriting W3C tracing headers and breaking OpenTelemetry trace relationships.
- Forgetting that retries should normally keep the operation's correlation ID while each retry can have its own tracing span.

## 8. Follow-up interview questions

### Should a correlation ID and a trace ID be the same?

They can be, especially when the W3C trace ID meets the operational need. A separate correlation ID is useful when the business operation continues across multiple traces, or when support needs a stable public reference. If both exist, log both clearly.

### How do you propagate it through a message broker?

Put it in message headers or application properties when publishing. The consumer reads it, starts a structured logging scope, and copies it to any new messages. Use the broker's message ID separately because it identifies the individual message, not the whole operation.

### What should happen when a client does not provide an ID?

The first trusted entry point should generate one, commonly from the current W3C trace ID or a new GUID, and return it in the response. It should validate any client-provided value before accepting it.
