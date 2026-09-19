"""Client jobs, matching, and dashboard routes."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user, require_role
from app.database import get_db
from app.models import (
    Booking,
    ClientProfile,
    CreatorProfile,
    Job,
    Message,
    Notification,
    PortfolioProject,
    SavedCreator,
    SavedJob,
    User,
)
from app.models.enums import BookingStatus, NotificationType, UserRole
from app.schemas import (
    ClientProfileOut,
    ClientProfileUpdate,
    CreatorProfileOut,
    DashboardStats,
    JobCreate,
    JobOut,
    MatchResult,
    MessageOut,
)
from app.api.creator import _profile_out
from app.services import ai_service, create_notification

router = APIRouter(prefix="/client", tags=["Client"])


def _client_out(profile: ClientProfile, user: User) -> ClientProfileOut:
    data = ClientProfileOut.model_validate(profile)
    data.full_name = user.full_name
    data.avatar_url = user.avatar_url
    return data


def _job_out(job: Job) -> JobOut:
    data = JobOut.model_validate(job)
    if job.client and job.client.user:
        data.client_name = job.client.user.full_name
    return data


@router.get("/profile", response_model=ClientProfileOut)
def get_profile(user: User = Depends(require_role(UserRole.CLIENT))):
    if not user.client_profile:
        raise HTTPException(status_code=404, detail="Client profile not found")
    return _client_out(user.client_profile, user)


@router.put("/profile", response_model=ClientProfileOut)
def update_profile(
    payload: ClientProfileUpdate,
    user: User = Depends(require_role(UserRole.CLIENT)),
    db: Session = Depends(get_db),
):
    profile = user.client_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Client profile not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return _client_out(profile, user)


@router.post("/jobs", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreate,
    user: User = Depends(require_role(UserRole.CLIENT)),
    db: Session = Depends(get_db),
):
    profile = user.client_profile
    job = Job(client_id=profile.id, **payload.model_dump())
    profile.jobs_posted += 1
    db.add(job)
    db.commit()
    db.refresh(job)
    job = db.query(Job).options(joinedload(Job.client)).filter(Job.id == job.id).first()
    return _job_out(job)


@router.get("/jobs", response_model=List[JobOut])
def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(Job).options(joinedload(Job.client)).order_by(Job.created_at.desc()).all()
    return [_job_out(j) for j in jobs]


@router.get("/jobs/mine", response_model=List[JobOut])
def my_jobs(user: User = Depends(require_role(UserRole.CLIENT)), db: Session = Depends(get_db)):
    jobs = (
        db.query(Job)
        .options(joinedload(Job.client))
        .filter(Job.client_id == user.client_profile.id)
        .order_by(Job.created_at.desc())
        .all()
    )
    return [_job_out(j) for j in jobs]


@router.get("/jobs/{job_id}", response_model=JobOut)
def get_job(
    job_id: int,
    user: User = Depends(require_role(UserRole.CLIENT)),
    db: Session = Depends(get_db),
):
    job = (
        db.query(Job)
        .options(joinedload(Job.client))
        .filter(Job.id == job_id, Job.client_id == user.client_profile.id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _job_out(job)


@router.get("/jobs/{job_id}/match", response_model=List[MatchResult])
async def match_job(
    job_id: int,
    user: User = Depends(require_role(UserRole.CLIENT)),
    db: Session = Depends(get_db),
):
    job = db.get(Job, job_id)
    if not job or job.client_id != user.client_profile.id:
        raise HTTPException(status_code=404, detail="Job not found")

    creators = db.query(CreatorProfile).options(joinedload(CreatorProfile.user)).all()
    payloads = []
    for c in creators:
        projects = db.query(PortfolioProject).filter(PortfolioProject.creator_id == c.id).all()
        portfolio_text = " ".join(f"{p.title} {p.description} {p.skills_used}" for p in projects)
        payloads.append(
            {
                "creator_id": c.id,
                "user_id": c.user_id,
                "full_name": c.user.full_name,
                "headline": c.headline,
                "skills": c.skills,
                "tags": c.tags,
                "experience_years": c.experience_years,
                "trust_score": c.trust_score,
                "rating_avg": c.rating_avg,
                "portfolio_text": portfolio_text,
            }
        )

    matches = await ai_service.match_creators(
        job_title=job.title,
        job_description=job.description,
        required_skills=job.required_skills or "",
        creators=payloads,
    )
    return [MatchResult(**m) for m in matches[:20]]


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(user: User = Depends(require_role(UserRole.CLIENT)), db: Session = Depends(get_db)):
    profile = user.client_profile
    bookings = db.query(Booking).filter(Booking.client_user_id == user.id).all()
    active = sum(
        1
        for b in bookings
        if b.status
        in {
            BookingStatus.PENDING,
            BookingStatus.ACCEPTED,
            BookingStatus.IN_PROGRESS,
            BookingStatus.SUBMITTED,
        }
    )
    completed = sum(1 for b in bookings if b.status == BookingStatus.COMPLETED)
    spent = sum(b.amount for b in bookings if b.status == BookingStatus.COMPLETED)
    unread_msg = (
        db.query(Message).filter(Message.recipient_id == user.id, Message.is_read.is_(False)).count()
    )
    unread_note = (
        db.query(Notification)
        .filter(Notification.user_id == user.id, Notification.is_read.is_(False))
        .count()
    )
    return DashboardStats(
        active_bookings=active,
        completed_bookings=completed,
        total_spent=spent,
        unread_messages=unread_msg,
        unread_notifications=unread_note,
    )


@router.post("/creators/{creator_user_id}/save", response_model=MessageOut)
def save_creator(
    creator_user_id: int,
    user: User = Depends(require_role(UserRole.CLIENT)),
    db: Session = Depends(get_db),
):
    creator = db.get(User, creator_user_id)
    if not creator or creator.role != UserRole.CREATOR:
        raise HTTPException(status_code=404, detail="Creator not found")
    existing = (
        db.query(SavedCreator)
        .filter(SavedCreator.client_id == user.id, SavedCreator.creator_user_id == creator_user_id)
        .first()
    )
    if not existing:
        db.add(SavedCreator(client_id=user.id, creator_user_id=creator_user_id))
        create_notification(
            db,
            creator_user_id,
            "You were saved",
            f"{user.full_name} saved your profile",
            NotificationType.SYSTEM,
        )
        db.commit()
    return MessageOut(message="Creator saved")


@router.get("/saved/creators", response_model=List[CreatorProfileOut])
def list_saved_creators(
    user: User = Depends(require_role(UserRole.CLIENT)),
    db: Session = Depends(get_db),
):
    rows = db.query(SavedCreator).filter(SavedCreator.client_id == user.id).all()
    results: List[CreatorProfileOut] = []
    for row in rows:
        creator_user = db.get(User, row.creator_user_id)
        if creator_user and creator_user.creator_profile:
            results.append(_profile_out(creator_user.creator_profile, creator_user))
    return results


@router.get("/saved/jobs", response_model=List[JobOut])
def list_saved_jobs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(SavedJob)
        .options(joinedload(SavedJob.job).joinedload(Job.client))
        .filter(SavedJob.user_id == user.id)
        .all()
    )
    return [_job_out(r.job) for r in rows if r.job]


@router.post("/jobs/{job_id}/save", response_model=MessageOut)
def save_job(
    job_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    existing = db.query(SavedJob).filter(SavedJob.user_id == user.id, SavedJob.job_id == job_id).first()
    if not existing:
        db.add(SavedJob(user_id=user.id, job_id=job_id))
        db.commit()
    return MessageOut(message="Job saved")
