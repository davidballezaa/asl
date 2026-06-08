from __future__ import annotations

import pytest
from httpx import AsyncClient


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


@pytest.mark.asyncio
async def test_me(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["name"] == "Test User"
    assert data["subscription"]["plan"] == "free"
    assert data["progress"]["hearts"] == 5


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


@pytest.mark.asyncio
async def test_recognize_stub(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/api/v1/signs/recognize",
        headers=auth_headers,
        data={
            "expected_sign": "A",
            "lesson_id": "lesson-1",
            "exercise_id": "camera-a",
        },
        files={"image": ("test.jpg", b"fake-image", "image/jpeg")},
    )
    assert response.status_code == 200
    assert "success" in response.json()
