# How Do You Design Reusable Angular Components?

## 1. What problem does it solve?

Copying similar UI across features creates inconsistent behaviour and fixes. Over-general components with dozens of flags are equally damaging. Reuse requires a cohesive semantic contract, not only shared HTML.

---

## 2. Explain it in simple language

A reusable component solves one stable UI responsibility through typed inputs, semantic outputs, accessible behaviour, and optional content slots. It should not know a specific page, API URL, or raw backend DTO.

### Memory rule

> **Reusable means stable by contract, not configurable by fifty flags.**

### Interview-ready answer

> A reusable component solves one stable UI responsibility through typed inputs, semantic outputs, accessible behaviour, and optional content slots. It should not know a specific page, API URL, or raw backend DTO. In a production Angular application I would apply it by identifying the state owner and lifetime first, keeping the component contract typed and explicit, and delegating authoritative payment and security rules to the ASP.NET Core API.

---

## 3. How does it work internally?

1. Caller imports and renders the standalone component.
2. Inputs configure its view model and supported behaviour.
3. The component derives presentation state without mutating inputs.
4. Outputs report semantic user intent.
5. Content projection supplies caller-owned markup where a fixed input would be too restrictive.

### Practical interpretation

Start from semantics: what does every consumer mean by money input? Accessibility, precision, error communication, and forms integration are part of the public contract. Prefer composition and content projection to boolean-flag combinations.

### Incorrect versus improved approach

```typescript
<!-- Avoid feature-specific flags -->
<app-card [isPayment]="true" [showApproval]="true" [adminMode]="false" />
<!-- Prefer cohesive contracts/composition -->
<app-payment-card [vm]="vm" (approvalRequested)="approve()" />
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

A MoneyInput component accepts currency, min/max, disabled state, and integrates with Angular forms. It formats and parses input but does not decide payment limits or call the transfer API.

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

1. Two features share the same money-entry semantics.
2. Component exposes a small typed API.
3. It supports keyboard, labels, errors, and disabled state.
4. Each parent owns submission.
5. One accessibility fix benefits both features.

### Failure flow

1. Component gains showFees, isTransfer, isRefund, isAdmin and twenty flags.
2. Branches become impossible to reason about.
3. Features require contradictory behaviour.
4. Tests explode.
5. Split by semantic responsibility or use composition.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
@Component({selector:'app-money-input',templateUrl:'./money-input.html'})
export class MoneyInput implements ControlValueAccessor {
 readonly currency=input.required<string>();
 readonly min=input(0.01);
 // writeValue/registerOnChange/registerOnTouched/setDisabledState
}

// Parent owns the business workflow
<app-money-input formControlName="amount" currency="NZD" />
```

### ASP.NET Core boundary

```csharp
public sealed record CreatePaymentRequest(decimal Amount,string Currency);
[HttpPost]
public async Task<IActionResult> Create(CreatePaymentRequest request,CancellationToken ct)
{
  var result=await service.CreateAsync(request,User,ct);
  return result.ToActionResult();
}
```

### How to test this practically

Create contract tests for inputs, outputs, ControlValueAccessor, disabled/touched behaviour, keyboard use, accessible labels, formatting, and error display. Use a test host representing more than one real consumer.

### Production verification

- Repeat the interaction after browser refresh and direct URL navigation.
- Trigger rapid clicks and deliberately delayed responses.
- Navigate away while work is in progress and check for stale updates.
- Exercise unauthorized, forbidden, missing, concurrency-conflict, and server-error responses.
- Confirm logs contain a correlation identifier but no account secrets or payment credentials.
- Use Angular DevTools, browser Network/Performance panels, and heap snapshots when timing or cleanup is involved.

---

## 7. Important design decisions

- Extract after semantics are understood.
- Design accessibility as part of API.
- Prefer immutable view models.
- Use CVA for reusable form controls.
- Version shared-library changes carefully.

For a senior-level answer, explain the trade-off rather than only naming the API. State why this component or hook owns the work, what alternative you rejected, and how your choice behaves during failure and cleanup.

---

## 8. When to use and when not to use it

### Use it when

- Same behaviour and meaning in multiple consumers.

### Avoid or reconsider it when

- Components similar only visually or likely to diverge.

---

## 9. Compare it with related concepts

| Concept | Responsibility |
|---|---|
| Reusable component | View + behaviour contract |
| Directive | Behaviour on caller element |
| Pipe | Display transformation |
| Design token/CSS | Appearance only |

---

## 10. Common production mistakes

- Boolean flag explosion.
- Raw DTO inputs.
- DOM click outputs.
- Hidden service dependency.
- No accessibility contract.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

Three teams use similar amount fields with different validation rules. What belongs in one reusable component, what stays with each feature, and how would you prevent a flag explosion?

---

## Quick revision card

- **Definition:** A reusable component solves one stable UI responsibility through typed inputs, semantic outputs, accessible behaviour, and optional content slots. It should not know a specific page, API URL, or raw backend DTO.
- **Memory rule:** Reusable means stable by contract, not configurable by fifty flags.
- **Design check:** owner, direction, lifetime, failure path, and API authority.
- **Production check:** refresh, rapid action, stale result, navigation cleanup, API rejection, and telemetry.
