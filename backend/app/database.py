from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

_connect_args = {}
if "supabase" in settings.DATABASE_URL:
    _connect_args["sslmode"] = "require"

# pool_pre_ping=True checks the connection health but does NOT connect at import time.
# The engine is lazy — it only opens a real connection when a query is actually made.
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=_connect_args,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
