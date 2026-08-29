# 2. How do you mentor junior developers?

**Technology:** Leadership and AI-Assisted Engineering

**Source question:** 2. How do you mentor junior developers?

## 1. What is it?

Mentoring junior developers means helping them become confident, independent engineers. It is more than answering technical questions. I help them understand how to break down problems, write maintainable code, test their work, communicate clearly, and learn from mistakes.

My aim is not to give every answer. I provide enough guidance for the developer to make the next decision safely and explain why that decision makes sense.

## 2. Why is it important?

Junior developers often know the syntax but have less experience with production risks, trade-offs, and team practices. Without support, they may repeat avoidable mistakes or become afraid to make decisions.

Good mentoring:

- improves code quality without creating dependency on one senior developer;
- helps juniors contribute useful work sooner;
- spreads domain and system knowledge across the team;
- builds confidence, ownership, and good engineering habits; and
- develops future senior engineers and technical leaders.

It also helps the mentor. Explaining a decision clearly often exposes weak assumptions and improves team standards.

## 3. How does it work?

I first understand the developer's current knowledge, learning style, and goals. Then I agree on small, measurable areas for growth, such as debugging, testing, API design, or communication.

For day-to-day work, I normally use this flow:

1. Give the developer a real task with clear business context and boundaries.
2. Ask them to explain their proposed approach before coding.
3. Use questions to guide their thinking instead of immediately providing the solution.
4. Review the work in small stages and explain the reason behind important feedback.
5. Pair on difficult or high-risk parts, but let the junior control the keyboard and make decisions.
6. After delivery, discuss what worked, what was difficult, and what they should try next time.
7. Gradually reduce support as their judgment improves.

I separate mandatory feedback from suggestions. Security, correctness, and production reliability are mandatory; style preferences should not block progress when the code already follows team standards.

When AI tools are allowed, I teach juniors to use them as assistants, not authorities. They must understand generated code, verify APIs, avoid sharing secrets or customer data, run tests, and remain responsible for the final change.

## 4. Practical example

A junior developer is asked to add a daily payment-limit check to a banking API. I first explain the business rule and risks: currency handling, concurrent requests, duplicate payment retries, and audit requirements.

I ask the developer to draw the request flow and propose tests before implementation. During review, I do not simply say, “Use a transaction.” I ask what happens if two payments arrive at the same time and both read the same available limit. This helps the developer discover the race condition.

We then pair on the transaction boundary and idempotency approach. The junior completes the implementation and adds unit and integration tests. In the next similar task, they design the concurrency handling without my help.

## 5. Scenario-based interview answer

“In one payment team, a junior developer was technically capable but needed frequent help with production-level decisions.

The problem was that giving them complete solutions made delivery faster for that day, but it did not build independence. I decided to give them a small payment-limit feature with clear boundaries and regular checkpoints.

I explained the business context, asked them to propose the design and failure cases, and used questions during pairing and code review. We focused on idempotency, concurrency, logging, and tests. I marked security and correctness issues as required changes, while keeping optional improvements separate. I also asked them to demonstrate the feature and describe what they had learned.

The feature was delivered safely, and the developer later handled a similar change with much less support. My mentoring style is therefore practical and gradual: provide context, let the person think, give timely feedback, and increase ownership as their confidence and judgment grow.”

## 6. Code example

Code is not the main part of mentoring, but a small example shows how I make review feedback specific and educational. Instead of only saying that a method is wrong, I explain the production risk and show the expected pattern:

```csharp
public async Task<PaymentResult> ProcessPaymentAsync(
    PaymentRequest request,
    CancellationToken cancellationToken)
{
    if (request.Amount <= 0)
    {
        return PaymentResult.Rejected("Amount must be greater than zero.");
    }

    var existingPayment = await paymentRepository.FindByIdempotencyKeyAsync(
        request.IdempotencyKey,
        cancellationToken);

    if (existingPayment is not null)
    {
        return PaymentResult.From(existingPayment);
    }

    return await paymentProcessor.ProcessAsync(request, cancellationToken);
}
```

I would discuss three points with the junior: validate important business input, use an idempotency key to avoid processing a retry twice, and pass the `CancellationToken` through asynchronous calls. I would then ask them to identify the remaining race condition and design an integration test for it. In production, the idempotency key also needs a unique database constraint or equivalent atomic protection.

## 7. Common mistakes

- Giving answers too quickly, which teaches the junior to depend on the mentor.
- Assigning only low-value tasks, so the developer never learns the real system.
- Giving vague review comments such as “clean this up” without explaining the risk or expected outcome.
- Rewriting the junior's code in the mentor's preferred style instead of coaching them.
- Providing feedback only when something goes wrong.
- Giving a large amount of feedback at once without identifying the most important changes.
- Treating every junior the same instead of adapting to their experience and learning style.
- Letting AI-generated code pass review when the developer cannot explain or test it.
- Sharing production data, credentials, or private source code with an unapproved AI tool.
- Keeping the junior dependent instead of gradually increasing responsibility.

## 8. Follow-up interview questions

### How do you measure whether mentoring is working?

I look for growing independence, better technical decisions, fewer repeated mistakes, clearer communication, and successful ownership of increasingly complex tasks. I also ask the developer for direct feedback.

### What do you do when a junior keeps making the same mistake?

I check whether my earlier feedback was clear, ask them to explain their understanding, and agree on a concrete action such as a checklist, pairing session, or focused exercise. I follow up on the next task rather than repeating the same comment indefinitely.

### How do you balance mentoring with delivery deadlines?

I use short checkpoints, focused reviews, and tasks with safe boundaries. For urgent or high-risk work I may take a more active role, but I explain the decisions afterward so the deadline does not remove the learning opportunity.
