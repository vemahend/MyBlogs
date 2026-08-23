# 26. How do you implement global exception handling?

**Technology:** API Design and Integration Governance

**Source question:** 26. How do you implement global exception handling?

## 1. What is it?

Global exception handling is one central place that catches unhandled exceptions from an application.

In an ASP.NET Core API, it normally sits near the start of the HTTP pipeline. If an endpoint, service, or repository throws an exception that it cannot handle, the global handler:

- logs the technical details;
- maps the exception to an appropriate HTTP status code;
- returns a safe and consistent error response; and
- prevents stack traces or internal details from reaching the client.

For modern ASP.NET Core, `IExceptionHandler` and `ProblemDetails` are the preferred building blocks. `IExceptionHandler` has been available since .NET 8. The example below targets .NET 10 LTS, which is the current LTS version as of August 2026.

Global handling is a safety net. It does not mean that every expected business outcome should be implemented by throwing an exception.

## 2. Why is it important?

Without global handling, every controller may contain repeated `try/catch` blocks and may return a different error shape. Some endpoints might expose exception messages, while others might return only a plain `500` response.

A global handler provides:

- **Consistency:** Clients receive the same `ProblemDetails` structure from every endpoint.
- **Security:** Stack traces, SQL text, connection details, and other sensitive data stay on the server.
- **Correct HTTP meaning:** Known failures can become `404`, `409`, or another suitable status instead of every failure becoming `500`.
- **Observability:** Logs can include the trace ID, request path, and exception in one standard way.
- **Cleaner code:** Controllers focus on HTTP input and output instead of repeating infrastructure code.

This is especially important when several web, mobile, or partner applications consume the same API contract.

## 3. How does it work?

A typical request follows this flow:

1. The request enters ASP.NET Core's exception-handling middleware.
2. The request continues through authentication, authorization, endpoints, and application code.
3. A lower layer throws an exception that it cannot resolve locally.
4. The exception travels back up the call stack to the middleware.
5. The middleware calls registered `IExceptionHandler` implementations in registration order.
6. A handler logs the exception, maps its type to an HTTP status, and writes a `ProblemDetails` response.
7. The handler returns `true`, meaning the exception has been handled, so no later handler runs.

A useful mapping might be:

| Exception | HTTP status | Meaning |
|---|---:|---|
| `AccountNotFoundException` | `404 Not Found` | The requested resource does not exist |
| `InsufficientFundsException` | `409 Conflict` | The request conflicts with the account's current state |
| `TimeoutException` | `503 Service Unavailable` | A temporary dependency failure occurred |
| Unexpected exception | `500 Internal Server Error` | An unplanned server failure occurred |

The exact mapping is part of the API contract and should be agreed across teams. Validation failures usually belong in request validation and should return `400` or `422`; they do not need to pass through the global exception handler.

The handler should log the real exception internally but send a stable, non-sensitive message to the caller. A trace ID in both places lets support staff connect the public error response to the detailed server log.

In .NET 10, diagnostics for an exception handled by `IExceptionHandler` are suppressed by default. Therefore, the handler should log exceptions deliberately, or the application can configure `ExceptionHandlerOptions.SuppressDiagnosticsCallback` if centralized middleware diagnostics are preferred. Avoid logging the same exception twice.

## 4. Practical example

Consider a banking API endpoint that transfers money between two accounts.

- If the source account does not exist, the domain service throws `AccountNotFoundException`. The global handler returns `404`.
- If the balance is too low, it throws `InsufficientFundsException`. The handler returns `409` with a stable error code such as `insufficient_funds`.
- If the database becomes unavailable unexpectedly, the handler returns a generic `500` or, when the failure is known to be temporary, `503`.

The response might look like this:

```json
{
  "type": "https://api.example.com/errors/insufficient-funds",
  "title": "The transfer cannot be completed.",
  "status": 409,
  "detail": "The source account does not have enough available funds.",
  "instance": "/transfers",
  "code": "insufficient_funds",
  "traceId": "00-a1b2c3..."
}
```

The client can make decisions using `status` and `code`. Support staff can search for `traceId`. The client never sees the class name, stack trace, database query, or server path.

## 5. Scenario-based interview answer

**Problem:** In a payment API, different controllers handled errors differently. Some returned plain text, some returned custom JSON, and a few exposed raw exception messages. This made client integration and production support difficult.

**Decision:** I introduced central exception handling with ASP.NET Core `IExceptionHandler` and RFC 9457-style `ProblemDetails`. We agreed on a small exception-to-status mapping and stable business error codes. Expected validation errors remained in the validation layer rather than becoming exceptions.

**Implementation:** I registered the problem-details service and a global handler, then enabled exception-handler middleware early in the pipeline. The handler mapped known domain exceptions to safe `404` or `409` responses and unexpected failures to `500`. It logged the original exception with the request trace ID, but returned only approved client-facing text. We added integration tests for the response status, content type, error code, and absence of sensitive details.

**Result:** All endpoints returned the same error contract, controllers became smaller, and support could connect a customer error to the correct log entry using the trace ID. We also reduced accidental information leakage.

In an interview, I would add: “I use global handling for failures that escape the normal flow, not as a replacement for validation or normal business decisions. I also make exception mapping explicit and test it as part of the API contract.”

## 6. Code example

The following example uses ASP.NET Core on .NET 10:

```csharp
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

var app = builder.Build();

// Register before endpoints so exceptions from later middleware are caught.
app.UseExceptionHandler();

app.MapPost("/transfers", (TransferRequest request) =>
{
    if (request.Amount > 10_000)
    {
        throw new InsufficientFundsException();
    }

    return Results.Accepted();
});

app.Run();

public sealed class GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger,
    IProblemDetailsService problemDetailsService) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext context,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (status, title, detail, code, logLevel) = exception switch
        {
            AccountNotFoundException =>
                (StatusCodes.Status404NotFound,
                 "Account not found.",
                 "The requested account does not exist.",
                 "account_not_found",
                 LogLevel.Warning),

            InsufficientFundsException =>
                (StatusCodes.Status409Conflict,
                 "The transfer cannot be completed.",
                 "The source account does not have enough available funds.",
                 "insufficient_funds",
                 LogLevel.Information),

            TimeoutException =>
                (StatusCodes.Status503ServiceUnavailable,
                 "The service is temporarily unavailable.",
                 "Please try again later.",
                 "dependency_timeout",
                 LogLevel.Error),

            _ =>
                (StatusCodes.Status500InternalServerError,
                 "An unexpected error occurred.",
                 "The request could not be completed.",
                 "internal_error",
                 LogLevel.Error)
        };

        logger.Log(
            logLevel,
            exception,
            "Request failed with error code {ErrorCode}. TraceId: {TraceId}",
            code,
            context.TraceIdentifier);

        context.Response.StatusCode = status;

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path,
            Type = $"https://api.example.com/errors/{code.Replace('_', '-')}"
        };

        problem.Extensions["code"] = code;
        problem.Extensions["traceId"] = context.TraceIdentifier;

        return await problemDetailsService.TryWriteAsync(
            new ProblemDetailsContext
            {
                HttpContext = context,
                ProblemDetails = problem,
                Exception = exception
            });
    }
}

public sealed record TransferRequest(decimal Amount);

public sealed class AccountNotFoundException : Exception;
public sealed class InsufficientFundsException : Exception;
```

Important points:

- `AddExceptionHandler<T>()` registers the handler. Handlers are singletons, so injected dependencies must be safe to use from a singleton.
- `UseExceptionHandler()` adds the middleware that catches exceptions and invokes registered handlers.
- `AddProblemDetails()` supplies `IProblemDetailsService`, which writes the standard JSON error format.
- The exception switch keeps the HTTP mapping in one visible place.
- The full exception is logged on the server, while the response contains only controlled text.
- `traceId` connects the response to logs and distributed traces.
- `TryWriteAsync` returns whether a compatible problem-details writer produced the response. In a production design, ensure JSON is supported for the API's expected `Accept` headers and define a fallback if custom writers are used.

If several bounded contexts need different mappings, register focused `IExceptionHandler` implementations in order instead of building one very large handler. The first handler that returns `true` stops the chain.

## 7. Common mistakes

- Adding `try/catch` to every controller and duplicating the same logging and response code.
- Returning `200 OK` with an error object instead of a meaningful HTTP status.
- Returning `500` for known conditions such as a missing resource or a business-state conflict.
- Sending `exception.Message`, stack traces, SQL, tokens, personal data, or internal service names to clients.
- Catching an exception, doing nothing, and hiding a real production failure.
- Logging the same exception in the repository, service, controller, and global handler.
- Using exceptions for ordinary validation or expected control flow.
- Treating every `OperationCanceledException` as a server error. A client disconnect or request cancellation needs separate handling and often does not require an error response.
- Writing a response after HTTP headers have already been sent. At that point, the status and body may no longer be replaceable.
- Forgetting middleware order, so exceptions thrown before `UseExceptionHandler()` are not caught by it.
- Depending only on global handling for reliability. Timeouts, retries, circuit breakers, and transactions solve different problems.
- Changing error codes or shapes without considering them part of the public API contract.
- Injecting scoped services directly into an `IExceptionHandler`; registered handlers have singleton lifetime.
- Forgetting that .NET 10 suppresses diagnostics for exceptions reported as handled by default, which can leave gaps if the handler does not log them.

## 8. Follow-up interview questions

### 1. Should all exceptions return `500 Internal Server Error`?

No. Unexpected programming or infrastructure failures normally return `500`. Known exceptions can map to statuses such as `404`, `409`, or `503`. The mapping must reflect the API contract and must not reveal sensitive information.

### 2. Middleware or MVC exception filters: which should I use?

Middleware with `IExceptionHandler` is usually the default for global API handling because it covers a wider part of the ASP.NET Core pipeline, including Minimal APIs. Exception filters are useful when handling depends specifically on MVC controller or action behavior.

### 3. How do you test global exception handling?

Use integration tests that cause known and unknown exceptions. Verify the HTTP status, `application/problem+json` response, stable error code, and trace ID. Also verify that stack traces and internal exception messages are absent, and that the exception is logged once at the intended level.
