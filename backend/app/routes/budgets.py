from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.models import User, Transaction, Budget
from app.dependencies import get_current_user
from app.utils import current_month_key, latest_month_key

router = APIRouter(prefix="/budgets", tags=["budgets"])

class BudgetIn(BaseModel):
    category: str
    monthly_limit: float

class BudgetOut(BaseModel):
    id: int
    category: str
    monthly_limit: float
    class Config:
        from_attributes = True

class AlertOut(BaseModel):
    category: str
    budget: float
    spent: float
    percentage: float
    level: str
    month: Optional[str] = None

@router.get("/", response_model=List[BudgetOut])
def get_budgets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Budget).filter(Budget.user_id == current_user.id).all()

@router.post("/", response_model=BudgetOut)
def set_budget(body: BudgetIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category == body.category
    ).first()
    if existing:
        existing.monthly_limit = body.monthly_limit
        db.commit()
        db.refresh(existing)
        return existing
    budget = Budget(user_id=current_user.id, category=body.category, monthly_limit=body.monthly_limit)
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget

@router.delete("/{category}")
def delete_budget(category: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Budget).filter(Budget.user_id == current_user.id, Budget.category == category).delete()
    db.commit()
    return {"message": "Deleted"}

@router.get("/alerts", response_model=List[AlertOut])
def get_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    if not budgets:
        return []

    all_txs = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.transaction_type == "debit"
    ).all()

    # Always use current calendar month so alerts don't vanish when new data is uploaded
    this_month = current_month_key()
    month_txs = [t for t in all_txs if t.date[:7] == this_month]

    # Fall back to the latest available month if there's nothing for the current month
    if not month_txs:
        fallback = latest_month_key(all_txs)
        month_txs = [t for t in all_txs if fallback and t.date[:7] == fallback]
        display_month = fallback
    else:
        display_month = this_month

    spend_by_cat = {}
    for t in month_txs:
        if t.category:
            spend_by_cat[t.category] = spend_by_cat.get(t.category, 0) + t.amount

    alerts = []
    for b in budgets:
        spent = spend_by_cat.get(b.category, 0)
        pct = (spent / b.monthly_limit * 100) if b.monthly_limit > 0 else 0
        if pct >= 80:
            alerts.append({
                "category": b.category,
                "budget": b.monthly_limit,
                "spent": round(spent, 2),
                "percentage": round(pct, 1),
                "level": "danger" if pct >= 100 else "warning",
                "month": display_month,
            })
    return sorted(alerts, key=lambda x: x["percentage"], reverse=True)
