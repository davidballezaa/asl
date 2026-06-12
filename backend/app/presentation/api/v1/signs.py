from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.config import get_settings
from app.application.services.recognition_service import (
    RecognitionExerciseNotFoundError,
    RecognitionService,
)
from app.domain.ports.sign_recognizer import SignRecognizer
from app.domain.ports.unit_of_work import UnitOfWork
from app.infrastructure.security.rate_limit import (
    RateLimitRule,
    enforce_key_limit,
    recognition_concurrency_guard,
)
from app.presentation.deps import get_current_user_id, get_recognizer, get_uow

router = APIRouter(prefix="/signs", tags=["signs"])


@router.post("/recognize")
async def recognize_sign(
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    recognizer: Annotated[SignRecognizer, Depends(get_recognizer)],
    image: UploadFile = File(...),
    expected_sign: str = Form(...),
    lesson_id: str = Form(...),
    exercise_id: str = Form(...),
):
    image_bytes = await image.read()
    if len(image_bytes) > get_settings().recognition_max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="Image too large",
        )
    await enforce_key_limit(
        str(user_id),
        bucket="signs_recognize_user",
        rule=RateLimitRule(limit=12, window_seconds=60),
    )
    service = RecognitionService(uow, recognizer)
    try:
        async with recognition_concurrency_guard.acquire(
            str(user_id),
            max_per_user=1,
            max_global=4,
        ):
            return await service.recognize(
                user_id, image_bytes, expected_sign, lesson_id, exercise_id
            )
    except RecognitionExerciseNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera exercise not found",
        )
