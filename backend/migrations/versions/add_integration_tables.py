"""Add integration tables - ProductionApproval and Finance links

Revision ID: add_integration_tables
Revises: 
Create Date: 2024-12-07

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_integration_tables'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create production_approvals table
    op.create_table('production_approvals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('approval_number', sa.String(50), nullable=False),
        sa.Column('work_order_id', sa.Integer(), nullable=False),
        sa.Column('wip_batch_id', sa.Integer(), nullable=True),
        
        # Production Summary
        sa.Column('quantity_produced', sa.Numeric(15, 2), nullable=False),
        sa.Column('quantity_good', sa.Numeric(15, 2), nullable=False),
        sa.Column('quantity_reject', sa.Numeric(15, 2), default=0),
        
        # Cost Summary
        sa.Column('material_cost', sa.Numeric(15, 2), default=0),
        sa.Column('labor_cost', sa.Numeric(15, 2), default=0),
        sa.Column('overhead_cost', sa.Numeric(15, 2), default=0),
        sa.Column('total_cost', sa.Numeric(15, 2), default=0),
        sa.Column('cost_per_unit', sa.Numeric(15, 4), default=0),
        
        # OEE Summary
        sa.Column('oee_score', sa.Numeric(5, 2), default=0),
        sa.Column('efficiency_rate', sa.Numeric(5, 2), default=0),
        sa.Column('quality_rate', sa.Numeric(5, 2), default=0),
        
        # Downtime Summary
        sa.Column('total_downtime_minutes', sa.Integer(), default=0),
        sa.Column('downtime_cost', sa.Numeric(15, 2), default=0),
        
        # Approval Status
        sa.Column('status', sa.String(30), default='pending'),
        
        # Manager Notes
        sa.Column('manager_notes', sa.Text(), nullable=True),
        sa.Column('adjustment_reason', sa.Text(), nullable=True),
        
        # Original values
        sa.Column('original_quantity_good', sa.Numeric(15, 2), nullable=True),
        sa.Column('original_total_cost', sa.Numeric(15, 2), nullable=True),
        
        # Approval tracking
        sa.Column('submitted_by', sa.Integer(), nullable=False),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        
        # Finance forwarding
        sa.Column('forwarded_to_finance', sa.Boolean(), default=False),
        sa.Column('forwarded_at', sa.DateTime(), nullable=True),
        sa.Column('invoice_id', sa.Integer(), nullable=True),
        
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['work_order_id'], ['work_orders.id']),
        sa.ForeignKeyConstraint(['wip_batch_id'], ['wip_batches.id']),
        sa.ForeignKeyConstraint(['submitted_by'], ['users.id']),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id']),
    )
    op.create_index('ix_production_approvals_approval_number', 'production_approvals', ['approval_number'], unique=True)
    op.create_index('ix_production_approvals_work_order_id', 'production_approvals', ['work_order_id'])
    op.create_index('ix_production_approvals_status', 'production_approvals', ['status'])
    
    # Add columns to invoices table for production link
    try:
        op.add_column('invoices', sa.Column('work_order_id', sa.Integer(), nullable=True))
        op.add_column('invoices', sa.Column('production_approval_id', sa.Integer(), nullable=True))
        op.create_foreign_key('fk_invoices_work_order', 'invoices', 'work_orders', ['work_order_id'], ['id'])
        op.create_foreign_key('fk_invoices_production_approval', 'invoices', 'production_approvals', ['production_approval_id'], ['id'])
    except Exception as e:
        print(f"Columns may already exist: {e}")
    
    # Add rd_development_id to products table
    try:
        op.add_column('products', sa.Column('rd_development_id', sa.Integer(), nullable=True))
        op.create_foreign_key('fk_products_rd_development', 'products', 'product_developments', ['rd_development_id'], ['id'])
    except Exception as e:
        print(f"Column may already exist: {e}")


def downgrade():
    # Remove foreign keys and columns from invoices
    try:
        op.drop_constraint('fk_invoices_production_approval', 'invoices', type_='foreignkey')
        op.drop_constraint('fk_invoices_work_order', 'invoices', type_='foreignkey')
        op.drop_column('invoices', 'production_approval_id')
        op.drop_column('invoices', 'work_order_id')
    except:
        pass
    
    # Remove rd_development_id from products
    try:
        op.drop_constraint('fk_products_rd_development', 'products', type_='foreignkey')
        op.drop_column('products', 'rd_development_id')
    except:
        pass
    
    # Drop production_approvals table
    op.drop_index('ix_production_approvals_status', 'production_approvals')
    op.drop_index('ix_production_approvals_work_order_id', 'production_approvals')
    op.drop_index('ix_production_approvals_approval_number', 'production_approvals')
    op.drop_table('production_approvals')
