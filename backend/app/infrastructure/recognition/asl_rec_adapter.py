from __future__ import annotations

import base64
from collections.abc import Mapping
from typing import Any

import httpx

from app.config import get_settings
from app.domain.entities.recognition import RecognitionResult


class ASLRECRecognizer:
    def __init__(
        self,
        url: str | None = None,
        timeout_seconds: float | None = None,
    ) -> None:
        settings = get_settings()
        self._url = url or settings.asl_rec_url
        self._timeout_seconds = (
            timeout_seconds
            if timeout_seconds is not None
            else settings.asl_rec_timeout_seconds
        )

    async def recognize(self, image_bytes: bytes, expected_sign: str) -> RecognitionResult:
        payload = {
            "image_base64": base64.b64encode(image_bytes).decode("ascii"),
            "expected_sign": expected_sign,
        }
        try:
            async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                response = await client.post(self._url, json=payload)
        except httpx.TimeoutException:
            return RecognitionResult(
                success=False,
                confidence=0.0,
                error="recognition service timed out",
            )
        except httpx.HTTPError as exc:
            return RecognitionResult(
                success=False,
                confidence=0.0,
                error=f"recognition service unavailable: {exc.__class__.__name__}",
            )

        data = self._parse_response_body(response)
        if data is None:
            return RecognitionResult(
                success=False,
                confidence=0.0,
                error="recognition service returned invalid JSON",
            )

        if response.status_code >= 400:
            error = data.get("error")
            message = error if isinstance(error, str) and error else (
                f"recognition service returned HTTP {response.status_code}"
            )
            return RecognitionResult(
                success=False,
                confidence=0.0,
                predicted_sign=self._parse_optional_string(data.get("predicted_sign")),
                error=message,
            )

        return self._map_result(data)

    def _parse_response_body(self, response: httpx.Response) -> Mapping[str, Any] | None:
        try:
            data = response.json()
        except ValueError:
            return None
        if not isinstance(data, Mapping):
            return None
        return data

    def _map_result(self, data: Mapping[str, Any]) -> RecognitionResult:
        success = data.get("success")
        confidence = data.get("confidence")
        error = data.get("error")
        predicted_sign_value = data.get("predicted_sign")
        predicted_sign = self._parse_optional_string(predicted_sign_value)

        if not isinstance(success, bool):
            return RecognitionResult(
                success=False,
                confidence=0.0,
                error="recognition service returned invalid success flag",
            )
        if not isinstance(confidence, (int, float)):
            return RecognitionResult(
                success=False,
                confidence=0.0,
                error="recognition service returned invalid confidence",
            )
        if error is not None and not isinstance(error, str):
            return RecognitionResult(
                success=False,
                confidence=0.0,
                error="recognition service returned invalid error field",
            )
        if predicted_sign_value is not None and predicted_sign is None:
            return RecognitionResult(
                success=False,
                confidence=0.0,
                error="recognition service returned invalid predicted_sign",
            )

        return RecognitionResult(
            success=success,
            confidence=float(confidence),
            predicted_sign=predicted_sign,
            error=error,
        )

    def _parse_optional_string(self, value: Any) -> str | None:
        if value is None:
            return None
        if isinstance(value, str):
            return value
        return None
