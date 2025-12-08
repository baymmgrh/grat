"""
Document Generator Utility
Auto-generate documents from transactions (like Accurate)
"""
from models import db
from models.document_management import DocumentTemplate, Document, DocumentLog
from models.sales import SalesOrder, SalesOrderItem
from models.production import WorkOrder
from datetime import datetime
from utils import generate_number


def generate_surat_jalan_from_sales_order(sales_order_id, user_id):
    """
    Generate Surat Jalan from Sales Order
    Like Accurate: Sales Order → Surat Jalan
    """
    try:
        # Get sales order with items
        sales_order = SalesOrder.query.get(sales_order_id)
        if not sales_order:
            raise ValueError('Sales Order not found')
        
        # Get or create Surat Jalan template
        template = DocumentTemplate.query.filter_by(
            document_type='surat_jalan',
            is_default=True
        ).first()
        
        if not template:
            # Create default template if not exists
            template = create_default_surat_jalan_template(user_id)
        
        # Generate document number
        doc_number = generate_number('SJ', Document, 'document_number')
        
        # Prepare document data
        items_data = []
        for item in sales_order.items:
            items_data.append({
                'product_name': item.product.name if item.product else item.description,
                'quantity': float(item.quantity),
                'uom': item.uom,
                'description': item.description or ''
            })
        
        document_data = {
            'document_number': doc_number,
            'document_date': datetime.utcnow().strftime('%d %B %Y'),
            'sales_order_number': sales_order.order_number,
            'customer_name': sales_order.customer.company_name if sales_order.customer else '',
            'customer_address': sales_order.delivery_address or (sales_order.customer.address if sales_order.customer else ''),
            'customer_phone': sales_order.customer.phone if sales_order.customer else '',
            'items': items_data,
            'total_quantity': sum(float(item.quantity) for item in sales_order.items),
            'notes': sales_order.notes or '',
            'prepared_by': '',  # Will be filled manually
            'received_by': '',  # Will be filled manually
            'driver_name': '',
            'vehicle_number': ''
        }
        
        # Create document
        document = Document(
            document_number=doc_number,
            document_title=f'Surat Jalan - {sales_order.customer.company_name if sales_order.customer else ""}',
            document_type='surat_jalan',
            template_id=template.id,
            document_data=document_data,
            reference_type='sales_order',
            reference_id=sales_order.id,
            reference_number=sales_order.order_number,
            status='generated',
            created_by=user_id
        )
        
        # Generate HTML content
        from routes.document_management import render_document_html
        document.html_content = render_document_html(template, document_data)
        
        db.session.add(document)
        db.session.flush()
        
        # Log activity
        log = DocumentLog(
            document_id=document.id,
            activity_type='auto_generated',
            activity_description=f'Surat Jalan auto-generated from Sales Order {sales_order.order_number}',
            user_id=user_id
        )
        db.session.add(log)
        
        db.session.commit()
        
        return document
        
    except Exception as e:
        db.session.rollback()
        raise e


def generate_spk_from_work_order(work_order_id, user_id):
    """
    Generate SPK (Surat Perintah Kerja) from Work Order
    Like Accurate: Work Order → SPK
    """
    try:
        # Get work order
        work_order = WorkOrder.query.get(work_order_id)
        if not work_order:
            raise ValueError('Work Order not found')
        
        # Get or create SPK template
        template = DocumentTemplate.query.filter_by(
            document_type='spk',
            is_default=True
        ).first()
        
        if not template:
            # Create default template if not exists
            template = create_default_spk_template(user_id)
        
        # Generate document number
        doc_number = generate_number('SPK', Document, 'document_number')
        
        # Prepare document data
        document_data = {
            'document_number': doc_number,
            'document_date': datetime.utcnow().strftime('%d %B %Y'),
            'work_order_number': work_order.wo_number,
            'product_name': work_order.product.name if work_order.product else '',
            'product_code': work_order.product.code if work_order.product else '',
            'quantity': float(work_order.quantity),
            'uom': work_order.uom if work_order.uom else 'PCS',
            'start_date': work_order.scheduled_start_date.strftime('%d %B %Y') if work_order.scheduled_start_date else '',
            'due_date': work_order.scheduled_end_date.strftime('%d %B %Y') if work_order.scheduled_end_date else '',
            'priority': work_order.priority or 'normal',
            'notes': work_order.notes or '',
            'machine': work_order.machine.name if work_order.machine else '',
            'operator': '',
            'supervisor': '',
            'approved_by': ''
        }
        
        # Create document
        document = Document(
            document_number=doc_number,
            document_title=f'SPK - {work_order.product.name if work_order.product else work_order.wo_number}',
            document_type='spk',
            template_id=template.id,
            document_data=document_data,
            reference_type='work_order',
            reference_id=work_order.id,
            reference_number=work_order.wo_number,
            status='generated',
            created_by=user_id
        )
        
        # Generate HTML content
        from routes.document_management import render_document_html
        document.html_content = render_document_html(template, document_data)
        
        db.session.add(document)
        db.session.flush()
        
        # Log activity
        log = DocumentLog(
            document_id=document.id,
            activity_type='auto_generated',
            activity_description=f'SPK auto-generated from Work Order {work_order.wo_number}',
            user_id=user_id
        )
        db.session.add(log)
        
        db.session.commit()
        
        return document
        
    except Exception as e:
        db.session.rollback()
        raise e


def create_default_surat_jalan_template(user_id):
    """Create default Surat Jalan template"""
    template = DocumentTemplate(
        template_name='Surat Jalan Default',
        template_code='SJ_DEFAULT',
        document_type='surat_jalan',
        template_structure={
            'sections': [
                {'type': 'header', 'content': 'company_info'},
                {'type': 'title', 'content': 'SURAT JALAN'},
                {'type': 'info', 'fields': ['document_number', 'document_date', 'sales_order_number']},
                {'type': 'customer', 'fields': ['customer_name', 'customer_address', 'customer_phone']},
                {'type': 'table', 'name': 'items', 'columns': ['product_name', 'quantity', 'uom', 'description']},
                {'type': 'signatures', 'fields': ['prepared_by', 'driver_name', 'received_by']}
            ]
        },
        paper_size='A4',
        orientation='portrait',
        margins={'top': 20, 'right': 20, 'bottom': 20, 'left': 20},
        header_template={
            'company_name': 'PT. COMPANY NAME',
            'address': 'Company Address',
            'phone': 'Phone Number'
        },
        footer_template={
            'notes': 'Barang yang sudah diterima tidak dapat dikembalikan'
        },
        available_fields=[
            'document_number', 'document_date', 'sales_order_number',
            'customer_name', 'customer_address', 'customer_phone',
            'items', 'total_quantity', 'notes',
            'prepared_by', 'driver_name', 'vehicle_number', 'received_by'
        ],
        required_fields=['document_number', 'customer_name', 'items'],
        is_default=True,
        is_active=True,
        created_by=user_id
    )
    
    db.session.add(template)
    db.session.commit()
    
    return template


def create_default_spk_template(user_id):
    """Create default SPK template"""
    template = DocumentTemplate(
        template_name='SPK Default',
        template_code='SPK_DEFAULT',
        document_type='spk',
        template_structure={
            'sections': [
                {'type': 'header', 'content': 'company_info'},
                {'type': 'title', 'content': 'SURAT PERINTAH KERJA'},
                {'type': 'info', 'fields': ['document_number', 'document_date', 'work_order_number']},
                {'type': 'product', 'fields': ['product_name', 'product_code', 'quantity', 'uom']},
                {'type': 'schedule', 'fields': ['start_date', 'due_date', 'priority']},
                {'type': 'notes', 'field': 'notes'},
                {'type': 'signatures', 'fields': ['operator', 'supervisor', 'approved_by']}
            ]
        },
        paper_size='A4',
        orientation='portrait',
        margins={'top': 20, 'right': 20, 'bottom': 20, 'left': 20},
        header_template={
            'company_name': 'PT. COMPANY NAME',
            'address': 'Company Address',
            'phone': 'Phone Number'
        },
        footer_template={
            'notes': 'Dokumen ini sah tanpa tanda tangan basah'
        },
        available_fields=[
            'document_number', 'document_date', 'work_order_number',
            'product_name', 'product_code', 'quantity', 'uom',
            'start_date', 'due_date', 'priority', 'notes',
            'machine', 'operator', 'supervisor', 'approved_by'
        ],
        required_fields=['document_number', 'product_name', 'quantity'],
        is_default=True,
        is_active=True,
        created_by=user_id
    )
    
    db.session.add(template)
    db.session.commit()
    
    return template
