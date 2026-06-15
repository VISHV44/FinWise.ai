-- =============================================================================
-- FinWise AI — Extra demo data for demo@finwise.ai
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- Safe to run on existing DB (adds data, does not drop tables)
-- Login: demo@finwise.ai / demo1234
-- =============================================================================

-- ── 1. March–June 2024 transactions (trend chart, forecast, recent txs) ─────

INSERT INTO transactions (user_id, date, description, amount, transaction_type, category, is_anomaly, anomaly_score, explanation)
SELECT u.id, v.date, v.description, v.amount, v.transaction_type, v.category, v.is_anomaly, v.anomaly_score, v.explanation
FROM users u
CROSS JOIN (VALUES
  -- March 2024
  ('2024-03-01', 'Salary Credit HDFC',              55000, 'credit', 'Salary',        FALSE, NULL,  NULL),
  ('2024-03-02', 'Grocery BigBasket Weekly',         2100, 'debit',  'Groceries',     FALSE, 0.11,  NULL),
  ('2024-03-05', 'Zomato Lunch Order',                420, 'debit',  'Dining',        FALSE, 0.07,  NULL),
  ('2024-03-08', 'Home Loan EMI HDFC',               8500, 'debit',  'EMI',           FALSE, 0.14,  NULL),
  ('2024-03-10', 'Netflix Subscription',              499, 'debit',  'Entertainment', FALSE, 0.06,  NULL),
  ('2024-03-12', 'Petrol Indian Oil',                2600, 'debit',  'Fuel',          FALSE, 0.10,  NULL),
  ('2024-03-15', 'Electricity Bill BESCOM',          1280, 'debit',  'Utilities',     FALSE, 0.09,  NULL),
  ('2024-03-18', 'Amazon Essentials',                1900, 'debit',  'Shopping',      FALSE, 0.12,  NULL),
  ('2024-03-20', 'ATM Cash Withdrawal Large',       28000, 'debit',  'Transfer',      TRUE,  0.85,  'Flagged: unusually large cash withdrawal of ₹28,000 — 9× your typical debit amount.'),
  ('2024-03-22', 'Apollo Pharmacy Checkup',           650, 'debit',  'Healthcare',    FALSE, 0.08,  NULL),
  ('2024-03-25', 'Swiggy Dinner',                     890, 'debit',  'Dining',        FALSE, 0.08,  NULL),
  ('2024-03-28', 'Broadband Airtel Bill',             999, 'debit',  'Utilities',     FALSE, 0.07,  NULL),

  -- April 2024 (lighter spend month)
  ('2024-04-01', 'Salary Credit HDFC',              55000, 'credit', 'Salary',        FALSE, NULL,  NULL),
  ('2024-04-05', 'Freelance Project Payment',       15000, 'credit', 'Salary',        FALSE, NULL,  NULL),
  ('2024-04-07', 'Grocery DMart',                    3100, 'debit',  'Groceries',     FALSE, 0.11,  NULL),
  ('2024-04-10', 'Home Loan EMI HDFC',               8500, 'debit',  'EMI',           FALSE, 0.13,  NULL),
  ('2024-04-12', 'Netflix Subscription',              499, 'debit',  'Entertainment', FALSE, 0.06,  NULL),
  ('2024-04-14', 'Petrol BPCL',                      2200, 'debit',  'Fuel',          FALSE, 0.09,  NULL),
  ('2024-04-16', 'Zomato Weekend Brunch',               780, 'debit',  'Dining',        FALSE, 0.07,  NULL),
  ('2024-04-18', 'Electricity Bill BESCOM',          1180, 'debit',  'Utilities',     FALSE, 0.08,  NULL),
  ('2024-04-20', 'Flipkart Electronics',             4500, 'debit',  'Shopping',      FALSE, 0.15,  NULL),
  ('2024-04-22', 'Spotify Premium',                   119, 'debit',  'Entertainment', FALSE, 0.05,  NULL),
  ('2024-04-25', 'Medicine Apollo Pharmacy',          450, 'debit',  'Healthcare',    FALSE, 0.07,  NULL),
  ('2024-04-28', 'Restaurant Team Lunch',            1650, 'debit',  'Dining',        FALSE, 0.10,  NULL),

  -- May 2024
  ('2024-05-01', 'Salary Credit HDFC',              55000, 'credit', 'Salary',        FALSE, NULL,  NULL),
  ('2024-05-03', 'Myntra Summer Sale',               6800, 'debit',  'Shopping',      FALSE, 0.17,  NULL),
  ('2024-05-06', 'Grocery BigBasket',                4400, 'debit',  'Groceries',     FALSE, 0.12,  NULL),
  ('2024-05-10', 'Home Loan EMI HDFC',               8500, 'debit',  'EMI',           FALSE, 0.14,  NULL),
  ('2024-05-10', 'Duplicate EMI Charge HDFC',        8500, 'debit',  'EMI',           TRUE,  0.91,  'Flagged: duplicate EMI debit on the same day — possible double charge.'),
  ('2024-05-12', 'Netflix Subscription',              499, 'debit',  'Entertainment', FALSE, 0.06,  NULL),
  ('2024-05-15', 'Petrol Indian Oil',                3100, 'debit',  'Fuel',          FALSE, 0.11,  NULL),
  ('2024-05-18', 'Swiggy Food Order',                 560, 'debit',  'Dining',        FALSE, 0.07,  NULL),
  ('2024-05-20', 'Zomato Premium Dinner',            2100, 'debit',  'Dining',        FALSE, 0.11,  NULL),
  ('2024-05-22', 'Electricity Bill BESCOM',          1420, 'debit',  'Utilities',     FALSE, 0.09,  NULL),
  ('2024-05-25', 'Amazon Shopping',                  3600, 'debit',  'Shopping',      FALSE, 0.13,  NULL),
  ('2024-05-28', 'Movie PVR Tickets',                 850, 'debit',  'Entertainment', FALSE, 0.08,  NULL),

  -- June 2024 (shows in Recent Transactions)
  ('2024-06-01', 'Salary Credit HDFC',              55000, 'credit', 'Salary',        FALSE, NULL,  NULL),
  ('2024-06-03', 'Grocery DMart Monthly',            4800, 'debit',  'Groceries',     FALSE, 0.12,  NULL),
  ('2024-06-05', 'Zomato Food Order',                 520, 'debit',  'Dining',        FALSE, 0.07,  NULL),
  ('2024-06-08', 'Home Loan EMI HDFC',               8500, 'debit',  'EMI',           FALSE, 0.13,  NULL),
  ('2024-06-10', 'Netflix Subscription',              499, 'debit',  'Entertainment', FALSE, 0.06,  NULL),
  ('2024-06-12', 'Petrol Bunk BPCL',                 2900, 'debit',  'Fuel',          FALSE, 0.10,  NULL),
  ('2024-06-14', 'Flipkart Shopping',                2200, 'debit',  'Shopping',      FALSE, 0.11,  NULL),
  ('2024-06-16', 'Electricity Bill BESCOM',          1310, 'debit',  'Utilities',     FALSE, 0.08,  NULL),
  ('2024-06-18', 'Swiggy Late Night Order',           680, 'debit',  'Dining',        FALSE, 0.08,  NULL),
  ('2024-06-20', 'Suspicious UPI to Unknown',       52000, 'debit',  'Transfer',      TRUE,  0.94,  'Flagged: large transfer to unknown beneficiary — 17× average transaction size.'),
  ('2024-06-22', 'Apollo Pharmacy Medicine',          920, 'debit',  'Healthcare',    FALSE, 0.09,  NULL),
  ('2024-06-25', 'Restaurant Birthday Dinner',       3800, 'debit',  'Dining',        FALSE, 0.14,  NULL),
  ('2024-06-28', 'Spotify Premium',                   119, 'debit',  'Entertainment', FALSE, 0.05,  NULL)
) AS v(date, description, amount, transaction_type, category, is_anomaly, anomaly_score, explanation)
WHERE u.email = 'demo@finwise.ai';


-- ── 2. Extra budgets (warning + danger mix) ──────────────────────────────────

INSERT INTO budgets (user_id, category, monthly_limit)
SELECT u.id, b.category, b.monthly_limit
FROM users u
CROSS JOIN (VALUES
  ('Healthcare',  2200),   -- ~warning range after new healthcare spends
  ('Fuel',        6000),
  ('Utilities',   3000),
  ('EMI',        20000)
) AS b(category, monthly_limit)
WHERE u.email = 'demo@finwise.ai'
ON CONFLICT ON CONSTRAINT uq_user_category
DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit;


-- ── 3. Refresh financial summary + AI chat context ───────────────────────────

WITH demo AS (
  SELECT id FROM users WHERE email = 'demo@finwise.ai'
),
totals AS (
  SELECT
    t.user_id,
    SUM(CASE WHEN t.transaction_type = 'credit' THEN t.amount ELSE 0 END) AS income,
    SUM(CASE WHEN t.transaction_type = 'debit'  THEN t.amount ELSE 0 END) AS spend,
    COUNT(*) AS tx_count,
    SUM(CASE WHEN t.is_anomaly THEN 1 ELSE 0 END) AS anomaly_count
  FROM transactions t
  JOIN demo d ON t.user_id = d.id
  GROUP BY t.user_id
),
top_cats AS (
  SELECT
    c.user_id,
    STRING_AGG(
      c.category || ' ₹' || ROUND(c.cat_spend::numeric, 0)::text,
      ', ' ORDER BY c.cat_spend DESC
    ) AS categories_text
  FROM (
    SELECT user_id, category, SUM(amount) AS cat_spend
    FROM transactions
    WHERE transaction_type = 'debit' AND category IS NOT NULL
      AND user_id = (SELECT id FROM demo)
    GROUP BY user_id, category
    ORDER BY cat_spend DESC
    LIMIT 6
  ) c
  GROUP BY c.user_id
),
monthly AS (
  SELECT
    m.user_id,
    STRING_AGG(
      TO_CHAR(TO_DATE(m.month_key || '-01', 'YYYY-MM-DD'), 'Mon YYYY')
        || ' income ₹' || ROUND(m.income::numeric, 0)::text
        || ' spend ₹' || ROUND(m.spend::numeric, 0)::text,
      '. ' ORDER BY m.month_key
    ) AS monthly_text
  FROM (
    SELECT
      user_id,
      LEFT(date, 7) AS month_key,
      SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE 0 END) AS income,
      SUM(CASE WHEN transaction_type = 'debit'  THEN amount ELSE 0 END) AS spend
    FROM transactions
    WHERE user_id = (SELECT id FROM demo)
    GROUP BY user_id, LEFT(date, 7)
  ) m
  GROUP BY m.user_id
)
UPDATE financial_summaries fs
SET
  monthly_income = ROUND(t.income::numeric, 2),
  monthly_spend  = ROUND(t.spend::numeric, 2),
  savings_rate   = ROUND(((t.income - t.spend) / NULLIF(t.income, 0) * 100)::numeric, 1),
  context_text   = format(
    'User''s financial summary: Total income (credits) ₹%s, Total spend (debits) ₹%s, Net savings ₹%s (%s%% savings rate). %s suspicious transactions detected across %s total transactions. Top spend categories: %s. Monthly breakdown: %s.',
    ROUND(t.income::numeric, 0),
    ROUND(t.spend::numeric, 0),
    ROUND((t.income - t.spend)::numeric, 0),
    ROUND(((t.income - t.spend) / NULLIF(t.income, 0) * 100)::numeric, 1),
    t.anomaly_count,
    t.tx_count,
    tc.categories_text,
    mo.monthly_text
  ),
  updated_at = NOW()
FROM totals t
JOIN top_cats tc ON tc.user_id = t.user_id
JOIN monthly mo ON mo.user_id = t.user_id
WHERE fs.user_id = t.user_id;


-- Insert summary row if demo user has none yet
INSERT INTO financial_summaries (user_id, monthly_income, monthly_spend, savings_rate, credit_score, context_text)
SELECT
  d.id, 0, 0, 0, 650,
  'Demo user — run the UPDATE block above after inserting transactions.'
FROM users d
WHERE d.email = 'demo@finwise.ai'
  AND NOT EXISTS (
    SELECT 1 FROM financial_summaries fs WHERE fs.user_id = d.id
  );


-- ── 4. Verify ────────────────────────────────────────────────────────────────

SELECT u.email,
       (SELECT COUNT(*) FROM transactions t WHERE t.user_id = u.id) AS transactions,
       (SELECT COUNT(*) FROM transactions t WHERE t.user_id = u.id AND t.is_anomaly) AS anomalies,
       (SELECT COUNT(*) FROM budgets b WHERE b.user_id = u.id) AS budgets,
       (SELECT COUNT(DISTINCT LEFT(date, 7)) FROM transactions t WHERE t.user_id = u.id) AS months
FROM users u
WHERE u.email = 'demo@finwise.ai';

-- Expected after run: ~74 transactions, 6 anomalies, 8 budgets, 6 months
