import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import axiosInstance from '../utils/axiosConfig';
import {
  Plus,
  Save,
  Trash2,
  X
} from 'lucide-react';

interface Machine {
  id: number;
  code: string;
  name: string;
  machine_type: string;
  status: string;
}
interface ProductNew {
  id?: number;
  kode_produk: string;
  nama_produk: string;
  gramasi?: number;
  cd?: number;
  md?: number;
  sheet_per_pack?: number;
  pack_per_karton?: number;
  berat_kering?: number;
  ratio?: number;
  ingredient?: number;
  ukuran_batch_vol?: number;
  ukuran_batch_ctn?: number;
  spunlace?: string;
  rayon?: number;
  polyester?: number;
  es?: number;
  slitting_cm?: number;
  lebar_mr_net_cm?: number;
  lebar_mr_gross_cm?: number;
  keterangan_slitting?: string;
  no_mesin_epd?: string;
  speed_epd_pack_menit?: number;
  meter_kain?: number;
  kg_kain?: number;
  kebutuhan_rayon_kg?: number;
  kebutuhan_polyester_kg?: number;
  kebutuhan_es_kg?: number;
  process_produksi?: string;
  kode_jumbo_roll?: string;
  nama_jumbo_roll?: string;
  kode_main_roll?: string;
  nama_main_roll?: string;
  kapasitas_mixing_kg?: number;
  actual_mixing_kg?: number;
  dosing_kg?: number;
  is_active?: boolean;
  version?: number;
  notes?: string;
}

interface ProductFormNewProps {
  product?: ProductNew;
  onSave: (product: ProductNew) => void;
  onCancel: () => void;
}

const ProductFormNew: React.FC<ProductFormNewProps> = ({ product, onSave, onCancel }) => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const [formData, setFormData] = useState<ProductNew>({
    kode_produk: '',
    nama_produk: '',
    gramasi: undefined,
    cd: undefined,
    md: undefined,
    sheet_per_pack: undefined,
    pack_per_karton: undefined,
    berat_kering: undefined,
    ratio: undefined,
    ingredient: undefined,
    ukuran_batch_vol: undefined,
    ukuran_batch_ctn: undefined,
    spunlace: '',
    rayon: undefined,
    polyester: undefined,
    es: undefined,
    slitting_cm: undefined,
    lebar_mr_net_cm: undefined,
    lebar_mr_gross_cm: undefined,
    keterangan_slitting: '',
    no_mesin_epd: '',
    speed_epd_pack_menit: undefined,
    meter_kain: undefined,
    kg_kain: undefined,
    kebutuhan_rayon_kg: undefined,
    kebutuhan_polyester_kg: undefined,
    kebutuhan_es_kg: undefined,
    process_produksi: '',
    kode_jumbo_roll: '',
    nama_jumbo_roll: '',
    kode_main_roll: '',
    nama_main_roll: '',
    kapasitas_mixing_kg: undefined,
    actual_mixing_kg: undefined,
    dosing_kg: undefined,
    is_active: true,
    version: 0,
    notes: '',
    ...product
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loadingMachines, setLoadingMachines] = useState(false);

  // Fetch machines for dropdown
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        setLoadingMachines(true);
        const response = await axiosInstance.get('/api/production/machines');
        setMachines(response.data?.machines || []);
      } catch (error) {
        console.error('Failed to fetch machines:', error);
      } finally {
        setLoadingMachines(false);
      }
    };
    fetchMachines();
  }, []);

  const handleInputChange = (field: string, value: string | number | boolean | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.kode_produk.trim()) {
      newErrors.kode_produk = 'Kode Produk harus diisi';
    }

    if (!formData.nama_produk.trim()) {
      newErrors.nama_produk = 'Nama Produk harus diisi';
    }

    // Validate material composition totals
    const rayon = formData.rayon || 0;
    const polyester = formData.polyester || 0;
    const es = formData.es || 0;
    const totalComposition = rayon + polyester + es;

    if (totalComposition > 0 && Math.abs(totalComposition - 100) > 0.1) {
      newErrors.composition = 'Total komposisi material harus 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Common spunlace options
  const spunlaceOptions = [
    'FN 40-25 D',
    'FN 45-76 H', 
    'SFBR 50-60',
    'FN 70-6H',
    'Other'
  ];

  // Common process options
  const processOptions = [
    'SPUNLACE-SLITTING-EPD-PACKING',
    'SPUNLACE-SLITTING-CUTTING-PACKING',
    'SPUNLACE-CUTTING-PACKING',
    'Other'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {product ? 'Edit Produk' : 'Tambah Produk Baru'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Informasi Dasar
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode Produk *
                </label>
                <input
                  type="text"
                  value={formData.kode_produk}
                  onChange={(e) => handleInputChange('kode_produk', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.kode_produk ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Contoh: 4020701001"
                />
                {errors.kode_produk && (
                  <p className="text-red-500 text-sm mt-1">{errors.kode_produk}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Produk *
                </label>
                <input
                  type="text"
                  value={formData.nama_produk}
                  onChange={(e) => handleInputChange('nama_produk', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.nama_produk ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Contoh: ANDALAN 10S @72"
                />
                {errors.nama_produk && (
                  <p className="text-red-500 text-sm mt-1">{errors.nama_produk}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status Aktif
                </label>
                <select
                  value={formData.is_active ? 'true' : 'false'}
                  onChange={(e) => handleInputChange('is_active', e.target.value === 'true')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Tidak Aktif</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Catatan tambahan..."
                />
              </div>
            </div>

            {/* Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gramasi (GSM)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.gramasi || ''}
                  onChange={(e) => handleInputChange('gramasi', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CD (Lebar Kain - mm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.cd || ''}
                  onChange={(e) => handleInputChange('cd', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 150"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MD (Panjang Kain - mm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.md || ''}
                  onChange={(e) => handleInputChange('md', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Berat Kering (g/pack)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.berat_kering || ''}
                  onChange={(e) => handleInputChange('berat_kering', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 0.864"
                />
              </div>
            </div>

            {/* Packaging */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sheet per Pack
                </label>
                <input
                  type="number"
                  value={formData.sheet_per_pack || ''}
                  onChange={(e) => handleInputChange('sheet_per_pack', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pack per Karton
                </label>
                <input
                  type="number"
                  value={formData.pack_per_karton || ''}
                  onChange={(e) => handleInputChange('pack_per_karton', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 72"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Volume per Batch
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.ukuran_batch_vol || ''}
                  onChange={(e) => handleInputChange('ukuran_batch_vol', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 712.8"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Karton per Batch
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.ukuran_batch_ctn || ''}
                  onChange={(e) => handleInputChange('ukuran_batch_ctn', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 300"
                />
              </div>
            </div>

            {/* Material Composition */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Komposisi Material
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Spunlace
                </label>
                <select
                  value={formData.spunlace || ''}
                  onChange={(e) => handleInputChange('spunlace', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Pilih Jenis Spunlace</option>
                  {spunlaceOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rayon (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.rayon || ''}
                  onChange={(e) => handleInputChange('rayon', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Polyester (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.polyester || ''}
                  onChange={(e) => handleInputChange('polyester', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ES (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.es || ''}
                  onChange={(e) => handleInputChange('es', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 0"
                />
              </div>

              {errors.composition && (
                <p className="text-red-500 text-sm">{errors.composition}</p>
              )}
            </div>

            {/* Production Process */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Proses Produksi
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slitting (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.slitting_cm || ''}
                  onChange={(e) => handleInputChange('slitting_cm', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lebar MR Nett (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.lebar_mr_net_cm || ''}
                  onChange={(e) => handleInputChange('lebar_mr_net_cm', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 150"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lebar MR Gross (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.lebar_mr_gross_cm || ''}
                  onChange={(e) => handleInputChange('lebar_mr_gross_cm', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 160"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keterangan Slitting
                </label>
                <input
                  type="text"
                  value={formData.keterangan_slitting || ''}
                  onChange={(e) => handleInputChange('keterangan_slitting', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 5 REPEAT"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. Mesin EPD
                </label>
                <select
                  value={formData.no_mesin_epd || ''}
                  onChange={(e) => handleInputChange('no_mesin_epd', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loadingMachines}
                >
                  <option value="">-- Pilih Mesin --</option>
                  {machines
                    .filter(m => m.status === 'active' || m.status === 'running' || m.status === 'idle')
                    .map(machine => (
                      <option key={machine.id} value={machine.code}>
                        {machine.code} - {machine.name}
                      </option>
                    ))
                  }
                </select>
                {loadingMachines && (
                  <p className="text-xs text-gray-500 mt-1">Loading machines...</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Speed EPD (pack/menit)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.speed_epd_pack_menit || ''}
                  onChange={(e) => handleInputChange('speed_epd_pack_menit', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Process Produksi
                </label>
                <select
                  value={formData.process_produksi || ''}
                  onChange={(e) => handleInputChange('process_produksi', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Pilih Process Produksi</option>
                  {processOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Material Requirements */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Kebutuhan Material
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meter Kain
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.meter_kain || ''}
                  onChange={(e) => handleInputChange('meter_kain', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 14.4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  KG Kain
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.kg_kain || ''}
                  onChange={(e) => handleInputChange('kg_kain', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 0.922"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kebutuhan Rayon (kg)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.kebutuhan_rayon_kg || ''}
                  onChange={(e) => handleInputChange('kebutuhan_rayon_kg', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 0.507"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kebutuhan Polyester (kg)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.kebutuhan_polyester_kg || ''}
                  onChange={(e) => handleInputChange('kebutuhan_polyester_kg', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 0.461"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kebutuhan ES (kg)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.kebutuhan_es_kg || ''}
                  onChange={(e) => handleInputChange('kebutuhan_es_kg', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ratio (mm)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.ratio || ''}
                  onChange={(e) => handleInputChange('ratio', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 2.75"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingredient (mm)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.ingredient || ''}
                  onChange={(e) => handleInputChange('ingredient', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 2.376"
                />
              </div>
            </div>

            {/* Roll Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Informasi Roll
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode Jumbo Roll
                </label>
                <input
                  type="text"
                  value={formData.kode_jumbo_roll || ''}
                  onChange={(e) => handleInputChange('kode_jumbo_roll', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 3020201002"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Jumbo Roll
                </label>
                <input
                  type="text"
                  value={formData.nama_jumbo_roll || ''}
                  onChange={(e) => handleInputChange('nama_jumbo_roll', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: JR FN 45-76 H 50% R/50%P 30 CM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode Main Roll
                </label>
                <input
                  type="text"
                  value={formData.kode_main_roll || ''}
                  onChange={(e) => handleInputChange('kode_main_roll', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 3010302001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Main Roll
                </label>
                <input
                  type="text"
                  value={formData.nama_main_roll || ''}
                  onChange={(e) => handleInputChange('nama_main_roll', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: MR FN 40-25 D 50%R/50%P 160 CM"
                />
              </div>
            </div>

            {/* Mixing Process */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Proses Mixing
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kapasitas Mixing (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.kapasitas_mixing_kg || ''}
                  onChange={(e) => handleInputChange('kapasitas_mixing_kg', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 2060"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Mixing (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.actual_mixing_kg || ''}
                  onChange={(e) => handleInputChange('actual_mixing_kg', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 1930"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dosing (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.dosing_kg || ''}
                  onChange={(e) => handleInputChange('dosing_kg', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 900"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex justify-end space-x-3 border-t pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormNew;
