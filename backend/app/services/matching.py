"""Reusable trust-weighted talent matching.

This module is independent of any AI provider. The AI service may refine
matching reasons, but ranking always comes from these deterministic signals.
"""

from __future__ import annotations

from typing import Any, Dict, List, Set


def tokenize(value: str | None) -> Set[str]:
    if not value:
        return set()
    return {part.strip().lower() for part in value.split(",") if part.strip()}


def score_creator(
    job_title: str,
    job_description: str,
    required_skills: str,
    creator: Dict[str, Any],
) -> Dict[str, Any]:
    """Score one creator against a job brief.

    Weights prioritize skill/portfolio evidence and trust over years of
    experience or price. Price is intentionally excluded.
    """
    req = tokenize(required_skills)
    creator_skills = tokenize(creator.get("skills"))
    tags = tokenize(creator.get("tags"))
    portfolio_text = (creator.get("portfolio_text") or "").lower()
    job_blob = f"{job_title} {job_description} {required_skills}".lower()

    skill_overlap = len(req & creator_skills) / max(len(req), 1)
    tag_overlap = len(req & tags) / max(len(req), 1) if req else 0
    experience = min(float(creator.get("experience_years") or 0) / 5.0, 1.0)
    trust = min(float(creator.get("trust_score") or 50) / 100.0, 1.0)
    rating = min(float(creator.get("rating_avg") or 0) / 5.0, 1.0)
    portfolio_hits = sum(1 for skill in req if skill and skill in portfolio_text) / max(len(req), 1)

    score = (
        skill_overlap * 0.35
        + tag_overlap * 0.10
        + portfolio_hits * 0.20
        + experience * 0.10
        + trust * 0.15
        + rating * 0.10
    ) * 100

    reasons: List[str] = []
    matched = sorted(req & creator_skills)
    if matched:
        reasons.append(f"Skills match: {', '.join(matched[:5])}")
    if portfolio_hits > 0:
        reasons.append("Portfolio projects align with the brief")
    if trust >= 0.7:
        reasons.append(f"Strong trust score ({creator.get('trust_score', 0):.0f})")
    if rating >= 0.7:
        reasons.append(f"High client rating ({creator.get('rating_avg', 0):.1f}/5)")
    if not reasons:
        reasons.append("Partial profile fit — review portfolio for potential")

    headline = (creator.get("headline") or "").lower()
    if any(word in headline for word in job_blob.split()[:8] if len(word) > 3):
        score = min(score + 5, 100)
        reasons.append("Headline aligns with job theme")

    return {
        "creator_id": creator["creator_id"],
        "user_id": creator["user_id"],
        "full_name": creator.get("full_name", "Creator"),
        "headline": creator.get("headline"),
        "skills": creator.get("skills"),
        "trust_score": float(creator.get("trust_score") or 0),
        "rating_avg": float(creator.get("rating_avg") or 0),
        "compatibility_score": round(score, 1),
        "matching_reasons": reasons,
    }


def rank_creators(
    job_title: str,
    job_description: str,
    required_skills: str,
    creators: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    scored = [
        score_creator(job_title, job_description, required_skills, creator) for creator in creators
    ]
    scored.sort(key=lambda item: item["compatibility_score"], reverse=True)
    return scored
