from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.user import User
from app.infrastructure.db.sql.mappers import user_from_model
from app.infrastructure.db.sql.models import UserModel


class SQLUserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, user_id: UUID) -> User | None:
        result = await self._session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        model = result.scalar_one_or_none()
        return user_from_model(model) if model else None

    async def get_by_email(self, email: str) -> User | None:
        result = await self._session.execute(
            select(UserModel).where(UserModel.email == email.lower())
        )
        model = result.scalar_one_or_none()
        return user_from_model(model) if model else None

    async def create(self, email: str, name: str, password_hash: str) -> User:
        model = UserModel(
            id=uuid4(),
            email=email.lower(),
            name=name,
            password_hash=password_hash,
        )
        self._session.add(model)
        await self._session.flush()
        return user_from_model(model)
