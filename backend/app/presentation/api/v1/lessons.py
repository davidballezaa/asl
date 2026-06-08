from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.application.services.lesson_service import (
    ExerciseNotFoundError,
    LessonLockedError,
    LessonNotFoundError,
    LessonService,
)
from app.application.services.curriculum_service import CurriculumService
from app.domain.ports.unit_of_work import UnitOfWork
from app.presentation.deps import get_current_user_id, get_uow

router = APIRouter(prefix="/lessons", tags=["lessons"])


class ExerciseAttemptRequest(BaseModel):
    answer: str


@router.get("/{lesson_id}")
async def get_lesson(
    lesson_id: str,
    _user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    service = CurriculumService(uow)
    data = await service.get_lesson(lesson_id)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    return data


@router.post("/{lesson_id}/exercises/{exercise_id}/attempt")
async def attempt_exercise(
    lesson_id: str,
    exercise_id: str,
    body: ExerciseAttemptRequest,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    service = LessonService(uow)
    try:
        return await service.attempt_exercise(user_id, lesson_id, exercise_id, body.answer)
    except ExerciseNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")


@router.post("/{lesson_id}/complete")
async def complete_lesson(
    lesson_id: str,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    service = LessonService(uow)
    try:
        return await service.complete_lesson(user_id, lesson_id)
    except LessonNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    except LessonLockedError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Previous lesson must be completed first",
        )
