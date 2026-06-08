from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import Annotated, Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.domain.ports.sign_recognizer import SignRecognizer
from app.domain.ports.unit_of_work import UnitOfWork
from app.infrastructure.auth.jwt import decode_access_token
from app.infrastructure.db.factory import get_unit_of_work
from app.infrastructure.recognition.factory import get_sign_recognizer

security = HTTPBearer(auto_error=False)


async def get_uow() -> AsyncGenerator[UnitOfWork, None]:
    async for uow in get_unit_of_work():
        yield uow


async def get_current_user_id(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
) -> UUID:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    user_id = decode_access_token(credentials.credentials)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return user_id


def get_recognizer() -> SignRecognizer:
    return get_sign_recognizer()
