"""Upgrade shipping module with delivery method and driver info

Revision ID: upgrade_shipping_001
Revises: 
Create Date: 2024-12-06

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'upgrade_shipping_001'
down_revision = 'a7dcc4de753d'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to shipping_orders table
    with op.batch_alter_table('shipping_orders', schema=None) as batch_op:
        # Work Order and QC links
        batch_op.add_column(sa.Column('work_order_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('qc_inspection_id', sa.Integer(), nullable=True))
        
        # Delivery Method
        batch_op.add_column(sa.Column('delivery_method', sa.String(50), nullable=True, server_default='expedition'))
        
        # Vehicle Info
        batch_op.add_column(sa.Column('vehicle_type', sa.String(100), nullable=True))
        
        # Driver Info
        batch_op.add_column(sa.Column('driver_id_number', sa.String(50), nullable=True))
        batch_op.add_column(sa.Column('driver_license_number', sa.String(50), nullable=True))
        
        # Self Pickup Info
        batch_op.add_column(sa.Column('pickup_person_name', sa.String(200), nullable=True))
        batch_op.add_column(sa.Column('pickup_person_id', sa.String(50), nullable=True))
        batch_op.add_column(sa.Column('pickup_person_phone', sa.String(50), nullable=True))
        batch_op.add_column(sa.Column('pickup_authorization', sa.Text(), nullable=True))
        
        # Additional fields
        batch_op.add_column(sa.Column('shipped_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('received_by', sa.String(200), nullable=True))
        batch_op.add_column(sa.Column('received_at', sa.DateTime(), nullable=True))
        
        # Foreign keys
        batch_op.create_foreign_key('fk_shipping_work_order', 'work_orders', ['work_order_id'], ['id'])
        batch_op.create_foreign_key('fk_shipping_qc_inspection', 'quality_inspections', ['qc_inspection_id'], ['id'])
        batch_op.create_foreign_key('fk_shipping_shipped_by', 'users', ['shipped_by'], ['id'])


def downgrade():
    with op.batch_alter_table('shipping_orders', schema=None) as batch_op:
        batch_op.drop_constraint('fk_shipping_work_order', type_='foreignkey')
        batch_op.drop_constraint('fk_shipping_qc_inspection', type_='foreignkey')
        batch_op.drop_constraint('fk_shipping_shipped_by', type_='foreignkey')
        
        batch_op.drop_column('work_order_id')
        batch_op.drop_column('qc_inspection_id')
        batch_op.drop_column('delivery_method')
        batch_op.drop_column('vehicle_type')
        batch_op.drop_column('driver_id_number')
        batch_op.drop_column('driver_license_number')
        batch_op.drop_column('pickup_person_name')
        batch_op.drop_column('pickup_person_id')
        batch_op.drop_column('pickup_person_phone')
        batch_op.drop_column('pickup_authorization')
        batch_op.drop_column('shipped_by')
        batch_op.drop_column('received_by')
        batch_op.drop_column('received_at')
