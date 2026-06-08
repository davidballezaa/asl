from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ChallengeDef:
    id: str
    title: str
    description: str
    xp_reward: int
    icon: str
    category: str
    target: int


CHALLENGES: list[ChallengeDef] = [
    ChallengeDef("streak-3", "3-Day Streak", "Practice 3 days in a row", 25, "🔥", "streak", 3),
    ChallengeDef("streak-7", "Week Warrior", "Maintain a 7-day streak", 75, "🔥", "streak", 7),
    ChallengeDef("alphabet-10", "First Ten", "Learn letters A through J", 50, "🔤", "alphabet", 10),
    ChallengeDef("alphabet-26", "Full Alphabet", "Complete all 26 letters", 150, "🏆", "alphabet", 26),
    ChallengeDef("practice-5", "Daily Learner", "Complete 5 lessons in one day", 40, "📚", "practice", 5),
    ChallengeDef("mastery-camera", "Camera Pro", "Pass 10 camera exercises", 60, "📷", "mastery", 10),
]
