# 4. How do you read an execution plan?

**Technology:** SQL Server and Data Access

**Source question:** 4. How do you read an execution plan?

## 1. What is it?

An execution plan shows how SQL Server chooses to run a SQL statement. It is a tree of operators such as index seek, index scan, join, sort, and aggregate. The operators show how rows move through the query and where SQL Server spends its work.

There are two main types:

- An **estimated plan** is created without running the query. It shows what the optimizer expects.
- An **actual plan** is collected while the query runs. It includes runtime information such as actual row counts and execution details.

An actual plan still contains estimates. The useful part is that we can compare those estimates with what really happened.

## 2. Why is it important?

An execution plan helps us find the real reason for a slow query instead of guessing. For example, the problem may be a table scan, thousands of key lookups, a poor join choice, a large sort, stale statistics, an implicit data conversion, or an inaccurate row estimate.

In production systems, a slow database query can increase API response time, hold locks longer, consume CPU and memory, and delay other requests. A senior developer should use the plan together with duration, logical reads, waits, blocking information, and Query Store history before changing a query or adding an index.

## 3. How does it work?

In the graphical plan, data generally flows from the leaf operators toward the root result. In SQL Server Management Studio, this is commonly read from right to left, but branches can make the flow non-linear. Follow the arrows and inspect the properties rather than relying only on screen position.

A practical reading order is:

1. **Confirm the statement and runtime context.** Check parameters, database, compatibility level, and whether the plan is estimated or actual.
2. **Start with the final result and follow its inputs.** This explains how SQL Server produced the rows.
3. **Check actual rows versus estimated rows.** A large difference often points to stale statistics, skewed data, parameter sensitivity, or a predicate the optimizer cannot estimate well.
4. **Find operators doing the most work.** Look at actual rows, executions, logical reads, elapsed time, CPU time, and spills where those details are available. The displayed cost percentage is only an optimizer estimate, not measured runtime.
5. **Inspect access methods.** An index seek can be good, but a seek returning most of a table or followed by many key lookups can still be expensive. A scan is not automatically bad when many rows are required.
6. **Inspect joins and supporting operators.** Nested loops often suit small outer inputs, hash joins often suit larger unsorted inputs, and merge joins benefit from ordered inputs. Sorts, spools, lookups, and exchanges deserve attention when they process many rows.
7. **Read warnings.** Common warnings include spills to `tempdb`, implicit conversions, missing indexes, excessive memory grants, and plan-affecting conversions.
8. **Validate a proposed fix.** Compare the same representative workload before and after the change. A plan shape alone does not prove improvement.

## 4. Practical example

A banking API retrieves pending payments for one customer:

```sql
SELECT PaymentId, CreatedAtUtc, Amount, Currency
FROM dbo.Payments
WHERE CustomerId = @CustomerId
  AND Status = 'Pending'
ORDER BY CreatedAtUtc DESC;
```

The actual plan shows a clustered index scan over ten million payments, followed by a sort. The estimate expects 20 rows, but the query actually returns 40,000 rows for this customer. This difference explains why SQL Server chose a plan that works for a typical customer but performs poorly for a large business customer.

I would confirm the parameter values and data distribution, review statistics and Query Store, and test an index such as `(CustomerId, Status, CreatedAtUtc DESC)` with only the required output columns included. I would then measure both read improvement and the extra write cost because every payment insert or relevant update must maintain that index.

## 5. Scenario-based interview answer

**Problem:** “A payment-history endpoint became slow for a few large customers. Its p95 response time increased to several seconds.”

**Decision:** “I captured the actual plan using a production-like parameter and compared it with Query Store history. I did not judge the plan only by its highest cost percentage.”

**Implementation:** “I followed the row flow, compared estimated and actual row counts, and found a nested-loops join doing tens of thousands of key lookups. The optimizer had estimated only a few rows because the cached plan was compiled for a small customer. I verified data skew and parameter sensitivity, then tested an index that covered the important query and an appropriate parameter-sensitive plan strategy supported by our SQL Server version. I tested the change with both small and large customers and measured logical reads, CPU, duration, write overhead, and concurrency.”

**Result:** “The endpoint became stable for both customer groups, logical reads fell significantly, and payment write latency stayed within its target. I kept Query Store monitoring in place so we could detect a regression after data distribution changed.”

## 6. Code example

C# code is not needed to interpret a graphical execution plan. The most useful code is a safe test query that captures supporting runtime measurements:

```sql
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

SELECT PaymentId, CreatedAtUtc, Amount, Currency
FROM dbo.Payments
WHERE CustomerId = @CustomerId
  AND Status = 'Pending'
ORDER BY CreatedAtUtc DESC;
```

In SSMS, enable **Include Actual Execution Plan** before running this in a non-production test session with representative parameters. The plan explains the operators, while `STATISTICS IO` reports page reads and `STATISTICS TIME` reports CPU and elapsed time. These measurements make the before-and-after comparison more reliable.

Do not run an expensive diagnostic query against production simply to obtain a plan. Prefer Query Store or an approved monitoring process when production impact is a concern. Also protect plan files: they can contain SQL text, object names, and parameter values.

## 7. Common mistakes

- Reading only the operator with the highest displayed cost. That percentage is based on estimates and can be misleading.
- Assuming every index seek is good and every scan is bad. Row count and total work matter more than the operator name.
- Looking only at the plan shape and ignoring logical reads, CPU, duration, waits, blocking, and concurrency.
- Ignoring large differences between estimated and actual row counts.
- Blindly creating every missing-index suggestion. Suggestions do not fully consider overlapping indexes, storage, or write overhead.
- Capturing a plan with unrepresentative parameter values and assuming it describes every execution.
- Testing only with small development data, where scans and joins behave differently.
- Using hints to force a plan before understanding statistics, parameter sensitivity, data types, and query design.
- Sharing plan files without checking for sensitive SQL text or parameter values.

## 8. Follow-up interview questions

### What is the difference between an estimated and an actual execution plan?

An estimated plan is produced without executing the query. An actual plan is collected during execution and adds runtime data, including actual row counts. Both contain optimizer estimates.

### Is an index scan always a performance problem?

No. A scan can be the correct and cheapest choice when the query needs a large part of the table or when the table is small. The concern is unnecessary work, not the word “scan.”

### What does a large difference between estimated and actual rows mean?

It means the optimizer predicted the row count poorly. Common causes are stale statistics, skewed data, parameter sensitivity, implicit conversions, or complex predicates. Poor estimates can lead to unsuitable joins, memory grants, and access methods.
