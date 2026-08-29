# 12. What is middleware, and how does middleware ordering work?

**Technology:** .NET Framework to Modern .NET

**Source question:** 12. What is middleware, and how does middleware ordering work?

## 1. What is it?

Middleware is a component in the ASP.NET Core HTTP request pipeline. It handles a request before or after other components in the pipeline.

Each middleware can:

- Read or change the request.
- Perform work and call the next middleware.
- Read or change the response after the next middleware returns.
- Stop the pipeline and return a response immediately. This is called **short-circuiting**.

Middleware ordering is the order in which middleware is registered in `Program.cs`. Requests move through that order from top to bottom. Responses return through the same components in reverse order.

## 2. Why is it important?

Middleware provides one place for concerns that apply to many endpoints, such as exception handling, correlation IDs, HTTPS redirection, static files, CORS, authentication, authorization, rate limiting, and request logging.

Ordering matters because one component may depend on work done by another. For example, authorization needs the authenticated user, so authentication must run first. An exception handler must be placed early if it needs to catch exceptions from the rest of the application.

In production, incorrect ordering can cause security failures, missing headers, unhandled exceptions, or unnecessary work. A senior developer should treat the pipeline order as part of the application's design, not just startup configuration.

## 3. How does it work?

ASP.NET Core builds a chain from middleware registrations when the application starts.

For a typical request:

1. The first middleware receives the `HttpContext`.
2. It performs its "before" work and calls `next`.
3. The next component repeats the process until an endpoint runs or a component short-circuits.
4. Control returns through the middleware in reverse order.
5. Each component can perform "after" work, such as logging the response status.

For middleware registered as A, B, and C, the flow is:

`A before → B before → C before → endpoint → C after → B after → A after`

The three main registration styles are:

- `Use...` normally adds middleware that can call the next component.
- `Run(...)` adds a terminal component and does not call anything after it.
- `Map(...)`, `MapWhen(...)`, and `UseWhen(...)` create branches for selected requests.

Routing also affects order. Middleware that needs endpoint metadata must run after route matching. Authentication must run before authorization. In the minimal hosting model, `WebApplication` can add routing around mapped endpoints automatically, but explicit `UseRouting()` makes the required position clear when middleware must run between routing and endpoint execution.

## 4. Practical example

Consider `POST /payments`, protected by authentication and a payment authorization policy.

Exception handling runs first so it can convert later failures into a safe problem-details response. Correlation middleware then adds an ID for tracing. Routing selects the payment endpoint. Authentication validates the access token, and authorization checks whether the caller can create payments. Finally, the endpoint processes the payment.

If authorization runs before authentication, it may see an anonymous user and reject a valid request. If a rate limiter returns HTTP 429, it short-circuits the pipeline, so the payment service and database are never called.

## 5. Scenario-based interview answer

**Problem:** A payment API sometimes returned HTTP 403 for valid users, and exceptions from controller actions were not being converted into the standard error response.

**Decision:** I reviewed the pipeline as an ordered execution flow. I decided that exception handling should wrap all later application code, route matching should happen before components that inspect endpoint metadata, and authentication should run before authorization.

**Implementation:** I moved exception handling near the start. I placed correlation logging around the remaining pipeline, then used routing, authentication, authorization, and mapped endpoints in that order. The custom logging middleware called `next` inside a `try/finally` block so it could record the final status and elapsed time even when downstream code failed.

**Result:** Valid users were authorized correctly, all endpoint exceptions produced consistent problem-details responses, and logs contained a correlation ID and final status for every request.

A natural interview answer would be: “Middleware is an ordered component in the ASP.NET Core request pipeline. It can run code before and after the next component, or short-circuit the request. Requests travel in registration order and responses return in reverse order, so order is important. I normally put global exception handling early, run routing before middleware that needs endpoint metadata, authenticate before authorizing, and map endpoints near the end.”

## 6. Code example

```csharp
using System.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.Authority = builder.Configuration["Identity:Authority"];
        options.Audience = "payments-api";
    });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CreatePayment",
        policy => policy.RequireClaim("permission", "payments.create"));
});

var app = builder.Build();

// Early middleware wraps everything registered after it.
app.UseExceptionHandler();

app.Use(async (context, next) =>
{
    var timer = Stopwatch.StartNew();
    var correlationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault()
        ?? Guid.NewGuid().ToString("N");

    context.Response.Headers["X-Correlation-ID"] = correlationId;

    try
    {
        await next(context);
    }
    finally
    {
        app.Logger.LogInformation(
            "Request {CorrelationId} returned {StatusCode} in {ElapsedMs} ms",
            correlationId,
            context.Response.StatusCode,
            timer.ElapsedMilliseconds);
    }
});

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapPost("/payments", () => Results.Accepted())
    .RequireAuthorization("CreatePayment");

app.Run();
```

`UseExceptionHandler` is early, so it can handle exceptions thrown later. The custom middleware does work before `next` and logs after downstream processing returns. `UseAuthentication` creates the user identity before `UseAuthorization` checks the endpoint policy. `MapPost` adds the final endpoint.

This uses the minimal hosting model introduced in .NET 6 and is valid for current supported ASP.NET Core versions such as .NET 8 and .NET 10. In a larger application, custom logic would normally be moved to a middleware class or an `IMiddleware` implementation.

## 7. Common mistakes

- Running authorization before authentication.
- Placing exception handling too late to catch endpoint failures.
- Forgetting to call `next` when the middleware is not meant to be terminal.
- Calling `next` after sending a complete response, which can cause duplicate writes or "response has already started" errors.
- Trying to change response headers after the response body has started.
- Reading endpoint metadata before routing has selected an endpoint.
- Putting `Run(...)` too early, making later middleware unreachable.
- Serving static files before security checks when those files must be protected. `UseStaticFiles` can short-circuit and normally serves files without authorization.
- Registering CORS in the wrong place. It normally needs to run after routing and before authorization so the selected endpoint's CORS metadata is available and responses receive the correct headers.
- Doing slow synchronous work in middleware or storing request-specific state in singleton fields.
- Putting endpoint-specific business rules into global middleware instead of the endpoint or application layer.

## 8. Follow-up interview questions

### What happens if middleware does not call `next`?

The pipeline stops at that component. This is correct for terminal behavior such as returning a cached response, an authentication challenge, or HTTP 429, but it is a bug if later components were expected to run.

### What is the difference between `Use`, `Run`, and `Map`?

`Use` can perform work and call the next component. `Run` is terminal. `Map` creates a separate pipeline branch for a matching path; `MapWhen` branches using a predicate.

### When should middleware run after routing?

It should run after routing when it needs the selected endpoint or its metadata, such as authorization policies, CORS settings, or custom attributes. It must still run before the endpoint executes if it needs to affect that execution.
