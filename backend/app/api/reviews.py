"""Verified reviews — only for completed bookings."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Booking, Review, User
from app.models.enums import BookingStatus, NotificationType
from app.schemas import ReviewCreate, ReviewOut
from app.services import create_notification
from app.utils.names import user_name

router = APIRouter(prefix="/review", tags=["Reviews"])


def _review_out(review: Review, db: Session) -> ReviewOut:
    data = ReviewOut.model_validate(review)
    data.reviewer_name = user_name(db, review.reviewer_id)
    data.reviewee_name = user_name(db, review.reviewee_id)
    return data


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(
    payload: ReviewCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.get(Booking, payload.booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != BookingStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Reviews require a completed booking")
    if user.id not in {booking.client_user_id, booking.creator_user_id}:
        raise HTTPException(status_code=403, detail="Not a participant of this booking")
    if booking.review:
        raise HTTPException(status_code=400, detail="Review already exists for this booking")

    # Client reviews creator by default; creator can review client too
    reviewee_id = (
        booking.creator_user_id if user.id == booking.client_user_id else booking.client_user_id
    )

    review = Review(
        booking_id=booking.id,
        reviewer_id=user.id,
        reviewee_id=reviewee_id,
        rating=payload.rating,
        feedback=payload.feedback,
        project_verified=True,
    )
    db.add(review)

    reviewee = db.get(User, reviewee_id)
    if reviewee and reviewee.creator_profile:
        profile = reviewee.creator_profile
        total = profile.rating_avg * profile.rating_count + payload.rating
        profile.rating_count += 1
        profile.rating_avg = round(total / profile.rating_count, 2)
        profile.trust_score = min(100.0, profile.trust_score + (payload.rating - 3) * 1.5)

    create_notification(
        db,
        reviewee_id,
        "New verified review",
        f"You received a {payload.rating}-star review",
        NotificationType.REVIEW,
    )
    db.commit()
    db.refresh(review)
    return _review_out(review, db)


@router.get("/mine", response_model=List[ReviewOut])
def my_reviews(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reviews = (
        db.query(Review)
        .filter((Review.reviewer_id == user.id) | (Review.reviewee_id == user.id))
        .order_by(Review.created_at.desc())
        .all()
    )
    return [_review_out(r, db) for r in reviews]


@router.get("/user/{user_id}", response_model=List[ReviewOut])
def reviews_for_user(user_id: int, db: Session = Depends(get_db)):
    reviews = (
        db.query(Review).filter(Review.reviewee_id == user_id).order_by(Review.created_at.desc()).all()
    )
    return [_review_out(r, db) for r in reviews]
