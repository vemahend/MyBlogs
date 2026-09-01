# Day 4 AWS Certified Cloud Practitioner (CLF-C02)

## Day 4: Billing, Pricing, and Support

Domain 4 represents **12% of the scored exam content**. It is the smallest domain, but its questions are often straightforward when you can distinguish the pricing and cost-management options.

### Learning goals

By the end of this lesson, you should understand:

1. EC2 compute purchasing options
2. Storage and data-transfer pricing concepts
3. AWS billing and cost-management tools
4. AWS Organizations and consolidated billing
5. AWS Support plans and technical resources
6. AWS Partners, Marketplace, and professional assistance

---

## 1. AWS pricing principles

AWS pricing generally follows three broad ideas:

- Pay for what you use
- Obtain lower prices when you commit to certain usage
- Benefit from lower unit costs at larger scale for some services

Different services use different billing measurements, such as:

- Compute time
- Number of requests
- Amount of stored data
- Data transferred
- Provisioned capacity
- Number of users or devices

> **Important:** Using the cloud does not automatically make every workload inexpensive. Costs still need to be monitored, controlled, and optimized.

---

## 2. EC2 purchasing options

The exam expects you to select the appropriate purchasing option for a scenario.

### 2.1 On-Demand Instances

On-Demand Instances let you use EC2 capacity without making a long-term commitment.

Best suited for:

- New or unpredictable workloads
- Short-term applications
- Development and testing
- Workloads that cannot be interrupted
- Situations where future usage is unknown

Main benefit: flexibility.

Main trade-off: typically costs more than discounted commitment options for steady long-term usage.

> **Memory clue:** On-Demand = Flexible, no long-term commitment.

### 2.2 Reserved Instances

Reserved Instances provide a billing discount in exchange for a one-year or three-year commitment to a defined amount of EC2 usage.

Best suited for:

- Predictable workloads
- Applications that run continuously
- Stable long-term requirements

Important distinction:

> A Reserved Instance is primarily a **pricing benefit**, not a physical server reserved only for you.

#### Standard Reserved Instances

- Usually provide a larger discount
- Offer less flexibility to change attributes
- Suitable for steady and well-understood usage

#### Convertible Reserved Instances

- Offer greater flexibility to exchange for another eligible configuration
- Usually provide a smaller discount than Standard Reserved Instances

#### Regional and zonal scope

- A regional Reserved Instance can provide a billing discount across eligible usage in a Region.
- A zonal Reserved Instance can include a capacity reservation in a particular Availability Zone.

Within AWS Organizations, eligible Reserved Instance discounts can be shared across member accounts when discount sharing is enabled.

> **Memory clue:** Reserved Instance = Predictable EC2 usage plus commitment for a discount.

### 2.3 Savings Plans

Savings Plans provide savings in exchange for committing to a consistent amount of compute usage per hour for one or three years.

They can be more flexible than Reserved Instances because the commitment is based on compute spending rather than reserving only a particular instance configuration.

Common categories include:

- **Compute Savings Plans:** More flexible across eligible compute options
- **EC2 Instance Savings Plans:** More specific to an EC2 instance family in a selected Region, usually in exchange for a potentially larger discount

> **Memory clue:** Savings Plan = Commit to a level of compute spending.

### 2.4 Spot Instances

Spot Instances use spare EC2 capacity at a potentially significant discount. AWS can interrupt them when the capacity is needed elsewhere.

Best suited for workloads that are:

- Fault-tolerant
- Flexible about timing
- Able to pause, restart, or distribute work

Examples:

- Batch processing
- Data analysis
- Rendering
- Testing
- Certain containerized workloads

Not ideal for:

- A critical database that cannot be interrupted
- A single production server with no failover
- Work that cannot recover from interruption

> **Memory clue:** Spot = Lowest-cost spare capacity, but it can be interrupted.

### 2.5 Dedicated Hosts

A Dedicated Host is a physical server dedicated to one customer. The customer can see and control how instances are placed on that server.

It can be useful for:

- Certain server-bound software licences
- Compliance requirements
- Workloads requiring visibility into physical sockets or cores

### 2.6 Dedicated Instances

Dedicated Instances run on hardware dedicated to a single customer account, but the customer does not receive the same host-level placement visibility and control as with Dedicated Hosts.

### 2.7 Capacity Reservations

An On-Demand Capacity Reservation reserves EC2 capacity for you in a specific Availability Zone.

Use it when:

- The application must launch in a particular AZ
- Capacity availability is more important than obtaining a pricing discount

A Capacity Reservation does not automatically provide a billing discount. Eligible discounted pricing may apply separately.

> **Memory clue:** Capacity Reservation = Guarantee capacity, not necessarily a discount.

---

## 3. Compute option comparison

| Requirement | Best match |
|---|---|
| No commitment and unpredictable usage | On-Demand Instances |
| Predictable EC2 usage for one or three years | Reserved Instances |
| Commit to consistent compute spending with flexibility | Savings Plans |
| Fault-tolerant workload that can be interrupted | Spot Instances |
| Dedicated physical server and licence/host control | Dedicated Host |
| Single-tenant hardware without host-level control | Dedicated Instances |
| Guaranteed capacity in a particular Availability Zone | Capacity Reservation |

### Scenario examples

**Scenario 1:** A new application is being tested for two weeks, and future usage is unknown.  
**Answer:** On-Demand Instances.

**Scenario 2:** A batch-processing job can restart if AWS interrupts it.  
**Answer:** Spot Instances.

**Scenario 3:** A production application runs continuously with stable usage for three years.  
**Answer:** Consider Reserved Instances or Savings Plans.

**Scenario 4:** A licence must be associated with the sockets of a dedicated physical server.  
**Answer:** Dedicated Host.

**Scenario 5:** A disaster-recovery system must be able to launch immediately in a particular AZ.  
**Answer:** Capacity Reservation.

---

## 4. Storage pricing and tiers

Storage cost depends on factors such as:

- Amount of data stored
- Storage class or volume type
- Number and type of requests
- Retrieval amount
- Retrieval speed
- Data transfer
- Minimum storage duration for some archival classes

### S3 pricing idea

Frequently accessed storage generally has a higher storage price but fewer retrieval trade-offs. Archival storage can have a lower storage price but may involve retrieval fees, minimum durations, or slower access.

| Requirement | Example storage class |
|---|---|
| Frequently accessed objects | S3 Standard |
| Unknown or changing access patterns | S3 Intelligent-Tiering |
| Infrequent data requiring rapid access | S3 Standard-IA |
| Long-term archive | S3 Glacier classes |
| Lowest-cost deep archive | S3 Glacier Deep Archive |

> Do not choose an archive tier only because its storage price is low. Consider retrieval time, retrieval fees, and how often the data is accessed.

### Lifecycle policies

S3 lifecycle policies can automatically move data to lower-cost storage classes or delete it after a defined period.

Example:

- Days 0–30: S3 Standard
- Days 31–365: Infrequent-access class
- After one year: Archive class
- After seven years: Delete, if permitted by business requirements

---

## 5. Data-transfer pricing concepts

AWS data-transfer cost depends on the source, destination, service, and direction of traffic.

General exam-level ideas:

- Data transfer **into AWS** is commonly free for many services.
- Data transfer **out to the internet** commonly has a charge.
- Transfer between Regions commonly has a charge.
- Transfer between Availability Zones can have a charge.
- Transfer rules vary by service, path, and Region.

> **Memory clue:** Data coming in is commonly less expensive or free; data going out is commonly chargeable. Always check the service's current pricing page for a real implementation.

### Example

A company uploads application backups from its office to S3. The incoming transfer might not carry a data-transfer charge. If customers then download a large amount of that data from AWS to the internet, outbound transfer charges may apply.

---

## 6. AWS Pricing Calculator

AWS Pricing Calculator helps estimate the cost of a planned AWS architecture before or while designing it.

Use it to:

- Estimate monthly costs
- Compare architectural options
- Model expected usage
- Share cost estimates
- Plan a migration or new workload

> **Exam clue:** Future or planned cost estimate = AWS Pricing Calculator.

It provides an estimate, not a guarantee. Actual cost depends on real usage and configuration.

---

## 7. AWS Cost Explorer

AWS Cost Explorer helps visualize, understand, and analyze historical and current AWS costs and usage. It can also provide forecasts based on existing usage patterns.

Use it to:

- View spending trends
- Group cost by service or account
- Find cost changes
- Analyze historical usage
- Forecast likely future spending

> **Exam clue:** Analyze past spending and usage trends = AWS Cost Explorer.

---

## 8. AWS Budgets

AWS Budgets allows you to define budgets and receive alerts when actual or forecast usage or cost reaches selected thresholds.

Examples:

- Alert when monthly cost reaches 80% of a budget
- Alert when forecast spending will exceed a budget
- Track usage or commitment coverage

An AWS Budget does not normally stop resources automatically merely because an alert threshold is reached. It monitors and alerts; selected automated actions can be configured separately.

> **Exam clue:** Notify me before spending exceeds a limit = AWS Budgets.

---

## 9. Cost management comparison

| Question | AWS tool |
|---|---|
| How much might a planned architecture cost? | AWS Pricing Calculator |
| What did we spend, and where did the cost come from? | AWS Cost Explorer |
| Can we receive an alert before exceeding a limit? | AWS Budgets |
| Where can we find the most detailed cost and usage data? | AWS Cost and Usage Report |

### Easy memory aid

- **Calculator:** Estimate before or during planning
- **Explorer:** Analyze costs and trends
- **Budgets:** Monitor thresholds and alert
- **Cost and Usage Report:** Detailed billing data

---

## 10. AWS Cost and Usage Report

The AWS Cost and Usage Report provides detailed information about AWS costs and usage.

It can include:

- Usage quantities
- Service costs
- Pricing details
- Resource information
- Cost allocation tags

Reports can be delivered to an S3 bucket for analysis.

---

## 11. Cost allocation tags

Tags are key-value labels attached to supported AWS resources.

Examples:

```text
Environment = Production
Department  = Payments
Project     = MobileBanking
Owner       = PlatformTeam
```

After eligible tags are activated for cost allocation, they can help categorize and report costs.

Use cases:

- Determine the cost of each project
- Compare production and development expenditure
- Allocate charges to departments
- Identify the owner of a resource

### Tagging limitation

Tags are useful only when an organization applies a consistent tagging strategy. Missing or inconsistent tags make cost allocation difficult.

---

## 12. AWS Organizations

AWS Organizations helps centrally manage multiple AWS accounts.

Capabilities include:

- Group accounts into organizational units
- Apply governance policies
- Centrally manage accounts
- Use consolidated billing
- Share eligible volume pricing and discounts

### Consolidated billing

Consolidated billing combines usage from member accounts into one bill for the management account.

Benefits include:

- One bill for multiple accounts
- Easier cost tracking
- Potential aggregated usage benefits
- Sharing eligible discounts across accounts

Each member account can still have its costs identified separately.

### Service control policies

Service control policies (SCPs) define the maximum available permissions for accounts in an organization. They do not directly grant permissions.

> **Important:** An SCP is a guardrail. IAM policies still grant permissions within that boundary.

---

## 13. AWS Support resources

### AWS Support Center

The AWS Support Center is used to create and manage support cases and access support-related information available under the account's plan.

### AWS documentation

Official AWS documentation explains how services operate and how to configure them.

### AWS whitepapers

Whitepapers provide guidance about architecture, security, economics, migration, and best practices.

### AWS Knowledge Center

Provides answers and guidance for common technical and account questions.

### AWS re:Post

AWS re:Post is a community-based knowledge and question-and-answer resource for AWS topics.

### AWS Prescriptive Guidance

Provides strategies, guides, and patterns based on experience with cloud migration, modernization, and operation.

### AWS blogs

AWS blogs provide announcements, technical examples, architecture discussions, and service guidance.

---

## 14. AWS Support plans

The exam guide identifies these customer assistance and AWS Support options:

- Customer service and communities
- Developer Support
- Business Support
- Enterprise On-Ramp Support
- Enterprise Support

The precise features, response targets, and prices of plans can change. For exam preparation, understand their relative purpose.

| Support level | General purpose |
|---|---|
| Customer service and communities | Account/billing help, documentation, and community resources |
| Developer Support | Development and early experimentation requiring technical guidance |
| Business Support | Production workloads requiring broader technical support |
| Enterprise On-Ramp Support | Business-critical workloads needing enhanced guidance and account support |
| Enterprise Support | Mission-critical organizations requiring the highest level of proactive support |

### Selecting a plan

- Learning or experimenting: basic resources or Developer Support may be appropriate.
- Running production systems: Business Support provides stronger production assistance.
- Running business-critical systems: Enterprise On-Ramp provides enhanced support.
- Running mission-critical enterprise operations: Enterprise Support provides the most comprehensive support relationship.

> **Exam approach:** Select based on workload criticality, required guidance, and desired response level—not simply the cheapest option.

---

## 15. AWS Trusted Advisor

Trusted Advisor evaluates an AWS environment and provides best-practice recommendations in categories such as:

- Cost optimization
- Performance
- Security
- Fault tolerance
- Service limits or quotas
- Operational excellence

Examples:

- Identify an idle or underutilized resource
- Find a security configuration concern
- Recommend improvements to resilience

The number and depth of available checks can depend on the support arrangement and AWS offering.

---

## 16. AWS Health Dashboard and AWS Health API

### AWS Health Dashboard

Provides information about AWS service events and account-specific events that may affect the customer's resources.

It helps answer:

- Is an AWS event affecting my resources?
- Is scheduled maintenance planned for my environment?
- What actions does AWS recommend?

### AWS Health API

Provides programmatic access to AWS Health information, allowing organizations to integrate health events into their tools and automation where available.

### CloudWatch vs AWS Health Dashboard

- **CloudWatch:** Monitors your resource and application metrics, logs, and alarms.
- **AWS Health Dashboard:** Shows AWS events that may affect your account or resources.

---

## 17. Trust and Safety

The AWS Trust and Safety team handles reports of abuse involving AWS resources.

Examples can include:

- Spam
- Malware
- Phishing
- Abusive or prohibited content
- Attacks originating from AWS resources

> **Exam clue:** Report abuse of AWS resources = AWS Trust and Safety team.

---

## 18. AWS Partner Network

The AWS Partner Network (APN) is a global community of organizations that build solutions or provide services using AWS.

### Independent software vendors

Independent software vendors create software products that run on or integrate with AWS.

### System integrators

System integrators help customers design, migrate, integrate, and operate AWS solutions.

### Partner benefits

Potential benefits can include:

- Training and certification resources
- Technical and business guidance
- Partner events
- Programs and incentives
- Volume discounts in eligible programs

---

## 19. AWS Marketplace

AWS Marketplace is a digital catalogue for finding, purchasing, deploying, and managing third-party software and services that run on AWS.

Examples include:

- Security products
- Monitoring tools
- Database software
- Operating systems
- Machine-learning products
- Professional services

Marketplace can simplify procurement, billing, governance, licences, and software entitlements.

> **Difference:** APN is the partner ecosystem; AWS Marketplace is where customers find and purchase partner offerings.

---

## 20. AWS Professional Services and solutions architects

### AWS Professional Services

AWS Professional Services can help organizations plan and deliver cloud initiatives, such as migration and modernization programs.

### AWS solutions architects

AWS solutions architects provide architectural guidance to help customers design suitable AWS solutions.

These resources provide human expertise, while services such as Trusted Advisor provide automated checks and recommendations.

---

## Master comparison table

| Requirement | Best match |
|---|---|
| Flexible EC2 capacity with no commitment | On-Demand Instances |
| Predictable EC2 usage with a term commitment | Reserved Instances |
| Discount for committed compute spending | Savings Plans |
| Interruptible, fault-tolerant processing | Spot Instances |
| Dedicated server with host-level control | Dedicated Host |
| Guaranteed EC2 capacity in an AZ | Capacity Reservation |
| Estimate a planned architecture's cost | AWS Pricing Calculator |
| Analyze historical costs and usage | AWS Cost Explorer |
| Alert when spending approaches a threshold | AWS Budgets |
| Obtain detailed cost and usage data | AWS Cost and Usage Report |
| Categorize resource costs | Cost allocation tags |
| Centrally manage multiple AWS accounts | AWS Organizations |
| Obtain automated best-practice recommendations | AWS Trusted Advisor |
| View AWS events affecting your resources | AWS Health Dashboard |
| Create and manage a support case | AWS Support Center |
| Ask the AWS community a technical question | AWS re:Post |
| Find migration and modernization patterns | AWS Prescriptive Guidance |
| Purchase third-party AWS software | AWS Marketplace |
| Report abusive activity using AWS resources | AWS Trust and Safety |

---

## Day 4 memory sheet

- **On-Demand:** Flexible; no term commitment
- **Reserved Instance:** Predictable EC2 usage and commitment
- **Savings Plans:** Commit to compute spending
- **Spot:** Discounted spare capacity that can be interrupted
- **Dedicated Host:** Dedicated physical server with host-level control
- **Capacity Reservation:** Guaranteed AZ capacity
- **Pricing Calculator:** Estimate planned cost
- **Cost Explorer:** Analyze spending and trends
- **Budgets:** Thresholds and alerts
- **Cost and Usage Report:** Detailed billing data
- **Cost allocation tags:** Categorize costs
- **Organizations:** Manage multiple accounts and consolidated billing
- **Trusted Advisor:** Best-practice recommendations
- **Health Dashboard:** AWS events affecting your resources
- **Marketplace:** Find and purchase third-party products

---

## Quick quiz

Try answering before checking the answer key:

1. Which EC2 purchasing option has no long-term commitment?
2. Which option is appropriate for interruptible batch processing?
3. Which options suit stable, predictable compute usage over one or three years?
4. What is the difference between a Dedicated Host and a Dedicated Instance?
5. Does a Capacity Reservation automatically provide a pricing discount?
6. Which tool estimates the cost of a planned AWS architecture?
7. Which tool analyzes historical spending and usage trends?
8. Which service alerts you when forecast spending approaches a threshold?
9. Which report provides detailed cost and usage information?
10. How do cost allocation tags help an organization?
11. What is consolidated billing?
12. Does a service control policy directly grant permissions?
13. Which service provides automated best-practice recommendations?
14. Which dashboard shows AWS events that may affect your resources?
15. Where do you create and manage AWS support cases?
16. Which AWS resource provides community questions and answers?
17. Where can customers purchase third-party software for AWS?
18. What is the difference between an independent software vendor and a system integrator?
19. Who should be contacted to report abuse involving AWS resources?
20. Which type of support is intended for the most mission-critical enterprise environments?

## Answer key

1. On-Demand Instances
2. Spot Instances
3. Reserved Instances or Savings Plans, depending on the commitment and flexibility required
4. A Dedicated Host provides host-level placement and physical-server visibility; Dedicated Instances provide single-tenant hardware without the same host-level control.
5. No. It guarantees capacity; discounted pricing is separate.
6. AWS Pricing Calculator
7. AWS Cost Explorer
8. AWS Budgets
9. AWS Cost and Usage Report
10. They categorize costs by project, team, environment, owner, or another business dimension.
11. Combining billing for multiple member accounts into one bill through AWS Organizations
12. No. It defines the maximum permission boundary; IAM policies grant permissions within it.
13. AWS Trusted Advisor
14. AWS Health Dashboard
15. AWS Support Center
16. AWS re:Post
17. AWS Marketplace
18. An independent software vendor builds software; a system integrator helps customers design, migrate, integrate, and operate solutions.
19. AWS Trust and Safety
20. Enterprise Support

---

*Based on Content Domain 4 of the AWS Certified Cloud Practitioner Exam Guide (CLF-C02). Support-plan features and pricing can change, so consult current AWS information before purchasing a plan.*
