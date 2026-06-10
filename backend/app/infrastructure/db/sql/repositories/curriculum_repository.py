from __future__ import annotations

from uuid import uuid4

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.entities.curriculum import Exercise, Lesson, Unit
from app.infrastructure.db.sql.mappers import (
    exercise_from_model,
    lesson_from_model,
    unit_from_model,
)
from app.infrastructure.db.sql.models import (
    ExerciseAttemptModel,
    ExerciseModel,
    ExerciseOptionModel,
    LessonModel,
    UnitModel,
    UserLessonCompletionModel,
    UserLessonPracticeDayModel,
)


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
            .options(
                selectinload(LessonModel.exercises).selectinload(
                    ExerciseModel.options
                )
            )
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
            .options(
                selectinload(ExerciseModel.lesson),
                selectinload(ExerciseModel.options),
            )
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

    # --- Admin reads -----------------------------------------------------

    async def get_full_curriculum(self) -> list[Unit]:
        """Full nested tree (units -> lessons -> exercises -> options) for the
        admin curriculum manager, ordered by sort_order at every level."""
        result = await self._session.execute(
            select(UnitModel)
            .options(
                selectinload(UnitModel.lessons)
                .selectinload(LessonModel.exercises)
                .selectinload(ExerciseModel.options)
            )
            .order_by(UnitModel.sort_order)
        )
        return [unit_from_model(u, include_exercises=True) for u in result.scalars()]

    # --- Admin writes: units --------------------------------------------

    async def create_unit(self, title: str, description: str) -> Unit:
        sort_order = await self._next_sort_order(UnitModel)
        model = UnitModel(
            id=f"unit-{uuid4().hex[:8]}",
            title=title,
            description=description,
            sort_order=sort_order,
        )
        self._session.add(model)
        await self._session.flush()
        return Unit(
            id=model.id,
            title=title,
            description=description,
            lessons=[],
            sort_order=sort_order,
        )

    async def update_unit(self, unit_id: str, title: str, description: str) -> bool:
        result = await self._session.execute(
            update(UnitModel)
            .where(UnitModel.id == unit_id)
            .values(title=title, description=description)
        )
        return result.rowcount > 0

    async def delete_unit(self, unit_id: str) -> bool:
        result = await self._session.execute(
            delete(UnitModel).where(UnitModel.id == unit_id)
        )
        return result.rowcount > 0

    # --- Admin writes: lessons ------------------------------------------

    async def create_lesson(
        self,
        unit_id: str,
        title: str,
        description: str,
        xp_reward: int,
        youtube_id: str | None,
    ) -> Lesson | None:
        if not await self._exists(UnitModel, unit_id):
            return None
        sort_order = await self._next_sort_order(LessonModel, unit_id=unit_id)
        model = LessonModel(
            id=f"lesson-{uuid4().hex[:8]}",
            unit_id=unit_id,
            title=title,
            description=description,
            xp_reward=xp_reward,
            youtube_id=youtube_id,
            sort_order=sort_order,
        )
        self._session.add(model)
        await self._session.flush()
        return Lesson(
            id=model.id,
            unit_id=unit_id,
            title=title,
            description=description,
            xp_reward=xp_reward,
            youtube_id=youtube_id,
            exercises=[],
            sort_order=sort_order,
        )

    async def update_lesson(
        self,
        lesson_id: str,
        title: str,
        description: str,
        xp_reward: int,
        youtube_id: str | None,
    ) -> bool:
        result = await self._session.execute(
            update(LessonModel)
            .where(LessonModel.id == lesson_id)
            .values(
                title=title,
                description=description,
                xp_reward=xp_reward,
                youtube_id=youtube_id,
            )
        )
        return result.rowcount > 0

    async def delete_lesson(self, lesson_id: str) -> bool:
        result = await self._session.execute(
            delete(LessonModel).where(LessonModel.id == lesson_id)
        )
        return result.rowcount > 0

    # --- Admin writes: exercises ----------------------------------------

    async def create_exercise(
        self,
        lesson_id: str,
        type_: str,
        sign_word: str,
        sign_description: str,
        content_type: str | None,
        image_url: str | None,
    ) -> Exercise | None:
        if not await self._exists(LessonModel, lesson_id):
            return None
        sort_order = await self._next_sort_order(ExerciseModel, lesson_id=lesson_id)
        model = ExerciseModel(
            id=f"exercise-{uuid4().hex[:8]}",
            lesson_id=lesson_id,
            type=type_,
            sign_word=sign_word,
            sign_description=sign_description,
            content_type=content_type,
            image_url=image_url,
            sort_order=sort_order,
        )
        self._session.add(model)
        await self._session.flush()
        return Exercise(
            id=model.id,
            type=type_,
            sign_word=sign_word,
            sign_description=sign_description,
            content_type=content_type,
            options=None,
            correct_answer=None,
            image_url=image_url,
        )

    async def update_exercise(
        self,
        exercise_id: str,
        type_: str,
        sign_word: str,
        sign_description: str,
        content_type: str | None,
        image_url: str | None,
    ) -> bool:
        result = await self._session.execute(
            update(ExerciseModel)
            .where(ExerciseModel.id == exercise_id)
            .values(
                type=type_,
                sign_word=sign_word,
                sign_description=sign_description,
                content_type=content_type,
                image_url=image_url,
            )
        )
        return result.rowcount > 0

    async def delete_exercise(self, exercise_id: str) -> bool:
        result = await self._session.execute(
            delete(ExerciseModel).where(ExerciseModel.id == exercise_id)
        )
        return result.rowcount > 0

    async def set_exercise_options(
        self, exercise_id: str, options: list[tuple[str, bool]]
    ) -> bool:
        if not await self._exists(ExerciseModel, exercise_id):
            return False
        await self._session.execute(
            delete(ExerciseOptionModel).where(
                ExerciseOptionModel.exercise_id == exercise_id
            )
        )
        await self._session.flush()
        for position, (value, is_correct) in enumerate(options):
            self._session.add(
                ExerciseOptionModel(
                    exercise_id=exercise_id,
                    value=value,
                    is_correct=is_correct,
                    sort_order=position,
                )
            )
        await self._session.flush()
        return True

    # --- Admin writes: reordering ---------------------------------------

    async def reorder_units(self, ordered_ids: list[str]) -> None:
        await self._reorder(UnitModel, ordered_ids)

    async def reorder_lessons(self, unit_id: str, ordered_ids: list[str]) -> None:
        await self._reorder(
            LessonModel, ordered_ids, LessonModel.unit_id == unit_id
        )

    async def reorder_exercises(
        self, lesson_id: str, ordered_ids: list[str]
    ) -> None:
        await self._reorder(
            ExerciseModel, ordered_ids, ExerciseModel.lesson_id == lesson_id
        )

    # --- Delete-safety reference checks ---------------------------------

    async def lesson_has_user_data(self, lesson_id: str) -> bool:
        completions = await self._session.scalar(
            select(func.count())
            .select_from(UserLessonCompletionModel)
            .where(UserLessonCompletionModel.lesson_id == lesson_id)
        )
        if completions:
            return True
        practice = await self._session.scalar(
            select(func.count())
            .select_from(UserLessonPracticeDayModel)
            .where(UserLessonPracticeDayModel.lesson_id == lesson_id)
        )
        if practice:
            return True
        attempts = await self._session.scalar(
            select(func.count())
            .select_from(ExerciseAttemptModel)
            .join(ExerciseModel, ExerciseAttemptModel.exercise_id == ExerciseModel.id)
            .where(ExerciseModel.lesson_id == lesson_id)
        )
        return bool(attempts)

    async def exercise_has_user_data(self, exercise_id: str) -> bool:
        attempts = await self._session.scalar(
            select(func.count())
            .select_from(ExerciseAttemptModel)
            .where(ExerciseAttemptModel.exercise_id == exercise_id)
        )
        return bool(attempts)

    async def unit_has_user_data(self, unit_id: str) -> bool:
        result = await self._session.execute(
            select(LessonModel.id).where(LessonModel.unit_id == unit_id)
        )
        for (lesson_id,) in result.all():
            if await self.lesson_has_user_data(lesson_id):
                return True
        return False

    # --- Internal helpers -----------------------------------------------

    async def _exists(self, model, pk: str) -> bool:
        found = await self._session.scalar(select(model.id).where(model.id == pk))
        return found is not None

    async def _next_sort_order(self, model, **filters) -> int:
        statement = select(func.coalesce(func.max(model.sort_order), -1))
        for column, value in filters.items():
            statement = statement.where(getattr(model, column) == value)
        current_max = await self._session.scalar(statement)
        return (current_max if current_max is not None else -1) + 1

    async def _reorder(self, model, ordered_ids: list[str], *where) -> None:
        """Reassign sort_order to match the given id order. Two passes with a
        large temporary offset avoid transient unique-constraint collisions."""
        offset = 1_000_000
        for index, item_id in enumerate(ordered_ids):
            statement = (
                update(model)
                .where(model.id == item_id, *where)
                .values(sort_order=offset + index)
            )
            await self._session.execute(statement)
        await self._session.flush()
        for index, item_id in enumerate(ordered_ids):
            statement = (
                update(model)
                .where(model.id == item_id, *where)
                .values(sort_order=index)
            )
            await self._session.execute(statement)
        await self._session.flush()
