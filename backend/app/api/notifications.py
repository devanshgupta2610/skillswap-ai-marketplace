"""Notifications and AI assistant routes."""

from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Notification, User
from app.schemas import MessageOut, NotificationOut
from app.services import ai_service

router = APIRouter(tags=["Notifications & AI"])


class AssistantRequest(BaseModel):
    message: str
    context: Optional[str] = None


class AssistantResponse(BaseModel):
    reply: str


@router.get("/notifications", response_model=List[NotificationOut])
def list_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notes = (
        db.query(Notification)
        .filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return [NotificationOut.model_validate(n) for n in notes]


@router.post("/notifications/{note_id}/read", response_model=MessageOut)
def mark_read(note_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.get(Notification, note_id)
    if note and note.user_id == user.id:
        note.is_read = True
        db.commit()
    return MessageOut(message="Marked as read")


@router.post("/notifications/read-all", response_model=MessageOut)
def mark_all_read(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(
        Notification.user_id == user.id, Notification.is_read.is_(False)
    ).update({"is_read": True})
    db.commit()
    return MessageOut(message="All notifications marked as read")


@router.post("/ai/assistant", response_model=AssistantResponse)
async def assistant(payload: AssistantRequest, user: User = Depends(get_current_user)):
    reply = await ai_service.chat_assistant(payload.message, payload.context or user.role.value)
    return AssistantResponse(reply=reply)
