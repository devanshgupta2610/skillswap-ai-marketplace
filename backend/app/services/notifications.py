"""Notification helpers."""

from sqlalchemy.orm import Session

from app.models import Notification
from app.models.enums import NotificationType


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    body: str,
    ntype: NotificationType = NotificationType.SYSTEM,
    link: str | None = None,
) -> Notification:
    note = Notification(user_id=user_id, type=ntype, title=title, body=body, link=link)
    db.add(note)
    db.flush()
    return note
