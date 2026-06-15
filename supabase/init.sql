-- =============================================================================
-- FinWise AI — Supabase schema + seed data
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Drop existing (safe re-run on empty or dev DB) ───────────────────────────
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS financial_summaries CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS alembic_version CASCADE;

-- ── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR NOT NULL UNIQUE,
    hashed_password VARCHAR NOT NULL,
    full_name       VARCHAR,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ix_users_email ON users (email);
CREATE INDEX ix_users_id ON users (id);

-- ── Transactions (pgvector-ready for semantic search) ────────────────────────
CREATE TABLE transactions (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date             VARCHAR NOT NULL,
    description      VARCHAR NOT NULL,
    amount           DOUBLE PRECISION NOT NULL,
    transaction_type VARCHAR NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
    category         VARCHAR,
    is_anomaly       BOOLEAN DEFAULT FALSE,
    anomaly_score    DOUBLE PRECISION,
    explanation      VARCHAR,
    embedding        vector(768),
    created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ix_transactions_id ON transactions (id);
CREATE INDEX ix_transactions_user_date ON transactions (user_id, date DESC);
CREATE INDEX ix_transactions_user_anomaly ON transactions (user_id, is_anomaly) WHERE is_anomaly = TRUE;
CREATE INDEX ix_transactions_user_category ON transactions (user_id, category);

-- ── Financial summaries (RAG context for AI chat) ────────────────────────────
CREATE TABLE financial_summaries (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    monthly_income DOUBLE PRECISION DEFAULT 0,
    monthly_spend  DOUBLE PRECISION DEFAULT 0,
    savings_rate   DOUBLE PRECISION DEFAULT 0,
    credit_score   INTEGER,
    context_text   TEXT,
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ix_financial_summaries_id ON financial_summaries (id);

-- ── Budgets (category spending limits) ───────────────────────────────────────
CREATE TABLE budgets (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category      VARCHAR NOT NULL,
    monthly_limit DOUBLE PRECISION NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_category UNIQUE (user_id, category)
);
CREATE INDEX ix_budgets_id ON budgets (id);

-- ── Alembic version stamp (keeps migrations in sync) ─────────────────────────
CREATE TABLE alembic_version (
    version_num VARCHAR(32) NOT NULL PRIMARY KEY
);
INSERT INTO alembic_version (version_num) VALUES ('003');

-- =============================================================================
-- SEED DATA
-- Demo login: demo@finwise.ai / demo1234
-- =============================================================================

INSERT INTO users (id, email, hashed_password, full_name) VALUES
(1, 'demo@finwise.ai', '$2y$12$jEZcthHV7wd8VKq4HmT/Ce7hTCda8nAefcCDksrr6Jv648BUEiU7q', 'Demo User');

SELECT setval('users_id_seq', 1);

-- ── January 2024 transactions ──────────────────────────────────────────────
INSERT INTO transactions (user_id, date, description, amount, transaction_type, category, is_anomaly, anomaly_score, explanation) VALUES
(1, '2024-01-01', 'Salary Credit HDFC',           55000, 'credit', 'Salary',        FALSE, NULL,  NULL),
(1, '2024-01-03', 'Amazon Shopping',               2400, 'debit',  'Shopping',      FALSE, 0.12,  NULL),
(1, '2024-01-05', 'Zomato Food Order',              450, 'debit',  'Dining',        FALSE, 0.08,  NULL),
(1, '2024-01-07', 'Electricity Bill BESCOM',       1200, 'debit',  'Utilities',     FALSE, 0.10,  NULL),
(1, '2024-01-10', 'Home Loan EMI HDFC',            8500, 'debit',  'EMI',           FALSE, 0.15,  NULL),
(1, '2024-01-12', 'Netflix Subscription',           499, 'debit',  'Entertainment', FALSE, 0.07,  NULL),
(1, '2024-01-15', 'Petrol Bunk BPCL',              3000, 'debit',  'Fuel',          FALSE, 0.11,  NULL),
(1, '2024-01-18', 'Grocery DMart',                 4200, 'debit',  'Groceries',     FALSE, 0.13,  NULL),
(1, '2024-01-20', 'Unknown Transfer Midnight',    45000, 'debit',  'Transfer',      TRUE,  0.92,  'Flagged: amount is 15× your average transaction and large transfer of ₹45,000.'),
(1, '2024-01-22', 'Duplicate Charge Amazon',       2400, 'debit',  'Shopping',      TRUE,  0.78,  'Flagged: unusual pattern detected by anomaly model.'),
(1, '2024-01-25', 'Apollo Pharmacy Medicine',       800, 'debit',  'Healthcare',    FALSE, 0.09,  NULL),
(1, '2024-01-28', 'Flipkart Shopping',             1800, 'debit',  'Shopping',      FALSE, 0.10,  NULL);

-- ── February 2024 (second month for trends & forecast) ───────────────────────
INSERT INTO transactions (user_id, date, description, amount, transaction_type, category, is_anomaly, anomaly_score, explanation) VALUES
(1, '2024-02-01', 'Salary Credit HDFC',           55000, 'credit', 'Salary',        FALSE, NULL,  NULL),
(1, '2024-02-03', 'Swiggy Food Order',              680, 'debit',  'Dining',        FALSE, 0.08,  NULL),
(1, '2024-02-05', 'Zomato Premium Order',          1250, 'debit',  'Dining',        FALSE, 0.09,  NULL),
(1, '2024-02-08', 'Grocery BigBasket',             3900, 'debit',  'Groceries',     FALSE, 0.12,  NULL),
(1, '2024-02-10', 'Home Loan EMI HDFC',            8500, 'debit',  'EMI',           FALSE, 0.14,  NULL),
(1, '2024-02-12', 'Netflix Subscription',           499, 'debit',  'Entertainment', FALSE, 0.07,  NULL),
(1, '2024-02-14', 'Amazon Prime Shopping',         5200, 'debit',  'Shopping',      FALSE, 0.18,  NULL),
(1, '2024-02-15', 'Petrol Indian Oil',             2800, 'debit',  'Fuel',          FALSE, 0.11,  NULL),
(1, '2024-02-18', 'Spotify Premium',                119, 'debit',  'Entertainment', FALSE, 0.06,  NULL),
(1, '2024-02-20', 'Suspicious UPI Transfer',      38000, 'debit',  'Transfer',      TRUE,  0.88,  'Flagged: amount is 12× above average and transaction occurred late at night.'),
(1, '2024-02-22', 'Electricity Bill BESCOM',     1350, 'debit',  'Utilities',     FALSE, 0.10,  NULL),
(1, '2024-02-25', 'Myntra Clothing',               3200, 'debit',  'Shopping',      FALSE, 0.14,  NULL),
(1, '2024-02-28', 'Restaurant Anniversary',        4500, 'debit',  'Dining',        FALSE, 0.16,  NULL);

-- ── Budgets (Dining will trigger 80%+ alert) ─────────────────────────────────
INSERT INTO budgets (user_id, category, monthly_limit) VALUES
(1, 'Dining',        5000),
(1, 'Shopping',      8000),
(1, 'Entertainment', 1000),
(1, 'Groceries',     5000);

-- ── Financial summary + RAG context for AI chat ──────────────────────────────
INSERT INTO financial_summaries (user_id, monthly_income, monthly_spend, savings_rate, credit_score, context_text) VALUES
(1, 110000, 139347, -26.7, 682,
 'User''s financial summary: Total income (credits) ₹110,000, Total spend (debits) ₹139,347, Net savings ₹-29,347 (-26.7% savings rate). 3 suspicious transactions detected. Total 25 transactions analysed. Top spend categories: Transfer ₹83,000, EMI ₹17,000, Dining ₹7,380, Shopping ₹12,600, Groceries ₹8,100. January income ₹55,000 spend ₹71,249. February income ₹55,000 spend ₹68,098.');

-- ── Verify ───────────────────────────────────────────────────────────────────
SELECT 'users'               AS table_name, COUNT(*) AS rows FROM users
UNION ALL SELECT 'transactions',       COUNT(*) FROM transactions
UNION ALL SELECT 'budgets',            COUNT(*) FROM budgets
UNION ALL SELECT 'financial_summaries',COUNT(*) FROM financial_summaries;
