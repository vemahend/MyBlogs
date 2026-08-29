# 21. How would you roll back to the legacy implementation?

**Technology:** Strangler Fig and Migration Patterns

**Source question:** 21. How would you roll back to the legacy implementation?

## 1. What is it?

Rolling back to the legacy implementation means routing traffic away from the new service and back to the old, stable system when the new implementation has a serious problem.

In a Strangler Fig migration, rollback should usually be a controlled routing change, not an emergency code deployment. The legacy path stays available until the new path has proved that it is stable and its data changes are compatible.

## 2. Why is it important?

A replacement service can pass testing but still fail under real traffic, unusual data, or dependency failures. A quick rollback limits customer impact while the team investigates.

For architects, the difficult part is not changing the route. It is ensuring that the legacy system can still understand the data and safely continue work already started by the new system. A rollback plan reduces migration risk and allows smaller, more frequent releases.

## 3. How does it work?

A safe rollback normally follows this flow:

1. Keep a routing switch at the gateway, reverse proxy, or feature-flag layer.
2. Move traffic gradually to the new implementation, for example 1%, 10%, 50%, and then 100%.
3. Monitor error rate, latency, business failures, and data consistency at each stage.
4. If agreed thresholds are breached, stop new traffic to the new service and switch the route back to legacy.
5. Let in-flight requests finish or cancel them safely. Use idempotency keys so a retried payment is not processed twice.
6. Reconcile any data or messages produced by the new service while it was active.
7. Keep the new service isolated for diagnosis, then fix and repeat the gradual rollout.

The database design must support this plan. During migration, use backward-compatible schema changes, such as adding nullable columns before removing old ones. If both systems require separate data stores, use an outbox, change-data-capture process, or a carefully designed synchronization mechanism. Avoid uncoordinated dual writes because one write can succeed while the other fails.

## 4. Practical example

A bank is replacing a legacy payment service with a new ASP.NET Core service. An API gateway sends 10% of payment requests to the new service. Both paths accept the same idempotency key, and payment events are stored through a transactional outbox.

Monitoring shows that the new service rejects some valid international account numbers. The team disables the new route, so all new requests go to the legacy service. In-flight requests finish, and the outbox events are reconciled before any failed payments are retried. Customers can continue paying while the new validation rule is corrected.

## 5. Scenario-based interview answer

“In one migration, we were moving payment initiation from a legacy application to a new .NET service. My main concern was making rollback a routing operation rather than a new deployment.

We kept the legacy endpoint running and put both implementations behind the gateway. Traffic moved to the new service in small percentages controlled by a feature flag. Before rollout, we made the schema changes backward-compatible, added idempotency keys, and used a transactional outbox so that payment events could be reconciled.

We defined rollback thresholds for technical metrics, such as error rate and latency, and business metrics, such as duplicate or rejected payments. When the rejection rate crossed the threshold, we stopped new traffic to the new service and routed it to legacy. We then checked in-flight requests and replayed only confirmed missing events.

The result was a rollback in minutes without duplicate payments or data loss. We kept the new service offline until the defect was fixed and then restarted the canary rollout. I would not remove the legacy path until the new service had completed an agreed stability period and rollback was no longer required.”

## 6. Code example

This ASP.NET Core example uses a simple routing flag. The same approach works in supported ASP.NET Core versions such as .NET 8 and .NET 10, although production systems usually keep the flag in a managed configuration or feature-management service.

```csharp
public interface IPaymentProcessor
{
    Task<PaymentResult> ProcessAsync(
        PaymentRequest request,
        string idempotencyKey,
        CancellationToken cancellationToken);
}

public sealed class PaymentRouter(
    LegacyPaymentProcessor legacy,
    NewPaymentProcessor modern,
    IConfiguration configuration,
    ILogger<PaymentRouter> logger) : IPaymentProcessor
{
    public async Task<PaymentResult> ProcessAsync(
        PaymentRequest request,
        string idempotencyKey,
        CancellationToken cancellationToken)
    {
        var useNewService = configuration.GetValue<bool>(
            "Migration:UseNewPaymentService");

        if (!useNewService)
        {
            logger.LogWarning(
                "Payment {PaymentId} is routed to the legacy implementation",
                request.PaymentId);

            return await legacy.ProcessAsync(
                request, idempotencyKey, cancellationToken);
        }

        return await modern.ProcessAsync(
            request, idempotencyKey, cancellationToken);
    }
}
```

The operational team can turn `Migration:UseNewPaymentService` off to send new requests back to legacy. Both implementations receive the same idempotency key, which allows safe retries. In production, the flag provider should update without restarting the application, and access to the flag should be audited. The system should not automatically fall back after an unknown payment failure because the new service might already have processed the payment.

## 7. Common mistakes

- Removing or switching off the legacy system too early.
- Treating rollback as only a traffic change and ignoring data written by the new service.
- Making destructive database changes that the legacy code cannot read.
- Retrying non-idempotent operations and creating duplicate payments or orders.
- Automatically calling legacy after a timeout without knowing whether the new service completed the operation.
- Using dual writes without a transaction, outbox, reconciliation process, or clear source of truth.
- Having no tested runbook, rollback thresholds, ownership, or audit trail.
- Sending 100% of traffic to the new implementation in one step.

## 8. Follow-up interview questions

### How long should the legacy implementation remain available?

Keep it until the new implementation has passed the agreed stability period, data reconciliation is complete, rollback drills work, and the business accepts decommissioning. There is no single fixed duration.

### How do you handle data created by the new service before rollback?

Use compatible schemas or reliable event synchronization, define one source of truth, and run reconciliation. Replay only missing operations, using idempotency keys to prevent duplicates.

### Should the application automatically fall back to legacy on every error?

Usually not for state-changing operations. A timeout does not prove that processing failed, so automatic fallback could perform the same payment twice. Use circuit breakers for protection, but make business-operation recovery explicit and idempotent.
