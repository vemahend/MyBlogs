# 23. Select versus SelectMany?

**Technology:** C# Live Coding and LINQ

**Source question:** 23. Select versus SelectMany?

## 1. What is it?

`Select` and `SelectMany` are LINQ projection operators. They transform items from a source collection into a new shape.

- `Select` produces one result for each source item. If each item contains a collection, the result stays nested.
- `SelectMany` produces zero or more results for each source item and combines those results into one flat sequence.

In simple terms, `Select` is a **map**, while `SelectMany` is a **map followed by flattening**.

## 2. Why is it important?

Real systems often contain nested data. For example, a customer has accounts, an account has transactions, or a payment batch has payment instructions.

Choosing the correct operator gives the result shape that the application needs:

- Use `Select` when the relationship between the parent and its projected value should remain one-to-one.
- Use `SelectMany` when callers need to process all child items as one sequence.

This matters because an incorrect choice can leave unnecessary nested collections, complicate filtering and aggregation, or accidentally lose the parent information needed later.

## 3. How does it work?

For each source item, `Select` calls the selector once and yields its returned value. If the selector returns a collection, the output type is a sequence of collections, such as `IEnumerable<IEnumerable<Transaction>>`.

`SelectMany` also calls a selector for each source item, but that selector returns a child sequence. LINQ then enumerates each child sequence and yields its elements individually. The output becomes a single `IEnumerable<Transaction>`.

Both operators use deferred execution for `IEnumerable<T>`. The transformation starts when the result is enumerated, not when the query is declared. With `IQueryable<T>`, such as Entity Framework Core, the query provider tries to translate the expression into the data source's query language.

## 4. Practical example

Suppose a bank loads several customer accounts, and every account contains a collection of transactions.

Using `Select(account => account.Transactions)` returns one transaction collection per account. That is useful when the application wants to show transactions grouped by account.

Using `SelectMany(account => account.Transactions)` returns all transactions as one sequence. That is useful when the bank needs to find every high-value transaction across all accounts or calculate one total.

If the result also needs the account number, the projection can keep both values:

```csharp
var transactionDetails = accounts.SelectMany(
    account => account.Transactions,
    (account, transaction) => new
    {
        account.AccountNumber,
        Transaction = transaction
    });
```

## 5. Scenario-based interview answer

"In a payment service, I had a collection of settlement batches, and each batch contained several payments. The reporting process needed one row per payment, not one collection per batch.

I chose `SelectMany` because `Select` would have returned a nested sequence of payment collections. I used the `SelectMany` overload with a result selector so each output row kept the batch ID as well as the payment.

That gave the reporting pipeline a flat sequence that it could filter and aggregate directly. It also made the parent-child relationship explicit and avoided extra nested loops. If the requirement had been to preserve payments grouped by batch, I would have used `Select` instead."

## 6. Code example

```csharp
public sealed record Transaction(string Id, decimal Amount);

public sealed record Account(
    string AccountNumber,
    IReadOnlyList<Transaction> Transactions);

var accounts = new[]
{
    new Account("A100", new[]
    {
        new Transaction("T1", 250m),
        new Transaction("T2", 1_500m)
    }),
    new Account("A200", new[]
    {
        new Transaction("T3", 2_000m)
    })
};

// One result per account: IEnumerable<IReadOnlyList<Transaction>>
var transactionsByAccount = accounts
    .Select(account => account.Transactions);

// One result per transaction: IEnumerable<Transaction>
var allTransactions = accounts
    .SelectMany(account => account.Transactions);

var highValueTransactions = accounts
    .SelectMany(
        account => account.Transactions,
        (account, transaction) => new
        {
            account.AccountNumber,
            transaction.Id,
            transaction.Amount
        })
    .Where(item => item.Amount >= 1_000m);
```

The first query keeps one child collection for every account. The second flattens all child collections. The third also keeps the account number, which is often required for logging, reporting, or further business rules.

## 7. Common mistakes

- Using `Select` and then struggling with an unexpected `IEnumerable<IEnumerable<T>>` result.
- Using `SelectMany` when grouping by the parent must be preserved.
- Flattening child items without keeping the parent ID needed for audit or business logic.
- Assuming either operator changes the original objects. They create a projected sequence; they do not mutate the source.
- Forgetting deferred execution and enumerating the same expensive query multiple times.
- Calling `ToList()` too early on an Entity Framework Core query, which moves later filtering and projection into application memory.
- Returning `null` from a `SelectMany` collection selector. Return an empty sequence when there are no child items, or handle possible null collections explicitly.

## 8. Follow-up interview questions

### Can `SelectMany` keep information from the parent item?

Yes. Use its result-selector overload to combine the parent and child into a new object, such as an account number with each transaction.

### Is `SelectMany` the same as nested loops?

Conceptually, yes. It enumerates each parent and then each selected child sequence, but expresses the operation as a composable LINQ query.

### What happens when a child collection is empty?

`Select` still returns that empty collection as one projected result. `SelectMany` yields no child items for that parent and continues with the next parent.
