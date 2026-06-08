from __future__ import annotations

# TODO: Implement ASLRECRecognizer using code from ASL-REC

from app.domain.entities.recognition import RecognitionResult


class ASLRECRecognizer:
    async def recognize(self, image_bytes: bytes, expected_sign: str) -> RecognitionResult:
        raise NotImplementedError("ASL-REC model not integrated yet")
