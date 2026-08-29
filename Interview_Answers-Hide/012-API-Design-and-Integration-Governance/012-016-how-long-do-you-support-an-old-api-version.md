# 16. How long do you support an old API version?

**Technology:** API Design and Integration Governance

**Source question:** 16. How long do you support an old API version?

## 1. What is it?

Supporting an old API version means keeping it available after a newer version has been released. Existing clients can continue using the old contract while they move to the new one.

There is no universal support period. I choose it using a published deprecation policy. For many business APIs, 6–12 months is a practical starting point. Public APIs, regulated systems, mobile applications, or partner integrations may need 18–24 months or longer. An internal API with a few controlled consumers may need only 30–90 days.

The important point is not the exact number. Consumers need a clear deprecation date, a migration path, and enough time to make the change safely.

## 2. Why is it important?

Removing an old version too quickly can break mobile apps, partner systems, payment flows, or services that deploy on a different schedule. Supporting every version forever is also costly because each version needs security fixes, monitoring, testing, documentation, and operational support.

A defined support window balances these concerns. It gives consumers stability while allowing the API owner to remove old code and reduce risk.

## 3. How does it work?

A practical version lifecycle is:

1. Release the new API version and keep the old version operational.
2. Mark the old version as deprecated in the API documentation and version metadata.
3. Publish the retirement date, migration guide, contract differences, and test environment.
4. Notify registered consumers through agreed channels, not only through documentation.
5. Measure traffic by version and identify every remaining consumer.
6. Contact those consumers and track their migration before the deadline.
7. Keep fixing critical security and production defects during the support window, while normally avoiding new features in the old version.
8. After usage reaches zero, or approved exceptions are resolved, retire the version and monitor for unexpected calls.

The retirement date should be based on consumer impact, contractual obligations, security risk, and deployment constraints. A version with an unfixable security problem may require a shorter emergency timeline, with compensating controls and active consumer support.

## 4. Practical example

A bank changes its payment API from `v1`, which accepts a simple account number, to `v2`, which requires an idempotency key and stronger beneficiary validation.

The bank gives external merchants 12 months to migrate. During that time, `v1` receives critical fixes but no new features. The developer portal shows its retirement date, merchants receive direct notices, and dashboards track `v1` calls by client ID. The bank offers a sandbox and a migration guide. If a merchant is still using `v1` near the deadline, the integration team contacts that merchant instead of discovering the dependency during shutdown.

## 5. Scenario-based interview answer

“I would not choose one support period for every API. I would first look at who consumes it, how quickly they can deploy, and whether contracts or regulations define a notice period.

In one payment platform, we introduced `v2` with stronger validation while several external merchants still depended on `v1`. We decided on a 12-month support window because the consumers had independent release cycles. We published the retirement date at the time `v2` went live, provided a migration guide and sandbox, and stopped adding features to `v1`. We also measured calls by API version and client ID, then contacted remaining consumers at regular milestones.

Before retirement, we confirmed that traffic had moved to `v2`, ran a final readiness review, and monitored rejected `v1` calls after shutdown. This allowed us to remove the legacy code without causing payment failures. For a small internal API, I would normally use a shorter window because I can coordinate all consumers directly.”

## 6. Code example

With ASP.NET Core and the current `Asp.Versioning.HttpApi` package, an old version can be marked as deprecated while both versions remain available:

```csharp
using Asp.Versioning;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(2, 0);
    options.AssumeDefaultVersionWhenUnspecified = false;
    options.ReportApiVersions = true;
});

var app = builder.Build();

var versions = app.NewApiVersionSet()
    .HasDeprecatedApiVersion(new ApiVersion(1, 0))
    .HasApiVersion(new ApiVersion(2, 0))
    .ReportApiVersions()
    .Build();

app.MapGet("/api/v{version:apiVersion}/payments/{id}",
        (string id, ApiVersion version) =>
            Results.Ok(new { id, apiVersion = version.ToString() }))
    .WithApiVersionSet(versions)
    .MapToApiVersion(1.0)
    .MapToApiVersion(2.0);

app.Run();
```

`HasDeprecatedApiVersion` tells consumers that `v1` is still callable but is being retired. `ReportApiVersions` adds supported and deprecated version information to responses. This metadata is useful, but it does not replace direct notification or a published retirement date. In production, separate handlers are usually needed when the contracts or behavior differ between versions.

## 7. Common mistakes

- Selecting an arbitrary period without checking consumer release cycles or contracts.
- Announcing deprecation without publishing a firm retirement date.
- Relying only on an email or documentation banner instead of tracking actual usage.
- Removing the old version while active clients still depend on it.
- Adding new features to the deprecated version and making migration less attractive.
- Keeping every version forever, which increases security, testing, and maintenance costs.
- Treating API versioning metadata as a complete communication plan.
- Shutting down without a rollback plan, monitoring, or an exception process.

## 8. Follow-up interview questions

### How do you decide the support period?

Consider consumer type, deployment frequency, contracts, regulation, migration complexity, usage data, and security risk. Use a standard policy, then allow documented exceptions where justified.

### What support does a deprecated version receive?

Normally it receives critical security and production fixes, but no new features. The exact commitment should be written in the support policy.

### How do you know an old version is safe to retire?

Monitor calls by version and consumer identity, contact remaining users, confirm approved exceptions, complete a readiness review, and monitor failed calls after retirement.
