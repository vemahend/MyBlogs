# 3. How do you manage API loading, error, and empty states in React?

**Technology:** React, Angular, and Frontend

**Source question:** 3. How do you manage API loading, error, and empty states in React?

## 1. What is it?

When a React component loads data from an API, the request does not finish immediately. The UI must clearly represent each possible state:

- **Loading:** The request is still running.
- **Success with data:** The request succeeded and returned records.
- **Empty:** The request succeeded but returned no records.
- **Error:** The request failed or returned an invalid response.

These states should be handled explicitly instead of allowing the screen to appear blank or show old data.

## 2. Why is it important?

Users need to understand what the application is doing. A loading indicator tells them to wait, an error message explains that something failed, and an empty-state message confirms that the request worked but no matching data exists.

Clear state handling also prevents common problems such as rendering `undefined`, showing “no data” before the request finishes, or keeping a spinner on the screen forever. In production systems, it makes retry behavior, logging, accessibility, and support much easier.

## 3. How does it work?

A component usually follows this flow:

1. Start the request and move the UI to the loading state.
2. Clear any error left by an earlier request.
3. Call the API.
4. Check the HTTP response. `fetch` does not reject automatically for HTTP errors such as 404 or 500, so the code must check `response.ok`.
5. If the request succeeds, store the returned data.
6. If the returned list has no items, render the empty state; otherwise, render the data.
7. If the request fails, store a safe error message and offer a retry when appropriate.
8. Cancel or ignore an outdated request when the component unmounts or its input changes.

For a small component, separate `isLoading`, `error`, and `data` values are enough. For more complex screens, a reducer, a request-state union, or a library such as TanStack Query can prevent invalid combinations and provide caching and retry support.

## 4. Practical example

Consider a banking screen that displays a customer's recent transactions.

While the request is running, the screen shows a labelled loading indicator. If transactions are returned, it displays them in a table. If the account is new and the API returns an empty array, it shows “No transactions yet” rather than an error. If the service is unavailable, it shows a friendly message and a Retry button.

The UI must not describe a failed request as an empty account. That distinction is especially important in banking because a misleading blank balance or transaction list can reduce customer trust.

## 5. Scenario-based interview answer

“In one payment portal, the transaction history page sometimes showed a blank table while the API was slow or unavailable. Users could not tell whether they had no transactions or whether the request had failed.

I decided to model loading, success, empty, and error as separate UI outcomes. When the request started, we displayed an accessible loading message. We checked the HTTP status before parsing the response, treated a successful empty array as an empty state, and displayed a retry action only for failures that could be retried. We also cancelled stale requests when the account or filter changed so an older response could not replace newer data.

As a result, the screen became predictable, support calls about missing transactions reduced, and the component was easier to test because every API outcome had a clear expected view.”

## 6. Code example

This React example uses APIs supported in modern browsers and works with React 18 and React 19:

```tsx
import { useCallback, useEffect, useState } from "react";

type Transaction = {
  id: string;
  description: string;
  amount: number;
};

type Props = {
  accountId: string;
};

export function TransactionList({ accountId }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  const retry = useCallback(() => {
    setRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
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
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }

        setTransactions([]);
        setError("We could not load the transactions. Please try again.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadTransactions();
    return () => controller.abort();
  }, [accountId, requestVersion]);

  if (isLoading) {
    return <p role="status">Loading transactions...</p>;
  }

  if (error) {
    return (
      <div role="alert">
        <p>{error}</p>
        <button type="button" onClick={retry}>Retry</button>
      </div>
    );
  }

  if (transactions.length === 0) {
    return <p>No transactions yet.</p>;
  }

  return (
    <ul>
      {transactions.map((transaction) => (
        <li key={transaction.id}>
          {transaction.description}: {transaction.amount.toFixed(2)}
        </li>
      ))}
    </ul>
  );
}
```

The `AbortController` cancels an obsolete request when the component unmounts or `accountId` changes. The render order is important: loading and error are checked before testing whether the array is empty. The user-facing error is intentionally safe and simple; detailed technical information should be sent to application monitoring rather than displayed on the page.

In React development mode with `StrictMode`, React may run an Effect setup and cleanup an extra time to detect missing cleanup logic. The abort cleanup makes this code safe for that behavior.

## 7. Common mistakes

- Showing the empty state while the initial request is still loading.
- Treating an API failure as an empty result.
- Assuming `fetch` throws for HTTP 4xx and 5xx responses without checking `response.ok`.
- Leaving an old error visible when a retry starts.
- Allowing an older response to overwrite data for a newer account or filter.
- Displaying raw server errors, stack traces, or sensitive information to users.
- Retrying every failure automatically, including validation errors or authorization failures.
- Using only a visual spinner without accessible status text.
- Forgetting to test loading, success, empty, error, retry, and request-cancellation paths.

## 8. Follow-up interview questions

### Would you always manage these states with `useState` and `useEffect`?

No. They are suitable for a small, local request. For server data shared across screens, I would consider TanStack Query or a similar library for caching, deduplication, retries, and background refresh.

### How do you avoid race conditions when filters change quickly?

Cancel the previous request with `AbortController`, or track a request identifier and ignore responses that are no longer current.

### Should the UI clear existing data during a background refresh?

Usually not. I keep the existing data visible and show a smaller refreshing indicator. I use a full loading state mainly when there is no usable data yet.
