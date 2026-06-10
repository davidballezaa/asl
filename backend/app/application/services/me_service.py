from __future__ import annotations

from uuid import UUID

from app.application.services.gamification_service import build_gamification_state
from app.domain.ports.unit_of_work import UnitOfWork
from app.domain.subscriptions import FREE_PLAN_ID


class MeService:
    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def get_me(self, user_id: UUID) -> dict | None:
        user = await self._uow.users.get_by_id(user_id)
        profile = await self._uow.profiles.get_by_user_id(user_id)
        progress = await self._uow.progress.get_by_user_id(user_id)
        if not user or not profile:
            return None
        all_ids = await self._uow.curriculum.get_all_lesson_ids_in_order()
        gamification = build_gamification_state(progress, len(all_ids), all_ids)
        subscription = await self._uow.subscriptions.get_by_user_id(user_id)
        plan = (
            subscription.plan_id
            if subscription and subscription.is_active
            else FREE_PLAN_ID
        )
        return {
            "user": {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "role": user.role,
            },
            "profile": {
                "name": user.name,
                "username": profile.username,
                "initials": profile.initials,
                "practiceDays": progress.practice_days,
            },
            "progress": {
                "completedLessonIds": progress.completed_lesson_ids,
                "lessonXp": progress.lesson_xp,
                "lessonsCompletedToday": progress.lessons_completed_today,
                "claimedChallengeIds": progress.claimed_challenge_ids,
            },
            "gamification": gamification,
            "subscription": {"plan": plan},
        }
