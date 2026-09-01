# Day 1 AWS Certified Cloud Practitioner (CLF-C02)

## Day 1: Cloud Concepts

Domain 1 represents **24% of the scored exam content**.

### Learning goals

By the end of this lesson, you should understand:

1. Why companies use AWS
2. The AWS Well-Architected Framework
3. Common cloud migration strategies
4. Cloud costs and economics

---

## 1. What is cloud computing?

Cloud computing means renting technology resources—such as servers, storage, databases, and networking—over the internet instead of purchasing and maintaining physical equipment.

### Traditional on-premises approach

To host an ASP.NET Core application, a company might need to:

- Purchase physical servers
- Arrange data-centre space, electricity, and cooling
- Install networking and operating systems
- Maintain and replace equipment
- Predict future capacity
- Wait weeks for new hardware

### AWS cloud approach

Using AWS, the company can:

- Create a virtual server in minutes
- Increase or decrease capacity when required
- Deploy applications in different geographical areas
- Pay according to usage
- Let AWS manage the physical infrastructure

> **Analogy:** On-premises infrastructure is like buying and maintaining your own electricity generator. Cloud computing is like using electricity from a utility company and paying for what you consume.

---

## 2. Benefits of the AWS Cloud

### 2.1 Agility

**Agility is the ability to experiment and make changes quickly.**

For example, your team wants to test a new payment feature. Obtaining a physical test server might take weeks. In AWS, the team can create a test environment in minutes and delete it after the experiment.

> **Remember:** Agility = How quickly can we create, experiment, and change?

### 2.2 Elasticity

**Elasticity means increasing or decreasing resources according to demand.**

Consider an online store:

- Normal day: 1,000 users
- Black Friday: 100,000 users
- After Black Friday: back to 1,000 users

AWS can add resources while traffic is high and remove them when traffic falls.

Without elasticity:

- Too few servers can make the application slow or unavailable.
- Too many servers cause the company to pay for unused capacity.

> **Remember:** Elasticity = Expand when demand rises and shrink when demand falls.

### 2.3 High availability

**High availability means keeping an application accessible when part of the infrastructure fails.**

```text
User requests
     |
Load Balancer
   /       \
Server A  Server B
```

If Server A fails, the load balancer can direct requests to Server B. AWS provides multiple **Availability Zones** within a Region, allowing an application to continue operating if one location has a problem.

> High availability does not mean failures never happen. It means the system is designed to continue operating despite failures.

### 2.4 Global reach

AWS has infrastructure in different geographical locations. A company can place services closer to its customers, reducing **latency**—the time required for data to travel and a response to return.

Important terms:

- **Region:** A geographical AWS location
- **Availability Zone:** One or more isolated data centres inside a Region
- **Edge location:** Infrastructure that delivers cached content closer to users

### 2.5 Faster deployment

A company does not need to wait for physical equipment. Teams can create servers, databases, storage, and complete test environments in minutes by using the AWS Console, command-line tools, or code.

### 2.6 Pay-as-you-go pricing

AWS generally charges according to resource consumption. For example:

- Run a server for a period → pay for that usage
- Store 100 GB in Amazon S3 → pay for the stored data
- Delete an unused resource → stop paying for that resource, subject to the service's pricing rules

---

## 3. AWS Well-Architected Framework

The AWS Well-Architected Framework helps companies design secure, reliable, efficient, cost-effective, and sustainable cloud systems.

| Pillar | Simple meaning | Example |
|---|---|---|
| Operational Excellence | Operate and improve systems effectively | Automate deployments and monitor applications |
| Security | Protect identities, systems, and information | Use permissions, encryption, and auditing |
| Reliability | Handle and recover from failures | Run an application across multiple Availability Zones |
| Performance Efficiency | Use appropriate resources efficiently | Select the correct server or database type |
| Cost Optimization | Avoid unnecessary expenditure | Remove unused servers and rightsize resources |
| Sustainability | Reduce environmental impact | Stop unnecessary development servers at night |

### How to distinguish the pillars

- **Operational Excellence:** Operations, automation, monitoring, and continuous improvement
- **Security:** Protecting identities, systems, and data
- **Reliability:** Preventing disruption and recovering from failure
- **Performance Efficiency:** Choosing technology and capacity that perform efficiently
- **Cost Optimization:** Avoiding unnecessary expenditure
- **Sustainability:** Reducing energy and resource consumption

---

## 4. Migration to AWS

Migration means moving applications, databases, or infrastructure from an existing environment to AWS.

For example, a company might move:

- A web application to Amazon EC2
- A database to Amazon RDS
- Documents and reports to Amazon S3

### Why companies migrate

- Reduce infrastructure management
- Improve availability
- Scale more easily
- Deploy globally
- Increase operational efficiency
- Reduce business risk
- Introduce new products more quickly

### Common migration strategies

| Strategy | Meaning | Simple example |
|---|---|---|
| Rehost | Move without major changes | Move an application from a physical server to EC2 |
| Replatform | Move with small cloud improvements | Move a database to Amazon RDS |
| Refactor | Redesign for cloud capabilities | Convert an application into serverless services |
| Repurchase | Replace the existing product | Replace an internal CRM with a SaaS product |
| Retain | Keep the workload where it is | Keep a regulated legacy system on-premises |
| Retire | Remove a workload that is no longer needed | Shut down an unused application |
| Relocate | Move infrastructure without redesigning workloads | Move virtual machines to an AWS-based environment |

Easy memory aid:

- **Rehost:** Move it
- **Replatform:** Move it and improve it slightly
- **Refactor:** Redesign it
- **Retain:** Keep it
- **Retire:** Remove it

### Database replication

During migration, data can be copied continuously from the existing database to a database in AWS. This can reduce downtime because changes remain synchronized until the company switches to the new system.

---

## 5. Cloud economics

### 5.1 Fixed costs and variable costs

**Fixed costs** are paid before or regardless of actual usage:

- Purchasing servers
- Building a data centre
- Cooling equipment
- Networking hardware
- Long-term maintenance contracts

**Variable costs** change according to usage:

- Compute time
- Storage consumed
- Data transferred
- Number of requests

AWS helps companies exchange large fixed costs for more flexible variable costs.

> **On-premises:** Buy capacity before you need it.  
> **AWS:** Consume capacity when you need it.

### 5.2 Hidden on-premises costs

The server price is not the only cost. On-premises environments may also require:

- Electricity and cooling
- Physical security
- Data-centre space
- Networking equipment
- Hardware replacement
- System administrators
- Backups and disaster-recovery facilities

### 5.3 Rightsizing

**Rightsizing means selecting resources that match the workload's actual requirements.**

If an application uses only 20% of an EC2 instance's capacity, the company might select a smaller instance that still handles the workload.

> Rightsizing does not mean always selecting the smallest resource. It means selecting the appropriate resource.

### 5.4 Economies of scale

AWS purchases and operates enormous amounts of infrastructure for customers worldwide. This scale can lower the average infrastructure cost compared with what many individual companies could achieve by themselves.

> **Analogy:** A wholesaler can generally obtain products more cheaply than an individual buying one product.

### 5.5 Licensing models

- **Bring Your Own License (BYOL):** The company uses an existing eligible software licence in AWS.
- **Licence included:** The software licence cost is included in the price of the AWS resource.

### 5.6 Benefits of automation

Automation can:

- Create infrastructure consistently
- Reduce manual errors
- Scale resources automatically
- Deploy applications faster
- Stop unused resources
- Reduce operational effort and cost

For example, Auto Scaling can add EC2 instances during busy periods and remove them afterwards.

---

## Day 1 memory sheet

- **Agility:** Make changes quickly
- **Elasticity:** Increase and decrease capacity with demand
- **High availability:** Continue operating during failures
- **Global reach:** Serve users through worldwide infrastructure
- **Rightsizing:** Match resources to actual requirements
- **Fixed cost:** Paid regardless of usage
- **Variable cost:** Changes according to usage
- **Economies of scale:** Large-scale operations can reduce unit costs
- **Rehost:** Move without major changes
- **Replatform:** Move with small improvements
- **Refactor:** Redesign for the cloud

---

## Quick quiz

Try answering without reviewing the lesson:

1. An online store automatically adds servers during a sale and removes them afterwards. Which cloud benefit is this?
2. A company runs its application across two Availability Zones. Which benefit is it trying to achieve?
3. Moving an application to EC2 without changing its architecture is which migration strategy?
4. Moving a database to Amazon RDS with a few improvements is which migration strategy?
5. What is the difference between agility and elasticity?
6. Reducing an oversized EC2 instance is known as what?
7. Purchasing physical servers is mainly a fixed or variable cost?
8. Name the six AWS Well-Architected pillars.

## Answer key

1. Elasticity
2. High availability (and improved reliability)
3. Rehost
4. Replatform
5. Agility is the ability to create and change quickly; elasticity changes capacity according to demand.
6. Rightsizing
7. Fixed cost
8. Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, and Sustainability

---

*Based on Content Domain 1 of the AWS Certified Cloud Practitioner Exam Guide (CLF-C02).*
