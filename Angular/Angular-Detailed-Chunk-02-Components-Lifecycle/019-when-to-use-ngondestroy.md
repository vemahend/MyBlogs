# When Do You Use ngOnDestroy?

## 1. What problem does it solve?

A destroyed view can remain retained by subscriptions, timers, listeners, sockets, observers, or third-party widgets. It may continue executing and updating stale state, causing leaks and duplicate work.

---

## 2. Explain it in simple language

Use ngOnDestroy—or DestroyRef-based cleanup—to release resources whose lifetime should end with the component. Many Angular/RxJS integrations automate this, so clean up what you own rather than unsubscribing blindly.

### Memory rule

> **If you start it, ask who stops it.**

### Interview-ready answer

> Use ngOnDestroy—or DestroyRef-based cleanup—to release resources whose lifetime should end with the component. Many Angular/RxJS integrations automate this, so clean up what you own rather than unsubscribing blindly. In a production Angular application I would apply it by identifying the state owner and lifetime first, keeping the component contract typed and explicit, and delegating authoritative payment and security rules to the ASP.NET Core API.

---

## 3. How does it work internally?

1. Router/control flow removes view.
2. Angular invokes destroy callbacks.
3. takeUntilDestroyed completes bound subscriptions.
4. Manual disposers remove external resources.
5. References can then become collectible.

### Practical interpretation

Async pipe, toSignal, output interop, and takeUntilDestroyed cover many Angular-owned subscriptions. Manual cleanup remains essential for browser/global APIs and third-party libraries. OnDestroy is not reliable for a must-succeed network save during browser shutdown.

### Incorrect versus improved approach

```typescript
window.addEventListener('resize',()=>this.resize());
// Cannot remove a different anonymous function later.
```

### What happens at runtime

1. Angular creates the relevant component and resolves dependencies from the nearest injector.
2. Inputs, route values, or reactive state provide the current screen data.
3. The component executes only its owned presentation or orchestration responsibility.
4. Signals, Observable emissions, input changes, or events cause the affected view to synchronize.
5. When the component is removed, view-owned resources must stop so an old screen cannot keep reacting.

The important point is not merely when Angular calls a method. It is whether the code is running under the correct **owner and lifetime**. Code placed in the wrong component or lifecycle stage can appear correct on first load but fail after input changes, navigation, refresh, rapid actions, or destruction.

---

## 4. Realistic payment or banking example

Live balance page opens WebSocket, window listener, timer, and chart. Leaving page must close/dispose each. A finite HttpClient request normally completes, though stale reads may still need cancellation semantics.

### Full-stack responsibility split

| Angular responsibility | ASP.NET Core responsibility |
|---|---|
| Render the current view state | Return only data the user may access |
| Capture and validate user input for usability | Repeat authoritative validation |
| Prevent accidental repeated clicks | Enforce idempotency and concurrency |
| Display 401, 403, 404, 409, and transient failures | Produce correct status codes and safe problem details |
| Cancel stale reads and clean view resources | Honour cancellation where possible and protect server capacity |

A user can bypass the Angular component and call the endpoint directly. Therefore component design can improve safety and clarity, but it cannot replace backend authorization or financial invariants.

---

## 5. Successful flow and failure flow

### Successful flow

1. Resources created with clear owner.
2. DestroyRef binds stream lifetime.
3. Widget disposer retained.
4. Navigation destroys page.
5. Subscriber/listener counts return to baseline.

### Failure flow

1. Anonymous window listener cannot be removed.
2. Socket reconnect timer continues.
3. Root service holds component callback.
4. Each visit duplicates updates.
5. Heap and network grow.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
export class LiveBalance {
 private readonly destroyRef=inject(DestroyRef);
 private readonly onResize=()=>this.chart.resize();
 ngOnInit(){
  window.addEventListener('resize',this.onResize);
  this.socket.messages$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
 }
 ngOnDestroy(){window.removeEventListener('resize',this.onResize);this.chart.dispose()}
}
```

### ASP.NET Core boundary

```csharp
public async IAsyncEnumerable<BalanceUpdate> Stream([EnumeratorCancellation]CancellationToken ct)
{
 await foreach(var item in balances.ReadAllAsync(ct))yield return item;
}
// Client disconnect cancellation should stop cooperative server streaming.
```

### How to test this practically

Create/destroy fixture repeatedly. Assert fake socket unsubscribe, listener removal, timer clear, and widget dispose. Use heap/retaining-path evidence in production investigation rather than assuming every subscription is the leak.

### Production verification

- Repeat the interaction after browser refresh and direct URL navigation.
- Trigger rapid clicks and deliberately delayed responses.
- Navigate away while work is in progress and check for stale updates.
- Exercise unauthorized, forbidden, missing, concurrency-conflict, and server-error responses.
- Confirm logs contain a correlation identifier but no account secrets or payment credentials.
- Use Angular DevTools, browser Network/Performance panels, and heap snapshots when timing or cleanup is involved.

---

## 7. Important design decisions

- Tie lifetime to correct scope.
- Prefer automated teardown.
- Keep named disposer callbacks.
- Do not perform guaranteed save on destroy.
- Check root services retaining views.

For a senior-level answer, explain the trade-off rather than only naming the API. State why this component or hook owns the work, what alternative you rejected, and how your choice behaves during failure and cleanup.

---

## 8. When to use and when not to use it

### Use it when

- Long-lived streams, timers, listeners, observers, sockets, widgets.

### Avoid or reconsider it when

- Noisy manual cleanup for finite/automatically managed resources.

---

## 9. Compare it with related concepts

| Concept | Responsibility |
|---|---|
| ngOnDestroy | Lifecycle callback |
| DestroyRef | Colocated callbacks |
| takeUntilDestroyed | RxJS teardown |
| async pipe/toSignal | Managed subscription |

---

## 10. Common production mistakes

- Timer/listener leak.
- Shared destroy Subject misuse.
- Root service retains component.
- Manual save during unload.
- Unsubscribing wrong lifetime.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

After ten visits to a balance page, ten WebSocket subscriptions and resize handlers remain. How would you identify retaining paths, fix ownership, and regression-test cleanup?

---

## Quick revision card

- **Definition:** Use ngOnDestroy—or DestroyRef-based cleanup—to release resources whose lifetime should end with the component. Many Angular/RxJS integrations automate this, so clean up what you own rather than unsubscribing blindly.
- **Memory rule:** If you start it, ask who stops it.
- **Design check:** owner, direction, lifetime, failure path, and API authority.
- **Production check:** refresh, rapid action, stale result, navigation cleanup, API rejection, and telemetry.
