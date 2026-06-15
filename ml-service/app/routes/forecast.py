from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import numpy as np
from sklearn.linear_model import LinearRegression

router = APIRouter()

class MonthData(BaseModel):
    month: str
    spend: float
    income: float

class ForecastRequest(BaseModel):
    months: List[MonthData]

def _next_month_label(last_month: str) -> str:
    try:
        year, month = int(last_month[:4]), int(last_month[5:7])
        month += 1
        if month > 12:
            month = 1
            year += 1
        return f"{year}-{month:02d}"
    except Exception:
        return "Next month"

@router.post("/ml/forecast")
def forecast(req: ForecastRequest):
    if len(req.months) < 2:
        return {
            "predicted_spend": None,
            "predicted_income": None,
            "confidence": "low",
            "message": "Need at least 2 months of data for forecast"
        }

    X = np.array(range(len(req.months))).reshape(-1, 1)
    y_spend  = np.array([m.spend  for m in req.months])
    y_income = np.array([m.income for m in req.months])

    spend_model  = LinearRegression().fit(X, y_spend)
    income_model = LinearRegression().fit(X, y_income)

    next_x = np.array([[len(req.months)]])
    predicted_spend  = max(0.0, float(spend_model.predict(next_x)[0]))
    predicted_income = max(0.0, float(income_model.predict(next_x)[0]))

    confidence = "high" if len(req.months) >= 4 else "medium" if len(req.months) >= 2 else "low"

    return {
        "predicted_spend":  round(predicted_spend, 2),
        "predicted_income": round(predicted_income, 2),
        "confidence": confidence,
        "next_month": _next_month_label(req.months[-1].month)
    }
