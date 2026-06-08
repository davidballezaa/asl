from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class LevelTier:
    level: int
    title: str
    min_xp: int
    medal: str
    medal_label: str


LEVEL_TIERS: list[LevelTier] = [
    LevelTier(1, "Newbie", 0, "🥉", "Bronze starter"),
    LevelTier(2, "Beginner", 50, "🥈", "Silver beginner"),
    LevelTier(3, "Apprentice", 150, "🥇", "Gold apprentice"),
    LevelTier(4, "Explorer", 300, "🏅", "Explorer medal"),
    LevelTier(5, "Scholar", 500, "🎖️", "Scholar medal"),
    LevelTier(6, "Adept", 800, "⭐", "Adept star"),
    LevelTier(7, "Expert", 1200, "💎", "Expert gem"),
    LevelTier(8, "Master", 1800, "👑", "Master crown"),
    LevelTier(9, "Grandmaster", 2500, "🔥", "Grandmaster flame"),
    LevelTier(10, "Legend", 3500, "🌟", "Legend star"),
]
