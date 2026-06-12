from __future__ import annotations

import asyncio
import os
import tempfile
from collections.abc import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

_test_db = os.path.join(tempfile.gettempdir(), "asl_test.db")
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_test_db}"
os.environ["JWT_SECRET"] = "test-secret"

from app.config import get_settings

get_settings.cache_clear()

from sqlalchemy import update

from app.main import app
from app.infrastructure.db.sql.models import UserModel
from app.infrastructure.db.sql.session import (
    create_tables,
    dispose_engine,
    get_async_session_factory,
)
from app.infrastructure.recognition.factory import get_sign_recognizer
from app.infrastructure.security.rate_limit import (
    rate_limiter,
    recognition_concurrency_guard,
)
from scripts.seed_curriculum import seed


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_db() -> AsyncGenerator[None, None]:
    if os.path.exists(_test_db):
        os.remove(_test_db)
    get_settings.cache_clear()
    get_sign_recognizer.cache_clear()
    await dispose_engine()
    await create_tables()
    await seed()
    await rate_limiter.reset()
    await recognition_concurrency_guard.reset()
    app.dependency_overrides.clear()
    yield
    await rate_limiter.reset()
    await recognition_concurrency_guard.reset()
    app.dependency_overrides.clear()
    get_sign_recognizer.cache_clear()
    await dispose_engine()
    if os.path.exists(_test_db):
        os.remove(_test_db)


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient) -> dict[str, str]:
    response = await client.post(
        "/api/v1/auth/register",
        json={"name": "Test User", "email": "test@example.com", "password": "secret123"},
    )
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def admin_headers(client: AsyncClient) -> dict[str, str]:
    response = await client.post(
        "/api/v1/auth/register",
        json={"name": "Admin", "email": "admin@example.com", "password": "secret123"},
    )
    token = response.json()["token"]
    async with get_async_session_factory()() as session:
        await session.execute(
            update(UserModel)
            .where(UserModel.email == "admin@example.com")
            .values(role="admin")
        )
        await session.commit()
    return {"Authorization": f"Bearer {token}"}
