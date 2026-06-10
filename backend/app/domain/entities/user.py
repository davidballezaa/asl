from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass
class User:
    id: UUID
    email: str
    name: str
    password_hash: str
    created_at: datetime
    role: str = "user"

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"


@dataclass
class UserProfile:
    user_id: UUID
    username: str
    initials: str


@dataclass
class UserProgress:
    user_id: UUID
    lesson_xp: int = 0
    challenge_xp: int = 0
    lessons_completed_today: int = 0
    camera_passes: int = 0
    letters_learned: int = 0
    completed_lesson_ids: list[str] = field(default_factory=list)
    claimed_challenge_ids: list[str] = field(default_factory=list)
    practice_days: list[str] = field(default_factory=list)
