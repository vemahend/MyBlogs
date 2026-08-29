# 25. What is ProblemDetails?

**Technology:** API Design and Integration Governance

**Source question:** 25. What is ProblemDetails?

## 1. What is it?

`ProblemDetails` is a standard, machine-readable way for an HTTP API to describe an error. It follows the Problem Details standard, currently RFC 9457, and avoids every API inventing a different error JSON format.

A typical response contains:

- `type`: a stable URI that identifies the kind of problem.
- `title`: a short, human-readable summary.
- `status`: the HTTP status code.
- `detail`: information about this specific failure.
- `instance`: an identifier or URI for this specific occurrence.

APIs can add safe extension fields such as `errorCode` and `traceId`. ASP.NET Core provides `ProblemDetails` and `ValidationProblemDetails` types for this purpose.

## 2. Why is it important?

Without a shared error contract, one endpoint may return `{ "message": "..." }`, another may return `{ "error": "..." }`, and an exception may return HTML. Clients then need special error-handling code for every endpoint.

`ProblemDetails` gives clients a predictable structure. This makes SDKs, front ends, logs, monitoring, and service-to-service integrations easier to build. A stable `type` or application error code also lets a client make decisions without comparing changing human-readable messages.

It improves security as well: the API can return a useful public error while keeping stack traces, database details, and other sensitive information in server logs.

## 3. How does it work?

The normal flow is:

1. An endpoint, validation rule, or exception handler identifies a failure.
2. The API maps the failure to the correct HTTP status, such as `400`, `404`, `409`, or `500`.
3. ASP.NET Core creates a `ProblemDetails` response with the standard fields and any approved extensions.
4. The response is serialized as JSON, normally using the `application/problem+json` media type.
5. The client checks the HTTP status and stable problem identifier, then decides what to display or whether to retry.

In supported ASP.NET Core versions, including .NET 8, .NET 9, and .NET 10, `AddProblemDetails()` registers `IProblemDetailsService`. Exception-handler and status-code-pages middleware can use that service to create consistent error bodies. Controller APIs can use `Problem(...)`, while Minimal APIs can use `Results.Problem(...)` or `TypedResults.Problem(...)`. With `[ApiController]`, model-validation failures are returned as `ValidationProblemDetails` automatically.

## 4. Practical example

A payment API receives a transfer request, but the source account does not have enough available funds. Returning only `400 Bad Request` does not tell the mobile app what happened.

The API instead returns `409 Conflict` with a stable type such as `https://api.example.com/problems/insufficient-funds`, a safe explanation, an `INSUFFICIENT_FUNDS` error code, and a trace ID. The mobile app can show an appropriate message, while support staff can use the trace ID to find the detailed server-side logs.

## 5. Scenario-based interview answer

“In one payment integration, different endpoints returned different error shapes, so consuming teams had a lot of special-case code and production support was slow.

The decision was to adopt `ProblemDetails` as the error contract and publish a small catalogue of stable problem types and business error codes. We mapped known domain failures to suitable statuses—for example, invalid input to `400`, a missing payment to `404`, and an invalid payment state or insufficient funds to `409`. Unexpected failures became a generic `500` response.

We registered `AddProblemDetails`, handled exceptions centrally, added the distributed trace ID, and kept stack traces and internal exception messages out of responses. Validation errors used `ValidationProblemDetails` so field-level issues stayed consistent.

As a result, client teams implemented one error parser, dashboards could group failures by problem type, and support could correlate a customer report with server logs using the trace ID.”

## 6. Code example

The following Minimal API example works with the supported ASP.NET Core pattern used in .NET 8 and later:

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        context.ProblemDetails.Extensions["traceId"] =
            context.HttpContext.TraceIdentifier;
    };
});

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

app.MapPost("/payments", (PaymentRequest request) =>
{
    if (request.Amount <= 0)
    {
        return Results.Problem(
            type: "https://api.example.com/problems/invalid-amount",
            title: "The payment amount is invalid",
            statusCode: StatusCodes.Status400BadRequest,
            detail: "Amount must be greater than zero.",
            extensions: new Dictionary<string, object?>
            {
                ["errorCode"] = "INVALID_AMOUNT"
            });
    }

    return Results.Ok(new { paymentId = Guid.NewGuid() });
});

app.Run();

public sealed record PaymentRequest(decimal Amount);
```

`AddProblemDetails()` registers the common problem-details service. `UseExceptionHandler()` handles unhandled exceptions without exposing their internals, and `UseStatusCodePages()` can add a body to otherwise empty error responses. `Results.Problem()` creates the expected failure explicitly. The `errorCode` is stable for client logic, while `traceId` supports operational troubleshooting.

In production, log the real exception on the server and return only a generic `500` problem to the caller.

## 7. Common mistakes

- Returning `200 OK` with an error object instead of using the correct HTTP status.
- Exposing stack traces, SQL errors, access tokens, account data, or raw exception messages in `detail`.
- Using the human-readable `title` or `detail` as a client-side decision code.
- Returning `400` for every failure instead of distinguishing validation, not-found, conflict, authentication, authorization, rate-limit, and server errors.
- Changing the meaning of a published `type` or `errorCode` without versioning or contract governance.
- Adding a trace ID to the response but not including the same ID in logs and distributed traces.
- Assuming `AddProblemDetails()` alone maps every domain exception correctly; the application still needs deliberate exception-to-status mapping.
- Returning a problem body for responses that must not contain one, such as `204 No Content` or responses to `HEAD` requests.

## 8. Follow-up interview questions

### What is the difference between `ProblemDetails` and `ValidationProblemDetails`?

`ValidationProblemDetails` extends the problem format with an `errors` collection, usually containing field names and validation messages. It is intended for request-validation failures.

### Should clients use `title` or `detail` to identify an error?

No. Those fields are written for people and may change or be localized. Clients should use a stable `type` URI or a documented extension such as `errorCode`.

### How should unhandled exceptions be returned?

Log the full exception internally, map the response to `500 Internal Server Error`, and return a generic `ProblemDetails` body with a trace ID. Do not expose implementation details to the caller.
