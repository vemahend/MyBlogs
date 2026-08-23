# 4. How do you route traffic between legacy and modern components?

**Technology:** Strangler Fig and Migration Patterns

**Source question:** 4. How do you route traffic between legacy and modern components?

## 1. What is it?

During a Strangler Fig migration, traffic routing decides whether each incoming request goes to the legacy application or the new component.

We normally put a routing layer in front of both systems. This can be an API gateway, reverse proxy, load balancer, or application facade. Clients keep using the same public address, while the routing layer sends each request to the correct backend.

Routing can be based on:

- URL path, such as sending `/api/payments/*` to the modern service.
- API version, hostname, HTTP header, tenant, customer group, or feature flag.
- A controlled traffic percentage for canary releases.

## 2. Why is it important?

A large legacy system is rarely replaced in one release. Routing allows one business capability to move at a time while the rest of the application continues to work.

This gives a team several benefits:

- Clients do not need to know which backend handles a request.
- A new component can be released gradually instead of using a risky big-bang cutover.
- Traffic can be returned to the legacy component if the new component has a production problem.
- Logs, metrics, authentication, rate limits, and correlation IDs can be applied at one entry point.

For architects, the key point is that routing is also a migration control. It must support safe rollout, monitoring, and rollback.

## 3. How does it work?

A typical request flow is:

1. A client sends a request to the existing public URL.
2. The gateway authenticates the caller and assigns or forwards a correlation ID.
3. Routing rules examine stable request information such as the path or tenant ID.
4. The gateway forwards the request to either the legacy application or the modern service.
5. The selected backend returns the response through the gateway.
6. Metrics compare error rate, latency, and business results for both paths.

I prefer path- or capability-based routing when possible because it is clear and deterministic. For a gradual rollout, I use a feature flag or a stable hash of customer ID. A stable hash keeps the same customer on the same backend; a random choice on every request can split one user journey across incompatible systems.

The new route should have a tested rollback switch. Routing back is safe only when both systems can still understand the required data, so data ownership and backward compatibility must be planned with the traffic rule.

## 4. Practical example

Assume a bank is extracting money transfers from a legacy banking application.

At first, all `/api/transfers/*` requests go to the legacy application. The team then introduces a new Transfer Service and routes employee test accounts to it using a feature flag. After validation, it enables selected customer groups and later all customers.

The gateway still routes `/api/accounts/*` and `/api/statements/*` to the legacy application. If the new service's failure rate crosses a defined threshold, the team disables its route and sends transfer traffic back to the legacy system.

This rollback works because, during the transition, the team keeps the request contract backward compatible and uses an agreed data synchronization strategy. The gateway does not try to maintain business data itself.

## 5. Scenario-based interview answer

“In one migration, we needed to move payment initiation out of a legacy application without changing the mobile and web clients.

The problem was that a full cutover was too risky, and payment requests could not be processed twice. I decided to place an API gateway in front of both implementations and route by capability. Existing endpoints stayed public, but `/api/payments/*` could be directed independently.

We first routed internal test merchants to the new .NET service using a feature flag keyed by merchant ID. We then increased the allowed merchant groups in stages. We used idempotency keys so a retry could not create a second payment, and we compared technical metrics and payment reconciliation results at every stage. The route configuration had a fast rollback switch, but we tested data compatibility before relying on it.

As a result, we migrated payments without a client release or a large outage. Once all traffic was stable on the new service and reconciliation matched, we removed the old payment route and retired that part of the legacy application.”

## 6. Code example

YARP is Microsoft's reverse-proxy library for ASP.NET Core. The following example uses its configuration-based routing APIs. YARP 2.3 supports .NET 8 or later.

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();
app.MapReverseProxy();
app.Run();
```

```json
{
  "ReverseProxy": {
    "Routes": {
      "modern-payments": {
        "ClusterId": "modern-payments",
        "Match": { "Path": "/api/payments/{**remaining}" }
      },
      "legacy-default": {
        "ClusterId": "legacy",
        "Order": 100,
        "Match": { "Path": "/{**remaining}" }
      }
    },
    "Clusters": {
      "modern-payments": {
        "Destinations": {
          "primary": { "Address": "https://payments.internal/" }
        }
      },
      "legacy": {
        "Destinations": {
          "primary": { "Address": "https://legacy.internal/" }
        }
      }
    }
  }
}
```

The specific payments route has higher priority than the catch-all legacy route. This means payment requests go to the new service, while every route not yet migrated stays on the legacy application. In production, destinations should come from environment-specific configuration or service discovery, and route changes should follow the normal reviewed deployment process.

## 7. Common mistakes

- Routing randomly on every request and causing the same user workflow to jump between systems.
- Migrating reads and writes without defining which system owns the data.
- Sending the same write to both systems without idempotency, ordering, and failure handling.
- Using a fallback that retries a failed write against the other backend; this can create duplicate payments.
- Trusting client-supplied routing headers without validating or removing them at the edge.
- Changing routes without health checks, dashboards, alerts, audit history, or a tested rollback plan.
- Keeping temporary routing rules forever and never removing the migrated legacy code.
- Assuming that switching traffic back is safe after the new service has changed data in a format the legacy system cannot handle.

## 8. Follow-up interview questions

### How would you perform a gradual rollout?

Start with internal users, then route stable customer or tenant groups using a feature flag or consistent hash. Increase exposure only when error, latency, and business metrics remain healthy.

### Should the gateway contain business logic?

No. It should make routing and cross-cutting decisions. Business rules belong in the legacy application or modern service; otherwise, the gateway becomes another difficult application to migrate.

### How do you prevent duplicate writes during fallback?

Use an idempotency key and store the processing result against that key. Do not automatically replay an uncertain write on another backend unless the system can prove that the first attempt did not commit.
