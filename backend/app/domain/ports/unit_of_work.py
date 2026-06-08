from __future__ import annotations

from typing import Protocol

from app.domain.ports.curriculum_repository import CurriculumRepository
from app.domain.ports.user_repository import (
    ProfileRepository,
    ProgressRepository,
    UserRepository,
)


class UnitOfWork(Protocol):
    users: UserRepository
    profiles: ProfileRepository
    progress: ProgressRepository
    curriculum: CurriculumRepository

    async def commit(self) -> None: ...

    async def rollback(self) -> None: ...

    async def __aenter__(self) -> "UnitOfWork": ...

    async def __aexit__(self, exc_type, exc, tb) -> None: ...
