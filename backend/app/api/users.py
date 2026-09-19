"""Public user directory for chat and booking labels."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.models.enums import UserRole

router = APIRouter(prefix="/users", tags=["Users"])


class PublicUser(BaseModel):
    id: int
    full_name: str
    role: UserRole
    avatar_url: str | None = None


@router.get("/{user_id}", response_model=PublicUser)
def get_public_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="User not found")
    return PublicUser(
        id=user.id,
        full_name=user.full_name,
        role=user.role,
        avatar_url=user.avatar_url,
    )
