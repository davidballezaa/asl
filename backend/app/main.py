from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.infrastructure.db.sql.session import create_tables
from app.presentation.api.v1.router import api_router
from scripts.seed_curriculum import seed as seed_curriculum


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await create_tables()
    await seed_curriculum()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="ASL Learning API", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    app.include_router(api_router, prefix=settings.api_prefix)
    return app


app = create_app()
