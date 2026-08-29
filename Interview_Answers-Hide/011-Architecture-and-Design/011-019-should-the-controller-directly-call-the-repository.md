# 19. Should the controller directly call the repository?

**Technology:** Architecture and Design

**Source question:** 19. Should the controller directly call the repository?

## 1. What is it?

Usually, no. A controller should handle HTTP concerns, such as reading the request, validating the input, calling an application use case, and returning an HTTP response. It should normally call an application service, command handler, or query handler rather than calling a repository directly.

The repository is a data-access abstraction. If a controller calls it directly, the controller can easily become responsible for business rules, transactions, authorization decisions, and data access orchestration. That mixes responsibilities.

For a very small, read-only CRUD endpoint with no business rules, a direct call can be acceptable. It is a trade-off, not an absolute rule. As the use case grows, introduce an application layer instead of allowing the controller to grow.

## 2. Why is it important?

Keeping the controller separate from the repository gives each part a clear job:

- The controller deals with HTTP status codes, headers, routes, and request models.
- The application layer coordinates the use case, permissions, transactions, and calls to other systems.
- The domain layer enforces business rules.
- The repository loads and saves data.

This separation makes business behavior reusable from a background worker, message consumer, or another API endpoint. It also makes tests easier because the use case can be tested without starting an HTTP server.

A direct controller-to-repository design often looks simple at first, but it becomes hard to maintain when the endpoint must perform fraud checks, publish events, update several records, or manage a transaction.

## 3. How does it work?

A typical request flows like this:

1. ASP.NET Core routes the HTTP request to the controller.
2. The controller accepts a request DTO and passes it to an application service or handler.
3. The application service validates use-case rules and coordinates the operation.
4. The domain object applies its business rules.
5. The repository reads or writes the aggregate.
6. The application service commits the transaction and returns a result.
7. The controller maps that result to an HTTP response such as `200 OK`, `404 Not Found`, or `409 Conflict`.

Dependencies point inward through interfaces. For example, the application layer can define `IAccountRepository`, while the infrastructure layer implements it with Entity Framework Core. The controller does not need to know how the data is stored.

## 4. Practical example

Consider a banking endpoint that freezes an account. Freezing is more than setting a database column. The system must check that the account exists, confirm that it is not already closed, verify the caller's permission, record the reason, save an audit entry, and publish an event.

If the controller calls the repository directly, these steps may end up inside the controller and the transaction boundary may be unclear. A `FreezeAccountHandler` can coordinate the complete use case. The controller only passes the command to the handler and converts the outcome into an HTTP response.

This also allows the same handler to be called from an operations portal or a message consumer without copying the business flow.

## 5. Scenario-based interview answer

“In a payment API, I found controllers directly using repositories. That worked for basic CRUD, but one refund endpoint had grown to include payment-state checks, database updates, audit logging, and event publishing.

I decided to move the refund use case into an application handler. The controller remained responsible for HTTP input and output, the domain model checked whether the payment could be refunded, and the handler coordinated the repository, transaction, and event publication. We kept repository interfaces at the application boundary and implemented them in infrastructure.

The result was a smaller controller, focused unit tests for the refund flow, and one reusable use case for both API requests and queued refund commands. I would not add that abstraction blindly to every simple read endpoint, but I would use it whenever business behavior or orchestration is involved.”

## 6. Code example

```csharp
public sealed record FreezeAccountRequest(string Reason);

public enum FreezeAccountResult
{
    Success,
    NotFound,
    AlreadyClosed
}

public interface IAccountRepository
{
    Task<Account?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public sealed class FreezeAccountHandler
{
    private readonly IAccountRepository _accounts;

    public FreezeAccountHandler(IAccountRepository accounts)
    {
        _accounts = accounts;
    }

    public async Task<FreezeAccountResult> HandleAsync(
        Guid accountId,
        string reason,
        CancellationToken cancellationToken)
    {
        var account = await _accounts.GetByIdAsync(accountId, cancellationToken);

        if (account is null)
            return FreezeAccountResult.NotFound;

        if (account.IsClosed)
            return FreezeAccountResult.AlreadyClosed;

        account.Freeze(reason); // The domain object enforces its business rules.
        await _accounts.SaveChangesAsync(cancellationToken);

        return FreezeAccountResult.Success;
    }
}

[ApiController]
[Route("api/accounts")]
public sealed class AccountsController : ControllerBase
{
    private readonly FreezeAccountHandler _handler;

    public AccountsController(FreezeAccountHandler handler)
    {
        _handler = handler;
    }

    [HttpPost("{accountId:guid}/freeze")]
    public async Task<IActionResult> Freeze(
        Guid accountId,
        FreezeAccountRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _handler.HandleAsync(
            accountId, request.Reason, cancellationToken);

        return result switch
        {
            FreezeAccountResult.Success => NoContent(),
            FreezeAccountResult.NotFound => NotFound(),
            FreezeAccountResult.AlreadyClosed => Conflict("A closed account cannot be frozen."),
            _ => StatusCode(StatusCodes.Status500InternalServerError)
        };
    }
}
```

The controller contains only HTTP mapping. The handler owns the application flow, while `Account.Freeze` owns the business rule. The repository hides persistence details, and the cancellation token is passed through to database operations.

In a real system, transaction handling and reliable event publication may be implemented through a unit of work and an outbox.

## 7. Common mistakes

- Putting business rules in the controller because it already has access to the repository.
- Adding an application service that only forwards every call and provides no useful boundary.
- Returning Entity Framework entities directly from the controller instead of response DTOs.
- Treating request-model validation as a replacement for domain validation.
- Calling several repositories without a clear transaction boundary.
- Publishing an integration event before the database transaction commits.
- Hiding every query behind a generic repository, even when a direct, optimized read model would be clearer.
- Forgetting authorization, cancellation tokens, logging, and idempotency for sensitive operations.

## 8. Follow-up interview questions

### When is a direct repository call from a controller acceptable?

It can be reasonable for a small, read-only CRUD endpoint with no business rules or orchestration. The team should still keep the controller small and refactor when the use case becomes more complex.

### Is an application service the same as a domain service?

No. An application service coordinates a use case and infrastructure boundaries. A domain service contains domain logic that does not naturally belong to one entity or value object.

### Should queries also go through repositories?

Not always. In CQRS-style designs, a query handler may use a read-only database abstraction or optimized projection directly. It should still sit behind the application boundary so the controller remains focused on HTTP concerns.
