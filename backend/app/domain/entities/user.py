from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from uuid import UUID


@dataclass
class User:
    id: UUID
    email: str
    name: str
    password_hash: str
    created_at: datetime


@dataclass
class UserProfile:
    user_id: UUID
    username: str
    initials: str
    photo_url: str | None = None


@dataclass
class UserProgress:
    user_id: UUID
    lesson_xp: int = 0
    hearts: int = 5
    lessons_completed_today: int = 0
    lessons_today_date: date | None = None
    camera_passes: int = 0
    letters_learned: int = 0
    completed_lesson_ids: list[str] = field(default_factory=list)
    claimed_challenge_ids: list[str] = field(default_factory=list)
    practice_days: list[str] = field(default_factory=list)
