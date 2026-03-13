"""merge_heads_for_average_time

Revision ID: 0b04d4476118
Revises: 176570f8624b, add_average_time_to_shift_production
Create Date: 2026-01-27 09:26:41.397875

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0b04d4476118'
down_revision = ('176570f8624b',)
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
