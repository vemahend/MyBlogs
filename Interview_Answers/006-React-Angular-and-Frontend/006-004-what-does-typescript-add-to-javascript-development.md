# 4. What does TypeScript add to JavaScript development?

**Technology:** React, Angular, and Frontend

**Source question:** 4. What does TypeScript add to JavaScript development?

## 1. What is it?

TypeScript is JavaScript with an optional, static type system. It lets developers describe the expected shape of variables, function parameters, return values, objects, and API responses.

Browsers do not normally run TypeScript directly. The TypeScript compiler checks the code and converts it into JavaScript. The types are removed during this process, so TypeScript improves development-time safety but does not provide runtime validation by itself.

## 2. Why is it important?

JavaScript allows a value to change type and often reports mistakes only when the affected code runs. In a large React or Angular application, this can make refactoring risky and allow incorrect API data or function calls to reach production.

TypeScript helps by providing:

- Compile-time checks for incorrect values and function calls.
- Better editor autocomplete, navigation, and documentation.
- Safer refactoring across a large codebase.
- Clear contracts between UI components, services, and backend APIs.
- Features such as interfaces, type aliases, generics, unions, and type narrowing.

For a senior full-stack developer, these contracts are especially useful when a .NET API and several frontend teams share the same business models.

## 3. How does it work?

The developer adds type information to normal JavaScript syntax. The TypeScript compiler then:

1. Reads the source code and its type declarations.
2. Infers types where they are obvious and checks explicit types where they are needed.
3. Reports errors when values do not match the expected contract.
4. Emits JavaScript according to the project configuration.
5. Removes TypeScript-only information because JavaScript runtimes do not use those types.

For example, if a function accepts a `PaymentRequest`, the compiler can reject a call that omits the amount. However, data received from an HTTP endpoint is still runtime data. It must be validated before the application trusts it.

Enabling `strict` mode in `tsconfig.json` gives stronger checks, including better handling of `null`, `undefined`, and function parameters.

## 4. Practical example

Consider an Angular payment screen calling an ASP.NET Core API. The frontend defines a `PaymentRequest` containing the account ID, amount, currency, and idempotency key.

If a developer accidentally sends the amount as text or forgets the idempotency key, TypeScript reports the problem during development. The same model can also type component inputs, service methods, and application state.

This reduces integration mistakes, but the payment API must still validate every request. A caller can bypass the frontend, and the deployed API response may differ from the TypeScript definition.

## 5. Scenario-based interview answer

“In one payment application, the frontend had grown across several teams and relied on loosely shaped JavaScript objects. Changes to the ASP.NET Core API caused defects because property names and nullable fields were handled differently in different screens.

I decided to introduce TypeScript in stages and enable strict checking for new and migrated modules. We defined types for payment requests, responses, component properties, and state. We generated API client types from the OpenAPI contract where practical, and we validated untrusted responses at runtime instead of using unsafe type assertions.

As a result, many integration errors moved from production to the build process. Refactoring became safer, editor support improved, and developers could understand the data contracts without tracing values through the entire application. I would still describe TypeScript as development-time protection, not a replacement for API validation or automated tests.”

## 6. Code example

```typescript
type Currency = "NZD" | "AUD" | "USD";

interface PaymentRequest {
  accountId: string;
  amount: number;
  currency: Currency;
  idempotencyKey: string;
}

interface PaymentResult {
  paymentId: string;
  status: "approved" | "declined";
}

async function submitPayment(
  request: PaymentRequest,
): Promise<PaymentResult> {
  const response = await fetch("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Payment request failed: ${response.status}`);
  }

  // In production, validate this untrusted JSON before returning it.
  return (await response.json()) as PaymentResult;
}

const payment = {
  accountId: "ACC-1042",
  amount: 125.5,
  currency: "NZD",
  idempotencyKey: crypto.randomUUID(),
} satisfies PaymentRequest;

await submitPayment(payment);
```

`PaymentRequest` defines the input contract, while the union types restrict currency and status to known values. `Promise<PaymentResult>` documents the asynchronous result. The `satisfies` operator checks the object against the contract without unnecessarily changing its inferred type.

The assertion after `response.json()` only tells the compiler what to assume; it does not validate the response. A production application should use a runtime schema validator or a custom type guard for external data.

## 7. Common mistakes

- Using `any` widely, which disables most of TypeScript’s protection.
- Assuming a type assertion such as `as PaymentResult` validates runtime data.
- Keeping strict compiler checks disabled to avoid fixing type problems.
- Duplicating backend contracts manually and allowing the copies to drift.
- Making every property optional instead of modelling required and nullable data correctly.
- Ignoring TypeScript errors in the build pipeline.
- Creating overly complex generic types that make the code harder to understand.
- Treating TypeScript as a replacement for runtime validation, tests, or server-side security.

## 8. Follow-up interview questions

### Does TypeScript run in the browser?

Usually, no. A compiler or build tool converts TypeScript to JavaScript, and the browser runs the resulting JavaScript.

### What is the difference between `any` and `unknown`?

`any` allows almost any operation and turns off type safety. `unknown` accepts any value but requires the developer to check or narrow its type before using it, so it is safer for untrusted data.

### Does TypeScript validate API responses at runtime?

No. TypeScript types are removed during compilation. Runtime data must be checked with application logic, a schema-validation library, or generated validators.
