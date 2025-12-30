"""
AI Help Desk (KB + retrieval + draft response)

Knowledge base system that retrieves relevant articles and drafts responses to customer questions.
"""

from __future__ import annotations

import dataclasses
import json
import typing as t

from shared_utils import ServiceError, sha256_text, split_sentences, tokenize, utc_now_iso


@dataclasses.dataclass
class KnowledgeArticle:
    id: str
    title: str
    body: str
    tags: list[str] = dataclasses.field(default_factory=list)


class AIHelpDesk:
    def __init__(self, articles: list[KnowledgeArticle] | None = None) -> None:
        self.articles: list[KnowledgeArticle] = articles or []

    def load_kb_from_json(self, json_text: str) -> None:
        try:
            data = json.loads(json_text)
        except json.JSONDecodeError as e:
            raise ServiceError("Invalid JSON for knowledge base.") from e
        if not isinstance(data, list):
            raise ServiceError("Knowledge base JSON must be a list of articles.")
        self.articles = []
        for item in data:
            if not isinstance(item, dict):
                continue
            self.articles.append(
                KnowledgeArticle(
                    id=str(item.get("id") or sha256_text(str(item))[:12]),
                    title=str(item.get("title") or "Untitled"),
                    body=str(item.get("body") or ""),
                    tags=[str(x) for x in (item.get("tags") or []) if str(x).strip()],
                )
            )

    def answer(self, question: str, *, max_articles: int = 3) -> dict[str, t.Any]:
        question = (question or "").strip()
        if not question:
            raise ServiceError("question is required.")
        if not self.articles:
            raise ServiceError("Knowledge base is empty. Load articles first.")

        q = set(tokenize(question))
        scored: list[tuple[float, KnowledgeArticle]] = []
        for a in self.articles:
            doc = f"{a.title}\n{a.body}\n" + " ".join(a.tags)
            toks = set(tokenize(doc))
            if not toks:
                continue
            # simple token overlap score
            inter = len(q & toks)
            union = len(q | toks) or 1
            score = inter / union
            scored.append((score, a))
        scored.sort(key=lambda x: x[0], reverse=True)
        top = [a for s, a in scored[: max(1, max_articles)] if s > 0] or [scored[0][1]]

        # draft response: extract a few helpful sentences from the top article bodies
        guidance: list[str] = []
        for a in top:
            sents = split_sentences(a.body)
            guidance.extend(sents[:3])
        guidance = guidance[:6]

        response = "Here's what I found in our knowledge base:\n\n"
        for i, g in enumerate(guidance, start=1):
            response += f"{i}. {g}\n"
        response += "\nIf you share a screenshot/error message, I can tailor this further."

        return {
            "question": question,
            "answer": response.strip(),
            "citations": [{"id": a.id, "title": a.title, "tags": a.tags} for a in top],
            "generated_at": utc_now_iso(),
        }


