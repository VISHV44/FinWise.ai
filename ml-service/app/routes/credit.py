from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import joblib, os, numpy as np

router = APIRouter()

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "credit_model.pkl")
model = joblib.load(MODEL_PATH)

class TxItem(BaseModel):
    description: str
    amount: float
    type: str

class CreditRequest(BaseModel):
    transactions: List[TxItem]

def grade(score: int) -> str:
    if score >= 750: return "Excellent"
    if score >= 700: return "Good"
    if score >= 650: return "Fair"
    if score >= 600: return "Poor"
    return "Very Poor"

@router.post("/ml/credit-score")
def credit_score(req: CreditRequest):
    credits = [t.amount for t in req.transactions if t.type == "credit"]
    debits  = [t.amount for t in req.transactions if t.type == "debit"]

    total_income = sum(credits) or 1
    total_spend  = sum(debits) or 0

    income_stability = 1 - (np.std(credits) / np.mean(credits)) if len(credits) > 1 else 0.5
    income_stability = max(0.0, min(1.0, float(income_stability)))

    dti_ratio = min(total_spend / total_income, 1.0)
    savings_rate = max(0.0, (total_income - total_spend) / total_income)

    essential_keywords = ["grocery", "electricity", "medicine", "fuel", "emi", "rent"]
    essential_spend = sum(
        t.amount for t in req.transactions
        if t.type == "debit" and any(k in t.description.lower() for k in essential_keywords)
    )
    spend_discipline = min(1.0, essential_spend / (total_spend or 1))

    X = [[income_stability, dti_ratio, savings_rate, spend_discipline]]
    prob = float(model.predict_proba(X)[0][1])
    score = max(300, min(900, int(300 + prob * 600)))

    return {
        "score": score,
        "grade": grade(score),
        "income_stability": round(income_stability * 100, 1),
        "debt_ratio": round(dti_ratio * 100, 1),
        "savings_discipline": round(savings_rate * 100, 1),
        "spend_regularity": round(spend_discipline * 100, 1),
    }
