from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.sql.repositories.curriculum_repository import (
    SQLCurriculumRepository,
)
from app.infrastructure.db.sql.repositories.profile_repository import SQLProfileRepository
from app.infrastructure.db.sql.repositories.progress_repository import SQLProgressRepository
from app.infrastructure.db.sql.repositories.user_repository import SQLUserRepository


class SQLUnitOfWork:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self.users = SQLUserRepository(session)
        self.profiles = SQLProfileRepository(session)
        self.progress = SQLProgressRepository(session)
        self.curriculum = SQLCurriculumRepository(session)

    async def commit(self) -> None:
        await self._session.commit()

    async def rollback(self) -> None:
        await self._session.rollback()

    async def __aenter__(self) -> "SQLUnitOfWork":
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        if exc_type:
            await self.rollback()
        else:
            await self.commit()
