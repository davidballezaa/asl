from __future__ import annotations

from typing import Protocol

from app.domain.entities.curriculum import Exercise, Lesson, Unit


class CurriculumRepository(Protocol):
    async def list_units(self) -> list[Unit]: ...

    async def get_lesson(self, lesson_id: str) -> Lesson | None: ...

    async def get_unit_id_for_lesson(self, lesson_id: str) -> str | None: ...

    async def get_all_lesson_ids_in_order(self) -> list[str]: ...

    async def get_exercise(
        self, lesson_id: str, exercise_id: str
    ) -> tuple[Lesson, object] | None: ...

    # Admin reads/writes
    async def get_full_curriculum(self) -> list[Unit]: ...

    async def create_unit(self, title: str, description: str) -> Unit: ...

    async def update_unit(self, unit_id: str, title: str, description: str) -> bool: ...

    async def delete_unit(self, unit_id: str) -> bool: ...

    async def create_lesson(
        self,
        unit_id: str,
        title: str,
        description: str,
        xp_reward: int,
        youtube_id: str | None,
    ) -> Lesson | None: ...

    async def update_lesson(
        self,
        lesson_id: str,
        title: str,
        description: str,
        xp_reward: int,
        youtube_id: str | None,
    ) -> bool: ...

    async def delete_lesson(self, lesson_id: str) -> bool: ...

    async def create_exercise(
        self,
        lesson_id: str,
        type_: str,
        sign_word: str,
        sign_description: str,
        content_type: str | None,
        image_url: str | None,
    ) -> Exercise | None: ...

    async def update_exercise(
        self,
        exercise_id: str,
        type_: str,
        sign_word: str,
        sign_description: str,
        content_type: str | None,
        image_url: str | None,
    ) -> bool: ...

    async def delete_exercise(self, exercise_id: str) -> bool: ...

    async def set_exercise_options(
        self, exercise_id: str, options: list[tuple[str, bool]]
    ) -> bool: ...

    async def reorder_units(self, ordered_ids: list[str]) -> None: ...

    async def reorder_lessons(self, unit_id: str, ordered_ids: list[str]) -> None: ...

    async def reorder_exercises(
        self, lesson_id: str, ordered_ids: list[str]
    ) -> None: ...

    async def lesson_has_user_data(self, lesson_id: str) -> bool: ...

    async def exercise_has_user_data(self, exercise_id: str) -> bool: ...

    async def unit_has_user_data(self, unit_id: str) -> bool: ...
