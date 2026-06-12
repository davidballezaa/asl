from __future__ import annotations

import asyncio
import time
from collections import deque
from collections.abc import Callable
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import TypeVar

from fastapi import HTTPException, Request, status

from app.config import get_settings

T = TypeVar("T")


@dataclass(frozen=True)
class RateLimitRule:
    limit: int
    window_seconds: int


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._events: dict[tuple[str, str], deque[float]] = {}
        self._lock = asyncio.Lock()

    async def enforce(self, bucket: str, key: str, rule: RateLimitRule) -> None:
        now = time.monotonic()
        async with self._lock:
            events = self._events.setdefault((bucket, key), deque())
            self._trim(events, now, rule.window_seconds)
            if len(events) >= rule.limit:
                retry_after = max(1, int(rule.window_seconds - (now - events[0])))
                raise self._too_many_requests(retry_after)
            events.append(now)

    async def reset(self) -> None:
        async with self._lock:
            self._events.clear()

    @staticmethod
    def _trim(events: deque[float], now: float, window_seconds: int) -> None:
        cutoff = now - window_seconds
        while events and events[0] <= cutoff:
            events.popleft()

    @staticmethod
    def _too_many_requests(retry_after: int) -> HTTPException:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
            headers={"Retry-After": str(retry_after)},
        )


class RecognitionConcurrencyGuard:
    def __init__(self) -> None:
        self._active_by_user: dict[str, int] = {}
        self._total_active = 0
        self._lock = asyncio.Lock()

    @asynccontextmanager
    async def acquire(
        self,
        user_key: str,
        *,
        max_per_user: int,
        max_global: int,
    ):
        async with self._lock:
            user_active = self._active_by_user.get(user_key, 0)
            if user_active >= max_per_user or self._total_active >= max_global:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Recognition limit exceeded",
                    headers={"Retry-After": "1"},
                )
            self._active_by_user[user_key] = user_active + 1
            self._total_active += 1
        try:
            yield
        finally:
            async with self._lock:
                remaining = self._active_by_user[user_key] - 1
                if remaining <= 0:
                    self._active_by_user.pop(user_key, None)
                else:
                    self._active_by_user[user_key] = remaining
                self._total_active -= 1

    async def reset(self) -> None:
        async with self._lock:
            self._active_by_user.clear()
            self._total_active = 0


rate_limiter = InMemoryRateLimiter()
recognition_concurrency_guard = RecognitionConcurrencyGuard()


def get_client_ip(request: Request) -> str:
    client_host = request.client.host if request.client else "unknown"
    settings = get_settings()
    if client_host in settings.trusted_proxy_ip_set:
        forwarded_for = request.headers.get("x-forwarded-for", "")
        if forwarded_for:
            forwarded_client = forwarded_for.split(",")[0].strip()
            if forwarded_client:
                return forwarded_client
    return client_host


def normalize_email_key(email: str) -> str:
    return email.strip().lower()


async def enforce_ip_limit(
    request: Request,
    *,
    bucket: str,
    rule: RateLimitRule,
) -> None:
    await rate_limiter.enforce(bucket, get_client_ip(request), rule)


async def enforce_key_limit(
    key: str,
    *,
    bucket: str,
    rule: RateLimitRule,
    normalizer: Callable[[str], str] | None = None,
) -> None:
    normalized = normalizer(key) if normalizer else key
    await rate_limiter.enforce(bucket, normalized, rule)
