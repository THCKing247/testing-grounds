"""
AI Automation Agency Toolkit (workflow planner + simple webhooks)

A small workflow engine that connects triggers -> actions via JSON.
It is intentionally simple: it validates, plans, and can execute basic HTTP webhooks.
"""

from __future__ import annotations

import json
import typing as t
import urllib.request

from shared_utils import ServiceError, utc_now_iso


class AIAutomationAgencyToolkit:
    """
    A small workflow engine that connects triggers -> actions via JSON.

    It is intentionally simple: it validates, plans, and can execute basic HTTP webhooks.
    """

    def validate_workflow(self, workflow: dict[str, t.Any]) -> dict[str, t.Any]:
        if not isinstance(workflow, dict):
            raise ServiceError("workflow must be an object/dict.")
        name = str(workflow.get("name") or "").strip() or "Untitled workflow"
        trigger = workflow.get("trigger") or {}
        actions = workflow.get("actions") or []
        if not isinstance(trigger, dict):
            raise ServiceError("workflow.trigger must be an object/dict.")
        if not isinstance(actions, list) or not actions:
            raise ServiceError("workflow.actions must be a non-empty list.")
        return {"name": name, "trigger": trigger, "actions": actions}

    def plan(self, workflow: dict[str, t.Any]) -> dict[str, t.Any]:
        wf = self.validate_workflow(workflow)
        return {
            "workflow": wf["name"],
            "steps": [
                {"n": i + 1, "action": a.get("type"), "description": a.get("description") or ""}
                for i, a in enumerate(wf["actions"])
            ],
            "generated_at": utc_now_iso(),
        }

    def execute(self, workflow: dict[str, t.Any], payload: dict[str, t.Any]) -> dict[str, t.Any]:
        wf = self.validate_workflow(workflow)
        results: list[dict[str, t.Any]] = []
        for i, action in enumerate(wf["actions"]):
            typ = str(action.get("type") or "").strip().lower()
            if typ == "webhook":
                url = str(action.get("url") or "").strip()
                if not url:
                    raise ServiceError("webhook action requires url.")
                body = json.dumps({"payload": payload, "action": action}).encode("utf-8")
                req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
                try:
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        results.append({"step": i + 1, "type": typ, "status": resp.status})
                except Exception as e:  # noqa: BLE001
                    results.append({"step": i + 1, "type": typ, "status": "error", "error": str(e)})
            else:
                # offline no-op action
                results.append({"step": i + 1, "type": typ or "unknown", "status": "skipped_offline"})
        return {"workflow": wf["name"], "results": results, "executed_at": utc_now_iso()}


