"""add pack_per_carton to bill_of_materials

Revision ID: add_pack_per_carton
Revises: 
Create Date: 2025-11-06 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_pack_per_carton'
down_revision = None  # Update this with your latest migration ID
branch_labels = None
depends_on = None


def upgrade():
    # Add pack_per_carton column to bill_of_materials table
    # SQLite doesn't support ALTER COLUMN, so we keep server_default
    op.add_column('bill_of_materials', 
        sa.Column('pack_per_carton', sa.Integer(), nullable=False, server_default='1')
    )


def downgrade():
    # Remove pack_per_carton column
    op.drop_column('bill_of_materials', 'pack_per_carton')
