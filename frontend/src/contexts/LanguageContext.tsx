import React, { createContext, useContext, useEffect, useState } from 'react'

interface LanguageContextType {
  language: 'id' | 'en'
  setLanguage: (language: 'id' | 'en') => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Translation dictionaries
export const translations = {
  id: {
    // Header & Navigation
    'nav.dashboard': 'Dashboard',
    'nav.products': 'Produk',
    'nav.warehouse': 'Gudang',
    'nav.production': 'Produksi',
    'nav.sales': 'Penjualan',
    'nav.purchasing': 'Pembelian',
    'nav.finance': 'Keuangan',
    'nav.quality': 'Kualitas',
    'nav.mrp': 'MRP',
    'nav.analytics': 'Analitik',
    'nav.settings': 'Pengaturan',
    'nav.reports': 'Laporan',
    'nav.shipping': 'Pengiriman',
    'nav.hr': 'SDM',
    'nav.maintenance': 'Pemeliharaan',
    'nav.rd': 'R&D',
    'nav.waste': 'Limbah',
    'nav.oee': 'OEE',
    'nav.tv_display': 'TV Display',
    
    // Common
    'common.save': 'Simpan',
    'common.cancel': 'Batal',
    'common.edit': 'Edit',
    'common.delete': 'Hapus',
    'common.add': 'Tambah',
    'common.create': 'Buat',
    'common.update': 'Perbarui',
    'common.search': 'Cari',
    'common.filter': 'Filter',
    'common.export': 'Ekspor',
    'common.import': 'Impor',
    'common.loading': 'Memuat...',
    'common.success': 'Berhasil',
    'common.error': 'Error',
    'common.confirmation': 'Konfirmasi',
    'common.yes': 'Ya',
    'common.no': 'Tidak',
    'common.status': 'Status',
    'common.actions': 'Aksi',
    'common.name': 'Nama',
    'common.date': 'Tanggal',
    'common.size': 'Ukuran',
    'common.type': 'Tipe',
    'common.description': 'Deskripsi',
    'common.download': 'Unduh',
    'common.upload': 'Unggah',
    'common.restore': 'Pulihkan',
    'common.backup': 'Cadangan',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.description': 'KPI real-time, analitik, dan wawasan bisnis dengan grafik interaktif',
    'dashboard.welcome': 'Selamat datang di',
    'dashboard.overview': 'Ringkasan Sistem',
    'dashboard.sales_today': 'Penjualan Hari Ini',
    'dashboard.sales_month': 'Penjualan Bulan Ini',
    'dashboard.active_orders': 'Work Order Aktif',
    'dashboard.low_stock': 'Stok Menipis',
    
    // Settings
    'settings.title': 'Pengaturan',
    'settings.subtitle': 'Kelola konfigurasi dan preferensi sistem Anda',
    'settings.company_profile': 'Profil Perusahaan',
    'settings.system_settings': 'Pengaturan Sistem',
    'settings.user_management': 'Manajemen Pengguna',
    'settings.security': 'Keamanan',
    'settings.backup_restore': 'Backup & Restore',
    'settings.notifications': 'Notifikasi',
    'settings.data_import': 'Import Database',
    'settings.system_preferences': 'Preferensi Sistem',
    'settings.language': 'Bahasa',
    'settings.theme': 'Tema',
    'settings.save_changes': 'Simpan Perubahan',
    'settings.saved_success': 'Pengaturan berhasil disimpan!',
    
    // Data Import
    'import.title': 'Import Database',
    'import.subtitle': 'Import data produk, bahan baku, dan stok dari file Excel/CSV',
    'import.products': 'Import Produk',
    'import.materials': 'Import Bahan Baku',
    'import.inventory': 'Import Stok Barang',
    'import.download_template': 'ArrowDownTrayIcon Template',
    'import.choose_file': 'Pilih File',
    'import.upload_file': 'Upload File',
    'import.file_requirements': 'Format file: .xlsx, .csv (Maksimal 10MB)',
    'import.template_description': 'ArrowDownTrayIcon template untuk format yang benar',
    'import.upload_success': 'File berhasil diupload dan diproses!',
    'import.upload_error': 'Gagal mengupload file',
    'import.processing': 'Memproses file...',
    'import.records_imported': 'record berhasil diimport',
    'import.errors_found': 'error ditemukan',
    
    // Products
    'products.title': 'Produk',
    'products.description': 'Katalog produk nonwoven, spesifikasi, BOM, dan alat kalkulator',
    'products.list': 'Daftar Produk',
    'products.add': 'Tambah Produk',
    'products.edit': 'Edit Produk',
    
    // Sales
    'sales.title': 'Penjualan & CRM',
    'sales.description': 'Prospek, peluang, penawaran, pelanggan, pesanan penjualan, aktivitas',
    'sales.activities': 'Aktivitas Penjualan',
    'sales.opportunities': 'Peluang',
    'sales.leads': 'Prospek',
    'sales.customers': 'Pelanggan',
    'sales.new_activity': 'Aktivitas Baru',
    'sales.new_opportunity': 'Peluang Baru',
    'sales.activity_list': 'Daftar Aktivitas',
    'sales.opportunity_list': 'Daftar Peluang',
    'sales.subject': 'Subjek',
    'sales.activity_type': 'Jenis Aktivitas',
    'sales.status': 'Status',
    'sales.priority': 'Prioritas',
    'sales.assigned_to': 'Ditugaskan kepada',
    'sales.start_date': 'Tanggal Mulai',
    'sales.end_date': 'Tanggal Selesai',
    
    // Products
    'products.add_new': 'Tambah Produk Baru',
    'products.product_code': 'Kode Produk',
    'products.product_name': 'Nama Produk',
    'products.price': 'Harga',
    'products.cost': 'Biaya',
    'products.category': 'Kategori',
    'products.material_type': 'Jenis Material',
    'products.stock': 'Stok',
    'products.actions': 'Aksi',
    
    // Finance
    'finance.title': 'Keuangan',
    'finance.description': 'Faktur, hutang/piutang, laporan keuangan, anggaran',
    'finance.dashboard': 'Dashboard Keuangan',
    'finance.revenue': 'Pendapatan',
    'finance.expenses': 'Pengeluaran',
    'finance.profit': 'Keuntungan',
    'finance.cash_flow': 'Arus Kas',
    
    // Warehouse
    'warehouse.title': 'Gudang',
    'warehouse.description': 'Inventori multi-zona, pelacakan stok real-time, pergerakan, lokasi',
    'warehouse.inventory': 'Inventori',
    'warehouse.locations': 'Lokasi',
    'warehouse.zones': 'Zona Gudang',
    'warehouse.stock_level': 'Level Stok',
    'warehouse.dashboard': 'Dashboard Gudang',
    'warehouse.add_location': 'Tambah Lokasi',
    'warehouse.add_zone': 'Tambah Zona',
    
    // Production
    'production.title': 'Produksi',
    'production.description': 'Penjadwalan mesin, work order, catatan produksi, pelacakan efisiensi',
    'production.dashboard': 'Dashboard Produksi',
    'production.scheduling': 'Penjadwalan',
    'production.work_orders': 'Work Order',
    'production.planning': 'Perencanaan',
    'production.capacity': 'Kapasitas',
    'production.efficiency': 'Efisiensi',
    'production.new_work_order': 'Work Order Baru',
    'production.traceability': 'Pelacakan Produksi',
    
    // Purchasing
    'purchasing.title': 'Pembelian',
    'purchasing.description': 'Manajemen supplier, purchase order, evaluasi vendor, pengadaan',
    'purchasing.dashboard': 'Dashboard Pembelian',
    'purchasing.orders': 'Order Pembelian',
    'purchasing.purchase_orders': 'Order Pembelian',
    'purchasing.suppliers': 'Pemasok',
    'purchasing.quotes': 'Penawaran',
    'purchasing.new_po': 'PO Baru',
    'purchasing.vendor_management': 'Manajemen Vendor',
    'purchasing.price_comparison': 'Perbandingan Harga',
    
    // Quality
    'quality.title': 'Kualitas',
    'quality.description': 'Tes kualitas, checklist inspeksi, kepatuhan, pelacakan batch',
    'quality.control': 'Kontrol Kualitas',
    'quality.assurance': 'Jaminan Kualitas',
    'quality.tests': 'Tes Kualitas',
    'quality.inspections': 'Inspeksi',
    'quality.non_conformance': 'Ketidaksesuaian',
    
    // HR (Human Resources)
    'hr.title': 'SDM',
    'hr.description': 'Roster karyawan, penjadwalan shift, absensi, manajemen tenaga kerja',
    'hr.dashboard': 'Dashboard SDM',
    'hr.employees': 'Karyawan',
    'hr.attendance': 'Kehadiran',
    'hr.payroll': 'Penggajian',
    'hr.roster': 'Jadwal Kerja',
    'hr.performance': 'Kinerja',
    'hr.training': 'Pelatihan',
    'hr.recruitment': 'Rekrutmen',
    'hr.leaves': 'Cuti',
    'hr.appraisal': 'Penilaian Kinerja',
    
    // HR Dashboard
    'hr.quick_actions': 'Aksi Cepat',
    'hr.add_employee': 'Tambah Karyawan',
    'hr.mark_attendance': 'Catat Kehadiran',
    'hr.approve_leaves': 'Setujui Cuti',
    'hr.process_payroll': 'Proses Penggajian',
    'hr.total_employees': 'Total Karyawan',
    'hr.present_today': 'Hadir Hari Ini',
    'hr.pending_leaves': 'Cuti Menunggu',
    'hr.active_trainings': 'Pelatihan Aktif',
    
    // Attendance
    'attendance.title': 'Manajemen Kehadiran',
    'attendance.clock_in': 'ClockIcon In',
    'attendance.clock_out': 'ClockIcon Out',
    'attendance.bulk_mark': 'Tandai Massal',
    'attendance.generate_report': 'Buat Laporan',
    'attendance.date': 'Tanggal',
    'attendance.employee': 'Karyawan',
    'attendance.department': 'Departemen',
    'attendance.shift': 'Shift',
    'attendance.status': 'Status',
    'attendance.present': 'Hadir',
    'attendance.absent': 'Tidak Hadir',
    'attendance.late': 'Terlambat',
    'attendance.overtime': 'Lembur',
    'attendance.half_day': 'Setengah Hari',
    
    // Leave Management
    'leave.title': 'Manajemen Cuti',
    'leave.new_request': 'Ajukan Cuti Baru',
    'leave.request_form': 'Form Pengajuan Cuti',
    'leave.employee_name': 'Nama Karyawan',
    'leave.leave_type': 'Jenis Cuti',
    'leave.start_date': 'Tanggal Mulai',
    'leave.end_date': 'Tanggal Selesai',
    'leave.reason': 'Alasan',
    'leave.emergency_contact': 'Kontak Darurat',
    'leave.emergency_phone': 'Telepon Darurat',
    'leave.annual': 'Cuti Tahunan',
    'leave.sick': 'Cuti Sakit',
    'leave.personal': 'Cuti Pribadi',
    'leave.maternity': 'Cuti Melahirkan',
    'leave.unpaid': 'Cuti Tanpa Gaji',
    'leave.approve': 'Setujui',
    'leave.reject': 'Tolak',
    'leave.pending': 'Menunggu',
    'leave.approved': 'Disetujui',
    'leave.rejected': 'Ditolak',
    
    // Payroll
    'payroll.title': 'Manajemen Penggajian',
    'payroll.create_period': 'Buat Periode Gaji',
    'payroll.period_form': 'Form Periode Gaji',
    'payroll.period_name': 'Nama Periode',
    'payroll.start_date': 'Tanggal Mulai',
    'payroll.end_date': 'Tanggal Selesai',
    'payroll.pay_date': 'Tanggal Gaji',
    'payroll.auto_generate': 'Buat Otomatis',
    'payroll.calculate': 'Hitung Gaji',
    'payroll.processing': 'Memproses',
    'payroll.completed': 'Selesai',
    'payroll.locked': 'Terkunci',
    'payroll.draft': 'Draft',
    
    // Appraisal
    'appraisal.title': 'Penilaian Kinerja',
    'appraisal.new_cycle': 'Siklus Penilaian Baru',
    'appraisal.cycle_form': 'Form Siklus Penilaian',
    'appraisal.cycle_name': 'Nama Siklus',
    'appraisal.cycle_type': 'Jenis Siklus',
    'appraisal.annual': 'Tahunan',
    'appraisal.semi_annual': 'Setengah Tahunan',
    'appraisal.quarterly': 'Kuartalan',
    'appraisal.probation': 'Masa Percobaan',
    'appraisal.project_based': 'Berbasis Proyek',
    'appraisal.template': 'Template Penilaian',
    'appraisal.self_review_deadline': 'Batas Waktu Self Review',
    'appraisal.manager_review_deadline': 'Batas Waktu Review Manager',
    'appraisal.cycles': 'Siklus Penilaian',
    'appraisal.employee_appraisals': 'Penilaian Karyawan',
    'appraisal.reports': 'Laporan',
    
    // Training
    'training.title': 'Manajemen Pelatihan',
    'training.new_session': 'Sesi Pelatihan Baru',
    'training.training_report': 'Laporan Pelatihan',
    'training.sessions': 'Sesi Pelatihan',
    'training.programs': 'Program Pelatihan',
    'training.requests': 'Permintaan Pelatihan',
    'training.categories': 'Kategori Pelatihan',
    'training.ongoing': 'Sedang Berlangsung',
    'training.completed': 'Selesai',
    'training.scheduled': 'Terjadwal',
    'training.cancelled': 'Dibatalkan',
    
    // Reports
    'reports.title': 'Laporan & Analitik',
    'reports.subtitle': 'Buat wawasan dan lacak kinerja di semua operasi',
    'reports.all_reports': 'Semua Laporan',
    'reports.human_resources': 'Sumber Daya Manusia',
    'reports.attendance_report': 'Laporan Kehadiran',
    'reports.leave_report': 'Laporan Cuti',
    'reports.payroll_report': 'Laporan Penggajian',
    'reports.appraisal_report': 'Laporan Penilaian Kinerja',
    'reports.training_report': 'Laporan Pelatihan',
    'reports.custom_report': 'Pembuat Laporan Kustom',
    'reports.monthly': 'Bulanan',
    'reports.quarterly': 'Kuartalan',
    'reports.on_demand': 'Sesuai Permintaan',
    'reports.last_generated': 'Terakhir Dibuat',
    'reports.frequency': 'Frekuensi',
    'reports.generate': 'Buat Laporan',
    
    // Auth
    'auth.login': 'Masuk',
    'auth.logout': 'Keluar',
    'auth.register': 'Daftar',
    'auth.login_to_access': 'Masuk untuk Mengakses',
    
    // System
    'system.erp_system': 'Sistem ERP',
    'system.tagline': 'Solusi ERP Lengkap untuk Manufaktur Nonwoven & Produksi Wet Wipes',
    'system.system_users': 'Pengguna Sistem',
    'system.active_modules': 'Modul Aktif',
    'system.total_records': 'Total Data',
    'system.system_uptime': 'Waktu Aktif Sistem',
    'system.modules_features': 'Modul & Fitur Sistem',
    'system.modules_description': 'Modul ERP khusus untuk manufaktur nonwoven, produksi wet wipes, dan operasi manufaktur tissue',
    'system.all_systems_operational': 'Semua Sistem Beroperasi',
    'system.system_offline': 'Sistem Offline',
    'system.status_checking': 'Memeriksa Status Sistem...',
    'system.backend': 'Backend',
    'system.database': 'Database',
    'system.last_update': 'Update Terakhir',
    'system.backend_status': 'Status Backend',
    'system.response_time': 'Waktu Respon',
    'system.ready_to_access': 'Siap mengakses sistem lengkap? Masuk untuk memulai.',
    'system.access_system': 'Akses Sistem',
    'system.all_rights_reserved': 'Semua hak dilindungi',
    'auth.create_account': 'Buat Akun',
    'auth.register_here': 'Daftar Di Sini',
    'auth.back_to_login': 'Kembali ke Login',
    'auth.full_name': 'Nama Lengkap',
    'auth.employee_number': 'Nomor Karyawan',
    'auth.username': 'Nama Pengguna',
    'auth.email': 'Email',
    'auth.password': 'Kata Sandi',
    'auth.confirm_password': 'Konfirmasi Kata Sandi',
    'auth.phone': 'Nomor Telepon',
    'auth.position': 'Posisi',
    'auth.registration_info': 'Informasi Pendaftaran',
    'auth.account_employee_role': 'Akun Anda akan dibuat dengan peran Karyawan',
    'auth.admin_approval_required': 'Persetujuan admin diperlukan sebelum Anda dapat mengakses sistem',
    'auth.email_notification': 'Anda akan menerima notifikasi email setelah disetujui',
    'auth.password_min_length': 'Kata sandi minimal 6 karakter',
    'auth.creating_account': 'Membuat Akun...',
    'auth.already_have_account': 'Sudah punya akun?',
    
    // MRP (Material Requirements Planning)
    'mrp.title': 'MRP',
    'mrp.description': 'Perencanaan material otomatis, peramalan permintaan, saran pengadaan',
    'mrp.planning': 'Perencanaan Material',
    'mrp.requirements': 'Kebutuhan Material',
    'mrp.bom': 'BOM',
    'mrp.explosion': 'Ledakan BOM',
    
    // Analytics
    'analytics.title': 'Analitik',
    'analytics.reports': 'Laporan',
    'analytics.dashboards': 'Dashboard',
    'analytics.kpi': 'KPI',
    'analytics.trends': 'Tren',
    
    // Shipping
    'shipping.title': 'Pengiriman',
    'shipping.description': 'Pemrosesan pengiriman, pelacakan pengiriman, koordinasi logistik',
    'shipping.orders': 'Order Pengiriman',
    'shipping.tracking': 'Pelacakan',
    'shipping.delivery': 'Pengantaran',
    
    // Maintenance
    'maintenance.title': 'Pemeliharaan',
    'maintenance.description': 'Pemeliharaan preventif, monitoring peralatan, penjadwalan perbaikan',
    'maintenance.preventive': 'Pemeliharaan Preventif',
    'maintenance.corrective': 'Pemeliharaan Korektif',
    'maintenance.equipment': 'Peralatan',
    
    // R&D
    'rd.title': 'R&D',
    'rd.projects': 'Proyek R&D',
    'rd.research': 'Penelitian',
    'rd.development': 'Pengembangan',
    
    // Waste Management
    'waste.title': 'Manajemen Limbah',
    'waste.disposal': 'Pembuangan',
    'waste.recycling': 'Daur Ulang',
    'waste.tracking': 'Pelacakan Limbah',
    
    // OEE (Overall Equipment Effectiveness)
    'oee.title': 'OEE',
    'oee.dashboard': 'Dashboard OEE',
    'oee.availability': 'Ketersediaan',
    'oee.performance': 'Kinerja',
    'oee.quality': 'Kualitas',
    
    // Status
    'status.active': 'Aktif',
    'status.inactive': 'Tidak Aktif',
    'status.pending': 'Menunggu',
    'status.approved': 'Disetujui',
    'status.rejected': 'Ditolak',
    'status.completed': 'Selesai',
    'status.cancelled': 'Dibatalkan',
    'status.draft': 'Draft',
    'status.published': 'Dipublikasi',
    
    // Form Fields
    'fields.name': 'Nama',
    'fields.description': 'Deskripsi',
    'fields.code': 'Kode',
    'fields.status': 'Status',
    'fields.date': 'Tanggal',
    'fields.amount': 'Jumlah',
    'fields.quantity': 'Kuantitas',
    'fields.price': 'Harga',
    'fields.total': 'Total',
    'fields.remarks': 'Catatan',
    'fields.created_at': 'Dibuat pada',
    'fields.updated_at': 'Diperbarui pada',
    'fields.created_by': 'Dibuat oleh',
    
    // Actions
    'actions.view': 'Lihat',
    'actions.edit': 'Edit',
    'actions.delete': 'Hapus',
    'actions.confirm': 'Konfirmasi',
    'actions.cancel': 'Batal',
    'actions.save': 'Simpan',
    'actions.submit': 'Kirim',
    'actions.reset': 'Reset',
    'actions.clear': 'Bersihkan',
    
    // Company
    'company.name': 'PT. Gratia Makmur Sentosa',
    'company.tagline': 'Sistem ERP Manufaktur Nonwoven',
    
    // Comprehensive Module Translations
    
    // Dashboard Extended
    'dashboard.system_status': 'Status Sistem',
    'dashboard.recent_activities': 'Aktivitas Terbaru',
    'dashboard.quick_stats': 'Statistik Cepat',
    'dashboard.alerts': 'Peringatan',
    'dashboard.notifications': 'Notifikasi',
    'dashboard.performance_metrics': 'Metrik Kinerja',
    
    // Products Extended
    'products.categories': 'Kategori Produk',
    'products.materials': 'Bahan Baku',
    'products.specifications': 'Spesifikasi',
    'products.quality_standards': 'Standar Kualitas',
    'products.pricing': 'Penetapan Harga',
    'products.inventory_levels': 'Level Inventori',
    'products.product_lifecycle': 'Siklus Hidup Produk',
    'products.bom': 'BOM',
    'products.routing': 'Routing Produksi',
    
    // Warehouse Extended
    'warehouse.receiving': 'Penerimaan Barang',
    'warehouse.picking': 'Pengambilan Barang',
    'warehouse.packing': 'Pengemasan',
    'warehouse.shipping': 'Pengiriman',
    'warehouse.cycle_counting': 'Perhitungan Siklus',
    'warehouse.adjustments': 'Penyesuaian Stok',
    'warehouse.transfers': 'Transfer Antar Gudang',
    'warehouse.layout': 'Tata Letak Gudang',
    'warehouse.optimization': 'Optimasi Gudang',
    'warehouse.kpi': 'KPI Gudang',
    
    // Production Extended
    'production.machines': 'Mesin Produksi',
    'production.operators': 'Operators',
    'production.shifts': 'Shift Kerja',
    'production.downtime': 'Waktu Henti',
    'production.quality_control': 'Kontrol Kualitas',
    'production.material_consumption': 'Konsumsi Material',
    'production.waste_tracking': 'Pelacakan Limbah',
    'production.performance_analysis': 'Analisis Kinerja',
    'production.maintenance_schedule': 'Jadwal Pemeliharaan',
    'production.input': 'Input Produksi',
    'production.output': 'Output Produksi',
    'production.yield': 'Hasil Produksi',
    
    // Sales Extended
    'sales.crm': 'Manajemen Hubungan Pelanggan',
    'sales.pipeline': 'Pipeline Penjualan',
    'sales.forecasting': 'Peramalan Penjualan',
    'sales.quotations': 'Penawaran Harga',
    'sales.orders': 'Pesanan Penjualan',
    'sales.invoicing': 'Faktur Penjualan',
    'sales.payments': 'Pembayaran',
    'sales.returns': 'Retur Penjualan',
    'sales.commissions': 'Komisi Penjualan',
    'sales.territories': 'Wilayah Penjualan',
    'sales.campaigns': 'Kampanye Penjualan',
    
    // Purchasing Extended
    'purchasing.rfq': 'Permintaan Penawaran',
    'purchasing.vendor_evaluation': 'Evaluasi Vendor',
    'purchasing.contracts': 'Kontrak Pembelian',
    'purchasing.receiving': 'Penerimaan Barang',
    'purchasing.invoice_matching': 'Pencocokan Faktur',
    'purchasing.payment_terms': 'Syarat Pembayaran',
    'purchasing.quality_inspection': 'Inspeksi Kualitas',
    'purchasing.supplier_performance': 'Kinerja Pemasok',
    'purchasing.cost_analysis': 'Analisis Biaya',
    
    // Finance Extended
    'finance.accounting': 'Akuntansi',
    'finance.budgeting': 'Penganggaran',
    'finance.cost_accounting': 'Akuntansi Biaya',
    'finance.financial_reporting': 'Pelaporan Keuangan',
    'finance.accounts_receivable': 'Piutang Usaha',
    'finance.accounts_payable': 'Hutang Usaha',
    'finance.general_ledger': 'Buku Besar',
    'finance.journal_entries': 'Jurnal Entri',
    'finance.bank_reconciliation': 'Rekonsiliasi Bank',
    'finance.tax_management': 'Manajemen Pajak',
    'finance.asset_management': 'Manajemen Aset',
    'finance.depreciation': 'Depresiasi',
    'finance.cost_centers': 'Pusat Biaya',
    'finance.profit_centers': 'Pusat Laba',
    
    // Quality Extended
    'quality.spc': 'Kontrol Proses Statistik',
    'quality.calibration': 'Kalibrasi',
    'quality.certifications': 'Sertifikasi',
    'quality.audits': 'Audit Kualitas',
    'quality.corrective_actions': 'Tindakan Korektif',
    'quality.preventive_actions': 'Tindakan Preventif',
    'quality.customer_complaints': 'Keluhan Pelanggan',
    'quality.supplier_quality': 'Kualitas Pemasok',
    'quality.quality_metrics': 'Metrik Kualitas',
    'quality.quality_planning': 'Perencanaan Kualitas',
    
    // HR Extended
    'hr.employee_management': 'Manajemen Karyawan',
    'hr.organizational_chart': 'Bagan Organisasi',
    'hr.job_descriptions': 'Deskripsi Pekerjaan',
    'hr.competency_management': 'Manajemen Kompetensi',
    'hr.succession_planning': 'Perencanaan Suksesi',
    'hr.disciplinary_actions': 'Tindakan Disiplin',
    'hr.exit_interviews': 'Wawancara Keluar',
    'hr.employee_surveys': 'Survei Karyawan',
    'hr.benefits_administration': 'Administrasi Tunjangan',
    'hr.time_tracking': 'Pelacakan Waktu',
    'hr.shift_management': 'Manajemen Shift',
    'hr.overtime_management': 'Manajemen Lembur',
    
    // Maintenance Extended
    'maintenance.work_orders': 'Work Order Pemeliharaan',
    'maintenance.asset_register': 'Register Aset',
    'maintenance.spare_parts': 'Suku Cadang',
    'maintenance.maintenance_costs': 'Biaya Pemeliharaan',
    'maintenance.reliability_analysis': 'Analisis Keandalan',
    'maintenance.failure_analysis': 'Analisis Kegagalan',
    'maintenance.maintenance_kpi': 'KPI Pemeliharaan',
    'maintenance.vendor_management': 'Manajemen Vendor',
    'maintenance.warranty_tracking': 'Pelacakan Garansi',
    
    // R&D Extended
    'rd.innovation_management': 'Manajemen Inovasi',
    'rd.product_development': 'Pengembangan Produk',
    'rd.prototype_testing': 'Pengujian Prototipe',
    'rd.intellectual_property': 'Kekayaan Intelektual',
    'rd.collaboration': 'Kolaborasi R&D',
    'rd.budget_tracking': 'Pelacakan Anggaran',
    'rd.milestone_management': 'Manajemen Milestone',
    'rd.technology_roadmap': 'Roadmap Teknologi',
    'rd.patent_management': 'Manajemen Paten',
    
    // OEE Extended
    'oee.overall_effectiveness': 'Efektivitas Keseluruhan Peralatan',
    'oee.availability_rate': 'Tingkat Ketersediaan',
    'oee.performance_rate': 'Tingkat Kinerja',
    'oee.quality_rate': 'Tingkat Kualitas',
    'oee.downtime_analysis': 'Analisis Waktu Henti',
    'oee.efficiency_improvement': 'Peningkatan Efisiensi',
    'oee.benchmarking': 'Benchmarking',
    'oee.trend_analysis': 'Analisis Tren',
    'oee.alerts_management': 'Manajemen Peringatan',
    
    // Waste Management Extended
    'waste.waste_streams': 'Aliran Limbah',
    'waste.environmental_compliance': 'Kepatuhan Lingkungan',
    'waste.cost_reduction': 'Pengurangan Biaya',
    'waste.sustainability_metrics': 'Metrik Keberlanjutan',
    'waste.waste_minimization': 'Minimisasi Limbah',
    'waste.circular_economy': 'Ekonomi Sirkular',
    
    // MRP Extended
    'mrp.demand_planning': 'Perencanaan Permintaan',
    'mrp.capacity_planning': 'Perencanaan Kapasitas',
    'mrp.master_schedule': 'Jadwal Induk',
    'mrp.material_planning': 'Perencanaan Material',
    'mrp.procurement_planning': 'Perencanaan Pengadaan',
    'mrp.inventory_optimization': 'Optimasi Inventori',
    
    // Analytics Extended
    'analytics.business_intelligence': 'Intelijen Bisnis',
    'analytics.predictive_analytics': 'Analitik Prediktif',
    'analytics.data_visualization': 'Visualisasi Data',
    'analytics.performance_dashboards': 'Dashboard Kinerja',
    'analytics.custom_reports': 'Laporan Kustom',
    'analytics.data_mining': 'Penambangan Data',
    
    // Shipping Extended
    'shipping.logistics': 'Logistik',
    'shipping.carrier_management': 'Manajemen Kurir',
    'shipping.freight_management': 'Manajemen Angkutan',
    'shipping.delivery_scheduling': 'Penjadwalan Pengiriman',
    'shipping.tracking_visibility': 'Visibilitas Pelacakan',
    'shipping.cost_optimization': 'Optimasi Biaya',
    
    // System Administration
    'admin.user_roles': 'Peran Pengguna',
    'admin.permissions': 'Izin Akses',
    'admin.audit_trail': 'Jejak Audit',
    'admin.system_configuration': 'Konfigurasi Sistem',
    'admin.data_backup': 'Backup Data',
    'admin.system_monitoring': 'Monitoring Sistem',
    'admin.integration_management': 'Manajemen Integrasi',
    
    // Common UI Elements
    'ui.loading': 'Memuat...',
    'ui.saving': 'Menyimpan...',
    'ui.processing': 'Memproses...',
    'ui.please_wait': 'Mohon tunggu...',
    'ui.no_data': 'Tidak ada data',
    'ui.error_occurred': 'Terjadi kesalahan',
    'ui.try_again': 'Coba lagi',
    'ui.refresh': 'Segarkan',
    'ui.close': 'Tutup',
    'ui.open': 'Buka',
    'ui.expand': 'Perluas',
    'ui.collapse': 'Tutup',
    'ui.select_all': 'Pilih Semua',
    'ui.clear_all': 'Hapus Semua',
    'ui.apply': 'Terapkan',
    'ui.reset': 'Reset',
    'ui.previous': 'Sebelumnya',
    'ui.next': 'Selanjutnya',
    'ui.first': 'Pertama',
    'ui.last': 'Terakhir',
    'ui.page': 'Halaman',
    'ui.of': 'dari',
    'ui.items': 'item',
    'ui.showing': 'Menampilkan',
    'ui.to': 'sampai',
    'ui.total': 'Total',
    
    // Date and Time
    'date.today': 'Hari ini',
    'date.yesterday': 'Kemarin',
    'date.tomorrow': 'Besok',
    'date.this_week': 'Minggu ini',
    'date.last_week': 'Minggu lalu',
    'date.next_week': 'Minggu depan',
    'date.this_month': 'Bulan ini',
    'date.last_month': 'Bulan lalu',
    'date.next_month': 'Bulan depan',
    'date.this_year': 'Tahun ini',
    'date.last_year': 'Tahun lalu',
    'date.next_year': 'Tahun depan',
    
    // Validation Messages
    'validation.required': 'Field ini wajib diisi',
    'validation.invalid_email': 'Format email tidak valid',
    'validation.min_length': 'Minimal {min} karakter',
    'validation.max_length': 'Maksimal {max} karakter',
    'validation.invalid_number': 'Harus berupa angka',
    'validation.invalid_date': 'Format tanggal tidak valid',
    'validation.passwords_not_match': 'Password tidak cocok',
    
    // Success Messages
    'success.saved': 'Data berhasil disimpan',
    'success.updated': 'Data berhasil diperbarui',
    'success.deleted': 'Data berhasil dihapus',
    'success.created': 'Data berhasil dibuat',
    'success.imported': 'Data berhasil diimpor',
    'success.exported': 'Data berhasil diekspor',
    'success.sent': 'Berhasil dikirim',
    'success.approved': 'Berhasil disetujui',
    'success.rejected': 'Berhasil ditolak',
    
    // Error Messages
    'error.save_failed': 'Gagal menyimpan data',
    'error.update_failed': 'Gagal memperbarui data',
    'error.delete_failed': 'Gagal menghapus data',
    'error.create_failed': 'Gagal membuat data',
    'error.import_failed': 'Gagal mengimpor data',
    'error.export_failed': 'Gagal mengekspor data',
    'error.network_error': 'Kesalahan jaringan',
    'error.server_error': 'Kesalahan server',
    'error.unauthorized': 'Tidak memiliki akses',
    'error.forbidden': 'Akses ditolak',
    'error.not_found': 'Data tidak ditemukan',
    
    // Confirmation Messages
    'confirm.delete': 'Apakah Anda yakin ingin menghapus data ini?',
    'confirm.save': 'Apakah Anda yakin ingin menyimpan perubahan?',
    'confirm.cancel': 'Apakah Anda yakin ingin membatalkan?',
    'confirm.logout': 'Apakah Anda yakin ingin keluar?',
    'confirm.discard_changes': 'Apakah Anda yakin ingin membuang perubahan?'
  },
  en: {
    // Header & Navigation  
    'nav.dashboard': 'Dashboard',
    'nav.products': 'Products',
    'nav.warehouse': 'Warehouse',
    'nav.production': 'Production',
    'nav.sales': 'Sales',
    'nav.purchasing': 'Purchasing', 
    'nav.finance': 'Finance',
    'nav.quality': 'Quality',
    'nav.mrp': 'MRP',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    'nav.reports': 'Reports',
    'nav.shipping': 'Shipping',
    'nav.hr': 'HR',
    'nav.maintenance': 'Maintenance',
    'nav.rd': 'R&D',
    'nav.waste': 'Waste',
    'nav.oee': 'OEE',
    'nav.tv_display': 'TV Display',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel', 
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.add': 'Add',
    'common.create': 'Create',
    'common.update': 'Update',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.loading': 'Loading...',
    'common.success': 'Success',
    'common.error': 'Error',
    'common.confirmation': 'Confirmation',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.status': 'Status',
    'common.actions': 'Actions',
    'common.name': 'Name',
    'common.date': 'Date',
    'common.size': 'Size',
    'common.type': 'Type',
    'common.description': 'Description',
    'common.download': 'Download',
    'common.upload': 'Upload',
    'common.restore': 'Restore',
    'common.backup': 'Backup',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.description': 'Real-time KPIs, analytics, and business insights with interactive charts',
    'dashboard.welcome': 'Welcome to',
    'dashboard.overview': 'System Overview',
    'dashboard.sales_today': 'Sales Today',
    'dashboard.sales_month': 'Sales This Month',
    'dashboard.active_orders': 'Active Work Orders',
    'dashboard.low_stock': 'Low Stock Items',
    
    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your system configuration and preferences',
    'settings.company_profile': 'Company Profile',
    'settings.system_settings': 'System Settings',
    'settings.user_management': 'User Management', 
    'settings.security': 'Security',
    'settings.backup_restore': 'Backup & Restore',
    'settings.notifications': 'Notifications',
    'settings.data_import': 'Database Import',
    'settings.system_preferences': 'System Preferences',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.save_changes': 'Save Changes',
    'settings.saved_success': 'Settings saved successfully!',
    
    // Data Import
    'import.title': 'Database Import',
    'import.subtitle': 'Import products, raw materials, and inventory data from Excel/CSV files',
    'import.products': 'Import Products',
    'import.materials': 'Import Raw Materials',
    'import.inventory': 'Import Inventory',
    'import.download_template': 'ArrowDownTrayIcon Template',
    'import.choose_file': 'Choose File',
    'import.upload_file': 'Upload File',
    'import.file_requirements': 'File format: .xlsx, .csv (Max 10MB)',
    'import.template_description': 'ArrowDownTrayIcon template for correct format',
    'import.upload_success': 'File uploaded and processed successfully!',
    'import.upload_error': 'Failed to upload file',
    'import.processing': 'Processing file...',
    'import.records_imported': 'records imported successfully',
    'import.errors_found': 'errors found',
    
    // Products
    'products.title': 'Products',
    'products.description': 'Nonwoven products catalog, specifications, BOM, and calculator tools',
    'products.list': 'Product List',
    'products.add': 'Add Product',
    'products.edit': 'Edit Product',
    
    // Sales
    'sales.title': 'Sales & CRM',
    'sales.description': 'Leads, opportunities, quotations, customers, sales orders, activities',
    'sales.activities': 'Sales Activities',
    'sales.opportunities': 'Opportunities', 
    'sales.leads': 'Leads',
    'sales.customers': 'Customers',
    'sales.new_activity': 'New Activity',
    'sales.new_opportunity': 'New Opportunity',
    'sales.activity_list': 'Activity List',
    'sales.opportunity_list': 'Opportunity List',
    'sales.subject': 'Subject',
    'sales.activity_type': 'Activity Type',
    'sales.status': 'Status',
    'sales.priority': 'Priority',
    'sales.assigned_to': 'Assigned To',
    'sales.start_date': 'Start Date',
    'sales.end_date': 'End Date',
    
    // Products
    'products.add_new': 'Add New Product',
    'products.product_code': 'Product Code',
    'products.product_name': 'Product Name',
    'products.price': 'Price',
    'products.cost': 'Cost',
    'products.category': 'Category',
    'products.material_type': 'Material Type',
    'products.stock': 'Stock',
    'products.actions': 'Actions',
    
    // Finance
    'finance.title': 'Finance',
    'finance.description': 'Invoicing, accounts payable/receivable, financial reporting, budgets',
    'finance.dashboard': 'Finance Dashboard',
    'finance.revenue': 'Revenue',
    'finance.expenses': 'Expenses',
    'finance.profit': 'Profit',
    'finance.cash_flow': 'Cash Flow',
    
    // Warehouse
    'warehouse.title': 'Warehouse',
    'warehouse.description': 'Multi-zone inventory, real-time stock tracking, movements, locations',
    'warehouse.inventory': 'Inventory',
    'warehouse.locations': 'Locations',
    'warehouse.zones': 'Warehouse Zones',
    'warehouse.stock_level': 'Stock Level',
    'warehouse.dashboard': 'Warehouse Dashboard',
    'warehouse.add_location': 'Add Location',
    'warehouse.add_zone': 'Add Zone',
    
    // Production
    'production.title': 'Production',
    'production.description': 'Machine scheduling, work orders, production records, efficiency tracking',
    'production.dashboard': 'Production Dashboard',
    'production.scheduling': 'Scheduling',
    'production.work_orders': 'Work Orders',
    'production.planning': 'Planning',
    'production.capacity': 'Capacity',
    'production.efficiency': 'Efficiency',
    'production.new_work_order': 'New Work Order',
    'production.traceability': 'Production Traceability',
    
    // Purchasing
    'purchasing.title': 'Purchasing',
    'purchasing.description': 'Supplier management, purchase orders, vendor evaluation, procurement',
    'purchasing.dashboard': 'Purchasing Dashboard',
    'purchasing.orders': 'Purchase Orders',
    'purchasing.purchase_orders': 'Purchase Orders',
    'purchasing.suppliers': 'Suppliers',
    'purchasing.quotes': 'Quotes',
    'purchasing.new_po': 'New PO',
    'purchasing.vendor_management': 'Vendor Management',
    'purchasing.price_comparison': 'Price Comparison',
    
    // Quality
    'quality.title': 'Quality',
    'quality.description': 'Quality tests, inspection checklists, compliance, batch tracking',
    'quality.control': 'Quality Control',
    'quality.assurance': 'Quality Assurance',
    'quality.tests': 'Quality Tests',
    
// HR (Human Resources)
'hr.title': 'HR',
'hr.description': 'Employee roster, shift scheduling, attendance, workforce management',
'hr.dashboard': 'HR Dashboard',
'hr.attendance': 'Attendance',
'hr.payroll': 'Payroll',
'hr.roster': 'Work Roster',
'hr.performance': 'Performance',
'hr.training': 'Training',
'hr.recruitment': 'Recruitment',
    
    // Auth
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.register': 'Register',
    'auth.login_to_access': 'Login to Access',
    
    // System
    'system.erp_system': 'ERP System',
    'system.tagline': 'Complete ERP Solution for Nonwoven Manufacturing & Wet Wipes Production',
    'system.system_users': 'System UsersIcon',
    'system.active_modules': 'Active Modules',
    'system.total_records': 'Total Records',
    'system.system_uptime': 'System Uptime',
    'system.modules_features': 'System Modules & Features',
    'system.modules_description': 'Specialized ERP modules designed for nonwoven manufacturing, wet wipes production, and tissue manufacturing operations',
    'system.all_systems_operational': 'All Systems Operational',
    'system.system_offline': 'System Offline',
    'system.status_checking': 'System Status Checking...',
    'system.backend': 'Backend',
    'system.database': 'Database',
    'system.last_update': 'Last Update',
    'system.backend_status': 'Backend Status',
    'system.response_time': 'Response Time',
    'system.ready_to_access': 'Ready to access the full system? Login to get started.',
    'system.access_system': 'Access System',
    'system.all_rights_reserved': 'All rights reserved',
    
    // MRP (Material Requirements Planning)
    'mrp.title': 'MRP',
    'mrp.description': 'Automated material planning, demand forecasting, procurement suggestions',
    'mrp.planning': 'Material Planning',
    'mrp.requirements': 'Material Requirements',
    'mrp.bom': 'BOM',
    'mrp.explosion': 'BOM Explosion',
    
    // Analytics
    'analytics.title': 'Analytics',
    'analytics.reports': 'Reports',
    'analytics.dashboards': 'Dashboards',
    'analytics.kpi': 'KPI',
    'analytics.trends': 'Trends',
    
    // Shipping
    'shipping.title': 'Shipping',
    'shipping.description': 'Shipment processing, delivery tracking, logistics coordination',
    'shipping.orders': 'Shipping Orders',
    'shipping.tracking': 'Tracking',
    'shipping.delivery': 'Delivery',
    
    // Maintenance
    'maintenance.title': 'Maintenance',
    'maintenance.description': 'Preventive maintenance, equipment monitoring, repair scheduling',
    'maintenance.preventive': 'Preventive Maintenance',
    'maintenance.corrective': 'Corrective Maintenance',
    'maintenance.equipment': 'Equipment',
    
    // R&D
    'rd.title': 'R&D',
    'rd.projects': 'R&D Projects',
    'rd.research': 'Research',
    'rd.development': 'Development',
    
    // Waste Management
    'waste.title': 'Waste Management',
    'waste.disposal': 'Disposal',
    'waste.recycling': 'Recycling',
    'waste.tracking': 'Waste Tracking',
    
    // OEE (Overall Equipment Effectiveness)
    'oee.title': 'OEE',
    'oee.dashboard': 'OEE Dashboard',
    'oee.availability': 'Availability',
    'oee.performance': 'Performance',
    'oee.quality': 'Quality',
    
    // Status
    'status.active': 'Active',
    'status.inactive': 'Inactive',
    'status.pending': 'Pending',
    'status.approved': 'Approved',
    'status.rejected': 'Rejected',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',
    'status.draft': 'Draft',
    'status.published': 'Published',
    
    // Form Fields
    'fields.name': 'Name',
    'fields.description': 'Description',
    'fields.code': 'Code',
    'fields.status': 'Status',
    'fields.date': 'Date',
    'fields.amount': 'Amount',
    'fields.quantity': 'Quantity',
    'fields.price': 'Price',
    'fields.total': 'Total',
    'fields.remarks': 'Remarks',
    'fields.created_at': 'Created At',
    'fields.updated_at': 'Updated At',
    'fields.created_by': 'Created By',
    
    // Actions
    'actions.view': 'View',
    'actions.edit': 'Edit',
    'actions.delete': 'Delete',
    'actions.confirm': 'Confirm',
    'actions.cancel': 'Cancel',
    'actions.save': 'Save',
    'actions.submit': 'Submit',
    'actions.reset': 'Reset',
    'actions.clear': 'Clear',
    
    // Company
    'company.name': 'PT. Gratia Makmur Sentosa',
    'company.tagline': 'Nonwoven Manufacturing ERP System',
    
    // Comprehensive Module Translations
    
    // Dashboard Extended
    'dashboard.system_status': 'System Status',
    'dashboard.recent_activities': 'Recent Activities',
    'dashboard.quick_stats': 'Quick Stats',
    'dashboard.alerts': 'Alerts',
    'dashboard.notifications': 'Notifications',
    'dashboard.performance_metrics': 'Performance Metrics',
    
    // Products Extended
    'products.categories': 'Product Categories',
    'products.materials': 'Raw Materials',
    'products.specifications': 'Specifications',
    'products.quality_standards': 'Quality Standards',
    'products.pricing': 'Pricing',
    'products.inventory_levels': 'Inventory Levels',
    'products.product_lifecycle': 'Product Lifecycle',
    'products.bom': 'BOM',
    'products.routing': 'Production Routing',
    
    // Warehouse Extended
    'warehouse.receiving': 'Receiving',
    'warehouse.picking': 'Picking',
    'warehouse.packing': 'Packing',
    'warehouse.shipping': 'Shipping',
    'warehouse.cycle_counting': 'Cycle Counting',
    'warehouse.adjustments': 'Stock Adjustments',
    'warehouse.transfers': 'Inter-warehouse Transfers',
    'warehouse.layout': 'Warehouse Layout',
    'warehouse.optimization': 'Warehouse Optimization',
    'warehouse.kpi': 'Warehouse KPIs',
    
    // Production Extended
    'production.machines': 'Production Machines',
    'production.operators': 'Operators',
    'production.shifts': 'Work Shifts',
    'production.downtime': 'Downtime',
    'production.quality_control': 'Quality Control',
    'production.material_consumption': 'Material Consumption',
    'production.waste_tracking': 'Waste Tracking',
    'production.performance_analysis': 'Performance Analysis',
    'production.maintenance_schedule': 'Maintenance Schedule',
    'production.input': 'Production Input',
    'production.output': 'Production Output',
    'production.yield': 'Production Yield',
    
    // Sales Extended
    'sales.crm': 'Customer Relationship Management',
    'sales.pipeline': 'Sales Pipeline',
    'sales.forecasting': 'Sales Forecasting',
    'sales.quotations': 'Quotations',
    'sales.orders': 'Sales Orders',
    'sales.invoicing': 'Invoicing',
    'sales.payments': 'Payments',
    'sales.returns': 'Sales Returns',
    'sales.commissions': 'Sales Commissions',
    'sales.territories': 'Sales Territories',
    'sales.campaigns': 'Sales Campaigns',
    
    // Purchasing Extended
    'purchasing.rfq': 'Request for Quotation',
    'purchasing.vendor_evaluation': 'Vendor Evaluation',
    'purchasing.contracts': 'Purchase Contracts',
    'purchasing.receiving': 'Goods Receiving',
    'purchasing.invoice_matching': 'Invoice Matching',
    'purchasing.payment_terms': 'Payment Terms',
    'purchasing.quality_inspection': 'Quality Inspection',
    'purchasing.supplier_performance': 'Supplier Performance',
    'purchasing.cost_analysis': 'Cost Analysis',
    
    // Finance Extended
    'finance.accounting': 'Accounting',
    'finance.budgeting': 'Budgeting',
    'finance.cost_accounting': 'Cost Accounting',
    'finance.financial_reporting': 'Financial Reporting',
    'finance.accounts_receivable': 'Accounts Receivable',
    'finance.accounts_payable': 'Accounts Payable',
    'finance.general_ledger': 'General Ledger',
    'finance.journal_entries': 'Journal Entries',
    'finance.bank_reconciliation': 'Bank Reconciliation',
    'finance.tax_management': 'Tax Management',
    'finance.asset_management': 'Asset Management',
    'finance.depreciation': 'Depreciation',
    'finance.cost_centers': 'Cost Centers',
    'finance.profit_centers': 'Profit Centers',
    
    // Quality Extended
    'quality.spc': 'Statistical Process Control',
    'quality.calibration': 'Calibration',
    'quality.certifications': 'Certifications',
    'quality.audits': 'Quality Audits',
    'quality.corrective_actions': 'Corrective Actions',
    'quality.preventive_actions': 'Preventive Actions',
    'quality.customer_complaints': 'Customer Complaints',
    'quality.supplier_quality': 'Supplier Quality',
    'quality.quality_metrics': 'Quality Metrics',
    'quality.quality_planning': 'Quality Planning',
    
    // HR Extended
    'hr.employee_management': 'Employee Management',
    'hr.organizational_chart': 'Organizational Chart',
    'hr.job_descriptions': 'Job Descriptions',
    'hr.competency_management': 'Competency Management',
    'hr.succession_planning': 'Succession Planning',
    'hr.disciplinary_actions': 'Disciplinary Actions',
    'hr.exit_interviews': 'Exit Interviews',
    'hr.employee_surveys': 'Employee Surveys',
    'hr.benefits_administration': 'Benefits Administration',
    'hr.time_tracking': 'Time Tracking',
    'hr.shift_management': 'Shift Management',
    'hr.overtime_management': 'Overtime Management',
    
    // Maintenance Extended
    'maintenance.work_orders': 'Maintenance Work Orders',
    'maintenance.asset_register': 'Asset Register',
    'maintenance.spare_parts': 'Spare Parts',
    'maintenance.maintenance_costs': 'Maintenance Costs',
    'maintenance.reliability_analysis': 'Reliability Analysis',
    'maintenance.failure_analysis': 'Failure Analysis',
    'maintenance.maintenance_kpi': 'Maintenance KPIs',
    'maintenance.vendor_management': 'Vendor Management',
    'maintenance.warranty_tracking': 'Warranty Tracking',
    
    // R&D Extended
    'rd.innovation_management': 'Innovation Management',
    'rd.product_development': 'Product Development',
    'rd.prototype_testing': 'Prototype Testing',
    'rd.intellectual_property': 'Intellectual Property',
    'rd.collaboration': 'R&D Collaboration',
    'rd.budget_tracking': 'Budget Tracking',
    'rd.milestone_management': 'Milestone Management',
    'rd.technology_roadmap': 'Technology Roadmap',
    'rd.patent_management': 'Patent Management',
    
    // OEE Extended
    'oee.overall_effectiveness': 'Overall Equipment Effectiveness',
    'oee.availability_rate': 'Availability Rate',
    'oee.performance_rate': 'Performance Rate',
    'oee.quality_rate': 'Quality Rate',
    'oee.downtime_analysis': 'Downtime Analysis',
    'oee.efficiency_improvement': 'Efficiency Improvement',
    'oee.benchmarking': 'Benchmarking',
    'oee.trend_analysis': 'Trend Analysis',
    'oee.alerts_management': 'Alerts Management',
    
    // Waste Management Extended
    'waste.waste_streams': 'Waste Streams',
    'waste.environmental_compliance': 'Environmental Compliance',
    'waste.cost_reduction': 'Cost Reduction',
    'waste.sustainability_metrics': 'Sustainability Metrics',
    'waste.waste_minimization': 'Waste Minimization',
    'waste.circular_economy': 'Circular Economy',
    
    // MRP Extended
    'mrp.demand_planning': 'Demand Planning',
    'mrp.capacity_planning': 'Capacity Planning',
    'mrp.master_schedule': 'Master Schedule',
    'mrp.material_planning': 'Material Planning',
    'mrp.procurement_planning': 'Procurement Planning',
    'mrp.inventory_optimization': 'Inventory Optimization',
    
    // Analytics Extended
    'analytics.business_intelligence': 'Business Intelligence',
    'analytics.predictive_analytics': 'Predictive Analytics',
    'analytics.data_visualization': 'Data Visualization',
    'analytics.performance_dashboards': 'Performance Dashboards',
    'analytics.custom_reports': 'Custom Reports',
    'analytics.data_mining': 'Data Mining',
    
    // Shipping Extended
    'shipping.logistics': 'Logistics',
    'shipping.carrier_management': 'Carrier Management',
    'shipping.freight_management': 'Freight Management',
    'shipping.delivery_scheduling': 'Delivery Scheduling',
    'shipping.tracking_visibility': 'Tracking Visibility',
    'shipping.cost_optimization': 'Cost Optimization',
    
    // System Administration
    'admin.user_roles': 'User Roles',
    'admin.permissions': 'Permissions',
    'admin.audit_trail': 'Audit Trail',
    'admin.system_configuration': 'System Configuration',
    'admin.data_backup': 'Data Backup',
    'admin.system_monitoring': 'System Monitoring',
    'admin.integration_management': 'Integration Management',
    
    // Common UI Elements
    'ui.loading': 'Loading...',
    'ui.saving': 'Saving...',
    'ui.processing': 'Processing...',
    'ui.please_wait': 'Please wait...',
    'ui.no_data': 'No data available',
    'ui.error_occurred': 'An error occurred',
    'ui.try_again': 'Try again',
    'ui.refresh': 'Refresh',
    'ui.close': 'Close',
    'ui.open': 'Open',
    'ui.expand': 'Expand',
    'ui.collapse': 'Collapse',
    'ui.select_all': 'Select All',
    'ui.clear_all': 'Clear All',
    'ui.apply': 'Apply',
    'ui.reset': 'Reset',
    'ui.previous': 'Previous',
    'ui.next': 'Next',
    'ui.first': 'First',
    'ui.last': 'Last',
    'ui.page': 'Page',
    'ui.of': 'of',
    'ui.items': 'items',
    'ui.showing': 'Showing',
    'ui.to': 'to',
    'ui.total': 'Total',
    
    // Date and Time
    'date.today': 'Today',
    'date.yesterday': 'Yesterday',
    'date.tomorrow': 'Tomorrow',
    'date.this_week': 'This Week',
    'date.last_week': 'Last Week',
    'date.next_week': 'Next Week',
    'date.this_month': 'This Month',
    'date.last_month': 'Last Month',
    'date.next_month': 'Next Month',
    'date.this_year': 'This Year',
    'date.last_year': 'Last Year',
    'date.next_year': 'Next Year',
    
    // Validation Messages
    'validation.required': 'This field is required',
    'validation.invalid_email': 'Invalid email format',
    'validation.min_length': 'Minimum {min} characters',
    'validation.max_length': 'Maximum {max} characters',
    'validation.invalid_number': 'Must be a number',
    'validation.invalid_date': 'Invalid date format',
    'validation.passwords_not_match': 'Passwords do not match',
    
    // Success Messages
    'success.saved': 'Data saved successfully',
    'success.updated': 'Data updated successfully',
    'success.deleted': 'Data deleted successfully',
    'success.created': 'Data created successfully',
    'success.imported': 'Data imported successfully',
    'success.exported': 'Data exported successfully',
    'success.sent': 'Sent successfully',
    'success.approved': 'Approved successfully',
    'success.rejected': 'Rejected successfully',
    
    // Error Messages
    'error.save_failed': 'Failed to save data',
    'error.update_failed': 'Failed to update data',
    'error.delete_failed': 'Failed to delete data',
    'error.create_failed': 'Failed to create data',
    'error.import_failed': 'Failed to import data',
    'error.export_failed': 'Failed to export data',
    'error.network_error': 'Network error',
    'error.server_error': 'Server error',
    'error.unauthorized': 'Unauthorized access',
    'error.forbidden': 'Access forbidden',
    'error.not_found': 'Data not found',
    
    // Confirmation Messages
    'confirm.delete': 'Are you sure you want to delete this data?',
    'confirm.save': 'Are you sure you want to save changes?',
    'confirm.cancel': 'Are you sure you want to cancel?',
    'confirm.logout': 'Are you sure you want to logout?',
    'confirm.discard_changes': 'Are you sure you want to discard changes?'
  }
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<'id' | 'en'>('id')

  // Translation function
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key
  }

  // Set language and persist to localStorage
  const setLanguage = (newLanguage: 'id' | 'en') => {
    setLanguageState(newLanguage)
    localStorage.setItem('language', newLanguage)
    
    // Update document lang attribute for accessibility
    document.documentElement.lang = newLanguage === 'id' ? 'id-ID' : 'en-US'
  }

  // Initialize language - always use Indonesian
  useEffect(() => {
    // Force Indonesian language, ignore localStorage
    setLanguageState('id')
    localStorage.setItem('language', 'id')
    document.documentElement.lang = 'id-ID'
  }, [])

  // Listen for language updates from settings
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      const { language: newLanguage } = event.detail
      if (newLanguage) {
        setLanguage(newLanguage)
      }
    }

    window.addEventListener('languageSettingsUpdated', handleSettingsUpdate as EventListener)
    return () => window.removeEventListener('languageSettingsUpdated', handleSettingsUpdate as EventListener)
  }, [])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
