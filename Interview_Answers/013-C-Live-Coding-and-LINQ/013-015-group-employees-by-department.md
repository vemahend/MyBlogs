# 15. Group employees by department.

**Technology:** C# Live Coding and LINQ

**Source question:** 15. Group employees by department.

## 1. What is it?

Grouping employees by department means taking one employee collection and dividing it into smaller groups that share the same department.

In LINQ, the `GroupBy` method does this. It returns a sequence of groups. Each group has:

- a `Key`, such as `"Payments"`; and
- the employees that belong to that key.

The result is grouped data, not a `Dictionary`. We can convert it to a dictionary when key-based lookup is needed.

## 2. Why is it important?

Business data often needs to be viewed or calculated by category. For example, a manager may need an employee count, salary total, or list of active employees for every department.

Without grouping, developers may write nested loops and manually manage collections. LINQ makes the intention clear, keeps the code short, and reduces bookkeeping errors. This is useful for reports, dashboards, batch processing, and preparing API responses.

## 3. How does it work?

For LINQ to Objects, `GroupBy` follows this flow:

1. It reads each employee from the source.
2. The key selector returns that employee's department.
3. LINQ compares the key using the default equality comparer, unless a custom comparer is supplied.
4. It places the employee into the matching group.
5. Each returned `IGrouping<TKey, TElement>` exposes the department through `Key` and can be enumerated to read its employees.

`GroupBy` uses deferred execution: creating the query does not enumerate the source. When the result is enumerated, LINQ to Objects reads the whole source and builds its groups before returning them. Calling `ToList`, `ToArray`, or `ToDictionary` materializes the result immediately.

For `IQueryable`, such as an Entity Framework Core query, the provider tries to translate the expression to the data source. Translation depends on the projection and the EF Core/provider version. Aggregates such as count and sum are normally good database-side grouping operations. If the application needs every employee inside every group, it is often clearer to load only the required rows and columns, then group in memory.

## 4. Practical example

A bank is moving employees to a new role-based access system. Before creating access-review tasks, the application loads active employees and groups them by department.

The Security department receives its own employee list, Payments receives another, and so on. The system can then create one review task per department owner instead of sending one large, mixed list. It can also show the employee count for each department so that missing or unexpected assignments are easier to spot.

## 5. Scenario-based interview answer

**Problem:** We needed a daily report showing active employees and total payroll cost for each department. The original code used nested loops and repeatedly scanned the employee collection.

**Decision:** I used LINQ `GroupBy` because the data was already loaded and the department was the natural grouping key. I normalized blank department values to `"Unassigned"` and used a case-insensitive comparer so that `"Payments"` and `"payments"` did not become separate groups.

**Implementation:** I filtered inactive employees first, grouped the remaining records by department, and projected each group into a report row containing the department, employee count, and salary total. I materialized the final rows once with `ToList` before returning them.

**Result:** The code became easier to review and test, and it enumerated the source once instead of repeatedly scanning it. For a larger database-backed report, I would keep the count and sum projection in the EF Core query so the database performs the aggregation.

## 6. Code example

```csharp
public sealed record Employee(
    int Id,
    string Name,
    string? Department,
    decimal AnnualSalary,
    bool IsActive);

public sealed record DepartmentSummary(
    string Department,
    int EmployeeCount,
    decimal TotalAnnualSalary,
    IReadOnlyList<string> EmployeeNames);

var employees = new List<Employee>
{
    new(1, "Aisha", "Payments", 105_000m, true),
    new(2, "Ben", "payments", 98_000m, true),
    new(3, "Chen", "Security", 120_000m, true),
    new(4, "Divya", null, 92_000m, true),
    new(5, "Ethan", "Payments", 95_000m, false)
};

var summaries = employees
    .Where(employee => employee.IsActive)
    .GroupBy(
        employee => string.IsNullOrWhiteSpace(employee.Department)
            ? "Unassigned"
            : employee.Department.Trim(),
        StringComparer.OrdinalIgnoreCase)
    .Select(group => new DepartmentSummary(
        Department: group.Key,
        EmployeeCount: group.Count(),
        TotalAnnualSalary: group.Sum(employee => employee.AnnualSalary),
        EmployeeNames: group
            .OrderBy(employee => employee.Name)
            .Select(employee => employee.Name)
            .ToList()))
    .OrderBy(summary => summary.Department)
    .ToList();

foreach (var summary in summaries)
{
    Console.WriteLine(
        $"{summary.Department}: {summary.EmployeeCount} employee(s), " +
        $"{summary.TotalAnnualSalary:C}");
}
```

Important points:

- `Where` removes inactive employees before grouping, reducing the work.
- The key selector maps null, empty, and whitespace departments to `"Unassigned"`.
- `StringComparer.OrdinalIgnoreCase` prevents department names that differ only by case from becoming separate groups.
- `Select` creates a small response model instead of exposing LINQ grouping objects.
- The final `ToList` executes the query once and gives the caller a stable snapshot.

## 7. Common mistakes

- Forgetting that `GroupBy` returns groups rather than a dictionary.
- Allowing null, blank, differently cased, or whitespace-padded department names to create unintended groups.
- Grouping by `DepartmentName` when a stable `DepartmentId` is available. Names can change or may not be unique.
- Enumerating the same deferred query several times, which repeats the grouping work and may produce different results if the source changes.
- Calling `ToList` too early on an EF Core query, causing all rows to be loaded before filtering or aggregation.
- Assuming that every complex `GroupBy` projection is translated efficiently by every EF Core database provider. Check the generated SQL and test with realistic data.
- Returning full employee entities when the caller needs only counts or totals, which uses unnecessary memory and network bandwidth.
- Using `ToDictionary` when duplicate keys still exist. Aggregate or group first so each dictionary key is unique.

## 8. Follow-up interview questions

### 1. What type does `GroupBy` return?

It returns `IEnumerable<IGrouping<TKey, TElement>>` for LINQ to Objects. Each group has a `Key` and is also an enumerable collection of matching elements.

### 2. How would you group by both department and location?

Use a composite key, usually an anonymous type or a tuple:

```csharp
var groups = employees.GroupBy(employee => new
{
    Department = employee.Department,
    employee.Location
});
```

Both values participate in equality, so a separate group is created for each department-and-location combination.

### 3. When should grouping happen in the database instead of memory?

Use database-side grouping when the source is large and the result needs aggregates such as `Count`, `Sum`, or `Average`. It reduces transferred data and application memory use. Inspect the generated SQL because translation support can vary by query shape, EF Core version, and database provider.
