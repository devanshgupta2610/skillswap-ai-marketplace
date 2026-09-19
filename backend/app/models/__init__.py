"""SQLAlchemy ORM models for SkillSwap AI."""

from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import (
    BookingStatus,
    GigStatus,
    JobStatus,
    MilestoneStatus,
    NotificationType,
    UserRole,
)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    creator_profile: Mapped[Optional["CreatorProfile"]] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    client_profile: Mapped[Optional["ClientProfile"]] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    sent_messages: Mapped[List["Message"]] = relationship(
        back_populates="sender", foreign_keys="Message.sender_id"
    )
    notifications: Mapped[List["Notification"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    saved_gigs: Mapped[List["SavedGig"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    saved_creators: Mapped[List["SavedCreator"]] = relationship(
        back_populates="client",
        foreign_keys="SavedCreator.client_id",
        cascade="all, delete-orphan",
    )
    saved_jobs: Mapped[List["SavedJob"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class CreatorProfile(Base, TimestampMixin):
    __tablename__ = "creator_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    headline: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    skills: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # comma-separated
    tags: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    experience_years: Mapped[float] = mapped_column(Float, default=0.0)
    hourly_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    availability: Mapped[str] = mapped_column(String(50), default="available")
    rating_avg: Mapped[float] = mapped_column(Float, default=0.0)
    rating_count: Mapped[int] = mapped_column(Integer, default=0)
    completed_projects: Mapped[int] = mapped_column(Integer, default=0)
    trust_score: Mapped[float] = mapped_column(Float, default=50.0)

    user: Mapped["User"] = relationship(back_populates="creator_profile")
    portfolio_projects: Mapped[List["PortfolioProject"]] = relationship(
        back_populates="creator", cascade="all, delete-orphan"
    )
    gigs: Mapped[List["Gig"]] = relationship(back_populates="creator", cascade="all, delete-orphan")


class ClientProfile(Base, TimestampMixin):
    __tablename__ = "client_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    company_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    industry: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    total_spent: Mapped[float] = mapped_column(Float, default=0.0)
    jobs_posted: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped["User"] = relationship(back_populates="client_profile")
    jobs: Mapped[List["Job"]] = relationship(back_populates="client", cascade="all, delete-orphan")


class PortfolioProject(Base, TimestampMixin):
    __tablename__ = "portfolio_projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    creator_id: Mapped[int] = mapped_column(ForeignKey("creator_profiles.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    skills_used: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tools_used: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    pdf_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    project_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    embedding_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    creator: Mapped["CreatorProfile"] = relationship(back_populates="portfolio_projects")


class Gig(Base, TimestampMixin):
    __tablename__ = "gigs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    creator_id: Mapped[int] = mapped_column(ForeignKey("creator_profiles.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    tags: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    delivery_days: Mapped[int] = mapped_column(Integer, default=7)
    status: Mapped[GigStatus] = mapped_column(Enum(GigStatus), default=GigStatus.ACTIVE)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    views: Mapped[int] = mapped_column(Integer, default=0)
    orders_count: Mapped[int] = mapped_column(Integer, default=0)

    creator: Mapped["CreatorProfile"] = relationship(back_populates="gigs")
    bookings: Mapped[List["Booking"]] = relationship(back_populates="gig")
    saved_by: Mapped[List["SavedGig"]] = relationship(back_populates="gig", cascade="all, delete-orphan")


class Job(Base, TimestampMixin):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("client_profiles.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    required_skills: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    budget_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    budget_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    status: Mapped[JobStatus] = mapped_column(Enum(JobStatus), default=JobStatus.OPEN)
    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    client: Mapped["ClientProfile"] = relationship(back_populates="jobs")
    bookings: Mapped[List["Booking"]] = relationship(back_populates="job")
    saved_by: Mapped[List["SavedJob"]] = relationship(back_populates="job", cascade="all, delete-orphan")


class Booking(Base, TimestampMixin):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    creator_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    gig_id: Mapped[Optional[int]] = mapped_column(ForeignKey("gigs.id"), nullable=True)
    job_id: Mapped[Optional[int]] = mapped_column(ForeignKey("jobs.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[BookingStatus] = mapped_column(Enum(BookingStatus), default=BookingStatus.PENDING)
    delivery_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    delivery_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    gig: Mapped[Optional["Gig"]] = relationship(back_populates="bookings")
    job: Mapped[Optional["Job"]] = relationship(back_populates="bookings")
    milestones: Mapped[List["Milestone"]] = relationship(
        back_populates="booking", cascade="all, delete-orphan"
    )
    review: Mapped[Optional["Review"]] = relationship(
        back_populates="booking", uselist=False, cascade="all, delete-orphan"
    )


class Milestone(Base, TimestampMixin):
    __tablename__ = "milestones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[MilestoneStatus] = mapped_column(Enum(MilestoneStatus), default=MilestoneStatus.PENDING)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    booking: Mapped["Booking"] = relationship(back_populates="milestones")


class Review(Base, TimestampMixin):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("booking_id", name="uq_review_booking"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id", ondelete="CASCADE"), unique=True)
    reviewer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    reviewee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    feedback: Mapped[str] = mapped_column(Text, nullable=False)
    project_verified: Mapped[bool] = mapped_column(Boolean, default=True)

    booking: Mapped["Booking"] = relationship(back_populates="review")


class Message(Base, TimestampMixin):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    conversation_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    recipient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    booking_id: Mapped[Optional[int]] = mapped_column(ForeignKey("bookings.id"), nullable=True)

    sender: Mapped["User"] = relationship(back_populates="sent_messages", foreign_keys=[sender_id])


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    type: Mapped[NotificationType] = mapped_column(Enum(NotificationType), default=NotificationType.SYSTEM)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(back_populates="notifications")


class SavedGig(Base, TimestampMixin):
    __tablename__ = "saved_gigs"
    __table_args__ = (UniqueConstraint("user_id", "gig_id", name="uq_saved_gig"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    gig_id: Mapped[int] = mapped_column(ForeignKey("gigs.id", ondelete="CASCADE"))

    user: Mapped["User"] = relationship(back_populates="saved_gigs")
    gig: Mapped["Gig"] = relationship(back_populates="saved_by")


class SavedCreator(Base, TimestampMixin):
    __tablename__ = "saved_creators"
    __table_args__ = (UniqueConstraint("client_id", "creator_user_id", name="uq_saved_creator"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    creator_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    client: Mapped["User"] = relationship(back_populates="saved_creators", foreign_keys=[client_id])


class SavedJob(Base, TimestampMixin):
    __tablename__ = "saved_jobs"
    __table_args__ = (UniqueConstraint("user_id", "job_id", name="uq_saved_job"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"))

    user: Mapped["User"] = relationship(back_populates="saved_jobs")
    job: Mapped["Job"] = relationship(back_populates="saved_by")
