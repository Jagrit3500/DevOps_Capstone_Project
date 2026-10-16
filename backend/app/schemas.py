from datetime import datetime
from typing import Optional
import re

from pydantic import BaseModel, field_validator, model_validator

from app.models import CandidateStatus, Priority

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def clean_required_text(value: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError("This field must not be empty")
    if len(value) > 255:
        raise ValueError("This field must be at most 255 characters")
    return value


def clean_email(value: str) -> str:
    value = value.strip().lower()
    if len(value) > 255 or not EMAIL_PATTERN.fullmatch(value):
        raise ValueError("Enter a valid email address")
    return value


class CandidateBase(BaseModel):
    name: str
    email: str
    position: str
    department: str
    status: CandidateStatus = CandidateStatus.APPLIED
    priority: Priority = Priority.MEDIUM
    notes: Optional[str] = None
    resume_url: Optional[str] = None

    @field_validator("name", "position", "department")
    @classmethod
    def required_text(cls, v: str) -> str:
        return clean_required_text(v)

    @field_validator("email")
    @classmethod
    def valid_email(cls, v: str) -> str:
        return clean_email(v)


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

    @field_validator("name", "position", "department")
    @classmethod
    def required_text(cls, v: Optional[str]) -> Optional[str]:
        return clean_required_text(v) if v is not None else v

    @field_validator("email")
    @classmethod
    def valid_email(cls, v: Optional[str]) -> Optional[str]:
        return clean_email(v) if v is not None else v

    @model_validator(mode="after")
    def required_fields_cannot_be_cleared(self):
        required = ("name", "email", "position", "department", "status", "priority")
        for field in required:
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


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
