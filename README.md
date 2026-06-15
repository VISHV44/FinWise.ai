# FinWise AI

AI-powered personal financial intelligence platform — full-stack portfolio project built with 100% free and open-source tools.

## Architecture

```
User (Browser)
  ↓ HTTP
React Frontend (Vite, port 5173)
  ↓ Axios (JWT in header)
FastAPI Backend (port 8000)
  ↓ SQLAlchemy + pgvector
Supabase PostgreSQL (cloud)
  ↓ httpx (internal HTTP call)
FastAPI ML Service (port 8001)
  ↓ scikit-learn + LangChain
Ollama (local LLM on Mac host, port 11434)
```

## Tech Stack

| Layer | Tool |
|-------|------|
| Backend API | Python 3.11 + FastAPI + Uvicorn |
| Database | Supabase PostgreSQL + pgvector |
| ORM | SQLAlchemy + Alembic |
| Auth | python-jose + passlib bcrypt |
| ML | scikit-learn (IsolationForest, LogisticRegression, MultinomialNB) |
| LLM | Ollama (llama3.2:3b) — local, no API key |
| Embeddings | Ollama (nomic-embed-text) — local vector model |
| LLM Orchestration | LangChain + langchain-ollama |
| Frontend | React 18 + Vite + Tailwind CSS |
| Charts | Recharts (dashboard + agentic UI chat) |
| DevOps | Docker + Docker Compose + GitHub Actions |

## Supabase Prerequisites

Before running the app, set up your Supabase project:

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → Database** and copy your connection string (URI format).
3. Open the **SQL Editor** and run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

4. Paste your connection string into `.env`:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-SUPABASE-DB-URL]:5432/postgres
```

Replace `[YOUR-PASSWORD]` and `[YOUR-SUPABASE-DB-URL]` with your actual Supabase credentials.

## Hardware Acceleration (Mac)

For the best local LLM performance on Apple Silicon, run **Ollama natively on your Mac host** — not inside a Docker container. Ollama automatically uses Apple Metal Performance Shaders (MPS) for GPU acceleration when installed on macOS.

The ML service container connects to your host Ollama via `host.docker.internal:11434`, so inference runs on Metal while the rest of the stack stays containerized.

```bash
# Install Ollama from https://ollama.com (native Mac app)
ollama pull llama3.2:3b
ollama pull nomic-embed-text
ollama serve
```

`nomic-embed-text` is the local embedding model used with pgvector for semantic search (768-dimensional vectors).

## Prerequisites

1. [Python 3.11](https://python.org)
2. [Node.js 20](https://nodejs.org)
3. [Docker Desktop](https://docker.com)
4. [Ollama](https://ollama.com) — installed natively on Mac for Metal GPU
5. [Supabase](https://supabase.com) — free cloud PostgreSQL with pgvector

## Quick Start

### 1. Install and start Ollama (before Docker)

```bash
ollama pull llama3.2:3b
ollama pull nomic-embed-text
ollama serve
```

### 2. Configure Supabase and environment

```bash
cp .env.example .env
```

Edit `.env`:
- Set `DATABASE_URL` to your Supabase connection string
- Change `SECRET_KEY` to a random string

Run the pgvector extension in Supabase SQL Editor (see **Supabase Prerequisites** above).

### 3. Build and start services

```bash
docker compose up --build
```

First build takes 5–10 minutes. Three containers start: backend, ml-service, and frontend. The database runs on Supabase — no local Postgres container.

### 4. Run database migrations (first time only)

```bash
docker compose exec backend alembic upgrade head
```

### 5. Open the app

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API docs | http://localhost:8000/docs |
| ML service docs | http://localhost:8001/docs |

## Demo Flow

1. Register a new account at `/register`
2. Sign in at `/login`
3. Upload `sample.csv` from the project root
4. Explore Dashboard, Transactions, Budgets, Credit Score, and AI Advisor
5. Ask the AI Advisor for category breakdowns — responses include inline Recharts bar charts (agentic UI)

The sample CSV includes a ₹45,000 midnight transfer and a duplicate Amazon charge that should be flagged as anomalies.

## Project Structure

```
finwise-ai/
├── backend/           → FastAPI main API (port 8000)
├── ml-service/        → ML + AI microservice (port 8001)
├── frontend/          → React + Vite UI (port 5173)
├── .github/workflows/ → CI/CD pipeline
├── docker-compose.yml
├── sample.csv
└── .env
```

## Features

- **JWT Authentication** — register, login, protected routes
- **Supabase + pgvector** — cloud PostgreSQL with vector embeddings column for semantic search
- **CSV Upload** — parse bank statements, classify transactions
- **Transactions Workspace** — search, filter anomalies, edit categories, paginate, and export CSV
- **Anomaly Detection** — Isolation Forest flags suspicious transactions
- **Credit Score** — logistic regression on engineered financial features (300–900 scale)
- **Forecasting** — linear regression predicts next-month spend and income from monthly history
- **Agentic UI** — AI chat returns structured JSON with text answers and inline Recharts charts
- **AI Advisor** — Ollama LLM with financial context injection (simplified RAG)
- **Dashboard** — total income/spend cards, category breakdown, monthly income/spend trend, forecast, recent transactions
- **Budgets** — category limits, latest-month progress, and warning/danger alerts at 80% and 100%
- **50/30/20 Rule** — latest-month needs/wants/savings comparison against target percentages
- **PDF Reports** — downloadable financial summary with category and anomaly sections
- **CI/CD** — GitHub Actions validates backend on every push to `main`

## CI/CD

The workflow at `.github/workflows/ci-cd.yml` runs on every push to `main`:

- Spins up an `ubuntu-latest` runner
- Installs Python 3.11 and backend dependencies
- Verifies `from app.main import app` succeeds without errors

Zero cost — uses GitHub Actions free tier for public repos.

## Interview Talking Points

- Microservices architecture — ML workload isolated in a separate FastAPI service
- Supabase + pgvector — cloud database with native vector search for semantic transaction retrieval
- Agentic UI — LLM returns structured JSON; frontend dynamically renders charts in chat
- Anomaly detection with Isolation Forest mirrors fraud signal products
- Local LLM via Ollama on Apple Metal — zero API cost, context-grounded answers
- Docker deployment with external Supabase — no local database container to manage
- Credit score from four engineered features: income stability, DTI ratio, savings rate, spend discipline

## License

Open source — built for portfolio and learning purposes.
