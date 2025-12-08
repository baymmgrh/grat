"""Add downtime category fields to shift_productions

Revision ID: a7dcc4de753d
Revises: a9909eeb0fd3
Create Date: 2025-12-02 09:55:05.003519

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a7dcc4de753d'
down_revision = 'a9909eeb0fd3'
branch_labels = None
depends_on = None


def upgrade():
    # Only add downtime category columns to shift_productions
    with op.batch_alter_table('shift_productions', schema=None) as batch_op:
        batch_op.add_column(sa.Column('downtime_mesin', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('downtime_operator', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('downtime_material', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('downtime_design', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('downtime_others', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('idle_time', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('loss_mesin', sa.Numeric(precision=5, scale=2), nullable=True))
        batch_op.add_column(sa.Column('loss_operator', sa.Numeric(precision=5, scale=2), nullable=True))
        batch_op.add_column(sa.Column('loss_material', sa.Numeric(precision=5, scale=2), nullable=True))
        batch_op.add_column(sa.Column('loss_design', sa.Numeric(precision=5, scale=2), nullable=True))
        batch_op.add_column(sa.Column('loss_others', sa.Numeric(precision=5, scale=2), nullable=True))
        batch_op.add_column(sa.Column('base_efficiency', sa.Numeric(precision=5, scale=2), nullable=True))


def downgrade():
    with op.batch_alter_table('shift_productions', schema=None) as batch_op:
        batch_op.drop_column('base_efficiency')
        batch_op.drop_column('loss_others')
        batch_op.drop_column('loss_design')
        batch_op.drop_column('loss_material')
        batch_op.drop_column('loss_operator')
        batch_op.drop_column('loss_mesin')
        batch_op.drop_column('idle_time')
        batch_op.drop_column('downtime_others')
        batch_op.drop_column('downtime_design')
        batch_op.drop_column('downtime_material')
        batch_op.drop_column('downtime_operator')
        batch_op.drop_column('downtime_mesin')
