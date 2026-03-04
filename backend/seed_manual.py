"""
Seed script for User Manual data
Run with: python seed_manual.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db
from models.user_manual import ManualCategory, ManualArticle, ManualFAQ

app = create_app()

def seed_manual_data():
    with app.app_context():
        # Check if data already exists
        if ManualCategory.query.count() > 0:
            print("Manual data already exists. Skipping seed.")
            return
        
        print("Seeding User Manual data...")
        
        # Create Categories
        categories_data = [
            {
                'name': 'Memulai',
                'slug': 'getting-started',
                'description': 'Panduan dasar untuk memulai menggunakan sistem ERP',
                'icon': 'HomeIcon',
                'order': 1
            },
            {
                'name': 'Inventory',
                'slug': 'inventory',
                'description': 'Manajemen stok dan gudang',
                'icon': 'CubeIcon',
                'order': 2
            },
            {
                'name': 'Penjualan',
                'slug': 'sales',
                'description': 'Modul penjualan dan order',
                'icon': 'ShoppingCartIcon',
                'order': 3
            },
            {
                'name': 'Pembelian',
                'slug': 'purchasing',
                'description': 'Modul pembelian dan supplier',
                'icon': 'TruckIcon',
                'order': 4
            },
            {
                'name': 'Keuangan',
                'slug': 'finance',
                'description': 'Manajemen keuangan dan akuntansi',
                'icon': 'CurrencyDollarIcon',
                'order': 5
            },
            {
                'name': 'Pengguna',
                'slug': 'users',
                'description': 'Manajemen pengguna dan hak akses',
                'icon': 'UsersIcon',
                'order': 6
            },
            {
                'name': 'Pengaturan',
                'slug': 'settings',
                'description': 'Konfigurasi sistem',
                'icon': 'CogIcon',
                'order': 7
            }
        ]
        
        categories = {}
        for cat_data in categories_data:
            cat = ManualCategory(**cat_data)
            db.session.add(cat)
            db.session.flush()
            categories[cat_data['slug']] = cat
        
        # Create Articles
        articles_data = [
            # Getting Started
            {
                'category': 'getting-started',
                'title': 'Selamat Datang di ERP System',
                'slug': 'welcome',
                'summary': 'Pengenalan sistem ERP dan fitur-fitur utamanya',
                'content': '''# Selamat Datang di ERP System

Sistem ERP (Enterprise Resource Planning) ini dirancang untuk membantu mengelola berbagai aspek bisnis Anda secara terintegrasi.

## Fitur Utama

- **Inventory Management** - Kelola stok dan gudang dengan mudah
- **Sales Management** - Proses penjualan dari quotation hingga invoice
- **Purchasing** - Manajemen pembelian dan supplier
- **Finance** - Laporan keuangan dan akuntansi
- **User Management** - Kontrol akses pengguna

## Navigasi Dasar

Gunakan sidebar di sebelah kiri untuk mengakses berbagai modul. Setiap modul memiliki submenu yang dapat diperluas.

## Bantuan

Jika Anda membutuhkan bantuan, silakan:
1. Baca dokumentasi ini
2. Kunjungi halaman FAQ
3. Hubungi administrator sistem
''',
                'order': 1
            },
            {
                'category': 'getting-started',
                'title': 'Login dan Keamanan',
                'slug': 'login-security',
                'summary': 'Cara login dan menjaga keamanan akun',
                'content': '''# Login dan Keamanan

## Cara Login

1. Buka halaman login
2. Masukkan username dan password
3. Klik tombol "Login"

## Tips Keamanan

- Jangan bagikan password Anda
- Gunakan password yang kuat (minimal 8 karakter)
- Logout setelah selesai menggunakan sistem
- Laporkan aktivitas mencurigakan ke administrator

## Lupa Password?

Hubungi administrator untuk reset password.
''',
                'order': 2
            },
            # Inventory
            {
                'category': 'inventory',
                'title': 'Manajemen Produk',
                'slug': 'product-management',
                'summary': 'Cara menambah dan mengelola produk',
                'content': '''# Manajemen Produk

## Menambah Produk Baru

1. Buka menu **Inventory > Products**
2. Klik tombol **Add Product**
3. Isi informasi produk:
   - Nama produk
   - SKU (kode unik)
   - Kategori
   - Harga beli dan jual
   - Stok awal
4. Klik **Save**

## Edit Produk

1. Cari produk di daftar
2. Klik tombol edit (ikon pensil)
3. Ubah informasi yang diperlukan
4. Klik **Save**

## Hapus Produk

> ⚠️ **Perhatian**: Produk yang sudah digunakan dalam transaksi tidak dapat dihapus.

1. Cari produk di daftar
2. Klik tombol hapus (ikon tempat sampah)
3. Konfirmasi penghapusan
''',
                'order': 1
            },
            {
                'category': 'inventory',
                'title': 'Stock Opname',
                'slug': 'stock-opname',
                'summary': 'Panduan melakukan stock opname',
                'content': '''# Stock Opname

Stock opname adalah proses penghitungan fisik stok untuk memastikan data sistem sesuai dengan kondisi aktual.

## Langkah-langkah

1. Buka menu **Inventory > Stock Opname**
2. Klik **New Stock Opname**
3. Pilih gudang yang akan dihitung
4. Sistem akan menampilkan daftar produk
5. Masukkan jumlah stok aktual
6. Review perbedaan (jika ada)
7. Submit untuk menyesuaikan stok

## Tips

- Lakukan stock opname secara berkala
- Pastikan tidak ada transaksi saat stock opname
- Dokumentasikan perbedaan yang ditemukan
''',
                'order': 2
            },
            # Sales
            {
                'category': 'sales',
                'title': 'Membuat Sales Order',
                'slug': 'create-sales-order',
                'summary': 'Panduan membuat pesanan penjualan',
                'content': '''# Membuat Sales Order

## Langkah-langkah

1. Buka menu **Sales > Orders**
2. Klik **New Order**
3. Pilih customer
4. Tambahkan produk:
   - Klik **Add Item**
   - Pilih produk
   - Masukkan quantity
   - Sesuaikan harga jika perlu
5. Review total
6. Klik **Save** atau **Save & Confirm**

## Status Order

- **Draft** - Order masih bisa diedit
- **Confirmed** - Order sudah dikonfirmasi
- **Delivered** - Barang sudah dikirim
- **Invoiced** - Invoice sudah dibuat
- **Completed** - Transaksi selesai
''',
                'order': 1
            }
        ]
        
        for art_data in articles_data:
            cat = categories.get(art_data.pop('category'))
            if cat:
                article = ManualArticle(category_id=cat.id, **art_data)
                db.session.add(article)
        
        # Create FAQs
        faqs_data = [
            {
                'category': 'getting-started',
                'question': 'Bagaimana cara reset password?',
                'answer': 'Hubungi administrator sistem untuk melakukan reset password. Administrator akan mengirimkan password baru ke email Anda.',
                'order': 1
            },
            {
                'category': 'getting-started',
                'question': 'Apakah saya bisa mengakses sistem dari HP?',
                'answer': 'Ya, sistem ini responsive dan dapat diakses dari perangkat mobile. Namun untuk pengalaman terbaik, disarankan menggunakan desktop atau laptop.',
                'order': 2
            },
            {
                'category': 'inventory',
                'question': 'Bagaimana jika stok menjadi minus?',
                'answer': 'Sistem akan memberikan peringatan jika stok akan menjadi minus. Anda perlu melakukan stock adjustment atau menunggu barang masuk sebelum melanjutkan transaksi.',
                'order': 1
            },
            {
                'category': 'inventory',
                'question': 'Apakah bisa transfer stok antar gudang?',
                'answer': 'Ya, gunakan fitur Stock Transfer di menu Inventory. Pilih gudang asal, gudang tujuan, dan produk yang akan ditransfer.',
                'order': 2
            },
            {
                'category': 'sales',
                'question': 'Bagaimana cara membatalkan order?',
                'answer': 'Order yang masih berstatus Draft dapat dihapus langsung. Untuk order yang sudah Confirmed, hubungi supervisor untuk melakukan pembatalan.',
                'order': 1
            },
            {
                'category': 'finance',
                'question': 'Kapan laporan keuangan diupdate?',
                'answer': 'Laporan keuangan diupdate secara real-time setiap ada transaksi. Anda juga bisa melakukan refresh manual dengan klik tombol Refresh.',
                'order': 1
            }
        ]
        
        for faq_data in faqs_data:
            cat_slug = faq_data.pop('category')
            cat = categories.get(cat_slug)
            faq = ManualFAQ(category_id=cat.id if cat else None, **faq_data)
            db.session.add(faq)
        
        db.session.commit()
        print("✅ Manual data seeded successfully!")
        print(f"   - {len(categories_data)} categories")
        print(f"   - {len(articles_data)} articles")
        print(f"   - {len(faqs_data)} FAQs")

if __name__ == '__main__':
    seed_manual_data()
