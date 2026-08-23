# 17. How do you deprecate an API?

**Technology:** API Design and Integration Governance

**Source question:** 17. How do you deprecate an API?

## 1. What is it?

API deprecation is a planned warning that an API version, endpoint, or field should no longer be used and will be removed in the future.

Deprecation is not the same as immediate removal. The old API normally continues to work for a published period so consumers can move safely to the replacement. Retirement, sometimes called sunset, is the later point when the old API is switched off.

## 2. Why is it important?

APIs often have consumers that release on different schedules, such as mobile apps, business partners, and internal services. Removing an API without notice can break payments, customer logins, or background processing.

A controlled deprecation process gives consumers a clear replacement, deadline, and migration path. It also lets the API owner eventually remove insecure or expensive legacy code instead of supporting every contract forever.

## 3. How does it work?

A practical deprecation flow is:

1. Identify the replacement and document all breaking differences.
2. Find the consumers using logs, API keys, client IDs, and distributed tracing.
3. Publish the deprecation date, retirement date, support policy, migration guide, and rollback or exception process.
4. Notify consumers through direct channels such as email, a developer portal, release notes, and service-owner tickets.
5. Keep the old API operational during the agreed migration window. Usually it receives critical security and production fixes, but no new features.
6. Add machine-readable response metadata where useful. The standard `Deprecation` header is defined by RFC 9745, and the `Sunset` header by RFC 8594. A `Link` header can point to the migration guide.
7. Provide a sandbox or test environment and help consumers migrate.
8. Monitor usage by consumer, send reminders, and handle approved exceptions.
9. Before retirement, confirm remaining traffic and operational readiness. Retire in a controlled way, monitor failures, and keep a short rollback plan if the risk justifies it.

The exact notice period depends on contracts, regulation, security risk, consumer release cycles, and migration effort.

## 4. Practical example

A bank has `POST /api/v1/payments`, but `v1` does not require an idempotency key. The new `v2` contract requires one, which prevents a retry from creating a duplicate payment.

The bank publishes `v2`, marks `v1` as deprecated, and gives merchants 12 months to migrate. Responses from `v1` include deprecation and sunset information plus a link to the guide. Dashboards show `v1` traffic by merchant ID, and the integration team contacts every remaining merchant. After traffic reaches zero and the retirement review passes, the bank disables `v1` and monitors rejected requests.

## 5. Scenario-based interview answer

“In one payment platform, we needed to replace an old endpoint because its retry behaviour could create duplicate payment attempts.

The problem was that external merchants could not all migrate on our release schedule. I decided to introduce `v2` with mandatory idempotency keys and deprecate `v1` through a published lifecycle instead of removing it immediately.

We announced a firm retirement date, documented the contract changes, provided a sandbox, and added deprecation, sunset, and migration-link headers to `v1` responses. More importantly, we measured usage by client ID and assigned an owner to contact every remaining merchant. We kept critical support for `v1`, but added new features only to `v2`. Before shutdown, we completed a readiness review and prepared a time-limited rollback option.

As a result, merchants migrated without payment outages, duplicate-payment risk was reduced, and we removed the legacy implementation. My main principle is that deprecation is a consumer migration programme, not just a documentation label.”

## 6. Code example

This ASP.NET Core middleware adds standard lifecycle information to responses from a deprecated `v1` route:

```csharp
using System.Globalization;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var deprecatedOn = new DateTimeOffset(2026, 9, 1, 0, 0, 0, TimeSpan.Zero);
var sunsetOn = new DateTimeOffset(2027, 9, 1, 0, 0, 0, TimeSpan.Zero);

app.Use(async (context, next) =>
{
    await next();

    if (context.Request.Path.StartsWithSegments("/api/v1"))
    {
        // RFC 9745 uses an HTTP Structured Field date: @<Unix timestamp>.
        context.Response.Headers["Deprecation"] =
            $"@{deprecatedOn.ToUnixTimeSeconds()}";

        // RFC 8594 uses an HTTP-date for Sunset.
        context.Response.Headers["Sunset"] =
            sunsetOn.ToString("R", CultureInfo.InvariantCulture);

        context.Response.Headers.Append(
            "Link",
            "<https://developer.example.com/migrations/payments-v2>; rel=\"deprecation\"; type=\"text/html\"");
    }
});

app.MapPost("/api/v1/payments", () => Results.Ok());
app.MapPost("/api/v2/payments", () => Results.Ok());

app.Run();
```

`Deprecation` tells a client when the resource became deprecated. `Sunset` gives the planned shutdown time, and `Link` points to the migration instructions. These headers help automated tools and developers, but they do not replace direct communication, usage tracking, and a documented support policy.

In a real system, lifecycle dates should come from configuration or version metadata so all instances publish the same values.

## 7. Common mistakes

- Treating deprecation as immediate removal.
- Announcing that an API is deprecated without giving a firm retirement date.
- Providing no supported replacement or clear migration guide.
- Relying only on documentation or response headers and not contacting known consumers.
- Tracking total traffic but not identifying which client is still using the old API.
- Continuing to add features to the deprecated version.
- Ignoring contractual, regulatory, mobile-release, or partner lead times.
- Retiring the API without production monitoring, an exception process, or a risk-based rollback plan.
- Returning successful-looking responses that silently change old behaviour.

## 8. Follow-up interview questions

### What is the difference between deprecation and sunset?

Deprecation warns consumers to stop using an API. Sunset is the planned time when the API becomes unavailable.

### How do you know when it is safe to retire the API?

Measure calls by version and consumer identity, contact remaining users, resolve approved exceptions, run a readiness review, and monitor failed calls after shutdown.

### What if a consumer cannot migrate before the deadline?

Assess the business and security risk. If justified, approve a documented, time-limited exception with an owner and new deadline. Do not silently extend support for everyone.
