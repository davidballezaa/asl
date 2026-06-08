from __future__ import annotations

from uuid import UUID

from app.application.services.gamification_service import (
    XP_LESSON_BONUS,
    XP_PER_EXERCISE,
    get_active_lesson_id,
    get_claimed_challenge_xp,
    get_level_progress,
    is_lesson_locked,
    record_practice_day,
    reset_daily_counter_if_needed,
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
        progress = await self._uow.progress.get_by_user_id(user_id)
        if not progress:
            raise LessonNotFoundError()
        correct_answer = exercise.correct_answer or exercise.sign_word
        correct = answer.strip().upper() == correct_answer.strip().upper()
        if not correct and progress.hearts > 0:
            progress.hearts -= 1
            await self._uow.progress.save(progress)
        return {
            "correct": correct,
            "correctAnswer": correct_answer,
            "heartsRemaining": progress.hearts,
        }

    async def complete_lesson(self, user_id: UUID, lesson_id: str) -> dict:
        lesson = await self._uow.curriculum.get_lesson(lesson_id)
        if not lesson:
            raise LessonNotFoundError()
        progress = await self._uow.progress.get_by_user_id(user_id)
        if not progress:
            raise LessonNotFoundError()
        all_ids = await self._uow.curriculum.get_all_lesson_ids_in_order()
        if is_lesson_locked(lesson_id, progress.completed_lesson_ids, all_ids):
            raise LessonLockedError()
        reset_daily_counter_if_needed(progress)
        xp_earned = 0
        if lesson_id not in progress.completed_lesson_ids:
            exercise_count = len(lesson.exercises)
            xp_earned = exercise_count * XP_PER_EXERCISE + XP_LESSON_BONUS + lesson.xp_reward
            progress.lesson_xp += xp_earned
            progress.completed_lesson_ids.append(lesson_id)
            progress.lessons_completed_today += 1
            record_practice_day(progress)
            await self._uow.progress.save(progress)
        challenge_xp = get_claimed_challenge_xp(progress.claimed_challenge_ids)
        total_xp = progress.lesson_xp + challenge_xp
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
