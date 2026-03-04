"""Fix GRN foreign key constraint in inventory table

Revision ID: fix_grn_foreign_key
Revises: 1f168128b360  # or the latest revision
Create Date: 2026-01-29 10:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fix_grn_foreign_key'
down_revision = '1f168128b360'  # Update this to your latest revision
branch_labels = None
depends_on = None


def upgrade():
    # Drop the existing foreign key constraint
    op.drop_constraint('inventory_grn_id_fkey', 'inventory', type_='foreignkey')
    
    # Add the corrected foreign key constraint
    op.create_foreign_key(
        'inventory_grn_id_fkey', 'inventory', 'goods_received_notes',
        ['grn_id'], ['id']
    )


def downgrade():
    # Revert back to the old constraint
    op.drop_constraint('inventory_grn_id_fkey', 'inventory', type_='foreignkey')
    
    op.create_foreign_key(
        'inventory_grn_id_fkey', 'inventory', 'goods_receipt_notes',
        ['grn_id'], ['id']
    )
