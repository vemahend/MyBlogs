# 16. Find the highest-paid employee in each department.

**Technology:** C# Live Coding and LINQ

**Source question:** 16. Find the highest-paid employee in each department.

## 1. What is it?

This is a LINQ grouping problem. We group employees by department and then select the employee with the highest salary from each group.

The result contains one employee per department. If two employees have the same highest salary, the code should use a clear rule to decide which employee is returned, or return all tied employees if that is the business requirement.

## 2. Why is it important?

Real applications often need a top record from every category, such as the highest-paid employee in each department, the largest payment for each customer, or the latest transaction for each account.

LINQ makes this readable and avoids manual nested loops. A senior developer must also consider empty input, duplicate maximum values, deterministic results, and whether the query runs in memory or is translated into SQL.

## 3. How does it work?

The execution flow is:

1. `GroupBy` creates one group for each department.
2. Employees inside each group are ordered by salary from highest to lowest.
3. A second ordering provides a stable tie-break rule.
4. `First` selects one employee from each group.

For LINQ to Objects, `GroupBy` builds the groups in memory. The example has approximately O(n log n) work because each group is sorted. On .NET 6 and later, `MaxBy` can find a maximum in one pass for in-memory collections, but explicit ordering is useful when a deterministic tie-break is required. For an `IQueryable` backed by Entity Framework Core, SQL translation and database indexes should be checked because execution behavior is provider-dependent.

## 4. Practical example

A bank creates a compensation review report for its Operations, Fraud, and Payments departments. HR needs one highest-paid active employee from each department.

The application first filters out inactive employees, groups the remaining employees by department, and selects the highest salary in each group. If two employees have the same salary, the employee with the lower employee ID is selected so that repeated runs return the same result.

## 5. Scenario-based interview answer

“In a banking reporting service, I needed to return the highest-paid active employee from every department.

The main decision was how to handle equal salaries. The requirement was one employee per department, so I agreed on employee ID as the deterministic tie-breaker. I filtered active employees, grouped them by department, ordered each group by salary descending and then by employee ID ascending, and selected the first employee.

For an in-memory collection, this LINQ query was simple and clear. If the data came from EF Core, I would keep the query as `IQueryable`, inspect the generated SQL, and ensure useful indexes existed. The result was predictable, easy to test, and returned exactly one employee for every department that had an active employee.”

## 6. Code example

```csharp
public sealed record Employee(
    int Id,
    string Name,
    string Department,
    decimal Salary,
    bool IsActive);

var employees = new List<Employee>
{
    new(1, "Asha",  "Payments",   110_000m, true),
    new(2, "Ben",   "Payments",   125_000m, true),
    new(3, "Chloe", "Fraud",      120_000m, true),
    new(4, "Dev",   "Fraud",      120_000m, true),
    new(5, "Elena", "Operations", 105_000m, false),
    new(6, "Farah", "Operations",  98_000m, true)
};

var highestPaidByDepartment = employees
    .Where(employee => employee.IsActive)
    .GroupBy(employee => employee.Department)
    .Select(group => group
        .OrderByDescending(employee => employee.Salary)
        .ThenBy(employee => employee.Id)
        .First())
    .ToList();

foreach (var employee in highestPaidByDepartment)
{
    Console.WriteLine(
        $"{employee.Department}: {employee.Name} - {employee.Salary:C}");
}
```

`GroupBy` separates employees by department. `OrderByDescending` puts the highest salary first. `ThenBy(Id)` resolves salary ties consistently, and `First` returns one employee from each non-empty group. Filtering happens before grouping, so a department with no active employees is not included.

If the requirement is to return every employee tied for the highest salary, select the maximum salary for each group and return all matching employees instead of using `First`:

```csharp
var allHighestPaidEmployees = employees
    .Where(employee => employee.IsActive)
    .GroupBy(employee => employee.Department)
    .SelectMany(group =>
    {
        decimal highestSalary = group.Max(employee => employee.Salary);
        return group.Where(employee => employee.Salary == highestSalary);
    })
    .ToList();
```

## 7. Common mistakes

- Calling `Max` returns only the salary, not the employee record.
- Using `First` after sorting only by salary makes tied results depend on input order.
- Forgetting whether the requirement expects one winner or all employees tied for first place.
- Grouping before applying required filters, such as active status, tenant, region, or effective date.
- Calling `ToList` too early on an EF Core query, which loads unnecessary rows and performs the remaining work in memory.
- Using `double` for salary or money. `decimal` is normally the correct type for financial values.
- Assuming every department must appear. A department with no matching employees needs a separate department source and a left join if it must be included.

## 8. Follow-up interview questions

### How would you return all employees tied for the highest salary?

Calculate the maximum salary inside each department group, then use `Where` to return every employee whose salary equals that maximum. The second code sample demonstrates this approach.

### Can `MaxBy` be used here?

Yes. `MaxBy` is available in .NET 6 and later and is concise for LINQ to Objects. However, its tie behavior may not express the required business rule, and support for translating it in an `IQueryable` depends on the query provider.

### How would you make this efficient for a large database table?

Keep the query server-side as `IQueryable`, select only required columns, review the generated SQL and execution plan, and use an index that supports the filtering, department grouping, salary ordering, and tie-break column. Measure performance with realistic data rather than assuming the in-memory version will translate optimally.
