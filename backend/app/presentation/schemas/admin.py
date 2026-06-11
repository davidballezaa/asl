from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class UnitRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)


class LessonUpdateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    xpReward: int = Field(ge=0)
    youtubeId: Optional[str] = Field(default=None, max_length=50)


class LessonCreateRequest(LessonUpdateRequest):
    unitId: str


class ExerciseUpdateRequest(BaseModel):
    type: Literal["demo", "quiz", "camera"]
    signWord: str = Field(min_length=1, max_length=50)
    signDescription: str = Field(min_length=1)
    contentType: Optional[Literal["letter", "name"]] = None
    imageUrl: Optional[str] = Field(default=None, max_length=500)


class ExerciseCreateRequest(ExerciseUpdateRequest):
    lessonId: str


class OptionItem(BaseModel):
    value: str = Field(min_length=1, max_length=255)
    isCorrect: bool


class OptionsRequest(BaseModel):
    options: list[OptionItem] = Field(default_factory=list)


class ReorderRequest(BaseModel):
    orderedIds: list[str]
