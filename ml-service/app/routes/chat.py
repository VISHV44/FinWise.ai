import json
import re
from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel
from langchain_ollama import OllamaLLM
from langchain.prompts import PromptTemplate
from app.config import settings

router = APIRouter()

llm = OllamaLLM(
    model=settings.OLLAMA_MODEL,
    base_url=settings.OLLAMA_BASE_URL,
    temperature=0.3
)

PROMPT_TEMPLATE = PromptTemplate(
    input_variables=["context", "question"],
    template="""You are FinWise, a friendly and precise personal financial advisor AI.
You must ONLY use the financial data provided below to answer. Do not make up numbers.
Be concise — answer in 2 to 4 sentences unless a detailed breakdown is needed.
Always mention specific rupee amounts from the context when available.
If the data is insufficient to answer, say "I don't have enough data to answer that yet."

You must return your response as a valid JSON object with exactly two keys:
- "answer": your text response as a string
- "chartData": an array of objects with "name" and "value" keys if the user asks for a trend, category breakdown, or comparison. If no chart is needed, set "chartData" to null.

Return ONLY the JSON object. No markdown, no code fences, no extra text.

Example:
{{"answer": "Your total spend on dining is ₹4,200.", "chartData": [{{"name": "Dining", "value": 4200}}]}}

Financial context:
{context}

User question: {question}

JSON response:"""
)

chain = PROMPT_TEMPLATE | llm


class ChartDataPoint(BaseModel):
    name: str
    value: float


class ChatRequest(BaseModel):
    question: str
    context: str


class ChatResponse(BaseModel):
    answer: str
    chartData: Optional[List[ChartDataPoint]] = None


def parse_llm_response(raw: str) -> dict:
    text = str(raw).strip()
    fence_match = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    if fence_match:
        text = fence_match.group(1).strip()
    try:
        data = json.loads(text)
        chart_data = data.get("chartData")
        if chart_data is not None and not isinstance(chart_data, list):
            chart_data = None
        return {
            "answer": str(data.get("answer", text)),
            "chartData": chart_data,
        }
    except (json.JSONDecodeError, TypeError):
        return {"answer": text, "chartData": None}


@router.post("/ml/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    raw = chain.invoke({"context": req.context, "question": req.question})
    parsed = parse_llm_response(raw)
    return parsed
