"""drop hearts from user_progress_state

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-10

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('user_progress_state') as batch_op:
        batch_op.drop_constraint('ck_user_progress_state_hearts_nonnegative', type_='check')
        batch_op.drop_column('hearts')


def downgrade() -> None:
    with op.batch_alter_table('user_progress_state') as batch_op:
        batch_op.add_column(sa.Column('hearts', sa.Integer(), nullable=False, server_default='5'))
        batch_op.create_check_constraint(
            'ck_user_progress_state_hearts_nonnegative', 'hearts >= 0'
        )
