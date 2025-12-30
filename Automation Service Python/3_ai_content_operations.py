"""
AI Content Operations System

Generates various types of content (emails, reports, documents) based on notes and parameters.
"""

from __future__ import annotations

import typing as t

from shared_utils import ServiceError, split_sentences, utc_now_iso


class AIContentOperationsSystem:
    def generate(
        self,
        *,
        content_type: str,
        notes: str,
        audience: str = "customer",
        tone: str = "professional",
        call_to_action: str | None = None,
        subject: str | None = None,
    ) -> dict[str, t.Any]:
        content_type = (content_type or "").strip().lower()
        notes = (notes or "").strip()
        if not notes:
            raise ServiceError("notes is required.")

        if content_type in {"email", "email_reply"}:
            subj = subject or "Quick update"
            cta = call_to_action or "Reply to this email and I'll take care of it."
            body = (
                f"Subject: {subj}\n\n"
                f"Hi there,\n\n"
                f"{notes}\n\n"
                f"Next step: {cta}\n\n"
                f"Best,\n"
            )
            return {"type": "email", "audience": audience, "tone": tone, "content": body, "generated_at": utc_now_iso()}

        if content_type in {"report", "summary_report"}:
            bullets = "\n".join(f"- {s}" for s in split_sentences(notes)[:10]) or f"- {notes}"
            content = (
                f"# Report\n\n"
                f"**Audience:** {audience}\n\n"
                f"## Key points\n{bullets}\n\n"
                f"## Recommendation\n- {call_to_action or 'Confirm priorities and assign owners.'}\n"
            )
            return {"type": "report", "audience": audience, "tone": tone, "content": content, "generated_at": utc_now_iso()}

        if content_type in {"document", "doc", "one_pager"}:
            content = (
                f"# Document\n\n"
                f"## Context\n{notes}\n\n"
                f"## Outcome\n{call_to_action or 'Define success metrics and timeline.'}\n"
            )
            return {"type": "document", "audience": audience, "tone": tone, "content": content, "generated_at": utc_now_iso()}

        raise ServiceError(f"Unsupported content_type: {content_type!r}. Try: email, report, document.")


