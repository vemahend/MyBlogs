# 32. How do you design for scalability?

**Technology:** Architecture and Design

**Source question:** 32. How do you design for scalability?

## 1. What is it?

Designing for scalability means building a system that can handle more users, requests, and data without becoming too slow or unreliable.

Scalability is not only about adding more servers. It also means finding and removing bottlenecks in the application, database, network, and external services. A good design normally scales horizontally, by adding more application instances, and scales individual components only when needed.

## 2. Why is it important?

A system may work well with 100 users but fail when traffic grows to 100,000 users or suddenly increases during a busy period. Slow responses, database timeouts, exhausted connection pools, and message backlogs can all affect customers and revenue.

Architects need scalability so that capacity can grow in a controlled and cost-effective way. The goal is not unlimited scale. The goal is to meet measured targets such as expected requests per second, response time, availability, and recovery time, with enough headroom for traffic peaks.

## 3. How does it work?

I normally design for scalability in this order:

1. **Define the workload.** Estimate normal and peak traffic, data volume, response-time targets, and growth. Measure rather than guess where possible.
2. **Keep application instances stateless.** Store shared session or workflow state in a database or distributed cache. Any load-balanced instance can then handle the next request.
3. **Scale out behind a load balancer.** Add or remove API instances based on useful signals such as request rate, latency, CPU, or queue depth.
4. **Reduce repeated work.** Cache safe, frequently read data, use pagination, compress responses, and avoid unnecessary calls between services.
5. **Protect the database.** Create suitable indexes, use efficient queries, keep transactions short, and use read replicas or partitioning only when measurements justify them.
6. **Move slow work out of the request path.** Put suitable work on a durable queue and let independently scalable workers process it. The user receives a job or accepted response instead of waiting.
7. **Control overload.** Apply timeouts, cancellation, rate limits, bounded retries with jitter, circuit breakers, and backpressure. Dependencies must not be overwhelmed.
8. **Observe and test.** Track throughput, latency percentiles, errors, saturation, cache hit rate, database performance, and queue age. Load-test expected peaks and failure cases before release.

Different parts should scale independently. For example, payment APIs may need more instances while report workers need more memory. Scaling everything together usually wastes money.

## 4. Practical example

Consider a bank statement service. Most customers request recent transactions, but generating a multi-year PDF is expensive.

Recent transaction requests go to stateless ASP.NET Core API instances behind a load balancer. The API reads common account summary data from a distributed cache and queries an indexed, paginated database view when the cache misses. It never stores customer session state in local memory.

For a large PDF, the API creates an idempotent job in a durable queue and returns `202 Accepted` with a job ID. Worker instances generate the document, save it in secure object storage, and update the job status. Workers scale based on queue depth. Per-customer rate limits and bounded queues stop one customer or a sudden traffic spike from exhausting the whole platform.

## 5. Scenario-based interview answer

**Problem:** “In one payment platform, month-end traffic caused high API latency and database timeouts. The API also generated receipts synchronously, so request threads stayed busy while a third-party document service responded.”

**Decision:** “I first used traces and load tests to identify the real bottlenecks. I decided to keep the API stateless and scale it horizontally, reduce repeated database reads, and move receipt generation out of the payment request. I did not make payment processing eventually consistent: the payment result still had to be saved reliably before we acknowledged success.”

**Implementation:** “We added the required indexes and pagination, cached safe reference data in Redis, and published receipt work through a durable queue using the transactional outbox pattern. Consumers were idempotent because a message can be delivered more than once. We added timeouts, limited retries with jitter, rate limiting, and autoscaling based on API latency and queue depth. Dashboards showed p95 and p99 latency, errors, database saturation, and the age of the oldest message.”

**Result:** “The payment path became shorter, API instances could be added safely, and receipt workers scaled independently. Peak response time improved and a slow document provider no longer caused the payment API to run out of resources. I would describe this as measured scalability, not simply adding servers.”

## 6. Code example

This ASP.NET Core example uses a distributed cache and pagination. It is compatible with currently supported ASP.NET Core versions that provide `IDistributedCache`, including .NET 8 and later.

```csharp
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

app.MapGet("/accounts/{accountId:guid}/transactions",
    async (Guid accountId, int page, BankingDbContext db,
           IDistributedCache cache, CancellationToken cancellationToken) =>
    {
        page = Math.Max(page, 1);
        const int pageSize = 50;
        var cacheKey = $"transactions:{accountId}:page:{page}";

        var cached = await cache.GetStringAsync(cacheKey, cancellationToken);
        if (cached is not null)
        {
            return Results.Content(cached, "application/json");
        }

        var transactions = await db.Transactions
            .AsNoTracking()
            .Where(x => x.AccountId == accountId)
            .OrderByDescending(x => x.BookedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new { x.Id, x.BookedAtUtc, x.Amount, x.Description })
            .ToListAsync(cancellationToken);

        var json = JsonSerializer.Serialize(transactions);
        await cache.SetStringAsync(
            cacheKey,
            json,
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30)
            },
            cancellationToken);

        return Results.Content(json, "application/json");
    });
```

`AsNoTracking` avoids change-tracking work for a read-only query. Pagination limits the amount of data read and returned. `IDistributedCache` shares cached results across API instances, unlike an in-process dictionary. The cancellation token stops wasted work if the client disconnects or the request times out.

In production, the database should have an index that supports the account filter and date ordering. Authorization must also verify that the caller owns the account. Cache invalidation and protection against many simultaneous misses must be designed for the required freshness and traffic level.

## 7. Common mistakes

- Adding servers before measuring the bottleneck. A locked table or slow dependency may remain the limit.
- Keeping session, files, or workflow state in one API instance, which breaks load balancing and failover.
- Treating caching as the complete solution and ignoring stale data, invalidation, cache stampedes, and cache failure.
- Making every operation asynchronous even when the business needs an immediate, consistent result.
- Using an in-memory queue for important work. Jobs can be lost during a restart and cannot be shared across instances.
- Retrying without limits or jitter. Retries can multiply load during an outage.
- Ignoring idempotency in APIs and message consumers, causing duplicate payments or side effects.
- Fetching unbounded data or relying on missing database indexes.
- Scaling only on average CPU while ignoring p99 latency, queue age, connection pools, and database saturation.
- Designing for an imagined global scale too early, which adds cost and complexity without evidence.

## 8. Follow-up interview questions

### What is the difference between vertical and horizontal scaling?

Vertical scaling gives one machine more CPU, memory, or storage. Horizontal scaling adds more instances and distributes work between them. Horizontal scaling usually offers better resilience, but it requires stateless services or shared state and careful coordination.

### How do you know what part of a system to scale?

Use load tests, metrics, traces, and database query analysis. Look for the saturated resource and correlate it with throughput and p95/p99 latency. Scale or optimize that component, then test again because the bottleneck may move.

### When would you use a queue to improve scalability?

Use a durable queue when work can happen after the request, traffic must be buffered, or workers need to scale independently. Examples include receipt generation and notifications. Do not use it to hide a result that must be committed before the user receives success.
