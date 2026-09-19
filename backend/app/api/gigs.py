"""Gig marketplace routes."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user, require_role
from app.database import get_db
from app.models import Gig, SavedGig, User
from app.models.enums import GigStatus, UserRole
from app.schemas import GigCreate, GigOut, GigUpdate, MessageOut

router = APIRouter(prefix="/gigs", tags=["Gigs"])


def _gig_out(gig: Gig) -> GigOut:
    data = GigOut.model_validate(gig)
    if gig.creator and gig.creator.user:
        data.creator_name = gig.creator.user.full_name
        data.creator_rating = gig.creator.rating_avg
        data.creator_user_id = gig.creator.user_id
    return data


@router.post("", response_model=GigOut, status_code=status.HTTP_201_CREATED)
def create_gig(
    payload: GigCreate,
    user: User = Depends(require_role(UserRole.CREATOR)),
    db: Session = Depends(get_db),
):
    profile = user.creator_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Creator profile not found")
    gig = Gig(creator_id=profile.id, **payload.model_dump())
    db.add(gig)
    db.commit()
    db.refresh(gig)
    from app.models import CreatorProfile

    gig = (
        db.query(Gig)
        .options(joinedload(Gig.creator).joinedload(CreatorProfile.user))
        .filter(Gig.id == gig.id)
        .first()
    )
    return _gig_out(gig)


@router.get("", response_model=List[GigOut])
def list_gigs(
    q: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    from app.models import CreatorProfile

    query = (
        db.query(Gig)
        .options(joinedload(Gig.creator).joinedload(CreatorProfile.user))
        .filter(Gig.status == GigStatus.ACTIVE)
    )
    if category:
        query = query.filter(Gig.category.ilike(f"%{category}%"))
    if min_price is not None:
        query = query.filter(Gig.price >= min_price)
    if max_price is not None:
        query = query.filter(Gig.price <= max_price)
    if q:
        like = f"%{q}%"
        query = query.filter((Gig.title.ilike(like)) | (Gig.description.ilike(like)) | (Gig.tags.ilike(like)))
    gigs = query.order_by(Gig.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return [_gig_out(g) for g in gigs]


@router.get("/mine", response_model=List[GigOut])
def my_gigs(
    user: User = Depends(require_role(UserRole.CREATOR)),
    db: Session = Depends(get_db),
):
    from app.models import CreatorProfile

    if not user.creator_profile:
        raise HTTPException(status_code=404, detail="Creator profile not found")
    gigs = (
        db.query(Gig)
        .options(joinedload(Gig.creator).joinedload(CreatorProfile.user))
        .filter(Gig.creator_id == user.creator_profile.id)
        .order_by(Gig.created_at.desc())
        .all()
    )
    return [_gig_out(g) for g in gigs]


@router.get("/saved/mine", response_model=List[GigOut])
def my_saved_gigs(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models import CreatorProfile

    rows = (
        db.query(SavedGig)
        .options(joinedload(SavedGig.gig).joinedload(Gig.creator).joinedload(CreatorProfile.user))
        .filter(SavedGig.user_id == user.id)
        .all()
    )
    return [_gig_out(r.gig) for r in rows if r.gig]


@router.get("/{gig_id}", response_model=GigOut)
def get_gig(gig_id: int, db: Session = Depends(get_db)):
    from app.models import CreatorProfile

    gig = (
        db.query(Gig)
        .options(joinedload(Gig.creator).joinedload(CreatorProfile.user))
        .filter(Gig.id == gig_id)
        .first()
    )
    if not gig:
        raise HTTPException(status_code=404, detail="Gig not found")
    gig.views += 1
    db.commit()
    db.refresh(gig)
    return _gig_out(gig)


@router.put("/{gig_id}", response_model=GigOut)
def update_gig(
    gig_id: int,
    payload: GigUpdate,
    user: User = Depends(require_role(UserRole.CREATOR)),
    db: Session = Depends(get_db),
):
    gig = db.query(Gig).options(joinedload(Gig.creator)).filter(Gig.id == gig_id).first()
    if not gig or not user.creator_profile or gig.creator_id != user.creator_profile.id:
        raise HTTPException(status_code=404, detail="Gig not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(gig, key, value)
    db.commit()
    db.refresh(gig)
    return _gig_out(gig)


@router.delete("/{gig_id}", response_model=MessageOut)
def delete_gig(
    gig_id: int,
    user: User = Depends(require_role(UserRole.CREATOR)),
    db: Session = Depends(get_db),
):
    gig = db.query(Gig).filter(Gig.id == gig_id).first()
    if not gig or not user.creator_profile or gig.creator_id != user.creator_profile.id:
        raise HTTPException(status_code=404, detail="Gig not found")
    db.delete(gig)
    db.commit()
    return MessageOut(message="Gig deleted")


@router.post("/{gig_id}/save", response_model=MessageOut)
def save_gig(
    gig_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    gig = db.get(Gig, gig_id)
    if not gig:
        raise HTTPException(status_code=404, detail="Gig not found")
    existing = db.query(SavedGig).filter(SavedGig.user_id == user.id, SavedGig.gig_id == gig_id).first()
    if existing:
        return MessageOut(message="Already saved")
    db.add(SavedGig(user_id=user.id, gig_id=gig_id))
    db.commit()
    return MessageOut(message="Gig saved")


@router.delete("/{gig_id}/save", response_model=MessageOut)
def unsave_gig(
    gig_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.query(SavedGig).filter(SavedGig.user_id == user.id, SavedGig.gig_id == gig_id).first()
    if row:
        db.delete(row)
        db.commit()
    return MessageOut(message="Gig unsaved")
