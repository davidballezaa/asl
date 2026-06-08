from __future__ import annotations

import json
from uuid import UUID

from app.domain.entities.curriculum import Exercise, Lesson, Unit
from app.domain.entities.user import User, UserProfile, UserProgress
from app.infrastructure.db.sql.models import (
    ExerciseModel,
    LessonModel,
    UnitModel,
    UserModel,
    UserProfileModel,
    UserProgressModel,
)


def user_from_model(m: UserModel) -> User:
    return User(
        id=m.id,
        email=m.email,
        name=m.name,
        password_hash=m.password_hash,
        created_at=m.created_at,
    )


def profile_from_model(m: UserProfileModel) -> UserProfile:
    return UserProfile(
        user_id=m.user_id,
        username=m.username,
        initials=m.initials,
        photo_url=m.photo_url,
    )


def progress_from_model(m: UserProgressModel) -> UserProgress:
    return UserProgress(
        user_id=m.user_id,
        lesson_xp=m.lesson_xp,
        hearts=m.hearts,
        lessons_completed_today=m.lessons_completed_today,
        lessons_today_date=m.lessons_today_date,
        camera_passes=m.camera_passes,
        letters_learned=m.letters_learned,
        completed_lesson_ids=json.loads(m.completed_lesson_ids),
        claimed_challenge_ids=json.loads(m.claimed_challenge_ids),
        practice_days=json.loads(m.practice_days),
    )


def exercise_from_model(m: ExerciseModel) -> Exercise:
    options = json.loads(m.options_json) if m.options_json else None
    return Exercise(
        id=m.id,
        type=m.type,
        sign_word=m.sign_word,
        sign_description=m.sign_description,
        content_type=m.content_type,
        options=options,
        correct_answer=m.correct_answer,
    )


def lesson_from_model(m: LessonModel, include_exercises: bool = True) -> Lesson:
    exercises = (
        [exercise_from_model(e) for e in sorted(m.exercises, key=lambda x: x.sort_order)]
        if include_exercises
        else []
    )
    return Lesson(
        id=m.id,
        unit_id=m.unit_id,
        title=m.title,
        description=m.description,
        xp_reward=m.xp_reward,
        youtube_id=m.youtube_id,
        exercises=exercises,
        sort_order=m.sort_order,
    )


def unit_from_model(m: UnitModel, include_exercises: bool = False) -> Unit:
    lessons = [
        lesson_from_model(l, include_exercises=include_exercises)
        for l in sorted(m.lessons, key=lambda x: x.sort_order)
    ]
    return Unit(
        id=m.id,
        title=m.title,
        description=m.description,
        lessons=lessons,
        sort_order=m.sort_order,
    )


def progress_to_model_fields(p: UserProgress) -> dict:
    return {
        "lesson_xp": p.lesson_xp,
        "hearts": p.hearts,
        "lessons_completed_today": p.lessons_completed_today,
        "lessons_today_date": p.lessons_today_date,
        "camera_passes": p.camera_passes,
        "letters_learned": p.letters_learned,
        "completed_lesson_ids": json.dumps(p.completed_lesson_ids),
        "claimed_challenge_ids": json.dumps(p.claimed_challenge_ids),
        "practice_days": json.dumps(p.practice_days),
    }
