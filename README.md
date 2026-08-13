# Interview Questions and Technical Notes

This repository contains interview questions, detailed technical explanations, practical examples, and software-development notes. It is intended to be a growing knowledge base for interview preparation, revision, and future reference.

The current material focuses primarily on **C#**, **.NET**, **Entity Framework Core**, backend development, performance, security, and production-ready engineering practices.

## Articles and Interview Topics

### [IEnumerable vs IQueryable vs List in C#](<IEnumerable vs IQueryable.md>)

Explains how `IEnumerable<T>`, `IQueryable<T>`, and `List<T>` work behind the scenes, including deferred execution, expression trees, database queries, in-memory processing, and the performance implications of choosing the wrong collection type.

### [Production-Ready AI-Generated Code Review in .NET](<Production-Ready AI-Generated Code Review in .NET.md>)

Uses a banking money-transfer API to demonstrate how AI-generated .NET code should be reviewed before production. It covers authentication, resource-level authorization, account identifiers, CSRF protection, error handling, and other important security and reliability concerns.

## What You Will Find Here

- Common technical interview questions with detailed answers
- C# and .NET concepts explained with practical examples

## Publish Changes to GitHub

Run the publishing script from this repository:

```bash
./publish.sh
```

It performs the following commands automatically:

1. Stages all changes with `git add .`.
2. Finds the latest numbered commit and uses the next number.
3. Creates the commit—for example, `#4`, then `#5`, then `#6`.
4. Pushes the current branch to GitHub.

If the branch does not have an upstream yet, the script sets `origin` automatically. When there are no changes, it exits without creating an empty commit.
