"""Chat REST + WebSocket endpoints."""

from typing import Dict, List, Set

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from app.auth import get_current_user, safe_decode
from app.database import SessionLocal, get_db
from app.models import Message, User
from app.models.enums import NotificationType
from app.schemas import ChatMessageOut, MessageCreate
from app.services import create_notification
from app.utils.chat import conversation_id_for
from app.utils.names import user_name

router = APIRouter(prefix="/chat", tags=["Chat"])


class ConnectionManager:
    def __init__(self) -> None:
        self.active: Dict[int, Set[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active.setdefault(user_id, set()).add(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        if user_id in self.active:
            self.active[user_id].discard(websocket)
            if not self.active[user_id]:
                del self.active[user_id]

    async def send_to_user(self, user_id: int, payload: dict) -> None:
        for ws in list(self.active.get(user_id, set())):
            try:
                await ws.send_json(payload)
            except Exception:
                self.disconnect(user_id, ws)


manager = ConnectionManager()


def _chat_out(msg: Message, db: Session) -> ChatMessageOut:
    data = ChatMessageOut.model_validate(msg)
    data.sender_name = user_name(db, msg.sender_id)
    data.recipient_name = user_name(db, msg.recipient_id)
    return data


@router.post("/messages", response_model=ChatMessageOut, status_code=status.HTTP_201_CREATED)
async def send_message(
    payload: MessageCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    recipient = db.get(User, payload.recipient_id)
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    conv = conversation_id_for(user.id, payload.recipient_id)
    msg = Message(
        conversation_id=conv,
        sender_id=user.id,
        recipient_id=payload.recipient_id,
        content=payload.content,
        booking_id=payload.booking_id,
    )
    db.add(msg)
    create_notification(
        db,
        payload.recipient_id,
        "New message",
        f"{user.full_name}: {payload.content[:80]}",
        NotificationType.MESSAGE,
        link="/messages",
    )
    db.commit()
    db.refresh(msg)

    out = _chat_out(msg, db)
    await manager.send_to_user(payload.recipient_id, {"type": "message", "data": out.model_dump(mode="json")})
    return out


@router.get("/conversations", response_model=List[ChatMessageOut])
def list_conversation(
    with_user: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = conversation_id_for(user.id, with_user)
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conv)
        .order_by(Message.created_at.asc())
        .all()
    )
    unread = [m for m in messages if m.recipient_id == user.id and not m.is_read]
    for m in unread:
        m.is_read = True
    if unread:
        db.commit()
    return [_chat_out(m, db) for m in messages]


@router.get("/inbox", response_model=List[ChatMessageOut])
def inbox(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Latest message per conversation for the current user."""
    messages = (
        db.query(Message)
        .filter((Message.sender_id == user.id) | (Message.recipient_id == user.id))
        .order_by(Message.created_at.desc())
        .all()
    )
    seen: set[str] = set()
    latest: List[Message] = []
    for m in messages:
        if m.conversation_id in seen:
            continue
        seen.add(m.conversation_id)
        latest.append(m)
    return [_chat_out(m, db) for m in latest]


@router.websocket("/ws")
async def websocket_chat(websocket: WebSocket):
    token = websocket.query_params.get("token")
    payload = safe_decode(token or "")
    if not payload or payload.get("type") != "access":
        await websocket.close(code=4401)
        return

    user_id = int(payload["sub"])
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            recipient_id = int(data.get("recipient_id", 0))
            content = (data.get("content") or "").strip()
            if not recipient_id or not content:
                continue

            db = SessionLocal()
            try:
                conv = conversation_id_for(user_id, recipient_id)
                msg = Message(
                    conversation_id=conv,
                    sender_id=user_id,
                    recipient_id=recipient_id,
                    content=content,
                    booking_id=data.get("booking_id"),
                )
                db.add(msg)
                create_notification(
                    db,
                    recipient_id,
                    "New message",
                    content[:80],
                    NotificationType.MESSAGE,
                )
                db.commit()
                db.refresh(msg)
                out = _chat_out(msg, db).model_dump(mode="json")
                await manager.send_to_user(recipient_id, {"type": "message", "data": out})
                await websocket.send_json({"type": "message", "data": out})
            finally:
                db.close()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
