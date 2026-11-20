# AGENTFLOW AI — RESTful API Documentation

Version: `1.0.0`  
Base URL: `/api/v1`  
Interactive OpenAPI/Swagger Documentation: `http://localhost:5000/api/v1/docs`  
Health Check: `http://localhost:5000/health`

---

## 1. Authentication & Tenant Headers

All protected endpoints require a valid JWT Bearer token and an active Organization context header.

| Header Name | Type | Description | Required |
|:---|:---|:---|:---|
| `Authorization` | `string` | `Bearer <access_token>` issued during login/register | Yes (for protected routes) |
| `x-organization-id` | `string` | MongoDB ObjectId of the current tenant workspace | Yes (for all tenant-scoped routes) |
| `Content-Type` | `string` | `application/json` | Yes (for requests with body) |

### Error Response Schema
All errors conform to a predictable structure:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | RATE_LIMITED | INTERNAL_ERROR",
    "message": "Human-readable description of what went wrong",
    "details": [
      {
        "field": "email",
        "message": "Invalid email address format"
      }
    ]
  }
}
```

---

## 2. Authentication Domain (`/api/v1/auth`)

### POST `/auth/register`
Create a new user account, initialize their personal organization workspace, and generate auth tokens.
- **Access**: Public
- **Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "StrongPassword123!"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "673da123...",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "MEMBER",
        "isEmailVerified": false
      },
      "organization": {
        "id": "673da456...",
        "name": "Jane Doe's Workspace",
        "slug": "jane-does-workspace"
      },
      "tokens": {
        "accessToken": "eyJhbGciOiJIUzI1NiIs...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
      }
    }
  }
  ```

### POST `/auth/login`
Authenticate credentials and issue JWT tokens.
- **Access**: Public (Subject to brute-force rate limiter)
- **Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "StrongPassword123!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "673da123...", "name": "Jane Doe", "email": "jane@example.com" },
      "defaultOrgId": "673da456...",
      "tokens": {
        "accessToken": "eyJhbGciOiJIUzI1NiIs...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
      }
    }
  }
  ```

### POST `/auth/refresh`
Refresh expired access tokens using a valid refresh token.
- **Body**: `{ "refreshToken": "..." }`
- **Response `200 OK`**: Returns new `accessToken`.

### POST `/auth/forgot-password`
Initiate password reset flow and emit verification token/email.
- **Body**: `{ "email": "user@example.com" }`

### POST `/auth/reset-password`
Reset password using token received via email/admin.
- **Body**: `{ "token": "...", "newPassword": "NewStrongPassword123!" }`

### GET `/auth/me`
Retrieve currently authenticated user session and their organizations.
- **Access**: Protected (`Bearer <token>`)

---

## 3. Organization & Team Domain

### GET `/organizations`
List all organizations that the current user belongs to.

### POST `/organizations`
Create a new tenant organization workspace.
- **Body**: `{ "name": "Acme Ventures", "slug": "acme-ventures" }`

### GET `/organizations/:orgId`
Get details and current tier of specified workspace.

### GET `/members`
List all team members and their RBAC roles (`OWNER`, `ADMIN`, `MANAGER`, `MEMBER`, `VIEWER`).
- **Headers**: `x-organization-id: <orgId>`

### POST `/members/invite`
Invite a new user to the organization.
- **Required Role**: `OWNER` or `ADMIN`
- **Body**: `{ "email": "colleague@example.com", "role": "MANAGER" }`

### DELETE `/members/:memberId`
Remove a member from the organization.
- **Required Role**: `OWNER` or `ADMIN`

---

## 4. AI Agents Domain (`/api/v1/agents` & `/api/v1/agent-templates`)

### GET `/agent-templates`
Retrieve catalog of the 7 pre-engineered built-in agent archetypes:
1. Research Agent
2. Sales Agent
3. Customer Support Agent
4. Developer Agent
5. Marketing Agent
6. Data Analyst Agent
7. Project Manager Agent

### POST `/agent-templates/:templateId/instantiate`
Instantiate a production agent directly from a built-in template into the organization.

### GET `/agents`
List all custom and instantiated agents within the tenant.
- **Query Params**: `status=active|inactive`, `role=RESEARCH|SALES|...`

### POST `/agents`
Create a new custom AI Agent.
- **Body**:
  ```json
  {
    "name": "Audit Security Bot",
    "role": "DEVELOPER",
    "description": "Reviews codebase pull requests for OWASP vulnerabilities.",
    "systemPrompt": "You are a senior security researcher. Audit code strictly...",
    "model": "gpt-4o",
    "temperature": 0.2,
    "maxTokens": 4096,
    "maxSteps": 15,
    "timeoutSeconds": 180,
    "tokenBudget": 50000,
    "tools": ["calculator", "knowledge_search", "structured_parser"]
  }
  ```

### PATCH `/agents/:agentId`
Update agent configuration, prompts, model hyperparameters, or tool permissions.

### POST `/agents/:agentId/duplicate`
Clone an agent with a new name and identical settings.

### DELETE `/agents/:agentId`
Archive or permanently delete an agent.

---

## 5. Tasks & Orchestration (`/api/v1/tasks` & `/api/v1/executions`)

### GET `/tasks`
List all assigned tasks within the workspace.
- **Query Params**: `status=pending|running|waiting_approval|completed|failed|cancelled`, `priority=low|medium|high|critical`

### POST `/tasks`
Create and dispatch an autonomous task.
- **Body**:
  ```json
  {
    "title": "Analyze Q3 Churn Patterns",
    "description": "Cross-reference support tickets with usage drops and produce report.",
    "agentId": "673da789...",
    "priority": "HIGH",
    "context": {
      "targetCohort": "Enterprise tier",
      "timeframe": "Q3 2026"
    }
  }
  ```

### GET `/tasks/:taskId`
Get comprehensive task details including execution status, duration, and final output.

### POST `/tasks/:taskId/cancel`
Halt an in-flight background task execution safely.

### GET `/executions/:executionId`
Fetch full telemetry for an execution run.

### GET `/executions/:executionId/steps`
Retrieve the real-time chronological execution trace including:
- `THOUGHT`: Reasoning steps
- `TOOL_CALL`: Tool name, input parameters, and execution timestamp
- `TOOL_RESULT`: Sanitized outputs returned from tools
- `APPROVAL_REQUEST`: Human checkpoint pauses
- `MESSAGE`: Intermediate communications
- `FINAL_OUTPUT`: Synthesized task resolution

---

## 6. Approvals & Human-in-the-Loop (`/api/v1/approvals`)

### GET `/approvals`
List all pending, approved, and rejected actions requiring human sign-off.
- **Query Params**: `status=PENDING|APPROVED|REJECTED`

### POST `/approvals/:approvalId/approve`
Approve a sensitive tool action (e.g., sending emails, modifying production databases, dispatching payments).
- **Body**: `{ "feedback": "Approved for 10 initial trial accounts." }`
- **Effect**: Resumes paused workflow execution immediately.

### POST `/approvals/:approvalId/reject`
Reject an action with explanatory feedback for the agent.
- **Body**: `{ "reason": "Target email cohort contains unverified leads." }`
- **Effect**: Informs the agent of rejection so it can alter its plan or terminate safely.

---

## 7. Visual Workflows (`/api/v1/workflows`)

### GET `/workflows`
List multi-agent DAG workflows.

### POST `/workflows`
Save a new visual workflow created in the React Flow builder.
- **Body**:
  ```json
  {
    "name": "Lead Qualification & Enrichment Pipeline",
    "description": "Multi-agent pipeline from inbound scrape to personalized draft",
    "nodes": [
      { "id": "node-1", "type": "TRIGGER", "position": { "x": 100, "y": 100 }, "data": { "label": "Webhook" } },
      { "id": "node-2", "type": "AGENT", "position": { "x": 350, "y": 100 }, "data": { "agentId": "673..." } },
      { "id": "node-3", "type": "APPROVAL", "position": { "x": 600, "y": 100 }, "data": { "action": "send_email" } }
    ],
    "edges": [
      { "id": "e1-2", "source": "node-1", "target": "node-2" },
      { "id": "e2-3", "source": "node-2", "target": "node-3" }
    ]
  }
  ```

### POST `/workflows/validate`
Validates DAG integrity before saving or running (detects cycles, orphan nodes, disconnected outputs).

### POST `/workflows/:workflowId/execute`
Trigger an end-to-end execution of the visual workflow.

---

## 8. Sandboxed Tools & Integrations (`/api/v1/tools` & `/api/v1/integrations`)

### GET `/tools`
List all 7 sandboxed system tools with schemas:
1. `calculator`: Safe mathematical precision evaluation.
2. `datetime`: UTC and timezone formatting.
3. `web_fetch`: SSRF-protected HTTP GET with strict RFC-1918 private IP blocking.
4. `text_summarizer`: Extractive text condensing.
5. `csv_reader`: Structured tabular parser with delimiter auto-detection.
6. `structured_parser`: Strict JSON extractor and validator.
7. `knowledge_search`: Vector and keyword search over tenant documents.

### POST `/tools/:toolName/execute`
Directly test or execute a sandboxed tool in isolated execution context.

### GET `/integrations` & POST `/integrations`
Manage third-party connectors (Slack, GitHub, HubSpot, Stripe, Webhooks). Secrets are stored using AES-256-GCM envelope encryption and never returned in API payloads.

---

## 9. Knowledge Base & Vector Search (`/api/v1/knowledge`)

### GET `/knowledge`
List uploaded documents and vectorized knowledge chunks.

### POST `/knowledge`
Upload document text/markdown for agent RAG retrieval.
- **Body**: `{ "title": "Refund Policy 2026", "content": "Full policy content..." }`

### POST `/knowledge/search`
Query knowledge base with semantic similarity scoring.

---

## 10. Analytics & Telemetry (`/api/v1/analytics`)

### GET `/analytics/overview`
High-level summary KPIs:
- Total Tasks Executed
- Active Agents Count
- Total LLM Tokens Consumed
- Real-time Estimated Cost ($ USD)
- Task Success Rate (%)

### GET `/analytics/trends`
Daily/hourly timeseries data for Recharts graphing:
- Token breakdown (Prompt vs Completion)
- Task completions vs failures
- Cost distribution across departments

---

## 11. Subscriptions & Billing (`/api/v1/subscriptions`)

### GET `/subscriptions/current`
Get current subscription plan (`STARTER`, `PRO`, `ENTERPRISE`), billing interval, and seat utilization.

### POST `/subscriptions/checkout`
Create Stripe Checkout Session URL for self-serve upgrades. If Stripe API keys are not supplied in `.env`, returns an explicit unconfigured notification without breaking the UI.

---

## 12. Super Admin Portal (`/api/v1/admin`)

- **Access**: Strictly restricted to users with `isSuperAdmin: true`.
- **Endpoints**:
  - `GET /admin/stats`: Global infrastructure health, multi-tenant counts, total platform spend.
  - `GET /admin/users`: Global user search, suspension, and impersonation auditing.
  - `GET /admin/organizations`: All registered tenants with storage limits and plan tiers.
  - `GET /admin/audit-logs`: Immutable system-wide security audit trail.
