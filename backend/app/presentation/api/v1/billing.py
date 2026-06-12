from __future__ import annotations

import os
from typing import Annotated
from uuid import UUID

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request

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


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    stripe_signature: Annotated[
        str | None,
        Header(alias="stripe-signature"),
    ] = None,
):
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    if not webhook_secret:
        raise HTTPException(
            status_code=500,
            detail="STRIPE_WEBHOOK_SECRET is missing",
        )

    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=stripe_signature,
            secret=webhook_secret,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid payload") from exc
    except stripe.SignatureVerificationError as exc:
        raise HTTPException(status_code=400, detail="Invalid signature") from exc

    print("Stripe event:", event["type"])

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]

        user_id_raw = getattr(session, "client_reference_id", None)

        print("checkout.session.completed client_reference_id:", user_id_raw)

        if not user_id_raw:
            print("No client_reference_id found. Cannot activate Pro.")
            return {
                "received": True,
                "activated": False,
                "reason": "missing_client_reference_id",
            }

        try:
            user_id = UUID(str(user_id_raw))
        except ValueError:
            print("Invalid client_reference_id:", user_id_raw)
            return {
                "received": True,
                "activated": False,
                "reason": "invalid_client_reference_id",
            }

        try:
            result = await BillingService(uow).activate_pro(user_id)
            print("Activated Pro:", result)
            return {
                "received": True,
                "activated": True,
                "result": result,
            }
        except Exception as exc:
            print("Webhook activation failed:", repr(exc))
            raise HTTPException(
                status_code=500,
                detail=f"Could not activate Pro: {type(exc).__name__}",
            )

    return {"received": True}