from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from app.domain.subscriptions import ACTIVE_STATUSES


@dataclass
class SubscriptionPlan:
    id: str
    name: str
    price_cents: int
    currency: str
    interval: str | None
    sort_order: int


@dataclass
class Subscription:
    user_id: UUID
    plan_id: str
    status: str
    stripe_customer_id: str | None = None
    stripe_subscription_id: str | None = None
    current_period_end: datetime | None = None
    cancel_at_period_end: bool = False

    @property
    def is_active(self) -> bool:
        return self.status in ACTIVE_STATUSES
