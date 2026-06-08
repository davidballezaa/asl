from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.sql.base import Base


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    profile: Mapped["UserProfileModel"] = relationship(back_populates="user")
    progress: Mapped["UserProgressModel"] = relationship(back_populates="user")


class UserProfileModel(Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), primary_key=True
    )
    username: Mapped[str] = mapped_column(String(100))
    initials: Mapped[str] = mapped_column(String(10))
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    user: Mapped[UserModel] = relationship(back_populates="profile")


class UserProgressModel(Base):
    __tablename__ = "user_progress"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), primary_key=True
    )
    lesson_xp: Mapped[int] = mapped_column(Integer, default=0)
    hearts: Mapped[int] = mapped_column(Integer, default=5)
    lessons_completed_today: Mapped[int] = mapped_column(Integer, default=0)
    lessons_today_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    camera_passes: Mapped[int] = mapped_column(Integer, default=0)
    letters_learned: Mapped[int] = mapped_column(Integer, default=0)
    completed_lesson_ids: Mapped[str] = mapped_column(Text, default="[]")
    claimed_challenge_ids: Mapped[str] = mapped_column(Text, default="[]")
    practice_days: Mapped[str] = mapped_column(Text, default="[]")

    user: Mapped[UserModel] = relationship(back_populates="progress")


class UnitModel(Base):
    __tablename__ = "units"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    lessons: Mapped[list["LessonModel"]] = relationship(back_populates="unit")


class LessonModel(Base):
    __tablename__ = "lessons"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    unit_id: Mapped[str] = mapped_column(ForeignKey("units.id"))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    xp_reward: Mapped[int] = mapped_column(Integer)
    youtube_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    unit: Mapped[UnitModel] = relationship(back_populates="lessons")
    exercises: Mapped[list["ExerciseModel"]] = relationship(back_populates="lesson")


class ExerciseModel(Base):
    __tablename__ = "exercises"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    lesson_id: Mapped[str] = mapped_column(ForeignKey("lessons.id"))
    type: Mapped[str] = mapped_column(String(20))
    sign_word: Mapped[str] = mapped_column(String(50))
    sign_description: Mapped[str] = mapped_column(Text)
    content_type: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    options_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    correct_answer: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    lesson: Mapped[LessonModel] = relationship(back_populates="exercises")
