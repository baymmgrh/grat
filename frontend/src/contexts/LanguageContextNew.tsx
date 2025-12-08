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
const translations = {
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
    'common.view': 'Lihat',
    'common.search': 'Cari',
    'common.filter': 'FunnelIcon',
    'common.export': 'Ekspor',
    'common.import': 'Impor',
    'common.print': 'Cetak',
    'common.download': 'Unduh',
    'common.upload': 'Unggah',
    'common.submit': 'Kirim',
    'common.reset': 'Reset',
    'common.clear': 'Bersihkan',
    'common.refresh': 'Refresh',
    'common.loading': 'Memuat...',
    'common.success': 'Berhasil',
    'common.error': 'Error',
    'common.warning': 'Peringatan',
    'common.info': 'Informasi',
    'common.confirm': 'Konfirmasi',
    'common.yes': 'Ya',
    'common.no': 'Tidak',
    'common.ok': 'OK',
    'common.close': 'Tutup',
    'common.back': 'Kembali',
    'common.next': 'Selanjutnya',
    'common.previous': 'Sebelumnya',
    'common.first': 'Pertama',
    'common.last': 'Terakhir',
    'common.total': 'Total',
    'common.subtotal': 'Subtotal',
    'common.quantity': 'Kuantitas',
    'common.price': 'Harga',
    'common.amount': 'Jumlah',
    'common.date': 'Tanggal',
    'common.time': 'Waktu',
    'common.status': 'Status',
    'common.type': 'Tipe',
    'common.category': 'Kategori',
    'common.description': 'Deskripsi',
    'common.notes': 'Catatan',
    'common.active': 'Aktif',
    'common.inactive': 'Tidak Aktif',
    'common.enabled': 'Diaktifkan',
    'common.disabled': 'Dinonaktifkan',
    'common.required': 'Wajib',
    'common.optional': 'Opsional',
    'common.all': 'Semua',
    'common.none': 'Tidak Ada',
    'common.select': 'Pilih',
    'common.choose': 'Pilih',
    'common.name': 'Nama',
    'common.code': 'Kode',
    'common.id': 'ID',
    'common.email': 'Email',
    'common.phone': 'Telepon',
    'common.address': 'Alamat',
    'common.city': 'Kota',
    'common.country': 'Negara',
    'common.language': 'Bahasa',
    'common.currency': 'Mata Uang'
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
    'common.view': 'View',
    'common.search': 'Search',
    'common.filter': 'FunnelIcon',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.print': 'Print',
    'common.download': 'ArrowDownTrayIcon',
    'common.upload': 'Upload',
    'common.submit': 'Submit',
    'common.reset': 'Reset',
    'common.clear': 'Clear',
    'common.refresh': 'Refresh',
    'common.loading': 'Loading...',
    'common.success': 'Success',
    'common.error': 'Error',
    'common.warning': 'Warning',
    'common.info': 'Information',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.ok': 'OK',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.first': 'First',
    'common.last': 'Last',
    'common.total': 'Total',
    'common.subtotal': 'Subtotal',
    'common.quantity': 'Quantity',
    'common.price': 'Price',
    'common.amount': 'Amount',
    'common.date': 'Date',
    'common.time': 'Time',
    'common.status': 'Status',
    'common.type': 'Type',
    'common.category': 'Category',
    'common.description': 'Description',
    'common.notes': 'Notes',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.enabled': 'Enabled',
    'common.disabled': 'Disabled',
    'common.required': 'Required',
    'common.optional': 'Optional',
    'common.all': 'All',
    'common.none': 'None',
    'common.select': 'Select',
    'common.choose': 'Choose',
    'common.name': 'Name',
    'common.code': 'Code',
    'common.id': 'ID',
    'common.email': 'Email',
    'common.phone': 'Phone',
    'common.address': 'Address',
    'common.city': 'City',
    'common.country': 'Country',
    'common.language': 'Language',
    'common.currency': 'Currency'
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

  // Initialize language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as 'id' | 'en' | null
    const initialLanguage = savedLanguage || 'id'
    
    setLanguageState(initialLanguage)
    document.documentElement.lang = initialLanguage === 'id' ? 'id-ID' : 'en-US'
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
