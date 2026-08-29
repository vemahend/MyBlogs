# 5. How do Angular services and dependency injection work?

**Technology:** React, Angular, and Frontend

**Source question:** 5. How do Angular services and dependency injection work?

## 1. What is it?

An Angular service is usually a TypeScript class that contains logic or data shared by components. Common examples are calling an API, handling authentication, recording telemetry, or managing application state.

Dependency injection, usually called DI, is Angular's way of giving a class the objects it needs. A component asks for a service instead of creating it with `new`. Angular finds or creates the service and supplies it.

This keeps UI components focused on the screen and moves reusable business or integration logic into services.

## 2. Why is it important?

Without DI, components create their own dependencies and become tightly coupled to specific implementations. That makes code harder to reuse, configure, and test.

Angular services and DI help by providing:

- **Separation of concerns:** components manage the UI while services handle API calls and shared logic.
- **Reuse:** many components can use the same service.
- **Controlled lifetime:** Angular can share one service instance or create instances for a smaller scope.
- **Testability:** a test can replace a real dependency with a fake or mock.
- **Configuration:** an injection token can provide values or select different implementations.

In a large frontend connected to .NET APIs, this gives teams clear boundaries between presentation, application logic, and HTTP communication.

## 3. How does it work?

Angular uses a hierarchy of injectors. A class declares what it needs, normally through a constructor parameter or the `inject()` function. Angular resolves each requested token by checking the current injector and then its parent injectors until it finds a provider.

A provider tells Angular how to create or return a value. It may provide:

- a class with `useClass`;
- an existing object with `useValue`;
- a value produced by `useFactory`;
- another registered token with `useExisting`.

`@Injectable({ providedIn: 'root' })` registers a service with the application's root environment injector. Angular normally creates that service lazily, the first time it is requested, and shares the instance across the application.

A provider declared on a component creates a narrower scope. That component and its descendants share the instance, while another instance is created for a separate component subtree. Route-level providers can similarly scope services to a route.

In current Angular applications, both constructor injection and `inject()` are supported. `inject()` is especially useful in field initializers, provider factories, guards, and other valid injection contexts. It cannot be called from arbitrary application code after an object has already been constructed.

## 4. Practical example

Consider an online banking screen that displays accounts and submits payments. `PaymentComponent` should not know how to build URLs, attach common HTTP behavior, or map API errors.

The component injects `PaymentService`. The service uses Angular's `HttpClient` to call the ASP.NET Core payment API. Angular supplies both dependencies. Other payment components can reuse the same service, and tests can replace it with a fake that returns controlled results.

The frontend service improves structure, but it is not a security boundary. The .NET API must still authenticate the user, verify account ownership, check payment limits, prevent duplicate processing, and record the audit trail.

## 5. Scenario-based interview answer

**Problem:** In a banking application, several components called the payment API directly. Authentication headers, error handling, and response mapping were repeated, and component tests required real HTTP setup.

**Decision:** I moved payment communication into an injectable service and used Angular DI to supply it to the components. I registered the stateless service at the root because one shared instance was appropriate for the whole application.

**Implementation:** The service wrapped `HttpClient` calls and exposed methods using domain-focused request and response types. Components handled form state and user feedback only. In unit tests, I replaced the service with a stub. Cross-cutting HTTP concerns were handled centrally rather than copied into each component.

**Result:** Components became smaller, API behavior was consistent, and tests were faster and easier to understand. We still enforced every authorization and validation rule in the ASP.NET Core API because client-side code cannot be trusted.

A natural interview answer would be: “I use Angular services to keep shared logic and API access outside components. Angular DI creates and supplies those services from registered providers. I choose the provider scope deliberately—root for application-wide stateless services and component or route scope when state must be isolated. This improves reuse and testing, but I avoid turning one root service into an uncontrolled global state store.”

## 6. Code example

```typescript
import { Component, Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface PaymentRequest {
  fromAccountId: string;
  amount: number;
  reference: string;
}

interface PaymentResult {
  paymentId: string;
  status: 'accepted' | 'rejected';
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);

  submit(request: PaymentRequest): Observable<PaymentResult> {
    return this.http.post<PaymentResult>('/api/payments', request);
  }
}

@Component({
  selector: 'app-payment',
  standalone: true,
  template: `<button (click)="pay()">Pay</button>`
})
export class PaymentComponent {
  private readonly payments = inject(PaymentService);

  pay(): void {
    const request: PaymentRequest = {
      fromAccountId: 'ACC-1001',
      amount: 50,
      reference: 'Invoice 42'
    };

    this.payments.submit(request).subscribe({
      next: result => console.log(`Payment ${result.status}`, result.paymentId),
      error: () => console.error('Payment could not be submitted')
    });
  }
}
```

`providedIn: 'root'` makes `PaymentService` available application-wide. `inject(HttpClient)` asks Angular to resolve `HttpClient`, and the component asks for `PaymentService` in the same way. The component does not construct either object.

The application must also configure Angular's HTTP providers during bootstrap, normally with `provideHttpClient()` in a standalone application. The example keeps the subscription simple for clarity; production code should also provide user-friendly error handling and prevent accidental duplicate submissions.

## 7. Common mistakes

- Creating services manually with `new`, which bypasses Angular DI and its provider configuration.
- Putting view-specific code or every piece of application state into root services, creating hidden global state.
- Choosing the wrong provider scope and accidentally creating multiple service instances. For example, adding a stateful service to each component's `providers` array isolates its state.
- Assuming `providedIn: 'root'` means the instance is created at application startup. It is normally created when first requested.
- Calling `inject()` outside a valid injection context.
- Making a service depend directly on a component, which reverses the intended dependency direction.
- Performing nested subscriptions or leaving long-lived subscriptions unmanaged.
- Treating frontend authorization checks as security. The server must enforce permissions and business rules.
- Storing access tokens or sensitive banking data in a service without considering browser security, refresh behavior, and data cleanup.

## 8. Follow-up interview questions

### What is the difference between a root provider and a component provider?

A root provider normally gives the application one shared instance. A component provider creates an instance for that component subtree, so different component instances can receive different service instances.

### When would you use an `InjectionToken`?

Use an `InjectionToken` when the dependency is not a class, such as configuration data, or when code should depend on an abstraction with a selectable implementation.

### Can Angular inject a service that has its own dependencies?

Yes. Angular resolves the full dependency graph. If `PaymentService` needs `HttpClient`, Angular resolves `HttpClient` before creating `PaymentService`. Every dependency must have a valid provider.
