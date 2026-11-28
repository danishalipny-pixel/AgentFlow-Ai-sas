# Environment Variables & Secret Configuration Guide

This document details every environment variable required or supported by **AGENTFLOW AI**.

---

## 1. Master Configuration Table

| Variable | Required | Default | Purpose & Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | No | `development` | Environment mode (`development`, `production`, `test`). |
| `PORT` | No | `5201` | HTTP port for the Node.js / Express backend service. |
| `API_URL` | No | `http://localhost:5201` | Publicly reachable URL for the API service. |
| `APP_BASE_URL` | No | `http://localhost:5200` | Public URL of the frontend Web application. |
| `CORS_ORIGIN` | No | `http://localhost:5200` | Allowed CORS origins for browser security. |
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/agentflow` | MongoDB connection string. Fallback memory engine used in dev if unavailable. |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis instance connection string for BullMQ queue processing. |
| `JWT_SECRET` | Yes | *dev fallback* | 256-bit secret key used to sign and verify user access tokens. |
| `JWT_EXPIRES_IN` | No | `7d` | Lifespan of JWT access tokens. |
| `JWT_REFRESH_SECRET` | Yes | *dev fallback* | Secret key used to sign long-lived refresh tokens. |
| `JWT_REFRESH_EXPIRES_IN` | No | `30d` | Lifespan of session refresh tokens. |
| `ENCRYPTION_KEY` | Yes | *32 byte hex* | AES-256-GCM symmetric key used to encrypt customer integration secrets at rest. |
| `AI_SERVICE_URL` | No | `http://localhost:5202` | Internal URL to the Python FastAPI multi-agent engine. |
| `AI_SERVICE_PORT` | No | `5202` | Port on which the Python FastAPI service listens. |
| `OLLAMA_BASE_URL` | Yes | `http://localhost:11434` | Local Ollama endpoint for 100% free CPU-based LLM inference. |
| `DEFAULT_AI_MODEL` | No | `qwen2.5:7b` | Primary general-purpose local LLM assigned to agents. |
| `CODER_AI_MODEL` | No | `qwen2.5-coder:7b` | Specialized local LLM for code analysis and architecture. |
| `AI_EXECUTION_TIMEOUT_SECONDS` | No | `180` | Max timeout for a single autonomous agent step before aborting. |
| `ENFORCE_APPROVAL_FOR_MUTATIONS` | No | `true` | System-wide guard enforcing human approval checkpoints. |
| `SSRF_PROTECTION_ENABLED` | No | `true` | Enforces loopback, link-local metadata, and private IP blocks on HTTP tools. |
| `SMTP_HOST` | No | *empty* | Host address of SMTP server for transactional and alert emails. |
| `SMTP_PORT` | No | `587` | SMTP port (587 for TLS, 465 for SSL). |
| `SMTP_USER` | No | *empty* | SMTP account username. |
| `SMTP_PASSWORD` | No | *empty* | SMTP account password. |
| `EMAIL_FROM` | No | `AgentFlow AI <no-reply@...>` | Sender address on all dispatched emails. |
| `STRIPE_SECRET_KEY` | No | *empty* | Stripe secret key (`sk_live_...` or `sk_test_...`) for subscription billing. |
| `STRIPE_WEBHOOK_SECRET` | No | *empty* | Stripe webhook signing secret (`whsec_...`) for subscription lifecycle events. |
| `UPLOAD_MAX_FILE_SIZE_BYTES` | No | `15728640` | Max knowledge base upload size in bytes (default 15MB). |
| `PLATFORM_ADMIN_EMAIL` | No | `admin@agentflow.ai` | Seed platform administrator account email. |
| `PLATFORM_ADMIN_PASSWORD` | No | `AdminSecurePassword123!` | Seed platform administrator account password. |

---

## 2. Generating Secure Encryption Keys

To generate a secure 32-byte hexadecimal encryption key for `ENCRYPTION_KEY`:

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32
```
