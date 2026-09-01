# Day 2 AWS Certified Cloud Practitioner (CLF-C02)

## Day 2: Security and Compliance

Domain 2 represents **30% of the scored exam content**, making it the second-largest exam domain.

### Learning goals

By the end of this lesson, you should understand:

1. The AWS shared responsibility model
2. Security, governance, and compliance concepts
3. AWS identity and access management
4. Important AWS security services and resources

---

## 1. AWS shared responsibility model

AWS and the customer both have security responsibilities, but they protect different parts of the environment.

> **AWS is responsible for security OF the cloud.**  
> **The customer is responsible for security IN the cloud.**

### AWS responsibilities: security OF the cloud

AWS protects the physical and foundational infrastructure that runs AWS services, including:

- Physical data centres
- Physical access to buildings
- Hardware and storage devices
- Networking infrastructure
- Availability Zone infrastructure
- The virtualization layer

### Customer responsibilities: security IN the cloud

Customers generally manage:

- Their application code
- Their business data
- User identities and permissions
- IAM policies
- Data encryption choices
- Network and firewall configuration
- Operating-system updates on customer-managed servers
- Application security and patching

### Real-world analogy

Imagine renting an apartment:

- The building owner protects the building, lifts, foundation, and shared infrastructure.
- You protect your keys, valuables, visitors, and what happens inside your apartment.

AWS is similar to the building owner, while the customer is similar to the tenant.

---

## 2. Responsibility changes by service

The customer's responsibilities depend on how much of the technology AWS manages.

| Responsibility | Amazon EC2 | Amazon RDS | AWS Lambda |
|---|---|---|---|
| Physical infrastructure | AWS | AWS | AWS |
| Virtualization layer | AWS | AWS | AWS |
| Operating-system patching | Customer | AWS | AWS |
| Database engine patching | Customer, if self-managed | AWS | Not normally applicable |
| Application code | Customer | Customer | Customer |
| Data and permissions | Customer | Customer | Customer |

### Amazon EC2

EC2 provides a virtual server. AWS manages the physical infrastructure, but the customer normally manages:

- The guest operating system
- Operating-system patches
- Installed software
- Application code
- Security-group rules
- Data and user access

### Amazon RDS

RDS is a managed database service. AWS manages more of the technology, including the underlying operating system and much of the database maintenance.

The customer still manages:

- The data
- Database users and permissions
- Network access
- Database configuration choices
- Appropriate backup and encryption settings

### AWS Lambda

Lambda runs code without requiring the customer to manage servers. AWS manages the servers, operating systems, and runtime infrastructure.

The customer manages:

- Function code
- IAM permissions
- Dependencies included with the function
- Data processed by the function
- Secure application logic

### Exam rule

> The more managed the service is, the more operational responsibility AWS takes. The customer always remains responsible for their data, identities, permissions, and secure use of the service.

---

## 3. Security, governance, and compliance

These terms are related but have different meanings.

| Concept | Main question | Example |
|---|---|---|
| Security | How do we protect systems and data? | Encryption, firewalls, and MFA |
| Governance | How do we control and monitor how AWS is used? | Policies, configuration rules, and account standards |
| Compliance | Are we meeting required laws and standards? | Demonstrating compliance with an industry standard |

### Compliance responsibility

AWS can provide compliant infrastructure and supporting reports. However, the customer must configure and use AWS services in a way that meets the customer's own legal, geographical, and industry requirements.

For example, a healthcare, banking, or government organization may have different requirements for:

- Where data is stored
- How long logs are retained
- Who can access information
- How information is encrypted
- How security evidence is reported

---

## 4. Encryption

Encryption transforms readable information into protected information that cannot be understood without the required key.

### Encryption at rest

Protects data while it is stored.

Examples:

- Objects stored in Amazon S3
- Data stored in Amazon RDS
- Data on an Amazon EBS volume
- Database backups

### Encryption in transit

Protects data while it moves between systems.

Examples:

- A browser communicating with a website through HTTPS
- An application communicating with an API using TLS
- A service sending protected data across a network

### Easy memory aid

- **At rest:** Data is sitting somewhere.
- **In transit:** Data is travelling somewhere.

### AWS Key Management Service

**AWS KMS** helps create and control encryption keys used to protect data.

Remember the difference:

- Encryption protects the data.
- KMS helps manage the encryption keys.

---

## 5. Logging, monitoring, auditing, and configuration

Several AWS services observe different aspects of an environment.

| Service | Main purpose | Memory question |
|---|---|---|
| Amazon CloudWatch | Metrics, logs, alarms, and operational monitoring | What is happening operationally? |
| AWS CloudTrail | Records AWS API and account activity | Who did what, when, and from where? |
| AWS Config | Records resource configurations and evaluates rules | How was this resource configured, and did it change? |
| AWS Artifact | Provides AWS compliance reports and agreements | Where can I obtain AWS compliance documents? |

### Amazon CloudWatch

CloudWatch helps monitor resources and applications.

Examples:

- Monitor EC2 CPU utilization
- Collect application logs
- Create an alarm when an error threshold is reached
- Build operational dashboards

### AWS CloudTrail

CloudTrail records account activity and API actions.

For example, it can help answer:

- Who deleted an S3 bucket?
- Who changed a security group?
- When was an IAM policy updated?
- Which API operation was called?

### AWS Config

AWS Config records resource configurations and configuration changes. It can evaluate resources against rules.

For example:

- Is this S3 bucket publicly accessible?
- Is encryption enabled?
- Did this security group's configuration change?

### AWS Artifact

AWS Artifact provides on-demand access to AWS compliance reports and certain agreements.

> **Exam clue:** A question asking where to download an AWS audit or compliance report usually points to **AWS Artifact**.

---

## 6. Identity and Access Management (IAM)

AWS IAM controls **who can access AWS and what they are allowed to do**.

IAM commonly involves:

- Users
- Groups
- Roles
- Policies

### IAM user

Represents a person or application that needs long-term access within an AWS account.

### IAM group

A collection of IAM users. Permissions assigned to a group can apply to its members.

Example groups:

- Developers
- Testers
- Database administrators

### IAM role

A role provides temporary permissions and can be assumed by a person, AWS service, application, or another AWS account.

Example:

An EC2 application needs to read files from S3. Instead of saving permanent access keys in the application, assign an IAM role to the EC2 instance.

> **Best practice:** Prefer temporary credentials through roles instead of storing long-term access keys in application code.

### IAM policy

A policy is a document that defines permissions.

A policy normally describes:

- Which actions are allowed or denied
- Which resources the actions apply to
- Optional conditions that must be satisfied

### Managed and customer-managed policies

- **AWS managed policy:** Created and maintained by AWS
- **Customer managed policy:** Created and maintained by the customer
- **Inline policy:** Embedded directly into one user, group, or role

---

## 7. Principle of least privilege

**Least privilege means granting only the permissions required to complete a task—nothing more.**

Example:

A reporting application needs to read objects from one S3 bucket. It should not receive permission to:

- Delete objects
- Access every S3 bucket
- Create IAM users
- Stop EC2 instances

### Why least privilege matters

If credentials are compromised, the potential damage is limited by the permissions attached to those credentials.

> Start with minimum permissions and add only what is genuinely required.

---

## 8. Authentication and authorization

These two terms are commonly confused.

- **Authentication:** Verifies who you are.
- **Authorization:** Determines what you can do.

Example:

Signing in with a password and MFA authenticates you. An IAM policy allowing you to read an S3 bucket authorizes that action.

---

## 9. Protecting the root user

The root user is created when the AWS account is created. It has complete access to the account and can perform certain account-level tasks that cannot be delegated.

Security practices include:

- Do not use the root user for everyday work
- Enable multi-factor authentication (MFA)
- Use a strong, unique password
- Do not create root access keys unless absolutely necessary
- Store root credentials securely
- Use IAM identities or IAM Identity Center for regular administration

> **Exam rule:** If a question asks how to protect the root user, enabling MFA and avoiding everyday root use are usually important answers.

---

## 10. Multi-factor authentication (MFA)

MFA requires more than one form of evidence during sign-in.

For example:

1. Something you know: password
2. Something you have: authenticator device or security key

If a password is stolen, the attacker still needs the additional factor.

---

## 11. IAM Identity Center and federation

### AWS IAM Identity Center

IAM Identity Center helps centrally manage workforce access to multiple AWS accounts and applications. It can provide single sign-on and temporary credentials.

### Federated identity

Federation allows users to access AWS by using an existing external identity provider rather than creating a separate IAM user for every person.

For example, employees might sign in using their company's existing Microsoft or corporate identity.

### Cross-account role

A role in one AWS account can grant approved temporary access to a trusted identity from another AWS account.

This is safer and easier to control than sharing permanent credentials between accounts.

---

## 12. Passwords, access keys, and secrets

### Password

Usually used by a human to sign in interactively.

### Access key

Used for programmatic access through the AWS CLI, SDKs, or APIs. An access key is not intended to be casually stored in source code.

### AWS Secrets Manager

Stores and manages sensitive values such as:

- Database passwords
- API keys
- Application credentials

It can also help rotate supported secrets.

### AWS Systems Manager Parameter Store

Stores configuration values and secrets. It is commonly used for application configuration and can store encrypted values.

> **Important:** Do not hard-code passwords, tokens, or access keys in an application or commit them to Git.

---

## 13. Threat detection and security posture

### Amazon GuardDuty

GuardDuty is an intelligent threat-detection service. It analyses AWS data sources to identify suspicious or malicious activity.

> **Memory clue:** GuardDuty = Detect suspicious activity.

### Amazon Inspector

Inspector is a vulnerability-management service that scans supported workloads for software vulnerabilities and unintended network exposure.

> **Memory clue:** Inspector = Inspect workloads for vulnerabilities.

### AWS Security Hub

Security Hub provides a centralized view of security findings and checks across AWS accounts and supported services.

> **Memory clue:** Security Hub = Bring security findings together.

### AWS Trusted Advisor

Trusted Advisor checks AWS environments and makes recommendations in areas such as:

- Cost optimization
- Performance
- Security
- Fault tolerance
- Service limits or quotas

> **Memory clue:** Trusted Advisor = Recommendations and best-practice checks.

---

## 14. Network and application protection

### AWS WAF

AWS Web Application Firewall helps protect web applications from common web exploits and unwanted web requests.

Examples include rules related to:

- IP addresses
- Request patterns
- SQL injection
- Cross-site scripting

> **Memory clue:** WAF = Filter web requests.

### AWS Shield

AWS Shield helps protect applications against distributed denial-of-service (DDoS) attacks.

> **Memory clue:** Shield = DDoS protection.

### AWS Firewall Manager

Firewall Manager helps centrally configure and manage firewall and security policies across multiple AWS accounts and resources.

> **Memory clue:** Firewall Manager = Centrally manage protection rules.

### Security groups

A security group acts as a virtual firewall for supported resources such as EC2 instances. It controls permitted inbound and outbound traffic.

---

## 15. Security information and third-party products

AWS provides security guidance through resources such as:

- AWS Security Center
- AWS Security Blog
- AWS Knowledge Center
- AWS documentation and whitepapers

The **AWS Marketplace** also provides third-party security products that customers can purchase and deploy.

---

## Important service comparison

| If the question asks... | Think of... |
|---|---|
| Who performed an AWS API action? | AWS CloudTrail |
| What is the CPU usage or application error count? | Amazon CloudWatch |
| How is a resource configured, and did it change? | AWS Config |
| Where can I download AWS compliance reports? | AWS Artifact |
| How do I detect suspicious activity? | Amazon GuardDuty |
| How do I find workload vulnerabilities? | Amazon Inspector |
| Where can I combine security findings? | AWS Security Hub |
| How do I protect a website from common web exploits? | AWS WAF |
| How do I protect against DDoS attacks? | AWS Shield |
| How do I centrally manage firewall policies? | AWS Firewall Manager |
| Where should I store and rotate database passwords? | AWS Secrets Manager |
| How do I manage encryption keys? | AWS KMS |
| Where can I receive best-practice recommendations? | AWS Trusted Advisor |

---

## Day 2 memory sheet

- **AWS:** Security **of** the cloud
- **Customer:** Security **in** the cloud
- **IAM:** Controls identities and permissions
- **Least privilege:** Only the permissions required
- **MFA:** More than one authentication factor
- **Role:** Temporary permissions without sharing permanent credentials
- **CloudWatch:** Metrics, logs, alarms, and operational monitoring
- **CloudTrail:** AWS API and account activity history
- **Config:** Resource configurations and changes
- **Artifact:** Compliance reports and agreements
- **GuardDuty:** Threat detection
- **Inspector:** Vulnerability management
- **Security Hub:** Central security findings
- **WAF:** Web-request filtering
- **Shield:** DDoS protection
- **Secrets Manager:** Store and rotate secrets
- **KMS:** Manage encryption keys

---

## Quick quiz

Try answering before reading the answer key:

1. Who is responsible for the physical security of AWS data centres?
2. Who patches the guest operating system on an Amazon EC2 instance?
3. Who patches the underlying operating system for Amazon RDS?
4. Which principle says users should receive only the permissions they need?
5. Which service records AWS API activity?
6. Which service monitors metrics and can create alarms?
7. Which service records resource configurations and configuration changes?
8. Where can a customer download AWS compliance reports?
9. Which service detects suspicious activity in an AWS environment?
10. Which service scans supported workloads for vulnerabilities?
11. Which service protects web applications from common web exploits?
12. Which service helps protect against DDoS attacks?
13. What is the difference between authentication and authorization?
14. Should an application store permanent access keys in its source code?
15. What are the two main types of encryption discussed in this chapter?

## Answer key

1. AWS
2. The customer
3. AWS
4. The principle of least privilege
5. AWS CloudTrail
6. Amazon CloudWatch
7. AWS Config
8. AWS Artifact
9. Amazon GuardDuty
10. Amazon Inspector
11. AWS WAF
12. AWS Shield
13. Authentication verifies identity; authorization determines permitted actions.
14. No. Prefer temporary credentials through an IAM role and store secrets securely.
15. Encryption at rest and encryption in transit

---

*Based on Content Domain 2 of the AWS Certified Cloud Practitioner Exam Guide (CLF-C02).*
