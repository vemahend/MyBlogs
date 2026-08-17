# What Is Event Binding in Angular?

## 1. What problem does it solve?

A rendered screen must respond to clicks, keyboard input, form submission, focus, and custom child-component events. Event binding gives Angular a declarative, testable way to connect those events to component behaviour without manual addEventListener code.

---

## 2. Explain it in simple language

Event binding uses parentheses: **(event)="handler($event)"**. The event travels from the DOM element or child component into the owning component.

### Memory rule

> **Parentheses are ears: the component listens for something that happened.**

---

## 3. How does it work internally?

1. Angular creates the listener when it creates the view.
2. A native event supplies a DOM Event; a child output supplies its declared payload.
3. Angular evaluates the template statement in the component context.
4. The handler changes state or delegates to a service/facade.
5. The resulting state change schedules the relevant view to synchronize.

```text
Component state or user action
            ↓
Angular binding/template/compiler mechanism
            ↓
Typed component or service contract
            ↓
Affected view is synchronized
            ↓
Server remains authoritative for protected operations
```

### Practical interpretation

Event binding should capture a meaningful action and hand orchestration to TypeScript. The template should not generate an idempotency key, decide retry policy, or combine several service calls. The handler can reject a second in-flight click for usability, but that state can be bypassed or raced, so the server must deduplicate the command.

### Incorrect versus improved approach

```typescript
<!-- Avoid a mini-program in the template -->
<button (click)="saving=true; api.approve(id).subscribe(); log()">Approve</button>

<!-- Prefer one semantic handler -->
<button (click)="approve(id)" [disabled]="submitting()">Approve</button>
```

---

## 4. Realistic payment or banking example

The Approve button emits user intent once. The handler prevents a second in-flight request for UX, while the API uses an idempotency key for correctness. Keyboard activation and accessible button semantics come for free by using a real button.

---

## 5. Successful flow and failure flow

### Successful flow

1. User activates a real button.
2. Event binding invokes approve.
3. The component checks current submitting state.
4. Facade sends one request with a stable idempotency key.
5. API returns the approved result and the UI updates.

### Failure flow

1. User double-clicks or the browser retries.
2. Two requests reach the server.
3. A client-only disabled flag is too late or bypassed.
4. Server idempotency returns the same logical result instead of creating duplicate work.
5. UI reconciles with the returned authoritative state.

---

## 6. Practical Angular and .NET example

### Angular/TypeScript

```typescript
@Component({
  template: `
    <button type="button"
      [disabled]="submitting()"
      (click)="approve(paymentId())">
      Approve
    </button>
  `
})
export class ApprovalActionsComponent {
  readonly submitting = signal(false);
  private readonly facade = inject(PaymentFacade);

  approve(id: string): void {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.facade.approve(id).pipe(
      finalize(() => this.submitting.set(false))
    ).subscribe();
  }
}
```

### ASP.NET Core boundary

```csharp
[HttpPost("{id:guid}/approve")]
public async Task<IActionResult> Approve(
    Guid id, [FromHeader(Name="Idempotency-Key")] string key, CancellationToken ct)
{
    var result = await idempotentExecutor.ExecuteAsync(
        key, () => approvalService.ApproveAsync(id, User, ct), ct);
    return Ok(result);
}
```

The Angular code owns presentation and user intent. The .NET API owns authentication, authorization, concurrency, idempotency, validation, transactions, and audit history.

### How to test this practically

Trigger the real button through the rendered DOM rather than calling the private handler. Assert keyboard-accessible button semantics, one facade command during rapid clicks, disabled/pending feedback, error recovery, and re-enablement. Separately integration-test the .NET idempotency behaviour because no component test can prove server deduplication.

---

## 7. Important design decisions

- Use semantic handlers such as approve rather than large template statements.
- Use a real button for keyboard and accessibility behaviour.
- Separate UX duplicate prevention from server idempotency.
- Keep child outputs semantic rather than exposing raw DOM clicks.
- Model error and submitting states explicitly.

When reviewing the design, explicitly ask who owns the value, who may change it, how long it should live, what happens after refresh or navigation, and which rule must remain on the API.

---

## 8. When to use and when not to use it

### Use it when

- Native events and child-component outputs.
- Capturing completed user intent at a component boundary.

### Avoid or reconsider it when

- Global event buses or unrelated-component communication.
- Complex multi-step logic directly inside the template statement.

---

## 9. Compare it with related concepts

| Concept | Purpose or direction | Example |
|---|---|---|
| Native event | Browser element → component | `(click)` |
| Component output | Child → parent | `(submitted)` |
| Observable | General values over time | Service/RxJS |
| Command/API call | Application intent | Facade/server |

---

## 10. Common production mistakes

- Inline assignments and multiple calls in template.
- Missing keyboard/accessibility support.
- Assuming disabled button prevents all duplicates.
- Not handling errors or finalize.
- Using EventEmitter in services as a global bus.

> **Angular controls the experience; the API protects the money.**

---

## 11. Scenario-based interview question

An approval button occasionally sends two POST requests even though it becomes disabled after clicking. Explain why this can still happen and design both client and server protections.

---

## Quick revision card

- **Definition:** Event binding uses parentheses: **(event)="handler($event)"**. The event travels from the DOM element or child component into the owning component.
- **Memory rule:** Parentheses are ears: the component listens for something that happened.
- **Design check:** owner, direction, lifetime, failure path, and API authority.
- **Interview check:** explain the happy path, the failure path, and why the chosen boundary is testable.
