# 1. What makes a good unit test?

**Technology:** Testing and Quality

**Source question:** 1. What makes a good unit test?

## 1. What is it?

A good unit test checks one small piece of behavior, such as a method or business rule, without using real databases, networks, file systems, or external services.

It should be:

- **Fast** so developers can run it often.
- **Reliable** so the same code produces the same result every time.
- **Independent** so it does not depend on another test or shared state.
- **Easy to read** so its purpose and expected result are clear.
- **Focused on behavior** rather than private implementation details.

A useful test name describes the condition and expected outcome, for example, `Authorize_WhenBalanceIsTooLow_ReturnsDeclined`.

## 2. Why is it important?

Good unit tests give the team quick feedback when business logic changes. They make refactoring safer because they confirm that important behavior still works.

They also act as practical documentation. A developer can read the tests to understand rules such as payment limits, fee calculation, or account-locking behavior.

Poor tests create false confidence. A test that sometimes fails, depends on a real service, or only verifies internal method calls can slow the team down without protecting real behavior.

## 3. How does it work?

A unit test normally follows Arrange, Act, Assert:

1. **Arrange:** Create the unit under test and provide controlled input and dependencies.
2. **Act:** Run one public behavior.
3. **Assert:** Check the returned value or visible state change.

External dependencies are replaced only when needed. For example, a payment gateway can be represented by a small fake or mock, while simple domain objects can usually be real objects.

The test runner discovers test methods, executes each test in isolation, and reports whether its assertions passed. A good test should not depend on execution order, the current time, random data, or machine-specific configuration unless those values are explicitly controlled.

## 4. Practical example

Consider a banking service that authorizes a withdrawal. The rule says a withdrawal must be declined when the requested amount is greater than the available balance.

A good unit test creates an account with a known balance, requests a larger amount, and checks that the result is `Declined` with the correct reason. It does not connect to a real bank database or payment network because those systems are not needed to prove this business rule.

Separate integration tests should verify database mapping and communication with external payment systems.

## 5. Scenario-based interview answer

**Problem:** In a payment project, our unit-test suite had become slow and unreliable because many tests used a shared database. Small refactoring changes also broke tests that were checking internal method calls instead of business results.

**Decision:** I separated unit tests from integration tests. For unit tests, I focused on one observable business behavior at a time and controlled only genuine external dependencies.

**Implementation:** We used clear Arrange, Act, Assert sections, descriptive names, fixed input data, and no shared mutable state. We tested public outcomes such as approved or declined payments. Database and message-broker behavior moved to a smaller integration-test suite.

**Result:** The unit suite ran in seconds, failures became easier to understand, and developers could refactor safely without changing tests unless business behavior changed.

In an interview, I would summarize it like this: “A good unit test is fast, deterministic, isolated, and readable. It checks one observable behavior, not the private implementation. I mock boundaries such as gateways when necessary, use real domain objects where practical, and keep database or network checks in integration tests.”

## 6. Code example

The following example uses xUnit and plain C# types:

```csharp
public enum AuthorizationStatus
{
    Approved,
    Declined
}

public sealed record AuthorizationResult(
    AuthorizationStatus Status,
    string? Reason = null);

public sealed class WithdrawalAuthorizer
{
    public AuthorizationResult Authorize(decimal balance, decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(amount));

        return amount > balance
            ? new(AuthorizationStatus.Declined, "Insufficient funds")
            : new(AuthorizationStatus.Approved);
    }
}

public sealed class WithdrawalAuthorizerTests
{
    [Fact]
    public void Authorize_WhenAmountExceedsBalance_ReturnsDeclined()
    {
        // Arrange
        var authorizer = new WithdrawalAuthorizer();

        // Act
        var result = authorizer.Authorize(balance: 100m, amount: 150m);

        // Assert
        Assert.Equal(AuthorizationStatus.Declined, result.Status);
        Assert.Equal("Insufficient funds", result.Reason);
    }
}
```

The test uses fixed values, calls one public method, and checks the visible business result. It needs no mock because the class has no external dependency. The test name clearly states the condition and expected outcome. `[Fact]` and `Assert.Equal` are supported in current xUnit releases; this example does not rely on version-specific behavior.

## 7. Common mistakes

- Testing several unrelated behaviors in one test.
- Calling a real database, API, file system, or message broker from a unit test.
- Mocking simple domain objects or every class, which makes tests hard to maintain.
- Testing private methods or exact internal call sequences instead of observable results.
- Using the current time, random values, shared state, or test order without controlling them.
- Giving tests vague names such as `Test1` or `ShouldWork`.
- Writing weak assertions, such as checking only that the result is not null.
- Ignoring failure and boundary cases while testing only the happy path.
- Changing production code and tests together until they pass without checking the intended business rule.

## 8. Follow-up interview questions

### Should every dependency be mocked?

No. Mock external boundaries or dependencies that are slow, unpredictable, or difficult to control. Prefer real value objects and simple domain classes when they make the test clearer.

### What is the difference between a unit test and an integration test?

A unit test checks a small behavior in memory with controlled dependencies. An integration test checks whether real components, such as application code and a database, work together correctly.

### How many assertions should a unit test have?

There is no strict limit. A test can have several assertions when they all describe the same behavior or result. Split the test when the assertions represent different business cases.
