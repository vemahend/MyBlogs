# Constructor vs ngOnInit in Angular

## 1. What problem does it solve?

Developers often put initialization in whichever method they remember, causing input values to be unavailable, side effects during construction, duplicate requests, and difficult tests.

---

## 2. Explain it in simple language

The constructor is standard class creation and dependency injection. `ngOnInit` is Angular lifecycle initialization after initial inputs have been assigned.

### Memory rule

> **Constructor: what I need. OnInit: what I do once Angular has set me up.**

### Interview-ready answer

> The constructor is standard class creation and dependency injection. `ngOnInit` is Angular lifecycle initialization after initial inputs have been assigned. In a production Angular application I would apply it by identifying the state owner and lifetime first, keeping the component contract typed and explicit, and delegating authoritative payment and security rules to the ASP.NET Core API.

---

## 3. How does it work internally?

1. JavaScript creates instance and runs field initializers/constructor.
2. Angular resolves constructor/inject dependencies.
3. Angular binds initial inputs.
4. Angular processes initial input changes.
5. Angular calls ngOnInit once.

### Practical interpretation

Field initializers can use inject in an injection context. The key distinction is not old constructor syntax versus new inject; it is construction versus Angular-bound initialization. If input can change while instance is reused, OnInit once is insufficient.

### Incorrect versus improved approach

```typescript
constructor(private api:PaymentApi){this.api.get(this.paymentId!).subscribe()}
// paymentId has not been bound yet.
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

PaymentDetail receives paymentId input. It can inject PaymentFacade during construction, but loading by paymentId must wait until the input is set—or better react to route/input changes if ID can change.

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

1. Constructor establishes dependencies.
2. Angular assigns ID.
3. OnInit starts initial load.
4. State renders.
5. Cleanup tied to destroy.

### Failure flow

1. Constructor reads undefined paymentId.
2. It calls API with invalid ID.
3. OnInit calls again.
4. Two requests race.
5. Move/restructure initialization.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
export class PaymentDetail implements OnInit {
 readonly paymentId=input.required<string>();
 private readonly facade=inject(PaymentFacade);
 ngOnInit(){this.facade.load(this.paymentId())}
}
```

### ASP.NET Core boundary

```csharp
[HttpGet("{id:guid}")]
public async Task<IActionResult> Get(Guid id,CancellationToken ct)
 => Ok(await queries.GetAsync(id,User,ct));
```

### How to test this practically

Instantiate through TestBed, set input, then synchronize and assert one load. Change input afterward and verify whether design intentionally reacts; if it should, use input effect/ngOnChanges/route stream.

### Production verification

- Repeat the interaction after browser refresh and direct URL navigation.
- Trigger rapid clicks and deliberately delayed responses.
- Navigate away while work is in progress and check for stale updates.
- Exercise unauthorized, forbidden, missing, concurrency-conflict, and server-error responses.
- Confirm logs contain a correlation identifier but no account secrets or payment credentials.
- Use Angular DevTools, browser Network/Performance panels, and heap snapshots when timing or cleanup is involved.

---

## 7. Important design decisions

- No heavy side effects in constructor.
- Use OnInit only for once-per-instance setup.
- React to changing inputs explicitly.
- Avoid duplicate loads.
- Model loading/error.

For a senior-level answer, explain the trade-off rather than only naming the API. State why this component or hook owns the work, what alternative you rejected, and how your choice behaves during failure and cleanup.

---

## 8. When to use and when not to use it

### Use it when

- Constructor for DI/invariants; OnInit for Angular-aware one-time setup.

### Avoid or reconsider it when

- Reading inputs in constructor or assuming OnInit runs on every parameter change.

---

## 9. Compare it with related concepts

| Concept | Responsibility |
|---|---|
| constructor | Class creation |
| field initializer/inject | Dependency/property setup |
| ngOnInit | Once after initial inputs |
| ngOnChanges/effect | Repeated input reaction |

---

## 10. Common production mistakes

- API in constructor.
- Duplicate initialization.
- OnInit assumed on route change.
- No teardown.
- Hidden async failure.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

A page makes two API calls on first load and fails when the route ID changes without recreating the component. Diagnose constructor and OnInit assumptions.

---

## Quick revision card

- **Definition:** The constructor is standard class creation and dependency injection. `ngOnInit` is Angular lifecycle initialization after initial inputs have been assigned.
- **Memory rule:** Constructor: what I need. OnInit: what I do once Angular has set me up.
- **Design check:** owner, direction, lifetime, failure path, and API authority.
- **Production check:** refresh, rapid action, stale result, navigation cleanup, API rejection, and telemetry.
