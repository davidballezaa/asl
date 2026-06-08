from __future__ import annotations

from app.domain.entities.curriculum import Exercise, Lesson
from app.domain.ports.unit_of_work import UnitOfWork


def _exercise_to_dict(e: Exercise) -> dict:
    d = {
        "id": e.id,
        "type": e.type,
        "signWord": e.sign_word,
        "signDescription": e.sign_description,
    }
    if e.content_type:
        d["contentType"] = e.content_type
    if e.options:
        d["options"] = e.options
    if e.correct_answer:
        d["correctAnswer"] = e.correct_answer
    return d


def _lesson_to_dict(lesson: Lesson, include_exercises: bool) -> dict:
    d = {
        "id": lesson.id,
        "title": lesson.title,
        "description": lesson.description,
        "xpReward": lesson.xp_reward,
    }
    if lesson.youtube_id:
        d["youtubeId"] = lesson.youtube_id
    if include_exercises:
        d["exercises"] = [_exercise_to_dict(e) for e in lesson.exercises]
    return d


class CurriculumService:
    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def list_units(self) -> dict:
        units = await self._uow.curriculum.list_units()
        return {
            "units": [
                {
                    "id": u.id,
                    "title": u.title,
                    "description": u.description,
                    "lessons": [_lesson_to_dict(l, False) for l in u.lessons],
                }
                for u in units
            ]
        }

    async def get_lesson(self, lesson_id: str) -> dict | None:
        lesson = await self._uow.curriculum.get_lesson(lesson_id)
        if not lesson:
            return None
        unit_id = await self._uow.curriculum.get_unit_id_for_lesson(lesson_id)
        return {
            "lesson": _lesson_to_dict(lesson, True),
            "unitId": unit_id,
        }
