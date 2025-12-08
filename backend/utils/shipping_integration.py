"""
Shipping integration utilities
"""

from models.shipping import ShippingOrder, ShippingItem, LogisticsProvider
from models.sales import SalesOrder, SalesOrderItem
from models import db, Customer
from utils import generate_number
from datetime import datetime, timedelta
import random

def create_shipping_from_sales_order(sales_order_id, logistics_provider_id=None, service_type='regular'):
    """
    Create shipping order automatically from sales order
    """
    try:
        # Get sales order
        sales_order = SalesOrder.query.get(sales_order_id)
        if not sales_order:
            raise ValueError("Sales order not found")
        
        # Get customer
        customer = Customer.query.get(sales_order.customer_id)
        if not customer:
            raise ValueError("Customer not found")
        
        # Get logistics provider (use first active if not specified)
        if logistics_provider_id:
            provider = LogisticsProvider.query.get(logistics_provider_id)
        else:
            provider = LogisticsProvider.query.filter_by(is_active=True).first()
        
        if not provider:
            raise ValueError("No active logistics provider found")
        
        # Generate shipping number
        shipping_number = generate_number('SHP', ShippingOrder, 'shipping_number')
        
        # Calculate estimated delivery (2-5 days from now based on service type)
        delivery_days = {
            'same_day': 1,
            'next_day': 1,
            'express': 2,
            'regular': 3
        }
        estimated_delivery = datetime.now() + timedelta(days=delivery_days.get(service_type, 3))
        
        # Create shipping order
        shipping_order = ShippingOrder(
            shipping_number=shipping_number,
            customer_id=customer.id,
            customer_name=customer.company_name or customer.name,
            sales_order_id=sales_order.id,
            logistics_provider_id=provider.id,
            shipping_date=datetime.now(),
            estimated_delivery=estimated_delivery,
            recipient_name=customer.company_name or customer.name,
            recipient_address=sales_order.delivery_address or customer.address or "Alamat tidak tersedia",
            recipient_phone=customer.phone or "Phone tidak tersedia",
            sender_name="PT. Gratia Makmur Sentosa",
            sender_address="Jl. Industri No. 123, Tangerang, Banten 15134",
            sender_phone="021-12345678",
            service_type=service_type,
            status='preparing',
            notes=f"Auto-generated from Sales Order {sales_order.order_number}",
            tracking_number=f"TRK{datetime.now().strftime('%Y%m%d')}{random.randint(100000, 999999)}"
        )
        
        db.session.add(shipping_order)
        db.session.flush()  # Get shipping_order.id
        
        # Create shipping items from sales order items
        total_weight = 0
        total_value = 0
        
        for sales_item in sales_order.items:
            # Get product info
            product = sales_item.product
            
            # Estimate weight and dimensions (you can customize this based on your products)
            estimated_weight = calculate_product_weight(product, sales_item.quantity)
            estimated_dimensions = calculate_product_dimensions(product, sales_item.quantity)
            
            shipping_item = ShippingItem(
                shipping_order_id=shipping_order.id,
                product_name=product.name if product else sales_item.description,
                quantity=sales_item.quantity,
                weight=estimated_weight,
                length=estimated_dimensions['length'],
                width=estimated_dimensions['width'],
                height=estimated_dimensions['height'],
                value=float(sales_item.total_price)
            )
            
            db.session.add(shipping_item)
            total_weight += estimated_weight
            total_value += float(sales_item.total_price)
        
        # Calculate shipping cost (simple calculation - can be enhanced)
        shipping_cost = calculate_shipping_cost(total_weight, service_type, provider.pricing_model)
        
        # Update shipping order totals
        shipping_order.total_weight = total_weight
        shipping_order.total_value = total_value
        shipping_order.shipping_cost = shipping_cost
        
        db.session.commit()
        
        return shipping_order
        
    except Exception as e:
        db.session.rollback()
        raise e

def calculate_product_weight(product, quantity):
    """
    Calculate estimated weight for product
    """
    if product and hasattr(product, 'weight') and product.weight:
        return float(product.weight) * quantity
    else:
        # Default weight estimation for nonwoven products (kg per unit)
        return 0.5 * quantity

def calculate_product_dimensions(product, quantity):
    """
    Calculate estimated dimensions for product
    """
    if product and hasattr(product, 'length') and product.length:
        return {
            'length': float(product.length or 30),
            'width': float(product.width or 20),
            'height': float(product.height or 10) * (quantity // 10 + 1)  # Stack items
        }
    else:
        # Default dimensions for nonwoven products (cm)
        return {
            'length': 30,
            'width': 20,
            'height': 10 * (quantity // 10 + 1)
        }

def calculate_shipping_cost(total_weight, service_type, pricing_model):
    """
    Calculate shipping cost based on weight and service type
    """
    base_costs = {
        'same_day': 50000,
        'next_day': 35000,
        'express': 25000,
        'regular': 15000
    }
    
    base_cost = base_costs.get(service_type, 15000)
    
    if pricing_model == 'weight_based':
        # Rp 2000 per kg
        weight_cost = total_weight * 2000
        return base_cost + weight_cost
    elif pricing_model == 'distance_based':
        # Flat rate for now (can be enhanced with actual distance calculation)
        return base_cost + 10000
    else:
        return base_cost

def update_sales_order_shipping_status(sales_order_id, shipping_status):
    """
    Update sales order status based on shipping status
    """
    try:
        sales_order = SalesOrder.query.get(sales_order_id)
        if not sales_order:
            return False
        
        # Map shipping status to sales order status
        status_mapping = {
            'preparing': 'processing',
            'packed': 'ready_to_ship',
            'shipped': 'shipped',
            'in_transit': 'shipped',
            'delivered': 'delivered',
            'cancelled': 'cancelled'
        }
        
        new_status = status_mapping.get(shipping_status)
        if new_status and sales_order.status != new_status:
            sales_order.status = new_status
            db.session.commit()
            return True
            
        return False
        
    except Exception as e:
        db.session.rollback()
        raise e
