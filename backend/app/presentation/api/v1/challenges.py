from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.application.services.challenge_service import (
    ChallengeAlreadyClaimedError,
    ChallengeNotCompletedError,
    ChallengeNotFoundError,
    ChallengeService,
)
from app.domain.ports.unit_of_work import UnitOfWork
from app.presentation.deps import get_current_user_id, get_uow

router = APIRouter(prefix="/challenges", tags=["challenges"])


@router.post("/{challenge_id}/claim")
async def claim_challenge(
    challenge_id: str,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    service = ChallengeService(uow)
    try:
        return await service.claim_challenge(user_id, challenge_id)
    except ChallengeNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found")
    except ChallengeNotCompletedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Challenge not completed yet",
        )
    except ChallengeAlreadyClaimedError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Challenge already claimed",
        )
