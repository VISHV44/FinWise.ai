from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import subprocess

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
REQUIRED_MODELS = ["classifier.pkl", "anomaly_model.pkl", "credit_model.pkl"]

def ensure_models():
    if not all(os.path.exists(os.path.join(MODELS_DIR, m)) for m in REQUIRED_MODELS):
        print("ML models not found — training now...")
        subprocess.run(["python", "-m", "app.ml.train"], check=True)

from app.routes import classify, anomaly, credit, chat, forecast

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        ensure_models()
    except Exception as e:
        print(f"WARNING: Model training failed: {e}. Some ML endpoints may not work.")
    print("ML Service started — scikit-learn models loaded, Ollama LLM ready")
    yield
    print("ML Service shutting down")

app = FastAPI(title="FinWise AI ML Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    # Only allow the backend service — the ML service should never be called directly from the browser
    allow_origins=["http://localhost:8000", "http://backend:8000", "http://finwise-backend:8000"],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

app.include_router(classify.router)
app.include_router(anomaly.router)
app.include_router(credit.router)
app.include_router(chat.router)
app.include_router(forecast.router)

@app.get("/health")
def health():
    return {"status": "ok"}
