import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy import text

from app.database import get_db, SessionLocal
from app.models import Candidate, CandidateStatus, Priority
from app.routes import router

# ---------------------------------------------------------------------------
# Seed helper — called at startup, silently skipped if DB unreachable (CI)
# ---------------------------------------------------------------------------

def _seed_data() -> None:
    """Insert sample candidates on first boot (idempotent)."""
    try:
        db = SessionLocal()
        try:
            if db.query(Candidate).count() == 0:
                samples = [
                    Candidate(
                        name="Priya Sharma",
                        email="priya.sharma@example.com",
                        position="Senior Backend Engineer",
                        department="Engineering",
                        status=CandidateStatus.INTERVIEW.value,
                        priority=Priority.HIGH.value,
                        notes="Strong Python + Kubernetes experience",
                    ),
                    Candidate(
                        name="Arjun Mehta",
                        email="arjun.mehta@example.com",
                        position="DevOps Engineer",
                        department="Platform",
                        status=CandidateStatus.SCREENING.value,
                        priority=Priority.HIGH.value,
                        notes="5 years AWS + Terraform",
                    ),
                    Candidate(
                        name="Sneha Patil",
                        email="sneha.patil@example.com",
                        position="Product Designer",
                        department="Design",
                        status=CandidateStatus.OFFER.value,
                        priority=Priority.MEDIUM.value,
                        notes="Excellent Figma portfolio",
                    ),
                    Candidate(
                        name="Rohan Verma",
                        email="rohan.verma@example.com",
                        position="Data Scientist",
                        department="Data",
                        status=CandidateStatus.APPLIED.value,
                        priority=Priority.MEDIUM.value,
                    ),
                    Candidate(
                        name="Kavya Reddy",
                        email="kavya.reddy@example.com",
                        position="Frontend Engineer",
                        department="Engineering",
                        status=CandidateStatus.HIRED.value,
                        priority=Priority.HIGH.value,
                        notes="React + TypeScript expert",
                    ),
                    Candidate(
                        name="Vikram Singh",
                        email="vikram.singh@example.com",
                        position="QA Engineer",
                        department="Quality",
                        status=CandidateStatus.REJECTED.value,
                        priority=Priority.LOW.value,
                        notes="Not enough automation experience",
                    ),
                    Candidate(
                        name="Ananya Joshi",
                        email="ananya.joshi@example.com",
                        position="Engineering Manager",
                        department="Engineering",
                        status=CandidateStatus.INTERVIEW.value,
                        priority=Priority.HIGH.value,
                        notes="Strong leadership background",
                    ),
                    Candidate(
                        name="Rahul Kumar",
                        email="rahul.kumar@example.com",
                        position="Security Engineer",
                        department="Platform",
                        status=CandidateStatus.SCREENING.value,
                        priority=Priority.MEDIUM.value,
                    ),
                ]
                db.add_all(samples)
                db.commit()
        finally:
            db.close()
    except Exception:
        # No PostgreSQL in CI/tests — skip seed silently
        pass


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.getenv("SEED_DEMO_DATA", "false").lower() in {"1", "true", "yes"}:
        _seed_data()
    yield


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="HireFlow API",
    description="Recruitment pipeline tracking — DevOps capstone project",
    version="1.0.0",
    lifespan=lifespan,
)

Instrumentator().instrument(app).expose(app, endpoint="/metrics")
app.include_router(router)


# ---------------------------------------------------------------------------
# Core endpoints
# ---------------------------------------------------------------------------

@app.get("/", tags=["root"])
def root():
    return {"service": "HireFlow API", "status": "running", "version": "1.0.0"}


@app.get("/health", tags=["health"])
def health():
    """Kubernetes liveness probe — fast, no DB call."""
    return {"status": "healthy"}


@app.get("/ready", tags=["health"])
def ready():
    """Kubernetes readiness probe — verifies DB is reachable."""
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception:
        raise HTTPException(status_code=503, detail="Database not reachable")
