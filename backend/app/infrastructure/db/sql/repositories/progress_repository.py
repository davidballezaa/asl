from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.user import UserProgress
from app.infrastructure.db.sql.mappers import progress_from_model, progress_to_model_fields
from app.infrastructure.db.sql.models import UserProgressModel


class SQLProgressRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_user_id(self, user_id: UUID) -> UserProgress | None:
        result = await self._session.execute(
            select(UserProgressModel).where(UserProgressModel.user_id == user_id)
        )
        model = result.scalar_one_or_none()
        return progress_from_model(model) if model else None

    async def create(self, progress: UserProgress) -> UserProgress:
        model = UserProgressModel(user_id=progress.user_id, **progress_to_model_fields(progress))
        self._session.add(model)
        await self._session.flush()
        return progress_from_model(model)

    async def save(self, progress: UserProgress) -> UserProgress:
        result = await self._session.execute(
            select(UserProgressModel).where(UserProgressModel.user_id == progress.user_id)
        )
        model = result.scalar_one()
        for key, value in progress_to_model_fields(progress).items():
            setattr(model, key, value)
        await self._session.flush()
        return progress_from_model(model)
