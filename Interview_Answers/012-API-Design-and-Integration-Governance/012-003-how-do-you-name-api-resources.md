# 3. How do you name API resources?

**Technology:** API Design and Integration Governance

**Source question:** 3. How do you name API resources?

## 1. What is it?

API resource naming is the way we choose stable, meaningful URLs for business objects exposed by an API. A resource is usually a noun such as a customer, account, payment, or transaction.

For example:

- `/customers` represents a collection of customers.
- `/customers/{customerId}` represents one customer.
- `/accounts/{accountId}/transactions` represents transactions belonging to an account.

The URL names the resource. The HTTP method describes the operation, so use `GET /payments/{id}` instead of `/getPayment`, and `POST /payments` instead of `/createPayment`.

## 2. Why is it important?

Consistent names make an API easier to discover and remember. Once a developer understands one endpoint, they can often predict the others without repeatedly checking the documentation.

Good names also keep the public contract separate from implementation details. A URL should express the business domain, not a database table, service class, or internal workflow. This lets teams change the implementation without breaking clients.

At an architecture level, naming rules prevent every team from inventing a different style. This improves API reviews, documentation, client SDKs, logging, access policies, and long-term governance.

## 3. How does it work?

I normally apply these rules:

1. Use business nouns for resources: `/customers`, `/accounts`, and `/payments`.
2. Use plural names for collections and an identifier for one item: `/payments/{paymentId}`.
3. Use lowercase words and one agreed separator, usually kebab-case: `/payment-methods`.
4. Let HTTP methods express normal operations: `GET` reads, `POST` creates, `PUT` replaces, `PATCH` partially updates, and `DELETE` removes.
5. Nest resources only when the relationship or ownership is important: `/accounts/{accountId}/transactions`. Avoid deeply nested URLs.
6. Keep identifiers opaque and stable. Clients should not need to understand database keys or extract meaning from an ID.
7. Use query parameters for filtering, sorting, and pagination: `/transactions?status=pending&limit=50`.
8. Keep technical details out of names. Avoid URLs such as `/payment-table`, `/payment-service`, or `/getPaymentsAsync`.
9. Represent a real business command explicitly when CRUD does not describe it well. For example, `POST /payments/{id}/refunds` creates a refund resource. If no useful resource exists, a carefully named action such as `POST /payments/{id}:cancel` can be used consistently and documented clearly.

After agreeing on the naming standard, enforce it through API design reviews, OpenAPI linting, reusable route conventions, and contract tests.

## 4. Practical example

Consider a banking API that exposes accounts and their transactions:

- `GET /api/v1/accounts/{accountId}` returns one account.
- `GET /api/v1/accounts/{accountId}/transactions?from=2026-08-01&limit=50` returns a filtered, paginated transaction collection.
- `POST /api/v1/accounts/{accountId}/payment-orders` creates a payment order for that account.
- `GET /api/v1/payment-orders/{paymentOrderId}` checks its current state.
- `POST /api/v1/payment-orders/{paymentOrderId}/cancellations` creates a cancellation request.

The API does not use names such as `/getAccountTransactions` or `/cancelPaymentOrder`. The same nouns remain stable while the method and request body describe what the client wants to do.

## 5. Scenario-based interview answer

“In one payment platform, different teams had created endpoints such as `/makePayment`, `/get-payment-status`, and `/Payment/Cancel`. The inconsistent casing, verbs, and response patterns made integrations harder and created duplicate routes for the same concepts.

My decision was to introduce a resource naming standard based on the business domain. We used lowercase plural nouns, kebab-case for multiword resources, HTTP methods for standard operations, and shallow nesting only where ownership mattered. Payments became `/payments/{paymentId}`, while refunds became `/payments/{paymentId}/refunds` because a refund is a business resource with its own ID and lifecycle.

We documented the rules in our API guidelines, added OpenAPI lint checks to the build, and reviewed exceptions through API governance. We kept existing routes during a deprecation period so consumers could migrate safely.

The result was a predictable contract, fewer naming debates, simpler client SDKs, and easier onboarding. My main principle is that URLs should describe stable business resources, not controller methods or database structure.”

## 6. Code example

This ASP.NET Core minimal API example keeps resource names consistent:

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var accounts = app.MapGroup("/api/v1/accounts");

accounts.MapGet("/{accountId:guid}", (Guid accountId) =>
    TypedResults.Ok(new { Id = accountId, Status = "Active" }));

accounts.MapGet("/{accountId:guid}/transactions", (
    Guid accountId,
    string? status,
    int? limit) =>
{
    var pageSize = Math.Clamp(limit ?? 50, 1, 100);
    return TypedResults.Ok(new
    {
        AccountId = accountId,
        StatusFilter = status,
        Limit = pageSize,
        Items = Array.Empty<object>()
    });
});

accounts.MapPost("/{accountId:guid}/payment-orders", (
    Guid accountId,
    CreatePaymentOrderRequest request) =>
{
    var id = Guid.NewGuid();
    return TypedResults.Created(
        $"/api/v1/payment-orders/{id}",
        new { Id = id, AccountId = accountId, request.Amount, request.Currency });
});

app.Run();

public sealed record CreatePaymentOrderRequest(decimal Amount, string Currency);
```

`accounts`, `transactions`, and `payment-orders` are nouns. The route uses plural lowercase names, kebab-case for a multiword resource, and a nested route where the account relationship matters. Filtering and page size are query parameters rather than extra path segments. The created payment order also has its own canonical URL because it has its own identity and lifecycle.

## 7. Common mistakes

- Using verbs for routine CRUD operations, such as `/getCustomers` or `/deletePayment`.
- Mixing singular and plural resource names without a clear standard.
- Mixing naming styles such as `/paymentMethods`, `/Payment_Methods`, and `/payment-methods`.
- Exposing controller names, database tables, file extensions, or framework details in URLs.
- Creating deeply nested paths such as `/customers/{id}/accounts/{id}/cards/{id}/transactions/{id}`.
- Putting filters into path names, such as `/transactions/status/pending`, instead of using query parameters.
- Using sensitive data such as email addresses, account numbers, or card numbers in URLs, which may appear in logs and browser history.
- Renaming an established resource only for cosmetic consistency and breaking existing consumers.
- Forcing every business command into CRUD when a subordinate resource or clearly governed action would express the domain better.
- Naming the same business concept differently across APIs, such as `client`, `customer`, and `consumer`, without a domain reason.

## 8. Follow-up interview questions

### Should resource names be singular or plural?

Plural names are usually clearer and more consistent because `/payments` is the collection and `/payments/{id}` is one member. The exact choice matters less than applying one standard consistently.

### When should resources be nested?

Nest when the child is naturally scoped to its parent or the relationship is central to the request, such as `/accounts/{id}/transactions`. Keep nesting shallow, and give a child its own top-level URL when it has an independent identity or is commonly accessed directly.

### Are verbs ever acceptable in a REST API URL?

Normal CRUD operations should use nouns plus HTTP methods. For a domain operation that does not map cleanly to CRUD, first look for a resource such as `/refunds` or `/cancellations`. If that would be artificial, a consistent, documented command-style endpoint can be a practical choice.
