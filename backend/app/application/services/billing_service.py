from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from app.domain.entities.subscription import Subscription
from app.domain.ports.unit_of_work import UnitOfWork
from app.domain.subscriptions import FREE_PLAN_ID, PRO_PLAN_ID


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
        """Demo checkout: activate Pro immediately and persist it.

        With real Stripe this would create a Checkout Session and return its
        URL; the `pro` subscription would be activated by the webhook once
        payment succeeds. The persisted shape is identical either way.
        """
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
