"""Add QC to Warehouse fields

Revision ID: add_qc_warehouse_001
Revises: upgrade_shipping_001
Create Date: 2024-12-06

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_qc_warehouse_001'
down_revision = 'upgrade_shipping_001'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to inventory table
    with op.batch_alter_table('inventory', schema=None) as batch_op:
        batch_op.add_column(sa.Column('stock_status', sa.String(20), nullable=True, server_default='released'))
        batch_op.add_column(sa.Column('qc_inspection_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('work_order_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('qc_date', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('qc_notes', sa.Text(), nullable=True))
        
        batch_op.create_foreign_key('fk_inventory_qc_inspection', 'quality_inspections', ['qc_inspection_id'], ['id'])
        batch_op.create_foreign_key('fk_inventory_work_order', 'work_orders', ['work_order_id'], ['id'])
    
    # Add new columns to quality_inspections table
    with op.batch_alter_table('quality_inspections', schema=None) as batch_op:
        batch_op.add_column(sa.Column('work_order_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('total_checklist_items', sa.Integer(), server_default='0'))
        batch_op.add_column(sa.Column('passed_checklist_items', sa.Integer(), server_default='0'))
        batch_op.add_column(sa.Column('failed_checklist_items', sa.Integer(), server_default='0'))
        batch_op.add_column(sa.Column('quantity_inspected', sa.Numeric(15, 2), nullable=True))
        batch_op.add_column(sa.Column('quantity_passed', sa.Numeric(15, 2), nullable=True))
        batch_op.add_column(sa.Column('quantity_failed', sa.Numeric(15, 2), nullable=True))
        batch_op.add_column(sa.Column('disposition', sa.String(20), nullable=True))
        batch_op.add_column(sa.Column('disposition_date', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('disposition_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('disposition_notes', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('transferred_to_warehouse', sa.Boolean(), server_default='0'))
        batch_op.add_column(sa.Column('warehouse_transfer_date', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('warehouse_location_id', sa.Integer(), nullable=True))
        
        batch_op.create_foreign_key('fk_qc_work_order', 'work_orders', ['work_order_id'], ['id'])
        batch_op.create_foreign_key('fk_qc_disposition_by', 'users', ['disposition_by'], ['id'])
        batch_op.create_foreign_key('fk_qc_warehouse_location', 'warehouse_locations', ['warehouse_location_id'], ['id'])


def downgrade():
    with op.batch_alter_table('quality_inspections', schema=None) as batch_op:
        batch_op.drop_constraint('fk_qc_work_order', type_='foreignkey')
        batch_op.drop_constraint('fk_qc_disposition_by', type_='foreignkey')
        batch_op.drop_constraint('fk_qc_warehouse_location', type_='foreignkey')
        
        batch_op.drop_column('work_order_id')
        batch_op.drop_column('total_checklist_items')
        batch_op.drop_column('passed_checklist_items')
        batch_op.drop_column('failed_checklist_items')
        batch_op.drop_column('quantity_inspected')
        batch_op.drop_column('quantity_passed')
        batch_op.drop_column('quantity_failed')
        batch_op.drop_column('disposition')
        batch_op.drop_column('disposition_date')
        batch_op.drop_column('disposition_by')
        batch_op.drop_column('disposition_notes')
        batch_op.drop_column('transferred_to_warehouse')
        batch_op.drop_column('warehouse_transfer_date')
        batch_op.drop_column('warehouse_location_id')
    
    with op.batch_alter_table('inventory', schema=None) as batch_op:
        batch_op.drop_constraint('fk_inventory_qc_inspection', type_='foreignkey')
        batch_op.drop_constraint('fk_inventory_work_order', type_='foreignkey')
        
        batch_op.drop_column('stock_status')
        batch_op.drop_column('qc_inspection_id')
        batch_op.drop_column('work_order_id')
        batch_op.drop_column('qc_date')
        batch_op.drop_column('qc_notes')
