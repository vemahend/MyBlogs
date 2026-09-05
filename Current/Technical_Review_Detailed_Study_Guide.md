# Technical Review — Detailed Study Guide

**Likely format:** Collaborative code review 
**Candidate profile:** C#/.NET, React/Angular, SQL Server, microservices, messaging, production support and technical mentoring

---

## 1. What Company is likely evaluating

This is unlikely to be a test of how many defects you can list. A senior engineer is expected to understand the intended behaviour, identify the highest risks, explain trade-offs and work constructively with the team.

The role is connected to the replacement of OSPRI's NAIT agricultural traceability system. The advertised technology and architecture include ASP.NET Core, React/TypeScript/Next.js, PostgreSQL/PostGIS, Cosmos DB, CQRS, Event Sourcing, Azure Service Bus, OAuth/OIDC and Azure. The system is nationally important, so correctness, auditability, availability, security and handling duplicate or concurrent operations matter.

They are likely to assess whether you can:

- understand unfamiliar code and clarify missing requirements;
- separate correctness and security blockers from maintainability suggestions;
- reason about concurrent requests and distributed failure;
- review both backend and frontend behaviour;
- propose focused tests rather than saying only "add unit tests";
- explain alternatives and avoid unnecessary complexity;
- communicate respectfully while challenging assumptions;
- connect technical findings to user and business impact.

### A strong opening statement

> Before reviewing individual lines, I would confirm the expected behaviour and the important invariants. Then I would trace the request end to end: validation, authentication and authorization, business logic, database changes, message publication, response handling and the React caller. I would prioritise correctness, security and data-integrity problems before maintainability or style suggestions.

---

## 2. A repeatable code-review method

Use this sequence even when the code is unfamiliar.

### Step 1: Clarify the behaviour

Ask questions such as:

- What business operation does this code perform?
- What must always remain true?
- Can the same request be submitted twice?
- Can two users update the same animal or movement simultaneously?
- Is the operation synchronous, asynchronous or eventually consistent?
- What response should the caller receive for validation failure, conflict, duplicate submission or dependency failure?
- Is there an audit or regulatory requirement?
- Which service owns the data?

For an animal-movement example, possible invariants are:

- an animal cannot be active at two locations at the same time;
- a movement must not be recorded twice;
- a user must be authorized for the source property;
- every accepted movement must have an audit trail;
- an integration event must eventually be published exactly once logically, even if it is delivered more than once physically.

### Step 2: Walk through the execution path

Explain what the code currently does without judging it immediately. Follow inputs through validation, authorization, persistence, external calls and output. Mention failure points and shared state.

### Step 3: Identify findings by severity

Use clear categories:

| Category | Meaning | Examples |
|---|---|---|
| Blocker | Can cause incorrect data, security exposure, data loss or serious production failure | Missing authorization, race condition, partial database/message update |
| Important | Significant reliability, performance or maintainability risk | Unbounded query, missing cancellation, repeated remote calls |
| Suggestion | Improves clarity or design without being required for correctness | Naming, extraction of a small method, minor refactoring |

### Step 4: Propose the smallest safe fix

Describe why the change is necessary, what it protects and what it costs. Avoid introducing CQRS, Event Sourcing, a message broker or a new abstraction merely because the role uses them elsewhere.

### Step 5: Explain verification

For every blocker, name at least one focused test. Include concurrency and failure-path tests when relevant.

---

## 3. Likely review scenario

Imagine an endpoint that records the transfer of an animal between properties:

```csharp
[HttpPost("animals/{animalId}/movements")]
public async Task<IActionResult> MoveAnimal(
    Guid animalId,
    MoveAnimalRequest request)
{
    var animal = await _db.Animals.FindAsync(animalId);

    if (animal == null)
        return NotFound();

    animal.LocationId = request.ToLocationId;

    _db.AnimalMovements.Add(new AnimalMovement
    {
        AnimalId = animalId,
        FromLocationId = animal.LocationId,
        ToLocationId = request.ToLocationId,
        MovedAt = DateTime.Now
    });

    await _db.SaveChangesAsync();
    await _messageBus.PublishAsync(new AnimalMoved(animalId, request.ToLocationId));

    return Ok();
}
```

Do not Company into rewriting it. First explain the intended flow, then surface the main risks.

### Serious findings

1. **Incorrect audit data:** `animal.LocationId` is changed before `FromLocationId` is assigned, so the movement may record the destination as both source and destination.
2. **Missing authentication/authorization:** finding an animal does not prove that the caller may move it or act for the source property.
3. **Race condition:** two concurrent requests can read the same state and both create conflicting movements; last write wins.
4. **No idempotency protection:** retrying after a timeout can create a duplicate movement.
5. **Dual-write failure:** the database commit can succeed and message publication can fail, leaving downstream systems unaware.
6. **Weak validation:** destination, source relationship and invalid same-location movement are not checked.
7. **Local time:** `DateTime.Now` is ambiguous across hosts and unsuitable for consistent auditing; use a clock abstraction producing UTC.
8. **No cancellation propagation:** request cancellation is not passed through database and broker operations.

### Suggested review wording

> My first blocker is data integrity. The current assignment loses the original location before the audit record is created. I would capture and validate the source first. The larger blocker is concurrency: two requests can both observe the same current location and both succeed. We need the database write to enforce the expected previous state, not only rely on an earlier read.

---

## 4. ASP.NET Core and .NET review points

### Controller responsibility

A controller should normally deal with HTTP concerns: binding, authentication context, calling an application use case and mapping results to responses. Business rules and persistence orchestration belong in an application/domain service or command handler.

Do not claim that every controller with several lines is automatically wrong. Extraction is valuable when it improves testing, reuse, transaction boundaries or clarity.

Good explanation:

> I would keep the controller thin, but thinness is not the goal by itself. The important point is placing the transaction and business invariant in a use-case boundary that can be tested without HTTP details.

### Dependency injection lifetimes

- `DbContext` is normally scoped per request/use case.
- A singleton must not capture a scoped `DbContext` or other non-thread-safe state.
- Transient is appropriate for lightweight stateless services, but it does not automatically make a dependency thread-safe.
- Avoid service-locator calls such as resolving arbitrary dependencies from `IServiceProvider` inside business logic.

### Async and cancellation

Check for:

- `.Result`, `.Wait()` or sync-over-async;
- missing `await` or fire-and-forget work;
- sequential independent I/O that could safely run concurrently;
- shared `DbContext` operations started concurrently—it is not thread-safe;
- missing `CancellationToken` propagation;
- treating cancellation as an ordinary server error.

Cancellation does not roll back work that has already committed. The server still needs idempotency and transactional protection.

### Validation and HTTP semantics

Differentiate syntactic validation from business validation:

- malformed ID, missing field or invalid range → usually `400 Bad Request`;
- unauthenticated caller → `401 Unauthorized`;
- authenticated but not permitted → `403 Forbidden`;
- missing resource → `404 Not Found`;
- state/version conflict or insufficient capacity → `409 Conflict`;
- successful create → often `201 Created` with location;
- accepted asynchronous work → `202 Accepted` with operation/status reference.

Use consistent error responses, ideally Problem Details. Do not expose exception messages, SQL details or personal data.

### Exception handling and observability

Prefer central exception middleware or an exception handler over repeated broad `try/catch` blocks. Catch locally only when the code can recover, add relevant context or translate a known exception.

Logs should include correlation/trace ID and safe business identifiers, but avoid secrets, tokens and sensitive data. Metrics and traces should show latency, error rate, retries, conflict rate, outbox backlog and message-processing failures.

### EF Core and database access

Look for:

- N+1 queries;
- loading full entities when projection would suffice;
- missing `AsNoTracking()` for read-only queries;
- unbounded `ToListAsync()`;
- missing indexes for filter/join columns;
- client-side evaluation or early `AsEnumerable()`;
- multiple `SaveChangesAsync()` calls that create partial state;
- a read-check-write sequence that is unsafe under concurrency;
- using one `DbContext` from multiple parallel tasks.

`AsNoTracking()` is a performance choice, not a universal rule. Tracking is required when entities will be modified through that context.

---

## 5. Concurrency: the most important reasoning area

### The classic race condition

Suppose two requests do this:

1. Read animal at Location A.
2. Confirm it can be moved.
3. Change it to different destinations.
4. Save.

Both requests can pass the check before either commits. A normal `if` statement or status check is not concurrency protection.

### Optimistic concurrency

Add a version/concurrency token. The update includes the version originally read:

```sql
UPDATE Animals
SET LocationId = @toLocationId,
    Version = Version + 1
WHERE Id = @animalId
  AND Version = @expectedVersion;
```

Exactly one request should affect a row. If the affected-row count is zero, the state changed or the animal does not exist. Return a conflict or reload and re-evaluate.

EF Core can use a row version/concurrency token and throw `DbUpdateConcurrencyException` when the expected version no longer matches.

Best when:

- conflicts are relatively uncommon;
- operations should not hold database locks during user or network delays;
- the client or use case can handle a conflict clearly.

Important nuance: a blind automatic retry may be wrong. If the business command was "move from A to B," retrying after another request moved it to C changes the meaning. Reload, revalidate the invariant and retry only when that remains safe.

### Atomic conditional update

For a simple state transition, use a single conditional database statement:

```sql
UPDATE Animals
SET LocationId = @toLocationId
WHERE Id = @animalId
  AND LocationId = @expectedFromLocationId;
```

This is often simpler than loading and locking an entity. The affected-row count becomes the concurrency result.

### Pessimistic locking

A transaction locks the relevant row while the operation completes. A competing request waits or times out.

This prevents simultaneous modification but does not decide business intent. After waiting, the second operation must still validate the new state; it should not automatically overwrite the first result.

Trade-offs:

- longer locks reduce throughput;
- inconsistent lock ordering can cause deadlocks;
- never hold a database transaction open while waiting for an external API or broker;
- database-specific syntax and behaviour reduce portability.

Use it when conflicts are frequent and the operation is short, contained and requires strict serialization.

### Isolation levels

Transactions provide atomicity, but the default isolation level does not automatically protect an application-level read-check-write invariant. Understand what rows/ranges are locked and whether phantom reads matter. Serializable isolation is strong but can reduce concurrency and increase retries/deadlocks.

### Distributed concurrency

A process-local `lock` or in-memory flag protects only one application instance. In a scaled service, requests can land on different instances. Prefer enforcing invariants in the authoritative database or aggregate/event stream.

### Strong interview answer

> The status check is necessary for business validation, but it is not sufficient because two requests can pass it together. I would make the write conditional on the version or expected current state. One update succeeds; the other receives a conflict and must reload and revalidate. I would choose pessimistic locking only if contention is high and the transaction is short. A process-level lock would not protect multiple service instances.

---

## 6. Idempotency and duplicate requests

### Why duplicates happen

A client may time out after the server commits but before the response arrives. It cannot know whether the operation succeeded, so it retries. Gateways, queues and consumers may also retry.

Idempotency means repeating the same logical operation has the same intended effect. It is not the same as concurrency control:

- idempotency protects against replay of the same logical request;
- concurrency control protects competing state changes, including different requests.

Many important operations require both.

### HTTP idempotency key pattern

The caller generates a stable operation ID/idempotency key for one logical movement. The server stores it with:

- caller/tenant scope;
- request fingerprint or immutable command data;
- status such as Processing, Completed or Failed;
- resulting resource or response;
- created/expiry time.

Enforce a unique database constraint on the correctly scoped key. An application-level "does it exist?" query followed by insert is still racy.

Behaviour:

- new key + valid request → process once;
- same key + same payload after completion → return the recorded outcome;
- same key + different payload → reject as a conflict/misuse;
- same key while processing → return a defined in-progress response or coordinate safely.

Do not rely only on the React button being disabled. Frontend prevention improves UX; backend enforcement protects correctness.

### Natural business key

Sometimes the domain already has an operation ID, movement reference or event ID. Prefer that stable identifier over inventing a second key if its uniqueness and scope truly represent the logical operation.

### Message consumer idempotency: inbox pattern

With at-least-once delivery, a consumer may receive the same message more than once. Store the message ID in an inbox/processed-message table under a unique constraint in the same local transaction as the business change.

Typical sequence:

1. Begin transaction.
2. Insert message ID into inbox.
3. If the unique key already exists, treat it as already processed.
4. Apply business changes.
5. Commit.
6. Acknowledge the broker message.

Processed inbox records are normally retained according to an audit/retention policy and cleaned up safely later; they must not be removed before duplicate delivery is no longer possible.

---

## 7. Transactions, messaging and the outbox pattern

### The dual-write problem

This is unsafe:

1. Save movement in PostgreSQL.
2. Publish `AnimalMoved` to Azure Service Bus.

If step 1 succeeds and step 2 fails, the service says the movement exists but downstream systems never hear about it. Publishing first reverses the inconsistency: consumers may act on data that later fails to commit.

### Transactional outbox

Write the domain change and an outbox record in the same database transaction. A background dispatcher publishes pending outbox messages, then marks them published.

This guarantees that an event intended for publication is durably recorded with the business change. It does not guarantee that the broker receives it only once. A crash after publish but before marking the record can cause another publish; therefore consumers still need idempotency/inbox handling.

Suggested wording:

> I would not roll back a successfully committed business operation merely because the broker is unavailable. I would store the integration event in an outbox within the same transaction. A worker retries publication with backoff. Because delivery can still be duplicated, consumers must be idempotent.

### Retry, backoff and dead-lettering

- Retry only transient failures.
- Use exponential backoff with jitter to avoid synchronized retry storms.
- Set a maximum immediate retry count.
- Move poison messages to a dead-letter queue with diagnostics and an operational recovery process.
- Monitor outbox age/backlog, retry count and dead-letter volume.
- A circuit breaker prevents repeatedly calling a dependency known to be unhealthy; it does not preserve an unpublished event. The outbox handles durability.

---

## 8. CQRS, Event Sourcing and domain modelling

### CQRS

CQRS separates commands that change state from queries that read state. It can be as simple as distinct handlers and models; it does not require separate databases, a broker or Event Sourcing.

Benefits:

- command code focuses on invariants;
- read models can be optimized for UI queries;
- responsibilities and authorization can be clearer.

Costs:

- more types and flow to trace;
- possible duplication;
- eventual consistency when read and write stores differ.

Use it when domain complexity or independent read/write needs justify it. A CRUD administration screen may not need elaborate CQRS infrastructure.

### Event Sourcing

Event Sourcing stores immutable domain events as the source of truth. Current state is rebuilt by replaying events, commonly with snapshots for performance.

For an animal aggregate, events might include:

- `AnimalRegistered`
- `AnimalMoved`
- `AnimalStatusChanged`

The append operation supplies an expected stream version. If another command appended first, the version no longer matches and the write is rejected. This provides optimistic concurrency at the aggregate boundary.

Benefits:

- complete audit history;
- ability to reconstruct state;
- domain changes are explicit;
- useful for traceability.

Costs and review points:

- event schemas are effectively permanent contracts;
- old events need upcasting/version-handling;
- projections can lag or fail and must be rebuildable;
- deletes and sensitive data require careful design;
- cross-aggregate invariants and eventual consistency are harder;
- large streams may need snapshots, but snapshots are an optimization, not the truth.

Do not edit old events in place merely to match a new class. Preserve history and evolve readers/events deliberately.

### Aggregate boundary

An aggregate is a consistency boundary, not merely a group of related tables. Keep it small enough to avoid contention while including the state required to enforce immediate invariants. Rules spanning aggregates may need coordination, reservations, a process manager/saga or eventual consistency.

### Strong trade-off statement

> CQRS can improve command and query clarity without Event Sourcing. I would use Event Sourcing where historical reconstruction and auditable state transitions provide real business value, as they may for national animal traceability. I would not recommend it for every supporting table because event evolution, projections and operational complexity are substantial.

---

## 9. Microservice and API architecture

### Service boundaries and ownership

Prefer boundaries based on business capabilities rather than technical layers. One service should own writes to its data. Other services integrate through APIs or events rather than directly updating its tables.

Review questions:

- Does this service own the animal or movement state it changes?
- Is the API leaking its persistence model?
- Is a distributed transaction being assumed?
- Can the operation tolerate eventual consistency?
- Is the event a domain event internal to the service or a stable integration event?

### Resilience

Use timeouts for every remote dependency. Retrying non-idempotent calls without an operation ID can duplicate effects. Combine retries, circuit breakers and bulkhead/concurrency limits according to the failure mode; do not stack policies without understanding their multiplied attempt count.

### Caching

Do not cache authorization decisions or changing animal status without a clear invalidation and staleness policy. Cache-aside can reduce read load, but the authoritative write path must still enforce invariants.

### Security

Authentication answers who the caller is. Authorization answers whether that identity can perform this action on this resource.

Check:

- OAuth/OIDC flow appropriate for browser/public client—typically Authorization Code with PKCE;
- token validation: issuer, audience, signature and lifetime;
- policy/resource-based authorization, not just a broad role;
- tenant/property ownership checks on the server;
- secure token handling and no token logging;
- input validation and parameterized queries;
- least-privilege managed identities for service-to-service access;
- audit logs for sensitive actions;
- CORS is not authorization and does not protect an API from non-browser callers.

---

## 10. React, TypeScript and Next.js review points

### State ownership

Keep state as close as practical to the components that need it. Distinguish:

- server state: fetched data, loading, error, invalidation and caching;
- UI state: selected tab, modal visibility, form draft;
- URL state: filters or identifiers that should survive navigation/share;
- global client state: only truly cross-cutting state.

Copying props or query data into local state can create two sources of truth.

### `useEffect`

Effects synchronize the component with something external, such as a subscription, timer, DOM API or network request. They should not be used to calculate values that can be derived during render.

Review for:

- missing or incorrect dependency arrays;
- unstable object/function dependencies causing repeated effects;
- stale closures;
- no cleanup for subscriptions/timers;
- fetch responses updating state after the request is superseded;
- effects that set state and cause loops;
- duplicate fetching when a framework/server-state mechanism is more appropriate.

When fetching in an effect, use cancellation or ignore stale results. In Next.js, consider whether server-side/framework data fetching gives better performance and simpler loading behaviour.

### Forms and duplicate submissions

- Use controlled or well-managed form state.
- Validate for user experience in the browser and again for authority on the server.
- Disable or show progress after submission, but do not rely on this for idempotency.
- Preserve one operation ID across retries of the same logical submission.
- Show field errors, conflict errors and recoverable server errors differently.
- Avoid generating a new idempotency key automatically for every retry, because that defeats duplicate detection.

### TypeScript quality

Avoid widespread `any`, unsafe type assertions and non-null assertions that hide real states. Model discriminated states when useful:

```ts
type MovementState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; movementId: string }
  | { status: "error"; message: string; retryable: boolean };
```

Types improve compile-time safety but do not validate untrusted runtime JSON. Validate important API payloads at boundaries.

### Rendering and performance

Do not recommend `useMemo`, `useCallback` or `React.memo` everywhere. First identify an actual render or computation problem. Stable keys must represent item identity; array indexes are risky when items can be inserted, deleted or reordered.

Other checks:

- accidental large client bundles;
- waterfalls of dependent requests;
- missing pagination/virtualization for large data sets;
- expensive calculations on every render;
- images and assets not optimized;
- incorrect server/client component boundaries.

### Accessibility and UX

For a public/national platform, check semantic HTML, keyboard navigation, labels, focus handling, error announcements, colour contrast and loading feedback. Do not treat accessibility as optional polish.

### Frontend security

- Never trust authorization hidden in the UI; enforce it in the API.
- Avoid unsafe HTML rendering unless sanitized.
- Do not expose secrets in frontend configuration.
- Understand XSS risk when storing tokens in JavaScript-accessible storage.
- Use appropriate cookie protections when cookies are used; consider CSRF for cookie-authenticated state-changing requests.

---

## 11. Testing strategy

### Test pyramid with purposeful boundaries

Use the cheapest test that gives confidence in the behaviour:

- **Unit tests:** domain rules, validators, mapping and pure functions.
- **Component tests:** command handler with controlled dependencies; React component behaviour.
- **Integration tests:** real database constraints, EF mappings, transaction/outbox behaviour, authentication configuration.
- **Contract tests:** API/event compatibility between independently deployed services.
- **End-to-end tests:** a small set of high-value user journeys.

Avoid mocking EF Core so heavily that database concurrency, SQL translation and unique constraints are never exercised.

### Backend tests for animal movement

Essential cases:

1. Valid authorized move creates the movement and updates state.
2. Unknown animal returns the defined not-found result.
3. Unauthorized property user is rejected without changing data.
4. Invalid or identical destination is rejected.
5. Same idempotency key and same payload returns the original outcome.
6. Same idempotency key and different payload is rejected.
7. Two simultaneous moves with the same expected version produce exactly one success and one conflict.
8. Database rollback leaves neither movement nor outbox row.
9. Broker outage does not lose a committed outbox message.
10. Dispatcher retry can publish twice, while the consumer changes its state once.
11. Cancellation before commit causes no partial write.
12. Logs do not expose sensitive tokens or personal information.

### A meaningful concurrency test

Use a real database engine or a production-equivalent container. Arrange one animal/version, release two requests at the same time using a barrier, wait for both and assert:

- exactly one succeeds;
- exactly one conflicts;
- final state matches the successful command;
- only one logical movement/outbox record exists.

Running the same test repeatedly helps expose timing-sensitive defects. An in-memory provider may not reproduce real isolation, locking or unique-constraint behaviour.

### React tests

Test behaviour rather than implementation details:

- the form displays validation errors;
- submit uses entered values, not a hard-coded value;
- a pending state prevents accidental additional clicks;
- a retry of the same logical action retains the operation ID;
- a `409` conflict produces a useful refresh/review message;
- loading, empty, success and failure states are accessible;
- stale responses do not overwrite newer data;
- keyboard and screen-reader interaction works for critical flows.

### API and contract tests

Validate more than the status code:

- response schema and headers;
- problem details/error code;
- persisted state;
- authorization boundaries;
- idempotency behaviour;
- backward compatibility;
- performance under representative load.

### High-traffic testing

Discuss:

- realistic read/write ratios and hot aggregates;
- conflict rate, latency percentiles and throughput;
- connection-pool saturation;
- database index usage and lock duration;
- thread-pool starvation from blocking calls;
- broker lag, outbox backlog and retry storms;
- autoscaling behaviour and dependency capacity;
- backpressure rather than accepting unlimited work.

Do not simply say "add load balancing." More instances cannot repair an unsafe read-check-write race and can make it easier to reproduce.

---

## 12. How to answer common review questions

### “Walk us through this code.”

Answer in order:

1. State the endpoint/use case.
2. Trace input, validation, data access, state change, side effects and response.
3. State the expected invariant.
4. Identify failure and concurrency boundaries.
5. Then give findings.

### “What assumptions are you making?”

> I am assuming a movement is a business-significant auditable action, a caller must be authorized for the source property, duplicate retries must not create additional movements, and two conflicting movements must not both succeed. I would confirm whether the operation is expected to be immediately consistent and whether the supplied request already has a stable business operation ID.

### “What are the three most serious problems?”

For the sample scenario:

1. missing resource-level authorization;
2. concurrent conflicting updates/incorrect audit state;
3. database-and-broker dual-write inconsistency.

Idempotency may enter the top three when retries are a stated system behaviour.

### “Would you approve this pull request?”

> Not in its current form. The authorization, concurrency and dual-write issues can create security or data-integrity failures, so I would mark them as blockers. I would not block on smaller naming or refactoring suggestions. Once the blockers have focused tests and pass, I would reassess the change rather than requiring unrelated redesign.

### “What would you fix first?”

> I would first confirm and enforce authorization because an unauthorized state change is a security incident. Next I would make the state transition atomic/concurrency-safe and correct the audit data. Then I would protect message delivery with an outbox and duplicate processing with idempotency. The exact order may also depend on whether the endpoint is already externally reachable.

### “Is this necessary or over-engineering?”

> A database-enforced conditional update and unique operation key are necessary because application checks cannot protect concurrent instances. An outbox is justified when downstream delivery must survive broker outages. Event Sourcing or a new microservice would be over-engineering unless audit/reconstruction and domain boundaries require them.

### “What alternatives did you consider?”

Name options and selection criteria:

- version token vs conditional update vs pessimistic lock;
- direct publish vs outbox;
- domain operation ID vs separate idempotency key;
- synchronous orchestration vs eventual-consistency workflow;
- straightforward handler separation vs full CQRS infrastructure.

### “How does it behave under high traffic?”

> The current read-check-write race becomes more likely, not less. Duplicate movements and lost updates may increase. Sequential database and broker calls hold resources longer, and missing limits can saturate the connection pool. I would enforce the invariant in the database/event stream, keep transactions short, make delivery durable through the outbox, measure conflicts and latency, and load-test hot-animal or hot-location scenarios.

### “How would you test the fix?”

> I would unit-test the domain rule, integration-test the real database constraint/version behaviour, run two coordinated requests against the same version, verify one success and one conflict, simulate broker failure to confirm the outbox retains the event, and redeliver the event to prove the consumer is idempotent. I would also cover the React conflict and retry experience.

---

## 13. Connect answers to your real experience

Use experience honestly; do not claim direct production ownership of a Company-specific technology you have only studied.

### Visa Spend Clarity / passkeys

Useful themes:

- ASP.NET/.NET and React in a security-sensitive financial product;
- FIDO2 library migration and Safari/browser differences;
- partner-specific feature toggles and staged rollout;
- authentication flows and short-lived access/refresh tokens;
- Playwright/manual cross-device validation;
- careful review of AI-assisted code before merging.

Possible bridge:

> In Visa Spend Clarity, security and compatibility could not be treated as frontend-only concerns. For passkeys, I considered browser behaviour, backend verification, partner-specific rollout and regression risk together. I would bring the same end-to-end thinking to an animal-traceability workflow.

### Microservices and RabbitMQ

Use your experience to discuss message delivery, retries, duplicate consumers, outbox/inbox, correlation and production support. Be clear when Azure Service Bus syntax differs while the reliability principles remain similar.

### React and .NET end-to-end work

Use Betsson/Nagarro or Visa examples to show you can trace a user action from component/form state through API validation and database/messaging behaviour.

### Mentoring and reviews

Mention that a good review gives evidence and priority, asks clarifying questions and leaves the author with an actionable path. Avoid presenting review as fault-finding.

---

## 14. Phrases that make the discussion stronger

Prefer:

- “The invariant I want the system to enforce is…”
- “This is safe in a single request but not across concurrent requests because…”
- “I would enforce this at the database or stream boundary.”
- “The unique constraint is the final protection; the earlier check improves the response only.”
- “This is a blocker because it can produce incorrect state, not because it violates my preferred style.”
- “I would confirm the requirement before choosing between these approaches.”
- “The smallest safe change is…”
- “A retry changes availability behaviour; it does not guarantee correctness.”
- “The frontend prevention improves UX, while the backend owns correctness.”
- “The outbox gives durable intent to publish; the consumer still needs idempotency.”

Avoid absolute statements such as:

- “Controllers must never contain logic.”
- “Microservices are always more scalable.”
- “CQRS requires separate databases.”
- “The outbox gives exactly-once delivery.”
- “A transaction solves concurrency.”
- “A disabled button prevents duplicates.”
- “We can just retry everything.”
- “We should add caching for performance” without measurements or invalidation rules.

---

## 15. Suggested two-hour session behaviour

### First 10 minutes

- Listen to the context and restate the intended behaviour.
- Ask about business invariants, user/tenant authorization and delivery expectations.
- Clarify whether you should review broadly first or begin with one area.

### Next 25 minutes

- Walk through the code end to end.
- Write short notes under correctness, security, reliability, performance, maintainability and tests.
- Do not interrupt the walkthrough for every naming concern.

### Main discussion

- Lead with the three biggest risks.
- Show the race condition as a two-request timeline.
- Compare alternatives and recommend the smallest suitable fix.
- Explain testing immediately after each important change.
- Invite team context: “Is there already an outbox/idempotency component elsewhere in the solution?”

### Final section

- Summarise blockers, important improvements and suggestions.
- State whether you would approve.
- Explain what evidence would change your decision.
- Mention one or two longer-term observations without expanding the scope of the PR.

---

## 16. Preparation plan before the brief arrives

### Tonight / first study block

1. Rehearse the review method and severity classification.
2. Explain optimistic concurrency, atomic updates and pessimistic locking aloud.
3. Explain idempotency, outbox and inbox without notes.
4. Review ASP.NET cancellation, DI lifetime and EF Core query issues.

### Second study block

1. Review `useEffect`, state ownership, form retries and TypeScript boundary validation.
2. Rehearse CQRS vs Event Sourcing and expected-stream-version concurrency.
3. Prepare three concise experience stories: passkey delivery, a production/reliability problem, and a design disagreement or mentoring example.

### When Company sends the brief

For each file, annotate:

- intended behaviour;
- assumptions/questions;
- invariants;
- top three risks;
- blocker vs suggestion;
- smallest safe fix;
- alternative considered;
- tests;
- high-traffic behaviour.

Do not try to redesign the whole application. Focus on the code and requirements supplied, while showing awareness of the surrounding architecture.

---

## 17. Final rapid-revision checklist

Before the session, make sure you can explain these in one or two minutes each:

- why a check-then-update sequence is racy;
- optimistic concurrency and expected version;
- when a conditional SQL update is sufficient;
- why pessimistic locking does not make the second business action valid;
- difference between idempotency and concurrency control;
- unique constraints as final duplicate protection;
- database/broker dual-write failure;
- outbox plus idempotent consumer/inbox;
- at-least-once delivery and why “exactly once” is usually a logical outcome;
- CQRS without Event Sourcing;
- event versioning and projection rebuilds;
- thin controller for a reason, not as a slogan;
- `DbContext` scoped lifetime and lack of thread safety;
- cancellation limits and committed work;
- React `useEffect` misuse and stale requests;
- frontend duplicate prevention vs backend idempotency;
- real-database concurrency tests;
- blocker, important issue and suggestion classification;
- the smallest safe fix and its alternatives;
- how your Visa passkey, React/.NET, RabbitMQ and production experience support your recommendation.

### Closing mindset

The strongest answer is rarely the most complicated architecture. A strong senior review makes the requirement explicit, protects the invariant at the correct boundary, anticipates failure and concurrency, proves the fix with focused tests and communicates the decision in a way the team can act on.
