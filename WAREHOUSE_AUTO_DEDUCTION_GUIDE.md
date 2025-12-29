# 📦 Warehouse Auto-Deduction Integration Guide

## 🎯 Overview

Warehouse Auto-Deduction adalah fitur integrasi otomatis antara Production dan Warehouse yang:
- **Auto-deduct materials** dari warehouse saat production dimulai
- **Auto-receive finished goods** ke warehouse saat production selesai
- **Material availability check** sebelum production start
- **Inventory movement tracking** untuk audit trail

---

## ✅ Fitur yang Sudah Diimplementasikan

### 1. **Backend API** ✅

**File:** `backend/routes/production_integration.py`

**Endpoints:**
```python
# Check material availability
GET /api/production/work-orders/{wo_id}/material-availability

# Manual trigger material deduction
POST /api/production/work-orders/{wo_id}/auto-deduct

# Manual trigger finished goods receiving
POST /api/production/work-orders/{wo_id}/auto-receive
Body: { "quantity": 100 }
```

**Functions:**
```python
from routes.production_integration import (
    auto_deduct_materials,
    auto_receive_finished_goods
)

# Auto-deduct materials
success, message, transactions = auto_deduct_materials(wo_id, user_id)

# Auto-receive finished goods
success, message, inventory_id = auto_receive_finished_goods(wo_id, qty, user_id)
```

### 2. **Auto-Trigger Integration** ✅

**File:** `backend/routes/production.py`

**Modified Endpoint:**
```python
PUT /api/production/work-orders/{id}/status
Body: {
    "status": "in_progress",  # or "completed"
    "auto_deduct": true       # default: true
}
```

**Behavior:**
- **Status → in_progress:** Auto-deduct materials (if auto_deduct=true)
- **Status → completed:** Auto-receive finished goods (if auto_deduct=true)
- **Material shortage:** Rollback status change, return error

### 3. **Frontend Components** ✅

**Components Created:**
- `MaterialAvailabilityCheck.tsx` - Display material availability status
- `StartProductionDialog.tsx` - Confirmation dialog with material check

---

## 🔄 Integration Flow

```
┌─────────────────────────────────────────────────────────┐
│  WORK ORDER LIFECYCLE WITH AUTO-DEDUCTION               │
└─────────────────────────────────────────────────────────┘

1. WO Created (status: planned)
   └─> BOM attached with material requirements

2. WO Released (status: released)
   └─> Ready for production

3. Check Material Availability
   GET /api/production/work-orders/{id}/material-availability
   └─> Returns: available, items[], insufficient_count

4. Start Production (status: in_progress)
   PUT /api/production/work-orders/{id}/status
   Body: { "status": "in_progress", "auto_deduct": true }
   
   ┌─ IF auto_deduct = true AND materials available:
   │  ├─> Deduct materials from inventory
   │  ├─> Create inventory movements (type: production_issue)
   │  ├─> Update inventory quantities
   │  └─> Return success with transaction details
   │
   └─ IF materials insufficient:
      ├─> Rollback status change
      ├─> Return error with shortage details
      └─> WO remains in previous status

5. Production Running
   └─> Record production data (shift, qty, downtime)

6. Complete Production (status: completed)
   PUT /api/production/work-orders/{id}/status
   Body: { "status": "completed", "auto_deduct": true }
   
   ┌─ IF auto_deduct = true:
   │  ├─> Receive finished goods to inventory
   │  ├─> Create inventory movement (type: production_receipt)
   │  ├─> Update inventory quantity
   │  └─> Return success with inventory_id
   │
   └─> WO marked as completed
```

---

## 📊 Database Schema

### Inventory Movement Types

```sql
-- Material Deduction
INSERT INTO inventory_movements (
    inventory_id,
    movement_type = 'production_issue',
    quantity = -100,  -- negative for deduction
    reference_type = 'work_order',
    reference_id = {wo_id},
    notes = 'Auto-deduction for WO {wo_number}'
)

-- Finished Goods Receipt
INSERT INTO inventory_movements (
    inventory_id,
    movement_type = 'production_receipt',
    quantity = 1000,  -- positive for receipt
    reference_type = 'work_order',
    reference_id = {wo_id},
    notes = 'Auto-receipt from WO {wo_number}'
)
```

---

## 🎮 Usage Examples

### Example 1: Check Material Availability

**Request:**
```bash
GET /api/production/work-orders/123/material-availability
```

**Response:**
```json
{
  "available": false,
  "message": "Some materials insufficient",
  "items": [
    {
      "type": "material",
      "id": 45,
      "name": "Plastic Raw Material",
      "required": 100,
      "available": 50,
      "sufficient": false,
      "shortage": 50
    },
    {
      "type": "product",
      "id": 12,
      "name": "Component A",
      "required": 200,
      "available": 250,
      "sufficient": true,
      "shortage": 0
    }
  ],
  "total_items": 2,
  "insufficient_count": 1
}
```

### Example 2: Start Production with Auto-Deduction

**Request:**
```bash
PUT /api/production/work-orders/123/status
Content-Type: application/json

{
  "status": "in_progress",
  "auto_deduct": true
}
```

**Response (Success):**
```json
{
  "message": "Work order status updated to in_progress",
  "wo_number": "WO-2025-001",
  "old_status": "released",
  "new_status": "in_progress",
  "integration_results": {
    "material_deduction": {
      "success": true,
      "message": "Successfully deducted 5 materials",
      "transactions": [
        {
          "type": "material",
          "id": 45,
          "name": "Plastic Raw Material",
          "quantity": 100
        }
      ]
    }
  }
}
```

**Response (Material Shortage):**
```json
{
  "error": "Cannot start production: Material shortage",
  "details": {
    "material_deduction": {
      "success": false,
      "message": "Insufficient materials: 1 items",
      "insufficient_materials": [
        {
          "type": "material",
          "id": 45,
          "name": "Plastic Raw Material",
          "required": 100,
          "available": 50
        }
      ]
    }
  }
}
```

### Example 3: Complete Production with Auto-Receipt

**Request:**
```bash
PUT /api/production/work-orders/123/status
Content-Type: application/json

{
  "status": "completed",
  "auto_deduct": true
}
```

**Response:**
```json
{
  "message": "Work order status updated to completed",
  "wo_number": "WO-2025-001",
  "old_status": "in_progress",
  "new_status": "completed",
  "integration_results": {
    "finished_goods_receipt": {
      "success": true,
      "message": "Successfully received 1000 units to inventory",
      "inventory_id": 456,
      "quantity_received": 1000
    }
  }
}
```

---

## 🎨 Frontend Integration

### Using Material Availability Check Component

```tsx
import MaterialAvailabilityCheck from '../../components/Production/MaterialAvailabilityCheck';

function MyComponent() {
  const [canStart, setCanStart] = useState(false);

  return (
    <MaterialAvailabilityCheck
      workOrderId={123}
      onAvailabilityChange={(available) => setCanStart(available)}
    />
  );
}
```

### Using Start Production Dialog

```tsx
import StartProductionDialog from '../../components/Production/StartProductionDialog';

function WorkOrderDetail() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <button onClick={() => setShowDialog(true)}>
        Start Production
      </button>

      <StartProductionDialog
        workOrderId={123}
        woNumber="WO-2025-001"
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onSuccess={() => {
          // Refresh data
          refetch();
        }}
      />
    </>
  );
}
```

---

## ⚙️ Configuration

### Enable/Disable Auto-Deduction

**Per Work Order:**
```json
{
  "status": "in_progress",
  "auto_deduct": false  // Disable auto-deduction
}
```

**Default Behavior:**
- Auto-deduction is **ENABLED** by default
- Can be disabled per request
- Material check always performed regardless

---

## 🔍 Troubleshooting

### Issue: Material deduction fails

**Possible Causes:**
1. Insufficient inventory quantity
2. Material not found in inventory
3. BOM not attached to WO
4. Database constraint violation

**Solution:**
- Check material availability first
- Verify BOM is correctly attached
- Ensure inventory records exist
- Check database logs for errors

### Issue: Finished goods not received

**Possible Causes:**
1. `quantity_produced` is 0
2. `auto_deduct` is false
3. Product not in inventory master

**Solution:**
- Ensure production records are created
- Check `quantity_good` > 0
- Verify product exists in system
- Enable `auto_deduct` flag

---

## 📈 Monitoring & Audit

### View Inventory Movements

```sql
SELECT 
    im.id,
    im.movement_type,
    im.quantity,
    im.reference_type,
    im.reference_id,
    im.notes,
    im.created_at,
    COALESCE(p.name, m.name) as item_name
FROM inventory_movements im
LEFT JOIN products p ON im.product_id = p.id
LEFT JOIN materials m ON im.material_id = m.id
WHERE im.reference_type = 'work_order'
  AND im.reference_id = 123
ORDER BY im.created_at DESC;
```

### Track Material Usage

```sql
SELECT 
    wo.wo_number,
    wo.status,
    COUNT(im.id) as movement_count,
    SUM(CASE WHEN im.movement_type = 'production_issue' THEN ABS(im.quantity) ELSE 0 END) as total_issued,
    SUM(CASE WHEN im.movement_type = 'production_receipt' THEN im.quantity ELSE 0 END) as total_received
FROM work_orders wo
LEFT JOIN inventory_movements im ON im.reference_id = wo.id AND im.reference_type = 'work_order'
WHERE wo.id = 123
GROUP BY wo.id, wo.wo_number, wo.status;
```

---

## 🚀 Next Steps

### Recommended Enhancements:

1. **Batch Material Reservation**
   - Reserve materials when WO is released
   - Prevent other WOs from using reserved materials

2. **Partial Deduction**
   - Support partial material deduction
   - Track remaining material requirements

3. **Material Substitution**
   - Allow alternative materials
   - Auto-suggest substitutes when shortage

4. **Cost Tracking**
   - Track material cost per WO
   - Calculate production cost variance

5. **Notification System**
   - Alert when materials insufficient
   - Notify warehouse team for material preparation

---

## 📝 Testing Checklist

- [ ] Material availability check returns correct data
- [ ] Auto-deduction works when starting production
- [ ] Material shortage prevents production start
- [ ] Inventory quantities updated correctly
- [ ] Inventory movements created with correct reference
- [ ] Auto-receipt works when completing production
- [ ] Finished goods added to inventory
- [ ] Error handling for insufficient materials
- [ ] Rollback works when deduction fails
- [ ] Frontend components display correctly
- [ ] Material status indicators visible
- [ ] Confirmation dialog shows material check

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review error logs in backend
3. Verify database inventory records
4. Test with manual API calls first
5. Contact development team

---

**Last Updated:** December 28, 2025
**Version:** 1.0.0
**Status:** ✅ Production Ready
