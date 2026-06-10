from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.subscription import Subscription, SubscriptionPlan
from app.infrastructure.db.sql.mappers import (
    subscription_from_model,
    subscription_plan_from_model,
)
from app.infrastructure.db.sql.models import (
    StripeWebhookEventModel,
    SubscriptionModel,
    SubscriptionPlanModel,
)


class SQLSubscriptionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_plans(self) -> list[SubscriptionPlan]:
        result = await self._session.execute(
            select(SubscriptionPlanModel)
            .where(SubscriptionPlanModel.is_active.is_(True))
            .order_by(SubscriptionPlanModel.sort_order)
        )
        return [subscription_plan_from_model(m) for m in result.scalars()]

    async def get_by_user_id(self, user_id: UUID) -> Subscription | None:
        result = await self._session.execute(
            select(SubscriptionModel).where(SubscriptionModel.user_id == user_id)
        )
        model = result.scalar_one_or_none()
        return subscription_from_model(model) if model else None

    async def upsert(self, subscription: Subscription) -> Subscription:
        result = await self._session.execute(
            select(SubscriptionModel).where(
                SubscriptionModel.user_id == subscription.user_id
            )
        )
        model = result.scalar_one_or_none()
        if model is None:
            model = SubscriptionModel(user_id=subscription.user_id)
            self._session.add(model)
        model.plan_id = subscription.plan_id
        model.status = subscription.status
        model.stripe_customer_id = subscription.stripe_customer_id
        model.stripe_subscription_id = subscription.stripe_subscription_id
        model.current_period_end = subscription.current_period_end
        model.cancel_at_period_end = subscription.cancel_at_period_end
        await self._session.flush()
        return subscription_from_model(model)

    async def mark_event_processed(
        self, event_id: str, event_type: str, user_id: UUID | None
    ) -> bool:
        """Record a Stripe event id. Returns True the first time, False if the
        event was already processed (idempotency guard for webhook retries)."""
        values = {
            "id": event_id,
            "event_type": event_type,
            "user_id": user_id,
        }
        dialect_name = self._session.get_bind().dialect.name
        if dialect_name == "postgresql":
            statement = (
                postgresql_insert(StripeWebhookEventModel)
                .values(**values)
                .on_conflict_do_nothing(index_elements=["id"])
            )
        elif dialect_name == "sqlite":
            statement = (
                sqlite_insert(StripeWebhookEventModel)
                .values(**values)
                .on_conflict_do_nothing(index_elements=["id"])
            )
        else:
            raise RuntimeError(
                f"Idempotent webhook writes are not implemented for {dialect_name}"
            )
        result = await self._session.execute(statement)
        return result.rowcount == 1
