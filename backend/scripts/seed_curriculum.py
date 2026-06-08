from __future__ import annotations

"""Idempotent curriculum seed. Run: python -m scripts.seed_curriculum"""

import asyncio
import json

from sqlalchemy import select

from app.domain.curriculum_data import UNITS_DATA
from app.infrastructure.db.sql.models import ExerciseModel, LessonModel, UnitModel
from app.infrastructure.db.sql.session import create_tables, get_async_session_factory


async def seed() -> None:
    await create_tables()
    async with get_async_session_factory()() as session:
        result = await session.execute(select(UnitModel).limit(1))
        if result.scalar_one_or_none():
            print("Curriculum already seeded, skipping.")
            return

        for unit_data in UNITS_DATA:
            unit = UnitModel(
                id=unit_data["id"],
                title=unit_data["title"],
                description=unit_data["description"],
                sort_order=unit_data["sort_order"],
            )
            session.add(unit)
            for li, lesson_data in enumerate(unit_data["lessons"]):
                lesson = LessonModel(
                    id=lesson_data["id"],
                    unit_id=unit_data["id"],
                    title=lesson_data["title"],
                    description=lesson_data["description"],
                    xp_reward=lesson_data["xp_reward"],
                    youtube_id=lesson_data.get("youtube_id"),
                    sort_order=li,
                )
                session.add(lesson)
                for ei, ex_data in enumerate(lesson_data["exercises"]):
                    exercise = ExerciseModel(
                        id=ex_data["id"],
                        lesson_id=lesson_data["id"],
                        type=ex_data["type"],
                        sign_word=ex_data["sign_word"],
                        sign_description=ex_data["sign_description"],
                        content_type=ex_data.get("content_type"),
                        options_json=json.dumps(ex_data["options"])
                        if ex_data.get("options")
                        else None,
                        correct_answer=ex_data.get("correct_answer"),
                        sort_order=ei,
                    )
                    session.add(exercise)
        await session.commit()
        print("Curriculum seeded successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
