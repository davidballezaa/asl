from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select

from app.infrastructure.db.sql.models import (
    ExerciseAttemptModel,
    ExerciseOptionModel,
    UserLessonCompletionModel,
    UserLessonPracticeDayModel,
)
from app.infrastructure.db.sql.session import get_async_session_factory


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    reg = await client.post(
        "/api/v1/auth/register",
        json={"name": "Esme", "email": "esme@example.com", "password": "password1"},
    )
    assert reg.status_code == 201
    data = reg.json()
    assert "token" in data
    assert data["user"]["email"] == "esme@example.com"

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "esme@example.com", "password": "password1"},
    )
    assert login.status_code == 200

    duplicate = await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Other Esme",
            "email": "ESME@example.com",
            "password": "password2",
        },
    )
    assert duplicate.status_code == 409


@pytest.mark.asyncio
async def test_me(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["name"] == "Test User"
    assert data["subscription"]["plan"] == "free"
    assert "lessonXp" in data["progress"]


@pytest.mark.asyncio
async def test_billing_plans_are_seeded(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/billing/plans", headers=auth_headers)
    assert response.status_code == 200
    plans = response.json()["plans"]
    ids = [plan["id"] for plan in plans]
    assert ids == ["free", "pro"]
    pro = next(plan for plan in plans if plan["id"] == "pro")
    assert pro["priceCents"] == 999
    assert pro["interval"] == "month"


@pytest.mark.asyncio
async def test_checkout_upgrades_to_pro_and_cancel_reverts(
    client: AsyncClient, auth_headers: dict
):
    # New users default to free with no subscription row.
    me = await client.get("/api/v1/me", headers=auth_headers)
    assert me.json()["subscription"]["plan"] == "free"

    checkout = await client.post("/api/v1/billing/checkout", headers=auth_headers)
    assert checkout.status_code == 200
    assert checkout.json() == {"plan": "pro", "status": "active"}

    me = await client.get("/api/v1/me", headers=auth_headers)
    assert me.json()["subscription"]["plan"] == "pro"

    cancel = await client.post("/api/v1/billing/cancel", headers=auth_headers)
    assert cancel.status_code == 200

    me = await client.get("/api/v1/me", headers=auth_headers)
    assert me.json()["subscription"]["plan"] == "free"


@pytest.mark.asyncio
async def test_curriculum(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/curriculum/units", headers=auth_headers)
    assert response.status_code == 200
    units = response.json()["units"]
    assert len(units) == 3
    assert units[0]["lessons"][0]["id"] == "lesson-1"


@pytest.mark.asyncio
async def test_lesson_detail(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/lessons/lesson-1", headers=auth_headers)
    assert response.status_code == 200
    lesson = response.json()["lesson"]
    assert len(lesson["exercises"]) > 0


@pytest.mark.asyncio
async def test_complete_lesson(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/api/v1/lessons/lesson-1/complete",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "lesson-1" in data["completedLessonIds"]
    assert data["xpEarned"] > 0

    duplicate = await client.post(
        "/api/v1/lessons/lesson-1/complete",
        headers=auth_headers,
    )
    assert duplicate.status_code == 200
    assert duplicate.json()["xpEarned"] == 0
    assert duplicate.json()["totalXp"] == data["totalXp"]

    async with get_async_session_factory()() as session:
        completion_count = await session.scalar(
            select(func.count())
            .select_from(UserLessonCompletionModel)
            .where(UserLessonCompletionModel.lesson_id == "lesson-1")
        )
        practice_count = await session.scalar(
            select(func.count())
            .select_from(UserLessonPracticeDayModel)
            .where(UserLessonPracticeDayModel.lesson_id == "lesson-1")
        )
    assert completion_count == 1
    assert practice_count == 1


@pytest.mark.asyncio
async def test_quiz_attempt_is_audited(
    client: AsyncClient, auth_headers: dict
):
    response = await client.post(
        "/api/v1/lessons/lesson-1/exercises/quiz-b/attempt",
        headers=auth_headers,
        json={"answer": "Z"},
    )
    assert response.status_code == 200
    assert response.json() == {
        "correct": False,
        "correctAnswer": "B",
    }
    for _ in range(5):
        await client.post(
            "/api/v1/lessons/lesson-1/exercises/quiz-b/attempt",
            headers=auth_headers,
            json={"answer": "Z"},
        )

    async with get_async_session_factory()() as session:
        attempts = (
            await session.execute(
                select(ExerciseAttemptModel).where(
                    ExerciseAttemptModel.exercise_id == "quiz-b"
                )
            )
        ).scalars().all()

    assert len(attempts) == 6
    assert all(attempt.attempt_type == "quiz" for attempt in attempts)
    assert all(attempt.submitted_answer == "Z" for attempt in attempts)
    assert all(attempt.is_correct is False for attempt in attempts)


@pytest.mark.asyncio
async def test_quiz_options_are_normalized_and_ordered(
    client: AsyncClient, auth_headers: dict
):
    response = await client.get(
        "/api/v1/lessons/lesson-1",
        headers=auth_headers,
    )
    quiz = next(
        exercise
        for exercise in response.json()["lesson"]["exercises"]
        if exercise["id"] == "quiz-b"
    )
    assert quiz["options"] == ["B", "D", "P", "R"]
    assert quiz["correctAnswer"] == "B"

    async with get_async_session_factory()() as session:
        options = (
            (
                await session.execute(
                    select(ExerciseOptionModel)
                    .where(ExerciseOptionModel.exercise_id == "quiz-b")
                    .order_by(ExerciseOptionModel.sort_order)
                )
            )
            .scalars()
            .all()
        )
    assert [option.value for option in options] == ["B", "D", "P", "R"]
    assert [option.value for option in options if option.is_correct] == ["B"]


@pytest.mark.asyncio
async def test_attempt_type_must_match_exercise_type(
    client: AsyncClient, auth_headers: dict
):
    quiz_as_camera = await client.post(
        "/api/v1/signs/recognize",
        headers=auth_headers,
        data={
            "expected_sign": "B",
            "lesson_id": "lesson-1",
            "exercise_id": "quiz-b",
        },
        files={"image": ("test.jpg", b"fake-image", "image/jpeg")},
    )
    assert quiz_as_camera.status_code == 404

    camera_as_quiz = await client.post(
        "/api/v1/lessons/lesson-1/exercises/camera-a/attempt",
        headers=auth_headers,
        json={"answer": "A"},
    )
    assert camera_as_quiz.status_code == 404

    demo_as_quiz = await client.post(
        "/api/v1/lessons/lesson-1/exercises/demo-a/attempt",
        headers=auth_headers,
        json={"answer": "A"},
    )
    assert demo_as_quiz.status_code == 404

    async with get_async_session_factory()() as session:
        attempt_count = await session.scalar(
            select(func.count()).select_from(ExerciseAttemptModel)
        )
    assert attempt_count == 0


@pytest.mark.asyncio
async def test_skip_camera_exercise_records_skipped_attempt(
    client: AsyncClient, auth_headers: dict
):
    response = await client.post(
        "/api/v1/lessons/lesson-1/exercises/camera-a/skip",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json() == {"skipped": True}

    async with get_async_session_factory()() as session:
        attempt = (
            await session.execute(
                select(ExerciseAttemptModel).where(
                    ExerciseAttemptModel.exercise_id == "camera-a"
                )
            )
        ).scalar_one()
    assert attempt.attempt_type == "camera"
    assert attempt.is_correct is True
    assert attempt.skipped is True
    assert attempt.submitted_answer == "A"

    me = await client.get("/api/v1/me", headers=auth_headers)
    gamification = me.json()["gamification"]
    camera_challenge = next(
        c for c in gamification["challenges"] if c["category"] == "alphabet"
    )
    assert camera_challenge["progress"] == 0


@pytest.mark.asyncio
async def test_recognize_stub(client: AsyncClient, auth_headers: dict):
    responses = []
    for _ in range(3):
        responses.append(
            await client.post(
                "/api/v1/signs/recognize",
                headers=auth_headers,
                data={
                    "expected_sign": "A",
                    "lesson_id": "lesson-1",
                    "exercise_id": "camera-a",
                },
                files={"image": ("test.jpg", b"fake-image", "image/jpeg")},
            )
        )

    assert [response.status_code for response in responses] == [200, 200, 200]
    assert [response.json()["success"] for response in responses] == [
        True,
        False,
        True,
    ]
    assert responses[-1].json()["cameraPasses"] == 2

    me = await client.get("/api/v1/me", headers=auth_headers)
    gamification = me.json()["gamification"]
    camera_challenge = next(
        c for c in gamification["challenges"] if c["category"] == "alphabet"
    )
    assert camera_challenge["progress"] >= 1

    async with get_async_session_factory()() as session:
        attempts = (
            await session.execute(
                select(ExerciseAttemptModel)
                .where(ExerciseAttemptModel.exercise_id == "camera-a")
                .order_by(ExerciseAttemptModel.id)
            )
        ).scalars().all()
    assert len(attempts) == 3
    assert all(attempt.attempt_type == "camera" for attempt in attempts)
    assert [attempt.is_correct for attempt in attempts] == [True, False, True]
    assert attempts[0].confidence == pytest.approx(0.92)
