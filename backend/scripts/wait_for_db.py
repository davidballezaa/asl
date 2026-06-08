"""Wait until PostgreSQL accepts connections (used by Docker entrypoint)."""

from __future__ import annotations

import asyncio
import os
import sys

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


async def wait() -> None:
    database_url = os.environ.get("DATABASE_URL", "")
    if "postgresql" not in database_url:
        return

    engine = create_async_engine(database_url)
    for attempt in range(30):
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            await engine.dispose()
            print("PostgreSQL is ready.")
            return
        except Exception:
            if attempt == 29:
                await engine.dispose()
                print("Timed out waiting for PostgreSQL.", file=sys.stderr)
                sys.exit(1)
            await asyncio.sleep(1)


if __name__ == "__main__":
    asyncio.run(wait())
