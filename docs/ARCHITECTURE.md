# AGENTFLOW AI — System Architecture & Design Specification

## Overview
**AGENTFLOW AI** is architected as a modular, multi-tenant distributed system combining a modern React SPA, an Express REST API backend, and a Python FastAPI multi-agent orchestration engine.

---

## 1. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|                                                                                   |
|  AgentFlow Web SPA (React 18 + Vite + TypeScript + Tailwind CSS + React Flow)     |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (HTTP / REST)
+-----------------------------------------------------------------------------------+
|                                GATEWAY TIER                                       |
|                                                                                   |
|  Nginx Reverse Proxy / Load Balancer (:80 / :443)                                 |
|  Routes:                                                                          |
|    - /api/v1/*   --> Node.js Backend API Service (:5201)                          |
|    - /ai/*       --> Python FastAPI Multi-Agent Engine (:5202)                    |
|    - /*          --> React Static Assets (HTML5 pushState :5200)                  |
+-----------------------------------------------------------------------------------+
                         │                                    │
                         ▼                                    ▼
+------------------------------------+   +------------------------------------------+
|          BACKEND SERVICE           |   |            AI SERVICE ENGINE             |
|                                    |   |                                          |
|  Node.js / Express / TypeScript    |   |  Python 3.12 / FastAPI / Pydantic        |
|                                    |   |                                          |
|  - JWT Authentication Middleware   |   |  - LangGraph State Machine Graph         |
|  - Multi-Tenant Isolation Scoping  |   |  - Supervisor Agent Decomposition        |
|  - RBAC Hierarchy Engine           |   |  - 7 Specialized Worker Agent Personas   |
|  - Model Status & Proxy Gateway    |   |  - TF-IDF Local Semantic Knowledge RAG   |
|  - Human Approval State Store      |   |  - Tool Execution Sandboxing             |
|  - Audit Log Collector             |   |  - Human-in-the-Loop Checkpoint Gate     |
|  - $0.00 Financial Telemetry       |   |  - Structured Pydantic Output Synthesis  |
+------------------------------------+   +------------------------------------------+
          │                 │                                   │
          ▼                 ▼                                   ▼
+-------------------+ +---------------+             +-----------------------+
|  DATABASE TIER    | |  CACHE TIER   |             |  LOCAL LLM RUNTIME    |
|                   | |               |             |                       |
|  MongoDB 7.0      | |  Redis 7.2    |             |  - Ollama (:11434)    |
|  (Mongoose Schema | |  (BullMQ Jobs |             |  - qwen2.5:7b (Base)  |
|   + Indexes)      | |   & Session)  |             |  - qwen2.5-coder:7b   |
|                   | |               |             |  (Zero Cloud API Fee) |
+-------------------+ +---------------+             +-----------------------+
```

---

## 2. Multi-Tenant Isolation Architecture

1. **Logical Separation**: Every tenant belongs to an `Organization`. Every domain entity (`Agent`, `Task`, `Execution`, `Approval`, `Workflow`, `KnowledgeDocument`, `Integration`, `Subscription`) enforces an indexed `organizationId` foreign key.
2. **Backend Guarding**: The `requireTenant` middleware extracts `x-organization-id` from the HTTP request headers. It validates against `OrganizationMember` to verify the authenticated user is an authorized member.
3. **Query Scoping**: Controllers and services never execute queries without specifying `organizationId: req.organizationId`.
4. **Knowledge Isolation**: Document search queries filter strictly by `organizationId`. One tenant's confidential documents can never be searched or retrieved by another organization's agents.

---

## 3. Human-in-the-Loop Approval Checkpoint Engine

Any agent proposal involving:
- Outbound external emails (`send_email`)
- External mutation REST APIs (`external_api_mutation`)
- Database deletion or record modification (`data_deletion`, `update_records`)
- Paid external API calls (`paid_operation`)

Triggers the **Approval Checkpoint Gate**:
1. Execution halts and enters `waiting_approval` status.
2. A formal `Approval` document is generated with action details and agent rationale.
3. In-app and email notifications alert organization supervisors.
4. When authorized, the task execution resumes cleanly; if rejected, the task terminates in a failed state with supervisor feedback.
