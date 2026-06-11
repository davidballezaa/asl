from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.application.services.admin_curriculum_service import (
    AdminCurriculumService,
    CurriculumInUseError,
    CurriculumNotFoundError,
    CurriculumValidationError,
)
from app.application.services.admin_metrics_service import AdminMetricsService
from app.domain.ports.unit_of_work import UnitOfWork
from app.presentation.deps import get_uow, require_admin
from app.presentation.schemas.admin import (
    ExerciseCreateRequest,
    ExerciseUpdateRequest,
    LessonCreateRequest,
    LessonUpdateRequest,
    OptionsRequest,
    ReorderRequest,
    UnitRequest,
)

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)

UowDep = Annotated[UnitOfWork, Depends(get_uow)]


def _not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")


def _in_use() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Cannot delete: referenced by user progress",
    )


# --- Metrics (non-PII aggregates) ---------------------------------------


@router.get("/metrics/overview")
async def metrics_overview(uow: UowDep):
    return await AdminMetricsService(uow).overview()


# --- Curriculum read ----------------------------------------------------


@router.get("/curriculum")
async def get_curriculum(uow: UowDep):
    return await AdminCurriculumService(uow).get_curriculum()


# --- Units --------------------------------------------------------------


@router.post("/units", status_code=status.HTTP_201_CREATED)
async def create_unit(body: UnitRequest, uow: UowDep):
    return await AdminCurriculumService(uow).create_unit(body.title, body.description)


@router.patch("/units/{unit_id}")
async def update_unit(unit_id: str, body: UnitRequest, uow: UowDep):
    try:
        await AdminCurriculumService(uow).update_unit(
            unit_id, body.title, body.description
        )
    except CurriculumNotFoundError:
        raise _not_found()
    return {"ok": True}


@router.delete("/units/{unit_id}")
async def delete_unit(unit_id: str, uow: UowDep):
    try:
        await AdminCurriculumService(uow).delete_unit(unit_id)
    except CurriculumInUseError:
        raise _in_use()
    except CurriculumNotFoundError:
        raise _not_found()
    return {"ok": True}


@router.post("/units/reorder")
async def reorder_units(body: ReorderRequest, uow: UowDep):
    await AdminCurriculumService(uow).reorder_units(body.orderedIds)
    return {"ok": True}


# --- Lessons ------------------------------------------------------------


@router.post("/lessons", status_code=status.HTTP_201_CREATED)
async def create_lesson(body: LessonCreateRequest, uow: UowDep):
    try:
        return await AdminCurriculumService(uow).create_lesson(
            body.unitId, body.title, body.description, body.xpReward, body.youtubeId
        )
    except CurriculumNotFoundError:
        raise _not_found()


@router.patch("/lessons/{lesson_id}")
async def update_lesson(lesson_id: str, body: LessonUpdateRequest, uow: UowDep):
    try:
        await AdminCurriculumService(uow).update_lesson(
            lesson_id, body.title, body.description, body.xpReward, body.youtubeId
        )
    except CurriculumNotFoundError:
        raise _not_found()
    return {"ok": True}


@router.delete("/lessons/{lesson_id}")
async def delete_lesson(lesson_id: str, uow: UowDep):
    try:
        await AdminCurriculumService(uow).delete_lesson(lesson_id)
    except CurriculumInUseError:
        raise _in_use()
    except CurriculumNotFoundError:
        raise _not_found()
    return {"ok": True}


@router.post("/units/{unit_id}/lessons/reorder")
async def reorder_lessons(unit_id: str, body: ReorderRequest, uow: UowDep):
    await AdminCurriculumService(uow).reorder_lessons(unit_id, body.orderedIds)
    return {"ok": True}


# --- Exercises ----------------------------------------------------------


@router.post("/exercises", status_code=status.HTTP_201_CREATED)
async def create_exercise(body: ExerciseCreateRequest, uow: UowDep):
    try:
        return await AdminCurriculumService(uow).create_exercise(
            body.lessonId,
            body.type,
            body.signWord,
            body.signDescription,
            body.contentType,
            body.imageUrl,
        )
    except CurriculumNotFoundError:
        raise _not_found()


@router.patch("/exercises/{exercise_id}")
async def update_exercise(
    exercise_id: str, body: ExerciseUpdateRequest, uow: UowDep
):
    try:
        await AdminCurriculumService(uow).update_exercise(
            exercise_id,
            body.type,
            body.signWord,
            body.signDescription,
            body.contentType,
            body.imageUrl,
        )
    except CurriculumNotFoundError:
        raise _not_found()
    return {"ok": True}


@router.delete("/exercises/{exercise_id}")
async def delete_exercise(exercise_id: str, uow: UowDep):
    try:
        await AdminCurriculumService(uow).delete_exercise(exercise_id)
    except CurriculumInUseError:
        raise _in_use()
    except CurriculumNotFoundError:
        raise _not_found()
    return {"ok": True}


@router.put("/exercises/{exercise_id}/options")
async def set_exercise_options(
    exercise_id: str, body: OptionsRequest, uow: UowDep
):
    options = [(item.value, item.isCorrect) for item in body.options]
    try:
        await AdminCurriculumService(uow).set_exercise_options(exercise_id, options)
    except CurriculumValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        )
    except CurriculumNotFoundError:
        raise _not_found()
    return {"ok": True}


@router.post("/lessons/{lesson_id}/exercises/reorder")
async def reorder_exercises(lesson_id: str, body: ReorderRequest, uow: UowDep):
    await AdminCurriculumService(uow).reorder_exercises(lesson_id, body.orderedIds)
    return {"ok": True}
