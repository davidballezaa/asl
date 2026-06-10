from __future__ import annotations

from datetime import date

from app.domain.entities.curriculum import Exercise, Lesson, Unit
from app.domain.entities.subscription import Subscription, SubscriptionPlan
from app.domain.entities.user import User, UserProfile
from app.infrastructure.db.sql.models import (
    ExerciseModel,
    LessonModel,
    SubscriptionModel,
    SubscriptionPlanModel,
    UnitModel,
    UserModel,
    UserProfileModel,
)


def user_from_model(m: UserModel) -> User:
    return User(
        id=m.id,
        email=m.email,
        name=m.name,
        password_hash=m.password_hash,
        created_at=m.created_at,
        role=m.role,
    )


def profile_from_model(m: UserProfileModel) -> UserProfile:
    return UserProfile(
        user_id=m.user_id,
        username=m.username,
        initials=m.initials,
    )


def subscription_plan_from_model(m: SubscriptionPlanModel) -> SubscriptionPlan:
    return SubscriptionPlan(
        id=m.id,
        name=m.name,
        price_cents=m.price_cents,
        currency=m.currency,
        interval=m.billing_interval,
        sort_order=m.sort_order,
    )


def subscription_from_model(m: SubscriptionModel) -> Subscription:
    return Subscription(
        user_id=m.user_id,
        plan_id=m.plan_id,
        status=m.status,
        stripe_customer_id=m.stripe_customer_id,
        stripe_subscription_id=m.stripe_subscription_id,
        current_period_end=m.current_period_end,
        cancel_at_period_end=m.cancel_at_period_end,
    )


def exercise_from_model(m: ExerciseModel) -> Exercise:
    sorted_options = sorted(m.options, key=lambda option: option.sort_order)
    options = [option.value for option in sorted_options] or None
    correct_answer = next(
        (option.value for option in sorted_options if option.is_correct),
        None,
    )
    return Exercise(
        id=m.id,
        type=m.type,
        sign_word=m.sign_word,
        sign_description=m.sign_description,
        content_type=m.content_type,
        options=options,
        correct_answer=correct_answer,
        image_url=m.image_url,
    )


def lesson_from_model(m: LessonModel, include_exercises: bool = True) -> Lesson:
    exercises = (
        [exercise_from_model(e) for e in sorted(m.exercises, key=lambda x: x.sort_order)]
        if include_exercises
        else []
    )
    return Lesson(
        id=m.id,
        unit_id=m.unit_id,
        title=m.title,
        description=m.description,
        xp_reward=m.xp_reward,
        youtube_id=m.youtube_id,
        exercises=exercises,
        sort_order=m.sort_order,
    )


def unit_from_model(m: UnitModel, include_exercises: bool = False) -> Unit:
    lessons = [
        lesson_from_model(l, include_exercises=include_exercises)
        for l in sorted(m.lessons, key=lambda x: x.sort_order)
    ]
    return Unit(
        id=m.id,
        title=m.title,
        description=m.description,
        lessons=lessons,
        sort_order=m.sort_order,
    )
