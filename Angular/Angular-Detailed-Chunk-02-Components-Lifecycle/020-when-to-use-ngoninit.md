# When Do You Use ngOnInit?

## 1. What problem does it solve?

A component sometimes requires one-time setup after Angular has assigned initial inputs. Doing it earlier reads missing values; doing it in frequently called hooks repeats work.

---

## 2. Explain it in simple language

Use ngOnInit for once-per-component-instance initialization that depends on Angular-bound values. Do not use it for every reaction to changing inputs or route parameters.

### Memory rule

> **OnInit means once per instance—not once per URL forever.**

### Interview-ready answer

> Use ngOnInit for once-per-component-instance initialization that depends on Angular-bound values. Do not use it for every reaction to changing inputs or route parameters. In a production Angular application I would apply it by identifying the state owner and lifetime first, keeping the component contract typed and explicit, and delegating authoritative payment and security rules to the ASP.NET Core API.

---

## 3. How does it work internally?

1. Instance constructed.
2. Initial inputs assigned.
3. Initial ngOnChanges occurs when applicable.
4. ngOnInit runs once.
5. View later initializes and component may remain reused.

### Practical interpretation

Modern Angular often lets reactive declarations replace imperative OnInit. Use the hook when it improves clarity, but do not force every component to implement it. Derived values belong in computed state; changing inputs belong in an input reaction.

### Incorrect versus improved approach

```typescript
ngOnInit(){this.api.get(this.route.snapshot.paramMap.get('id')!).subscribe()}
// Snapshot becomes stale if component is reused.
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

A payment page can initialize facade state in OnInit. If payment ID comes from a route that changes while the same page instance is reused, subscribe/react to paramMap with switchMap rather than expecting OnInit again.

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

1. Initial ID available.
2. OnInit starts one load.
3. Loading/ready/error state modeled.
4. Parameter stream cancels stale read if ID changes.
5. Destroy ends subscription.

### Failure flow

1. Snapshot read only in OnInit.
2. User navigates from payment 1 to 2 on same component.
3. OnInit does not rerun.
4. Screen still shows payment 1.
5. Use reactive parameter input.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
export class PaymentPage {
 private readonly route=inject(ActivatedRoute);
 readonly payment=toSignal(this.route.paramMap.pipe(
   map(p=>p.get('id')!),
   distinctUntilChanged(),
   switchMap(id=>this.api.get(id))
 ),{initialValue:null});
}
// OnInit is optional because the reactive field expresses the lifecycle.
```

### ASP.NET Core boundary

```csharp
[Authorize]
[HttpGet("{id:guid}")]
public async Task<IActionResult> Get(Guid id,CancellationToken ct)
{
 var value=await queries.GetAsync(id,User,ct);
 return value is null?NotFound():Ok(value);
}
```

### How to test this practically

Test initial load once, then navigate/change parameter without recreating fixture and assert latest result wins. Add an out-of-order response case to prove switchMap or equivalent prevents stale overwrite.

### Production verification

- Repeat the interaction after browser refresh and direct URL navigation.
- Trigger rapid clicks and deliberately delayed responses.
- Navigate away while work is in progress and check for stale updates.
- Exercise unauthorized, forbidden, missing, concurrency-conflict, and server-error responses.
- Confirm logs contain a correlation identifier but no account secrets or payment credentials.
- Use Angular DevTools, browser Network/Performance panels, and heap snapshots when timing or cleanup is involved.

---

## 7. Important design decisions

- Once-per-instance only.
- React to route/input changes.
- Prefer declarative streams/signals.
- Cancel stale reads.
- Model all page states.

For a senior-level answer, explain the trade-off rather than only naming the API. State why this component or hook owns the work, what alternative you rejected, and how your choice behaves during failure and cleanup.

---

## 8. When to use and when not to use it

### Use it when

- One-time setup after initial inputs.

### Avoid or reconsider it when

- Repeated reactions, DOM work, cleanup, or mandatory hook ceremony.

---

## 9. Compare it with related concepts

| Concept | Responsibility |
|---|---|
| ngOnInit | Once after initial inputs |
| ngOnChanges/input effect | Input changes |
| ngAfterViewInit | View/DOM available |
| reactive field | Declarative ongoing reaction |

---

## 10. Common production mistakes

- Assuming rerun on route change.
- Nested subscriptions.
- No error/loading state.
- Duplicate constructor load.
- Stale response wins.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

Payment 1 loads slowly; user navigates to Payment 2 using the same component; Payment 1 response arrives last and overwrites the screen. Redesign initialization and cancellation.

---

## Quick revision card

- **Definition:** Use ngOnInit for once-per-component-instance initialization that depends on Angular-bound values. Do not use it for every reaction to changing inputs or route parameters.
- **Memory rule:** OnInit means once per instance—not once per URL forever.
- **Design check:** owner, direction, lifetime, failure path, and API authority.
- **Production check:** refresh, rapid action, stale result, navigation cleanup, API rejection, and telemetry.
