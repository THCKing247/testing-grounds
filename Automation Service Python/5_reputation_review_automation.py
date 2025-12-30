"""
Reputation & Review Automation Engine

Generates review requests and summarizes customer reviews with sentiment analysis.
"""

from __future__ import annotations

import typing as t

from shared_utils import (
    ServiceError,
    extractive_summary,
    simple_sentiment,
    top_keywords,
    utc_now_iso,
)


class ReputationReviewAutomationEngine:
    def build_review_request(
        self,
        *,
        customer_name: str,
        business_name: str,
        review_link: str,
        channel: str = "sms",
    ) -> dict[str, t.Any]:
        customer_name = customer_name.strip()
        business_name = business_name.strip()
        review_link = review_link.strip()
        if not (customer_name and business_name and review_link):
            raise ServiceError("customer_name, business_name, and review_link are required.")
        channel = channel.lower().strip()
        if channel not in {"sms", "email"}:
            raise ServiceError("channel must be 'sms' or 'email'.")
        if channel == "sms":
            msg = (
                f"Hi {customer_name} — thanks for choosing {business_name}. "
                f"If you have 30 seconds, could you leave us a quick review? {review_link}"
            )
        else:
            msg = (
                f"Subject: Quick favor?\n\n"
                f"Hi {customer_name},\n\n"
                f"Thanks again for choosing {business_name}. If you have a moment, "
                f"would you leave us a review?\n\n{review_link}\n\nThank you!"
            )
        return {"channel": channel, "message": msg, "generated_at": utc_now_iso()}

    def summarize_reviews(self, reviews: list[dict[str, t.Any]]) -> dict[str, t.Any]:
        texts = "\n".join(str(r.get("text") or "") for r in reviews)
        sentiment = simple_sentiment(texts)
        return {
            "count": len(reviews),
            "sentiment": sentiment,
            "top_keywords": top_keywords(texts, k=15),
            "summary": extractive_summary(texts, max_sentences=5),
            "generated_at": utc_now_iso(),
        }


