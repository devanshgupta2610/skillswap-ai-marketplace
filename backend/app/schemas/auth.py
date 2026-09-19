"""Pydantic schemas for auth and shared responses."""

from datetime import datetime
from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole

T = TypeVar("T")


class MessageOut(BaseModel):
    message: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=200)
    role: UserRole


class UserRegister(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    avatar_url: Optional[str] = None
    created_at: datetime


class AuthResponse(BaseModel):
    user: UserOut
    tokens: TokenPair


class Paginated(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
