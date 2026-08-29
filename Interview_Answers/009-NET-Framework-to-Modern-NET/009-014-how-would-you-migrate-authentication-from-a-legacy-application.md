# 14. How would you migrate authentication from a legacy application?

**Technology:** .NET Framework to Modern .NET

**Source question:** 14. How would you migrate authentication from a legacy application?

## 1. What is it?

Migrating authentication means moving sign-in, user identity, sessions, roles, and access rules from a legacy application to a secure authentication design supported by modern .NET.

It should normally be a gradual migration, not a forced password reset or a one-day replacement. The preferred design is to move authentication to a trusted identity provider using OpenID Connect and OAuth 2.0. Both the legacy and modern applications can then trust the same provider while features are migrated.

Authentication proves who the user is. Authorization decides what that user may do. Both must be migrated and tested, but they are separate concerns.

## 2. Why is it important?

Authentication protects the whole application. A weak migration can cause account takeover, expose sessions, lock out customers, or give users the wrong permissions.

A well-planned migration provides:

- A smooth user experience, ideally with single sign-on and no unnecessary password reset.
- Modern security features such as multi-factor authentication, conditional access, short-lived tokens, and secure cookie handling.
- One identity source for the legacy application, new application, APIs, and future services.
- A controlled rollback path while the old and new systems run together.
- Removal of custom password and session code that is expensive and risky to maintain.

## 3. How does it work?

A practical migration usually follows this flow:

1. **Discover the current design.** Document user stores, password formats, login pages, cookies, session timeout, roles, claims, service accounts, reset flows, MFA, and every application that trusts the old identity.
2. **Choose the target identity design.** Prefer an OpenID Connect provider such as Microsoft Entra ID, an organizational identity platform, or another standards-based provider. Use OAuth 2.0 access tokens for APIs.
3. **Map identities and permissions.** Give every user a stable identifier. Map legacy roles to target roles or claims. Do not use an email address as the permanent user key because it can change.
4. **Move users safely.** Depending on the identity platform, import compatible password hashes, use just-in-time migration after a successful legacy login, or require a controlled password reset. Plain-text passwords must never be copied or logged.
5. **Run both applications together.** Configure the legacy and modern applications to redirect to the same identity provider. This gives users single sign-on while a strangler migration moves routes or features gradually.
6. **Configure modern .NET.** Validate the token issuer, audience, signature, lifetime, and required claims. Use secure, `HttpOnly` cookies for the web session and authorization policies for protected features.
7. **Test and observe.** Test login, logout, timeout, password reset, MFA, role changes, disabled users, replay attempts, clock differences, and rollback. Audit failures without logging passwords, cookies, or tokens.
8. **Retire the legacy path.** After usage and error metrics are stable, stop new legacy logins, revoke old sessions and keys, remove the old user store, and retain only required audit data.

Sharing an authentication cookie can be a short-term bridge in some ASP.NET applications, but it tightly couples both applications to cookie names, domains, encryption keys, and compatible middleware. A shared identity provider is usually a safer long-term boundary.

## 4. Practical example

A bank has an ASP.NET MVC 5 customer portal on .NET Framework using Forms Authentication and a SQL membership database. New account-management screens are being built in ASP.NET Core on modern .NET.

The bank introduces a standards-based identity provider. User records are linked by an immutable customer identity ID, and legacy groups are mapped to claims such as `accounts.read` and `payments.approve`. Both portals use OpenID Connect, so a customer who signs in to the old portal can open a migrated page without signing in again.

The new portal keeps only a short-lived encrypted session cookie. Its APIs accept access tokens issued for the API's audience. High-value payments require a stronger authentication step. During rollout, authentication success rate, lockouts, claim mismatches, and token validation failures are monitored. Once all routes are migrated, the old login endpoint and signing keys are retired.

## 5. Scenario-based interview answer

“In one migration, the legacy application stored users and roles locally, and the business could not accept a big-bang cutover or force every customer to reset a password.

**Problem:** We needed the .NET Framework application and the new ASP.NET Core application to work side by side without creating two identities for each customer.

**Decision:** I chose a strangler approach and made a central OpenID Connect identity provider the trust boundary. I avoided making the new application validate old Forms Authentication tickets because that would carry legacy coupling and security risks into the new system.

**Implementation:** We first inventoried login, reset, lockout, MFA, roles, and service-account flows. We mapped each account to an immutable user ID and converted legacy permissions into reviewed claims and policies. The legacy and new web applications then used the same identity provider for sign-in. We migrated users in controlled batches, used short-lived sessions, validated issuer and audience on APIs, and ran security and rollback tests. We also monitored sign-in failures and authorization denials by migration cohort, without recording credentials or tokens.

**Result:** Users received single sign-on during the transition, features moved independently, and we could roll back application routes without rolling back identity data. After stable operation, we revoked old sessions and keys and removed the legacy login store.”

## 6. Code example

The following ASP.NET Core configuration is suitable for a modern .NET web application using an OpenID Connect provider. The same hosting style is supported in .NET 8 and later, including current supported releases.

```csharp
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
    })
    .AddCookie(options =>
    {
        options.Cookie.Name = "__Host-ModernPortal";
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.SlidingExpiration = false;
        options.ExpireTimeSpan = TimeSpan.FromMinutes(30);
    })
    .AddOpenIdConnect(options =>
    {
        options.Authority = builder.Configuration["Authentication:Authority"]!;
        options.ClientId = builder.Configuration["Authentication:ClientId"]!;
        options.ClientSecret = builder.Configuration["Authentication:ClientSecret"]!;
        options.ResponseType = "code";
        options.UsePkce = true;
        options.SaveTokens = false;
        options.MapInboundClaims = false;
        options.Scope.Add("profile");
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("ApprovePayments", policy =>
        policy.RequireClaim("permission", "payments.approve"));
});

var app = builder.Build();

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/payments/approve", () => "Payment approval page")
   .RequireAuthorization("ApprovePayments");

app.Run();
```

The cookie stores the local web session, while OpenID Connect performs the external sign-in. Authorization uses a named policy instead of scattered role checks. Secrets should come from a secure secret store, not from source control. The identity provider registration must use exact HTTPS redirect URIs, and production API token validation must also enforce the expected issuer and audience.

## 7. Common mistakes

- Performing a big-bang cutover without a tested rollback plan.
- Copying passwords, using reversible encryption, or logging passwords and tokens.
- Treating authentication and authorization as the same migration task.
- Using email as the permanent user identifier.
- Mapping every old role directly without checking whether it still grants the correct access.
- Accepting tokens without validating signature, issuer, audience, and expiry.
- Putting access tokens in browser local storage when a secure server-managed session is appropriate.
- Sharing cookies as the permanent architecture without planning key rotation, domain scope, compatibility, logout, and revocation.
- Forgetting non-browser flows such as service accounts, scheduled jobs, mobile clients, password reset, and user deactivation.
- Leaving old login endpoints, signing keys, or active sessions available after cutover.
- Logging sensitive authentication data instead of safe identifiers and failure categories.

## 8. Follow-up interview questions

### 1. Would you migrate password hashes or force a password reset?

It depends on whether the target identity provider securely supports the existing hash format. If it does, a controlled import may work. Otherwise, I would use just-in-time migration after successful legacy verification or a secure reset campaign. I would never weaken the target password policy just to preserve an obsolete format.

### 2. When would you share an authentication cookie?

Only as a temporary bridge when both applications can use compatible cookie middleware, the same cookie settings, and protected shared keys. I would prefer federation through OpenID Connect because it reduces coupling and works better across different technologies and domains.

### 3. How would you avoid downtime during the migration?

I would run old and new authentication paths in a controlled coexistence period, route small user cohorts first, keep identity mapping idempotent, monitor sign-in and authorization metrics, and maintain a tested route-level rollback. Old credentials and keys would be removed only after the new flow is proven stable.
