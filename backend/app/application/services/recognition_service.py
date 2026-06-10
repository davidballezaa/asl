from __future__ import annotations

from uuid import UUID

from app.domain.ports.sign_recognizer import SignRecognizer
from app.domain.ports.unit_of_work import UnitOfWork


class RecognitionExerciseNotFoundError(Exception):
    pass


class RecognitionService:
    def __init__(self, uow: UnitOfWork, recognizer: SignRecognizer) -> None:
        self._uow = uow
        self._recognizer = recognizer

    async def recognize(
        self,
        user_id: UUID,
        image_bytes: bytes,
        expected_sign: str,
        lesson_id: str,
        exercise_id: str,
    ) -> dict:
        pair = await self._uow.curriculum.get_exercise(lesson_id, exercise_id)
        if not pair or pair[1].type != "camera":
            raise RecognitionExerciseNotFoundError()
        result = await self._recognizer.recognize(image_bytes, expected_sign)
        await self._uow.progress.record_attempt(
            user_id=user_id,
            exercise_id=exercise_id,
            attempt_type="camera",
            submitted_answer=expected_sign,
            predicted_sign=result.predicted_sign,
            confidence=result.confidence,
            is_correct=result.success,
        )
        progress = await self._uow.progress.get_by_user_id(user_id)
        camera_passes = progress.camera_passes if progress else 0
        return {
            "success": result.success,
            "confidence": result.confidence,
            "predictedSign": result.predicted_sign,
            "error": result.error,
            "cameraPasses": camera_passes,
        }
