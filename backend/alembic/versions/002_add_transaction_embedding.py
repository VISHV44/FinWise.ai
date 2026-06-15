"""add transaction embedding column for pgvector

Revision ID: 002
Revises: 001
Create Date: 2024-06-13 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')
    op.execute('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS embedding vector(768)')


def downgrade() -> None:
    op.drop_column('transactions', 'embedding')
