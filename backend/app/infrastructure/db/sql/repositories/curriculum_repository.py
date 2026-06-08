from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.entities.curriculum import Exercise, Lesson, Unit
from app.infrastructure.db.sql.mappers import exercise_from_model, lesson_from_model, unit_from_model
from app.infrastructure.db.sql.models import ExerciseModel, LessonModel, UnitModel


class SQLCurriculumRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_units(self) -> list[Unit]:
        result = await self._session.execute(
            select(UnitModel)
            .options(selectinload(UnitModel.lessons))
            .order_by(UnitModel.sort_order)
        )
        return [unit_from_model(u, include_exercises=False) for u in result.scalars()]

    async def get_lesson(self, lesson_id: str) -> Lesson | None:
        result = await self._session.execute(
            select(LessonModel)
            .options(selectinload(LessonModel.exercises))
            .where(LessonModel.id == lesson_id)
        )
        model = result.scalar_one_or_none()
        return lesson_from_model(model) if model else None

    async def get_unit_id_for_lesson(self, lesson_id: str) -> str | None:
        result = await self._session.execute(
            select(LessonModel.unit_id).where(LessonModel.id == lesson_id)
        )
        return result.scalar_one_or_none()

    async def get_all_lesson_ids_in_order(self) -> list[str]:
        result = await self._session.execute(
            select(LessonModel.id, LessonModel.sort_order, LessonModel.unit_id)
            .join(UnitModel)
            .order_by(UnitModel.sort_order, LessonModel.sort_order)
        )
        return [row[0] for row in result.all()]

    async def get_exercise(
        self, lesson_id: str, exercise_id: str
    ) -> tuple[Lesson, Exercise] | None:
        result = await self._session.execute(
            select(ExerciseModel)
            .options(selectinload(ExerciseModel.lesson))
            .where(
                ExerciseModel.lesson_id == lesson_id,
                ExerciseModel.id == exercise_id,
            )
        )
        model = result.scalar_one_or_none()
        if not model:
            return None
        lesson = lesson_from_model(model.lesson, include_exercises=False)
        return lesson, exercise_from_model(model)
