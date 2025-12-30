"""
Vertical Lead Generation System (offline scorer)

Scores and ranks leads based on vertical/industry keywords and relevance.
"""

from __future__ import annotations

import typing as t

from shared_utils import ServiceError, tokenize, utc_now_iso


class VerticalLeadGenerationSystem:
    def score_leads(
        self,
        *,
        vertical: str,
        leads: list[dict[str, t.Any]],
        keywords: list[str] | None = None,
        min_score: float = 0.1,
        limit: int = 50,
    ) -> dict[str, t.Any]:
        vertical = vertical.strip()
        if not vertical:
            raise ServiceError("vertical is required.")
        keywords = [k.strip().lower() for k in (keywords or []) if k.strip()] or [vertical.lower()]

        scored: list[dict[str, t.Any]] = []
        for lead in leads:
            text = " ".join(str(lead.get(k) or "") for k in ("name", "company", "title", "website", "notes", "industry"))
            toks = set(tokenize(text))
            if not toks:
                continue
            hits = sum(1 for kw in keywords if kw in toks)
            score = hits / max(1, len(set(keywords)))
            if score >= min_score:
                scored.append({**lead, "score": round(score, 3), "keyword_hits": hits})

        scored.sort(key=lambda x: (-float(x.get("score") or 0.0), str(x.get("company") or ""), str(x.get("name") or "")))
        return {
            "vertical": vertical,
            "keywords": keywords,
            "count_in": len(leads),
            "count_out": len(scored[: max(0, limit)]),
            "leads": scored[: max(0, limit)],
            "generated_at": utc_now_iso(),
        }


