# 🔄 Dokumentasi Workflow Bisnis Lengkap

## Sistem ERP PT. Gratia Makmur Sentosa

Dokumentasi lengkap semua workflow dan proses bisnis dalam sistem ERP.

---

## 📋 Daftar Isi

1. [Workflow Sales ke Produksi](#workflow-sales-ke-produksi)
2. [Workflow Produksi ke Finance](#workflow-produksi-ke-finance)
3. [Workflow Purchasing](#workflow-purchasing)
4. [Workflow Quality Control](#workflow-quality-control)
5. [Workflow Customer Return](#workflow-customer-return)
6. [Workflow Maintenance](#workflow-maintenance)

---

## WORKFLOW SALES KE PRODUKSI

### Flow Lengkap: Customer → Sales → MRP → Produksi → Quality → Shipping

```
Customer Inquiry
    ↓
Buat Quotation
    ↓
Sales Order Confirmed
    ↓
AUTO: Trigger Analisa MRP
    ↓
Material Tersedia? → YA: Buat Work Order
                  → TIDAK: Buat Purchase Order
    ↓
Eksekusi Produksi (Per Shift)
    ↓
AUTO: Trigger Quality Inspection
    ↓
Quality Pass? → YA: Pindah ke Warehouse
             → TIDAK: Rework/Scrap
    ↓
Shipping & Delivery
    ↓
Invoice & Payment
    ↓
AUTO: GL Posting & COGS
```

### Point Otomasi Utama:
- ✅ Sales Order → Auto Analisa MRP
- ✅ MRP → Auto Work Order/Purchase Order
- ✅ Produksi Selesai → Auto Quality Inspection
- ✅ Quality Pass → Auto Warehouse Receipt
- ✅ Delivery → Auto Buat Invoice
- ✅ Semua transaksi → Auto GL Posting

---

## WORKFLOW PRODUKSI KE FINANCE

### Flow WIP Accounting

```
Produksi Start
    ↓
Buat WIP Ledger (Standard Cost dari BOM)
    ↓
Akumulasi Cost:
- Material Issue → WIP Transaction → Auto GL Post
- Labor Hours → WIP Transaction → Auto GL Post
- Overhead Allocation → WIP Transaction → Auto GL Post
    ↓
Produksi Selesai
    ↓
Analisa Variance:
- Material Variance
- Labor Variance
- Overhead Variance
- Yield Variance
    ↓
COGM Transfer (WIP → Finished Goods) → Auto GL Post
    ↓
Produk Terjual
    ↓
COGS Posting (FG → COGS) → Auto GL Post
    ↓
Kalkulasi Gross Profit
```

### Contoh GL Posting:

**Material Issue:**
```
Dr. WIP Inventory - Material
    Cr. Raw Material Inventory
```

**COGM Transfer:**
```
Dr. Finished Goods Inventory
    Cr. WIP Inventory
```

**COGS Posting:**
```
Dr. Cost of Goods Sold
    Cr. Finished Goods Inventory
```

---

## WORKFLOW PURCHASING

```
Purchase Requisition (Manual atau Auto dari MRP)
    ↓
Approval Department
    ↓
Seleksi Supplier (Proses RFQ)
    ↓
Buat Purchase Order
    ↓
Workflow Approval PO
    ↓
Kirim PO ke Supplier
    ↓
Goods Receipt di Warehouse
    ↓
Quality Inspection
    ↓
Pass? → YA: Terima & Update Inventory
     → TIDAK: Reject & Return ke Supplier
    ↓
Proses Invoice (3-Way Matching)
    ↓
Proses Payment
    ↓
Auto GL Posting
```

---

## WORKFLOW QUALITY CONTROL

### Inspeksi 3 Tahap

**1. Incoming Inspection (Penerimaan Material)**
```
Material Diterima → Auto Buat QC Inspection
    ↓
Inspector Lakukan Inspeksi
    ↓
Pass? → YA: Terima Material
     → TIDAK: Reject & Return ke Supplier
```

**2. In-Process Inspection (Selama Produksi)**
```
Produksi Berjalan
    ↓
Point Inspeksi Terjadwal (Per Jam/Per Shift)
    ↓
Sesuai Spec? → YA: Lanjut Produksi
            → TIDAK: Stop & Adjust Proses
```

**3. Final Inspection (Produksi Selesai)**
```
Produksi Selesai → Auto Final QC
    ↓
Inspeksi Komprehensif
    ↓
Pass? → YA: Release ke Warehouse
     → TIDAK: Rework atau Scrap
```

### Workflow CAPA

```
Defect Teridentifikasi
    ↓
Root Cause Analysis
    ↓
Action Plan Corrective
    ↓
Action Plan Preventive
    ↓
Implementasi Actions
    ↓
Verifikasi Efektivitas
    ↓
Close CAPA
```

---

## WORKFLOW CUSTOMER RETURN

```
Request Return Customer
    ↓
Review Sales Team
    ↓
Approved? → YA: Issue RMA
         → TIDAK: Reject & Jelaskan
    ↓
Customer Kirim Produk Kembali
    ↓
Warehouse Terima & Segregasi
    ↓
Quality Inspection
    ↓
Keputusan Disposisi:
- Kesalahan Customer → Tidak Ada Refund/Biaya Repair
- Kesalahan Perusahaan → Full Refund/Replacement
    ↓
Proses Resolusi
    ↓
Jika Defect Manufaktur → Buat CAPA
    ↓
Close Case Return
```

---

## WORKFLOW MAINTENANCE

### Preventive Maintenance

```
Buat Schedule PM (Berbasis Waktu/Usage)
    ↓
Sistem Auto-generate PM Work Order (7 hari sebelumnya)
    ↓
Cek Availability Spare Parts
    ↓
Assign Technician
    ↓
Technician Lakukan PM
    ↓
Record Hasil & Update History Equipment
    ↓
Close PM Work Order
```

### Corrective Maintenance

```
Breakdown Mesin Dilaporkan
    ↓
Buat Breakdown Work Order
    ↓
Assign Technician (Berbasis Prioritas)
    ↓
Diagnosa Problem
    ↓
Request Spare Parts (jika perlu)
    ↓
Lakukan Repair
    ↓
Test Equipment
    ↓
Record Downtime & Cost
    ↓
Root Cause Analysis
    ↓
Update History Equipment
    ↓
Close Work Order
```

---

## WORKFLOW INPUT PRODUKSI PER SHIFT

### Recording Produksi Harian

```
Shift Start
    ↓
Operator Terima Work Order
    ↓
Setup Mesin
    ↓
Start Produksi
    ↓
Selama Shift - Record:
- Target Quantity
- Actual Quantity Produced
- Good Quantity
- Reject Quantity
- Rework Quantity
- Runtime Minutes
- Downtime Minutes (dengan alasan)
    ↓
Shift End
    ↓
Supervisor Review & Approve
    ↓
Sistem Auto-kalkulasi:
- OEE (Availability × Performance × Quality)
- Quality Rate
- Efficiency Rate
    ↓
Produksi Selesai
    ↓
AUTO: Trigger Quality Inspection
    ↓
AUTO: Update WIP Cost
```

---

## WORKFLOW HR PAYROLL

```
Mulai Siklus Payroll Bulanan
    ↓
Kumpulkan Data Absensi
    ↓
Kalkulasi:
- Gaji Pokok
- Tunjangan
- Overtime Pay
- Potongan (Pajak, BPJS)
    ↓
Review & Approval Payroll
    ↓
Generate Payslip
    ↓
Generate File Bank Transfer
    ↓
Proses Payment
    ↓
Auto GL Posting:
Dr. Salary Expense
Dr. Tax Payable
Dr. BPJS Payable
    Cr. Cash/Bank
    ↓
Distribusi Payslip ke Karyawan
```

---

## WORKFLOW MANAJEMEN INVENTORY

### Tipe Stock Movement

**1. Goods Receipt (dari Purchasing)**
```
PO → GRN → Quality Inspection → Warehouse Receipt → Update Inventory
```

**2. Material Issue (ke Produksi)**
```
Work Order → Material Requisition → Pick dari Warehouse → Issue ke Produksi → Update Inventory
```

**3. Stock Transfer (antar Lokasi)**
```
Transfer Request → Approval → Pick dari Source → Pindah ke Destination → Update Inventory
```

**4. Stock Adjustment**
```
Physical Count → Variance Teridentifikasi → Investigasi → Approval Adjustment → Update Inventory → GL Posting
```

---

## WORKFLOW MRP

```
Sales Order Confirmed
    ↓
AUTO: Trigger Analisa MRP
    ↓
Kalkulasi Kebutuhan Material (BOM Explosion)
    ↓
Cek Inventory Sekarang
    ↓
Kalkulasi Net Requirements
    ↓
Pertimbangkan Lead Time
    ↓
Kekurangan Material? → YA: Buat Purchase Requisition
                     → TIDAK: Buat Work Order
    ↓
Cek Kapasitas
    ↓
Generate Schedule Produksi
    ↓
Reservasi Material
    ↓
Release Work Order ke Produksi
```

---

## WORKFLOW MANAJEMEN BUDGET

```
Planning Budget Tahunan
    ↓
Department Head Submit Budget Request
    ↓
Finance Team Konsolidasi
    ↓
Review & Approval Management
    ↓
Alokasi Budget
    ↓
Monitoring Bulanan:
- Actual vs Budget
- Analisa Variance
- Alert untuk Over-budget
    ↓
Review & Adjustment Kuartalan
    ↓
Closing & Analisa Akhir Tahun
```

---

## POINT INTEGRASI UTAMA

### Trigger Otomatis:
1. **Sales Order Confirmed** → Analisa MRP
2. **MRP Shortage** → Purchase Requisition
3. **MRP Available** → Work Order
4. **Produksi Selesai** → Quality Inspection
5. **Quality Pass** → Warehouse Receipt
6. **Delivery Selesai** → Buat Invoice
7. **Semua Transaksi** → GL Posting
8. **Produksi** → Akumulasi WIP Cost
9. **Produksi Selesai** → COGM Transfer
10. **Produk Terjual** → COGS Posting

### Point Approval Manual:
1. Konfirmasi Sales Order
2. Approval Purchase Order
3. Approval Budget
4. Hasil Quality Inspection
5. CAPA Actions
6. Proses Payroll
7. Stock Adjustment

---

## REPORTING & ANALYTICS

### Dashboard Real-time:
- Executive Dashboard (KPI)
- Production Dashboard (OEE, Output)
- Quality Dashboard (Pass Rate, Defect)
- Finance Dashboard (P&L, Cash Flow)
- Inventory Dashboard (Stock Level, Movement)

### Report Standard:
- Report Sales
- Report Produksi
- Report Quality
- Report Keuangan
- Report HR
- Report Inventory

### Analytics:
- Analisa Trend
- Analisa Variance
- Metrik Performance
- Predictive Analytics
- Business Intelligence

---

**Total Workflow: 15+ proses bisnis terintegrasi**
**Level Otomasi: 80%+ task rutin terotomasi**
**Point Integrasi: 50+ trigger otomatis dan data flow**
