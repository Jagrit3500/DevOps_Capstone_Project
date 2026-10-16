import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class CandidateStatus(str, enum.Enum):
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW = "interview"
    OFFER = "offer"
    HIRED = "hired"
    REJECTED = "rejected"


class Priority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    position = Column(String(255), nullable=False)
    department = Column(String(255), nullable=False)
    # Use String so both SQLite (tests) and PostgreSQL (production) work
    status = Column(
        String(20),
        nullable=False,
        default=CandidateStatus.APPLIED.value,
    )
    priority = Column(
        String(10),
        nullable=False,
        default=Priority.MEDIUM.value,
    )
    notes = Column(Text, nullable=True)
    resume_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
