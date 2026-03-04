from datetime import datetime
import json
from . import db

class ConvertingMachine(db.Model):
    """Mesin-mesin Converting:
    - 2x Perforating
    - 2x Slitting
    - 1x Laminasi Kain
    - 1x Bagmaker
    - 1x Folding 200 (1)
    - 1x Folding 200 (2)
    - 1x Folding 280
    - 1x Folding 320
    - 1x Folding 600
    - 1x Cutting
    Total: 12 mesin
    """
    __tablename__ = 'converting_machines'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    machine_type = db.Column(db.String(100), nullable=False)  # perforating, slitting, laminasi, bagmaker, folding, cutting
    status = db.Column(db.String(50), nullable=False, default='idle')  # idle, running, maintenance, breakdown
    default_speed = db.Column(db.Integer, default=0)  # pcs/menit
    target_efficiency = db.Column(db.Integer, default=60)  # Target efficiency %
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    productions = db.relationship('ConvertingProduction', back_populates='machine', lazy='dynamic')
    
    def __repr__(self):
        return f'<ConvertingMachine {self.code} - {self.name}>'


class ConvertingProduction(db.Model):
    """Production record untuk Converting - dengan data spesifik per jenis mesin"""
    __tablename__ = 'converting_productions'
    
    id = db.Column(db.Integer, primary_key=True)
    production_date = db.Column(db.Date, nullable=False, index=True)
    shift = db.Column(db.Integer, nullable=False, default=1)  # 1, 2, 3
    machine_id = db.Column(db.Integer, db.ForeignKey('converting_machines.id'), nullable=False)
    
    # Common fields untuk semua mesin
    njo = db.Column(db.String(100), nullable=True)  # Nomor Job Order
    product_name = db.Column(db.String(200), nullable=True)
    specification = db.Column(db.String(500), nullable=True)
    
    # Production Result (Grade A, B, Loss) - untuk Perforating, Folding, Cutting
    grade_a = db.Column(db.Numeric(15, 2), default=0)  # kg atau pcs
    grade_b = db.Column(db.Numeric(15, 2), default=0)
    loss_kg = db.Column(db.Numeric(15, 2), default=0)
    
    # Machine-specific data disimpan sebagai JSON
    # Slitting: {rows: [{no_roll, width, weight, length, thick, slitting: [kg1..kg10], loss, total_length, total_weight}]}
    # Perforating: {rows: [{no_roll, width, weight, length, repeat_length, repeat_width}]}
    # Folding: {rows: [{no_roll, no_slitting, weight, length}]}
    # Cutting: {rows: [{no_roll, width, weight, length, repeat_length, repeat_width}]}
    # Laminasi: {film_axis: {...}, nonwoven_axis: {...}, rows: [{no, time_start, time_end, ...}]}
    machine_data = db.Column(db.Text, nullable=True)  # JSON string
    
    # Operator
    operator_name = db.Column(db.String(200), nullable=True)
    
    # Additional Info
    notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='completed')
    
    # Audit
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    machine = db.relationship('ConvertingMachine', back_populates='productions')
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    
    def get_machine_data(self):
        """Parse machine_data JSON"""
        if self.machine_data:
            try:
                return json.loads(self.machine_data)
            except:
                return {}
        return {}
    
    def set_machine_data(self, data):
        """Set machine_data as JSON string"""
        self.machine_data = json.dumps(data) if data else None
    
    def __repr__(self):
        return f'<ConvertingProduction {self.id} - {self.production_date} Shift {self.shift}>'
