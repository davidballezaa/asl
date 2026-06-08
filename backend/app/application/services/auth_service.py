from __future__ import annotations

from uuid import UUID

from app.domain.entities.user import UserProfile, UserProgress
from app.domain.ports.unit_of_work import UnitOfWork
from app.infrastructure.auth.jwt import create_access_token
from app.infrastructure.auth.password import hash_password, verify_password


class AuthError(Exception):
    pass


class EmailTakenError(AuthError):
    pass


class InvalidCredentialsError(AuthError):
    pass


def _make_username(email: str) -> str:
    return email.split("@")[0].lower()[:50]


def _make_initials(name: str) -> str:
    parts = name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return name[:1].upper() if name else "?"


class AuthService:
    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def register(self, name: str, email: str, password: str) -> tuple[str, dict]:
        existing = await self._uow.users.get_by_email(email)
        if existing:
            raise EmailTakenError("Email already registered")
        user = await self._uow.users.create(email, name, hash_password(password))
        profile = UserProfile(
            user_id=user.id,
            username=_make_username(email),
            initials=_make_initials(name),
        )
        await self._uow.profiles.create(profile)
        progress = UserProgress(user_id=user.id)
        await self._uow.progress.create(progress)
        token = create_access_token(user.id)
        return token, {"id": str(user.id), "name": user.name, "email": user.email}

    async def login(self, email: str, password: str) -> tuple[str, dict]:
        user = await self._uow.users.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise InvalidCredentialsError("Invalid email or password")
        token = create_access_token(user.id)
        return token, {"id": str(user.id), "name": user.name, "email": user.email}

    async def get_user_by_id(self, user_id: UUID) -> dict | None:
        user = await self._uow.users.get_by_id(user_id)
        if not user:
            return None
        return {"id": str(user.id), "name": user.name, "email": user.email}
