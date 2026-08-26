# Cloud-Native .NET Full-Stack Interview Question Bank

Questions only. Answers will be prepared separately.

## Priority 1 — OAuth 2.0 and OpenID Connect

1. What problem does OAuth 2.0 solve, and what does it not solve?
2. What is the difference between OAuth 2.0 and OpenID Connect?
3. Explain the roles of resource owner, client, authorization server, and resource server.
4. What is an access token, and who should consume it?
5. What is an ID token, and why must an API not use it as an access token?
6. What is a refresh token, and when should one be issued?
7. Explain the Authorization Code flow step by step.
8. Why is Authorization Code with PKCE recommended for browser and mobile applications?
9. How does PKCE prevent authorization-code interception?
10. What are the code verifier and code challenge?
11. When should you use the Client Credentials flow?
12. Why is Client Credentials unsuitable for representing an end user?
13. Why are the Implicit and Resource Owner Password flows no longer recommended?
14. How would you secure a React or Angular SPA using OAuth 2.0 and OpenID Connect?
15. Compare a browser-only SPA token model with the Backend-for-Frontend pattern.
16. Where should a browser application store tokens, and what are the trade-offs?
17. How do secure, HttpOnly, SameSite cookies change the threat model?
18. How do XSS and CSRF risks differ in token-based and cookie-based applications?
19. What are scopes, and how should you design them?
20. What is the difference between scopes, roles, permissions, and claims?
21. How should an ASP.NET Core API validate a JWT access token?
22. Which JWT claims must be validated beyond the signature?
23. What are issuer, audience, subject, tenant, expiry, and not-before claims?
24. How does signing-key rotation work through OpenID Connect discovery and JWKS?
25. What should an API do when token validation fails?
26. What is token replay, and how can you reduce its risk?
27. What are sender-constrained tokens, DPoP, and mutual-TLS-bound tokens?
28. What is refresh-token rotation, and how does reuse detection work?
29. How do you revoke access when JWT access tokens are self-contained?
30. How do introspection and reference tokens differ from self-contained JWTs?
31. How do you implement delegated user access between downstream APIs?
32. What is the OAuth 2.0 On-Behalf-Of flow, and when would you use it?
33. How do app-only and delegated permissions differ?
34. How do consent and admin consent work?
35. How would you troubleshoot an API returning 401 with an apparently valid token?
36. How would you troubleshoot a 403 after successful authentication?
37. How do clock skew and token lifetime affect authentication reliability?
38. How do you protect client secrets and certificates in production?
39. When should a confidential client use a certificate instead of a client secret?
40. How would you test OAuth-protected APIs in unit, integration, and end-to-end tests?

## Priority 1 — Microsoft Entra ID

1. What is Microsoft Entra ID, and how is it used by applications and APIs?
2. Explain tenants, app registrations, enterprise applications, and service principals.
3. What is the relationship between an app registration and its service principal?
4. How do single-tenant and multitenant applications differ?
5. How would you design tenant isolation for a multitenant SaaS application?
6. How do Entra application roles differ from groups and delegated scopes?
7. How do you implement role-based authorization in ASP.NET Core using Entra ID?
8. When would you use policy-based authorization instead of role attributes?
9. How do Conditional Access and multifactor authentication affect an application?
10. What is Managed Identity, and what problem does it solve?
11. Compare system-assigned and user-assigned managed identities.
12. How would a containerized API use Managed Identity to access Key Vault or a database?
13. What is workload identity federation, and why is it preferable to long-lived secrets?
14. How does Microsoft Entra Workload ID integrate with AKS?
15. How would you configure Entra authentication for Azure Container Apps?
16. How do you automate app registrations, roles, scopes, and service principals safely?
17. How do you rotate credentials without downtime?
18. How do you audit sign-ins, consent, risky users, and service-principal activity?
19. How do guest users and B2B collaboration affect authorization design?
20. When would you consider External ID for customer identities?
21. How do you prevent tenant-ID or object-ID confusion in authorization logic?
22. How would you investigate intermittent authentication failures in production?

## Priority 1 — Azure API Management and Application Gateway

1. What problem does Azure API Management solve?
2. What problem does Azure Application Gateway solve?
3. Compare API Management, Application Gateway, Azure Front Door, and Azure Load Balancer.
4. Why might an architecture use Application Gateway and API Management together?
5. Which component should be internet-facing in a private API architecture?
6. How would you place API Management inside or alongside a virtual network?
7. How do private endpoints and private DNS affect APIM connectivity?
8. How would traffic flow from a client through WAF, APIM, and a containerized API?
9. Where should TLS terminate, and should TLS be re-established to each downstream hop?
10. How do you configure certificates, custom domains, and certificate rotation?
11. What does the Application Gateway Web Application Firewall protect against?
12. How would you tune WAF rules without hiding genuine attacks?
13. What is the difference between prevention and detection modes in WAF?
14. Which concerns belong in APIM policies and which belong in application code?
15. How do `validate-jwt`, rate-limit, quota, IP filtering, and CORS policies work?
16. Why is APIM validation not a replacement for authorization inside the API?
17. How do you implement OAuth 2.0 authorization with Entra ID at APIM and API layers?
18. How do subscriptions and subscription keys differ from user authentication?
19. How would you implement per-client throttling and quotas?
20. What is the difference between rate limiting, throttling, and quotas?
21. How do you version and revise APIs in APIM?
22. How do you safely transform headers, URLs, and payloads in APIM?
23. When is response caching in APIM appropriate or dangerous?
24. How do you propagate correlation and trace context through both gateways?
25. How do you prevent sensitive headers or tokens from appearing in logs?
26. How would you monitor APIM capacity, latency, failures, and policy errors?
27. How would you diagnose 502 and 504 responses across Application Gateway and APIM?
28. How do health probes work in Application Gateway, and what commonly breaks them?
29. How would you deploy APIM and gateway policy changes safely through CI/CD?
30. How do you test APIM policies before production deployment?
31. How would you design a zero-downtime rollout and rollback for gateway changes?
32. What are the cost, scaling, and availability trade-offs among APIM tiers?

## Priority 1 — CQRS

1. What is CQRS, and what problem does it solve?
2. Does CQRS require separate databases?
3. Does CQRS require event sourcing?
4. When is separating command and query models valuable?
5. When is CQRS unnecessary complexity?
6. How would you structure commands, command handlers, queries, and query handlers in .NET?
7. Where should validation and authorization occur in a CQRS pipeline?
8. How do commands differ from CRUD service methods?
9. Should command handlers return data? What are the options and trade-offs?
10. How do you enforce business invariants when multiple commands run concurrently?
11. How do optimistic concurrency and version tokens fit into CQRS?
12. How do read models become eventually consistent?
13. How should the UI behave when a write succeeds but the read model has not caught up?
14. How do you rebuild a damaged or outdated read model?
15. How do idempotency and deduplication apply to command handling?
16. What is the difference between a command, domain event, and integration event?
17. Where should domain events be dispatched relative to the database transaction?
18. How does the transactional outbox complement CQRS?
19. What are the benefits and drawbacks of using MediatR for CQRS?
20. How do you prevent handlers from becoming an anemic collection of procedural scripts?
21. How would you trace a command across handlers, database writes, and emitted events?
22. How would you unit test commands and integration test the complete CQRS flow?
23. How would you migrate an existing CRUD application toward CQRS incrementally?
24. Describe a payment-approval workflow that benefits from CQRS.

## Priority 1 — Event Sourcing

1. What is event sourcing, and how does it differ from event-driven architecture?
2. How does event sourcing differ from keeping an audit log?
3. What is an event stream?
4. What should an event contain?
5. Why must stored events be immutable?
6. How is current aggregate state reconstructed from events?
7. What is an aggregate, and how does it define a consistency boundary?
8. How do expected stream versions prevent concurrent updates?
9. What are snapshots, and when are they useful?
10. How do you evolve event schemas without breaking historical replay?
11. Compare event upcasting, versioned handlers, and migration of stored events.
12. How do you handle personally identifiable information and deletion requirements in immutable events?
13. How do encryption, crypto-shredding, and data minimization help?
14. How do projections and read models consume event streams?
15. How do you make projection handlers idempotent?
16. What happens when a projection fails halfway through processing?
17. How do checkpoints and replay support projection recovery?
18. How do you publish integration events reliably from an event-sourced system?
19. How do you prevent domain events from leaking internal implementation details?
20. How do you test aggregate behavior using Given–When–Then event tests?
21. How do you debug incorrect state produced by a long event history?
22. What operational tooling is required before adopting event sourcing?
23. When should a team avoid event sourcing?
24. How would you introduce event sourcing to only one high-value bounded context?
25. Design an event-sourced payment lifecycle including authorization, capture, reversal, and refund.

## Priority 1 — Azure Container Apps and AKS

1. Compare Azure Container Apps and Azure Kubernetes Service.
2. What decision criteria would make you choose Container Apps over AKS?
3. When does AKS provide value that Container Apps does not?
4. What are Container Apps environments, apps, revisions, and replicas?
5. How do ingress, internal ingress, and service discovery work in Container Apps?
6. How does KEDA-based scaling work in Container Apps?
7. How would you scale a worker based on queue depth?
8. What happens to in-flight requests during scale-in or revision replacement?
9. How do you perform blue/green and canary deployments with Container Apps revisions?
10. How do you manage secrets and Managed Identity in Container Apps?
11. What are AKS pods, deployments, services, ingress controllers, and namespaces?
12. How do readiness, liveness, and startup probes differ?
13. Why can poorly designed health probes cause an outage?
14. How do resource requests and limits affect scheduling and reliability?
15. How do Horizontal Pod Autoscaler, Cluster Autoscaler, and KEDA differ?
16. How do rolling updates, max surge, and disruption budgets affect availability?
17. How do you use Microsoft Entra Workload ID from an AKS workload?
18. How would you securely pull images from Azure Container Registry?
19. How do network policies and private clusters reduce attack surface?
20. How do you expose AKS workloads through Application Gateway or another ingress?
21. How do Application Gateway Ingress Controller and Application Gateway for Containers differ conceptually?
22. How do you manage application configuration separately from container images?
23. How do you handle database migrations during container deployment?
24. How do you collect logs, metrics, and traces from containerized .NET workloads?
25. How do you diagnose crash loops, image-pull failures, OOM kills, and failed probes?
26. How would you estimate and control Container Apps or AKS cost?
27. What should be included in a production Dockerfile for an ASP.NET Core API?
28. Why should containers run as non-root with a read-only filesystem where possible?
29. How do you scan images and manage base-image vulnerabilities?
30. How would you design disaster recovery for stateful and stateless container workloads?

## Modern .NET and ASP.NET Core

1. How would you structure a maintainable modern .NET solution?
2. What responsibilities belong in API, application, domain, and infrastructure layers?
3. How does dependency injection work in ASP.NET Core?
4. Explain singleton, scoped, and transient lifetimes and captive dependencies.
5. How do async and await work internally, and why does async not automatically create a thread?
6. How do you propagate CancellationToken correctly?
7. How do you design global exception handling using ProblemDetails?
8. How do you distinguish validation failures, conflicts, authorization failures, and unexpected faults?
9. How do you make a POST operation truly idempotent?
10. How do you prevent duplicate payments after an uncertain client timeout?
11. How do optimistic concurrency and database transactions differ?
12. How do you implement authorization policies rather than putting role checks in controllers?
13. How do you design pagination, filtering, and sorting safely?
14. How do you prevent over-posting and mass-assignment vulnerabilities?
15. How do you implement rate limiting in ASP.NET Core, and how does it interact with APIM?
16. How do you use HttpClientFactory and resilience handlers correctly?
17. Which HTTP operations are safe to retry?
18. How do timeout, retry, circuit-breaker, and bulkhead policies interact?
19. How do you avoid sync-over-async, thread-pool starvation, and deadlocks?
20. How do you profile and troubleshoot a slow ASP.NET Core endpoint?

## Microservices, Messaging, and Distributed Reliability

1. How do you identify service boundaries and bounded contexts?
2. When is a modular monolith preferable to microservices?
3. How do you handle a business operation spanning multiple services?
4. Compare saga orchestration and choreography.
5. How does the outbox pattern prevent lost integration events?
6. What is the inbox pattern?
7. How do you design an idempotent message consumer?
8. Why is exactly-once delivery usually an application-level illusion?
9. How do retries, exponential backoff, jitter, and dead-letter queues work together?
10. How do you handle poison messages without blocking a partition or queue?
11. How do you preserve ordering where business correctness requires it?
12. How do you version message contracts without breaking existing consumers?
13. How do you trace a request that becomes an asynchronous message flow?
14. How do you prevent cascading failures between services?
15. How do you recover from partial completion after an uncertain timeout?
16. How would you migrate a monolith incrementally using the Strangler Fig pattern?

## Data, Performance, and Consistency

1. When would you choose Entity Framework Core, Dapper, or direct database access?
2. How do tracking and no-tracking queries differ in EF Core?
3. How do you identify and fix N+1 queries?
4. How do projection and pagination reduce database load?
5. How do indexes improve reads while increasing write cost?
6. How do you read an execution plan for a slow query?
7. How do transaction isolation levels affect correctness and concurrency?
8. What causes deadlocks, and how do you prevent or recover from them?
9. How do row-version concurrency tokens work?
10. How do you design data ownership when decomposing a shared database?
11. When is eventual consistency acceptable to users?
12. How do cache-aside, write-through, and distributed caching differ?
13. How do you prevent stale or unauthorized data from leaking through caches?
14. How do you perform safe, backward-compatible database migrations?

## CI/CD, Infrastructure as Code, and Azure Operations

1. How would you build a CI/CD pipeline for a .NET API and frontend application?
2. Which checks must run before a container image can be promoted?
3. How do you promote one immutable image through environments?
4. How do you manage environment-specific configuration without rebuilding images?
5. Compare Bicep, Terraform, and ARM templates.
6. How do you structure reusable infrastructure modules?
7. How do you prevent secrets from entering source control or pipeline logs?
8. How do workload identity federation and Managed Identity improve deployment security?
9. How do you detect infrastructure drift?
10. How do you deploy APIM policies and API definitions as code?
11. How do you implement blue/green, canary, and feature-flag rollouts?
12. What metrics determine whether an automated rollout should stop or roll back?
13. How do you coordinate application and database rollback?
14. How do you design separate subscriptions, resource groups, and environments?
15. How do Azure Policy, RBAC, resource locks, and budgets support governance?
16. How do you design backup, restore, and regional disaster-recovery exercises?

## Observability and Production Support

1. What are logs, metrics, and distributed traces, and when is each most useful?
2. How do OpenTelemetry and W3C Trace Context work across APIs and messages?
3. What should a correlation ID represent, and when is a trace ID enough?
4. How do you avoid logging tokens, secrets, or personal data?
5. What service-level indicators would you define for a critical API?
6. How do SLIs, SLOs, and error budgets guide engineering decisions?
7. How would you investigate a latency increase after deployment?
8. How would you investigate intermittent 401, 403, 429, 502, and 504 responses?
9. How do you correlate Application Gateway, APIM, container, and application telemetry?
10. What alerts are actionable, and how do you prevent alert fatigue?
11. How do you create useful runbooks and operational dashboards?
12. Describe your response to a production incident affecting customer transactions.

## Full-Stack and Frontend Integration

1. How do frontend and backend teams maintain an API contract?
2. How do OpenAPI-generated clients help, and what risks do they introduce?
3. How do you model loading, empty, success, and failure states in a frontend?
4. How do you handle access-token expiry without creating retry loops?
5. What should the frontend do after receiving 401, 403, 409, 429, and 503 responses?
6. Why is frontend route protection not a security boundary?
7. How do you prevent duplicate form submissions and payment requests?
8. How do you manage state ownership in a large React or Angular application?
9. How do you prevent memory leaks and stale asynchronous updates?
10. How do you diagnose unnecessary rendering or change-detection work?
11. How do accessibility and keyboard navigation influence component design?
12. How would you roll out a breaking frontend and API change safely?

## Testing and Engineering Quality

1. What should be covered by unit, integration, contract, and end-to-end tests?
2. What should be mocked, and what should use a real dependency?
3. How do you integration test an ASP.NET Core API with authentication enabled?
4. How do you test OAuth token validation and authorization policies?
5. How do you test CQRS handlers without coupling tests to implementation details?
6. How do you test event-sourced aggregates and projection replay?
7. How do consumer-driven contract tests protect microservice integrations?
8. How do you test APIM policies, WAF rules, and gateway routing?
9. How do you test container health probes and graceful shutdown?
10. How do you test retries, timeouts, duplicate messages, and partial failures?
11. How do you keep test data isolated and deterministic in CI?
12. How do you identify and eliminate flaky tests?

## Architecture, Delivery, and Leadership

1. How do you turn an ambiguous requirement into an architecture and delivery plan?
2. How do you compare options and record a decision in an ADR?
3. How do you balance delivery speed, maintainability, security, and operational cost?
4. How do you avoid both under-engineering and overengineering?
5. How do you identify the highest-risk assumptions before implementation?
6. How do you break a large architecture change into reversible increments?
7. How do you communicate technical trade-offs to non-technical stakeholders?
8. How do you review a design proposed by another senior engineer?
9. What do you look for in a security-sensitive code review?
10. How do you mentor developers without becoming a delivery bottleneck?
11. How do you raise engineering standards across multiple teams?
12. How do you handle disagreement with an architect or technical lead?
13. Tell me about a difficult production problem you diagnosed end to end.
14. Tell me about a design decision you changed after receiving new evidence.
15. Tell me about a time you improved reliability without stopping feature delivery.
16. How do you decide whether technical debt should be fixed now, scheduled, or accepted?
17. How do you plan ownership, documentation, on-call readiness, and handover?
18. What would your first 30, 60, and 90 days look like in a senior engineering role?

## End-to-End Architecture Scenarios

1. Design a secure multitenant platform using a SPA, ASP.NET Core APIs, Entra ID, Application Gateway, APIM, and containerized workloads.
2. Design an OAuth 2.0 flow for a SPA calling an API that must call a downstream API on behalf of the user.
3. Design a machine-to-machine integration using Entra ID without storing a client secret.
4. Design a payment API that remains safe when clients retry after timeouts.
5. Design CQRS read and write paths for a high-volume transaction-history service.
6. Design an event-sourced payment aggregate and explain concurrency, projections, and recovery.
7. Design a private APIM architecture fronted by Application Gateway WAF.
8. Migrate a set of APIs from virtual machines to Azure Container Apps with zero downtime.
9. Decide whether a complex workload should run on Container Apps or AKS.
10. Diagnose a system where Application Gateway returns 502 while APIM and the backend appear healthy.
11. Diagnose a system where users authenticate successfully but receive 403 from selected APIs.
12. Plan a safe rollout of new token claims, API policies, container revisions, and database schema changes.
13. Recover a CQRS read model after a projection bug corrupted customer balances.
14. Recover an event-sourced system after a bad event-version deployment.
15. Design observability that traces a user request through gateway, API, database, broker, and consumer.
16. Explain how you would secure, test, deploy, monitor, and roll back the complete platform.

## C# and .NET Engineering Deep Dive

1. What happens from compiling a C# application to executing it in the .NET runtime?
2. Explain the CLR, IL, JIT compilation, and tiered compilation.
3. What is the difference between value types and reference types?
4. How do stack allocation, heap allocation, boxing, and unboxing affect performance?
5. How does the .NET garbage collector work across generations?
6. What is the Large Object Heap, and how can it affect application performance?
7. When should a type implement `IDisposable` or `IAsyncDisposable`?
8. Explain delegates, events, lambdas, and expression trees.
9. How do `IEnumerable<T>`, `IAsyncEnumerable<T>`, and `IQueryable<T>` differ?
10. What is deferred execution, and when can repeated enumeration cause bugs?
11. How do records, classes, structs, and readonly structs differ?
12. How do nullable reference types improve design without providing runtime enforcement?
13. How do generics improve type safety and performance?
14. What are covariance and contravariance in C#?
15. How do `Task`, `ValueTask`, and `Thread` differ?
16. When is `Task.Run` appropriate in an ASP.NET Core application?
17. How do race conditions occur, and how do `lock`, `SemaphoreSlim`, and immutable data help?
18. What is thread-pool starvation, and how would you diagnose it?
19. How do channels support producer-consumer workloads in .NET?
20. Which runtime, allocation, exception, and thread-pool metrics would you monitor?

## ASP.NET Core Application Design

1. Explain the ASP.NET Core request pipeline from connection acceptance to response completion.
2. How does middleware ordering affect routing, authentication, authorization, CORS, and exception handling?
3. Compare middleware, endpoint filters, MVC filters, and action filters.
4. Compare controllers and minimal APIs for different application types.
5. How does model binding work, and which security risks should you consider?
6. How should an API handle graceful shutdown and requests already in progress?
7. How do Kestrel, a reverse proxy, and forwarded headers work together?
8. How do output caching, response caching, and distributed caching differ?
9. How do you stream large responses without excessive memory allocation?
10. How do you safely accept and process file uploads?
11. Why should durable background work not depend only on an in-process queue?
12. How do you implement health checks that reflect readiness without overloading dependencies?
13. How do you prevent controllers or endpoints from accumulating business logic?
14. How do you configure secure headers, HTTPS redirection, HSTS, and proxy trust?
15. How do you protect ASP.NET Core Data Protection keys in containers?

## REST, OpenAPI, and Swagger Governance

1. What constraints define REST, and which are commonly applied pragmatically?
2. How do you model resources rather than database tables in a REST API?
3. How do safe, idempotent, and cacheable HTTP methods differ?
4. How do you model long-running operations in an HTTP API?
5. When should an API return `202 Accepted`, and how should clients track progress?
6. How do ETags and conditional requests prevent lost updates?
7. How do `If-Match` and `If-None-Match` differ?
8. How should APIs represent validation errors using Problem Details?
9. How do you design consistent error types without leaking internal details?
10. What is OpenAPI, and how does it differ from Swagger tooling?
11. What belongs in an OpenAPI operation definition?
12. How do reusable schemas, parameters, responses, and security schemes work?
13. How do you document OAuth 2.0 flows in an OpenAPI definition?
14. How do you describe polymorphism using `oneOf`, `anyOf`, and discriminators?
15. How do you prevent implementation details from leaking into generated schemas?
16. How do you generate and distribute typed clients safely?
17. How do you lint and validate an OpenAPI document in CI?
18. How do you detect backward-incompatible API changes automatically?
19. How do contract-first and code-first API development differ?
20. How do you secure Swagger UI outside development environments?
21. How do you publish OpenAPI definitions into Azure API Management?
22. How would you establish organization-wide REST and OpenAPI standards?

## GraphQL Fundamentals and Schema Design

1. What problem does GraphQL solve compared with REST?
2. When is GraphQL a poor choice?
3. Explain schemas, object types, fields, arguments, queries, mutations, and subscriptions.
4. How do nullability and list nullability work in a GraphQL schema?
5. How do interfaces and unions model polymorphic results?
6. Why should a GraphQL schema model the domain instead of exposing database entities?
7. How do input types differ from output types?
8. How should mutations express validation errors and business conflicts?
9. How do cursor-based connections support pagination?
10. Why is offset pagination problematic for frequently changing datasets?
11. How do filtering and sorting capabilities create performance or security risks?
12. How do you evolve a GraphQL schema without explicit URL versions?
13. How do field deprecation and schema usage analytics support safe evolution?
14. How do persisted queries work, and what benefits do they provide?
15. What are automatic persisted queries?
16. How do fragments, aliases, and variables improve client queries?
17. How do subscriptions differ operationally from queries and mutations?
18. How should GraphQL errors distinguish validation, authorization, and server failures?

## GraphQL with Hot Chocolate, GraphQL.NET, and Apollo

1. Compare Hot Chocolate and GraphQL.NET for an ASP.NET Core service.
2. How do code-first, annotation-based, and schema-first approaches differ in Hot Chocolate?
3. How do query resolvers and field middleware work in Hot Chocolate?
4. How do DataLoader and batching prevent N+1 database queries?
5. Why can a DataLoader still perform poorly when scoped incorrectly?
6. How do projections, filtering, and sorting integrate with EF Core in Hot Chocolate?
7. What risks arise from exposing unrestricted filtering over EF Core?
8. How do you propagate `CancellationToken` through GraphQL resolvers?
9. How do you prevent resolvers from containing business logic?
10. How do you apply dependency injection with resolver lifetimes safely?
11. How do you implement mutations using CQRS commands?
12. How do you map domain failures into useful GraphQL errors?
13. How do you avoid exposing exception messages and stack traces?
14. How do you implement authentication and authorization at type and field level?
15. How do Entra ID access tokens secure a GraphQL endpoint?
16. How do you apply tenant isolation consistently across every resolver?
17. How do query depth, complexity, timeouts, and execution limits protect the server?
18. How do you prevent aliases and repeated fields from bypassing naive complexity limits?
19. How do you rate-limit GraphQL when every operation uses the same HTTP endpoint?
20. How do you cache GraphQL responses or field results safely?
21. How do you monitor resolver latency and identify expensive fields?
22. How do you trace GraphQL operations with OpenTelemetry?
23. How do you test a Hot Chocolate schema, resolvers, authorization, and errors?
24. How do schema snapshots detect breaking changes?
25. How do Apollo Client cache normalization and type policies work?
26. How do Apollo Client fetch policies affect freshness and performance?
27. How do optimistic UI updates work, and how do you recover when a mutation fails?
28. How do you handle token expiry in Apollo links without creating retry loops?
29. How do Apollo Federation and schema stitching differ?
30. When should multiple teams adopt federation rather than one GraphQL gateway?
31. How do ownership and composition checks work in a federated graph?
32. How would you expose GraphQL through Azure API Management?
33. Which protections belong in APIM and which must remain in the GraphQL server?
34. Design a transaction-history query that avoids N+1 queries and unbounded results.

## Cloud Design Principles for Modern Applications

1. What does cloud native mean beyond running an application in the cloud?
2. How do stateless services support elasticity and resilience?
3. How do availability, reliability, scalability, and performance differ?
4. How do horizontal and vertical scaling differ?
5. How do you remove single points of failure from an application architecture?
6. How do availability zones and regions affect design?
7. How do you choose between synchronous and asynchronous integration?
8. How do you design for transient faults without creating retry storms?
9. How do bulkheads, backpressure, load shedding, and admission control differ?
10. How do RTO and RPO influence architecture and recovery design?
11. How do you design for graceful degradation when a dependency fails?
12. How do twelve-factor application principles apply to modern .NET services?
13. How do immutable infrastructure and disposable compute affect deployment?
14. How do you select managed services versus self-hosted infrastructure?
15. How do cost, portability, operational skill, and vendor lock-in affect cloud decisions?
16. How do zero-trust principles affect network and identity design?
17. How do you validate architecture assumptions with load, failure, and recovery tests?

## Azure and AWS Platform Comparisons

1. How do Microsoft Entra ID and AWS IAM differ conceptually?
2. Compare Azure Managed Identity with AWS IAM roles for workloads.
3. Compare Azure Container Apps with AWS App Runner and Amazon ECS Fargate.
4. Compare AKS with Amazon EKS.
5. Compare Azure API Management with Amazon API Gateway.
6. Compare Azure Application Gateway and Front Door with AWS ALB and CloudFront.
7. Compare Azure Key Vault with AWS Secrets Manager and KMS.
8. Compare Azure Service Bus and Event Grid with Amazon SQS, SNS, and EventBridge.
9. Compare Azure Monitor and Application Insights with CloudWatch and X-Ray.
10. Compare Azure SQL and Cosmos DB with Amazon RDS and DynamoDB.
11. How do networking and private connectivity concepts map between Azure and AWS?
12. How would you design portability without reducing the system to the lowest common denominator?
13. When is a multicloud design justified, and when is it unnecessary complexity?
14. How would you migrate a containerized .NET workload between AWS and Azure?

## Docker and Kubernetes Delivery Deep Dive

1. How do image layers and the build cache affect Docker build speed and image size?
2. Why are multi-stage Docker builds useful for .NET applications?
3. How do you pin and update base images safely?
4. What is the difference between `ENTRYPOINT` and `CMD`?
5. How do Linux signals reach a .NET process inside a container?
6. How do you ensure graceful termination before Kubernetes sends SIGKILL?
7. Why should application state not live only in a container filesystem?
8. How do ConfigMaps and Secrets differ, and what are their security limitations?
9. How do deployments, StatefulSets, DaemonSets, Jobs, and CronJobs differ?
10. How do namespaces and RBAC support workload isolation?
11. How do pod anti-affinity and topology-spread constraints improve resilience?
12. How do disruption budgets interact with cluster upgrades and autoscaling?
13. How do you debug DNS, networking, and service-discovery failures in Kubernetes?
14. How do Helm and Kustomize differ?
15. How do you manage container provenance and software bills of materials?
16. How do you enforce trusted images, non-root users, and resource limits?

## CI/CD and DevOps Ways of Working

1. What does DevOps mean beyond using a deployment pipeline?
2. How do continuous integration, continuous delivery, and continuous deployment differ?
3. What should happen on every pull request?
4. How do trunk-based development and GitFlow differ?
5. What makes a deployment pipeline fast, reliable, and repeatable?
6. How do you separate build, test, package, release, and deploy stages?
7. How do artifacts and provenance support traceability?
8. How do you integrate SAST, dependency, secret, and container scanning?
9. How do you prevent a pull request from accessing production credentials?
10. How do deployment rings reduce release risk?
11. How do feature flags differ from configuration and deployment toggles?
12. How do you perform an emergency hotfix without bypassing essential controls?
13. How do DORA metrics help improve software delivery?
14. Why can deployment frequency and change-failure rate improve together?
15. How do blameless retrospectives turn incidents into delivery improvements?

## Git and Modern Software Delivery

1. Explain commits, branches, tags, remotes, and the Git object model.
2. How do merge and rebase differ?
3. When is interactive rebase appropriate, and when is it dangerous?
4. How do you recover a lost commit using reflog?
5. How do `revert`, `reset`, and `restore` differ?
6. How do you resolve a difficult merge conflict safely?
7. Why should commits be small, cohesive, and independently understandable?
8. What makes a pull request easy to review?
9. How do branch-protection rules improve delivery safety?
10. How do signed commits and protected tags improve supply-chain security?
11. What should you do if a credential is committed and pushed?
12. How do monorepo and multirepo strategies affect ownership and CI performance?
13. How do CODEOWNERS and review policies support cross-functional teams?
14. How do you keep long-running work integrated without a long-lived branch?
15. How do you audit which source and pipeline produced a deployment?

## Observability, Logging, and Monitoring Deep Dive

1. What makes a log event structured rather than formatted text?
2. Which fields should every production log contain?
3. How do log levels differ, and how do you prevent excessive debug logging?
4. How do high-cardinality dimensions affect metrics cost and performance?
5. What are counters, gauges, histograms, and exemplars?
6. How do RED and USE monitoring methods differ?
7. How do traces, spans, baggage, and span links work?
8. When should asynchronous messaging use a span link instead of a parent-child span?
9. How do you instrument ASP.NET Core, EF Core, HttpClient, and GraphQL resolvers?
10. How do sampling strategies affect cost and incident diagnosis?
11. How do you retain errors and slow traces while sampling routine traffic?
12. How do symptom-based alerts differ from cause-based alerts?
13. How do you monitor deployment health against a baseline?
14. How do you investigate a memory leak in a containerized .NET service?
15. How do you control telemetry cost without losing diagnostic evidence?

## Agile and Cross-Functional Delivery

1. What does effective Agile delivery look like beyond ceremonies?
2. How do you refine an ambiguous story with product, design, and testing colleagues?
3. How do you split a large feature into thin, valuable increments?
4. How do you identify dependencies and integration risks during planning?
5. How do you estimate work while technical uncertainty remains?
6. How do spikes reduce uncertainty without becoming production shortcuts?
7. How do definitions of ready and done improve cross-functional delivery?
8. How do developers, testers, designers, and product owners collaborate before coding?
9. How do you handle changing requirements late in an iteration?
10. How do you surface delivery risk without sounding obstructive?
11. How do you balance sprint commitments, incidents, and technical debt?
12. How do you prevent handoffs from creating queues between disciplines?
13. How do you use retrospectives to produce measurable improvement?
14. How do you support psychological safety while maintaining high standards?
15. Tell me about a cross-functional delivery that did not go to plan.

## Stakeholder Communication

1. How do you explain OAuth 2.0 or zero trust to a non-technical stakeholder?
2. How do you explain eventual consistency and delayed updates to a product owner?
3. How do you present architecture options without overwhelming the audience?
4. How do you communicate the cost and benefit of CQRS or event sourcing?
5. How do you explain why a possible deadline carries unacceptable risk?
6. How do you turn technical metrics into customer or business impact?
7. How do you communicate during an incident before the root cause is known?
8. How do you provide status without hiding uncertainty?
9. How do you challenge a stakeholder request constructively?
10. How do you negotiate scope while protecting security and reliability?
11. How do you tailor one proposal for engineers, executives, security, and operations?
12. How do you respond when stakeholders reject your technical recommendation?
13. How do you demonstrate progress on foundational work with little visible UI?
14. Tell me about a time communication prevented a technical or delivery failure.
