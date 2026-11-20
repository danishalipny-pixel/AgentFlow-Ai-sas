# AGENTFLOW AI — Local Development Guide

This guide describes how to run, test, and contribute to the AGENTFLOW AI monorepo on a local developer workstation.

---

## 1. Prerequisites

- **Node.js**: `v20.x` or `v22.x+` (verified on Node `v24.18.0`)
- **npm**: `v10.x+` (verified on npm `11.16.0`)
- **Python**: `3.11+` or `3.12+` (verified on Python `3.12.10`)
- **Git**

*(Note: Docker is optional for local development. AGENTFLOW AI provides automated in-memory MongoDB fallback if a local MongoDB instance is not detected, enabling instant local startup without external daemon setup).*

---

## 2. Monorepo Structure

```
agentflow/
├── packages/
│   └── shared/             # Canonical TypeScript types, enums, Zod schemas, templates
├── apps/
│   ├── web/                # React 18 + Vite + Tailwind CSS + React Flow SPA
│   ├── api/                # Express.js + Mongoose + BullMQ + JWT API
│   └── ai-service/         # FastAPI + LangGraph Python Orchestration Service
├── infrastructure/         # Dockerfiles, Nginx configurations
├── docs/                   # Full system documentation
├── package.json            # npm workspaces root config
└── docker-compose.yml      # Multi-container local orchestration
```

---

## 3. Step-by-Step Local Setup

### Step 1: Install Node Dependencies
From the repository root:
```bash
npm install
```

### Step 2: Build the Shared Package
The shared package contains schemas and enums used across frontend and backend:
```bash
npm run build:shared
```
*(This outputs compiled TypeScript declarations and JavaScript files to `packages/shared/dist/`)*.

### Step 3: Setup Python AI Service Virtual Environment
In a dedicated terminal:
```bash
cd apps/ai-service
python -m venv venv

# On Windows PowerShell:
.\venv\Scripts\Activate.ps1

# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### Step 4: Environment Variables
Copy `.env.example` to `.env` in the root (or `apps/api/.env` and `apps/web/.env`):
```bash
cp .env.example .env
```
Ensure `JWT_SECRET` and `ENCRYPTION_KEY` are populated with random 32-character strings for local testing.

---

## 4. Running the Development Servers

You can run each service in separate terminal windows:

### Terminal 1: Backend API (Node / Express)
```bash
npm run dev:api
```
- Listens on `http://localhost:5000`
- Interactive Swagger docs at `http://localhost:5000/api/v1/docs`
- Health check at `http://localhost:5000/health`

### Terminal 2: Frontend Client (Vite / React)
```bash
npm run dev:web
```
- Available at `http://localhost:3000`
- Hot Module Replacement (HMR) active

### Terminal 3: AI Service (FastAPI / LangGraph)
```bash
cd apps/ai-service
# Activate venv if not already active
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Health check at `http://localhost:8000/health`
- OpenAPI docs at `http://localhost:8000/docs`

---

## 5. Running Automated Tests

### Backend Unit Tests (SSRF Guards, Workflow Validation, Calculations)
```bash
cd apps/api
npm test
```
*Executes Jest test suites verifying SSRF private IP blocking and workflow DAG validation.*

### Python AI Service Tests (LangGraph Multi-Agent Orchestrator)
```bash
cd apps/ai-service
python -m pytest tests/test_graph.py -v
```
*Validates supervisor decomposition, multi-agent state progression, tool execution, and approval halts.*

---

## 6. Verifying Production Builds

Before submitting pull requests, ensure all workspace packages build with **zero TypeScript errors**:

```bash
# Build shared types
npm run build:shared

# Build backend API
npm --prefix apps/api run build

# Build frontend SPA
npm --prefix apps/web run build
```

---

## 7. Code Standards & Architecture Guidelines

1. **Zero Fake Responses**: Never fabricate mock responses in API routes or simulate success when actions fail.
2. **Tenant Scoping**: All Mongoose queries must include `organizationId: req.organization._id`.
3. **Input Validation**: Use Zod schemas from `@agentflow/shared` for both client forms and backend route validation.
4. **Secret Protection**: Never expose API keys or encryption secrets to the frontend. Mask all sensitive strings.
