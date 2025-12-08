from datetime import datetime
from . import db

class LogisticsProvider(db.Model):
    __tablename__ = 'logistics_providers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    service_type = db.Column(db.String(100), nullable=True)  # regular, express, same_day, next_day
    contact_info = db.Column(db.String(255), nullable=True)
    pricing_model = db.Column(db.String(50), nullable=True)  # weight_based, distance_based, flat_rate
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    shipping_orders = db.relationship('ShippingOrder', back_populates='logistics_provider')

class ShippingOrder(db.Model):
    __tablename__ = 'shipping_orders'
    
    id = db.Column(db.Integer, primary_key=True)
    shipping_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    customer_name = db.Column(db.String(255), nullable=False)
    sales_order_id = db.Column(db.Integer, db.ForeignKey('sales_orders.id'), nullable=True)
    logistics_provider_id = db.Column(db.Integer, db.ForeignKey('logistics_providers.id'), nullable=True)
    
    # Dates
    shipping_date = db.Column(db.DateTime, nullable=False)
    estimated_delivery = db.Column(db.DateTime, nullable=True)
    actual_delivery = db.Column(db.DateTime, nullable=True)
    
    # Addresses
    recipient_name = db.Column(db.String(255), nullable=False)
    recipient_address = db.Column(db.Text, nullable=False)
    recipient_phone = db.Column(db.String(50), nullable=False)
    sender_name = db.Column(db.String(255), nullable=False)
    sender_address = db.Column(db.Text, nullable=False)
    sender_phone = db.Column(db.String(50), nullable=False)
    
    # Service details
    service_type = db.Column(db.String(50), nullable=False, default='regular')  # regular, express, same_day, next_day
    status = db.Column(db.String(50), nullable=False, default='preparing')  # preparing, packed, shipped, in_transit, delivered, cancelled
    tracking_number = db.Column(db.String(200), nullable=True)
    
    # Totals
    total_weight = db.Column(db.Numeric(15, 2), default=0)
    total_value = db.Column(db.Numeric(15, 2), default=0)
    shipping_cost = db.Column(db.Numeric(15, 2), default=0)
    insurance_value = db.Column(db.Numeric(15, 2), default=0)
    cod_amount = db.Column(db.Numeric(15, 2), default=0)
    
    # Additional info
    notes = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = db.relationship('Customer')
    sales_order = db.relationship('SalesOrder', back_populates='shipping_orders')
    logistics_provider = db.relationship('LogisticsProvider', back_populates='shipping_orders')
    items = db.relationship('ShippingItem', back_populates='shipping_order', cascade='all, delete-orphan')
    tracking_history = db.relationship('DeliveryTracking', back_populates='shipping_order', cascade='all, delete-orphan')
    created_by_user = db.relationship('User')

class ShippingItem(db.Model):
    __tablename__ = 'shipping_items'
    
    id = db.Column(db.Integer, primary_key=True)
    shipping_order_id = db.Column(db.Integer, db.ForeignKey('shipping_orders.id', ondelete='CASCADE'), nullable=False)
    product_name = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    weight = db.Column(db.Numeric(15, 2), nullable=False)  # in kg
    length = db.Column(db.Numeric(15, 2), nullable=False)  # in cm
    width = db.Column(db.Numeric(15, 2), nullable=False)   # in cm
    height = db.Column(db.Numeric(15, 2), nullable=False)  # in cm
    value = db.Column(db.Numeric(15, 2), nullable=False)   # item value in currency
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    shipping_order = db.relationship('ShippingOrder', back_populates='items')

class DeliveryTracking(db.Model):
    __tablename__ = 'delivery_tracking'
    
    id = db.Column(db.Integer, primary_key=True)
    shipping_order_id = db.Column(db.Integer, db.ForeignKey('shipping_orders.id', ondelete='CASCADE'), nullable=False)
    tracking_number = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(50), nullable=False)  # picked_up, in_transit, out_for_delivery, delivered, failed
    location = db.Column(db.String(200), nullable=True)
    description = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    logistics_provider_id = db.Column(db.Integer, db.ForeignKey('logistics_providers.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    shipping_order = db.relationship('ShippingOrder', back_populates='tracking_history')
    logistics_provider = db.relationship('LogisticsProvider')
