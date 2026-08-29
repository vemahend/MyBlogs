# 42. What should be handled at Azure API Management?

**Technology:** API Design and Integration Governance

**Source question:** 42. What should be handled at Azure API Management?

## 1. What is it?

Azure API Management, or APIM, is a managed gateway placed between API clients and backend services. It gives clients a stable API address and applies common rules before and after a request reaches the backend.

APIM should mainly handle **edge and cross-cutting concerns** that are common across APIs, such as:

- Validating OAuth/JWT tokens, client certificates, or subscription keys.
- Enforcing rate limits, quotas, IP restrictions, and request-size limits.
- Routing requests to the correct backend or API version.
- Safely changing headers, URLs, or simple payload formats.
- Adding correlation IDs and collecting gateway-level metrics and logs.
- Caching safe, read-only responses where the data and security model allow it.
- Publishing API documentation and products through the developer portal.

APIM should not normally contain business rules such as payment eligibility, account balance checks, fraud decisions, or database logic. Those rules belong in the backend service.

## 2. Why is it important?

Without a gateway, every service may implement authentication, throttling, logging, version routing, and client onboarding differently. That creates duplicated code and inconsistent security.

APIM provides one controlled entry point. Architects can apply common policies consistently, protect backend services from excessive traffic, hide internal endpoints, and change backend locations without changing every client.

The boundary is important. Moving too much logic into APIM makes policies difficult to test, review, and deploy. It also couples business behavior to the gateway and can turn APIM into a performance bottleneck.

## 3. How does it work?

A normal request passes through these stages:

1. The client calls the APIM gateway endpoint.
2. The **inbound** policy pipeline can validate identity, check limits, remove untrusted headers, add a correlation ID, and choose a backend.
3. APIM forwards the request to the backend service.
4. The **backend** policy section controls behavior around the backend call, such as forwarding or limited retry handling.
5. The **outbound** policy pipeline can remove internal headers, make a small response transformation, or add standard response headers.
6. If policy execution fails, the **on-error** section can return a controlled error and record diagnostic information.

Policies can be applied at global, workspace, product, API, or operation scope, depending on the APIM configuration. The effective policy is built through scope inheritance, normally using the `base` element.

APIM should make an early access decision, but the backend must still enforce business authorization. For example, APIM may validate that a token is genuine and has a required scope; the payment service must still decide whether that customer can access the requested account.

## 4. Practical example

A bank exposes `POST /payments` to its mobile application.

APIM validates the Microsoft Entra ID access token, checks the `payments.write` scope, limits calls per customer, rejects an oversized request, creates or preserves a correlation ID, and routes the call to the payment service. It removes any client-supplied internal identity headers before adding trusted values.

The payment service performs the real business work: it checks account ownership, available balance, payment limits, beneficiary status, idempotency, and fraud rules. APIM does not decide whether the payment should be approved.

The response is not cached because it is customer-specific and the command changes state. APIM records gateway timing and status data, while sensitive payment details and tokens are excluded from logs.

## 5. Scenario-based interview answer

“In one payment platform, different APIs had implemented token validation, throttling, and correlation IDs in different ways. A traffic spike could reach every service, and changing a backend address required client changes.

I decided to use Azure API Management as the public API boundary. We handled JWT validation, subscription and product access, per-client rate limits, request-size checks, version routing, correlation IDs, and gateway telemetry there. We also used managed identity where APIM needed to authenticate to an Azure-hosted backend.

We deliberately kept account ownership, payment validation, idempotency, and fraud rules in the payment service. The service continued to authorize the requested resource even after APIM validated the token. We used small, reusable policies, inherited common policy with `base`, avoided logging secrets, and load-tested the selected APIM tier.

The result was consistent protection and simpler client configuration. Backend services received cleaner, trusted requests, but they stayed responsible for business decisions. That separation also made the gateway policies easier to operate and the services easier to test.”

## 6. Code example

The following APIM inbound policy shows suitable gateway responsibilities. APIM policies use XML expressions rather than C# application code, so a policy example is more useful for this question.

```xml
<policies>
  <inbound>
    <base />

    <validate-jwt header-name="Authorization"
                  failed-validation-httpcode="401"
                  require-expiration-time="true"
                  require-scheme="Bearer">
      <openid-config url="https://login.microsoftonline.com/{tenant-id}/v2.0/.well-known/openid-configuration" />
      <audiences>
        <audience>api://payments-api</audience>
      </audiences>
      <required-claims>
        <claim name="scp" match="any" separator=" ">
          <value>payments.write</value>
        </claim>
      </required-claims>
    </validate-jwt>

    <rate-limit-by-key calls="30"
                       renewal-period="60"
                       counter-key="@(context.Principal?.Identity?.Name
                           ?? context.Subscription?.Key
                           ?? context.Request.IpAddress)" />

    <set-header name="x-correlation-id" exists-action="override">
      <value>@(context.Request.Headers.GetValueOrDefault("x-correlation-id", context.RequestId.ToString()))</value>
    </set-header>

    <set-backend-service backend-id="payments-backend" />
  </inbound>

  <backend>
    <base />
  </backend>

  <outbound>
    <base />
    <set-header name="Server" exists-action="delete" />
  </outbound>

  <on-error>
    <base />
  </on-error>
</policies>
```

`validate-jwt` verifies the token signature and required claims using OpenID Connect metadata. `rate-limit-by-key` protects the backend per caller, the correlation header supports tracing, and `set-backend-service` keeps the physical backend address out of the public API contract.

The exact key must match the security model. An IP address alone is not a reliable customer identity, especially behind shared networks. Also, APIM rate-limit counters are designed for traffic control; they should not be treated as an exact financial or billing counter.

## 7. Common mistakes

- Putting business workflows, database access, fraud rules, or large transformations in APIM policies.
- Assuming token validation at APIM removes the need for resource-level authorization in the backend.
- Trusting client-supplied user, role, or correlation headers without validating, deleting, or replacing them.
- Applying one global rate limit to every operation instead of choosing limits by client, product, API, and operation risk.
- Retrying non-idempotent payment commands at the gateway, which can create duplicate transactions.
- Caching private, customer-specific, or state-changing responses without a safe cache key and invalidation design.
- Logging access tokens, authorization headers, personal data, or payment details.
- Performing large payload transformations that increase latency and gateway CPU usage.
- Forgetting policy inheritance or omitting `base`, causing expected parent policies not to run.
- Treating APIM as the only availability layer and ignoring backend time-outs, health, capacity, zone support, and disaster recovery.

## 8. Follow-up interview questions

### Should authorization be handled in APIM or in the backend?

Both have roles. APIM can validate the token, scope, or broad product access and reject invalid calls early. The backend must enforce resource-level and business authorization, such as whether the caller owns a particular bank account.

### Should APIM retry failed backend requests?

Only in carefully selected cases. A short retry may be reasonable for a proven transient failure on an idempotent operation. Do not blindly retry payment commands; use an idempotency key and let the service own duplicate protection.

### When should response caching be used in APIM?

Use it for safe, read-heavy responses whose cache key includes every relevant variation, such as locale or caller permissions. Avoid it for commands, rapidly changing balances, and private data unless isolation and invalidation are fully designed.
