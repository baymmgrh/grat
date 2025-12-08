"""Add password_hash to chat_channels

Revision ID: a9909eeb0fd3
Revises: 9e04bf97a91d
Create Date: 2025-12-01 17:03:41.469545

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a9909eeb0fd3'
down_revision = '9e04bf97a91d'
branch_labels = None
depends_on = None


def upgrade():
    # Only add password_hash to chat_channels
    with op.batch_alter_table('chat_channels', schema=None) as batch_op:
        batch_op.add_column(sa.Column('password_hash', sa.String(length=255), nullable=True))


def downgrade():
    with op.batch_alter_table('chat_channels', schema=None) as batch_op:
        batch_op.drop_column('password_hash')
