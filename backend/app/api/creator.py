"""Creator profile, portfolio, and dashboard routes."""

from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from app.auth import require_role
from app.database import get_db
from app.models import Booking, Gig, Message, Notification, PortfolioProject, User
from app.models.enums import BookingStatus, UserRole
from app.schemas import (
    CreatorProfileOut,
    CreatorProfileUpdate,
    DashboardStats,
    PortfolioOut,
)
from app.services import ai_service, upload_file

router = APIRouter(prefix="/creator", tags=["Creator"])


def _profile_out(profile, user: User) -> CreatorProfileOut:
    data = CreatorProfileOut.model_validate(profile)
    data.full_name = user.full_name
    data.avatar_url = user.avatar_url
    data.email = user.email
    return data


@router.get("/profile", response_model=CreatorProfileOut)
def get_profile(
    user: User = Depends(require_role(UserRole.CREATOR)),
    db: Session = Depends(get_db),
):
    profile = user.creator_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Creator profile not found")
    return _profile_out(profile, user)


@router.put("/profile", response_model=CreatorProfileOut)
def update_profile(
    payload: CreatorProfileUpdate,
    user: User = Depends(require_role(UserRole.CREATOR)),
    db: Session = Depends(get_db),
):
    profile = user.creator_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Creator profile not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return _profile_out(profile, user)


@router.get("/public/{user_id}", response_model=CreatorProfileOut)
def public_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user or not user.creator_profile:
        raise HTTPException(status_code=404, detail="Creator not found")
    return _profile_out(user.creator_profile, user)


@router.get("/browse", response_model=List[CreatorProfileOut])
def browse_creators(
    q: Optional[str] = None,
    skill: Optional[str] = None,
    db: Session = Depends(get_db),
):
    from app.models import CreatorProfile

    query = db.query(CreatorProfile).options(joinedload(CreatorProfile.user))
    creators = query.all()
    results: List[CreatorProfileOut] = []
    for c in creators:
        if skill and skill.lower() not in (c.skills or "").lower():
            continue
        if q:
            blob = f"{c.user.full_name} {c.headline or ''} {c.bio or ''} {c.skills or ''}".lower()
            if q.lower() not in blob:
                continue
        results.append(_profile_out(c, c.user))
    results.sort(key=lambda x: (x.trust_score, x.rating_avg), reverse=True)
    return results


@router.post("/portfolio", response_model=PortfolioOut, status_code=status.HTTP_201_CREATED)
async def create_portfolio(
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    skills_used: Optional[str] = Form(None),
    tools_used: Optional[str] = Form(None),
    project_url: Optional[str] = Form(None),
    project_details: Optional[str] = Form(None),
    use_ai: bool = Form(True),
    image: Optional[UploadFile] = File(None),
    pdf: Optional[UploadFile] = File(None),
    user: User = Depends(require_role(UserRole.CREATOR)),
    db: Session = Depends(get_db),
):
    profile = user.creator_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Creator profile not found")

    details = project_details or description or title or "Creative project"
    generated = {
        "title": title or "Untitled Project",
        "description": description or details,
        "skills_used": skills_used or "",
        "tools_used": tools_used or "",
    }
    if use_ai:
        generated = await ai_service.generate_portfolio(details, title, description)
        if skills_used:
            generated["skills_used"] = skills_used
        if tools_used:
            generated["tools_used"] = tools_used

    image_url = await upload_file(image, "image") if image else None
    pdf_url = await upload_file(pdf, "raw") if pdf else None

    project = PortfolioProject(
        creator_id=profile.id,
        title=generated["title"],
        description=generated["description"],
        skills_used=generated.get("skills_used"),
        tools_used=generated.get("tools_used"),
        project_url=project_url,
        image_url=image_url,
        pdf_url=pdf_url,
        ai_generated=use_ai,
        embedding_text=f"{generated['title']} {generated['description']} {generated.get('skills_used')}",
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return PortfolioOut.model_validate(project)


@router.get("/portfolio", response_model=List[PortfolioOut])
def list_portfolio(
    user: User = Depends(require_role(UserRole.CREATOR)),
    db: Session = Depends(get_db),
):
    profile = user.creator_profile
    projects = (
        db.query(PortfolioProject)
        .filter(PortfolioProject.creator_id == profile.id)
        .order_by(PortfolioProject.created_at.desc())
        .all()
    )
    return [PortfolioOut.model_validate(p) for p in projects]


@router.post("/portfolio/preview")
async def preview_portfolio(
    project_details: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    user: User = Depends(require_role(UserRole.CREATOR)),
):
    """Generate an AI portfolio card without persisting it."""
    _ = user
    details = project_details or description or title or "Creative project"
    return await ai_service.generate_portfolio(details, title, description)


@router.get("/portfolio/user/{creator_user_id}", response_model=List[PortfolioOut])
def public_portfolio(creator_user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, creator_user_id)
    if not user or not user.creator_profile:
        raise HTTPException(status_code=404, detail="Creator not found")
    projects = (
        db.query(PortfolioProject)
        .filter(PortfolioProject.creator_id == user.creator_profile.id)
        .order_by(PortfolioProject.created_at.desc())
        .all()
    )
    return [PortfolioOut.model_validate(p) for p in projects]


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(
    user: User = Depends(require_role(UserRole.CREATOR)),
    db: Session = Depends(get_db),
):
    profile = user.creator_profile
    bookings = db.query(Booking).filter(Booking.creator_user_id == user.id).all()
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
    earnings = sum(b.amount for b in bookings if b.status == BookingStatus.COMPLETED)
    gigs = db.query(Gig).filter(Gig.creator_id == profile.id).all()
    views = sum(g.views for g in gigs)
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
        total_earnings=earnings,
        avg_rating=profile.rating_avg,
        portfolio_count=len(profile.portfolio_projects),
        gig_count=len(gigs),
        unread_messages=unread_msg,
        unread_notifications=unread_note,
        views=views,
    )


@router.post("/pricing/suggest")
async def suggest_pricing(
    category: str,
    skills: str = "",
    delivery_days: int = 7,
    user: User = Depends(require_role(UserRole.CREATOR)),
):
    profile = user.creator_profile
    return await ai_service.suggest_pricing(
        category=category,
        skills=skills or (profile.skills or ""),
        experience_years=profile.experience_years if profile else 0,
        delivery_days=delivery_days,
    )
