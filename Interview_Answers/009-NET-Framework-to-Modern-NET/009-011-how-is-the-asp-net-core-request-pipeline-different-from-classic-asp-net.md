# 11. How is the ASP.NET Core request pipeline different from classic ASP.NET?

**Technology:** .NET Framework to Modern .NET

**Source question:** 11. How is the ASP.NET Core request pipeline different from classic ASP.NET?

## 1. What is it?

The request pipeline is the sequence of components that handles an HTTP request and produces an HTTP response.

In classic ASP.NET on .NET Framework, the pipeline is based on `System.Web` and is closely connected to IIS. Requests pass through fixed application events, HTTP modules, an HTTP handler, and framework-specific stages such as MVC or Web API.

In ASP.NET Core, the pipeline is a lightweight, ordered chain of middleware. The application defines that chain in code. Each middleware can inspect or change the request, call the next middleware, inspect or change the response, or stop the pipeline and return a response immediately.

## 2. Why is it important?

ASP.NET Core gives the application explicit control over request processing. Features such as exception handling, HTTPS redirection, authentication, authorization, routing, logging, CORS, and rate limiting can be added only where they are needed.

The pipeline is also independent of `System.Web` and is not tied to the IIS process model. ASP.NET Core runs on its own web server, normally Kestrel, and can be hosted behind IIS, Nginx, Apache, or a cloud proxy.

For a migration, this matters because `Global.asax`, HTTP modules, HTTP handlers, and `HttpContext.Current` cannot simply be copied. Their behavior must be mapped to middleware, endpoints, filters, dependency-injected services, or another suitable ASP.NET Core feature.

## 3. How does it work?

The ASP.NET Core flow is usually:

1. Kestrel receives the request and creates an `HttpContext`.
2. The request enters middleware in the order registered in `Program.cs`.
3. Each middleware performs work before and, if it calls `next`, after the remaining pipeline.
4. Routing selects an endpoint using the request path and HTTP method.
5. Authentication identifies the caller, and authorization checks access to the selected endpoint.
6. The endpoint runs, such as a controller action, Razor Page, or minimal API handler.
7. The response travels back through middleware in reverse order.

A middleware component can short-circuit the flow. For example, rate-limiting middleware can return HTTP 429 without calling the payment endpoint.

Classic ASP.NET instead uses IIS and `System.Web` lifecycle events such as `BeginRequest`, `AuthenticateRequest`, and `EndRequest`, with modules participating at configured stages and a handler processing the selected resource. Its pipeline is more framework-driven; ASP.NET Core's pipeline is composed directly by the application.

Order is therefore part of the design. Exception handling should normally be early so it can catch failures from later components. Authentication must run before authorization. In current ASP.NET Core applications, `WebApplication` can add routing automatically, but explicit `UseRouting()` is still useful when middleware must run specifically between route matching and endpoint execution.

## 4. Practical example

Consider a banking API that exposes `POST /transfers`.

The request first passes through correlation and exception-handling middleware. Routing then selects the transfer endpoint. Authentication validates the access token, authorization checks the endpoint's policy, and rate limiting protects the service from excessive calls. The endpoint creates the transfer only if all checks pass.

If the token is invalid, the security middleware short-circuits the pipeline and the transfer code never runs. If the endpoint throws an unexpected exception, the earlier exception handler converts it into a consistent problem-details response and logs the correlation ID.

In classic ASP.NET, similar behavior may have been spread across `Global.asax`, custom HTTP modules, Web API message handlers, authorization filters, and IIS configuration. ASP.NET Core puts the application-wide HTTP flow into one visible, ordered pipeline.

## 5. Scenario-based interview answer

**Problem:** A legacy .NET Framework payment API used `Application_BeginRequest` for correlation IDs, an HTTP module for audit logging, and custom code in `Application_Error`. The behavior differed between MVC and Web API, and it was difficult to understand the execution order.

**Decision:** During migration, I mapped cross-cutting HTTP concerns to ASP.NET Core middleware. I kept action-specific validation in endpoint filters or application services instead of putting every concern into middleware.

**Implementation:** I placed exception handling and correlation middleware near the start, followed by HTTPS and routing-related components. Authentication ran before authorization, and endpoints were mapped last. The audit middleware called `next` and recorded the final status code on the return path. All middleware used asynchronous APIs and received dependencies through DI.

**Result:** The request flow became consistent and easy to test. We removed the dependency on `System.Web`, reduced duplicated MVC and Web API configuration, and could run the service on Kestrel in Linux containers behind a reverse proxy.

A natural interview answer would be: “Classic ASP.NET has a `System.Web` pipeline built around IIS events, modules, and handlers. ASP.NET Core uses an ordered middleware chain that the application composes in code. Middleware can run before and after the next component or short-circuit the request. That gives more control and portability, but ordering becomes critical—especially for exception handling, routing, authentication, and authorization.”

## 6. Code example

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.Authority = builder.Configuration["Identity:Authority"];
        options.Audience = "payments-api";
    });
builder.Services.AddAuthorization();

var app = builder.Build();

// Registered early so it can handle exceptions from later components.
app.UseExceptionHandler();

app.Use(async (context, next) =>
{
    var correlationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault()
        ?? Guid.NewGuid().ToString("N");

    context.Response.Headers["X-Correlation-ID"] = correlationId;

    await next(); // Runs the rest of the pipeline.

    app.Logger.LogInformation(
        "Request {CorrelationId} completed with {StatusCode}",
        correlationId,
        context.Response.StatusCode);
});

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapPost("/transfers", () => Results.Accepted())
    .RequireAuthorization();

app.Run();
```

`UseExceptionHandler` wraps the components registered after it. The custom middleware adds a correlation ID before calling `next` and logs the final status code after downstream processing returns. `UseAuthentication` establishes the user before `UseAuthorization` checks the endpoint's access rules. `RequireAuthorization` attaches authorization metadata to the transfer endpoint.

This example uses the minimal hosting model introduced in .NET 6 and used by current supported ASP.NET Core versions. In a larger application, the custom logic would normally be placed in a middleware class or an `IMiddleware` implementation.

## 7. Common mistakes

- Registering middleware in the wrong order, such as authorization before authentication.
- Putting exception handling too late, so it cannot catch failures from earlier middleware.
- Calling `next` after writing a complete response, which can produce an invalid or duplicated response.
- Forgetting to call `next` when the middleware was not intended to short-circuit the request.
- Performing blocking I/O with `.Result` or `.Wait()` instead of using async APIs.
- Copying `Global.asax`, HTTP module, or `HttpContext.Current` patterns into ASP.NET Core instead of redesigning them for middleware and DI.
- Putting endpoint-specific business validation into global middleware, making the pipeline difficult to maintain.
- Trying to change headers after the response has started.
- Assuming IIS owns the ASP.NET Core application lifecycle in the same way as classic ASP.NET. Kestrel processes the application request even when IIS is used as a reverse proxy or hosting integration layer.

## 8. Follow-up interview questions

### What does short-circuiting mean?

It means middleware returns a response without calling the next component. Authentication challenges, static files, rate limits, and cached responses can all end processing early.

### Why does middleware order matter?

Requests move through middleware in registration order, while responses return in reverse order. A component can only wrap or use behavior that is placed after or before it in the correct position.

### When should you use middleware instead of an MVC filter?

Use middleware for application-wide HTTP concerns that should work across endpoint types, such as exception handling or correlation IDs. Use a filter or endpoint filter when behavior depends on MVC, an action, or selected endpoint arguments and results.
