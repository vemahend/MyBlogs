# What Are @Input and @Output?

## 1. What problem does it solve?

Reusable children need an explicit public API. Inputs and outputs provide typed boundaries instead of child components reaching into parents or knowing feature services.

---

## 2. Explain it in simple language

An input declares data/configuration accepted by a component. An output declares a custom event the component can emit. Modern Angular also supports `input()` and `output()` APIs alongside decorator-based `@Input` and `@Output`.

### Memory rule

> **Inputs are nouns coming in; outputs are meaningful events going out.**

### Interview-ready answer

> An input declares data/configuration accepted by a component. An output declares a custom event the component can emit. Modern Angular also supports `input()` and `output()` APIs alongside decorator-based `@Input` and `@Output`. In a production Angular application I would apply it by identifying the state owner and lifetime first, keeping the component contract typed and explicit, and delegating authoritative payment and security rules to the ASP.NET Core API.

---

## 3. How does it work internally?

1. Compiler records inputs and outputs statically.
2. Parent binding supplies an input value.
3. Input changes can drive computed state or lifecycle processing.
4. Child emits a typed output.
5. Parent listener handles it; outputs do not automatically bubble like DOM events.

### Practical interpretation

Required inputs make omissions visible at compile time. Defaults make optional configuration explicit. Output payloads should be minimal and immutable; the parent can look up richer state it already owns.

### Incorrect versus improved approach

```typescript
// Avoid exposing implementation details
clicked=output<MouseEvent>();
// Prefer domain intent
approvalRequested=output<string>();
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

PaymentCard receives PaymentCardVm and emits approvalRequested(paymentId). It does not accept individual amount, currency, status, permission, fee, and user fields when one cohesive immutable VM is the real contract.

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

1. Parent passes valid immutable VM.
2. Child renders.
3. User selects approval.
4. Typed output sends ID.
5. Parent owns server interaction.

### Failure flow

1. Twenty inputs represent unrelated responsibilities.
2. Child mutates one input object.
3. Outputs expose click/focus details.
4. Parent-child API changes constantly.
5. Redraw boundary or split component.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
export class PaymentCard {
 readonly payment=input.required<PaymentCardVm>();
 readonly submitting=input(false);
 readonly approvalRequested=output<string>();
}
// Traditional forms remain common:
// @Input({required:true}) payment!: PaymentCardVm;
// @Output() approvalRequested=new EventEmitter<string>();
```

### ASP.NET Core boundary

```csharp
public sealed record PaymentCardDto(Guid Id,decimal Amount,string Currency,string Status,bool CanApprove);
// API maps only fields the UI is authorized to receive.
```

### How to test this practically

Use `fixture.componentRef.setInput` or a host binding so Angular processes inputs normally. Trigger user behaviour and assert one output payload. Test defaults, required assumptions, input replacement, and no mutation.

### Production verification

- Repeat the interaction after browser refresh and direct URL navigation.
- Trigger rapid clicks and deliberately delayed responses.
- Navigate away while work is in progress and check for stale updates.
- Exercise unauthorized, forbidden, missing, concurrency-conflict, and server-error responses.
- Confirm logs contain a correlation identifier but no account secrets or payment credentials.
- Use Angular DevTools, browser Network/Performance panels, and heap snapshots when timing or cleanup is involved.

---

## 7. Important design decisions

- Use signal-based or decorator API consistently.
- Mark Angular-initialized fields readonly.
- Prefer cohesive VM over unrelated values.
- Name outputs semantically.
- Do not expose secrets or mutable internals.

For a senior-level answer, explain the trade-off rather than only naming the API. State why this component or hook owns the work, what alternative you rejected, and how your choice behaves during failure and cleanup.

---

## 8. When to use and when not to use it

### Use it when

- Direct component composition and public UI libraries.

### Avoid or reconsider it when

- Unrelated state sharing or server events.

---

## 9. Compare it with related concepts

| Concept | Responsibility |
|---|---|
| Input | State/configuration in |
| Output | Event/intent out |
| model/two-way | Paired editable value |
| Service/store | Shared state outside hierarchy |

---

## 10. Common production mistakes

- Mutating input.
- Output named click.
- Too many inputs.
- Optional treated required.
- Output assumed to bubble.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

A component has 18 inputs and 12 outputs, including MouseEvent payloads. How do you determine whether to group, split, compose, or move orchestration?

---

## Quick revision card

- **Definition:** An input declares data/configuration accepted by a component. An output declares a custom event the component can emit. Modern Angular also supports `input()` and `output()` APIs alongside decorator-based `@Input` and `@Output`.
- **Memory rule:** Inputs are nouns coming in; outputs are meaningful events going out.
- **Design check:** owner, direction, lifetime, failure path, and API authority.
- **Production check:** refresh, rapid action, stale result, navigation cleanup, API rejection, and telemetry.
