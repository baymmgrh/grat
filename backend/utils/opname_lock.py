"""
Stock Opname Lock Utility
Checks if a zone/location is currently under stock opname (in_progress).
If so, blocks all inventory transactions (stock_in, stock_out, transfer, adjust, material_issue).
"""
from models.stock_opname import StockOpnameOrder
from models.warehouse import WarehouseLocation


def check_opname_lock(location_id=None, zone_id=None, material_id=None, product_id=None):
    """
    Check if the given location or zone is locked by an active stock opname.
    
    Args:
        location_id: Specific warehouse location ID
        zone_id: Specific warehouse zone ID
        material_id: Material ID (will resolve to location/zone from inventory)
        product_id: Product ID (will resolve to location/zone from inventory)
    
    Returns:
        dict: {'locked': bool, 'opname_number': str or None, 'message': str or None}
    """
    from models.warehouse import Inventory

    # Get active opname orders (in_progress status)
    active_opnames = StockOpnameOrder.query.filter(
        StockOpnameOrder.status == 'in_progress'
    ).all()

    if not active_opnames:
        return {'locked': False, 'opname_number': None, 'message': None}

    # Resolve location_id to zone_id if needed
    resolved_zone_ids = set()
    resolved_location_ids = set()

    if location_id:
        resolved_location_ids.add(location_id)
        loc = WarehouseLocation.query.get(location_id)
        if loc:
            resolved_zone_ids.add(loc.zone_id)

    if zone_id:
        resolved_zone_ids.add(zone_id)

    # If only material/product given, find all their inventory locations
    if not location_id and not zone_id and (material_id or product_id):
        filters = [Inventory.is_active == True]
        if material_id:
            filters.append(Inventory.material_id == material_id)
        elif product_id:
            filters.append(Inventory.product_id == product_id)

        inventories = Inventory.query.filter(*filters).all()
        for inv in inventories:
            if inv.location_id:
                resolved_location_ids.add(inv.location_id)
                if inv.location and inv.location.zone_id:
                    resolved_zone_ids.add(inv.location.zone_id)

    # Check each active opname
    for opname in active_opnames:
        # Opname on specific location
        if opname.location_id and opname.location_id in resolved_location_ids:
            return {
                'locked': True,
                'opname_number': opname.opname_number,
                'message': f'Lokasi sedang dalam proses stok opname ({opname.opname_number}). '
                           f'Semua transaksi diblokir sampai opname selesai.'
            }

        # Opname on zone
        if opname.zone_id and opname.zone_id in resolved_zone_ids:
            return {
                'locked': True,
                'opname_number': opname.opname_number,
                'message': f'Zona sedang dalam proses stok opname ({opname.opname_number}). '
                           f'Semua transaksi diblokir sampai opname selesai.'
            }

        # Opname on ALL zones (zone_id is NULL = full opname)
        if opname.zone_id is None and opname.location_id is None:
            return {
                'locked': True,
                'opname_number': opname.opname_number,
                'message': f'Seluruh gudang sedang dalam proses stok opname ({opname.opname_number}). '
                           f'Semua transaksi diblokir sampai opname selesai.'
            }

    return {'locked': False, 'opname_number': None, 'message': None}
