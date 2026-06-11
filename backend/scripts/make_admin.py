from __future__ import annotations

"""Promote a user to admin by email.

Usage: python -m scripts.make_admin <email>
"""

import asyncio
import sys

from sqlalchemy import select, update

from app.infrastructure.db.sql.models import UserModel
from app.infrastructure.db.sql.session import get_async_session_factory


async def make_admin(email: str) -> int:
    normalized = email.strip().lower()
    async with get_async_session_factory()() as session:
        result = await session.execute(
            select(UserModel.id).where(UserModel.email == normalized)
        )
        if result.scalar_one_or_none() is None:
            print(f"No user found with email {normalized!r}.")
            return 1
        await session.execute(
            update(UserModel)
            .where(UserModel.email == normalized)
            .values(role="admin")
        )
        await session.commit()
    print(f"{normalized} is now an admin.")
    return 0


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python -m scripts.make_admin <email>")
        raise SystemExit(2)
    raise SystemExit(asyncio.run(make_admin(sys.argv[1])))


if __name__ == "__main__":
    main()
