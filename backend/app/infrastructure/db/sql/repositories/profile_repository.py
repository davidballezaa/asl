from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.user import UserProfile
from app.infrastructure.db.sql.mappers import profile_from_model
from app.infrastructure.db.sql.models import UserProfileModel


class SQLProfileRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_user_id(self, user_id: UUID) -> UserProfile | None:
        result = await self._session.execute(
            select(UserProfileModel).where(UserProfileModel.user_id == user_id)
        )
        model = result.scalar_one_or_none()
        return profile_from_model(model) if model else None

    async def create(self, profile: UserProfile) -> UserProfile:
        model = UserProfileModel(
            user_id=profile.user_id,
            username=profile.username,
            initials=profile.initials,
            photo_url=profile.photo_url,
        )
        self._session.add(model)
        await self._session.flush()
        return profile_from_model(model)
