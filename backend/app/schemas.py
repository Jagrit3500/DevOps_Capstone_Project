from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator

from app.models import CandidateStatus, Priority


class CandidateBase(BaseModel):
    name: str
    email: str
    position: str
    department: str
    status: CandidateStatus = CandidateStatus.APPLIED
    priority: Priority = Priority.MEDIUM
    notes: Optional[str] = None
    resume_url: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name must not be empty")
        return v.strip()

    @field_validator("position")
    @classmethod
    def position_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Position must not be empty")
        return v.strip()

    @field_validator("department")
    @classmethod
    def department_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Department must not be empty")
        return v.strip()


class CandidateCreate(CandidateBase):
    pass


class CandidateUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    status: Optional[CandidateStatus] = None
    priority: Optional[Priority] = None
    notes: Optional[str] = None
    resume_url: Optional[str] = None


class CandidateResponse(CandidateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PipelineStats(BaseModel):
    total: int
    applied: int
    screening: int
    interview: int
    offer: int
    hired: int
    rejected: int
    high_priority: int
    departments: dict[str, int]
