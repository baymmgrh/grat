# ERP System - Complete Workflow Diagram

## 🔄 Master Workflow Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        ERP SYSTEM WORKFLOW                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│     R&D      │───▶│   PRODUCT    │───▶│    SALES     │───▶│  PRODUCTION  │───▶│   QUALITY    │───▶│   SHIPPING   │
│  Research    │    │   Master     │    │    Order     │    │  Work Order  │    │   Control    │    │   Delivery   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
       │                   │                   │                   │                   │                   │
       │                   │                   │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│     BOM      │    │  INVENTORY   │    │     MRP      │    │  MAINTENANCE │    │    WASTE     │    │   FINANCE    │
│   Recipe     │    │    Stock     │    │   Planning   │    │   Machine    │    │  Management  │    │   Invoice    │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                               │                   │
                                               ▼                   ▼
                                        ┌──────────────┐    ┌──────────────┐
                                        │  PURCHASING  │    │      HR      │
                                        │  Materials   │    │    Labor     │
                                        └──────────────┘    └──────────────┘
```

---

## 📋 Detailed Workflow by Module

### 1️⃣ R&D → Product → BOM Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           R&D TO PRODUCTION FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  Research       │
│  Project        │
│  (Riset Awal)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Experiment     │
│  (Uji Coba)     │
│  - Formula      │
│  - Testing      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Product        │     │  Status:        │
│  Development    │────▶│  - Draft        │
│  (Pengembangan) │     │  - In Progress  │
└────────┬────────┘     │  - Testing      │
         │              │  - Approved ✓   │
         │              │  - Rejected ✗   │
         │              └─────────────────┘
         │
         ▼ [If Approved]
┌─────────────────┐
│  Convert to     │
│  Production     │
│  (/convert-to-  │
│   production)   │
└────────┬────────┘
         │
         ├──────────────────────────────┐
         ▼                              ▼
┌─────────────────┐            ┌─────────────────┐
│  PRODUCT        │            │  BOM            │
│  (Master Data)  │            │  (Bill of       │
│  - SKU          │            │   Materials)    │
│  - Category     │            │  - Materials    │
│  - Price        │            │  - Quantities   │
└─────────────────┘            │  - Costs        │
                               └─────────────────┘
```

---

### 2️⃣ Sales Order → MRP → Purchasing Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        SALES TO PURCHASING FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  SALES ORDER    │
│  (Pesanan)      │
│  - Customer     │
│  - Products     │
│  - Quantity     │
│  - Due Date     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────────────────────────┐
│  MRP CHECK      │────▶│  Material Requirements Planning     │
│  (Cek Material) │     │  - Check BOM                        │
│                 │     │  - Calculate needed materials       │
└────────┬────────┘     │  - Check current inventory          │
         │              │  - Identify shortages               │
         │              └─────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Material       │
│  Status?        │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐  ┌───────────────┐
│ CUKUP │  │ KURANG        │
│ (OK)  │  │ (Shortage)    │
└───┬───┘  └───────┬───────┘
    │              │
    │              ▼
    │      ┌─────────────────┐
    │      │  PURCHASE       │
    │      │  REQUISITION    │
    │      │  (PR)           │
    │      └────────┬────────┘
    │               │
    │               ▼
    │      ┌─────────────────┐
    │      │  PURCHASE       │
    │      │  ORDER (PO)     │
    │      │  - Supplier     │
    │      │  - Materials    │
    │      │  - Price        │
    │      └────────┬────────┘
    │               │
    │               ▼
    │      ┌─────────────────┐
    │      │  GOODS RECEIPT  │
    │      │  NOTE (GRN)     │
    │      │  - Receive      │
    │      │  - QC Check     │
    │      │  - To Inventory │
    │      └────────┬────────┘
    │               │
    └───────┬───────┘
            │
            ▼
    ┌─────────────────┐
    │  INVENTORY      │
    │  UPDATED        │
    │  (Stock Ready)  │
    └─────────────────┘
```

---

### 3️⃣ Production Workflow (Complete)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION WORKFLOW                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  WORK ORDER     │
│  Created        │
│  Status: PENDING│
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────────────────────────┐
│  Material       │────▶│  Auto Reserve Materials             │
│  Reservation    │     │  - Check BOM                        │
│                 │     │  - Reserve from Inventory           │
└────────┬────────┘     │  - Create Material Issue            │
         │              └─────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  START          │
│  WORK ORDER     │
│  Status:        │
│  IN_PROGRESS    │
└────────┬────────┘
         │
         ├──────────────────────────────────────────────────────┐
         │                                                      │
         ▼                                                      ▼
┌─────────────────┐                                    ┌─────────────────┐
│  PRODUCTION     │                                    │  MACHINE        │
│  RECORDS        │                                    │  BREAKDOWN?     │
│  (Per Shift)    │                                    └────────┬────────┘
│  - Qty Produced │                                             │
│  - Qty Good     │                                        ┌────┴────┐
│  - Qty Reject   │                                        │         │
│  - Downtime     │                                        ▼         ▼
└────────┬────────┘                                    ┌───────┐  ┌───────────────┐
         │                                             │  NO   │  │  YES          │
         │                                             └───────┘  └───────┬───────┘
         │                                                                │
         │                                                                ▼
         │                                                       ┌─────────────────┐
         │                                                       │  MAINTENANCE    │
         │                                                       │  INTEGRATION    │
         │                                                       │  - Pause WO     │
         │                                                       │  - Create       │
         │                                                       │    Downtime     │
         │                                                       │  - Log Issue    │
         │                                                       └────────┬────────┘
         │                                                                │
         │◀───────────────────────────────────────────────────────────────┘
         │                                                    [After Repair]
         ▼
┌─────────────────┐
│  WIP BATCH      │
│  (Job Costing)  │
│  - Material $   │
│  - Labor $      │
│  - Overhead $   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  COMPLETE       │
│  WORK ORDER     │
│  Status:        │
│  COMPLETED      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SUBMIT FOR     │
│  APPROVAL       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         APPROVAL WORKFLOW                                        │
└─────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  PRODUCTION     │
│  APPROVAL       │
│  (Manager       │
│   Review)       │
└────────┬────────┘
         │
    ┌────┴────────────────┐
    │                     │
    ▼                     ▼
┌───────────────┐    ┌───────────────┐
│  APPROVED ✓   │    │  REJECTED ✗   │
└───────┬───────┘    └───────┬───────┘
        │                    │
        │                    ▼
        │            ┌───────────────┐
        │            │  Revision     │
        │            │  Required     │
        │            │  (Back to     │
        │            │   Production) │
        │            └───────────────┘
        │
        ▼
┌─────────────────┐
│  FORWARD TO     │
│  FINANCE        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AUTO CREATE    │
│  INVOICE        │
│  (Production    │
│   Cost Record)  │
└─────────────────┘
```

---

### 4️⃣ Quality Control Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         QUALITY CONTROL FLOW                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  PRODUCTION     │
│  COMPLETED      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  QC INSPECTION  │
│  Created        │
│  - Visual Check │
│  - Measurement  │
│  - Testing      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  QC RESULT?     │
└────────┬────────┘
         │
    ┌────┼────────────────┐
    │    │                │
    ▼    ▼                ▼
┌──────┐ ┌──────────┐  ┌──────────┐
│ PASS │ │QUARANTINE│  │  REJECT  │
│  ✓   │ │    ⚠     │  │    ✗     │
└──┬───┘ └────┬─────┘  └────┬─────┘
   │          │             │
   │          │             ▼
   │          │      ┌─────────────────┐
   │          │      │  WASTE          │
   │          │      │  INTEGRATION    │
   │          │      │  - Create Waste │
   │          │      │    Record       │
   │          │      │  - Log Reason   │
   │          │      │  - Calculate    │
   │          │      │    Loss         │
   │          │      └─────────────────┘
   │          │
   │          ▼
   │   ┌─────────────────┐
   │   │  HOLD FOR       │
   │   │  FURTHER        │
   │   │  INSPECTION     │
   │   └────────┬────────┘
   │            │
   │       ┌────┴────┐
   │       │         │
   │       ▼         ▼
   │   ┌──────┐  ┌──────┐
   │   │ PASS │  │REJECT│
   │   └──┬───┘  └──┬───┘
   │      │         │
   └──────┼─────────┘
          │
          ▼
   ┌─────────────────┐
   │  DISPOSITION    │
   │  RELEASED       │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │  READY FOR      │
   │  SHIPPING       │
   └─────────────────┘
```

---

### 5️⃣ Shipping & Finance Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         SHIPPING & FINANCE FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  QC PASSED      │
│  Products       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CREATE         │
│  SHIPPING       │
│  ORDER          │
│  - From QC      │
│  - Delivery     │
│    Method       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  DELIVERY       │
│  METHOD?        │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐  ┌─────────────┐
│EXPEDITION│  │ SELF PICKUP │
│(Ekspedisi)│  │ (Ambil      │
│- Vehicle │  │  Sendiri)   │
│- Driver  │  │- Pickup     │
│- Tracking│  │  Person     │
└────┬────┘  │- ID (KTP)   │
     │       │- Auth Letter│
     │       └──────┬──────┘
     │              │
     └──────┬───────┘
            │
            ▼
┌─────────────────┐
│  SHIPPED        │
│  Status:        │
│  IN_TRANSIT     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  DELIVERED      │
│  Status:        │
│  COMPLETED      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FINANCE                                             │
└─────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  INVOICE        │
│  GENERATED      │
│  - Sales Invoice│
│  - Production   │
│    Cost Invoice │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PAYMENT        │
│  TRACKING       │
│  - Due Date     │
│  - Paid/Unpaid  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ACCOUNTS       │
│  RECEIVABLE     │
│  (Piutang)      │
└─────────────────┘
```

---

### 6️⃣ HR Labor → Job Costing Integration

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         HR LABOR INTEGRATION                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐
│  EMPLOYEE       │     │  EMPLOYEE       │
│  ROSTER         │     │  ATTENDANCE     │
│  (Jadwal Kerja) │     │  (Kehadiran)    │
│  - Shift        │     │  - Clock In     │
│  - Machine      │     │  - Clock Out    │
│  - Date         │     │  - Hours Worked │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
            ┌─────────────────┐
            │  SYNC TO        │
            │  JOB COSTING    │
            │  (/sync-to-     │
            │   job-costing)  │
            └────────┬────────┘
                     │
                     ▼
            ┌─────────────────┐
            │  Calculate:     │
            │  - Hours on WO  │
            │  - Hourly Rate  │
            │  - Labor Cost   │
            └────────┬────────┘
                     │
                     ▼
            ┌─────────────────┐
            │  JOB COST       │
            │  ENTRY          │
            │  (Labor Cost)   │
            │  Updated in     │
            │  WIP Batch      │
            └─────────────────┘
```

---

## 🔗 Complete Integration Map

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    INTEGRATION CONNECTIONS                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────┐
                                    │    R&D      │
                                    └──────┬──────┘
                                           │
                              ┌────────────┴────────────┐
                              ▼                         ▼
                       ┌─────────────┐           ┌─────────────┐
                       │   PRODUCT   │◀─────────▶│     BOM     │
                       └──────┬──────┘           └──────┬──────┘
                              │                         │
              ┌───────────────┼─────────────────────────┼───────────────┐
              │               │                         │               │
              ▼               ▼                         ▼               ▼
       ┌─────────────┐ ┌─────────────┐          ┌─────────────┐ ┌─────────────┐
       │  INVENTORY  │ │   SALES     │          │     MRP     │ │  PURCHASING │
       └──────┬──────┘ └──────┬──────┘          └──────┬──────┘ └──────┬──────┘
              │               │                         │               │
              │               │                         │               │
              └───────────────┼─────────────────────────┼───────────────┘
                              │                         │
                              ▼                         ▼
                       ┌─────────────────────────────────────┐
                       │           PRODUCTION                 │
                       │         (Work Order)                 │
                       └──────────────────┬──────────────────┘
                                          │
              ┌───────────────┬───────────┼───────────┬───────────────┐
              │               │           │           │               │
              ▼               ▼           ▼           ▼               ▼
       ┌─────────────┐ ┌─────────────┐ ┌─────────┐ ┌─────────────┐ ┌─────────────┐
       │ MAINTENANCE │ │     HR      │ │   WIP   │ │   QUALITY   │ │  APPROVAL   │
       │  (Machine)  │ │  (Labor)    │ │  BATCH  │ │   CONTROL   │ │  (Manager)  │
       └──────┬──────┘ └──────┬──────┘ └────┬────┘ └──────┬──────┘ └──────┬──────┘
              │               │             │             │               │
              │               │             │             │               │
              │               └─────────────┼─────────────┘               │
              │                             │                             │
              │                    ┌────────┴────────┐                    │
              │                    ▼                 ▼                    │
              │             ┌─────────────┐   ┌─────────────┐             │
              │             │    WASTE    │   │  SHIPPING   │             │
              │             │ (QC Reject) │   │  (Delivery) │             │
              │             └─────────────┘   └──────┬──────┘             │
              │                                      │                    │
              │                                      │                    │
              └──────────────────────────────────────┼────────────────────┘
                                                     │
                                                     ▼
                                              ┌─────────────┐
                                              │   FINANCE   │
                                              │  (Invoice)  │
                                              └─────────────┘
```

---

## 📊 Status Flow Summary

### Work Order Status
```
PENDING → IN_PROGRESS → PAUSED (if maintenance) → IN_PROGRESS → COMPLETED → SUBMITTED → APPROVED/REJECTED
```

### Sales Order Status
```
DRAFT → CONFIRMED → PROCESSING → SHIPPED → DELIVERED → INVOICED → PAID
```

### Purchase Order Status
```
DRAFT → APPROVED → ORDERED → PARTIAL_RECEIVED → RECEIVED → COMPLETED
```

### QC Inspection Status
```
PENDING → IN_PROGRESS → COMPLETED (PASS/FAIL/QUARANTINE)
```

### Production Approval Status
```
PENDING → APPROVED/REJECTED/REVISION_REQUESTED → FORWARDED_TO_FINANCE
```

---

## 🎯 Key Integration Points

| From Module | To Module | Trigger | Action |
|-------------|-----------|---------|--------|
| R&D | Product + BOM | Approval | Create Product & BOM |
| Sales Order | MRP | Item Added | Check Material Shortage |
| MRP | Purchasing | Shortage Found | Create PR → PO |
| PO | Inventory | GRN Received | Update Stock |
| Work Order | Inventory | Start WO | Reserve Materials |
| Production | WIP Batch | Record Added | Update Job Costing |
| Maintenance | Production | Machine Down | Pause WO + Downtime |
| HR Attendance | Job Costing | Sync | Calculate Labor Cost |
| QC Reject | Waste | Disposition | Create Waste Record |
| QC Pass | Shipping | Released | Ready for Shipping |
| Production | Approval | WO Complete | Submit for Review |
| Approval | Finance | Approved | Create Invoice |
| Shipping | Finance | Delivered | Generate Invoice |

---

*Document generated: December 2024*
*ERP System v2.0*
