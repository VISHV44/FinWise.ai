from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TransactionOut(BaseModel):
    id: int
    date: str
    description: str
    amount: float
    transaction_type: str
    category: Optional[str]
    is_anomaly: bool
    anomaly_score: Optional[float]
    explanation: Optional[str] = None
    class Config:
        from_attributes = True

class TransactionPage(BaseModel):
    total: int
    page: int
    size: int
    transactions: List[TransactionOut]

class SummaryOut(BaseModel):
    total_income: float
    total_spend: float
    monthly_income: float
    monthly_spend: float
    savings_rate: float
    total_transactions: int
    anomaly_count: int
    top_categories: dict
    current_month: Optional[str] = None
    current_month_categories: dict = Field(default_factory=dict)

class CreditScoreOut(BaseModel):
    score: int
    grade: str
    income_stability: float
    debt_ratio: float
    savings_discipline: float
    spend_regularity: float

class ChartDataPoint(BaseModel):
    name: str
    value: float

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str
    chartData: Optional[List[ChartDataPoint]] = None
