from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import joblib, os, numpy as np, pandas as pd
import datetime

router = APIRouter()

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "anomaly_model.pkl")
model = joblib.load(MODEL_PATH)

class TxItem(BaseModel):
    description: str
    amount: float
    type: str
    # Optional: ISO date string like "2024-01-15" or "2024-01-15 23:45:00"
    date: Optional[str] = None

class AnomalyRequest(BaseModel):
    transactions: List[TxItem]

def _parse_tx_datetime(date_str: str | None) -> datetime.datetime | None:
    """Try to parse a transaction date string into a datetime object."""
    if not date_str:
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    return None

def generate_explanation(tx_amount: float, is_anomaly: bool, score: float,
                         all_amounts: list, tx_dt: datetime.datetime | None) -> str:
    if not is_anomaly:
        return ""
    avg = sum(all_amounts) / len(all_amounts) if all_amounts else 0
    ratio = tx_amount / avg if avg > 0 else 0

    # Use actual transaction hour if available, else skip time-based reason
    hour = tx_dt.hour if tx_dt else None

    reasons = []
    if ratio > 10:
        reasons.append(f"amount is {ratio:.0f}× your average transaction")
    elif ratio > 5:
        reasons.append(f"amount is {ratio:.0f}× above average")
    if hour is not None and (hour >= 22 or hour <= 5):
        reasons.append("transaction occurred late at night")
    if tx_amount > 50000:
        reasons.append(f"large transfer of ₹{tx_amount:,.0f}")

    if not reasons:
        reasons.append("unusual pattern detected by anomaly model")

    return f"Flagged: {' and '.join(reasons)}."

@router.post("/ml/anomaly")
def detect_anomaly(req: AnomalyRequest):
    results = []
    all_amounts = [tx.amount for tx in req.transactions]

    for tx in req.transactions:
        tx_dt = _parse_tx_datetime(tx.date)

        # Use actual transaction hour and day_of_week if date is available,
        # otherwise fall back to sensible defaults (noon, Wednesday)
        if tx_dt:
            tx_hour = tx_dt.hour
            tx_dow = tx_dt.weekday()
        else:
            tx_hour = 12
            tx_dow = 2

        X = pd.DataFrame(
            [[tx.amount, tx_hour, tx_dow, np.log1p(tx.amount)]],
            columns=["amount", "hour", "day_of_week", "amount_log"]
        )
        score = model.decision_function(X)[0]
        is_anomaly = bool(model.predict(X)[0] == -1)
        normalized_score = round(float(1 - (score + 0.5)), 3)
        explanation = generate_explanation(tx.amount, is_anomaly, normalized_score, all_amounts, tx_dt)
        results.append({
            "is_anomaly": is_anomaly,
            "score": max(0.0, min(1.0, normalized_score)),
            "explanation": explanation,
        })
    return {"results": results}
