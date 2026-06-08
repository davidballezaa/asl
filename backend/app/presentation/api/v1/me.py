from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.application.services.me_service import MeService
from app.domain.ports.unit_of_work import UnitOfWork
from app.presentation.deps import get_current_user_id, get_uow

router = APIRouter(tags=["me"])


@router.get("/me")
async def get_me(
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    service = MeService(uow)
    data = await service.get_me(user_id)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return data
