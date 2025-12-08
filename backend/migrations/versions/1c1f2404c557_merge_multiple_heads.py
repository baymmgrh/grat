"""merge multiple heads

Revision ID: 1c1f2404c557
Revises: add_production_planning, beb1ed25a90a
Create Date: 2025-11-06 15:45:49.542841

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1c1f2404c557'
down_revision = ('add_production_planning', 'beb1ed25a90a')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
