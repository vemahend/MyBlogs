# How Do You Avoid Putting Too Much Logic in a Component?

## 1. What problem does it solve?

A component that performs API calls, DTO mapping, validation, calculations, state management, telemetry, and rendering becomes a god component. Every change risks unrelated behaviour and tests require the entire framework setup.

---

## 2. Explain it in simple language

Keep components focused on presentation and orchestration. Move HTTP details to API clients, screen workflows to facades, reusable business calculations to pure functions/domain services, and shared state to an explicitly scoped store.

### Memory rule

> **The component conducts the orchestra; it should not play every instrument.**

### Interview-ready answer

> Keep components focused on presentation and orchestration. Move HTTP details to API clients, screen workflows to facades, reusable business calculations to pure functions/domain services, and shared state to an explicitly scoped store. In a production Angular application I would apply it by identifying the state owner and lifetime first, keeping the component contract typed and explicit, and delegating authoritative payment and security rules to the ASP.NET Core API.

---

## 3. How does it work internally?

1. Template events call small component handlers.
2. Handlers delegate commands to a facade or application service.
3. The facade coordinates API clients and state transitions.
4. Pure mappers convert DTOs into view models.
5. Signals or Observables expose readonly state back to the component.

### Practical interpretation

Thin does not mean empty. Local display state, form coordination, and user-event handling belong in a component. The extraction test is whether the logic represents presentation, can be reused/tested independently, or must survive the view. Do not move everything into one enormous service.

### Incorrect versus improved approach

```typescript
// Avoid transport and workflow in page
this.http.post('/api/payments',this.form.value).subscribe(...);
// Prefer explicit boundary
this.facade.submit(toCommand(this.form.getRawValue()));
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

A transfer page collects input and renders progress. Payment limit rules remain on the API; a client validator may repeat a non-authoritative hint. The facade coordinates beneficiary validation and submission without the component knowing URLs or status-code mapping.

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

1. Component creates an explicit form.
2. Submit maps form to a command and calls facade.
3. Facade enters submitting state and calls API client.
4. API validates and returns result.
5. Facade maps result; component renders it.

### Failure flow

1. Component calls five endpoints with nested subscriptions.
2. One call fails after other local mutations.
3. Loading flags remain inconsistent.
4. Navigation leaves subscriptions alive.
5. Extract API/facade boundaries and model one screen state.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
@Component({templateUrl:'./transfer.page.html'})
export class TransferPage {
  private readonly facade=inject(PaymentFacade);
  readonly state=this.facade.state;
  readonly form=createTransferForm();
  submit(){if(this.form.valid)this.facade.submit(toCommand(this.form.getRawValue()))}
}

@Injectable()
export class PaymentFacade {
  private readonly api=inject(PaymentApi);
  // owns loading/error/result transitions
}
```

### ASP.NET Core boundary

```csharp
public sealed class CreatePaymentHandler(IPaymentRepository repo,IRiskPolicy risk)
{
 public async Task<Result> Handle(CreatePayment cmd,CancellationToken ct)
 {
   var decision=await risk.EvaluateAsync(cmd,ct);
   if(!decision.Allowed)return Result.Rejected(decision.Reason);
   return await repo.CreateAsync(cmd,ct);
 }
}
```

### How to test this practically

Test pure mappers and validators without TestBed. Test facade state transitions with a fake API. Test the component through DOM behaviour using a fake facade. Contract-test the API client separately.

### Production verification

- Repeat the interaction after browser refresh and direct URL navigation.
- Trigger rapid clicks and deliberately delayed responses.
- Navigate away while work is in progress and check for stale updates.
- Exercise unauthorized, forbidden, missing, concurrency-conflict, and server-error responses.
- Confirm logs contain a correlation identifier but no account secrets or payment credentials.
- Use Angular DevTools, browser Network/Performance panels, and heap snapshots when timing or cleanup is involved.

---

## 7. Important design decisions

- Classify logic before extracting.
- Keep facade screen-oriented, not a dumping ground.
- Keep financial rules authoritative on .NET API.
- Expose readonly state.
- Choose service lifetime deliberately.

For a senior-level answer, explain the trade-off rather than only naming the API. State why this component or hook owns the work, what alternative you rejected, and how your choice behaves during failure and cleanup.

---

## 8. When to use and when not to use it

### Use it when

- Extract logic that is reusable, integration-related, stateful beyond the view, or independently testable.

### Avoid or reconsider it when

- Extracting every one-line display condition or creating layers without responsibility.

---

## 9. Compare it with related concepts

| Concept | Responsibility |
|---|---|
| Component | Presentation/orchestration |
| Facade | Screen workflow |
| API client | HTTP transport |
| Domain/API service | Authoritative business rule |

---

## 10. Common production mistakes

- God component.
- God facade.
- Nested subscriptions.
- Raw DTO in template.
- Business authorization only in client.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

A 1,500-line transfer component owns API calls, validation, formatting, and state. Describe a safe incremental refactor and the tests you would add before each extraction.

---

## Quick revision card

- **Definition:** Keep components focused on presentation and orchestration. Move HTTP details to API clients, screen workflows to facades, reusable business calculations to pure functions/domain services, and shared state to an explicitly scoped store.
- **Memory rule:** The component conducts the orchestra; it should not play every instrument.
- **Design check:** owner, direction, lifetime, failure path, and API authority.
- **Production check:** refresh, rapid action, stale result, navigation cleanup, API rejection, and telemetry.
