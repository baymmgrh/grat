"""
Document Management System Models
Dynamic template-based document generation (Surat Jalan, SPK, etc.)
"""
from datetime import datetime
from models import db
from sqlalchemy.dialects.postgresql import JSON

class DocumentTemplate(db.Model):
    """Document templates with dynamic fields"""
    __tablename__ = 'document_templates'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Template Info
    template_name = db.Column(db.String(100), nullable=False)
    template_code = db.Column(db.String(50), unique=True, nullable=False)
    document_type = db.Column(db.String(50), nullable=False)  # surat_jalan, spk, invoice, po, etc
    
    # Template Content (JSON structure)
    template_structure = db.Column(JSON, nullable=False)  # Header, body, footer sections
    
    # Template Configuration
    paper_size = db.Column(db.String(20), default='A4')  # A4, Letter, Legal
    orientation = db.Column(db.String(20), default='portrait')  # portrait, landscape
    margins = db.Column(JSON)  # {top, right, bottom, left}
    
    # Header/Footer
    header_template = db.Column(JSON)  # Company logo, name, address
    footer_template = db.Column(JSON)  # Page numbers, notes
    
    # Dynamic Fields (variables that can be filled)
    available_fields = db.Column(JSON)  # List of available variables
    required_fields = db.Column(JSON)  # Required fields
    
    # Styling
    font_family = db.Column(db.String(50), default='Arial')
    font_size = db.Column(db.Integer, default=10)
    custom_css = db.Column(db.Text)  # Custom CSS for PDF
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    is_default = db.Column(db.Boolean, default=False)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Relationships
    documents = db.relationship('Document', backref='template', lazy='dynamic')
    
    def __repr__(self):
        return f'<DocumentTemplate {self.template_name}>'


class Document(db.Model):
    """Generated documents from templates"""
    __tablename__ = 'documents'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Document Info
    document_number = db.Column(db.String(100), unique=True, nullable=False)
    document_title = db.Column(db.String(200))
    document_type = db.Column(db.String(50), nullable=False)
    
    # Template Reference
    template_id = db.Column(db.Integer, db.ForeignKey('document_templates.id'), nullable=False)
    
    # Document Data (filled template)
    document_data = db.Column(JSON, nullable=False)  # All filled fields
    
    # Reference to source transaction
    reference_type = db.Column(db.String(50))  # sales_order, work_order, purchase_order, etc
    reference_id = db.Column(db.Integer)
    reference_number = db.Column(db.String(100))
    
    # Generated Files
    pdf_path = db.Column(db.String(500))
    excel_path = db.Column(db.String(500))
    html_content = db.Column(db.Text)  # For preview
    
    # Status
    status = db.Column(db.String(50), default='draft')  # draft, generated, printed, sent
    
    # Printing
    print_count = db.Column(db.Integer, default=0)
    last_printed_at = db.Column(db.DateTime)
    printed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Signatures (manual for now)
    signature_fields = db.Column(JSON)  # {prepared_by, approved_by, received_by}
    
    # Metadata
    document_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Relationships
    revisions = db.relationship('DocumentRevision', backref='document', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Document {self.document_number}>'


class DocumentRevision(db.Model):
    """Document revision history"""
    __tablename__ = 'document_revisions'
    
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('documents.id'), nullable=False)
    
    # Revision Info
    revision_number = db.Column(db.Integer, nullable=False)
    revision_note = db.Column(db.Text)
    
    # Previous Data
    previous_data = db.Column(JSON)
    
    # Files
    pdf_path = db.Column(db.String(500))
    excel_path = db.Column(db.String(500))
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    def __repr__(self):
        return f'<DocumentRevision {self.document_id} v{self.revision_number}>'


class DocumentCategory(db.Model):
    """Document categories for organization"""
    __tablename__ = 'document_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Category Info
    category_name = db.Column(db.String(100), nullable=False)
    category_code = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    
    # Numbering Format
    number_prefix = db.Column(db.String(20))  # SJ, SPK, INV, etc
    number_format = db.Column(db.String(100))  # {prefix}-{year}{month}-{sequence}
    next_sequence = db.Column(db.Integer, default=1)
    
    # Configuration
    requires_approval = db.Column(db.Boolean, default=False)
    auto_generate = db.Column(db.Boolean, default=True)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    def __repr__(self):
        return f'<DocumentCategory {self.category_name}>'


class DocumentAttachment(db.Model):
    """Attachments for documents"""
    __tablename__ = 'document_attachments'
    
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('documents.id'), nullable=False)
    
    # File Info
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(50))
    file_size = db.Column(db.Integer)
    
    # Description
    description = db.Column(db.Text)
    
    # Metadata
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    def __repr__(self):
        return f'<DocumentAttachment {self.file_name}>'


class DocumentLog(db.Model):
    """Activity log for documents"""
    __tablename__ = 'document_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('documents.id'), nullable=False)
    
    # Activity
    activity_type = db.Column(db.String(50), nullable=False)  # created, updated, printed, sent, etc
    activity_description = db.Column(db.Text)
    
    # User
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    user_name = db.Column(db.String(100))
    
    # IP & Device
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(500))
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<DocumentLog {self.activity_type}>'
