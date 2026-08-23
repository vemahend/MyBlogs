# 24. How do you design consistent API errors?

**Technology:** API Design and Integration Governance

**Source question:** 24. How do you design consistent API errors?

## 1. What is it?

Consistent API error design means every endpoint returns errors in the same predictable format. A client should not receive `{ "message": "failed" }` from one endpoint, plain text from another, and a different JSON structure from a third.

For HTTP APIs, I normally use the standard **Problem Details** format defined by RFC 9457. In ASP.NET Core, this is represented by `ProblemDetails` and `ValidationProblemDetails`.

A useful error response contains:

- The correct HTTP status code, such as `400`, `404`, `409`, or `500`.
- A stable problem `type` or application error `code` that software can use.
- A short human-readable `title` and safe `detail`.
- The request path or problem `instance`.
- A trace or correlation ID for support and logging.
- Field-level errors when validation fails.

The public error contract should be stable, even if the internal implementation changes.

## 2. Why is it important?

Consistent errors make APIs easier and safer to consume. Frontend applications, mobile apps, and other services can use one error-handling component instead of writing special logic for every endpoint.

They also help operations teams. A trace ID lets support staff connect a safe client response to detailed server logs without exposing stack traces, database details, or personal data to the caller.

For architects, a common error contract provides governance across many teams. It defines how validation, business conflicts, missing resources, authentication failures, and unexpected faults are represented. This improves documentation, testing, monitoring, and backward compatibility.

## 3. How does it work?

A typical request flow is:

1. Validate the request at the API boundary. Return `400 Bad Request` with field-level errors when the input is invalid.
2. Run authentication and authorization. Return `401 Unauthorized` when valid authentication is missing and `403 Forbidden` when the authenticated caller lacks permission.
3. Map known business outcomes to documented HTTP statuses and stable error codes. For example, a duplicate payment can return `409 Conflict` with `PAYMENT_ALREADY_EXISTS`.
4. Let domain or application exceptions reach one central exception handler instead of adding `try/catch` blocks to every controller.
5. The handler maps known exceptions to the shared Problem Details contract. It maps unknown exceptions to a generic `500 Internal Server Error` response.
6. Log the full internal exception with the trace ID, but return only safe information to the client.
7. Document the possible error responses in OpenAPI and test both their status codes and JSON shape.

The HTTP status and application error code have different jobs. The status gives broad HTTP meaning; the code gives precise, stable business meaning. Clients should make decisions from these machine-readable values, not by parsing the English message.

## 4. Practical example

Consider `POST /payments`. The API could return:

- `400` with validation errors when `amount` is negative.
- `401` when the access token is missing or invalid.
- `403` when the caller cannot debit the selected account.
- `404` with `ACCOUNT_NOT_FOUND` when the account does not exist.
- `409` with `PAYMENT_ALREADY_EXISTS` when the idempotency key was used for a different request.
- `422` with `INSUFFICIENT_FUNDS` when the request is valid but cannot be processed because of a business rule.
- `500` with a generic message for an unexpected server failure.

Every response uses the same Problem Details fields and includes a trace ID. The mobile app can show suitable user messages from the error code, while the support team uses the trace ID to find the detailed log entry.

## 5. Scenario-based interview answer

**Problem:** “In a banking platform, each API returned errors differently. Some controllers returned strings, some returned custom objects, and a few exposed exception messages. Client teams had complicated error handling, and production incidents were hard to trace.”

**Decision:** “I introduced one API error contract based on RFC 9457 Problem Details. We agreed on HTTP status rules, stable application error codes, validation-error structure, and a trace ID. We also agreed that internal exception details must never be returned.”

**Implementation:** “In ASP.NET Core, I registered `AddProblemDetails` and a central `IExceptionHandler`. Known domain exceptions were mapped to documented statuses and codes, while unknown failures became a generic 500 response. We logged the original exception with `HttpContext.TraceIdentifier`, added OpenAPI response definitions, and wrote contract tests for common failures. We kept business codes in a controlled catalogue so different teams did not invent different names for the same condition.”

**Result:** “Consumers implemented one reusable error handler, support could trace failures quickly, and we stopped leaking sensitive implementation details. New APIs also followed the same rules because the contract and tests were part of our API governance.”

## 6. Code example

The following example uses the built-in Problem Details and `IExceptionHandler` APIs available in ASP.NET Core on .NET 8 and later.

```csharp
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ApiExceptionHandler>();

var app = builder.Build();

app.UseExceptionHandler();

app.MapGet("/payments/{id}", (string id) =>
{
    throw new PaymentNotFoundException(id);
});

app.Run();

public sealed class PaymentNotFoundException(string paymentId)
    : Exception($"Payment '{paymentId}' was not found.");

public sealed class ApiExceptionHandler(
    IProblemDetailsService problemDetailsService,
    ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext context,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var knownError = exception is PaymentNotFoundException;
        var status = knownError
            ? StatusCodes.Status404NotFound
            : StatusCodes.Status500InternalServerError;

        logger.LogError(exception,
            "Request failed. TraceId: {TraceId}", context.TraceIdentifier);

        context.Response.StatusCode = status;

        return await problemDetailsService.TryWriteAsync(
            new ProblemDetailsContext
            {
                HttpContext = context,
                Exception = exception,
                ProblemDetails = new ProblemDetails
                {
                    Status = status,
                    Title = knownError ? "Payment not found" : "Unexpected error",
                    Type = knownError
                        ? "https://api.example.com/problems/payment-not-found"
                        : "https://api.example.com/problems/internal-error",
                    Detail = knownError
                        ? exception.Message
                        : "An unexpected error occurred.",
                    Instance = context.Request.Path,
                    Extensions =
                    {
                        ["code"] = knownError
                            ? "PAYMENT_NOT_FOUND"
                            : "INTERNAL_ERROR",
                        ["traceId"] = context.TraceIdentifier
                    }
                }
            });
    }
}
```

Important points:

- `UseExceptionHandler` sends unhandled exceptions to one central handler.
- Known exceptions are deliberately mapped to a status and stable code.
- The unexpected-error response is generic, while the full exception is retained in server logs.
- `traceId` connects the client response to the log entry.
- In a real API, validation errors should use the same conventions through `ValidationProblemDetails`.

## 7. Common mistakes

- Returning `200 OK` with an error flag instead of using the correct HTTP status.
- Returning `500` for expected validation, not-found, or business-rule outcomes.
- exposing stack traces, SQL errors, secrets, account data, or raw exception messages.
- Using human-readable messages as machine-readable codes. Messages may change or be translated.
- Creating a different error JSON shape in each controller or service.
- Returning a status code without enough information to distinguish business errors.
- Using `401` and `403` interchangeably.
- Forgetting field names and individual messages in validation responses.
- Catching every exception inside controllers, which duplicates mapping and logging logic.
- Changing or removing published error codes without considering API compatibility.
- Logging the same exception in several layers, which creates duplicate alerts.
- Documenting only successful responses and leaving error contracts out of OpenAPI and contract tests.

## 8. Follow-up interview questions

### 1. What is the difference between an HTTP status and an application error code?

The HTTP status describes the broad result, such as `404 Not Found` or `409 Conflict`. The application code, such as `PAYMENT_NOT_FOUND`, identifies the exact problem and remains stable for client logic.

### 2. Should an API return exception messages to clients?

Normally, no. Unexpected exception messages can expose sensitive implementation details. Log the full exception internally and return a safe message plus a trace ID. A known domain error may return an intentionally designed, non-sensitive detail.

### 3. How do you keep errors consistent across microservices?

Define a shared Problem Details convention, status-mapping rules, an error-code catalogue, and reusable platform components. Enforce them through API reviews, OpenAPI checks, and automated contract tests rather than relying only on documentation.
