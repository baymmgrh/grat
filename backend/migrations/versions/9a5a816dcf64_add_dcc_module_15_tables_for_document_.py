"""Add DCC module - 15 tables for Document Control CAPA Internal Memo Destruction

Revision ID: 9a5a816dcf64
Revises: 0b04d4476118
Create Date: 2026-03-12 11:46:56.843084

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9a5a816dcf64'
down_revision = '0b04d4476118'
branch_labels = None
depends_on = None


def upgrade():
    # === DCC Documents (Daftar Induk Dokumen - FRM-DCC-02) ===
    op.create_table('dcc_documents',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('document_number', sa.String(length=50), nullable=False),
    sa.Column('title', sa.String(length=300), nullable=False),
    sa.Column('document_level', sa.String(length=5), nullable=False),
    sa.Column('department_code', sa.String(length=20), nullable=False),
    sa.Column('retention_period_years', sa.Integer(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_by', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('dcc_documents', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_dcc_documents_document_number'), ['document_number'], unique=True)

    # === DCC Document Revisions ===
    op.create_table('dcc_document_revisions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('document_id', sa.Integer(), nullable=False),
    sa.Column('revision_number', sa.Integer(), nullable=False),
    sa.Column('effective_date', sa.Date(), nullable=True),
    sa.Column('expiry_date', sa.Date(), nullable=True),
    sa.Column('docx_file_path', sa.String(length=500), nullable=True),
    sa.Column('pdf_file_path', sa.String(length=500), nullable=True),
    sa.Column('docx_locked', sa.Boolean(), nullable=True),
    sa.Column('status', sa.String(length=30), nullable=False),
    sa.Column('change_reason', sa.Text(), nullable=True),
    sa.Column('change_type', sa.String(length=30), nullable=True),
    sa.Column('originator_id', sa.Integer(), nullable=True),
    sa.Column('originator_signed_at', sa.DateTime(), nullable=True),
    sa.Column('reviewer_id', sa.Integer(), nullable=True),
    sa.Column('reviewer_signed_at', sa.DateTime(), nullable=True),
    sa.Column('reviewer_notes', sa.Text(), nullable=True),
    sa.Column('reviewer_status', sa.String(length=20), nullable=True),
    sa.Column('approver_id', sa.Integer(), nullable=True),
    sa.Column('approver_signed_at', sa.DateTime(), nullable=True),
    sa.Column('approver_notes', sa.Text(), nullable=True),
    sa.Column('approver_status', sa.String(length=20), nullable=True),
    sa.Column('approval_chain', sa.Text(), nullable=True),
    sa.Column('pdf_owner_password_encrypted', sa.String(length=256), nullable=True),
    sa.Column('pdf_hash_sha256', sa.String(length=64), nullable=True),
    sa.Column('pdf_locked_at', sa.DateTime(), nullable=True),
    sa.Column('verification_token', sa.String(length=64), nullable=True),
    sa.Column('verification_url', sa.String(length=256), nullable=True),
    sa.Column('obsoleted_at', sa.DateTime(), nullable=True),
    sa.Column('obsoleted_by', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['approver_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['document_id'], ['dcc_documents.id'], ),
    sa.ForeignKeyConstraint(['obsoleted_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['originator_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['reviewer_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('verification_token')
    )

    # === DCC Document Distributions (FRM-DCC-01 + FRM-DCC-04) ===
    op.create_table('dcc_document_distributions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('revision_id', sa.Integer(), nullable=False),
    sa.Column('copy_number', sa.Integer(), nullable=False),
    sa.Column('copy_type', sa.String(length=20), nullable=False),
    sa.Column('department_target', sa.String(length=50), nullable=False),
    sa.Column('distributed_at', sa.DateTime(), nullable=True),
    sa.Column('distributed_by', sa.Integer(), nullable=True),
    sa.Column('received_by', sa.Integer(), nullable=True),
    sa.Column('received_at', sa.DateTime(), nullable=True),
    sa.Column('is_acknowledged', sa.Boolean(), nullable=True),
    sa.Column('old_copy_returned', sa.Boolean(), nullable=True),
    sa.Column('old_copy_returned_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['distributed_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['received_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['revision_id'], ['dcc_document_revisions.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    # === DCC Document Reviews (FRM-DCC-10) ===
    op.create_table('dcc_document_reviews',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('document_id', sa.Integer(), nullable=False),
    sa.Column('review_date', sa.Date(), nullable=False),
    sa.Column('review_result', sa.String(length=30), nullable=False),
    sa.Column('review_notes', sa.Text(), nullable=True),
    sa.Column('reviewed_by', sa.Integer(), nullable=True),
    sa.Column('next_review_date', sa.Date(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['document_id'], ['dcc_documents.id'], ),
    sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    # === DCC Change Notices (FRM-DCC-05) ===
    op.create_table('dcc_change_notices',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('document_id', sa.Integer(), nullable=False),
    sa.Column('request_number', sa.String(length=50), nullable=False),
    sa.Column('change_description', sa.Text(), nullable=False),
    sa.Column('reason', sa.Text(), nullable=False),
    sa.Column('change_type', sa.String(length=30), nullable=False),
    sa.Column('requested_by', sa.Integer(), nullable=True),
    sa.Column('requested_at', sa.DateTime(), nullable=True),
    sa.Column('approved_by', sa.Integer(), nullable=True),
    sa.Column('approved_at', sa.DateTime(), nullable=True),
    sa.Column('rejection_reason', sa.Text(), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('resulting_revision_id', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['document_id'], ['dcc_documents.id'], ),
    sa.ForeignKeyConstraint(['requested_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['resulting_revision_id'], ['dcc_document_revisions.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('dcc_change_notices', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_dcc_change_notices_request_number'), ['request_number'], unique=True)

    # === DCC Quality Records (FRM-DCC-03) ===
    op.create_table('dcc_quality_records',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('record_number', sa.String(length=50), nullable=False),
    sa.Column('title', sa.String(length=300), nullable=False),
    sa.Column('record_type', sa.String(length=20), nullable=False),
    sa.Column('revision_number', sa.Integer(), nullable=True),
    sa.Column('department', sa.String(length=50), nullable=False),
    sa.Column('holder_id', sa.Integer(), nullable=True),
    sa.Column('storage_location', sa.String(length=200), nullable=True),
    sa.Column('retention_period', sa.String(length=100), nullable=True),
    sa.Column('retention_expiry_date', sa.Date(), nullable=True),
    sa.Column('is_confidential', sa.Boolean(), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('published_date', sa.Date(), nullable=True),
    sa.Column('created_by', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['holder_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('dcc_quality_records', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_dcc_quality_records_record_number'), ['record_number'], unique=True)

    # === DCC CAPA Requests (FRM-DCC-08, FRM-DCC-11) ===
    op.create_table('dcc_capa_requests',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('capa_number', sa.String(length=30), nullable=False),
    sa.Column('capa_type', sa.String(length=10), nullable=False),
    sa.Column('capa_source', sa.String(length=5), nullable=True),
    sa.Column('issue_description', sa.Text(), nullable=False),
    sa.Column('product_affected', sa.String(length=200), nullable=True),
    sa.Column('attachment_paths', sa.Text(), nullable=True),
    sa.Column('raised_by', sa.Integer(), nullable=True),
    sa.Column('raised_date', sa.Date(), nullable=False),
    sa.Column('assigned_department', sa.String(length=50), nullable=True),
    sa.Column('supplier_name', sa.String(length=200), nullable=True),
    sa.Column('supplier_id', sa.Integer(), nullable=True),
    sa.Column('approved_by', sa.Integer(), nullable=True),
    sa.Column('approved_at', sa.DateTime(), nullable=True),
    sa.Column('due_date', sa.Date(), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('cancellation_reason', sa.Text(), nullable=True),
    sa.Column('cancelled_by', sa.Integer(), nullable=True),
    sa.Column('cancelled_at', sa.DateTime(), nullable=True),
    sa.Column('closed_at', sa.DateTime(), nullable=True),
    sa.Column('closed_by', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['cancelled_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['closed_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['raised_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('dcc_capa_requests', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_dcc_capa_requests_capa_number'), ['capa_number'], unique=True)

    # === DCC CAPA Investigations ===
    op.create_table('dcc_capa_investigations',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('capa_id', sa.Integer(), nullable=False),
    sa.Column('root_cause_method', sa.String(length=20), nullable=True),
    sa.Column('root_cause_analysis', sa.Text(), nullable=True),
    sa.Column('five_why_data', sa.Text(), nullable=True),
    sa.Column('temporary_action', sa.Text(), nullable=True),
    sa.Column('corrective_action', sa.Text(), nullable=True),
    sa.Column('preventive_action', sa.Text(), nullable=True),
    sa.Column('action_due_date', sa.Date(), nullable=True),
    sa.Column('pic_name', sa.String(length=100), nullable=True),
    sa.Column('pic_department', sa.String(length=50), nullable=True),
    sa.Column('investigated_by', sa.Integer(), nullable=True),
    sa.Column('investigation_date', sa.Date(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['capa_id'], ['dcc_capa_requests.id'], ),
    sa.ForeignKeyConstraint(['investigated_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    # === DCC CAPA Verifications ===
    op.create_table('dcc_capa_verifications',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('capa_id', sa.Integer(), nullable=False),
    sa.Column('verification_notes', sa.Text(), nullable=True),
    sa.Column('is_effective', sa.Boolean(), nullable=True),
    sa.Column('follow_up_action', sa.Text(), nullable=True),
    sa.Column('follow_up_capa_id', sa.Integer(), nullable=True),
    sa.Column('verified_by', sa.Integer(), nullable=True),
    sa.Column('verified_date', sa.Date(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['capa_id'], ['dcc_capa_requests.id'], ),
    sa.ForeignKeyConstraint(['follow_up_capa_id'], ['dcc_capa_requests.id'], ),
    sa.ForeignKeyConstraint(['verified_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    # === DCC CAPA Monthly Reports (FRM-DCC-09) ===
    op.create_table('dcc_capa_monthly_reports',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('report_month', sa.Integer(), nullable=False),
    sa.Column('report_year', sa.Integer(), nullable=False),
    sa.Column('total_open', sa.Integer(), nullable=True),
    sa.Column('total_closed', sa.Integer(), nullable=True),
    sa.Column('total_overdue', sa.Integer(), nullable=True),
    sa.Column('total_new', sa.Integer(), nullable=True),
    sa.Column('report_data', sa.Text(), nullable=True),
    sa.Column('generated_by', sa.Integer(), nullable=True),
    sa.Column('generated_at', sa.DateTime(), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=True),
    sa.ForeignKeyConstraint(['generated_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('report_month', 'report_year', name='uq_capa_monthly_report')
    )

    # === DCC Internal Memos (FRM-DCC-07) ===
    op.create_table('dcc_internal_memos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('memo_number', sa.String(length=50), nullable=False),
    sa.Column('subject', sa.String(length=300), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('category', sa.String(length=30), nullable=False),
    sa.Column('attachment_paths', sa.Text(), nullable=True),
    sa.Column('is_audit_related', sa.Boolean(), nullable=True),
    sa.Column('published_by', sa.Integer(), nullable=True),
    sa.Column('published_date', sa.Date(), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['published_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('dcc_internal_memos', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_dcc_internal_memos_memo_number'), ['memo_number'], unique=True)

    # === DCC Internal Memo Distributions ===
    op.create_table('dcc_internal_memo_distributions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('memo_id', sa.Integer(), nullable=False),
    sa.Column('department', sa.String(length=50), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('is_read', sa.Boolean(), nullable=True),
    sa.Column('read_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['memo_id'], ['dcc_internal_memos.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    # === DCC Destruction Logs (FRM-DCC-14) ===
    op.create_table('dcc_destruction_logs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('destruction_number', sa.String(length=50), nullable=False),
    sa.Column('document_type', sa.String(length=30), nullable=False),
    sa.Column('revision_id', sa.Integer(), nullable=True),
    sa.Column('quality_record_id', sa.Integer(), nullable=True),
    sa.Column('destruction_date', sa.Date(), nullable=False),
    sa.Column('document_form', sa.String(length=20), nullable=False),
    sa.Column('method_physical', sa.String(length=20), nullable=True),
    sa.Column('method_digital', sa.String(length=20), nullable=True),
    sa.Column('reason', sa.String(length=30), nullable=False),
    sa.Column('destroyed_by', sa.Integer(), nullable=True),
    sa.Column('witnessed_by', sa.Integer(), nullable=True),
    sa.Column('witness_confirmed', sa.Boolean(), nullable=True),
    sa.Column('witness_confirmed_at', sa.DateTime(), nullable=True),
    sa.Column('verified_by', sa.Integer(), nullable=True),
    sa.Column('verified_at', sa.DateTime(), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['destroyed_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['quality_record_id'], ['dcc_quality_records.id'], ),
    sa.ForeignKeyConstraint(['revision_id'], ['dcc_document_revisions.id'], ),
    sa.ForeignKeyConstraint(['verified_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['witnessed_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('dcc_destruction_logs', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_dcc_destruction_logs_destruction_number'), ['destruction_number'], unique=True)


def downgrade():
    op.drop_table('dcc_destruction_logs')
    op.drop_table('dcc_internal_memo_distributions')
    op.drop_table('dcc_internal_memos')
    op.drop_table('dcc_capa_monthly_reports')
    op.drop_table('dcc_capa_verifications')
    op.drop_table('dcc_capa_investigations')
    op.drop_table('dcc_capa_requests')
    op.drop_table('dcc_quality_records')
    op.drop_table('dcc_change_notices')
    op.drop_table('dcc_document_distributions')
    op.drop_table('dcc_document_reviews')
    op.drop_table('dcc_document_revisions')
    op.drop_table('dcc_documents')

