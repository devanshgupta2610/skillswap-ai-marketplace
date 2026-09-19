"""Lightweight user lookups used when serializing API responses."""

from sqlalchemy.orm import Session

from app.models import User


def user_name(db: Session, user_id: int) -> str | None:
    user = db.get(User, user_id)
    return user.full_name if user else None
