"""Booking workflow with milestone support."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user, require_role
from app.database import get_db
from app.models import Booking, Milestone, User
from app.models.enums import BookingStatus, MilestoneStatus, NotificationType, UserRole
from app.schemas import BookingCreate, BookingOut, BookingUpdate, MilestoneOut
from app.services import create_notification
from app.utils.names import user_name

router = APIRouter(prefix="/booking", tags=["Bookings"])

ALLOWED_TRANSITIONS = {
    BookingStatus.PENDING: {BookingStatus.ACCEPTED, BookingStatus.DECLINED, BookingStatus.CANCELLED},
    BookingStatus.ACCEPTED: {BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED},
    BookingStatus.IN_PROGRESS: {BookingStatus.SUBMITTED, BookingStatus.CANCELLED},
    BookingStatus.SUBMITTED: {BookingStatus.COMPLETED, BookingStatus.IN_PROGRESS},
    BookingStatus.COMPLETED: set(),
    BookingStatus.CANCELLED: set(),
    BookingStatus.DECLINED: set(),
}


def _booking_out(booking: Booking, db: Session) -> BookingOut:
    data = BookingOut.model_validate(booking)
    data.milestones = [MilestoneOut.model_validate(m) for m in booking.milestones]
    data.client_name = user_name(db, booking.client_user_id)
    data.creator_name = user_name(db, booking.creator_user_id)
    return data


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    user: User = Depends(require_role(UserRole.CLIENT)),
    db: Session = Depends(get_db),
):
    creator = db.get(User, payload.creator_user_id)
    if not creator or not creator.creator_profile:
        raise HTTPException(status_code=404, detail="Creator not found")

    booking = Booking(
        client_user_id=user.id,
        creator_user_id=payload.creator_user_id,
        gig_id=payload.gig_id,
        job_id=payload.job_id,
        title=payload.title,
        description=payload.description,
        amount=payload.amount,
        status=BookingStatus.PENDING,
    )
    db.add(booking)
    db.flush()

    if payload.milestones:
        for m in payload.milestones:
            db.add(
                Milestone(
                    booking_id=booking.id,
                    title=m.title,
                    description=m.description,
                    amount=m.amount,
                    due_date=m.due_date,
                    order_index=m.order_index,
                )
            )

    create_notification(
        db,
        payload.creator_user_id,
        "New booking request",
        f"{user.full_name} requested: {payload.title}",
        NotificationType.BOOKING,
        link=f"/creator/bookings",
    )
    db.commit()
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.milestones))
        .filter(Booking.id == booking.id)
        .first()
    )
    return _booking_out(booking, db)


@router.get("", response_model=List[BookingOut])
def list_bookings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    bookings = (
        db.query(Booking)
        .options(joinedload(Booking.milestones))
        .filter((Booking.client_user_id == user.id) | (Booking.creator_user_id == user.id))
        .order_by(Booking.created_at.desc())
        .all()
    )
    return [_booking_out(b, db) for b in bookings]


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(booking_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.milestones))
        .filter(Booking.id == booking_id)
        .first()
    )
    if not booking or user.id not in {booking.client_user_id, booking.creator_user_id}:
        raise HTTPException(status_code=404, detail="Booking not found")
    return _booking_out(booking, db)


@router.put("/{booking_id}", response_model=BookingOut)
def update_booking(
    booking_id: int,
    payload: BookingUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.milestones))
        .filter(Booking.id == booking_id)
        .first()
    )
    if not booking or user.id not in {booking.client_user_id, booking.creator_user_id}:
        raise HTTPException(status_code=404, detail="Booking not found")

    if payload.status and payload.status != booking.status:
        allowed = ALLOWED_TRANSITIONS.get(booking.status, set())
        if payload.status not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot transition from {booking.status.value} to {payload.status.value}",
            )
        # Role checks
        if payload.status in {BookingStatus.ACCEPTED, BookingStatus.DECLINED} and user.id != booking.creator_user_id:
            raise HTTPException(status_code=403, detail="Only creator can accept/decline")
        if payload.status == BookingStatus.SUBMITTED and user.id != booking.creator_user_id:
            raise HTTPException(status_code=403, detail="Only creator can submit work")
        if payload.status == BookingStatus.COMPLETED and user.id != booking.client_user_id:
            raise HTTPException(status_code=403, detail="Only client can mark completed")

        booking.status = payload.status
        if payload.status == BookingStatus.COMPLETED:
            creator = db.get(User, booking.creator_user_id)
            if creator and creator.creator_profile:
                creator.creator_profile.completed_projects += 1
                creator.creator_profile.trust_score = min(
                    100.0, creator.creator_profile.trust_score + 2.0
                )
            client = db.get(User, booking.client_user_id)
            if client and client.client_profile:
                client.client_profile.total_spent += booking.amount

        notify_user = (
            booking.client_user_id if user.id == booking.creator_user_id else booking.creator_user_id
        )
        create_notification(
            db,
            notify_user,
            "Booking updated",
            f"'{booking.title}' is now {payload.status.value.replace('_', ' ')}",
            NotificationType.BOOKING,
        )

    if payload.delivery_notes is not None:
        booking.delivery_notes = payload.delivery_notes
    if payload.delivery_url is not None:
        booking.delivery_url = payload.delivery_url

    db.commit()
    db.refresh(booking)
    return _booking_out(booking, db)


@router.put("/milestones/{milestone_id}", response_model=MilestoneOut)
def update_milestone(
    milestone_id: int,
    status_value: MilestoneStatus,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    milestone = db.get(Milestone, milestone_id)
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    booking = db.get(Booking, milestone.booking_id)
    if not booking or user.id not in {booking.client_user_id, booking.creator_user_id}:
        raise HTTPException(status_code=403, detail="Not allowed")
    milestone.status = status_value
    db.commit()
    db.refresh(milestone)
    return MilestoneOut.model_validate(milestone)
