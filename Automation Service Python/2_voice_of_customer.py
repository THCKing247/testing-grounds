"""
Voice of Customer (VoC) Call Summary & Insights

Analyzes customer call transcripts to extract insights, sentiment, and summaries.
"""

from __future__ import annotations

import typing as t

from shared_utils import (
    ServiceError,
    extractive_summary,
    sha256_text,
    simple_sentiment,
    top_keywords,
    utc_now_iso,
)


class VoiceOfCustomerInsightsSystem:
    def analyze_transcript(self, transcript_text: str, *, max_summary_sentences: int = 6) -> dict[str, t.Any]:
        transcript_text = transcript_text or ""
        return {
            "transcript_hash": sha256_text(transcript_text),
            "summary": extractive_summary(transcript_text, max_sentences=max_summary_sentences),
            "sentiment": simple_sentiment(transcript_text),
            "top_keywords": top_keywords(transcript_text, k=15),
            "meta": {"generated_at": utc_now_iso(), "mode": "offline-extractive"},
        }

    def transcribe_audio(self, audio_path: str) -> str:
        """
        Optional: if openai-whisper is installed, use it. Otherwise raise.
        """
        try:
            import whisper  # type: ignore
        except Exception as e:  # noqa: BLE001
            raise ServiceError(
                "Audio transcription requires optional dependency 'openai-whisper'. "
                "Provide a transcript instead, or install: pip install -U openai-whisper"
            ) from e

        model = whisper.load_model("base")
        result = model.transcribe(audio_path)
        return (result or {}).get("text", "") or ""


