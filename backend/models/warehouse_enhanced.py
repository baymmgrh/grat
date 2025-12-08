from datetime import datetime, date
from . import db
from sqlalchemy import func

class WarehouseAnalytics(db.Model):
    """Enhanced warehouse analytics and KPIs"""
    __tablename__ = 'warehouse_analytics'
    
    id = db.Column(db.Integer, primary_key=True)
    warehouse_id = db.Column(db.Integer, nullable=True)  # For multi-warehouse support
    analysis_date = db.Column(db.Date, nullable=False, default=date.today)
    analysis_type = db.Column(db.String(50), nullable=False)  # daily, weekly, monthly
    
    # Inventory Metrics
    total_products = db.Column(db.Integer, default=0)
    total_quantity = db.Column(db.Numeric(15, 2), default=0)
    total_value = db.Column(db.Numeric(15, 2), default=0)
    
    # Turnover Metrics
    inventory_turnover = db.Column(db.Numeric(10, 4), default=0)
    days_of_supply = db.Column(db.Numeric(10, 2), default=0)
    
    # Movement Metrics
    total_receipts = db.Column(db.Numeric(15, 2), default=0)
    total_issues = db.Column(db.Numeric(15, 2), default=0)
    total_transfers = db.Column(db.Numeric(15, 2), default=0)
    total_adjustments = db.Column(db.Numeric(15, 2), default=0)
    
    # Utilization Metrics
    storage_utilization = db.Column(db.Numeric(5, 2), default=0)  # Percentage
    location_utilization = db.Column(db.Numeric(5, 2), default=0)  # Percentage
    
    # ABC Analysis Results
    category_a_products = db.Column(db.Integer, default=0)
    category_b_products = db.Column(db.Integer, default=0)
    category_c_products = db.Column(db.Integer, default=0)
    category_a_value = db.Column(db.Numeric(15, 2), default=0)
    category_b_value = db.Column(db.Numeric(15, 2), default=0)
    category_c_value = db.Column(db.Numeric(15, 2), default=0)
    
    # Performance Metrics
    stockout_incidents = db.Column(db.Integer, default=0)
    overstock_incidents = db.Column(db.Integer, default=0)
    expired_products = db.Column(db.Integer, default=0)
    expired_value = db.Column(db.Numeric(15, 2), default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        db.Index('idx_warehouse_date', 'warehouse_id', 'analysis_date'),
    )

class ProductABCClassification(db.Model):
    """ABC Classification for products based on value/movement"""
    __tablename__ = 'product_abc_classification'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    warehouse_id = db.Column(db.Integer, nullable=True)
    
    # Classification
    abc_category = db.Column(db.String(1), nullable=False)  # A, B, C
    xyz_category = db.Column(db.String(1), nullable=True)  # X, Y, Z (demand variability)
    
    # Analysis Period
    analysis_period_start = db.Column(db.Date, nullable=False)
    analysis_period_end = db.Column(db.Date, nullable=False)
    
    # Metrics
    total_consumption = db.Column(db.Numeric(15, 2), default=0)
    total_value = db.Column(db.Numeric(15, 2), default=0)
    average_monthly_consumption = db.Column(db.Numeric(15, 2), default=0)
    consumption_variance = db.Column(db.Numeric(15, 4), default=0)
    
    # Recommendations
    recommended_reorder_point = db.Column(db.Numeric(15, 2), default=0)
    recommended_max_stock = db.Column(db.Numeric(15, 2), default=0)
    recommended_safety_stock = db.Column(db.Numeric(15, 2), default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product')
    
    __table_args__ = (
        db.Index('idx_product_warehouse', 'product_id', 'warehouse_id'),
    )

class InventoryReorderPoint(db.Model):
    """Smart reorder points and inventory optimization"""
    __tablename__ = 'inventory_reorder_points'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    warehouse_id = db.Column(db.Integer, nullable=True)
    location_id = db.Column(db.Integer, db.ForeignKey('warehouse_locations.id'), nullable=True)
    
    # Reorder Parameters
    reorder_point = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    reorder_quantity = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    safety_stock = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    maximum_stock = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    
    # Lead Time
    lead_time_days = db.Column(db.Integer, default=0)
    lead_time_variance = db.Column(db.Numeric(5, 2), default=0)
    
    # Demand Forecasting
    average_daily_demand = db.Column(db.Numeric(15, 2), default=0)
    demand_variance = db.Column(db.Numeric(15, 4), default=0)
    seasonal_factor = db.Column(db.Numeric(5, 4), default=1.0)
    
    # Service Level
    service_level_target = db.Column(db.Numeric(5, 2), default=95.0)  # Percentage
    
    # Status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    auto_reorder_enabled = db.Column(db.Boolean, default=False, nullable=False)
    
    # Audit
    last_calculated = db.Column(db.DateTime, default=datetime.utcnow)
    calculation_method = db.Column(db.String(50), default='statistical')  # statistical, manual, ml
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product')
    location = db.relationship('WarehouseLocation')
    
    __table_args__ = (
        db.UniqueConstraint('product_id', 'warehouse_id', 'location_id', name='unique_reorder_point'),
    )

class WarehouseAlert(db.Model):
    """Warehouse alerts and notifications"""
    __tablename__ = 'warehouse_alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    alert_number = db.Column(db.String(50), unique=True, nullable=False)
    alert_type = db.Column(db.String(50), nullable=False)  # low_stock, overstock, expiry, movement_anomaly
    severity = db.Column(db.String(20), nullable=False)  # low, medium, high, critical
    
    # Alert Details
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    
    # References
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    location_id = db.Column(db.Integer, db.ForeignKey('warehouse_locations.id'), nullable=True)
    warehouse_id = db.Column(db.Integer, nullable=True)
    
    # Threshold Values
    threshold_value = db.Column(db.Numeric(15, 2), nullable=True)
    actual_value = db.Column(db.Numeric(15, 2), nullable=True)
    
    # Status
    status = db.Column(db.String(20), default='active', nullable=False)  # active, acknowledged, resolved
    acknowledged_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    acknowledged_at = db.Column(db.DateTime, nullable=True)
    resolved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    resolution_notes = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product')
    location = db.relationship('WarehouseLocation')
    acknowledged_by_user = db.relationship('User', foreign_keys=[acknowledged_by])
    resolved_by_user = db.relationship('User', foreign_keys=[resolved_by])

class WarehouseOptimization(db.Model):
    """Warehouse layout and picking optimization"""
    __tablename__ = 'warehouse_optimization'
    
    id = db.Column(db.Integer, primary_key=True)
    warehouse_id = db.Column(db.Integer, nullable=True)
    optimization_type = db.Column(db.String(50), nullable=False)  # layout, picking_route, slotting
    
    # Optimization Parameters
    optimization_date = db.Column(db.Date, default=date.today)
    algorithm_used = db.Column(db.String(50), nullable=False)
    
    # Results
    current_efficiency = db.Column(db.Numeric(5, 2), default=0)
    optimized_efficiency = db.Column(db.Numeric(5, 2), default=0)
    improvement_percentage = db.Column(db.Numeric(5, 2), default=0)
    
    # Recommendations
    recommendations = db.Column(db.JSON, nullable=True)
    implementation_status = db.Column(db.String(20), default='pending')  # pending, in_progress, completed
    
    # Performance Metrics
    average_picking_time = db.Column(db.Numeric(10, 2), default=0)  # minutes
    average_travel_distance = db.Column(db.Numeric(10, 2), default=0)  # meters
    storage_density = db.Column(db.Numeric(5, 2), default=0)  # percentage
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class StockMovementForecast(db.Model):
    """Demand forecasting and stock movement predictions"""
    __tablename__ = 'stock_movement_forecast'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    warehouse_id = db.Column(db.Integer, nullable=True)
    
    # Forecast Period
    forecast_date = db.Column(db.Date, nullable=False)
    forecast_period = db.Column(db.String(20), nullable=False)  # daily, weekly, monthly
    
    # Forecast Values
    predicted_demand = db.Column(db.Numeric(15, 2), default=0)
    predicted_receipts = db.Column(db.Numeric(15, 2), default=0)
    predicted_stock_level = db.Column(db.Numeric(15, 2), default=0)
    
    # Confidence Metrics
    confidence_level = db.Column(db.Numeric(5, 2), default=0)  # percentage
    forecast_accuracy = db.Column(db.Numeric(5, 2), default=0)  # percentage
    
    # Model Information
    model_type = db.Column(db.String(50), default='moving_average')  # moving_average, exponential_smoothing, arima, ml
    model_parameters = db.Column(db.JSON, nullable=True)
    
    # Actual vs Predicted (for accuracy tracking)
    actual_demand = db.Column(db.Numeric(15, 2), nullable=True)
    actual_receipts = db.Column(db.Numeric(15, 2), nullable=True)
    actual_stock_level = db.Column(db.Numeric(15, 2), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product')
    
    __table_args__ = (
        db.Index('idx_product_forecast_date', 'product_id', 'forecast_date'),
    )
