from __future__ import annotations

from uuid import UUID

from app.application.services.gamification_service import (
    get_challenge_progress_value,
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

    async def claim_challenge(self, user_id: UUID, challenge_id: str) -> dict:
        challenge = next((c for c in CHALLENGES if c.id == challenge_id), None)
        if not challenge:
            raise ChallengeNotFoundError()
        progress = await self._uow.progress.get_by_user_id(user_id)
        if challenge_id in progress.claimed_challenge_ids:
            raise ChallengeAlreadyClaimedError()
        value = get_challenge_progress_value(challenge, progress)
        if value < challenge.target:
            raise ChallengeNotCompletedError()
        inserted = await self._uow.progress.claim_challenge(
            user_id,
            challenge_id,
            challenge.xp_reward,
        )
        if not inserted:
            raise ChallengeAlreadyClaimedError()
        progress = await self._uow.progress.get_by_user_id(user_id)
        total_xp = progress.lesson_xp + progress.challenge_xp
        return {
            "challengeId": challenge_id,
            "xpReward": challenge.xp_reward,
            "totalXp": total_xp,
            "claimedChallengeIds": progress.claimed_challenge_ids,
            "level": get_level_progress(total_xp),
        }
