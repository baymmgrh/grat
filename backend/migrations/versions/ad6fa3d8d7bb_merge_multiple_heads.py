"""merge_multiple_heads

Revision ID: ad6fa3d8d7bb
Revises: add_integration_tables, add_product_changeover, add_qc_warehouse_001
Create Date: 2025-12-26 15:18:27.911895

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ad6fa3d8d7bb'
down_revision = ('add_integration_tables', 'add_product_changeover', 'add_qc_warehouse_001')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
