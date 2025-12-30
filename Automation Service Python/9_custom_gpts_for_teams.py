"""
Custom GPTs for Teams (role-based assistant configs)

Generates configuration for role-based AI assistants tailored to specific teams and roles.
"""

from __future__ import annotations

import typing as t

from shared_utils import ServiceError, utc_now_iso


class CustomGPTsForTeams:
    def generate_assistant_config(
        self,
        *,
        role: str,
        team: str,
        capabilities: list[str] | None = None,
        boundaries: list[str] | None = None,
        knowledge_sources: list[str] | None = None,
    ) -> dict[str, t.Any]:
        role = role.strip()
        team = team.strip()
        if not (role and team):
            raise ServiceError("role and team are required.")
        capabilities = capabilities or [
            "summarize",
            "draft_responses",
            "create_checklists",
            "extract_action_items",
        ]
        boundaries = boundaries or ["Do not invent facts.", "Ask for missing context when needed."]
        knowledge_sources = knowledge_sources or []
        prompt = (
            f"You are a {role} assistant for the {team} team.\n"
            f"Capabilities: {', '.join(capabilities)}.\n"
            f"Boundaries: {' '.join(boundaries)}.\n"
            f"Prefer concise, actionable outputs."
        )
        return {
            "name": f"{team} - {role} Assistant",
            "role": role,
            "team": team,
            "system_prompt": prompt,
            "capabilities": capabilities,
            "boundaries": boundaries,
            "knowledge_sources": knowledge_sources,
            "generated_at": utc_now_iso(),
        }


