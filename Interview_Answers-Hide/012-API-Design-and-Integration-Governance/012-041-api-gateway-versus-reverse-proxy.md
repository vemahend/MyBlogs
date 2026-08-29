# 41. API Gateway versus reverse proxy?

**Technology:** API Design and Integration Governance

**Source question:** 41. API Gateway versus reverse proxy?

## 1. What is it?

A **reverse proxy** is a server that receives a client request and forwards it to one of the backend servers. The client sees the proxy address, not the internal service address. Common responsibilities include TLS termination, load balancing, routing, and hiding internal servers.

An **API gateway** is the entry point designed specifically for APIs. It normally uses reverse-proxy behavior, but also applies API-focused policies such as authentication, authorization, rate limiting, request transformation, version routing, quotas, and monitoring.

The terms are not opposites. A reverse proxy is a technical building block; an API gateway is a broader API-management role. Products such as NGINX, Azure API Management, Kong, and YARP can overlap depending on how they are configured.

## 2. Why is it important?

Without a controlled entry point, clients may need to know every internal service address. Security, routing, throttling, and logging then become duplicated across many services.

A reverse proxy is useful when the main need is efficient traffic forwarding, TLS termination, or load balancing. An API gateway is useful when APIs need consistent security and governance across multiple teams or services.

Choosing the right option matters because an API gateway adds features but also cost, latency, configuration, and operational responsibility. A simple reverse proxy may be enough for internal routing, while public or partner APIs often need gateway policies.

## 3. How does it work?

A typical request flow is:

1. The client sends a request to one public endpoint.
2. The reverse proxy matches the host name or path and selects a backend destination.
3. It may terminate HTTPS, add forwarding headers, balance traffic, and forward the request.
4. The backend service processes the request, and the response returns through the proxy.

An API gateway adds more steps before forwarding:

1. Validate the access token or API key.
2. Check authorization, quota, and rate-limit policies.
3. Optionally rewrite the URL, headers, or payload.
4. Route the request to the correct service or API version.
5. Record API-specific logs, metrics, and audit information.

Business rules should normally remain in the service. The gateway should enforce cross-cutting edge policies, not become a large application containing domain logic.

## 4. Practical example

A bank exposes payment and account APIs to its mobile application.

An internet-facing API gateway validates OAuth access tokens, applies a strict rate limit, adds a correlation ID, and routes `/api/payments` to the payment service. It can also reject an expired token before the request enters the private network.

Inside the bank's network, a lightweight reverse proxy distributes payment requests across three healthy payment-service instances. The gateway handles API governance; the internal proxy focuses on reliable traffic routing. In a smaller system, one product could perform both roles.

## 5. Scenario-based interview answer

“In one payment platform, mobile clients were calling several services directly. Each service had different authentication, throttling, and logging behavior, and internal URLs were exposed to the client.

I decided to place an API gateway at the public boundary because we needed more than load balancing. We needed one place for token validation, rate limits, API version routing, and correlation IDs. We kept payment validation and transaction rules inside the payment service.

We configured routes for the payment and account APIs, forwarded identity claims, added health checks and time-outs, and exported gateway metrics. We also avoided putting response caching on payment commands because those operations are user-specific and state-changing.

The result was a smaller public attack surface and consistent API policies. Client configuration became simpler, while the backend services remained independently deployable. If the requirement had only been TLS termination and load balancing, I would have chosen a simpler reverse proxy.”

## 6. Code example

YARP (Yet Another Reverse Proxy) is Microsoft's reverse-proxy toolkit for ASP.NET Core. The following example uses the supported `AddReverseProxy` and `MapReverseProxy` APIs and adds authentication and rate limiting around the proxy pipeline.

```csharp
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Yarp.ReverseProxy;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://identity.example.com";
        options.Audience = "bank-api";
    });

builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("payments", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.User.Identity?.Name ?? context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapReverseProxy()
    .RequireAuthorization()
    .RequireRateLimiting("payments");

app.Run();
```

```json
{
  "ReverseProxy": {
    "Routes": {
      "payments-route": {
        "ClusterId": "payments-cluster",
        "Match": { "Path": "/api/payments/{**catch-all}" }
      }
    },
    "Clusters": {
      "payments-cluster": {
        "Destinations": {
          "payment-1": { "Address": "https://payment-service/" }
        }
      }
    }
  }
}
```

YARP performs the reverse-proxy routing. ASP.NET Core authentication and rate limiting add gateway-like policies. In production, the identity authority must be trusted, forwarded headers must be configured carefully, and routes should have suitable time-outs and health checks. For a full managed API lifecycle, developer portal, subscriptions, and analytics, a dedicated API-management product may be more suitable.

## 7. Common mistakes

- Assuming every reverse proxy is automatically a full API gateway.
- Using a feature-heavy gateway when only simple routing and TLS termination are required.
- Putting business logic and service orchestration into gateway policies, creating a bottleneck and tight coupling.
- Treating gateway authentication as the only security layer. Services should still enforce authorization for sensitive operations.
- Forwarding untrusted client headers such as user IDs or roles without removing and recreating them at a trusted boundary.
- Missing time-outs, health checks, rate limits, observability, or a high-availability deployment.
- Logging access tokens, payment data, or other sensitive information.
- Retrying non-idempotent payment requests without an idempotency design, which can create duplicate transactions.

## 8. Follow-up interview questions

### Can one product act as both a reverse proxy and an API gateway?

Yes. Many products support both. The difference is mainly the responsibilities and policies enabled, not always the product itself.

### Should authentication happen only at the API gateway?

No. The gateway can reject invalid requests early, but sensitive services should still validate the caller's identity and authorization. Use defence in depth and a trusted way to pass identity.

### When would you choose YARP instead of a managed API gateway?

Choose YARP when the team needs a customizable .NET reverse proxy or lightweight gateway and is willing to operate it. Choose a managed gateway when built-in subscriptions, developer portals, policy management, analytics, and managed scaling are more important.
