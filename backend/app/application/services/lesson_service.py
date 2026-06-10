from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from app.application.services.gamification_service import (
    XP_LESSON_BONUS,
    XP_PER_EXERCISE,
    get_active_lesson_id,
    get_level_progress,
    is_lesson_locked,
)
from app.domain.ports.unit_of_work import UnitOfWork


class LessonNotFoundError(Exception):
    pass


class LessonLockedError(Exception):
    pass


class ExerciseNotFoundError(Exception):
    pass


class LessonService:
    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def attempt_exercise(
        self, user_id: UUID, lesson_id: str, exercise_id: str, answer: str
    ) -> dict:
        pair = await self._uow.curriculum.get_exercise(lesson_id, exercise_id)
        if not pair:
            raise ExerciseNotFoundError()
        _, exercise = pair
        if exercise.type != "quiz":
            raise ExerciseNotFoundError()
        correct_answer = exercise.correct_answer or exercise.sign_word
        correct = answer.strip().upper() == correct_answer.strip().upper()
        await self._uow.progress.record_attempt(
            user_id=user_id,
            exercise_id=exercise_id,
            attempt_type="quiz",
            submitted_answer=answer,
            is_correct=correct,
        )
        return {
            "correct": correct,
            "correctAnswer": correct_answer,
        }

    async def skip_camera_exercise(
        self, user_id: UUID, lesson_id: str, exercise_id: str
    ) -> dict:
        pair = await self._uow.curriculum.get_exercise(lesson_id, exercise_id)
        if not pair:
            raise ExerciseNotFoundError()
        _, exercise = pair
        if exercise.type != "camera":
            raise ExerciseNotFoundError()
        await self._uow.progress.record_attempt(
            user_id=user_id,
            exercise_id=exercise_id,
            attempt_type="camera",
            submitted_answer=exercise.sign_word,
            is_correct=True,
            skipped=True,
        )
        return {"skipped": True}

    async def complete_lesson(self, user_id: UUID, lesson_id: str) -> dict:
        lesson = await self._uow.curriculum.get_lesson(lesson_id)
        if not lesson:
            raise LessonNotFoundError()
        progress = await self._uow.progress.get_by_user_id(user_id)
        all_ids = await self._uow.curriculum.get_all_lesson_ids_in_order()
        if is_lesson_locked(lesson_id, progress.completed_lesson_ids, all_ids):
            raise LessonLockedError()
        exercise_count = len(lesson.exercises)
        completion_xp = (
            exercise_count * XP_PER_EXERCISE + XP_LESSON_BONUS + lesson.xp_reward
        )
        inserted = await self._uow.progress.complete_lesson(
            user_id,
            lesson_id,
            completion_xp,
        )
        await self._uow.progress.record_lesson_practice(
            user_id,
            lesson_id,
            datetime.now(timezone.utc).date(),
        )
        xp_earned = completion_xp if inserted else 0
        progress = await self._uow.progress.get_by_user_id(user_id)
        total_xp = progress.lesson_xp + progress.challenge_xp
        return {
            "xpEarned": xp_earned,
            "totalXp": total_xp,
            "lessonXp": progress.lesson_xp,
            "completedLessonIds": progress.completed_lesson_ids,
            "lessonsCompletedToday": progress.lessons_completed_today,
            "practiceDays": progress.practice_days,
            "activeLessonId": get_active_lesson_id(progress.completed_lesson_ids, all_ids),
            "level": get_level_progress(total_xp),
        }
