from __future__ import annotations

from app.domain.entities.recognition import RecognitionResult


class StubSignRecognizer:
    def __init__(self) -> None:
        self._attempt_count = 0

    async def recognize(self, image_bytes: bytes, expected_sign: str) -> RecognitionResult:
        del image_bytes  # unused in stub
        self._attempt_count += 1
        success = self._attempt_count % 2 == 1
        return RecognitionResult(
            success=success,
            confidence=0.92 if success else 0.34,
            predicted_sign=expected_sign if success else None,
        )
