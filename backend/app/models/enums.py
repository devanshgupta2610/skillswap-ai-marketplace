"""Shared enums used across models and schemas."""

import enum


class UserRole(str, enum.Enum):
    CREATOR = "creator"
    CLIENT = "client"


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DECLINED = "declined"


class MilestoneStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    PAID = "paid"


class NotificationType(str, enum.Enum):
    BOOKING = "booking"
    MESSAGE = "message"
    REVIEW = "review"
    MATCH = "match"
    SYSTEM = "system"
    PAYMENT = "payment"


class GigStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"


class JobStatus(str, enum.Enum):
    OPEN = "open"
    MATCHED = "matched"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"
    CANCELLED = "cancelled"
