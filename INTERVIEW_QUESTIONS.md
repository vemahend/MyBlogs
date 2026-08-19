# Complete Interview Question Bank

> Generated from `frontend/src/App.jsx` and `frontend/src/thetaQuestions.js`.
> Run `node scripts/generate-question-bank.mjs` after changing the source question bank.

**Total practice items: 1,500**

## Core Senior Topics

### C# and .NET

1. Explain IEnumerable, IQueryable, and List. When can IQueryable cause performance issues?
2. What are async and await doing internally, and how do you avoid deadlocks?
3. Explain Transient, Scoped, and Singleton dependency injection lifetimes with examples.
4. How do you handle exceptions globally in a production ASP.NET Core API?
5. What is LINQ deferred execution, and when can it surprise developers?
6. How would you refactor a large service class with too many dependencies?

### ASP.NET Core and Web API

1. How do you design a clean REST API for an enterprise application?
2. What status codes do you use for validation failure, unauthorized access, conflict, and unexpected errors?
3. How do middleware and filters differ in ASP.NET Core?
4. How would you design an API that needs idempotency?
5. How do you version APIs without breaking existing clients?
6. How would you troubleshoot a slow API endpoint in production?

### Microservices

1. What is the difference between microservices and a modular monolith?
2. How do you decide service boundaries?
3. How do you handle distributed transactions and eventual consistency?
4. What is the outbox pattern, and why is it useful?
5. How do you prevent cascading failures between services?
6. How would you migrate a monolithic .NET application to microservices?

### RabbitMQ and Messaging

1. Explain exchanges, queues, bindings, routing keys, publishers, and consumers.
2. How do acknowledgements make message processing reliable?
3. How do you handle poison messages and dead-letter queues?
4. How do you prevent duplicate message processing?
5. When would you choose RabbitMQ over direct API calls?
6. How would you debug a message that was published but not consumed?

### SQL Server and Data Access

1. How do you optimize a slow SQL query?
2. Explain clustered and non-clustered indexes.
3. How do indexes improve reads but affect writes?
4. How do you read an execution plan?
5. When would you use Entity Framework, and when would you use Dapper?
6. How do you avoid the N+1 query problem in EF?

### React, Angular, and Frontend

1. How do React and Angular differ architecturally?
2. What are React hooks, and how do you avoid common hook mistakes?
3. How do you manage API loading, error, and empty states in React?
4. What does TypeScript add to JavaScript development?
5. How do Angular services and dependency injection work?
6. How do you keep frontend and backend contracts aligned?

### Testing and Quality

1. What makes a good unit test?
2. What should be mocked, and what should not be mocked?
3. How do you use MOQ to test a service with dependencies?
4. How do you test async methods and exception paths?
5. What tests would you write for a payment or transaction workflow?
6. How do you handle flaky tests?

### Leadership and AI-Assisted Engineering

1. What do you look for in code reviews?
2. How do you mentor junior developers?
3. How do you handle delivery pressure without reducing quality?
4. How have you used Claude Code or GitHub Copilot in real development?
5. How do you verify AI-generated code before it reaches production?
6. How would you introduce AI-first development practices to a team?

## Theta Prep

### .NET Framework to Modern .NET

1. What is the difference between .NET Framework and modern .NET?
2. What are the major architectural differences between .NET Framework 4.x and modern .NET?
3. How would you migrate a .NET Framework 4 application to modern .NET?
4. Would you rewrite the entire application? Why or why not?
5. Why would you avoid a big-bang rewrite?
6. How do you assess a legacy .NET application before modernising it?
7. How do you identify dependencies in a legacy application?
8. How do you handle libraries that are not compatible with modern .NET?
9. How would you migrate web.config configuration?
10. How is dependency injection different in modern ASP.NET Core?
11. How is the ASP.NET Core request pipeline different from classic ASP.NET?
12. What is middleware, and how does middleware ordering work?
13. What problems can incorrect middleware ordering cause?
14. How would you migrate authentication from a legacy application?
15. How do you migrate Entity Framework to EF Core?
16. What compatibility problems have you faced during .NET migration?
17. How would you test a migrated component?
18. How do you run legacy and modern .NET components side by side?
19. How do you measure modernisation progress?
20. When should a legacy component not be modernised?
21. How do you prioritise components for migration?
22. How do you maintain feature delivery during modernisation?
23. How would you manage rollback during migration?
24. What does incremental modernisation mean to you?

### Strangler Fig and Migration Patterns

1. What is the Strangler Fig pattern?
2. When would you use the Strangler Fig pattern?
3. When would you not use the Strangler Fig pattern?
4. How do you route traffic between legacy and modern components?
5. How do you gradually retire legacy functionality?
6. What is an anti-corruption layer?
7. Why do we need an anti-corruption layer?
8. Where would you place an anti-corruption layer?
9. How do you prevent a legacy domain model leaking into a new system?
10. What is incremental migration?
11. Compare Strangler Fig with a big-bang rewrite.
12. How do you handle shared databases during migration?
13. Would the legacy and modern applications share the same database?
14. What problems can a shared database create?
15. How would you separate data ownership incrementally?
16. How do you handle transactions across old and new components?
17. How do you migrate without downtime?
18. How would you validate that the new component behaves like the legacy component?
19. What is parallel running?
20. What is shadow traffic?
21. How would you roll back to the legacy implementation?

### Architecture and Design

1. How do you define application architecture?
2. What makes an architecture good?
3. How do you balance architecture and delivery speed?
4. How do you avoid overengineering?
5. Modular monolith versus microservices: when would you choose each?
6. When should you use microservices?
7. When should you avoid microservices?
8. How do you identify service boundaries?
9. What is a bounded context?
10. Explain Domain-Driven Design.
11. What is an aggregate?
12. What is an aggregate root?
13. What is a domain event?
14. Domain event versus integration event?
15. Explain Clean Architecture.
16. What are the layers in Clean Architecture?
17. Where should business logic live?
18. Should the domain layer reference Entity Framework?
19. Should the controller directly call the repository?
20. What is dependency inversion?
21. Explain SOLID with practical examples.
22. Give a real example of the Single Responsibility Principle.
23. What is tight coupling, and how do you reduce it?
24. What is cohesion?
25. How do you make architecture decisions?
26. How do you document architecture decisions?
27. What is an ADR?
28. How do you ensure developers follow architecture standards?
29. What happens when you disagree with a Solution Architect?
30. How do you review an architecture?
31. What quality attributes do you consider?
32. How do you design for scalability?
33. How do you design for maintainability?
34. How do you design for resilience?
35. How do you design for observability?

### API Design and Integration Governance

1. How do you design a REST API?
2. What makes a good REST API?
3. How do you name API resources?
4. GET versus POST?
5. PUT versus PATCH?
6. Is PUT idempotent?
7. Is POST idempotent?
8. How do you make a POST request idempotent?
9. What is an idempotency key?
10. Where would you store an idempotency key?
11. How do you handle duplicate API requests?
12. How do you version an API?
13. URL versioning versus header versioning?
14. How do you introduce a breaking API change?
15. How do you maintain backward compatibility?
16. How long do you support an old API version?
17. How do you deprecate an API?
18. How do frontend and backend teams agree on an API contract?
19. What is contract-first API development?
20. What is OpenAPI?
21. How do you validate API contracts?
22. What is consumer-driven contract testing?
23. What is Pact testing?
24. How do you design consistent API errors?
25. What is ProblemDetails?
26. How do you implement global exception handling?
27. Where should validation happen?
28. How do you handle pagination?
29. Offset versus cursor pagination?
30. How do you handle filtering and sorting?
31. How do you secure an API?
32. How do you implement rate limiting and throttling?
33. What is a correlation ID?
34. How do you propagate a correlation ID?
35. How do you trace a request across microservices?
36. How do you handle API timeouts and retries?
37. Which HTTP errors should be retried?
38. Why should you not retry every request?
39. What are exponential backoff and jitter?
40. What is a circuit breaker?
41. API Gateway versus reverse proxy?
42. What should be handled at Azure API Management?
43. What should remain in application code?

### C# Live Coding and LINQ

1. Find duplicate items in a list.
2. Remove duplicates from a list.
3. Find the first non-repeating character.
4. Reverse a string.
5. Count character frequency.
6. Group orders by customer.
7. Calculate total order value per customer.
8. Find the top three customers by order value.
9. Filter completed orders.
10. Sort customers by total spend.
11. Find duplicate transactions.
12. Merge two collections.
13. Find missing numbers in a sequence.
14. Find the second-highest value.
15. Group employees by department.
16. Find the highest-paid employee in each department.
17. Write a LINQ GroupBy.
18. Explain deferred execution.
19. What happens when ToList is called?
20. First versus FirstOrDefault?
21. Single versus SingleOrDefault?
22. Any versus Count greater than zero?
23. Select versus SelectMany?
24. IEnumerable versus IQueryable?
25. Where is an IQueryable query executed?
26. What happens if you call ToList too early?
27. How does EF Core translate LINQ to SQL?
28. What happens if EF cannot translate a LINQ expression?
29. Write an asynchronous method.
30. Refactor .Result to await.
31. Refactor .Wait to await.
32. Explain why sync-over-async is problematic.
33. Does await create a thread?
34. What happens internally when await is reached?
35. What is a Task?
36. Task versus Thread?
37. How do you run independent asynchronous operations concurrently?
38. Task.WhenAll versus sequential awaits?
39. What is a CancellationToken?
40. Why should APIs accept cancellation tokens?
41. How do you handle exceptions with Task.WhenAll?
42. How would you refactor a large service class?
43. How would you make this code testable?
44. What dependencies would you inject?
45. What problems do you see in this code?
46. How would you improve this code for production?

### Async Await and .NET Internals

1. Explain async and await internally.
2. Does async create a new thread?
3. What happens to the HTTP request thread during an I/O operation?
4. Who resumes the method after an await?
5. What is a continuation?
6. What is a state machine?
7. What does the C# compiler generate for an async method?
8. What is SynchronizationContext?
9. Why can .Result cause deadlocks?
10. Are deadlocks still possible in ASP.NET Core?
11. What is thread-pool starvation?
12. What is async all the way?
13. When should you use ConfigureAwait(false)?
14. CPU-bound versus I/O-bound work?
15. When would you use Task.Run?
16. Should you use Task.Run in an ASP.NET Core API?
17. How do you diagnose thread-pool starvation?

### Dependency Injection

1. What is dependency injection?
2. Why do we use DI?
3. Explain transient lifetime.
4. Explain scoped lifetime.
5. Explain singleton lifetime.
6. What is the default DI lifetime?
7. What does one scope per HTTP request mean?
8. Can two services share the same scoped dependency?
9. What happens on the next HTTP request?
10. Scoped versus transient?
11. Can a singleton depend on a scoped service?
12. What is a captive dependency?
13. How do you create a scope manually?
14. Where do you register dependencies?
15. How does ASP.NET Core resolve dependencies?
16. What is the composition root?
17. Constructor injection versus service locator?
18. How do you handle multiple implementations of an interface?
19. How do you test a service with injected dependencies?

### Angular and SPA Architecture

1. What experience do you have with Angular?
2. Angular versus React?
3. What is a component?
4. What is an Angular service?
5. How does Angular dependency injection work?
6. Explain one-way data binding.
7. Explain two-way data binding.
8. What is ngModel?
9. What are Angular lifecycle hooks?
10. What is ngOnInit?
11. Constructor versus ngOnInit?
12. What is RxJS?
13. What is an Observable?
14. Observable versus Promise?
15. What is a Subject?
16. Subject versus BehaviorSubject?
17. What is the async pipe?
18. Why should you avoid manually subscribing everywhere?
19. What is an HTTP interceptor?
20. How do you attach an access token to API requests?
21. How do you globally handle HTTP errors?
22. How do you structure a large Angular application?
23. Smart versus presentational components?
24. How do you manage frontend state?
25. When would you use NgRx?
26. How do you prevent memory leaks in Angular?
27. What is lazy loading?
28. How do you improve Angular performance?
29. What is change detection?
30. What is OnPush?
31. How do you secure an Angular SPA?
32. Can secrets be safely stored in Angular?
33. Where should access tokens be stored?
34. How do you handle API contract changes in the SPA?
35. How would you review an Angular component architecture?

### Azure PaaS

1. What is Azure App Service?
2. When would you use App Service?
3. App Service versus Azure Functions?
4. App Service versus AKS?
5. How do you scale an App Service?
6. Scale up versus scale out?
7. What are deployment slots?
8. How do you achieve zero-downtime deployment?
9. What is an Azure Function?
10. When should you use Azure Functions?
11. When should you not use Azure Functions?
12. What is a cold start?
13. What Function triggers have you used?
14. How do you handle long-running Functions?
15. What is Azure API Management?
16. Why use APIM?
17. What policies can you configure in APIM?
18. Where would you implement rate limiting?
19. Where would you validate JWTs?
20. How do you version APIs in APIM?
21. How do you expose legacy and modern APIs through APIM?
22. What is Azure Service Bus?
23. Queue versus topic?
24. Topic versus subscription?
25. What is peek-lock?
26. What happens if message processing fails?
27. What is a dead-letter queue?
28. How do you retry Service Bus messages?
29. How do you prevent duplicate message processing?
30. What is duplicate detection?
31. How do you design an idempotent consumer?
32. What is message ordering?
33. What are Service Bus sessions?
34. What is Azure SQL?
35. Azure SQL versus SQL Server on a VM?
36. How do you manage database connections?
37. What is connection pooling?
38. How do you store application secrets?
39. What is Azure Key Vault?
40. What is Managed Identity?
41. Managed Identity versus client secret?
42. How does an App Service access Azure SQL securely?
43. How would you monitor Azure applications?
44. What is Application Insights?
45. How do you implement distributed tracing?
46. How do you diagnose a slow Azure-hosted API?
47. How do you manage Azure cost?
48. What is FinOps?

### Messaging and Distributed Systems

1. Synchronous versus asynchronous communication?
2. When would you use REST?
3. When would you use messaging?
4. What is eventual consistency?
5. What is at-least-once delivery?
6. Can you guarantee exactly-once processing?
7. How do you handle duplicate messages?
8. What is an idempotent consumer?
9. What is the Outbox Pattern?
10. What problem does the Outbox Pattern solve?
11. Database commit succeeds but event publishing fails. What happens?
12. How do you process the outbox?
13. What is Saga?
14. Choreography versus orchestration?
15. What is a compensating transaction?
16. What is a poison message?
17. What is a DLQ?
18. How do you replay DLQ messages?
19. How do you avoid retry storms?
20. What is exponential backoff?
21. What is circuit breaking?
22. How do you monitor asynchronous flows?

### Security

1. Authentication versus authorisation?
2. Explain OAuth 2.0.
3. Explain OpenID Connect.
4. What is a JWT?
5. What are the parts of a JWT?
6. Is a JWT encrypted?
7. How do you validate a JWT?
8. What is an access token?
9. What is a refresh token?
10. Where should refresh tokens be stored?
11. How do you revoke a token?
12. What is token rotation?
13. What is CORS?
14. Why does CORS exist?
15. Is CORS a security mechanism for backend-to-backend calls?
16. What is CSRF?
17. How do you prevent CSRF?
18. What is XSS?
19. How do you prevent XSS?
20. What is SQL injection?
21. How does parameterisation prevent SQL injection?
22. What is the OWASP Top 10?
23. How do you secure an API?
24. How do you manage secrets?
25. Why should secrets not be stored in source control?
26. What is Managed Identity?
27. What is least privilege?
28. What is Zero Trust?
29. Explain never trust, always verify.
30. How do you secure service-to-service communication?
31. How do you protect sensitive logs?
32. What information should never be logged?
33. How would you implement passkey or FIDO2 authentication?
34. Passkey versus password?
35. What is a FIDO2 challenge?
36. Why does the server store the public key rather than the private key?
37. How do you prevent replay attacks?

### Technical Debt

1. What is technical debt?
2. Is all technical debt bad?
3. How do you identify technical debt?
4. How do you prioritise technical debt?
5. How do you explain technical debt to a Product Owner?
6. How do you explain technical debt to an executive?
7. How do you reduce technical debt without stopping feature delivery?
8. Would you create a separate technical debt sprint?
9. How do you include technical debt in normal delivery?
10. What metrics would you use?
11. How do you create a technical debt roadmap?
12. Business-critical feature versus technical debt: which comes first?
13. What if the customer refuses to fund technical debt?
14. How do you quantify the business risk of technical debt?
15. Tell me about technical debt you personally reduced.

### CI/CD and Engineering Standards

1. Explain your CI/CD process.
2. What happens after a developer commits code?
3. What checks should run on a pull request?
4. What is a build pipeline?
5. What is a release pipeline?
6. CI versus CD?
7. Continuous delivery versus continuous deployment?
8. Where do unit tests run?
9. Where do integration tests run?
10. How do you handle database migrations?
11. How do you deploy without downtime?
12. What is blue-green deployment?
13. What is canary deployment?
14. What are feature flags?
15. How have you used feature toggles?
16. How do you roll back a deployment?
17. What is a release gate?
18. What should block a release?
19. Who makes a go or no-go decision?
20. How do you handle a critical production defect?
21. How do you enforce code-review standards?
22. What do you look for in a pull request?
23. How do you prevent developers bypassing quality gates?
24. What is DevSecOps?
25. Where should security scanning happen?
26. SAST versus DAST?
27. How do you scan dependencies for vulnerabilities?

### Technical Leadership and Mentoring

1. What does a Technical Lead do?
2. Technical Lead versus Solution Architect?
3. Technical Lead versus Engineering Manager?
4. How hands-on should a Technical Lead be?
5. How do you mentor senior developers?
6. How do you mentor junior developers?
7. Tell me about someone you helped improve technically.
8. How do you conduct a code review?
9. What if a developer repeatedly ignores your feedback?
10. How do you build engineering standards?
11. How do you introduce a new architecture pattern?
12. How do you get team buy-in?
13. What if senior engineers disagree with your architecture?
14. How do you resolve technical disagreement?
15. Do you make the final decision as Technical Lead?
16. How do you avoid becoming a bottleneck?
17. What does build capability, not dependency mean?
18. How do you delegate technical decisions?
19. How do you run a design review?
20. How do you run an architecture workshop?
21. How do you document workshop decisions?
22. How do you ensure decisions are followed?
23. How do you balance mentoring and your own coding work?
24. Tell me about a technical conflict.
25. Tell me about a decision you got wrong.
26. How did you handle the mistake?
27. How do you challenge an architect respectfully?

### Customer-Facing Consultancy

1. Tell me about yourself.
2. Why Theta?
3. Why this Technical Lead role?
4. Why are you leaving your current company?
5. What are you looking for in your next role?
6. Tell me about your current Visa project.
7. What is Visa Spend Clarity?
8. What is your specific responsibility?
9. What architecture decisions have you influenced?
10. Tell me about your Passkey implementation.
11. What was your personal contribution?
12. What did the architect do versus what did you do?
13. Tell me about a difficult customer.
14. What if a customer disagrees with your recommendation?
15. How do you explain architecture to a non-technical stakeholder?
16. Explain microservices to a CEO.
17. Explain technical debt to a Product Owner.
18. How do you defend a technical decision?
19. What if customer management challenges you in a meeting?
20. How do you communicate technical risk?
21. How do you present multiple technical options?
22. How do you explain trade-offs?
23. Tell me about a time you said no to a stakeholder.
24. Tell me about a time you changed your technical recommendation.
25. How do you build trust with a customer?
26. What would you do in your first 90 days?
27. What would you do in your first six months?
28. How would you become a trusted technical adviser?

### Likely Theta Architecture Scenarios

1. You inherit a mission-critical .NET Framework 4 application. The business cannot stop feature development. How do you modernise it?
2. A legacy application and a new modern .NET service need to run side by side. Design the architecture.
3. The Angular team complains that APIs keep changing and breaking the frontend. What would you do?
4. The customer has 200 technical debt items. How would you prioritise them?
5. The team wants microservices, but the application is currently a monolith. Would you agree?
6. The database commit succeeds but publishing to Service Bus fails. How do you solve this?
7. A Service Bus message is processed twice. How do you prevent duplicate business actions?
8. A customer asks you to deliver quickly using an architecture you believe will create serious long-term problems. What do you do?
9. A senior developer publicly disagrees with your architecture decision. How do you handle it?
10. You join the team tomorrow. What do you assess first before creating a modernisation roadmap?

## Plexure Prep

### Plexure Company Fit

1. Why do you want to work at Plexure/TASK?
2. How does your Visa payment experience transfer to a loyalty and customer engagement platform?
3. What do you understand about Plexure’s work with McDonald’s and global customer engagement?
4. How would you explain your experience with high-scale, customer-facing enterprise systems?
5. What senior engineering value would you bring in your first 90 days?
6. How have you worked with product owners, architects, QA, DevOps, and support teams?

### Senior .NET Backend for Plexure

1. Design an ASP.NET Core API for retrieving personalized offers for a mobile app.
2. How would you make a customer loyalty API reliable under high traffic?
3. How would you design idempotency for redeeming a loyalty offer?
4. How would you handle API rate limiting for mobile clients?
5. How would you version APIs used by mobile apps across many countries?
6. How would you design global exception handling and correlation IDs for a platform API?
7. How would you optimize an API that has high latency during campaign launches?
8. How would you secure APIs that expose customer profile, offers, and transaction history?

### Microservices and Messaging at Plexure Scale

1. How would you split services for loyalty, offers, customer profile, notifications, orders, and reporting?
2. When would you use asynchronous messaging instead of direct API calls?
3. How would you process purchase events and update loyalty points safely?
4. How would you handle duplicate purchase events from a POS or mobile order system?
5. How would you design retries and dead-letter queues for failed notification or reward events?
6. How would you trace one customer action across multiple services?
7. How would you avoid a distributed monolith in a large loyalty platform?
8. How would you design eventual consistency for points balance and reward redemption?

### Data, SQL, and Personalization

1. How would you model customers, segments, offers, redemptions, stores, and transactions?
2. How would you optimize a query that calculates offer eligibility for millions of customers?
3. How would you design indexes for customer ID, store, campaign, offer, and redemption queries?
4. How would you prevent stale or incorrect personalization data?
5. How would you design audit history for reward redemption and customer changes?
6. How would you balance real-time personalization with reporting workloads?
7. When would you use SQL Server, cache, search index, or event stream for customer engagement data?
8. How would you investigate a report that is correct for one market but wrong for another?

### React and Mobile/Web Experience

1. How would you build a React dashboard for campaign performance and offer redemption?
2. How would you handle loading, empty, and error states for customer engagement dashboards?
3. How would you prevent unnecessary re-renders in a large analytics screen?
4. How would you design reusable components for offers, segments, filters, and charts?
5. How would you keep frontend and backend contracts aligned for campaign management screens?
6. How would you handle role-based UI access for marketing, support, and admin users?

### Production, Observability, and Incidents

1. A campaign launch causes API timeouts globally. What is your investigation plan?
2. Customers are not receiving personalized offers in one country. How do you triage it?
3. A reward redemption is processed twice. How do you fix the system and protect customers?
4. A queue is growing quickly after a POS integration change. What do you check?
5. How would you monitor API health, queue depth, database performance, and customer-impacting errors?
6. What logs and dashboards would you want for a global loyalty platform?
7. How would you communicate during a production incident as a senior developer?
8. How do you prevent a similar incident from happening again?

### Leadership and Senior Behaviors

1. How do you mentor developers in a large enterprise platform team?
2. How do you review code that affects customer data or reward redemption?
3. How do you balance speed of feature delivery with platform reliability?
4. How do you handle unclear requirements for a campaign or personalization feature?
5. Tell me about a time you improved performance or reliability in production.
6. Tell me about a time you used AI tools responsibly in enterprise development.
7. How do you make architectural trade-offs visible to product and engineering leaders?
8. How would you onboard into Plexure’s domain quickly?

## Commonly Asked

### HR / Recruiter Screen

1. Tell me about yourself and your current role at Visa.
2. Why are you looking for a new role?
3. Why do you want this company and this position?
4. What kind of .NET projects have you worked on end to end?
5. How much experience do you have with C#, ASP.NET Core, Web API, SQL Server, React, and Angular?
6. What was your team size, and what was your exact responsibility?
7. What is your expected salary or hourly rate?
8. What is your notice period and work authorization status?
9. Are you comfortable with hybrid work, production support, and Agile ceremonies?
10. What are your strongest technical skills and which areas are you currently improving?

### Common C# Questions

1. What is CLR, and what services does it provide?
2. What is JIT compilation?
3. What is managed code vs unmanaged code?
4. What is the difference between class and struct?
5. What is the difference between interface and abstract class?
6. What is the difference between const, readonly, and static readonly?
7. What is the difference between ref, out, and in parameters?
8. What is the difference between string and StringBuilder?
9. What is boxing and unboxing?
10. What is the difference between IEnumerable and IEnumerator?
11. What is the difference between IEnumerable and IQueryable?
12. What is a delegate, event, lambda expression, and expression tree?
13. What is the difference between method overloading and method overriding?
14. What is the difference between virtual, override, abstract, sealed, and new?
15. What is garbage collection, and when should you avoid calling GC.Collect?

### Common ASP.NET / Web API Questions

1. What is the ASP.NET Core request pipeline?
2. What is middleware, and can you give examples of middleware you have used?
3. What is the difference between app.Use, app.Run, and app.Map?
4. What is dependency injection in ASP.NET Core?
5. What is the difference between AddTransient, AddScoped, and AddSingleton?
6. What is model binding?
7. What are action filters, exception filters, and authorization filters?
8. What is routing in Web API?
9. What is the difference between PUT, POST, PATCH, and DELETE?
10. How do you implement validation in Web API?
11. How do you implement authentication and authorization in Web API?
12. How do you handle CORS?
13. How do you upload files securely in ASP.NET Core?
14. How do you implement logging and global exception handling?
15. How do you improve API performance?

### Common SQL Questions

1. What is the difference between primary key, foreign key, unique key, and composite key?
2. What is the difference between inner join, left join, right join, and full join?
3. What is the difference between WHERE and HAVING?
4. What is the difference between UNION and UNION ALL?
5. What are clustered and non-clustered indexes?
6. What is a covering index?
7. What are stored procedures, functions, views, and triggers?
8. What is normalization, and what are 1NF, 2NF, and 3NF?
9. What is a transaction?
10. What are isolation levels?
11. What is a deadlock, and how do you troubleshoot it?
12. How do you find duplicate records?
13. How do you optimize a slow query?
14. How do you read an execution plan?
15. What is parameter sniffing?

### Entity Framework Asked Questions

1. What is DbContext?
2. What is DbSet?
3. What is change tracking?
4. What is lazy loading vs eager loading vs explicit loading?
5. What is the N+1 problem?
6. What is AsNoTracking, and when do you use it?
7. What are migrations?
8. What is code-first vs database-first?
9. How do you configure relationships in EF?
10. How do you handle concurrency conflicts?
11. How do you write raw SQL in EF safely?
12. When would you prefer Dapper over EF?

### Microservices Asked Questions

1. What is a microservice?
2. What are the advantages and disadvantages of microservices?
3. How do microservices communicate?
4. What is API Gateway?
5. What is service discovery?
6. What is centralized logging?
7. What is distributed tracing?
8. What is eventual consistency?
9. How do you handle data consistency across services?
10. How do you secure service-to-service communication?
11. What is circuit breaker pattern?
12. What is saga pattern?
13. How do you deploy microservices independently?
14. How do you monitor microservices?
15. How do you avoid creating a distributed monolith?

### RabbitMQ Asked Questions

1. What is RabbitMQ?
2. What is a producer and consumer?
3. What is an exchange?
4. What is a queue?
5. What is a binding?
6. What is a routing key?
7. What are direct, fanout, topic, and headers exchanges?
8. What is acknowledgement?
9. What is message durability?
10. What is a dead-letter queue?
11. What is prefetch count?
12. How do you handle failed messages?
13. How do you avoid duplicate processing?
14. How do you monitor RabbitMQ?
15. When should you use RabbitMQ instead of REST API calls?

### React / Angular Asked Questions

1. What is the difference between React and Angular?
2. What are props and state in React?
3. What is useState and useEffect?
4. What is the dependency array in useEffect?
5. How do you prevent unnecessary re-rendering?
6. What is controlled vs uncontrolled component?
7. What is Angular component lifecycle?
8. What is dependency injection in Angular?
9. What are Angular services?
10. What are guards and interceptors?
11. How do you handle forms in React or Angular?
12. How do you consume Web APIs from frontend code?
13. How do you handle authentication in frontend applications?
14. How do you debug production UI issues?
15. How do you improve frontend performance?

### Live Coding / Practical Tasks

1. Write a C# program to find duplicate numbers in an array.
2. Write a method to reverse a string without using built-in reverse.
3. Write a method to check whether a string is a palindrome.
4. Write a LINQ query to group employees by department.
5. Write a LINQ query to find the second-highest salary.
6. Design a Web API endpoint for creating and retrieving applications.
7. Write SQL to find duplicate email addresses.
8. Write SQL to get the second-highest salary.
9. Write SQL to join employees and departments and count employees per department.
10. Write a unit test using MOQ for a service that depends on a repository.
11. Create a small React component that fetches API data and shows loading and error states.
12. Debug a method that sometimes throws NullReferenceException.

### Senior Scenario Questions

1. Production API is returning 500 errors after deployment. What do you do first?
2. A SQL query is fast locally but slow in production. How do you investigate?
3. A RabbitMQ queue is growing continuously. What could be wrong?
4. A consumer processed a payment message twice. How do you fix the design?
5. A new requirement conflicts with the current microservice boundary. How do you handle it?
6. A junior developer created business logic inside a controller. How do you review it?
7. A product owner asks for a quick change that creates technical debt. What do you say?
8. A code review found security-sensitive logging. What should be changed?
9. An Angular or React page is slow for large datasets. What do you optimize?
10. A release is blocked by flaky tests. How do you respond as a senior developer?

## Azure & AWS

### Azure Architecture and Platform Engineering

1. How would you choose between Azure App Service, Azure Container Apps, and AKS for a new .NET workload?
2. How do Azure Functions hosting plans affect scaling, cold starts, networking, and cost?
3. What happens from trigger to completion when an Azure Function runs, and where should validation, dependency injection, logging, and error handling live?
4. How would you design an Azure Function that can safely retry without creating duplicate database records or external side effects?
5. When would you use Azure Service Bus queues, topics, Event Grid, or Event Hubs?
6. How would you design idempotent Azure Service Bus consumers and safely handle duplicate delivery?
7. How do managed identities improve access from ASP.NET Core applications to Azure resources?
8. How would you structure subscriptions, management groups, resource groups, tags, and policies for a growing organisation?
9. How do you design private networking with VNets, subnets, private endpoints, DNS, and network security groups?
10. How would you use Azure API Management for authentication, throttling, versioning, and backend protection?
11. How do deployment slots, health checks, feature flags, and rollback support zero-downtime releases?
12. What telemetry would you capture with Application Insights, Azure Monitor, Log Analytics, and distributed tracing?
13. How would you select between Azure SQL, Cosmos DB, PostgreSQL, Redis, and Blob Storage?
14. How would you secure Azure Blob Storage, generate time-limited access, define lifecycle rules, and prevent accidental public exposure?
15. When would you use Cosmos DB partition keys, consistency levels, change feed, and transactional batches?
16. How would you use Azure Front Door and CDN for global routing, TLS, caching, WAF protection, and regional failover?
17. How do you manage secrets, certificates, and rotation using Azure Key Vault?

### AWS Architecture and Serverless

1. How would you choose between EC2, ECS with Fargate, EKS, Elastic Beanstalk, and Lambda for a .NET application?
2. Explain the complete AWS Lambda invocation lifecycle, including initialization, handler execution, execution-environment reuse, scaling, timeout, and shutdown.
3. How would you package and optimize a .NET Lambda function to reduce cold starts and deployment size?
4. When should Lambda use reserved concurrency, provisioned concurrency, or asynchronous invocation?
5. How would you make a Lambda function idempotent when it writes to a database, publishes an event, or calls a payment provider?
6. How do API Gateway, Application Load Balancer, and CloudFront fit into a public API architecture?
7. How would you design API Gateway authentication, request validation, throttling, caching, versioning, and error responses?
8. How do CloudFront cache keys, origins, invalidations, signed URLs, and origin access control work together?
9. When would you use SQS, SNS, EventBridge, or Kinesis?
10. How would you design an SQS consumer for retries, visibility timeouts, duplicate messages, and dead-letter queues?
11. How do IAM roles provide safer application access than long-lived AWS access keys?
12. How would you design a multi-account AWS environment using Organizations, organisational units, and service control policies?
13. How do VPCs, public and private subnets, route tables, security groups, NAT gateways, and VPC endpoints work together?
14. How would you select between RDS, Aurora, DynamoDB, ElastiCache, and S3?
15. How does Amazon S3 provide object storage, and how do buckets, object keys, metadata, versioning, and storage classes differ from a file system?
16. How would you secure an S3 bucket using block public access, bucket policies, IAM, encryption, and access logging?
17. When would you use S3 pre-signed URLs, multipart upload, lifecycle rules, replication, and object lock?
18. How would you design reliable file upload and download flows between a React client, an ASP.NET Core API, and S3?
19. How do S3 event notifications integrate with Lambda, SQS, SNS, or EventBridge, and how do you handle duplicate or out-of-order events?
20. How would you choose an effective DynamoDB partition key and avoid hot partitions?
21. When should an application use RDS or Aurora instead of DynamoDB, and what migration risks would you consider?
22. How do ECS task definitions, services, Fargate, load balancers, auto scaling, and rolling deployments work together?
23. When is EKS justified over ECS, and what operational responsibilities does Kubernetes introduce?
24. How would you design Route 53 health checks and routing policies for failover or latency-based routing?
25. How do Lambda concurrency, cold starts, timeouts, retries, and idempotency influence serverless design?
26. What would you monitor using CloudWatch metrics, logs, alarms, X-Ray, and CloudTrail?
27. How would you deploy safely using CodePipeline, blue-green deployment, canary releases, and rollback?
28. How do Secrets Manager, Parameter Store, and KMS protect configuration and sensitive data?

### Advanced AWS Answers for Your CV Skills

1. Walk through an end-to-end request from API Gateway to a .NET Lambda function, including authentication, validation, logging, error mapping, and the response.
2. How would you structure a production-ready .NET Lambda solution using dependency injection, configuration, reusable services, and unit tests?
3. What causes cold starts in .NET Lambda, how would you measure them, and which optimizations would you apply before paying for provisioned concurrency?
4. How do Lambda reserved concurrency and account concurrency protect downstream systems such as SQL databases and third-party APIs?
5. How would you configure API Gateway stages, deployments, custom domains, throttling, quotas, access logs, and request tracing?
6. When would you choose an HTTP API instead of a REST API in API Gateway, and what functionality or cost trade-offs would you explain?
7. How would you implement API Gateway authorization using IAM, Cognito JWT authorizers, or a Lambda authorizer, and when is each appropriate?
8. How would you create a least-privilege IAM execution role for a Lambda function that reads one S3 prefix and writes CloudWatch logs?
9. Explain the difference between an IAM identity policy, resource policy, permissions boundary, role trust policy, and service control policy.
10. How would you use CloudWatch Logs Insights to investigate a failing request across API Gateway and Lambda using a correlation ID?
11. Which Lambda and API Gateway CloudWatch metrics would you place on a dashboard, and which alarms would indicate a customer-impacting incident?
12. How would you design CloudWatch alarms to avoid noisy alerts while still detecting errors, latency, throttling, and exhausted concurrency?
13. How would you securely upload a large file directly from a React application to S3 without sending the file through the .NET API?
14. How would S3 versioning, lifecycle rules, encryption, replication, and object lock support security, recovery, compliance, and cost control?
15. How would you deploy an ASP.NET Core API to EC2 using a load balancer, target groups, health checks, Auto Scaling, IAM roles, and CloudWatch Agent?
16. What EC2 operating-system, application, and load-balancer signals would you monitor, and how would you distinguish infrastructure failure from application failure?
17. How would you perform a safe EC2 deployment with immutable images, rolling replacement, blue-green environments, health validation, and rollback?
18. How would you explain the AWS work from your Visa experience honestly while demonstrating ownership, production awareness, and readiness for deeper AWS responsibilities?

### AWS Production Scenario Questions

1. API Gateway starts returning 502 errors after a new .NET Lambda deployment. How would you isolate whether the problem is the integration response, Lambda exception, timeout, permissions, or deployment configuration?
2. A Lambda function works in development but receives AccessDenied when reading an S3 object in production. How would you diagnose IAM policies, bucket policies, encryption keys, object ownership, and account boundaries?
3. A traffic spike causes Lambda throttling and database connection exhaustion. What would you do immediately, and how would you redesign concurrency, connection handling, buffering, and scaling?
4. Lambda duration has increased sharply but invocation count is unchanged. Which CloudWatch data and application traces would you inspect, and how would you identify the slow dependency?
5. CloudWatch shows successful Lambda invocations, but customers receive errors from API Gateway. How would you correlate access logs, execution logs, status codes, integration latency, and request IDs?
6. Users upload duplicate files to S3 and each upload triggers duplicate downstream processing. How would you introduce idempotency, event filtering, durable state, retries, and safe replay?
7. A private S3 bucket is accidentally made public. What immediate containment, evidence collection, credential review, customer-impact assessment, and preventive controls would you apply?
8. An EC2-hosted ASP.NET Core service is healthy according to CPU monitoring but intermittently fails load-balancer health checks. How would you investigate memory, disk, networking, process health, logs, and dependency latency?
9. An EC2 deployment passes the pipeline but the new instances never become healthy in the target group. How would you diagnose ports, security groups, health-check paths, startup configuration, and instance logs?
10. An EC2 instance becomes unresponsive during peak load. How would you recover service safely and decide whether to resize, auto scale, optimize the application, or change the architecture?
11. An IAM role was granted broad administrator access to resolve an urgent incident. How would you restore least privilege without breaking production and prove that the narrower policy is sufficient?
12. A team cannot find the cause of a production failure because API Gateway, Lambda, and EC2 logs are fragmented. How would you create a correlated observability design using structured logs, metrics, alarms, dashboards, and tracing?
13. S3 storage cost grows every month because old uploads and incomplete multipart uploads are never removed. How would you analyze usage and introduce safe lifecycle policies?
14. You need to release a breaking Lambda change without interrupting API clients. How would you use versions, aliases, weighted routing, API versioning, canary validation, and rollback?
15. A customer asks what you personally implemented in AWS at Visa. How would you give a precise STAR answer that separates your contribution from the wider team’s work?

### Cloud Security, Reliability, and Cost

1. How would you apply least privilege across developers, pipelines, workloads, and support teams?
2. How do you build a secure software supply chain for cloud-hosted .NET applications?
3. How would you protect a public API using identity, WAF, rate limiting, validation, and DDoS controls?
4. How do availability zones and regions affect high availability and disaster recovery design?
5. How would you define and validate RTO and RPO for a business-critical service?
6. How do retries, exponential backoff, jitter, circuit breakers, and timeouts prevent cascading failures?
7. How would you design centralized logs, metrics, traces, correlation IDs, alerts, and operational dashboards?
8. How do you investigate and reduce an unexpected Azure or AWS cost increase?
9. What cloud resources should be provisioned using Terraform, Bicep, or CloudFormation, and why?
10. How would you manage database backups, restore testing, cross-region recovery, and failover?
11. How do you secure container images, registries, runtime identities, Kubernetes secrets, and network traffic?
12. What evidence would you collect before scaling up infrastructure to solve a performance problem?

### Senior Azure and AWS Scenarios

1. A .NET API is fast locally but intermittently slow after deployment to Azure App Service. How would you investigate it end to end?
2. An AWS Lambda function processes an SQS message twice and creates two payments. How would you correct the design and existing data?
3. An Azure Service Bus queue grows continuously during peak traffic. What metrics, dependencies, and consumer settings would you check?
4. A production deployment introduces errors for 10 percent of users. How would you use canary or blue-green deployment to mitigate and recover?
5. A company wants to migrate a large ASP.NET Framework monolith to Azure or AWS without a risky big-bang rewrite. What migration roadmap would you propose?
6. A database is private but the application can no longer connect after a network change. How would you diagnose routing, DNS, identity, and firewall rules?
7. A public storage bucket or container holding customer documents is discovered. What immediate and longer-term actions would you take?
8. The primary cloud region becomes unavailable during business hours. How should traffic, data, messaging, and operational communication behave?
9. A third-party API becomes slow and causes thread-pool exhaustion across your .NET services. How would you stabilize the platform?
10. Monthly cloud cost has doubled without a matching increase in users. How would you identify the cause and prevent recurrence?
11. Two teams need to publish breaking event-contract changes independently. How would you introduce versioning without downtime?
12. An AKS or EKS deployment repeatedly restarts under load even though average CPU looks normal. How would you investigate and fix it?
13. Security asks you to remove all stored cloud credentials from applications and pipelines. How would you migrate to workload identities and roles?
14. You must move a customer-facing system from Azure to AWS, or AWS to Azure, with minimal downtime. What should remain portable and what should be redesigned?

## RabbitMQ

### RabbitMQ Fundamentals

1. What is RabbitMQ, and what problem does it solve?
2. When would you use RabbitMQ instead of a direct REST API call?
3. What is the difference between a producer, exchange, queue, binding, and consumer?
4. What is a routing key?
5. What is the difference between direct, fanout, topic, and headers exchanges?
6. How does a message move from producer to consumer in RabbitMQ?
7. What is the difference between a queue and an exchange?
8. Can one message be delivered to multiple queues? How?
9. What happens if a producer publishes to an exchange with no matching binding?
10. What is the difference between point-to-point messaging and publish-subscribe messaging?
11. RabbitMQ versus Kafka: when would you choose each?
12. RabbitMQ versus Azure Service Bus: what are the practical differences?

### Reliability and Delivery Guarantees

1. What are acknowledgements in RabbitMQ?
2. What is the difference between auto-ack and manual ack?
3. When should a consumer ack a message?
4. What happens if a consumer crashes before acknowledging a message?
5. What is message durability?
6. What is the difference between a durable queue and a persistent message?
7. Do durable queues alone guarantee that messages will not be lost?
8. What are publisher confirms?
9. How do publisher confirms differ from consumer acknowledgements?
10. What is at-least-once delivery?
11. Can RabbitMQ guarantee exactly-once processing?
12. How do you make a RabbitMQ consumer idempotent?
13. What is a dead-letter exchange?
14. What is a dead-letter queue?
15. What is a poison message?
16. How do you design retry handling without creating an infinite retry loop?
17. What is exponential backoff in message retry?
18. How do you avoid retry storms?
19. What is the outbox pattern, and why is it useful with RabbitMQ?
20. The database commit succeeds but RabbitMQ publishing fails. How do you solve it?

### Consumer Design and Performance

1. What is prefetch count in RabbitMQ?
2. How does prefetch count affect consumer throughput?
3. How do you handle slow consumers?
4. How do you scale RabbitMQ consumers horizontally?
5. What happens when multiple consumers listen to the same queue?
6. How do you preserve message ordering when using multiple consumers?
7. When is message ordering important?
8. How do you process long-running jobs safely?
9. How do you prevent one bad message from blocking the queue?
10. How do you design a consumer so it can be restarted safely?
11. How do you handle cancellation and graceful shutdown in a .NET RabbitMQ consumer?
12. How do you avoid processing too many messages at once?
13. What metrics would you monitor for consumer health?
14. How do you handle backpressure in a message-driven system?

### RabbitMQ with .NET

1. How would you publish a RabbitMQ message from an ASP.NET Core API?
2. How would you implement a RabbitMQ consumer using BackgroundService in .NET?
3. Where would you register RabbitMQ connections and channels in dependency injection?
4. Should RabbitMQ channels be shared across threads?
5. How do you serialize messages in a .NET RabbitMQ system?
6. How do you version message contracts?
7. How do you avoid breaking existing consumers when a message schema changes?
8. How would you include correlation IDs in RabbitMQ messages?
9. How do you log and trace a message across API, publisher, queue, and consumer?
10. How do you write unit tests for a service that publishes RabbitMQ messages?
11. How do you integration test RabbitMQ flows?
12. What information should be included in a message envelope?
13. How do you handle exceptions inside a .NET consumer?
14. How do you prevent duplicate database writes from duplicate RabbitMQ messages?

### Operations, Security, and Monitoring

1. How do you monitor RabbitMQ in production?
2. What does increasing queue depth usually mean?
3. What does unacked message count mean?
4. What does a high ready message count indicate?
5. How do you debug a message that was published but not consumed?
6. How do you debug a queue that is growing continuously?
7. What RabbitMQ management UI information do you check first during an incident?
8. How do you secure RabbitMQ credentials?
9. How do you secure RabbitMQ connections?
10. What is TLS used for in RabbitMQ?
11. How do you apply least privilege to RabbitMQ users?
12. How do you separate environments and applications in RabbitMQ?
13. What is a virtual host in RabbitMQ?
14. How do you plan RabbitMQ capacity?
15. What happens if RabbitMQ is unavailable?
16. How should an application behave when it cannot publish a message?

### Scenario-Based RabbitMQ Problems

1. A payment message is processed twice and the customer is charged twice. How do you fix the design?
2. A RabbitMQ queue is growing continuously during peak hours. How do you investigate?
3. A consumer crashes after saving to the database but before acknowledging the message. What happens, and how do you make it safe?
4. An API successfully saves an order but fails to publish OrderCreated to RabbitMQ. How do you prevent losing the event?
5. A poison message keeps retrying and blocks useful work. What retry and DLQ strategy would you design?
6. A notification service receives duplicate OrderCreated events. How should the consumer behave?
7. A message was published but no consumer received it. What configuration and runtime checks would you perform?
8. A new consumer version cannot read old messages. How would you handle message contract versioning?
9. The business needs strict ordering for account balance events. How would you design the queues and consumers?
10. RabbitMQ goes down for 10 minutes while the API is still receiving requests. What should happen?
11. A consumer is too slow because it calls a third-party API for every message. How would you redesign it?
12. A deployment accidentally creates a queue with a wrong routing key. How would you detect and recover?
13. A batch job publishes one million messages and overwhelms consumers. How do you protect the system?
14. A consumer logs sensitive customer data from message payloads. What should change?
15. You are asked to replace synchronous API calls with RabbitMQ. What questions do you ask before agreeing?
16. A manager asks why a user sees pending status after submitting a request. How do you explain eventual consistency?
17. You need to migrate from one message contract to another without downtime. What steps would you take?
18. A dead-letter queue contains thousands of messages. How do you triage, replay, and prevent recurrence?
19. A service publishes a message inside a database transaction. What can go wrong?
20. How would you design RabbitMQ messaging for order creation, payment capture, invoice generation, and email notification?

## SQL Server

### SQL Server Fundamentals

1. What is SQL Server, and where have you used it in enterprise applications?
2. What is the difference between a table, view, stored procedure, and function?
3. What is the difference between primary key, foreign key, unique key, and composite key?
4. What is the difference between DELETE, TRUNCATE, and DROP?
5. What is the difference between CHAR, VARCHAR, NCHAR, and NVARCHAR?
6. What is the difference between DATETIME, DATETIME2, and DATE?
7. What is NULL in SQL, and why can it cause bugs?
8. What is the difference between COUNT(*), COUNT(1), and COUNT(column)?
9. What is normalization, and why does it matter?
10. When would you intentionally denormalize data?

### Joins, Filtering, and Aggregation

1. What is the difference between INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL JOIN?
2. How do CROSS JOIN and CROSS APPLY differ?
3. What is the difference between WHERE and HAVING?
4. What is the difference between UNION and UNION ALL?
5. How do GROUP BY and aggregate functions work?
6. How do you find duplicate records in a table?
7. How do you return employees who do not belong to any department?
8. How do you count records per category including categories with zero records?
9. How do you filter records by date range safely?
10. How do you avoid accidental duplicate rows after joining multiple tables?

### Indexes and Execution Plans

1. What is a clustered index?
2. What is a non-clustered index?
3. What is the difference between index seek and index scan?
4. What is a covering index?
5. What are included columns in an index?
6. How do you decide which columns should be indexed?
7. How can indexes improve reads but slow writes?
8. How do you read an execution plan?
9. What are key lookup, table scan, bookmark lookup, and sort operators?
10. How do you detect missing or unused indexes?

### Performance Tuning

1. How do you optimize a slow SQL query?
2. What is parameter sniffing?
3. How do you fix parameter sniffing issues?
4. What are statistics in SQL Server?
5. How do outdated statistics affect query performance?
6. How do you optimize pagination for a very large table?
7. How do you tune a report query that joins many large tables?
8. How do you identify blocking queries?
9. How do you investigate high CPU usage from SQL Server?
10. How do you decide whether to tune SQL, add an index, cache data, or change application logic?

### Transactions, Locks, and Concurrency

1. What is a database transaction?
2. What are ACID properties?
3. What are SQL Server isolation levels?
4. What is the difference between READ COMMITTED and SNAPSHOT isolation?
5. What is a dirty read, non-repeatable read, and phantom read?
6. What is a deadlock?
7. How do you troubleshoot a deadlock?
8. How do you prevent long-running transactions?
9. What is optimistic concurrency?
10. What is the difference between row lock, page lock, and table lock?

### Stored Procedures, Functions, and Views

1. When would you use a stored procedure?
2. When would you avoid putting business logic in stored procedures?
3. What is the difference between scalar function and table-valued function?
4. Why can scalar functions hurt performance?
5. What is an indexed view?
6. How do you version stored procedures safely?
7. How do you handle errors inside a stored procedure?
8. How do you use TRY...CATCH in T-SQL?
9. How do you return validation errors from SQL to an API?
10. How do you test stored procedures?

### Advanced T-SQL and Coding Tasks

1. What is a CTE, and when would you use it?
2. What is a recursive CTE?
3. What are window functions?
4. How do ROW_NUMBER, RANK, and DENSE_RANK differ?
5. Write a query to find the second-highest salary.
6. Write a query to find duplicate emails.
7. Write a query to delete duplicate records but keep the latest one.
8. Write a query to calculate running totals.
9. Write a query to return top N records per group.
10. Write a query to pivot monthly sales into columns.

### Data Modeling and Design

1. How would you design tables for users, roles, permissions, and audit history?
2. How would you design a payment transaction table?
3. How would you design customers, offers, redemptions, and stores for a loyalty platform?
4. How would you design soft delete and audit columns?
5. How would you design multi-tenant data access in SQL Server?
6. How do you choose between GUID and INT identity keys?
7. How do you design for high-volume inserts?
8. How do you archive old transactional data safely?
9. How do you design lookup tables?
10. How do you enforce referential integrity without over-coupling the system?

### Security, Backup, and Operations

1. How do you prevent SQL injection?
2. How do parameterized queries protect against SQL injection?
3. How do you apply least privilege for SQL users?
4. How do you protect PII in SQL Server?
5. How do you audit sensitive data changes?
6. What is the difference between full, differential, and transaction log backups?
7. What are RPO and RTO?
8. How do you restore a database to a point in time?
9. How do you monitor database health in production?
10. What checks do you perform before a database deployment?

### SQL Server Scenario Questions

1. An API endpoint is slow because of a SQL query. How do you investigate from application logs to execution plan?
2. A report query runs fast in development but times out in production. What do you check?
3. A table has 100 million rows and pagination is slow. How do you redesign the query?
4. A new index improved one query but slowed down writes. How do you handle the trade-off?
5. A deadlock happens during payment processing. What is your investigation and fix?
6. A stored procedure is sometimes fast and sometimes slow with the same code. How do you diagnose it?
7. A deployment adds a nullable column needed by the API. How do you make it zero-downtime?
8. A customer says their transaction history is missing records. How do you troubleshoot data correctness?
9. A migration script failed halfway in production. What is your response plan?
10. A query uses SELECT * across multiple joined tables. How would you review and improve it?
11. A dashboard needs near-real-time counts from a huge transactional table. How would you design it?
12. A SQL Server database is growing quickly. How do you investigate storage and retention?
13. A support user exported sensitive customer data. How would you improve access and audit controls?
14. A nightly job blocks daytime API traffic. How do you fix scheduling, locking, and isolation?
15. A database CPU spike starts after a release. How do you isolate the query or code change?

## React

### React Basics

1. What is React, and why is it used?
2. What is JSX?
3. What is the difference between an element and a component?
4. What are props in React?
5. What is state in React?
6. What is the difference between props and state?
7. What is a functional component?
8. What is a class component?
9. Why are keys important when rendering lists?
10. What happens when state changes in React?
11. What is one-way data flow?
12. What is conditional rendering?

### Hooks

1. What is useState?
2. What is useEffect?
3. What is the dependency array in useEffect?
4. What happens if you omit the dependency array?
5. What is useMemo, and when should you use it?
6. What is useCallback, and when should you use it?
7. What is useRef?
8. How is useRef different from useState?
9. What is useContext?
10. What is a custom hook?
11. What are the rules of hooks?
12. How do you clean up timers, subscriptions, or event listeners in useEffect?

### Component Design

1. How do you split a large component into smaller components?
2. How do you design reusable components?
3. When can a component become too generic?
4. What is component composition?
5. What is prop drilling?
6. How do you avoid prop drilling?
7. What are controlled components?
8. What are uncontrolled components?
9. How do you handle forms in React?
10. How do you design loading, empty, error, and success states?
11. How do you pass callbacks from parent to child?
12. How do you prevent duplicated UI logic?

### State Management

1. When should state live in a component?
2. When should state be lifted up?
3. When would you use Context API?
4. What problems can Context API create?
5. When would you use Redux, Zustand, React Query, or another state library?
6. What is derived state?
7. Why can copying props into state be dangerous?
8. How do you manage server state separately from UI state?
9. How do you handle optimistic updates?
10. How do you reset component state?
11. How do you keep state predictable in a large app?
12. How do you avoid stale state in async updates?

### API Integration

1. How do you fetch data from an API in React?
2. How do you handle loading and error states during API calls?
3. How do you cancel an in-flight request?
4. How do you avoid setting state after a component unmounts?
5. How do you handle pagination, filtering, and sorting from an API?
6. How do you handle authentication tokens in API requests?
7. How do you retry failed API calls safely?
8. How do you avoid duplicate API calls?
9. How do you cache API responses?
10. How do you handle 401, 403, 404, and 500 responses in the UI?
11. How do you design frontend/backend contracts?
12. How do you handle slow API responses gracefully?

### Performance

1. What causes unnecessary re-renders?
2. How do you identify performance issues in React?
3. When should you use React.memo?
4. When should you avoid useMemo or useCallback?
5. How do you optimize large lists?
6. What is virtualization?
7. How do you lazy load components?
8. What is code splitting?
9. How do you reduce bundle size?
10. How do you optimize images and assets in a React app?
11. How do you avoid expensive calculations during render?
12. How do you profile a React application?

### Routing and App Structure

1. How do you structure folders in a large React app?
2. What is React Router?
3. How do you protect routes that require authentication?
4. How do you handle nested routes?
5. How do you handle route params and query strings?
6. How do you preserve filter state in the URL?
7. How do you handle 404 pages?
8. How do you navigate programmatically?
9. How do you share layouts across pages?
10. How do you organize API clients, hooks, components, and utilities?

### Testing

1. How do you test React components?
2. What is the difference between unit, integration, and end-to-end tests in frontend?
3. What is React Testing Library?
4. Why should tests focus on user behavior instead of implementation details?
5. How do you test a component that fetches API data?
6. How do you mock API calls?
7. How do you test forms and validation?
8. How do you test loading and error states?
9. How do you test custom hooks?
10. What makes a frontend test flaky?

### TypeScript with React

1. How do you type component props?
2. How do you type useState?
3. How do you type event handlers?
4. How do you type API response models?
5. What is the difference between type and interface?
6. How do you type children?
7. How do you type reusable generic components?
8. How do you handle optional props safely?
9. How do you avoid using any?
10. How do TypeScript types improve frontend/backend contracts?

### Senior React Scenarios

1. A React page is slow when rendering 10,000 rows. What do you do?
2. A component fetches the same API multiple times. How do you fix it?
3. A useEffect causes an infinite loop. How do you debug it?
4. A form loses user input after navigation. How do you preserve it?
5. A user sees stale data after saving. How do you handle cache invalidation?
6. A production UI bug only happens for one browser. How do you investigate?
7. A junior developer put business logic inside JSX. What feedback do you give?
8. A global context update re-renders the whole app. How do you improve it?
9. A button submits twice and creates duplicate records. How do you prevent it?
10. A dashboard needs real-time updates. How would you design the React side?

### React Coding Tasks

1. Build a search box that filters a list as the user types.
2. Build a reusable modal component.
3. Build a paginated table with loading and empty states.
4. Build a form with validation and submit handling.
5. Build a custom useDebounce hook.
6. Build a custom useFetch hook.
7. Build tabs where the active tab is stored in the URL.
8. Build a todo list with add, edit, complete, and delete.
9. Build an autocomplete input that calls an API.
10. Build a component that handles retry after a failed API request.

## Angular

### Angular 14 vs Angular 22

1. What are the most important differences between Angular 14 and Angular 22?
2. How did standalone components evolve from developer preview in Angular 14 to the default component model in modern Angular?
3. How does an Angular 14 NgModule-based application differ from an Angular 22 standalone application?
4. How would you replace bootstrapModule and AppModule with bootstrapApplication and application providers?
5. How do Angular 22 signals differ from the RxJS-heavy state patterns commonly used in Angular 14?
6. When should an Angular 22 application still use RxJS instead of signals?
7. How do signal inputs, outputs, model inputs, and signal queries differ from @Input, @Output, and decorator queries?
8. How does the built-in @if, @for, and @switch control flow differ from *ngIf, *ngFor, and *ngSwitch?
9. How does @for track items, and how does that compare with an Angular 14 trackBy function?
10. What are deferrable views with @defer, and what problem do they solve compared with Angular 14?
11. How have Angular build and development tooling changed from the older Webpack-based Angular 14 pipeline to the modern application builder?
12. What is zoneless change detection, and how does it differ from the Zone.js-based behavior of Angular 14?
13. How have server-side rendering, hydration, event replay, and incremental hydration evolved since Angular 14?
14. How did typed reactive forms introduced in Angular 14 improve form safety, and what does Angular 22 add with Signal Forms?
15. How would you explain the testing-tool changes from Karma/Jasmine-era Angular 14 projects to Vitest in modern Angular?

### Angular 22 Deep Dive

1. Which Angular 22 features would you adopt immediately in a production application, and which would you introduce incrementally?
2. How do signal, computed, linkedSignal, and effect differ, and what is an appropriate use case for each?
3. Why should effect usually not be used to propagate application state?
4. How do you convert an Observable to a signal with toSignal, and a signal to an Observable with toObservable?
5. How do resource and httpResource model asynchronous signal-based data?
6. When would you choose httpResource over HttpClient with RxJS, and when would you not?
7. How do loading, value, error, refresh, and cancellation behave in a signal-based resource?
8. How do Signal Forms differ from classic reactive forms, and how would you migrate a large form gradually?
9. How do you implement synchronous, asynchronous, cross-field, and HTTP validation with Signal Forms?
10. How do standalone route configuration and loadComponent improve lazy loading?
11. How do route-level server, prerender, and client render modes work in a hybrid Angular 22 application?
12. What are hydration, incremental hydration, and event replay, and how do they improve SSR user experience?
13. What application changes are required before removing Zone.js and running zoneless?
14. How do OnPush, signals, and zoneless change detection work together?
15. How would you profile signal updates and change detection using Angular DevTools?
16. How do you test a standalone Angular 22 component without creating a test NgModule?
17. How do you test signals, effects, httpResource, router behavior, and Signal Forms with Vitest?
18. How would you organize a large Angular 22 application by feature while avoiding a new version of SharedModule?
19. What security responsibilities belong to Angular interceptors and route guards, and what must always be enforced by the backend?
20. Design an Angular 22 screen that loads a large dataset, supports filtering, preserves URL state, and remains fast and accessible.

### Angular 14 to 22 Migration

1. How would you plan a low-risk migration from Angular 14 to Angular 22?
2. Why should Angular major versions normally be upgraded sequentially with ng update?
3. What would you check for Node.js, TypeScript, RxJS, Angular Material, and third-party library compatibility at each step?
4. How would you use Angular update schematics while keeping each migration commit reviewable and reversible?
5. Would you upgrade framework versions and rewrite the application to signals and standalone components at the same time? Explain the trade-off.
6. How would you migrate NgModules to standalone APIs incrementally?
7. How would you migrate structural directives to built-in control flow and validate rendering behavior?
8. How would you migrate constructor injection to inject and decorator inputs to signal inputs without destabilizing the app?
9. How would you migrate Karma tests to Vitest and identify behavior hidden by brittle tests?
10. What build, bundle-size, performance, SSR, accessibility, and browser-regression checks would you run before release?
11. How would you roll out the Angular 22 application safely and recover if production metrics regress?
12. After reaching Angular 22, how would you prioritize optional modernization work and measure whether it creates value?

### Angular Basics

1. What is Angular, and how is it different from React?
2. What are components in Angular?
3. What is a template in Angular?
4. What is data binding in Angular?
5. What is interpolation?
6. What is property binding?
7. What is event binding?
8. What is two-way binding?
9. What is the role of TypeScript in Angular?
10. What is the difference between AngularJS and modern Angular?

### Components and Lifecycle

1. What are Angular lifecycle hooks?
2. When do you use ngOnInit?
3. When do you use ngOnDestroy?
4. What is the difference between constructor and ngOnInit?
5. How do parent and child components communicate?
6. What are @Input and @Output?
7. What is EventEmitter?
8. How do you pass data between unrelated components?
9. How do you design reusable Angular components?
10. How do you avoid putting too much logic in a component?

### Directives and Pipes

1. What are directives in Angular?
2. What is the difference between structural and attribute directives?
3. How do ngIf and ngFor work?
4. What is trackBy in ngFor, and why is it useful?
5. What are pipes in Angular?
6. What is the difference between pure and impure pipes?
7. When would you create a custom directive?
8. When would you create a custom pipe?
9. How do directives help reduce duplicated template logic?
10. What mistakes can make templates hard to maintain?

### Services and Dependency Injection

1. What is dependency injection in Angular?
2. What are Angular services?
3. Why should API logic usually live in services instead of components?
4. What does providedIn: root mean?
5. How do service scopes work in Angular?
6. How do you share state using a service?
7. How do you mock a service in unit tests?
8. How do you avoid circular dependencies between services?
9. How do interceptors fit with services?
10. How would you organize services in a large Angular app?

### Routing and Guards

1. How does Angular routing work?
2. How do you configure child routes?
3. What are route parameters?
4. How do you read query string values in Angular?
5. What are route guards?
6. What is the difference between CanActivate and CanDeactivate?
7. How do you protect routes that require login?
8. How do you lazy load Angular routes?
9. How do you handle a 404 route?
10. How do you preserve filters or tabs in the URL?

### Forms and Validation

1. What is the difference between template-driven forms and reactive forms?
2. When would you choose reactive forms?
3. What are FormControl, FormGroup, and FormArray?
4. How do you add synchronous validation?
5. How do you add asynchronous validation?
6. How do you show validation messages cleanly?
7. How do you handle dynamic form fields?
8. How do you reset a form after submit?
9. How do you prevent duplicate form submission?
10. How do you map form values to backend DTOs safely?

### RxJS and API Integration

1. What is an Observable in Angular?
2. How is an Observable different from a Promise?
3. What is subscribe?
4. What is the async pipe, and why is it useful?
5. When do you need to unsubscribe?
6. How do switchMap, mergeMap, concatMap, and exhaustMap differ?
7. How do you handle API errors with RxJS?
8. How do you cancel stale API calls in a search box?
9. How do you cache API responses in Angular?
10. How do you handle loading, empty, and error states from an API?

### Performance and Change Detection

1. How does Angular change detection work?
2. What is ChangeDetectionStrategy.OnPush?
3. When should you use OnPush?
4. How does trackBy improve ngFor performance?
5. How do you optimize a large Angular table?
6. How do you lazy load modules or standalone routes?
7. How do you reduce Angular bundle size?
8. How do you debug a slow Angular page?
9. How do you avoid memory leaks from subscriptions?
10. How do signals affect Angular state management?

### Testing

1. How do you test Angular components?
2. What is TestBed?
3. How do you test Angular services?
4. How do you mock HttpClient calls?
5. How do you test reactive forms?
6. How do you test route guards?
7. How do you test components with @Input and @Output?
8. What should be unit tested vs integration tested in Angular?
9. What makes Angular tests flaky?
10. How do you structure frontend tests for a large Angular app?

### Senior Angular Scenarios

1. An Angular page is slow with a large dataset. How do you investigate and fix it?
2. A search box fires too many API calls. How do you solve it with RxJS?
3. A user loses form data after navigation. How do you preserve it?
4. A component has too many inputs and outputs. How would you refactor it?
5. A memory leak appears after navigating between pages. What do you check?
6. A junior developer put business logic in an Angular component. What feedback do you give?
7. A route guard works locally but fails after refresh in production. How do you debug it?
8. A backend API changes a DTO used by Angular screens. How do you protect the frontend?
9. A role-based menu shows links the user cannot access. How do you fix it?
10. How would you structure a large enterprise Angular app with features, shared UI, services, and routing?

## Authentication, Authorization, Identity and Passkeys

### Authentication Fundamentals

1. What is the difference between authentication and authorization?
2. How would you explain authentication to a non-technical person?
3. What is identity in an application?
4. What is a claim, and how is it different from a role?
5. What is the difference between session-based authentication and token-based authentication?
6. When would you use cookies instead of JWTs?
7. When would you use JWTs instead of cookies?
8. What information should not be stored in a JWT?
9. What is token expiry, and why is it important?
10. What is refresh token rotation?
11. What is MFA, and when should it be required?
12. How do you design logout securely?

### Authorization and Access Control

1. How do role-based access control and policy-based authorization differ?
2. How would you design permissions for Admin, Support, Manager, and Customer users?
3. What is least privilege?
4. What is broken object-level authorization, and how do you prevent it?
5. How do you secure an endpoint that returns user-specific data?
6. How do you handle authorization in the frontend vs backend?
7. How do you design row-level or tenant-level authorization?
8. How do you handle permission changes while a user is already logged in?
9. How do you audit authorization decisions?
10. How do you test authorization rules?

### ASP.NET Core Identity

1. What is ASP.NET Core Identity?
2. How would you build login and registration using ASP.NET Core Identity?
3. How do you store passwords safely?
4. How do password hashing, salting, and peppering differ?
5. How do you implement account lockout?
6. How do you implement email confirmation and password reset?
7. How do you customize Identity users and roles?
8. How do you integrate Identity with existing customer tables?
9. How do you migrate from a custom user system to ASP.NET Core Identity?
10. How do you protect Identity endpoints from brute force attacks?

### OAuth2 and OpenID Connect

1. What is the difference between OAuth2 and OpenID Connect?
2. What is an authorization code flow?
3. Why is PKCE important?
4. What is an ID token?
5. What is an access token?
6. What is a refresh token?
7. How do scopes differ from roles?
8. How would you integrate Google, Microsoft, or Azure AD login?
9. How do you validate tokens in an ASP.NET Core API?
10. How do you design single sign-on for multiple applications?

### Passkeys and WebAuthn

1. What is a passkey?
2. How do passkeys differ from passwords?
3. What is WebAuthn?
4. What is FIDO2?
5. What is a relying party in WebAuthn?
6. What is an authenticator?
7. How does passkey registration work?
8. How does passkey login work?
9. What is a challenge in WebAuthn?
10. Why are passkeys phishing-resistant?
11. What data do you store in the database for a passkey?
12. How do you handle users with multiple devices or multiple passkeys?
13. How do you handle passkey recovery if a user loses a device?
14. Can passkeys replace MFA?
15. How would you add passkeys to an existing password-based system?

### Passkey Implementation Scenarios

1. Design a passkey registration API in ASP.NET Core.
2. Design a passkey login API in ASP.NET Core.
3. How would React call navigator.credentials.create for passkey registration?
4. How would React call navigator.credentials.get for passkey login?
5. How do you prevent replay attacks in a WebAuthn flow?
6. How do you validate origin and relying party ID?
7. How do you handle passkeys across subdomains?
8. How do you support both password login and passkey login during migration?
9. How do you test passkeys locally and in staging?
10. How do you make passkey UX understandable for non-technical users?

### Security Scenario Questions

1. A user reports account takeover. How do you investigate?
2. A refresh token is leaked. What do you do?
3. A support user can access customer records they should not see. How do you fix it?
4. A JWT contains too much personal data. What is the risk and fix?
5. A password reset link is being abused. How do you protect it?
6. A user loses their passkey-enabled phone. How should recovery work?
7. A passkey works on localhost but fails in production. What do you check?
8. A mobile app receives 401 errors after token refresh. How do you debug it?
9. A user’s role changes but they still have old access. How do you handle it?
10. How would you design secure authentication for a React frontend and ASP.NET Core backend?

## Advanced

### Advanced C#

1. How does garbage collection work in .NET, and how do Gen 0, Gen 1, Gen 2, and LOH differ?
2. What is the difference between Task, ValueTask, Thread, and ThreadPool?
3. How do you handle cancellation using CancellationToken in APIs and background jobs?
4. What are covariance and contravariance in C# generics?
5. How do Span<T> and Memory<T> help with performance-sensitive code?
6. What is the difference between lock, SemaphoreSlim, Mutex, and Monitor?
7. How do you prevent race conditions in async code?
8. When would you use immutable objects in enterprise systems?
9. What is reflection, and what are its performance and security risks?
10. How do you design a reusable C# library used by multiple services?

### ASP.NET Core Production APIs

1. How do you structure controllers, services, validators, repositories, and DTOs in a large API?
2. How do you implement request correlation IDs across logs and downstream services?
3. How do you design consistent API error responses using ProblemDetails?
4. How do you protect APIs against over-posting, broken object-level authorization, and excessive data exposure?
5. How do you implement rate limiting and throttling?
6. How do you design health checks for database, cache, queue, and downstream APIs?
7. How do you handle long-running operations in an HTTP API?
8. What belongs in middleware, filters, endpoint filters, and service classes?
9. How do you design backward-compatible API changes?
10. How do you test API contracts between frontend and backend?

### Architecture and System Design

1. Design a payment authorization service that must be reliable, observable, and idempotent.
2. Design a job matching system that parses CVs, stores applications, and ranks job descriptions.
3. How would you split a betting platform into bounded contexts?
4. How would you design a data import pipeline for Excel files with validation, cleansing, and audit logs?
5. How would you design dashboards for high-volume transactional data?
6. When would you use clean architecture, vertical slices, or a modular monolith?
7. How do you handle shared libraries without tightly coupling microservices?
8. How do you introduce caching without serving stale or incorrect business data?
9. How do you design multi-tenant data access safely?
10. How do you plan a zero-downtime deployment with database changes?

### Microservices Deep Dive

1. How do you choose between choreography and orchestration?
2. How do you design saga compensation for a failed payment workflow?
3. How do you handle schema changes for events already consumed by other services?
4. How do you version events and APIs independently?
5. What is consumer-driven contract testing?
6. How do you avoid distributed monoliths?
7. How do you decide whether a service should own its own database?
8. How do you handle timeout, retry, circuit breaker, and bulkhead policies?
9. How do you trace a request across multiple services?
10. What monitoring signals prove a microservice is healthy?

### RabbitMQ Advanced

1. How do publisher confirms differ from consumer acknowledgements?
2. How do durable queues, persistent messages, and mirrored/quorum queues differ?
3. How do you design idempotent consumers?
4. How do you handle message ordering when multiple consumers are active?
5. How do you tune prefetch count for fair dispatch and throughput?
6. How do you design delayed retries using dead-letter exchanges?
7. What happens if a consumer keeps failing and requeueing the same message?
8. How do you monitor queue depth, consumer lag, publish rate, and acknowledgement rate?
9. When would RabbitMQ be a poor choice compared with Kafka or direct API calls?
10. How would you secure RabbitMQ connections and credentials?

### SQL Server Advanced

1. How do you diagnose blocking, deadlocks, and long-running transactions?
2. What is parameter sniffing, and how do you mitigate it?
3. How do covering indexes differ from composite indexes?
4. How do you decide included columns for a non-clustered index?
5. How do you optimize pagination for very large tables?
6. How do you tune stored procedures used by reports?
7. How do you safely archive old transactional data?
8. How do you handle optimistic vs pessimistic concurrency?
9. How do you design audit tables for regulated systems?
10. How do you review a query execution plan before changing indexes?

### Entity Framework and Dapper Deep Dive

1. How do you use AsNoTracking, projection, compiled queries, and split queries effectively?
2. How do you avoid cartesian explosion when loading related data?
3. How do you handle concurrency conflicts in EF Core?
4. How do you prevent accidental client-side evaluation or inefficient LINQ?
5. How do you handle migrations in a multi-developer team?
6. How do you test EF queries without hiding SQL performance issues?
7. When should Dapper return DTOs instead of domain entities?
8. How do you protect Dapper queries from SQL injection?
9. How do you handle transactions across EF and Dapper in the same workflow?
10. How do you measure whether EF or Dapper is the bottleneck?

### Frontend Senior Questions

1. How do you design reusable components without making them too generic?
2. How do you manage global state vs local component state?
3. How do you prevent unnecessary React re-renders?
4. How do you handle authentication tokens safely in a browser app?
5. How do you structure Angular modules, services, guards, and interceptors?
6. How do you design frontend error handling for API failures?
7. How do you test React or Angular components?
8. How do you handle accessibility in forms, buttons, and dynamic content?
9. How do you improve perceived performance for slow backend APIs?
10. How do you debug memory leaks in a frontend application?

### Security

1. How do authentication and authorization differ?
2. How do JWT, cookies, OAuth2, and OpenID Connect fit into enterprise APIs?
3. How do you prevent SQL injection, XSS, CSRF, and insecure direct object references?
4. How do you protect PII and payment-related data in logs?
5. How do you handle secrets in local development and production?
6. How do you implement least privilege for service accounts and databases?
7. How do you review third-party packages for risk?
8. How do you design secure file upload and parsing?
9. How do you handle audit logging without leaking sensitive details?
10. What would you check before approving a security-sensitive PR?

### Behavioral and Leadership

1. Tell me about a time you improved code quality across a team.
2. Tell me about a time you had to mentor someone under delivery pressure.
3. Tell me about a time production support changed your technical design.
4. Tell me about a difficult code review conversation.
5. Tell me about a time requirements changed late in delivery.
6. How do you make technical decisions when there is no perfect answer?
7. How do you balance speed, quality, risk, and maintainability?
8. How do you onboard yourself into a large unfamiliar codebase?
9. How do you explain architecture trade-offs to non-technical stakeholders?
10. What kind of senior developer do you want to be on a team?

## Answer Guides

1. Explain Transient, Scoped, and Singleton lifetimes.
2. What is middleware in ASP.NET Core?
3. What are async and await doing?
4. What is the difference between IEnumerable and IQueryable?
5. How do indexes improve query performance?
6. How do you avoid slow EF queries?
7. How do you decide service boundaries?
8. How do you make message processing reliable?
9. What are hooks, and what problems do they solve?
10. How do you prevent unnecessary re-renders?
11. How should frontend and backend handle errors?
12. How do you answer production issue questions?

## CLR Visual Guide

1. Big picture
2. CLR components
3. Memory allocation
4. Stack vs heap
5. GC roots and object graph
6. How GC works
7. Generations and LOH
8. What GC does not manage
9. What is CLR?
10. What is GC?
11. Memory Manager vs GC?
12. Why generations?
13. What triggers Gen2?

## Code First Migration Guide

1. 0. Big Picture
2. 1. Project Setup
3. 2. First Migration
4. 3. Configuring Tables, Columns, and Constraints
5. 4. Changing an Existing Model
6. 5. Relationships
7. 6. Seed Data and Data Migrations
8. 7. Production and Team Workflow
9. 8. Advanced Interview Points
10. You renamed Employee.Name to Employee.FullName and EF generated DropColumn/AddColumn. What do you do?
11. You need to add a non-nullable DepartmentId to Employees, but production already has employee rows.
12. Two developers added migrations from the same previous migration on different branches.
13. A migration works locally but times out in production.
14. How do you safely deploy a breaking column change with zero downtime?
15. What is Code First Migration?
16. What is the difference between migration and database update?
17. What should you check before applying a migration to production?
18. How do you handle migration rollback?

## Scenario Questions

1. A payment transaction API is slow during peak load. How do you investigate and fix it?
2. A RabbitMQ consumer processes the same message twice. How do you make the system safe?
3. An EF query works in development but times out in production. What do you check?
4. A React page becomes slow after loading a large dataset. How do you improve it?
5. A microservice dependency is down. How should your service behave?
6. A SQL report takes 90 seconds to load. What is your optimization plan?
7. A new feature needs changes in frontend, API, database, and messaging. How do you design and deliver it?
8. A junior developer submits code with business logic inside the controller. What feedback do you give?
9. A production bug affects customer transactions. What is your response process?
10. A product owner asks for a quick fix that creates technical debt. How do you handle it?

## CV-Specific Questions

1. At Visa, what enterprise applications did you enhance using C#, .NET MVC, React, EF, LINQ, RabbitMQ, and microservices?
2. What does AI-first engineering mean in your daily development work?
3. What security or reliability considerations matter most in payment applications?
4. At Nagarro, what microservice responsibilities did you own for Betsson Group?
5. How did RabbitMQ fit into your previous systems?
6. Why did you use both EF and Dapper?
7. At Genpact, how did data import, cleansing, and business manipulation work?
8. In the Capgemini auction platform, what SQL optimization work did you perform?

