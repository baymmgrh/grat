# 📖 PANDUAN PENGGUNA SISTEM ERP
## PT. GRATIA MAKMUR SENTOSA

---

## 📋 DAFTAR ISI

1. [Memulai Aplikasi](#1-memulai-aplikasi)
2. [Modul Produksi](#2-modul-produksi)
3. [Modul Warehouse](#3-modul-warehouse)
4. [Modul Sales](#4-modul-sales)
5. [Modul Purchasing](#5-modul-purchasing)
6. [Modul Finance](#6-modul-finance)
7. [Modul HR](#7-modul-hr)
8. [Modul Quality](#8-modul-quality)
9. [Reports & Analytics](#9-reports--analytics)
10. [Tips & Tricks](#10-tips--tricks)

---

## 1. MEMULAI APLIKASI

### 1.1 Login

1. Buka browser dan akses URL aplikasi
2. Masukkan **Username** dan **Password**
3. Klik tombol **Login**
4. Jika berhasil, akan diarahkan ke Dashboard

### 1.2 Dashboard

Dashboard menampilkan:
- **KPI Summary** - Ringkasan performa bisnis
- **Quick Actions** - Akses cepat ke fitur utama
- **Notifications** - Pemberitahuan penting
- **Recent Activities** - Aktivitas terbaru

### 1.3 Navigasi

- **Sidebar** - Menu utama di sebelah kiri
- **Header** - Search, notifications, profile
- **Breadcrumb** - Lokasi halaman saat ini

---

## 2. MODUL PRODUKSI

### 2.1 Work Order

#### Membuat Work Order Baru

1. Buka **Production → Work Orders**
2. Klik **+ New Work Order**
3. Isi form:
   - **WO Number** - Auto-generated atau manual
   - **Product** - Pilih produk
   - **Machine** - Pilih mesin
   - **Quantity** - Target quantity
   - **Start Date** - Tanggal mulai
   - **Priority** - Low/Medium/High/Urgent
4. Klik **Save**

#### Status Work Order

| Status | Deskripsi | Aksi Selanjutnya |
|--------|-----------|------------------|
| Draft | Baru dibuat | Confirm |
| Confirmed | Dikonfirmasi | Start Production |
| In Progress | Sedang berjalan | Input Production / Complete |
| Completed | Selesai | - |
| Cancelled | Dibatalkan | - |

### 2.2 Input Produksi

#### Langkah Input Produksi Harian

1. Buka **Production → Work Orders**
2. Pilih Work Order yang **In Progress**
3. Klik **Input Produksi**
4. Isi data:

**Data Utama:**
| Field | Deskripsi |
|-------|-----------|
| Tanggal Produksi | Tanggal input |
| Shift | 1 (06:30-15:00), 2 (15:00-23:00), 3 (23:00-06:30) |
| Produk | Default dari WO, bisa diganti untuk multi-product |
| Average Time | Planned runtime dalam menit |

**Data Produksi:**
| Field | Deskripsi |
|-------|-----------|
| Grade A (Good) | Quantity bagus |
| Grade B (Rework) | Quantity perlu rework |
| Grade C (Reject) | Quantity reject |
| Setting Sticker | Loss setting sticker |
| Setting Packaging | Loss setting packaging |

**Downtime:**
- Klik **+ Add Downtime**
- Isi: Reason, Category, Duration, Frequency
- Category: Mesin, Operator, Material, Design, Others, Idle

5. Klik **Simpan**

#### Multi-Product per Shift

Jika dalam 1 shift memproduksi lebih dari 1 produk:

1. Input produksi untuk produk pertama (Shift 1a)
2. Setelah selesai, input lagi untuk produk kedua (Shift 1b)
3. Pilih produk yang berbeda
4. Isi Average Time sesuai durasi produksi produk tersebut

**Contoh:**
- Shift 1 total 510 menit
- Produk A: 150 menit (06:30-09:00) → Shift 1a
- Produk B: 360 menit (09:00-15:00) → Shift 1b

### 2.3 Daily Controller

#### Melihat OEE Harian

1. Buka **Production → Daily Controller**
2. Pilih tanggal
3. Lihat data per mesin:
   - **OEE Score** - Overall Equipment Effectiveness
   - **Availability** - Ketersediaan mesin
   - **Performance** - Performa produksi
   - **Quality** - Kualitas output

#### Memahami OEE

```
OEE = Availability × Performance × Quality

Availability = (Planned Runtime - Downtime) / Planned Runtime
Performance = Actual Output / (Runtime × Speed)
Quality = Good Quantity / Total Quantity
```

**Target OEE:**
- World Class: > 85%
- Good: 70-85%
- Average: 50-70%
- Poor: < 50%

### 2.4 Schedule Grid

1. Buka **Production → Schedule Grid**
2. Pilih minggu/bulan
3. Drag & drop Work Order ke slot mesin
4. Atur jadwal produksi

---

## 3. MODUL WAREHOUSE

### 3.1 Inventory

#### Melihat Stock

1. Buka **Warehouse → Inventory**
2. Gunakan filter untuk mencari produk
3. Lihat:
   - Quantity on hand
   - Reserved quantity
   - Available quantity

#### Stock Adjustment

1. Buka **Warehouse → Stock Adjustment**
2. Klik **+ New Adjustment**
3. Pilih produk dan warehouse
4. Masukkan quantity adjustment (+/-)
5. Isi alasan adjustment
6. Submit untuk approval

### 3.2 WIP Stock

#### Melihat WIP Stock

1. Buka **Warehouse → WIP Stock**
2. Lihat stock Work In Progress per produk
3. Klik produk untuk melihat movement history

#### WIP Adjustment

1. Klik **Adjustment** pada produk
2. Masukkan quantity adjustment
3. Isi alasan
4. Submit

### 3.3 Packing List

#### Membuat Packing List

1. Buka **Production → Packing List**
2. Klik **+ New Packing List**
3. Pilih produk dari WIP Stock
4. Isi:
   - Jumlah karton
   - Nomor karton awal
   - Pack per karton (auto dari master)
5. Klik **Create**

#### Penimbangan Karton

1. Buka Packing List yang sudah dibuat
2. Klik **Weighing**
3. Input berat per karton
4. Setelah semua karton ditimbang, status berubah ke **Completed**

### 3.4 Material Issue

#### Issue Material ke Produksi

1. Buka **Warehouse → Material Issue**
2. Klik **+ New Issue**
3. Pilih Work Order
4. Pilih material dan quantity
5. Submit
6. Stock akan otomatis berkurang

---

## 4. MODUL SALES

### 4.1 Customer

#### Menambah Customer

1. Buka **Sales → Customers**
2. Klik **+ New Customer**
3. Isi data customer
4. Klik **Save**

### 4.2 Sales Order

#### Membuat Sales Order

1. Buka **Sales → Orders**
2. Klik **+ New Order**
3. Pilih Customer
4. Tambah item produk:
   - Pilih produk
   - Masukkan quantity
   - Set harga (default dari master)
5. Set delivery date
6. Klik **Save** (status: Draft)
7. Klik **Confirm** untuk proses

#### Workflow Sales Order

```
Draft → Confirmed → Processing → Shipped → Invoiced → Paid
```

### 4.3 Quotation

1. Buka **Sales → Quotations**
2. Buat quotation untuk customer
3. Jika disetujui, convert ke Sales Order

---

## 5. MODUL PURCHASING

### 5.1 Supplier

1. Buka **Purchasing → Suppliers**
2. Kelola data supplier

### 5.2 Purchase Order

#### Membuat PO

1. Buka **Purchasing → Purchase Orders**
2. Klik **+ New PO**
3. Pilih Supplier
4. Tambah item material
5. Set expected delivery date
6. Submit untuk approval

#### Workflow PO

```
Draft → Approved → Ordered → Received → Invoiced → Paid
```

### 5.3 Goods Receipt Note (GRN)

1. Buka **Purchasing → GRN**
2. Pilih PO yang akan diterima
3. Input quantity received
4. Submit
5. Stock otomatis bertambah

---

## 6. MODUL FINANCE

### 6.1 Chart of Accounts

1. Buka **Finance → Accounts**
2. Kelola struktur akun:
   - Asset
   - Liability
   - Equity
   - Revenue
   - Expense

### 6.2 Journal Entry

#### Membuat Journal Entry

1. Buka **Finance → Journals**
2. Klik **+ New Entry**
3. Isi tanggal dan deskripsi
4. Tambah lines:
   - Pilih akun
   - Masukkan debit/credit
5. Pastikan balance (Debit = Credit)
6. Save sebagai Draft
7. Post untuk finalisasi

### 6.3 WIP Accounting

1. Buka **Finance → WIP Accounting**
2. Lihat WIP Ledger per Work Order
3. Track cost:
   - Material Cost
   - Labor Cost
   - Overhead Cost
4. Lihat COGM saat WO complete

### 6.4 Job Costing

1. Buka **Finance → Job Costing**
2. Pilih Work Order
3. Lihat breakdown cost
4. Analisa variance

---

## 7. MODUL HR

### 7.1 Employee

1. Buka **HR → Employees**
2. Kelola data karyawan
3. Lihat detail: profile, attendance, payroll

### 7.2 Attendance

#### Input Attendance

1. Buka **HR → Attendance**
2. Pilih tanggal
3. Input clock in/out per karyawan
4. Atau gunakan QR Code attendance

#### Public Attendance

1. Akses URL public attendance
2. Scan QR Code karyawan
3. Otomatis tercatat

### 7.3 Work Roster

#### Membuat Roster

1. Buka **HR → Work Roster**
2. Pilih minggu
3. Drag & drop karyawan ke slot mesin/shift
4. Save roster

### 7.4 Payroll

1. Buka **HR → Payroll**
2. Pilih periode
3. Generate payroll
4. Review dan approve
5. Print slip gaji

---

## 8. MODUL QUALITY

### 8.1 Quality Inspection

#### Incoming Inspection

1. Buka **Quality → Incoming**
2. Pilih GRN untuk inspeksi
3. Input hasil inspeksi
4. Pass/Fail

#### In-Process Inspection

1. Buka **Quality → In-Process**
2. Pilih Work Order
3. Input hasil inspeksi

#### Final Inspection

1. Buka **Quality → Final**
2. Inspeksi finish good
3. Pass → Ready to ship
4. Fail → Rework/Disposal

### 8.2 Quality Objectives

1. Buka **OEE → Quality Objectives**
2. Set target bulanan per mesin
3. Track achievement
4. Analisa Top 3 Downtime
5. Input Root Cause Analysis

---

## 9. REPORTS & ANALYTICS

### 9.1 Production Reports

- Daily Production Report
- Weekly Production Summary
- OEE Report
- Downtime Analysis

### 9.2 Sales Reports

- Sales by Customer
- Sales by Product
- Sales Trend

### 9.3 Finance Reports

- Profit & Loss
- Balance Sheet
- Cash Flow
- Cost Analysis

### 9.4 Export Options

- **PDF** - Untuk print
- **Excel** - Untuk analisa lanjutan

---

## 10. TIPS & TRICKS

### 10.1 Keyboard Shortcuts

| Shortcut | Fungsi |
|----------|--------|
| Ctrl + S | Save |
| Ctrl + N | New |
| Ctrl + F | Search |
| Esc | Close modal |

### 10.2 Best Practices

1. **Input produksi setiap hari** - Jangan menumpuk
2. **Isi downtime dengan detail** - Untuk analisa
3. **Review OEE mingguan** - Identifikasi masalah
4. **Backup data rutin** - Hindari kehilangan data

### 10.3 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Tidak bisa login | Cek username/password, hubungi admin |
| Data tidak muncul | Refresh halaman, clear cache |
| Error saat save | Cek koneksi internet, coba lagi |
| Laporan tidak akurat | Pastikan semua data sudah diinput |

### 10.4 Kontak Support

- **Email:** support@company.com
- **Phone:** (021) xxx-xxxx
- **Internal:** Hubungi IT Department

---

*Panduan Pengguna - Versi 2.0 - 3 Februari 2026*
