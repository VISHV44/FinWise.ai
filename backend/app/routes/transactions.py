from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import pandas as pd
import httpx
import csv
import io
from app.database import get_db
from app.models import User, Transaction, FinancialSummary
from app.schemas import TransactionPage
from app.dependencies import get_current_user
from app.config import settings

router = APIRouter(prefix="/transactions", tags=["transactions"])

VALID_CATEGORIES = [
    "Salary", "EMI", "Groceries", "Entertainment", "Fuel",
    "Utilities", "Healthcare", "Shopping", "Dining", "Transfer", "Other"
]

class CategoryUpdate(BaseModel):
    category: str

@router.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    contents = await file.read()

    # --- Validate and parse BEFORE touching the database ---
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")

    df.columns = df.columns.str.strip().str.lower()

    required = {"date", "description", "amount"}
    if not required.issubset(set(df.columns)):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must have columns: date, description, amount. Found: {list(df.columns)}"
        )

    records = []
    for _, row in df.iterrows():
        try:
            amount = float(row["amount"])
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail=f"Invalid amount value: {row.get('amount')}")
        tx = Transaction(
            user_id=current_user.id,
            date=str(row["date"]),
            description=str(row["description"]),
            amount=abs(amount),
            transaction_type="credit" if amount > 0 else "debit",
            category=None,
            is_anomaly=False,
        )
        records.append(tx)

    # --- Atomic replace: delete old, insert new in one transaction ---
    try:
        db.query(Transaction).filter(Transaction.user_id == current_user.id).delete()
        db.add_all(records)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error during upload: {e}")

    tx_data = [
        {"description": r.description, "amount": r.amount, "type": r.transaction_type, "date": r.date}
        for r in records
    ]

    ml_errors = []
    classify_result = {}
    anomaly_result = {}

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            classify_resp = await client.post(
                f"{settings.ML_SERVICE_URL}/ml/classify",
                json={"transactions": tx_data}
            )
            classify_result = classify_resp.json()

            anomaly_resp = await client.post(
                f"{settings.ML_SERVICE_URL}/ml/anomaly",
                json={"transactions": tx_data}
            )
            anomaly_result = anomaly_resp.json()

        db_txs = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
        for i, tx in enumerate(db_txs):
            if i < len(classify_result.get("categories", [])):
                tx.category = classify_result["categories"][i]
            if i < len(anomaly_result.get("results", [])):
                result = anomaly_result["results"][i]
                tx.is_anomaly = result["is_anomaly"]
                tx.anomaly_score = result["score"]
                tx.explanation = result.get("explanation", "")
        db.commit()

    except httpx.ConnectError:
        ml_errors.append("ML service is unavailable — categories and anomaly detection skipped.")
    except Exception as e:
        ml_errors.append(f"ML processing failed: {e}")

    total_credits = sum(r.amount for r in records if r.transaction_type == "credit")
    total_debits = sum(r.amount for r in records if r.transaction_type == "debit")
    savings = total_credits - total_debits
    savings_rate = round((savings / total_credits * 100), 1) if total_credits > 0 else 0
    anomaly_count = sum(1 for r in anomaly_result.get("results", []) if r.get("is_anomaly"))

    context = (
        f"User's financial summary: Total income (credits) ₹{total_credits:.0f}, "
        f"Total spend (debits) ₹{total_debits:.0f}, "
        f"Net savings ₹{savings:.0f} ({savings_rate}% savings rate). "
        f"{anomaly_count} suspicious transactions detected. "
        f"Total {len(records)} transactions analysed."
    )

    try:
        summary = db.query(FinancialSummary).filter(
            FinancialSummary.user_id == current_user.id
        ).first()
        if not summary:
            summary = FinancialSummary(user_id=current_user.id)
            db.add(summary)
        summary.monthly_income = total_credits
        summary.monthly_spend = total_debits
        summary.savings_rate = savings_rate
        summary.context_text = context
        db.commit()
    except Exception:
        db.rollback()

    response = {"message": "Upload successful", "total": len(records)}
    if ml_errors:
        response["warnings"] = ml_errors
    return response


@router.get("/export")
def export_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txs = db.query(Transaction).filter(Transaction.user_id == current_user.id).order_by(Transaction.date.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Description", "Amount", "Type", "Category", "Anomaly", "Risk Score"])
    for t in txs:
        writer.writerow([
            t.date, t.description,
            t.amount if t.transaction_type == "credit" else -t.amount,
            t.transaction_type, t.category or "",
            "Yes" if t.is_anomaly else "No",
            round(t.anomaly_score or 0, 3)
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=finwise-transactions.csv"}
    )


@router.get("/", response_model=TransactionPage)
def get_transactions(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    anomaly_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if anomaly_only:
        query = query.filter(Transaction.is_anomaly == True)
    total = query.count()
    txs = query.order_by(Transaction.date.desc()).offset((page - 1) * size).limit(size).all()
    return {"total": total, "page": page, "size": size, "transactions": txs}


@router.patch("/{transaction_id}/category")
def update_category(
    transaction_id: int,
    body: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if body.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {VALID_CATEGORIES}")
    tx = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    tx.category = body.category
    db.commit()
    return {"message": "Category updated", "category": body.category}
