import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon, TrashIcon, PencilIcon, ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';

interface BOMItem {
  id: number;
  line_number: number;
  material_id: number | null;
  product_id: number | null;
  item_name: string;
  item_code: string;
  item_type: string;
  quantity_per_unit: number;
  quantity?: number; // For master BOM
  uom: string;
  scrap_percent: number;
  quantity_planned?: number;
  quantity_actual?: number;
  unit_cost: number;
  is_modified?: boolean;
  is_added?: boolean;
  modification_reason?: string;
  notes: string;
}

interface WorkOrder {
  id: number;
  wo_number: string;
  product_name: string;
  quantity: number;
  status: string;
}

interface Material {
  id: number;
  code: string;
  name: string;
  material_type: string;
  uom: string;
}

export default function WorkOrderBOMEdit() {
  const { id: workOrderId } = useParams();
  const navigate = useNavigate();
  
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [bomSource, setBomSource] = useState<string>('none');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New item form
  const [newItem, setNewItem] = useState({
    material_id: '',
    item_name: '',
    item_code: '',
    item_type: '',
    quantity_per_unit: '',
    uom: 'kg',
    scrap_percent: '0',
    notes: '',
    modification_reason: ''
  });

  useEffect(() => {
    fetchData();
  }, [workOrderId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [woRes, bomRes, matRes] = await Promise.all([
        axiosInstance.get(`/api/production/work-orders/${workOrderId}`),
        axiosInstance.get(`/api/production/work-orders/${workOrderId}/bom`),
        axiosInstance.get('/api/materials?per_page=5000')  // Get all materials
      ]);
      
      setWorkOrder(woRes.data.work_order);
      setBomSource(bomRes.data.source);
      setBomItems(bomRes.data.bom_items || []);
      setMaterials(matRes.data.materials || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFromMaster = async () => {
    if (!confirm('Copy BOM dari master ke Work Order ini? BOM ini akan bisa diedit tanpa mengubah BOM master.')) {
      return;
    }
    
    try {
      setSaving(true);
      await axiosInstance.post(`/api/production/work-orders/${workOrderId}/bom/copy-from-master`);
      toast.success('BOM berhasil di-copy dari master');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal copy BOM');
    } finally {
      setSaving(false);
    }
  };

  const handleResetBOM = async () => {
    if (!confirm('Reset BOM Work Order? Semua perubahan akan dihapus dan bisa di-copy ulang dari master.')) {
      return;
    }
    
    try {
      setSaving(true);
      await axiosInstance.post(`/api/production/work-orders/${workOrderId}/bom/reset`);
      toast.success('BOM Work Order berhasil di-reset');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal reset BOM');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = async (itemId: number, updates: Partial<BOMItem>) => {
    try {
      setSaving(true);
      await axiosInstance.put(`/api/production/work-orders/${workOrderId}/bom/${itemId}`, updates);
      toast.success('Item berhasil diupdate (BOM master tidak berubah)');
      setEditingItem(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal update item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Hapus item ini dari BOM Work Order? BOM master tidak akan terpengaruh.')) {
      return;
    }
    
    try {
      setSaving(true);
      await axiosInstance.delete(`/api/production/work-orders/${workOrderId}/bom/${itemId}`);
      toast.success('Item berhasil dihapus (BOM master tidak berubah)');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal hapus item');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.item_name && !newItem.material_id) {
      toast.error('Pilih material atau isi nama item');
      return;
    }
    
    try {
      setSaving(true);
      await axiosInstance.post(`/api/production/work-orders/${workOrderId}/bom`, {
        material_id: newItem.material_id ? parseInt(newItem.material_id) : null,
        item_name: newItem.item_name,
        item_code: newItem.item_code,
        item_type: newItem.item_type,
        quantity_per_unit: parseFloat(newItem.quantity_per_unit) || 0,
        uom: newItem.uom,
        scrap_percent: parseFloat(newItem.scrap_percent) || 0,
        notes: newItem.notes,
        modification_reason: newItem.modification_reason || 'Ditambahkan manual'
      });
      toast.success('Item berhasil ditambahkan');
      setShowAddModal(false);
      setNewItem({
        material_id: '',
        item_name: '',
        item_code: '',
        item_type: '',
        quantity_per_unit: '',
        uom: 'kg',
        scrap_percent: '0',
        notes: '',
        modification_reason: ''
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal tambah item');
    } finally {
      setSaving(false);
    }
  };

  const handleMaterialSelect = (materialId: string) => {
    const material = materials.find(m => m.id === parseInt(materialId));
    if (material) {
      setNewItem(prev => ({
        ...prev,
        material_id: materialId,
        item_name: material.name,
        item_code: material.code,
        item_type: material.material_type,
        uom: material.uom || 'kg'
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to={`/app/production/work-orders/${workOrderId}`}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit BOM Work Order</h1>
            <p className="text-gray-600">{workOrder?.wo_number} - {workOrder?.product_name}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {bomSource === 'work_order' && (
            <button
              onClick={handleResetBOM}
              disabled={saving}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 inline-flex items-center"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Reset ke Master
            </button>
          )}
          {bomSource === 'master_bom' && (
            <button
              onClick={handleCopyFromMaster}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Copy BOM untuk Edit
            </button>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className={`border rounded-lg p-4 ${
        bomSource === 'work_order' ? 'bg-green-50 border-green-200' : 
        bomSource === 'master_bom' ? 'bg-blue-50 border-blue-200' : 
        'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className={`h-5 w-5 mt-0.5 ${
            bomSource === 'work_order' ? 'text-green-600' : 
            bomSource === 'master_bom' ? 'text-blue-600' : 
            'text-yellow-600'
          }`} />
          <div>
            {bomSource === 'work_order' && (
              <>
                <p className="font-medium text-green-800">BOM Work Order (Editable)</p>
                <p className="text-sm text-green-700">
                  BOM ini adalah copy khusus untuk Work Order ini. Perubahan <strong>TIDAK</strong> akan mempengaruhi BOM master.
                </p>
              </>
            )}
            {bomSource === 'master_bom' && (
              <>
                <p className="font-medium text-blue-800">BOM Master (Read-only)</p>
                <p className="text-sm text-blue-700">
                  Ini adalah BOM master. Klik "Copy BOM untuk Edit" untuk membuat copy yang bisa diedit tanpa mengubah master.
                </p>
              </>
            )}
            {bomSource === 'none' && (
              <>
                <p className="font-medium text-yellow-800">Tidak Ada BOM</p>
                <p className="text-sm text-yellow-700">
                  Work Order ini tidak memiliki BOM. Anda bisa menambahkan item secara manual.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* BOM Items Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">
            Daftar Bahan Baku ({bomItems.length} items)
          </h2>
          {(bomSource === 'work_order' || bomSource === 'none') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center text-sm"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Tambah Item
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Item</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty/Unit</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">UOM</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty Planned</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                {bomSource === 'work_order' && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bomItems.length === 0 ? (
                <tr>
                  <td colSpan={bomSource === 'work_order' ? 9 : 8} className="px-4 py-8 text-center text-gray-500">
                    Tidak ada item BOM
                  </td>
                </tr>
              ) : (
                bomItems.map((item, index) => (
                  <tr key={item.id} className={item.is_modified ? 'bg-yellow-50' : item.is_added ? 'bg-green-50' : ''}>
                    <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.item_code || '-'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.item_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.item_type || '-'}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {editingItem === item.id ? (
                        <input
                          type="number"
                          defaultValue={item.quantity_per_unit || item.quantity}
                          className="w-24 px-2 py-1 border rounded text-right"
                          onBlur={(e) => handleUpdateItem(item.id, { 
                            quantity_per_unit: parseFloat(e.target.value),
                            modification_reason: 'Qty diubah dari lapangan'
                          })}
                          step="0.0001"
                        />
                      ) : (
                        <span>{(item.quantity_per_unit || item.quantity || 0).toFixed(4)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">{item.uom}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {item.quantity_planned ? item.quantity_planned.toFixed(2) : 
                       ((item.quantity_per_unit || item.quantity || 0) * (workOrder?.quantity || 0)).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.is_added && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Ditambahkan</span>
                      )}
                      {item.is_modified && !item.is_added && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Diubah</span>
                      )}
                      {!item.is_modified && !item.is_added && bomSource === 'work_order' && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">Original</span>
                      )}
                    </td>
                    {bomSource === 'work_order' && (
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Hapus"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium">Tambah Item BOM</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pilih Material (opsional)
                </label>
                <select
                  value={newItem.material_id}
                  onChange={(e) => handleMaterialSelect(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">-- Pilih Material --</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Item *</label>
                  <input
                    type="text"
                    value={newItem.item_name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, item_name: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kode</label>
                  <input
                    type="text"
                    value={newItem.item_code}
                    onChange={(e) => setNewItem(prev => ({ ...prev, item_code: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qty per Unit *</label>
                  <input
                    type="number"
                    value={newItem.quantity_per_unit}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity_per_unit: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    step="0.0001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UOM</label>
                  <select
                    value={newItem.uom}
                    onChange={(e) => setNewItem(prev => ({ ...prev, uom: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="pcs">pcs</option>
                    <option value="m">m</option>
                    <option value="roll">roll</option>
                    <option value="liter">liter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                  <select
                    value={newItem.item_type}
                    onChange={(e) => setNewItem(prev => ({ ...prev, item_type: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">-- Pilih --</option>
                    <option value="kain">Kain</option>
                    <option value="ingredient">Ingredient</option>
                    <option value="packaging">Packaging</option>
                    <option value="stiker">Stiker</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Penambahan</label>
                <input
                  type="text"
                  value={newItem.modification_reason}
                  onChange={(e) => setNewItem(prev => ({ ...prev, modification_reason: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Contoh: Pengganti material yang habis"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleAddItem}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {saving ? 'Menyimpan...' : 'Tambah Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
