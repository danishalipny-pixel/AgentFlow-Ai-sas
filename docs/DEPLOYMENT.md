# AGENTFLOW AI — Production Deployment Guide

This guide details how to deploy AGENTFLOW AI in a secure, containerized, production-ready environment using Docker Compose and an Nginx reverse proxy.

---

## 1. Architecture Topology

```
                  Internet (HTTPS :443)
                            │
                            ▼
              ┌───────────────────────────┐
              │    Nginx Reverse Proxy    │
              │  SSL Termination / Gzip   │
              └─────────────┬─────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       │ /                  │ /api               │ /ai-service
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Web Service │     │  Node API    │     │  Python AI   │
│  (Port 3000) │     │  (Port 5000) │     │  (Port 8000) │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                     ┌──────┴──────┐
                     ▼             ▼
             ┌──────────────┐ ┌──────────────┐
             │   MongoDB    │ │ Redis Cache  │
             │ (Port 27017) │ │ (Port 6379)  │
             └──────────────┘ └──────────────┘
```

---

## 2. Prerequisites

- **Hardware**: Minimum 4 vCPU, 8 GB RAM, 50 GB SSD storage.
- **Operating System**: Ubuntu 22.04 LTS / Debian 12 / RHEL 9 or modern Linux kernel.
- **Software**:
  - Docker Engine v24.0+ (`docker --version`)
  - Docker Compose v2.20+ (`docker compose version`)
- **Domain & DNS**: Registered domain with an `A` record pointing to your server's public IP.

---

## 3. Production Environment Configuration

Create a production `.env` file from the provided `.env.example`:

```bash
cp .env.example .env.production
```

Edit `.env.production` with your production values:

```ini
NODE_ENV=production
PORT=5000
FRONTEND_PORT=3000
AI_SERVICE_PORT=8000

# Client & CORS
CORS_ORIGIN=https://app.agentflow.ai
VITE_API_URL=https://app.agentflow.ai/api/v1

# Security Secrets (Generate using: openssl rand -hex 32)
JWT_SECRET=f3a8...e42b
ENCRYPTION_KEY=91c7...b820

# Databases
MONGO_URI=mongodb://admin:SecurePass123!@mongodb:27017/agentflow?authSource=admin
REDIS_URI=redis://:RedisPass123!@redis:6379

# AI & LLM Engine
OPENAI_API_KEY=sk-proj-...
AI_SERVICE_URL=http://ai-service:8000

# Billing (Optional - UI gracefully displays setup status if omitted)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SMTP Email (Optional - displays clear configuration warning if omitted)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG....
SMTP_FROM=noreply@agentflow.ai
```

---

## 4. Building & Running with Docker Compose

To build all container images and launch the cluster in detached mode:

```bash
# Build multi-stage optimized production images
docker compose -f docker-compose.yml build

# Start services in the background
docker compose -f docker-compose.yml up -d
```

### Verify Service Health
```bash
docker compose ps
```

All 5 services should show `Up (healthy)`:
- `agentflow-web`: `http://localhost:3000`
- `agentflow-api`: `http://localhost:5000/health`
- `agentflow-ai`: `http://localhost:8000/health`
- `agentflow-mongo`: Port 27017
- `agentflow-redis`: Port 6379

---

## 5. SSL & Nginx Reverse Proxy Setup

An enterprise Nginx configuration is provided at `infrastructure/nginx/default.conf`.

### Installing Let's Encrypt SSL via Certbot:
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d app.agentflow.ai
```

### Reloading Nginx:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. Database Backups & Maintenance

### Automated MongoDB Backups (Cron job)
Create `/usr/local/bin/agentflow-backup.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_DIR="/var/backups/agentflow"
mkdir -p $BACKUP_DIR

docker exec agentflow-mongo mongodump \
  --username admin \
  --password SecurePass123! \
  --authenticationDatabase admin \
  --db agentflow \
  --archive="$BACKUP_DIR/agentflow_$DATE.archive" --gzip

# Keep 14 days of backups
find $BACKUP_DIR -type f -name "*.archive" -mtime +14 -exec rm {} +
```
Make executable and add to crontab:
```bash
chmod +x /usr/local/bin/agentflow-backup.sh
crontab -e
# Run daily at 02:00 AM
0 2 * * * /usr/local/bin/agentflow-backup.sh
```

---

## 7. Zero-Downtime Rolling Updates

When deploying a new version of AGENTFLOW AI:

```bash
git pull origin main
docker compose build api web ai-service
docker compose up -d --no-deps --build web
docker compose up -d --no-deps --build api
docker compose up -d --no-deps --build ai-service
```
