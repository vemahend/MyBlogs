# Scenario-Based RabbitMQ Problems Interview Questions

Total questions: 20

1. [A payment message is processed twice and the customer is charged twice. How do you fix the design?](./053-001-a-payment-message-is-processed-twice-and-the-customer-is-charged-twice-how-do-you-fix-the-design.md) — Failed
2. [A RabbitMQ queue is growing continuously during peak hours. How do you investigate?](./053-002-a-rabbitmq-queue-is-growing-continuously-during-peak-hours-how-do-you-investigate.md) — Failed
3. [A consumer crashes after saving to the database but before acknowledging the message. What happens, and how do you make it safe?](./053-003-a-consumer-crashes-after-saving-to-the-database-but-before-acknowledging-the-message-what-happens-and-how-do-you-make-it-safe.md) — Failed
4. [An API successfully saves an order but fails to publish OrderCreated to RabbitMQ. How do you prevent losing the event?](./053-004-an-api-successfully-saves-an-order-but-fails-to-publish-ordercreated-to-rabbitmq-how-do-you-prevent-losing-the-event.md) — Failed
5. [A poison message keeps retrying and blocks useful work. What retry and DLQ strategy would you design?](./053-005-a-poison-message-keeps-retrying-and-blocks-useful-work-what-retry-and-dlq-strategy-would-you-design.md) — Failed
6. [A notification service receives duplicate OrderCreated events. How should the consumer behave?](./053-006-a-notification-service-receives-duplicate-ordercreated-events-how-should-the-consumer-behave.md) — Failed
7. [A message was published but no consumer received it. What configuration and runtime checks would you perform?](./053-007-a-message-was-published-but-no-consumer-received-it-what-configuration-and-runtime-checks-would-you-perform.md) — Failed
8. [A new consumer version cannot read old messages. How would you handle message contract versioning?](./053-008-a-new-consumer-version-cannot-read-old-messages-how-would-you-handle-message-contract-versioning.md) — Failed
9. [The business needs strict ordering for account balance events. How would you design the queues and consumers?](./053-009-the-business-needs-strict-ordering-for-account-balance-events-how-would-you-design-the-queues-and-consumers.md) — Failed
10. [RabbitMQ goes down for 10 minutes while the API is still receiving requests. What should happen?](./053-010-rabbitmq-goes-down-for-10-minutes-while-the-api-is-still-receiving-requests-what-should-happen.md) — Failed
11. [A consumer is too slow because it calls a third-party API for every message. How would you redesign it?](./053-011-a-consumer-is-too-slow-because-it-calls-a-third-party-api-for-every-message-how-would-you-redesign-it.md) — Failed
12. [A deployment accidentally creates a queue with a wrong routing key. How would you detect and recover?](./053-012-a-deployment-accidentally-creates-a-queue-with-a-wrong-routing-key-how-would-you-detect-and-recover.md) — Failed
13. [A batch job publishes one million messages and overwhelms consumers. How do you protect the system?](./053-013-a-batch-job-publishes-one-million-messages-and-overwhelms-consumers-how-do-you-protect-the-system.md) — Failed
14. [A consumer logs sensitive customer data from message payloads. What should change?](./053-014-a-consumer-logs-sensitive-customer-data-from-message-payloads-what-should-change.md) — Failed
15. [You are asked to replace synchronous API calls with RabbitMQ. What questions do you ask before agreeing?](./053-015-you-are-asked-to-replace-synchronous-api-calls-with-rabbitmq-what-questions-do-you-ask-before-agreeing.md) — Failed
16. [A manager asks why a user sees pending status after submitting a request. How do you explain eventual consistency?](./053-016-a-manager-asks-why-a-user-sees-pending-status-after-submitting-a-request-how-do-you-explain-eventual-consistency.md) — Failed
17. [You need to migrate from one message contract to another without downtime. What steps would you take?](./053-017-you-need-to-migrate-from-one-message-contract-to-another-without-downtime-what-steps-would-you-take.md) — Failed
18. [A dead-letter queue contains thousands of messages. How do you triage, replay, and prevent recurrence?](./053-018-a-dead-letter-queue-contains-thousands-of-messages-how-do-you-triage-replay-and-prevent-recurrence.md) — Failed
19. [A service publishes a message inside a database transaction. What can go wrong?](./053-019-a-service-publishes-a-message-inside-a-database-transaction-what-can-go-wrong.md) — Failed
20. [How would you design RabbitMQ messaging for order creation, payment capture, invoice generation, and email notification?](./053-020-how-would-you-design-rabbitmq-messaging-for-order-creation-payment-capture-invoice-generation-and-email-notification.md) — Failed
