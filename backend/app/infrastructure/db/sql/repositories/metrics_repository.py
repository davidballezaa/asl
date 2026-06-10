from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.sql.models import (
    ExerciseAttemptModel,
    ExerciseModel,
    LessonModel,
    SubscriptionModel,
    UserLessonCompletionModel,
    UserLessonPracticeDayModel,
    UserModel,
)

_ACTIVE_SUBSCRIPTION_STATUSES = ("active", "trialing")


class SQLMetricsRepository:
    """Aggregate, non-PII business metrics. No query returns a user identity."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def overview(self) -> dict:
        now = datetime.now(timezone.utc)
        cutoff_7d = now - timedelta(days=7)
        cutoff_30d = now - timedelta(days=30)
        practice_cutoff = now.date() - timedelta(days=7)

        total_users = await self._count(UserModel)
        new_7d = await self._count(UserModel, UserModel.created_at >= cutoff_7d)
        new_30d = await self._count(UserModel, UserModel.created_at >= cutoff_30d)
        total_completions = await self._count(UserLessonCompletionModel)
        pro_subscribers = await self._count(
            SubscriptionModel,
            SubscriptionModel.status.in_(_ACTIVE_SUBSCRIPTION_STATUSES),
        )

        active_users = await self._active_user_count(cutoff_7d, practice_cutoff)
        free_users = total_users - pro_subscribers
        conversion = (
            round(pro_subscribers / total_users * 100, 1) if total_users else 0.0
        )

        return {
            "totalUsers": total_users,
            "newSignups7d": new_7d,
            "newSignups30d": new_30d,
            "activeUsers7d": active_users,
            "totalLessonsCompleted": total_completions,
            "proSubscribers": pro_subscribers,
            "freeUsers": free_users,
            "proConversionRate": conversion,
            "lessonCompletions": await self._lesson_completions(),
            "hardestQuizzes": await self._hardest_quizzes(),
        }

    async def _count(self, model, *where) -> int:
        statement = select(func.count()).select_from(model)
        for clause in where:
            statement = statement.where(clause)
        return await self._session.scalar(statement) or 0

    async def _active_user_count(self, cutoff_7d, practice_cutoff) -> int:
        user_ids: set = set()
        statements = [
            select(ExerciseAttemptModel.user_id).where(
                ExerciseAttemptModel.attempted_at >= cutoff_7d
            ),
            select(UserLessonCompletionModel.user_id).where(
                UserLessonCompletionModel.completed_at >= cutoff_7d
            ),
            select(UserLessonPracticeDayModel.user_id).where(
                UserLessonPracticeDayModel.practiced_on >= practice_cutoff
            ),
        ]
        for statement in statements:
            result = await self._session.execute(statement.distinct())
            user_ids.update(row[0] for row in result.all())
        return len(user_ids)

    async def _lesson_completions(self) -> list[dict]:
        result = await self._session.execute(
            select(
                LessonModel.id,
                LessonModel.title,
                func.count(UserLessonCompletionModel.user_id),
            )
            .outerjoin(
                UserLessonCompletionModel,
                UserLessonCompletionModel.lesson_id == LessonModel.id,
            )
            .group_by(LessonModel.id, LessonModel.title)
            .order_by(func.count(UserLessonCompletionModel.user_id).desc())
        )
        return [
            {"lessonId": lesson_id, "title": title, "completions": completions}
            for lesson_id, title, completions in result.all()
        ]

    async def _hardest_quizzes(self) -> list[dict]:
        result = await self._session.execute(
            select(
                ExerciseModel.id,
                ExerciseModel.sign_word,
                func.count(ExerciseAttemptModel.id),
                func.sum(
                    case((ExerciseAttemptModel.is_correct.is_(False), 1), else_=0)
                ),
            )
            .join(
                ExerciseAttemptModel,
                ExerciseAttemptModel.exercise_id == ExerciseModel.id,
            )
            .where(ExerciseAttemptModel.attempt_type == "quiz")
            .group_by(ExerciseModel.id, ExerciseModel.sign_word)
        )
        rows = []
        for exercise_id, sign_word, attempts, fails in result.all():
            attempts = attempts or 0
            if attempts == 0:
                continue
            rows.append(
                {
                    "exerciseId": exercise_id,
                    "signWord": sign_word,
                    "attempts": attempts,
                    "failRate": round((fails or 0) / attempts * 100, 1),
                }
            )
        rows.sort(key=lambda row: row["failRate"], reverse=True)
        return rows[:10]
