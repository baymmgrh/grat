# 📚 DOKUMENTASI LENGKAP SISTEM ERP
## PT. GRATIA MAKMUR SENTOSA

**Versi:** 2.0  
**Tanggal Update:** 3 Februari 2026  
**Teknologi:** Flask + React + TypeScript  

---

## 📋 DAFTAR ISI

1. [Ringkasan Sistem](#1-ringkasan-sistem)
2. [Arsitektur Teknis](#2-arsitektur-teknis)
3. [Struktur Database](#3-struktur-database)
4. [Modul-Modul Aplikasi](#4-modul-modul-aplikasi)
5. [Workflow Bisnis](#5-workflow-bisnis)
6. [API Reference](#6-api-reference)
7. [Panduan Penggunaan](#7-panduan-penggunaan)
8. [Troubleshooting](#8-troubleshooting)
9. [Maintenance & Backup](#9-maintenance--backup)

---

## 1. RINGKASAN SISTEM

### 1.1 Tentang Aplikasi

Sistem ERP ini adalah aplikasi manajemen perusahaan terintegrasi yang didesain khusus untuk industri manufaktur nonwoven. Sistem mencakup seluruh proses bisnis dari penjualan, produksi, quality control, hingga keuangan.

### 1.2 Fitur Utama

| Kategori | Fitur |
|----------|-------|
| **Produksi** | Work Order, OEE Tracking, Daily Controller, Multi-Product per Shift |
| **Quality** | Inspection, Defect Tracking, CAPA, Quality Objectives |
| **Warehouse** | Inventory, Stock Movement, WIP Stock, Packing List |
| **Sales** | Customer, Quotation, Sales Order, Invoice |
| **Purchasing** | Supplier, Purchase Order, GRN |
| **Finance** | GL, AP, AR, WIP Accounting, Job Costing |
| **HR** | Employee, Attendance, Payroll, Appraisal |
| **MRP** | Material Planning, Demand Forecasting |
| **R&D** | Project, Experiment, Material Testing |
| **Maintenance** | Preventive, Corrective, Spare Parts |

### 1.3 Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND                                 │
│  React 18 + TypeScript + Redux Toolkit + Tailwind CSS       │
│  Recharts + React Router + Axios                            │
└─────────────────────────────────────────────────────────────┘
                            ↕ REST API (JWT Auth)
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND                                  │
│  Python 3.10+ + Flask 3.0 + SQLAlchemy 2.0                  │
│  Flask-JWT-Extended + Flask-CORS + Flask-Migrate            │
└─────────────────────────────────────────────────────────────┘
                            ↕ ORM
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE                                 │
│  SQLite (Dev) / PostgreSQL (Production)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. ARSITEKTUR TEKNIS

### 2.1 Struktur Folder

```
ERP FLASK/
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── config.py              # Configuration settings
│   ├── models/                # SQLAlchemy models (45 files)
│   │   ├── __init__.py
│   │   ├── production.py      # Work Order, ShiftProduction, etc.
│   │   ├── sales.py           # Customer, Sales Order, etc.
│   │   ├── finance.py         # GL, Journal, Transaction
│   │   ├── hr.py              # Employee, Attendance
│   │   ├── warehouse.py       # Inventory, Stock Movement
│   │   └── ...
│   ├── routes/                # API endpoints (86 files)
│   │   ├── production.py      # /api/production/*
│   │   ├── oee.py             # /api/oee/*
│   │   ├── sales.py           # /api/sales/*
│   │   ├── finance.py         # /api/finance/*
│   │   └── ...
│   ├── utils/                 # Helper functions
│   ├── migrations/            # Alembic migrations
│   └── tests/                 # Unit tests
│
├── frontend/
│   ├── src/
│   │   ├── pages/             # React pages (32 modules)
│   │   │   ├── Production/    # 49 components
│   │   │   ├── Sales/         # 24 components
│   │   │   ├── Finance/       # 23 components
│   │   │   ├── HR/            # 28 components
│   │   │   ├── Warehouse/     # 27 components
│   │   │   └── ...
│   │   ├── components/        # Reusable components
│   │   ├── store/             # Redux store
│   │   └── utils/             # Helper functions
│   └── public/
│
└── docs/                      # Documentation
```

### 2.2 Authentication Flow

```
User Login → POST /api/auth/login → 
  Validate Credentials → 
    Generate JWT Token (Access + Refresh) → 
      Return to Client → 
        Store in localStorage → 
          Include in Authorization Header
```

### 2.3 Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Super Admin** | Full access to all modules |
| **Admin** | Manage users, settings, all operations |
| **Manager** | View reports, approve requests |
| **Supervisor** | Production input, quality inspection |
| **Operator** | Limited input access |
| **Accountant** | Finance module only |
| **HR** | HR module only |
| **Viewer** | Read-only access |

---

## 3. STRUKTUR DATABASE

### 3.1 Core Tables

#### Production Module
```sql
-- Work Orders
work_orders (
    id, wo_number, product_id, machine_id, quantity,
    quantity_produced, quantity_good, quantity_scrap,
    start_date, end_date, status, priority, notes
)

-- Shift Production (OEE Tracking)
shift_productions (
    id, production_date, shift, machine_id, product_id,
    work_order_id, target_quantity, actual_quantity,
    good_quantity, reject_quantity, rework_quantity,
    setting_sticker, setting_packaging,
    planned_runtime, actual_runtime, downtime_minutes,
    downtime_mesin, downtime_operator, downtime_material,
    downtime_design, downtime_others, idle_time,
    machine_speed, quality_rate, efficiency_rate, oee_score,
    issues, notes, early_stop, early_stop_time
)

-- Production Records
production_records (
    id, work_order_id, machine_id, product_id,
    production_date, shift, quantity_produced,
    quantity_good, quantity_scrap, downtime_minutes,
    operator_id, notes
)

-- Machines
machines (
    id, code, name, type, status, location,
    target_efficiency, machine_speed
)
```

#### Sales Module
```sql
-- Customers
customers (
    id, code, name, address, phone, email,
    contact_person, credit_limit, payment_terms
)

-- Sales Orders
sales_orders (
    id, so_number, customer_id, order_date,
    delivery_date, total_amount, status, notes
)

-- Sales Order Items
sales_order_items (
    id, sales_order_id, product_id, quantity,
    unit_price, discount, total
)
```

#### Warehouse Module
```sql
-- Inventory
inventory (
    id, product_id, warehouse_id, quantity,
    reserved_quantity, available_quantity,
    unit_cost, last_updated
)

-- Stock Movements
stock_movements (
    id, product_id, warehouse_id, movement_type,
    quantity, reference_type, reference_id,
    created_at, created_by
)

-- WIP Stock
wip_stock (
    id, product_id, quantity, pack_per_carton,
    last_updated
)
```

#### Finance Module
```sql
-- Chart of Accounts
accounts (
    id, code, name, type, parent_id,
    is_active, balance
)

-- Journal Entries
journal_entries (
    id, entry_number, entry_date, description,
    total_debit, total_credit, status, created_by
)

-- Journal Lines
journal_lines (
    id, journal_entry_id, account_id,
    debit, credit, description
)
```

### 3.2 Relasi Antar Tabel

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Customers  │────→│ Sales Orders│────→│  SO Items   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ↓
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Products   │←────│ Work Orders │────→│  Machines   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       ↓                   ↓
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Inventory  │     │ShiftProduct │────→│Prod Records │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       ↓                   ↓
┌─────────────┐     ┌─────────────┐
│Stock Movement│     │  WIP Stock  │
└─────────────┘     └─────────────┘
```

---

## 4. MODUL-MODUL APLIKASI

### 4.1 MODUL PRODUKSI

#### 4.1.1 Work Order Management
**Lokasi:** `/app/production/work-orders`

**Fitur:**
- Buat, edit, hapus Work Order
- Assign mesin dan operator
- Track progress produksi
- Multi-product per Work Order

**Status Work Order:**
- `draft` - Baru dibuat
- `confirmed` - Dikonfirmasi
- `in_progress` - Sedang berjalan
- `completed` - Selesai
- `cancelled` - Dibatalkan

#### 4.1.2 Daily Controller
**Lokasi:** `/app/production/daily-controller`

**Fitur:**
- Dashboard OEE per mesin per hari
- Tracking Availability, Performance, Quality
- Multi-product per shift support
- Top 3 Downtime analysis
- Real-time efficiency calculation

**Kalkulasi OEE:**
```
Availability = (Planned Runtime - Downtime) / Planned Runtime × 100%
Performance = Actual Output / (Runtime × Machine Speed) × 100%
Quality = Good Quantity / Total Quantity × 100%
OEE = Availability × Performance × Quality
```

#### 4.1.3 Production Input
**Lokasi:** `/app/production/work-orders/{id}/input`

**Fitur:**
- Input produksi per shift
- Grade A (Good), Grade B (Rework), Grade C (Reject)
- Setting Sticker, Setting Packaging
- Downtime entries dengan kategori
- Average time (planned runtime) custom
- Early stop tracking
- Multi-product per shift

**Kategori Downtime:**
| Kategori | Contoh |
|----------|--------|
| Mesin | Breakdown, seal tidak maksimal, inkjet error |
| Operator | Salah setting, human error |
| Material | Kain tipis, material defect |
| Design | Ganti variant, changeover |
| Others | Istirahat, meeting |
| Idle | Tunggu kain, tunggu stiker |

#### 4.1.4 Schedule Grid
**Lokasi:** `/app/production/schedule-grid`

**Fitur:**
- Visual scheduling dengan drag & drop
- View mingguan/bulanan
- Assign Work Order ke mesin
- Capacity planning

### 4.2 MODUL QUALITY

#### 4.2.1 Quality Inspection
**Lokasi:** `/app/quality`

**Tipe Inspeksi:**
- Incoming (material masuk)
- In-Process (selama produksi)
- Final (finish good)

#### 4.2.2 Quality Objectives
**Lokasi:** `/app/oee/quality-objectives`

**Fitur:**
- Target bulanan per mesin
- Achievement tracking
- Top 3 Downtime analysis
- Root Cause Analysis (RCA)

### 4.3 MODUL WAREHOUSE

#### 4.3.1 Inventory Management
**Lokasi:** `/app/warehouse`

**Fitur:**
- Real-time stock tracking
- Multi-warehouse support
- Stock alerts (min/max)
- Stock valuation (FIFO/LIFO/Average)

#### 4.3.2 WIP Stock
**Lokasi:** `/app/warehouse/wip-stock`

**Fitur:**
- Track Work In Progress per produk
- Movement history
- Adjustment dengan approval

#### 4.3.3 Packing List
**Lokasi:** `/app/production/packing-list`

**Fitur:**
- Buat packing list dari WIP Stock
- Carton numbering
- Weighing per carton
- Traceability ke Work Order

#### 4.3.4 Material Issue
**Lokasi:** `/app/warehouse/material-issue`

**Fitur:**
- Issue material ke produksi
- Auto deduct dari inventory
- Track consumption per Work Order

### 4.4 MODUL SALES

#### 4.4.1 Customer Management
**Lokasi:** `/app/sales/customers`

#### 4.4.2 Sales Order
**Lokasi:** `/app/sales/orders`

**Workflow:**
```
Draft → Confirmed → Processing → Shipped → Invoiced → Paid
```

#### 4.4.3 Quotation
**Lokasi:** `/app/sales/quotations`

### 4.5 MODUL PURCHASING

#### 4.5.1 Supplier Management
**Lokasi:** `/app/purchasing/suppliers`

#### 4.5.2 Purchase Order
**Lokasi:** `/app/purchasing/purchase-orders`

**Workflow:**
```
Draft → Approved → Ordered → Received → Invoiced → Paid
```

#### 4.5.3 Goods Receipt Note (GRN)
**Lokasi:** `/app/purchasing/grn`

### 4.6 MODUL FINANCE

#### 4.6.1 Chart of Accounts
**Lokasi:** `/app/finance/accounts`

**Tipe Akun:**
- Asset
- Liability
- Equity
- Revenue
- Expense

#### 4.6.2 Journal Entry
**Lokasi:** `/app/finance/journals`

#### 4.6.3 WIP Accounting
**Lokasi:** `/app/finance/wip-accounting`

**Fitur:**
- WIP Ledger per Work Order
- Cost tracking (Material, Labor, Overhead)
- COGM calculation
- Auto GL posting

#### 4.6.4 Job Costing
**Lokasi:** `/app/finance/job-costing`

**Fitur:**
- Cost per Work Order
- Variance analysis
- Profitability per product

### 4.7 MODUL HR

#### 4.7.1 Employee Management
**Lokasi:** `/app/hr/employees`

#### 4.7.2 Attendance
**Lokasi:** `/app/hr/attendance`

**Fitur:**
- Clock in/out
- QR Code attendance
- Overtime tracking

#### 4.7.3 Payroll
**Lokasi:** `/app/hr/payroll`

#### 4.7.4 Work Roster
**Lokasi:** `/app/hr/work-roster`

**Fitur:**
- Shift assignment
- Drag & drop interface
- Weekly view

### 4.8 MODUL MRP

**Lokasi:** `/app/mrp`

**Fitur:**
- Demand forecasting
- Material requirement calculation
- Auto generate PO/WO
- Shortage alerts

### 4.9 MODUL MAINTENANCE

**Lokasi:** `/app/maintenance`

**Fitur:**
- Preventive maintenance scheduling
- Corrective maintenance tracking
- Spare parts inventory
- Equipment history

### 4.10 MODUL R&D

**Lokasi:** `/app/rd`

**Fitur:**
- Project management
- Experiment tracking
- Material testing
- Product development

---

## 5. WORKFLOW BISNIS

### 5.1 Sales to Production Flow

```
┌─────────────┐
│ Sales Order │
│  Confirmed  │
└──────┬──────┘
       │
       ↓
┌─────────────┐     ┌─────────────┐
│  MRP Check  │────→│  Shortage?  │
└──────┬──────┘     └──────┬──────┘
       │                   │
       │ No                │ Yes
       ↓                   ↓
┌─────────────┐     ┌─────────────┐
│ Create WO   │     │ Create PO   │
└──────┬──────┘     └──────┬──────┘
       │                   │
       ↓                   ↓
┌─────────────┐     ┌─────────────┐
│ Production  │     │   Receive   │
│   Start     │←────│   Material  │
└──────┬──────┘     └─────────────┘
       │
       ↓
┌─────────────┐
│  QC Check   │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
   ↓       ↓
┌─────┐ ┌─────┐
│Pass │ │Fail │
└──┬──┘ └──┬──┘
   │       │
   ↓       ↓
┌─────┐ ┌─────┐
│ FG  │ │Rework│
└──┬──┘ └─────┘
   │
   ↓
┌─────────────┐
│  Shipping   │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Invoice    │
└─────────────┘
```

### 5.2 Production to Finance Flow

```
┌─────────────┐
│ WO Started  │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Create WIP  │
│   Ledger    │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────┐
│     Accumulate Costs            │
│  Material + Labor + Overhead    │
└──────┬──────────────────────────┘
       │
       ↓
┌─────────────┐
│ WO Complete │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ COGM Entry  │
│ WIP → FG    │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Auto GL     │
│  Posting    │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│Product Sold │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ COGS Entry  │
│ FG → COGS   │
└─────────────┘
```

### 5.3 Multi-Product per Shift Flow

```
┌─────────────────────────────────────────────┐
│              SHIFT 1 (06:30-15:00)          │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐    ┌─────────────┐        │
│  │  Shift 1a   │    │  Shift 1b   │        │
│  │ Product A   │    │ Product B   │        │
│  │ 150 menit   │    │ 360 menit   │        │
│  │ 06:30-09:00 │    │ 09:00-15:00 │        │
│  └─────────────┘    └─────────────┘        │
│                                             │
│  Total Planned Runtime = 510 menit          │
│  (150 + 360 = 510)                          │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 6. API REFERENCE

### 6.1 Authentication

```bash
# Login
POST /api/auth/login
Body: { "username": "admin", "password": "password" }
Response: { "access_token": "...", "refresh_token": "..." }

# Refresh Token
POST /api/auth/refresh
Header: Authorization: Bearer {refresh_token}

# Logout
POST /api/auth/logout
```

### 6.2 Production APIs

```bash
# Work Orders
GET    /api/production/work-orders
POST   /api/production/work-orders
GET    /api/production/work-orders/{id}
PUT    /api/production/work-orders/{id}
DELETE /api/production/work-orders/{id}

# Production Records
POST   /api/production/work-orders/{id}/production-records
GET    /api/production/production-records/{id}
PUT    /api/production/production-records/{id}
DELETE /api/production/production-records/{id}

# Daily Controller
GET    /api/oee/daily-controller?date=2026-02-02

# Machines
GET    /api/production/machines
POST   /api/production/machines
```

### 6.3 Warehouse APIs

```bash
# Inventory
GET    /api/warehouse/stock
POST   /api/warehouse/stock/adjustment

# WIP Stock
GET    /api/packing-list/wip-stock
POST   /api/packing-list/wip-stock/adjustment

# Packing List
GET    /api/packing-list
POST   /api/packing-list
PUT    /api/packing-list/{id}
POST   /api/packing-list/{id}/weigh-carton
```

### 6.4 Sales APIs

```bash
# Customers
GET    /api/sales/customers
POST   /api/sales/customers

# Sales Orders
GET    /api/sales/orders
POST   /api/sales/orders
PUT    /api/sales/orders/{id}
POST   /api/sales/orders/{id}/confirm
```

### 6.5 Finance APIs

```bash
# Accounts
GET    /api/finance/accounts
POST   /api/finance/accounts

# Journal Entries
GET    /api/finance/journals
POST   /api/finance/journals
POST   /api/finance/journals/{id}/post

# WIP Accounting
GET    /api/wip-accounting
POST   /api/wip-accounting/entries
```

---

## 7. PANDUAN PENGGUNAAN

### 7.1 Login & Dashboard

1. Buka aplikasi di browser
2. Masukkan username dan password
3. Setelah login, akan diarahkan ke Dashboard
4. Dashboard menampilkan ringkasan KPI dan notifikasi

### 7.2 Input Produksi Harian

1. Buka **Production → Work Orders**
2. Pilih Work Order yang sedang berjalan
3. Klik **Input Produksi**
4. Isi data:
   - Tanggal Produksi
   - Shift (1/2/3)
   - Produk (jika multi-product)
   - Average Time (menit)
   - Grade A (Good)
   - Grade B (Rework)
   - Grade C (Reject)
   - Setting Sticker
   - Setting Packaging
   - Downtime entries
5. Klik **Simpan**

### 7.3 Melihat Daily Controller

1. Buka **Production → Daily Controller**
2. Pilih tanggal
3. Lihat data per mesin:
   - OEE Score
   - Availability, Performance, Quality
   - Output per shift
   - Top 3 Downtime

### 7.4 Membuat Packing List

1. Buka **Production → Packing List**
2. Klik **Buat Packing List Baru**
3. Pilih produk dari WIP Stock
4. Tentukan jumlah carton
5. Input nomor carton awal
6. Simpan
7. Lakukan penimbangan per carton

### 7.5 Membuat Sales Order

1. Buka **Sales → Orders**
2. Klik **New Order**
3. Pilih Customer
4. Tambah item produk
5. Set delivery date
6. Simpan sebagai Draft
7. Confirm untuk proses

---

## 8. TROUBLESHOOTING

### 8.1 Error Umum

| Error | Penyebab | Solusi |
|-------|----------|--------|
| 401 Unauthorized | Token expired | Login ulang |
| 404 Not Found | Data tidak ada | Cek ID/parameter |
| 500 Server Error | Bug backend | Cek log server |
| CORS Error | Cross-origin blocked | Cek config CORS |

### 8.2 Data Tidak Sinkron

**Masalah:** Data di Daily Controller tidak sesuai dengan Production Records

**Solusi:**
1. Cek tabel `shift_productions` di database
2. Pastikan `product_id`, `good_quantity`, `downtime_minutes` benar
3. Jika perlu, jalankan script fix:
```python
python fix_shift_production_data.py
```

### 8.3 Multi-Product per Shift

**Masalah:** Input produksi kedua di shift yang sama tidak tersimpan benar

**Solusi:**
- Pastikan memilih produk yang berbeda
- Backend sudah di-fix untuk handle multi-product per shift
- Restart server setelah update kode

---

## 9. MAINTENANCE & BACKUP

### 9.1 Backup Database

```bash
# Manual backup
python -c "from app import create_app; from utils.backup import backup_database; app = create_app(); app.app_context().push(); backup_database()"

# Atau via API
POST /api/backup/create
```

### 9.2 Restore Database

```bash
POST /api/backup/restore
Body: { "backup_file": "backup_20260203.db" }
```

### 9.3 Log Files

Lokasi: `backend/logs/`

- `app.log` - Application log
- `error.log` - Error log
- `access.log` - Access log

### 9.4 Health Check

```bash
GET /api/health
Response: { "status": "healthy", "database": "connected", "version": "2.0" }
```

---

## 📊 STATISTIK APLIKASI

| Kategori | Jumlah |
|----------|--------|
| **Backend Models** | 45 files |
| **Backend Routes** | 86 files |
| **Frontend Pages** | 32 modules |
| **Frontend Components** | 200+ files |
| **API Endpoints** | 500+ endpoints |
| **Database Tables** | 100+ tables |
| **Lines of Code** | ~150,000+ |

---

## 📞 KONTAK & SUPPORT

**Developer:** [Nama Developer]  
**Email:** [email@company.com]  
**Repository:** https://github.com/baymngrh/grat

---

*Dokumentasi ini di-generate pada 3 Februari 2026*
