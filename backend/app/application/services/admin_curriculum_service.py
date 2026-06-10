from __future__ import annotations

from app.domain.entities.curriculum import Exercise, Lesson, Unit
from app.domain.ports.unit_of_work import UnitOfWork


class CurriculumNotFoundError(Exception):
    pass


class CurriculumInUseError(Exception):
    pass


class CurriculumValidationError(Exception):
    pass


def _exercise_dict(e: Exercise) -> dict:
    return {
        "id": e.id,
        "type": e.type,
        "signWord": e.sign_word,
        "signDescription": e.sign_description,
        "contentType": e.content_type,
        "imageUrl": e.image_url,
        "options": [
            {"value": value, "isCorrect": value == e.correct_answer}
            for value in (e.options or [])
        ],
    }


def _lesson_dict(lesson: Lesson) -> dict:
    return {
        "id": lesson.id,
        "title": lesson.title,
        "description": lesson.description,
        "xpReward": lesson.xp_reward,
        "youtubeId": lesson.youtube_id,
        "exercises": [_exercise_dict(e) for e in lesson.exercises],
    }


def _unit_dict(unit: Unit) -> dict:
    return {
        "id": unit.id,
        "title": unit.title,
        "description": unit.description,
        "lessons": [_lesson_dict(lesson) for lesson in unit.lessons],
    }


class AdminCurriculumService:
    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def get_curriculum(self) -> dict:
        units = await self._uow.curriculum.get_full_curriculum()
        return {"units": [_unit_dict(u) for u in units]}

    # --- Units ----------------------------------------------------------

    async def create_unit(self, title: str, description: str) -> dict:
        unit = await self._uow.curriculum.create_unit(title, description)
        return _unit_dict(unit)

    async def update_unit(self, unit_id: str, title: str, description: str) -> None:
        if not await self._uow.curriculum.update_unit(unit_id, title, description):
            raise CurriculumNotFoundError()

    async def delete_unit(self, unit_id: str) -> None:
        if await self._uow.curriculum.unit_has_user_data(unit_id):
            raise CurriculumInUseError()
        if not await self._uow.curriculum.delete_unit(unit_id):
            raise CurriculumNotFoundError()

    async def reorder_units(self, ordered_ids: list[str]) -> None:
        await self._uow.curriculum.reorder_units(ordered_ids)

    # --- Lessons --------------------------------------------------------

    async def create_lesson(
        self,
        unit_id: str,
        title: str,
        description: str,
        xp_reward: int,
        youtube_id: str | None,
    ) -> dict:
        lesson = await self._uow.curriculum.create_lesson(
            unit_id, title, description, xp_reward, youtube_id
        )
        if lesson is None:
            raise CurriculumNotFoundError()
        return _lesson_dict(lesson)

    async def update_lesson(
        self,
        lesson_id: str,
        title: str,
        description: str,
        xp_reward: int,
        youtube_id: str | None,
    ) -> None:
        updated = await self._uow.curriculum.update_lesson(
            lesson_id, title, description, xp_reward, youtube_id
        )
        if not updated:
            raise CurriculumNotFoundError()

    async def delete_lesson(self, lesson_id: str) -> None:
        if await self._uow.curriculum.lesson_has_user_data(lesson_id):
            raise CurriculumInUseError()
        if not await self._uow.curriculum.delete_lesson(lesson_id):
            raise CurriculumNotFoundError()

    async def reorder_lessons(self, unit_id: str, ordered_ids: list[str]) -> None:
        await self._uow.curriculum.reorder_lessons(unit_id, ordered_ids)

    # --- Exercises ------------------------------------------------------

    async def create_exercise(
        self,
        lesson_id: str,
        type_: str,
        sign_word: str,
        sign_description: str,
        content_type: str | None,
        image_url: str | None,
    ) -> dict:
        exercise = await self._uow.curriculum.create_exercise(
            lesson_id, type_, sign_word, sign_description, content_type, image_url
        )
        if exercise is None:
            raise CurriculumNotFoundError()
        return _exercise_dict(exercise)

    async def update_exercise(
        self,
        exercise_id: str,
        type_: str,
        sign_word: str,
        sign_description: str,
        content_type: str | None,
        image_url: str | None,
    ) -> None:
        updated = await self._uow.curriculum.update_exercise(
            exercise_id, type_, sign_word, sign_description, content_type, image_url
        )
        if not updated:
            raise CurriculumNotFoundError()

    async def delete_exercise(self, exercise_id: str) -> None:
        if await self._uow.curriculum.exercise_has_user_data(exercise_id):
            raise CurriculumInUseError()
        if not await self._uow.curriculum.delete_exercise(exercise_id):
            raise CurriculumNotFoundError()

    async def reorder_exercises(self, lesson_id: str, ordered_ids: list[str]) -> None:
        await self._uow.curriculum.reorder_exercises(lesson_id, ordered_ids)

    async def set_exercise_options(
        self, exercise_id: str, options: list[tuple[str, bool]]
    ) -> None:
        values = [value for value, _ in options]
        if len(values) != len(set(values)):
            raise CurriculumValidationError("Option values must be unique")
        correct_count = sum(1 for _, is_correct in options if is_correct)
        if options and correct_count != 1:
            raise CurriculumValidationError("Exactly one option must be correct")
        if not await self._uow.curriculum.set_exercise_options(exercise_id, options):
            raise CurriculumNotFoundError()
