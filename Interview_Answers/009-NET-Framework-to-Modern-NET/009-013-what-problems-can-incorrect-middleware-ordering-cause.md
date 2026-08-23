# 13. What problems can incorrect middleware ordering cause?

**Technology:** .NET Framework to Modern .NET

**Source question:** 13. What problems can incorrect middleware ordering cause?

## 1. What is it?

Incorrect middleware ordering means ASP.NET Core pipeline components are registered in an order that does not match their dependencies.

Middleware runs in registration order for the request and in reverse order for the response. Some middleware also stops the pipeline early. Because of this, a component may run before the information it needs exists, run too late to protect an endpoint, or never run at all.

The application may still start normally, so the problem often appears only for certain routes, users, errors, or browser requests.

## 2. Why is it important?

Order affects security, correctness, observability, and performance. Incorrect ordering can cause:

- Valid users to receive HTTP 401 or 403 responses because authorization runs before authentication.
- Protected content to be served without the intended checks because a terminal component runs before security middleware.
- Exceptions to escape the standard error handler because it is registered too late.
- CORS headers to be missing, causing browsers to block otherwise valid requests.
- Rate limiting, output caching, session, localization, or custom endpoint rules to behave incorrectly.
- Logs and metrics to miss short-circuited requests or record the wrong status.
- Unnecessary authentication, database, or business work to happen before a request is rejected.

These are serious production issues because several of them look like random endpoint failures, while others can create a security gap.

## 3. How does it work?

ASP.NET Core creates an ordered pipeline from calls such as `UseExceptionHandler`, `UseRouting`, `UseCors`, `UseAuthentication`, and `UseAuthorization`.

For a request, the main flow is:

1. Early middleware receives the request first.
2. Each component does its initial work and usually calls `next`.
3. Routing selects an endpoint and makes its metadata available.
4. Authentication builds `HttpContext.User`.
5. Authorization uses that user and the selected endpoint's policy.
6. The endpoint runs.
7. The response returns through middleware in reverse order.

Order causes problems in three common ways:

- **Missing prerequisite:** Authorization cannot make the correct decision if authentication has not created the user identity.
- **Too narrow a wrapper:** An exception handler cannot catch an exception thrown by middleware registered before it.
- **Short-circuiting:** Static files, rate limiting, authentication challenges, or terminal `Run` middleware can return a response, so later components never execute.

Routing-related middleware normally needs to run after route matching and before the selected endpoint executes. In the minimal hosting model, `WebApplication` can add routing automatically, but explicit `UseRouting()` is useful when the required position must be clear.

## 4. Practical example

A banking API exposes `POST /transfers`, which requires a valid access token and a `transfers.create` permission.

Suppose `UseAuthorization()` is registered before `UseAuthentication()`. Authorization sees an anonymous user because the bearer token has not been processed yet. A valid customer receives HTTP 401 or 403, and the transfer endpoint never runs.

After authentication is moved before authorization, the token handler creates the user's identity first. Authorization can then check the endpoint policy and permission claim correctly. If global exception handling is also placed near the start, an unexpected transfer-service failure becomes a consistent problem-details response instead of an unhandled error.

## 5. Scenario-based interview answer

**Problem:** After migrating a payment API from classic ASP.NET to ASP.NET Core, valid users intermittently received HTTP 403. Browser clients also reported CORS errors on failed requests, and some endpoint exceptions did not use our standard error format.

**Decision:** I treated the pipeline as an ordered set of dependencies. Exception handling needed to wrap later processing, CORS needed the selected endpoint metadata, authentication needed to create the user before authorization, and endpoints had to execute last.

**Implementation:** I reviewed `Program.cs` from top to bottom and tested normal, unauthenticated, forbidden, preflight, and exception paths. I placed exception handling early, followed by routing, CORS, authentication, authorization, and mapped endpoints. I also checked custom middleware for accidental short-circuiting and for attempts to change headers after the response had started.

**Result:** Valid tokens were handled correctly, rejected and failed requests received the required CORS and error headers, and exceptions were returned in one consistent format. We added integration tests around the pipeline order so a later startup change could not silently reintroduce the issue.

A natural interview answer would be: “Incorrect middleware order can cause both functional and security problems. For example, authorization before authentication sees an anonymous user, exception handling registered too late misses downstream failures, and CORS in the wrong position can make the browser block a valid API response. I define the dependency of each component, put broad wrappers such as exception handling early, route before middleware that needs endpoint metadata, authenticate before authorizing, and test short-circuit and failure paths as well as successful requests.”

## 6. Code example

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddCors(options =>
{
    options.AddPolicy("BankingClient", policy =>
        policy.WithOrigins("https://bank.example")
              .AllowAnyHeader()
              .AllowAnyMethod());
});
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.Authority = builder.Configuration["Identity:Authority"];
        options.Audience = "banking-api";
    });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CreateTransfer", policy =>
        policy.RequireClaim("permission", "transfers.create"));
});

var app = builder.Build();

// Wrap failures from everything registered below it.
app.UseExceptionHandler();

// Select the endpoint before middleware that uses endpoint metadata.
app.UseRouting();
app.UseCors("BankingClient");

// Build the user first, then check the endpoint's policy.
app.UseAuthentication();
app.UseAuthorization();

app.MapPost("/transfers", () => Results.Accepted())
   .RequireAuthorization("CreateTransfer");

app.Run();
```

The important dependency is `UseAuthentication()` before `UseAuthorization()`. `UseCors()` is after routing and before authorization so it can use endpoint metadata and handle cross-origin responses correctly. `UseExceptionHandler()` is early enough to catch exceptions from the remaining pipeline.

This example uses supported minimal-hosting APIs available from .NET 6 onward and is suitable for current supported ASP.NET Core releases, including .NET 8 and .NET 10. A real application should also verify this behavior with integration tests because the application can compile and start even when the order is wrong.

## 7. Common mistakes

- Registering authorization before authentication.
- Putting exception handling after the middleware or endpoints that can throw.
- Running CORS after authorization or after endpoint execution, which can omit headers from preflight or error responses.
- Reading endpoint metadata before routing has selected an endpoint.
- Placing `UseStaticFiles()` before authorization when the files are intended to be protected. Static-file middleware can serve the file and stop the pipeline.
- Adding `Run(...)` or custom terminal middleware too early, making everything below it unreachable.
- Assuming endpoint-specific `.RequireAuthorization()` fixes an incorrectly ordered global pipeline.
- Adding response headers after `next` without checking whether the response has already started.
- Logging too late, so requests rejected or short-circuited earlier are missing from logs.
- Testing only successful requests and missing preflight, unauthenticated, forbidden, rate-limited, static-file, and exception paths.
- Copying a middleware order from another application without checking which components depend on routing or endpoint metadata.

## 8. Follow-up interview questions

### Why must authentication normally run before authorization?

Authentication reads the credential and creates `HttpContext.User`. Authorization then uses that user and the endpoint policy to decide whether access is allowed. Reversing them can make a valid caller appear anonymous.

### Why should exception-handling middleware be near the start?

It can catch exceptions only from components that execute after it. Placing it early lets it wrap most of the application pipeline and produce a consistent error response.

### How would you detect middleware-ordering problems?

Review each component's prerequisites and short-circuit behavior, then use integration tests for success, authentication failure, authorization failure, CORS preflight, exceptions, and other terminal paths. Logs that include the selected endpoint, user identity, status code, and correlation ID also help locate where execution stopped.
