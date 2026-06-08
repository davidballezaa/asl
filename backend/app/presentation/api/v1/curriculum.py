from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends

from app.application.services.curriculum_service import CurriculumService
from app.domain.ports.unit_of_work import UnitOfWork
from app.presentation.deps import get_current_user_id, get_uow

router = APIRouter(prefix="/curriculum", tags=["curriculum"])


@router.get("/units")
async def list_units(
    _user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    service = CurriculumService(uow)
    return await service.list_units()
