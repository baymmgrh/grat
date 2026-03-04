import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosInstance from '../../utils/axiosConfig';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ScaleIcon,
  ArrowsRightLeftIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface UnitOfMeasure {
  id: number;
  code: string;
  name: string;
  category: string;
  description?: string;
  is_active: boolean;
}

interface UoMConversion {
  id: number;
  from_uom_id: number;
  from_uom_code: string;
  from_uom_name: string;
  to_uom_id: number;
  to_uom_code: string;
  to_uom_name: string;
  conversion_factor: number;
  material_id?: number;
  material_name?: string;
  product_id?: number;
  product_name?: string;
  scope: string;
  notes?: string;
}

const categoryLabels: Record<string, string> = {
  unit: 'Satuan',
  weight: 'Berat',
  length: 'Panjang',
  volume: 'Volume',
  area: 'Luas',
};

const UoMList: React.FC = () => {
  const { t } = useLanguage();
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [conversions, setConversions] = useState<UoMConversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'units' | 'conversions'>('units');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Modal states
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitOfMeasure | null>(null);
  const [editingConversion, setEditingConversion] = useState<UoMConversion | null>(null);

  // Form states
  const [unitForm, setUnitForm] = useState({ code: '', name: '', category: 'unit', description: '' });
  const [conversionForm, setConversionForm] = useState({
    from_uom_id: 0, to_uom_id: 0, conversion_factor: '', material_id: '', product_id: '', notes: ''
  });

  useEffect(() => {
    fetchUnits();
    fetchConversions();
  }, []);

  const fetchUnits = async () => {
    try {
      const res = await axiosInstance.get('/api/uom/units?active_only=false');
      setUnits(res.data.units || []);
    } catch (err) {
      console.error('Failed to fetch units:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversions = async () => {
    try {
      const res = await axiosInstance.get('/api/uom/conversions');
      setConversions(res.data.conversions || []);
    } catch (err) {
      console.error('Failed to fetch conversions:', err);
    }
  };

  const handleSaveUnit = async () => {
    try {
      if (editingUnit) {
        await axiosInstance.put(`/api/uom/units/${editingUnit.id}`, unitForm);
      } else {
        await axiosInstance.post('/api/uom/units', unitForm);
      }
      fetchUnits();
      setShowUnitModal(false);
      setEditingUnit(null);
      setUnitForm({ code: '', name: '', category: 'unit', description: '' });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menyimpan satuan');
    }
  };

  const handleDeleteUnit = async (id: number) => {
    if (!confirm('Yakin ingin menghapus satuan ini?')) return;
    try {
      await axiosInstance.delete(`/api/uom/units/${id}`);
      fetchUnits();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menghapus satuan');
    }
  };

  const handleSaveConversion = async () => {
    try {
      const payload = {
        from_uom_id: conversionForm.from_uom_id,
        to_uom_id: conversionForm.to_uom_id,
        conversion_factor: parseFloat(conversionForm.conversion_factor),
        material_id: conversionForm.material_id ? parseInt(conversionForm.material_id) : null,
        product_id: conversionForm.product_id ? parseInt(conversionForm.product_id) : null,
        notes: conversionForm.notes || null,
      };
      if (editingConversion) {
        await axiosInstance.put(`/api/uom/conversions/${editingConversion.id}`, payload);
      } else {
        await axiosInstance.post('/api/uom/conversions', payload);
      }
      fetchConversions();
      setShowConversionModal(false);
      setEditingConversion(null);
      setConversionForm({ from_uom_id: 0, to_uom_id: 0, conversion_factor: '', material_id: '', product_id: '', notes: '' });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menyimpan konversi');
    }
  };

  const handleDeleteConversion = async (id: number) => {
    if (!confirm('Yakin ingin menghapus konversi ini?')) return;
    try {
      await axiosInstance.delete(`/api/uom/conversions/${id}`);
      fetchConversions();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menghapus konversi');
    }
  };

  const openEditUnit = (unit: UnitOfMeasure) => {
    setEditingUnit(unit);
    setUnitForm({ code: unit.code, name: unit.name, category: unit.category, description: unit.description || '' });
    setShowUnitModal(true);
  };

  const openEditConversion = (conv: UoMConversion) => {
    setEditingConversion(conv);
    setConversionForm({
      from_uom_id: conv.from_uom_id,
      to_uom_id: conv.to_uom_id,
      conversion_factor: conv.conversion_factor.toString(),
      material_id: conv.material_id?.toString() || '',
      product_id: conv.product_id?.toString() || '',
      notes: conv.notes || '',
    });
    setShowConversionModal(true);
  };

  const filteredUnits = units.filter(u => {
    const matchSearch = u.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = !filterCategory || u.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const scopeLabel = (scope: string) => {
    switch (scope) {
      case 'global': return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Global</span>;
      case 'material': return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Material</span>;
      case 'product': return <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">Produk</span>;
      default: return scope;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ScaleIcon className="h-7 w-7 text-blue-600" />
            Satuan Barang (UoM)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Master data satuan dan konversi antar satuan
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('units')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'units'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <ScaleIcon className="h-4 w-4 inline mr-1" />
            Daftar Satuan ({units.length})
          </button>
          <button
            onClick={() => setActiveTab('conversions')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'conversions'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <ArrowsRightLeftIcon className="h-4 w-4 inline mr-1" />
            Konversi ({conversions.length})
          </button>
        </nav>
      </div>

      {/* Units Tab */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1 max-w-xs">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari satuan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Semua Kategori</option>
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => { setEditingUnit(null); setUnitForm({ code: '', name: '', category: 'unit', description: '' }); setShowUnitModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              <PlusIcon className="h-4 w-4" />
              Tambah Satuan
            </button>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Kode</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Kategori</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Deskripsi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-4 py-3 text-sm font-mono font-bold text-gray-900 dark:text-white">{unit.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{unit.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {categoryLabels[unit.category] || unit.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{unit.description || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {unit.is_active
                        ? <span className="text-green-600 font-medium">Aktif</span>
                        : <span className="text-red-500 font-medium">Nonaktif</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditUnit(unit)} className="p-1.5 text-gray-400 hover:text-blue-600 transition">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteUnit(unit.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUnits.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      Tidak ada satuan ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conversions Tab */}
      {activeTab === 'conversions' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => { setEditingConversion(null); setConversionForm({ from_uom_id: 0, to_uom_id: 0, conversion_factor: '', material_id: '', product_id: '', notes: '' }); setShowConversionModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              <PlusIcon className="h-4 w-4" />
              Tambah Konversi
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Dari</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Faktor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Ke</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Scope</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Catatan</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {conversions.map((conv) => (
                  <tr key={conv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-4 py-3 text-sm font-mono font-bold text-gray-900 dark:text-white">
                      1 {conv.from_uom_code}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-mono">=</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                      {conv.conversion_factor} {conv.to_uom_code}
                    </td>
                    <td className="px-4 py-3 text-sm">{scopeLabel(conv.scope)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {conv.material_name || conv.product_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{conv.notes || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditConversion(conv)} className="p-1.5 text-gray-400 hover:text-blue-600 transition">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteConversion(conv.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {conversions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      Belum ada konversi. Klik "Tambah Konversi" untuk membuat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unit Modal */}
      {showUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingUnit ? 'Edit Satuan' : 'Tambah Satuan'}
              </h3>
              <button onClick={() => setShowUnitModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kode *</label>
                <input
                  type="text"
                  value={unitForm.code}
                  onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value.toUpperCase() })}
                  placeholder="PCS, ROLL, KG..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama *</label>
                <input
                  type="text"
                  value={unitForm.name}
                  onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                  placeholder="Pieces, Roll, Kilogram..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
                <select
                  value={unitForm.category}
                  onChange={(e) => setUnitForm({ ...unitForm, category: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi</label>
                <input
                  type="text"
                  value={unitForm.description}
                  onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowUnitModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 transition">
                Batal
              </button>
              <button onClick={handleSaveUnit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                {editingUnit ? 'Update' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversion Modal */}
      {showConversionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingConversion ? 'Edit Konversi' : 'Tambah Konversi'}
              </h3>
              <button onClick={() => setShowConversionModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dari Satuan *</label>
                  <select
                    value={conversionForm.from_uom_id}
                    onChange={(e) => setConversionForm({ ...conversionForm, from_uom_id: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={0}>Pilih...</option>
                    {units.filter(u => u.is_active).map(u => (
                      <option key={u.id} value={u.id}>{u.code} - {u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ke Satuan *</label>
                  <select
                    value={conversionForm.to_uom_id}
                    onChange={(e) => setConversionForm({ ...conversionForm, to_uom_id: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={0}>Pilih...</option>
                    {units.filter(u => u.is_active).map(u => (
                      <option key={u.id} value={u.id}>{u.code} - {u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Faktor Konversi * <span className="text-gray-400 font-normal">(1 dari = X ke)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={conversionForm.conversion_factor}
                  onChange={(e) => setConversionForm({ ...conversionForm, conversion_factor: e.target.value })}
                  placeholder="Contoh: 2000 (1 ROLL = 2000 PCS)"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Material ID <span className="text-gray-400 font-normal">(opsional)</span></label>
                  <input
                    type="number"
                    value={conversionForm.material_id}
                    onChange={(e) => setConversionForm({ ...conversionForm, material_id: e.target.value })}
                    placeholder="Kosong = global"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product ID <span className="text-gray-400 font-normal">(opsional)</span></label>
                  <input
                    type="number"
                    value={conversionForm.product_id}
                    onChange={(e) => setConversionForm({ ...conversionForm, product_id: e.target.value })}
                    placeholder="Kosong = global"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catatan</label>
                <input
                  type="text"
                  value={conversionForm.notes}
                  onChange={(e) => setConversionForm({ ...conversionForm, notes: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowConversionModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 transition">
                Batal
              </button>
              <button onClick={handleSaveConversion} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                {editingConversion ? 'Update' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UoMList;
