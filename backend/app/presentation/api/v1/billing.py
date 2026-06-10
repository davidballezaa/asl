from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends

from app.application.services.billing_service import BillingService
from app.domain.ports.unit_of_work import UnitOfWork
from app.presentation.deps import get_current_user_id, get_uow

router = APIRouter(prefix="/billing", tags=["billing"])


@router.get("/plans")
async def list_plans(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    return await BillingService(uow).list_plans()


@router.post("/checkout")
async def start_checkout(
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    return await BillingService(uow).start_checkout(user_id)


@router.post("/cancel")
async def cancel_subscription(
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    return await BillingService(uow).cancel(user_id)
