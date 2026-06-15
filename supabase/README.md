# Supabase Setup for FinWise AI

## Quick start (empty Supabase project)

1. Open your project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → **New query**
3. Paste the entire contents of **`init.sql`**
4. Click **Run**

This creates all tables, indexes, pgvector extension, and demo seed data.

## Demo account after seeding

| Field | Value |
|-------|-------|
| Email | `demo@finwise.ai` |
| Password | `demo1234` |

Open http://localhost:5173/login and sign in with these credentials.

## What gets created

| Table | Purpose |
|-------|---------|
| `users` | JWT auth |
| `transactions` | Bank CSV data + ML categories, anomalies, pgvector embeddings |
| `financial_summaries` | Dashboard stats + AI chat RAG context |
| `budgets` | Category spending limits + alerts |
| `alembic_version` | Stamped at `003` so Docker migrations stay in sync |

## Seed data highlights

- **25 transactions** across Jan + Feb 2024 (enables monthly trends & forecast)
- **3 anomalies** flagged with plain-English explanations
- **4 budgets** (Dining budget will show warning alerts on dashboard)
- **Credit score 682** pre-set in financial summary

## If you already ran Alembic migrations

Skip `init.sql` or only run the seed section — tables may already exist.

## Connection string reminder

Use **Session pooler** (IPv4) from Supabase **Connect** button for Docker:

```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?sslmode=require
```

URL-encode special characters in password: `@` → `%40`, `%` → `%25`
