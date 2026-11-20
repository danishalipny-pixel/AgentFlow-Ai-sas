# Environment Variables & Secret Configuration Guide

This document details every environment variable required or supported by **AGENTFLOW AI**.

---

## 1. Master Configuration Table

| Variable | Required | Default | Purpose & Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | No | `development` | Environment mode (`development`, `production`, `test`). |
| `PORT` | No | `5000` | HTTP port for the Node.js / Express backend service. |
| `API_URL` | No | `http://localhost:5000` | Publicly reachable URL for the API service. |
| `APP_BASE_URL` | No | `http://localhost:5173` | Public URL of the frontend Web application. |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origins for browser security. |
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/agentflow` | MongoDB connection string. Fallback memory engine used in dev if unavailable. |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis instance connection string for BullMQ queue processing. |
| `JWT_SECRET` | Yes | *dev fallback* | 256-bit secret key used to sign and verify user access tokens. |
| `JWT_EXPIRES_IN` | No | `7d` | Lifespan of JWT access tokens. |
| `JWT_REFRESH_SECRET` | Yes | *dev fallback* | Secret key used to sign long-lived refresh tokens. |
| `JWT_REFRESH_EXPIRES_IN` | No | `30d` | Lifespan of session refresh tokens. |
| `ENCRYPTION_KEY` | Yes | *32 byte hex* | AES-256-GCM symmetric key used to encrypt customer integration secrets at rest. |
| `AI_SERVICE_URL` | No | `http://localhost:8000` | Internal URL to the Python FastAPI multi-agent engine. |
| `AI_SERVICE_PORT` | No | `8000` | Port on which the Python FastAPI service listens. |
| `OPENAI_API_KEY` | No | *empty* | OpenAI API Key for GPT-4o / GPT-4o-mini inference. |
| `DEFAULT_AI_MODEL` | No | `gpt-4o-mini` | Default LLM model assigned to newly created agents. |
| `AI_EXECUTION_TIMEOUT_SECONDS` | No | `120` | Max timeout for a single autonomous agent step before aborting. |
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
