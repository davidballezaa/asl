from __future__ import annotations

from datetime import date
from typing import Protocol
from uuid import UUID

from app.domain.entities.subscription import Subscription, SubscriptionPlan
from app.domain.entities.user import User, UserProfile, UserProgress


class UserRepository(Protocol):
    async def get_by_id(self, user_id: UUID) -> User | None: ...

    async def get_by_email(self, email: str) -> User | None: ...

    async def create(
        self, email: str, name: str, password_hash: str
    ) -> User | None: ...


class ProfileRepository(Protocol):
    async def get_by_user_id(self, user_id: UUID) -> UserProfile | None: ...

    async def create(self, profile: UserProfile) -> UserProfile: ...


class ProgressRepository(Protocol):
    async def get_by_user_id(self, user_id: UUID) -> UserProgress: ...

    async def complete_lesson(
        self, user_id: UUID, lesson_id: str, xp_earned: int
    ) -> bool: ...

    async def record_lesson_practice(
        self, user_id: UUID, lesson_id: str, practiced_on: date
    ) -> bool: ...

    async def claim_challenge(
        self, user_id: UUID, challenge_id: str, xp_earned: int
    ) -> bool: ...

    async def record_attempt(
        self,
        *,
        user_id: UUID,
        exercise_id: str,
        attempt_type: str,
        is_correct: bool,
        submitted_answer: str | None = None,
        predicted_sign: str | None = None,
        confidence: float | None = None,
        skipped: bool = False,
    ) -> None: ...


class SubscriptionRepository(Protocol):
    async def list_plans(self) -> list[SubscriptionPlan]: ...

    async def get_by_user_id(self, user_id: UUID) -> Subscription | None: ...

    async def upsert(self, subscription: Subscription) -> Subscription: ...

    async def mark_event_processed(
        self, event_id: str, event_type: str, user_id: UUID | None
    ) -> bool: ...
