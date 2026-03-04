from datetime import datetime
from . import db


class KPITarget(db.Model):
    """KPI Target configuration for Performance Scorecard"""
    __tablename__ = 'kpi_targets'
    
    id = db.Column(db.Integer, primary_key=True)
    kpi_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    kpi_name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(100), nullable=False)  # Financial, Production, Quality, Sales, Inventory
    target_value = db.Column(db.Numeric(15, 2), nullable=False)
    unit = db.Column(db.String(50), nullable=False)  # IDR, %, times/year, etc.
    warning_threshold = db.Column(db.Numeric(5, 2), default=80)  # % of target to show warning
    critical_threshold = db.Column(db.Numeric(5, 2), default=60)  # % of target to show critical
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    period_type = db.Column(db.String(20), default='monthly')  # daily, weekly, monthly, quarterly, yearly
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    def __repr__(self):
        return f'<KPITarget {self.kpi_code}: {self.target_value} {self.unit}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'kpi_code': self.kpi_code,
            'kpi_name': self.kpi_name,
            'category': self.category,
            'target_value': float(self.target_value),
            'unit': self.unit,
            'warning_threshold': float(self.warning_threshold) if self.warning_threshold else 80,
            'critical_threshold': float(self.critical_threshold) if self.critical_threshold else 60,
            'description': self.description,
            'is_active': self.is_active,
            'period_type': self.period_type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


# Default KPI targets to seed
DEFAULT_KPI_TARGETS = [
    {
        'kpi_code': 'REVENUE',
        'kpi_name': 'Revenue Achievement',
        'category': 'Financial',
        'target_value': 500000000,  # 500 juta
        'unit': 'IDR',
        'warning_threshold': 80,
        'critical_threshold': 60,
        'description': 'Total revenue dari invoice yang sudah dibayar',
        'period_type': 'monthly'
    },
    {
        'kpi_code': 'OEE',
        'kpi_name': 'Overall Equipment Effectiveness',
        'category': 'Production',
        'target_value': 85,
        'unit': '%',
        'warning_threshold': 88,  # 88% of 85 = ~75%
        'critical_threshold': 70,
        'description': 'Efektivitas keseluruhan peralatan produksi',
        'period_type': 'monthly'
    },
    {
        'kpi_code': 'QUALITY_PASS',
        'kpi_name': 'Quality Pass Rate',
        'category': 'Quality',
        'target_value': 95,
        'unit': '%',
        'warning_threshold': 95,  # 95% of 95 = ~90%
        'critical_threshold': 85,
        'description': 'Persentase produk yang lolos inspeksi kualitas',
        'period_type': 'monthly'
    },
    {
        'kpi_code': 'OTD',
        'kpi_name': 'On-Time Delivery Rate',
        'category': 'Sales',
        'target_value': 95,
        'unit': '%',
        'warning_threshold': 89,
        'critical_threshold': 80,
        'description': 'Persentase pengiriman tepat waktu',
        'period_type': 'monthly'
    },
    {
        'kpi_code': 'INVENTORY_TURN',
        'kpi_name': 'Inventory Turnover Ratio',
        'category': 'Inventory',
        'target_value': 10,
        'unit': 'times/year',
        'warning_threshold': 80,
        'critical_threshold': 60,
        'description': 'Rasio perputaran inventory per tahun',
        'period_type': 'yearly'
    },
    {
        'kpi_code': 'PRODUCTION_OUTPUT',
        'kpi_name': 'Production Output',
        'category': 'Production',
        'target_value': 100000,  # 100,000 units
        'unit': 'units',
        'warning_threshold': 80,
        'critical_threshold': 60,
        'description': 'Total output produksi per bulan',
        'period_type': 'monthly'
    },
    {
        'kpi_code': 'DEFECT_RATE',
        'kpi_name': 'Defect Rate',
        'category': 'Quality',
        'target_value': 2,  # Max 2%
        'unit': '%',
        'warning_threshold': 150,  # 150% of 2 = 3%
        'critical_threshold': 200,  # 200% of 2 = 4%
        'description': 'Persentase produk cacat (target: semakin rendah semakin baik)',
        'period_type': 'monthly'
    }
]


def seed_kpi_targets():
    """Seed default KPI targets if not exist"""
    for kpi_data in DEFAULT_KPI_TARGETS:
        existing = KPITarget.query.filter_by(kpi_code=kpi_data['kpi_code']).first()
        if not existing:
            kpi = KPITarget(**kpi_data)
            db.session.add(kpi)
    db.session.commit()
