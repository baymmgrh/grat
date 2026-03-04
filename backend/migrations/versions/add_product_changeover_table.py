"""Add product changeover table

Revision ID: add_product_changeover
Revises: 
Create Date: 2025-12-08

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_product_changeover'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create product_changeovers table
    op.create_table('product_changeovers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('changeover_number', sa.String(50), nullable=False),
        sa.Column('from_work_order_id', sa.Integer(), nullable=False),
        sa.Column('to_work_order_id', sa.Integer(), nullable=True),
        sa.Column('machine_id', sa.Integer(), nullable=False),
        sa.Column('reason', sa.String(50), nullable=False),
        sa.Column('reason_detail', sa.Text(), nullable=True),
        sa.Column('from_wo_status', sa.String(30), nullable=True),
        sa.Column('from_wo_progress', sa.Numeric(15, 2), default=0),
        sa.Column('from_wo_target', sa.Numeric(15, 2), default=0),
        sa.Column('changeover_start', sa.DateTime(), nullable=False),
        sa.Column('changeover_end', sa.DateTime(), nullable=True),
        sa.Column('setup_time_minutes', sa.Integer(), default=0),
        sa.Column('status', sa.String(30), default='in_progress'),
        sa.Column('initiated_by', sa.Integer(), nullable=False),
        sa.Column('completed_by', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['from_work_order_id'], ['work_orders.id']),
        sa.ForeignKeyConstraint(['to_work_order_id'], ['work_orders.id']),
        sa.ForeignKeyConstraint(['machine_id'], ['machines.id']),
        sa.ForeignKeyConstraint(['initiated_by'], ['users.id']),
        sa.ForeignKeyConstraint(['completed_by'], ['users.id'])
    )
    
    # Create index on changeover_number
    op.create_index('ix_product_changeovers_changeover_number', 'product_changeovers', ['changeover_number'], unique=True)
    op.create_index('ix_product_changeovers_status', 'product_changeovers', ['status'])


def downgrade():
    op.drop_index('ix_product_changeovers_status')
    op.drop_index('ix_product_changeovers_changeover_number')
    op.drop_table('product_changeovers')
