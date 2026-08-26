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

