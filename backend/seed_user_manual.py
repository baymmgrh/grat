"""
Script to seed User Manual with complete documentation
Run: python seed_user_manual.py
"""
import sqlite3
import os
from datetime import datetime

def seed_manual():
    db_path = os.path.join(os.path.dirname(__file__), 'instance', 'erp_database.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Clear existing data
    cursor.execute("DELETE FROM manual_faqs")
    cursor.execute("DELETE FROM manual_articles")
    cursor.execute("DELETE FROM manual_categories")
    
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # ==================== CATEGORIES ====================
    categories = [
        (1, 'Memulai', 'getting-started', 'Panduan dasar untuk memulai menggunakan sistem ERP', 'BookOpenIcon', 1),
        (2, 'Inventory & Gudang', 'inventory', 'Manajemen stok, material, dan gudang', 'ArchiveBoxIcon', 2),
        (3, 'Produksi', 'production', 'Work Order, BOM, dan jadwal produksi', 'CogIcon', 3),
        (4, 'Penjualan', 'sales', 'Sales Order, pelanggan, dan invoice', 'ShoppingCartIcon', 4),
        (5, 'Pembelian', 'purchasing', 'Purchase Order, supplier, dan penerimaan barang', 'TruckIcon', 5),
        (6, 'Keuangan', 'finance', 'Akuntansi, laporan keuangan, dan pembayaran', 'CurrencyDollarIcon', 6),
        (7, 'HRM', 'hrm', 'Manajemen karyawan, absensi, dan penggajian', 'UsersIcon', 7),
        (8, 'Laporan', 'reports', 'Dashboard dan laporan analitik', 'ChartBarIcon', 8),
        (9, 'Pengaturan', 'settings', 'Konfigurasi sistem dan pengguna', 'WrenchScrewdriverIcon', 9),
    ]
    
    for cat in categories:
        cursor.execute("""
            INSERT INTO manual_categories (id, name, slug, description, icon, "order", is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
        """, (cat[0], cat[1], cat[2], cat[3], cat[4], cat[5], now, now))
    
    # ==================== ARTICLES ====================
    articles = [
        # Getting Started
        (1, 1, 'Pengenalan Sistem ERP', 'pengenalan-sistem-erp', 
         'Pengenalan dasar tentang sistem ERP PT. Gratia Makmur Sentosa',
         '''# Pengenalan Sistem ERP

## Apa itu ERP?

**Enterprise Resource Planning (ERP)** adalah sistem informasi terintegrasi yang menghubungkan semua departemen dan fungsi dalam perusahaan ke dalam satu sistem komputer tunggal yang dapat melayani kebutuhan khusus dari masing-masing departemen.

## Modul-Modul ERP

Sistem ERP PT. Gratia Makmur Sentosa terdiri dari beberapa modul utama:

### 1. Inventory Management
- Manajemen stok material dan produk
- Tracking lokasi gudang
- Stock opname dan adjustment
- Minimum stock alert

### 2. Production Management
- Bill of Materials (BOM)
- Work Order
- Production Schedule
- Quality Control

### 3. Sales Management
- Customer Management
- Sales Order
- Invoice & Delivery
- Sales Report

### 4. Purchasing Management
- Supplier Management
- Purchase Request
- Purchase Order
- Goods Receipt

### 5. Finance & Accounting
- Chart of Accounts
- Journal Entry
- Account Payable/Receivable
- Financial Reports

### 6. Human Resource Management
- Employee Database
- Attendance & Leave
- Payroll
- Performance Review

## Keuntungan Menggunakan ERP

1. **Integrasi Data** - Semua data tersimpan dalam satu database terpusat
2. **Real-time Information** - Informasi selalu up-to-date
3. **Efisiensi Operasional** - Mengurangi pekerjaan manual dan duplikasi
4. **Pengambilan Keputusan** - Data akurat untuk analisis bisnis
5. **Traceability** - Pelacakan lengkap dari pembelian hingga penjualan

## Struktur Menu

```
📁 Dashboard
📁 Inventory
   ├── Materials
   ├── Products
   ├── Warehouses
   └── Stock Movements
📁 Production
   ├── BOM
   ├── Work Orders
   ├── Production Schedule
   └── Quality Control
📁 Sales
   ├── Customers
   ├── Sales Orders
   └── Invoices
📁 Purchasing
   ├── Suppliers
   ├── Purchase Orders
   └── Goods Receipt
📁 Finance
   ├── Chart of Accounts
   ├── Journal Entries
   └── Reports
📁 HRM
   ├── Employees
   ├── Attendance
   └── Payroll
📁 Reports
📁 Settings
```
''', 1),

        (2, 1, 'Login dan Navigasi', 'login-dan-navigasi',
         'Cara login ke sistem dan navigasi menu',
         '''# Login dan Navigasi

## Login ke Sistem

### Langkah-langkah Login

1. Buka browser (Chrome/Firefox/Edge)
2. Akses URL sistem ERP: `http://erp.gratiams.com`
3. Masukkan **Username** dan **Password**
4. Klik tombol **Login**

### Troubleshooting Login

| Masalah | Solusi |
|---------|--------|
| Lupa password | Hubungi Admin IT untuk reset password |
| Akun terkunci | Tunggu 15 menit atau hubungi Admin |
| Halaman tidak muncul | Periksa koneksi internet |

## Navigasi Menu

### Sidebar Menu

Menu utama terletak di sisi kiri layar (sidebar). Klik pada menu untuk membuka submenu.

### Header

Di bagian atas terdapat:
- **Search Bar** - Pencarian cepat
- **Notifications** - Notifikasi sistem
- **Profile** - Menu profil pengguna

### Breadcrumb

Menunjukkan lokasi halaman saat ini. Klik untuk navigasi ke halaman sebelumnya.

```
Dashboard > Inventory > Materials > Detail
```

## Shortcut Keyboard

| Shortcut | Fungsi |
|----------|--------|
| `Ctrl + K` | Buka pencarian cepat |
| `Ctrl + N` | Buat data baru |
| `Ctrl + S` | Simpan data |
| `Esc` | Tutup modal/popup |

## Logout

1. Klik ikon profil di pojok kanan atas
2. Pilih **Logout**
3. Konfirmasi logout

> ⚠️ **Penting**: Selalu logout setelah selesai menggunakan sistem, terutama di komputer bersama.
''', 2),

        (3, 1, 'Pengaturan Profil', 'pengaturan-profil',
         'Cara mengatur profil dan preferensi pengguna',
         '''# Pengaturan Profil

## Mengakses Profil

1. Klik ikon profil di pojok kanan atas
2. Pilih **Profile Settings**

## Informasi Profil

### Data yang dapat diubah:
- **Nama Lengkap**
- **Email**
- **Nomor Telepon**
- **Foto Profil**

### Data yang tidak dapat diubah:
- Username
- Role/Jabatan
- Department

## Mengubah Password

1. Buka **Profile Settings**
2. Klik tab **Security**
3. Masukkan **Password Lama**
4. Masukkan **Password Baru** (minimal 8 karakter)
5. Konfirmasi **Password Baru**
6. Klik **Update Password**

### Syarat Password yang Kuat:
- Minimal 8 karakter
- Kombinasi huruf besar dan kecil
- Minimal 1 angka
- Minimal 1 karakter spesial (!@#$%^&*)

## Preferensi Tampilan

### Theme
- **Light Mode** - Tampilan terang
- **Dark Mode** - Tampilan gelap
- **System** - Mengikuti pengaturan sistem

### Bahasa
- Indonesia
- English

### Notifikasi
- Email notifications
- Browser notifications
- Sound alerts
''', 3),

        # Inventory
        (4, 2, 'Manajemen Material', 'manajemen-material',
         'Panduan lengkap mengelola data material',
         '''# Manajemen Material

## Pengertian Material

Material adalah bahan baku atau komponen yang digunakan dalam proses produksi.

## Jenis Material

| Jenis | Keterangan | Contoh |
|-------|------------|--------|
| Raw Material | Bahan baku utama | Nonwoven fabric, Chemical |
| Packaging | Material kemasan | Karton, Plastik, Label |
| Consumable | Bahan habis pakai | Lem, Tinta, Solvent |
| Spare Part | Suku cadang mesin | Bearing, Belt, Seal |

## Menambah Material Baru

1. Buka menu **Inventory > Materials**
2. Klik tombol **+ Add Material**
3. Isi form:
   - **Code** - Kode unik material (auto-generate atau manual)
   - **Name** - Nama material
   - **Category** - Kategori material
   - **UoM** - Unit of Measure (kg, pcs, roll, dll)
   - **Min Stock** - Stok minimum untuk alert
   - **Max Stock** - Stok maksimum
   - **Cost** - Harga per unit
4. Klik **Save**

## Mengubah Data Material

1. Cari material di daftar
2. Klik ikon **Edit** (pensil)
3. Ubah data yang diperlukan
4. Klik **Update**

## Menghapus Material

> ⚠️ Material yang sudah digunakan dalam transaksi tidak dapat dihapus

1. Cari material di daftar
2. Klik ikon **Delete** (tempat sampah)
3. Konfirmasi penghapusan

## Import Material

Untuk import data material secara massal:

1. Klik **Import**
2. Download template Excel
3. Isi data sesuai template
4. Upload file
5. Review dan konfirmasi

## Export Material

1. Klik **Export**
2. Pilih format (Excel/CSV)
3. File akan terdownload
''', 1),

        (5, 2, 'Manajemen Produk', 'manajemen-produk',
         'Panduan lengkap mengelola data produk jadi',
         '''# Manajemen Produk

## Pengertian Produk

Produk adalah barang jadi hasil produksi yang siap dijual.

## Kategori Produk

### Wet Wipes (Tisu Basah)
- Baby Wipes
- Facial Wipes
- Antibacterial Wipes
- Industrial Wipes

### Dry Wipes (Tisu Kering)
- Facial Tissue
- Kitchen Towel
- Toilet Paper

## Menambah Produk Baru

1. Buka menu **Inventory > Products**
2. Klik **+ Add Product**
3. Isi informasi produk:

### Tab General
- **Code** - Kode produk
- **Name** - Nama produk
- **Category** - Kategori
- **Brand** - Merek
- **UoM** - Satuan (pack, carton, dll)

### Tab Pricing
- **Cost** - Harga pokok produksi
- **Selling Price** - Harga jual

### Tab Inventory
- **Min Stock** - Stok minimum
- **Max Stock** - Stok maksimum
- **Reorder Point** - Titik pemesanan ulang

### Tab Specification
- **Weight** - Berat per unit
- **Dimensions** - Ukuran (P x L x T)
- **Shelf Life** - Masa simpan

4. Klik **Save**

## Bill of Materials (BOM)

Setiap produk harus memiliki BOM yang mendefinisikan:
- Material yang dibutuhkan
- Quantity per batch
- Proses produksi

Lihat: [Manajemen BOM](/app/manual/article/manajemen-bom)
''', 2),

        (6, 2, 'Stock Opname', 'stock-opname',
         'Panduan melakukan stock opname dan adjustment',
         '''# Stock Opname

## Pengertian

Stock Opname adalah proses penghitungan fisik stok untuk memastikan kesesuaian antara data sistem dengan kondisi aktual di gudang.

## Kapan Dilakukan?

- **Bulanan** - Untuk item fast-moving
- **Quarterly** - Untuk item medium-moving
- **Tahunan** - Untuk semua item (audit)
- **Ad-hoc** - Saat ada indikasi selisih

## Prosedur Stock Opname

### 1. Persiapan
1. Tentukan jadwal stock opname
2. Siapkan form penghitungan
3. Freeze transaksi (jika perlu)
4. Briefing tim penghitung

### 2. Penghitungan Fisik
1. Hitung stok per lokasi
2. Catat hasil di form
3. Double-check untuk item bernilai tinggi
4. Dokumentasi foto (jika perlu)

### 3. Input ke Sistem
1. Buka **Inventory > Stock Opname**
2. Klik **New Stock Opname**
3. Pilih **Warehouse** dan **Date**
4. Input hasil penghitungan:
   - Pilih item
   - Masukkan **Physical Count**
   - Sistem akan menghitung **Variance**
5. Klik **Submit**

### 4. Review & Approval
1. Supervisor review hasil
2. Investigasi selisih signifikan
3. Approval untuk adjustment

### 5. Adjustment
Setelah diapprove, sistem akan:
- Membuat **Stock Adjustment**
- Update stok di sistem
- Mencatat jurnal (jika terintegrasi finance)

## Laporan Stock Opname

| Laporan | Keterangan |
|---------|------------|
| Variance Report | Selisih per item |
| Adjustment History | Riwayat penyesuaian |
| Accuracy Rate | Tingkat akurasi stok |

## Tips Stock Opname

1. ✅ Lakukan di jam non-operasional
2. ✅ Gunakan barcode scanner untuk efisiensi
3. ✅ Pisahkan tim penghitung dan pencatat
4. ✅ Investigasi selisih > 5%
5. ❌ Jangan adjust tanpa investigasi
''', 3),

        # Production
        (7, 3, 'Manajemen BOM', 'manajemen-bom',
         'Panduan membuat dan mengelola Bill of Materials',
         '''# Manajemen Bill of Materials (BOM)

## Pengertian BOM

**Bill of Materials (BOM)** adalah daftar lengkap material dan komponen yang dibutuhkan untuk memproduksi satu unit produk.

## Struktur BOM

```
📦 Produk: WET WIPES 50S
├── 🧵 Nonwoven Fabric - 0.5 kg
├── 💧 Liquid Solution - 0.3 liter
├── 📦 Plastic Packaging - 1 pcs
├── 🏷️ Label - 1 pcs
└── 📦 Carton Box - 0.04 pcs (1/24)
```

## Membuat BOM Baru

1. Buka **Production > Bill of Materials**
2. Klik **+ Create BOM**
3. Isi header:
   - **BOM Number** - Auto-generate
   - **Product** - Pilih produk
   - **Version** - Versi BOM (1.0, 1.1, dst)
   - **Batch Size** - Ukuran batch standar
   - **Pack per Carton** - Jumlah pack per karton

4. Tambah BOM Items:
   - Klik **+ Add Item**
   - Pilih **Material**
   - Masukkan **Quantity** per batch
   - Set **Scrap %** (persentase waste)
   - Tandai **Critical** jika material kritis

5. Klik **Save**

## Contoh BOM

### WET WIPES BABY 50S (Batch: 1000 pack)

| No | Material | Qty | UoM | Scrap % | Critical |
|----|----------|-----|-----|---------|----------|
| 1 | Spunlace 40gsm | 500 | kg | 3% | ✅ |
| 2 | RO Water | 400 | liter | 1% | ✅ |
| 3 | Preservative | 2 | kg | 0% | ✅ |
| 4 | Fragrance | 1 | kg | 0% | ❌ |
| 5 | Plastic Lid | 1000 | pcs | 2% | ❌ |
| 6 | Label | 1000 | pcs | 2% | ❌ |
| 7 | Carton | 42 | pcs | 1% | ❌ |

## Versioning BOM

Saat ada perubahan formula:
1. Buka BOM yang ada
2. Klik **Create New Version**
3. Ubah material/quantity
4. Set tanggal efektif
5. BOM lama akan non-aktif otomatis

## BOM Costing

Sistem akan menghitung:
- **Material Cost** = Σ (Qty × Unit Cost × (1 + Scrap%))
- **Total BOM Cost** = Material Cost per batch
- **Unit Cost** = Total BOM Cost / Batch Size
''', 1),

        (8, 3, 'Work Order', 'work-order',
         'Panduan membuat dan mengelola Work Order produksi',
         '''# Work Order

## Pengertian

**Work Order (WO)** adalah perintah produksi yang berisi instruksi untuk memproduksi sejumlah produk tertentu.

## Status Work Order

| Status | Keterangan |
|--------|------------|
| 🔵 Planned | WO dibuat, belum direlease |
| 🟡 Released | WO siap diproduksi |
| 🟠 In Progress | Sedang dalam proses produksi |
| 🟢 Completed | Produksi selesai |
| ⚫ Cancelled | WO dibatalkan |

## Membuat Work Order

### Dari Sales Order
1. Buka Sales Order yang sudah approved
2. Klik **Generate Work Order**
3. Sistem akan membuat WO otomatis

### Manual
1. Buka **Production > Work Orders**
2. Klik **+ New Work Order**
3. Isi form:
   - **Product** - Pilih produk
   - **Quantity** - Jumlah yang akan diproduksi
   - **Required Date** - Tanggal dibutuhkan
   - **Priority** - Low/Normal/High/Urgent
   - **Machine** - Mesin yang digunakan
4. Klik **Save**

### Dari Production Schedule
1. Buka **Production > Schedule**
2. Klik ikon ⚡ pada jadwal
3. WO akan dibuat otomatis dengan data dari schedule

## Workflow Work Order

```
[Planned] → [Released] → [In Progress] → [Completed]
                ↓
           [Cancelled]
```

### 1. Release WO
- Klik **Release** untuk memulai
- Material akan di-reserve dari inventory

### 2. Start Production
- Klik **Start** saat produksi dimulai
- Catat waktu mulai aktual

### 3. Input Produksi
- Input hasil produksi per shift
- Catat quantity good dan scrap
- Input downtime jika ada

### 4. Complete WO
- Klik **Complete** saat selesai
- Produk jadi masuk inventory
- Material dikurangi dari stok

## Material Consumption

Saat WO completed:
- Material dikonsumsi sesuai BOM
- Jika ada variance, buat adjustment
- Jurnal inventory otomatis dibuat

## Laporan Work Order

| Laporan | Keterangan |
|---------|------------|
| WO Status | Status semua WO |
| Production Output | Output per periode |
| Efficiency Report | Efisiensi produksi |
| Scrap Report | Laporan waste/scrap |
''', 2),

        (9, 3, 'Production Schedule', 'production-schedule',
         'Panduan membuat jadwal produksi mingguan',
         '''# Production Schedule

## Pengertian

**Production Schedule** adalah rencana produksi yang menentukan produk apa yang akan diproduksi, kapan, dan di mesin mana.

## Tampilan Schedule

Schedule ditampilkan dalam format grid:
- **Baris**: Mesin dan Produk
- **Kolom**: Hari (Senin-Jumat) dan Shift (S1, S2)

## Membuat Jadwal Produksi

1. Buka **Production > Weekly Schedule**
2. Klik **+ Tambah Jadwal**
3. Isi form:
   - **Mesin** - Pilih mesin produksi
   - **Produk** - Pilih produk yang akan diproduksi
   - **Order CTN** - Jumlah karton yang dipesan
   - **Q/CTN** - Quantity per karton
   - **Spek Kain** - Spesifikasi kain (opsional)
   - **Warna** - Warna blok di schedule
4. Pilih **Hari dan Shift**:
   - Klik kotak shift untuk mengaktifkan
   - S1 = Shift 1 (Pagi)
   - S2 = Shift 2 (Siang/Malam)
5. Klik **Simpan**

## Generate Work Order

### Per Item
1. Klik ikon ⚡ di kolom Aksi
2. Konfirmasi pembuatan WO
3. WO akan dibuat dengan data lengkap

### Batch (Semua Hari Ini)
1. Klik tombol **Generate WO Hari Ini**
2. Semua jadwal untuk hari ini akan dibuatkan WO

## Navigasi Minggu

- Klik **◀** untuk minggu sebelumnya
- Klik **▶** untuk minggu berikutnya
- Klik **Hari Ini** untuk kembali ke minggu ini

## Status Jadwal

| Status | Warna | Keterangan |
|--------|-------|------------|
| Planned | Abu-abu | Belum ada WO |
| WO Created | Biru | WO sudah dibuat |
| In Progress | Kuning | Sedang produksi |
| Completed | Hijau | Selesai |

## Catatan Penting

Gunakan bagian **Catatan Penting** untuk:
- Informasi maintenance mesin
- Perubahan jadwal mendadak
- Instruksi khusus untuk tim produksi

## Tips Scheduling

1. ✅ Kelompokkan produk sejenis untuk efisiensi
2. ✅ Sisakan waktu untuk changeover mesin
3. ✅ Prioritaskan order dengan deadline dekat
4. ✅ Pertimbangkan ketersediaan material
5. ❌ Jangan overload mesin
''', 3),

        # Sales
        (10, 4, 'Manajemen Customer', 'manajemen-customer',
         'Panduan mengelola data pelanggan',
         '''# Manajemen Customer

## Pengertian

Customer adalah pelanggan atau pembeli produk perusahaan.

## Kategori Customer

| Kategori | Keterangan |
|----------|------------|
| Retail | Toko/minimarket |
| Distributor | Penyalur besar |
| Modern Trade | Supermarket chain |
| Export | Pelanggan luar negeri |
| Industrial | Pelanggan industri |

## Menambah Customer Baru

1. Buka **Sales > Customers**
2. Klik **+ Add Customer**
3. Isi data:

### Informasi Umum
- **Code** - Kode customer
- **Name** - Nama perusahaan
- **Category** - Kategori customer
- **Tax ID (NPWP)** - Nomor NPWP

### Kontak
- **Contact Person** - Nama PIC
- **Phone** - Nomor telepon
- **Email** - Alamat email
- **Website** - Website (opsional)

### Alamat
- **Address** - Alamat lengkap
- **City** - Kota
- **Province** - Provinsi
- **Postal Code** - Kode pos
- **Country** - Negara

### Terms
- **Payment Terms** - Jangka waktu pembayaran (NET 30, NET 60, dll)
- **Credit Limit** - Batas kredit
- **Discount %** - Diskon standar

4. Klik **Save**

## Credit Management

### Credit Limit
- Batas maksimal piutang customer
- SO akan di-hold jika melebihi limit

### Credit Status
| Status | Keterangan |
|--------|------------|
| 🟢 Good | Pembayaran lancar |
| 🟡 Warning | Ada keterlambatan |
| 🔴 Blocked | Kredit diblokir |

## Laporan Customer

- **Customer List** - Daftar semua customer
- **Sales by Customer** - Penjualan per customer
- **AR Aging** - Umur piutang
- **Credit Status** - Status kredit
''', 1),

        (11, 4, 'Sales Order', 'sales-order',
         'Panduan membuat dan mengelola Sales Order',
         '''# Sales Order

## Pengertian

**Sales Order (SO)** adalah dokumen pesanan penjualan dari customer.

## Workflow Sales Order

```
[Draft] → [Confirmed] → [Processing] → [Delivered] → [Invoiced]
              ↓
         [Cancelled]
```

## Membuat Sales Order

1. Buka **Sales > Sales Orders**
2. Klik **+ New Order**
3. Isi header:
   - **Customer** - Pilih customer
   - **Order Date** - Tanggal order
   - **Delivery Date** - Tanggal pengiriman
   - **Payment Terms** - Termin pembayaran
   - **Salesperson** - Sales yang handle

4. Tambah item:
   - Klik **+ Add Item**
   - Pilih **Product**
   - Masukkan **Quantity**
   - Sistem akan menampilkan **Unit Price**
   - Adjust **Discount** jika perlu

5. Review total:
   - Subtotal
   - Discount
   - Tax (PPN)
   - **Grand Total**

6. Klik **Save as Draft** atau **Confirm**

## Status Sales Order

| Status | Aksi Selanjutnya |
|--------|------------------|
| Draft | Edit / Confirm / Cancel |
| Confirmed | Process / Generate WO |
| Processing | Delivery |
| Delivered | Invoice |
| Invoiced | Payment |
| Completed | - |

## Generate Work Order

Dari SO yang confirmed:
1. Klik **Generate WO**
2. Pilih item yang akan diproduksi
3. WO akan dibuat otomatis

## Delivery Order

1. Klik **Create Delivery**
2. Pilih item dan quantity
3. Input nomor kendaraan, driver
4. Print Surat Jalan
5. Confirm delivery

## Invoice

1. Klik **Create Invoice**
2. Review item dan amount
3. Confirm invoice
4. Print/Email ke customer

## Laporan Sales

| Laporan | Keterangan |
|---------|------------|
| Sales Summary | Ringkasan penjualan |
| Sales by Product | Penjualan per produk |
| Sales by Customer | Penjualan per customer |
| Outstanding Orders | Order belum selesai |
''', 2),

        # Purchasing
        (12, 5, 'Manajemen Supplier', 'manajemen-supplier',
         'Panduan mengelola data supplier',
         '''# Manajemen Supplier

## Pengertian

Supplier adalah pemasok material atau barang untuk perusahaan.

## Kategori Supplier

| Kategori | Contoh |
|----------|--------|
| Raw Material | Supplier nonwoven, chemical |
| Packaging | Supplier karton, plastik |
| Equipment | Supplier mesin, spare part |
| Services | Jasa maintenance, logistik |

## Menambah Supplier Baru

1. Buka **Purchasing > Suppliers**
2. Klik **+ Add Supplier**
3. Isi data:

### Informasi Umum
- **Code** - Kode supplier
- **Name** - Nama perusahaan
- **Category** - Kategori supplier
- **Tax ID (NPWP)** - Nomor NPWP

### Kontak
- **Contact Person** - Nama PIC
- **Phone** - Nomor telepon
- **Email** - Alamat email

### Alamat
- **Address** - Alamat lengkap
- **City** - Kota
- **Country** - Negara

### Terms
- **Payment Terms** - Termin pembayaran
- **Lead Time** - Waktu pengiriman standar
- **Currency** - Mata uang

### Bank Account
- **Bank Name** - Nama bank
- **Account Number** - Nomor rekening
- **Account Name** - Nama pemilik rekening

4. Klik **Save**

## Supplier Evaluation

Evaluasi supplier berdasarkan:
- **Quality** - Kualitas barang
- **Delivery** - Ketepatan pengiriman
- **Price** - Harga kompetitif
- **Service** - Layanan after-sales

## Approved Supplier List

Material tertentu hanya boleh dibeli dari supplier yang sudah di-approve:
1. Buka detail material
2. Tab **Approved Suppliers**
3. Tambah supplier yang disetujui
''', 1),

        (13, 5, 'Purchase Order', 'purchase-order',
         'Panduan membuat dan mengelola Purchase Order',
         '''# Purchase Order

## Pengertian

**Purchase Order (PO)** adalah dokumen pemesanan pembelian ke supplier.

## Workflow Purchase Order

```
[Draft] → [Approved] → [Sent] → [Received] → [Invoiced] → [Paid]
             ↓
        [Rejected]
```

## Membuat Purchase Order

### Dari Purchase Request
1. Buka PR yang sudah approved
2. Klik **Convert to PO**
3. Pilih supplier
4. Review dan submit

### Manual
1. Buka **Purchasing > Purchase Orders**
2. Klik **+ New PO**
3. Isi header:
   - **Supplier** - Pilih supplier
   - **PO Date** - Tanggal PO
   - **Expected Date** - Tanggal pengiriman
   - **Payment Terms** - Termin pembayaran

4. Tambah item:
   - Klik **+ Add Item**
   - Pilih **Material**
   - Masukkan **Quantity**
   - Masukkan **Unit Price**

5. Review total
6. Klik **Submit for Approval**

## Approval Process

| Level | Limit | Approver |
|-------|-------|----------|
| 1 | < 10 juta | Supervisor |
| 2 | 10-50 juta | Manager |
| 3 | > 50 juta | Director |

## Goods Receipt

Saat barang datang:
1. Buka PO terkait
2. Klik **Receive Goods**
3. Input:
   - **Received Qty** - Jumlah diterima
   - **Batch/Lot** - Nomor batch
   - **Expiry Date** - Tanggal kadaluarsa
   - **Location** - Lokasi penyimpanan
4. Klik **Confirm Receipt**
5. Stok akan bertambah otomatis

## Partial Receipt

Jika barang datang sebagian:
- Input qty yang diterima
- PO status menjadi "Partially Received"
- Sisa akan ditunggu di pengiriman berikutnya

## Supplier Invoice

1. Terima invoice dari supplier
2. Buka PO terkait
3. Klik **Match Invoice**
4. Input nomor dan tanggal invoice
5. Verifikasi amount
6. Submit ke Finance
''', 2),

        # Finance
        (14, 6, 'Chart of Accounts', 'chart-of-accounts',
         'Panduan mengelola bagan akun',
         '''# Chart of Accounts

## Pengertian

**Chart of Accounts (CoA)** adalah daftar semua akun yang digunakan dalam sistem akuntansi perusahaan.

## Struktur Akun

```
1xxxx - Assets (Aset)
  11xxx - Current Assets
  12xxx - Fixed Assets
2xxxx - Liabilities (Kewajiban)
  21xxx - Current Liabilities
  22xxx - Long-term Liabilities
3xxxx - Equity (Modal)
4xxxx - Revenue (Pendapatan)
5xxxx - Cost of Goods Sold
6xxxx - Operating Expenses
7xxxx - Other Income/Expense
```

## Tipe Akun

| Tipe | Saldo Normal | Contoh |
|------|--------------|--------|
| Asset | Debit | Kas, Piutang, Inventory |
| Liability | Credit | Hutang, Pinjaman |
| Equity | Credit | Modal, Laba Ditahan |
| Revenue | Credit | Penjualan |
| Expense | Debit | Gaji, Listrik, Sewa |

## Menambah Akun Baru

1. Buka **Finance > Chart of Accounts**
2. Klik **+ Add Account**
3. Isi data:
   - **Account Code** - Kode akun
   - **Account Name** - Nama akun
   - **Account Type** - Tipe akun
   - **Parent Account** - Akun induk (jika sub-akun)
   - **Currency** - Mata uang
   - **Description** - Keterangan

4. Klik **Save**

## Akun Standar ERP

### Inventory Related
| Code | Name |
|------|------|
| 11310 | Raw Material Inventory |
| 11320 | WIP Inventory |
| 11330 | Finished Goods Inventory |
| 51100 | Cost of Raw Material |
| 51200 | Direct Labor |
| 51300 | Manufacturing Overhead |

### Sales Related
| Code | Name |
|------|------|
| 11210 | Accounts Receivable |
| 41100 | Sales Revenue |
| 41200 | Sales Discount |
| 41300 | Sales Return |

### Purchase Related
| Code | Name |
|------|------|
| 21100 | Accounts Payable |
| 51100 | Purchase - Raw Material |
| 51110 | Purchase Discount |
''', 1),

        (15, 6, 'Journal Entry', 'journal-entry',
         'Panduan membuat jurnal akuntansi',
         '''# Journal Entry

## Pengertian

**Journal Entry** adalah pencatatan transaksi keuangan dalam sistem akuntansi dengan prinsip double-entry (debit = credit).

## Jenis Journal

| Jenis | Keterangan |
|-------|------------|
| General Journal | Jurnal umum |
| Sales Journal | Jurnal penjualan |
| Purchase Journal | Jurnal pembelian |
| Cash Receipt | Penerimaan kas |
| Cash Payment | Pengeluaran kas |
| Adjustment | Jurnal penyesuaian |

## Membuat Journal Entry

1. Buka **Finance > Journal Entries**
2. Klik **+ New Entry**
3. Isi header:
   - **Journal Type** - Tipe jurnal
   - **Date** - Tanggal transaksi
   - **Reference** - Nomor referensi
   - **Description** - Keterangan

4. Tambah lines:
   - **Account** - Pilih akun
   - **Debit** - Jumlah debit
   - **Credit** - Jumlah credit
   - **Description** - Keterangan per line

5. Pastikan **Total Debit = Total Credit**
6. Klik **Post**

## Contoh Journal Entry

### Penjualan Kredit
```
Accounts Receivable (D)    11,000,000
    Sales Revenue (C)                  10,000,000
    VAT Payable (C)                     1,000,000
```

### Pembelian Material
```
Raw Material Inventory (D)  5,000,000
VAT Receivable (D)            500,000
    Accounts Payable (C)                5,500,000
```

### Produksi Selesai
```
Finished Goods (D)         8,000,000
    WIP Inventory (C)                   8,000,000
```

## Auto Journal

Sistem akan membuat jurnal otomatis untuk:
- ✅ Sales Invoice
- ✅ Purchase Invoice
- ✅ Goods Receipt
- ✅ Goods Issue
- ✅ Production Completion
- ✅ Stock Adjustment

## Reversal Journal

Untuk membatalkan jurnal:
1. Buka journal yang akan dibatalkan
2. Klik **Reverse**
3. Sistem akan membuat jurnal kebalikan
''', 2),

        # HRM
        (16, 7, 'Manajemen Karyawan', 'manajemen-karyawan',
         'Panduan mengelola data karyawan',
         '''# Manajemen Karyawan

## Data Karyawan

### Informasi Personal
- NIK (Nomor Induk Karyawan)
- Nama Lengkap
- Tempat/Tanggal Lahir
- Jenis Kelamin
- Alamat
- No. KTP
- NPWP
- No. HP
- Email

### Informasi Pekerjaan
- Department
- Position/Jabatan
- Employment Type (Tetap/Kontrak)
- Join Date
- Status (Active/Inactive)

### Informasi Payroll
- Basic Salary
- Allowances
- Bank Account

## Menambah Karyawan

1. Buka **HRM > Employees**
2. Klik **+ Add Employee**
3. Isi semua tab:
   - Personal Info
   - Employment Info
   - Payroll Info
   - Documents
4. Upload dokumen pendukung
5. Klik **Save**

## Department & Position

### Struktur Organisasi
```
📁 Board of Directors
📁 Operations
   ├── Production
   ├── Quality Control
   ├── Warehouse
   └── Maintenance
📁 Commercial
   ├── Sales
   ├── Marketing
   └── Purchasing
📁 Finance & Accounting
📁 Human Resources
📁 IT
```

## Employee Self-Service

Karyawan dapat:
- Melihat slip gaji
- Mengajukan cuti
- Update data personal
- Melihat sisa cuti
- Download dokumen

## Laporan HRM

| Laporan | Keterangan |
|---------|------------|
| Employee List | Daftar karyawan |
| Headcount | Jumlah karyawan per dept |
| Turnover | Tingkat keluar-masuk |
| Birthday List | Daftar ulang tahun |
''', 1),

        (17, 7, 'Absensi dan Cuti', 'absensi-dan-cuti',
         'Panduan sistem absensi dan pengajuan cuti',
         '''# Absensi dan Cuti

## Sistem Absensi

### Metode Absensi
- **Fingerprint** - Mesin sidik jari
- **Face Recognition** - Pengenalan wajah
- **Mobile App** - Absen via smartphone (dengan GPS)
- **Web Clock** - Absen via browser

### Jam Kerja

| Shift | Jam Masuk | Jam Pulang |
|-------|-----------|------------|
| Office | 08:00 | 17:00 |
| Shift 1 | 07:00 | 15:00 |
| Shift 2 | 15:00 | 23:00 |
| Shift 3 | 23:00 | 07:00 |

### Status Kehadiran

| Status | Keterangan |
|--------|------------|
| ✅ Present | Hadir tepat waktu |
| ⏰ Late | Terlambat |
| 🏠 WFH | Work from Home |
| 🏖️ Leave | Cuti |
| 🤒 Sick | Sakit |
| ❌ Absent | Tidak hadir |

## Pengajuan Cuti

### Jenis Cuti

| Jenis | Kuota/Tahun |
|-------|-------------|
| Annual Leave | 12 hari |
| Sick Leave | Sesuai kebutuhan |
| Maternity | 3 bulan |
| Paternity | 2 hari |
| Marriage | 3 hari |
| Bereavement | 2-3 hari |

### Cara Mengajukan Cuti

1. Buka **HRM > Leave Request**
2. Klik **+ New Request**
3. Isi form:
   - **Leave Type** - Jenis cuti
   - **Start Date** - Tanggal mulai
   - **End Date** - Tanggal selesai
   - **Reason** - Alasan cuti
   - **Attachment** - Lampiran (jika perlu)
4. Klik **Submit**

### Approval Flow

```
Employee → Supervisor → HR → Approved
                ↓
            Rejected
```

## Laporan Absensi

| Laporan | Keterangan |
|---------|------------|
| Daily Attendance | Kehadiran harian |
| Monthly Summary | Rekap bulanan |
| Late Report | Laporan keterlambatan |
| Leave Balance | Sisa cuti |
''', 2),

        # Reports
        (18, 8, 'Dashboard', 'dashboard',
         'Panduan menggunakan dashboard dan KPI',
         '''# Dashboard

## Pengertian

Dashboard adalah tampilan visual yang menampilkan Key Performance Indicators (KPI) dan metrik penting bisnis secara real-time.

## Dashboard Utama

### Summary Cards
- **Total Sales** - Penjualan bulan ini
- **Total Orders** - Jumlah order
- **Production Output** - Output produksi
- **Inventory Value** - Nilai inventory

### Charts
- **Sales Trend** - Grafik penjualan
- **Production vs Target** - Realisasi vs target
- **Top Products** - Produk terlaris
- **Inventory Status** - Status stok

## Dashboard per Modul

### Sales Dashboard
- Sales by Period
- Sales by Customer
- Sales by Product
- Outstanding Orders
- AR Aging

### Production Dashboard
- Production Output
- Machine Utilization
- OEE (Overall Equipment Effectiveness)
- Scrap Rate
- Work Order Status

### Inventory Dashboard
- Stock Level
- Stock Movement
- Slow Moving Items
- Stock Valuation
- Reorder Alerts

### Finance Dashboard
- Cash Flow
- P&L Summary
- AR/AP Aging
- Budget vs Actual

## Customizing Dashboard

1. Klik ikon **Settings** di dashboard
2. Pilih widget yang ingin ditampilkan
3. Drag & drop untuk mengatur posisi
4. Klik **Save Layout**

## Export Dashboard

1. Klik **Export**
2. Pilih format (PDF/Excel)
3. Pilih periode
4. Download file

## Scheduled Reports

Atur laporan otomatis:
1. Buka **Settings > Scheduled Reports**
2. Pilih laporan
3. Set jadwal (Daily/Weekly/Monthly)
4. Masukkan email penerima
5. Klik **Save**
''', 1),

        # Settings
        (19, 9, 'User Management', 'user-management',
         'Panduan mengelola pengguna sistem',
         '''# User Management

## Role & Permission

### Default Roles

| Role | Akses |
|------|-------|
| Super Admin | Semua modul + settings |
| Admin | Semua modul |
| Manager | Modul departemen + approval |
| Staff | Modul departemen (view/create) |
| Viewer | View only |

### Custom Role

1. Buka **Settings > Roles**
2. Klik **+ New Role**
3. Beri nama role
4. Pilih permissions:
   - View
   - Create
   - Edit
   - Delete
   - Approve
5. Klik **Save**

## Menambah User

1. Buka **Settings > Users**
2. Klik **+ Add User**
3. Isi data:
   - **Username** - Username untuk login
   - **Email** - Email aktif
   - **Full Name** - Nama lengkap
   - **Role** - Pilih role
   - **Department** - Department
   - **Password** - Password awal
4. Klik **Save**
5. User akan menerima email aktivasi

## Reset Password

### By Admin
1. Buka detail user
2. Klik **Reset Password**
3. User akan menerima email reset

### By User
1. Klik **Forgot Password** di login page
2. Masukkan email
3. Cek email untuk link reset
4. Set password baru

## Deactivate User

1. Buka detail user
2. Klik **Deactivate**
3. User tidak bisa login
4. Data historis tetap tersimpan

## Audit Log

Semua aktivitas user tercatat:
- Login/Logout
- Create/Edit/Delete data
- Approval actions
- Export data

Lihat di **Settings > Audit Log**
''', 1),

        (20, 9, 'System Configuration', 'system-configuration',
         'Panduan konfigurasi sistem',
         '''# System Configuration

## General Settings

### Company Information
- Company Name
- Address
- Phone/Fax
- Email
- Website
- Logo
- Tax ID (NPWP)

### Regional Settings
- **Timezone** - Asia/Jakarta
- **Date Format** - DD/MM/YYYY
- **Currency** - IDR
- **Language** - Indonesia

## Module Settings

### Inventory
- **Costing Method** - Average/FIFO/LIFO
- **Allow Negative Stock** - Yes/No
- **Auto Generate Code** - Yes/No

### Production
- **Default Shift Hours** - 8
- **Scrap Tolerance %** - 5%
- **Auto Complete WO** - Yes/No

### Sales
- **Default Payment Terms** - NET 30
- **Credit Check** - Yes/No
- **Auto Invoice** - Yes/No

### Purchasing
- **Approval Workflow** - Yes/No
- **3-Way Matching** - Yes/No
- **Auto PO Number** - Yes/No

## Number Series

Atur format nomor dokumen:

| Document | Format | Example |
|----------|--------|---------|
| Sales Order | SO-YYYYMM-##### | SO-202512-00001 |
| Purchase Order | PO-YYYYMM-##### | PO-202512-00001 |
| Work Order | WO-YYYYMM-##### | WO-202512-00001 |
| Invoice | INV-YYYYMM-##### | INV-202512-00001 |

## Email Settings

Configure SMTP untuk notifikasi:
- SMTP Server
- Port
- Username
- Password
- From Email
- From Name

## Backup Settings

- **Auto Backup** - Daily/Weekly
- **Backup Time** - 00:00
- **Retention** - 30 days
- **Backup Location** - Cloud/Local

## Integration

API settings untuk integrasi:
- API Key
- Webhook URL
- Third-party connections
''', 2),
    ]
    
    for article in articles:
        cursor.execute("""
            INSERT INTO manual_articles 
            (id, category_id, title, slug, summary, content, "order", is_published, view_count, author_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 1, ?, ?)
        """, (article[0], article[1], article[2], article[3], article[4], article[5], article[6], now, now))
    
    # ==================== FAQs ====================
    faqs = [
        (1, 1, 'Bagaimana cara reset password?', 
         '''Untuk reset password:
1. Klik "Forgot Password" di halaman login
2. Masukkan email yang terdaftar
3. Cek inbox email Anda
4. Klik link reset password
5. Masukkan password baru

Jika tidak menerima email, hubungi Admin IT.''', 1),
        
        (2, 1, 'Mengapa saya tidak bisa login?',
         '''Beberapa penyebab tidak bisa login:
- **Password salah** - Coba reset password
- **Akun terkunci** - Tunggu 15 menit atau hubungi Admin
- **Akun nonaktif** - Hubungi HR/Admin
- **Browser cache** - Clear cache dan cookies
- **Koneksi internet** - Periksa koneksi Anda''', 2),
        
        (3, 2, 'Bagaimana cara melihat stok material?',
         '''Untuk melihat stok material:
1. Buka menu **Inventory > Materials**
2. Cari material yang diinginkan
3. Klik pada material untuk melihat detail
4. Tab **Stock** menampilkan stok per lokasi

Atau gunakan **Inventory > Stock Report** untuk laporan lengkap.''', 1),
        
        (4, 2, 'Apa yang harus dilakukan jika stok minus?',
         '''Stok minus menandakan ada ketidaksesuaian data. Langkah yang harus dilakukan:
1. Lakukan stock opname fisik
2. Cek transaksi terakhir (GR, GI, Adjustment)
3. Identifikasi penyebab selisih
4. Buat Stock Adjustment dengan approval
5. Dokumentasikan penyebab untuk audit

> ⚠️ Jangan langsung adjust tanpa investigasi!''', 2),
        
        (5, 3, 'Bagaimana cara membuat Work Order?',
         '''Work Order dapat dibuat dengan 3 cara:

**1. Dari Sales Order:**
- Buka SO yang sudah confirmed
- Klik "Generate Work Order"

**2. Dari Production Schedule:**
- Buka jadwal produksi
- Klik ikon ⚡ Generate WO

**3. Manual:**
- Buka Production > Work Orders
- Klik "+ New Work Order"
- Isi form dan submit''', 1),
        
        (6, 3, 'Apa itu BOM dan mengapa penting?',
         '''**Bill of Materials (BOM)** adalah daftar material yang dibutuhkan untuk membuat satu produk.

**Pentingnya BOM:**
- Menghitung kebutuhan material
- Menentukan harga pokok produksi
- Dasar untuk MRP (Material Requirement Planning)
- Kontrol konsumsi material
- Standarisasi proses produksi

Setiap produk WAJIB memiliki BOM sebelum bisa diproduksi.''', 2),
        
        (7, 4, 'Bagaimana proses approval Sales Order?',
         '''Proses approval SO:
1. Sales membuat SO (status: Draft)
2. Sales submit untuk approval
3. Supervisor review dan approve/reject
4. Jika approved, status menjadi "Confirmed"
5. SO siap diproses (produksi/delivery)

Approval limit berdasarkan nilai order dan kebijakan perusahaan.''', 1),
        
        (8, 5, 'Berapa lama proses approval Purchase Order?',
         '''Waktu approval PO tergantung nilai:
- < Rp 10 juta: 1 hari (Supervisor)
- Rp 10-50 juta: 2 hari (Manager)
- > Rp 50 juta: 3 hari (Director)

Tips mempercepat approval:
- Lengkapi dokumen pendukung
- Jelaskan urgensi di notes
- Follow up via email/chat''', 1),
        
        (9, 6, 'Bagaimana cara melihat laporan keuangan?',
         '''Untuk melihat laporan keuangan:
1. Buka **Finance > Reports**
2. Pilih jenis laporan:
   - Balance Sheet (Neraca)
   - Income Statement (Laba Rugi)
   - Cash Flow
   - Trial Balance
3. Pilih periode
4. Klik "Generate"
5. Export ke Excel/PDF jika perlu''', 1),
        
        (10, 7, 'Bagaimana cara mengajukan cuti?',
         '''Langkah mengajukan cuti:
1. Buka **HRM > Leave Request**
2. Klik "+ New Request"
3. Pilih jenis cuti
4. Pilih tanggal mulai dan selesai
5. Isi alasan cuti
6. Lampirkan dokumen (jika perlu)
7. Submit

Cuti akan diproses oleh atasan dan HR. Pastikan mengajukan minimal 3 hari sebelumnya untuk cuti tahunan.''', 1),
    ]
    
    for faq in faqs:
        cursor.execute("""
            INSERT INTO manual_faqs 
            (id, category_id, question, answer, "order", is_published, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 1, ?, ?)
        """, (faq[0], faq[1], faq[2], faq[3], faq[4], now, now))
    
    conn.commit()
    conn.close()
    
    print("✅ User Manual seeded successfully!")
    print(f"   - {len(categories)} categories")
    print(f"   - {len(articles)} articles")
    print(f"   - {len(faqs)} FAQs")

if __name__ == '__main__':
    seed_manual()
