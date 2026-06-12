from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
from uuid import UUID

from app.domain.entities.subscription import Subscription
from app.domain.ports.unit_of_work import UnitOfWork
from app.domain.subscriptions import FREE_PLAN_ID, PRO_PLAN_ID


STRIPE_PAYMENT_LINK = os.getenv(
    "STRIPE_PAYMENT_LINK",
    "https://buy.stripe.com/test_14AfZhenM6Cufsr0Q6grS00",
)


class BillingService:
    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def list_plans(self) -> dict:
        plans = await self._uow.subscriptions.list_plans()
        return {
            "plans": [
                {
                    "id": p.id,
                    "name": p.name,
                    "priceCents": p.price_cents,
                    "currency": p.currency,
                    "interval": p.interval,
                }
                for p in plans
            ]
        }

    async def start_checkout(self, user_id: UUID) -> dict:
        query = urlencode({"client_reference_id": str(user_id)})
        separator = "&" if "?" in STRIPE_PAYMENT_LINK else "?"
        checkout_url = f"{STRIPE_PAYMENT_LINK}{separator}{query}"

        return {"url": checkout_url}

    async def activate_pro(self, user_id: UUID) -> dict:
        subscription = Subscription(
            user_id=user_id,
            plan_id=PRO_PLAN_ID,
            status="active",
            current_period_end=datetime.now(timezone.utc) + timedelta(days=30),
            cancel_at_period_end=False,
        )
        saved = await self._uow.subscriptions.upsert(subscription)
        return {"plan": saved.plan_id, "status": saved.status}

    async def cancel(self, user_id: UUID) -> dict:
        subscription = await self._uow.subscriptions.get_by_user_id(user_id)
        if subscription and subscription.is_active:
            subscription.status = "canceled"
            subscription.cancel_at_period_end = True
            await self._uow.subscriptions.upsert(subscription)
        return {"plan": FREE_PLAN_ID}