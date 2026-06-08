from __future__ import annotations

from uuid import UUID

from app.application.services.gamification_service import (
    build_challenge_progress_list,
    get_claimed_challenge_xp,
    get_challenge_progress_value,
    get_current_streak,
    get_level_progress,
)
from app.domain.challenges import CHALLENGES
from app.domain.ports.unit_of_work import UnitOfWork


class ChallengeNotFoundError(Exception):
    pass


class ChallengeNotCompletedError(Exception):
    pass


class ChallengeAlreadyClaimedError(Exception):
    pass


class ChallengeService:
    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def list_challenges(self, user_id: UUID) -> dict:
        progress = await self._uow.progress.get_by_user_id(user_id)
        if not progress:
            raise ChallengeNotFoundError()
        streak = get_current_streak(progress.practice_days)
        return {
            "challenges": build_challenge_progress_list(progress),
            "context": {
                "streakDays": streak,
                "lettersLearned": progress.letters_learned,
                "lessonsCompletedToday": progress.lessons_completed_today,
                "cameraPasses": progress.camera_passes,
            },
        }

    async def claim_challenge(self, user_id: UUID, challenge_id: str) -> dict:
        challenge = next((c for c in CHALLENGES if c.id == challenge_id), None)
        if not challenge:
            raise ChallengeNotFoundError()
        progress = await self._uow.progress.get_by_user_id(user_id)
        if not progress:
            raise ChallengeNotFoundError()
        if challenge_id in progress.claimed_challenge_ids:
            raise ChallengeAlreadyClaimedError()
        value = get_challenge_progress_value(challenge, progress)
        if value < challenge.target:
            raise ChallengeNotCompletedError()
        progress.claimed_challenge_ids.append(challenge_id)
        await self._uow.progress.save(progress)
        challenge_xp = get_claimed_challenge_xp(progress.claimed_challenge_ids)
        total_xp = progress.lesson_xp + challenge_xp
        return {
            "challengeId": challenge_id,
            "xpReward": challenge.xp_reward,
            "totalXp": total_xp,
            "claimedChallengeIds": progress.claimed_challenge_ids,
            "level": get_level_progress(total_xp),
        }
