from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Exercise:
    id: str
    type: str
    sign_word: str
    sign_description: str
    content_type: str | None = None
    options: list[str] | None = None
    correct_answer: str | None = None
    image_url: str | None = None


@dataclass
class Lesson:
    id: str
    unit_id: str
    title: str
    description: str
    xp_reward: int
    youtube_id: str | None = None
    exercises: list[Exercise] = field(default_factory=list)
    sort_order: int = 0


@dataclass
class Unit:
    id: str
    title: str
    description: str
    lessons: list[Lesson] = field(default_factory=list)
    sort_order: int = 0
