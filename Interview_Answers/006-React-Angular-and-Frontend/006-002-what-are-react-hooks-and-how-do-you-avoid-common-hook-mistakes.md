# 2. What are React hooks, and how do you avoid common hook mistakes?

**Technology:** React, Angular, and Frontend

**Source question:** 2. What are React hooks, and how do you avoid common hook mistakes?

## 1. What is it?

React hooks are functions that let function components use React features such as state, context, references, and lifecycle-related logic.

Common built-in hooks include:

- `useState` for local state.
- `useEffect` for synchronizing a component with an external system.
- `useContext` for reading shared context.
- `useRef` for keeping a mutable value or accessing a DOM element.
- `useMemo` and `useCallback` for specific performance optimizations.

Custom hooks are normal JavaScript functions whose names start with `use`. They combine reusable hook-based logic. A custom hook shares logic, not one shared state value; each call gets its own state unless it connects to a shared external store or context.

## 2. Why is it important?

Hooks let developers build React components without class components. Related logic can stay together instead of being split across class lifecycle methods.

In a real application, hooks help teams:

- Reuse behavior such as authentication, API access, and form handling.
- Keep components smaller and easier to test.
- Synchronize the UI with services such as browser APIs, timers, and network connections.
- Reduce duplicate logic across screens.

They are also easy to misuse. Incorrect dependencies, missing cleanup, or unnecessary effects can cause stale data, repeated API calls, memory leaks, and difficult production bugs.

## 3. How does it work?

React stores hook state for each component instance. During rendering, React associates hook calls with their call order. This is why hooks must be called at the top level and in the same order on every render. They must not be called inside conditions, loops, event handlers, or ordinary nested functions.

A typical flow is:

1. React calls the component function to calculate the UI.
2. Hooks return the state, references, or context values for that render.
3. Calling a state setter schedules another render. State should be treated as immutable.
4. After React commits the UI, an effect runs when one of its dependencies has changed.
5. Before that effect runs again, or when the component unmounts, React runs its cleanup function.

Effects should synchronize React with something outside React, such as an API request, event subscription, or timer. Values that can be calculated from props or state should normally be calculated during rendering, not copied into state with an effect.

In React 18 and later development builds, `StrictMode` may intentionally run an extra setup-and-cleanup cycle for effects. This helps expose unsafe effects. Production does not perform that extra development check, but effect code should still be safe to set up and clean up more than once.

## 4. Practical example

Consider a payment operations screen that loads the latest transactions for the selected account.

The component keeps the selected account and transaction data in state. An effect requests transactions whenever the account ID changes. If the user quickly selects another account, the previous request is cancelled during cleanup. This prevents the slower old response from replacing the newer account's data.

The request logic can be placed in a custom hook such as `useTransactions(accountId)`. Several screens can reuse the logic while still receiving separate loading, data, and error state.

## 5. Scenario-based interview answer

**Problem:** In a banking portal, changing accounts quickly sometimes displayed transactions from the previously selected account. We also saw a warning about a state update after navigation.

**Decision:** I treated the request as synchronization with an external system and kept it in `useEffect`. I made the account ID an explicit dependency and added request cancellation in the cleanup function.

**Implementation:** I moved the behavior into a `useTransactions` custom hook. Each effect run created an `AbortController`; cleanup aborted the previous request. I handled loading and errors locally and ignored cancellation errors. I also avoided storing values that could be derived directly from the response.

**Result:** Stale responses no longer replaced current data, navigation stopped leaving unnecessary requests running, and the same tested hook was reused on multiple payment screens.

In an interview, I would summarize it like this: “Hooks let function components use state and lifecycle-related behavior. I follow the Rules of Hooks, use effects only for external synchronization, declare every reactive dependency, and always clean up subscriptions or requests. For asynchronous work, I also protect the UI from race conditions.”

## 6. Code example

Because hooks are a React feature, a JavaScript/TypeScript example is more useful than C# for this question.

```tsx
import { useEffect, useState } from "react";

type Transaction = {
  id: string;
  amount: number;
  status: string;
};

export function useTransactions(accountId: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) {
      setTransactions([]);
      setError(null);
      return;
    }

    const controller = new AbortController();

    async function loadTransactions() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/accounts/${encodeURIComponent(accountId)}/transactions`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data: Transaction[] = await response.json();
        setTransactions(data);
      } catch (exception) {
        if (exception instanceof DOMException && exception.name === "AbortError") {
          return;
        }

        setError("Unable to load transactions.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadTransactions();

    return () => controller.abort();
  }, [accountId]);

  return { transactions, isLoading, error };
}
```

Important points:

- The hook is always called at the top level of a component.
- `accountId` is included because the effect reads it.
- Cleanup cancels an obsolete request and prevents a race condition.
- The hook exposes data, loading, and error state without exposing its internal implementation.

## 7. Common mistakes

- **Calling hooks conditionally:** This changes hook order between renders. Call hooks at the top level and put the condition inside the hook when needed.
- **Leaving dependencies out of `useEffect`:** This creates stale closures. Include every reactive value used by the effect, and use the React Hooks ESLint rules.
- **Disabling dependency lint warnings:** This often hides a design problem instead of fixing it. Restructure the effect or stabilize a value only when necessary.
- **Using effects for derived values:** Do not store `fullName` in state when it can be calculated from `firstName` and `lastName` during rendering.
- **Missing cleanup:** Remove event listeners, clear timers, unsubscribe, and cancel obsolete requests.
- **Updating state by reading an old value:** When new state depends on previous state, use the functional form, such as `setCount(current => current + 1)`.
- **Mutating state directly:** Create a new object or array so React can correctly process the update.
- **Overusing `useMemo` and `useCallback`:** They add complexity and do not automatically improve performance. Use them for a measured reason or when stable identity is required.
- **Making the effect callback itself `async`:** An effect must return either nothing or a cleanup function, not a promise. Define and call an inner async function.
- **Assuming an effect runs only once:** Remounting and React development checks can run setup again. Write effects with complete cleanup and safe repeat behavior.

## 8. Follow-up interview questions

### What are the Rules of Hooks?

Call hooks only at the top level of React function components or custom hooks. Do not call them inside loops, conditions, event handlers, or ordinary functions. This keeps hook order consistent.

### When should you use `useEffect`?

Use it to synchronize with an external system, such as a network request, browser API, subscription, or timer. Do not use it just to calculate a value that can be calculated during rendering or to handle a user action that belongs in an event handler.

### What is a stale closure?

It happens when a callback uses props or state captured by an older render. Correct dependencies, functional state updates, or a suitable ref can solve it, depending on whether the callback needs the latest rendered value or a mutable value.
