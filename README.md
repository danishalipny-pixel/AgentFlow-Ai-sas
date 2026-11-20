# AGENTFLOW AI
### "Your Autonomous AI Workforce. One Intelligent Platform."

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node: v20+](https://img.shields.io/badge/Node-v20+-green.svg)](https://nodejs.org/)
[![TypeScript: v5.4+](https://img.shields.io/badge/TypeScript-v5.4+-blue.svg)](https://www.typescriptlang.org/)
[![Python: v3.12](https://img.shields.io/badge/Python-v3.12-blue.svg)](https://python.org/)
[![React: v18](https://img.shields.io/badge/React-v18-cyan.svg)](https://react.dev/)
[![Docker: Ready](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://docker.com)
[![Status: Production Ready](https://img.shields.io/badge/Status-Production%20Ready-emerald.svg)](#)

AGENTFLOW AI is an autonomous, multi-tenant AI agent workforce platform. Built with React 18, Node.js/Express, MongoDB, Redis, and a Python LangGraph orchestration service, AGENTFLOW AI enables organizations to create specialized AI agents, configure sandboxed tools, design visual automation workflows, execute multi-agent pipelines with human-in-the-loop checkpoints, and monitor telemetry and token costs in real time.

---

## 1. Project Overview

Modern businesses require intelligent automation that goes beyond simple chatbots or static prompt pipelines. AGENTFLOW AI is engineered as an enterprise-grade AI Operations Center where:
- Teams deploy **specialized AI agents** tailored to specific domain functions (Research, Support, Sales, Code Review, Analytics).
- Agents coordinate via a **LangGraph supervisor engine**, delegating subtasks and handing off intermediate artifacts.
- Sensitive or destructive actions (such as sending emails, deleting records, or running payments) are automatically gated behind a **Human-in-the-Loop Approval Queue**.
- Automation architects design end-to-end pipelines using an interactive **React Flow visual DAG canvas**.
- Multi-tenant organizations enjoy strict **data isolation**, **role-based access control (RBAC)**, and **real-time token/cost accounting**.

---

## 2. Visual Identity & System Architecture

### Visual Identity
- **Design Philosophy**: Deep obsidian and dark charcoal background (`#0b0f17`, `#111827`) paired with champagne gold (`#d97706`, `#f59e0b`) and subtle electric violet accents.
- **Glassmorphism**: Selectively applied backdrop blurs with refined 1px border highlights.
- **Typography**: Clean modern sans-serif typography with high accessible contrast.

### System Architecture Diagram

```
                              ┌───────────────────────────────────┐
                              │     Internet / Client Browser     │
                              │    (Desktop, Tablet, Mobile)      │
                              └─────────────────┬─────────────────┘
                                                │
                                                ▼
                              ┌───────────────────────────────────┐
                              │     Nginx Reverse Proxy / SSL     │
                              │       (Port 80 / Port 443)        │
                              └─────────┬───────────────┬─────────┘
                                        │               │
                     ┌──────────────────┘               └──────────────────┐
                     ▼                                                     ▼
      ┌───────────────────────────────┐                     ┌───────────────────────────────┐
      │     Frontend SPA (Web)        │                     │       RESTful API (Node)      │
      │   React 18 + Vite + Tailwind  │                     │     Express + TypeScript      │
      │   React Flow Canvas Builder   │                     │     JWT / RBAC / Validation   │
      │   (Port 3000)                 │                     │     (Port 5000)               │
      └───────────────────────────────┘                     └───────────────┬───────────────┘
                                                                            │
                                    ┌───────────────────────────────────────┴───────────────────────┐
                                    ▼                                                               ▼
                     ┌─────────────────────────────┐                                 ┌─────────────────────────────┐
                     │    Python AI Service        │                                 │     Primary Data Storage    │
                     │    FastAPI + LangGraph      │                                 │     MongoDB (Port 27017)    │
                     │    Supervisor Orchestrator  │                                 │     Multi-Tenant Collections│
                     │    (Port 8000)              │                                 └─────────────────────────────┘
                     └──────────────┬──────────────┘                                                │
                                    │                                                               ▼
                                    │                                                ┌─────────────────────────────┐
                                    ▼                                                │      Redis Cache & Queue    │
                     ┌─────────────────────────────┐                                 │      BullMQ Job Scheduling  │
                     │    Sandboxed Tool Engine    │                                 │      (Port 6379)            │
                     │  - SSRF-Guarded Web Fetch   │                                 └─────────────────────────────┘
                     │  - Precision Calculator     │
                     │  - Tabular CSV Reader       │
                     │  - Vector Knowledge Search  │
                     └─────────────────────────────┘
```

---

## 3. Key Features

### Multi-Tenant Workspace & Team Governance
- **Personal & Organization Workspaces**: Switch between personal and team workspaces seamlessly.
- **Strict Role-Based Access Control (RBAC)**: 5 discrete tiers (`OWNER`, `ADMIN`, `MANAGER`, `MEMBER`, `VIEWER`).
- **Team Invitations**: Invite colleagues by email with pre-configured role assignments.
- **Tenant Isolation**: Every database query is scoped by `organizationId`.

### AI Agent Studio
- **7 Pre-Configured Archetypes**: Research, Sales, Customer Support, Developer, Marketing, Data Analyst, and Project Manager.
- **Custom Agent Builder**: Custom system prompts, temperature sliders (`0.0` – `1.0`), token limits, max step safeguards, and timeout limits.
- **Tool Access Control**: Assign granular tool capabilities to specific agents.
- **Agent Lifecycle Management**: Activate, deactivate, duplicate, edit, and archive agents.

### Multi-Agent Orchestration Engine (LangGraph)
- **Supervisor Pattern**: Project Manager agents decompose directives into subtasks and route to specialized worker nodes.
- **Shared State Management**: State transfer and artifact handoffs across agents.
- **Step-by-Step Telemetry**: Trace thoughts, tool inputs, raw tool results, and final synthesized outputs.

### Visual DAG Workflow Builder
- **React Flow Interactive Canvas**: Drag, drop, connect, zoom, and pan.
- **6 Node Types**: `TRIGGER`, `AGENT`, `CONDITION`, `APPROVAL`, `TOOL`, `OUTPUT`.
- **DAG Integrity Engine**: Prevents infinite loops, cyclical dependencies, and orphan nodes via Depth-First Search cycle detection.
- **Live Pipeline Execution**: Run workflows directly from the canvas and inspect node states.

### Human-in-the-Loop Approval Queue
- **Sensitive Action Interception**: Blocks risky actions (e.g., outbound marketing emails, refunds, schema migrations) until reviewed.
- **Interactive Review Interface**: View full payload diffs, contextual agent notes, and execution snapshots.
- **Approve or Reject with Notes**: Feedback is provided back to the agent so it can revise its strategy.

### Sandboxed Tool Registry & Integrations
- **SSRF-Protected Web Fetcher**: Strictly blocks private RFC-1918 IPs, loopback, link-local, and cloud IMDS (169.254.169.254).
- **Precision Safe Calculator**: AST-based math evaluation without host execution risks.
- **CSV Data Reader & Structured JSON Parser**: Memory-bounded tabular and schema parsing.
- **Enterprise Integrations**: Slack, GitHub, HubSpot, Stripe, and generic Webhooks with AES-256-GCM encrypted secrets.

### Real-Time Analytics & Cost Accounting
- **Interactive Recharts Dashboards**: Daily and hourly token consumption trends, prompt vs completion splits.
- **Financial Cost Accounting**: Real-time dollar estimation across model providers.
- **Success vs Failure Rates**: Comprehensive execution health metrics.

---

## 4. Technology Stack

| Layer | Technologies |
|:---|:---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Flow, Recharts, Lucide Icons, TanStack Query, React Hook Form, Zod |
| **Backend API** | Node.js (v20+), Express.js, TypeScript, Mongoose / MongoDB, BullMQ, Redis, Zod, Swagger / OpenAPI |
| **AI Orchestration** | Python 3.12, FastAPI, LangGraph, Pydantic, Uvicorn |
| **Data & Cache** | MongoDB (Multi-Tenant Partitioned), Redis (Job Queue & Cache) |
| **Security & Auth** | JWT (HMAC-SHA256), bcrypt password hashing, AES-256-GCM envelope encryption, Helmet, Express Rate Limit |
| **DevOps & Infra** | Docker, Docker Compose, Nginx, GitHub Actions CI |

---

## 5. Prerequisites

Before installing, ensure your development machine or server has:
- **Node.js**: `v20.0.0` or higher (verified on `v24.18.0`)
- **npm**: `v10.0.0` or higher (verified on `11.16.0`)
- **Python**: `3.11` or `3.12` (verified on `3.12.10`)
- **Git**
- *(Optional)*: Docker & Docker Compose (for containerized deployment)

---

## 6. Step-by-Step Installation

### 1. Clone the Repository
```bash
git clone https://github.com/danishalipny-pixel/AgentFlow-Ai-sas.git
cd AgentFlow-Ai-sas
```

### 2. Install Root & Workspace Dependencies
```bash
npm install
```

### 3. Build the Shared TypeScript Package
```bash
npm run build:shared
```

### 4. Setup Python Virtual Environment for AI Service
```bash
cd apps/ai-service
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt
cd ../..
```

---

## 7. Local Development Guide

To run all services concurrently in development mode:

### Option A: Using NPM Workspace Scripts

Open 3 terminal windows:

**Terminal 1: Node.js Backend API**
```bash
npm run dev:api
# API available at http://localhost:5000
# OpenAPI Docs at http://localhost:5000/api/v1/docs
```

**Terminal 2: Frontend Web Application**
```bash
npm run dev:web
# Web UI available at http://localhost:3000
```

**Terminal 3: Python AI Orchestration Service**
```bash
cd apps/ai-service
# Activate venv
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
# AI Service available at http://localhost:8000
```

### Zero-Friction In-Memory DB Mode
If a local MongoDB daemon is not detected at `MONGO_URI`, the API automatically falls back to an embedded in-memory MongoDB instance for seamless local evaluation without requiring external infrastructure.

---

## 8. Docker Deployment Guide

To deploy the entire production stack using Docker Compose:

```bash
# Copy and verify environment variables
cp .env.example .env

# Build optimized production multi-stage images
docker compose build

# Start services in the background
docker compose up -d

# Check service health
docker compose ps
```

Services exposed:
- Web App: `http://localhost:3000`
- API & Docs: `http://localhost:5000/api/v1/docs`
- AI Service: `http://localhost:8000/docs`
- MongoDB: `localhost:27017`
- Redis: `localhost:6379`

---

## 9. Environment Variables Reference

See [`docs/ENVIRONMENT.md`](file:///c:/Users/ULS/Desktop/Agentic%20Flow/docs/ENVIRONMENT.md) for full configuration variables.

| Variable | Description | Default / Example |
|:---|:---|:---|
| `PORT` | API Server port | `5000` |
| `FRONTEND_PORT` | Frontend Vite dev server port | `3000` |
| `AI_SERVICE_URL` | Upstream Python FastAPI service URL | `http://127.0.0.1:8000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/agentflow` |
| `REDIS_URI` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret key for signing authentication tokens | 32+ character random string |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256 secret encryption | 64-char hex string |
| `OPENAI_API_KEY` | OpenAI API key for LLM execution | `sk-...` (Optional for local testing) |
| `STRIPE_SECRET_KEY` | Stripe billing integration key | `sk_test_...` (Optional) |
| `SMTP_HOST` | Outbound email SMTP host | `smtp.example.com` (Optional) |

---

## 10. Available Scripts

From the repository root:

- `npm run build:shared`: Compiles `packages/shared` TypeScript code and declarations.
- `npm run dev:api`: Starts the Express API in TypeScript watch mode via `tsx`.
- `npm run dev:web`: Starts the Vite development server with HMR.
- `npm run build`: Builds all workspaces (`shared`, `api`, `web`) for production with 0 TS errors.
- `npm run test`: Runs all unit and integration test suites.
- `npm run lint`: Validates code style and TypeScript rules across all packages.

---

## 11. API Documentation Summary

The API provides over 18 domains under `/api/v1`:

- `/auth`: Registration, login, JWT refresh, password reset, session validation.
- `/users`: Profile management, password changes, preferences.
- `/organizations`: Tenant management, workspace switching.
- `/members`: Team invitations and RBAC role assignments.
- `/agents`: Agent lifecycle (CRUD, duplication, activation).
- `/agent-templates`: 7 built-in agent archetypes with one-click instantiation.
- `/tasks`: Autonomous task dispatch, status polling, and cancellation.
- `/executions`: Step-by-step telemetry, intermediate thoughts, and tool call traces.
- `/workflows`: Visual DAG pipeline persistence, cycle validation, and execution.
- `/approvals`: Human-in-the-loop review queue (Approve/Reject).
- `/tools`: Sandboxed tool execution and capabilities.
- `/integrations`: Third-party encrypted connectors.
- `/knowledge`: Vectorized document storage and semantic search.
- `/analytics`: Token metrics, financial cost graphs, and health KPIs.
- `/subscriptions`: Tier quotas and Stripe checkout management.
- `/admin`: Super-admin platform oversight and immutable audit logs.

For detailed schemas and payload samples, see [`docs/API.md`](file:///c:/Users/ULS/Desktop/Agentic%20Flow/docs/API.md).

---

## 12. Built-in Agent Templates

1. **Research Agent**: Scrapes web resources, queries internal knowledge, extracts citations, and compiles structured briefings.
2. **Sales Agent**: Scores leads, crafts outreach sequences, and prepares proposals (requires approval before sending).
3. **Customer Support Agent**: Answers queries using authorized documentation, drafting empathetic resolutions.
4. **Developer Agent**: Performs zero-host code review, security audits, and algorithmic refactoring.
5. **Marketing Agent**: Designs multi-platform campaign concepts and produces engaging copywriting.
6. **Data Analyst Agent**: Ingests tabular CSVs, computes statistical metrics, and structures data for visualization.
7. **Project Manager Agent**: Decomposes complex directives, coordinates worker agents, and compiles the final deliverable.

---

## 13. Tool Registry & Sandboxing

All tools run in restricted execution sandboxes:
- **`calculator`**: Safe arithmetic expression parser without `eval()`.
- **`datetime`**: Deterministic ISO-8601 formatting and UTC timezone calculations.
- **`web_fetch`**: HTTP client hardened with pre-flight DNS resolution and RFC-1918 private network blocking.
- **`text_summarizer`**: Extractive keyword and paragraph condenser.
- **`csv_reader`**: Delimiter auto-detecting tabular parser with row-count safety caps.
- **`structured_parser`**: Strict JSON schema validator and extractor.
- **`knowledge_search`**: Multi-tenant scoped vector and text retrieval.

---

## 14. Visual Workflow Builder

Construct complex multi-agent DAGs using React Flow:
- **Interactive Palette**: Drag triggers, agents, conditions, and tools onto the canvas.
- **Connection Validation**: Real-time cycle detection ensures the graph remains a Directed Acyclic Graph (DAG).
- **Execution Telemetry**: Watch nodes transition through `RUNNING`, `SUCCESS`, or `WAITING_APPROVAL`.

See [`docs/WORKFLOWS.md`](file:///c:/Users/ULS/Desktop/Agentic%20Flow/docs/WORKFLOWS.md) for full instructions.

---

## 15. Human Approval Workflow

Sensitive actions (such as sending external messages or mutating core data) are flagged by the orchestrator:
1. Orchestrator halts execution at an approval checkpoint.
2. An approval ticket appears in the **Approvals Queue** (`/approvals`).
3. An authorized manager or admin reviews the proposed payload and either:
   - **Approves**: The workflow immediately resumes execution.
   - **Rejects**: The agent receives explanatory feedback and adjusts its plan safely.

---

## 16. Security Architecture

- **Multi-Tenant Scoping**: All queries enforce `{ organizationId: req.organization._id }`.
- **SSRF Mitigations**: Pre-request DNS resolution blocks access to loopback, link-local, private LANs, and cloud metadata endpoints.
- **Envelope Encryption**: Third-party secrets are encrypted with AES-256-GCM.
- **Zero Host Evaluation**: Code is never executed via shell or `eval()` on the server.
- **Rate Limiting & Helmet**: DDoS and brute-force protection out of the box.

See [`docs/SECURITY.md`](file:///c:/Users/ULS/Desktop/Agentic%20Flow/docs/SECURITY.md) for full security controls.

---

## 17. Multi-Tenancy Implementation

- Multi-tenant architecture with logical partitioning.
- Tenant context passed through authenticated session and validated via the `x-organization-id` header.
- Cross-tenant queries are blocked at both the API and database query layer.

---

## 18. Testing Guide

### Running Backend Unit Tests
```bash
cd apps/api
npm test
```
*Validates SSRF private IP blocking, safe math evaluation, and DAG cycle detection.*

### Running Python AI Service Tests
```bash
cd apps/ai-service
python -m pytest tests/test_graph.py -v
```
*Tests supervisor agent decomposition, state graph transitions, tool execution, and approval pausing.*

---

## 19. Project Structure

```
c:\Users\ULS\Desktop\Agentic Flow\
├── .github/
│   └── workflows/ci.yml         # GitHub Actions automated CI workflow
├── apps/
│   ├── api/                     # Node.js + Express + TypeScript Backend
│   │   ├── src/
│   │   │   ├── config/          # DB, Swagger, environment configs
│   │   │   ├── controllers/     # 18 domain controllers
│   │   │   ├── middlewares/     # Auth, Tenant, RBAC, Validation, Error Handling
│   │   │   ├── models/          # 16 Mongoose models
│   │   │   ├── routes/          # Express route definitions
│   │   │   └── services/        # Orchestration, Tool, Workflow, Approval, Audit services
│   │   └── tests/               # SSRF and Workflow validation Jest test suites
│   ├── web/                     # React 18 + Vite + Tailwind CSS Frontend
│   │   ├── src/
│   │   │   ├── components/      # UI components, layout, TopNav, Sidebar
│   │   │   ├── contexts/        # Auth and Toast context providers
│   │   │   ├── pages/           # 16 complete SaaS views
│   │   │   └── services/        # Axios API client with auth interceptors
│   └── ai-service/              # Python FastAPI + LangGraph Orchestration Engine
│       ├── app/
│       │   ├── agents/          # LangGraph supervisor & worker state graphs
│       │   ├── schemas/         # Pydantic schemas for orchestration
│       │   └── tools/           # Python tool registry
│       └── tests/               # Pytest orchestration tests
├── packages/
│   └── shared/                  # Shared TypeScript types, enums, Zod schemas, templates
├── infrastructure/
│   ├── docker/                  # Dockerfiles for api, web, ai-service
│   └── nginx/                   # Reverse proxy configuration
├── docs/                        # Complete technical documentation suite
├── docker-compose.yml           # Production multi-container composition
└── package.json                 # Monorepo npm workspaces configuration
```

---

## 20. Troubleshooting

| Symptom | Cause | Solution |
|:---|:---|:---|
| **MongoDB Connection Error** | MongoDB daemon not running locally | Ensure MongoDB service is started, or let the API use its automated in-memory DB fallback for local testing. |
| **CORS Rejected in Browser** | `CORS_ORIGIN` does not match web client URL | Update `CORS_ORIGIN` in `.env` to match `http://localhost:3000`. |
| **AI Service Connection Refused** | Python FastAPI service not running | Start the AI service via `uvicorn app.main:app --port 8000` in `apps/ai-service`. |
| **Tool Execution Blocked (SSRF)** | Target URL resolves to a private IP (e.g., `192.168.x.x` or `127.0.0.1`) | The SSRF guard strictly forbids requests to private or internal addresses. Query public URLs only. |
| **Stripe / SMTP Warnings** | Optional API keys missing in `.env` | The platform displays informative setup banners. Add credentials to `.env` when ready for production integrations. |

---

## 21. Contributing Guide

1. Fork the repository and create a feature branch (`git checkout -b feature/agent-capability`).
2. Ensure all packages build cleanly with **zero TypeScript errors** (`npm run build`).
3. Write comprehensive unit tests for any new tools, middleware, or orchestration nodes.
4. Run tests and ensure all pass (`npm test` and `pytest`).
5. Open a pull request describing the changes and test coverage.

---

## 22. Roadmap

- [ ] Multi-region Redis cluster support for global orchestration.
- [ ] Direct fine-tuning pipeline integration for custom domain agents.
- [ ] Voice and multimodal streaming support for customer support agents.
- [ ] Pre-built integrations for Notion, Jira, and Salesforce.

---

## 23. License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 24. Developer & Support

- **Lead Developer**: Danish Rashid ([@danishalipny-pixel](https://github.com/danishalipny-pixel))
- **Repository**: [https://github.com/danishalipny-pixel/AgentFlow-Ai-sas](https://github.com/danishalipny-pixel/AgentFlow-Ai-sas)
- **Documentation**: Explore the [`docs/`](./docs) directory for API references, security guidelines, and architectural specifications.
- **Issues**: Submit bug reports and feature requests via GitHub Issues.
