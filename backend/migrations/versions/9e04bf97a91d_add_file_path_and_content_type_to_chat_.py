"""Add file_path and content_type to chat_attachments

Revision ID: 9e04bf97a91d
Revises: 3877dce6f9e6
Create Date: 2025-12-01 16:42:23.686541

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9e04bf97a91d'
down_revision = '3877dce6f9e6'
branch_labels = None
depends_on = None


def upgrade():
    # Only add new columns to chat_attachments
    with op.batch_alter_table('chat_attachments', schema=None) as batch_op:
        batch_op.add_column(sa.Column('file_path', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('content_type', sa.String(length=100), nullable=True))


def downgrade():
    with op.batch_alter_table('chat_attachments', schema=None) as batch_op:
        batch_op.drop_column('content_type')
        batch_op.drop_column('file_path')
