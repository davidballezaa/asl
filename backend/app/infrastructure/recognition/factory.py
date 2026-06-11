from __future__ import annotations

from functools import lru_cache

from app.config import get_settings
from app.domain.ports.sign_recognizer import SignRecognizer
from app.infrastructure.recognition.asl_rec_adapter import ASLRECRecognizer
from app.infrastructure.recognition.stub_recognizer import StubSignRecognizer


@lru_cache
def get_sign_recognizer() -> SignRecognizer:
    settings = get_settings()
    if settings.recognizer_impl == "asl_rec":
        return ASLRECRecognizer(
            url=settings.asl_rec_url,
            timeout_seconds=settings.asl_rec_timeout_seconds,
        )
    return StubSignRecognizer()
