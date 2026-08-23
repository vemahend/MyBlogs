# 27. Where should validation happen?

**Technology:** API Design and Integration Governance

**Source question:** 27. Where should validation happen?

## 1. What is it?

Validation should happen at every layer that owns a rule, not in one single place.

- The **client** validates for quick user feedback.
- The **API boundary** validates the request's shape, required fields, formats, and safe limits.
- The **application or domain layer** validates business rules and protects business invariants.
- The **database** enforces data rules such as uniqueness, foreign keys, and check constraints.
- A service receiving a message or API call validates it again because it cannot trust another process to have done so.

The important principle is: validate a rule in the layer that has the knowledge and authority to enforce it. Client-side validation improves usability, but server-side validation is always required.

## 2. Why is it important?

Putting all validation in a UI or controller creates gaps. Requests may also come from mobile apps, partner systems, scripts, message queues, or older client versions. They can bypass the UI completely.

Validation in the correct layers provides:

- **Security:** The server does not trust input controlled by a caller.
- **Data integrity:** Invalid state cannot enter the domain or database.
- **Good user experience:** The client can show simple errors immediately.
- **Reusable business rules:** The same rules apply to HTTP requests, background jobs, and messages.
- **Clear ownership:** Format rules stay at the API edge, while business decisions stay in the domain.
- **Protection from concurrency:** Database constraints catch conflicts that an earlier application check can miss.

Some duplication is intentional. For example, both the UI and API may check that an amount is positive, but only the server is trusted to enforce it.

## 3. How does it work?

A typical request is validated in this order:

1. The client checks basic fields and gives immediate feedback. This is optional from the server's point of view.
2. ASP.NET Core parses the request. The API rejects malformed JSON, missing required values, invalid formats, excessive lengths, or values outside safe ranges.
3. The application layer checks use-case rules, such as whether the caller is allowed to transfer from the account.
4. The domain model protects invariants, such as a transfer amount being positive and an account not exceeding its allowed overdraft.
5. The database enforces final structural guarantees, such as foreign keys, unique idempotency keys, and check constraints.
6. If another service receives an event or request, it validates the data needed for its own operation instead of trusting the sender.

Validation can depend on different kinds of information:

| Rule | Best enforcement point |
|---|---|
| `amount` is present and has a valid JSON value | API boundary |
| `amount` is within the endpoint's accepted limit | API boundary |
| account has enough available funds | Domain/application layer |
| caller can debit this account | Application/authorization layer |
| idempotency key must be unique | Database, with application handling |
| message matches the published contract | Message consumer boundary |

Do not confuse validation with authorization. Validation asks whether input is acceptable; authorization asks whether this caller may perform the operation.

Also avoid checking changing business data too early. A balance can change between a controller check and a database update. Such rules must be enforced in the transaction or by an atomic database operation.

## 4. Practical example

Consider a banking API that creates a transfer.

The web page checks that the amount is entered and greater than zero, so the customer gets fast feedback. The API repeats those checks and also limits the reference length and maximum request amount.

The application layer loads the source account, verifies the customer's access, and calls the domain model. The domain model refuses a transfer when the available balance is insufficient. The debit and transfer record are then saved in one transaction.

The database has a unique constraint on the client's idempotency key. If two identical requests arrive at the same time, both may pass an earlier lookup, but only one can create the transfer. The application catches that known constraint conflict and returns the result of the existing transfer instead of charging twice.

This design gives a helpful client experience while keeping the server, business state, and stored data protected.

## 5. Scenario-based interview answer

**Problem:** In a payment platform, validation was placed only in MVC controllers. A scheduled payment job called the application service directly, bypassed those checks, and created payment instructions with invalid amounts. Controllers also contained balance and account-status rules that were difficult to reuse.

**Decision:** I separated validation by ownership. Transport-level rules stayed at the API or message boundary, use-case and authorization rules went into the application layer, domain invariants were protected by the domain model, and concurrency-sensitive guarantees were backed by database constraints.

**Implementation:** The HTTP request model checked required fields, ranges, and length limits. The command handler loaded the account and checked the caller's permission. The account aggregate controlled whether a debit was valid. We added a unique database constraint for the idempotency key and handled that specific conflict. Message consumers performed the same boundary checks before calling the application service.

**Result:** HTTP requests and background jobs followed the same business rules, controllers became smaller, invalid state could not be created by bypassing the UI, and duplicate payment requests were handled safely under concurrency.

In an interview, I would summarize it like this: “Validation belongs in multiple layers, but each rule needs one authoritative owner. I validate untrusted input at every boundary, keep business invariants in the domain, and use database constraints for final integrity. Client validation is useful for usability, never for trust.”

## 6. Code example

This example uses APIs available in supported ASP.NET Core versions, including .NET 8 and later. It shows boundary validation in an API request and invariant protection in the domain:

```csharp
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("transfers")]
public sealed class TransfersController : ControllerBase
{
    [HttpPost]
    public IActionResult Create(
        [FromBody] CreateTransferRequest request,
        [FromServices] TransferService service)
    {
        var transferId = service.Create(
            request.SourceAccountId,
            request.Amount,
            request.Reference!);

        return Accepted(new { transferId });
    }
}

public sealed record CreateTransferRequest(
    [property: Required] Guid SourceAccountId,
    [property: Range(typeof(decimal), "0.01", "1000000")]
    decimal Amount,
    [property: Required, StringLength(140)]
    string? Reference);

public sealed class TransferService(AccountRepository accounts)
{
    public Guid Create(Guid accountId, decimal amount, string reference)
    {
        var account = accounts.Get(accountId)
            ?? throw new AccountNotFoundException(accountId);

        // The domain owns this business invariant. Other entry points cannot bypass it.
        account.Debit(amount);

        var transferId = Guid.NewGuid();
        accounts.SaveTransfer(transferId, account, amount, reference);
        return transferId;
    }
}

public sealed class Account(decimal availableBalance)
{
    public decimal AvailableBalance { get; private set; } = availableBalance;

    public void Debit(decimal amount)
    {
        if (amount <= 0)
            throw new DomainValidationException("Amount must be positive.");

        if (amount > AvailableBalance)
            throw new InsufficientFundsException();

        AvailableBalance -= amount;
    }
}
```

Important points:

- With `[ApiController]`, invalid model state automatically produces an HTTP `400` response before the controller action runs.
- Data annotations handle simple request rules such as required values, ranges, and lengths.
- The domain still checks the positive amount because it may be called from a worker, message consumer, test, or another use case.
- The available-balance rule belongs to `Account`, not to the request DTO.
- In production, reading the balance, applying the debit, and saving it must use a suitable transaction or concurrency strategy.
- Known validation failures should be mapped to a consistent `ProblemDetails` response. Do not expose raw exception details.

For complex request rules, a dedicated validator can replace or supplement data annotations. The placement principle remains the same.

## 7. Common mistakes

- Trusting browser or mobile validation and skipping server validation.
- Putting every rule in the controller, which allows jobs and message consumers to bypass business rules.
- Duplicating a business rule independently across controllers instead of giving it one authoritative owner.
- Treating authorization as ordinary input validation and returning the wrong status or exposing information.
- Checking a unique value only with “does it exist?” and forgetting a database unique constraint.
- Performing a balance check outside the transaction, leaving a race condition between validation and update.
- Using database constraints as the only validation and returning unclear database errors to clients.
- Returning `500 Internal Server Error` for expected validation failures.
- Returning different error shapes from different endpoints.
- Validating an entire object graph when the use case needs only a few fields, causing unnecessary coupling and database work.
- Trusting internal events because they came from another owned service. Messages can be old, malformed, duplicated, or produced by a different version.
- Logging sensitive values such as passwords, tokens, card data, or personal information in validation errors.

## 8. Follow-up interview questions

### 1. Is duplicate validation across the client and API a bad design?

No. The client check improves user experience, while the API check provides security and correctness. The server remains authoritative. Avoid duplicating complex business decisions independently in several places.

### 2. Should business validation return `400` or `422`?

Use a consistent API contract. `400 Bad Request` is common for request validation. Some APIs use `422 Unprocessable Content` when the syntax is valid but the request cannot be processed because of semantic rules. The distinction matters less than applying it consistently and returning stable error codes.

### 3. Why keep database constraints if the application already validates?

Application checks can be bypassed, and concurrent requests can both pass the same check. Database constraints are the final atomic protection for rules such as uniqueness, foreign keys, and valid value ranges. The application should translate expected constraint failures into safe API errors.
