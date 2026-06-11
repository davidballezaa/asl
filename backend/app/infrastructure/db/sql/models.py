from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKey,
    func,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.sql.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


attempt_id_type = BigInteger().with_variant(Integer, "sqlite")


class UserModel(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("email = lower(email)", name="ck_users_email_lowercase"),
        CheckConstraint("role IN ('user', 'admin')", name="ck_users_role"),
        Index("ix_users_role", "role"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="user", server_default="user")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, server_default=func.now()
    )

    profile: Mapped["UserProfileModel"] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )


class UserProfileModel(Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    username: Mapped[str] = mapped_column(String(100))
    initials: Mapped[str] = mapped_column(String(10))
    user: Mapped[UserModel] = relationship(back_populates="profile")



class SubscriptionPlanModel(Base):
    """Catalog of purchasable plans. Reference data — one row per plan."""

    __tablename__ = "subscription_plans"
    __table_args__ = (
        CheckConstraint(
            "price_cents >= 0", name="ck_subscription_plans_price_nonnegative"
        ),
        CheckConstraint(
            "sort_order >= 0", name="ck_subscription_plans_sort_order_nonnegative"
        ),
        CheckConstraint(
            "billing_interval IS NULL OR billing_interval IN ('month', 'year')",
            name="ck_subscription_plans_interval",
        ),
    )

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    price_cents: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(3))
    billing_interval: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    stripe_price_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, unique=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer)


class SubscriptionModel(Base):
    """Current subscription state for a user, synced from Stripe.

    One row per user (1:1). A user on the free tier has no row — absence is
    the free default, consistent with how all gameplay progress is derived.
    """

    __tablename__ = "subscriptions"
    __table_args__ = (
        CheckConstraint(
            "status IN ('active', 'trialing', 'past_due', 'canceled', "
            "'incomplete', 'incomplete_expired', 'unpaid', 'paused')",
            name="ck_subscriptions_status",
        ),
        Index("ix_subscriptions_plan_id", "plan_id"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    plan_id: Mapped[str] = mapped_column(
        ForeignKey("subscription_plans.id", ondelete="RESTRICT")
    )
    status: Mapped[str] = mapped_column(String(30))
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, unique=True
    )
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, unique=True
    )
    current_period_end: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        server_default=func.now(),
        onupdate=utc_now,
    )


class StripeWebhookEventModel(Base):
    """Append-only log of processed Stripe events for idempotent webhooks."""

    __tablename__ = "stripe_webhook_events"
    __table_args__ = (
        Index("ix_stripe_webhook_events_user_id", "user_id"),
    )

    id: Mapped[str] = mapped_column(String(255), primary_key=True)
    event_type: Mapped[str] = mapped_column(String(100))
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, server_default=func.now()
    )


class UnitModel(Base):
    __tablename__ = "units"
    __table_args__ = (
        UniqueConstraint("sort_order", name="uq_units_sort_order"),
        CheckConstraint("sort_order >= 0", name="ck_units_sort_order_nonnegative"),
    )

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer)

    lessons: Mapped[list["LessonModel"]] = relationship(
        back_populates="unit", cascade="all, delete-orphan"
    )


class LessonModel(Base):
    __tablename__ = "lessons"
    __table_args__ = (
        UniqueConstraint("unit_id", "sort_order", name="uq_lessons_unit_sort_order"),
        CheckConstraint("sort_order >= 0", name="ck_lessons_sort_order_nonnegative"),
        CheckConstraint("xp_reward >= 0", name="ck_lessons_xp_reward_nonnegative"),
    )

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    unit_id: Mapped[str] = mapped_column(
        ForeignKey("units.id", ondelete="CASCADE")
    )
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    xp_reward: Mapped[int] = mapped_column(Integer)
    youtube_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer)

    unit: Mapped[UnitModel] = relationship(back_populates="lessons")
    exercises: Mapped[list["ExerciseModel"]] = relationship(
        back_populates="lesson", cascade="all, delete-orphan"
    )


class ExerciseModel(Base):
    __tablename__ = "exercises"
    __table_args__ = (
        UniqueConstraint(
            "lesson_id", "sort_order", name="uq_exercises_lesson_sort_order"
        ),
        CheckConstraint(
            "type IN ('demo', 'quiz', 'camera')",
            name="ck_exercises_type",
        ),
        CheckConstraint(
            "content_type IS NULL OR content_type IN ('letter', 'name')",
            name="ck_exercises_content_type",
        ),
        CheckConstraint("sort_order >= 0", name="ck_exercises_sort_order_nonnegative"),
    )

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    lesson_id: Mapped[str] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE")
    )
    type: Mapped[str] = mapped_column(String(20))
    sign_word: Mapped[str] = mapped_column(String(50))
    sign_description: Mapped[str] = mapped_column(Text)
    content_type: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer)

    lesson: Mapped[LessonModel] = relationship(back_populates="exercises")
    options: Mapped[list["ExerciseOptionModel"]] = relationship(
        back_populates="exercise", cascade="all, delete-orphan"
    )


class ExerciseOptionModel(Base):
    __tablename__ = "exercise_options"
    __table_args__ = (
        UniqueConstraint(
            "exercise_id", "sort_order", name="uq_exercise_options_sort_order"
        ),
        CheckConstraint(
            "sort_order >= 0", name="ck_exercise_options_sort_order_nonnegative"
        ),
        Index(
            "uq_exercise_options_one_correct",
            "exercise_id",
            unique=True,
            postgresql_where=text("is_correct"),
            sqlite_where=text("is_correct"),
        ),
    )

    exercise_id: Mapped[str] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"), primary_key=True
    )
    value: Mapped[str] = mapped_column(String(255), primary_key=True)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer)

    exercise: Mapped[ExerciseModel] = relationship(back_populates="options")


class ChallengeModel(Base):
    __tablename__ = "challenges"
    __table_args__ = (
        CheckConstraint("xp_reward >= 0", name="ck_challenges_xp_reward_nonnegative"),
        CheckConstraint("target > 0", name="ck_challenges_target_positive"),
        CheckConstraint(
            "category IN ('streak', 'alphabet', 'practice', 'mastery')",
            name="ck_challenges_category",
        ),
    )

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    xp_reward: Mapped[int] = mapped_column(Integer)
    icon: Mapped[str] = mapped_column(String(20))
    category: Mapped[str] = mapped_column(String(20))
    target: Mapped[int] = mapped_column(Integer)


class UserLessonCompletionModel(Base):
    __tablename__ = "user_lesson_completions"
    __table_args__ = (
        CheckConstraint(
            "xp_earned >= 0", name="ck_user_lesson_completions_xp_nonnegative"
        ),
        Index(
            "ix_user_lesson_completions_user_completed_at",
            "user_id",
            "completed_at",
        ),
        Index(
            "ix_user_lesson_completions_lesson_id",
            "lesson_id",
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    lesson_id: Mapped[str] = mapped_column(
        ForeignKey("lessons.id", ondelete="RESTRICT"), primary_key=True
    )
    xp_earned: Mapped[int] = mapped_column(Integer)
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, server_default=func.now()
    )


class UserLessonPracticeDayModel(Base):
    __tablename__ = "user_lesson_practice_days"
    __table_args__ = (
        Index(
            "ix_user_lesson_practice_days_user_date",
            "user_id",
            "practiced_on",
        ),
        Index(
            "ix_user_lesson_practice_days_lesson_id",
            "lesson_id",
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    lesson_id: Mapped[str] = mapped_column(
        ForeignKey("lessons.id", ondelete="RESTRICT"), primary_key=True
    )
    practiced_on: Mapped[date] = mapped_column(Date, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, server_default=func.now()
    )


class UserChallengeClaimModel(Base):
    __tablename__ = "user_challenge_claims"
    __table_args__ = (
        CheckConstraint(
            "xp_earned >= 0", name="ck_user_challenge_claims_xp_nonnegative"
        ),
        Index(
            "ix_user_challenge_claims_user_claimed_at",
            "user_id",
            "claimed_at",
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    challenge_id: Mapped[str] = mapped_column(
        ForeignKey("challenges.id", ondelete="RESTRICT"), primary_key=True
    )
    xp_earned: Mapped[int] = mapped_column(Integer)
    claimed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, server_default=func.now()
    )


class ExerciseAttemptModel(Base):
    __tablename__ = "exercise_attempts"
    __table_args__ = (
        CheckConstraint(
            "attempt_type IN ('quiz', 'camera')",
            name="ck_exercise_attempts_type",
        ),
        CheckConstraint(
            "confidence IS NULL OR (confidence >= 0 AND confidence <= 1)",
            name="ck_exercise_attempts_confidence_range",
        ),
        Index(
            "ix_exercise_attempts_user_attempted_at",
            "user_id",
            "attempted_at",
        ),
        Index(
            "ix_exercise_attempts_user_camera_success",
            "user_id",
            "attempt_type",
            "is_correct",
            "exercise_id",
        ),
        Index(
            "ix_exercise_attempts_exercise_correct",
            "exercise_id",
            "is_correct",
        ),
    )

    id: Mapped[int] = mapped_column(attempt_id_type, primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )
    exercise_id: Mapped[str] = mapped_column(
        ForeignKey("exercises.id", ondelete="RESTRICT")
    )
    attempt_type: Mapped[str] = mapped_column(String(20))
    submitted_answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    predicted_sign: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_correct: Mapped[bool] = mapped_column(Boolean)
    skipped: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    attempted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, server_default=func.now()
    )
