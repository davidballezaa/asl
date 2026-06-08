from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.domain.ports.unit_of_work import UnitOfWork
from app.infrastructure.db.sql.session import get_async_session_factory
from app.infrastructure.db.sql.unit_of_work import SQLUnitOfWork


async def get_unit_of_work() -> AsyncGenerator[UnitOfWork, None]:
    settings = get_settings()
    if settings.db_backend == "mongo":
        raise NotImplementedError(
            "MongoDB backend not implemented yet. "
            "See infrastructure/db/mongo/README.md"
        )
    async with get_async_session_factory()() as session:
        uow = SQLUnitOfWork(session)
        try:
            yield uow
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_unit_of_work_manual(session: AsyncSession) -> SQLUnitOfWork:
    return SQLUnitOfWork(session)
