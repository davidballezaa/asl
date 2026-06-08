from __future__ import annotations

from uuid import UUID

from app.domain.ports.sign_recognizer import SignRecognizer
from app.domain.ports.unit_of_work import UnitOfWork


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
        result = await self._recognizer.recognize(image_bytes, expected_sign)
        progress = await self._uow.progress.get_by_user_id(user_id)
        camera_passes = progress.camera_passes if progress else 0
        if result.success and progress:
            progress.camera_passes += 1
            pair = await self._uow.curriculum.get_exercise(lesson_id, exercise_id)
            if pair:
                _, exercise = pair
                if exercise.content_type == "letter" and len(exercise.sign_word) == 1:
                    progress.letters_learned = min(26, progress.letters_learned + 1)
            await self._uow.progress.save(progress)
            camera_passes = progress.camera_passes
        return {
            "success": result.success,
            "confidence": result.confidence,
            "predictedSign": result.predicted_sign,
            "error": result.error,
            "cameraPasses": camera_passes,
        }
