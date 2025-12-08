"""
Business Rules Module
Validation and controls for business operations
"""
from models import (
    db, Product, Inventory, Material, Customer, Supplier,
    Machine, BillOfMaterials, BOMItem
)
from sqlalchemy import func
from datetime import datetime, timedelta

class ValidationError(Exception):
    """Custom exception for business rule violations"""
    pass

class BusinessRules:
    """
    Business Rules Engine
    Validates business operations before execution
    """
    
    # ===============================
    # INVENTORY VALIDATION
    # ===============================
    
    @staticmethod
    def validate_inventory_availability(product_id, quantity, location_id=None):
        """
        Check if sufficient inventory is available
        
        Args:
            product_id: Product ID to check
            quantity: Required quantity
            location_id: Optional warehouse location
            
        Returns:
            dict: {
                'available': bool,
                'current_stock': float,
                'required': float,
                'shortage': float,
                'message': str
            }
        """
        try:
            # Get current inventory
            query = db.session.query(func.sum(Inventory.quantity)).filter(
                Inventory.product_id == product_id
            )
            
            if location_id:
                query = query.filter(Inventory.location_id == location_id)
            
            current_stock = query.scalar() or 0
            
            available = current_stock >= quantity
            shortage = max(0, quantity - current_stock)
            
            return {
                'available': available,
                'current_stock': float(current_stock),
                'required': float(quantity),
                'shortage': float(shortage),
                'message': 'Sufficient stock available' if available else f'Insufficient stock. Shortage: {shortage}'
            }
            
        except Exception as e:
            raise ValidationError(f'Error checking inventory: {str(e)}')
    
    @staticmethod
    def validate_material_availability(material_id, quantity):
        """
        Check if sufficient material is available for production
        
        Args:
            material_id: Material ID to check
            quantity: Required quantity
            
        Returns:
            dict: Availability status
        """
        try:
            material = Material.query.get(material_id)
            
            if not material:
                return {
                    'available': False,
                    'current_stock': 0,
                    'required': float(quantity),
                    'shortage': float(quantity),
                    'message': 'Material not found'
                }
            
            current_stock = material.current_stock or 0
            available = current_stock >= quantity
            shortage = max(0, quantity - current_stock)
            
            return {
                'available': available,
                'current_stock': float(current_stock),
                'required': float(quantity),
                'shortage': float(shortage),
                'material_name': material.name,
                'message': 'Sufficient material available' if available else f'Insufficient material. Shortage: {shortage}'
            }
            
        except Exception as e:
            raise ValidationError(f'Error checking material: {str(e)}')
    
    @staticmethod
    def check_low_stock(product_id=None, material_id=None):
        """
        Check if stock is below minimum level
        
        Args:
            product_id: Optional product ID
            material_id: Optional material ID
            
        Returns:
            dict: Low stock status
        """
        try:
            if product_id:
                product = Product.query.get(product_id)
                if not product:
                    return {'low_stock': False, 'message': 'Product not found'}
                
                # Get total inventory
                total_stock = db.session.query(func.sum(Inventory.quantity)).filter(
                    Inventory.product_id == product_id
                ).scalar() or 0
                
                min_stock = product.minimum_stock or 0
                low_stock = total_stock <= min_stock
                
                return {
                    'low_stock': low_stock,
                    'current_stock': float(total_stock),
                    'minimum_stock': float(min_stock),
                    'product_name': product.name,
                    'message': 'Stock below minimum level' if low_stock else 'Stock level OK'
                }
            
            elif material_id:
                material = Material.query.get(material_id)
                if not material:
                    return {'low_stock': False, 'message': 'Material not found'}
                
                current_stock = material.current_stock or 0
                min_stock = material.minimum_stock or 0
                low_stock = current_stock <= min_stock
                
                return {
                    'low_stock': low_stock,
                    'current_stock': float(current_stock),
                    'minimum_stock': float(min_stock),
                    'material_name': material.name,
                    'message': 'Stock below minimum level' if low_stock else 'Stock level OK'
                }
            
            return {'low_stock': False, 'message': 'No product or material specified'}
            
        except Exception as e:
            raise ValidationError(f'Error checking low stock: {str(e)}')
    
    # ===============================
    # FINANCIAL VALIDATION
    # ===============================
    
    @staticmethod
    def validate_credit_limit(customer_id, order_amount):
        """
        Check if customer has sufficient credit limit
        
        Args:
            customer_id: Customer ID
            order_amount: Order amount to validate
            
        Returns:
            dict: Credit validation result
        """
        try:
            customer = Customer.query.get(customer_id)
            
            if not customer:
                return {
                    'approved': False,
                    'credit_limit': 0,
                    'current_balance': 0,
                    'available_credit': 0,
                    'order_amount': float(order_amount),
                    'message': 'Customer not found'
                }
            
            credit_limit = customer.credit_limit or 0
            current_balance = customer.current_balance or 0
            available_credit = credit_limit - current_balance
            
            approved = available_credit >= order_amount
            
            return {
                'approved': approved,
                'credit_limit': float(credit_limit),
                'current_balance': float(current_balance),
                'available_credit': float(available_credit),
                'order_amount': float(order_amount),
                'customer_name': customer.name,
                'message': 'Credit approved' if approved else f'Insufficient credit. Available: {available_credit}'
            }
            
        except Exception as e:
            raise ValidationError(f'Error validating credit: {str(e)}')
    
    @staticmethod
    def validate_payment_terms(customer_id):
        """
        Check customer payment terms and status
        
        Args:
            customer_id: Customer ID
            
        Returns:
            dict: Payment terms validation
        """
        try:
            customer = Customer.query.get(customer_id)
            
            if not customer:
                return {
                    'valid': False,
                    'message': 'Customer not found'
                }
            
            # Check if customer is active
            if not customer.active:
                return {
                    'valid': False,
                    'customer_name': customer.name,
                    'message': 'Customer account is inactive'
                }
            
            # Check payment terms
            payment_terms = customer.payment_terms or 'COD'
            
            return {
                'valid': True,
                'customer_name': customer.name,
                'payment_terms': payment_terms,
                'credit_limit': float(customer.credit_limit or 0),
                'message': f'Payment terms: {payment_terms}'
            }
            
        except Exception as e:
            raise ValidationError(f'Error validating payment terms: {str(e)}')
    
    # ===============================
    # PRODUCTION VALIDATION
    # ===============================
    
    @staticmethod
    def validate_machine_availability(machine_id, start_date, end_date):
        """
        Check if machine is available for production
        
        Args:
            machine_id: Machine ID
            start_date: Planned start date
            end_date: Planned end date
            
        Returns:
            dict: Machine availability status
        """
        try:
            machine = Machine.query.get(machine_id)
            
            if not machine:
                return {
                    'available': False,
                    'message': 'Machine not found'
                }
            
            # Check machine status
            if machine.status != 'available':
                return {
                    'available': False,
                    'machine_name': machine.name,
                    'current_status': machine.status,
                    'message': f'Machine not available. Status: {machine.status}'
                }
            
            # TODO: Check for conflicting work orders (future enhancement)
            
            return {
                'available': True,
                'machine_name': machine.name,
                'current_status': machine.status,
                'message': 'Machine available for production'
            }
            
        except Exception as e:
            raise ValidationError(f'Error checking machine availability: {str(e)}')
    
    @staticmethod
    def validate_bom_materials(bom_id, quantity):
        """
        Check if all BOM materials are available
        
        Args:
            bom_id: Bill of Materials ID
            quantity: Production quantity
            
        Returns:
            dict: BOM materials validation
        """
        try:
            bom = BillOfMaterials.query.get(bom_id)
            
            if not bom:
                return {
                    'valid': False,
                    'message': 'BOM not found'
                }
            
            # Get all BOM items
            bom_items = BOMItem.query.filter_by(bom_id=bom_id).all()
            
            if not bom_items:
                return {
                    'valid': False,
                    'message': 'BOM has no items'
                }
            
            shortages = []
            all_available = True
            
            for item in bom_items:
                required_qty = item.quantity * quantity
                material_check = BusinessRules.validate_material_availability(
                    item.material_id,
                    required_qty
                )
                
                if not material_check['available']:
                    all_available = False
                    shortages.append({
                        'material_id': item.material_id,
                        'material_name': material_check.get('material_name', 'Unknown'),
                        'required': material_check['required'],
                        'available': material_check['current_stock'],
                        'shortage': material_check['shortage']
                    })
            
            return {
                'valid': all_available,
                'bom_name': bom.name,
                'production_quantity': float(quantity),
                'shortages': shortages,
                'message': 'All materials available' if all_available else f'{len(shortages)} material(s) shortage'
            }
            
        except Exception as e:
            raise ValidationError(f'Error validating BOM materials: {str(e)}')
    
    # ===============================
    # WORKFLOW VALIDATION
    # ===============================
    
    @staticmethod
    def validate_status_transition(current_status, new_status, allowed_transitions):
        """
        Validate if status transition is allowed
        
        Args:
            current_status: Current status
            new_status: New status to transition to
            allowed_transitions: Dict of allowed transitions
            
        Returns:
            dict: Validation result
        """
        try:
            if current_status not in allowed_transitions:
                return {
                    'valid': False,
                    'message': f'Invalid current status: {current_status}'
                }
            
            allowed = allowed_transitions[current_status]
            
            if new_status not in allowed:
                return {
                    'valid': False,
                    'current_status': current_status,
                    'new_status': new_status,
                    'allowed_transitions': allowed,
                    'message': f'Invalid transition from {current_status} to {new_status}'
                }
            
            return {
                'valid': True,
                'current_status': current_status,
                'new_status': new_status,
                'message': 'Status transition allowed'
            }
            
        except Exception as e:
            raise ValidationError(f'Error validating status transition: {str(e)}')


# ===============================
# PREDEFINED WORKFLOW TRANSITIONS
# ===============================

SALES_ORDER_TRANSITIONS = {
    'draft': ['confirmed', 'cancelled'],
    'confirmed': ['in_progress', 'cancelled'],
    'in_progress': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': []
}

PURCHASE_ORDER_TRANSITIONS = {
    'draft': ['confirmed', 'cancelled'],
    'confirmed': ['received', 'cancelled'],
    'received': ['completed'],
    'completed': [],
    'cancelled': []
}

WORK_ORDER_TRANSITIONS = {
    'planned': ['in_progress', 'cancelled'],
    'in_progress': ['completed', 'on_hold', 'cancelled'],
    'on_hold': ['in_progress', 'cancelled'],
    'completed': [],
    'cancelled': []
}
