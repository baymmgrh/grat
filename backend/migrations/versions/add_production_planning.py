"""add production planning (MPS)

Revision ID: add_production_planning
Revises: add_pack_per_carton
Create Date: 2025-11-06 15:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_production_planning'
down_revision = 'add_pack_per_carton'
branch_labels = None
depends_on = None


def upgrade():
    # Create production_plans table
    op.create_table('production_plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('plan_number', sa.String(length=100), nullable=False),
        sa.Column('plan_name', sa.String(length=200), nullable=False),
        sa.Column('plan_type', sa.String(length=20), nullable=False),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('period_end', sa.Date(), nullable=False),
        sa.Column('sales_forecast_id', sa.Integer(), nullable=True),
        sa.Column('based_on', sa.String(length=50), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('planned_quantity', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('uom', sa.String(length=20), nullable=False),
        sa.Column('machine_id', sa.Integer(), nullable=True),
        sa.Column('estimated_duration_hours', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('required_operators', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('priority', sa.String(length=20), nullable=False),
        sa.Column('actual_quantity', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('completion_percentage', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('approved_by', sa.Integer(), nullable=True),
        sa.Column('approved_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['machine_id'], ['machines.id'], ),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.ForeignKeyConstraint(['sales_forecast_id'], ['sales_forecasts.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('plan_number')
    )
    op.create_index('ix_production_plans_plan_number', 'production_plans', ['plan_number'])
    
    # Add production_plan_id and quantity to work_orders using batch mode for SQLite
    with op.batch_alter_table('work_orders', schema=None) as batch_op:
        batch_op.add_column(sa.Column('production_plan_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('quantity', sa.Numeric(precision=15, scale=2), nullable=True, server_default='1'))
        batch_op.create_foreign_key('fk_work_orders_production_plan', 'production_plans', ['production_plan_id'], ['id'])
    
    # Update existing work_orders to have default quantity = 1
    op.execute("UPDATE work_orders SET quantity = 1 WHERE quantity IS NULL OR quantity = 0")
    
    # Make quantity NOT NULL after setting defaults (using batch mode)
    with op.batch_alter_table('work_orders', schema=None) as batch_op:
        batch_op.alter_column('quantity', nullable=False, server_default=None)


def downgrade():
    # Remove quantity from work_orders
    op.drop_column('work_orders', 'quantity')
    
    # Remove production_plan_id from work_orders
    op.drop_constraint('fk_work_orders_production_plan', 'work_orders', type_='foreignkey')
    op.drop_column('work_orders', 'production_plan_id')
    
    # Drop production_plans table
    op.drop_index('ix_production_plans_plan_number', 'production_plans')
    op.drop_table('production_plans')
