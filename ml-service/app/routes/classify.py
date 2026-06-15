from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import joblib, os

router = APIRouter()

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "classifier.pkl")
classifier = joblib.load(MODEL_PATH)

class TxItem(BaseModel):
    description: str
    amount: float
    type: str

class ClassifyRequest(BaseModel):
    transactions: List[TxItem]

@router.post("/ml/classify")
def classify(req: ClassifyRequest):
    descriptions = [t.description for t in req.transactions]
    categories = classifier.predict(descriptions).tolist()
    return {"categories": categories}
