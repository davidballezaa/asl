from __future__ import annotations

from typing import Protocol

from app.domain.entities.curriculum import Lesson, Unit


class CurriculumRepository(Protocol):
    async def list_units(self) -> list[Unit]: ...

    async def get_lesson(self, lesson_id: str) -> Lesson | None: ...

    async def get_unit_id_for_lesson(self, lesson_id: str) -> str | None: ...

    async def get_all_lesson_ids_in_order(self) -> list[str]: ...

    async def get_exercise(
        self, lesson_id: str, exercise_id: str
    ) -> tuple[Lesson, object] | None: ...
