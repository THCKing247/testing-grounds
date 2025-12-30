"""
Shared utilities for Apex Automations Services

Common functions, constants, and helper utilities used across all services.
"""

from __future__ import annotations

import datetime as _dt
import hashlib
import math
import re
import string
import typing as t

# -----------------------------
# Constants
# -----------------------------

STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "but",
    "by",
    "can",
    "could",
    "did",
    "do",
    "does",
    "for",
    "from",
    "had",
    "has",
    "have",
    "how",
    "i",
    "if",
    "in",
    "into",
    "is",
    "it",
    "its",
    "just",
    "like",
    "may",
    "me",
    "might",
    "more",
    "my",
    "no",
    "not",
    "of",
    "on",
    "or",
    "our",
    "should",
    "so",
    "that",
    "the",
    "their",
    "then",
    "there",
    "these",
    "they",
    "this",
    "to",
    "up",
    "us",
    "was",
    "we",
    "were",
    "what",
    "when",
    "where",
    "which",
    "who",
    "will",
    "with",
    "would",
    "you",
    "your",
}

POS_WORDS = {
    "good",
    "great",
    "amazing",
    "love",
    "loved",
    "like",
    "liked",
    "excellent",
    "helpful",
    "fast",
    "easy",
    "smooth",
    "perfect",
    "awesome",
    "recommend",
    "recommended",
    "happy",
    "satisfied",
    "thank",
    "thanks",
}

NEG_WORDS = {
    "bad",
    "terrible",
    "awful",
    "hate",
    "hated",
    "slow",
    "hard",
    "difficult",
    "broken",
    "bug",
    "bugs",
    "refund",
    "angry",
    "frustrated",
    "issue",
    "issues",
    "problem",
    "problems",
    "disappointed",
}


# -----------------------------
# Utility Functions
# -----------------------------

def utc_now_iso() -> str:
    """Get current UTC time as ISO format string."""
    return _dt.datetime.now(tz=_dt.timezone.utc).isoformat()


def sha256_text(text: str) -> str:
    """Compute SHA256 hash of text."""
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()


def slugify_header(header: str) -> str:
    """Convert header to slug format (lowercase, underscores)."""
    header = header.strip().lower()
    header = re.sub(r"[^a-z0-9]+", "_", header)
    header = header.strip("_")
    return header or "column"


def split_sentences(text: str) -> list[str]:
    """Lightweight sentence splitter suitable for transcripts."""
    text = re.sub(r"\s+", " ", (text or "").strip())
    if not text:
        return []
    parts = re.split(r"(?<=[.!?])\s+", text)
    return [p.strip() for p in parts if p.strip()]


def tokenize(text: str) -> list[str]:
    """Tokenize text into words, removing punctuation and stopwords."""
    text = (text or "").lower()
    text = text.translate(str.maketrans({c: " " for c in string.punctuation}))
    tokens = [t for t in text.split() if t and t not in STOPWORDS]
    return tokens


def top_keywords(text: str, k: int = 12) -> list[dict[str, t.Any]]:
    """Extract top k keywords from text with counts."""
    counts: dict[str, int] = {}
    for tok in tokenize(text):
        counts[tok] = counts.get(tok, 0) + 1
    items = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[: max(k, 0)]
    return [{"keyword": w, "count": c} for w, c in items]


def simple_sentiment(text: str) -> dict[str, t.Any]:
    """Simple sentiment analysis based on positive/negative word matching."""
    toks = tokenize(text)
    pos = sum(1 for t_ in toks if t_ in POS_WORDS)
    neg = sum(1 for t_ in toks if t_ in NEG_WORDS)
    score = 0.0
    denom = max(1, pos + neg)
    score = (pos - neg) / denom
    label = "neutral"
    if score >= 0.2:
        label = "positive"
    elif score <= -0.2:
        label = "negative"
    return {"label": label, "score": round(score, 3), "positive_hits": pos, "negative_hits": neg}


def extractive_summary(text: str, max_sentences: int = 5) -> str:
    """Generate extractive summary by selecting most important sentences."""
    sents = split_sentences(text)
    if not sents:
        return ""
    word_freq: dict[str, float] = {}
    for tok in tokenize(text):
        word_freq[tok] = word_freq.get(tok, 0.0) + 1.0
    if not word_freq:
        return " ".join(sents[: max_sentences])

    # Normalize frequencies.
    max_f = max(word_freq.values())
    for k in list(word_freq.keys()):
        word_freq[k] = word_freq[k] / max_f

    scored: list[tuple[float, int, str]] = []
    for i, s in enumerate(sents):
        toks = tokenize(s)
        if not toks:
            continue
        score = sum(word_freq.get(t_, 0.0) for t_ in toks) / math.sqrt(len(toks))
        scored.append((score, i, s))

    scored.sort(key=lambda x: (-x[0], x[1]))
    chosen = sorted(scored[: max(1, max_sentences)], key=lambda x: x[1])
    return " ".join(s for _, _, s in chosen)


# -----------------------------
# Exception Classes
# -----------------------------

class ServiceError(RuntimeError):
    """Base exception for service errors."""
    pass

