# What Are Components in Angular?

## 1. What problem do components solve?

Components divide a large user interface into smaller, independent, reusable, and testable sections.

Without components, an entire banking application might contain account information, beneficiary selection, the payment form, transaction history, and confirmation messages inside one large page. That quickly becomes difficult to understand, test, reuse, and maintain.

Components let us divide it into:

```text
PaymentPageComponent
├── AccountSelectorComponent
├── BeneficiarySelectorComponent
├── PaymentFormComponent
├── PaymentSummaryComponent
└── PaymentResultComponent
```

Each component has one clear responsibility.

---

## 2. Simple explanation

A component is a small, self-contained part of the screen.

It normally contains:

1. A TypeScript class containing state and behaviour.
2. An HTML template defining the UI.
3. CSS styles.
4. Inputs that receive information.
5. Outputs that notify the parent about actions.

Think of a component like a reusable .NET UI class:

```text
TypeScript class → Behaviour
HTML template    → User interface
CSS              → Appearance
Inputs           → Values received from a parent
Outputs          → Events sent to a parent
```

A component should answer:

> Which part of the screen am I responsible for?

### Memory rule

> **A component is a class, a view, a contract, and a lifecycle.**

---

## 3. How does it work internally?

A component is a TypeScript class decorated with `@Component`.

```typescript
@Component({
  selector: 'app-payment-summary',
  templateUrl: './payment-summary.component.html',
  styleUrl: './payment-summary.component.css'
})
export class PaymentSummaryComponent {
}
```

The decorator gives Angular metadata:

| Metadata | Purpose |
|---|---|
| `selector` | How the component is used in HTML |
| `template` or `templateUrl` | UI structure |
| `styles` or `styleUrl` | Component styling |
| `imports` | Components, directives, and pipes it uses |
| `providers` | Component-scoped dependencies |

Modern Angular components are standalone by default and can directly import other components, directives, and pipes. Older applications may still use `NgModule`-based components.

Internally, Angular performs roughly this sequence:

```text
Parent template references component
              ↓
Angular creates component instance
              ↓
Dependency injection resolves services
              ↓
Angular assigns input values
              ↓
Lifecycle hooks execute
              ↓
Angular renders the template
              ↓
State changes update affected bindings
              ↓
Angular destroys the component and its view
```

For example:

```html
<app-payment-summary
  [payment]="selectedPayment()"
  (approveRequested)="approve($event)" />
```

Here:

- `[payment]` sends data from the parent to the child.
- `(approveRequested)` sends an event from the child to the parent.

The component lifecycle covers creation, input changes, rendering, and destruction. For example, `ngOnInit` runs after initial inputs are assigned, while `ngOnDestroy` runs before destruction.

### Communication memory rule

> **Data goes down through inputs; events go up through outputs.**

---

## 4. Payment-system example

Consider an approval screen for a bank payment.

The parent page is responsible for:

- Loading the payment.
- Checking UI permissions.
- Calling the approval service.
- Managing loading and error states.

The child summary component is responsible for:

- Displaying payment information.
- Showing the Approve button.
- Informing the parent when approval is requested.

```text
PaymentApprovalPageComponent
              │
              │ payment input
              ↓
PaymentSummaryComponent
              │
              │ approveRequested output
              ↓
PaymentApprovalPageComponent
              │
              ↓
PaymentFacade
              │
              ↓
ASP.NET Core API
```

The child component should not independently call the approval API. Otherwise, it becomes tightly coupled to one workflow and is harder to reuse and test.

---

## 5. Successful flow and failure flow

### Successful flow

```text
1. User opens /payments/123
2. Parent component loads payment 123
3. Parent passes PaymentViewModel to child
4. Child displays payment information
5. User selects Approve
6. Child emits approveRequested
7. Parent calls PaymentFacade
8. ASP.NET Core API authorizes and approves payment
9. Parent updates success state
10. Child displays Approved
```

### Failure flow

```text
1. User selects Approve
2. Child emits approveRequested
3. Parent starts submission
4. API returns 409 Conflict
5. Parent maps it to a concurrency error
6. UI explains that another user already processed the payment
7. Parent reloads the latest payment state
```

The component should not decide financial correctness.

The API must enforce:

- Authentication
- Authorization
- Payment limits
- Account balance
- Concurrency
- Idempotency
- Audit history

> **The Angular component controls the experience; the API protects the money.**

---

## 6. Practical Angular and .NET example

A component itself must be written in TypeScript, not C#. However, it normally communicates with a C#/.NET API.

### Angular child component

```typescript
import { CurrencyPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';

export interface PaymentViewModel {
  id: string;
  beneficiaryName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'declined';
  canApprove: boolean;
}

@Component({
  selector: 'app-payment-summary',
  imports: [CurrencyPipe],
  template: `
    <section>
      <h2>Payment summary</h2>

      <p>Beneficiary: {{ payment().beneficiaryName }}</p>

      <p>
        Amount:
        {{ payment().amount | currency: payment().currency }}
      </p>

      <p>Status: {{ payment().status }}</p>

      @if (payment().canApprove) {
        <button
          type="button"
          [disabled]="submitting()"
          (click)="approveRequested.emit(payment().id)">
          Approve
        </button>
      }
    </section>
  `
})
export class PaymentSummaryComponent {
  readonly payment = input.required<PaymentViewModel>();
  readonly submitting = input(false);

  readonly approveRequested = output<string>();
}
```

This component:

- Receives data through inputs.
- Displays information.
- Emits user intent.
- Does not contain API logic.
- Does not contain financial approval rules.

### Angular parent component

```typescript
@Component({
  selector: 'app-payment-approval-page',
  imports: [PaymentSummaryComponent],
  template: `
    @if (payment(); as currentPayment) {
      <app-payment-summary
        [payment]="currentPayment"
        [submitting]="submitting()"
        (approveRequested)="approve($event)" />
    }

    @if (errorMessage()) {
      <p role="alert">{{ errorMessage() }}</p>
    }
  `
})
export class PaymentApprovalPageComponent {
  private readonly facade = inject(PaymentFacade);

  readonly payment = this.facade.payment;
  readonly submitting = this.facade.submitting;
  readonly errorMessage = this.facade.errorMessage;

  approve(paymentId: string): void {
    this.facade.approve(paymentId);
  }
}
```

### ASP.NET Core endpoint

```csharp
public sealed record ApprovePaymentRequest(
    string IdempotencyKey);

[Authorize(Policy = "CanApprovePayments")]
[ApiController]
[Route("api/payments")]
public sealed class PaymentsController : ControllerBase
{
    [HttpPost("{paymentId:guid}/approve")]
    public async Task<IActionResult> Approve(
        Guid paymentId,
        ApprovePaymentRequest request,
        CancellationToken cancellationToken)
    {
        var command = new ApprovePaymentCommand(
            paymentId,
            request.IdempotencyKey,
            User.Identity!.Name!);

        var result = await mediator.Send(command, cancellationToken);

        return result switch
        {
            PaymentApproved approved => Ok(approved),
            PaymentAlreadyProcessed => Conflict(
                new ProblemDetails
                {
                    Title = "Payment already processed"
                }),
            PaymentNotFound => NotFound(),
            _ => StatusCode(StatusCodes.Status500InternalServerError)
        };
    }
}
```

The responsibility split is:

```text
Angular component → Presentation and user intent
Angular facade    → Frontend orchestration
ASP.NET Core API  → Security and financial rules
```

---

## 7. Important design decisions

### Container versus presentational components

A container component:

- Uses services or facades.
- Loads data.
- Manages page state.
- Coordinates child components.

A presentational component:

- Receives inputs.
- Emits outputs.
- Renders UI.
- Has little or no API knowledge.

This is a useful design guideline, but it should not become an inflexible rule.

### Keep the public contract small

Prefer:

```typescript
readonly payment = input.required<PaymentViewModel>();
readonly approveRequested = output<string>();
```

Avoid 15 unrelated inputs and outputs. Too many usually indicate that the component has multiple responsibilities.

### Do not mutate inputs

Avoid:

```typescript
this.payment().status = 'approved';
```

The parent owns the value. Emit an event and let the owner update it.

### Choose service scope carefully

A service in a component's `providers` array creates a service instance for that component subtree. This can be useful for isolated state, but accidental component-level providers can create unexpected duplicate instances.

---

## 8. When to use and when not to use components

Use a component when:

- It represents a meaningful UI section.
- It has its own template.
- It is reused.
- It has independently testable behaviour.
- It has a clear input/output contract.
- It owns local presentation state.

Do not create a component when:

- You only need to format a value—use a pipe.
- You only need reusable element behaviour—use a directive.
- You need non-visual reusable logic—use a service or function.
- The extracted component would contain almost nothing meaningful.
- You are splitting files only to follow an arbitrary size rule.

---

## 9. Comparison with related concepts

| Concept | Responsibility |
|---|---|
| Component | Owns a section of UI and its template |
| Directive | Adds behaviour to an existing element |
| Pipe | Transforms a value for display |
| Service | Contains reusable non-visual logic or state |
| Facade | Coordinates state and services for a feature or page |
| NgModule | Older grouping and configuration mechanism |
| ASP.NET controller | Handles HTTP requests on the server |

A component is technically a directive with its own template, but the practical interview distinction is:

> **A component creates UI; a directive changes the behaviour of existing UI.**

---

## 10. Common production mistakes

- Creating a giant God component.
- Calling `HttpClient` directly from many components.
- Putting financial or authorization rules only in Angular.
- Mutating input objects.
- Creating too many inputs and outputs.
- Using `any` for component contracts.
- Calling expensive methods from templates.
- Manually subscribing without cleanup.
- Storing the same state in the component, service, and form.
- Providing a service at component level accidentally.
- Reusing backend DTOs directly throughout the UI.
- Creating components configurable through dozens of boolean flags.

> **A strong component is not necessarily small. It is cohesive.**

---

## 11. Scenario-based interview question

You inherit a `PaymentPageComponent` containing approximately 1,500 lines. It:

- Calls five APIs directly.
- Contains payment-limit calculations.
- Displays payment details and transaction history.
- Manages a large reactive form.
- Has 20 input properties.
- Subscribes to several Observables.
- Produces duplicate approval requests when users click rapidly.

As the technical lead, how would you refactor this component without performing a risky big-bang rewrite?

---

## Quick revision card

- A component owns a meaningful part of the UI.
- It combines a TypeScript class, template, styles, contract, and lifecycle.
- Inputs send data down; outputs send events up.
- Components should coordinate UI, not own server security or financial rules.
- Use container components for orchestration and presentational components for reusable display.
- Prefer small, typed, explicit component contracts.
- A component creates UI; a directive changes existing UI behaviour.

## Official references

- [Angular components](https://angular.dev/guide/components)
- [Angular component lifecycle](https://angular.dev/guide/components/lifecycle)
- [Angular dependency injection](https://angular.dev/guide/di)
