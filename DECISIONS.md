# Product & Architecture Decisions — SkillSwap AI

## 1. AI Portfolio instead of experience-first hiring

Traditional freelance marketplaces rank talent by years of experience, review volume, and agency polish. That systematically excludes students and early creators who have **real skill** but thin résumés.

SkillSwap AI inverts the funnel:

- Creators upload raw work (notes, images, PDFs).
- An OpenAI-compatible AI layer generates professional titles, descriptions, skills, and tools.
- The resulting **portfolio card** becomes the primary hiring signal.

This is intentional: proof-of-work beats years-of-work for campus talent markets. The AI service is abstracted (`AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL`) so providers can change without rewriting product logic. When AI is offline, deterministic heuristics keep demos and hackathon judging functional.

---

## 2. Trust-weighted matching instead of lowest-price ranking

Race-to-bottom pricing destroys creator livelihoods and client quality. Our matching service scores candidates on:

| Signal | Why it matters |
| --- | --- |
| Skill / tag overlap | Explicit fit to the brief |
| Portfolio similarity | Evidence the creator has done analogous work |
| Experience (capped) | Useful, but not dominant for students |
| Trust score | Completions, reviews, and safe delivery behavior |
| Rating average | Verified client feedback |

Compatibility scores ship with **human-readable matching reasons**, so clients understand *why* someone ranked highly — not just a mysterious number or a cheap bid.

Price can still appear on gigs; it is not the primary sort key for talent match.

---

## 3. Milestone-based workflow for creator safety

Students are often asked to deliver full work before payment clarity. SkillSwap bookings follow a strict lifecycle:

```
Pending → Accepted → In Progress → Submitted → Completed
```

(with Cancelled / Declined as terminal exits)

Milestones attach amounts and statuses to a booking so value is staged. Creators can start work after acceptance; clients complete only after submission. Verified reviews are gated behind **Completed** status, keeping trust signals honest.

This protects young creators from scope abuse while giving clients a clear delivery path — safer than open-ended chat deals or single lump-sum “hope for the best” orders.

---

## Additional engineering decisions

- **Separate creator / client dashboards** — role clarity reduces UX confusion and permission bugs.
- **JWT access + refresh** — short-lived access tokens with rotating refresh for SPA security.
- **WebSocket chat + REST fallback** — realtime when available; REST for reliability and history.
- **SQLite local / Postgres production** — fast onboarding for judges; Supabase for production scale.
- **Cloudinary optional** — uploads degrade gracefully when credentials are absent (hackathon-friendly).
