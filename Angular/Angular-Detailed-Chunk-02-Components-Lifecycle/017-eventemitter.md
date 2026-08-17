# What Is EventEmitter?

## 1. What problem does it solve?

A child component needs to notify its parent of custom events in a familiar template-binding form. EventEmitter is the traditional output mechanism for this boundary.

---

## 2. Explain it in simple language

An EventEmitter is used with a component/directive output. The child calls `emit(payload)` and the parent listens with `(eventName)="handler($event)"`. It should not become a global application event bus.

### Memory rule

> **EventEmitter crosses one component boundary; it is not your message broker.**

### Interview-ready answer

> An EventEmitter is used with a component/directive output. The child calls `emit(payload)` and the parent listens with `(eventName)="handler($event)"`. It should not become a global application event bus. In a production Angular application I would apply it by identifying the state owner and lifetime first, keeping the component contract typed and explicit, and delegating authoritative payment and security rules to the ASP.NET Core API.

---

## 3. How does it work internally?

1. Parent template subscribes to output.
2. Child calls emit.
3. Angular invokes parent listener.
4. Payload is handled synchronously in component event flow.
5. Angular removes output connection with view destruction.

### Practical interpretation

Emit facts or intent, not successful business outcomes that the child cannot know. Keep payload small. Service-to-service asynchronous events belong to RxJS streams or backend messaging, not component EventEmitter.

### Incorrect versus improved approach

```typescript
@Injectable({providedIn:'root'}) class GlobalBus { event=new EventEmitter<any>(); }
// Avoid; use a scoped store/typed Observable contract.
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

BeneficiaryPicker emits beneficiarySelected after a user picks one. Parent decides whether to update draft and call eligibility API. The child never knows transfer workflow.

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

1. Child receives list.
2. User selects beneficiary.
3. Child emits BeneficiarySummary.
4. Parent updates draft.
5. API later validates authoritative eligibility.

### Failure flow

1. EventEmitter lives in root service.
2. Many components emit/listen without ownership.
3. Event order becomes implicit.
4. Memory and debugging issues grow.
5. Replace with explicit store/Observable commands.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
export class BeneficiaryPicker {
 readonly beneficiarySelected=output<BeneficiarySummary>();
 select(value:BeneficiarySummary){this.beneficiarySelected.emit(value)}
}
// Traditional: @Output() beneficiarySelected=new EventEmitter<BeneficiarySummary>();
```

### ASP.NET Core boundary

```csharp
[HttpGet("beneficiaries/{id:guid}/eligibility")]
public Task<EligibilityDto> Check(Guid id,CancellationToken ct)
 => eligibility.CheckAsync(id,User,ct);
```

### How to test this practically

Subscribe to the output, trigger the actual user action, assert payload and count, then destroy the fixture. Do not call emit directly because that only tests EventEmitter, not component behaviour.

### Production verification

- Repeat the interaction after browser refresh and direct URL navigation.
- Trigger rapid clicks and deliberately delayed responses.
- Navigate away while work is in progress and check for stale updates.
- Exercise unauthorized, forbidden, missing, concurrency-conflict, and server-error responses.
- Confirm logs contain a correlation identifier but no account secrets or payment credentials.
- Use Angular DevTools, browser Network/Performance panels, and heap snapshots when timing or cleanup is involved.

---

## 7. Important design decisions

- Use output only at UI boundary.
- Name event semantically.
- Type payload.
- Do not expose mutable object.
- Parent owns consequences.

For a senior-level answer, explain the trade-off rather than only naming the API. State why this component or hook owns the work, what alternative you rejected, and how your choice behaves during failure and cleanup.

---

## 8. When to use and when not to use it

### Use it when

- Child-to-parent component/directive events.

### Avoid or reconsider it when

- Services, global communication, stored state, backend events.

---

## 9. Compare it with related concepts

| Concept | Responsibility |
|---|---|
| EventEmitter/output | Child event |
| Subject | Service stream |
| Signal | Current state |
| Backend event | Cross-service fact |

---

## 10. Common production mistakes

- EventEmitter in service.
- Generic changed event.
- Raw DOM event payload.
- Assuming bubbling.
- Emitting before valid state.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

A team uses one root EventEmitter for login, menu, payment, and notification events. Explain the problems and design explicit replacements.

---

## Quick revision card

- **Definition:** An EventEmitter is used with a component/directive output. The child calls `emit(payload)` and the parent listens with `(eventName)="handler($event)"`. It should not become a global application event bus.
- **Memory rule:** EventEmitter crosses one component boundary; it is not your message broker.
- **Design check:** owner, direction, lifetime, failure path, and API authority.
- **Production check:** refresh, rapid action, stale result, navigation cleanup, API rejection, and telemetry.
