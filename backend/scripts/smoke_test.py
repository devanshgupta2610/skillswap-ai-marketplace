"""End-to-end smoke test for SkillSwap AI API. Run with: python scripts/smoke_test.py"""

from __future__ import annotations

import sys
import time

import httpx

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"


def main() -> None:
    ts = str(int(time.time()))
    with httpx.Client(base_url=BASE, timeout=30.0) as c:
        assert c.get("/health").json()["status"] == "ok"

        creator = c.post(
            "/api/v1/auth/register",
            json={
                "email": f"creator{ts}@demo.com",
                "password": "password123",
                "full_name": "Demo Creator",
                "role": "creator",
            },
        )
        creator.raise_for_status()
        client = c.post(
            "/api/v1/auth/register",
            json={
                "email": f"client{ts}@demo.com",
                "password": "password123",
                "full_name": "Demo Client",
                "role": "client",
            },
        )
        client.raise_for_status()

        h = {"Authorization": f"Bearer {creator.json()['tokens']['access_token']}"}
        ch = {"Authorization": f"Bearer {client.json()['tokens']['access_token']}"}
        creator_id = creator.json()["user"]["id"]

        c.put(
            "/api/v1/creator/profile",
            headers=h,
            json={"headline": "Full-stack student", "skills": "React, FastAPI, Python"},
        ).raise_for_status()

        portfolio = c.post(
            "/api/v1/creator/portfolio",
            headers=h,
            files={
                "project_details": (None, "Campus marketplace with React and FastAPI"),
                "use_ai": (None, "true"),
            },
        )
        portfolio.raise_for_status()

        c.post(
            "/api/v1/gigs",
            headers=h,
            json={
                "title": "Landing page design",
                "description": "Modern responsive landing page for student startups with clear CTA.",
                "category": "design",
                "price": 2500,
                "delivery_days": 5,
            },
        ).raise_for_status()

        job = c.post(
            "/api/v1/client/jobs",
            headers=ch,
            json={
                "title": "Need React developer",
                "description": "Build a marketplace MVP with React and FastAPI for a campus product.",
                "required_skills": "React, FastAPI, Python",
                "category": "development",
                "budget_min": 2000,
                "budget_max": 8000,
            },
        )
        job.raise_for_status()
        matches = c.get(f"/api/v1/client/jobs/{job.json()['id']}/match", headers=ch)
        matches.raise_for_status()

        booking = c.post(
            "/api/v1/booking",
            headers=ch,
            json={
                "creator_user_id": creator_id,
                "title": "MVP build",
                "amount": 5000,
                "milestones": [
                    {"title": "Kickoff", "amount": 1500},
                    {"title": "Delivery", "amount": 3500},
                ],
            },
        )
        booking.raise_for_status()
        bid = booking.json()["id"]
        for status, headers in [
            ("accepted", h),
            ("in_progress", h),
            ("submitted", h),
            ("completed", ch),
        ]:
            c.put(f"/api/v1/booking/{bid}", headers=headers, json={"status": status}).raise_for_status()

        c.post(
            "/api/v1/review",
            headers=ch,
            json={
                "booking_id": bid,
                "rating": 5,
                "feedback": "Excellent delivery and clear communication throughout.",
            },
        ).raise_for_status()

        dash = c.get("/api/v1/creator/dashboard", headers=h)
        dash.raise_for_status()
        print("SMOKE_OK", dash.json())


if __name__ == "__main__":
    main()
