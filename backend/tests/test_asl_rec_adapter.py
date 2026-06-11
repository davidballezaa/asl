from __future__ import annotations

import base64
import json

import httpx
import pytest

from app.infrastructure.recognition.asl_rec_adapter import ASLRECRecognizer


@pytest.mark.asyncio
async def test_asl_rec_adapter_success_match(monkeypatch: pytest.MonkeyPatch):
    captured: dict[str, object] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["payload"] = json.loads(request.content.decode("utf-8"))
        return httpx.Response(
            200,
            json={
                "predicted_sign": "C",
                "confidence": 0.93,
                "success": True,
                "error": None,
            },
        )

    transport = httpx.MockTransport(handler)
    original_client = httpx.AsyncClient

    def build_client(*args, **kwargs):
        kwargs["transport"] = transport
        return original_client(*args, **kwargs)

    recognizer = ASLRECRecognizer(url="http://recognizer/predict", timeout_seconds=3)

    monkeypatch.setattr(httpx, "AsyncClient", build_client)
    result = await recognizer.recognize(b"image-bytes", "C")

    assert captured["url"] == "http://recognizer/predict"
    assert captured["payload"] == {
        "image_base64": base64.b64encode(b"image-bytes").decode("ascii"),
        "expected_sign": "C",
    }
    assert result.success is True
    assert result.confidence == 0.93
    assert result.predicted_sign == "C"
    assert result.error is None


@pytest.mark.asyncio
async def test_asl_rec_adapter_success_non_match(monkeypatch: pytest.MonkeyPatch):
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "predicted_sign": "B",
                "confidence": 0.41,
                "success": False,
                "error": None,
            },
        )

    transport = httpx.MockTransport(handler)
    original_client = httpx.AsyncClient

    def build_client(*args, **kwargs):
        kwargs["transport"] = transport
        return original_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", build_client)
    recognizer = ASLRECRecognizer(url="http://recognizer/predict", timeout_seconds=3)
    result = await recognizer.recognize(b"image-bytes", "C")

    assert result.success is False
    assert result.confidence == 0.41
    assert result.predicted_sign == "B"
    assert result.error is None


@pytest.mark.asyncio
async def test_asl_rec_adapter_handles_upstream_error_payload(
    monkeypatch: pytest.MonkeyPatch,
):
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(
            422,
            json={
                "predicted_sign": None,
                "confidence": 0.0,
                "success": False,
                "error": "no hand detected",
            },
        )

    transport = httpx.MockTransport(handler)
    original_client = httpx.AsyncClient

    def build_client(*args, **kwargs):
        kwargs["transport"] = transport
        return original_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", build_client)
    recognizer = ASLRECRecognizer(url="http://recognizer/predict", timeout_seconds=3)
    result = await recognizer.recognize(b"image-bytes", "C")

    assert result.success is False
    assert result.confidence == 0.0
    assert result.predicted_sign is None
    assert result.error == "no hand detected"


@pytest.mark.asyncio
async def test_asl_rec_adapter_handles_timeout(monkeypatch: pytest.MonkeyPatch):
    class TimeoutClient:
        def __init__(self, *args, **kwargs) -> None:
            pass

        async def __aenter__(self) -> TimeoutClient:
            return self

        async def __aexit__(self, exc_type, exc, tb) -> None:
            return None

        async def post(self, *args, **kwargs):
            raise httpx.ReadTimeout("timed out")

    monkeypatch.setattr(httpx, "AsyncClient", TimeoutClient)
    recognizer = ASLRECRecognizer(url="http://recognizer/predict", timeout_seconds=3)
    result = await recognizer.recognize(b"image-bytes", "C")

    assert result.success is False
    assert result.confidence == 0.0
    assert result.predicted_sign is None
    assert result.error == "recognition service timed out"


@pytest.mark.asyncio
async def test_asl_rec_adapter_handles_malformed_json(monkeypatch: pytest.MonkeyPatch):
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            content=b"not-json",
            headers={"content-type": "application/json"},
        )

    transport = httpx.MockTransport(handler)
    original_client = httpx.AsyncClient

    def build_client(*args, **kwargs):
        kwargs["transport"] = transport
        return original_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", build_client)
    recognizer = ASLRECRecognizer(url="http://recognizer/predict", timeout_seconds=3)
    result = await recognizer.recognize(b"image-bytes", "C")

    assert result.success is False
    assert result.confidence == 0.0
    assert result.predicted_sign is None
    assert result.error == "recognition service returned invalid JSON"
