# 22. Give a real example of the Single Responsibility Principle.

**Technology:** Architecture and Design

**Source question:** 22. Give a real example of the Single Responsibility Principle.

## 1. What is it?

The Single Responsibility Principle (SRP) says that a class or module should have one clear responsibility and therefore one main reason to change.

It does not mean that a class can have only one method. Several methods are fine when they all support the same responsibility. For example, a payment validator can have methods for checking an amount, currency, and account, because all those methods belong to payment validation.

## 2. Why is it important?

Without SRP, one class often contains validation, database access, payment processing, logging, and customer notifications. A change to an email template could then affect payment code, or a database change could break validation.

Separating these responsibilities makes the code easier to understand, test, review, and change. In a real system, different business rules also change for different reasons and at different times. SRP keeps those changes isolated and reduces the risk of production defects.

## 3. How does it work?

First, identify the different reasons that the code may change. Then place each reason in a focused component and let an application service coordinate those components.

For a payment request, the flow could be:

1. A validator checks the payment rules.
2. A payment gateway charges the customer.
3. A repository saves the result.
4. A notification service sends the receipt.
5. A payment application service coordinates the steps.

Each component owns one part of the process. The coordinator owns the payment workflow; it does not contain the internal rules for every step.

## 4. Practical example

Consider an online banking system that transfers money between accounts. An early implementation used one `MoneyTransferService` class to validate limits, update SQL records, call a fraud service, create an audit entry, and send an SMS.

That class had several reasons to change: banking rules, database design, fraud-provider integration, audit requirements, and notification templates. It was split into `TransferValidator`, `TransferRepository`, `FraudCheckService`, `AuditWriter`, and `CustomerNotifier`. A small `TransferService` now coordinates them.

If the bank replaces its SMS provider, only the notification implementation changes. The transfer rules and database code remain untouched.

## 5. Scenario-based interview answer

“In a payment platform, I found a checkout service that validated requests, called the payment provider, saved transactions, and sent receipt emails.

The problem was that unrelated changes were being made in the same class. A receipt-template change required deploying payment-processing code, and unit tests needed mocks for the database, gateway, and email provider even when we were testing only validation.

I decided to separate the responsibilities based on their reasons to change. We introduced a payment validator, gateway adapter, transaction repository, and receipt sender. The application service kept one responsibility: coordinating the payment use case. We registered the implementations through .NET dependency injection and added focused tests for each component.

As a result, changes became smaller, tests became clearer, and replacing the email provider did not affect the core payment flow. I would also avoid splitting every method into a separate class; the goal is high cohesion and one reason to change, not simply creating more files.”

## 6. Code example

```csharp
public sealed record PaymentRequest(Guid CustomerId, decimal Amount);
public sealed record PaymentResult(string TransactionId);

public interface IPaymentValidator
{
    void Validate(PaymentRequest request);
}

public interface IPaymentGateway
{
    Task<PaymentResult> ChargeAsync(
        PaymentRequest request,
        CancellationToken cancellationToken);
}

public interface IPaymentRepository
{
    Task SaveAsync(
        PaymentRequest request,
        PaymentResult result,
        CancellationToken cancellationToken);
}

public interface IReceiptSender
{
    Task SendAsync(
        Guid customerId,
        PaymentResult result,
        CancellationToken cancellationToken);
}

public sealed class ProcessPaymentService(
    IPaymentValidator validator,
    IPaymentGateway gateway,
    IPaymentRepository repository,
    IReceiptSender receiptSender)
{
    public async Task<PaymentResult> ExecuteAsync(
        PaymentRequest request,
        CancellationToken cancellationToken)
    {
        validator.Validate(request);

        var result = await gateway.ChargeAsync(request, cancellationToken);

        await repository.SaveAsync(request, result, cancellationToken);
        await receiptSender.SendAsync(
            request.CustomerId,
            result,
            cancellationToken);

        return result;
    }
}
```

`ProcessPaymentService` is responsible for coordinating the payment use case. Validation rules belong to `IPaymentValidator`, provider communication belongs to `IPaymentGateway`, persistence belongs to `IPaymentRepository`, and receipt delivery belongs to `IReceiptSender`.

The primary-constructor syntax used here is supported in C# 12 and later. With an earlier C# version, the same design can use a normal constructor and private fields.

In a production payment system, receipt delivery would commonly be triggered through a durable message or outbox after the transaction is saved. That avoids losing the receipt request when an email provider is temporarily unavailable.

## 7. Common mistakes

- Treating SRP as “one method per class.” The principle is about one reason to change, not the number of methods.
- Creating many tiny classes with no clear business meaning. This adds complexity without improving cohesion.
- Moving code into private methods but keeping validation, persistence, and integration logic in the same class. The responsibilities are still coupled.
- Making the controller responsible for the complete workflow. Controllers should normally handle HTTP concerns and delegate the use case.
- Splitting responsibilities but then using service location or static dependencies, which makes the design difficult to test.
- Sending a receipt directly after saving a payment without handling partial failure. Use an outbox or durable messaging when reliable delivery matters.

## 8. Follow-up interview questions

### How do you identify a class with too many responsibilities?

Look for a class that changes for unrelated requirements, has many dependencies, contains mixed concerns, or needs complex test setup for a simple rule.

### Is an orchestration service a violation of SRP?

No. Coordinating one business use case is a valid single responsibility. It becomes a problem when the service also implements validation, persistence, provider-specific logic, and notification details.

### What is the difference between SRP and separation of concerns?

Separation of concerns is the wider idea of keeping different concerns apart across a system. SRP applies that thinking specifically to a class or module by giving it one main reason to change.
