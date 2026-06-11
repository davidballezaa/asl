from __future__ import annotations

"""Seed demo users with historical activity for local admin dashboards.

Run after curriculum seed:
    python -m scripts.seed_demo_users

Safe to re-run: removes prior demo users first (emails ending in @demo.aslquest.local).
Dev/local only — do not run in production.
"""

import asyncio
import random
import uuid
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import delete, select

from app.domain.subscriptions import PRO_PLAN_ID
from app.infrastructure.auth.password import hash_password
from app.infrastructure.db.sql.models import (
    ExerciseAttemptModel,
    ExerciseModel,
    LessonModel,
    SubscriptionModel,
    UserLessonCompletionModel,
    UserLessonPracticeDayModel,
    UserModel,
    UserProfileModel,
)
from app.infrastructure.db.sql.session import get_async_session_factory

DEMO_EMAIL_DOMAIN = "demo.aslquest.local"
DEMO_PASSWORD = "demo123"
DEMO_USER_COUNT = 30
RANDOM_SEED = 42

# Quiz exercises that should look "hard" on the admin dashboard.
_HARD_QUIZ_FAIL_RATES: dict[str, float] = {
    "quiz-b": 0.45,
    "quiz-d": 0.35,
    "quiz-g": 0.30,
    "quiz-m": 0.28,
}

_FIRST_NAMES = (
    "Alex",
    "Blake",
    "Casey",
    "Dana",
    "Elliot",
    "Frankie",
    "Gray",
    "Harper",
    "Indigo",
    "Jules",
    "Kai",
    "Logan",
    "Morgan",
    "Noel",
    "Oakley",
    "Parker",
    "Quinn",
    "Reese",
    "Sage",
    "Taylor",
    "Uma",
    "Val",
    "Winter",
    "Xen",
    "Yael",
    "Zion",
    "Avery",
    "Brook",
    "Cameron",
    "Devon",
)


def _utc_at(day: date, hour: int = 12) -> datetime:
    return datetime.combine(day, time(hour, 0), tzinfo=timezone.utc)


def _weighted_signup_day(rng: random.Random, today: date) -> date:
    """More signups in the last 30 days than in the prior 60."""
    bucket = rng.choices(
        population=("recent", "mid", "older"),
        weights=(5, 3, 2),
        k=1,
    )[0]
    if bucket == "recent":
        offset = rng.randint(0, 29)
    elif bucket == "mid":
        offset = rng.randint(30, 59)
    else:
        offset = rng.randint(60, 89)
    return today - timedelta(days=offset)


def _lesson_count_for_user(rng: random.Random) -> int:
    roll = rng.random()
    if roll < 0.18:
        return 0
    if roll < 0.42:
        return 1
    if roll < 0.68:
        return rng.randint(2, 3)
    if roll < 0.88:
        return rng.randint(4, 5)
    return 6


def _demo_email(slug: str) -> str:
    return f"{slug}@{DEMO_EMAIL_DOMAIN}"


async def _clear_demo_users(session) -> int:
    result = await session.execute(
        select(UserModel.id).where(UserModel.email.like(f"%@{DEMO_EMAIL_DOMAIN}"))
    )
    user_ids = [row[0] for row in result.all()]
    if not user_ids:
        return 0

    await session.execute(delete(UserModel).where(UserModel.id.in_(user_ids)))
    await session.flush()
    return len(user_ids)


async def seed() -> None:
    rng = random.Random(RANDOM_SEED)
    now = datetime.now(timezone.utc)
    today = now.date()
    password_hash = hash_password(DEMO_PASSWORD)

    async with get_async_session_factory()() as session:
        lesson_rows = await session.execute(
            select(LessonModel.id, LessonModel.xp_reward).order_by(
                LessonModel.sort_order
            )
        )
        lessons = [(lesson_id, xp_reward) for lesson_id, xp_reward in lesson_rows.all()]
        if not lessons:
            raise RuntimeError(
                "No lessons found. Run `python -m scripts.seed_curriculum` first."
            )

        quiz_rows = await session.execute(
            select(ExerciseModel.id, ExerciseModel.lesson_id).where(
                ExerciseModel.type == "quiz"
            )
        )
        quizzes_by_lesson: dict[str, list[str]] = {}
        for exercise_id, lesson_id in quiz_rows.all():
            quizzes_by_lesson.setdefault(lesson_id, []).append(exercise_id)

        removed = await _clear_demo_users(session)
        if removed:
            print(f"Removed {removed} existing demo user(s).")

        pro_count = 0
        for index in range(DEMO_USER_COUNT):
            name = _FIRST_NAMES[index % len(_FIRST_NAMES)]
            slug = f"user{index + 1:02d}"
            email = _demo_email(slug)
            signup_day = _weighted_signup_day(rng, today)
            created_at = _utc_at(signup_day, hour=rng.randint(8, 20))

            user_id = uuid.uuid4()
            session.add(
                UserModel(
                    id=user_id,
                    email=email,
                    name=name,
                    password_hash=password_hash,
                    role="user",
                    created_at=created_at,
                )
            )
            session.add(
                UserProfileModel(
                    user_id=user_id,
                    username=slug,
                    initials=name[:2].upper(),
                )
            )
            await session.flush()

            lesson_count = _lesson_count_for_user(rng)
            is_pro = lesson_count >= 2 and rng.random() < 0.32
            if is_pro:
                pro_count += 1
                upgraded_day = signup_day + timedelta(days=rng.randint(3, 21))
                if upgraded_day > today:
                    upgraded_day = today
                session.add(
                    SubscriptionModel(
                        user_id=user_id,
                        plan_id=PRO_PLAN_ID,
                        status="active",
                        stripe_customer_id=f"cus_demo_{slug}",
                        stripe_subscription_id=f"sub_demo_{slug}",
                        current_period_end=_utc_at(
                            today + timedelta(days=rng.randint(10, 28))
                        ),
                        cancel_at_period_end=False,
                        created_at=_utc_at(upgraded_day, hour=10),
                        updated_at=_utc_at(upgraded_day, hour=10),
                    )
                )

            practice_days: set[tuple[str, date]] = set()
            completion_day = signup_day
            for lesson_id, xp_reward in lessons[:lesson_count]:
                completion_day += timedelta(days=rng.randint(0, 4))
                if completion_day > today:
                    completion_day = today
                completed_at = _utc_at(
                    completion_day, hour=rng.randint(9, 21)
                )
                session.add(
                    UserLessonCompletionModel(
                        user_id=user_id,
                        lesson_id=lesson_id,
                        xp_earned=xp_reward,
                        completed_at=completed_at,
                    )
                )
                practice_key = (lesson_id, completion_day)
                if practice_key not in practice_days:
                    practice_days.add(practice_key)
                    session.add(
                        UserLessonPracticeDayModel(
                            user_id=user_id,
                            lesson_id=lesson_id,
                            practiced_on=completion_day,
                            created_at=completed_at,
                        )
                    )

                for quiz_id in quizzes_by_lesson.get(lesson_id, []):
                    attempts = rng.randint(2, 5)
                    fail_rate = _HARD_QUIZ_FAIL_RATES.get(
                        quiz_id, rng.uniform(0.1, 0.25)
                    )
                    for attempt_index in range(attempts):
                        attempt_day = completion_day - timedelta(
                            days=rng.randint(0, 2)
                        )
                        attempt_at = _utc_at(
                            attempt_day,
                            hour=rng.randint(9, 22),
                        )
                        if attempt_at < created_at:
                            attempt_at = created_at + timedelta(hours=1)

                        is_correct = rng.random() > fail_rate
                        session.add(
                            ExerciseAttemptModel(
                                user_id=user_id,
                                exercise_id=quiz_id,
                                attempt_type="quiz",
                                submitted_answer="A" if is_correct else "Z",
                                is_correct=is_correct,
                                skipped=False,
                                attempted_at=attempt_at,
                            )
                        )

            # Keep a slice of users active in the last 7 days for dashboard cards.
            if rng.random() < 0.45:
                active_day = today - timedelta(days=rng.randint(0, 6))
                active_lesson_id = lessons[min(lesson_count, len(lessons) - 1)][0]
                active_practice_key = (active_lesson_id, active_day)
                if active_practice_key not in practice_days:
                    practice_days.add(active_practice_key)
                    session.add(
                        UserLessonPracticeDayModel(
                            user_id=user_id,
                            lesson_id=active_lesson_id,
                            practiced_on=active_day,
                            created_at=_utc_at(
                                active_day, hour=rng.randint(10, 20)
                            ),
                        )
                    )
                if quizzes_by_lesson.get(active_lesson_id):
                    quiz_id = rng.choice(quizzes_by_lesson[active_lesson_id])
                    session.add(
                        ExerciseAttemptModel(
                            user_id=user_id,
                            exercise_id=quiz_id,
                            attempt_type="quiz",
                            submitted_answer="A",
                            is_correct=rng.random() > 0.2,
                            skipped=False,
                            attempted_at=_utc_at(
                                active_day, hour=rng.randint(11, 19)
                            ),
                        )
                    )

            await session.flush()

        await session.commit()

    free_count = DEMO_USER_COUNT - pro_count
    print(
        f"Seeded {DEMO_USER_COUNT} demo users "
        f"({pro_count} pro, {free_count} free) with historical activity."
    )
    print(f"Demo login: {_demo_email('user01')} / {DEMO_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(seed())
