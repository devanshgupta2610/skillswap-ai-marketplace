"""Domain schemas for profiles, gigs, jobs, bookings, reviews, chat."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import (
    BookingStatus,
    GigStatus,
    JobStatus,
    MilestoneStatus,
    NotificationType,
)


# ── Creator / Client profiles ───────────────────────────────────────────────

class CreatorProfileUpdate(BaseModel):
    headline: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None
    tags: Optional[str] = None
    experience_years: Optional[float] = None
    hourly_rate: Optional[float] = None
    location: Optional[str] = None
    availability: Optional[str] = None


class CreatorProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    headline: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None
    tags: Optional[str] = None
    experience_years: float
    hourly_rate: Optional[float] = None
    location: Optional[str] = None
    availability: str
    rating_avg: float
    rating_count: int
    completed_projects: int
    trust_score: float
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    email: Optional[str] = None


class ClientProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    bio: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None


class ClientProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    company_name: Optional[str] = None
    bio: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    total_spent: float
    jobs_posted: int
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


# ── Portfolio ───────────────────────────────────────────────────────────────

class PortfolioCreate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    skills_used: Optional[str] = None
    tools_used: Optional[str] = None
    project_url: Optional[str] = None
    project_details: Optional[str] = None
    use_ai: bool = True


class PortfolioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    creator_id: int
    title: str
    description: str
    skills_used: Optional[str] = None
    tools_used: Optional[str] = None
    image_url: Optional[str] = None
    pdf_url: Optional[str] = None
    project_url: Optional[str] = None
    ai_generated: bool
    created_at: datetime


# ── Gigs ────────────────────────────────────────────────────────────────────

class GigCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=20)
    category: str
    tags: Optional[str] = None
    price: float = Field(gt=0)
    delivery_days: int = Field(ge=1, le=90)
    image_url: Optional[str] = None
    status: GigStatus = GigStatus.ACTIVE


class GigUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    delivery_days: Optional[int] = Field(default=None, ge=1, le=90)
    image_url: Optional[str] = None
    status: Optional[GigStatus] = None


class GigOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    creator_id: int
    title: str
    description: str
    category: str
    tags: Optional[str] = None
    price: float
    delivery_days: int
    status: GigStatus
    image_url: Optional[str] = None
    views: int
    orders_count: int
    created_at: datetime
    creator_name: Optional[str] = None
    creator_rating: Optional[float] = None
    creator_user_id: Optional[int] = None


# ── Jobs ────────────────────────────────────────────────────────────────────

class JobCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=20)
    required_skills: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    category: str
    deadline: Optional[datetime] = None


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_id: int
    title: str
    description: str
    required_skills: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    category: str
    status: JobStatus
    deadline: Optional[datetime] = None
    created_at: datetime
    client_name: Optional[str] = None


class MatchResult(BaseModel):
    creator_id: int
    user_id: int
    full_name: str
    headline: Optional[str] = None
    skills: Optional[str] = None
    trust_score: float
    rating_avg: float
    compatibility_score: float
    matching_reasons: List[str]


# ── Bookings ────────────────────────────────────────────────────────────────

class MilestoneCreate(BaseModel):
    title: str
    description: Optional[str] = None
    amount: float = Field(gt=0)
    due_date: Optional[datetime] = None
    order_index: int = 0


class MilestoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_id: int
    title: str
    description: Optional[str] = None
    amount: float
    due_date: Optional[datetime] = None
    status: MilestoneStatus
    order_index: int


class BookingCreate(BaseModel):
    creator_user_id: int
    gig_id: Optional[int] = None
    job_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    amount: float = Field(gt=0)
    milestones: Optional[List[MilestoneCreate]] = None


class BookingUpdate(BaseModel):
    status: Optional[BookingStatus] = None
    delivery_notes: Optional[str] = None
    delivery_url: Optional[str] = None


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_user_id: int
    creator_user_id: int
    gig_id: Optional[int] = None
    job_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    amount: float
    status: BookingStatus
    delivery_notes: Optional[str] = None
    delivery_url: Optional[str] = None
    created_at: datetime
    milestones: List[MilestoneOut] = []
    client_name: Optional[str] = None
    creator_name: Optional[str] = None


# ── Reviews ─────────────────────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    booking_id: int
    rating: int = Field(ge=1, le=5)
    feedback: str = Field(min_length=10, max_length=2000)


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_id: int
    reviewer_id: int
    reviewee_id: int
    rating: int
    feedback: str
    project_verified: bool
    created_at: datetime
    reviewer_name: Optional[str] = None
    reviewee_name: Optional[str] = None


# ── Messages / Notifications ────────────────────────────────────────────────

class MessageCreate(BaseModel):
    recipient_id: int
    content: str = Field(min_length=1, max_length=5000)
    booking_id: Optional[int] = None


class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: str
    sender_id: int
    recipient_id: int
    content: str
    is_read: bool
    booking_id: Optional[int] = None
    created_at: datetime
    sender_name: Optional[str] = None
    recipient_name: Optional[str] = None


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: NotificationType
    title: str
    body: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime


class DashboardStats(BaseModel):
    active_bookings: int = 0
    completed_bookings: int = 0
    total_earnings: float = 0.0
    total_spent: float = 0.0
    avg_rating: float = 0.0
    portfolio_count: int = 0
    gig_count: int = 0
    unread_messages: int = 0
    unread_notifications: int = 0
    views: int = 0
