from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import httpx
from app.database import get_db
from app.models import User, Transaction, FinancialSummary
from app.schemas import SummaryOut, CreditScoreOut, ChatRequest, ChatResponse
from app.dependencies import get_current_user
from app.config import settings
from app.utils import current_month_key, latest_month_key
from app.limiter import limiter

router = APIRouter(prefix="/analysis", tags=["analysis"])

def _group_by_month(txs):
    monthly = {}
    for t in txs:
        try:
            month_key = t.date[:7]
        except Exception:
            continue
        if month_key not in monthly:
            monthly[month_key] = {"income": 0.0, "spend": 0.0}
        if t.transaction_type == "credit":
            monthly[month_key]["income"] += t.amount
        else:
            monthly[month_key]["spend"] += t.amount
    return monthly


def _category_spend(txs, limit=None):
    categories = {}
    for t in txs:
        if t.category and t.transaction_type == "debit":
            categories[t.category] = categories.get(t.category, 0) + t.amount
    sorted_categories = sorted(categories.items(), key=lambda x: x[1], reverse=True)
    if limit:
        sorted_categories = sorted_categories[:limit]
    return dict(sorted_categories)

@router.get("/summary", response_model=SummaryOut)
def get_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    txs = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    if not txs:
        raise HTTPException(status_code=404, detail="No transactions found. Please upload a CSV first.")

    income = sum(t.amount for t in txs if t.transaction_type == "credit")
    spend = sum(t.amount for t in txs if t.transaction_type == "debit")
    anomalies = sum(1 for t in txs if t.is_anomaly)

    latest_month = latest_month_key(txs)
    latest_txs = [t for t in txs if latest_month and t.date[:7] == latest_month]
    top = _category_spend(txs, limit=6)
    current_month_categories = _category_spend(latest_txs)

    savings_rate = round((income - spend) / income * 100, 1) if income > 0 else 0

    return {
        "total_income": round(income, 2),
        "total_spend": round(spend, 2),
        "monthly_income": round(income, 2),
        "monthly_spend": round(spend, 2),
        "savings_rate": savings_rate,
        "total_transactions": len(txs),
        "anomaly_count": anomalies,
        "top_categories": top,
        "current_month": latest_month,
        "current_month_categories": current_month_categories,
    }


@router.get("/monthly-trend")
def get_monthly_trend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txs = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    if not txs:
        raise HTTPException(status_code=404, detail="No transactions found.")

    monthly = _group_by_month(txs)
    sorted_months = sorted(monthly.keys())
    result = []
    for i, month in enumerate(sorted_months):
        entry = {
            "month": month,
            "income": round(monthly[month]["income"], 2),
            "spend": round(monthly[month]["spend"], 2),
            "savings": round(monthly[month]["income"] - monthly[month]["spend"], 2),
            "income_delta": None,
            "spend_delta": None,
            "savings_delta": None,
        }
        if i > 0:
            prev = monthly[sorted_months[i - 1]]
            entry["income_delta"] = round(monthly[month]["income"] - prev["income"], 2)
            entry["spend_delta"] = round(monthly[month]["spend"] - prev["spend"], 2)
            entry["savings_delta"] = round(
                (monthly[month]["income"] - monthly[month]["spend"]) -
                (prev["income"] - prev["spend"]), 2
            )
        result.append(entry)

    return {"months": result, "current": result[-1] if result else None}


@router.get("/forecast")
async def get_forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txs = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    if not txs:
        raise HTTPException(status_code=404, detail="No transactions found.")

    monthly = _group_by_month(txs)
    months_data = [
        {"month": k, "income": round(v["income"], 2), "spend": round(v["spend"], 2)}
        for k, v in sorted(monthly.items())
    ]

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{settings.ML_SERVICE_URL}/ml/forecast",
            json={"months": months_data}
        )
        return resp.json()


@router.get("/budget-rule")
def budget_rule(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    txs = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    if not txs:
        raise HTTPException(status_code=404, detail="No transactions found.")

    # Use current calendar month for the 50/30/20 rule so it's always consistent
    this_month = current_month_key()
    txs = [t for t in txs if t.date[:7] == this_month]
    # Fall back to latest available month if no transactions exist for current month
    if not txs:
        fallback = latest_month_key(db.query(Transaction).filter(Transaction.user_id == current_user.id).all())
        if fallback:
            txs = [t for t in db.query(Transaction).filter(Transaction.user_id == current_user.id).all() if t.date[:7] == fallback]

    income = sum(t.amount for t in txs if t.transaction_type == "credit") or 1
    NEEDS_KEYWORDS    = ["emi", "rent", "electricity", "water", "gas", "medicine", "grocery", "fuel", "broadband"]
    WANTS_KEYWORDS    = ["netflix", "amazon", "zomato", "swiggy", "restaurant", "movie", "shopping", "myntra", "flipkart"]

    needs, wants = 0.0, 0.0
    for t in txs:
        if t.transaction_type == "debit":
            desc = t.description.lower()
            if any(k in desc for k in NEEDS_KEYWORDS):
                needs += t.amount
            elif any(k in desc for k in WANTS_KEYWORDS):
                wants += t.amount

    spend = sum(t.amount for t in txs if t.transaction_type == "debit")
    savings_amount = income - spend

    return {
        "income": round(income, 2),
        "actual": {
            "needs_pct":    round(needs / income * 100, 1),
            "wants_pct":    round(wants / income * 100, 1),
            "savings_pct":  round(max(0, savings_amount) / income * 100, 1),
        },
        "target": {"needs_pct": 50, "wants_pct": 30, "savings_pct": 20},
    }


@router.get("/credit-score", response_model=CreditScoreOut)
async def get_credit_score(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txs = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    if not txs:
        raise HTTPException(status_code=404, detail="No transactions found.")

    tx_data = [{"description": t.description, "amount": t.amount, "type": t.transaction_type} for t in txs]

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(f"{settings.ML_SERVICE_URL}/ml/credit-score", json={"transactions": tx_data})
        result = resp.json()

    summary = db.query(FinancialSummary).filter(FinancialSummary.user_id == current_user.id).first()
    if summary:
        summary.credit_score = result["score"]
        db.commit()

    return result


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat(
    request: Request,
    body: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    summary = db.query(FinancialSummary).filter(FinancialSummary.user_id == current_user.id).first()
    context = summary.context_text if summary else "No financial data available yet. Please upload a CSV first."

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{settings.ML_SERVICE_URL}/ml/chat",
                json={"question": body.question, "context": context}
            )
            data = resp.json()
    except httpx.ConnectError:
        return {
            "answer": "AI advisor is temporarily unavailable. Make sure Ollama is running and try again.",
            "chartData": None,
        }
    except httpx.TimeoutException:
        return {
            "answer": "The AI advisor took too long to respond. Please try a shorter question.",
            "chartData": None,
        }

    return {
        "answer": data.get("answer", "Sorry, I could not generate a response."),
        "chartData": data.get("chartData"),
    }
