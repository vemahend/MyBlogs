# Amazon EC2 Interview Questions and Scenarios

This file consolidates the EC2-related questions currently found across the interview-question library. The original questions remain unchanged in their source sections.

## Core EC2 and Architecture Questions

1. How would you choose between EC2, ECS with Fargate, EKS, Elastic Beanstalk, and Lambda for a .NET application?

   **Source:** AWS Architecture and Serverless

2. How would you deploy an ASP.NET Core API to EC2 using a load balancer, target groups, health checks, Auto Scaling, IAM roles, and CloudWatch Agent?

   **Source:** Advanced AWS Answers for Your CV Skills

3. What EC2 operating-system, application, and load-balancer signals would you monitor, and how would you distinguish infrastructure failure from application failure?

   **Source:** Advanced AWS Answers for Your CV Skills

4. How would you perform a safe EC2 deployment with immutable images, rolling replacement, blue-green environments, health validation, and rollback?

   **Source:** Advanced AWS Answers for Your CV Skills

## EC2 Production Scenarios

5. An EC2-hosted ASP.NET Core service is healthy according to CPU monitoring but intermittently fails load-balancer health checks. How would you investigate memory, disk, networking, process health, logs, and dependency latency?

   **Source:** AWS Production Scenario Questions

6. An EC2 deployment passes the pipeline but the new instances never become healthy in the target group. How would you diagnose ports, security groups, health-check paths, startup configuration, and instance logs?

   **Source:** AWS Production Scenario Questions

7. An EC2 instance becomes unresponsive during peak load. How would you recover service safely and decide whether to resize, auto scale, optimize the application, or change the architecture?

   **Source:** AWS Production Scenario Questions

8. A team cannot find the cause of a production failure because API Gateway, Lambda, and EC2 logs are fragmented. How would you create a correlated observability design using structured logs, metrics, alarms, dashboards, and tracing?

   **Source:** AWS Production Scenario Questions

## Related EC2 Networking Foundation

9. How do VPCs, public and private subnets, route tables, security groups, NAT gateways, and VPC endpoints work together?

   **Source:** AWS Architecture and Serverless

