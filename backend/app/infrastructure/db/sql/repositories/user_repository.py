from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
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

    async def create(
        self, email: str, name: str, password_hash: str
    ) -> User | None:
        values = {
            "id": uuid4(),
            "email": email.lower(),
            "name": name,
            "password_hash": password_hash,
        }
        dialect_name = self._session.get_bind().dialect.name
        if dialect_name == "postgresql":
            statement = (
                postgresql_insert(UserModel)
                .values(**values)
                .on_conflict_do_nothing(index_elements=["email"])
                .returning(UserModel)
            )
        elif dialect_name == "sqlite":
            statement = (
                sqlite_insert(UserModel)
                .values(**values)
                .on_conflict_do_nothing(index_elements=["email"])
                .returning(UserModel)
            )
        else:
            raise RuntimeError(
                f"Conflict-safe user creation is not implemented for {dialect_name}"
            )
        result = await self._session.execute(statement)
        model = result.scalar_one_or_none()
        return user_from_model(model) if model else None
