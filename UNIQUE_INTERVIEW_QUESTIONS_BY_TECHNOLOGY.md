# Unique Interview Question Bank — Technology-wise

This file contains unique interview questions merged from the full `vemahend/MyBlogs` site and grouped technology-wise.

- **Current unique question count: 2075**
- Duplicate wording is normalized for case, punctuation and Markdown formatting.

## Technology Index

- **C# & .NET** — 144
- **Dependency Injection** — 19
- **ASP.NET Core & Web API** — 131
- **Entity Framework Core & Dapper** — 39
- **SQL Server & Data** — 152
- **Architecture & System Design** — 88
- **Modernisation & Technical Debt** — 60
- **Microservices & Distributed Systems** — 83
- **RabbitMQ & Messaging** — 122
- **Azure** — 131
- **AWS** — 61
- **Cloud Architecture, Reliability & Cost** — 26
- **React & TypeScript** — 129
- **Angular & RxJS** — 200
- **Frontend - General** — 41
- **Security, Identity & Passkeys** — 216
- **Testing & Quality** — 6
- **CI/CD & DevOps** — 27
- **Observability & Production Support** — 8
- **Live Coding & Practical Tasks** — 12
- **Leadership, Behavioral & Consulting** — 78
- **HR & Company Fit** — 16
- **Cross-Technology Scenarios & CV Questions** — 10
- **Cloud-Native .NET & Full Stack** — 130
- **Concurrency, Resilience & Reliability** — 14
- **CI/CD, Containers & DevOps** — 56
- **QA / Test Engineering** — 76

---

## C# & .NET (144)

### C# and .NET

1. Explain IEnumerable, IQueryable, and List. When can IQueryable cause performance issues?
2. What are async and await doing internally, and how do you avoid deadlocks?
3. Explain Transient, Scoped, and Singleton dependency injection lifetimes with examples.
4. How do you handle exceptions globally in a production ASP.NET Core API?
5. What is LINQ deferred execution, and when can it surprise developers?
6. How would you refactor a large service class with too many dependencies?
### C# Live Coding and LINQ

7. Find duplicate items in a list.
8. Remove duplicates from a list.
9. Find the first non-repeating character.
10. Reverse a string.
11. Count character frequency.
12. Group orders by customer.
13. Calculate total order value per customer.
14. Find the top three customers by order value.
15. Filter completed orders.
16. Sort customers by total spend.
17. Find duplicate transactions.
18. Merge two collections.
19. Find missing numbers in a sequence.
20. Find the second-highest value.
21. Group employees by department.
22. Find the highest-paid employee in each department.
23. Write a LINQ GroupBy.
24. Explain deferred execution.
25. What happens when ToList is called?
26. First versus FirstOrDefault?
27. Single versus SingleOrDefault?
28. Any versus Count greater than zero?
29. Select versus SelectMany?
30. IEnumerable versus IQueryable?
31. Where is an IQueryable query executed?
32. What happens if you call ToList too early?
33. How does EF Core translate LINQ to SQL?
34. What happens if EF cannot translate a LINQ expression?
35. Write an asynchronous method.
36. Refactor .Result to await.
37. Refactor .Wait to await.
38. Explain why sync-over-async is problematic.
39. Does await create a thread?
40. What happens internally when await is reached?
41. What is a Task?
42. Task versus Thread?
43. How do you run independent asynchronous operations concurrently?
44. Task.WhenAll versus sequential awaits?
45. What is a CancellationToken?
46. Why should APIs accept cancellation tokens?
47. How do you handle exceptions with Task.WhenAll?
48. How would you refactor a large service class?
49. How would you make this code testable?
50. What dependencies would you inject?
51. What problems do you see in this code?
52. How would you improve this code for production?
### Async Await and .NET Internals

53. Explain async and await internally.
54. Does async create a new thread?
55. What happens to the HTTP request thread during an I/O operation?
56. Who resumes the method after an await?
57. What is a continuation?
58. What is a state machine?
59. What does the C# compiler generate for an async method?
60. What is SynchronizationContext?
61. Why can .Result cause deadlocks?
62. Are deadlocks still possible in ASP.NET Core?
63. What is thread-pool starvation?
64. What is async all the way?
65. When should you use ConfigureAwait(false)?
66. CPU-bound versus I/O-bound work?
67. When would you use Task.Run?
68. Should you use Task.Run in an ASP.NET Core API?
69. How do you diagnose thread-pool starvation?
### Common C# Questions

70. What is CLR, and what services does it provide?
71. What is JIT compilation?
72. What is managed code vs unmanaged code?
73. What is the difference between class and struct?
74. What is the difference between interface and abstract class?
75. What is the difference between const, readonly, and static readonly?
76. What is the difference between ref, out, and in parameters?
77. What is the difference between string and StringBuilder?
78. What is boxing and unboxing?
79. What is the difference between IEnumerable and IEnumerator?
80. What is the difference between IEnumerable and IQueryable?
81. What is a delegate, event, lambda expression, and expression tree?
82. What is the difference between method overloading and method overriding?
83. What is the difference between virtual, override, abstract, sealed, and new?
84. What is garbage collection, and when should you avoid calling GC.Collect?
### Advanced C#

85. How does garbage collection work in .NET, and how do Gen 0, Gen 1, Gen 2, and LOH differ?
86. What is the difference between Task, ValueTask, Thread, and ThreadPool?
87. How do you handle cancellation using CancellationToken in APIs and background jobs?
88. What are covariance and contravariance in C# generics?
89. How do Span<T> and Memory<T> help with performance-sensitive code?
90. What is the difference between lock, SemaphoreSlim, Mutex, and Monitor?
91. How do you prevent race conditions in async code?
92. When would you use immutable objects in enterprise systems?
93. What is reflection, and what are its performance and security risks?
94. How do you design a reusable C# library used by multiple services?
### Answer Guides

95. What are async and await doing?
### CLR Visual Guide

96. What is CLR?
97. What is GC?
98. Memory Manager vs GC?
99. Why generations?
100. What triggers Gen2?
### Priority 1 — CQRS

101. How would you structure commands, command handlers, queries, and query handlers in .NET?
### C# and .NET Engineering Deep Dive

102. What happens from compiling a C# application to executing it in the .NET runtime?
103. Explain the CLR, IL, JIT compilation, and tiered compilation.
104. What is the difference between value types and reference types?
105. How do stack allocation, heap allocation, boxing, and unboxing affect performance?
106. How does the .NET garbage collector work across generations?
107. What is the Large Object Heap, and how can it affect application performance?
108. When should a type implement IDisposable or IAsyncDisposable?
109. Explain delegates, events, lambdas, and expression trees.
110. How do IEnumerable<T>, IAsyncEnumerable<T>, and IQueryable<T> differ?
111. What is deferred execution, and when can repeated enumeration cause bugs?
112. How do records, classes, structs, and readonly structs differ?
113. How do nullable reference types improve design without providing runtime enforcement?
114. How do generics improve type safety and performance?
115. What are covariance and contravariance in C#?
116. How do Task, ValueTask, and Thread differ?
117. How do race conditions occur, and how do lock, SemaphoreSlim, and immutable data help?
118. What is thread-pool starvation, and how would you diagnose it?
119. How do channels support producer-consumer workloads in .NET?
120. Which runtime, allocation, exception, and thread-pool metrics would you monitor?
### GraphQL with Hot Chocolate, GraphQL.NET, and Apollo

121. How do code-first, annotation-based, and schema-first approaches differ in Hot Chocolate?
122. Why can a DataLoader still perform poorly when scoped incorrectly?
123. How do you prevent resolvers from containing business logic?
124. How do you apply dependency injection with resolver lifetimes safely?
125. How do you implement mutations using CQRS commands?
126. How do you map domain failures into useful GraphQL errors?
127. How do you avoid exposing exception messages and stack traces?
128. How do you apply tenant isolation consistently across every resolver?
129. How do you prevent aliases and repeated fields from bypassing naive complexity limits?
130. How do you cache GraphQL responses or field results safely?
131. How do you monitor resolver latency and identify expensive fields?
132. How do you trace GraphQL operations with OpenTelemetry?
133. How do schema snapshots detect breaking changes?
134. How do Apollo Client cache normalization and type policies work?
135. How do Apollo Client fetch policies affect freshness and performance?
136. How do optimistic UI updates work, and how do you recover when a mutation fails?
137. How do Apollo Federation and schema stitching differ?
138. When should multiple teams adopt federation rather than one GraphQL gateway?
139. How do ownership and composition checks work in a federated graph?
140. Which protections belong in APIM and which must remain in the GraphQL server?
141. Design a transaction-history query that avoids N+1 queries and unbounded results.
### Cloud Design Principles for Modern Applications

142. How do you choose between synchronous and asynchronous integration?
143. How do twelve-factor application principles apply to modern .NET services?
### Observability, Logging, and Monitoring Deep Dive

144. When should asynchronous messaging use a span link instead of a parent-child span?

## Dependency Injection (19)

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

## ASP.NET Core & Web API (131)

### ASP.NET Core and Web API

1. How do you design a clean REST API for an enterprise application?
2. What status codes do you use for validation failure, unauthorized access, conflict, and unexpected errors?
3. How do middleware and filters differ in ASP.NET Core?
4. How would you design an API that needs idempotency?
5. How do you version APIs without breaking existing clients?
6. How would you troubleshoot a slow API endpoint in production?
### API Design and Integration Governance

7. How do you design a REST API?
8. What makes a good REST API?
9. How do you name API resources?
10. GET versus POST?
11. PUT versus PATCH?
12. Is PUT idempotent?
13. Is POST idempotent?
14. How do you make a POST request idempotent?
15. What is an idempotency key?
16. Where would you store an idempotency key?
17. How do you handle duplicate API requests?
18. How do you version an API?
19. URL versioning versus header versioning?
20. How do you introduce a breaking API change?
21. How do you maintain backward compatibility?
22. How long do you support an old API version?
23. How do you deprecate an API?
24. How do frontend and backend teams agree on an API contract?
25. What is contract-first API development?
26. What is OpenAPI?
27. How do you validate API contracts?
28. What is consumer-driven contract testing?
29. What is Pact testing?
30. How do you design consistent API errors?
31. What is ProblemDetails?
32. How do you implement global exception handling?
33. Where should validation happen?
34. How do you handle pagination?
35. Offset versus cursor pagination?
36. How do you handle filtering and sorting?
37. How do you secure an API?
38. How do you implement rate limiting and throttling?
39. What is a correlation ID?
40. How do you propagate a correlation ID?
41. How do you trace a request across microservices?
42. How do you handle API timeouts and retries?
43. Which HTTP errors should be retried?
44. Why should you not retry every request?
45. What are exponential backoff and jitter?
46. What is a circuit breaker?
47. API Gateway versus reverse proxy?
48. What should be handled at Azure API Management?
49. What should remain in application code?
### Senior .NET Backend for Plexure

50. Design an ASP.NET Core API for retrieving personalized offers for a mobile app.
51. How would you make a customer loyalty API reliable under high traffic?
52. How would you design idempotency for redeeming a loyalty offer?
53. How would you handle API rate limiting for mobile clients?
54. How would you version APIs used by mobile apps across many countries?
55. How would you design global exception handling and correlation IDs for a platform API?
56. How would you optimize an API that has high latency during campaign launches?
57. How would you secure APIs that expose customer profile, offers, and transaction history?
### Common ASP.NET / Web API Questions

58. What is the ASP.NET Core request pipeline?
59. What is middleware, and can you give examples of middleware you have used?
60. What is the difference between app.Use, app.Run, and app.Map?
61. What is dependency injection in ASP.NET Core?
62. What is the difference between AddTransient, AddScoped, and AddSingleton?
63. What is model binding?
64. What are action filters, exception filters, and authorization filters?
65. What is routing in Web API?
66. What is the difference between PUT, POST, PATCH, and DELETE?
67. How do you implement validation in Web API?
68. How do you implement authentication and authorization in Web API?
69. How do you handle CORS?
70. How do you upload files securely in ASP.NET Core?
71. How do you implement logging and global exception handling?
72. How do you improve API performance?
### ASP.NET Core Production APIs

73. How do you structure controllers, services, validators, repositories, and DTOs in a large API?
74. How do you implement request correlation IDs across logs and downstream services?
75. How do you design consistent API error responses using ProblemDetails?
76. How do you protect APIs against over-posting, broken object-level authorization, and excessive data exposure?
77. How do you design health checks for database, cache, queue, and downstream APIs?
78. How do you handle long-running operations in an HTTP API?
79. What belongs in middleware, filters, endpoint filters, and service classes?
80. How do you design backward-compatible API changes?
81. How do you test API contracts between frontend and backend?
### Answer Guides

82. What is middleware in ASP.NET Core?
### Scenario Questions

83. A junior developer submits code with business logic inside the controller. What feedback do you give?
### Modern .NET and ASP.NET Core

84. How would you structure a maintainable modern .NET solution?
85. What responsibilities belong in API, application, domain, and infrastructure layers?
86. How does dependency injection work in ASP.NET Core?
87. Explain singleton, scoped, and transient lifetimes and captive dependencies.
88. How do async and await work internally, and why does async not automatically create a thread?
89. How do you design global exception handling using ProblemDetails?
90. How do you make a POST operation truly idempotent?
91. How do you design pagination, filtering, and sorting safely?
92. How do you prevent over-posting and mass-assignment vulnerabilities?
93. How do you implement rate limiting in ASP.NET Core, and how does it interact with APIM?
94. How do you avoid sync-over-async, thread-pool starvation, and deadlocks?
95. How do you profile and troubleshoot a slow ASP.NET Core endpoint?
### Observability and Production Support

96. What service-level indicators would you define for a critical API?
### C# and .NET Engineering Deep Dive

97. When is Task.Run appropriate in an ASP.NET Core application?
### ASP.NET Core Application Design

98. Compare middleware, endpoint filters, MVC filters, and action filters.
99. Compare controllers and minimal APIs for different application types.
100. How does model binding work, and which security risks should you consider?
101. How should an API handle graceful shutdown and requests already in progress?
102. How do Kestrel, a reverse proxy, and forwarded headers work together?
103. How do you stream large responses without excessive memory allocation?
104. How do you safely accept and process file uploads?
105. Why should durable background work not depend only on an in-process queue?
106. How do you implement health checks that reflect readiness without overloading dependencies?
107. How do you prevent controllers or endpoints from accumulating business logic?
108. How do you configure secure headers, HTTPS redirection, HSTS, and proxy trust?
### REST, OpenAPI, and Swagger Governance

109. What constraints define REST, and which are commonly applied pragmatically?
110. How do safe, idempotent, and cacheable HTTP methods differ?
111. How do you model long-running operations in an HTTP API?
112. When should an API return 202 Accepted, and how should clients track progress?
113. How do ETags and conditional requests prevent lost updates?
114. How do If-Match and If-None-Match differ?
115. How should APIs represent validation errors using Problem Details?
116. How do you design consistent error types without leaking internal details?
117. What is OpenAPI, and how does it differ from Swagger tooling?
118. What belongs in an OpenAPI operation definition?
119. How do reusable schemas, parameters, responses, and security schemes work?
120. How do you describe polymorphism using oneOf, anyOf, and discriminators?
121. How do you prevent implementation details from leaking into generated schemas?
122. How do you generate and distribute typed clients safely?
123. How do you lint and validate an OpenAPI document in CI?
124. How do you detect backward-incompatible API changes automatically?
125. How do contract-first and code-first API development differ?
126. How do you secure Swagger UI outside development environments?
127. How would you establish organization-wide REST and OpenAPI standards?
### GraphQL Fundamentals and Schema Design

128. What problem does GraphQL solve compared with REST?
### GraphQL with Hot Chocolate, GraphQL.NET, and Apollo

129. Compare Hot Chocolate and GraphQL.NET for an ASP.NET Core service.
130. How do query resolvers and field middleware work in Hot Chocolate?
131. How do you rate-limit GraphQL when every operation uses the same HTTP endpoint?

## Entity Framework Core & Dapper (39)

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
### Entity Framework and Dapper Deep Dive

13. How do you use AsNoTracking, projection, compiled queries, and split queries effectively?
14. How do you avoid cartesian explosion when loading related data?
15. How do you handle concurrency conflicts in EF Core?
16. How do you prevent accidental client-side evaluation or inefficient LINQ?
17. How do you handle migrations in a multi-developer team?
18. How do you test EF queries without hiding SQL performance issues?
19. When should Dapper return DTOs instead of domain entities?
20. How do you protect Dapper queries from SQL injection?
21. How do you handle transactions across EF and Dapper in the same workflow?
22. How do you measure whether EF or Dapper is the bottleneck?
### Code First Migration Guide

23. You renamed Employee.Name to Employee.FullName and EF generated DropColumn/AddColumn. What do you do?
24. You need to add a non-nullable DepartmentId to Employees, but production already has employee rows.
25. Two developers added migrations from the same previous migration on different branches.
26. A migration works locally but times out in production.
27. How do you safely deploy a breaking column change with zero downtime?
28. What is Code First Migration?
29. What is the difference between migration and database update?
30. What should you check before applying a migration to production?
31. How do you handle migration rollback?
### CV-Specific Questions

32. Why did you use both EF and Dapper?
### Priority 1 — Event Sourcing

33. Compare event upcasting, versioned handlers, and migration of stored events.
### Data, Performance, and Consistency

34. When would you choose Entity Framework Core, Dapper, or direct database access?
35. How do tracking and no-tracking queries differ in EF Core?
36. How do you perform safe, backward-compatible database migrations?
### GraphQL with Hot Chocolate, GraphQL.NET, and Apollo

37. How do projections, filtering, and sorting integrate with EF Core in Hot Chocolate?
38. What risks arise from exposing unrestricted filtering over EF Core?
### Observability, Logging, and Monitoring Deep Dive

39. How do you instrument ASP.NET Core, EF Core, HttpClient, and GraphQL resolvers?

## SQL Server & Data (152)

### SQL Server and Data Access

1. How do you optimize a slow SQL query?
2. Explain clustered and non-clustered indexes.
3. How do indexes improve reads but affect writes?
4. How do you read an execution plan?
5. When would you use Entity Framework, and when would you use Dapper?
6. How do you avoid the N+1 query problem in EF?
### Data, SQL, and Personalization

7. How would you model customers, segments, offers, redemptions, stores, and transactions?
8. How would you optimize a query that calculates offer eligibility for millions of customers?
9. How would you design indexes for customer ID, store, campaign, offer, and redemption queries?
10. How would you prevent stale or incorrect personalization data?
11. How would you design audit history for reward redemption and customer changes?
12. How would you balance real-time personalization with reporting workloads?
13. When would you use SQL Server, cache, search index, or event stream for customer engagement data?
14. How would you investigate a report that is correct for one market but wrong for another?
### Common SQL Questions

15. What is the difference between primary key, foreign key, unique key, and composite key?
16. What is the difference between inner join, left join, right join, and full join?
17. What is the difference between WHERE and HAVING?
18. What is the difference between UNION and UNION ALL?
19. What are clustered and non-clustered indexes?
20. What is a covering index?
21. What are stored procedures, functions, views, and triggers?
22. What is normalization, and what are 1NF, 2NF, and 3NF?
23. What is a transaction?
24. What are isolation levels?
25. What is a deadlock, and how do you troubleshoot it?
26. How do you find duplicate records?
27. How do you optimize a slow query?
28. What is parameter sniffing?
### SQL Server Fundamentals

29. What is SQL Server, and where have you used it in enterprise applications?
30. What is the difference between a table, view, stored procedure, and function?
31. What is the difference between DELETE, TRUNCATE, and DROP?
32. What is the difference between CHAR, VARCHAR, NCHAR, and NVARCHAR?
33. What is the difference between DATETIME, DATETIME2, and DATE?
34. What is NULL in SQL, and why can it cause bugs?
35. What is the difference between COUNT(*), COUNT(1), and COUNT(column)?
36. What is normalization, and why does it matter?
37. When would you intentionally denormalize data?
### Joins, Filtering, and Aggregation

38. How do CROSS JOIN and CROSS APPLY differ?
39. How do GROUP BY and aggregate functions work?
40. How do you find duplicate records in a table?
41. How do you return employees who do not belong to any department?
42. How do you count records per category including categories with zero records?
43. How do you filter records by date range safely?
44. How do you avoid accidental duplicate rows after joining multiple tables?
### Indexes and Execution Plans

45. What is a clustered index?
46. What is a non-clustered index?
47. What is the difference between index seek and index scan?
48. What are included columns in an index?
49. How do you decide which columns should be indexed?
50. How can indexes improve reads but slow writes?
51. What are key lookup, table scan, bookmark lookup, and sort operators?
52. How do you detect missing or unused indexes?
### Performance Tuning

53. How do you fix parameter sniffing issues?
54. What are statistics in SQL Server?
55. How do outdated statistics affect query performance?
56. How do you optimize pagination for a very large table?
57. How do you tune a report query that joins many large tables?
58. How do you identify blocking queries?
59. How do you investigate high CPU usage from SQL Server?
60. How do you decide whether to tune SQL, add an index, cache data, or change application logic?
### Transactions, Locks, and Concurrency

61. What is a database transaction?
62. What are ACID properties?
63. What are SQL Server isolation levels?
64. What is the difference between READ COMMITTED and SNAPSHOT isolation?
65. What is a dirty read, non-repeatable read, and phantom read?
66. What is a deadlock?
67. How do you troubleshoot a deadlock?
68. How do you prevent long-running transactions?
69. What is optimistic concurrency?
70. What is the difference between row lock, page lock, and table lock?
### Stored Procedures, Functions, and Views

71. When would you use a stored procedure?
72. When would you avoid putting business logic in stored procedures?
73. What is the difference between scalar function and table-valued function?
74. Why can scalar functions hurt performance?
75. What is an indexed view?
76. How do you version stored procedures safely?
77. How do you handle errors inside a stored procedure?
78. How do you use TRY...CATCH in T-SQL?
79. How do you return validation errors from SQL to an API?
80. How do you test stored procedures?
### Advanced T-SQL and Coding Tasks

81. What is a CTE, and when would you use it?
82. What is a recursive CTE?
83. What are window functions?
84. How do ROW_NUMBER, RANK, and DENSE_RANK differ?
85. Write a query to find the second-highest salary.
86. Write a query to find duplicate emails.
87. Write a query to delete duplicate records but keep the latest one.
88. Write a query to calculate running totals.
89. Write a query to return top N records per group.
90. Write a query to pivot monthly sales into columns.
### Data Modeling and Design

91. How would you design tables for users, roles, permissions, and audit history?
92. How would you design a payment transaction table?
93. How would you design customers, offers, redemptions, and stores for a loyalty platform?
94. How would you design soft delete and audit columns?
95. How would you design multi-tenant data access in SQL Server?
96. How do you choose between GUID and INT identity keys?
97. How do you design for high-volume inserts?
98. How do you archive old transactional data safely?
99. How do you design lookup tables?
100. How do you enforce referential integrity without over-coupling the system?
### Security, Backup, and Operations

101. How do you prevent SQL injection?
102. How do parameterized queries protect against SQL injection?
103. How do you apply least privilege for SQL users?
104. How do you protect PII in SQL Server?
105. How do you audit sensitive data changes?
106. What is the difference between full, differential, and transaction log backups?
107. What are RPO and RTO?
108. How do you restore a database to a point in time?
109. How do you monitor database health in production?
110. What checks do you perform before a database deployment?
### SQL Server Scenario Questions

111. An API endpoint is slow because of a SQL query. How do you investigate from application logs to execution plan?
112. A report query runs fast in development but times out in production. What do you check?
113. A table has 100 million rows and pagination is slow. How do you redesign the query?
114. A new index improved one query but slowed down writes. How do you handle the trade-off?
115. A deadlock happens during payment processing. What is your investigation and fix?
116. A stored procedure is sometimes fast and sometimes slow with the same code. How do you diagnose it?
117. A deployment adds a nullable column needed by the API. How do you make it zero-downtime?
118. A customer says their transaction history is missing records. How do you troubleshoot data correctness?
119. A migration script failed halfway in production. What is your response plan?
120. A query uses SELECT * across multiple joined tables. How would you review and improve it?
121. A dashboard needs near-real-time counts from a huge transactional table. How would you design it?
122. A SQL Server database is growing quickly. How do you investigate storage and retention?
123. A support user exported sensitive customer data. How would you improve access and audit controls?
124. A nightly job blocks daytime API traffic. How do you fix scheduling, locking, and isolation?
125. A database CPU spike starts after a release. How do you isolate the query or code change?
### SQL Server Advanced

126. How do you diagnose blocking, deadlocks, and long-running transactions?
127. What is parameter sniffing, and how do you mitigate it?
128. How do covering indexes differ from composite indexes?
129. How do you decide included columns for a non-clustered index?
130. How do you optimize pagination for very large tables?
131. How do you tune stored procedures used by reports?
132. How do you safely archive old transactional data?
133. How do you handle optimistic vs pessimistic concurrency?
134. How do you design audit tables for regulated systems?
135. How do you review a query execution plan before changing indexes?
### Answer Guides

136. How do indexes improve query performance?
### Scenario Questions

137. A payment transaction API is slow during peak load. How do you investigate and fix it?
138. A SQL report takes 90 seconds to load. What is your optimization plan?
139. A new feature needs changes in frontend, API, database, and messaging. How do you design and deliver it?
140. A production bug affects customer transactions. What is your response process?
### CV-Specific Questions

141. In the Capgemini auction platform, what SQL optimization work did you perform?
### Priority 1 — CQRS

142. Does CQRS require separate databases?
143. Where should domain events be dispatched relative to the database transaction?
144. How would you trace a command across handlers, database writes, and emitted events?
### Modern .NET and ASP.NET Core

145. How do optimistic concurrency and database transactions differ?
### Data, Performance, and Consistency

146. How do projection and pagination reduce database load?
147. How do indexes improve reads while increasing write cost?
148. How do you design data ownership when decomposing a shared database?
### End-to-End Architecture Scenarios

149. Design observability that traces a user request through gateway, API, database, broker, and consumer.
### REST, OpenAPI, and Swagger Governance

150. How do you model resources rather than database tables in a REST API?
### GraphQL Fundamentals and Schema Design

151. Why should a GraphQL schema model the domain instead of exposing database entities?
### GraphQL with Hot Chocolate, GraphQL.NET, and Apollo

152. How do DataLoader and batching prevent N+1 database queries?

## Architecture & System Design (88)

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
### Likely Theta Architecture Scenarios

36. You inherit a mission-critical .NET Framework 4 application. The business cannot stop feature development. How do you modernise it?
37. A legacy application and a new modern .NET service need to run side by side. Design the architecture.
38. The Angular team complains that APIs keep changing and breaking the frontend. What would you do?
39. The customer has 200 technical debt items. How would you prioritise them?
40. The team wants microservices, but the application is currently a monolith. Would you agree?
41. The database commit succeeds but publishing to Service Bus fails. How do you solve this?
42. A Service Bus message is processed twice. How do you prevent duplicate business actions?
43. A customer asks you to deliver quickly using an architecture you believe will create serious long-term problems. What do you do?
44. A senior developer publicly disagrees with your architecture decision. How do you handle it?
45. You join the team tomorrow. What do you assess first before creating a modernisation roadmap?
### Senior Scenario Questions

46. Production API is returning 500 errors after deployment. What do you do first?
47. A SQL query is fast locally but slow in production. How do you investigate?
48. A RabbitMQ queue is growing continuously. What could be wrong?
49. A consumer processed a payment message twice. How do you fix the design?
50. A new requirement conflicts with the current microservice boundary. How do you handle it?
51. A junior developer created business logic inside a controller. How do you review it?
52. A product owner asks for a quick change that creates technical debt. What do you say?
53. A code review found security-sensitive logging. What should be changed?
54. An Angular or React page is slow for large datasets. What do you optimize?
55. A release is blocked by flaky tests. How do you respond as a senior developer?
### Architecture and System Design

56. Design a payment authorization service that must be reliable, observable, and idempotent.
57. Design a job matching system that parses CVs, stores applications, and ranks job descriptions.
58. How would you split a betting platform into bounded contexts?
59. How would you design a data import pipeline for Excel files with validation, cleansing, and audit logs?
60. How would you design dashboards for high-volume transactional data?
61. When would you use clean architecture, vertical slices, or a modular monolith?
62. How do you handle shared libraries without tightly coupling microservices?
63. How do you introduce caching without serving stale or incorrect business data?
64. How do you design multi-tenant data access safely?
65. How do you plan a zero-downtime deployment with database changes?
### Architecture, Delivery, and Leadership

66. How do you turn an ambiguous requirement into an architecture and delivery plan?
67. How do you compare options and record a decision in an ADR?
68. How do you balance delivery speed, maintainability, security, and operational cost?
69. How do you avoid both under-engineering and overengineering?
70. How do you identify the highest-risk assumptions before implementation?
71. How do you break a large architecture change into reversible increments?
72. How do you communicate technical trade-offs to non-technical stakeholders?
73. How do you review a design proposed by another senior engineer?
74. What do you look for in a security-sensitive code review?
75. How do you mentor developers without becoming a delivery bottleneck?
76. How do you raise engineering standards across multiple teams?
77. How do you handle disagreement with an architect or technical lead?
78. Tell me about a difficult production problem you diagnosed end to end.
79. Tell me about a design decision you changed after receiving new evidence.
80. Tell me about a time you improved reliability without stopping feature delivery.
81. How do you decide whether technical debt should be fixed now, scheduled, or accepted?
82. How do you plan ownership, documentation, on-call readiness, and handover?
83. What would your first 30, 60, and 90 days look like in a senior engineering role?
### End-to-End Architecture Scenarios

84. Design CQRS read and write paths for a high-volume transaction-history service.
85. Explain how you would secure, test, deploy, monitor, and roll back the complete platform.
### Cloud Design Principles for Modern Applications

86. How do you remove single points of failure from an application architecture?
87. How do RTO and RPO influence architecture and recovery design?
88. How do you validate architecture assumptions with load, failure, and recovery tests?

## Modernisation & Technical Debt (60)

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

25. What is the Strangler Fig pattern?
26. When would you use the Strangler Fig pattern?
27. When would you not use the Strangler Fig pattern?
28. How do you route traffic between legacy and modern components?
29. How do you gradually retire legacy functionality?
30. What is an anti-corruption layer?
31. Why do we need an anti-corruption layer?
32. Where would you place an anti-corruption layer?
33. How do you prevent a legacy domain model leaking into a new system?
34. What is incremental migration?
35. Compare Strangler Fig with a big-bang rewrite.
36. How do you handle shared databases during migration?
37. Would the legacy and modern applications share the same database?
38. What problems can a shared database create?
39. How would you separate data ownership incrementally?
40. How do you handle transactions across old and new components?
41. How do you migrate without downtime?
42. How would you validate that the new component behaves like the legacy component?
43. What is parallel running?
44. What is shadow traffic?
45. How would you roll back to the legacy implementation?
### Technical Debt

46. What is technical debt?
47. Is all technical debt bad?
48. How do you identify technical debt?
49. How do you prioritise technical debt?
50. How do you explain technical debt to a Product Owner?
51. How do you explain technical debt to an executive?
52. How do you reduce technical debt without stopping feature delivery?
53. Would you create a separate technical debt sprint?
54. How do you include technical debt in normal delivery?
55. What metrics would you use?
56. How do you create a technical debt roadmap?
57. Business-critical feature versus technical debt: which comes first?
58. What if the customer refuses to fund technical debt?
59. How do you quantify the business risk of technical debt?
60. Tell me about technical debt you personally reduced.

## Microservices & Distributed Systems (83)

### Microservices

1. What is the difference between microservices and a modular monolith?
2. How do you decide service boundaries?
3. How do you handle distributed transactions and eventual consistency?
4. What is the outbox pattern, and why is it useful?
5. How do you prevent cascading failures between services?
6. How would you migrate a monolithic .NET application to microservices?
### Messaging and Distributed Systems

7. Synchronous versus asynchronous communication?
8. When would you use REST?
9. When would you use messaging?
10. What is eventual consistency?
11. What is at-least-once delivery?
12. Can you guarantee exactly-once processing?
13. How do you handle duplicate messages?
14. What is an idempotent consumer?
15. What is the Outbox Pattern?
16. What problem does the Outbox Pattern solve?
17. Database commit succeeds but event publishing fails. What happens?
18. How do you process the outbox?
19. What is Saga?
20. Choreography versus orchestration?
21. What is a compensating transaction?
22. What is a poison message?
23. What is a DLQ?
24. How do you replay DLQ messages?
25. How do you avoid retry storms?
26. What is exponential backoff?
27. What is circuit breaking?
28. How do you monitor asynchronous flows?
### Microservices and Messaging at Plexure Scale

29. How would you split services for loyalty, offers, customer profile, notifications, orders, and reporting?
30. When would you use asynchronous messaging instead of direct API calls?
31. How would you process purchase events and update loyalty points safely?
32. How would you handle duplicate purchase events from a POS or mobile order system?
33. How would you design retries and dead-letter queues for failed notification or reward events?
34. How would you trace one customer action across multiple services?
35. How would you avoid a distributed monolith in a large loyalty platform?
36. How would you design eventual consistency for points balance and reward redemption?
### Microservices Asked Questions

37. What is a microservice?
38. What are the advantages and disadvantages of microservices?
39. How do microservices communicate?
40. What is API Gateway?
41. What is service discovery?
42. What is centralized logging?
43. What is distributed tracing?
44. How do you handle data consistency across services?
45. What is circuit breaker pattern?
46. What is saga pattern?
47. How do you deploy microservices independently?
48. How do you monitor microservices?
49. How do you avoid creating a distributed monolith?
### Microservices Deep Dive

50. How do you choose between choreography and orchestration?
51. How do you design saga compensation for a failed payment workflow?
52. How do you handle schema changes for events already consumed by other services?
53. How do you version events and APIs independently?
54. How do you avoid distributed monoliths?
55. How do you decide whether a service should own its own database?
56. How do you handle timeout, retry, circuit breaker, and bulkhead policies?
57. How do you trace a request across multiple services?
58. What monitoring signals prove a microservice is healthy?
### Scenario Questions

59. A microservice dependency is down. How should your service behave?
### CV-Specific Questions

60. At Nagarro, what microservice responsibilities did you own for Betsson Group?
### Priority 1 — CQRS

61. How does the transactional outbox complement CQRS?
### Priority 1 — Event Sourcing

62. What is event sourcing, and how does it differ from event-driven architecture?
### Microservices, Messaging, and Distributed Reliability

63. How do you identify service boundaries and bounded contexts?
64. When is a modular monolith preferable to microservices?
65. How do you handle a business operation spanning multiple services?
66. Compare saga orchestration and choreography.
67. How does the outbox pattern prevent lost integration events?
68. What is the inbox pattern?
69. How do you design an idempotent message consumer?
70. Why is exactly-once delivery usually an application-level illusion?
71. How do retries, exponential backoff, jitter, and dead-letter queues work together?
72. How do you handle poison messages without blocking a partition or queue?
73. How do you preserve ordering where business correctness requires it?
74. How do you version message contracts without breaking existing consumers?
75. How do you trace a request that becomes an asynchronous message flow?
76. How do you recover from partial completion after an uncertain timeout?
77. How would you migrate a monolith incrementally using the Strangler Fig pattern?
### Data, Performance, and Consistency

78. When is eventual consistency acceptable to users?
79. How do cache-aside, write-through, and distributed caching differ?
### Observability and Production Support

80. What are logs, metrics, and distributed traces, and when is each most useful?
### Testing and Engineering Quality

81. How do consumer-driven contract tests protect microservice integrations?
### ASP.NET Core Application Design

82. How do output caching, response caching, and distributed caching differ?
### Stakeholder Communication

83. How do you explain eventual consistency and delayed updates to a product owner?

## RabbitMQ & Messaging (122)

### RabbitMQ and Messaging

1. Explain exchanges, queues, bindings, routing keys, publishers, and consumers.
2. How do acknowledgements make message processing reliable?
3. How do you handle poison messages and dead-letter queues?
4. How do you prevent duplicate message processing?
5. When would you choose RabbitMQ over direct API calls?
6. How would you debug a message that was published but not consumed?
### RabbitMQ Asked Questions

7. What is RabbitMQ?
8. What is a producer and consumer?
9. What is an exchange?
10. What is a queue?
11. What is a binding?
12. What is a routing key?
13. What are direct, fanout, topic, and headers exchanges?
14. What is acknowledgement?
15. What is message durability?
16. What is prefetch count?
17. How do you handle failed messages?
18. How do you avoid duplicate processing?
19. How do you monitor RabbitMQ?
20. When should you use RabbitMQ instead of REST API calls?
### RabbitMQ Fundamentals

21. What is RabbitMQ, and what problem does it solve?
22. When would you use RabbitMQ instead of a direct REST API call?
23. What is the difference between a producer, exchange, queue, binding, and consumer?
24. What is the difference between direct, fanout, topic, and headers exchanges?
25. How does a message move from producer to consumer in RabbitMQ?
26. What is the difference between a queue and an exchange?
27. Can one message be delivered to multiple queues? How?
28. What happens if a producer publishes to an exchange with no matching binding?
29. What is the difference between point-to-point messaging and publish-subscribe messaging?
30. RabbitMQ versus Kafka: when would you choose each?
31. RabbitMQ versus Azure Service Bus: what are the practical differences?
### Reliability and Delivery Guarantees

32. What are acknowledgements in RabbitMQ?
33. What is the difference between auto-ack and manual ack?
34. When should a consumer ack a message?
35. What happens if a consumer crashes before acknowledging a message?
36. What is the difference between a durable queue and a persistent message?
37. Do durable queues alone guarantee that messages will not be lost?
38. What are publisher confirms?
39. How do publisher confirms differ from consumer acknowledgements?
40. Can RabbitMQ guarantee exactly-once processing?
41. How do you make a RabbitMQ consumer idempotent?
42. What is a dead-letter exchange?
43. How do you design retry handling without creating an infinite retry loop?
44. What is exponential backoff in message retry?
45. What is the outbox pattern, and why is it useful with RabbitMQ?
46. The database commit succeeds but RabbitMQ publishing fails. How do you solve it?
### Consumer Design and Performance

47. What is prefetch count in RabbitMQ?
48. How does prefetch count affect consumer throughput?
49. How do you handle slow consumers?
50. How do you scale RabbitMQ consumers horizontally?
51. What happens when multiple consumers listen to the same queue?
52. How do you preserve message ordering when using multiple consumers?
53. When is message ordering important?
54. How do you process long-running jobs safely?
55. How do you prevent one bad message from blocking the queue?
56. How do you design a consumer so it can be restarted safely?
57. How do you handle cancellation and graceful shutdown in a .NET RabbitMQ consumer?
58. How do you avoid processing too many messages at once?
59. What metrics would you monitor for consumer health?
60. How do you handle backpressure in a message-driven system?
### RabbitMQ with .NET

61. How would you publish a RabbitMQ message from an ASP.NET Core API?
62. How would you implement a RabbitMQ consumer using BackgroundService in .NET?
63. Where would you register RabbitMQ connections and channels in dependency injection?
64. Should RabbitMQ channels be shared across threads?
65. How do you serialize messages in a .NET RabbitMQ system?
66. How do you version message contracts?
67. How do you avoid breaking existing consumers when a message schema changes?
68. How would you include correlation IDs in RabbitMQ messages?
69. How do you log and trace a message across API, publisher, queue, and consumer?
70. How do you write unit tests for a service that publishes RabbitMQ messages?
71. How do you integration test RabbitMQ flows?
72. What information should be included in a message envelope?
73. How do you handle exceptions inside a .NET consumer?
74. How do you prevent duplicate database writes from duplicate RabbitMQ messages?
### Operations, Security, and Monitoring

75. How do you monitor RabbitMQ in production?
76. What does increasing queue depth usually mean?
77. What does unacked message count mean?
78. What does a high ready message count indicate?
79. How do you debug a message that was published but not consumed?
80. How do you debug a queue that is growing continuously?
81. What RabbitMQ management UI information do you check first during an incident?
82. How do you secure RabbitMQ credentials?
83. How do you secure RabbitMQ connections?
84. What is TLS used for in RabbitMQ?
85. How do you apply least privilege to RabbitMQ users?
86. How do you separate environments and applications in RabbitMQ?
87. What is a virtual host in RabbitMQ?
88. How do you plan RabbitMQ capacity?
89. What happens if RabbitMQ is unavailable?
90. How should an application behave when it cannot publish a message?
### Scenario-Based RabbitMQ Problems

91. A payment message is processed twice and the customer is charged twice. How do you fix the design?
92. A RabbitMQ queue is growing continuously during peak hours. How do you investigate?
93. A consumer crashes after saving to the database but before acknowledging the message. What happens, and how do you make it safe?
94. An API successfully saves an order but fails to publish OrderCreated to RabbitMQ. How do you prevent losing the event?
95. A poison message keeps retrying and blocks useful work. What retry and DLQ strategy would you design?
96. A notification service receives duplicate OrderCreated events. How should the consumer behave?
97. A message was published but no consumer received it. What configuration and runtime checks would you perform?
98. A new consumer version cannot read old messages. How would you handle message contract versioning?
99. The business needs strict ordering for account balance events. How would you design the queues and consumers?
100. RabbitMQ goes down for 10 minutes while the API is still receiving requests. What should happen?
101. A consumer is too slow because it calls a third-party API for every message. How would you redesign it?
102. A deployment accidentally creates a queue with a wrong routing key. How would you detect and recover?
103. A batch job publishes one million messages and overwhelms consumers. How do you protect the system?
104. A consumer logs sensitive customer data from message payloads. What should change?
105. You are asked to replace synchronous API calls with RabbitMQ. What questions do you ask before agreeing?
106. A manager asks why a user sees pending status after submitting a request. How do you explain eventual consistency?
107. You need to migrate from one message contract to another without downtime. What steps would you take?
108. A dead-letter queue contains thousands of messages. How do you triage, replay, and prevent recurrence?
109. A service publishes a message inside a database transaction. What can go wrong?
110. How would you design RabbitMQ messaging for order creation, payment capture, invoice generation, and email notification?
### RabbitMQ Advanced

111. How do durable queues, persistent messages, and mirrored/quorum queues differ?
112. How do you design idempotent consumers?
113. How do you handle message ordering when multiple consumers are active?
114. How do you tune prefetch count for fair dispatch and throughput?
115. How do you design delayed retries using dead-letter exchanges?
116. What happens if a consumer keeps failing and requeueing the same message?
117. How do you monitor queue depth, consumer lag, publish rate, and acknowledgement rate?
118. When would RabbitMQ be a poor choice compared with Kafka or direct API calls?
119. How would you secure RabbitMQ connections and credentials?
### Scenario Questions

120. A RabbitMQ consumer processes the same message twice. How do you make the system safe?
### CV-Specific Questions

121. At Visa, what enterprise applications did you enhance using C#, .NET MVC, React, EF, LINQ, RabbitMQ, and microservices?
122. How did RabbitMQ fit into your previous systems?

## Azure (131)

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
29. What is duplicate detection?
30. How do you design an idempotent consumer?
31. What is message ordering?
32. What are Service Bus sessions?
33. What is Azure SQL?
34. Azure SQL versus SQL Server on a VM?
35. How do you manage database connections?
36. What is connection pooling?
37. How do you store application secrets?
38. What is Azure Key Vault?
39. What is Managed Identity?
40. Managed Identity versus client secret?
41. How does an App Service access Azure SQL securely?
42. How would you monitor Azure applications?
43. What is Application Insights?
44. How do you implement distributed tracing?
45. How do you diagnose a slow Azure-hosted API?
46. How do you manage Azure cost?
47. What is FinOps?
### Azure Architecture and Platform Engineering

48. How would you choose between Azure App Service, Azure Container Apps, and AKS for a new .NET workload?
49. How do Azure Functions hosting plans affect scaling, cold starts, networking, and cost?
50. What happens from trigger to completion when an Azure Function runs, and where should validation, dependency injection, logging, and error handling live?
51. How would you design an Azure Function that can safely retry without creating duplicate database records or external side effects?
52. When would you use Azure Service Bus queues, topics, Event Grid, or Event Hubs?
53. How would you design idempotent Azure Service Bus consumers and safely handle duplicate delivery?
54. How do managed identities improve access from ASP.NET Core applications to Azure resources?
55. How would you structure subscriptions, management groups, resource groups, tags, and policies for a growing organisation?
56. How do you design private networking with VNets, subnets, private endpoints, DNS, and network security groups?
57. How would you use Azure API Management for authentication, throttling, versioning, and backend protection?
58. How do deployment slots, health checks, feature flags, and rollback support zero-downtime releases?
59. What telemetry would you capture with Application Insights, Azure Monitor, Log Analytics, and distributed tracing?
60. How would you select between Azure SQL, Cosmos DB, PostgreSQL, Redis, and Blob Storage?
61. How would you secure Azure Blob Storage, generate time-limited access, define lifecycle rules, and prevent accidental public exposure?
62. When would you use Cosmos DB partition keys, consistency levels, change feed, and transactional batches?
63. How would you use Azure Front Door and CDN for global routing, TLS, caching, WAF protection, and regional failover?
64. How do you manage secrets, certificates, and rotation using Azure Key Vault?
### Priority 1 — Azure API Management and Application Gateway

65. What problem does Azure API Management solve?
66. What problem does Azure Application Gateway solve?
67. Compare API Management, Application Gateway, Azure Front Door, and Azure Load Balancer.
68. Why might an architecture use Application Gateway and API Management together?
69. Which component should be internet-facing in a private API architecture?
70. How would you place API Management inside or alongside a virtual network?
71. How do private endpoints and private DNS affect APIM connectivity?
72. How would traffic flow from a client through WAF, APIM, and a containerized API?
73. Where should TLS terminate, and should TLS be re-established to each downstream hop?
74. How do you configure certificates, custom domains, and certificate rotation?
75. What does the Application Gateway Web Application Firewall protect against?
76. How would you tune WAF rules without hiding genuine attacks?
77. What is the difference between prevention and detection modes in WAF?
78. Which concerns belong in APIM policies and which belong in application code?
79. How would you implement per-client throttling and quotas?
80. What is the difference between rate limiting, throttling, and quotas?
81. How do you version and revise APIs in APIM?
82. How do you safely transform headers, URLs, and payloads in APIM?
83. When is response caching in APIM appropriate or dangerous?
84. How do you propagate correlation and trace context through both gateways?
85. How would you monitor APIM capacity, latency, failures, and policy errors?
86. How would you diagnose 502 and 504 responses across Application Gateway and APIM?
87. How do health probes work in Application Gateway, and what commonly breaks them?
88. How would you deploy APIM and gateway policy changes safely through CI/CD?
89. How do you test APIM policies before production deployment?
90. How would you design a zero-downtime rollout and rollback for gateway changes?
91. What are the cost, scaling, and availability trade-offs among APIM tiers?
### Priority 1 — Azure Container Apps and AKS

92. Compare Azure Container Apps and Azure Kubernetes Service.
93. What decision criteria would make you choose Container Apps over AKS?
94. When does AKS provide value that Container Apps does not?
95. What are Container Apps environments, apps, revisions, and replicas?
96. How do ingress, internal ingress, and service discovery work in Container Apps?
97. How does KEDA-based scaling work in Container Apps?
98. How would you scale a worker based on queue depth?
99. What happens to in-flight requests during scale-in or revision replacement?
100. How do you perform blue/green and canary deployments with Container Apps revisions?
101. What are AKS pods, deployments, services, ingress controllers, and namespaces?
102. How do readiness, liveness, and startup probes differ?
103. Why can poorly designed health probes cause an outage?
104. How do resource requests and limits affect scheduling and reliability?
105. How do Horizontal Pod Autoscaler, Cluster Autoscaler, and KEDA differ?
106. How do rolling updates, max surge, and disruption budgets affect availability?
107. How would you securely pull images from Azure Container Registry?
108. How do network policies and private clusters reduce attack surface?
109. How do you expose AKS workloads through Application Gateway or another ingress?
110. How do Application Gateway Ingress Controller and Application Gateway for Containers differ conceptually?
111. How do you manage application configuration separately from container images?
112. How do you handle database migrations during container deployment?
113. How do you collect logs, metrics, and traces from containerized .NET workloads?
114. How do you diagnose crash loops, image-pull failures, OOM kills, and failed probes?
115. How would you estimate and control Container Apps or AKS cost?
116. What should be included in a production Dockerfile for an ASP.NET Core API?
117. Why should containers run as non-root with a read-only filesystem where possible?
118. How do you scan images and manage base-image vulnerabilities?
119. How would you design disaster recovery for stateful and stateless container workloads?
### Observability and Production Support

120. How do you correlate Application Gateway, APIM, container, and application telemetry?
### Full-Stack and Frontend Integration

121. How do you prevent memory leaks and stale asynchronous updates?
### Testing and Engineering Quality

122. How do you test APIM policies, WAF rules, and gateway routing?
### End-to-End Architecture Scenarios

123. Design a private APIM architecture fronted by Application Gateway WAF.
### REST, OpenAPI, and Swagger Governance

124. How do you publish OpenAPI definitions into Azure API Management?
### GraphQL with Hot Chocolate, GraphQL.NET, and Apollo

125. How would you expose GraphQL through Azure API Management?
### Azure and AWS Platform Comparisons

126. Compare Azure Container Apps with AWS App Runner and Amazon ECS Fargate.
127. Compare AKS with Amazon EKS.
128. Compare Azure API Management with Amazon API Gateway.
129. Compare Azure Application Gateway and Front Door with AWS ALB and CloudFront.
130. Compare Azure Key Vault with AWS Secrets Manager and KMS.
131. Compare Azure Service Bus and Event Grid with Amazon SQS, SNS, and EventBridge.

## AWS (61)

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

29. Walk through an end-to-end request from API Gateway to a .NET Lambda function, including authentication, validation, logging, error mapping, and the response.
30. How would you structure a production-ready .NET Lambda solution using dependency injection, configuration, reusable services, and unit tests?
31. What causes cold starts in .NET Lambda, how would you measure them, and which optimizations would you apply before paying for provisioned concurrency?
32. How do Lambda reserved concurrency and account concurrency protect downstream systems such as SQL databases and third-party APIs?
33. How would you configure API Gateway stages, deployments, custom domains, throttling, quotas, access logs, and request tracing?
34. When would you choose an HTTP API instead of a REST API in API Gateway, and what functionality or cost trade-offs would you explain?
35. How would you implement API Gateway authorization using IAM, Cognito JWT authorizers, or a Lambda authorizer, and when is each appropriate?
36. How would you create a least-privilege IAM execution role for a Lambda function that reads one S3 prefix and writes CloudWatch logs?
37. Explain the difference between an IAM identity policy, resource policy, permissions boundary, role trust policy, and service control policy.
38. How would you use CloudWatch Logs Insights to investigate a failing request across API Gateway and Lambda using a correlation ID?
39. Which Lambda and API Gateway CloudWatch metrics would you place on a dashboard, and which alarms would indicate a customer-impacting incident?
40. How would you design CloudWatch alarms to avoid noisy alerts while still detecting errors, latency, throttling, and exhausted concurrency?
41. How would you securely upload a large file directly from a React application to S3 without sending the file through the .NET API?
42. How would S3 versioning, lifecycle rules, encryption, replication, and object lock support security, recovery, compliance, and cost control?
43. How would you deploy an ASP.NET Core API to EC2 using a load balancer, target groups, health checks, Auto Scaling, IAM roles, and CloudWatch Agent?
44. What EC2 operating-system, application, and load-balancer signals would you monitor, and how would you distinguish infrastructure failure from application failure?
45. How would you perform a safe EC2 deployment with immutable images, rolling replacement, blue-green environments, health validation, and rollback?
46. How would you explain the AWS work from your Visa experience honestly while demonstrating ownership, production awareness, and readiness for deeper AWS responsibilities?
### AWS Production Scenario Questions

47. API Gateway starts returning 502 errors after a new .NET Lambda deployment. How would you isolate whether the problem is the integration response, Lambda exception, timeout, permissions, or deployment configuration?
48. A Lambda function works in development but receives AccessDenied when reading an S3 object in production. How would you diagnose IAM policies, bucket policies, encryption keys, object ownership, and account boundaries?
49. A traffic spike causes Lambda throttling and database connection exhaustion. What would you do immediately, and how would you redesign concurrency, connection handling, buffering, and scaling?
50. Lambda duration has increased sharply but invocation count is unchanged. Which CloudWatch data and application traces would you inspect, and how would you identify the slow dependency?
51. CloudWatch shows successful Lambda invocations, but customers receive errors from API Gateway. How would you correlate access logs, execution logs, status codes, integration latency, and request IDs?
52. Users upload duplicate files to S3 and each upload triggers duplicate downstream processing. How would you introduce idempotency, event filtering, durable state, retries, and safe replay?
53. A private S3 bucket is accidentally made public. What immediate containment, evidence collection, credential review, customer-impact assessment, and preventive controls would you apply?
54. An EC2-hosted ASP.NET Core service is healthy according to CPU monitoring but intermittently fails load-balancer health checks. How would you investigate memory, disk, networking, process health, logs, and dependency latency?
55. An EC2 deployment passes the pipeline but the new instances never become healthy in the target group. How would you diagnose ports, security groups, health-check paths, startup configuration, and instance logs?
56. An EC2 instance becomes unresponsive during peak load. How would you recover service safely and decide whether to resize, auto scale, optimize the application, or change the architecture?
57. An IAM role was granted broad administrator access to resolve an urgent incident. How would you restore least privilege without breaking production and prove that the narrower policy is sufficient?
58. A team cannot find the cause of a production failure because API Gateway, Lambda, and EC2 logs are fragmented. How would you create a correlated observability design using structured logs, metrics, alarms, dashboards, and tracing?
59. S3 storage cost grows every month because old uploads and incomplete multipart uploads are never removed. How would you analyze usage and introduce safe lifecycle policies?
60. You need to release a breaking Lambda change without interrupting API clients. How would you use versions, aliases, weighted routing, API versioning, canary validation, and rollback?
61. A customer asks what you personally implemented in AWS at Visa. How would you give a precise STAR answer that separates your contribution from the wider team’s work?

## Cloud Architecture, Reliability & Cost (26)

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

13. A .NET API is fast locally but intermittently slow after deployment to Azure App Service. How would you investigate it end to end?
14. An AWS Lambda function processes an SQS message twice and creates two payments. How would you correct the design and existing data?
15. An Azure Service Bus queue grows continuously during peak traffic. What metrics, dependencies, and consumer settings would you check?
16. A production deployment introduces errors for 10 percent of users. How would you use canary or blue-green deployment to mitigate and recover?
17. A company wants to migrate a large ASP.NET Framework monolith to Azure or AWS without a risky big-bang rewrite. What migration roadmap would you propose?
18. A database is private but the application can no longer connect after a network change. How would you diagnose routing, DNS, identity, and firewall rules?
19. A public storage bucket or container holding customer documents is discovered. What immediate and longer-term actions would you take?
20. The primary cloud region becomes unavailable during business hours. How should traffic, data, messaging, and operational communication behave?
21. A third-party API becomes slow and causes thread-pool exhaustion across your .NET services. How would you stabilize the platform?
22. Monthly cloud cost has doubled without a matching increase in users. How would you identify the cause and prevent recurrence?
23. Two teams need to publish breaking event-contract changes independently. How would you introduce versioning without downtime?
24. An AKS or EKS deployment repeatedly restarts under load even though average CPU looks normal. How would you investigate and fix it?
25. Security asks you to remove all stored cloud credentials from applications and pipelines. How would you migrate to workload identities and roles?
26. You must move a customer-facing system from Azure to AWS, or AWS to Azure, with minimal downtime. What should remain portable and what should be redesigned?

## React & TypeScript (129)

### React and Mobile/Web Experience

1. How would you build a React dashboard for campaign performance and offer redemption?
2. How would you handle loading, empty, and error states for customer engagement dashboards?
3. How would you prevent unnecessary re-renders in a large analytics screen?
4. How would you design reusable components for offers, segments, filters, and charts?
5. How would you keep frontend and backend contracts aligned for campaign management screens?
6. How would you handle role-based UI access for marketing, support, and admin users?
### React Basics

7. What is React, and why is it used?
8. What is JSX?
9. What is the difference between an element and a component?
10. What are props in React?
11. What is state in React?
12. What is the difference between props and state?
13. What is a functional component?
14. What is a class component?
15. Why are keys important when rendering lists?
16. What happens when state changes in React?
17. What is one-way data flow?
18. What is conditional rendering?
### Hooks

19. What is useState?
20. What is useEffect?
21. What happens if you omit the dependency array?
22. What is useMemo, and when should you use it?
23. What is useCallback, and when should you use it?
24. What is useRef?
25. How is useRef different from useState?
26. What is useContext?
27. What is a custom hook?
28. What are the rules of hooks?
29. How do you clean up timers, subscriptions, or event listeners in useEffect?
### Component Design

30. How do you split a large component into smaller components?
31. How do you design reusable components?
32. When can a component become too generic?
33. What is component composition?
34. What is prop drilling?
35. How do you avoid prop drilling?
36. What are controlled components?
37. What are uncontrolled components?
38. How do you handle forms in React?
39. How do you design loading, empty, error, and success states?
40. How do you pass callbacks from parent to child?
41. How do you prevent duplicated UI logic?
### State Management

42. When should state live in a component?
43. When should state be lifted up?
44. When would you use Context API?
45. What problems can Context API create?
46. When would you use Redux, Zustand, React Query, or another state library?
47. What is derived state?
48. Why can copying props into state be dangerous?
49. How do you manage server state separately from UI state?
50. How do you handle optimistic updates?
51. How do you reset component state?
52. How do you keep state predictable in a large app?
53. How do you avoid stale state in async updates?
### API Integration

54. How do you fetch data from an API in React?
55. How do you handle loading and error states during API calls?
56. How do you cancel an in-flight request?
57. How do you avoid setting state after a component unmounts?
58. How do you handle pagination, filtering, and sorting from an API?
59. How do you handle authentication tokens in API requests?
60. How do you retry failed API calls safely?
61. How do you avoid duplicate API calls?
62. How do you cache API responses?
63. How do you handle 401, 403, 404, and 500 responses in the UI?
64. How do you design frontend/backend contracts?
65. How do you handle slow API responses gracefully?
### Performance

66. What causes unnecessary re-renders?
67. How do you identify performance issues in React?
68. When should you use React.memo?
69. When should you avoid useMemo or useCallback?
70. How do you optimize large lists?
71. What is virtualization?
72. How do you lazy load components?
73. What is code splitting?
74. How do you reduce bundle size?
75. How do you optimize images and assets in a React app?
76. How do you avoid expensive calculations during render?
77. How do you profile a React application?
### Routing and App Structure

78. How do you structure folders in a large React app?
79. What is React Router?
80. How do you protect routes that require authentication?
81. How do you handle nested routes?
82. How do you handle route params and query strings?
83. How do you preserve filter state in the URL?
84. How do you handle 404 pages?
85. How do you navigate programmatically?
86. How do you share layouts across pages?
87. How do you organize API clients, hooks, components, and utilities?
### Testing

88. How do you test React components?
89. What is the difference between unit, integration, and end-to-end tests in frontend?
90. What is React Testing Library?
91. Why should tests focus on user behavior instead of implementation details?
92. How do you test a component that fetches API data?
93. How do you mock API calls?
94. How do you test forms and validation?
95. How do you test loading and error states?
96. How do you test custom hooks?
97. What makes a frontend test flaky?
### TypeScript with React

98. How do you type component props?
99. How do you type useState?
100. How do you type event handlers?
101. How do you type API response models?
102. What is the difference between type and interface?
103. How do you type children?
104. How do you type reusable generic components?
105. How do you handle optional props safely?
106. How do you avoid using any?
107. How do TypeScript types improve frontend/backend contracts?
### Senior React Scenarios

108. A React page is slow when rendering 10,000 rows. What do you do?
109. A component fetches the same API multiple times. How do you fix it?
110. A useEffect causes an infinite loop. How do you debug it?
111. A form loses user input after navigation. How do you preserve it?
112. A user sees stale data after saving. How do you handle cache invalidation?
113. A production UI bug only happens for one browser. How do you investigate?
114. A junior developer put business logic inside JSX. What feedback do you give?
115. A global context update re-renders the whole app. How do you improve it?
116. A button submits twice and creates duplicate records. How do you prevent it?
117. A dashboard needs real-time updates. How would you design the React side?
### React Coding Tasks

118. Build a search box that filters a list as the user types.
119. Build a reusable modal component.
120. Build a paginated table with loading and empty states.
121. Build a form with validation and submit handling.
122. Build a custom useDebounce hook.
123. Build a custom useFetch hook.
124. Build tabs where the active tab is stored in the URL.
125. Build a todo list with add, edit, complete, and delete.
126. Build an autocomplete input that calls an API.
127. Build a component that handles retry after a failed API request.
### Answer Guides

128. What are hooks, and what problems do they solve?
### Scenario Questions

129. A React page becomes slow after loading a large dataset. How do you improve it?

## Angular & RxJS (200)

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
### Angular 14 vs Angular 22

36. What are the most important differences between Angular 14 and Angular 22?
37. How did standalone components evolve from developer preview in Angular 14 to the default component model in modern Angular?
38. How does an Angular 14 NgModule-based application differ from an Angular 22 standalone application?
39. How would you replace bootstrapModule and AppModule with bootstrapApplication and application providers?
40. How do Angular 22 signals differ from the RxJS-heavy state patterns commonly used in Angular 14?
41. When should an Angular 22 application still use RxJS instead of signals?
42. How do signal inputs, outputs, model inputs, and signal queries differ from @Input, @Output, and decorator queries?
43. How does the built-in @if, @for, and @switch control flow differ from *ngIf, *ngFor, and *ngSwitch?
44. How does @for track items, and how does that compare with an Angular 14 trackBy function?
45. What are deferrable views with @defer, and what problem do they solve compared with Angular 14?
46. How have Angular build and development tooling changed from the older Webpack-based Angular 14 pipeline to the modern application builder?
47. What is zoneless change detection, and how does it differ from the Zone.js-based behavior of Angular 14?
48. How have server-side rendering, hydration, event replay, and incremental hydration evolved since Angular 14?
49. How did typed reactive forms introduced in Angular 14 improve form safety, and what does Angular 22 add with Signal Forms?
50. How would you explain the testing-tool changes from Karma/Jasmine-era Angular 14 projects to Vitest in modern Angular?
### Angular 22 Deep Dive

51. Which Angular 22 features would you adopt immediately in a production application, and which would you introduce incrementally?
52. How do signal, computed, linkedSignal, and effect differ, and what is an appropriate use case for each?
53. Why should effect usually not be used to propagate application state?
54. How do you convert an Observable to a signal with toSignal, and a signal to an Observable with toObservable?
55. How do resource and httpResource model asynchronous signal-based data?
56. When would you choose httpResource over HttpClient with RxJS, and when would you not?
57. How do loading, value, error, refresh, and cancellation behave in a signal-based resource?
58. How do Signal Forms differ from classic reactive forms, and how would you migrate a large form gradually?
59. How do you implement synchronous, asynchronous, cross-field, and HTTP validation with Signal Forms?
60. How do standalone route configuration and loadComponent improve lazy loading?
61. How do route-level server, prerender, and client render modes work in a hybrid Angular 22 application?
62. What are hydration, incremental hydration, and event replay, and how do they improve SSR user experience?
63. What application changes are required before removing Zone.js and running zoneless?
64. How do OnPush, signals, and zoneless change detection work together?
65. How would you profile signal updates and change detection using Angular DevTools?
66. How do you test a standalone Angular 22 component without creating a test NgModule?
67. How do you test signals, effects, httpResource, router behavior, and Signal Forms with Vitest?
68. How would you organize a large Angular 22 application by feature while avoiding a new version of SharedModule?
69. What security responsibilities belong to Angular interceptors and route guards, and what must always be enforced by the backend?
70. Design an Angular 22 screen that loads a large dataset, supports filtering, preserves URL state, and remains fast and accessible.
### Angular 14 to 22 Migration

71. How would you plan a low-risk migration from Angular 14 to Angular 22?
72. Why should Angular major versions normally be upgraded sequentially with ng update?
73. What would you check for Node.js, TypeScript, RxJS, Angular Material, and third-party library compatibility at each step?
74. How would you use Angular update schematics while keeping each migration commit reviewable and reversible?
75. Would you upgrade framework versions and rewrite the application to signals and standalone components at the same time? Explain the trade-off.
76. How would you migrate NgModules to standalone APIs incrementally?
77. How would you migrate structural directives to built-in control flow and validate rendering behavior?
78. How would you migrate constructor injection to inject and decorator inputs to signal inputs without destabilizing the app?
79. How would you migrate Karma tests to Vitest and identify behavior hidden by brittle tests?
80. What build, bundle-size, performance, SSR, accessibility, and browser-regression checks would you run before release?
81. How would you roll out the Angular 22 application safely and recover if production metrics regress?
82. After reaching Angular 22, how would you prioritize optional modernization work and measure whether it creates value?
### Angular Basics

83. What is Angular, and how is it different from React?
84. What are components in Angular?
85. What is a template in Angular?
86. What is data binding in Angular?
87. What is interpolation?
88. What is property binding?
89. What is event binding?
90. What is two-way binding?
91. What is the role of TypeScript in Angular?
92. What is the difference between AngularJS and modern Angular?
### Components and Lifecycle

93. When do you use ngOnInit?
94. When do you use ngOnDestroy?
95. What is the difference between constructor and ngOnInit?
96. How do parent and child components communicate?
97. What are @Input and @Output?
98. What is EventEmitter?
99. How do you pass data between unrelated components?
100. How do you design reusable Angular components?
101. How do you avoid putting too much logic in a component?
### Directives and Pipes

102. What are directives in Angular?
103. What is the difference between structural and attribute directives?
104. How do ngIf and ngFor work?
105. What is trackBy in ngFor, and why is it useful?
106. What are pipes in Angular?
107. What is the difference between pure and impure pipes?
108. When would you create a custom directive?
109. When would you create a custom pipe?
110. How do directives help reduce duplicated template logic?
111. What mistakes can make templates hard to maintain?
### Services and Dependency Injection

112. Why should API logic usually live in services instead of components?
113. What does providedIn: root mean?
114. How do service scopes work in Angular?
115. How do you share state using a service?
116. How do you mock a service in unit tests?
117. How do you avoid circular dependencies between services?
118. How do interceptors fit with services?
119. How would you organize services in a large Angular app?
### Routing and Guards

120. How does Angular routing work?
121. How do you configure child routes?
122. What are route parameters?
123. How do you read query string values in Angular?
124. What are route guards?
125. What is the difference between CanActivate and CanDeactivate?
126. How do you protect routes that require login?
127. How do you lazy load Angular routes?
128. How do you handle a 404 route?
129. How do you preserve filters or tabs in the URL?
### Forms and Validation

130. What is the difference between template-driven forms and reactive forms?
131. When would you choose reactive forms?
132. What are FormControl, FormGroup, and FormArray?
133. How do you add synchronous validation?
134. How do you add asynchronous validation?
135. How do you show validation messages cleanly?
136. How do you handle dynamic form fields?
137. How do you reset a form after submit?
138. How do you prevent duplicate form submission?
139. How do you map form values to backend DTOs safely?
### RxJS and API Integration

140. What is an Observable in Angular?
141. How is an Observable different from a Promise?
142. What is subscribe?
143. What is the async pipe, and why is it useful?
144. When do you need to unsubscribe?
145. How do switchMap, mergeMap, concatMap, and exhaustMap differ?
146. How do you handle API errors with RxJS?
147. How do you cancel stale API calls in a search box?
148. How do you cache API responses in Angular?
149. How do you handle loading, empty, and error states from an API?
### Performance and Change Detection

150. How does Angular change detection work?
151. What is ChangeDetectionStrategy.OnPush?
152. When should you use OnPush?
153. How does trackBy improve ngFor performance?
154. How do you optimize a large Angular table?
155. How do you lazy load modules or standalone routes?
156. How do you reduce Angular bundle size?
157. How do you debug a slow Angular page?
158. How do you avoid memory leaks from subscriptions?
159. How do signals affect Angular state management?
### Testing

160. How do you test Angular components?
161. What is TestBed?
162. How do you test Angular services?
163. How do you mock HttpClient calls?
164. How do you test reactive forms?
165. How do you test route guards?
166. How do you test components with @Input and @Output?
167. What should be unit tested vs integration tested in Angular?
168. What makes Angular tests flaky?
169. How do you structure frontend tests for a large Angular app?
### Senior Angular Scenarios

170. An Angular page is slow with a large dataset. How do you investigate and fix it?
171. A search box fires too many API calls. How do you solve it with RxJS?
172. A user loses form data after navigation. How do you preserve it?
173. A component has too many inputs and outputs. How would you refactor it?
174. A memory leak appears after navigating between pages. What do you check?
175. A junior developer put business logic in an Angular component. What feedback do you give?
176. A route guard works locally but fails after refresh in production. How do you debug it?
177. A backend API changes a DTO used by Angular screens. How do you protect the frontend?
178. A role-based menu shows links the user cannot access. How do you fix it?
179. How would you structure a large enterprise Angular app with features, shared UI, services, and routing?
### Detailed Angular question pages

180. What Is Interpolation in Angular?
181. What Is Event Binding in Angular?
182. What Is Property Binding in Angular?
183. AngularJS vs Modern Angular
184. What Is Two-Way Binding in Angular?
185. How Would You Structure a Large Enterprise Angular App?
186. How Did Standalone Components Evolve from Developer Preview in Angular 14 to the Default Component Model in Angular 22?
187. How Did Typed Reactive Forms in Angular 14 Improve Safety, and What Does Angular 22 Add with Signal Forms?
188. How Do Signal Inputs, Outputs, Model Inputs, and Signal Queries Differ from Decorator APIs?
189. How Does @for Track Items, and How Does It Compare with an Angular 14 trackBy Function?
190. How Does an Angular 14 NgModule Application Differ from an Angular 22 Standalone Application?
191. How Does Built-in @if, @for, and @switch Control Flow Differ from Structural Directives?
192. How Did Angular Build and Development Tooling Change from Angular 14 Webpack to the Modern Application Builder?
193. How Have SSR, Hydration, Event Replay, and Incremental Hydration Evolved Since Angular 14?
194. How Do Testing Tools Change from Angular 14 Karma/Jasmine Projects to Vitest in Angular 22?
195. What Is Zoneless Change Detection, and How Does It Differ from Angular 14 Zone.js Behavior?
196. What Security Responsibilities Belong to Interceptors and Route Guards, and What Must Always Be Enforced by the Backend?
197. Which Angular 22 Features Would You Adopt Immediately, and Which Would You Introduce Incrementally?
198. How Would You Roll Out Angular 22 Safely and Recover if Production Metrics Regress?
199. After Reaching Angular 22, How Would You Prioritize Optional Modernization and Measure Whether It Creates Value?
200. What Would You Check for Node.js, TypeScript, RxJS, Angular Material, and Third-Party Compatibility at Each Step?

## Frontend - General (41)

### React, Angular, and Frontend

1. How do React and Angular differ architecturally?
2. What are React hooks, and how do you avoid common hook mistakes?
3. How do you manage API loading, error, and empty states in React?
4. What does TypeScript add to JavaScript development?
5. How do Angular services and dependency injection work?
6. How do you keep frontend and backend contracts aligned?
### React / Angular Asked Questions

7. What is the difference between React and Angular?
8. What are props and state in React?
9. What is useState and useEffect?
10. What is the dependency array in useEffect?
11. How do you prevent unnecessary re-rendering?
12. What is controlled vs uncontrolled component?
13. What is Angular component lifecycle?
14. What is dependency injection in Angular?
15. What are Angular services?
16. What are guards and interceptors?
17. How do you handle forms in React or Angular?
18. How do you consume Web APIs from frontend code?
19. How do you handle authentication in frontend applications?
20. How do you debug production UI issues?
21. How do you improve frontend performance?
### Frontend Senior Questions

22. How do you design reusable components without making them too generic?
23. How do you manage global state vs local component state?
24. How do you prevent unnecessary React re-renders?
25. How do you handle authentication tokens safely in a browser app?
26. How do you structure Angular modules, services, guards, and interceptors?
27. How do you design frontend error handling for API failures?
28. How do you test React or Angular components?
29. How do you handle accessibility in forms, buttons, and dynamic content?
30. How do you improve perceived performance for slow backend APIs?
31. How do you debug memory leaks in a frontend application?
### Full-Stack and Frontend Integration

32. How do frontend and backend teams maintain an API contract?
33. How do OpenAPI-generated clients help, and what risks do they introduce?
34. How do you model loading, empty, success, and failure states in a frontend?
35. What should the frontend do after receiving 401, 403, 409, 429, and 503 responses?
36. Why is frontend route protection not a security boundary?
37. How do you prevent duplicate form submissions and payment requests?
38. How do you manage state ownership in a large React or Angular application?
39. How do you diagnose unnecessary rendering or change-detection work?
40. How do accessibility and keyboard navigation influence component design?
41. How would you roll out a breaking frontend and API change safely?

## Security, Identity & Passkeys (216)

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
23. How do you manage secrets?
24. Why should secrets not be stored in source control?
25. What is least privilege?
26. What is Zero Trust?
27. Explain never trust, always verify.
28. How do you secure service-to-service communication?
29. How do you protect sensitive logs?
30. What information should never be logged?
31. How would you implement passkey or FIDO2 authentication?
32. Passkey versus password?
33. What is a FIDO2 challenge?
34. Why does the server store the public key rather than the private key?
35. How do you prevent replay attacks?
### Authentication Fundamentals

36. What is the difference between authentication and authorization?
37. How would you explain authentication to a non-technical person?
38. What is identity in an application?
39. What is a claim, and how is it different from a role?
40. What is the difference between session-based authentication and token-based authentication?
41. When would you use cookies instead of JWTs?
42. When would you use JWTs instead of cookies?
43. What information should not be stored in a JWT?
44. What is token expiry, and why is it important?
45. What is refresh token rotation?
46. What is MFA, and when should it be required?
47. How do you design logout securely?
### Authorization and Access Control

48. How do role-based access control and policy-based authorization differ?
49. How would you design permissions for Admin, Support, Manager, and Customer users?
50. What is broken object-level authorization, and how do you prevent it?
51. How do you secure an endpoint that returns user-specific data?
52. How do you handle authorization in the frontend vs backend?
53. How do you design row-level or tenant-level authorization?
54. How do you handle permission changes while a user is already logged in?
55. How do you audit authorization decisions?
56. How do you test authorization rules?
### ASP.NET Core Identity

57. What is ASP.NET Core Identity?
58. How would you build login and registration using ASP.NET Core Identity?
59. How do you store passwords safely?
60. How do password hashing, salting, and peppering differ?
61. How do you implement account lockout?
62. How do you implement email confirmation and password reset?
63. How do you customize Identity users and roles?
64. How do you integrate Identity with existing customer tables?
65. How do you migrate from a custom user system to ASP.NET Core Identity?
66. How do you protect Identity endpoints from brute force attacks?
### OAuth2 and OpenID Connect

67. What is the difference between OAuth2 and OpenID Connect?
68. What is an authorization code flow?
69. Why is PKCE important?
70. What is an ID token?
71. How do scopes differ from roles?
72. How would you integrate Google, Microsoft, or Azure AD login?
73. How do you validate tokens in an ASP.NET Core API?
74. How do you design single sign-on for multiple applications?
### Passkeys and WebAuthn

75. What is a passkey?
76. How do passkeys differ from passwords?
77. What is WebAuthn?
78. What is FIDO2?
79. What is a relying party in WebAuthn?
80. What is an authenticator?
81. How does passkey registration work?
82. How does passkey login work?
83. What is a challenge in WebAuthn?
84. Why are passkeys phishing-resistant?
85. What data do you store in the database for a passkey?
86. How do you handle users with multiple devices or multiple passkeys?
87. How do you handle passkey recovery if a user loses a device?
88. Can passkeys replace MFA?
89. How would you add passkeys to an existing password-based system?
### Passkey Implementation Scenarios

90. Design a passkey registration API in ASP.NET Core.
91. Design a passkey login API in ASP.NET Core.
92. How would React call navigator.credentials.create for passkey registration?
93. How would React call navigator.credentials.get for passkey login?
94. How do you prevent replay attacks in a WebAuthn flow?
95. How do you validate origin and relying party ID?
96. How do you handle passkeys across subdomains?
97. How do you support both password login and passkey login during migration?
98. How do you test passkeys locally and in staging?
99. How do you make passkey UX understandable for non-technical users?
### Security Scenario Questions

100. A user reports account takeover. How do you investigate?
101. A refresh token is leaked. What do you do?
102. A support user can access customer records they should not see. How do you fix it?
103. A JWT contains too much personal data. What is the risk and fix?
104. A password reset link is being abused. How do you protect it?
105. A user loses their passkey-enabled phone. How should recovery work?
106. A passkey works on localhost but fails in production. What do you check?
107. A mobile app receives 401 errors after token refresh. How do you debug it?
108. A user’s role changes but they still have old access. How do you handle it?
109. How would you design secure authentication for a React frontend and ASP.NET Core backend?
### Security

110. How do authentication and authorization differ?
111. How do JWT, cookies, OAuth2, and OpenID Connect fit into enterprise APIs?
112. How do you prevent SQL injection, XSS, CSRF, and insecure direct object references?
113. How do you protect PII and payment-related data in logs?
114. How do you handle secrets in local development and production?
115. How do you implement least privilege for service accounts and databases?
116. How do you review third-party packages for risk?
117. How do you design secure file upload and parsing?
118. How do you handle audit logging without leaking sensitive details?
119. What would you check before approving a security-sensitive PR?
### CV-Specific Questions

120. What security or reliability considerations matter most in payment applications?
### Priority 1 — OAuth 2.0 and OpenID Connect

121. What problem does OAuth 2.0 solve, and what does it not solve?
122. What is the difference between OAuth 2.0 and OpenID Connect?
123. Explain the roles of resource owner, client, authorization server, and resource server.
124. What is an access token, and who should consume it?
125. What is an ID token, and why must an API not use it as an access token?
126. What is a refresh token, and when should one be issued?
127. Explain the Authorization Code flow step by step.
128. Why is Authorization Code with PKCE recommended for browser and mobile applications?
129. How does PKCE prevent authorization-code interception?
130. What are the code verifier and code challenge?
131. When should you use the Client Credentials flow?
132. Why is Client Credentials unsuitable for representing an end user?
133. Why are the Implicit and Resource Owner Password flows no longer recommended?
134. How would you secure a React or Angular SPA using OAuth 2.0 and OpenID Connect?
135. Compare a browser-only SPA token model with the Backend-for-Frontend pattern.
136. Where should a browser application store tokens, and what are the trade-offs?
137. How do secure, HttpOnly, SameSite cookies change the threat model?
138. How do XSS and CSRF risks differ in token-based and cookie-based applications?
139. What are scopes, and how should you design them?
140. What is the difference between scopes, roles, permissions, and claims?
141. How should an ASP.NET Core API validate a JWT access token?
142. Which JWT claims must be validated beyond the signature?
143. What are issuer, audience, subject, tenant, expiry, and not-before claims?
144. How does signing-key rotation work through OpenID Connect discovery and JWKS?
145. What should an API do when token validation fails?
146. What is token replay, and how can you reduce its risk?
147. What are sender-constrained tokens, DPoP, and mutual-TLS-bound tokens?
148. What is refresh-token rotation, and how does reuse detection work?
149. How do you revoke access when JWT access tokens are self-contained?
150. How do introspection and reference tokens differ from self-contained JWTs?
151. How do you implement delegated user access between downstream APIs?
152. What is the OAuth 2.0 On-Behalf-Of flow, and when would you use it?
153. How do app-only and delegated permissions differ?
154. How do consent and admin consent work?
155. How would you troubleshoot an API returning 401 with an apparently valid token?
156. How would you troubleshoot a 403 after successful authentication?
157. How do clock skew and token lifetime affect authentication reliability?
158. How do you protect client secrets and certificates in production?
159. When should a confidential client use a certificate instead of a client secret?
160. How would you test OAuth-protected APIs in unit, integration, and end-to-end tests?
### Priority 1 — Microsoft Entra ID

161. What is Microsoft Entra ID, and how is it used by applications and APIs?
162. Explain tenants, app registrations, enterprise applications, and service principals.
163. What is the relationship between an app registration and its service principal?
164. How do single-tenant and multitenant applications differ?
165. How would you design tenant isolation for a multitenant SaaS application?
166. How do Entra application roles differ from groups and delegated scopes?
167. How do you implement role-based authorization in ASP.NET Core using Entra ID?
168. When would you use policy-based authorization instead of role attributes?
169. How do Conditional Access and multifactor authentication affect an application?
170. What is Managed Identity, and what problem does it solve?
171. Compare system-assigned and user-assigned managed identities.
172. How would a containerized API use Managed Identity to access Key Vault or a database?
173. What is workload identity federation, and why is it preferable to long-lived secrets?
174. How does Microsoft Entra Workload ID integrate with AKS?
175. How would you configure Entra authentication for Azure Container Apps?
176. How do you automate app registrations, roles, scopes, and service principals safely?
177. How do you rotate credentials without downtime?
178. How do you audit sign-ins, consent, risky users, and service-principal activity?
179. How do guest users and B2B collaboration affect authorization design?
180. When would you consider External ID for customer identities?
181. How do you prevent tenant-ID or object-ID confusion in authorization logic?
182. How would you investigate intermittent authentication failures in production?
### Priority 1 — Azure API Management and Application Gateway

183. How do validate-jwt, rate-limit, quota, IP filtering, and CORS policies work?
184. Why is APIM validation not a replacement for authorization inside the API?
185. How do you implement OAuth 2.0 authorization with Entra ID at APIM and API layers?
186. How do subscriptions and subscription keys differ from user authentication?
187. How do you prevent sensitive headers or tokens from appearing in logs?
### Priority 1 — CQRS

188. Where should validation and authorization occur in a CQRS pipeline?
189. How do optimistic concurrency and version tokens fit into CQRS?
### Priority 1 — Event Sourcing

190. Design an event-sourced payment lifecycle including authorization, capture, reversal, and refund.
### Priority 1 — Azure Container Apps and AKS

191. How do you manage secrets and Managed Identity in Container Apps?
192. How do you use Microsoft Entra Workload ID from an AKS workload?
### Modern .NET and ASP.NET Core

193. How do you propagate CancellationToken correctly?
194. How do you distinguish validation failures, conflicts, authorization failures, and unexpected faults?
195. How do you implement authorization policies rather than putting role checks in controllers?
### Data, Performance, and Consistency

196. How do row-version concurrency tokens work?
### CI/CD, Infrastructure as Code, and Azure Operations

197. How do workload identity federation and Managed Identity improve deployment security?
### Observability and Production Support

198. How do you avoid logging tokens, secrets, or personal data?
### Full-Stack and Frontend Integration

199. How do you handle access-token expiry without creating retry loops?
### Testing and Engineering Quality

200. How do you integration test an ASP.NET Core API with authentication enabled?
201. How do you test OAuth token validation and authorization policies?
### End-to-End Architecture Scenarios

202. Design a secure multitenant platform using a SPA, ASP.NET Core APIs, Entra ID, Application Gateway, APIM, and containerized workloads.
203. Design an OAuth 2.0 flow for a SPA calling an API that must call a downstream API on behalf of the user.
204. Design a machine-to-machine integration using Entra ID without storing a client secret.
### ASP.NET Core Application Design

205. How does middleware ordering affect routing, authentication, authorization, CORS, and exception handling?
### REST, OpenAPI, and Swagger Governance

206. How do you document OAuth 2.0 flows in an OpenAPI definition?
### GraphQL Fundamentals and Schema Design

207. How should GraphQL errors distinguish validation, authorization, and server failures?
### GraphQL with Hot Chocolate, GraphQL.NET, and Apollo

208. How do you propagate CancellationToken through GraphQL resolvers?
209. How do you implement authentication and authorization at type and field level?
210. How do Entra ID access tokens secure a GraphQL endpoint?
211. How do you test a Hot Chocolate schema, resolvers, authorization, and errors?
212. How do you handle token expiry in Apollo links without creating retry loops?
### Cloud Design Principles for Modern Applications

213. How do zero-trust principles affect network and identity design?
### Azure and AWS Platform Comparisons

214. How do Microsoft Entra ID and AWS IAM differ conceptually?
215. Compare Azure Managed Identity with AWS IAM roles for workloads.
### Stakeholder Communication

216. How do you explain OAuth 2.0 or zero trust to a non-technical stakeholder?

## Testing & Quality (6)

### Testing and Quality

1. What makes a good unit test?
2. What should be mocked, and what should not be mocked?
3. How do you use MOQ to test a service with dependencies?
4. How do you test async methods and exception paths?
5. What tests would you write for a payment or transaction workflow?
6. How do you handle flaky tests?

## CI/CD & DevOps (27)

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

## Observability & Production Support (8)

### Production, Observability, and Incidents

1. A campaign launch causes API timeouts globally. What is your investigation plan?
2. Customers are not receiving personalized offers in one country. How do you triage it?
3. A reward redemption is processed twice. How do you fix the system and protect customers?
4. A queue is growing quickly after a POS integration change. What do you check?
5. How would you monitor API health, queue depth, database performance, and customer-impacting errors?
6. What logs and dashboards would you want for a global loyalty platform?
7. How would you communicate during a production incident as a senior developer?
8. How do you prevent a similar incident from happening again?

## Live Coding & Practical Tasks (12)

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

## Leadership, Behavioral & Consulting (78)

### Leadership and AI-Assisted Engineering

1. What do you look for in code reviews?
2. How do you mentor junior developers?
3. How do you handle delivery pressure without reducing quality?
4. How have you used Claude Code or GitHub Copilot in real development?
5. How do you verify AI-generated code before it reaches production?
6. How would you introduce AI-first development practices to a team?
### Technical Leadership and Mentoring

7. What does a Technical Lead do?
8. Technical Lead versus Solution Architect?
9. Technical Lead versus Engineering Manager?
10. How hands-on should a Technical Lead be?
11. How do you mentor senior developers?
12. Tell me about someone you helped improve technically.
13. How do you conduct a code review?
14. What if a developer repeatedly ignores your feedback?
15. How do you build engineering standards?
16. How do you introduce a new architecture pattern?
17. How do you get team buy-in?
18. What if senior engineers disagree with your architecture?
19. How do you resolve technical disagreement?
20. Do you make the final decision as Technical Lead?
21. How do you avoid becoming a bottleneck?
22. What does build capability, not dependency mean?
23. How do you delegate technical decisions?
24. How do you run a design review?
25. How do you run an architecture workshop?
26. How do you document workshop decisions?
27. How do you ensure decisions are followed?
28. How do you balance mentoring and your own coding work?
29. Tell me about a technical conflict.
30. Tell me about a decision you got wrong.
31. How did you handle the mistake?
32. How do you challenge an architect respectfully?
### Customer-Facing Consultancy

33. Tell me about yourself.
34. Why Theta?
35. Why this Technical Lead role?
36. Why are you leaving your current company?
37. What are you looking for in your next role?
38. Tell me about your current Visa project.
39. What is Visa Spend Clarity?
40. What is your specific responsibility?
41. What architecture decisions have you influenced?
42. Tell me about your Passkey implementation.
43. What was your personal contribution?
44. What did the architect do versus what did you do?
45. Tell me about a difficult customer.
46. What if a customer disagrees with your recommendation?
47. How do you explain architecture to a non-technical stakeholder?
48. Explain microservices to a CEO.
49. Explain technical debt to a Product Owner.
50. How do you defend a technical decision?
51. What if customer management challenges you in a meeting?
52. How do you communicate technical risk?
53. How do you present multiple technical options?
54. How do you explain trade-offs?
55. Tell me about a time you said no to a stakeholder.
56. Tell me about a time you changed your technical recommendation.
57. How do you build trust with a customer?
58. What would you do in your first 90 days?
59. What would you do in your first six months?
60. How would you become a trusted technical adviser?
### Leadership and Senior Behaviors

61. How do you mentor developers in a large enterprise platform team?
62. How do you review code that affects customer data or reward redemption?
63. How do you balance speed of feature delivery with platform reliability?
64. How do you handle unclear requirements for a campaign or personalization feature?
65. Tell me about a time you improved performance or reliability in production.
66. Tell me about a time you used AI tools responsibly in enterprise development.
67. How do you make architectural trade-offs visible to product and engineering leaders?
68. How would you onboard into Plexure’s domain quickly?
### Behavioral and Leadership

69. Tell me about a time you improved code quality across a team.
70. Tell me about a time you had to mentor someone under delivery pressure.
71. Tell me about a time production support changed your technical design.
72. Tell me about a difficult code review conversation.
73. Tell me about a time requirements changed late in delivery.
74. How do you make technical decisions when there is no perfect answer?
75. How do you balance speed, quality, risk, and maintainability?
76. How do you onboard yourself into a large unfamiliar codebase?
77. How do you explain architecture trade-offs to non-technical stakeholders?
78. What kind of senior developer do you want to be on a team?

## HR & Company Fit (16)

### Plexure Company Fit

1. Why do you want to work at Plexure/TASK?
2. How does your Visa payment experience transfer to a loyalty and customer engagement platform?
3. What do you understand about Plexure’s work with McDonald’s and global customer engagement?
4. How would you explain your experience with high-scale, customer-facing enterprise systems?
5. What senior engineering value would you bring in your first 90 days?
6. How have you worked with product owners, architects, QA, DevOps, and support teams?
### HR / Recruiter Screen

7. Tell me about yourself and your current role at Visa.
8. Why are you looking for a new role?
9. Why do you want this company and this position?
10. What kind of .NET projects have you worked on end to end?
11. How much experience do you have with C#, ASP.NET Core, Web API, SQL Server, React, and Angular?
12. What was your team size, and what was your exact responsibility?
13. What is your expected salary or hourly rate?
14. What is your notice period and work authorization status?
15. Are you comfortable with hybrid work, production support, and Agile ceremonies?
16. What are your strongest technical skills and which areas are you currently improving?

## Cross-Technology Scenarios & CV Questions (10)

### Answer Guides

1. Explain Transient, Scoped, and Singleton lifetimes.
2. How do you avoid slow EF queries?
3. How do you make message processing reliable?
4. How do you prevent unnecessary re-renders?
5. How should frontend and backend handle errors?
6. How do you answer production issue questions?
### Scenario Questions

7. An EF query works in development but times out in production. What do you check?
8. A product owner asks for a quick fix that creates technical debt. How do you handle it?
### CV-Specific Questions

9. What does AI-first engineering mean in your daily development work?
10. At Genpact, how did data import, cleansing, and business manipulation work?

## Cloud-Native .NET & Full Stack (130)

### Priority 1 — CQRS

1. What is CQRS, and what problem does it solve?
2. Does CQRS require event sourcing?
3. When is separating command and query models valuable?
4. When is CQRS unnecessary complexity?
5. How do commands differ from CRUD service methods?
6. Should command handlers return data? What are the options and trade-offs?
7. How do read models become eventually consistent?
8. How should the UI behave when a write succeeds but the read model has not caught up?
9. How do you rebuild a damaged or outdated read model?
10. What is the difference between a command, domain event, and integration event?
11. What are the benefits and drawbacks of using MediatR for CQRS?
12. How do you prevent handlers from becoming an anemic collection of procedural scripts?
13. How would you unit test commands and integration test the complete CQRS flow?
14. How would you migrate an existing CRUD application toward CQRS incrementally?
### Priority 1 — Event Sourcing

15. How does event sourcing differ from keeping an audit log?
16. What is an event stream?
17. What should an event contain?
18. Why must stored events be immutable?
19. How is current aggregate state reconstructed from events?
20. What is an aggregate, and how does it define a consistency boundary?
21. What are snapshots, and when are they useful?
22. How do you evolve event schemas without breaking historical replay?
23. How do you handle personally identifiable information and deletion requirements in immutable events?
24. How do encryption, crypto-shredding, and data minimization help?
25. How do projections and read models consume event streams?
26. How do you make projection handlers idempotent?
27. What happens when a projection fails halfway through processing?
28. How do checkpoints and replay support projection recovery?
29. How do you publish integration events reliably from an event-sourced system?
30. How do you prevent domain events from leaking internal implementation details?
31. How do you test aggregate behavior using Given–When–Then event tests?
32. How do you debug incorrect state produced by a long event history?
33. What operational tooling is required before adopting event sourcing?
34. When should a team avoid event sourcing?
35. How would you introduce event sourcing to only one high-value bounded context?
### Data, Performance, and Consistency

36. How do you identify and fix N+1 queries?
37. How do you read an execution plan for a slow query?
38. What causes deadlocks, and how do you prevent or recover from them?
39. How do you prevent stale or unauthorized data from leaking through caches?
### Observability and Production Support

40. How do OpenTelemetry and W3C Trace Context work across APIs and messages?
41. What should a correlation ID represent, and when is a trace ID enough?
42. How do SLIs, SLOs, and error budgets guide engineering decisions?
43. How would you investigate intermittent 401, 403, 429, 502, and 504 responses?
44. What alerts are actionable, and how do you prevent alert fatigue?
45. How do you create useful runbooks and operational dashboards?
### Testing and Engineering Quality

46. What should be covered by unit, integration, contract, and end-to-end tests?
47. What should be mocked, and what should use a real dependency?
48. How do you test CQRS handlers without coupling tests to implementation details?
49. How do you test event-sourced aggregates and projection replay?
50. How do you keep test data isolated and deterministic in CI?
51. How do you identify and eliminate flaky tests?
### GraphQL Fundamentals and Schema Design

52. When is GraphQL a poor choice?
53. Explain schemas, object types, fields, arguments, queries, mutations, and subscriptions.
54. How do nullability and list nullability work in a GraphQL schema?
55. How do interfaces and unions model polymorphic results?
56. How do input types differ from output types?
57. How should mutations express validation errors and business conflicts?
58. How do cursor-based connections support pagination?
59. Why is offset pagination problematic for frequently changing datasets?
60. How do filtering and sorting capabilities create performance or security risks?
61. How do you evolve a GraphQL schema without explicit URL versions?
62. How do field deprecation and schema usage analytics support safe evolution?
63. How do persisted queries work, and what benefits do they provide?
64. What are automatic persisted queries?
65. How do fragments, aliases, and variables improve client queries?
66. How do subscriptions differ operationally from queries and mutations?
### Cloud Design Principles for Modern Applications

67. What does cloud native mean beyond running an application in the cloud?
68. How do availability, reliability, scalability, and performance differ?
69. How do horizontal and vertical scaling differ?
70. How do availability zones and regions affect design?
71. How do bulkheads, backpressure, load shedding, and admission control differ?
72. How do you design for graceful degradation when a dependency fails?
73. How do you select managed services versus self-hosted infrastructure?
74. How do cost, portability, operational skill, and vendor lock-in affect cloud decisions?
### Azure and AWS Platform Comparisons

75. Compare Azure Monitor and Application Insights with CloudWatch and X-Ray.
76. Compare Azure SQL and Cosmos DB with Amazon RDS and DynamoDB.
77. How do networking and private connectivity concepts map between Azure and AWS?
78. How would you design portability without reducing the system to the lowest common denominator?
79. When is a multicloud design justified, and when is it unnecessary complexity?
### Git and Modern Software Delivery

80. Explain commits, branches, tags, remotes, and the Git object model.
81. How do merge and rebase differ?
82. When is interactive rebase appropriate, and when is it dangerous?
83. How do you recover a lost commit using reflog?
84. How do revert, reset, and restore differ?
85. How do you resolve a difficult merge conflict safely?
86. Why should commits be small, cohesive, and independently understandable?
87. What makes a pull request easy to review?
88. How do branch-protection rules improve delivery safety?
89. How do signed commits and protected tags improve supply-chain security?
90. What should you do if a credential is committed and pushed?
91. How do monorepo and multirepo strategies affect ownership and CI performance?
92. How do CODEOWNERS and review policies support cross-functional teams?
93. How do you keep long-running work integrated without a long-lived branch?
### Observability, Logging, and Monitoring Deep Dive

94. What makes a log event structured rather than formatted text?
95. Which fields should every production log contain?
96. How do log levels differ, and how do you prevent excessive debug logging?
97. How do high-cardinality dimensions affect metrics cost and performance?
98. What are counters, gauges, histograms, and exemplars?
99. How do RED and USE monitoring methods differ?
100. How do traces, spans, baggage, and span links work?
101. How do sampling strategies affect cost and incident diagnosis?
102. How do you retain errors and slow traces while sampling routine traffic?
103. How do symptom-based alerts differ from cause-based alerts?
104. How do you control telemetry cost without losing diagnostic evidence?
### Agile and Cross-Functional Delivery

105. What does effective Agile delivery look like beyond ceremonies?
106. How do you refine an ambiguous story with product, design, and testing colleagues?
107. How do you split a large feature into thin, valuable increments?
108. How do you identify dependencies and integration risks during planning?
109. How do you estimate work while technical uncertainty remains?
110. How do spikes reduce uncertainty without becoming production shortcuts?
111. How do definitions of ready and done improve cross-functional delivery?
112. How do developers, testers, designers, and product owners collaborate before coding?
113. How do you handle changing requirements late in an iteration?
114. How do you surface delivery risk without sounding obstructive?
115. How do you balance sprint commitments, incidents, and technical debt?
116. How do you prevent handoffs from creating queues between disciplines?
117. How do you use retrospectives to produce measurable improvement?
118. How do you support psychological safety while maintaining high standards?
119. Tell me about a cross-functional delivery that did not go to plan.
### Stakeholder Communication

120. How do you communicate the cost and benefit of CQRS or event sourcing?
121. How do you explain why a possible deadline carries unacceptable risk?
122. How do you turn technical metrics into customer or business impact?
123. How do you communicate during an incident before the root cause is known?
124. How do you provide status without hiding uncertainty?
125. How do you challenge a stakeholder request constructively?
126. How do you negotiate scope while protecting security and reliability?
127. How do you tailor one proposal for engineers, executives, security, and operations?
128. How do you respond when stakeholders reject your technical recommendation?
129. How do you demonstrate progress on foundational work with little visible UI?
130. Tell me about a time communication prevented a technical or delivery failure.

## Concurrency, Resilience & Reliability (14)

### Priority 1 — CQRS

1. How do you enforce business invariants when multiple commands run concurrently?
2. How do idempotency and deduplication apply to command handling?
### Priority 1 — Event Sourcing

3. How do expected stream versions prevent concurrent updates?
### Modern .NET and ASP.NET Core

4. How do you prevent duplicate payments after an uncertain client timeout?
5. How do you use HttpClientFactory and resilience handlers correctly?
6. Which HTTP operations are safe to retry?
7. How do timeout, retry, circuit-breaker, and bulkhead policies interact?
### Data, Performance, and Consistency

8. How do transaction isolation levels affect correctness and concurrency?
### Testing and Engineering Quality

9. How do you test retries, timeouts, duplicate messages, and partial failures?
### End-to-End Architecture Scenarios

10. Design a payment API that remains safe when clients retry after timeouts.
11. Design an event-sourced payment aggregate and explain concurrency, projections, and recovery.
### GraphQL with Hot Chocolate, GraphQL.NET, and Apollo

12. How do query depth, complexity, timeouts, and execution limits protect the server?
### Cloud Design Principles for Modern Applications

13. How do stateless services support elasticity and resilience?
14. How do you design for transient faults without creating retry storms?

## CI/CD, Containers & DevOps (56)

### CI/CD, Infrastructure as Code, and Azure Operations

1. How would you build a CI/CD pipeline for a .NET API and frontend application?
2. Which checks must run before a container image can be promoted?
3. How do you promote one immutable image through environments?
4. How do you manage environment-specific configuration without rebuilding images?
5. Compare Bicep, Terraform, and ARM templates.
6. How do you structure reusable infrastructure modules?
7. How do you prevent secrets from entering source control or pipeline logs?
8. How do you detect infrastructure drift?
9. How do you deploy APIM policies and API definitions as code?
10. How do you implement blue/green, canary, and feature-flag rollouts?
11. What metrics determine whether an automated rollout should stop or roll back?
12. How do you coordinate application and database rollback?
13. How do you design separate subscriptions, resource groups, and environments?
14. How do Azure Policy, RBAC, resource locks, and budgets support governance?
15. How do you design backup, restore, and regional disaster-recovery exercises?
### Observability and Production Support

16. How would you investigate a latency increase after deployment?
### Testing and Engineering Quality

17. How do you test container health probes and graceful shutdown?
### ASP.NET Core Application Design

18. Explain the ASP.NET Core request pipeline from connection acceptance to response completion.
19. How do you protect ASP.NET Core Data Protection keys in containers?
### Cloud Design Principles for Modern Applications

20. How do immutable infrastructure and disposable compute affect deployment?
### Azure and AWS Platform Comparisons

21. How would you migrate a containerized .NET workload between AWS and Azure?
### Docker and Kubernetes Delivery Deep Dive

22. How do image layers and the build cache affect Docker build speed and image size?
23. Why are multi-stage Docker builds useful for .NET applications?
24. How do you pin and update base images safely?
25. What is the difference between ENTRYPOINT and CMD?
26. How do Linux signals reach a .NET process inside a container?
27. How do you ensure graceful termination before Kubernetes sends SIGKILL?
28. Why should application state not live only in a container filesystem?
29. How do ConfigMaps and Secrets differ, and what are their security limitations?
30. How do deployments, StatefulSets, DaemonSets, Jobs, and CronJobs differ?
31. How do namespaces and RBAC support workload isolation?
32. How do pod anti-affinity and topology-spread constraints improve resilience?
33. How do disruption budgets interact with cluster upgrades and autoscaling?
34. How do you debug DNS, networking, and service-discovery failures in Kubernetes?
35. How do Helm and Kustomize differ?
36. How do you manage container provenance and software bills of materials?
37. How do you enforce trusted images, non-root users, and resource limits?
### CI/CD and DevOps Ways of Working

38. What does DevOps mean beyond using a deployment pipeline?
39. How do continuous integration, continuous delivery, and continuous deployment differ?
40. What should happen on every pull request?
41. How do trunk-based development and GitFlow differ?
42. What makes a deployment pipeline fast, reliable, and repeatable?
43. How do you separate build, test, package, release, and deploy stages?
44. How do artifacts and provenance support traceability?
45. How do you integrate SAST, dependency, secret, and container scanning?
46. How do you prevent a pull request from accessing production credentials?
47. How do deployment rings reduce release risk?
48. How do feature flags differ from configuration and deployment toggles?
49. How do you perform an emergency hotfix without bypassing essential controls?
50. How do DORA metrics help improve software delivery?
51. Why can deployment frequency and change-failure rate improve together?
52. How do blameless retrospectives turn incidents into delivery improvements?
### Git and Modern Software Delivery

53. How do you audit which source and pipeline produced a deployment?
### Observability, Logging, and Monitoring Deep Dive

54. How do you monitor deployment health against a baseline?
55. How do you investigate a memory leak in a containerized .NET service?
### Stakeholder Communication

56. How do you present architecture options without overwhelming the audience?

## QA / Test Engineering (76)

### Very High Probability Questions

1. How do you approach testing a new feature from requirements through to release?
2. How do you decide what should be automated and what should remain manual?
3. Tell me about the automation framework you've worked with. How is it structured?
4. How do you handle flaky/brittle automated tests?
5. What types of automated tests should we have — unit, integration and end-to-end — and where should each be used?
6. How would you test an application across web, iOS and Android? What would you automate?
7. How do you ensure sufficient regression coverage without making the regression suite too large?
8. How do you perform exploratory testing? Give me an example.
9. A production issue is reported but you cannot reproduce it. How do you investigate it?
10. Tell me about a difficult/critical defect you found. How did you investigate it and communicate it?
11. How do you create a test plan? What would you include?
12. Requirements are incomplete or changing. How would you handle testing?
13. You don't have enough time to complete regression before release. What do you do?
14. How do you determine whether a defect should block a release?
15. Developer and tester disagree about a defect. How do you handle it?
### Automation and API Technical Questions

16. Explain your current automation framework.
17. What makes a good automation framework maintainable?
18. What causes automation tests to become flaky?
19. How would you reduce execution time if the automation suite becomes very large?
20. How do you handle test data in automation?
21. How do you run automation in CI/CD?
22. How would you automate tests across multiple browsers/devices?
23. What locator strategy do you prefer and why?
24. What would you do if an automated test passes locally but fails in CI?
25. How do you test APIs?
26. Apart from the HTTP status code, what do you validate in an API response?
27. How do you test API authentication/authorization?
28. How do you test API error handling, timeouts and retries?
29. How would you test an API that depends on another service?
30. How do you test asynchronous behaviour?
### Mobile Testing Questions

31. How is mobile application testing different from web testing?
32. What mobile scenarios would you test apart from functionality?
33. How would you test different screen sizes and OS versions?
34. How would you test poor/no network connectivity?
35. What happens if the network drops halfway through a transaction?
36. How would you test app background/foreground behaviour?
37. How would you test permissions such as camera/location/notifications?
38. What experience do you have with Appium or other mobile automation?
### Senior and Test Lead Questions

39. What does quality mean to you?
40. Who owns quality — QA or the whole team?
41. How do you influence developers to think about quality earlier?
42. How do you contribute during refinement?
43. How do you estimate testing effort?
44. How do you manage several projects/priorities at the same time?
45. Tell me about a QA process you improved.
46. How do you identify patterns from production defects?
47. How would you improve an existing QA process that isn't working well?
48. What metrics do you use to understand product/test quality?
49. How do you communicate quality risk to a Product Manager?
50. Tell me about a situation where you had to push back on a release.
### Practical Scenario

51. You mentioned automation experience. Suppose you join RUSH and inherit an existing automation suite. The tests are slow, brittle, and the team doesn't trust the results because tests frequently fail for reasons unrelated to actual defects. How would you approach improving that automation suite?
### Previously Asked Senior Test Engineer Questions — High Priority

52. Walk me through how you approach testing a new feature.
53. Tell me about your current automation framework and your contribution to it.
54. What have you automated yourself?
55. How do you decide what should and shouldn't be automated?
56. Tell me about a flaky/brittle automation problem you solved.
57. If you inherited a slow and unreliable automation suite, how would you improve it?
58. How do you approach API testing?
59. What do you validate beyond the HTTP status code?
60. How do you approach integration testing when several systems are involved?
61. Tell me about your mobile-testing experience.
62. How is your mobile-testing strategy different from web?
63. How do you perform exploratory testing?
64. Tell me about a serious defect you discovered.
65. Tell me about a production issue you investigated.
66. What do you do when you can't reproduce a production issue?
67. What happens when you disagree with a developer about a defect?
68. How do you test when requirements aren't clear?
69. How do you prioritise testing when you don't have enough time?
70. How do you determine regression scope?
71. How do you decide whether you're comfortable with a release?
72. How do you communicate testing risk to a Product Owner/Test Lead?
73. How do you manage multiple projects or competing priorities?
74. How have you improved QA processes in your team?
75. How do you use Jira/TestRail to manage testing?
76. How do you contribute during refinement/planning rather than waiting for development to finish?

