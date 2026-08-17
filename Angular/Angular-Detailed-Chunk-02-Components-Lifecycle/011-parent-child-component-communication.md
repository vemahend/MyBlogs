# How Do Parent and Child Components Communicate?

## 1. What problem does it solve?

A parent and its child must exchange state and user intent without becoming tightly coupled. Directly reaching into the child, injecting the parent, or sharing mutable objects makes ownership unclear and components difficult to reuse.

---

## 2. Explain it in simple language

The normal rule is **data down through inputs and events up through outputs**. The parent owns orchestration; the child renders the data it receives and reports meaningful user actions.

### Memory rule

> **Data down, events up; the owner decides what the event means.**

### Interview-ready answer

> The normal rule is **data down through inputs and events up through outputs**. The parent owns orchestration; the child renders the data it receives and reports meaningful user actions. In a production Angular application I would apply it by identifying the state owner and lifetime first, keeping the component contract typed and explicit, and delegating authoritative payment and security rules to the ASP.NET Core API.

---

## 3. How does it work internally?

1. Angular records input and output contracts at compile time.
2. During parent view synchronization, the input expression is evaluated and assigned to the child.
3. The child renders from that value and should treat it as readonly.
4. When the child emits an output, Angular invokes the parent listener with the payload.
5. The parent updates its state or delegates to a facade, and the new value flows down again.

### Practical interpretation

Inputs should describe state or configuration; outputs should describe a completed event or user intent. Avoid output names such as changed or click when approvedRequested or beneficiarySelected explains the domain meaning. Content projection is useful when the parent supplies markup, while a shared service is better when the components are not directly related.

### Incorrect versus improved approach

```typescript
// Avoid child-owned mutation
this.payment().status='approved';
// Prefer
this.approveRequested.emit(this.payment().id);
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

A payment approval page passes a PaymentVm to a summary child. The child emits approveRequested with only the payment ID. The page calls its facade, while the API checks permission, status, concurrency, and idempotency.

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

1. Parent loads the payment and owns the view state.
2. PaymentVm flows into the summary child.
3. User selects Approve.
4. Child emits payment ID; it does not set status itself.
5. Parent/facade calls API and replaces state with the response.

### Failure flow

1. Child mutates `payment.status` to Approved.
2. API rejects because another approver acted first.
3. Parent and child now show conflicting state.
4. Support cannot identify the source of truth.
5. Fix by making inputs readonly and emitting intent.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
@Component({selector:'app-payment-summary',template:`<button (click)="approveRequested.emit(payment().id)">Approve</button>`})
export class PaymentSummary {
  readonly payment=input.required<PaymentVm>();
  readonly approveRequested=output<string>();
}

@Component({imports:[PaymentSummary],template:`<app-payment-summary [payment]="payment()" (approveRequested)="approve($event)" />`})
export class PaymentPage {
  readonly payment=this.facade.payment;
  approve(id:string){this.facade.approve(id)}
}
```

### ASP.NET Core boundary

```csharp
[Authorize(Policy="CanApprovePayments")]
[HttpPost("{id:guid}/approve")]
public async Task<IActionResult> Approve(Guid id,CancellationToken ct)
    => (await workflow.ApproveAsync(id,User,ct)).ToActionResult();
```

### How to test this practically

Use a host component to exercise real input and output binding. Replace the input value, synchronize the view, trigger the child button, assert one semantic payload, and prove the child never mutates the supplied object.

### Production verification

- Repeat the interaction after browser refresh and direct URL navigation.
- Trigger rapid clicks and deliberately delayed responses.
- Navigate away while work is in progress and check for stale updates.
- Exercise unauthorized, forbidden, missing, concurrency-conflict, and server-error responses.
- Confirm logs contain a correlation identifier but no account secrets or payment credentials.
- Use Angular DevTools, browser Network/Performance panels, and heap snapshots when timing or cleanup is involved.

---

## 7. Important design decisions

- Keep contracts small and typed.
- Pass view models rather than raw DTOs.
- Emit intent, not internal DOM details.
- Let the parent/facade own workflow state.
- Use service/store only when hierarchy is not the real relationship.

For a senior-level answer, explain the trade-off rather than only naming the API. State why this component or hook owns the work, what alternative you rejected, and how your choice behaves during failure and cleanup.

---

## 8. When to use and when not to use it

### Use it when

- Direct parent-child relationships and reusable UI composition.

### Avoid or reconsider it when

- Communicating unrelated features or creating a global event bus.

---

## 9. Compare it with related concepts

| Concept | Responsibility |
|---|---|
| Input | Parent → child state |
| Output | Child → parent event |
| Content projection | Parent supplies markup |
| Shared service | State across unrelated consumers |

---

## 10. Common production mistakes

- Mutating inputs.
- Too many inputs/outputs.
- Injecting parent into child.
- Emitting raw click events.
- Treating UI event as successful server result.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

A child payment card modifies the input object and emits three low-level outputs. How would you redesign the contract so the component remains reusable and server state stays authoritative?

---

## Quick revision card

- **Definition:** The normal rule is **data down through inputs and events up through outputs**. The parent owns orchestration; the child renders the data it receives and reports meaningful user actions.
- **Memory rule:** Data down, events up; the owner decides what the event means.
- **Design check:** owner, direction, lifetime, failure path, and API authority.
- **Production check:** refresh, rapid action, stale result, navigation cleanup, API rejection, and telemetry.
