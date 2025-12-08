"""
Production Schedule Grid Routes
Excel-style weekly production schedule with machine/product/shift grid
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Machine, Product
from datetime import datetime, timedelta
import json

schedule_grid_bp = Blueprint('schedule_grid', __name__)

# Simple in-memory storage for schedule grid (will be replaced with DB model)
# In production, create a proper ScheduleGrid model

class ScheduleGridItem(db.Model):
    __tablename__ = 'schedule_grid_items'
    
    id = db.Column(db.Integer, primary_key=True)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    week_start = db.Column(db.Date, nullable=False)
    order_ctn = db.Column(db.Numeric(15, 2), default=0)
    qty_per_ctn = db.Column(db.Integer, default=0)
    spek_kain = db.Column(db.String(100))
    no_spk = db.Column(db.String(50))
    color = db.Column(db.String(50), default='bg-blue-500')
    schedule_days = db.Column(db.Text)  # JSON: {"2025-12-08": [1, 2], "2025-12-09": [1]}
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    machine = db.relationship('Machine', backref='schedule_grid_items')
    product = db.relationship('Product', backref='schedule_grid_items')
    
    def to_dict(self):
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
            'qty_per_ctn': self.qty_per_ctn or 0,
            'order_pack': float(self.order_ctn or 0) * (self.qty_per_ctn or 0),
            'spek_kain': self.spek_kain,
            'no_spk': self.no_spk,
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
