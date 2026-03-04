"""
FIFO (First In, First Out) Helper Utilities
Handles FIFO-based stock deduction and reservation for both materials and finished goods.
When one batch is insufficient, automatically takes from the next oldest batch.

IMPORTANT: All mutating functions use SELECT FOR UPDATE to prevent race conditions.
Two concurrent requests cannot read the same inventory rows simultaneously.
"""
from models import db
from models.warehouse import Inventory, InventoryMovement
from utils.timezone import get_local_now


def _build_fifo_query(material_id=None, product_id=None, use_available=False):
    """Build base FIFO query with filters. Internal helper.
    
    Args:
        use_available: If True, filter by quantity_available > 0 (for reservation).
                       If False, filter by quantity_on_hand > 0 (for deduction).
    """
    filters = [Inventory.is_active == True]
    
    if use_available:
        filters.append(Inventory.quantity_available > 0)
    else:
        filters.append(Inventory.quantity_on_hand > 0)
    
    if material_id:
        filters.append(Inventory.material_id == material_id)
    elif product_id:
        filters.append(Inventory.product_id == product_id)
    else:
        return None
    
    return filters


def _fail(error, extra=None):
    """Return a standard failure dict."""
    result = {
        'success': False,
        'deducted': 0,
        'reserved': 0,
        'movements': [],
        'reservations': [],
        'error': error,
        'weighted_avg_cost': 0,
        'total_cost': 0
    }
    if extra:
        result.update(extra)
    return result


# ──────────────────────────────────────────────
#  FIFO RESERVE  (approve step)
# ──────────────────────────────────────────────

def fifo_reserve_stock(material_id=None, product_id=None, quantity_needed=0):
    """
    Reserve stock using FIFO (oldest batch first) with row-level locking.
    Moves qty from quantity_available → quantity_reserved.
    Does NOT create InventoryMovement (that happens at issue/deduct time).
    
    Uses SELECT FOR UPDATE to prevent race conditions.
    
    Returns:
        dict with 'success', 'reserved', 'reservations' (list of batch details), 'error'
    """
    if quantity_needed <= 0:
        return _fail('Quantity must be greater than 0')
    
    filters = _build_fifo_query(material_id, product_id, use_available=True)
    if filters is None:
        return _fail('Either material_id or product_id is required')
    
    # SELECT FOR UPDATE — blocks other transactions from reading these rows
    inventory_batches = Inventory.query.filter(
        *filters
    ).order_by(
        Inventory.created_at.asc()
    ).with_for_update().all()
    
    if not inventory_batches:
        return _fail(f'No available stock found for {"material" if material_id else "product"} '
                     f'ID {material_id or product_id}')
    
    total_available = sum(float(inv.quantity_available) for inv in inventory_batches)
    if total_available < quantity_needed:
        return _fail(
            f'Insufficient stock. Available: {total_available}, Required: {quantity_needed}'
        )
    
    remaining = quantity_needed
    reservations = []
    
    for inv in inventory_batches:
        if remaining <= 0:
            break
        
        avail = float(inv.quantity_available)
        reserve_qty = min(avail, remaining)
        
        inv.quantity_reserved = float(inv.quantity_reserved or 0) + reserve_qty
        inv.quantity_available = float(inv.quantity_available) - reserve_qty
        inv.updated_at = get_local_now()
        
        reservations.append({
            'inventory_id': inv.id,
            'batch_number': inv.batch_number,
            'lot_number': inv.lot_number,
            'location_id': inv.location_id,
            'quantity_reserved': reserve_qty,
            'unit_cost': _get_inventory_unit_cost(inv)
        })
        
        remaining -= reserve_qty
    
    total_reserved = quantity_needed - remaining
    return {
        'success': True,
        'reserved': total_reserved,
        'reservations': reservations,
        'error': None
    }


# ──────────────────────────────────────────────
#  FIFO RELEASE RESERVATION  (cancel / undo)
# ──────────────────────────────────────────────

def fifo_release_reservation(material_id=None, product_id=None, quantity_to_release=0):
    """
    Release previously reserved stock (FIFO, newest reservation first so we
    undo in reverse order). Moves qty from quantity_reserved → quantity_available.
    
    Uses SELECT FOR UPDATE to prevent race conditions.
    """
    if quantity_to_release <= 0:
        return {'success': True, 'released': 0}
    
    filters = [Inventory.is_active == True, Inventory.quantity_reserved > 0]
    if material_id:
        filters.append(Inventory.material_id == material_id)
    elif product_id:
        filters.append(Inventory.product_id == product_id)
    else:
        return {'success': False, 'released': 0, 'error': 'material_id or product_id required'}
    
    # Release newest first (reverse of reservation order)
    batches = Inventory.query.filter(
        *filters
    ).order_by(
        Inventory.created_at.desc()
    ).with_for_update().all()
    
    remaining = quantity_to_release
    for inv in batches:
        if remaining <= 0:
            break
        reserved = float(inv.quantity_reserved or 0)
        release_qty = min(reserved, remaining)
        
        inv.quantity_reserved = reserved - release_qty
        inv.quantity_available = float(inv.quantity_available) + release_qty
        inv.updated_at = get_local_now()
        remaining -= release_qty
    
    return {
        'success': True,
        'released': quantity_to_release - remaining
    }


# ──────────────────────────────────────────────
#  FIFO DEDUCT  (issue step — actual stock out)
# ──────────────────────────────────────────────

def fifo_deduct_stock(material_id=None, product_id=None, quantity_needed=0,
                      reference_number=None, reference_type=None, reference_id=None,
                      notes=None, user_id=None, from_reserved=False):
    """
    Deduct stock using FIFO method (oldest batch first) with row-level locking.
    If one batch is not enough, automatically takes from the next batch.
    
    Args:
        from_reserved: If True, deduct from quantity_reserved (already approved).
                       If False, deduct from quantity_on_hand directly.
    
    Uses SELECT FOR UPDATE to prevent race conditions.
    """
    if quantity_needed <= 0:
        return _fail('Quantity must be greater than 0')
    
    # When deducting reserved stock, filter by quantity_reserved > 0
    # When deducting unreserved stock, filter by quantity_on_hand > 0
    filters = [Inventory.is_active == True]
    if from_reserved:
        filters.append(Inventory.quantity_reserved > 0)
    else:
        filters.append(Inventory.quantity_on_hand > 0)
    
    if material_id:
        filters.append(Inventory.material_id == material_id)
    elif product_id:
        filters.append(Inventory.product_id == product_id)
    else:
        return _fail('Either material_id or product_id is required')
    
    # SELECT FOR UPDATE — prevents race condition
    inventory_batches = Inventory.query.filter(
        *filters
    ).order_by(
        Inventory.created_at.asc()
    ).with_for_update().all()
    
    if not inventory_batches:
        item_type = 'material' if material_id else 'product'
        item_id = material_id or product_id
        return _fail(f'No available stock found for {item_type} ID {item_id}')
    
    # Check total
    if from_reserved:
        total_available = sum(float(inv.quantity_reserved or 0) for inv in inventory_batches)
    else:
        total_available = sum(float(inv.quantity_on_hand) for inv in inventory_batches)
    
    if total_available < quantity_needed:
        item_type = 'material' if material_id else 'product'
        item_id = material_id or product_id
        return _fail(
            f'Insufficient stock for {item_type} ID {item_id}. '
            f'Available: {total_available}, Required: {quantity_needed}'
        )
    
    remaining = quantity_needed
    movements = []
    total_cost = 0
    total_deducted = 0
    
    for inv in inventory_batches:
        if remaining <= 0:
            break
        
        if from_reserved:
            pool = float(inv.quantity_reserved or 0)
        else:
            pool = float(inv.quantity_on_hand)
        
        deduct_qty = min(pool, remaining)
        unit_cost = _get_inventory_unit_cost(inv)
        
        # Deduct from on_hand always
        inv.quantity_on_hand = float(inv.quantity_on_hand) - deduct_qty
        
        if from_reserved:
            # Release from reserved bucket
            inv.quantity_reserved = float(inv.quantity_reserved or 0) - deduct_qty
        else:
            # Deduct from available bucket
            inv.quantity_available = max(0, float(inv.quantity_available) - deduct_qty)
        
        inv.updated_at = get_local_now()
        
        # Clamp to zero
        if float(inv.quantity_on_hand) <= 0:
            inv.quantity_on_hand = 0
            inv.quantity_available = 0
            inv.quantity_reserved = max(0, float(inv.quantity_reserved or 0))
        
        # Create inventory movement record
        movement = InventoryMovement(
            inventory_id=inv.id,
            product_id=product_id,
            material_id=material_id,
            location_id=inv.location_id,
            movement_type='stock_out',
            movement_date=get_local_now().date(),
            quantity=deduct_qty,
            reference_number=reference_number,
            reference_type=reference_type,
            reference_id=reference_id,
            batch_number=inv.batch_number,
            lot_number=inv.lot_number,
            unit_cost=unit_cost,
            total_cost=round(deduct_qty * unit_cost, 2) if unit_cost else None,
            notes=notes,
            created_by=user_id
        )
        db.session.add(movement)
        
        movements.append({
            'inventory_id': inv.id,
            'batch_number': inv.batch_number,
            'lot_number': inv.lot_number,
            'location_id': inv.location_id,
            'quantity_deducted': deduct_qty,
            'unit_cost': unit_cost,
            'total_cost': round(deduct_qty * unit_cost, 2) if unit_cost else 0,
            'remaining_in_batch': float(inv.quantity_on_hand)
        })
        
        total_cost += (deduct_qty * unit_cost) if unit_cost else 0
        total_deducted += deduct_qty
        remaining -= deduct_qty
    
    weighted_avg_cost = total_cost / total_deducted if total_deducted > 0 else 0
    
    return {
        'success': True,
        'deducted': total_deducted,
        'movements': movements,
        'error': None,
        'weighted_avg_cost': round(weighted_avg_cost, 4),
        'total_cost': round(total_cost, 2)
    }


# ──────────────────────────────────────────────
#  FIFO CHECK (read-only, no locking)
# ──────────────────────────────────────────────

def fifo_check_available(material_id=None, product_id=None):
    """
    Check total available stock across all batches (read-only, no lock).
    """
    filters = _build_fifo_query(material_id, product_id, use_available=True)
    if filters is None:
        return {'total_available': 0, 'batches': []}
    
    inventory_batches = Inventory.query.filter(
        *filters
    ).order_by(
        Inventory.created_at.asc()
    ).all()
    
    batches = []
    total = 0
    for inv in inventory_batches:
        qty = float(inv.quantity_available)
        unit_cost = _get_inventory_unit_cost(inv)
        batches.append({
            'inventory_id': inv.id,
            'batch_number': inv.batch_number,
            'lot_number': inv.lot_number,
            'location_id': inv.location_id,
            'quantity_on_hand': float(inv.quantity_on_hand),
            'quantity_available': qty,
            'quantity_reserved': float(inv.quantity_reserved or 0),
            'unit_cost': unit_cost,
            'created_at': inv.created_at.isoformat() if inv.created_at else None,
            'expiry_date': inv.expiry_date.isoformat() if inv.expiry_date else None
        })
        total += qty
    
    return {
        'total_available': total,
        'batches': batches
    }


# ──────────────────────────────────────────────
#  UNIT COST LOOKUP
# ──────────────────────────────────────────────

def _get_inventory_unit_cost(inventory):
    """
    Get unit cost for an inventory record.
    Priority:
    1. From the stock_in movement that created this inventory record
    2. From the material's cost_per_unit
    3. From the product's cost/hpp
    4. Default 0
    """
    last_in = InventoryMovement.query.filter_by(
        inventory_id=inventory.id,
        movement_type='stock_in'
    ).order_by(InventoryMovement.created_at.desc()).first()
    
    if last_in and last_in.unit_cost:
        return float(last_in.unit_cost)
    
    if inventory.material_id and inventory.material:
        if hasattr(inventory.material, 'cost_per_unit') and inventory.material.cost_per_unit:
            return float(inventory.material.cost_per_unit)
    
    if inventory.product_id and inventory.product:
        if hasattr(inventory.product, 'cost') and inventory.product.cost:
            return float(inventory.product.cost)
    
    return 0
