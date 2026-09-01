# Day 5 AWS Certified Cloud Practitioner (CLF-C02)

## Day 5: Final Revision and Mock Exam

You have now covered all four content domains from the exam guide:

| Domain | Weight |
|---|---:|
| Cloud Concepts | 24% |
| Security and Compliance | 30% |
| Cloud Technology and Services | 34% |
| Billing, Pricing, and Support | 12% |

This lesson contains:

1. A rapid revision guide
2. Commonly confused AWS concepts
3. A 40-question weighted mock exam
4. An answer key with explanations
5. A method for reviewing weak topics

---

# Part 1: Rapid revision

## Cloud benefits

| Concept | Meaning |
|---|---|
| Agility | Create, test, and change resources quickly |
| Elasticity | Add or remove capacity as demand changes |
| Scalability | Increase a system's capacity to support growth |
| High availability | Continue operating when part of a system fails |
| Fault tolerance | Continue operating with little or no interruption despite component failure |
| Global reach | Deploy services close to users around the world |
| Pay as you go | Pay according to actual resource consumption |

### Agility vs elasticity

- **Agility:** How quickly can the company experiment or make changes?
- **Elasticity:** How automatically can capacity grow and shrink with demand?

### High availability vs fault tolerance

- **High availability:** Reduces downtime and recovers or redirects when failure occurs.
- **Fault tolerance:** Designed to continue with little or no interruption when a component fails.

---

## AWS Well-Architected pillars

1. Operational Excellence
2. Security
3. Reliability
4. Performance Efficiency
5. Cost Optimization
6. Sustainability

| Scenario | Pillar |
|---|---|
| Automate deployments and learn from operational events | Operational Excellence |
| Protect identities and encrypt information | Security |
| Recover from failure | Reliability |
| Select technology that efficiently meets demand | Performance Efficiency |
| Remove unused and oversized resources | Cost Optimization |
| Reduce energy and resource consumption | Sustainability |

---

## Migration strategies

| Strategy | Memory aid |
|---|---|
| Rehost | Move it without major changes |
| Replatform | Move it and make small cloud improvements |
| Refactor | Redesign it for cloud capabilities |
| Repurchase | Replace it with another product |
| Retain | Keep it where it is |
| Retire | Remove it |
| Relocate | Move infrastructure without redesigning workloads |

---

## Shared responsibility model

> **AWS protects the cloud. The customer protects what they put in and configure on the cloud.**

### AWS normally manages

- Physical data centres
- Hardware
- Foundational networking
- Virtualization infrastructure

### Customer normally manages

- Data
- Identities and permissions
- Application code
- Secure configuration
- Guest operating-system patching on EC2

The more managed the service, the more operational work AWS performs:

- **EC2:** Customer manages the guest operating system.
- **RDS:** AWS manages the underlying operating system and much database maintenance.
- **Lambda:** AWS manages servers and runtime infrastructure; the customer manages code, permissions, dependencies, and data.

---

## Identity and security

| Concept or service | Main purpose |
|---|---|
| IAM | Manage AWS identities and permissions |
| IAM role | Provide temporary permissions |
| IAM Identity Center | Centrally manage workforce access and single sign-on |
| MFA | Require more than one authentication factor |
| Least privilege | Grant only the permissions required |
| AWS KMS | Manage encryption keys |
| Secrets Manager | Store and rotate application secrets |

### Authentication vs authorization

- **Authentication:** Who are you?
- **Authorization:** What are you allowed to do?

---

## Security service comparison

| Question | Service |
|---|---|
| Who performed an AWS API action? | AWS CloudTrail |
| What are the resource metrics, logs, and alarms? | Amazon CloudWatch |
| How is a resource configured, and did it change? | AWS Config |
| Where are AWS compliance reports? | AWS Artifact |
| Is suspicious activity occurring? | Amazon GuardDuty |
| Does a supported workload have vulnerabilities? | Amazon Inspector |
| Where can security findings be viewed centrally? | AWS Security Hub |
| How can web requests be filtered? | AWS WAF |
| How can an application receive DDoS protection? | AWS Shield |
| How can firewall policies be managed across accounts? | AWS Firewall Manager |
| Where can best-practice recommendations be found? | AWS Trusted Advisor |

---

## Global infrastructure

| Component | Meaning |
|---|---|
| Region | Separate geographical AWS area |
| Availability Zone | Isolated infrastructure location within a Region |
| Edge location | Location used to deliver content closer to users |

- Use **multiple AZs** for high availability within a Region.
- Use **multiple Regions** for requirements such as regional disaster recovery, global latency, business continuity, or data sovereignty.
- Use **CloudFront edge locations** to cache and deliver content closer to users.

---

## Compute and containers

| Requirement | Service |
|---|---|
| Virtual server and operating-system control | Amazon EC2 |
| Run event-driven functions | AWS Lambda |
| AWS-native container orchestration | Amazon ECS |
| Managed Kubernetes | Amazon EKS |
| Run containers without managing hosts | AWS Fargate |
| Store container images | Amazon ECR |
| Automatically adjust EC2 capacity | EC2 Auto Scaling |
| Distribute traffic across healthy targets | Elastic Load Balancing |

---

## Database services

| Requirement | Service |
|---|---|
| Managed relational database | Amazon RDS |
| AWS-built MySQL/PostgreSQL-compatible database | Amazon Aurora |
| Serverless NoSQL key-value/document database | Amazon DynamoDB |
| In-memory cache | Amazon ElastiCache |
| Data warehouse | Amazon Redshift |
| Move or replicate database data | AWS DMS |
| Convert database schema | AWS SCT |

---

## Networking

| Requirement | Service or component |
|---|---|
| Isolated virtual network | Amazon VPC |
| Domain Name System | Amazon Route 53 |
| Content delivery network | Amazon CloudFront |
| Encrypted connection over the internet | AWS Site-to-Site VPN |
| Dedicated private connection | AWS Direct Connect |
| Public internet connection for a VPC | Internet gateway |
| Outbound internet access for private resources | NAT gateway |

### Security group vs network ACL

| Feature | Security group | Network ACL |
|---|---|---|
| Level | Resource/instance | Subnet |
| State | Stateful | Stateless |
| Rules | Allow | Allow and deny |

---

## Storage

| Requirement | Service |
|---|---|
| Object storage | Amazon S3 |
| Persistent block storage for EC2 | Amazon EBS |
| Temporary local EC2 storage | Instance store |
| Shared Linux file system | Amazon EFS |
| Managed specialized file systems | Amazon FSx |
| Hybrid connection to cloud storage | AWS Storage Gateway |
| Centralized backup management | AWS Backup |

### S3 storage classes

- **S3 Standard:** Frequent access
- **S3 Intelligent-Tiering:** Unknown or changing access
- **S3 Standard-IA:** Infrequent access requiring rapid retrieval
- **S3 One Zone-IA:** Reproducible, infrequently accessed data in one AZ
- **S3 Glacier classes:** Archive data
- **S3 Glacier Deep Archive:** Lowest-cost long-term archive with slow retrieval

---

## Analytics and AI

| Requirement | Service |
|---|---|
| Build, train, and deploy ML models | Amazon SageMaker AI |
| Create conversational bots | Amazon Lex |
| Query S3 using SQL | Amazon Athena |
| Process streaming data | Amazon Kinesis |
| Data integration and ETL | AWS Glue |
| Business-intelligence dashboards | Amazon QuickSight |

---

## Application integration

| Service | Main pattern |
|---|---|
| Amazon SQS | Queue work for later asynchronous processing |
| Amazon SNS | Publish one message to multiple subscribers |
| Amazon EventBridge | Route events by rules and event content |

---

## Pricing and cost tools

| Requirement | Option or tool |
|---|---|
| Flexible EC2 use with no commitment | On-Demand Instances |
| Predictable EC2 use with term commitment | Reserved Instances |
| Commit to compute spending | Savings Plans |
| Interruptible spare EC2 capacity | Spot Instances |
| Dedicated physical server with host control | Dedicated Host |
| Guarantee EC2 capacity in one AZ | Capacity Reservation |
| Estimate a planned architecture | AWS Pricing Calculator |
| Analyze historical spending | AWS Cost Explorer |
| Receive threshold alerts | AWS Budgets |
| Detailed cost data | AWS Cost and Usage Report |

---

# Part 2: Mock exam instructions

- Allow yourself **50 minutes**.
- Do not use the notes while answering.
- Questions marked **Choose TWO** have two correct answers.
- Record your answers before opening the answer key.
- Award one point only when the complete answer is correct.
- Suggested practice target: **32 out of 40 (80%)**.

This is an original practice test based on the exam guide, not an official AWS examination.

---

# Part 3: 40-question mock exam

## Domain 1: Cloud Concepts

### Question 1

A retail application automatically adds servers during a holiday sale and removes them after demand falls. Which cloud benefit does this demonstrate?

A. Agility  
B. Elasticity  
C. Governance  
D. Data sovereignty

### Question 2

A development team can create an experimental environment in minutes and delete it when testing finishes. Which cloud benefit is demonstrated?

A. Agility  
B. Fault isolation  
C. Consolidated billing  
D. Dedicated tenancy

### Question 3

A company deploys its application in two Availability Zones so traffic can continue if one AZ fails. Which Well-Architected pillar is most directly addressed?

A. Sustainability  
B. Cost Optimization  
C. Reliability  
D. Operational Excellence

### Question 4

A company replaces manual deployments with a repeatable automated pipeline and regularly improves its operational procedures. Which pillar is most relevant?

A. Operational Excellence  
B. Security  
C. Sustainability  
D. Performance Efficiency

### Question 5

A company moves an existing application to EC2 without changing its architecture. Which migration strategy is this?

A. Refactor  
B. Replatform  
C. Rehost  
D. Repurchase

### Question 6

A company moves a self-managed database to Amazon RDS and makes only small changes. Which migration strategy is this?

A. Retire  
B. Replatform  
C. Rehost  
D. Retain

### Question 7

A company redesigns a large application as event-driven serverless functions. Which migration strategy is this?

A. Refactor  
B. Rehost  
C. Relocate  
D. Retain

### Question 8

Which activity is an example of rightsizing?

A. Moving an application to a second Region  
B. Replacing an underused EC2 instance with an appropriately smaller type  
C. Purchasing a physical server for future demand  
D. Giving all developers administrator access

### Question 9

Which is primarily a variable cloud cost?

A. Constructing a data centre  
B. Purchasing physical servers  
C. Paying for compute hours consumed  
D. Buying cooling equipment

### Question 10 — Choose TWO

Why might a company deploy applications in multiple AWS Regions?

A. Regional disaster recovery  
B. Eliminate all customer security responsibilities  
C. Meet data-sovereignty requirements  
D. Make every AWS service free  
E. Avoid using IAM

---

## Domain 2: Security and Compliance

### Question 11

Under the shared responsibility model, who protects AWS physical data centres?

A. The customer  
B. AWS  
C. The customer's internet provider  
D. AWS Marketplace vendors

### Question 12

Who is normally responsible for patching the guest operating system on an EC2 instance?

A. AWS  
B. The customer  
C. Amazon GuardDuty  
D. AWS Support

### Question 13

Which task does AWS normally perform for Amazon RDS?

A. Classify the customer's business data  
B. Define the customer's database users  
C. Maintain the underlying operating system  
D. Write secure application queries

### Question 14

Which security principle grants a user only the permissions required for their job?

A. Elasticity  
B. Least privilege  
C. Economies of scale  
D. High availability

### Question 15

An EC2 application needs temporary permission to read one S3 bucket. What is the preferred solution?

A. Store root access keys in the application  
B. Assign an IAM role with the required permission  
C. Make the bucket public  
D. Give every developer administrator access

### Question 16

Which service records AWS API and account activity and can help identify who deleted a resource?

A. Amazon CloudWatch  
B. AWS CloudTrail  
C. AWS Artifact  
D. Amazon Inspector

### Question 17

Which service evaluates resource configurations and records how those configurations change?

A. AWS Config  
B. AWS Shield  
C. Amazon SNS  
D. AWS Pricing Calculator

### Question 18

Where can a customer obtain AWS compliance reports?

A. Amazon Route 53  
B. AWS Artifact  
C. AWS Lambda  
D. Amazon ECR

### Question 19

Which service detects suspicious or potentially malicious activity in an AWS environment?

A. Amazon GuardDuty  
B. AWS CloudFormation  
C. Amazon QuickSight  
D. Amazon EFS

### Question 20

Which service scans supported workloads for software vulnerabilities and unintended network exposure?

A. Amazon Inspector  
B. Amazon Connect  
C. AWS DMS  
D. Amazon Athena

### Question 21

Which service helps protect a web application from SQL injection and cross-site scripting?

A. AWS Shield  
B. AWS WAF  
C. AWS KMS  
D. AWS Direct Connect

### Question 22 — Choose TWO

Which actions help protect the AWS account root user?

A. Enable MFA  
B. Use the root user for everyday administration  
C. Share the root password with developers  
D. Avoid creating root access keys unless absolutely necessary  
E. Store root credentials in application source code

---

## Domain 3: Cloud Technology and Services

### Question 23

A company needs complete control of the guest operating system for a long-running application. Which service should it use?

A. AWS Lambda  
B. Amazon EC2  
C. Amazon SNS  
D. Amazon QuickSight

### Question 24

An image uploaded to S3 must automatically trigger short-running code that creates a thumbnail. Which service is the best fit?

A. AWS Lambda  
B. Amazon WorkSpaces  
C. AWS Direct Connect  
D. Amazon Redshift

### Question 25

A company wants to run containers without managing EC2 hosts. Which service should it use?

A. AWS Fargate  
B. Amazon Route 53  
C. Amazon EBS  
D. AWS Artifact

### Question 26

Which service provides managed Kubernetes?

A. Amazon ECS  
B. Amazon EKS  
C. Amazon ECR  
D. Amazon SES

### Question 27

Which service provides a managed relational database?

A. Amazon DynamoDB  
B. Amazon RDS  
C. Amazon SQS  
D. Amazon CloudFront

### Question 28

Which database is a serverless NoSQL key-value and document database?

A. Amazon Aurora  
B. Amazon Redshift  
C. Amazon DynamoDB  
D. Amazon ElastiCache

### Question 29

Which service helps migrate or continuously replicate database data with minimal downtime?

A. AWS DMS  
B. AWS SCT  
C. AWS WAF  
D. AWS Config

### Question 30

A private-subnet EC2 instance must download software updates from the internet without accepting internet-initiated inbound connections. Which component should be used?

A. Internet gateway attached directly to the instance  
B. NAT gateway  
C. Amazon CloudFront  
D. AWS Artifact

### Question 31

Which statement correctly compares security groups and network ACLs?

A. Both are stateless and support only deny rules.  
B. Security groups operate at subnet level; network ACLs operate at instance level.  
C. Security groups are stateful; network ACLs are stateless.  
D. Network ACLs cannot deny traffic.

### Question 32

Which service translates domain names into network addresses?

A. Amazon Route 53  
B. Amazon CloudFront  
C. Amazon Kinesis  
D. AWS Glue

### Question 33

Which service caches content at edge locations to reduce latency?

A. Amazon EBS  
B. Amazon CloudFront  
C. Amazon RDS  
D. AWS Organizations

### Question 34

Which storage service is designed for objects such as images, documents, backups, and logs?

A. Amazon S3  
B. Amazon EBS  
C. Amazon EFS  
D. EC2 instance store

### Question 35

Which storage option provides persistent block storage for an EC2 instance?

A. Amazon EBS  
B. Amazon SQS  
C. Amazon Route 53  
D. Amazon Lex

### Question 36

Which service allows analysts to query data stored in S3 by using SQL?

A. Amazon Athena  
B. Amazon Kinesis  
C. Amazon Connect  
D. Amazon Inspector

---

## Domain 4: Billing, Pricing, and Support

### Question 37

A fault-tolerant batch-processing workload can restart after interruption. Which EC2 purchasing option can offer the greatest discount for spare capacity?

A. On-Demand Instances  
B. Spot Instances  
C. Dedicated Hosts  
D. Capacity Reservations

### Question 38

Which tool should a solutions architect use to estimate the monthly cost of a planned architecture?

A. AWS Cost Explorer  
B. AWS Pricing Calculator  
C. AWS Budgets  
D. AWS CloudTrail

### Question 39

A finance team wants an alert when forecast monthly spending reaches 80% of a defined amount. Which service should it use?

A. AWS Budgets  
B. AWS Artifact  
C. AWS DMS  
D. Amazon GuardDuty

### Question 40 — Choose TWO

Which are benefits of consolidated billing in AWS Organizations?

A. One bill for multiple member accounts  
B. Elimination of all AWS charges  
C. Easier account-level cost tracking  
D. Automatic administrator access to every workload  
E. Removal of the customer's security responsibilities

---

# Part 4: Answer key and explanations

| Q | Answer | Explanation |
|---:|---|---|
| 1 | B | Elasticity changes capacity as demand rises and falls. |
| 2 | A | Agility allows teams to create and test environments quickly. |
| 3 | C | Reliability covers resilience and recovery from failure. |
| 4 | A | Operational Excellence emphasizes effective operations, automation, and continuous improvement. |
| 5 | C | Rehost means moving a workload without major architectural changes. |
| 6 | B | Replatform means moving while making limited cloud improvements. |
| 7 | A | Refactor means redesigning an application to use new architecture or cloud-native capabilities. |
| 8 | B | Rightsizing matches resource capacity to actual workload needs. |
| 9 | C | Compute consumption changes with usage, making it a variable cost. |
| 10 | A, C | Multiple Regions can support regional disaster recovery and data-sovereignty requirements. |
| 11 | B | AWS is responsible for physical infrastructure security. |
| 12 | B | The customer patches and secures the guest operating system on EC2. |
| 13 | C | As a managed service, RDS includes AWS management of the underlying operating system. |
| 14 | B | Least privilege grants only required permissions. |
| 15 | B | An IAM role supplies temporary permissions without embedding long-term credentials. |
| 16 | B | CloudTrail records AWS API and account activity. |
| 17 | A | AWS Config records configurations and evaluates configuration rules. |
| 18 | B | AWS Artifact provides compliance reports and agreements. |
| 19 | A | GuardDuty analyzes data sources to identify suspicious activity. |
| 20 | A | Inspector scans supported workloads for vulnerabilities and unintended network exposure. |
| 21 | B | WAF filters web requests and protects against common web exploits. |
| 22 | A, D | Enable MFA and avoid root access keys unless they are absolutely necessary. |
| 23 | B | EC2 provides virtual servers and operating-system control. |
| 24 | A | Lambda runs event-driven code without server management. |
| 25 | A | Fargate supplies serverless compute for containers. |
| 26 | B | EKS is the managed Kubernetes service. |
| 27 | B | RDS provides managed relational databases. |
| 28 | C | DynamoDB is a managed serverless NoSQL key-value and document database. |
| 29 | A | DMS migrates and replicates database data; SCT converts schemas. |
| 30 | B | A NAT gateway allows outbound internet connectivity for private-subnet resources. |
| 31 | C | Security groups are stateful; network ACLs are stateless. |
| 32 | A | Route 53 provides DNS and routing capabilities. |
| 33 | B | CloudFront caches and distributes content through edge locations. |
| 34 | A | S3 is object storage. |
| 35 | A | EBS provides persistent block volumes for EC2. |
| 36 | A | Athena performs serverless SQL queries against data in S3. |
| 37 | B | Spot Instances provide discounted spare capacity but can be interrupted. |
| 38 | B | Pricing Calculator estimates planned architecture costs. |
| 39 | A | Budgets monitors actual or forecast amounts and provides threshold alerts. |
| 40 | A, C | Consolidated billing produces one bill and makes account-level cost tracking easier. |

---

# Part 5: Score and review

| Score | Interpretation | Next action |
|---:|---|---|
| 36–40 | Strong | Review mistakes and attempt another mock exam later |
| 32–35 | Good | Review incorrect answers and confusing comparisons |
| 26–31 | Developing | Revisit the weak domains before another test |
| 0–25 | Foundation needs reinforcement | Review Days 1–4 slowly, then retry this exam |

This table is only a practice guide; it does not predict an official exam result.

### Diagnose your weak area

- Questions 1–10: Cloud Concepts
- Questions 11–22: Security and Compliance
- Questions 23–36: Cloud Technology and Services
- Questions 37–40: Billing, Pricing, and Support

For every incorrect answer, write three lines:

```text
Question number:
Why my answer was incorrect:
Rule I will remember next time:
```

Example:

```text
Question number: 16
Why my answer was incorrect: I confused monitoring with auditing.
Rule I will remember next time: CloudWatch monitors; CloudTrail audits API activity.
```

---

## Final ten rules to remember

1. AWS secures **of** the cloud; customers secure **in** the cloud.
2. CloudWatch monitors; CloudTrail audits; Config tracks configurations.
3. EC2 gives server control; Lambda runs functions; Fargate runs serverless containers.
4. RDS is relational; DynamoDB is NoSQL; ElastiCache is in-memory.
5. Route 53 is DNS; CloudFront is content delivery.
6. S3 is object storage; EBS is block storage; EFS is shared file storage.
7. SQS queues work; SNS broadcasts notifications; EventBridge routes events.
8. Pricing Calculator estimates; Cost Explorer analyzes; Budgets alerts.
9. On-Demand is flexible; Reserved and Savings Plans involve commitment; Spot can be interrupted.
10. In multiple-response questions, select every required correct answer and no extra options.

---

*Based on the AWS Certified Cloud Practitioner Exam Guide (CLF-C02). This mock exam contains original study questions and is not affiliated with or endorsed as an official AWS practice exam.*
