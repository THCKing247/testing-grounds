"""
AI Lead Follow-Up & Nurture System

Creates a simple multi-step follow-up sequence and stores it in sqlite.
"""

from __future__ import annotations

import datetime as _dt
import json
import sqlite3
import time
import typing as t

from shared_utils import ServiceError, sha256_text, split_sentences, utc_now_iso


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


class AILeadFollowUpNurtureSystem:
    """
    Creates a simple multi-step follow-up sequence and stores it in sqlite.
    """

    def __init__(self, store: _SqliteStore | None = None) -> None:
        self.store = store or _SqliteStore()

    def start_sequence(
        self,
        *,
        lead_id: str,
        channel: str = "sms",
        steps: int = 3,
        first_delay_minutes: int = 5,
        cadence_minutes: int = 1440,
        meta: dict[str, t.Any] | None = None,
    ) -> dict[str, t.Any]:
        lead_id = lead_id.strip()
        if not lead_id:
            raise ServiceError("lead_id is required.")
        channel = channel.strip().lower()
        if channel not in {"sms", "email"}:
            raise ServiceError("channel must be sms or email.")
        steps = max(1, int(steps))
        meta = meta or {}

        seq_id = sha256_text(f"{lead_id}|{time.time()}")[:16]
        created_at = utc_now_iso()
        next_send_at = (_dt.datetime.now(tz=_dt.timezone.utc) + _dt.timedelta(minutes=first_delay_minutes)).isoformat()

        with self.store._connect() as conn:
            conn.execute(
                "INSERT INTO sequences (id, created_at, lead_id, status, step, next_send_at, channel, meta_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (seq_id, created_at, lead_id, "active", 1, next_send_at, channel, json.dumps({"steps": steps, "cadence_minutes": cadence_minutes, **meta})),
            )

        return {"sequence_id": seq_id, "lead_id": lead_id, "status": "active", "step": 1, "next_send_at": next_send_at}

    def next_message(self, *, sequence_id: str) -> dict[str, t.Any]:
        sequence_id = sequence_id.strip()
        if not sequence_id:
            raise ServiceError("sequence_id is required.")
        with self.store._connect() as conn:
            row = conn.execute("SELECT * FROM sequences WHERE id = ?", (sequence_id,)).fetchone()
            if not row:
                raise ServiceError("Sequence not found.")
            meta = json.loads(row["meta_json"] or "{}")
            steps = int(meta.get("steps") or 3)
            cadence = int(meta.get("cadence_minutes") or 1440)
            step = int(row["step"])
            if row["status"] != "active":
                raise ServiceError("Sequence is not active.")
            if step > steps:
                conn.execute("UPDATE sequences SET status = ? WHERE id = ?", ("completed", sequence_id))
                return {"sequence_id": sequence_id, "status": "completed"}

            # draft message
            if row["channel"] == "sms":
                msg = [
                    "Just checking in — did you have any questions?",
                    "Happy to help—want a quick 10-minute call to map next steps?",
                    "Last note from me—if you're still interested, reply with your goal + timeline.",
                ][min(step - 1, 2)]
            else:
                msg = [
                    "Subject: Quick check-in\n\nJust checking in—did you have any questions?\n",
                    "Subject: Next steps\n\nIf helpful, we can do a quick 10-minute call to map next steps.\n",
                    "Subject: Closing the loop\n\nLast note from me—reply with your goal + timeline if you'd like to continue.\n",
                ][min(step - 1, 2)]

            # advance schedule
            next_send_at = (_dt.datetime.now(tz=_dt.timezone.utc) + _dt.timedelta(minutes=cadence)).isoformat()
            conn.execute("UPDATE sequences SET step = ?, next_send_at = ? WHERE id = ?", (step + 1, next_send_at, sequence_id))
        return {"sequence_id": sequence_id, "channel": row["channel"], "step": step, "message": msg, "next_send_at": next_send_at}


