# What Are Angular Lifecycle Hooks?

## 1. What problem does it solve?

Some work is valid only after inputs exist, after the view exists, on input changes, or just before destruction. Lifecycle hooks provide defined points instead of timing guesses and setTimeout patches.

---

## 2. Explain it in simple language

Lifecycle hooks are callbacks Angular invokes while creating, checking, rendering, and destroying a component. Use them only when work truly depends on that stage; declarative bindings and reactive state are usually simpler.

### Memory rule

> **Construct → receive inputs → initialize → render/check → destroy.**

### Interview-ready answer

> Lifecycle hooks are callbacks Angular invokes while creating, checking, rendering, and destroying a component. Use them only when work truly depends on that stage; declarative bindings and reactive state are usually simpler. In a production Angular application I would apply it by identifying the state owner and lifetime first, keeping the component contract typed and explicit, and delegating authoritative payment and security rules to the ASP.NET Core API.

---

## 3. How does it work internally?

1. Constructor creates class and resolves DI.
2. Initial input changes are processed.
3. ngOnInit runs once for instance setup.
4. Content/view initialization hooks run when those areas exist.
5. ngOnDestroy/DestroyRef cleanup runs before instance is removed.

### Practical interpretation

Checked hooks run frequently and are rarely the right place for state changes. View hooks are for work that truly requires rendered children/DOM. DestroyRef can colocate setup and cleanup and takeUntilDestroyed handles many subscriptions.

### Incorrect versus improved approach

```typescript
ngAfterViewChecked(){this.total=this.calculateExpensiveTotal();}
// Prefer a computed value with explicit dependencies.
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

A payment page reacts to route ID, initializes screen state, attaches a third-party chart after its host exists, and closes chart/socket resources when leaving. Normal template values do not require lifecycle hooks.

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

1. Component created and dependencies resolved.
2. Inputs assigned.
3. Initialization starts required state stream.
4. View renders and optional widget attaches.
5. Navigation destroys component and cleanup runs.

### Failure flow

1. API loads in constructor and ngOnInit.
2. Checked hook changes state every pass.
3. setTimeout hides expression-change error.
4. Socket remains after navigation.
5. Correct ownership/reactive lifecycle fixes it.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
export class PaymentPage implements OnInit,AfterViewInit,OnDestroy {
 private readonly destroyRef=inject(DestroyRef);
 ngOnInit(){this.route.paramMap.pipe(switchMap(p=>this.api.get(p.get('id')!)),takeUntilDestroyed(this.destroyRef)).subscribe()}
 ngAfterViewInit(){this.chart.attach(this.host.nativeElement)}
 ngOnDestroy(){this.chart.dispose()}
}
```

### ASP.NET Core boundary

```csharp
[HttpGet("{id:guid}")]
public Task<PaymentDto> Get(Guid id,CancellationToken ct)
 => queries.GetAsync(id,User,ct);
// Browser lifecycle cancellation is forwarded where possible through HTTP cancellation.
```

### How to test this practically

Create fixture, set inputs, synchronize, and assert initialization occurs once. Change input to verify repeated behaviour is in the right mechanism. Destroy fixture and verify teardown/disposal.

### Production verification

- Repeat the interaction after browser refresh and direct URL navigation.
- Trigger rapid clicks and deliberately delayed responses.
- Navigate away while work is in progress and check for stale updates.
- Exercise unauthorized, forbidden, missing, concurrency-conflict, and server-error responses.
- Confirm logs contain a correlation identifier but no account secrets or payment credentials.
- Use Angular DevTools, browser Network/Performance panels, and heap snapshots when timing or cleanup is involved.

---

## 7. Important design decisions

- Prefer declarative state.
- Do not duplicate initialization.
- Avoid checked hooks for ordinary calculations.
- Tie resources to destroy scope.
- Consider SSR/browser-only APIs.

For a senior-level answer, explain the trade-off rather than only naming the API. State why this component or hook owns the work, what alternative you rejected, and how your choice behaves during failure and cleanup.

---

## 8. When to use and when not to use it

### Use it when

- Stage-dependent setup, input changes, DOM integration, cleanup.

### Avoid or reconsider it when

- Ordinary derived state or arbitrary timing fixes.

---

## 9. Compare it with related concepts

| Concept | Responsibility |
|---|---|
| constructor | Class/DI creation |
| ngOnInit | Once after initial inputs |
| ngAfterViewInit | View queries/DOM ready |
| ngOnDestroy | Cleanup |

---

## 10. Common production mistakes

- Reading inputs in constructor.
- State mutation in checked hook.
- No cleanup.
- Assuming OnInit reruns on route parameter.
- setTimeout patches.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

A component loads data twice, throws ExpressionChanged errors, and leaks a chart after navigation. Map each defect to the correct lifecycle or reactive design.

---

## Quick revision card

- **Definition:** Lifecycle hooks are callbacks Angular invokes while creating, checking, rendering, and destroying a component. Use them only when work truly depends on that stage; declarative bindings and reactive state are usually simpler.
- **Memory rule:** Construct → receive inputs → initialize → render/check → destroy.
- **Design check:** owner, direction, lifetime, failure path, and API authority.
- **Production check:** refresh, rapid action, stale result, navigation cleanup, API rejection, and telemetry.
