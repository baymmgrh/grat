"""
Seed data for User Manual
Run this script to populate the manual with initial content
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models import db
from models.user_manual import ManualCategory, ManualArticle, ManualFAQ


def seed_manual_data():
    """Seed user manual with comprehensive documentation"""
    
    app = create_app()
    with app.app_context():
        print("Seeding User Manual data...")
        
        # Clear existing data
        ManualFAQ.query.delete()
        ManualArticle.query.delete()
        ManualCategory.query.delete()
        db.session.commit()
        
        # Create Categories
        categories_data = [
            {
                'name': 'Memulai',
                'slug': 'getting-started',
                'description': 'Panduan dasar untuk memulai menggunakan sistem ERP',
                'icon': 'BookOpenIcon',
                'order': 1
            },
            {
                'name': 'Produk & BOM',
                'slug': 'products-bom',
                'description': 'Manajemen produk, Bill of Materials, dan kalkulasi biaya',
                'icon': 'CubeIcon',
                'order': 2
            },
            {
                'name': 'Gudang & Inventory',
                'slug': 'warehouse-inventory',
                'description': 'Manajemen gudang, stok, dan pergerakan barang',
                'icon': 'BuildingStorefrontIcon',
                'order': 3
            },
            {
                'name': 'Penjualan',
                'slug': 'sales',
                'description': 'Manajemen pelanggan, quotation, dan sales order',
                'icon': 'ShoppingCartIcon',
                'order': 4
            },
            {
                'name': 'Pembelian',
                'slug': 'purchasing',
                'description': 'Manajemen supplier, RFQ, dan purchase order',
                'icon': 'TruckIcon',
                'order': 5
            },
            {
                'name': 'Produksi',
                'slug': 'production',
                'description': 'Work order, jadwal produksi, dan monitoring',
                'icon': 'WrenchScrewdriverIcon',
                'order': 6
            },
            {
                'name': 'Quality Control',
                'slug': 'quality-control',
                'description': 'Inspeksi kualitas, standar, dan laporan QC',
                'icon': 'ClipboardDocumentCheckIcon',
                'order': 7
            },
            {
                'name': 'Keuangan',
                'slug': 'finance',
                'description': 'Invoice, pembayaran, dan laporan keuangan',
                'icon': 'CurrencyDollarIcon',
                'order': 8
            },
            {
                'name': 'HR & Payroll',
                'slug': 'hr-payroll',
                'description': 'Manajemen karyawan, absensi, dan penggajian',
                'icon': 'UsersIcon',
                'order': 9
            },
            {
                'name': 'Pengaturan',
                'slug': 'settings',
                'description': 'Konfigurasi sistem, user, dan role',
                'icon': 'CogIcon',
                'order': 10
            }
        ]
        
        categories = {}
        for cat_data in categories_data:
            category = ManualCategory(**cat_data)
            db.session.add(category)
            db.session.flush()
            categories[cat_data['slug']] = category
        
        # Create Articles
        articles_data = [
            # Getting Started
            {
                'category': 'getting-started',
                'title': 'Pengenalan Sistem ERP',
                'slug': 'pengenalan-sistem-erp',
                'summary': 'Gambaran umum tentang sistem ERP PT. Gratia Makmur Sentosa',
                'order': 1,
                'content': '''# Pengenalan Sistem ERP

## Apa itu ERP?

ERP (Enterprise Resource Planning) adalah sistem informasi terintegrasi yang mengelola seluruh proses bisnis perusahaan dalam satu platform terpadu.

## Modul-modul Utama

Sistem ERP ini terdiri dari beberapa modul utama:

### 1. **Produk & BOM**
- Manajemen data produk
- Bill of Materials (BOM)
- Kalkulasi biaya produksi

### 2. **Gudang & Inventory**
- Manajemen lokasi gudang
- Stok dan pergerakan barang
- Reorder point otomatis

### 3. **Penjualan (Sales)**
- Manajemen pelanggan
- Quotation dan Sales Order
- Tracking pengiriman

### 4. **Pembelian (Purchasing)**
- Manajemen supplier
- Request for Quotation (RFQ)
- Purchase Order

### 5. **Produksi**
- Work Order
- Jadwal produksi
- Monitoring real-time

### 6. **Quality Control**
- Inspeksi kualitas
- Standar dan spesifikasi
- Laporan QC

### 7. **Keuangan**
- Invoice dan pembayaran
- Laporan keuangan
- Integrasi akuntansi

### 8. **HR & Payroll**
- Data karyawan
- Absensi dan cuti
- Penggajian

## Keuntungan Menggunakan ERP

1. **Integrasi Data** - Semua data terhubung dalam satu sistem
2. **Real-time** - Informasi selalu up-to-date
3. **Efisiensi** - Mengurangi pekerjaan manual
4. **Akurasi** - Meminimalkan kesalahan input
5. **Traceability** - Mudah melacak setiap transaksi
'''
            },
            {
                'category': 'getting-started',
                'title': 'Login dan Navigasi',
                'slug': 'login-navigasi',
                'summary': 'Cara login ke sistem dan navigasi menu',
                'order': 2,
                'content': '''# Login dan Navigasi

## Cara Login

1. Buka browser dan akses URL sistem ERP
2. Masukkan **Username** dan **Password**
3. Klik tombol **Login**

### Login dengan Google
Anda juga dapat login menggunakan akun Google:
1. Klik tombol **Login dengan Google**
2. Pilih akun Google Anda
3. Sistem akan otomatis login

## Navigasi Utama

### Sidebar Menu
Di sebelah kiri layar terdapat sidebar dengan menu-menu utama:
- **Dashboard** - Halaman utama dengan ringkasan
- **Products** - Manajemen produk
- **Warehouse** - Manajemen gudang
- **Sales** - Penjualan
- **Purchasing** - Pembelian
- **Production** - Produksi
- **Quality** - Quality Control
- **Finance** - Keuangan
- **HR** - Human Resources
- **Reports** - Laporan
- **Settings** - Pengaturan

### Header
Di bagian atas terdapat:
- **Notifikasi** - Pemberitahuan sistem
- **Profile** - Menu profil pengguna
- **Logout** - Keluar dari sistem

## Tips Navigasi

- Gunakan **breadcrumb** untuk kembali ke halaman sebelumnya
- Klik logo perusahaan untuk kembali ke Dashboard
- Gunakan **search** untuk mencari data dengan cepat
'''
            },
            {
                'category': 'getting-started',
                'title': 'Profil Pengguna',
                'slug': 'profil-pengguna',
                'summary': 'Cara mengelola profil dan pengaturan akun',
                'order': 3,
                'content': '''# Profil Pengguna

## Mengakses Profil

1. Klik nama Anda di pojok kanan atas
2. Pilih **Profile** dari dropdown menu

## Informasi Profil

Halaman profil menampilkan:
- **Foto Profil** - Avatar atau inisial nama
- **Nama Lengkap**
- **Email**
- **Telepon**
- **Departemen**
- **Jabatan**
- **Bio** - Deskripsi singkat tentang Anda
- **Role** - Peran dalam sistem

## Mengedit Profil

1. Klik tombol **Edit Profil**
2. Ubah informasi yang diinginkan:
   - Nama Lengkap
   - Nomor Telepon
   - Departemen
   - Jabatan
   - Bio
3. Klik **Simpan** untuk menyimpan perubahan
4. Klik **Batal** untuk membatalkan

## Mengubah Password

1. Pergi ke **Settings** > **Security**
2. Masukkan password lama
3. Masukkan password baru
4. Konfirmasi password baru
5. Klik **Ubah Password**

> **Tips:** Gunakan password yang kuat dengan kombinasi huruf besar, huruf kecil, angka, dan simbol.
'''
            },
            
            # Products & BOM
            {
                'category': 'products-bom',
                'title': 'Manajemen Produk',
                'slug': 'manajemen-produk',
                'summary': 'Cara mengelola data produk dalam sistem',
                'order': 1,
                'content': '''# Manajemen Produk

## Daftar Produk

Akses menu **Products** > **All Products** untuk melihat daftar produk.

### Fitur Daftar Produk
- **Search** - Cari produk berdasarkan nama atau SKU
- **Filter** - Filter berdasarkan kategori, status
- **Sort** - Urutkan berdasarkan nama, tanggal, dll
- **Export** - Export data ke Excel

## Menambah Produk Baru

1. Klik tombol **+ Tambah Produk**
2. Isi informasi produk:
   - **SKU** - Kode unik produk
   - **Nama Produk** - Nama lengkap produk
   - **Kategori** - Pilih kategori produk
   - **Deskripsi** - Deskripsi detail produk
   - **Satuan** - Unit pengukuran (pcs, kg, meter, dll)
   - **Harga Jual** - Harga jual per unit
   - **Harga Beli** - Harga beli/HPP per unit
3. Upload **Gambar Produk** (opsional)
4. Klik **Simpan**

## Mengedit Produk

1. Klik produk yang ingin diedit
2. Klik tombol **Edit**
3. Ubah informasi yang diperlukan
4. Klik **Simpan**

## Menghapus Produk

1. Klik produk yang ingin dihapus
2. Klik tombol **Hapus**
3. Konfirmasi penghapusan

> **Perhatian:** Produk yang sudah digunakan dalam transaksi tidak dapat dihapus.

## Kategori Produk

### Mengelola Kategori
1. Akses **Products** > **Categories**
2. Tambah, edit, atau hapus kategori sesuai kebutuhan

### Struktur Kategori
Kategori dapat memiliki sub-kategori untuk pengelompokan yang lebih detail.
'''
            },
            {
                'category': 'products-bom',
                'title': 'Bill of Materials (BOM)',
                'slug': 'bill-of-materials',
                'summary': 'Panduan membuat dan mengelola BOM',
                'order': 2,
                'content': '''# Bill of Materials (BOM)

## Apa itu BOM?

Bill of Materials adalah daftar komponen/material yang dibutuhkan untuk membuat satu unit produk jadi.

## Membuat BOM

1. Akses **Products** > **Bill of Materials**
2. Klik **+ Tambah BOM**
3. Pilih **Produk Jadi** yang akan dibuat BOM-nya
4. Tambahkan komponen:
   - Pilih **Material/Komponen**
   - Masukkan **Quantity** per unit produk
   - Pilih **Satuan**
5. Ulangi untuk semua komponen
6. Klik **Simpan**

## Struktur BOM

```
Produk Jadi: Tas Nonwoven 40x30
├── Material: Kain Nonwoven - 0.5 meter
├── Material: Tali Handle - 2 pcs
├── Material: Benang Jahit - 5 meter
└── Material: Label Brand - 1 pcs
```

## Kalkulasi Biaya

Sistem akan otomatis menghitung:
- **Biaya Material** = Σ (Qty × Harga Material)
- **Biaya Produksi** = Biaya Material + Overhead
- **HPP** = Total Biaya / Qty Produksi

## Multi-Level BOM

BOM dapat memiliki beberapa level:
- **Level 0** - Produk Jadi
- **Level 1** - Komponen utama
- **Level 2** - Sub-komponen
- dst.

## Tips BOM

1. Pastikan semua material sudah terdaftar di sistem
2. Gunakan satuan yang konsisten
3. Update BOM jika ada perubahan formula
4. Review BOM secara berkala
'''
            },
            
            # Warehouse
            {
                'category': 'warehouse-inventory',
                'title': 'Manajemen Gudang',
                'slug': 'manajemen-gudang',
                'summary': 'Panduan mengelola gudang dan lokasi penyimpanan',
                'order': 1,
                'content': '''# Manajemen Gudang

## Struktur Gudang

Sistem mendukung struktur gudang hierarkis:

```
Gudang Utama
├── Zone A (Raw Material)
│   ├── Rak A1
│   │   ├── Bin A1-01
│   │   └── Bin A1-02
│   └── Rak A2
├── Zone B (WIP)
└── Zone C (Finished Goods)
```

## Menambah Gudang

1. Akses **Warehouse** > **Locations**
2. Klik **+ Tambah Gudang**
3. Isi informasi:
   - **Kode Gudang**
   - **Nama Gudang**
   - **Alamat**
   - **Penanggung Jawab**
4. Klik **Simpan**

## Menambah Zone

1. Pilih gudang
2. Klik **+ Tambah Zone**
3. Isi nama dan kode zone
4. Tentukan tipe zone:
   - Raw Material
   - Work in Progress
   - Finished Goods
   - Quarantine
5. Klik **Simpan**

## Menambah Lokasi (Rak/Bin)

1. Pilih zone
2. Klik **+ Tambah Lokasi**
3. Isi kode dan nama lokasi
4. Tentukan kapasitas (opsional)
5. Klik **Simpan**

## Barcode Lokasi

Setiap lokasi memiliki barcode unik untuk:
- Scan saat penerimaan barang
- Scan saat pengambilan barang
- Tracking pergerakan stok
'''
            },
            {
                'category': 'warehouse-inventory',
                'title': 'Stok dan Inventory',
                'slug': 'stok-inventory',
                'summary': 'Cara mengelola stok dan pergerakan barang',
                'order': 2,
                'content': '''# Stok dan Inventory

## Dashboard Inventory

Akses **Warehouse** > **Dashboard** untuk melihat:
- Total nilai inventory
- Stok menipis (low stock)
- Stok berlebih (overstock)
- Pergerakan stok harian

## Input Stok

### Penerimaan Barang
1. Akses **Warehouse** > **Stock Input**
2. Pilih tipe: **Penerimaan**
3. Pilih sumber:
   - Purchase Order
   - Return dari Customer
   - Transfer antar gudang
4. Scan atau pilih item
5. Masukkan quantity
6. Pilih lokasi penyimpanan
7. Klik **Simpan**

### Pengeluaran Barang
1. Pilih tipe: **Pengeluaran**
2. Pilih tujuan:
   - Sales Order
   - Work Order (Produksi)
   - Transfer antar gudang
3. Scan atau pilih item
4. Masukkan quantity
5. Klik **Simpan**

## Stock Adjustment

Untuk koreksi stok:
1. Akses **Warehouse** > **Adjustment**
2. Pilih item
3. Masukkan quantity aktual
4. Pilih alasan adjustment:
   - Stock Opname
   - Kerusakan
   - Expired
   - Lainnya
5. Tambahkan catatan
6. Klik **Simpan**

## Reorder Point

Sistem akan memberikan alert jika stok mencapai reorder point:
1. Akses **Warehouse** > **Reorder Points**
2. Set minimum stock untuk setiap item
3. Sistem akan otomatis notify saat stok menipis
'''
            },
            
            # Sales
            {
                'category': 'sales',
                'title': 'Manajemen Pelanggan',
                'slug': 'manajemen-pelanggan',
                'summary': 'Cara mengelola data pelanggan',
                'order': 1,
                'content': '''# Manajemen Pelanggan

## Daftar Pelanggan

Akses **Sales** > **Customers** untuk melihat daftar pelanggan.

## Menambah Pelanggan

1. Klik **+ Tambah Pelanggan**
2. Isi informasi:
   - **Kode Pelanggan** (auto-generate atau manual)
   - **Nama Perusahaan**
   - **Nama Kontak**
   - **Email**
   - **Telepon**
   - **Alamat**
   - **NPWP** (opsional)
   - **Term Pembayaran** (COD, Net 30, dll)
   - **Credit Limit**
3. Klik **Simpan**

## Kategori Pelanggan

Pelanggan dapat dikategorikan:
- **Regular** - Pelanggan biasa
- **VIP** - Pelanggan prioritas
- **Distributor** - Reseller/distributor
- **End User** - Pengguna akhir

## Riwayat Transaksi

Di halaman detail pelanggan, Anda dapat melihat:
- Daftar quotation
- Daftar sales order
- Riwayat pembayaran
- Total pembelian
- Outstanding payment
'''
            },
            {
                'category': 'sales',
                'title': 'Sales Order',
                'slug': 'sales-order',
                'summary': 'Panduan membuat dan mengelola sales order',
                'order': 2,
                'content': '''# Sales Order

## Alur Sales Order

```
Quotation → Sales Order → Delivery → Invoice → Payment
```

## Membuat Sales Order

1. Akses **Sales** > **Sales Orders**
2. Klik **+ Buat SO**
3. Pilih **Pelanggan**
4. Tambahkan item:
   - Pilih produk
   - Masukkan quantity
   - Sesuaikan harga (jika perlu)
   - Tambahkan diskon (opsional)
5. Set tanggal pengiriman
6. Tambahkan catatan (opsional)
7. Klik **Simpan** atau **Submit**

## Status Sales Order

| Status | Deskripsi |
|--------|-----------|
| Draft | SO belum disubmit |
| Confirmed | SO sudah dikonfirmasi |
| In Progress | Sedang diproses/produksi |
| Ready to Ship | Siap dikirim |
| Shipped | Sudah dikirim |
| Delivered | Sudah diterima customer |
| Invoiced | Invoice sudah dibuat |
| Completed | Selesai |
| Cancelled | Dibatalkan |

## Approval Workflow

Untuk SO dengan nilai tertentu, diperlukan approval:
1. SO dibuat oleh Sales
2. Review oleh Sales Manager
3. Approval oleh Finance (jika > credit limit)
4. SO confirmed

## Cetak Sales Order

1. Buka detail SO
2. Klik **Print** atau **Download PDF**
3. Pilih template (jika ada beberapa)
'''
            },
            
            # Production
            {
                'category': 'production',
                'title': 'Work Order',
                'slug': 'work-order',
                'summary': 'Panduan membuat dan mengelola work order produksi',
                'order': 1,
                'content': '''# Work Order

## Apa itu Work Order?

Work Order (WO) adalah perintah kerja untuk memproduksi sejumlah produk berdasarkan Sales Order atau kebutuhan stok.

## Membuat Work Order

1. Akses **Production** > **Work Orders**
2. Klik **+ Buat WO**
3. Pilih sumber:
   - **From Sales Order** - Berdasarkan SO
   - **Make to Stock** - Untuk stok
4. Pilih produk yang akan diproduksi
5. Masukkan quantity
6. Set tanggal mulai dan target selesai
7. Pilih mesin/line produksi
8. Klik **Simpan**

## Status Work Order

| Status | Deskripsi |
|--------|-----------|
| Draft | WO belum direlease |
| Released | WO siap dikerjakan |
| In Progress | Sedang diproduksi |
| Quality Check | Menunggu QC |
| Completed | Selesai |
| Cancelled | Dibatalkan |

## Material Consumption

Saat WO dijalankan:
1. Sistem akan mengecek ketersediaan material
2. Material akan di-reserve
3. Saat produksi, material dikonsumsi dari stok
4. Output produksi masuk ke stok finished goods

## Monitoring Produksi

Dashboard produksi menampilkan:
- WO yang sedang berjalan
- Progress per WO
- Output vs Target
- Downtime mesin
- OEE (Overall Equipment Effectiveness)
'''
            },
            
            # Quality Control
            {
                'category': 'quality-control',
                'title': 'Inspeksi Kualitas',
                'slug': 'inspeksi-kualitas',
                'summary': 'Panduan melakukan inspeksi kualitas',
                'order': 1,
                'content': '''# Inspeksi Kualitas

## Jenis Inspeksi

### 1. Incoming Inspection
Inspeksi material yang baru diterima dari supplier.

### 2. In-Process Inspection
Inspeksi selama proses produksi.

### 3. Final Inspection
Inspeksi produk jadi sebelum dikirim.

## Melakukan Inspeksi

1. Akses **Quality** > **Inspections**
2. Klik **+ Buat Inspeksi**
3. Pilih tipe inspeksi
4. Pilih item yang akan diinspeksi
5. Isi checklist inspeksi:
   - Parameter yang dicek
   - Nilai aktual
   - Pass/Fail
6. Upload foto (jika diperlukan)
7. Klik **Submit**

## Hasil Inspeksi

| Hasil | Aksi |
|-------|------|
| Pass | Lanjut ke proses berikutnya |
| Fail | Reject atau rework |
| Conditional | Perlu review lebih lanjut |

## Non-Conformance Report (NCR)

Jika ditemukan ketidaksesuaian:
1. Buat NCR
2. Dokumentasikan masalah
3. Tentukan root cause
4. Tentukan corrective action
5. Follow up hingga closed
'''
            },
            
            # Settings
            {
                'category': 'settings',
                'title': 'Manajemen User',
                'slug': 'manajemen-user',
                'summary': 'Panduan mengelola user dan hak akses',
                'order': 1,
                'content': '''# Manajemen User

## Daftar User

Akses **Settings** > **Users** untuk melihat daftar user.

## Menambah User

1. Klik **+ Tambah User**
2. Isi informasi:
   - **Username**
   - **Email**
   - **Nama Lengkap**
   - **Password**
   - **Departemen**
   - **Jabatan**
3. Pilih **Role** (hak akses)
4. Klik **Simpan**

## Role dan Permission

### Role yang Tersedia
- **Super Admin** - Akses penuh ke semua fitur
- **Admin** - Akses ke sebagian besar fitur
- **Manager** - Akses ke modul tertentu + approval
- **Supervisor** - Akses operasional
- **Staff** - Akses terbatas sesuai departemen
- **Viewer** - Hanya bisa melihat

### Mengatur Permission
1. Akses **Settings** > **Roles**
2. Pilih role yang akan diedit
3. Centang permission yang diinginkan
4. Klik **Simpan**

## Reset Password

1. Pilih user
2. Klik **Reset Password**
3. Password baru akan dikirim ke email user

## Menonaktifkan User

1. Pilih user
2. Klik **Deactivate**
3. User tidak bisa login tapi data tetap tersimpan
'''
            }
        ]
        
        for article_data in articles_data:
            category = categories.get(article_data['category'])
            if category:
                article = ManualArticle(
                    category_id=category.id,
                    title=article_data['title'],
                    slug=article_data['slug'],
                    summary=article_data['summary'],
                    content=article_data['content'],
                    order=article_data['order'],
                    is_published=True
                )
                db.session.add(article)
        
        # Create FAQs
        faqs_data = [
            {
                'category': 'getting-started',
                'question': 'Bagaimana cara reset password?',
                'answer': '''Untuk reset password:
1. Klik **Lupa Password** di halaman login
2. Masukkan email Anda
3. Cek email untuk link reset password
4. Klik link dan buat password baru

Atau hubungi admin untuk reset password manual.''',
                'order': 1
            },
            {
                'category': 'getting-started',
                'question': 'Mengapa saya tidak bisa mengakses menu tertentu?',
                'answer': '''Akses menu ditentukan oleh **Role** yang diberikan kepada Anda. Setiap role memiliki permission berbeda.

Jika Anda memerlukan akses ke menu tertentu, hubungi admin atau atasan Anda untuk request perubahan role/permission.''',
                'order': 2
            },
            {
                'category': 'warehouse-inventory',
                'question': 'Bagaimana cara melakukan stock opname?',
                'answer': '''Langkah stock opname:
1. Akses **Warehouse** > **Stock Adjustment**
2. Pilih **Stock Opname**
3. Pilih lokasi/gudang
4. Hitung stok fisik
5. Input quantity aktual
6. Sistem akan menghitung selisih
7. Review dan submit adjustment
8. Approval oleh supervisor/manager''',
                'order': 1
            },
            {
                'category': 'sales',
                'question': 'Bagaimana cara membatalkan Sales Order?',
                'answer': '''Sales Order dapat dibatalkan jika:
- Status masih **Draft** atau **Confirmed**
- Belum ada delivery/pengiriman
- Belum ada invoice

Caranya:
1. Buka detail SO
2. Klik **Cancel**
3. Masukkan alasan pembatalan
4. Konfirmasi pembatalan

SO yang sudah shipped tidak bisa dibatalkan, harus melalui proses return.''',
                'order': 1
            },
            {
                'category': 'production',
                'question': 'Apa yang harus dilakukan jika material tidak cukup untuk produksi?',
                'answer': '''Jika material tidak cukup:
1. Sistem akan menampilkan warning saat membuat Work Order
2. Anda dapat:
   - **Menunggu** material datang
   - **Partial production** dengan material yang ada
   - **Request purchase** untuk material yang kurang
3. Koordinasi dengan Purchasing untuk percepat pengadaan
4. Update jadwal produksi jika diperlukan''',
                'order': 1
            },
            {
                'category': 'quality-control',
                'question': 'Apa yang terjadi jika produk tidak lolos QC?',
                'answer': '''Jika produk tidak lolos QC:
1. Produk akan di-**hold** (tidak bisa dikirim)
2. Buat **NCR** (Non-Conformance Report)
3. Tentukan disposisi:
   - **Rework** - Perbaiki dan inspeksi ulang
   - **Reject** - Buang/scrap
   - **Use As Is** - Gunakan dengan persetujuan customer
   - **Return to Supplier** - Untuk incoming material
4. Lakukan corrective action
5. Close NCR setelah selesai''',
                'order': 1
            }
        ]
        
        for faq_data in faqs_data:
            category = categories.get(faq_data['category'])
            faq = ManualFAQ(
                category_id=category.id if category else None,
                question=faq_data['question'],
                answer=faq_data['answer'],
                order=faq_data['order'],
                is_published=True
            )
            db.session.add(faq)
        
        db.session.commit()
        print("User Manual data seeded successfully!")
        print(f"- {len(categories_data)} categories")
        print(f"- {len(articles_data)} articles")
        print(f"- {len(faqs_data)} FAQs")


if __name__ == '__main__':
    seed_manual_data()
