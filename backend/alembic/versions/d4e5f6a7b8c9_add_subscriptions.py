"""add subscription plans, subscriptions, and stripe webhook events

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-06-10

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    plans = op.create_table(
        'subscription_plans',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('price_cents', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('billing_interval', sa.String(length=20), nullable=True),
        sa.Column('stripe_price_id', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.CheckConstraint('price_cents >= 0', name='ck_subscription_plans_price_nonnegative'),
        sa.CheckConstraint('sort_order >= 0', name='ck_subscription_plans_sort_order_nonnegative'),
        sa.CheckConstraint(
            "billing_interval IS NULL OR billing_interval IN ('month', 'year')",
            name='ck_subscription_plans_interval',
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('stripe_price_id', name='uq_subscription_plans_stripe_price_id'),
    )

    op.create_table(
        'subscriptions',
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('plan_id', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('stripe_customer_id', sa.String(length=255), nullable=True),
        sa.Column('stripe_subscription_id', sa.String(length=255), nullable=True),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancel_at_period_end', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "status IN ('active', 'trialing', 'past_due', 'canceled', "
            "'incomplete', 'incomplete_expired', 'unpaid', 'paused')",
            name='ck_subscriptions_status',
        ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['plan_id'], ['subscription_plans.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('user_id'),
        sa.UniqueConstraint('stripe_customer_id', name='uq_subscriptions_stripe_customer_id'),
        sa.UniqueConstraint('stripe_subscription_id', name='uq_subscriptions_stripe_subscription_id'),
    )
    op.create_index('ix_subscriptions_plan_id', 'subscriptions', ['plan_id'])

    op.create_table(
        'stripe_webhook_events',
        sa.Column('id', sa.String(length=255), nullable=False),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=True),
        sa.Column('received_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_stripe_webhook_events_user_id', 'stripe_webhook_events', ['user_id'])

    op.bulk_insert(
        plans,
        [
            {
                'id': 'free',
                'name': 'Free',
                'price_cents': 0,
                'currency': 'usd',
                'billing_interval': None,
                'stripe_price_id': None,
                'is_active': True,
                'sort_order': 0,
            },
            {
                'id': 'pro',
                'name': 'Pro',
                'price_cents': 999,
                'currency': 'usd',
                'billing_interval': 'month',
                'stripe_price_id': None,
                'is_active': True,
                'sort_order': 1,
            },
        ],
    )


def downgrade() -> None:
    op.drop_index('ix_stripe_webhook_events_user_id', table_name='stripe_webhook_events')
    op.drop_table('stripe_webhook_events')
    op.drop_index('ix_subscriptions_plan_id', table_name='subscriptions')
    op.drop_table('subscriptions')
    op.drop_table('subscription_plans')
