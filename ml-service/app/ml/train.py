"""
Run this script once to train and save all ML models.
It runs automatically during Docker image build (see Dockerfile).
To run manually: python -m app.ml.train
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
import joblib
import os

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(MODELS_DIR, exist_ok=True)

np.random.seed(42)
N = 5000

# ── 1. Transaction category classifier ────────────────────────────────────────
keywords = {
    "Salary":        ["salary", "payroll", "stipend", "income", "wage"],
    "EMI":           ["emi", "loan", "mortgage", "equated", "repayment"],
    "Groceries":     ["grocery", "supermarket", "kirana", "dmart", "bigbasket", "reliance fresh"],
    "Entertainment": ["netflix", "hotstar", "prime", "movie", "concert", "spotify"],
    "Fuel":          ["petrol", "diesel", "fuel", "hp", "bp", "ioc", "shell"],
    "Utilities":     ["electricity", "water", "gas", "broadband", "jio", "airtel", "bsnl"],
    "Healthcare":    ["hospital", "pharmacy", "clinic", "medicine", "doctor", "apollo"],
    "Shopping":      ["amazon", "flipkart", "myntra", "clothing", "mall", "meesho"],
    "Dining":        ["restaurant", "zomato", "swiggy", "cafe", "hotel", "food"],
    "Transfer":      ["transfer", "upi", "neft", "rtgs", "imps", "payment"],
}

texts, labels = [], []
for cat, kws in keywords.items():
    for kw in kws:
        for _ in range(40):
            texts.append(f"{kw} {np.random.choice(['transaction', 'payment', 'charge', 'debit', ''])} ")
            labels.append(cat)

classifier_pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(lowercase=True, ngram_range=(1, 2))),
    ("clf", MultinomialNB())
])
classifier_pipeline.fit(texts, labels)
joblib.dump(classifier_pipeline, os.path.join(MODELS_DIR, "classifier.pkl"))
print("✓ Classifier saved")

# ── 2. Anomaly detector ────────────────────────────────────────────────────────
amounts = np.concatenate([
    np.random.normal(3000, 800, int(N * 0.95)),
    np.random.uniform(50000, 200000, int(N * 0.05))
])
hours = np.random.choice(range(24), N)
days  = np.random.choice(range(7), N)

X_anomaly = pd.DataFrame({
    "amount": amounts[:N],
    "hour": hours,
    "day_of_week": days,
    "amount_log": np.log1p(np.abs(amounts[:N]))
})

iso_forest = IsolationForest(contamination=0.05, random_state=42)
iso_forest.fit(X_anomaly)
joblib.dump(iso_forest, os.path.join(MODELS_DIR, "anomaly_model.pkl"))
print("✓ Anomaly model saved")

# ── 3. Credit scorer ───────────────────────────────────────────────────────────
credit_records = []
for _ in range(2000):
    income_stability  = np.random.uniform(0.6, 1.0)
    dti_ratio         = np.random.uniform(0.05, 0.8)
    savings_rate      = np.random.uniform(0.0, 0.5)
    spend_discipline  = np.random.uniform(0.3, 1.0)
    score = (income_stability * 30 + (1 - dti_ratio) * 30 +
             savings_rate * 25 + spend_discipline * 15)
    label = 1 if score > 55 else 0
    credit_records.append([income_stability, dti_ratio, savings_rate, spend_discipline, label])

df_credit = pd.DataFrame(credit_records,
    columns=["income_stability", "dti_ratio", "savings_rate", "spend_discipline", "good_credit"])

credit_model = LogisticRegression(random_state=42)
credit_model.fit(df_credit.drop("good_credit", axis=1), df_credit["good_credit"])
joblib.dump(credit_model, os.path.join(MODELS_DIR, "credit_model.pkl"))
print("✓ Credit model saved")
print("\n✅ All models trained and saved to ml-service/app/models/")
