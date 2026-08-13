# Production-Ready AI-Generated Code Review in .NET

Created 13/08/2026, 20:52:48

This article walks through a practical **banking money-transfer API** and the major things we should verify before allowing AI-generated code into production.

## 1. Starting Example

Suppose AI generates the following ASP.NET Core endpoint:

```
[HttpPost]
public async Task<IActionResult> Transfer(TransferRequest request)
{
    var fromAccount = await _dbContext.Accounts
        .FirstAsync(x => x.Id == request.FromAccountId);

    var toAccount = await _dbContext.Accounts
        .FirstAsync(x => x.Id == request.ToAccountId);

    if (fromAccount.Balance < request.Amount)
    {
        return BadRequest("Insufficient balance");
    }

    fromAccount.Balance -= request.Amount;
    toAccount.Balance += request.Amount;

    var transaction = new Transaction
    {
        FromAccountId = request.FromAccountId,
        ToAccountId = request.ToAccountId,
        Amount = request.Amount,
        CreatedAt = DateTime.Now
    };

    _dbContext.Transactions.Add(transaction);

    await _dbContext.SaveChangesAsync();

    return Ok("Transfer successful");
}
```

At first glance, this code looks reasonable.

It:

- Finds the accounts
- Checks the balance
- Deducts money
- Credits the destination
- Creates a transaction
- Saves the changes

But there are many production problems hidden inside it.

## 2. Authentication and Authorization

The first problem is that the endpoint isn't protected.

Anyone potentially could call:

```
POST /api/transfer
```

The endpoint should require authentication.

For example:

```
[Authorize]
[HttpPost]
public async Task<IActionResult> Transfer(...)
```

But \`[Authorize]\` alone isn't enough.

### Authentication vs Authorization

**Authentication**

> **Who are you?**

For example:

```
JWT → UserId = 123
```

**Authorization**

> **What are you allowed to do?**

Just because User 123 is authenticated doesn't mean they should be able to transfer money from Account 999.

Therefore, we also need resource-level authorization:

```
Authenticated User
       ↓
User ID = 123
       ↓
FromAccount = 999
       ↓
Does User 123 own/have permission for Account 999?
       ↓
YES → Continue
NO  → 403 Forbidden
```

Never rely on the account ID supplied by the client as proof of ownership.

## 3. Do Account IDs Need Encryption?

A common initial thought might be:

> **"We should encrypt FromAccountId and ToAccountId."**

This isn't necessarily required.

For example:

```
{
    "fromAccountId": 123,
    "toAccountId": 456
}
```

The critical security control isn't hiding \`123\`.

It is ensuring that the authenticated user has permission to access account \`123\`.

Using GUIDs or other non-sequential public identifiers can make IDs less predictable, but this **does not replace authorization**.

## 4. CSRF Protection

Whether CSRF protection is required depends on the authentication mechanism.

If the API uses:

```
Authorization: Bearer <JWT>
```

CSRF is generally less of a concern because the browser does not automatically attach the bearer token to arbitrary requests.

If authentication uses cookies, however, the browser may automatically send those cookies.

In that case, CSRF/anti-forgery protection becomes important.

Therefore:

```
Cookie authentication
        ↓
Consider anti-forgery / CSRF protection

Bearer token authentication
        ↓
CSRF generally isn't the primary threat
```

## 5. Account Not Found Handling

Consider:

```
var account = await _dbContext.Accounts
    .FirstAsync(x => x.Id == request.FromAccountId);
```

If the account doesn't exist, \`FirstAsync()\` does **not return null**.

It throws an exception.

Instead, we might use:

```
var account = await _dbContext.Accounts
    .FirstOrDefaultAsync(x => x.Id == request.FromAccountId);

if (account == null)
{
    return NotFound();
}
```

Both source and destination accounts need to be validated.

## 6. Validate the Transfer Amount

This is one of the most dangerous bugs in the original code.

Consider:

```
{
    "amount": -500
}
```

Our code performs:

```
fromAccount.Balance -= request.Amount;
```

Mathematically:

```
1000 - (-500)

= 1500
```

The user just gained $500.

At minimum:

```
if (request.Amount <= 0)
{
    return BadRequest("Amount must be greater than zero.");
}
```

Depending on the business requirements, we should also validate:

- Maximum transfer amount
- Currency precision
- Daily limits
- Transaction limits
- Regulatory limits

## 7. Same Source and Destination Account

We should prevent:

```
FromAccountId = 100
ToAccountId   = 100
```

For example:

```
if (request.FromAccountId == request.ToAccountId)
{
    return BadRequest(
        "Source and destination accounts cannot be the same.");
}
```

## 8. Account Status

An account existing doesn't necessarily mean money can be transferred.

The account could be:

```
Frozen
Closed
Blocked
Suspended
Debit Restricted
```

Therefore, business rules should also check account status before processing the transfer.

## 9. Currency Validation

Consider:

```
Source Account
Balance = 100 NZD

Destination Account
Currency = USD
```

We cannot simply execute:

```
toAccount.Balance += request.Amount;
```

Otherwise:

```
100 NZD
```

could effectively become:

```
100 USD
```

Cross-currency transfers require additional validation and potentially:

- Exchange-rate lookup
- Rate locking
- Conversion calculations
- Rounding rules
- Fees

## 10. What Is Atomicity?

Atomicity means:

> **Either the entire transaction succeeds or none of it happens.**

It is the **A in ACID**.

Consider:

```
Transfer $100 from A → B

1. Deduct $100 from A
2. Add $100 to B
3. Create transaction record
```

We don't want this:

```
Deduct from A     ✅
Add to B          ❌
Create record     ❌
```

Otherwise money could disappear.

Instead:

```
BEGIN TRANSACTION

Deduct A
Credit B
Create Transaction

Everything successful?

YES
 ↓
COMMIT

NO
 ↓
ROLLBACK
```

Example:

```
await using var transaction =
    await _dbContext.Database.BeginTransactionAsync();

try
{
    fromAccount.Balance -= amount;
    toAccount.Balance += amount;

    _dbContext.Transactions.Add(new Transaction
    {
        FromAccountId = fromAccount.Id,
        ToAccountId = toAccount.Id,
        Amount = amount
    });

    await _dbContext.SaveChangesAsync();

    await transaction.CommitAsync();
}
catch
{
    await transaction.RollbackAsync();
    throw;
}
```

The key definition is:

> **Atomicity = all or nothing.**

## 11. ACID

Database transactions are commonly described using ACID.

### Atomicity

All operations succeed or all operations fail.

### Consistency

The database remains in a valid state before and after the transaction.

### Isolation

Concurrent transactions shouldn't incorrectly interfere with one another.

### Durability

Once the transaction has been committed, the data should remain persisted.

A simple way to remember it:

```
A → All or nothing
C → Data remains valid
I → Transactions don't incorrectly interfere
D → Committed data remains saved
```

## 12. What Is Concurrency?

Concurrency means:

> **Multiple operations access the same data at the same or overlapping time.**

Imagine:

```
Account Balance = $100

Request A → Transfer $80
Request B → Transfer $70
```

Both requests could execute simultaneously:

```
Request A reads → $100
Request B reads → $100

Request A:
100 >= 80 ✅

Request B:
100 >= 70 ✅
```

Both believe sufficient money exists.

This can create incorrect results.

## 13. Concurrency vs Race Condition

These terms are related but aren't identical.

**Concurrency** means:

> **Multiple operations are executing at overlapping times.**

Concurrency itself isn't necessarily bad.

A **race condition** occurs when:

> **Concurrent operations interfere with each other and the result depends on execution timing.**

Therefore:

```
Concurrency
     ↓
Multiple requests access Account
     ↓
Poor concurrency handling
     ↓
Race Condition
     ↓
Incorrect Balance
```

## 14. Optimistic Concurrency

One approach is optimistic concurrency.

We assume conflicts won't happen frequently, but detect them when they do.

In EF Core we can use a \`RowVersion\`:

```
public class Account
{
    public int Id { get; set; }

    public decimal Balance { get; set; }

    [Timestamp]
    public byte[] RowVersion { get; set; }
}
```

Suppose:

```
Balance = $100
RowVersion = 1
```

Request A reads:

```
Balance = 100
Version = 1
```

Request B also reads:

```
Balance = 100
Version = 1
```

Request A updates successfully:

```
Balance = 20
Version = 2
```

Request B then attempts an update based on:

```
Version = 1
```

But version 1 no longer exists.

Conceptually, the database update becomes:

```
UPDATE Accounts
SET Balance = 20
WHERE Id = 123
AND RowVersion = 1;
```

Zero rows are updated.

EF Core can then throw:

```
DbUpdateConcurrencyException
```

We can reject or carefully retry the operation.

## 15. Pessimistic Locking

Another strategy is pessimistic locking.

Instead of detecting conflicts afterwards, we prevent other transactions from modifying the record while we're using it.

Conceptually:

```
Request A
    ↓
Lock Account
    ↓
Read Balance
    ↓
Check Balance
    ↓
Deduct
    ↓
Commit
    ↓
Release Lock
```

Meanwhile:

```
Request B
    ↓
Same Account
    ↓
WAIT
```

Once Request A commits:

```
Old Balance = $100
New Balance = $20
```

Request B then sees \`$20\`, not \`$100\`.

## 16. Does Pessimistic Locking Prevent Duplicate Payments?

No.

This is an important distinction.

Suppose:

```
Balance = $1000

Transfer = $100
```

The client accidentally sends the same request twice.

Request 1:

```
Lock
1000 - 100
Balance = 900
Commit
```

Request 2 waits.

Then:

```
Lock
900 - 100
Balance = 800
Commit
```

Pessimistic locking worked correctly!

But the customer was charged twice.

Why?

Because locking solves a **concurrency problem**, not a **duplicate-request problem**.

This is where idempotency comes in.

## 17. What Is Idempotency?

Idempotency means:

> **Processing the same request multiple times should not cause the business operation to happen multiple times.**

For example:

```
POST /api/transfers

Idempotency-Key: ABC123
```

First request:

```
ABC123 doesn't exist
        ↓
Process $100
        ↓
Store ABC123
```

Second request:

```
ABC123 already exists
        ↓
Do NOT process another $100
        ↓
Return previous result
```

## 18. Idempotency Needs Database Protection

This isn't enough:

```
if (await _dbContext.Transactions
    .AnyAsync(x => x.IdempotencyKey == key))
{
    return Ok("Already processed");
}
```

Two requests could execute simultaneously:

```
Request A → ABC123 exists? → NO
Request B → ABC123 exists? → NO

Request A → Process
Request B → Process
```

This itself is another race condition.

Therefore the database should enforce uniqueness:

```
CREATE UNIQUE INDEX UX_Transaction_IdempotencyKey
ON Transactions(IdempotencyKey);
```

Now even if application-level checking fails, the database prevents duplicate keys.

## 19. Same Idempotency Key With Different Data

Consider:

```
Request 1
Key    = ABC123
Amount = $100
```

Later:

```
Request 2
Key    = ABC123
Amount = $500
```

We shouldn't simply return:

```
Already processed
```

The idempotency key should be associated with the original request.

If the same key is reused with materially different request data, the API should detect the conflict rather than processing it as a normal retry.

## 20. Atomic Database Update

Another useful concurrency technique is performing the check and update atomically in the database.

Instead of:

```
if (account.Balance >= amount)
{
    account.Balance -= amount;
}
```

we can conceptually perform:

```
UPDATE Accounts
SET Balance = Balance - @Amount
WHERE Id = @AccountId
AND Balance >= @Amount;
```

Then inspect the affected rows.

```
1 row affected
    ↓
Deduction succeeded

0 rows affected
    ↓
Insufficient balance or concurrent change
```

The important advantage is that:

```
Check Balance + Update Balance
```

happen as a single database operation.

## 21. What Is the Outbox Pattern?

The Outbox Pattern solves another problem:

> **What if the database transaction succeeds but publishing an event fails?**

Suppose we have:

```
await _dbContext.SaveChangesAsync();

await _messageBus.PublishAsync(
    new TransferCompleted(transaction.Id));
```

Database:

```
Transfer completed ✅
```

RabbitMQ:

```
TransferCompleted publishing ❌
```

Now the database knows about the transfer, but other services don't.

## 22. Why This Is Dangerous

Imagine:

```
Transfer Service
       ↓
TransferCompleted
       ↓
Notification Service
       ↓
Send confirmation
```

Or:

```
TransferCompleted
       ↓
Ledger Service
```

If event publishing fails, downstream systems can become inconsistent.

## 23. How Outbox Works

Instead of directly publishing the event, save it into an Outbox table.

Importantly, save it within the **same database transaction** as the business operation.

```
BEGIN TRANSACTION

Update Account A
Update Account B
Insert Transaction
Insert OutboxMessage

COMMIT
```

Now atomicity applies to both:

```
Business Data + Outbox Event

Either

Both saved ✅

OR

Neither saved ❌
```

Example Outbox table:

| **IDEvent TypePayloadProcessed** |                   |           |       |
| -------------------------------- | ----------------- | --------- | ----- |
| 101                              | TransferCompleted | \`{...}\` | false |

## 24. Outbox Background Worker

A background worker reads pending messages:

```
Outbox Table
     ↓
Background Worker
     ↓
RabbitMQ
     ↓
Publish
     ↓
Mark Processed
```

If RabbitMQ is unavailable:

```
Publish ❌
   ↓
Keep message pending
   ↓
Retry
   ↓
RabbitMQ available
   ↓
Publish ✅
```

Therefore we don't lose the event just because RabbitMQ was temporarily unavailable.

## 25. Outbox Can Produce Duplicate Events

There is another interesting problem.

Imagine:

```
Worker reads Outbox

       ↓

Publish RabbitMQ ✅

       ↓

Application crashes 💥

       ↓

Outbox wasn't marked Processed
```

When the worker restarts:

```
Message still says:
Processed = false

       ↓

Publish AGAIN
```

RabbitMQ could receive:

```
TransferCompleted
TransferCompleted
```

Therefore the consumer should also be **idempotent**.

This is why Outbox is commonly associated with **at-least-once delivery**, where duplicate delivery must be handled safely.

## 26. Outbox and Idempotent Consumer Together

The complete flow becomes:

```
Transfer API
      ↓
Database Transaction
      ↓
Account Updates
Transaction Record
Outbox Record
      ↓
COMMIT
      ↓
Outbox Worker
      ↓
RabbitMQ
      ↓
Consumer
      ↓
Has EventId already been processed?
      ↓
YES → Ignore duplicate
NO  → Process + record EventId
```

## 27. Exception Handling

Another issue with AI-generated code is putting everything directly inside the controller with no clear exception-handling strategy.

However, adding:

```
try
{
}
catch
{
}
```

to every controller isn't necessarily the right solution.

ASP.NET Core applications generally benefit from centralized exception handling.

For example:

```
app.UseExceptionHandler();
```

or a custom \`IExceptionHandler\`.

Then unexpected exceptions can be handled consistently.

For example:

```
Exception
   ↓
Global Exception Handler
   ↓
Structured Logging
   ↓
Standard ProblemDetails Response
```

## 28. Logging and Monitoring

Production code should be observable.

For example:

```
_logger.LogInformation(
    "Transfer {TransactionId} completed",
    transaction.Id);
```

Useful information can include:

- Transaction ID
- Correlation ID
- Request/trace ID
- Processing duration
- Result/status
- Failure category

However, logs should avoid exposing sensitive information such as:

- Passwords
- Authentication tokens
- Full payment details
- Secrets
- Sensitive customer information

## 29. Correlation IDs

In distributed systems, one request may travel through several services:

```
API Gateway
    ↓
Transfer Service
    ↓
RabbitMQ
    ↓
Notification Service
    ↓
Audit Service
```

A correlation/trace ID helps connect logs belonging to the same operation.

For example:

```
CorrelationId = XYZ123

Transfer Service:
XYZ123 → Transfer started

RabbitMQ:
XYZ123 → Event published

Notification Service:
XYZ123 → Notification sent
```

This makes production troubleshooting much easier.

## 30. Separation of Concerns

Another issue with the original code is that everything lives inside the controller.

The controller is doing:

```
HTTP handling
Database access
Validation
Business logic
Transaction management
```

A better architecture separates responsibilities.

For example:

```
Controller
    ↓
Application / Transfer Service
    ↓
Domain/business rules
    ↓
Persistence / Infrastructure
```

The controller should ideally remain thin.

For example:

```
[HttpPost]
public async Task<IActionResult> Transfer(
    TransferRequest request,
    CancellationToken cancellationToken)
{
    var result = await _transferService.TransferAsync(
        request,
        cancellationToken);

    return Ok(result);
}
```

The service/application layer handles the business operation.

## 31. Don't Return EF Entities Directly

Avoid:

```
return Ok(transaction);
```

The EF entity represents database persistence.

If fields are added later, they could accidentally become part of the API response.

Instead use a response DTO:

```
return Ok(new TransferResponse
{
    TransactionId = transaction.Id,
    Status = "Completed"
});
```

This keeps the API contract separate from the database model.

## 32. CancellationToken

Production APIs should generally propagate cancellation where appropriate:

```
public async Task<IActionResult> Transfer(
    TransferRequest request,
    CancellationToken cancellationToken)
```

Then:

```
await _dbContext.SaveChangesAsync(cancellationToken);
```

This allows operations to respond appropriately when requests are cancelled or time out.

However, cancellation around critical financial operations needs careful design. Once an irreversible/committed business operation has occurred, client cancellation must not leave the system inconsistent.

## 33. Testing AI-Generated Code

AI-generated code should go through the same—or stronger—quality gates as developer-written code.

We should test:

#### Unit Tests

Business rules:

```
Negative amount
Zero amount
Insufficient balance
Frozen account
Same source/destination
Transfer limits
```

#### Integration Tests

Verify:

```
Database transactions
EF Core behaviour
Concurrency
Rollback
Unique constraints
```

#### API Tests

Verify:

```
Authentication
Authorization
Validation
HTTP status codes
Request/response contracts
Idempotency
```

#### Concurrency Tests

Send multiple simultaneous transfer requests and verify the final balance.

#### Failure Tests

Simulate:

```
Database unavailable
RabbitMQ unavailable
Timeout
Application crash
Duplicate request
Deadlock
```

## 34. Security and Static Analysis

Before production, also run:

```
Static code analysis
Dependency vulnerability scanning
Secret scanning
Linting
SAST
Code quality checks
```

AI can occasionally suggest:

- Deprecated libraries
- Insecure APIs
- Incorrect cryptography
- Hardcoded secrets
- Vulnerable dependencies
- Poor exception handling

Generated code should never bypass normal security checks.

## 35. Pull Request Review

AI-generated code should still go through:

```
AI generates code
        ↓
Developer understands it
        ↓
Developer reviews it
        ↓
Unit tests
        ↓
Integration tests
        ↓
Security/static analysis
        ↓
Pull Request
        ↓
Peer review
        ↓
CI/CD
        ↓
Staging
        ↓
Production
        ↓
Monitoring
```

The key rule is:

> **Never merge AI-generated code that you cannot explain.**

## 36. Four Important Concepts to Remember

For payment and distributed-system interviews, remember these four concepts.

### Atomicity

**Problem:**

What if debit succeeds but credit fails?

**Solution:**

Database transaction.

```
All succeed
OR
All rollback
```

### Concurrency

**Problem:**

What if two different transfers access the same balance simultaneously?

**Solutions can include:**

```
Optimistic concurrency
Pessimistic locking
Atomic database operations
Appropriate transaction isolation
```

### Idempotency

**Problem:**

What if the same request is submitted twice?

**Solution:**

```
Idempotency Key
+
Database unique constraint
```

The same business request shouldn't execute twice.

### Outbox

**Problem:**

What if the database succeeds but message publishing fails?

**Solution:**

```
Business Data
+
Outbox Message

saved in same DB transaction
```

Then publish asynchronously.

## 37. Don't Confuse These Problems

This distinction is extremely important:

```
ATOMICITY
"What if part of ONE transaction fails?"

CONCURRENCY
"What if MULTIPLE transactions access the same data?"

IDEMPOTENCY
"What if the SAME REQUEST arrives more than once?"

OUTBOX
"What if DB succeeds but EVENT PUBLISHING fails?"
```

Each solves a different problem.

## 38. Production-Ready Transfer Flow

Putting everything together:

```
Client
   ↓
Authentication
   ↓
Authorization
   ↓
Request Validation
   ↓
Idempotency Check
   ↓
Business Validation
   ↓
Database Transaction
   ↓
Concurrency Protection
   ↓
Debit Source
   ↓
Credit Destination
   ↓
Create Transaction
   ↓
Create Outbox Message
   ↓
COMMIT
   ↓
Return Response


Separately:

Outbox Worker
   ↓
Read Pending Events
   ↓
Publish to RabbitMQ
   ↓
Mark Processed
   ↓
Idempotent Consumer
```

## 39. Strong Interview Answer

If an interviewer asks:

**"How do you verify AI-generated code before it reaches production?"**

A strong answer is:

> **"I treat AI-generated code exactly like developer-written code. I first review it manually and make sure I understand every important part rather than blindly accepting the output. I check business validation, authentication and authorization, error handling, concurrency, transaction boundaries, idempotency, security and performance. For a financial operation, for example, I'd make sure debit and credit are atomic, concurrent requests cannot incorrectly spend the same balance, duplicate requests are protected through idempotency, and events are reliably published using something like the Outbox Pattern. After that, the code goes through unit and integration tests, security and static analysis, pull-request review, CI/CD and lower-environment testing. Once deployed, structured logging, tracing, metrics and alerts help us monitor production behaviour. AI helps accelerate development, but the engineer remains responsible for the code that reaches production."**

## Quick Revision

```
AI CODE REVIEW
│
├── Authentication
├── Authorization
├── Input validation
├── Business validation
├── Error handling
├── Database transaction
├── Concurrency
├── Idempotency
├── Security
├── Logging
├── Monitoring
├── Testing
└── PR / CI-CD


ATOMICITY
→ All or nothing

CONCURRENCY
→ Multiple operations safely accessing shared data

RACE CONDITION
→ Concurrent operations cause an incorrect result

IDEMPOTENCY
→ Same request doesn't produce duplicate effects

OUTBOX
→ Don't lose an event after the DB transaction succeeds

OPTIMISTIC CONCURRENCY
→ Detect that another transaction changed the data

PESSIMISTIC LOCKING
→ Lock shared data while processing

CORRELATION ID
→ Trace one operation across services
```

### Final Principle

**AI should accelerate implementation, not weaken engineering standards.**

The final responsibility for **correctness, security, reliability, data consistency, testing, and production behaviour remains with the engineer approving the code.**