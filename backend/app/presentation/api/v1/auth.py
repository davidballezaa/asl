from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.application.services.auth_service import (
    AuthService,
    EmailTakenError,
    InvalidCredentialsError,
)
from app.domain.ports.unit_of_work import UnitOfWork
from app.presentation.deps import get_current_user_id, get_uow
from app.presentation.schemas.auth import (
    AuthResponse,
    AuthUserResponse,
    LoginRequest,
    LogoutResponse,
    RegisterRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    service = AuthService(uow)
    try:
        token, user = await service.register(body.name, body.email, body.password)
    except EmailTakenError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    return AuthResponse(token=token, user=AuthUserResponse(**user))


@router.post("/login", response_model=AuthResponse)
async def login(
    body: LoginRequest,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    service = AuthService(uow)
    try:
        token, user = await service.login(body.email, body.password)
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return AuthResponse(token=token, user=AuthUserResponse(**user))


@router.post("/logout", response_model=LogoutResponse)
async def logout(_user_id: Annotated[str, Depends(get_current_user_id)]):
    return LogoutResponse()
