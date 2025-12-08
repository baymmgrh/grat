#!/usr/bin/env python3
"""
Internationalization (i18n) utilities for backend API responses
"""

from flask import request
import json
import os

class I18nManager:
    """Manages internationalization for backend API responses"""
    
    def __init__(self):
        self.translations = {}
        self.default_language = 'id'
        self.supported_languages = ['id', 'en']
        self.load_translations()
    
    def load_translations(self):
        """Load translation dictionaries"""
        self.translations = {
            'id': {
                # Common API Messages
                'api.success': 'Berhasil',
                'api.error': 'Terjadi kesalahan',
                'api.not_found': 'Data tidak ditemukan',
                'api.unauthorized': 'Tidak memiliki akses',
                'api.forbidden': 'Akses ditolak',
                'api.validation_error': 'Kesalahan validasi',
                'api.server_error': 'Kesalahan server',
                'api.created': 'Data berhasil dibuat',
                'api.updated': 'Data berhasil diperbarui',
                'api.deleted': 'Data berhasil dihapus',
                'api.saved': 'Data berhasil disimpan',
                
                # Authentication
                'auth.login_success': 'Login berhasil',
                'auth.login_failed': 'Login gagal',
                'auth.logout_success': 'Logout berhasil',
                'auth.invalid_credentials': 'Username atau password salah',
                'auth.account_inactive': 'Akun tidak aktif',
                'auth.token_expired': 'Token sudah kadaluarsa',
                'auth.token_invalid': 'Token tidak valid',
                'auth.registration_success': 'Registrasi berhasil',
                'auth.registration_failed': 'Registrasi gagal',
                
                # Validation Messages
                'validation.required_field': 'Field {field} wajib diisi',
                'validation.invalid_email': 'Format email tidak valid',
                'validation.invalid_phone': 'Format nomor telepon tidak valid',
                'validation.password_too_short': 'Password minimal 6 karakter',
                'validation.passwords_not_match': 'Password tidak cocok',
                'validation.invalid_date': 'Format tanggal tidak valid',
                'validation.invalid_number': 'Harus berupa angka',
                'validation.value_too_large': 'Nilai terlalu besar',
                'validation.value_too_small': 'Nilai terlalu kecil',
                'validation.duplicate_entry': 'Data sudah ada',
                
                # Module Specific Messages
                
                # Products
                'products.created': 'Produk berhasil dibuat',
                'products.updated': 'Produk berhasil diperbarui',
                'products.deleted': 'Produk berhasil dihapus',
                'products.not_found': 'Produk tidak ditemukan',
                'products.code_exists': 'Kode produk sudah ada',
                'products.low_stock': 'Stok produk menipis',
                
                # Warehouse
                'warehouse.stock_updated': 'Stok berhasil diperbarui',
                'warehouse.location_created': 'Lokasi gudang berhasil dibuat',
                'warehouse.transfer_completed': 'Transfer barang berhasil',
                'warehouse.insufficient_stock': 'Stok tidak mencukupi',
                'warehouse.location_not_found': 'Lokasi tidak ditemukan',
                
                # Production
                'production.work_order_created': 'Work order berhasil dibuat',
                'production.work_order_started': 'Work order dimulai',
                'production.work_order_completed': 'Work order selesai',
                'production.machine_not_available': 'Mesin tidak tersedia',
                'production.material_shortage': 'Kekurangan material',
                'production.downtime_recorded': 'Waktu henti tercatat',
                
                # Sales
                'sales.order_created': 'Pesanan penjualan berhasil dibuat',
                'sales.order_confirmed': 'Pesanan dikonfirmasi',
                'sales.order_shipped': 'Pesanan dikirim',
                'sales.order_delivered': 'Pesanan diterima',
                'sales.invoice_generated': 'Faktur berhasil dibuat',
                'sales.payment_received': 'Pembayaran diterima',
                
                # Purchasing
                'purchasing.po_created': 'Purchase order berhasil dibuat',
                'purchasing.po_approved': 'Purchase order disetujui',
                'purchasing.goods_received': 'Barang diterima',
                'purchasing.invoice_matched': 'Faktur berhasil dicocokkan',
                'purchasing.supplier_not_found': 'Pemasok tidak ditemukan',
                
                # Finance
                'finance.transaction_recorded': 'Transaksi tercatat',
                'finance.payment_processed': 'Pembayaran diproses',
                'finance.budget_exceeded': 'Anggaran terlampaui',
                'finance.account_not_found': 'Akun tidak ditemukan',
                'finance.insufficient_balance': 'Saldo tidak mencukupi',
                
                # HR
                'hr.employee_created': 'Karyawan berhasil ditambahkan',
                'hr.attendance_marked': 'Kehadiran tercatat',
                'hr.leave_approved': 'Cuti disetujui',
                'hr.leave_rejected': 'Cuti ditolak',
                'hr.payroll_processed': 'Penggajian diproses',
                'hr.employee_not_found': 'Karyawan tidak ditemukan',
                
                # Quality
                'quality.test_completed': 'Tes kualitas selesai',
                'quality.inspection_passed': 'Inspeksi lulus',
                'quality.inspection_failed': 'Inspeksi gagal',
                'quality.non_conformance_reported': 'Ketidaksesuaian dilaporkan',
                'quality.corrective_action_required': 'Tindakan korektif diperlukan',
                
                # Maintenance
                'maintenance.work_order_created': 'Work order pemeliharaan dibuat',
                'maintenance.maintenance_completed': 'Pemeliharaan selesai',
                'maintenance.equipment_down': 'Peralatan tidak beroperasi',
                'maintenance.spare_part_ordered': 'Suku cadang dipesan',
                'maintenance.warranty_expired': 'Garansi sudah habis',
                
                # R&D
                'rd.project_created': 'Proyek R&D berhasil dibuat',
                'rd.experiment_completed': 'Eksperimen selesai',
                'rd.milestone_achieved': 'Milestone tercapai',
                'rd.budget_allocated': 'Anggaran dialokasikan',
                'rd.patent_filed': 'Paten diajukan',
                
                # OEE
                'oee.data_recorded': 'Data OEE tercatat',
                'oee.target_achieved': 'Target OEE tercapai',
                'oee.efficiency_improved': 'Efisiensi meningkat',
                'oee.downtime_reduced': 'Waktu henti berkurang',
                'oee.alert_triggered': 'Peringatan OEE dipicu',
                
                # Waste Management
                'waste.record_created': 'Catatan limbah dibuat',
                'waste.disposal_scheduled': 'Pembuangan dijadwalkan',
                'waste.recycling_processed': 'Daur ulang diproses',
                'waste.compliance_checked': 'Kepatuhan diperiksa',
                
                # System
                'system.backup_created': 'Backup berhasil dibuat',
                'system.data_imported': 'Data berhasil diimpor',
                'system.data_exported': 'Data berhasil diekspor',
                'system.settings_updated': 'Pengaturan diperbarui',
                'system.maintenance_mode': 'Mode pemeliharaan sistem',
            },
            'en': {
                # Common API Messages
                'api.success': 'Success',
                'api.error': 'An error occurred',
                'api.not_found': 'Data not found',
                'api.unauthorized': 'Unauthorized access',
                'api.forbidden': 'Access forbidden',
                'api.validation_error': 'Validation error',
                'api.server_error': 'Server error',
                'api.created': 'Data created successfully',
                'api.updated': 'Data updated successfully',
                'api.deleted': 'Data deleted successfully',
                'api.saved': 'Data saved successfully',
                
                # Authentication
                'auth.login_success': 'Login successful',
                'auth.login_failed': 'Login failed',
                'auth.logout_success': 'Logout successful',
                'auth.invalid_credentials': 'Invalid username or password',
                'auth.account_inactive': 'Account is inactive',
                'auth.token_expired': 'Token has expired',
                'auth.token_invalid': 'Invalid token',
                'auth.registration_success': 'Registration successful',
                'auth.registration_failed': 'Registration failed',
                
                # Validation Messages
                'validation.required_field': 'Field {field} is required',
                'validation.invalid_email': 'Invalid email format',
                'validation.invalid_phone': 'Invalid phone number format',
                'validation.password_too_short': 'Password must be at least 6 characters',
                'validation.passwords_not_match': 'Passwords do not match',
                'validation.invalid_date': 'Invalid date format',
                'validation.invalid_number': 'Must be a number',
                'validation.value_too_large': 'Value is too large',
                'validation.value_too_small': 'Value is too small',
                'validation.duplicate_entry': 'Data already exists',
                
                # Module Specific Messages
                
                # Products
                'products.created': 'Product created successfully',
                'products.updated': 'Product updated successfully',
                'products.deleted': 'Product deleted successfully',
                'products.not_found': 'Product not found',
                'products.code_exists': 'Product code already exists',
                'products.low_stock': 'Product stock is low',
                
                # Warehouse
                'warehouse.stock_updated': 'Stock updated successfully',
                'warehouse.location_created': 'Warehouse location created successfully',
                'warehouse.transfer_completed': 'Transfer completed successfully',
                'warehouse.insufficient_stock': 'Insufficient stock',
                'warehouse.location_not_found': 'Location not found',
                
                # Production
                'production.work_order_created': 'Work order created successfully',
                'production.work_order_started': 'Work order started',
                'production.work_order_completed': 'Work order completed',
                'production.machine_not_available': 'Machine not available',
                'production.material_shortage': 'Material shortage',
                'production.downtime_recorded': 'Downtime recorded',
                
                # Sales
                'sales.order_created': 'Sales order created successfully',
                'sales.order_confirmed': 'Order confirmed',
                'sales.order_shipped': 'Order shipped',
                'sales.order_delivered': 'Order delivered',
                'sales.invoice_generated': 'Invoice generated successfully',
                'sales.payment_received': 'Payment received',
                
                # Purchasing
                'purchasing.po_created': 'Purchase order created successfully',
                'purchasing.po_approved': 'Purchase order approved',
                'purchasing.goods_received': 'Goods received',
                'purchasing.invoice_matched': 'Invoice matched successfully',
                'purchasing.supplier_not_found': 'Supplier not found',
                
                # Finance
                'finance.transaction_recorded': 'Transaction recorded',
                'finance.payment_processed': 'Payment processed',
                'finance.budget_exceeded': 'Budget exceeded',
                'finance.account_not_found': 'Account not found',
                'finance.insufficient_balance': 'Insufficient balance',
                
                # HR
                'hr.employee_created': 'Employee added successfully',
                'hr.attendance_marked': 'Attendance marked',
                'hr.leave_approved': 'Leave approved',
                'hr.leave_rejected': 'Leave rejected',
                'hr.payroll_processed': 'Payroll processed',
                'hr.employee_not_found': 'Employee not found',
                
                # Quality
                'quality.test_completed': 'Quality test completed',
                'quality.inspection_passed': 'Inspection passed',
                'quality.inspection_failed': 'Inspection failed',
                'quality.non_conformance_reported': 'Non-conformance reported',
                'quality.corrective_action_required': 'Corrective action required',
                
                # Maintenance
                'maintenance.work_order_created': 'Maintenance work order created',
                'maintenance.maintenance_completed': 'Maintenance completed',
                'maintenance.equipment_down': 'Equipment is down',
                'maintenance.spare_part_ordered': 'Spare part ordered',
                'maintenance.warranty_expired': 'Warranty expired',
                
                # R&D
                'rd.project_created': 'R&D project created successfully',
                'rd.experiment_completed': 'Experiment completed',
                'rd.milestone_achieved': 'Milestone achieved',
                'rd.budget_allocated': 'Budget allocated',
                'rd.patent_filed': 'Patent filed',
                
                # OEE
                'oee.data_recorded': 'OEE data recorded',
                'oee.target_achieved': 'OEE target achieved',
                'oee.efficiency_improved': 'Efficiency improved',
                'oee.downtime_reduced': 'Downtime reduced',
                'oee.alert_triggered': 'OEE alert triggered',
                
                # Waste Management
                'waste.record_created': 'Waste record created',
                'waste.disposal_scheduled': 'Disposal scheduled',
                'waste.recycling_processed': 'Recycling processed',
                'waste.compliance_checked': 'Compliance checked',
                
                # System
                'system.backup_created': 'Backup created successfully',
                'system.data_imported': 'Data imported successfully',
                'system.data_exported': 'Data exported successfully',
                'system.settings_updated': 'Settings updated',
                'system.maintenance_mode': 'System maintenance mode',
            }
        }
    
    def get_language(self):
        """Get current language from request headers or default"""
        # Check Accept-Language header
        if request and hasattr(request, 'headers'):
            accept_language = request.headers.get('Accept-Language', '')
            if 'en' in accept_language.lower():
                return 'en'
            elif 'id' in accept_language.lower():
                return 'id'
        
        # Check custom header
        if request and hasattr(request, 'headers'):
            custom_lang = request.headers.get('X-Language', '')
            if custom_lang in self.supported_languages:
                return custom_lang
        
        return self.default_language
    
    def translate(self, key, **kwargs):
        """Translate a key to current language"""
        language = self.get_language()
        
        if language not in self.translations:
            language = self.default_language
        
        translation = self.translations[language].get(key, key)
        
        # Replace placeholders
        if kwargs:
            try:
                translation = translation.format(**kwargs)
            except (KeyError, ValueError):
                pass  # Return original if formatting fails
        
        return translation
    
    def t(self, key, **kwargs):
        """Shorthand for translate"""
        return self.translate(key, **kwargs)

# Global instance
i18n = I18nManager()

def get_message(key, **kwargs):
    """Get translated message"""
    return i18n.translate(key, **kwargs)

def success_response(message_key, data=None, **kwargs):
    """Create standardized success response"""
    return {
        'success': True,
        'message': i18n.translate(message_key, **kwargs),
        'data': data
    }

def error_response(message_key, error_code=400, details=None, **kwargs):
    """Create standardized error response"""
    return {
        'success': False,
        'message': i18n.translate(message_key, **kwargs),
        'error_code': error_code,
        'details': details
    }

def validation_error_response(errors):
    """Create validation error response"""
    return {
        'success': False,
        'message': i18n.translate('api.validation_error'),
        'error_code': 422,
        'validation_errors': errors
    }
