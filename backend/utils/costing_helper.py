"""
Costing Helper Utilities
Calculate standard costs from BOM for WIP accounting
"""

def calculate_standard_costs_from_bom(product_id, quantity):
    """
    Calculate standard costs from Bill of Materials
    
    Args:
        product_id (int): Product ID
        quantity (float): Production quantity
        
    Returns:
        tuple: (material_cost, labor_cost, overhead_cost)
    """
    from models.production import BillOfMaterials
    
    # Get active BOM for product
    bom = BillOfMaterials.query.filter_by(
        product_id=product_id,
        is_active=True
    ).first()
    
    if not bom:
        # No BOM found, return zeros
        return 0, 0, 0
    
    # Calculate material cost from BOM items
    material_cost = 0
    for item in bom.items:
        if item.unit_cost:
            # Calculate with scrap
            scrap_factor = 1 + (float(item.scrap_percent) / 100)
            item_quantity = float(item.quantity) * quantity * scrap_factor
            material_cost += item_quantity * float(item.unit_cost)
    
    # Labor cost (if BOM has labor hours and rate)
    labor_cost = 0
    if hasattr(bom, 'labor_hours') and hasattr(bom, 'labor_rate'):
        if bom.labor_hours and bom.labor_rate:
            labor_cost = float(bom.labor_hours) * float(bom.labor_rate) * quantity
    
    # Overhead cost (if BOM has overhead rate)
    overhead_cost = 0
    if hasattr(bom, 'overhead_rate') and bom.overhead_rate:
        overhead_cost = float(bom.overhead_rate) * quantity
    
    return material_cost, labor_cost, overhead_cost


def calculate_product_standard_cost(product_id):
    """
    Calculate standard cost per unit for a product
    
    Args:
        product_id (int): Product ID
        
    Returns:
        dict: Dictionary with cost breakdown
    """
    material, labor, overhead = calculate_standard_costs_from_bom(product_id, 1)
    
    return {
        'material_cost': material,
        'labor_cost': labor,
        'overhead_cost': overhead,
        'total_cost': material + labor + overhead
    }


def calculate_variance(standard_cost, actual_cost):
    """
    Calculate cost variance
    
    Args:
        standard_cost (float): Standard cost
        actual_cost (float): Actual cost
        
    Returns:
        dict: Variance details
    """
    variance = actual_cost - standard_cost
    
    if standard_cost > 0:
        variance_percent = (variance / standard_cost) * 100
    else:
        variance_percent = 0
    
    return {
        'variance': variance,
        'variance_percent': variance_percent,
        'is_favorable': variance < 0,  # Negative variance is favorable (actual < standard)
        'is_significant': abs(variance_percent) > 5  # More than 5% is significant
    }


def calculate_yield_variance(standard_quantity, actual_quantity, standard_cost_per_unit):
    """
    Calculate yield variance
    
    Args:
        standard_quantity (float): Standard/planned quantity
        actual_quantity (float): Actual quantity produced
        standard_cost_per_unit (float): Standard cost per unit
        
    Returns:
        dict: Yield variance details
    """
    quantity_variance = actual_quantity - standard_quantity
    yield_variance = quantity_variance * standard_cost_per_unit
    
    if standard_quantity > 0:
        yield_percent = (quantity_variance / standard_quantity) * 100
    else:
        yield_percent = 0
    
    return {
        'quantity_variance': quantity_variance,
        'yield_variance': yield_variance,
        'yield_percent': yield_percent,
        'is_favorable': yield_variance > 0,  # Positive yield is favorable (produced more)
        'is_significant': abs(yield_percent) > 5
    }


def get_bom_details(product_id):
    """
    Get detailed BOM information for a product
    
    Args:
        product_id (int): Product ID
        
    Returns:
        dict: BOM details or None
    """
    from models.production import BillOfMaterials
    
    bom = BillOfMaterials.query.filter_by(
        product_id=product_id,
        is_active=True
    ).first()
    
    if not bom:
        return None
    
    items = []
    for item in bom.items:
        items.append({
            'line_number': item.line_number,
            'material_id': item.material_id,
            'material_name': item.material.name if item.material else None,
            'quantity': float(item.quantity),
            'uom': item.uom,
            'unit_cost': float(item.unit_cost) if item.unit_cost else 0,
            'total_cost': float(item.total_cost) if hasattr(item, 'total_cost') else 0,
            'scrap_percent': float(item.scrap_percent),
            'is_critical': item.is_critical
        })
    
    return {
        'bom_id': bom.id,
        'bom_number': bom.bom_number,
        'version': bom.version,
        'is_active': bom.is_active,
        'total_cost': float(bom.total_cost) if hasattr(bom, 'total_cost') else 0,
        'items': items,
        'total_materials': len(items),
        'critical_materials': len([i for i in items if i['is_critical']])
    }


def validate_bom_exists(product_id):
    """
    Check if product has an active BOM
    
    Args:
        product_id (int): Product ID
        
    Returns:
        bool: True if BOM exists
    """
    from models.production import BillOfMaterials
    
    bom = BillOfMaterials.query.filter_by(
        product_id=product_id,
        is_active=True
    ).first()
    
    return bom is not None


def calculate_material_variance(bom_material_cost, actual_material_cost):
    """Calculate material variance"""
    return calculate_variance(bom_material_cost, actual_material_cost)


def calculate_labor_variance(bom_labor_cost, actual_labor_cost):
    """Calculate labor variance"""
    return calculate_variance(bom_labor_cost, actual_labor_cost)


def calculate_overhead_variance(bom_overhead_cost, actual_overhead_cost):
    """Calculate overhead variance"""
    return calculate_variance(bom_overhead_cost, actual_overhead_cost)
