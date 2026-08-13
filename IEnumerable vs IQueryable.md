# IEnumerable vs IQueryable vs List in C#: What Actually Happens Behind the Scenes?

When working with C# and Entity Framework Core, you'll frequently come across three types:

* `IEnumerable<T>`
* `IQueryable<T>`
* `List<T>`

They can look very similar because all three allow you to work with collections and use LINQ methods such as `Where()`, `Select()`, and `OrderBy()`.

But internally, they can behave very differently.

The biggest question is:

> **Where is the data being processed — in the database or in application memory?**

Understanding that difference is important because choosing the wrong approach can create serious performance problems.

---

# 1. What is `IEnumerable<T>`?

`IEnumerable<T>` represents a sequence of objects that can be iterated over.

For example:

```csharp
IEnumerable<User> users = GetUsers();

var adults = users.Where(x => x.Age >= 18);
```

`IEnumerable` is commonly used when we're working with objects in application memory.

It also supports **deferred execution**.

That means this:

```csharp
var adults = users.Where(x => x.Age >= 18);
```

doesn't necessarily execute immediately.

The query is executed when we actually enumerate the results:

```csharp
foreach (var user in adults)
{
    Console.WriteLine(user.Name);
}
```

Or when we use methods such as:

```csharp
ToList()
ToArray()
First()
FirstOrDefault()
Single()
Count()
Any()
```

These methods force LINQ to actually evaluate the sequence.

---

# 2. What is `IQueryable<T>`?

`IQueryable<T>` becomes especially important when working with Entity Framework Core.

For example:

```csharp
IQueryable<User> users = dbContext.Users;
```

The important thing is:

**The database hasn't been called yet.**

Now suppose we add:

```csharp
var query = users
    .Where(x => x.Age >= 18)
    .OrderBy(x => x.Name);
```

Still, the database hasn't necessarily been called.

Instead, Entity Framework is building an **expression tree** describing what we want.

Conceptually:

```text
Users
   ↓
Where Age >= 18
   ↓
OrderBy Name
```

When we finally write:

```csharp
var result = await query.ToListAsync();
```

Entity Framework examines that expression tree and translates it into SQL.

Something similar to:

```sql
SELECT *
FROM Users
WHERE Age >= 18
ORDER BY Name;
```

The SQL is then sent to the database.

So the flow is:

```text
C# LINQ
   ↓
IQueryable
   ↓
Expression Tree
   ↓
EF Core translates it
   ↓
SQL
   ↓
Database executes
   ↓
Results returned
   ↓
Objects created in memory
```

This is one of the biggest advantages of `IQueryable`.

Instead of loading everything into memory and filtering afterward, we can ask the database to do the work.

---

# 3. What is `List<T>`?

`List<T>` is different.

A `List<T>` is a concrete collection containing objects that are already in application memory.

For example:

```csharp
List<User> users = await dbContext.Users.ToListAsync();
```

When `ToListAsync()` executes, EF Core sends the SQL query to the database.

The database returns the records.

EF Core converts those records into `User` objects.

Those objects are then stored inside:

```csharp
List<User>
```

So:

```text
Database
   ↓
SELECT Users
   ↓
Rows returned
   ↓
EF Core creates User objects
   ↓
List<User>
   ↓
Application Memory
```

Now suppose we do:

```csharp
var adults = users.Where(x => x.Age >= 18);
```

The filtering happens **in the application**, because `users` is already a `List<User>`.

No new SQL query is required.

---

# 4. The Main Difference

The easiest way to remember the three is:

| Type             | Main Purpose                      | Execution            | Typical Processing |
| ---------------- | --------------------------------- | -------------------- | ------------------ |
| `IEnumerable<T>` | Iterate over a sequence           | Usually deferred     | Application memory |
| `IQueryable<T>`  | Build queries for a data provider | Deferred             | Database           |
| `List<T>`        | Store actual objects              | Already materialized | Application memory |

A simple mental model:

```text
IQueryable
    ↓
"Build the database query"

ToListAsync()
    ↓
"Execute the query"

List
    ↓
"Work with returned objects in memory"
```

---

# 5. Why `IQueryable` Can Be More Efficient

Imagine our database contains:

```text
1,000,000 Users
```

We only need users whose age is greater than 30.

With `IQueryable`:

```csharp
var users = await dbContext.Users
    .Where(x => x.Age > 30)
    .ToListAsync();
```

EF can generate:

```sql
SELECT *
FROM Users
WHERE Age > 30;
```

Suppose only 10,000 users match.

Only those records need to be returned.

Conceptually:

```text
1,000,000 DB records
        ↓
Database filters
        ↓
10,000 records
        ↓
Application
```

That's generally much better than loading all one million records into the application first.

---

# 6. When Can `IQueryable` Cause Performance Problems?

`IQueryable` is powerful, but it doesn't automatically mean your code will be fast.

You're effectively building a database query.

If you build a bad query, EF Core can generate expensive SQL.

Let's look at some common examples.

---

## Problem 1: Calling `ToList()` Too Early

Consider:

```csharp
var users = await dbContext.Users.ToListAsync();

var adults = users.Where(x => x.Age > 30);
```

`ToListAsync()` executes first.

That means:

```sql
SELECT *
FROM Users;
```

The application could receive 1,000,000 users.

Then:

```csharp
Where(x => x.Age > 30)
```

runs in memory.

Instead:

```csharp
var adults = await dbContext.Users
    .Where(x => x.Age > 30)
    .ToListAsync();
```

Now EF can generate:

```sql
SELECT *
FROM Users
WHERE Age > 30;
```

This allows the database to filter the records before sending them to the application.

---

# 7. Multiple Enumeration Can Mean Multiple Database Calls

Consider:

```csharp
var query = dbContext.Users
    .Where(x => x.IsActive);
```

No database call has necessarily happened yet.

Now:

```csharp
var count = query.Count();
```

This may generate:

```sql
SELECT COUNT(*)
FROM Users
WHERE IsActive = 1;
```

Then:

```csharp
var users = query.ToList();
```

can generate another query:

```sql
SELECT *
FROM Users
WHERE IsActive = 1;
```

So:

```text
query.Count()
      ↓
Database Call #1

query.ToList()
      ↓
Database Call #2
```

This surprises developers because it looks like we're working with the same variable.

But `query` doesn't contain the results.

It contains the **query definition**.

---

# 8. `First()`, `Count()`, `Any()` etc. Can Hit the Database

When working with `IQueryable`, methods such as:

```csharp
ToList()
ToArray()
First()
FirstOrDefault()
Single()
SingleOrDefault()
Count()
Any()
Max()
Min()
Average()
```

can cause the query provider to execute against the database.

For example:

```csharp
var exists = dbContext.Users
    .Where(x => x.Email == email)
    .Any();
```

EF might generate something conceptually similar to an SQL existence check.

The important idea is:

```text
Where()
Select()
OrderBy()
Skip()
Take()
```

generally **build the query**.

While operations such as:

```text
ToList()
First()
Count()
Any()
```

generally **ask for a result**, causing execution.

---

# 9. Fetching More Columns Than Necessary

Suppose `User` contains 30 columns.

But we only need:

```text
Id
Name
Email
```

This:

```csharp
var users = await dbContext.Users.ToListAsync();
```

may retrieve every mapped column.

Instead:

```csharp
var users = await dbContext.Users
    .Select(x => new
    {
        x.Id,
        x.Name,
        x.Email
    })
    .ToListAsync();
```

can produce SQL closer to:

```sql
SELECT Id, Name, Email
FROM Users;
```

This reduces unnecessary data transfer.

This technique is called **projection**.

---

# 10. Too Many `Include()` Calls

Consider:

```csharp
var users = await dbContext.Users
    .Include(x => x.Orders)
    .Include(x => x.Addresses)
    .Include(x => x.Roles)
    .ToListAsync();
```

This looks convenient.

But depending on the relationships and query shape, it can create very large SQL queries and duplicate data across joined rows.

For example:

```text
User
 ├── Orders
 ├── Addresses
 └── Roles
```

One user might have:

```text
10 Orders
3 Addresses
5 Roles
```

Combining multiple collection relationships can dramatically increase the number of rows the database has to process and return.

So `Include()` should be used intentionally rather than automatically loading every relationship.

---

# 11. Missing Database Indexes

Sometimes the C# query looks perfectly reasonable:

```csharp
var user = await dbContext.Users
    .FirstOrDefaultAsync(x => x.Email == email);
```

But if `Email` isn't indexed and the table contains millions of records, the database may need to scan a large portion of the table.

So `IQueryable` performance isn't only about C#.

You also need to think about:

```text
Indexes
Query plans
Joins
Data volume
Sorting
Filtering
Pagination
```

EF Core generates SQL, but the database still has to execute that SQL efficiently.

---

# 12. Pagination Is Important

Avoid returning enormous result sets:

```csharp
var users = await dbContext.Users.ToListAsync();
```

For an API, use pagination where appropriate:

```csharp
var users = await dbContext.Users
    .OrderBy(x => x.Id)
    .Skip(100)
    .Take(50)
    .ToListAsync();
```

Conceptually:

```text
Database: 1,000,000 records
              ↓
          Skip / Take
              ↓
           50 records
              ↓
             API
```

Rather than:

```text
Database: 1,000,000 records
              ↓
      Application Memory
              ↓
        Return 50
```

---

# 13. `IQueryable` vs `IEnumerable`: One Important Example

Consider:

```csharp
IQueryable<User> users = dbContext.Users;

var result = users
    .Where(x => x.Age > 30)
    .Take(10);
```

EF can translate the operations into SQL and let the database perform the filtering and limiting.

But once you intentionally move to LINQ-to-Objects, for example:

```csharp
var users = dbContext.Users
    .AsEnumerable();

var result = users
    .Where(x => x.Age > 30)
    .Take(10);
```

the operations after `AsEnumerable()` are no longer being composed as EF database expressions.

That boundary matters.

A useful way to think about it is:

```text
Before materialization / LINQ-to-Objects boundary
        ↓
Database query composition

After materialization / LINQ-to-Objects boundary
        ↓
Application processing
```

---

# 14. A Real API Example

Suppose we have:

```text
GET /api/users?age=30&page=2
```

A good approach is:

```csharp
var query = dbContext.Users
    .Where(x => x.Age >= 30);

var users = await query
    .OrderBy(x => x.Id)
    .Skip(20)
    .Take(20)
    .Select(x => new UserDto
    {
        Id = x.Id,
        Name = x.Name
    })
    .ToListAsync();
```

Notice the order:

```text
IQueryable<User>
       ↓
Where
       ↓
OrderBy
       ↓
Skip
       ↓
Take
       ↓
Select
       ↓
ToListAsync()
       ↓
Database executes
       ↓
List<UserDto>
```

We're doing as much useful filtering and projection as possible **before materialization**.

---

# 15. The Rule I Use

When working with Entity Framework Core, think:

```text
             IQueryable
                  ↓
        Build database query
                  ↓
      Where / Select / OrderBy
          / Skip / Take
                  ↓
             ToListAsync()
                  ↓
          DATABASE EXECUTES
                  ↓
              List<T>
                  ↓
        Application Memory
```

The key is not to think:

> "`IQueryable` is faster than `IEnumerable`."

That's too simplistic.

A better way to think about it is:

> **`IQueryable` allows the database provider to translate your LINQ expression into a database query, while `IEnumerable` represents normal .NET enumeration.**

Performance depends on what query you ultimately generate and how much data you move between the database and application.

---

# Interview Summary

If an interviewer asks:

**"Explain IEnumerable, IQueryable and List. When can IQueryable cause performance issues?"**

A strong answer is:

> `IEnumerable` represents a sequence that can be iterated and is commonly used for in-memory LINQ processing. `IQueryable` represents a query that a provider such as Entity Framework Core can translate into another query language such as SQL. Both can use deferred execution.
>
> `List` is a concrete in-memory collection, so when I call `ToListAsync()` on an EF Core query, the query is executed and the returned records are materialized into objects.
>
> `IQueryable` can cause performance problems when we generate inefficient SQL — for example, executing the same deferred query multiple times, calling `ToList()` too early, loading unnecessary relationships with `Include`, retrieving unnecessary columns, missing database indexes, or returning large result sets without pagination.
>
> My normal approach is to keep filtering, projection, sorting and pagination in the `IQueryable`, inspect the generated SQL when necessary, and materialize the query once with `ToListAsync()`.

## One-Line Memory Trick

**`IQueryable` builds the database query → `ToListAsync()` executes it → `List` holds the results in memory.**