"""OpenAI-compatible AI service abstraction for SkillSwap AI."""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict, List, Optional

import httpx

from app.config import get_settings
from app.services.matching import rank_creators

logger = logging.getLogger(__name__)
settings = get_settings()


class AIProviderError(Exception):
    """Raised when the upstream AI provider fails."""


class AIService:
    """
    Provider-agnostic AI layer.

    Swap AI_BASE_URL / AI_API_KEY / AI_MODEL to move between OpenAI,
    Groq, Together, Azure OpenAI, or any OpenAI-compatible gateway.
    When AI is disabled or the key is missing, deterministic heuristics run.
    """

    def __init__(self) -> None:
        self.api_key = settings.AI_API_KEY
        self.base_url = settings.AI_BASE_URL.rstrip("/")
        self.model = settings.AI_MODEL
        self.enabled = settings.AI_ENABLED and bool(self.api_key)

    async def _chat(self, system: str, user: str, temperature: float = 0.4) -> str:
        if not self.enabled:
            raise AIProviderError("AI provider disabled or missing API key")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "temperature": temperature,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
            if resp.status_code >= 400:
                logger.error("AI provider error %s: %s", resp.status_code, resp.text)
                raise AIProviderError(f"AI provider returned {resp.status_code}")
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    @staticmethod
    def _parse_json(text: str) -> Dict[str, Any]:
        text = text.strip()
        fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
        if fence:
            text = fence.group(1).strip()
        return json.loads(text)

    async def generate_portfolio(
        self,
        project_details: str,
        existing_title: Optional[str] = None,
        existing_description: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate portfolio title, description, skills, and tools."""
        fallback = self._heuristic_portfolio(project_details, existing_title, existing_description)
        if not self.enabled:
            return fallback

        system = (
            "You are SkillSwap AI, helping student creators build professional portfolios. "
            "Return ONLY valid JSON with keys: title, description, skills_used, tools_used. "
            "skills_used and tools_used must be comma-separated strings."
        )
        user = (
            f"Project details:\n{project_details}\n"
            f"Existing title: {existing_title or 'none'}\n"
            f"Existing description: {existing_description or 'none'}"
        )
        try:
            raw = await self._chat(system, user)
            data = self._parse_json(raw)
            return {
                "title": data.get("title") or fallback["title"],
                "description": data.get("description") or fallback["description"],
                "skills_used": data.get("skills_used") or fallback["skills_used"],
                "tools_used": data.get("tools_used") or fallback["tools_used"],
            }
        except Exception as exc:
            logger.warning("generate_portfolio fallback: %s", exc)
            return fallback

    def _heuristic_portfolio(
        self,
        details: str,
        title: Optional[str],
        description: Optional[str],
    ) -> Dict[str, Any]:
        words = re.findall(r"[A-Za-z][A-Za-z+#.]{1,}", details)
        unique = list(dict.fromkeys(w for w in words if len(w) > 2))[:12]
        skill_hints = [
            w
            for w in unique
            if w.lower()
            in {
                "react",
                "python",
                "fastapi",
                "figma",
                "ui",
                "ux",
                "ml",
                "ai",
                "typescript",
                "nodejs",
                "django",
                "flutter",
                "swift",
                "kotlin",
                "aws",
                "docker",
                "sql",
                "mongodb",
                "tailwind",
                "design",
                "video",
                "photography",
                "marketing",
                "content",
            }
            or w[0].isupper()
        ]
        skills = ", ".join(skill_hints[:6]) if skill_hints else "Problem Solving, Communication"
        gen_title = title or (" ".join(unique[:5]).title() if unique else "Creative Project Showcase")
        gen_desc = description or (
            f"A professional project demonstrating hands-on skill. "
            f"Overview: {details[:400].strip()}"
        )
        return {
            "title": gen_title[:200],
            "description": gen_desc,
            "skills_used": skills,
            "tools_used": skills,
        }

    async def match_creators(
        self,
        job_title: str,
        job_description: str,
        required_skills: str,
        creators: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Score creators against a job. Returns ranked match payloads."""
        scored = rank_creators(job_title, job_description, required_skills, creators)

        if self.enabled and scored:
            try:
                # Optional AI refinement of matching reasons for top candidates
                top = scored[:5]
                system = (
                    "You refine talent-match reasons. Return JSON array of objects with "
                    "creator_id and matching_reasons (array of short strings)."
                )
                user = json.dumps(
                    {
                        "job": {"title": job_title, "description": job_description, "skills": required_skills},
                        "candidates": [
                            {
                                "creator_id": c["creator_id"],
                                "skills": c.get("skills"),
                                "headline": c.get("headline"),
                                "score": c["compatibility_score"],
                            }
                            for c in top
                        ],
                    }
                )
                raw = await self._chat(system, user, temperature=0.2)
                refinements = self._parse_json(raw)
                if isinstance(refinements, list):
                    by_id = {r["creator_id"]: r.get("matching_reasons", []) for r in refinements}
                    for item in scored:
                        if item["creator_id"] in by_id and by_id[item["creator_id"]]:
                            item["matching_reasons"] = by_id[item["creator_id"]]
            except Exception as exc:
                logger.warning("match_creators AI refine skipped: %s", exc)

        return scored

    async def suggest_pricing(
        self,
        category: str,
        skills: str,
        experience_years: float,
        delivery_days: int,
    ) -> Dict[str, Any]:
        base = {
            "design": 150,
            "development": 250,
            "writing": 80,
            "marketing": 120,
            "video": 200,
            "other": 100,
        }
        cat_key = category.lower().split()[0] if category else "other"
        base_price = base.get(cat_key, base["other"])
        experience_mult = 1 + min(experience_years, 5) * 0.12
        urgency_mult = 1.2 if delivery_days <= 3 else 1.0 if delivery_days <= 7 else 0.9
        suggested = round(base_price * experience_mult * urgency_mult, 2)

        if self.enabled:
            try:
                system = "Return JSON with keys: suggested_price, min_price, max_price, rationale."
                user = (
                    f"Category={category}, skills={skills}, experience={experience_years}, "
                    f"delivery_days={delivery_days}. Currency INR. Student marketplace."
                )
                raw = await self._chat(system, user)
                data = self._parse_json(raw)
                return {
                    "suggested_price": float(data.get("suggested_price", suggested)),
                    "min_price": float(data.get("min_price", suggested * 0.7)),
                    "max_price": float(data.get("max_price", suggested * 1.4)),
                    "rationale": data.get("rationale", "Market-aligned student rate"),
                }
            except Exception as exc:
                logger.warning("suggest_pricing fallback: %s", exc)

        return {
            "suggested_price": suggested,
            "min_price": round(suggested * 0.7, 2),
            "max_price": round(suggested * 1.4, 2),
            "rationale": "Heuristic based on category, experience, and delivery speed",
        }

    async def chat_assistant(self, message: str, context: Optional[str] = None) -> str:
        if not self.enabled:
            return (
                "I'm SkillSwap AI Assistant (offline mode). "
                "Tip: strengthen your portfolio with measurable outcomes, "
                "use milestones for safe delivery, and match on skills + trust — not just price."
            )
        system = (
            "You are SkillSwap AI Assistant for students and young creators. "
            "Be concise, practical, and encouraging. Focus on portfolios, matching, and safe bookings."
        )
        user = f"Context: {context or 'general'}\n\nUser: {message}"
        try:
            return await self._chat(system, user, temperature=0.5)
        except Exception as exc:
            logger.warning("chat_assistant fallback: %s", exc)
            return "I couldn't reach the AI provider right now. Please try again shortly."


ai_service = AIService()
