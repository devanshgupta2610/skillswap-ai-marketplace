"""Spec aliases: POST /jobs and GET /jobs."""

from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.client import create_job, list_jobs
from app.auth import require_role
from app.database import get_db
from app.models import User
from app.models.enums import UserRole
from app.schemas import JobCreate, JobOut

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def post_job(
    payload: JobCreate,
    user: User = Depends(require_role(UserRole.CLIENT)),
    db: Session = Depends(get_db),
):
    return create_job(payload, user, db)


@router.get("", response_model=List[JobOut])
def get_jobs(db: Session = Depends(get_db)):
    return list_jobs(db)
