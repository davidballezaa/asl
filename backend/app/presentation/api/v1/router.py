from __future__ import annotations

from fastapi import APIRouter

from app.presentation.api.v1 import auth, challenges, curriculum, lessons, me, signs

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(me.router)
api_router.include_router(curriculum.router)
api_router.include_router(lessons.router)
api_router.include_router(challenges.router)
api_router.include_router(signs.router)
