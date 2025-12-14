"""
Production Schedule Grid Routes
Excel-style weekly production schedule with machine/product/shift grid
Auto-generates Work Orders when scheduled date arrives
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Machine, Product
from models.product import ProductPackaging
from models.production import WorkOrder, BillOfMaterials
from datetime import datetime, timedelta
import json

schedule_grid_bp = Blueprint('schedule_grid', __name__)


class ScheduleGridItem(db.Model):
    """Production Schedule - Rencana Produksi Mingguan"""
    __tablename__ = 'schedule_grid_items'
    
    id = db.Column(db.Integer, primary_key=True)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    week_start = db.Column(db.Date, nullable=False)
    order_ctn = db.Column(db.Numeric(15, 2), default=0)
    qty_per_ctn = db.Column(db.Integer, default=0)
    spek_kain = db.Column(db.String(100))
    no_spk = db.Column(db.String(50))
    wo_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=True)  # Link to generated WO
    monthly_schedule_id = db.Column(db.Integer, db.ForeignKey('monthly_schedules.id'), nullable=True)  # Link to monthly source
    color = db.Column(db.String(50), default='bg-blue-500')
    schedule_days = db.Column(db.Text)  # JSON: {"2025-12-08": [1, 2], "2025-12-09": [1]}
    status = db.Column(db.String(50), default='planned')  # planned, wo_created, in_progress, completed
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    machine = db.relationship('Machine', backref='schedule_grid_items')
    product = db.relationship('Product', backref='schedule_grid_items')
    work_order = db.relationship('WorkOrder', backref='schedule_grid_item')
    monthly_schedule = db.relationship('MonthlySchedule', backref='weekly_schedules')
    
    def to_dict(self):
        # Get pack per carton from Product Packaging (priority) or use stored value
        pack_per_ctn = self.qty_per_ctn or 0
        if self.product and self.product.packaging:
            pack_per_ctn = self.product.packaging.packs_per_karton or pack_per_ctn
        
        return {
            'id': self.id,
            'machine_id': self.machine_id,
            'machine_code': self.machine.code if self.machine else None,
            'machine_name': self.machine.name if self.machine else None,
            'product_id': self.product_id,
            'product_code': self.product.code if self.product else None,
            'product_name': self.product.name if self.product else None,
            'week_start': self.week_start.isoformat() if self.week_start else None,
            'order_ctn': float(self.order_ctn or 0),
            'qty_per_ctn': pack_per_ctn,  # From Product Packaging
            'order_pack': float(self.order_ctn or 0) * pack_per_ctn,
            'spek_kain': self.spek_kain,
            'no_spk': self.no_spk,
            'wo_id': self.wo_id,
            'wo_number': self.work_order.wo_number if self.work_order else None,
            'status': self.status,
            'color': self.color,
            'schedule_days': json.loads(self.schedule_days) if self.schedule_days else {},
            'notes': self.notes,
        }


class ScheduleGridNote(db.Model):
    __tablename__ = 'schedule_grid_notes'
    
    id = db.Column(db.Integer, primary_key=True)
    week_start = db.Column(db.Date, nullable=False)
    note_text = db.Column(db.Text, nullable=False)
    order_index = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class MonthlySchedule(db.Model):
    """Monthly Production Schedule - Rencana Produksi Bulanan sebagai sumber untuk Weekly"""
    __tablename__ = 'monthly_schedules'
    
    id = db.Column(db.Integer, primary_key=True)
    year = db.Column(db.Integer, nullable=False)
    month = db.Column(db.Integer, nullable=False)  # 1-12
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=True)
    
    # Target quantities
    target_ctn = db.Column(db.Numeric(15, 2), default=0)  # Target karton per bulan
    target_pack = db.Column(db.Numeric(15, 2), default=0)  # Auto-calculated: target_ctn * qty_per_ctn
    
    # Tracking - how much has been scheduled to weekly
    scheduled_ctn = db.Column(db.Numeric(15, 2), default=0)  # Total yang sudah dijadwalkan ke weekly
    remaining_ctn = db.Column(db.Numeric(15, 2), default=0)  # Sisa yang belum dijadwalkan
    
    # Additional info
    priority = db.Column(db.String(20), default='normal')  # low, normal, high, urgent
    spek_kain = db.Column(db.String(100))
    color = db.Column(db.String(50), default='bg-blue-500')
    notes = db.Column(db.Text)
    status = db.Column(db.String(50), default='draft')  # draft, approved, in_progress, completed
    
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product', backref='monthly_schedules')
    machine = db.relationship('Machine', backref='monthly_schedules')
    
    __table_args__ = (
        db.UniqueConstraint('year', 'month', 'product_id', 'machine_id', name='unique_monthly_schedule'),
    )
    
    def to_dict(self):
        # Get pack per carton from Product Packaging
        pack_per_ctn = 0
        if self.product and self.product.packaging:
            pack_per_ctn = self.product.packaging.packs_per_karton or 0
        
        return {
            'id': self.id,
            'year': self.year,
            'month': self.month,
            'month_name': ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][self.month],
            'product_id': self.product_id,
            'product_code': self.product.code if self.product else None,
            'product_name': self.product.name if self.product else None,
            'machine_id': self.machine_id,
            'machine_code': self.machine.code if self.machine else None,
            'machine_name': self.machine.name if self.machine else None,
            'target_ctn': float(self.target_ctn or 0),
            'target_pack': float(self.target_ctn or 0) * pack_per_ctn,
            'qty_per_ctn': pack_per_ctn,
            'scheduled_ctn': float(self.scheduled_ctn or 0),
            'remaining_ctn': float(self.target_ctn or 0) - float(self.scheduled_ctn or 0),
            'progress_percent': round((float(self.scheduled_ctn or 0) / float(self.target_ctn or 1)) * 100, 1),
            'priority': self.priority,
            'spek_kain': self.spek_kain,
            'color': self.color,
            'notes': self.notes,
            'status': self.status,
        }


def get_week_start(date_str):
    """Get Monday of the week for given date"""
    if not date_str:
        date = datetime.now().date()
    else:
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
    
    # Find Monday
    days_since_monday = date.weekday()
    monday = date - timedelta(days=days_since_monday)
    return monday


@schedule_grid_bp.route('/schedule-grid', methods=['GET'])
@jwt_required()
def get_schedule_grid():
    """Get schedule grid for a week"""
    try:
        week_start_str = request.args.get('week_start')
        week_start = get_week_start(week_start_str)
        
        # Get schedule items for this week
        items = ScheduleGridItem.query.filter_by(week_start=week_start).all()
        
        # Get notes for this week
        notes = ScheduleGridNote.query.filter_by(week_start=week_start).order_by(ScheduleGridNote.order_index).all()
        
        return jsonify({
            'schedules': [item.to_dict() for item in items],
            'notes': [n.note_text for n in notes],
            'week_start': week_start.isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@schedule_grid_bp.route('/schedule-grid', methods=['POST'])
@jwt_required()
def create_schedule_item():
    """Create new schedule grid item"""
    try:
        data = request.get_json()
        
        machine_id = data.get('machine_id')
        product_id = data.get('product_id')
        
        if not machine_id or not product_id:
            return jsonify({'error': 'machine_id and product_id are required'}), 400
        
        # Get week start from schedule_days
        schedule_days = data.get('schedule_days', {})
        if schedule_days:
            first_date = list(schedule_days.keys())[0]
            week_start = get_week_start(first_date)
        else:
            week_start = get_week_start(None)
        
        item = ScheduleGridItem(
            machine_id=machine_id,
            product_id=product_id,
            week_start=week_start,
            order_ctn=data.get('order_ctn', 0),
            qty_per_ctn=data.get('qty_per_ctn', 0),
            spek_kain=data.get('spek_kain'),
            no_spk=data.get('no_spk'),
            color=data.get('color', 'bg-blue-500'),
            schedule_days=json.dumps(schedule_days),
            notes=data.get('notes')
        )
        
        db.session.add(item)
        db.session.commit()
        
        return jsonify({
            'message': 'Schedule item created',
            'schedule': item.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@schedule_grid_bp.route('/schedule-grid/<int:id>', methods=['PUT'])
@jwt_required()
def update_schedule_item(id):
    """Update schedule grid item"""
    try:
        item = ScheduleGridItem.query.get_or_404(id)
        data = request.get_json()
        
        if 'machine_id' in data:
            item.machine_id = data['machine_id']
        if 'product_id' in data:
            item.product_id = data['product_id']
        if 'order_ctn' in data:
            item.order_ctn = data['order_ctn']
        if 'qty_per_ctn' in data:
            item.qty_per_ctn = data['qty_per_ctn']
        if 'spek_kain' in data:
            item.spek_kain = data['spek_kain']
        if 'no_spk' in data:
            item.no_spk = data['no_spk']
        if 'color' in data:
            item.color = data['color']
        if 'schedule_days' in data:
            item.schedule_days = json.dumps(data['schedule_days'])
        if 'notes' in data:
            item.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Schedule item updated',
            'schedule': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@schedule_grid_bp.route('/schedule-grid/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_schedule_item(id):
    """Delete schedule grid item"""
    try:
        item = ScheduleGridItem.query.get_or_404(id)
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'Schedule item deleted'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@schedule_grid_bp.route('/schedule-grid/notes', methods=['POST'])
@jwt_required()
def save_schedule_notes():
    """Save notes for a week"""
    try:
        data = request.get_json()
        week_start_str = data.get('week_start')
        notes = data.get('notes', [])
        
        week_start = get_week_start(week_start_str)
        
        # Delete existing notes
        ScheduleGridNote.query.filter_by(week_start=week_start).delete()
        
        # Add new notes
        for idx, note_text in enumerate(notes):
            if note_text.strip():
                note = ScheduleGridNote(
                    week_start=week_start,
                    note_text=note_text.strip(),
                    order_index=idx
                )
                db.session.add(note)
        
        db.session.commit()
        
        return jsonify({'message': 'Notes saved'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


def generate_wo_number():
    """Generate unique Work Order number"""
    today = datetime.now()
    prefix = f"WO-{today.strftime('%Y%m')}-"
    
    # Find last WO number this month
    last_wo = WorkOrder.query.filter(
        WorkOrder.wo_number.like(f"{prefix}%")
    ).order_by(WorkOrder.wo_number.desc()).first()
    
    if last_wo:
        try:
            last_num = int(last_wo.wo_number.split('-')[-1])
            new_num = last_num + 1
        except:
            new_num = 1
    else:
        new_num = 1
    
    return f"{prefix}{new_num:05d}"


@schedule_grid_bp.route('/schedule-grid/<int:id>/generate-wo', methods=['POST'])
@jwt_required()
def generate_work_order_from_schedule(id):
    """Generate Work Order from a schedule item"""
    try:
        current_user_id = get_jwt_identity()
        schedule = ScheduleGridItem.query.get_or_404(id)
        
        # Check if WO already exists
        if schedule.wo_id:
            return jsonify({
                'error': 'Work Order sudah dibuat untuk jadwal ini',
                'wo_id': schedule.wo_id,
                'wo_number': schedule.work_order.wo_number if schedule.work_order else None
            }), 400
        
        # Get product's BOM if exists
        bom = BillOfMaterials.query.filter_by(
            product_id=schedule.product_id,
            is_active=True
        ).first()
        
        # Calculate quantity (order_ctn * qty_per_ctn = total pack)
        total_quantity = float(schedule.order_ctn or 0) * (schedule.qty_per_ctn or 1)
        
        # Get first scheduled date for this item
        schedule_days = json.loads(schedule.schedule_days) if schedule.schedule_days else {}
        first_date = None
        if schedule_days:
            sorted_dates = sorted(schedule_days.keys())
            if sorted_dates:
                first_date = datetime.strptime(sorted_dates[0], '%Y-%m-%d')
        
        # Create Work Order
        wo_number = generate_wo_number()
        work_order = WorkOrder(
            wo_number=wo_number,
            product_id=schedule.product_id,
            bom_id=bom.id if bom else None,
            quantity=total_quantity,
            uom='pack',
            machine_id=schedule.machine_id,
            scheduled_start_date=first_date,
            required_date=first_date.date() if first_date else None,
            status='planned',
            priority='normal',
            source_type='from_schedule',  # Mark as created from schedule
            schedule_grid_id=schedule.id,  # Link back to schedule
            workflow_status='pending',
            notes=f"Auto-generated from Production Schedule #{schedule.id}. Spek Kain: {schedule.spek_kain or '-'}",
            created_by=current_user_id
        )
        
        db.session.add(work_order)
        db.session.flush()  # Get the WO ID
        
        # Update schedule with WO reference
        schedule.wo_id = work_order.id
        schedule.no_spk = wo_number
        schedule.status = 'wo_created'
        
        db.session.commit()
        
        return jsonify({
            'message': f'Work Order {wo_number} berhasil dibuat',
            'work_order': {
                'id': work_order.id,
                'wo_number': work_order.wo_number,
                'product_name': schedule.product.name if schedule.product else None,
                'quantity': float(work_order.quantity),
                'machine_name': schedule.machine.name if schedule.machine else None,
                'scheduled_start_date': work_order.scheduled_start_date.isoformat() if work_order.scheduled_start_date else None
            },
            'schedule': schedule.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@schedule_grid_bp.route('/schedule-grid/generate-wo-batch', methods=['POST'])
@jwt_required()
def generate_work_orders_batch():
    """Generate Work Orders for all schedules on a specific date or today"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        target_date_str = data.get('date')
        
        if target_date_str:
            target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
        else:
            target_date = datetime.now().date()
        
        # Find all schedules that have this date in their schedule_days and no WO yet
        all_schedules = ScheduleGridItem.query.filter(
            ScheduleGridItem.wo_id.is_(None),
            ScheduleGridItem.status == 'planned'
        ).all()
        
        created_wos = []
        
        for schedule in all_schedules:
            schedule_days = json.loads(schedule.schedule_days) if schedule.schedule_days else {}
            target_date_str_check = target_date.isoformat()
            
            # Check if target date is in this schedule's days
            if target_date_str_check in schedule_days:
                # Get product's BOM
                bom = BillOfMaterials.query.filter_by(
                    product_id=schedule.product_id,
                    is_active=True
                ).first()
                
                # Calculate quantity
                total_quantity = float(schedule.order_ctn or 0) * (schedule.qty_per_ctn or 1)
                
                # Create Work Order
                wo_number = generate_wo_number()
                work_order = WorkOrder(
                    wo_number=wo_number,
                    product_id=schedule.product_id,
                    bom_id=bom.id if bom else None,
                    quantity=total_quantity,
                    uom='pack',
                    machine_id=schedule.machine_id,
                    scheduled_start_date=datetime.combine(target_date, datetime.min.time()),
                    required_date=target_date,
                    status='planned',
                    priority='normal',
                    workflow_status='pending',
                    notes=f"Auto-generated from Production Schedule #{schedule.id}. Spek Kain: {schedule.spek_kain or '-'}",
                    created_by=current_user_id
                )
                
                db.session.add(work_order)
                db.session.flush()
                
                # Update schedule
                schedule.wo_id = work_order.id
                schedule.no_spk = wo_number
                schedule.status = 'wo_created'
                
                created_wos.append({
                    'wo_number': wo_number,
                    'product_name': schedule.product.name if schedule.product else None,
                    'quantity': total_quantity,
                    'machine_name': schedule.machine.name if schedule.machine else None
                })
        
        db.session.commit()
        
        return jsonify({
            'message': f'{len(created_wos)} Work Order berhasil dibuat untuk tanggal {target_date.isoformat()}',
            'work_orders': created_wos
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@schedule_grid_bp.route('/schedule-grid/check-today', methods=['GET'])
@jwt_required()
def check_schedules_for_today():
    """Check schedules that need WO generation for today"""
    try:
        today = datetime.now().date()
        today_str = today.isoformat()
        
        # Find schedules for today without WO
        all_schedules = ScheduleGridItem.query.filter(
            ScheduleGridItem.wo_id.is_(None),
            ScheduleGridItem.status == 'planned'
        ).all()
        
        pending_schedules = []
        
        for schedule in all_schedules:
            schedule_days = json.loads(schedule.schedule_days) if schedule.schedule_days else {}
            
            if today_str in schedule_days:
                pending_schedules.append({
                    'id': schedule.id,
                    'product_name': schedule.product.name if schedule.product else None,
                    'machine_name': schedule.machine.name if schedule.machine else None,
                    'order_ctn': float(schedule.order_ctn or 0),
                    'qty_per_ctn': schedule.qty_per_ctn or 0,
                    'shifts': schedule_days.get(today_str, [])
                })
        
        return jsonify({
            'date': today_str,
            'pending_count': len(pending_schedules),
            'pending_schedules': pending_schedules
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============= MONTHLY SCHEDULE ROUTES =============

@schedule_grid_bp.route('/monthly-schedule', methods=['GET'])
@jwt_required()
def get_monthly_schedules():
    """Get monthly schedules for a specific month/year"""
    try:
        year = request.args.get('year', datetime.now().year, type=int)
        month = request.args.get('month', datetime.now().month, type=int)
        
        schedules = MonthlySchedule.query.filter_by(
            year=year,
            month=month
        ).order_by(MonthlySchedule.priority.desc(), MonthlySchedule.product_id).all()
        
        return jsonify({
            'year': year,
            'month': month,
            'schedules': [s.to_dict() for s in schedules]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@schedule_grid_bp.route('/monthly-schedule', methods=['POST'])
@jwt_required()
def create_monthly_schedule():
    """Create new monthly schedule item"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Check if already exists
        existing = MonthlySchedule.query.filter_by(
            year=data['year'],
            month=data['month'],
            product_id=data['product_id'],
            machine_id=data.get('machine_id')
        ).first()
        
        if existing:
            return jsonify({'error': 'Jadwal untuk produk ini di bulan tersebut sudah ada'}), 400
        
        schedule = MonthlySchedule(
            year=data['year'],
            month=data['month'],
            product_id=data['product_id'],
            machine_id=data.get('machine_id'),
            target_ctn=data.get('target_ctn', 0),
            priority=data.get('priority', 'normal'),
            spek_kain=data.get('spek_kain'),
            color=data.get('color', 'bg-blue-500'),
            notes=data.get('notes'),
            status='draft',
            created_by=user_id
        )
        
        db.session.add(schedule)
        db.session.commit()
        
        return jsonify({
            'message': 'Monthly schedule created',
            'schedule': schedule.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@schedule_grid_bp.route('/monthly-schedule/<int:id>', methods=['PUT'])
@jwt_required()
def update_monthly_schedule(id):
    """Update monthly schedule item"""
    try:
        schedule = MonthlySchedule.query.get_or_404(id)
        data = request.get_json()
        
        if 'target_ctn' in data:
            schedule.target_ctn = data['target_ctn']
        if 'machine_id' in data:
            schedule.machine_id = data['machine_id']
        if 'priority' in data:
            schedule.priority = data['priority']
        if 'spek_kain' in data:
            schedule.spek_kain = data['spek_kain']
        if 'color' in data:
            schedule.color = data['color']
        if 'notes' in data:
            schedule.notes = data['notes']
        if 'status' in data:
            schedule.status = data['status']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Monthly schedule updated',
            'schedule': schedule.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@schedule_grid_bp.route('/monthly-schedule/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_monthly_schedule(id):
    """Delete monthly schedule item"""
    try:
        schedule = MonthlySchedule.query.get_or_404(id)
        
        # Check if has weekly schedules linked
        if schedule.weekly_schedules:
            return jsonify({'error': 'Tidak bisa hapus karena sudah ada jadwal mingguan terkait'}), 400
        
        db.session.delete(schedule)
        db.session.commit()
        
        return jsonify({'message': 'Monthly schedule deleted'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@schedule_grid_bp.route('/monthly-schedule/<int:id>/add-to-weekly', methods=['POST'])
@jwt_required()
def add_monthly_to_weekly(id):
    """Add portion of monthly schedule to weekly schedule"""
    try:
        monthly = MonthlySchedule.query.get_or_404(id)
        data = request.get_json()
        
        order_ctn = float(data.get('order_ctn', 0))
        week_start_str = data.get('week_start')
        schedule_days = data.get('schedule_days', {})
        
        if order_ctn <= 0:
            return jsonify({'error': 'Order CTN harus lebih dari 0'}), 400
        
        # Check remaining
        remaining = float(monthly.target_ctn or 0) - float(monthly.scheduled_ctn or 0)
        if order_ctn > remaining:
            return jsonify({'error': f'Melebihi sisa target. Sisa: {remaining} CTN'}), 400
        
        # Parse week start
        week_start = get_week_start(week_start_str)
        
        # Create weekly schedule item
        weekly_item = ScheduleGridItem(
            machine_id=monthly.machine_id,
            product_id=monthly.product_id,
            week_start=week_start,
            order_ctn=order_ctn,
            qty_per_ctn=monthly.product.packaging.packs_per_karton if monthly.product and monthly.product.packaging else 0,
            spek_kain=monthly.spek_kain,
            color=monthly.color,
            schedule_days=json.dumps(schedule_days),
            monthly_schedule_id=monthly.id,
            status='planned',
            notes=data.get('notes', f'Dari jadwal bulanan {monthly.year}-{monthly.month:02d}')
        )
        
        db.session.add(weekly_item)
        
        # Update monthly scheduled amount
        monthly.scheduled_ctn = float(monthly.scheduled_ctn or 0) + order_ctn
        if monthly.status == 'draft':
            monthly.status = 'in_progress'
        
        db.session.commit()
        
        return jsonify({
            'message': f'{order_ctn} CTN berhasil ditambahkan ke jadwal minggu {week_start.isoformat()}',
            'weekly_schedule': weekly_item.to_dict(),
            'monthly_remaining': float(monthly.target_ctn or 0) - float(monthly.scheduled_ctn or 0)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@schedule_grid_bp.route('/monthly-schedule/available', methods=['GET'])
@jwt_required()
def get_available_monthly_schedules():
    """Get monthly schedules that have remaining quantity for a specific week"""
    try:
        week_start_str = request.args.get('week_start')
        week_start = get_week_start(week_start_str)
        
        # Get year and month from week start
        year = week_start.year
        month = week_start.month
        
        # Also check previous month if week spans two months
        schedules = MonthlySchedule.query.filter(
            MonthlySchedule.year == year,
            MonthlySchedule.month == month,
            MonthlySchedule.status.in_(['draft', 'approved', 'in_progress'])
        ).all()
        
        # Filter only those with remaining quantity
        available = []
        for s in schedules:
            remaining = float(s.target_ctn or 0) - float(s.scheduled_ctn or 0)
            if remaining > 0:
                data = s.to_dict()
                data['remaining_ctn'] = remaining
                available.append(data)
        
        return jsonify({
            'week_start': week_start.isoformat(),
            'year': year,
            'month': month,
            'available_schedules': available
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
