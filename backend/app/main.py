from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.database import Base, engine
from app.routes import auth, transactions, analysis, budgets, reports
from app.limiter import limiter

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FinWise AI Backend", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(analysis.router)
app.include_router(budgets.router)
app.include_router(reports.router)

@app.get("/health")
def health():
    return {"status": "ok"}
