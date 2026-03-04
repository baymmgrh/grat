import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  BuildingOfficeIcon,
  CubeIcon,
  MapPinIcon,
  PencilIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface LocationData {
  id: number;
  location_code: string;
  zone_id: number;
  zone_name: string;
  zone_code: string;
  zone_material_type: string;
  rack: string;
  level: string;
  position: string;
  capacity: number;
  capacity_uom: string;
  occupied: number;
  available: number;
  is_active: boolean;
  is_available: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface InventoryItem {
  id: number;
  item_type: string;
  item_name: string;
  item_code: string;
  product_id: number | null;
  material_id: number | null;
  batch_number: string | null;
  lot_number: string | null;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  stock_status: string;
  expiry_date: string | null;
  created_at: string | null;
}

interface Movement {
  id: number;
  movement_type: string;
  item_name: string;
  quantity: number;
  batch_number: string | null;
  reference_number: string | null;
  reference_type: string | null;
  unit_cost: number | null;
  total_cost: number | null;
  notes: string | null;
  created_at: string | null;
}

const LocationDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements'>('inventory');

  useEffect(() => {
    fetchLocationDetail();
  }, [id]);

  const fetchLocationDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/warehouse/locations/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLocation(data.location);
        setInventoryItems(data.inventory_items || []);
        setMovements(data.recent_movements || []);
      } else {
        console.error('Failed to fetch location:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch location:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUtilizationPercent = () => {
    if (!location || location.capacity <= 0) return 0;
    return (location.occupied / location.capacity) * 100;
  };

  const getUtilizationColor = (pct: number) => {
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 75) return 'bg-orange-500';
    if (pct >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'stock_in': return <ArrowDownTrayIcon className="h-4 w-4 text-green-600" />;
      case 'stock_out': return <ArrowUpTrayIcon className="h-4 w-4 text-red-600" />;
      default: return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'stock_in': return 'text-green-700 bg-green-50';
      case 'stock_out': return 'text-red-700 bg-red-50';
      case 'transfer': return 'text-blue-700 bg-blue-50';
      case 'adjust': return 'text-orange-700 bg-orange-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'released': return 'bg-green-100 text-green-800';
      case 'available': return 'bg-green-100 text-green-800';
      case 'quarantine': return 'bg-yellow-100 text-yellow-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="text-center py-12">
        <MapPinIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Lokasi tidak ditemukan</h3>
        <button onClick={() => navigate('/app/warehouse/locations')} className="mt-4 text-blue-600 hover:underline">
          Kembali ke daftar lokasi
        </button>
      </div>
    );
  }

  const utilPct = getUtilizationPercent();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/warehouse/locations')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{location.location_code}</h1>
            <p className="text-gray-600">
              Zone: {location.zone_code} - {location.zone_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
            location.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {location.is_active ? <CheckCircleIcon className="h-4 w-4" /> : <ExclamationCircleIcon className="h-4 w-4" />}
            {location.is_active ? 'Aktif' : 'Nonaktif'}
          </div>
          <Link
            to={`/app/warehouse/locations/${location.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </Link>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600">Zone</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{location.zone_code}</p>
          <p className="text-sm text-gray-500">{location.zone_material_type}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPinIcon className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600">Posisi</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            R{location.rack} - L{location.level} - P{location.position}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CubeIcon className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-600">Kapasitas</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {location.capacity.toLocaleString()} {location.capacity_uom}
          </p>
          <p className="text-sm text-gray-500">
            Terpakai: {location.occupied.toLocaleString()} | Sisa: {location.available.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-gray-600">Utilisasi</span>
          </div>
          <p className={`text-2xl font-bold ${
            utilPct >= 90 ? 'text-red-600' : utilPct >= 75 ? 'text-orange-600' : utilPct >= 50 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {utilPct.toFixed(1)}%
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full ${getUtilizationColor(utilPct)}`}
              style={{ width: `${Math.min(utilPct, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'inventory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Inventory ({inventoryItems.length})
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'movements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Riwayat Pergerakan ({movements.length})
            </button>
          </nav>
        </div>

        <div className="p-4">
          {activeTab === 'inventory' && (
            <>
              {inventoryItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CubeIcon className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                  <p>Tidak ada inventory di lokasi ini</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">On Hand</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reserved</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Available</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Masuk</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inventoryItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.item_name}</p>
                              <p className="text-xs text-gray-500">{item.item_code}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.item_type === 'product' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {item.item_type === 'product' ? 'Produk' : 'Material'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.batch_number || '-'}
                            {item.lot_number && <span className="text-xs text-gray-400 block">Lot: {item.lot_number}</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                            {item.quantity_on_hand.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-orange-600">
                            {item.quantity_reserved.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                            {item.quantity_available.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(item.stock_status)}`}>
                              {item.stock_status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'movements' && (
            <>
              {movements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ClockIcon className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                  <p>Belum ada riwayat pergerakan</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referensi</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {movements.map((mv) => (
                        <tr key={mv.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {getMovementIcon(mv.movement_type)}
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getMovementColor(mv.movement_type)}`}>
                                {mv.movement_type.replace('_', ' ')}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{mv.item_name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                            {mv.movement_type === 'stock_out' ? '-' : '+'}{mv.quantity.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{mv.batch_number || '-'}</td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm text-gray-900">{mv.reference_number || '-'}</p>
                              {mv.reference_type && (
                                <p className="text-xs text-gray-500">{mv.reference_type.replace('_', ' ')}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">
                            {mv.unit_cost ? `Rp ${mv.unit_cost.toLocaleString()}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">
                            {mv.total_cost ? `Rp ${mv.total_cost.toLocaleString()}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {mv.created_at ? new Date(mv.created_at).toLocaleDateString('id-ID', {
                              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            }) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationDetail;
