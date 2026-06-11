from __future__ import annotations

from app.domain.ports.unit_of_work import UnitOfWork


class AdminMetricsService:
    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def overview(self) -> dict:
        return await self._uow.metrics.overview()
