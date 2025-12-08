"""add resource planning to sales forecast

Revision ID: add_resource_planning
Revises: 
Create Date: 2024-11-06

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_resource_planning'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add resource planning columns to sales_forecasts table
    with op.batch_alter_table('sales_forecasts', schema=None) as batch_op:
        batch_op.add_column(sa.Column('required_manpower', sa.Integer(), nullable=True, server_default='0'))
        batch_op.add_column(sa.Column('shifts_per_day', sa.Integer(), nullable=True, server_default='1'))


def downgrade():
    # Remove resource planning columns from sales_forecasts table
    with op.batch_alter_table('sales_forecasts', schema=None) as batch_op:
        batch_op.drop_column('shifts_per_day')
        batch_op.drop_column('required_manpower')
