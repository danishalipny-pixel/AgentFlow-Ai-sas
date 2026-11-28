# AGENTFLOW AI — Setup and Installation Guide

This guide covers setting up AGENTFLOW AI for both local development and production environments.

---

## System Requirements

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **Python**: v3.11 or v3.12
- **Git**
- **Docker & Docker Compose** (optional, recommended for production)

---

## Local Development Quickstart

### 1. Clone the Repository
```bash
git clone https://github.com/danishalipny-pixel/AgentFlow-Ai-sas.git
cd AgentFlow-Ai-sas
```

### 2. Install Node Dependencies
From the repository root:
```bash
npm install
```

### 3. Build the Shared Package
```bash
npm run build:shared
```

### 4. Setup Local Ollama LLM (Zero Paid APIs)
AGENTFLOW AI runs 100% locally with zero cloud API keys or billing dependencies.
1. Download & install Ollama from [https://ollama.com](https://ollama.com).
2. Start Ollama:
   ```bash
   ollama serve
   ```
3. Pull the recommended local models:
   ```bash
   # Primary general-purpose supervisor & specialist agent LLM:
   ollama pull qwen2.5:7b

   # High-reasoning coding & architecture LLM:
   ollama pull qwen2.5-coder:7b
   ```
   *(For systems with lower RAM or ultra-fast CPU inference, `ollama pull qwen2.5:3b` is also supported).*

### 5. Configure Python AI Service
In a separate terminal or virtual environment:
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

### 6. Setup Environment Variables
Copy the template file to `.env`:
```bash
cp .env.example .env
```
Adjust ports or secrets as needed. The backend automatically provides an embedded in-memory MongoDB fallback.

### 7. Start Development Servers

You can launch the components in separate terminal windows:

- **Terminal 1 (Backend API)**:
  ```bash
  npm run dev:api
  ```
  API runs at `http://localhost:5201`
  Swagger Docs at `http://localhost:5201/api/v1/docs`

- **Terminal 2 (Web Client)**:
  ```bash
  npm run dev:web
  ```
  Web interface available at `http://localhost:5200`

- **Terminal 3 (Python AI Service)**:
  ```bash
  cd apps/ai-service
  python -m uvicorn app.main:app --host 127.0.0.1 --port 5202 --reload
  ```
  AI Service online at `http://localhost:5202` (Docs at `http://localhost:5202/docs`)

- **Terminal 4 (Local Ollama Engine)**:
  ```bash
  ollama serve
  ```
  Ollama local runtime at `http://localhost:11434`

---

## Production Deployment with Docker Compose

To deploy all containerized services:

```bash
docker compose build
docker compose up -d
docker compose ps
```

Services started:
- `agentflow-web`: Port 3000
- `agentflow-api`: Port 5000
- `agentflow-ai`: Port 8000
- `mongodb`: Port 27017
- `redis`: Port 6379

---

## Verification & Testing

Run backend tests:
```bash
npm --prefix apps/api test
```

Run AI service tests:
```bash
cd apps/ai-service
python -m pytest tests/test_graph.py -v
```

Build all packages for production:
```bash
npm run build
```
