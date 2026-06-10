from __future__ import annotations

from dataclasses import dataclass

FREE_PLAN_ID = "free"
PRO_PLAN_ID = "pro"

# Subscription statuses that grant access to paid features. Mirrors the subset
# of Stripe subscription statuses we treat as "the customer is paying".
ACTIVE_STATUSES = frozenset({"active", "trialing"})


@dataclass(frozen=True)
class PlanDef:
    id: str
    name: str
    price_cents: int
    currency: str
    interval: str | None  # 'month' | 'year' | None for the free tier
    sort_order: int


# Catalog of all plans. The free tier exists for the pricing UI; a user on the
# free tier simply has no `subscriptions` row (absence == free).
SUBSCRIPTION_PLANS: list[PlanDef] = [
    PlanDef(FREE_PLAN_ID, "Free", 0, "usd", None, 0),
    PlanDef(PRO_PLAN_ID, "Pro", 999, "usd", "month", 1),
]
