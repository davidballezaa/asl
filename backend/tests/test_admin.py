from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_me_exposes_role(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/me", headers=auth_headers)
    assert response.json()["user"]["role"] == "user"


@pytest.mark.asyncio
async def test_admin_routes_forbidden_for_regular_user(
    client: AsyncClient, auth_headers: dict
):
    for path in ("/api/v1/admin/curriculum", "/api/v1/admin/metrics/overview"):
        response = await client.get(path, headers=auth_headers)
        assert response.status_code == 403

    create = await client.post(
        "/api/v1/admin/units",
        headers=auth_headers,
        json={"title": "X", "description": "Y"},
    )
    assert create.status_code == 403


@pytest.mark.asyncio
async def test_admin_routes_require_authentication(client: AsyncClient):
    response = await client.get("/api/v1/admin/curriculum")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_admin_can_see_role(client: AsyncClient, admin_headers: dict):
    response = await client.get("/api/v1/me", headers=admin_headers)
    assert response.json()["user"]["role"] == "admin"


@pytest.mark.asyncio
async def test_admin_curriculum_crud(client: AsyncClient, admin_headers: dict):
    # Create a unit
    unit = await client.post(
        "/api/v1/admin/units",
        headers=admin_headers,
        json={"title": "New Unit", "description": "Desc"},
    )
    assert unit.status_code == 201
    unit_id = unit.json()["id"]

    # Create a lesson under it
    lesson = await client.post(
        "/api/v1/admin/lessons",
        headers=admin_headers,
        json={
            "unitId": unit_id,
            "title": "New Lesson",
            "description": "Desc",
            "xpReward": 10,
            "youtubeId": None,
        },
    )
    assert lesson.status_code == 201
    lesson_id = lesson.json()["id"]

    # Create a quiz exercise with an image_url
    exercise = await client.post(
        "/api/v1/admin/exercises",
        headers=admin_headers,
        json={
            "lessonId": lesson_id,
            "type": "quiz",
            "signWord": "HELLO",
            "signDescription": "wave",
            "contentType": "name",
            "imageUrl": "https://example.com/hello.png",
        },
    )
    assert exercise.status_code == 201
    exercise_id = exercise.json()["id"]
    assert exercise.json()["imageUrl"] == "https://example.com/hello.png"

    # Set options (exactly one correct)
    options = await client.put(
        f"/api/v1/admin/exercises/{exercise_id}/options",
        headers=admin_headers,
        json={
            "options": [
                {"value": "HELLO", "isCorrect": True},
                {"value": "BYE", "isCorrect": False},
            ]
        },
    )
    assert options.status_code == 200

    # Read the full tree and verify it is all there in order
    tree = await client.get("/api/v1/admin/curriculum", headers=admin_headers)
    units = tree.json()["units"]
    created = next(u for u in units if u["id"] == unit_id)
    created_lesson = created["lessons"][0]
    assert created_lesson["id"] == lesson_id
    created_exercise = created_lesson["exercises"][0]
    assert created_exercise["imageUrl"] == "https://example.com/hello.png"
    assert [o["value"] for o in created_exercise["options"]] == ["HELLO", "BYE"]
    assert [o["isCorrect"] for o in created_exercise["options"]] == [True, False]

    # Update the lesson
    update = await client.patch(
        f"/api/v1/admin/lessons/{lesson_id}",
        headers=admin_headers,
        json={
            "title": "Renamed",
            "description": "Desc",
            "xpReward": 20,
            "youtubeId": "abc123",
        },
    )
    assert update.status_code == 200

    # Delete the exercise, then the lesson, then the unit (no user data yet)
    assert (
        await client.delete(
            f"/api/v1/admin/exercises/{exercise_id}", headers=admin_headers
        )
    ).status_code == 200
    assert (
        await client.delete(
            f"/api/v1/admin/lessons/{lesson_id}", headers=admin_headers
        )
    ).status_code == 200
    assert (
        await client.delete(
            f"/api/v1/admin/units/{unit_id}", headers=admin_headers
        )
    ).status_code == 200


@pytest.mark.asyncio
async def test_options_require_exactly_one_correct(
    client: AsyncClient, admin_headers: dict
):
    unit = await client.post(
        "/api/v1/admin/units",
        headers=admin_headers,
        json={"title": "U", "description": "D"},
    )
    lesson = await client.post(
        "/api/v1/admin/lessons",
        headers=admin_headers,
        json={
            "unitId": unit.json()["id"],
            "title": "L",
            "description": "D",
            "xpReward": 5,
            "youtubeId": None,
        },
    )
    exercise = await client.post(
        "/api/v1/admin/exercises",
        headers=admin_headers,
        json={
            "lessonId": lesson.json()["id"],
            "type": "quiz",
            "signWord": "A",
            "signDescription": "a",
            "contentType": "letter",
            "imageUrl": None,
        },
    )
    exercise_id = exercise.json()["id"]

    two_correct = await client.put(
        f"/api/v1/admin/exercises/{exercise_id}/options",
        headers=admin_headers,
        json={
            "options": [
                {"value": "A", "isCorrect": True},
                {"value": "B", "isCorrect": True},
            ]
        },
    )
    assert two_correct.status_code == 400


@pytest.mark.asyncio
async def test_delete_blocked_when_referenced_by_user_progress(
    client: AsyncClient, admin_headers: dict
):
    # Completing lesson-1 records a completion + practice day for the admin user.
    completed = await client.post(
        "/api/v1/lessons/lesson-1/complete", headers=admin_headers
    )
    assert completed.status_code == 200

    blocked = await client.delete(
        "/api/v1/admin/lessons/lesson-1", headers=admin_headers
    )
    assert blocked.status_code == 409


@pytest.mark.asyncio
async def test_metrics_overview_shape_has_no_pii(
    client: AsyncClient, admin_headers: dict
):
    await client.post("/api/v1/lessons/lesson-1/complete", headers=admin_headers)

    response = await client.get(
        "/api/v1/admin/metrics/overview", headers=admin_headers
    )
    assert response.status_code == 200
    data = response.json()
    for key in (
        "totalUsers",
        "newSignups7d",
        "activeUsers7d",
        "totalLessonsCompleted",
        "proSubscribers",
        "freeUsers",
        "proConversionRate",
        "userGrowth",
        "lessonCompletions",
        "hardestQuizzes",
    ):
        assert key in data
    assert data["totalUsers"] >= 1
    assert data["totalLessonsCompleted"] >= 1
    assert len(data["userGrowth"]) == 90
    assert "date" in data["userGrowth"][0]
    assert "totalUsers" in data["userGrowth"][0]
    assert "proUsers" in data["userGrowth"][0]
    assert data["userGrowth"][-1]["totalUsers"] == data["totalUsers"]

    # No personally identifiable information anywhere in the payload.
    body = response.text
    assert "admin@example.com" not in body
    assert "password" not in body
    assert "email" not in body
