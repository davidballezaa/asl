"""drop photo_url from user_profiles

Revision ID: a1b2c3d4e5f6
Revises: 4e55865df366
Create Date: 2026-06-10

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '4e55865df366'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('user_profiles', 'photo_url')


def downgrade() -> None:
    op.add_column(
        'user_profiles',
        sa.Column('photo_url', sa.String(length=500), nullable=True),
    )
