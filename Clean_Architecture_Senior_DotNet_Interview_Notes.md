# Clean Architecture in .NET — Senior-Level Interview Notes

## 1. What is Clean Architecture?

**Clean Architecture** is an architectural approach that organizes an application into layers with clear responsibilities and, most importantly, keeps the **business logic independent of external technologies**.

The core principle is:

> **Dependencies point inward.**

Your business rules should not depend on ASP.NET Core, Entity Framework Core, SQL Server, RabbitMQ, AWS, Azure, or any other infrastructure technology.

A typical structure is:

```text
┌───────────────────────────────────────────┐
│ Presentation / API                        │
│ Controllers, Middleware, Authentication   │
├───────────────────────────────────────────┤
│ Application                               │
│ Use Cases, Commands, Queries, Interfaces  │
├───────────────────────────────────────────┤
│ Domain                                    │
│ Entities, Value Objects, Business Rules   │
├───────────────────────────────────────────┤
│ Infrastructure                            │
│ EF Core, SQL, Message Bus, External APIs  │
└───────────────────────────────────────────┘
```

The diagram above shows responsibilities, but dependency direction is the important part:

```text
Presentation ───────► Application ───────► Domain
Infrastructure ─────► Application / Domain
```

The **Domain does not know about Infrastructure**.

---

## 2. Why do we need Clean Architecture?

Consider an Order API where everything is written inside the controller:

```csharp
[HttpPost]
public async Task<IActionResult> CreateOrder(CreateOrderRequest request)
{
    var customer = await _dbContext.Customers
        .FirstOrDefaultAsync(x => x.Id == request.CustomerId);

    if (customer == null)
        return BadRequest("Customer not found");

    var order = new Order
    {
        CustomerId = request.CustomerId,
        Amount = request.Amount
    };

    _dbContext.Orders.Add(order);
    await _dbContext.SaveChangesAsync();

    await _rabbitMq.PublishAsync(new OrderCreated(order.Id));

    return Ok(order);
}
```

This controller is responsible for too many things:

```text
HTTP handling
Business validation
Database access
Entity creation
Transaction persistence
Message publishing
```

That creates tight coupling and makes business logic harder to test, maintain, and evolve.

Clean Architecture separates these responsibilities.

---

# 3. Typical .NET Solution Structure

```text
MyApplication.sln

src/
│
├── MyApplication.Domain
│
├── MyApplication.Application
│
├── MyApplication.Infrastructure
│
└── MyApplication.Api
```

A more realistic structure might be:

```text
Domain
 ├── Entities
 ├── ValueObjects
 ├── DomainEvents
 ├── Exceptions
 └── BusinessRules

Application
 ├── Orders
 │   ├── Commands
 │   ├── Queries
 │   ├── Handlers
 │   └── DTOs
 ├── Interfaces
 └── Behaviors

Infrastructure
 ├── Persistence
 ├── Repositories
 ├── Messaging
 ├── ExternalServices
 └── Identity

Api
 ├── Controllers
 ├── Middleware
 ├── Filters
 └── Program.cs
```

---

# 4. Domain Layer

The **Domain layer contains the core business model and business rules**.

It should contain concepts such as:

- Entities
- Value Objects
- Domain Events
- Domain Exceptions
- Business invariants

Example:

```csharp
public class Order
{
    public Guid Id { get; private set; }
    public decimal TotalAmount { get; private set; }
    public OrderStatus Status { get; private set; }

    public Order(decimal totalAmount)
    {
        if (totalAmount <= 0)
            throw new DomainException(
                "Order amount must be greater than zero.");

        Id = Guid.NewGuid();
        TotalAmount = totalAmount;
        Status = OrderStatus.Pending;
    }

    public void Confirm()
    {
        if (Status != OrderStatus.Pending)
            throw new DomainException(
                "Only pending orders can be confirmed.");

        Status = OrderStatus.Confirmed;
    }
}
```

Notice what is **not** present:

```text
DbContext
SQL Server
HTTP
Controller
RabbitMQ
AWS
Azure
```

The `Order` object protects its own business rules.

### Senior-level point

Do not treat the Domain layer as simply a folder containing database entities.

A good domain model should represent **business behaviour**, not only data.

Instead of:

```csharp
order.Status = OrderStatus.Confirmed;
```

prefer behaviour such as:

```csharp
order.Confirm();
```

because the entity can enforce the rules required to perform that transition.

---

# 5. Application Layer

The **Application layer implements application use cases**.

Examples:

```text
Create Order
Cancel Order
Transfer Money
Approve Payment
Get Customer Details
```

It coordinates domain objects and defines abstractions for things outside the application core.

Example command:

```csharp
public record CreateOrderCommand(
    Guid CustomerId,
    decimal Amount);
```

Example abstraction:

```csharp
public interface IOrderRepository
{
    Task AddAsync(
        Order order,
        CancellationToken cancellationToken);
}
```

Handler:

```csharp
public class CreateOrderHandler
{
    private readonly IOrderRepository _repository;

    public CreateOrderHandler(IOrderRepository repository)
    {
        _repository = repository;
    }

    public async Task<Guid> Handle(
        CreateOrderCommand command,
        CancellationToken cancellationToken)
    {
        var order = new Order(command.Amount);

        await _repository.AddAsync(
            order,
            cancellationToken);

        return order.Id;
    }
}
```

The Application layer knows:

```text
I need an Order Repository.
```

It does **not** need to know:

```text
The repository uses EF Core 10 with SQL Server.
```

That implementation detail belongs outside the application core.

---

# 6. Infrastructure Layer

Infrastructure contains implementations for external technical concerns.

Typical examples:

- EF Core
- Dapper
- SQL Server/PostgreSQL
- Redis
- RabbitMQ
- Kafka
- Azure Service Bus
- S3/Blob Storage
- Email providers
- External REST APIs

Example:

```csharp
public class OrderRepository : IOrderRepository
{
    private readonly ApplicationDbContext _context;

    public OrderRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(
        Order order,
        CancellationToken cancellationToken)
    {
        await _context.Orders.AddAsync(
            order,
            cancellationToken);

        await _context.SaveChangesAsync(
            cancellationToken);
    }
}
```

Notice the dependency:

```text
Application
    │
    │ defines
    ▼
IOrderRepository
    ▲
    │ implements
    │
Infrastructure
```

This is the **Dependency Inversion Principle** in practice.

The high-level business/application code depends on an abstraction. The infrastructure implementation depends on that abstraction.

---

# 7. Presentation / API Layer

The API layer should mainly deal with transport concerns:

```text
HTTP
Routing
Authentication
Authorization
Request/response mapping
Status codes
Middleware
```

Example:

```csharp
[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrdersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        CreateOrderCommand command,
        CancellationToken cancellationToken)
    {
        var orderId = await _mediator.Send(
            command,
            cancellationToken);

        return Ok(orderId);
    }
}
```

The controller is thin.

It does not contain database queries or core business rules.

---

# 8. The Dependency Rule

This is the most important Clean Architecture concept.

```text
API ───────────────► Application
                         │
                         ▼
                       Domain

Infrastructure ─────► Application
Infrastructure ─────► Domain
```

Avoid this:

```text
Domain ─────► Infrastructure
```

For example, this is undesirable:

```csharp
public class Order
{
    private readonly ApplicationDbContext _context;
}
```

Now the business entity depends directly on EF/database infrastructure.

Instead, keep the business model independent.

---

# 9. Dependency Injection connects everything

The API is normally the **composition root** where implementations are wired to abstractions.

```csharp
builder.Services.AddScoped<
    IOrderRepository,
    OrderRepository>();
```

Application code asks for:

```csharp
IOrderRepository
```

At runtime DI provides:

```csharp
OrderRepository
```

So the dependency chain becomes:

```text
Controller
   ↓
Application Use Case
   ↓
IOrderRepository
   ↑
OrderRepository
   ↓
EF Core
   ↓
SQL Server
```

The application use case remains unaware of EF Core and SQL Server.

---

# 10. Clean Architecture with CQRS and MediatR

Clean Architecture does **not require CQRS or MediatR**, but they are commonly used together.

CQRS separates:

```text
Commands → change state
Queries  → read state
```

Example:

```text
Application
│
├── Orders
│   ├── Commands
│   │   ├── CreateOrderCommand.cs
│   │   └── CreateOrderHandler.cs
│   │
│   └── Queries
│       ├── GetOrderQuery.cs
│       └── GetOrderHandler.cs
```

Request flow:

```text
POST /orders
      ↓
OrdersController
      ↓
CreateOrderCommand
      ↓
MediatR
      ↓
CreateOrderHandler
      ↓
Domain
      ↓
IOrderRepository
      ↓
Infrastructure implementation
      ↓
Database
```

This gives clear separation between HTTP transport, use-case orchestration, business rules, and persistence.

---

# 11. Where should validation go?

This is an important senior-level distinction.

Not every validation belongs in the same layer.

### Request/Application validation

Examples:

```text
Email is required
Amount field is required
String maximum length is 100
Request format is invalid
```

These commonly belong in the Application/API boundary, often using FluentValidation.

### Domain validation

Examples:

```text
Cannot withdraw more than the permitted balance.
A shipped order cannot be cancelled.
An approved payment cannot be approved again.
```

These are business invariants and should be protected by the Domain.

This distinction prevents business rules from being bypassed when the same domain logic is called from another entry point such as a background worker or message consumer.

---

# 12. Example: Payment Transfer

Suppose the requirement is:

```text
Transfer $500 from Account A to Account B.
```

A poor design could put everything in the controller:

```text
Controller
 ├── Find Account A
 ├── Find Account B
 ├── Check balance
 ├── Deduct balance
 ├── Add balance
 ├── Save database
 └── Publish event
```

With Clean Architecture:

```text
API
 │
 ▼
TransferMoneyCommand
 │
 ▼
TransferMoneyHandler
 │
 ├── Load accounts
 │
 ▼
Domain
 │
 ├── source.Debit(amount)
 └── destination.Credit(amount)
 │
 ▼
Application abstraction
 │
 ▼
Infrastructure
 │
 ├── EF Core transaction
 ├── Save changes
 └── Outbox message
```

Now the responsibilities are much clearer.

---

# 13. Where does the Outbox Pattern fit?

The **decision that an event should exist** can originate from the Domain/Application layer.

The **technical mechanism for storing and publishing it** belongs in Infrastructure.

For example:

```text
Domain
   ↓
PaymentCompleted domain event
   ↓
Application
   ↓
Infrastructure
   ↓
OutboxMessages table
   ↓
Background Publisher
   ↓
RabbitMQ
```

This is an important architectural distinction:

```text
Business intent        → Core
Technical implementation → Infrastructure
```

---

# 14. Clean Architecture is not just folder structure

A common mistake is creating:

```text
Domain/
Application/
Infrastructure/
API/
```

while still writing code like:

```csharp
ApplicationService
    ↓
ApplicationDbContext
    ↓
SQL Server
```

or placing all business logic inside controllers/services.

That is only **folder separation**, not architectural separation.

Clean Architecture is primarily about:

```text
Dependency direction
Business boundaries
Separation of responsibilities
Testability
Replaceable infrastructure
```

---

# 15. Benefits

### Testability

Business logic can be tested without starting:

```text
SQL Server
RabbitMQ
ASP.NET Core
```

For example:

```csharp
[Fact]
public void Order_WithZeroAmount_ShouldFail()
{
    Assert.Throws<DomainException>(
        () => new Order(0));
}
```

### Infrastructure can change

You might move from:

```text
SQL Server → PostgreSQL
RabbitMQ   → Azure Service Bus
Local disk → S3
```

The goal is to minimize the effect on business logic.

### Clear responsibilities

Developers can reason about where code belongs.

### Maintainability

Changes to technical infrastructure are less likely to leak throughout the system.

---

# 16. Disadvantages and trade-offs

Clean Architecture is not automatically the right choice for every project.

It can introduce:

- More projects
- More interfaces
- More abstractions
- Mapping between models
- Additional boilerplate
- Higher learning curve
- Unnecessary complexity for small CRUD applications

For a very small application:

```text
Controller → Service → EF Core
```

may be completely acceptable.

For a large system with complex business rules, multiple integrations, long-term maintenance, and many developers, stronger architectural boundaries become much more valuable.

A senior engineer should choose architecture based on **complexity and change pressure**, rather than applying patterns mechanically.

---

# 17. Clean Architecture vs Microservices

These are different concepts.

**Clean Architecture** describes how code and dependencies can be organized **inside an application/service**.

**Microservices** describe how a larger system is divided into independently deployable services.

You can therefore have:

```text
Order Service
 ├── Domain
 ├── Application
 ├── Infrastructure
 └── API

Payment Service
 ├── Domain
 ├── Application
 ├── Infrastructure
 └── API
```

Each microservice can internally use Clean Architecture.

A modular monolith can also use Clean Architecture.

---

# 18. Practical senior-level considerations

For an experienced engineer, Clean Architecture should not mean creating an interface for every class.

Use abstractions at meaningful boundaries, especially where you need to isolate:

```text
Database access
Messaging
File/object storage
External APIs
Clock/time
Identity
Payment gateways
Email/SMS providers
```

Also think about:

- Transaction boundaries
- Idempotency
- Concurrency
- Observability
- Retry policies
- Outbox/inbox patterns
- Domain events
- Integration events
- Security boundaries
- Performance

Architecture should protect the business model **without hiding operational realities**.

For example, an abstraction does not make database performance irrelevant. You still need to understand generated SQL, indexes, transactions, locking, and query behaviour.

---

# 19. Interview Answer

A concise senior-level answer could be:

> **Clean Architecture is an approach where I keep the core business rules independent from frameworks and infrastructure. I normally separate the system into Domain, Application, Infrastructure, and Presentation layers. The Domain contains business rules and has no dependency on EF Core, ASP.NET Core, or messaging technologies. The Application layer implements use cases and defines abstractions such as repositories or external-service interfaces. Infrastructure implements those abstractions using technologies such as EF Core, SQL Server, RabbitMQ, or external APIs, while the API acts as the entry point and composition root. The key principle is that dependencies point inward toward the business core. This improves testability, maintainability, and technology replaceability, but I avoid over-engineering small CRUD applications where those boundaries provide little value.**

---

# 20. One-line summary

```text
Clean Architecture =
Protect business logic from infrastructure details
by enforcing clear boundaries and inward-pointing dependencies.
```

## Easy way to remember

```text
Domain         = What are the business rules?
Application    = What does the system do?
Infrastructure = How do we technically do it?
API            = How does the outside world access it?
```

And the golden rule:

> **Business logic should not depend on technical implementation details.**
