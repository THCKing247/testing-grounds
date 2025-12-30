"""
Compliance Policy & Training Document Generator

Generates compliance policy documents for GDPR, SOC 2, HIPAA, and other standards.
"""

from __future__ import annotations

import typing as t

from shared_utils import ServiceError, utc_now_iso


class CompliancePolicyTrainingDocGenerator:
    _templates: dict[str, str] = {
        "gdpr": (
            "# GDPR Policy\n\n"
            "## Purpose\nThis policy describes how {company} handles personal data.\n\n"
            "## Scope\nApplies to all employees/contractors and systems that process EU personal data.\n\n"
            "## Key controls\n"
            "- Data minimization\n"
            "- Lawful basis for processing\n"
            "- Data subject requests (DSAR)\n"
            "- Incident response\n\n"
            "## Training\nAll staff complete annual privacy training.\n"
        ),
        "soc2": (
            "# SOC 2 Security Policy\n\n"
            "## Overview\n{company} maintains controls aligned to Trust Services Criteria.\n\n"
            "## Controls\n"
            "- Access control (least privilege)\n"
            "- Change management\n"
            "- Logging/monitoring\n"
            "- Vendor management\n\n"
            "## Training\nSecurity awareness training on hire and annually.\n"
        ),
        "hipaa": (
            "# HIPAA Policy & Training\n\n"
            "## Overview\n{company} protects PHI and follows HIPAA Privacy/Security Rules.\n\n"
            "## Controls\n"
            "- Minimum necessary access\n"
            "- Encryption in transit/at rest\n"
            "- Audit logs\n"
            "- Breach notification\n\n"
            "## Training\nWorkforce HIPAA training on hire and annually.\n"
        ),
    }

    def generate(self, *, company: str, policy_type: str) -> dict[str, t.Any]:
        company = company.strip()
        policy_type = policy_type.strip().lower()
        if not company:
            raise ServiceError("company is required.")
        if policy_type not in self._templates:
            raise ServiceError(f"Unsupported policy_type: {policy_type!r}. Try: {', '.join(self._templates)}")
        content = self._templates[policy_type].format(company=company)
        return {"policy_type": policy_type, "company": company, "content_markdown": content, "generated_at": utc_now_iso()}


