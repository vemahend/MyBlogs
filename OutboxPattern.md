# Outbox Pattern: How to Keep Database Changes and Events Consistent

Outbox Pattern: How to Keep Database Changes and Events Consistent

In a microservices or event-driven architecture, a common problem is:

> **What happens if the database update succeeds, but publishing the event to RabbitMQ, Azure Service Bus, or Kafka fails?**

The **Outbox Pattern** solves this problem by ensuring that a database change and the intention to publish an event are saved **atomically in the same database transaction**.

---

## The Problem

Imagine an **Order Service**.

When a customer places an order, we need to:

1. Save the order in the database.
2. Publish an `OrderCreated` event.
3. Other services, such as Payment and Notification, consume the event.

A simple implementation might look conceptually like:

```csharp
await SaveOrder(order);

await messageBus.PublishAsync(new OrderCreated(order.Id));
```

This looks fine, but there is an important failure scenario.

Suppose:

```text
1. Order saved successfully       ✅
2. Database transaction committed ✅
3. RabbitMQ becomes unavailable   ❌
4. OrderCreated event not sent    ❌
```

Now the database says:

```text
Order #1001 exists
```

but the Payment Service never receives:

```text
OrderCreated #1001
```

The systems have become inconsistent.

---

# Why Can't We Just Use a Database Transaction?

A normal database transaction can protect database operations:

```text
BEGIN TRANSACTION

Insert Order
Update Inventory

COMMIT
```

But RabbitMQ, Kafka, or another message broker is normally a **different system**.

You cannot simply assume:

```text
BEGIN TRANSACTION

Insert into SQL Server
Publish to RabbitMQ

COMMIT
```

will behave like one local database transaction.

This creates what is often called the **dual-write problem**:

```text
Database Write
      +
Message Broker Write
```

We need both operations to succeed logically, but they happen in two different systems.

---

# The Outbox Pattern

Instead of immediately publishing the message to the broker, we first save the message into an **Outbox table in the same database**.

For example:

```text
Orders
-----------------------
Id      Status
1001    Created


OutboxMessages
------------------------------------------------
Id      EventType       Payload        Processed
501     OrderCreated    {...}          false
```

The important part is that both inserts happen inside the **same database transaction**.

```text
BEGIN TRANSACTION

    Insert Order
    Insert OutboxMessage

COMMIT
```

Therefore:

```text
Order saved + Outbox message saved
              OR
Neither saved
```

This is the key idea behind the Outbox Pattern.

---

# Complete Flow

Suppose the customer creates an order.

### Step 1 — API receives the request

```text
POST /orders
```

The Order Service creates:

```text
Order #1001
```

and an event:

```text
OrderCreated
{
    OrderId: 1001
}
```

---

### Step 2 — Start database transaction

The service starts a local database transaction.

```text
BEGIN TRANSACTION
```

---

### Step 3 — Save business data

The order is inserted:

```text
Orders

Id      Status
----------------
1001    Created
```

---

### Step 4 — Save the event to Outbox

Instead of publishing directly to RabbitMQ, we save:

```text
OutboxMessages

Id:        501
Type:      OrderCreated
Payload:   { "orderId": 1001 }
Processed: false
```

---

### Step 5 — Commit

Both operations are committed together.

```text
COMMIT
```

Now we have:

```text
Database
   |
   |--- Orders
   |      └── Order #1001
   |
   └--- OutboxMessages
          └── OrderCreated
```

Even if RabbitMQ is currently unavailable, we haven't lost the event.

---

# How Does the Event Reach RabbitMQ?

Usually, a background worker or separate publisher continuously checks the Outbox table.

```text
        SQL Database
             |
      OutboxMessages
             |
             ↓
      Background Worker
             |
             ↓
         RabbitMQ
             |
             ↓
      Payment Service
```

The worker might periodically find messages where:

```text
Processed = false
```

Then:

```text
Read Outbox message
        ↓
Publish to RabbitMQ
        ↓
Mark message processed
```

---

# What If RabbitMQ Is Down?

This is where the pattern becomes useful.

Suppose:

```text
Order saved                ✅
Outbox message saved       ✅
RabbitMQ unavailable       ❌
```

Nothing is lost.

The Outbox still contains:

```text
OrderCreated
Processed = false
```

The worker can retry later:

```text
RabbitMQ unavailable
        ↓
Wait
        ↓
Retry
        ↓
RabbitMQ available
        ↓
Publish successfully
```

This provides **eventual consistency** between the database and the messaging system.

---

# But There Is Another Important Problem

Suppose the worker does this:

```text
1. Read Outbox message
2. Publish to RabbitMQ      ✅
3. RabbitMQ receives event  ✅
4. Worker crashes           ❌
5. Processed flag never updated
```

When the worker restarts, it sees:

```text
Processed = false
```

and publishes the event again.

Now RabbitMQ may receive:

```text
OrderCreated #1001
OrderCreated #1001
```

Therefore, the Outbox Pattern normally provides **at-least-once delivery**, not guaranteed exactly-once processing.

This means consumers should be **idempotent**.

For example, the Payment Service could store the processed `EventId`.

```text
ProcessedEvents

EventId
-------
501
```

When another event arrives:

```text
Have I already processed EventId 501?

YES → Ignore it
NO  → Process it
```

This prevents duplicate events from creating duplicate business operations.

---

# Typical Outbox Table

A practical Outbox table might contain:

```text
OutboxMessages
------------------------------------------
Id
EventType
Payload
CreatedAt
ProcessedAt
RetryCount
Status
```

For example:

```text
Id:          501
EventType:   OrderCreated
Payload:     {"orderId":1001}
CreatedAt:   2026-08-09 08:00
ProcessedAt: NULL
RetryCount:  0
Status:      Pending
```

After successful publishing:

```text
Status:      Published
ProcessedAt: 2026-08-09 08:01
```

---

# Outbox Pattern Architecture

The overall architecture looks like this:

```text
                 Order API
                     |
                     ↓
              Order Service
                     |
              SAME TRANSACTION
               /           \
              ↓             ↓
         Orders Table   Outbox Table
                            |
                            ↓
                    Outbox Publisher
                            |
                            ↓
                        RabbitMQ
                       /        \
                      ↓          ↓
                 Payment      Notification
                 Service        Service
```

The critical point is:

> **The business data and Outbox event must be written using the same local database transaction.**

Otherwise, we simply move the consistency problem somewhere else.

---

# Outbox vs Direct Publishing

Without Outbox:

```text
Save Order
    ↓
COMMIT
    ↓
Publish Event
    ↓
RabbitMQ DOWN ❌

Event lost
```

With Outbox:

```text
BEGIN TRANSACTION
       ↓
Save Order
       +
Save Outbox Event
       ↓
COMMIT
       ↓
Outbox Worker
       ↓
Publish
       ↓
RabbitMQ DOWN ❌
       ↓
Retry later
       ↓
RabbitMQ UP
       ↓
Published ✅
```

---

# Why Is the Outbox Pattern Useful?

The main benefits are:

* **Prevents lost events** when the database succeeds but the message broker fails.
* **Avoids distributed transactions** between your database and message broker.
* **Provides reliable event publishing** through retries.
* **Supports eventual consistency** between microservices.
* **Works well with event-driven architectures** using RabbitMQ, Kafka, Azure Service Bus, AWS messaging services, etc.
* **Separates the business transaction from broker availability** — the API does not necessarily have to wait for the broker.

There are trade-offs as well. You need an Outbox table, a background publisher, retry/error handling, cleanup or archiving of old messages, monitoring, and idempotent consumers.

---

# Outbox Pattern vs Saga Pattern

These two patterns solve different problems.

**Outbox Pattern**

Solves reliable communication between:

```text
Database → Message Broker
```

It answers:

> "How do I make sure an event isn't lost after changing my database?"

**Saga Pattern**

Coordinates a business transaction across multiple services.

For example:

```text
Create Order
    ↓
Take Payment
    ↓
Reserve Inventory
    ↓
Arrange Shipment
```

If payment succeeds but inventory fails, the Saga may execute a compensating action such as refunding the payment.

In real microservice architectures, **Saga and Outbox are often used together**.

---

# Interview Answer

If an interviewer asks:

**"What is the Outbox Pattern and why is it useful?"**

A strong answer would be:

> The Outbox Pattern solves the dual-write problem in event-driven systems. Instead of updating the database and publishing an event to a message broker separately, we save the business data and the event in an Outbox table within the same local database transaction. A background worker later reads the Outbox and publishes the event to RabbitMQ, Kafka, or another broker. If the broker is temporarily unavailable, the event remains in the Outbox and can be retried, preventing lost events and providing eventual consistency. Because publishing and marking the Outbox record as processed are still separate operations, duplicate delivery is possible, so consumers should generally be idempotent.

## One-Line Summary

**Outbox Pattern = save business data + event atomically in the same database transaction, then publish the event asynchronously and retry safely if publishing fails.**
