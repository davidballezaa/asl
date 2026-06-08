from __future__ import annotations

from typing import Protocol
from uuid import UUID

from app.domain.entities.user import User, UserProfile, UserProgress


class UserRepository(Protocol):
    async def get_by_id(self, user_id: UUID) -> User | None: ...

    async def get_by_email(self, email: str) -> User | None: ...

    async def create(
        self, email: str, name: str, password_hash: str
    ) -> User: ...


class ProfileRepository(Protocol):
    async def get_by_user_id(self, user_id: UUID) -> UserProfile | None: ...

    async def create(self, profile: UserProfile) -> UserProfile: ...


class ProgressRepository(Protocol):
    async def get_by_user_id(self, user_id: UUID) -> UserProgress | None: ...

    async def create(self, progress: UserProgress) -> UserProgress: ...

    async def save(self, progress: UserProgress) -> UserProgress: ...
