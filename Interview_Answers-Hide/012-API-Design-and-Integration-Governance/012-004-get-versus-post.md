# 4. GET versus POST?

**Technology:** API Design and Integration Governance

**Source question:** 4. GET versus POST?

## 1. What is it?

GET and POST are HTTP methods that tell an API what kind of operation a client wants to perform.

- **GET** retrieves a resource or data. It should not change business data on the server.
- **POST** sends data to the server, usually to create a resource or start an operation.

For example, `GET /accounts/123` reads account 123, while `POST /payments` creates a payment.

GET is defined as a **safe** and **idempotent** method. Safe means it is intended only to read data. Idempotent means repeating the same request should have the same intended effect on server state. POST is not idempotent by definition, although an API can make a POST operation safely repeatable by using an idempotency key.

## 2. Why is it important?

Choosing the correct method makes an API predictable and prevents serious production problems.

- Browsers, proxies, and CDNs may cache GET responses.
- Monitoring tools and crawlers may repeat GET requests because GET is expected to be safe.
- POST request data can be placed in the body, which is suitable for structured commands and larger inputs.
- Correct methods make API documentation, security rules, retries, and client integrations easier to understand.

If a GET endpoint performs a payment or deletes data, an automatic retry or link preview could accidentally repeat that action.

## 3. How does it work?

For a GET request:

1. The client places the resource identifier in the URL and optional filters in the query string.
2. The server validates the request and reads the required data.
3. It returns the representation, normally with `200 OK`. It can return `304 Not Modified` when conditional caching is used, or `404 Not Found` when the resource does not exist.
4. A cache may reuse the response when the response headers allow it.

Although HTTP technically permits content in a GET request body, its meaning is not generally defined and many clients, servers, and intermediaries do not support it consistently. Query parameters should be used instead.

For a POST request:

1. The client sends input, commonly as JSON in the request body.
2. The server authenticates and authorizes the caller, validates the input, and performs the command.
3. For resource creation, the server commonly returns `201 Created` with a `Location` header. For an accepted background operation, it can return `202 Accepted`.
4. Repeating the request may repeat the operation unless the API implements duplicate protection.

## 4. Practical example

Consider a payment API:

- `GET /payments/pay_789` returns the current payment status. Calling it many times does not create another payment.
- `POST /payments` with the amount, currency, and source account creates a payment.

The client also sends an `Idempotency-Key` header with the POST request. If a network timeout occurs and the client retries with the same key, the API returns the original result instead of charging the customer twice.

Sensitive values should not be placed in a GET URL because URLs can appear in browser history, proxy logs, analytics, and monitoring systems. HTTPS is required for both methods; POST is not automatically more secure than GET.

## 5. Scenario-based interview answer

“In a banking project, I found an endpoint using GET to transfer money. That was dangerous because infrastructure and clients are allowed to treat GET as a safe operation and may retry, prefetch, or cache it.

I changed the contract so GET was used only to read transfer details, and POST was used to create a transfer. The POST body contained the transfer command, and the client supplied an idempotency key. On the server, we stored that key with the completed response under a uniqueness constraint, so a retry returned the same result rather than creating another transfer. We returned `201 Created` with the transfer URI for an immediately created transfer.

This made the API follow HTTP semantics, improved auditability, and prevented duplicate transfers during network retries.”

## 6. Code example

This ASP.NET Core minimal API example uses APIs available in supported modern .NET versions, including .NET 8 and later:

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var payments = new Dictionary<Guid, Payment>();
var requests = new Dictionary<string, Payment>();

app.MapGet("/payments/{id:guid}", (Guid id) =>
    payments.TryGetValue(id, out var payment)
        ? Results.Ok(payment)
        : Results.NotFound());

app.MapPost("/payments", (
    CreatePayment request,
    HttpRequest httpRequest) =>
{
    var key = httpRequest.Headers["Idempotency-Key"].ToString();
    if (string.IsNullOrWhiteSpace(key))
        return Results.BadRequest("Idempotency-Key is required.");

    if (requests.TryGetValue(key, out var existing))
        return Results.Ok(existing);

    var payment = new Payment(
        Guid.NewGuid(), request.AccountId, request.Amount, "Created");

    payments[payment.Id] = payment;
    requests[key] = payment;

    return Results.Created($"/payments/{payment.Id}", payment);
});

app.Run();

record CreatePayment(Guid AccountId, decimal Amount);
record Payment(Guid Id, Guid AccountId, decimal Amount, string Status);
```

`MapGet` reads a payment and does not change its business state. `MapPost` creates one and returns `201 Created`. The idempotency key protects against a simple duplicate retry. In production, payment creation and idempotency-key storage must be committed atomically in a durable database with a unique constraint; in-memory dictionaries are only for demonstration.

## 7. Common mistakes

- Using GET for operations that create, update, delete, send, or approve something.
- Assuming POST is secure because its data is in the body. Both GET and POST require HTTPS, authentication, authorization, and input validation.
- Sending secrets or personal data in a GET query string.
- Using a GET body, which may be ignored or rejected by clients and intermediaries.
- Retrying POST blindly and causing duplicate payments, orders, or messages.
- Using an idempotency key without storing it atomically with the operation result.
- Returning `200 OK` for every outcome instead of meaningful status codes such as `201 Created`, `202 Accepted`, `400 Bad Request`, or `404 Not Found`.
- Caching personalized GET responses without correct `Cache-Control` and authorization-aware cache rules.

## 8. Follow-up interview questions

### Is POST always used only for creating resources?

No. POST can also start a command, submit a form, or trigger processing when another HTTP method does not fit. Its meaning is defined by the API endpoint.

### Can GET have a request body?

HTTP does not give a generally useful meaning to a GET body, and support is inconsistent across tooling and infrastructure. Use path or query parameters for GET, or use POST when a structured request body is genuinely required.

### How do you safely retry a POST request?

Send a unique idempotency key and persist it with the operation result. Repeated requests with the same key and same request data should return the original outcome. Reject reuse of the key with different request data.
