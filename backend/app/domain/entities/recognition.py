from __future__ import annotations

from dataclasses import dataclass


@dataclass
class RecognitionResult:
    success: bool
    confidence: float
    predicted_sign: str | None = None
    error: str | None = None
