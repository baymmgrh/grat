# 📚 DOKUMENTASI LENGKAP SISTEM ERP
## PT. GRATIA MAKMUR SENTOSA

**Tanggal Update:** 13 Maret 2026  
**Teknologi:** Python Flask + React TypeScript  
**Database:** SQLite (Dev) / PostgreSQL (Prod) — 269 tabel aktif  

---

## 1. RINGKASAN SISTEM

### 1.1 Tentang Aplikasi

Sistem ERP ini adalah aplikasi manajemen perusahaan terintegrasi yang didesain khusus untuk industri manufaktur nonwoven. Sistem mencakup seluruh proses bisnis dari penjualan, produksi, quality control, document control (DCC & CAPA), warehouse, shipping, keuangan, hingga SDM.

### 1.2 Fitur Utama

| Kategori | Fitur |
|----------|-------|
| **Produksi** | Work Order, OEE Tracking, Daily Controller, Multi-Product per Shift, Converting, Schedule Grid |
| **DCC & CAPA** | Document Registry, Revisions, Distributions, CPAR, SCAR, CCHF, Internal Memo, Destruction |
| **Quality** | Inspection (Incoming/In-Process/Final), Defect Tracking, Quality Objectives, KPI Target |
| **Warehouse** | Inventory, Stock Movement, WIP Stock, Packing List, Stock Opname, Material Issue |
| **Sales** | Customer, Lead, Opportunity, Quotation, Sales Order, Invoice, Forecast |
| **Purchasing** | Supplier, RFQ, Purchase Order, GRN, Price Comparison |
| **Shipping** | Dispatch Note, Delivery Tracking, Logistics Provider |
| **Returns** | Customer Return, QC Record, Disposition |
| **Finance** | COA, Journal Entry, AP/AR, WIP Accounting, Job Costing, Budget, Cash & Bank |
| **HR** | Employee, Attendance, Payroll, Appraisal, Training, Work Roster, Leave, Face Recognition |
| **R&D** | Project, Experiment, Formula, Product Development |
| **Maintenance** | Preventive, Corrective, Spare Parts, Equipment History |
| **K3 / Pre-Shift** | Safety Checklist, Machine Handover, Corrective Action |
| **Communication** | Group Chat, Internal Memo, Notifications, Approval Workflow |

---

## 2. ARSITEKTUR TEKNIS

### 2.1 Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND                                 │
│  React 18 + TypeScript + Redux Toolkit + Tailwind CSS       │
│  Recharts + React Router + Axios                            │
└─────────────────────────────────────────────────────────────┘
                            ↕ REST API (JWT Auth)
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND                                  │
│  Python 3.12 + Flask 3.0 + SQLAlchemy 2.0                   │
│  Flask-JWT-Extended + Flask-CORS + Flask-Migrate (Alembic)  │
└─────────────────────────────────────────────────────────────┘
                            ↕ ORM
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE                                 │
│  SQLite (Dev) / PostgreSQL (Production)                     │
│  Total: 269 tabel aktif                                     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Struktur Folder

```
SourceCode/
├── backend/                          # Python Flask Backend
│   ├── app.py                        # Main Flask application
│   ├── config.py                     # Configuration settings
│   ├── models/                       # SQLAlchemy models (48 files)
│   ├── routes/                       # API endpoints (91 files)
│   ├── utils/                        # Helper functions (19 files)
│   ├── seeds/                        # Seed data scripts (3 files)
│   ├── scripts/                      # Utility scripts (4 files)
│   ├── tests/                        # Unit tests (44 files)
│   ├── middleware/                    # Auth middleware (1 file)
│   └── migrations/                   # Alembic migrations (26 files)
│
├── frontend/                         # React TypeScript Frontend
│   ├── src/
│   │   ├── pages/                    # 32 module folders, 397 components
│   │   ├── components/               # Reusable components (60 files)
│   │   ├── store/                    # Redux store (3 files)
│   │   └── hooks/                    # Custom hooks (3 files)
│   └── public/                       # Static assets
│
└── docs/                             # Documentation (7 files)
```

### 2.3 Authentication & RBAC

```
User Login → POST /api/auth/login → Validate Credentials →
  Generate JWT (Access + Refresh) → Return to Client →
    Store in localStorage → Include in Authorization Header
```

| Role | Permissions |
|------|-------------|
| **Super Admin** | Full access to all modules |
| **Admin** | Manage users, settings, all operations |
| **Manager** | View reports, approve requests, DCC review |
| **QA Manager** | Quality, SCAR approval, Document approval (Level II+III) |
| **Supervisor** | Production input, quality inspection, CAPA initiate |
| **DCC Staff** | Document control, distribution, destruction |
| **Operator** | Limited input access |
| **Accountant** | Finance module only |
| **HR** | HR module only |
| **Viewer** | Read-only access |

---

## 📊 STATISTIK KODE

| Kategori | File | Baris Kode |
|----------|-----:|----------:|
| Backend (Python) | 339 | 97,428 |
| Frontend (TSX/TS/CSS) | 428 | 180,231 |
| Config & Docs | 27 | 20,434 |
| **TOTAL** | **811** | **304,002** |

| Infrastruktur | Jumlah |
|---------------|-------:|
| Model Files | 48 |
| Route Files | 91 |
| Test Files | 44 |
| Migration Files | 26 |
| Frontend Page Modules | 32 |
| Reusable Components | 60 |
| Database Tables | 269 |

---

## 📁 MODUL & SUB-MODUL LENGKAP

---

### 1. MODUL PRODUKSI
**Backend:** `production.py`, `oee.py`, `work_order_bom.py`, `converting.py`, `custom_bom.py`  
**Routes:** `production.py`, `production_input.py`, `production_planning.py`, `production_approval.py`, `production_integration.py`, `oee.py`, `converting.py`, `custom_bom.py`, `bom_management.py`, `bom.py`, `schedule_grid.py`, `weekly_production_plan.py`, `work_order_monitoring.py`, `product_changeover.py`, `live_monitoring.py`, `packing_list.py`

**Sub-Modul:**

1. **Work Order Management** — Pembuatan WO (Draft → Confirmed → In Progress → Completed), penjadwalan mesin, penugasan operator
   - `WorkOrderList.tsx`, `WorkOrderForm.tsx`, `WorkOrderDetail.tsx`, `WorkOrderEdit.tsx`, `WorkOrderStatus.tsx`, `WorkOrderTimeline.tsx`, `WorkOrderBreakdown.tsx`, `WorkOrderMonitoring.tsx`, `WorkOrderBOMEdit.tsx`
2. **Production Input per Shift** — Output per shift, Grade A/B/C, Setting Sticker & Packaging, multi-product
   - `WorkOrderProductionInput.tsx`, `ProductionInput.tsx`, `ProductionRecordForm.tsx`, `ProductionRecords.tsx`, `EditProductionRecord.tsx`
3. **Daily/Weekly/Monthly Controller & OEE** — Visualisasi efisiensi per mesin, Availability/Performance/Quality, OEE Score
   - `DailyController.tsx`, `DailyControllerDetail.tsx`, `WeeklyController.tsx`, `MonthlyController.tsx`, `OEEDashboard.tsx`, `OEEDashboardEnhanced.tsx`, `OEERecordForm.tsx`, `MachineAnalytics.tsx`, `EfficiencyTracking.tsx`
4. **Downtime & Breakdown** — 6 kategori (Mesin, Operator, Material, Design, Idle, Others), Early Stop
   - `DowntimeInput.tsx`, `BreakdownSummary.tsx`
5. **Mesin** — Database mesin, target efisiensi, speed
   - `MachineList.tsx`, `MachineForm.tsx`, `MachineDetail.tsx`
6. **BOM & Converting** — History racikan BOM, converting raw material ke sub-produk
   - `ConvertingDashboard.tsx`, `ConvertingInput.tsx`
7. **Schedule & Planning** — Drag-and-Drop kalender beban produksi, perencanaan mingguan/bulanan
   - `ProductionScheduling.tsx`, `ProductionScheduleForm.tsx`, `WeeklyProductionPlan.tsx`, `WeeklyPlanDetail.tsx`, `MonthlyProductionPlan.tsx`, `ProductionPlanningDashboard.tsx`, `ProductionPlanningForm.tsx`, `ProductionPlanningList.tsx`
8. **Live Monitoring** — Real-time monitoring per mesin
   - `LiveMonitoringDashboard.tsx`, `LiveMonitoringView.tsx`, `LiveMonitoringWeekly.tsx`
9. **Product Changeover** — Tracking pergantian produk antar shift
   - `ProductChangeover.tsx`, `ChangeoverList.tsx`
10. **Production Approval** — Approval flow untuk produksi
    - `ProductionApprovalList.tsx`, `ProductionApprovalDetail.tsx`
11. **WIP & Packing List** — Tracking produk setengah jadi, penomoran karton, weighing
    - `WIPDashboard.tsx`, `WIPStock.tsx`, `WIPBatchList.tsx`, `WIPBatchForm.tsx`, `PackingListNew.tsx`, `PackingListDetail.tsx`, `RemainingStock.tsx`
12. **Material Issue** — Mutasi material ke lantai produksi sesuai BOM
    - `MaterialIssueList.tsx`, `MaterialIssueForm.tsx`, `MaterialIssueDetail.tsx`
13. **Dashboard & Traceability**
    - `ProductionDashboard.tsx`, `Traceability.tsx`

---

### 2. MODUL DCC & CAPA (Document Control Center)
**Backend:** `dcc.py` (13 tabel), `document_management.py`  
**Standar:** ISO 9001:2015 (Klausul 7.5)  
**Referensi:** QP-DCC-01, QP-DCC-02, QP-DCC-03, QP-DCC-04, WI-DCC-01, WI-DCC-02

**Sub-Modul:**

1. **Pengendalian Dokumen (QP-DCC-01)** — Registry dokumen terkendali Level I-IV, 3-level approval chain
   - Model: `DccDocument`, `DccDocumentRevision`, `DccDocumentDistribution`, `DccDocumentReview`, `DccChangeNotice`
   - FRM: FRM-DCC-01 (Serah Terima), FRM-DCC-02 (Daftar Induk), FRM-DCC-04 (Distribusi), FRM-DCC-05 (Change Notice), FRM-DCC-10 (Kaji Ulang)
2. **Pengendalian Rekaman Mutu (QP-DCC-02)** — Daftar induk rekaman SMM & mutu produk
   - Model: `DccQualityRecord`
   - FRM: FRM-DCC-03
3. **CAPA Management (QP-DCC-03, WI-DCC-02)** — CPAR/SCAR/CCHF, auto-numbering, RCA 5-Why, verifikasi efektivitas
   - Model: `CapaRequest`, `CapaInvestigation`, `CapaVerification`, `CapaMonthlyReport`
   - FRM: FRM-DCC-08 (CPAR), FRM-DCC-11 (SCAR), FRM-DCC-09 (Laporan Bulanan), FRM-MKT-13 (CCHF)
4. **Komunikasi Internal (QP-DCC-04)** — Memo antar departemen, read receipts
   - Model: `InternalMemo`, `InternalMemoDistribution`
   - FRM: FRM-DCC-07
5. **Pemusnahan Dokumen (WI-DCC-01)** — Berita acara pemusnahan fisik & digital
   - Model: `DccDestructionLog`
   - FRM: FRM-DCC-14

**Frontend Existing:**
- `DocumentDashboard.tsx`, `DocumentDashboardUpgraded.tsx`, `DocumentGenerator.tsx`, `DocumentGeneratorUpgraded.tsx`, `TemplateDesigner.tsx`, `TemplateEditor.tsx`, `TemplateForm.tsx`, `TemplateList.tsx`

---

### 3. MODUL QUALITY & PENJAMINAN MUTU
**Backend:** `quality.py`, `quality_enhanced.py`, `kpi_target.py`, `waste.py`  
**Routes:** `quality.py`, `quality_enhanced.py`, `kpi_targets.py`, `waste.py`

**Sub-Modul:**

1. **Incoming QC** — Inspeksi kedatangan barang dari supplier
   - `IncomingQC.tsx`
2. **In-Process QC** — Kontrol kualitas di line produksi
   - `InProcessQC.tsx`
3. **Finish Good QC** — Rilis barang jadi ke gudang
   - `FinishGoodQC.tsx`
4. **Pending QC** — Antrian inspeksi yang belum selesai
   - `PendingQC.tsx`
5. **QC Packing List** — QC untuk packing list
   - `QCPackingList.tsx`
6. **QC to Warehouse** — Transfer barang lolos QC ke gudang
   - `QCToWarehouse.tsx`
7. **Quality Test** — Form dan list pengujian mutu
   - `QualityTestForm.tsx`, `QualityTestList.tsx`, `WorkOrderQCForm.tsx`
8. **Quality Objectives & KPI** — Target mutu bulanan per mesin/divisi
   - `QualityObjectiveProduction.tsx`
9. **Downtime Analysis** — Top 3 downtime, root cause management
   - `DowntimeAnalysis.tsx`
10. **Quality Dashboard & Analytics** — Dashboard performa mutu
    - `QualityDashboardEnhanced.tsx`, `QualityAnalytics.tsx`, `QualityAlerts.tsx`, `QualityAudits.tsx`

---

### 4. MODUL GUDANG & LOGISTIK (WAREHOUSE)
**Backend:** `warehouse.py`, `warehouse_enhanced.py`, `warehouse_adjustment.py`, `material_issue.py`, `stock_opname.py`  
**Routes:** `warehouse.py`, `warehouse_enhanced.py`, `stock_opname.py`, `stock_input.py`, `material_issue.py`, `material_stock.py`

**Sub-Modul:**

1. **Inventory Management** — Tracking stok real-time, multi-warehouse
   - `InventoryList.tsx`, `InventoryListEnhanced.tsx`, `InventoryForm.tsx`, `AddProductToInventory.tsx`, `StockAlerts.tsx`
2. **Stock Input** — Input stok masuk
   - `StockInput.tsx`
3. **Stock Movement** — Mutasi stok antar gudang
   - `MovementList.tsx`, `MovementForm.tsx`, `MovementDetail.tsx`, `TransferForm.tsx`
4. **Stock Opname & Adjustment** — Audit fisik, koreksi stok, approval
   - `StockOpnameList.tsx`, `StockOpnameForm.tsx`, `StockOpnameDetail.tsx`, `AdjustmentForm.tsx`
5. **Warehouse Locations & Zones** — Manajemen lokasi penyimpanan
   - `WarehouseLocations.tsx`, `WarehouseZones.tsx`, `LocationList.tsx`, `LocationForm.tsx`, `LocationDetail.tsx`
6. **Material Management** — Raw material tracking
   - `MaterialsDashboard.tsx`, `MaterialsList.tsx`, `MaterialCreate.tsx`, `MaterialEdit.tsx`, `MaterialView.tsx`, `MaterialStockManagement.tsx`
7. **Reorder & ABC Analysis** — Reorder point, klasifikasi ABC
   - `ReorderList.tsx`, `ReorderPoints.tsx`, `ABCAnalysis.tsx`
8. **UoM (Unit of Measure)** — Konversi satuan
   - `UoMList.tsx`
9. **Dashboard & Analytics**
   - `WarehouseDashboardEnhanced.tsx`, `WarehouseAnalytics.tsx`

---

### 5. MODUL PENJUALAN (SALES)
**Backend:** `sales.py`  
**Routes:** `sales.py`

**Sub-Modul:**

1. **Customer Management** — Database pelanggan, credit limit, term pembayaran
   - `CustomerList.tsx`, `CustomerForm.tsx`, `CustomerDetails.tsx`
2. **Lead Management** — Prospek pelanggan baru
   - `LeadList.tsx`, `LeadListSimple.tsx`, `LeadListUpgraded.tsx`, `LeadForm.tsx`
3. **Opportunity** — Pipeline penjualan
   - `OpportunityList.tsx`, `OpportunityListNew.tsx`, `OpportunityListUpgraded.tsx`, `OpportunityForm.tsx`
4. **Quotation** — Penawaran harga
   - `QuotationList.tsx`, `QuotationForm.tsx`
5. **Sales Order** — Pesanan fix, delivery date, tracking
   - `SalesOrderList.tsx`, `SalesOrderListUpgraded.tsx`, `SalesOrderForm.tsx`, `SalesOrderDetails.tsx`
6. **Invoice** — Penagihan
   - `InvoiceForm.tsx`
7. **Sales Forecast** — Perencanaan penjualan
   - `SalesForecastList.tsx`, `SalesForecastForm.tsx`
8. **Activity Log** — Riwayat aktivitas sales
   - `ActivityList.tsx`, `ActivityForm.tsx`
9. **Workflow & Dashboard**
   - `SalesDashboard.tsx`, `WorkflowStatus.tsx`

---

### 6. MODUL PEMBELIAN (PURCHASING)
**Backend:** `purchasing.py`  
**Routes:** `purchasing.py`

**Sub-Modul:**

1. **Supplier Management** — Data supplier, lead-time, riwayat
   - `SupplierList.tsx`, `SupplierForm.tsx`
2. **RFQ (Request for Quotation)** — Permintaan penawaran
   - `RFQList.tsx`, `RFQForm.tsx`, `QuoteList.tsx`, `SupplierQuoteForm.tsx`
3. **Price Comparison** — Perbandingan harga supplier
   - `PriceComparison.tsx`
4. **Purchase Order** — Order resmi ke vendor
   - `PurchaseOrderList.tsx`, `PurchaseOrderForm.tsx`
5. **GRN (Goods Receipt Note)** — Konfirmasi penerimaan barang
   - `GRNForm.tsx`
6. **Contract Management** — Kontrak supplier
   - `ContractList.tsx`
7. **Dashboard**
   - `Purchasing.tsx`

---

### 7. MODUL SHIPPING & LOGISTIK
**Backend:** `shipping.py`, `shipping_updated.py`  
**Routes:** `shipping.py`

**Sub-Modul:**

1. **Shipping Order** — Surat jalan, manifest pengiriman
   - `ShippingOrderList.tsx`, `ShippingOrderForm.tsx`, `ShippingOrderDetails.tsx`
2. **Shipment** — Form pengiriman
   - `ShipmentForm.tsx`
3. **Create Shipping dari QC** — Link dari QC ke shipping
   - `CreateShippingFromQC.tsx`
4. **Delivery Tracking** — Tracking status pengiriman
   - `DeliveryTracking.tsx`, `ShippingTrackingForm.tsx`
5. **Logistics Providers** — Database armada/ekspedisi
   - `LogisticsProviders.tsx`
6. **Shipping Calculator** — Kalkulasi biaya kirim
   - `ShippingCalculator.tsx`
7. **Reports & Dashboard**
   - `ShippingDashboard.tsx`, `ShippingReportsForm.tsx`

---

### 8. MODUL RETURNS
**Backend:** `returns.py`  
**Routes:** `returns.py`

**Sub-Modul:**

1. **Return Dashboard** — Overview semua retur
   - `ReturnsDashboard.tsx`
2. **Create Return** — Form pembuatan retur (Sales/Purchase/Production)
   - `CreateReturnForm.tsx`
3. **Return Details** — Detail per retur, QC record, disposition
   - `ReturnDetails.tsx`

---

### 9. MODUL KEUANGAN & AKUNTANSI (FINANCE)
**Backend:** `finance.py`, `wip_accounting.py`, `wip_job_costing.py`  
**Routes:** `finance.py`, `wip_accounting.py`, `wip_job_costing.py`

**Sub-Modul:**

1. **Chart of Accounts (COA)** — Pohon akun finansial
   - `ChartOfAccounts.tsx`, `AccountForm.tsx`, `AccountingManagement.tsx`
2. **General Ledger** — Buku besar
   - `GeneralLedger.tsx`
3. **Accounts Payable** — Utang usaha
   - `AccountsPayable.tsx`
4. **Accounts Receivable** — Piutang usaha
   - `AccountsReceivable.tsx`
5. **Invoice & Payment** — Tagihan dan pembayaran
   - `InvoiceList.tsx`, `InvoiceForm.tsx`, `PaymentForm.tsx`, `ExpenseForm.tsx`
6. **WIP Ledger & Accounting** — Jurnal material otomatis (raw → COGM)
   - `WIPLedger.tsx`
7. **Budget & Forecasting** — Perencanaan anggaran
   - `BudgetPlanning.tsx`, `BudgetForecasting.tsx`, `BudgetForm.tsx`
8. **Cash & Bank** — Manajemen kas dan bank
   - `CashBankManagement.tsx`, `CashFlowManagement.tsx`
9. **Fixed Assets** — Aset tetap
   - `FixedAssets.tsx`
10. **Tax Management** — Perpajakan
    - `TaxManagement.tsx`
11. **Costing & Controlling** — Job costing analysis
    - `CostingControlling.tsx`
12. **Consolidation** — Konsolidasi laporan
    - `Consolidation.tsx`
13. **Financial Reports & Dashboard**
    - `FinancialReports.tsx`, `FinanceDashboard.tsx`, `FinanceDashboardNew.tsx`

---

### 10. MODUL SDM / HR & PAYROLL
**Backend:** `hr.py`, `hr_extended.py`  
**Routes:** `hr.py`, `hr_extended.py`, `hr_payroll.py`, `hr_appraisal.py`, `hr_training.py`, `attendance.py`, `work_roster.py`, `staff_leave.py`, `face_recognition.py`

**Sub-Modul:**

1. **Employee Database** — Buku induk pegawai, departemen, status
   - `EmployeeList.tsx`, `EmployeeForm.tsx`, `Departments.tsx`
2. **Attendance** — Absensi harian, scan masuk/keluar, anti-fraud
   - `AttendancePage.tsx`, `AttendanceForm.tsx`, `AttendanceManagement.tsx`, `AttendanceAdmin.tsx`, `AttendanceCalendar.tsx`, `AttendanceReport.tsx`, `AttendanceNotClockedOut.tsx`
3. **Face Recognition** — Absensi wajah (opsional)
   - `FaceAdmin.tsx`, `FaceRegistration.tsx` (Public), `PublicAttendance.tsx` (Public)
4. **Work Roster** — Rotasi shift, jadwal kerja
   - `WorkRosterComplete.tsx`, `WorkRosterWeekly.tsx`, `RosterCalendar.tsx`, `RosterDragDrop.tsx`, `RosterDragDropFixed.tsx`, `RosterDragDropRobust.tsx`, `RosterManagementComplete.tsx`, `RosterManagementIntegrated.tsx`, `RosterTest.tsx`
5. **Payroll** — Kalkulasi gaji, potongan, bonus
   - `PayrollList.tsx`, `PayrollForm.tsx`, `PayrollPeriodForm.tsx`, `PayrollRecordList.tsx`, `PieceworkLogList.tsx`
6. **Leave Management** — Pengajuan cuti, approval
   - `LeaveManagement.tsx`, `LeaveForm.tsx`, `LeaveRequestForm.tsx`, `StaffLeaveManagement.tsx`, `StaffLeaveRequest.tsx` (Public)
7. **Appraisal & KPI** — Evaluasi kinerja
   - `AppraisalList.tsx`, `AppraisalForm.tsx`, `AppraisalCycleForm.tsx`
8. **Training** — Program pelatihan, sertifikasi
   - `TrainingManagement.tsx`
9. **Outsourcing** — Vendor outsourcing
   - `OutsourcingVendorList.tsx`
10. **Dashboard & Reports**
    - `HRDashboard.tsx`, `Reports.tsx`

---

### 11. MODUL R&D (RESEARCH & DEVELOPMENT)
**Backend:** `rd.py`, `rnd.py`  
**Routes:** `rd.py`, `rd_projects.py`, `rd_experiments.py`, `rd_materials.py`, `rd_products.py`, `rd_reports.py`, `rd_extended.py`, `rd_integration.py`, `rnd.py`

**Sub-Modul:**

1. **Research Projects** — Manajemen proyek riset
   - `ProjectList.tsx`, `ProjectForm.tsx`, `ProjectDetails.tsx`, `ProjectDetailsForm.tsx`
2. **Experiments** — Percobaan formula, skala terbatas
   - `ExperimentList.tsx`, `ExperimentForm.tsx`
3. **R&D Materials** — Material khusus riset
   - `MaterialList.tsx`, `MaterialForm.tsx`
4. **Product Development** — Pengembangan produk baru
   - `ProductDevelopmentList.tsx`, `ProductDevelopmentForm.tsx`
5. **Reports & Dashboard**
   - `RDDashboard.tsx`, `ResearchReportsForm.tsx`
6. **RND Module (Extended)** — Alur R&D dengan approval
   - `RNDDashboard.tsx`, `RNDProjectList.tsx`, `RNDProjectForm.tsx`, `RNDProjectDetail.tsx`, `RNDApprovals.tsx`

---

### 12. MODUL MAINTENANCE (PEMELIHARAAN)
**Backend:** `maintenance.py`  
**Routes:** `maintenance.py`, `maintenance_extended.py`

**Sub-Modul:**

1. **Maintenance Dashboard** — Overview status mesin
   - `MaintenanceDashboard.tsx`, `MaintenanceDashboardEnhanced.tsx`
2. **Maintenance List & Form** — CRUD perawatan
   - `MaintenanceList.tsx`, `MaintenanceForm.tsx`
3. **Work Order Maintenance** — WO khusus perbaikan
   - `MaintenanceWorkOrderForm.tsx`, `MaintenanceRequestForm.tsx`
4. **Schedule** — Jadwal preventive maintenance
   - `MaintenanceSchedule.tsx`
5. **Spare Parts** — Suku cadang
   - `MaintenancePartsForm.tsx`
6. **Checklist NG Items** — Tracking item tidak baik
   - `ChecklistNGItems.tsx`
7. **Analytics**
   - `MaintenanceAnalyticsForm.tsx`

---

### 13. MODUL PRODUK (PRODUCTS)
**Backend:** `product.py`, `product_excel_schema.py`, `product_new_schema.py`, `uom.py`, `bom_history.py`  
**Routes:** `products.py`, `products_new.py`, `products_new_extended.py`, `products_new_excel.py`, `product_calculations.py`, `materials.py`, `materials_crud.py`, `materials_simple_crud.py`, `uom.py`

**Sub-Modul:**

1. **Product Master** — Database produk, spesifikasi teknis
   - `ProductList.tsx`, `ProductForm.tsx`, `ProductLifecycle.tsx`
2. **Product Categories** — Klasifikasi produk
   - `ProductCategories.tsx`, `CategoryList.tsx`, `CategoryForm.tsx`
3. **BOM (Bill of Materials)** — Resep produk
   - `BOMManagement.tsx`, `BOMForm.tsx`
4. **Nonwoven Calculator** — Kalkulator spesifik nonwoven
   - `NonwovenCalculator.tsx`
5. **Analytics & Dashboard**
   - `ProductDashboard.tsx`, `ProductAnalytics.tsx`

---

### 14. MODUL MRP (Material Requirements Planning)
**Routes:** `mrp.py`

**Sub-Modul:**

1. **MRP Dashboard** — Overview kebutuhan material
   - `MRPDashboard.tsx`, `MRP.tsx`
2. **Material Requirements** — Kalkulasi kebutuhan berdasarkan WO
   - `MaterialRequirements.tsx`
3. **Demand Planning** — Prediksi kebutuhan
   - `DemandPlanning.tsx`
4. **Capacity Planning** — Kapasitas produksi
   - `CapacityPlanning.tsx`
5. **Supplier Integration** — Link ke purchasing
   - `SupplierIntegration.tsx`
6. **What-If Simulation** — Simulasi skenario
   - `WhatIfSimulation.tsx`

---

### 15. MODUL NOTIFIKASI & APPROVAL WORKFLOW
**Backend:** `approval_workflow.py`, `notification.py`, `workflow_integration.py`, `group_chat.py`  
**Routes:** `approval_workflow.py`, `notifications.py`, `notifications_email.py`, `workflow.py`, `workflow_complete.py`, `workflow_integration.py`, `group_chat.py`

**Sub-Modul:**

1. **Approval Dashboard** — Overview semua permintaan approval
   - `ApprovalDashboard.tsx`, `ApprovalDetail.tsx`
2. **Group Chat** — Messaging internal per divisi
   - `GroupChat.tsx`, `ServerSettings.tsx`
3. **Notifications** — In-app & email notifications
   - `NotificationsPage.tsx`

---

### 16. MODUL WASTE MANAGEMENT
**Backend:** `waste.py`  
**Routes:** `waste.py`

**Sub-Modul:**

1. **Waste Record** — Log limbah produksi, identifikasi, rencana pengelolaan
   - `WasteRecordList.tsx`, `WasteRecordForm.tsx`

---

### 17. MODUL PENGATURAN & SISTEM
**Backend:** `settings.py`, `settings_extended.py`, `analytics.py`, `backup.py`, `integration.py`, `integration_extended.py`, `user_manual.py`  
**Routes:** `settings.py`, `settings_extended.py`, `analytics.py`, `backup.py`, `integration.py`, `integration_extended.py`, `user_manual.py`, `system_monitor.py`, `health.py`, `logs.py`

**Sub-Modul:**

1. **Settings** — Konfigurasi sistem global
   - `SettingsMain.tsx`, `Settings.tsx`, `AdvancedSystemConfig.tsx`
2. **User & Role Management** — Manajemen user, role, permission
   - `UserRoleManagement.tsx`, `UserRoleManagementNew.tsx`
3. **KPI Target Settings** — Setting target KPI
   - `KPITargetSettings.tsx`
4. **Email Settings** — Konfigurasi email
   - `EmailSettings.tsx`
5. **Backup & Restore** — Backup database manual/berjadwal
   - `BackupRestore.tsx`
6. **Audit Trail** — Rekam jejak aksi pengguna
   - `AuditTrail.tsx`

---

### 18. MODUL TAMBAHAN

**Reports**
- `Reports.tsx`, `ReportsFixed.tsx`, `ReportGenerator.tsx`, `CustomReportBuilder.tsx`, `AdvancedReportBuilder.tsx`, `ReportScheduler.tsx`, `ScheduledReports.tsx`, `ExecutiveDashboard.tsx`, `ProductionByProductReport.tsx`

**Executive Dashboard**
- `ExecutiveDashboard.tsx`, `ProductionExecutiveDashboard.tsx`, `ProductionMonitoringDashboard.tsx`

**TV Display** — Tampilan layar produksi
- `TVDisplaySelector.tsx`, `TVDisplayOverview.tsx`, `TVDisplayProduction.tsx`, `TVDisplayRoster.tsx`, `TVDisplayShipping.tsx`

**Integration** — External API, webhooks
- `APIGateway.tsx`, `DataSynchronization.tsx`, `ExternalConnectors.tsx`, `WebhookManagement.tsx`

**User Manual** — Dokumentasi in-app
- `UserManual.tsx`, `ManualAdmin.tsx`, `FAQPage.tsx`

**Landing & Public**
- `LandingPage.tsx`, `SystemOverview.tsx`, `SystemOverviewEnhanced.tsx`

**Auth**
- `Login.tsx`, `Register.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`, `OAuthCallback.tsx`, `CompleteProfile.tsx`

**Profile**
- `UserProfile.tsx`

**Pre-Shift Checklist / K3**
**Backend:** `pre_shift_checklist.py`  
**Routes:** `pre_shift_checklist.py`
- `PreShiftChecklist.tsx`, `PreShiftChecklistForm.tsx`, `PreShiftChecklistView.tsx`, `PreShiftChecklistWeekly.tsx`

**Materials (Standalone)**
- `MaterialsDashboard.tsx`, `MaterialsList.tsx`

---

## STRUKTUR DATABASE

### Ringkasan Tabel per Modul

| Modul | Jumlah Tabel | Model File |
|-------|:------------:|------------|
| Production | ~35 | `production.py`, `oee.py`, `converting.py`, `custom_bom.py`, `work_order_bom.py` |
| DCC & CAPA | 13 | `dcc.py` |
| Document Management | 6 | `document_management.py` |
| Quality | ~15 | `quality.py`, `quality_enhanced.py` |
| Warehouse | ~20 | `warehouse.py`, `warehouse_enhanced.py`, `warehouse_adjustment.py`, `stock_opname.py` |
| Sales | ~5 | `sales.py` |
| Purchasing | ~5 | `purchasing.py` |
| Shipping | ~5 | `shipping.py`, `shipping_updated.py` |
| Returns | ~5 | `returns.py` |
| Finance | ~10 | `finance.py`, `wip_accounting.py`, `wip_job_costing.py` |
| HR | ~30 | `hr.py`, `hr_extended.py` |
| R&D | ~15 | `rd.py`, `rnd.py` |
| Products | ~10 | `product.py`, `product_new_schema.py`, `uom.py`, `bom_history.py` |
| Maintenance | ~5 | `maintenance.py` |
| Waste | ~5 | `waste.py` |
| Pre-Shift Checklist | 6 | `pre_shift_checklist.py` |
| Group Chat | 11 | `group_chat.py` |
| Notification | ~3 | `notification.py` |
| Settings | ~10 | `settings.py`, `settings_extended.py` |
| Approval & Workflow | ~5 | `approval_workflow.py`, `workflow_integration.py` |
| Integration | ~6 | `integration.py`, `integration_extended.py` |
| User & Auth | ~5 | `user.py` |
| **TOTAL** | **~269** | **48 model files** |

### DCC Module Tables (13 tabel)

```
dcc_documents                       # Daftar Induk Dokumen (FRM-DCC-02)
dcc_document_revisions              # Riwayat Revisi & File Repository
dcc_document_distributions          # Distribusi & Serah Terima (FRM-DCC-01/04)
dcc_document_reviews                # Kaji Ulang Dokumen (FRM-DCC-10)
dcc_change_notices                  # Permohonan Perubahan (FRM-DCC-05)
dcc_quality_records                 # Rekaman Mutu (FRM-DCC-03)
dcc_capa_requests                   # CPAR/SCAR/CCHF (FRM-DCC-08/11)
dcc_capa_investigations             # Investigasi & RCA
dcc_capa_verifications              # Verifikasi Efektivitas
dcc_capa_monthly_reports            # Laporan Bulanan CPAR (FRM-DCC-09)
dcc_internal_memos                  # Memo Internal (FRM-DCC-07)
dcc_internal_memo_distributions     # Read Receipts
dcc_destruction_logs                # Berita Acara Pemusnahan (FRM-DCC-14)
```

### Relasi Antar Tabel (Core)

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

## WORKFLOW BISNIS

### Sales to Production Flow

```
Sales Order (Confirmed)
  ↓
MRP Check → Shortage? → Yes: Create PO → Receive Material
  ↓ (No shortage)
Create Work Order → Production Start
  ↓
QC Check → Pass → Finish Goods → Shipping → Invoice
         → Fail → Rework / Reject
```

### Production to Finance Flow

```
WO Started → Create WIP Ledger
  ↓
Accumulate Costs (Material + Labor + Overhead)
  ↓
WO Complete → COGM Entry (WIP → FG)
  ↓
Auto GL Posting → Product Sold → COGS Entry (FG → COGS)
```

### DCC Document Control Flow (QP-DCC-01)

```
Originator (Buat Dokumen + Nomor)
  ↓
Reviewer (Pengkaji — TTD Digital)
  ↓
Approver (Pengesah — TTD Digital)
  ↓
DCC Terima → Update Daftar Induk (FRM-DCC-02)
  ↓
DCC Distribusi (FRM-DCC-04) + Stamp "CONTROLLED COPY"
  ↓
Penerima TTD FRM-DCC-01 + Kembalikan Revisi Lama
```

### CAPA Flow (QP-DCC-03 + WI-DCC-02)

```
Inisiator (Ajukan CPAR/SCAR)
  ↓
DCC Beri Nomor (Auto: CP/BB/CC/DD-nnn atau SC/BB/CC/nnn)
  ↓
Approval (CPAR: Management Rep | SCAR: QA Manager)
  ↓
Dept/Supplier Investigasi (RCA 5-Why + Tindakan Korektif/Preventif)
  ↓
Verifikasi Efektivitas
  ↓
Efektif → Close | Tidak Efektif → CAPA Baru

Monthly: DCC auto-generate FRM-DCC-09 (Laporan Bulanan)
```

### Pemusnahan Dokumen (WI-DCC-01)

```
Identifikasi (masa retensi habis / obsolete)
  ↓
Verifikasi & Persetujuan (FRM-DCC-14)
  ↓
Fisik: Shredder / Bakar  |  Digital: Log + Hapus/Arsip
  ↓
Isi Berita Acara → Simpan bukti oleh DCC
```

---

## 📊 RANGKUMAN

| Metrik | Jumlah |
|--------|-------:|
| Total File | **811** |
| Total Baris Kode | **304,002** |
| Backend Python Files | 339 |
| Backend Python Lines | 97,428 |
| Frontend TSX/TS/CSS Files | 428 |
| Frontend TSX/TS/CSS Lines | 180,231 |
| Database Tables | 269 |
| Modul Utama | 18 |
| Sub-Modul | 100+ |
| Frontend Page Components | 397 |

---

*Dokumentasi ini di-update pada 13 Maret 2026*
