from __future__ import annotations

from datetime import date, datetime, timezone
from uuid import UUID

from sqlalchemy import case, func, select
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.user import UserProgress
from app.infrastructure.db.sql.models import (
    ExerciseAttemptModel,
    ExerciseModel,
    UserChallengeClaimModel,
    UserLessonCompletionModel,
    UserLessonPracticeDayModel,
)


class SQLProgressRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_user_id(self, user_id: UUID) -> UserProgress:
        completion_result = await self._session.execute(
            select(UserLessonCompletionModel)
            .where(UserLessonCompletionModel.user_id == user_id)
            .order_by(UserLessonCompletionModel.completed_at)
        )
        completions = list(completion_result.scalars())

        practice_result = await self._session.execute(
            select(UserLessonPracticeDayModel)
            .where(UserLessonPracticeDayModel.user_id == user_id)
            .order_by(UserLessonPracticeDayModel.practiced_on)
        )
        practice_rows = list(practice_result.scalars())

        claim_result = await self._session.execute(
            select(UserChallengeClaimModel)
            .where(UserChallengeClaimModel.user_id == user_id)
            .order_by(UserChallengeClaimModel.claimed_at)
        )
        claims = list(claim_result.scalars())

        camera_result = await self._session.execute(
            select(
                func.count(ExerciseAttemptModel.id),
                func.count(
                    func.distinct(
                        case(
                            (
                                (
                                    (ExerciseModel.content_type == "letter")
                                    & (func.length(ExerciseModel.sign_word) == 1)
                                ),
                                func.upper(ExerciseModel.sign_word),
                            ),
                            else_=None,
                        )
                    )
                ),
            )
            .join(
                ExerciseAttemptModel,
                ExerciseAttemptModel.exercise_id == ExerciseModel.id,
            )
            .where(
                ExerciseAttemptModel.user_id == user_id,
                ExerciseAttemptModel.attempt_type == "camera",
                ExerciseAttemptModel.is_correct.is_(True),
                ExerciseAttemptModel.skipped.is_(False),
            )
        )
        camera_passes, letters_learned = camera_result.one()

        today = datetime.now(timezone.utc).date()
        practice_days = sorted({practice.practiced_on for practice in practice_rows})
        return UserProgress(
            user_id=user_id,
            lesson_xp=sum(completion.xp_earned for completion in completions),
            challenge_xp=sum(claim.xp_earned for claim in claims),
            lessons_completed_today=sum(
                practice.practiced_on == today for practice in practice_rows
            ),
            camera_passes=camera_passes,
            letters_learned=letters_learned,
            completed_lesson_ids=[completion.lesson_id for completion in completions],
            claimed_challenge_ids=[claim.challenge_id for claim in claims],
            practice_days=[d.isoformat() for d in practice_days],
        )

    async def complete_lesson(
        self, user_id: UUID, lesson_id: str, xp_earned: int
    ) -> bool:
        return await self._insert_once(
            UserLessonCompletionModel,
            {
                "user_id": user_id,
                "lesson_id": lesson_id,
                "xp_earned": xp_earned,
            },
            ["user_id", "lesson_id"],
        )

    async def record_lesson_practice(
        self, user_id: UUID, lesson_id: str, practiced_on: date
    ) -> bool:
        return await self._insert_once(
            UserLessonPracticeDayModel,
            {
                "user_id": user_id,
                "lesson_id": lesson_id,
                "practiced_on": practiced_on,
            },
            ["user_id", "lesson_id", "practiced_on"],
        )

    async def claim_challenge(
        self, user_id: UUID, challenge_id: str, xp_earned: int
    ) -> bool:
        return await self._insert_once(
            UserChallengeClaimModel,
            {
                "user_id": user_id,
                "challenge_id": challenge_id,
                "xp_earned": xp_earned,
            },
            ["user_id", "challenge_id"],
        )

    async def record_attempt(
        self,
        *,
        user_id: UUID,
        exercise_id: str,
        attempt_type: str,
        is_correct: bool,
        submitted_answer: str | None = None,
        predicted_sign: str | None = None,
        confidence: float | None = None,
        skipped: bool = False,
    ) -> None:
        self._session.add(
            ExerciseAttemptModel(
                user_id=user_id,
                exercise_id=exercise_id,
                attempt_type=attempt_type,
                submitted_answer=submitted_answer,
                predicted_sign=predicted_sign,
                confidence=confidence,
                is_correct=is_correct,
                skipped=skipped,
            )
        )
        await self._session.flush()

    async def _insert_once(
        self,
        model,
        values: dict,
        conflict_columns: list[str],
    ) -> bool:
        dialect_name = self._session.get_bind().dialect.name
        if dialect_name == "postgresql":
            statement = (
                postgresql_insert(model)
                .values(**values)
                .on_conflict_do_nothing(index_elements=conflict_columns)
            )
        elif dialect_name == "sqlite":
            statement = (
                sqlite_insert(model)
                .values(**values)
                .on_conflict_do_nothing(index_elements=conflict_columns)
            )
        else:
            raise RuntimeError(
                f"Idempotent progress writes are not implemented for {dialect_name}"
            )
        result = await self._session.execute(statement)
        return result.rowcount == 1
