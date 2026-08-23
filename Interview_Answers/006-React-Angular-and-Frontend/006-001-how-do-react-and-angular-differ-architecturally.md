# 1. How do React and Angular differ architecturally?

**Technology:** React, Angular, and Frontend

**Source question:** 1. How do React and Angular differ architecturally?

## 1. What is it?

React and Angular can both build modern web applications, but they have different architectural approaches.

- **React** is mainly a UI library. It provides components, rendering, state hooks, and related UI features. A team usually chooses separate tools for routing, data fetching, forms, and application-wide state.
- **Angular** is a complete application framework. It provides an opinionated structure and built-in features such as routing, dependency injection, forms, HTTP support, and testing utilities.

Both use reusable components. The main difference is that React lets a team assemble its own application stack, while Angular gives the team a more complete and standardized stack.

## 2. Why is it important?

This choice affects more than screen development. It influences project structure, team consistency, testing, upgrades, onboarding, and long-term maintenance.

React is useful when a team needs flexibility, wants to introduce UI gradually, or prefers to select libraries for each requirement. Angular is useful when a large team wants strong conventions and a similar structure across many features.

There is no universal winner. An architect should consider the team's skills, application size, delivery model, governance needs, and expected lifetime of the product.

## 3. How does it work?

### React

A React application is built as a tree of components. A component receives properties and state, then returns a description of the UI, usually written with JSX or TSX. When its data changes, React renders the component again and updates only the required DOM elements.

Data normally flows down from parent components through props. Components send events upward through callback functions. Shared state can use Context, an external store, or server-state tools. Routing, forms, and dependency management depend on the libraries and patterns selected by the team.

Modern React uses function components and Hooks. Frameworks built on React can also add routing, server rendering, and server components, but those features belong to the selected framework rather than React's core architecture.

### Angular

An Angular application is also a component tree, but Angular supplies more of the surrounding architecture. Components use templates, metadata, services, and dependency injection. The Angular router activates components for a URL, services contain shared logic, and the HTTP client communicates with APIs.

Angular supports standalone components, which are the recommended approach for new Angular development. Older applications may organize features with `NgModule`. Angular templates provide binding, directives, and pipes. State changes update the view through Angular's change-detection and reactivity mechanisms, including signals in modern Angular.

In short, React controls the view and allows architectural choices around it. Angular controls both the view and much of the application structure.

## 4. Practical example

Consider an online-banking portal with account balances, payments, beneficiaries, and audit-sensitive workflows.

With React, the team might use React Router for navigation, TanStack Query for API data, React Hook Form for payment forms, and a small store for cross-page client state. This gives the team control, but it must document and enforce these choices.

With Angular, the team can use the built-in router, reactive forms, HTTP client, route guards, interceptors, services, and dependency injection. The common framework conventions can help several banking teams work in a consistent way.

Security is not provided automatically by either choice. The .NET API must still validate authorization, payment limits, account ownership, and every transaction. Frontend guards or hidden buttons improve user experience but are not security boundaries.

## 5. Scenario-based interview answer

**Problem:** We needed to rebuild a payment operations portal used by several development teams. It had complex forms, role-based screens, and a long support lifetime.

**Decision:** I compared React and Angular based on the product and team, not popularity. React offered more flexibility, but every team would need to agree on routing, forms, state, testing, and folder structure. Angular already provided most of those decisions. Because consistency and maintainability were more important than incremental adoption, we selected Angular.

**Implementation:** We used standalone feature components, lazy-loaded routes, reactive forms, typed API clients, dependency-injected services, and HTTP interceptors for correlation IDs and centralized error handling. Authorization remained in the ASP.NET Core API. We also separated business rules from presentation code and established shared UI and testing standards.

**Result:** New features followed the same pattern, onboarding became easier, and teams spent less time choosing libraries. For a smaller product embedded in an existing page, or for a team with a mature React platform, I could make the opposite decision. The architectural fit matters more than declaring one technology better.

## 6. Code example

The same account-balance component shows the architectural difference.

### React function component

```tsx
import { useEffect, useState } from "react";

type Account = { id: string; balance: number };

export function AccountBalance({ accountId }: { accountId: string }) {
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/accounts/${accountId}`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error("Could not load account");
        return response.json() as Promise<Account>;
      })
      .then(setAccount);

    return () => controller.abort();
  }, [accountId]);

  return <p>{account ? `Balance: ${account.balance}` : "Loading..."}</p>;
}
```

React provides the component and Hooks. In a production application, the team may replace direct `fetch` calls with its chosen API or server-state library.

### Angular standalone component and service

```ts
import { Component, inject, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

type Account = { id: string; balance: number };

@Component({
  selector: 'app-account-balance',
  standalone: true,
  template: `<p>Balance: {{ account()?.balance ?? 'Loading...' }}</p>`
})
export class AccountBalanceComponent {
  private readonly http = inject(HttpClient);
  readonly accountId = input.required<string>();

  readonly account = toSignal(
    toObservable(this.accountId).pipe(
      switchMap(id => this.http.get<Account>(`/api/accounts/${id}`))
    )
  );
}
```

Angular supplies dependency injection, its HTTP client, template binding, signals, and RxJS integration as part of the framework ecosystem. In a larger application, the HTTP call would normally be placed in an injected account service to keep the component focused on presentation.

No C# example is needed here because the question is about frontend architecture. The ASP.NET Core API can remain the same whether the client uses React or Angular.

## 7. Common mistakes

- Calling React a complete framework without distinguishing React itself from frameworks built on it.
- Assuming Angular is always suitable for large applications and React only for small ones. Both can support large systems when designed well.
- Selecting a technology only because it is popular or familiar, without considering the team and product lifetime.
- Allowing every React feature team to choose different libraries and patterns, creating an inconsistent codebase.
- Applying heavy Angular-style layers to every small feature, which can add unnecessary complexity.
- Putting business rules or security checks only in the browser instead of enforcing them in the .NET API.
- Storing all state globally. Local UI state, server state, and shared client state have different purposes.
- Ignoring accessibility, performance budgets, dependency upgrades, and automated tests during the architecture decision.

## 8. Follow-up interview questions

### Is React's flexibility an advantage or a disadvantage?

It can be both. It lets a skilled team choose the best tools, but it also requires clear standards so different features do not become inconsistent.

### Does Angular always require `NgModule`?

No. Modern Angular supports and recommends standalone components for new development. `NgModule` remains common in older applications and some libraries.

### Which one works better with ASP.NET Core?

Both work well. ASP.NET Core exposes the same HTTP APIs and authentication flows to either client. The better choice depends mainly on frontend requirements, team experience, and architectural governance.
