# 1. What is the Strangler Fig pattern?

**Technology:** Strangler Fig and Migration Patterns

**Source question:** 1. What is the Strangler Fig pattern?

## 1. What is it?

The Strangler Fig pattern is a safe way to replace a legacy system in small steps instead of rebuilding and replacing everything at once.

A routing layer is placed in front of the system. At first, it sends most requests to the legacy application. As new features are built, selected requests are sent to the new application. The old system becomes smaller over time and is removed when nothing depends on it.

The name comes from a strangler fig plant, which grows around an older tree and gradually replaces it.

## 2. Why is it important?

A large rewrite is risky because it may take years before users receive value. During that time, business rules can change, hidden legacy behaviour can be missed, and the old system still needs maintenance.

The Strangler Fig pattern reduces that risk:

- Teams migrate one business capability at a time.
- Each change can be released, monitored, and rolled back separately.
- The business receives value before the full migration is complete.
- The legacy and modern systems can run together during the transition.
- Real production feedback guides the next migration step.

Architects need this pattern when a system is too important or too large for a single cutover.

## 3. How does it work?

1. Put a gateway, reverse proxy, or routing layer in front of the legacy application.
2. Identify a capability with a clear boundary, such as customer statements or payment limits.
3. Build that capability in the new system and migrate any data it owns.
4. Change the routing rule so requests for that capability go to the new system.
5. Compare results, monitor errors and latency, and keep a rollback route.
6. Repeat for other capabilities.
7. Remove the legacy code and infrastructure only after traffic, data, integrations, and operational jobs have all moved.

Routing is only one part of the migration. Data ownership, background jobs, events, security, and reporting must also be separated carefully. Temporary adapters or an anti-corruption layer can prevent legacy data models from leaking into the new design.

## 4. Practical example

Consider a bank with a large legacy application that handles accounts, payments, statements, and notifications.

The bank first moves statement downloads because they are read-only and have a clear boundary. An API gateway continues to send payment and account requests to the legacy application, but sends `/api/statements/*` to a new ASP.NET Core service.

The new service initially reads statement data from a replicated database. Later, it owns its own data store and receives account events. After the bank confirms that statement traffic, scheduled generation, auditing, and support tools all use the new service, it removes the statement module from the legacy application. The same process is then repeated for another capability.

## 5. Scenario-based interview answer

“In one migration, we had a business-critical banking application that could not tolerate a big-bang rewrite.

**Problem:** The application had tightly coupled modules and several hidden integrations, so replacing it in one release would have created too much operational risk.

**Decision:** We used the Strangler Fig pattern and migrated by business capability. We selected statement retrieval first because it was read-heavy, had a clear API boundary, and did not change account balances.

**Implementation:** We placed a gateway in front of both applications. Statement routes went to a new ASP.NET Core service, while all other routes stayed on the legacy system. We added contract tests, correlation IDs, dashboards, and a feature-controlled rollback route. We also defined which system owned each piece of data and used events to keep the new read model current.

**Result:** We released useful functionality early, measured production behaviour, and migrated later capabilities with less risk. We retired the legacy statement module only after confirming that no API, batch job, report, or support process still depended on it.”

## 6. Code example

YARP (Yet Another Reverse Proxy) can provide the routing layer in an ASP.NET Core application. This style works with modern supported ASP.NET Core releases, including .NET 8 and later.

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
      "new-statements": {
        "ClusterId": "new-service",
        "Match": { "Path": "/api/statements/{**catch-all}" }
      },
      "legacy-fallback": {
        "ClusterId": "legacy-app",
        "Order": 100,
        "Match": { "Path": "/{**catch-all}" }
      }
    },
    "Clusters": {
      "new-service": {
        "Destinations": {
          "primary": { "Address": "https://statements-service/" }
        }
      },
      "legacy-app": {
        "Destinations": {
          "primary": { "Address": "https://legacy-app/" }
        }
      }
    }
  }
}
```

The specific statement route has the normal priority. The catch-all route has a higher `Order` value, which gives it lower priority, so it handles everything that has not yet been migrated. During a rollback, the statement route can be disabled or changed to target the legacy cluster. In production, the proxy also needs authentication rules, timeouts, health checks, tracing, and controlled configuration changes.

## 7. Common mistakes

- Treating the pattern as URL routing only and ignoring data, batch jobs, reports, and external integrations.
- Migrating technical layers, such as the whole database layer, instead of a complete business capability.
- Allowing both systems to update the same data without a clear owner or conflict strategy.
- Creating long-term synchronous calls between new services and the legacy application, which keeps them tightly coupled.
- Changing response contracts or security behaviour without consumer contract tests.
- Sending traffic to the new service without monitoring, correlation IDs, or a tested rollback path.
- Leaving migrated code in the legacy system indefinitely, so the expected simplification never happens.
- Choosing a first capability that is highly coupled or financially critical when a safer boundary is available.

## 8. Follow-up interview questions

### Is the Strangler Fig pattern the same as a big-bang rewrite?

No. A big-bang rewrite replaces the whole system in one main cutover. The Strangler Fig pattern replaces small capabilities over multiple controlled releases.

### How do you choose the first capability to migrate?

Choose one with a clear business boundary, manageable data dependencies, useful business value, and relatively low operational risk. It should help the team learn without endangering a critical transaction flow.

### How do you know when the legacy component can be removed?

Confirm that it receives no production traffic and that no scheduled job, database process, report, integration, or support tool depends on it. Also verify data retention, audit, rollback, and operational ownership before decommissioning it.
