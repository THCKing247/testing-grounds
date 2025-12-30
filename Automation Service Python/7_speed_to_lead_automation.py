"""
Speed-to-Lead Automation System (instant response + dedupe)

Ingests leads, deduplicates them, and generates instant response messages.
"""

from __future__ import annotations

import json
import re
import sqlite3
import typing as t

from shared_utils import ServiceError, sha256_text, utc_now_iso


class _SqliteStore:
    def __init__(self, db_path: str = "apex.db") -> None:
        self.db_path = db_path
        self._init()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS leads (
                    id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL,
                    name TEXT,
                    email TEXT,
                    phone TEXT,
                    source TEXT,
                    meta_json TEXT
                )
                """
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone)")
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS sequences (
                    id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL,
                    lead_id TEXT NOT NULL,
                    status TEXT NOT NULL,
                    step INTEGER NOT NULL,
                    next_send_at TEXT NOT NULL,
                    channel TEXT NOT NULL,
                    meta_json TEXT,
                    FOREIGN KEY (lead_id) REFERENCES leads(id)
                )
                """
            )


class SpeedToLeadAutomationSystem:
    def __init__(self, store: _SqliteStore | None = None) -> None:
        self.store = store or _SqliteStore()

    def ingest_lead(
        self,
        *,
        name: str | None = None,
        email: str | None = None,
        phone: str | None = None,
        source: str | None = None,
        message: str | None = None,
    ) -> dict[str, t.Any]:
        email_n = (email or "").strip().lower() or None
        phone_n = re.sub(r"\D+", "", phone or "") or None
        if not (email_n or phone_n):
            raise ServiceError("At least one of email or phone is required.")

        lead_id = sha256_text(f"{email_n}|{phone_n}")[:16]
        created_at = utc_now_iso()
        meta = {"message": message or "", "source": source or ""}

        with self.store._connect() as conn:
            existing = conn.execute("SELECT id, created_at FROM leads WHERE id = ?", (lead_id,)).fetchone()
            if not existing:
                conn.execute(
                    "INSERT INTO leads (id, created_at, name, email, phone, source, meta_json) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (lead_id, created_at, name, email_n, phone_n, source, json.dumps(meta)),
                )

        response = self._build_instant_response(name=name, source=source)
        return {
            "lead": {"id": lead_id, "name": name, "email": email_n, "phone": phone_n, "source": source},
            "instant_response": response,
            "deduped": bool(existing),
            "generated_at": utc_now_iso(),
        }

    def _build_instant_response(self, *, name: str | None, source: str | None) -> dict[str, str]:
        nm = (name or "").strip() or "there"
        src = (source or "").strip()
        src_part = f" (from {src})" if src else ""
        sms = f"Hi {nm} — thanks for reaching out{src_part}. What's the best time to talk, and what are you looking to accomplish?"
        email = (
            "Subject: Reaching out right away\n\n"
            f"Hi {nm},\n\nThanks for reaching out{src_part}. "
            "If you share your goal + timeline, I can point you to the fastest next step.\n\n"
            "Best,\n"
        )
        return {"sms": sms, "email": email}


