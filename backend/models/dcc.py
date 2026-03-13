"""
Document Control Center (DCC) & CAPA Models
Standar ISO 9001:2015 — Referensi: QP-DCC-01, QP-DCC-02, QP-DCC-03, QP-DCC-04, WI-DCC-01, WI-DCC-02

Sub-Modul:
  I.  Pengendalian Dokumen (Document Control) — QP-DCC-01
  II. Pengendalian Rekaman Mutu (Quality Records) — QP-DCC-02
  III. Manajemen CAPA (CPAR, SCAR, CCHF) — QP-DCC-03, WI-DCC-02
  IV. Komunikasi Internal (Internal Memo) — QP-DCC-04
  V.  Pemusnahan Dokumen (Document Destruction) — WI-DCC-01

Tabel (sesuai Implementation Plan artifact):
  1.  DccDocument
  2.  DccDocumentRevision
  3.  DccDocumentDistribution
  4.  DccDocumentReview
  5.  DccChangeNotice
  6.  DccQualityRecord
  7.  CapaRequest
  8.  CapaInvestigation
  9.  CapaVerification
  10. CapaMonthlyReport
  11. InternalMemo
  12. InternalMemoDistribution
  13. DccDestructionLog
"""
from datetime import datetime, date
from . import db


# ============================================================
# I. SUB-MODUL PENGENDALIAN DOKUMEN (QP-DCC-01)
# ============================================================

class DccDocument(db.Model):
    """
    Daftar Induk Dokumen (FRM-DCC-02)
    Master registry semua dokumen terkendali.
    """
    __tablename__ = 'dcc_documents'

    id = db.Column(db.Integer, primary_key=True)
    document_number = db.Column(db.String(50), unique=True, nullable=False, index=True)  # Format: [Level]-[Dept]-[Urut] cth: QP-DCC-01
    title = db.Column(db.String(300), nullable=False)
    document_level = db.Column(db.String(5), nullable=False)  # I (QM), II (QP), III (WI), IV (Form/Standard)
    department_code = db.Column(db.String(20), nullable=False)  # DCC, PRD, QA, MKT, HRD, FIN, WH, PUR, dll
    retention_period_years = db.Column(db.Integer, nullable=True)  # Level I-III: 5 tahun; Level IV: null (selamanya)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    # Originator
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    revisions = db.relationship('DccDocumentRevision', backref='document', lazy='dynamic', cascade='all, delete-orphan')
    reviews = db.relationship('DccDocumentReview', backref='document', lazy='dynamic', cascade='all, delete-orphan')
    change_notices = db.relationship('DccChangeNotice', backref='document', lazy='dynamic', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<DccDocument {self.document_number} - {self.title}>'

    @property
    def current_revision(self):
        """Get the current active revision"""
        return DccDocumentRevision.query.filter_by(
            document_id=self.id, status='active'
        ).first()

    @property
    def level_name(self):
        names = {'I': 'Quality Manual', 'II': 'Quality Procedure', 'III': 'Working Instruction', 'IV': 'Form / Standard'}
        return names.get(self.document_level, self.document_level)


class DccDocumentRevision(db.Model):
    """
    Riwayat Revisi Dokumen & File Repository
    Setiap revisi menyimpan master .docx dan published PDF.

    Otorisasi TTD berbeda per level (sesuai QP-DCC-01):
    - QM (Level I):  Pembuat = MR, Pengkaji = GM, Pengesahan = Direktur
    - QP (Level II): Pembuat = Manager/Head Dept, Persetujuan = Mgr QA + PJ Teknis, Pengesahan = GM
    - WI (Level III): Pembuat = Staf/Supervisor/Dept Head, Pengkaji = Dept Head terkait, Pengesahan = Mgr QA + PJ Teknis
    - Form (Level IV): Perubahan via FRM-DCC-05
    """
    __tablename__ = 'dcc_document_revisions'

    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('dcc_documents.id'), nullable=False)
    revision_number = db.Column(db.Integer, nullable=False, default=0)  # 00, 01, 02...
    effective_date = db.Column(db.Date, nullable=True)  # Tanggal efektif berlaku
    expiry_date = db.Column(db.Date, nullable=True)  # effective_date + retention_period (Level I-III)

    # Files
    docx_file_path = db.Column(db.String(500), nullable=True)  # Master softcopy (.docx)
    pdf_file_path = db.Column(db.String(500), nullable=True)   # Published PDF + watermark "CONTROLLED COPY"
    docx_locked = db.Column(db.Boolean, default=False)  # Master .docx dikunci setelah disahkan

    # Status workflow: draft → reviewing → pending_approval → active → obsolete
    status = db.Column(db.String(30), nullable=False, default='draft')

    # Perubahan
    change_reason = db.Column(db.Text, nullable=True)  # Alasan perubahan (FRM-DCC-05)
    change_type = db.Column(db.String(30), nullable=True)  # format_change, content_change, new_document

    # === Approval Chain (3 tingkat, sesuai QP-DCC-01) ===
    # Originator / Pembuat
    originator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    originator_signed_at = db.Column(db.DateTime, nullable=True)

    # Reviewer / Pengkaji / Pemeriksa
    reviewer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    reviewer_signed_at = db.Column(db.DateTime, nullable=True)
    reviewer_notes = db.Column(db.Text, nullable=True)
    reviewer_status = db.Column(db.String(20), nullable=True)  # approved, rejected, revision_needed

    # Approver / Pengesah
    approver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approver_signed_at = db.Column(db.DateTime, nullable=True)
    approver_notes = db.Column(db.Text, nullable=True)
    approver_status = db.Column(db.String(20), nullable=True)  # approved, rejected

    # Approval chain (JSON) — full audit trail
    # [{approver, role, action, timestamp, ip, method, approval_id}]
    approval_chain = db.Column(db.Text, nullable=True)

    # PDF Security (setelah disahkan) — dari dcc_pdf_security artifact
    pdf_owner_password_encrypted = db.Column(db.String(256), nullable=True)  # AES encrypted owner password
    pdf_hash_sha256 = db.Column(db.String(64), nullable=True)  # Tamper detection SHA-256 hash
    pdf_locked_at = db.Column(db.DateTime, nullable=True)

    # Verification — QR code per dokumen
    verification_token = db.Column(db.String(64), nullable=True, unique=True)
    verification_url = db.Column(db.String(256), nullable=True)

    # Obsolete info
    obsoleted_at = db.Column(db.DateTime, nullable=True)
    obsoleted_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    originator = db.relationship('User', foreign_keys=[originator_id])
    reviewer = db.relationship('User', foreign_keys=[reviewer_id])
    approver = db.relationship('User', foreign_keys=[approver_id])
    obsoleted_by_user = db.relationship('User', foreign_keys=[obsoleted_by])
    distributions = db.relationship('DccDocumentDistribution', backref='revision', lazy='dynamic', cascade='all, delete-orphan')
    destruction_log = db.relationship('DccDestructionLog', backref='revision', lazy='dynamic')

    def __repr__(self):
        return f'<DccDocumentRevision {self.document.document_number if self.document else "?"} Rev{self.revision_number:02d}>'

    @property
    def is_fully_approved(self):
        """Check if all 3 levels have signed"""
        return all([self.originator_signed_at, self.reviewer_signed_at, self.approver_signed_at])


class DccDocumentDistribution(db.Model):
    """
    Distribusi & Serah Terima Dokumen (FRM-DCC-01 + FRM-DCC-04)
    Mencatat setiap salinan terkendali yang didistribusikan ke departemen.
    """
    __tablename__ = 'dcc_document_distributions'

    id = db.Column(db.Integer, primary_key=True)
    revision_id = db.Column(db.Integer, db.ForeignKey('dcc_document_revisions.id'), nullable=False)
    copy_number = db.Column(db.Integer, nullable=False)  # Nomor salinan
    copy_type = db.Column(db.String(20), nullable=False, default='controlled')  # controlled, uncontrolled
    department_target = db.Column(db.String(50), nullable=False)  # Dept penerima

    # Serah terima (FRM-DCC-01)
    distributed_at = db.Column(db.DateTime, nullable=True)  # Kapan didistribusikan
    distributed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # DCC staff
    received_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Penerima fisik
    received_at = db.Column(db.DateTime, nullable=True)  # Tanda tangan digital penerima (FRM-DCC-01)
    is_acknowledged = db.Column(db.Boolean, default=False)  # Sudah confirm kelengkapan?

    # Pengembalian revisi lama
    old_copy_returned = db.Column(db.Boolean, default=False)
    old_copy_returned_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    distributed_by_user = db.relationship('User', foreign_keys=[distributed_by])
    received_by_user = db.relationship('User', foreign_keys=[received_by])

    def __repr__(self):
        return f'<DccDistribution Copy#{self.copy_number} → {self.department_target}>'


class DccDocumentReview(db.Model):
    """
    Kaji Ulang Dokumen (FRM-DCC-10)
    Wajib dilakukan 3-4 bulan sebelum masa berlaku habis (per QP-DCC-01).
    """
    __tablename__ = 'dcc_document_reviews'

    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('dcc_documents.id'), nullable=False)
    review_date = db.Column(db.Date, nullable=False, default=date.today)
    review_result = db.Column(db.String(30), nullable=False)  # still_relevant, needs_revision, obsolete
    review_notes = db.Column(db.Text, nullable=True)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    next_review_date = db.Column(db.Date, nullable=True)  # 3-4 bulan sebelum expiry

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    reviewed_by_user = db.relationship('User', foreign_keys=[reviewed_by])

    def __repr__(self):
        return f'<DccReview {self.document.document_number if self.document else "?"} - {self.review_result}>'


class DccChangeNotice(db.Model):
    """
    Document/Form Change Notice (FRM-DCC-05)
    Permohonan perubahan dokumen — wajib untuk Level IV, opsional Level I-III.
    """
    __tablename__ = 'dcc_change_notices'

    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('dcc_documents.id'), nullable=False)
    request_number = db.Column(db.String(50), unique=True, nullable=False, index=True)  # Auto-generated
    change_description = db.Column(db.Text, nullable=False)  # Uraian perubahan
    reason = db.Column(db.Text, nullable=False)  # Alasan perubahan

    # Workflow
    requested_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    requested_at = db.Column(db.DateTime, default=datetime.utcnow)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, approved, rejected, implemented

    # Link ke revisi yang dihasilkan
    resulting_revision_id = db.Column(db.Integer, db.ForeignKey('dcc_document_revisions.id'), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    requested_by_user = db.relationship('User', foreign_keys=[requested_by])
    approved_by_user = db.relationship('User', foreign_keys=[approved_by])
    resulting_revision = db.relationship('DccDocumentRevision', foreign_keys=[resulting_revision_id])

    def __repr__(self):
        return f'<DccChangeNotice {self.request_number} - {self.status}>'


# ============================================================
# II. SUB-MODUL PENGENDALIAN REKAMAN MUTU (QP-DCC-02)
# ============================================================

class DccQualityRecord(db.Model):
    """
    Daftar Induk Rekaman Mutu (FRM-DCC-03)
    Registry semua quality records — baik rekaman SMM maupun rekaman mutu produk.
    """
    __tablename__ = 'dcc_quality_records'

    id = db.Column(db.Integer, primary_key=True)
    record_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    title = db.Column(db.String(300), nullable=False)
    record_type = db.Column(db.String(20), nullable=False)  # smm (Rekaman SMM), product (Rekaman Mutu Produk)
    revision_number = db.Column(db.Integer, default=0)
    department = db.Column(db.String(50), nullable=False)

    # Holder (pemegang salinan)
    holder_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    storage_location = db.Column(db.String(200), nullable=True)  # Lokasi ordner penyimpanan

    # Retensi
    retention_period = db.Column(db.String(100), nullable=True)  # cth: "5 tahun", "ED + 1 tahun"
    is_confidential = db.Column(db.Boolean, default=False)  # Menentukan metode pemusnahan

    # Status
    status = db.Column(db.String(20), nullable=False, default='active')  # active, archived, destroyed

    # Metadata
    published_date = db.Column(db.Date, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    holder = db.relationship('User', foreign_keys=[holder_id])
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    destruction_log = db.relationship('DccDestructionLog', backref='quality_record', lazy='dynamic')

    def __repr__(self):
        return f'<DccQualityRecord {self.record_number} - {self.title}>'


# ============================================================
# III. SUB-MODUL MANAJEMEN CAPA (QP-DCC-03 + WI-DCC-02)
# ============================================================

class CapaRequest(db.Model):
    """
    CPAR / SCAR / CCHF Induk (FRM-DCC-08, FRM-DCC-11, FRM-MKT-13)
    Auto-numbering:
      CPAR: CP/[BB]/[CC]/[DD]-[nnn]  (cth: CP/06/25/AI-001)
      SCAR: SC/[BB]/[CC]/[nnn]        (cth: SC/06/25/001)
    Reset nomor urut setiap ganti tahun.
    """
    __tablename__ = 'dcc_capa_requests'

    id = db.Column(db.Integer, primary_key=True)
    capa_number = db.Column(db.String(30), unique=True, nullable=False, index=True)
    capa_type = db.Column(db.String(10), nullable=False)  # CPAR, SCAR, CCHF
    capa_source = db.Column(db.String(5), nullable=True)
    # AI = Audit Internal, AE = Audit External, MR = Management Review,
    # PM = Penyimpangan Mutu, KP = Keluhan Pelanggan

    # Deskripsi masalah
    issue_description = db.Column(db.Text, nullable=False)
    product_affected = db.Column(db.String(200), nullable=True)
    attachment_paths = db.Column(db.Text, nullable=True)  # JSON array of file paths

    # Inisiator
    raised_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    raised_date = db.Column(db.Date, nullable=False, default=date.today)

    # Assignment
    assigned_department = db.Column(db.String(50), nullable=True)  # Dept bertanggung jawab (CPAR) atau nama supplier (SCAR)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=True)  # FK → Supplier (jika SCAR)

    # Status workflow: open → investigation → action_progress → verifying → closed / cancelled
    status = db.Column(db.String(20), nullable=False, default='open')

    # Pembatalan (perlu approval Inisiator + Management per QP-DCC-03)
    cancellation_reason = db.Column(db.Text, nullable=True)
    cancelled_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    # Deadline
    due_date = db.Column(db.Date, nullable=True)  # SCAR: 5 hari kerja dari tanggal kirim

    # Approval (CPAR: Management Rep; SCAR: QA Manager)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)

    # Penutupan
    closed_at = db.Column(db.DateTime, nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    raised_by_user = db.relationship('User', foreign_keys=[raised_by])
    approved_by_user = db.relationship('User', foreign_keys=[approved_by])
    cancelled_by_user = db.relationship('User', foreign_keys=[cancelled_by])
    supplier = db.relationship('Supplier', foreign_keys=[supplier_id])
    investigation = db.relationship('CapaInvestigation', backref='capa', uselist=False, foreign_keys='CapaInvestigation.capa_id', cascade='all, delete-orphan')
    verification = db.relationship('CapaVerification', backref='capa', uselist=False, foreign_keys='CapaVerification.capa_id', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<CapaRequest {self.capa_number} [{self.capa_type}] - {self.status}>'

    @staticmethod
    def generate_cpar_number(source_code: str) -> str:
        """Generate CPAR number: CP/BB/CC/DD-nnn"""
        now = datetime.now()
        month = f"{now.month:02d}"
        year = f"{now.year % 100:02d}"

        year_start = datetime(now.year, 1, 1)
        count = CapaRequest.query.filter(
            CapaRequest.capa_type == 'CPAR',
            CapaRequest.created_at >= year_start
        ).count()

        return f"CP/{month}/{year}/{source_code}-{count + 1:03d}"

    @staticmethod
    def generate_scar_number() -> str:
        """Generate SCAR number: SC/BB/CC/nnn"""
        now = datetime.now()
        month = f"{now.month:02d}"
        year = f"{now.year % 100:02d}"

        year_start = datetime(now.year, 1, 1)
        count = CapaRequest.query.filter(
            CapaRequest.capa_type == 'SCAR',
            CapaRequest.created_at >= year_start
        ).count()

        return f"SC/{month}/{year}/{count + 1:03d}"


class CapaInvestigation(db.Model):
    """
    Investigasi & Root Cause Analysis + Rencana Tindakan (WI-DCC-02)
    Metode RCA: 5-Why atau Fishbone diagram.
    """
    __tablename__ = 'dcc_capa_investigations'

    id = db.Column(db.Integer, primary_key=True)
    capa_id = db.Column(db.Integer, db.ForeignKey('dcc_capa_requests.id'), nullable=False)

    # Root Cause Analysis
    root_cause_method = db.Column(db.String(20), nullable=True)  # five_why, fishbone
    root_cause_analysis = db.Column(db.Text, nullable=True)  # Hasil analisis
    five_why_data = db.Column(db.Text, nullable=True)  # JSON: {why1, why2, why3, why4, why5}

    # Tindakan
    temporary_action = db.Column(db.Text, nullable=True)  # Koreksi langsung / sementara
    corrective_action = db.Column(db.Text, nullable=True)  # Tindakan perbaikan (menghilangkan penyebab)
    preventive_action = db.Column(db.Text, nullable=True)  # Tindakan pencegahan (revisi prosedur/proses)

    # PIC & Deadline
    action_due_date = db.Column(db.Date, nullable=True)
    pic_name = db.Column(db.String(100), nullable=True)
    pic_department = db.Column(db.String(50), nullable=True)

    # Investigator
    investigated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    investigation_date = db.Column(db.Date, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    investigated_by_user = db.relationship('User', foreign_keys=[investigated_by])

    def __repr__(self):
        return f'<CapaInvestigation CAPA#{self.capa_id}>'


class CapaVerification(db.Model):
    """
    Verifikasi Efektivitas & Penutupan
    CPAR: diverifikasi oleh Inisiator + Management
    SCAR: diverifikasi oleh QA Manager
    """
    __tablename__ = 'dcc_capa_verifications'

    id = db.Column(db.Integer, primary_key=True)
    capa_id = db.Column(db.Integer, db.ForeignKey('dcc_capa_requests.id'), nullable=False)
    verification_notes = db.Column(db.Text, nullable=True)  # Hasil evaluasi efektivitas
    is_effective = db.Column(db.Boolean, nullable=True)  # Efektif?
    follow_up_action = db.Column(db.Text, nullable=True)  # Jika tidak efektif, tindakan lanjutan
    follow_up_capa_id = db.Column(db.Integer, db.ForeignKey('dcc_capa_requests.id'), nullable=True)  # Link CAPA baru

    # Verifier
    verified_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    verified_date = db.Column(db.Date, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    verified_by_user = db.relationship('User', foreign_keys=[verified_by])
    follow_up_capa = db.relationship('CapaRequest', foreign_keys=[follow_up_capa_id])

    def __repr__(self):
        return f'<CapaVerification CAPA#{self.capa_id} - {"Effective" if self.is_effective else "Not Effective"}>'


class CapaMonthlyReport(db.Model):
    """
    Laporan Bulanan Status CPAR (FRM-DCC-09)
    Auto-generated setiap akhir bulan dari data CAPA.
    """
    __tablename__ = 'dcc_capa_monthly_reports'

    id = db.Column(db.Integer, primary_key=True)
    report_month = db.Column(db.Integer, nullable=False)
    report_year = db.Column(db.Integer, nullable=False)
    total_open = db.Column(db.Integer, default=0)
    total_closed = db.Column(db.Integer, default=0)
    total_overdue = db.Column(db.Integer, default=0)
    report_data = db.Column(db.Text, nullable=True)  # JSON detail per CPAR
    generated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    generated_by_user = db.relationship('User', foreign_keys=[generated_by])

    # Unique constraint: 1 report per bulan
    __table_args__ = (db.UniqueConstraint('report_month', 'report_year', name='uq_capa_monthly_report'),)

    def __repr__(self):
        return f'<CapaMonthlyReport {self.report_month:02d}/{self.report_year}>'


# ============================================================
# IV. SUB-MODUL KOMUNIKASI INTERNAL (QP-DCC-04)
# ============================================================

class InternalMemo(db.Model):
    """
    Memo Internal (FRM-DCC-07)
    Komunikasi antar departemen terkait kebijakan mutu, jadwal produksi,
    kebutuhan bahan baku, maklum balas pelanggan, dll.
    """
    __tablename__ = 'dcc_internal_memos'

    id = db.Column(db.Integer, primary_key=True)
    memo_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    subject = db.Column(db.String(300), nullable=False)
    content = db.Column(db.Text, nullable=False)  # Rich Text (HTML)
    category = db.Column(db.String(30), nullable=False)
    # kebijakan_mutu, jadwal_produksi, kebutuhan_bahan, maklum_balas, audit, lainnya
    attachment_paths = db.Column(db.Text, nullable=True)  # JSON array
    is_audit_related = db.Column(db.Boolean, default=False)  # Jika true, disimpan Management (per QP-DCC-04)

    # Publisher
    published_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    published_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='draft')  # draft, published, archived

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    published_by_user = db.relationship('User', foreign_keys=[published_by])
    distributions = db.relationship('InternalMemoDistribution', backref='memo', lazy='dynamic', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<InternalMemo {self.memo_number} - {self.subject}>'

    @property
    def read_count(self):
        return self.distributions.filter_by(is_read=True).count()

    @property
    def total_recipients(self):
        return self.distributions.count()


class InternalMemoDistribution(db.Model):
    """
    Log Keterbacaan Memo (Read Receipts)
    Tracking siapa yang sudah/belum baca memo.
    """
    __tablename__ = 'dcc_internal_memo_distributions'

    id = db.Column(db.Integer, primary_key=True)
    memo_id = db.Column(db.Integer, db.ForeignKey('dcc_internal_memos.id'), nullable=False)
    department = db.Column(db.String(50), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    read_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = db.relationship('User', foreign_keys=[user_id])

    def __repr__(self):
        return f'<InternalMemoDistribution Memo#{self.memo_id} → User#{self.user_id} {"✓" if self.is_read else "○"}>'


# ============================================================
# V. SUB-MODUL PEMUSNAHAN DOKUMEN (WI-DCC-01)
# ============================================================

class DccDestructionLog(db.Model):
    """
    Berita Acara Pemusnahan Dokumen (FRM-DCC-14)
    Mencatat pemusnahan dokumen fisik dan digital sesuai WI-DCC-01.
    """
    __tablename__ = 'dcc_destruction_logs'

    id = db.Column(db.Integer, primary_key=True)
    destruction_number = db.Column(db.String(50), unique=True, nullable=False, index=True)

    # Referensi dokumen yang dimusnahkan
    document_type = db.Column(db.String(30), nullable=False)  # document_revision, quality_record
    revision_id = db.Column(db.Integer, db.ForeignKey('dcc_document_revisions.id'), nullable=True)
    quality_record_id = db.Column(db.Integer, db.ForeignKey('dcc_quality_records.id'), nullable=True)

    # Detail pemusnahan
    destruction_date = db.Column(db.Date, nullable=False)
    document_form = db.Column(db.String(20), nullable=False)  # physical, digital, both
    method_physical = db.Column(db.String(20), nullable=True)  # shredder, burn
    method_digital = db.Column(db.String(20), nullable=True)   # delete, archive
    reason = db.Column(db.String(30), nullable=False)  # expired_retention, obsolete, not_relevant

    # Pelaksana & Saksi
    destroyed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # DCC Staff
    witnessed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # QA / Saksi
    witness_confirmed = db.Column(db.Boolean, default=False)
    witness_confirmed_at = db.Column(db.DateTime, nullable=True)

    # Verifikasi
    verified_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    verified_at = db.Column(db.DateTime, nullable=True)

    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    destroyed_by_user = db.relationship('User', foreign_keys=[destroyed_by])
    witnessed_by_user = db.relationship('User', foreign_keys=[witnessed_by])
    verified_by_user = db.relationship('User', foreign_keys=[verified_by])

    def __repr__(self):
        return f'<DccDestructionLog {self.destruction_number}>'
