# Day 3 AWS Certified Cloud Practitioner (CLF-C02)

## Day 3: Cloud Technology and Services

Domain 3 represents **34% of the scored exam content**, making it the largest domain in the exam.

### Learning goals

By the end of this lesson, you should understand:

1. Ways to deploy and operate AWS resources
2. AWS global infrastructure
3. Compute and container services
4. Database services
5. Networking services
6. Storage services
7. AI, machine learning, and analytics services
8. Integration, developer, business, end-user, frontend, and IoT services

> You do not need to know how to configure every service for the Cloud Practitioner exam. Focus on recognizing each service and choosing it for the correct use case.

---

## 1. Ways to access and operate AWS

AWS resources can be created and managed in several ways.

| Method | Best suited for | Example |
|---|---|---|
| AWS Management Console | Visual, one-time, or learning tasks | Create an S3 bucket through a web browser |
| AWS CLI | Commands, scripts, and automation | Run a command to list S3 buckets |
| AWS SDK | Access AWS from application code | A .NET application uploads a file to S3 |
| AWS APIs | Direct programmatic communication | Send an API request to an AWS service |
| Infrastructure as Code | Repeatable infrastructure deployments | Define a VPC and servers in a template |

### AWS Management Console

A browser-based graphical interface. It is convenient for learning, viewing resources, and performing occasional actions.

### AWS Command Line Interface (CLI)

Allows users to manage AWS by running commands. It is useful for scripting and repeatable operations.

### AWS Software Development Kits (SDKs)

SDKs allow applications to call AWS services in programming languages such as C#, Java, Python, and JavaScript.

For example, an ASP.NET Core application can use the AWS SDK for .NET to store a customer report in S3.

### Infrastructure as Code (IaC)

Infrastructure as Code means describing infrastructure in files or code so it can be created consistently and repeatedly.

**AWS CloudFormation** is an AWS Infrastructure as Code service. A CloudFormation template can define resources such as:

- VPCs
- EC2 instances
- Security groups
- Load balancers
- Databases

Benefits include repeatability, version control, automation, and fewer manual configuration errors.

> **Exam clue:** A repeatable infrastructure deployment points toward Infrastructure as Code rather than manually using the Console.

---

## 2. Deployment models

### Cloud deployment

The application and its resources operate in a cloud environment such as AWS.

### On-premises deployment

The application runs in the organization's own data centre.

### Hybrid deployment

Some resources operate on-premises and others operate in AWS, with connectivity between them.

Example: A bank keeps a legacy database on-premises while running a customer portal in AWS.

---

## 3. AWS global infrastructure

### Region

An AWS Region is a separate geographical area containing multiple Availability Zones.

A company may select a Region based on:

- Proximity to users
- Data-residency requirements
- Service availability
- Cost
- Regulatory requirements

### Availability Zone (AZ)

An Availability Zone consists of one or more isolated data centres inside a Region.

Availability Zones have separate power, networking, and connectivity arrangements so they do not share the same single points of failure.

### Edge location

An edge location helps deliver content closer to end users. Amazon CloudFront uses edge locations to cache and distribute content with lower latency.

### Relationship

```text
AWS Global Infrastructure
|
+-- Region
    |
    +-- Availability Zone A
    +-- Availability Zone B
    +-- Availability Zone C

Edge locations are distributed closer to users.
```

### Multi-AZ architecture

Deploying an application across multiple Availability Zones improves high availability. If one AZ fails, resources in another AZ can continue serving users.

### Multiple Regions

Organizations may use multiple Regions for:

- Disaster recovery
- Business continuity
- Lower latency for worldwide users
- Data sovereignty or residency
- Greater geographical isolation

> **Remember:** Multi-AZ protects against a local data-centre/AZ failure. Multi-Region can protect against a wider regional disruption and serve global requirements.

---

## 4. Compute services

Compute services provide processing power to run applications and workloads.

### Amazon EC2

**Amazon Elastic Compute Cloud (EC2)** provides resizable virtual servers.

Use EC2 when you need:

- Control over the operating system
- Control over installed software
- Long-running applications
- Custom server configurations
- Traditional applications that expect a server

The customer manages the guest operating system, patches, application, and many network settings.

### EC2 instance families

| Family type | Best suited for | Example |
|---|---|---|
| General purpose | Balanced compute, memory, and networking | Web servers and development environments |
| Compute optimized | Processor-intensive work | Batch processing and high-performance computing |
| Memory optimized | Large amounts of memory | In-memory databases and real-time analytics |
| Storage optimized | High local storage performance | Data warehousing and high-throughput processing |
| Accelerated computing | Hardware accelerators such as GPUs | Machine learning and graphics processing |

### EC2 Auto Scaling

EC2 Auto Scaling automatically adds or removes EC2 instances according to demand or defined conditions.

It provides:

- **Elasticity:** Capacity changes with demand
- **Availability:** Unhealthy instances can be replaced
- **Cost control:** Unnecessary capacity can be removed

### Elastic Load Balancing

A load balancer distributes incoming traffic across multiple targets, such as EC2 instances.

Benefits include:

- Preventing one server from receiving all traffic
- Routing traffic only to healthy targets
- Supporting high availability across Availability Zones
- Working with Auto Scaling

```text
Users
  |
Load Balancer
 /     |     \
EC2 A  EC2 B  EC2 C
```

---

## 5. Serverless compute

Serverless does not mean servers do not exist. It means AWS manages the servers and underlying infrastructure for the customer.

### AWS Lambda

Lambda runs code in response to events without requiring server management.

Example:

1. A user uploads an image to S3.
2. S3 triggers a Lambda function.
3. Lambda creates a thumbnail.
4. The function stops after completing the work.

Benefits:

- No server management
- Automatic scaling
- Pay for execution rather than idle server time
- Useful for event-driven and short-running workloads

### AWS Fargate

Fargate is serverless compute for containers. Customers provide container definitions while AWS manages the underlying servers.

> **Difference:** Lambda runs functions; Fargate runs containers without requiring customers to manage EC2 hosts.

---

## 6. Containers

A container packages an application and its dependencies so it can run consistently in different environments.

### Amazon ECS

**Amazon Elastic Container Service** is AWS's container orchestration service.

Use ECS when you want AWS-native container management.

### Amazon EKS

**Amazon Elastic Kubernetes Service** is a managed Kubernetes service.

Use EKS when an organization needs Kubernetes APIs, tools, or compatibility.

### Amazon ECR

**Amazon Elastic Container Registry** stores and manages container images.

### Easy comparison

| Service | Purpose |
|---|---|
| ECS | Orchestrate containers using an AWS-native service |
| EKS | Run managed Kubernetes |
| ECR | Store container images |
| Fargate | Run containers without managing servers |

---

## 7. Database services

### Database on EC2 vs managed database

If a database runs on EC2, the customer manages the operating system, database installation, patching, backups, and configuration.

With a managed database service, AWS handles more operational work.

Use a database on EC2 when deep operating-system or database control is necessary. Prefer a managed database when reduced administration is more important.

### Amazon RDS

**Amazon Relational Database Service** is a managed service for relational databases.

Relational databases organize structured data into tables with relationships and commonly use SQL.

RDS supports database engines such as PostgreSQL, MySQL, MariaDB, Oracle Database, Microsoft SQL Server, and Amazon Aurora.

Typical use cases:

- Banking transactions
- Customer and order systems
- Applications requiring relational data and SQL

### Amazon Aurora

Aurora is an AWS-built relational database compatible with MySQL and PostgreSQL. It is available through Amazon RDS.

### Amazon DynamoDB

DynamoDB is a fully managed serverless NoSQL key-value and document database.

Use it for:

- Very large scale
- Low-latency access
- Flexible NoSQL data
- Applications that need automatic scaling

### Amazon ElastiCache

ElastiCache is a managed in-memory caching service.

It can store frequently requested data in memory so applications do not repeatedly query a slower database.

Example: Cache frequently viewed product details or user session information.

### Amazon Redshift

Redshift is a data warehouse designed for large-scale analytics and reporting.

### Database comparison

| Need | Service |
|---|---|
| Managed relational SQL database | Amazon RDS |
| AWS-built MySQL/PostgreSQL-compatible relational database | Amazon Aurora |
| Serverless NoSQL key-value/document database | Amazon DynamoDB |
| In-memory cache | Amazon ElastiCache |
| Large-scale data warehouse | Amazon Redshift |

---

## 8. Database migration

### AWS Database Migration Service (AWS DMS)

DMS helps migrate databases to AWS or between database systems while minimizing downtime through ongoing replication.

### AWS Schema Conversion Tool (AWS SCT)

AWS SCT helps convert a source database schema into a format compatible with a different target database engine.

> **Remember:** DMS moves/replicates data; SCT converts database schemas.

---

## 9. Amazon VPC

**Amazon Virtual Private Cloud (VPC)** provides an isolated virtual network in AWS.

Important VPC components include:

- IP address ranges
- Subnets
- Route tables
- Internet gateways
- NAT gateways
- Security groups
- Network access control lists

### Public subnet

A subnet whose routing can allow resources to communicate with the internet through an internet gateway.

Example: A public-facing load balancer.

### Private subnet

A subnet without direct inbound access from the internet.

Example: An application database.

### Internet gateway

Connects a VPC to the internet when routing and security rules allow it.

### NAT gateway

Allows resources in a private subnet to initiate outbound internet connections without allowing the internet to initiate connections directly to those resources.

Example: A private EC2 instance downloads software updates.

---

## 10. VPC security

### Security group

A security group acts as a virtual firewall for a resource such as an EC2 instance.

- Operates at the resource/instance level
- Supports allow rules
- Is stateful: return traffic for an allowed connection is automatically permitted

### Network ACL

A network ACL controls traffic entering and leaving a subnet.

- Operates at the subnet level
- Supports allow and deny rules
- Is stateless: return traffic must be explicitly permitted

| Feature | Security group | Network ACL |
|---|---|---|
| Level | Resource/instance | Subnet |
| Rules | Allow | Allow and deny |
| State | Stateful | Stateless |

---

## 11. DNS and content delivery

### Amazon Route 53

Route 53 is a highly available and scalable Domain Name System (DNS) service.

It translates a domain name such as `example.com` into an IP address and can route users to healthy endpoints.

### Amazon CloudFront

CloudFront is a content delivery network (CDN). It caches content at edge locations closer to users, reducing latency and load on the original server.

> **Difference:** Route 53 resolves and routes domain names; CloudFront caches and delivers content closer to users.

---

## 12. Connecting to AWS

### AWS Site-to-Site VPN

Creates an encrypted connection over the public internet between an organization's network and AWS.

### AWS Direct Connect

Provides a dedicated private network connection between an organization's environment and AWS.

| Option | Connection | Common reason |
|---|---|---|
| Site-to-Site VPN | Encrypted tunnel over the internet | Quick and cost-effective connectivity |
| Direct Connect | Dedicated private connection | More consistent network experience and private connectivity |

---

## 13. Storage types

AWS storage is commonly divided into object, block, and file storage.

| Storage type | Think of it as | Main AWS examples |
|---|---|---|
| Object | Objects in buckets | Amazon S3 |
| Block | A virtual hard drive | Amazon EBS, instance store |
| File | Shared folders and files | Amazon EFS, Amazon FSx |

---

## 14. Amazon S3 object storage

**Amazon Simple Storage Service (S3)** stores objects in buckets.

Common use cases:

- Documents and images
- Backups
- Logs
- Static website assets
- Data lakes
- Archived information

S3 is not normally used as the boot disk of an EC2 instance. EBS is suited to that requirement.

### Important S3 storage classes

| Storage class | Suitable use |
|---|---|
| S3 Standard | Frequently accessed data |
| S3 Intelligent-Tiering | Unknown or changing access patterns |
| S3 Standard-IA | Infrequently accessed data needing rapid access |
| S3 One Zone-IA | Infrequently accessed, reproducible data stored in one AZ |
| S3 Glacier Instant Retrieval | Archive data needing millisecond retrieval |
| S3 Glacier Flexible Retrieval | Archive data where retrieval can take longer |
| S3 Glacier Deep Archive | Lowest-cost long-term archive with slow retrieval |

**IA** means **Infrequent Access**.

### S3 lifecycle policies

A lifecycle policy can automatically:

- Move objects to a less expensive storage class
- Archive old objects
- Delete objects after a defined period

Example: Keep logs in S3 Standard for 30 days, move them to an archive class, and delete them after seven years.

---

## 15. Block and file storage

### Amazon EBS

**Amazon Elastic Block Store** provides persistent block storage for EC2 instances.

Use cases include:

- EC2 boot volumes
- Application data disks
- Database volumes

EBS data can persist independently of an EC2 instance, depending on configuration.

### EC2 instance store

Instance store provides temporary block storage physically attached to the host running the EC2 instance.

It is fast but ephemeral. Data can be lost when the instance stops, terminates, or the underlying host fails.

> **Difference:** EBS is persistent block storage; instance store is temporary local storage.

### Amazon EFS

**Amazon Elastic File System** provides a scalable shared file system commonly used by Linux workloads. Multiple compute resources can access it.

### Amazon FSx

FSx provides managed file systems for specific technologies and workloads, including Windows-oriented and high-performance options.

### AWS Storage Gateway

Storage Gateway connects on-premises environments with AWS cloud storage and supports hybrid storage use cases, including cached access.

### AWS Backup

AWS Backup centrally manages and automates backups across supported AWS services.

---

## 16. AI and machine learning services

### Amazon SageMaker AI

SageMaker AI helps build, train, and deploy machine-learning models.

### Amazon Lex

Lex helps create conversational interfaces such as chatbots and voice bots.

Examples:

- Customer-support chatbot
- Voice-based appointment system

### Other easy-to-recognize AI services

| Need | Service |
|---|---|
| Analyze images and video | Amazon Rekognition |
| Convert text to speech | Amazon Polly |
| Convert speech to text | Amazon Transcribe |
| Translate languages | Amazon Translate |

---

## 17. Analytics services

### Amazon Athena

Athena is a serverless interactive query service that uses SQL to analyze data stored in S3.

> **Exam clue:** SQL queries directly against S3 usually point to Athena.

### Amazon Kinesis

Kinesis collects and processes streaming data in near real time.

Examples:

- Website click streams
- Application events
- IoT telemetry

### AWS Glue

Glue is a serverless data-integration service used to discover, prepare, and combine data for analytics, machine learning, and application development.

It is commonly associated with ETL: **extract, transform, and load**.

### Amazon QuickSight

QuickSight is a business-intelligence service for creating dashboards and visualizations.

### Analytics comparison

| Requirement | Service |
|---|---|
| Query S3 data using SQL | Amazon Athena |
| Process streaming data | Amazon Kinesis |
| Prepare and integrate data | AWS Glue |
| Create BI dashboards | Amazon QuickSight |
| Analyze data in a warehouse | Amazon Redshift |

---

## 18. Application integration

### Amazon SQS

**Amazon Simple Queue Service** stores messages in a queue so systems can communicate asynchronously.

Example:

1. An order API places an order message in SQS.
2. A processing service retrieves it later.
3. A temporary processing failure does not require the API to wait.

SQS helps decouple application components.

### Amazon SNS

**Amazon Simple Notification Service** publishes messages to multiple subscribers.

A single message can fan out to:

- Email
- SMS
- SQS queues
- Lambda functions
- Other supported endpoints

### Amazon EventBridge

EventBridge is a serverless event bus that routes events from AWS services, custom applications, and supported SaaS applications to targets using rules.

### SQS vs SNS vs EventBridge

| Service | Pattern | Easy memory aid |
|---|---|---|
| SQS | Queue; consumer retrieves messages | Store work for later processing |
| SNS | Publish/subscribe; fan-out notifications | Send one message to many subscribers |
| EventBridge | Rule-based event routing | Route events based on their content/source |

---

## 19. Business application services

### Amazon Connect

Amazon Connect is a cloud-based contact-centre service.

### Amazon SES

**Amazon Simple Email Service** helps applications send and receive email at scale.

Examples:

- Account verification emails
- Password-reset messages
- Transaction notifications

---

## 20. Developer tools

### AWS CodeBuild

Builds and tests source code and produces deployable artifacts.

### AWS CodePipeline

Automates stages in a continuous delivery pipeline, such as source, build, test, and deployment.

### AWS X-Ray

Helps developers trace requests through distributed applications to identify performance problems and errors.

| Need | Service |
|---|---|
| Compile and test code | AWS CodeBuild |
| Orchestrate a delivery pipeline | AWS CodePipeline |
| Trace distributed requests | AWS X-Ray |

---

## 21. End-user computing

### Amazon WorkSpaces

Provides managed virtual desktops.

### Amazon AppStream 2.0

Streams desktop applications to users through a browser without installing the applications locally.

### Amazon WorkSpaces Secure Browser

Provides secure browser access to internal websites and SaaS applications.

---

## 22. Frontend, mobile, and IoT

### AWS Amplify

Amplify provides tools and services for building, deploying, and hosting frontend web and mobile applications.

### AWS IoT Core

IoT Core securely connects and manages Internet of Things devices and allows them to exchange messages with cloud applications.

Examples:

- Smart-home sensors
- Vehicle telemetry
- Industrial equipment monitoring

---

## Master service comparison

| Requirement | AWS service |
|---|---|
| Virtual server with operating-system control | Amazon EC2 |
| Run event-driven functions without servers | AWS Lambda |
| Run containers without managing servers | AWS Fargate |
| AWS-native container orchestration | Amazon ECS |
| Managed Kubernetes | Amazon EKS |
| Store container images | Amazon ECR |
| Managed relational database | Amazon RDS |
| AWS-built MySQL/PostgreSQL-compatible database | Amazon Aurora |
| Serverless NoSQL database | Amazon DynamoDB |
| In-memory cache | Amazon ElastiCache |
| Data warehouse | Amazon Redshift |
| Migrate/replicate database data | AWS DMS |
| Convert database schemas | AWS SCT |
| Isolated AWS virtual network | Amazon VPC |
| DNS and domain routing | Amazon Route 53 |
| Content delivery network | Amazon CloudFront |
| Dedicated connection to AWS | AWS Direct Connect |
| Object storage | Amazon S3 |
| Persistent EC2 block storage | Amazon EBS |
| Shared Linux file system | Amazon EFS |
| Centralized backup management | AWS Backup |
| Query S3 with SQL | Amazon Athena |
| Streaming-data processing | Amazon Kinesis |
| Data integration and ETL | AWS Glue |
| Business-intelligence dashboards | Amazon QuickSight |
| Message queue | Amazon SQS |
| Fan-out notifications | Amazon SNS |
| Rule-based event routing | Amazon EventBridge |
| Cloud contact centre | Amazon Connect |
| Application email | Amazon SES |
| Build and test code | AWS CodeBuild |
| Continuous delivery pipeline | AWS CodePipeline |
| Distributed request tracing | AWS X-Ray |
| Managed virtual desktops | Amazon WorkSpaces |
| Stream desktop applications | Amazon AppStream 2.0 |
| Build and host frontend/mobile apps | AWS Amplify |
| Connect and manage IoT devices | AWS IoT Core |

---

## Day 3 memory sheet

- **Region:** Geographical AWS area
- **Availability Zone:** Isolated location inside a Region
- **Edge location:** Delivers cached content closer to users
- **EC2:** Virtual servers
- **Lambda:** Serverless functions
- **Fargate:** Serverless containers
- **Auto Scaling:** Elastic capacity
- **Load balancer:** Distributes traffic across healthy targets
- **RDS:** Managed relational databases
- **DynamoDB:** Serverless NoSQL database
- **VPC:** Isolated virtual network
- **Route 53:** DNS
- **CloudFront:** Content delivery network
- **S3:** Object storage
- **EBS:** Persistent block storage for EC2
- **EFS:** Shared file storage
- **SQS:** Queue
- **SNS:** Notifications and fan-out
- **EventBridge:** Event routing

---

## Quick quiz

Try answering before looking at the answer key:

1. Which access method is usually easiest for a beginner performing a one-time visual task?
2. Which approach should be used to deploy the same infrastructure consistently many times?
3. What is the difference between a Region and an Availability Zone?
4. Why would an application operate across multiple Availability Zones?
5. Which service provides virtual servers with operating-system control?
6. Which service runs event-driven functions without server management?
7. Which service runs containers without requiring customers to manage servers?
8. What is the difference between ECS and EKS?
9. Which service is a managed relational database service?
10. Which service is a serverless NoSQL database?
11. Which service provides in-memory caching?
12. What is the difference between DMS and SCT?
13. What does a NAT gateway allow a private-subnet resource to do?
14. What is the difference between a security group and a network ACL?
15. Which service provides DNS?
16. Which service caches and delivers content through edge locations?
17. Which service provides a dedicated private connection to AWS?
18. What are the three main storage types?
19. Which service provides object storage?
20. What is the difference between EBS and instance store?
21. Which service queries data in S3 by using SQL?
22. Which service processes streaming data?
23. Which service creates business-intelligence dashboards?
24. What is the difference between SQS and SNS?
25. Which service traces requests through distributed applications?

## Answer key

1. AWS Management Console
2. Infrastructure as Code, such as AWS CloudFormation
3. A Region is a geographical area; an Availability Zone is an isolated location inside a Region.
4. To improve high availability and resilience against an AZ failure
5. Amazon EC2
6. AWS Lambda
7. AWS Fargate
8. ECS is AWS-native container orchestration; EKS is managed Kubernetes.
9. Amazon RDS
10. Amazon DynamoDB
11. Amazon ElastiCache
12. DMS moves or replicates data; SCT converts database schemas.
13. Initiate outbound internet connections without accepting direct inbound internet connections
14. A security group is stateful and operates at resource level; a network ACL is stateless and operates at subnet level.
15. Amazon Route 53
16. Amazon CloudFront
17. AWS Direct Connect
18. Object, block, and file storage
19. Amazon S3
20. EBS is persistent block storage; instance store is temporary local storage.
21. Amazon Athena
22. Amazon Kinesis
23. Amazon QuickSight
24. SQS stores messages in a queue for processing; SNS publishes messages to multiple subscribers.
25. AWS X-Ray

---

*Based on Content Domain 3 of the AWS Certified Cloud Practitioner Exam Guide (CLF-C02).*
