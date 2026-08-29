# 31. How do you secure an API?

**Technology:** API Design and Integration Governance

**Source question:** 31. How do you secure an API?

## 1. What is it?

Securing an API means protecting its data and operations from unauthorized access, misuse, and attack.

It is not one feature or one middleware component. It is a set of controls across the full request flow, including:

- encrypted communication with HTTPS;
- authentication to establish who the caller is;
- authorization to decide what that caller may do;
- input validation and safe database access;
- protection against abuse through rate limits and request-size limits;
- secure handling of secrets and sensitive data;
- logging, monitoring, patching, and incident response.

Authentication answers **“Who are you?”** Authorization answers **“Are you allowed to perform this action on this resource?”** A valid access token proves identity, but it does not automatically grant access to every endpoint or every record.

## 2. Why is it important?

APIs often expose payments, customer details, account operations, and internal business functions. If an API is weakly secured, an attacker may steal data, change another customer's records, replay a payment, overload the service, or use a compromised account to reach sensitive operations.

Strong API security helps a real system to:

- protect confidentiality, integrity, and availability;
- enforce user, role, scope, tenant, and resource ownership rules;
- reduce common risks such as injection and broken object-level authorization;
- meet audit and regulatory requirements;
- limit damage when a credential is leaked;
- detect suspicious activity quickly.

For architects, security must be part of the API contract and system design. Adding authentication at the end does not fix missing authorization checks, leaked secrets, excessive data exposure, or unsafe business workflows.

## 3. How does it work?

A typical secured request flows like this:

1. The client connects over HTTPS. Internal service calls should also use encrypted transport; high-trust environments may add mutual TLS.
2. The client obtains a short-lived access token from a trusted identity provider, normally using OAuth 2.0 and OpenID Connect where user identity is needed.
3. ASP.NET Core authentication middleware validates the token's signature, issuer, audience, lifetime, and expected token type. The API should not merely decode and trust the token.
4. Authorization policies check required scopes, roles, claims, or business permissions.
5. The application performs resource-level authorization. For example, it verifies that the caller can access the requested account, not only that the caller has a general `payments.read` scope.
6. The API validates input, applies request limits, and uses parameterized queries or EF Core expressions. It returns only the fields the caller needs.
7. Sensitive operations use extra controls where needed, such as idempotency keys, transaction limits, step-up authentication, anti-replay rules, or approval workflows.
8. The API records security-relevant audit events without logging tokens, passwords, card details, or unnecessary personal data. Monitoring detects repeated failures and unusual usage.

The edge gateway can handle TLS, coarse rate limiting, and token checks, but each API must still enforce its own authorization. Network location and possession of a valid token are not sufficient trust signals.

For browser clients using cookies, protect state-changing requests against CSRF and configure cookies with `Secure`, `HttpOnly`, and an appropriate `SameSite` value. For bearer tokens sent in the `Authorization` header, CSRF is normally not the main risk; token theft and unsafe storage are more important. CORS is a browser access rule, not an authentication or authorization mechanism.

## 4. Practical example

Consider this payment endpoint:

```http
POST /api/accounts/ACC-204/payments
Authorization: Bearer <access-token>
Idempotency-Key: 6c90c3f5-...
Content-Type: application/json
```

The API first validates the access token and requires the `payments.write` scope. It then loads account `ACC-204` within the tenant from the authenticated identity and checks that the user has permission to make payments from that specific account.

The request model validates the payee, currency, amount, and allowed limits. The service uses an idempotency key to stop a retry from creating a second payment. A high-value payment may require step-up authentication or a second approver. The database query is parameterized, the response does not expose internal or sensitive fields, and the audit log records who initiated the payment and its outcome without recording the bearer token or full bank details.

Rate limiting slows automated abuse, while alerts highlight repeated authorization failures or unusual payment activity. These controls work together; none is a complete solution on its own.

## 5. Scenario-based interview answer

**Problem:** “I worked on a multi-tenant payment API where endpoints required a valid JWT, but some handlers accepted an account ID from the URL and queried it without tenant or ownership checks. That meant an authenticated caller could potentially access another customer's account by changing the ID.”

**Decision:** “I treated security as layered controls. We kept standards-based OAuth access tokens, introduced policy-based authorization for scopes, and made resource-level authorization mandatory in the application. We also reviewed input handling, secrets, logging, abuse protection, and sensitive payment flows.”

**Implementation:** “ASP.NET Core validated the token issuer, audience, signature, and lifetime. Endpoint policies required the correct scope. Repository queries always included the tenant from the authenticated context, and an authorization handler checked access to the requested account. We used HTTPS, short-lived tokens, managed secret storage, typed validation, EF Core parameterized queries, response DTOs, idempotency keys, request-size limits, and rate limiting. High-value payments required an additional approval. Security events went to centralized monitoring, but tokens and sensitive payment data were redacted.”

**Result:** “The API enforced both action-level and record-level access, so a valid token alone could not cross tenant boundaries. Automated tests covered missing, invalid, expired, wrong-audience, wrong-scope, and cross-tenant requests. The controls also improved auditability and reduced the effect of credential theft and automated abuse.”

## 6. Code example

This example uses the built-in authentication and authorization APIs available in supported ASP.NET Core versions. The exact hosting package versions should match the application's target .NET version.

```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Identity:Authority"];
        options.Audience = "payments-api";
        options.MapInboundClaims = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("PaymentsWrite", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireClaim("scope", "payments.write");
    });

    // Secure endpoints by default. Explicitly mark public endpoints with AllowAnonymous.
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

builder.Services.AddScoped<IAuthorizationHandler, AccountAccessHandler>();
builder.Services.AddScoped<IPaymentService, PaymentService>();

var app = builder.Build();

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapPost("/api/accounts/{accountId}/payments", async (
    string accountId,
    CreatePaymentRequest request,
    ClaimsPrincipal user,
    IAuthorizationService authorization,
    IPaymentService payments,
    CancellationToken cancellationToken) =>
{
    var access = await authorization.AuthorizeAsync(
        user,
        accountId,
        new AccountAccessRequirement("CreatePayment"));

    if (!access.Succeeded)
        return Results.Forbid();

    var payment = await payments.CreateAsync(
        accountId, request, cancellationToken);

    return Results.Created($"/api/payments/{payment.Id}", payment);
})
.RequireAuthorization("PaymentsWrite");

app.Run();

public sealed record CreatePaymentRequest(
    string PayeeId,
    decimal Amount,
    string Currency);

public sealed record AccountAccessRequirement(string Operation)
    : IAuthorizationRequirement;

public sealed class AccountAccessHandler
    : AuthorizationHandler<AccountAccessRequirement, string>
{
    private readonly IAccountAccessService _accessService;

    public AccountAccessHandler(IAccountAccessService accessService) =>
        _accessService = accessService;

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        AccountAccessRequirement requirement,
        string accountId)
    {
        var subject = context.User.FindFirst("sub")?.Value;

        if (subject is not null && await _accessService.CanAccessAsync(
                subject, accountId, requirement.Operation))
        {
            context.Succeed(requirement);
        }
    }
}
```

`AddJwtBearer` validates the access token rather than simply reading its claims. The `PaymentsWrite` policy checks the API scope, while `AccountAccessHandler` performs resource-level authorization for the account in the route. The fallback policy makes authenticated access the default, which reduces the chance of accidentally publishing a new endpoint.

In production, configuration such as the authority should come from trusted configuration, while client secrets, certificates, and signing material should be held in a managed secret store rather than source code. The payment request also needs model validation, idempotency, rate limiting, and business controls; those are intentionally omitted to keep the example focused.

## 7. Common mistakes

- Using authentication without checking authorization for the requested resource.
- Trusting an account ID, tenant ID, role, price, or user ID supplied by the client.
- Decoding a JWT without validating its signature, issuer, audience, lifetime, and token type.
- Using long-lived bearer tokens or placing tokens in URLs, logs, or insecure browser storage.
- Hard-coding secrets or storing them in source control and application settings files.
- Believing an API gateway, private network, API key, or CORS policy fully secures the API.
- Building SQL with user input instead of using typed values and parameterized queries.
- Returning entity models with sensitive fields or excessive customer data.
- Revealing stack traces and internal details in production error responses.
- Missing request-size, upload, pagination, timeout, and rate limits.
- Applying one global rate limit that blocks legitimate customers or fails to protect expensive operations.
- Logging passwords, access tokens, authorization headers, card data, or unnecessary personal information.
- Forgetting CSRF protection when browser authentication relies on automatically sent cookies.
- Returning `404`, `401`, and `403` inconsistently in a way that leaks whether another user's resource exists.
- Failing to patch dependencies, test negative authorization paths, rotate credentials, and monitor security events.

## 8. Follow-up interview questions

### What is the difference between `401 Unauthorized` and `403 Forbidden`?

`401` means valid authentication credentials are missing or unacceptable. `403` means the caller is authenticated but is not allowed to perform the action. For sensitive resources, an API may deliberately return `404` to avoid revealing that another user's record exists.

### Is validating a JWT enough to secure an endpoint?

No. JWT validation establishes that a trusted issuer created a currently valid token for this API. The endpoint must still check scopes or permissions and enforce tenant, ownership, and business rules for the requested resource.

### When would you use an API key instead of OAuth 2.0?

An API key can identify a calling application for simple, lower-risk server-to-server access, quotas, or metering. It usually does not represent a user and has weaker delegation and expiry features. For user access or high-risk operations, short-lived OAuth 2.0 access tokens with clear scopes are generally more suitable.
