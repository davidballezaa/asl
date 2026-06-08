from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.application.services.recognition_service import RecognitionService
from app.domain.ports.sign_recognizer import SignRecognizer
from app.domain.ports.unit_of_work import UnitOfWork
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
    service = RecognitionService(uow, recognizer)
    return await service.recognize(
        user_id, image_bytes, expected_sign, lesson_id, exercise_id
    )
