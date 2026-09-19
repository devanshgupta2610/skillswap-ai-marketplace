"""Seed demo creator + client accounts for local judging and demos.

Usage (from backend/ with venv active):
    python scripts/seed.py
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from sqlalchemy.orm import Session  # noqa: E402

from app.auth.security import hash_password  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models import (  # noqa: E402
    Booking,
    ClientProfile,
    CreatorProfile,
    Gig,
    Job,
    Milestone,
    PortfolioProject,
    Review,
    User,
)
from app.models.enums import BookingStatus, MilestoneStatus, UserRole  # noqa: E402


def upsert_user(db: Session, email: str, full_name: str, role: UserRole) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user:
        return user
    user = User(
        email=email,
        full_name=full_name,
        hashed_password=hash_password("password123"),
        role=role,
    )
    db.add(user)
    db.flush()
    if role == UserRole.CREATOR:
        db.add(
            CreatorProfile(
                user_id=user.id,
                headline="Campus full-stack creator",
                bio="I ship student products with React, FastAPI, and AI-assisted workflows.",
                skills="React, TypeScript, FastAPI, Python, UI Design",
                tags="ai, marketplace, student",
                experience_years=2.0,
                hourly_rate=800,
                location="Bengaluru",
                trust_score=78,
                rating_avg=4.8,
                rating_count=1,
                completed_projects=1,
            )
        )
    else:
        db.add(
            ClientProfile(
                user_id=user.id,
                company_name="Campus Labs",
                bio="We hire student talent with proof of work, not years of experience.",
                industry="EdTech",
                location="Hyderabad",
            )
        )
    db.flush()
    return user


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        creator = upsert_user(db, "creator@skillswap.ai", "Ananya Rao", UserRole.CREATOR)
        second = upsert_user(db, "creator2@skillswap.ai", "Rahul Iyer", UserRole.CREATOR)
        client = upsert_user(db, "client@skillswap.ai", "Meera Shah", UserRole.CLIENT)

        if second.creator_profile and not second.creator_profile.headline:
            second.creator_profile.headline = "Motion + brand designer"
            second.creator_profile.skills = "Figma, After Effects, Branding, UI"
            second.creator_profile.tags = "design, video"
            second.creator_profile.trust_score = 71
            second.creator_profile.location = "Pune"

        if creator.creator_profile and not creator.creator_profile.portfolio_projects:
            db.add(
                PortfolioProject(
                    creator_id=creator.creator_profile.id,
                    title="Campus Skill Marketplace",
                    description=(
                        "A production-style marketplace where students showcase AI-generated "
                        "portfolio cards and get matched with clients on trust, not lowest price."
                    ),
                    skills_used="React, FastAPI, PostgreSQL, Tailwind",
                    tools_used="Vite, SQLAlchemy, Framer Motion",
                    ai_generated=True,
                    embedding_text="marketplace react fastapi students portfolio matching",
                )
            )
            db.add(
                Gig(
                    creator_id=creator.creator_profile.id,
                    title="Ship a student product landing page",
                    description=(
                        "I design and build a conversion-focused landing page with a dark SaaS "
                        "aesthetic, responsive layout, and clear call to action."
                    ),
                    category="development",
                    tags="react, landing, saas",
                    price=4500,
                    delivery_days=5,
                )
            )

        if second.creator_profile and not second.creator_profile.portfolio_projects:
            db.add(
                PortfolioProject(
                    creator_id=second.creator_profile.id,
                    title="Brand system for a campus club",
                    description="Logo, type, and motion bumpers for a student design collective.",
                    skills_used="Figma, Branding, Motion",
                    tools_used="Figma, After Effects",
                    ai_generated=True,
                    embedding_text="branding figma motion campus club",
                )
            )
            db.add(
                Gig(
                    creator_id=second.creator_profile.id,
                    title="Brand identity in 7 days",
                    description="A compact brand kit: logo, colors, type, and social templates for early teams.",
                    category="design",
                    tags="brand, figma, identity",
                    price=3200,
                    delivery_days=7,
                )
            )

        if client.client_profile and not client.client_profile.jobs:
            job = Job(
                client_id=client.client_profile.id,
                title="Need a React + FastAPI marketplace MVP",
                description=(
                    "We want student creators to build a trusted marketplace MVP with portfolios, "
                    "matching, and milestone bookings."
                ),
                required_skills="React, FastAPI, Python",
                budget_min=4000,
                budget_max=12000,
                category="development",
            )
            db.add(job)
            db.flush()
            client.client_profile.jobs_posted = 1

            existing_booking = (
                db.query(Booking)
                .filter(Booking.client_user_id == client.id, Booking.creator_user_id == creator.id)
                .first()
            )
            if not existing_booking:
                booking = Booking(
                    client_user_id=client.id,
                    creator_user_id=creator.id,
                    job_id=job.id,
                    title="Marketplace MVP sprint",
                    description="Milestone-safe delivery of the SkillSwap core loop.",
                    amount=8000,
                    status=BookingStatus.COMPLETED,
                )
                db.add(booking)
                db.flush()
                db.add_all(
                    [
                        Milestone(
                            booking_id=booking.id,
                            title="Kickoff + IA",
                            amount=2400,
                            order_index=0,
                            status=MilestoneStatus.APPROVED,
                        ),
                        Milestone(
                            booking_id=booking.id,
                            title="Production delivery",
                            amount=5600,
                            order_index=1,
                            status=MilestoneStatus.APPROVED,
                        ),
                    ]
                )
                db.add(
                    Review(
                        booking_id=booking.id,
                        reviewer_id=client.id,
                        reviewee_id=creator.id,
                        rating=5,
                        feedback="Clear communication, strong portfolio, and on-time milestone delivery.",
                        project_verified=True,
                    )
                )

        db.commit()
        print("Seeded demo accounts:")
        print("  creator@skillswap.ai / password123")
        print("  creator2@skillswap.ai / password123")
        print("  client@skillswap.ai / password123")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
