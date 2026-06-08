from __future__ import annotations

from typing import Protocol

from app.domain.entities.recognition import RecognitionResult


class SignRecognizer(Protocol):
    async def recognize(
        self, image_bytes: bytes, expected_sign: str
    ) -> RecognitionResult: ...
