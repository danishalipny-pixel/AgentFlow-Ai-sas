# AGENTFLOW AI — Security Architecture & Guidelines

AGENTFLOW AI handles sensitive multi-tenant data, proprietary agent system prompts, and automated third-party actions. This document outlines the security architecture, threat model mitigations, and compliance controls implemented across the platform.

---

## 1. Multi-Tenant Data Isolation

### Architecture
- **Logical Data Partitioning**: Every tenant-owned database record in MongoDB (`Agent`, `Task`, `Execution`, `ExecutionStep`, `Workflow`, `Approval`, `Integration`, `KnowledgeDocument`, `AuditLog`) includes a mandatory, indexed `organizationId` field referencing the parent `Organization`.
- **Backend Query Scoping**:
  - Tenant context is extracted and cryptographically validated via the `tenantMiddleware` on every incoming API request.
  - Queries are never reliant on client-supplied parameters for isolation; `organizationId` is enforced at the controller and Mongoose query layer (`{ organizationId: req.organization._id }`).
  - Cross-tenant data leakage is structurally impossible even if a malicious user manipulates payload IDs.
- **Tenant Switching**: Users can switch organizations using their authorized membership list. Each switch verifies that the user holds an active, non-suspended `OrganizationMember` record in the target workspace.

---

## 2. Authentication & Session Security

- **Password Hashing**: Passwords are encrypted using salted `bcrypt` with 12 rounds before being stored. Plaintext passwords never touch logs, metrics, or persistence layers.
- **JWT Architecture**:
  - **Short-Lived Access Tokens**: Signed with `JWT_SECRET` (HMAC-SHA256) and set to expire within 15 minutes.
  - **Refresh Tokens**: Cryptographically random strings hashed and stored in the database, expiring after 7 days with single-use rotation.
- **Brute-Force & Denial-of-Service Defense**:
  - IP-based rate limiting via Express middleware (`express-rate-limit`).
  - Auth routes (`/api/v1/auth/login`, `/api/v1/auth/register`) are capped to 10 requests per 15-minute window per IP.
  - General API endpoints are rate-limited to 100 requests per minute per authenticated identity.

---

## 3. Server-Side Request Forgery (SSRF) Guard

The `web_fetch` tool permits AI agents to retrieve public URLs for research. To prevent attackers from using agents to probe internal cloud metadata services, VPCs, or localhost daemons, a strict SSRF guard is enforced:

### Blocked Target Networks
1. **Loopback**: `127.0.0.0/8`, `::1/128`, `localhost`
2. **RFC-1918 Private Networks**:
   - `10.0.0.0/8`
   - `172.16.0.0/12`
   - `192.168.0.0/16`
3. **Cloud Instance Metadata (IMDS)**:
   - `169.254.169.254` (AWS, GCP, Azure, DigitalOcean metadata service)
4. **Link-Local & Carrier-Grade NAT**:
   - `169.254.0.0/16`
   - `100.64.0.0/10`
5. **IPv6 Unique Local / Site Local**:
   - `fc00::/7`, `fe80::/10`

### Implementation Safeguards
- **Pre-Flight DNS Resolution**: The hostname is resolved to an IPv4/IPv6 address *before* the request is issued. If any resolved IP belongs to a reserved or private range, the request is aborted immediately with `400 Bad Request: Target address is private or restricted`.
- **Protocol Whitelisting**: Only `http:` and `https:` schemes are permitted. Schemes like `file://`, `gopher://`, `dict://`, `ftp://`, or `ldap://` are strictly rejected.
- **Redirect Validation**: HTTP redirects (`301`, `302`, `307`, `308`) are followed manually with DNS verification applied recursively at each redirect hop to eliminate DNS-rebinding attacks.
- **Response Size & Timeout Caps**: Maximum download payload is capped at 5 MB; request timeout is enforced at 10 seconds.

---

## 4. Credential & Secret Management

- **Envelope Encryption**: Third-party API keys (OpenAI keys, Slack tokens, GitHub tokens, webhook signing secrets) are encrypted before writing to MongoDB using **AES-256-GCM** with a unique Initialization Vector (IV) and authentication tag.
- **Payload Masking**: When integrations are returned via the API or displayed in the frontend, secrets are masked (e.g., `sk-ant...a84f`). The raw secret is never sent to the browser after creation.
- **Environment Separation**: No production secrets exist in source control. `.env.example` provides template variables, and all sensitive variables (`JWT_SECRET`, `ENCRYPTION_KEY`, `MONGO_URI`, `REDIS_URI`) are injected at runtime via environment variables or secret managers.

---

## 5. Sandboxed Tool Execution

- **Zero Host Evaluation**: The Developer Agent and mathematical tools NEVER execute untrusted code on the host operating system using `eval()`, `exec()`, or child processes.
- **Isolated Math Parser**: Mathematical calculations in the `calculator` tool are evaluated using an AST-based parser that permits arithmetic operators only, preventing code execution or prototype pollution.
- **Safe CSV & JSON Parsers**: Tabular and structured inputs are parsed with strict recursion limits, memory bounds, and defensive null-checking.

---

## 6. Human-in-the-Loop Approval Checkpoints

Sensitive or destructive agent actions (such as sending emails, deleting data, dispatching payments, or triggering production deploys) trigger an automatic human approval checkpoint:
1. Orchestrator detects a sensitive tool action request.
2. Execution state transitions to `WAITING_APPROVAL`.
3. An `Approval` record is created with action details, payload diff, and target parameters.
4. Tenant managers/admins receive instant notification.
5. Execution remains safely suspended in Redis/DB until an authorized user submits an explicit `APPROVED` or `REJECTED` decision with review comments.
6. If rejected or timed out, the agent gracefully adjusts its plan or safely terminates.

---

## 7. Role-Based Access Control (RBAC) Matrix

| Resource / Action | Owner | Admin | Manager | Member | Viewer |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Delete Organization** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Manage Billing & Subscriptions** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Invite & Remove Team Members** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Manage Integrations & Secrets** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Approve Sensitive Actions** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Create & Edit Agents / Workflows** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Execute Tasks & View Logs** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Read Knowledge Base & Analytics** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 8. HTTP Security Headers & CORS

The Express API applies industry-standard HTTP security headers via `helmet`:
- `Content-Security-Policy`: Restricts script and asset origins.
- `X-Frame-Options: DENY`: Mitigates clickjacking.
- `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing.
- `Strict-Transport-Security`: Enforces TLS (HSTS) with 1-year max age.
- `CORS`: Whitelisted strictly to approved frontend origins defined in `CORS_ORIGIN`. Wildcard origins (`*`) are disallowed in production.

---

## 9. Immutable Audit Logging

Every critical security event is recorded in the `AuditLog` collection:
- Event types: `AUTH_LOGIN`, `AUTH_LOGOUT`, `AGENT_CREATED`, `AGENT_MODIFIED`, `AGENT_DELETED`, `TASK_EXECUTED`, `APPROVAL_GRANTED`, `APPROVAL_REJECTED`, `INTEGRATION_CONNECTED`, `MEMBER_INVITED`, `MEMBER_REMOVED`.
- Recorded metadata: Actor User ID, Organization ID, Action Type, IP Address, User Agent, Timestamp, and Payload Diff.
- Audit logs are append-only; modification or deletion is disallowed at the API layer.
