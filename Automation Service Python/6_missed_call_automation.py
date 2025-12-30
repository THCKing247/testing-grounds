"""
AI Receptionist / Missed Call Automation

Creates follow-up messages for missed calls and manages a queue of follow-up events.
"""

from __future__ import annotations

import json
import time
import typing as t

from shared_utils import ServiceError, sha256_text, utc_now_iso


class MissedCallAutomation:
    def __init__(self, queue_path: str = "missed_call_queue.jsonl") -> None:
        self.queue_path = queue_path

    def create_follow_up(
        self,
        *,
        caller_name: str | None,
        phone: str,
        reason: str | None = None,
        business_name: str = "Apex",
        channel: str = "sms",
    ) -> dict[str, t.Any]:
        phone = phone.strip()
        if not phone:
            raise ServiceError("phone is required.")
        name = (caller_name or "").strip() or "there"
        reason_part = f" about {reason.strip()}" if reason and reason.strip() else ""
        channel = channel.strip().lower()
        if channel not in {"sms", "email"}:
            raise ServiceError("channel must be 'sms' or 'email'.")

        msg = (
            f"Hi {name} — sorry we missed your call{reason_part}. "
            f"Can you share a good time to call back, or what you need help with? — {business_name}"
        )
        event = {
            "id": sha256_text(f"{phone}|{time.time()}")[:12],
            "phone": phone,
            "caller_name": caller_name,
            "channel": channel,
            "message": msg,
            "status": "queued",
            "created_at": utc_now_iso(),
        }
        self._append_event(event)
        return event

    def _append_event(self, event: dict[str, t.Any]) -> None:
        with open(self.queue_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(event) + "\n")


