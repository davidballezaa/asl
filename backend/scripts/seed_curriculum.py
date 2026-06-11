from __future__ import annotations

"""Idempotent reference-data seed. Run: python -m scripts.seed_curriculum"""

import asyncio

from sqlalchemy import delete

from app.domain.challenges import CHALLENGES
from app.domain.curriculum_data import UNITS_DATA
from app.domain.subscriptions import SUBSCRIPTION_PLANS
from app.infrastructure.db.sql.models import (
    ChallengeModel,
    ExerciseModel,
    ExerciseOptionModel,
    LessonModel,
    SubscriptionPlanModel,
    UnitModel,
)
from app.infrastructure.db.sql.session import get_async_session_factory


async def seed() -> None:
    async with get_async_session_factory()() as session:
        for plan in SUBSCRIPTION_PLANS:
            await session.merge(
                SubscriptionPlanModel(
                    id=plan.id,
                    name=plan.name,
                    price_cents=plan.price_cents,
                    currency=plan.currency,
                    billing_interval=plan.interval,
                    is_active=True,
                    sort_order=plan.sort_order,
                )
            )

        for challenge in CHALLENGES:
            await session.merge(
                ChallengeModel(
                    id=challenge.id,
                    title=challenge.title,
                    description=challenge.description,
                    xp_reward=challenge.xp_reward,
                    icon=challenge.icon,
                    category=challenge.category,
                    target=challenge.target,
                )
            )

        for unit_data in UNITS_DATA:
            await session.merge(
                UnitModel(
                    id=unit_data["id"],
                    title=unit_data["title"],
                    description=unit_data["description"],
                    sort_order=unit_data["sort_order"],
                )
            )
            for lesson_position, lesson_data in enumerate(unit_data["lessons"]):
                await session.merge(
                    LessonModel(
                        id=lesson_data["id"],
                        unit_id=unit_data["id"],
                        title=lesson_data["title"],
                        description=lesson_data["description"],
                        xp_reward=lesson_data["xp_reward"],
                        youtube_id=lesson_data.get("youtube_id"),
                        sort_order=lesson_position,
                    )
                )
                for exercise_position, exercise_data in enumerate(
                    lesson_data["exercises"]
                ):
                    await session.merge(
                        ExerciseModel(
                            id=exercise_data["id"],
                            lesson_id=lesson_data["id"],
                            type=exercise_data["type"],
                            sign_word=exercise_data["sign_word"],
                            sign_description=exercise_data["sign_description"],
                            content_type=exercise_data.get("content_type"),
                            sort_order=exercise_position,
                        )
                    )
                    await session.execute(
                        delete(ExerciseOptionModel).where(
                            ExerciseOptionModel.exercise_id == exercise_data["id"]
                        )
                    )
                    for option_position, option in enumerate(
                        exercise_data.get("options", [])
                    ):
                        session.add(
                            ExerciseOptionModel(
                                exercise_id=exercise_data["id"],
                                value=option,
                                is_correct=option
                                == exercise_data.get("correct_answer"),
                                sort_order=option_position,
                            )
                        )

        await session.commit()
        print("Reference data seeded successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
