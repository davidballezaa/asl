from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from app.domain.challenges import CHALLENGES, ChallengeDef
from app.domain.entities.user import UserProgress
from app.domain.level_tiers import LEVEL_TIERS, LevelTier

XP_PER_EXERCISE = 10
XP_LESSON_BONUS = 20


def to_date_key(d: date) -> str:
    return d.strftime("%Y-%m-%d")


def get_current_streak(practice_days: list[str]) -> int:
    if not practice_days:
        return 0
    practice_day_keys = set(practice_days)
    today = datetime.now(timezone.utc).date()
    check = today if to_date_key(today) in practice_day_keys else today - timedelta(days=1)
    streak = 0
    while to_date_key(check) in practice_day_keys:
        streak += 1
        check -= timedelta(days=1)
    return streak


def get_level_progress(total_xp: int) -> dict:
    current = LEVEL_TIERS[0]
    next_tier: LevelTier | None = LEVEL_TIERS[1] if len(LEVEL_TIERS) > 1 else None
    for i in range(len(LEVEL_TIERS) - 1, -1, -1):
        if total_xp >= LEVEL_TIERS[i].min_xp:
            current = LEVEL_TIERS[i]
            next_tier = LEVEL_TIERS[i + 1] if i + 1 < len(LEVEL_TIERS) else None
            break
    xp_into = total_xp - current.min_xp
    xp_for_next = next_tier.min_xp - current.min_xp if next_tier else 0
    percent = (
        min(100, round((xp_into / xp_for_next) * 100)) if next_tier and xp_for_next else 100
    )
    return {
        "current": _tier_dict(current),
        "next": _tier_dict(next_tier) if next_tier else None,
        "totalXp": total_xp,
        "xpIntoLevel": xp_into,
        "xpForNextLevel": xp_for_next,
        "progressPercent": percent,
    }


def _tier_dict(tier: LevelTier) -> dict:
    return {
        "level": tier.level,
        "title": tier.title,
        "minXp": tier.min_xp,
        "medal": tier.medal,
        "medalLabel": tier.medal_label,
    }


def get_challenge_progress_value(challenge: ChallengeDef, progress: UserProgress) -> int:
    streak = get_current_streak(progress.practice_days)
    mapping = {
        "streak": streak,
        "alphabet": progress.letters_learned,
        "practice": progress.lessons_completed_today,
        "mastery": progress.camera_passes,
    }
    return mapping.get(challenge.category, 0)


def build_challenge_progress_list(progress: UserProgress) -> list[dict]:
    result = []
    for c in CHALLENGES:
        value = get_challenge_progress_value(c, progress)
        prog = min(c.target, value)
        result.append(
            {
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "xpReward": c.xp_reward,
                "icon": c.icon,
                "category": c.category,
                "progress": prog,
                "target": c.target,
                "completed": prog >= c.target,
                "claimed": c.id in progress.claimed_challenge_ids,
            }
        )
    return result


def get_active_lesson_id(completed: list[str], all_ids: list[str]) -> str:
    for lid in all_ids:
        if lid not in completed:
            return lid
    return all_ids[-1] if all_ids else "lesson-1"


def is_lesson_locked(lesson_id: str, completed: list[str], all_ids: list[str]) -> bool:
    if lesson_id not in all_ids:
        return True
    idx = all_ids.index(lesson_id)
    if idx <= 0:
        return False
    return all_ids[idx - 1] not in completed


def build_gamification_state(
    progress: UserProgress, total_lessons: int, all_ids: list[str]
) -> dict:
    total_xp = progress.lesson_xp + progress.challenge_xp
    return {
        "totalXp": total_xp,
        "level": get_level_progress(total_xp),
        "challenges": build_challenge_progress_list(progress),
        "activeLessonId": get_active_lesson_id(progress.completed_lesson_ids, all_ids),
        "streak": get_current_streak(progress.practice_days),
        "completedLessons": len(progress.completed_lesson_ids),
        "totalLessons": total_lessons,
    }
