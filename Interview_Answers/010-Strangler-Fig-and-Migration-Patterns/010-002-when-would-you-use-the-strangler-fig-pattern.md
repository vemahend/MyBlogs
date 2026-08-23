# 2. When would you use the Strangler Fig pattern?

**Technology:** Strangler Fig and Migration Patterns

**Source question:** 2. When would you use the Strangler Fig pattern?

## 1. What is it?

I would use the Strangler Fig pattern when an important legacy application must be replaced, but replacing the whole system in one release would be too risky.

It is most suitable when the application can be divided into business capabilities, such as customer profiles, statements, payments, or notifications. The team moves one capability at a time to a new system while the legacy and new systems run together.

## 2. Why is it important?

Large legacy systems often contain hidden business rules, old integrations, and shared data. A full rewrite can take a long time and creates one large, difficult cutover.

The Strangler Fig pattern is useful because it allows a team to:

- deliver improvements before the entire migration is finished;
- test each migrated capability with real production traffic;
- limit the impact of failures and roll back individual routes;
- keep normal feature delivery moving during modernisation;
- learn about hidden dependencies gradually; and
- retire legacy code in controlled steps.

For a senior architect, the key reason to choose it is risk reduction. It changes one large migration risk into several smaller, measurable changes.

## 3. How does it work?

I would normally use the pattern when these conditions are present:

1. The legacy system still provides business value and cannot simply be switched off.
2. A big-bang replacement has unacceptable cost, time, or operational risk.
3. The system has capabilities that can be separated behind an API, gateway, facade, event, or user-interface boundary.
4. The business accepts a period in which old and new components run together.
5. The team can operate both systems, monitor traffic, and maintain a tested rollback path.

A gateway or facade first sends requests to the legacy application. When a capability is rebuilt, its traffic is redirected to the new component. Data ownership, background jobs, security, reporting, and integrations must move as well; changing only the HTTP route does not complete the migration.

I would not choose this pattern automatically. It may be a poor fit for a small application that can be replaced safely, a system with no useful boundaries, or a platform that will be retired soon. It is also unsuitable if the organisation cannot support two systems during the transition.

## 4. Practical example

A bank has a legacy internet-banking application that handles customer profiles, account views, statements, and payments. The application must remain available, and replacing it in one cutover would put payment processing at risk.

The bank starts with customer statements because they are mostly read-only, have a clear boundary, and do not update account balances. A gateway routes `/api/statements/*` to a new ASP.NET Core service while every other request continues to the legacy application.

The team validates permissions, audit records, generated documents, support tools, and historical data. After production monitoring confirms that the new service is reliable and no consumers use the old statement module, that legacy module is removed. The bank then selects the next suitable capability.

## 5. Scenario-based interview answer

“I would use the Strangler Fig pattern for a large, business-critical legacy system when a full rewrite and single cutover would create too much risk, and when I can identify useful business boundaries.

**Problem:** In one banking modernisation, the legacy application had years of business rules and several external integrations. It also needed regular feature releases, so we could not freeze development for a long rewrite.

**Decision:** We chose an incremental migration. We started with statement retrieval because it had clear routes, mainly read-only data, and lower risk than payment execution.

**Implementation:** We placed a gateway in front of the old and new applications. The gateway sent statement requests to a new ASP.NET Core service and left all other traffic on the legacy application. We added contract tests, tracing, dashboards, and a feature-controlled rollback. We also checked data ownership, scheduled statement generation, audit requirements, and support processes rather than treating it as only a routing change.

**Result:** We delivered value early and proved the migration approach in production without risking the main payment flow. Once all dependencies had moved, we retired the old statement component and repeated the process for the next capability.”

## 6. Code example

An ASP.NET Core gateway can use YARP to send a migrated route to a new service and everything else to the legacy application. YARP supports current ASP.NET Core versions; in a new production system I would use a currently supported .NET release and a compatible YARP package.

```csharp
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
        "ClusterId": "statements-service",
        "Match": { "Path": "/api/statements/{**remaining}" }
      },
      "legacy-fallback": {
        "ClusterId": "legacy-application",
        "Order": 100,
        "Match": { "Path": "/{**remaining}" }
      }
    },
    "Clusters": {
      "statements-service": {
        "Destinations": {
          "primary": { "Address": "https://statements-service/" }
        }
      },
      "legacy-application": {
        "Destinations": {
          "primary": { "Address": "https://legacy-application/" }
        }
      }
    }
  }
}
```

The specific statement route goes to the new service. The lower-priority catch-all route sends capabilities that have not been migrated to the legacy application. In production, I would also add authentication, health checks, timeouts, tracing, and a controlled way to restore the legacy route during rollback.

## 7. Common mistakes

- Choosing the pattern even when a simple replacement would be cheaper and safer.
- Starting with the most critical or tightly coupled capability instead of a clear, lower-risk boundary.
- Splitting by technical layer rather than moving an end-to-end business capability.
- Redirecting API traffic but forgetting batch jobs, reports, database processes, or external integrations.
- Allowing both systems to update the same data without clear ownership and conflict rules.
- Creating permanent dependencies from the new service back to the legacy application's internal model.
- Running two systems without enough monitoring, operational capacity, or a tested rollback plan.
- Continuing to add features to the migrated legacy area instead of removing it.
- Never decommissioning old components, which leaves the organisation with more complexity rather than less.

## 8. Follow-up interview questions

### When would you avoid the Strangler Fig pattern?

I would avoid it when the application is small enough for a safe replacement, has no practical interception boundary, will soon be retired, or when operating old and new systems together would cost more than the migration benefit.

### How would you choose the first capability to migrate?

I would choose a capability with a clear business boundary, limited dependencies, measurable value, and manageable production risk. A read-only function is often a good first step because rollback and data consistency are simpler.

### What must be checked before removing a legacy component?

I would confirm that no API traffic, scheduled job, report, database process, external integration, or support tool still uses it. I would also check audit retention, monitoring, data ownership, and rollback requirements before decommissioning it.
