from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Candidate, CandidateStatus, Priority
from app.schemas import (
    CandidateCreate,
    CandidateResponse,
    CandidateUpdate,
    PipelineStats,
)

router = APIRouter(prefix="/api/candidates", tags=["candidates"])


@router.get("/stats", response_model=PipelineStats)
def get_pipeline_stats(db: Session = Depends(get_db)):
    total = db.query(Candidate).count()
    stats = {
        "total": total,
        "applied": db.query(Candidate).filter(Candidate.status == CandidateStatus.APPLIED).count(),
        "screening": db.query(Candidate).filter(Candidate.status == CandidateStatus.SCREENING).count(),
        "interview": db.query(Candidate).filter(Candidate.status == CandidateStatus.INTERVIEW).count(),
        "offer": db.query(Candidate).filter(Candidate.status == CandidateStatus.OFFER).count(),
        "hired": db.query(Candidate).filter(Candidate.status == CandidateStatus.HIRED).count(),
        "rejected": db.query(Candidate).filter(Candidate.status == CandidateStatus.REJECTED).count(),
        "high_priority": db.query(Candidate).filter(Candidate.priority == Priority.HIGH).count(),
        "departments": {},
    }
    dept_counts = (
        db.query(Candidate.department, func.count(Candidate.id))
        .group_by(Candidate.department)
        .all()
    )
    stats["departments"] = {dept: count for dept, count in dept_counts}
    return stats


@router.get("/", response_model=List[CandidateResponse])
def list_candidates(
    status: Optional[CandidateStatus] = Query(None),
    priority: Optional[Priority] = Query(None),
    department: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(Candidate)
    if status:
        query = query.filter(Candidate.status == status)
    if priority:
        query = query.filter(Candidate.priority == priority)
    if department:
        query = query.filter(Candidate.department.ilike(f"%{department}%"))
    return query.order_by(Candidate.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail=f"Candidate {candidate_id} not found")
    return candidate


@router.post("/", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
def create_candidate(payload: CandidateCreate, db: Session = Depends(get_db)):
    existing = db.query(Candidate).filter(Candidate.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Candidate with email {payload.email} already exists")
    candidate = Candidate(**payload.model_dump())
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


@router.put("/{candidate_id}", response_model=CandidateResponse)
def update_candidate(
    candidate_id: int, payload: CandidateUpdate, db: Session = Depends(get_db)
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail=f"Candidate {candidate_id} not found")
    update_data = payload.model_dump(exclude_unset=True)
    if "email" in update_data:
        existing = (
            db.query(Candidate)
            .filter(Candidate.email == update_data["email"], Candidate.id != candidate_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=409, detail="Email already in use by another candidate")
    for key, value in update_data.items():
        setattr(candidate, key, value)
    db.commit()
    db.refresh(candidate)
    return candidate


@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail=f"Candidate {candidate_id} not found")
    db.delete(candidate)
    db.commit()
