# 28. How do you ensure developers follow architecture standards?

**Technology:** Architecture and Design

**Source question:** 28. How do you ensure developers follow architecture standards?

## 1. What is it?

Ensuring developers follow architecture standards means making the agreed design rules part of everyday development.

Standards may cover dependency direction, service boundaries, API design, security, logging, error handling, data ownership, and communication between systems. The aim is not to control every coding choice. It is to protect the important rules while still allowing developers to make local decisions.

The best approach combines clear guidance, team agreement, automated checks, code reviews, and regular feedback. A document alone is rarely enough.

## 2. Why is it important?

Without shared standards, each team may solve the same problem differently. Over time, the system becomes harder to understand, test, secure, and change. For example, controllers may contain business logic, services may access another service's database, or sensitive data may be written to logs.

Architecture standards help teams:

- Keep the codebase consistent and maintainable.
- Protect service and layer boundaries.
- Reduce security, reliability, and operational risks.
- Make onboarding and code reviews easier.
- Avoid repeated design discussions.
- Allow teams to deliver independently without damaging the wider system.

Standards are especially useful in large systems where several teams contribute to the same platform.

## 3. How does it work?

I normally use several controls together:

1. **Define a small set of important rules.** Record the principles, examples, and reasons in a short architecture guide or ADRs.
2. **Involve developers.** Discuss standards in design sessions so the team understands the trade-offs and can challenge rules that do not fit reality.
3. **Provide a paved road.** Supply project templates, shared libraries, reference implementations, and reusable CI pipelines for common requirements.
4. **Automate what can be automated.** Use compiler rules, analyzers, architecture tests, dependency checks, security scanning, and CI quality gates.
5. **Review what requires judgment.** Pull-request reviews and lightweight design reviews check areas that tools cannot understand, such as service ownership or an unsuitable business workflow.
6. **Measure and improve.** Track exceptions, production issues, and repeated review comments. Update a standard when it no longer gives enough value.

An exception process is also important. A developer should be able to propose a justified exception, document its risks, identify an owner, and set a review or expiry date. This prevents standards from becoming rigid rules that block sensible delivery.

## 4. Practical example

In a banking platform, the team agrees that each service owns its data and that external services can access account information only through the Accounts API or published events.

The standard is applied in several ways:

- An ADR explains why direct database access is not allowed.
- A service template provides authentication, structured logging, health checks, and standard error responses.
- Architecture tests stop the Domain project from referencing Entity Framework or ASP.NET Core.
- Repository permissions prevent other services from using the Accounts database credentials.
- Pull-request reviewers check changes to contracts and service boundaries.
- CI blocks a merge if architecture tests, security scans, or required reviews fail.

This makes the safe approach the easiest approach and prevents accidental coupling between banking services.

## 5. Scenario-based interview answer

**Problem:** On a payment platform, multiple teams were building APIs differently. Some controllers contained business logic, error responses were inconsistent, and one service had started reading another service's database. The standards existed in a wiki, but developers often found them too late.

**Decision:** I focused on a small set of rules that protected the main risks: dependency direction, data ownership, authentication, observability, and API compatibility. I agreed on those rules with the teams rather than treating architecture as a one-time approval exercise.

**Implementation:** We created a reference .NET service template, documented significant decisions as ADRs, and added architecture tests and analyzers to the build. CI blocked direct dependency violations and required contract and security checks. Pull requests used a short checklist for concerns that could not be automated. For unusual cases, teams could request a time-bound exception with the reason, risk, owner, and follow-up action. I also held short architecture clinics to resolve questions early.

**Result:** New services became more consistent, boundary violations were found before merge, and review discussions focused on business trade-offs instead of repeated formatting and structure issues. The exception process also showed us which standards needed better tooling or clarification.

## 6. Code example

Architecture tests can enforce important dependency rules in the normal test pipeline. The following example uses `NetArchTest.Rules` in a test project:

```csharp
using NetArchTest.Rules;
using Xunit;

public sealed class ArchitectureTests
{
    private static readonly System.Reflection.Assembly DomainAssembly =
        typeof(Banking.Domain.Account).Assembly;

    [Fact]
    public void Domain_must_not_depend_on_infrastructure_or_web_frameworks()
    {
        string[] forbiddenDependencies =
        [
            "Banking.Infrastructure",
            "Microsoft.EntityFrameworkCore",
            "Microsoft.AspNetCore"
        ];

        var result = Types.InAssembly(DomainAssembly)
            .ShouldNot()
            .HaveDependencyOnAny(forbiddenDependencies)
            .GetResult();

        Assert.True(
            result.IsSuccessful,
            $"Invalid domain dependencies: {string.Join(", ", result.FailingTypeNames ?? [])}");
    }
}
```

The test scans types in the Domain assembly and fails if they depend on infrastructure, Entity Framework Core, or ASP.NET Core. Running it in CI turns a written Clean Architecture rule into a merge-time check. The team should pin and maintain the `NetArchTest.Rules` package version in the test project, just like any other dependency.

This test covers only a rule that static analysis can verify. It does not replace design discussion, code review, runtime security controls, or integration testing.

## 7. Common mistakes

- Publishing a large standards document and expecting everyone to remember it.
- Creating too many rules, including personal coding preferences with no clear benefit.
- Enforcing rules without explaining the problem or trade-off behind them.
- Relying only on manual code reviews for checks that can be automated.
- Making the approved approach difficult while leaving unsafe shortcuts easy.
- Allowing senior developers or urgent projects to bypass the same controls without recording the risk.
- Having no exception process, which encourages teams to hide necessary deviations.
- Blocking every pull request for minor issues and slowing delivery unnecessarily.
- Letting templates, analyzers, or examples become outdated.
- Measuring compliance only, instead of checking whether standards reduce defects, security risks, and delivery friction.

## 8. Follow-up interview questions

### Which architecture rules should be automated?

Automate rules that are objective and repeatable, such as project dependencies, naming policies, forbidden packages, test execution, security scanning, and API compatibility. Keep human review for decisions that require business context or trade-offs.

### What do you do when a team needs to break a standard?

I ask for the reason, alternatives, risks, and impact. If the exception is justified, I record an owner and a review or expiry date. If the same exception appears repeatedly, I review whether the standard or the paved road needs to change.

### How do you avoid becoming an architecture bottleneck?

I make common decisions self-service through templates, examples, automated checks, and clear decision boundaries. Architects then spend time on high-impact or hard-to-reverse decisions, while teams own routine implementation choices.
