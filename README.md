<div align="center">

# 💹 FinWise AI

### AI-powered personal finance platform — built with 100% free & open-source tools

[![CI/CD](https://github.com/vishvsureja/finwise-ai/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/vishvsureja/finwise-ai/actions)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

Upload your bank statement CSV → get instant AI-driven insights, anomaly alerts, credit scoring, spend forecasting, and a conversational financial advisor — all running locally with no paid APIs.

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Smart Dashboard** | Income vs spend charts, category breakdown, monthly trend, savings rate |
| 🔍 **Anomaly Detection** | Isolation Forest flags suspicious transactions with explanations |
| 🎯 **Credit Score** | 300–900 score derived from 4 engineered financial features |
| 🔮 **Spend Forecasting** | Linear regression predicts next month's spend from your history |
| 🤖 **AI Advisor** | Chat with a local LLM grounded in your actual financial data |
| 📈 **Inline Charts** | AI responses include live Recharts bar charts rendered in chat |
| 💰 **Budget Alerts** | Per-category monthly limits with warning (80%) and danger (100%) alerts |
| 📐 **50/30/20 Rule** | Needs / wants / savings breakdown vs target percentages |
| 📄 **PDF Reports** | Downloadable financial summary with category and anomaly sections |
| 🔐 **JWT Auth** | Secure register / login with bcrypt password hashing |
| 📥 **CSV Export** | Export categorised transactions with anomaly risk scores |

---

## 🏗️ Architecture

```
Browser  (React 18 + Vite, port 5173)
    │
    │  Axios  +  JWT Bearer token
    ▼
FastAPI Backend  (port 8000)
    │  SQLAlchemy ORM
    ▼
Supabase PostgreSQL  (cloud, pgvector extension)
    │
    │  httpx  internal calls
    ▼
FastAPI ML Service  (port 8001)
    │  scikit-learn  +  LangChain
    ▼
Ollama  (llama3.2:3b — runs natively on your Mac, port 11434)
```

Three Docker containers — **backend**, **ml-service**, **frontend** — talk to a cloud Supabase database and a native Ollama process on your Mac host. No paid API keys required.

---

## 🛠️ Tech Stack

| Layer | Tools |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts, React Router v6 |
| **Backend API** | Python 3.11, FastAPI, SQLAlchemy 2, Alembic, slowapi |
| **Auth** | python-jose (JWT), passlib (bcrypt) |
| **Database** | Supabase PostgreSQL + pgvector (768-dim embeddings) |
| **ML Models** | scikit-learn — IsolationForest, MultinomialNB + TF-IDF, LogisticRegression, LinearRegression |
| **LLM** | Ollama + llama3.2:3b (local, Metal-accelerated on Apple Silicon) |
| **LLM Orchestration** | LangChain + langchain-ollama |
| **DevOps** | Docker Compose, GitHub Actions CI |

---

## 📸 Screenshots

> Dashboard — real-time income, spend, savings rate and anomaly cards

> AI Advisor — conversational chat with inline bar charts rendered from LLM JSON

> Transactions — paginated table with anomaly expand, category editor, CSV export

> Budgets — per-category progress bars with warning / danger alerts

---

## 🚀 Quick Start

### Prerequisites

- [Docker Desktop](https://docker.com)
- [Ollama](https://ollama.com) — install the native Mac app (uses Apple Metal for GPU)
- [Supabase](https://supabase.com) — free account (500 MB, no credit card)

### 1 — Start Ollama

```bash
ollama pull llama3.2:3b
ollama serve
```

Ollama runs on your Mac host at `http://localhost:11434`. The ML service container reaches it via `host.docker.internal`.

### 2 — Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Copy your **Database → Connection string (URI)** from Project Settings

### 3 — Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[YOUR-SUPABASE-HOST]:5432/postgres
SECRET_KEY=your-random-secret-key-here
```

### 4 — Build and start

```bash
docker compose up --build
```

First build takes 5–10 minutes (installs Python deps and trains ML models). After that, start-up is under 10 seconds.

### 5 — Run database migrations

```bash
docker compose exec backend alembic upgrade head
```

Only needed the first time.

### 6 — Open the app

| Service | URL |
|---|---|
| 🌐 Frontend | http://localhost:5173 |
| 📖 Backend API docs | http://localhost:8000/docs |
| 🤖 ML Service docs | http://localhost:8001/docs |

---

## 🧪 Demo

1. Register a new account at `/register`
2. Go to **Upload Data** and upload the built-in sample CSV (click *Download sample CSV*)
3. Explore the **Dashboard** — income/spend charts, budget alerts, and the 50/30/20 widget
4. Open **Transactions** — a ₹45,000 midnight transfer and a duplicate charge will be flagged as anomalies
5. Check **Credit Score** for a 300–900 rating with a grade breakdown
6. Set budget limits in **Budgets** and watch the progress bars fill
7. Ask the **AI Advisor** anything — *"Where am I overspending?"* or *"Can I afford a ₹8,000 EMI?"*

---

## 📁 Project Structure

```
finwise-ai/
│
├── backend/                    # FastAPI main API (port 8000)
│   ├── app/
│   │   ├── main.py             # App entry point + lifespan
│   │   ├── models.py           # SQLAlchemy ORM models
│   │   ├── schemas.py          # Pydantic request/response schemas
│   │   ├── utils.py            # Shared helpers (month key utilities)
│   │   ├── limiter.py          # Rate limiter (slowapi)
│   │   └── routes/
│   │       ├── auth.py         # Register, login, /me
│   │       ├── transactions.py # Upload CSV, paginate, export
│   │       ├── analysis.py     # Summary, trend, forecast, chat
│   │       ├── budgets.py      # Budget CRUD + alerts
│   │       └── reports.py      # PDF report generation
│   └── alembic/                # Database migrations
│
├── ml-service/                 # ML + AI microservice (port 8001)
│   └── app/
│       ├── routes/
│       │   ├── classify.py     # TF-IDF + NaiveBayes category classifier
│       │   ├── anomaly.py      # Isolation Forest anomaly detector
│       │   ├── credit.py       # Logistic regression credit scorer
│       │   ├── forecast.py     # Linear regression spend forecaster
│       │   └── chat.py         # LangChain + Ollama AI advisor
│       └── ml/
│           └── train.py        # Model training script (runs at startup)
│
├── frontend/                   # React + Vite UI (port 5173)
│   └── src/
│       ├── pages/              # Dashboard, Transactions, Budgets, etc.
│       ├── components/         # Sidebar, StatCard, BudgetAlerts, etc.
│       └── context/            # AuthContext (JWT management)
│
├── .github/workflows/
│   └── ci-cd.yml               # GitHub Actions CI
├── docker-compose.yml
└── .env.example
```

---

## 🔬 ML Models

All models are trained on startup from `ml-service/app/ml/train.py` using synthetic data — no dataset downloads required.

| Model | Algorithm | Purpose |
|---|---|---|
| **Classifier** | TF-IDF + MultinomialNaiveBayes | Categorise transactions into 10 classes |
| **Anomaly Detector** | Isolation Forest | Flag unusual transactions by amount, hour, day |
| **Credit Scorer** | LogisticRegression | Score 300–900 from income stability, DTI, savings, spend discipline |
| **Forecaster** | LinearRegression | Predict next month's income and spend |

---

## ⚙️ CI/CD

GitHub Actions runs on every push to `main` and every pull request:

- Spins up a `postgres:15` service container
- Installs Python 3.11 and all backend dependencies
- Verifies the FastAPI app imports and initialises without errors

Zero cost — runs on GitHub's free tier.

---

## 🔒 Security Notes

- Passwords hashed with **bcrypt** (passlib)
- JWT tokens expire after **24 hours**
- Password minimum **8 characters** enforced client and server side
- Chat endpoint **rate-limited** to 10 requests/minute (slowapi)
- ML service CORS **locked to backend origin** only
- `.env` excluded from git — use `.env.example` as a template

---

## 🙋 FAQ

**Does this use ChatGPT or any paid API?**
No. Everything runs locally. The LLM is `llama3.2:3b` via Ollama on your Mac.

**Does it work on non-Mac / no Apple Silicon?**
Yes. Ollama runs on Linux and Windows too. GPU acceleration on NVIDIA uses CUDA automatically. On CPU it's slower but works.

**What CSV format is required?**
Three columns: `date`, `description`, `amount`. Positive amounts = credit (income), negative = debit (spend). Click *Download sample CSV* on the Upload page for an example.

**Can I use a local PostgreSQL instead of Supabase?**
Yes — just point `DATABASE_URL` to your local Postgres instance and run `CREATE EXTENSION IF NOT EXISTS vector;` manually.

---

## 📄 License

MIT — free to use, modify, and distribute.

---

<div align="center">
Built with ❤️ using FastAPI · React · scikit-learn · Ollama · Supabase
</div>
