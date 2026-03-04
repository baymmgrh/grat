import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  CubeIcon,
  MapPinIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  TagIcon,
  CurrencyDollarIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface MovementData {
  id: number;
  movement_number: string;
  movement_type: string;
  product_id: number | null;
  material_id: number | null;
  product_code: string;
  product_name: string;
  product_uom: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  location_id: number | null;
  location: { id: number; location_code: string; zone_name: string } | null;
  from_location: { id: number; location_code: string; zone_name: string } | null;
  to_location: { id: number; location_code: string; zone_name: string } | null;
  reference_type: string;
  reference_number: string;
  reference_id: number | null;
  batch_number: string;
  lot_number: string;
  serial_number: string;
  expiry_date: string | null;
  movement_date: string;
  notes: string;
  status: string;
  created_by: string;
  created_at: string;
}

const movementTypeLabels: Record<string, string> = {
  stock_in: 'Stock In',
  stock_out: 'Stock Out',
  receive: 'Receive (Incoming)',
  issue: 'Issue (Outgoing)',
  transfer: 'Transfer',
  adjust: 'Adjustment',
  production_receipt: 'Produksi Masuk'
};

const movementTypeColors: Record<string, string> = {
  stock_in: 'bg-green-100 text-green-800',
  receive: 'bg-green-100 text-green-800',
  stock_out: 'bg-red-100 text-red-800',
  issue: 'bg-red-100 text-red-800',
  transfer: 'bg-blue-100 text-blue-800',
  adjust: 'bg-yellow-100 text-yellow-800',
  production_receipt: 'bg-emerald-100 text-emerald-800'
};

const referenceTypeLabels: Record<string, string> = {
  sales_order: 'Sales Order',
  purchase_order: 'Purchase Order',
  work_order: 'Work Order',
  stock_take: 'Stock Take',
  manual_input: 'Manual Input'
};

const MovementDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState<MovementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) fetchMovement();
  }, [id]);

  const fetchMovement = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/warehouse/movements/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        setError('Data movement tidak ditemukan');
      }
    } catch {
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

  const formatDate = (d: string) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return d;
    }
  };

  const formatDateTime = (d: string) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return d;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">{error || 'Data tidak ditemukan'}</p>
          <button onClick={() => navigate('/app/warehouse/movements')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Kembali ke Daftar
          </button>
        </div>
      </div>
    );
  }

  const typeColor = movementTypeColors[data.movement_type] || 'bg-gray-100 text-gray-800';
  const typeLabel = movementTypeLabels[data.movement_type] || data.movement_type;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/app/warehouse/movements')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detail Movement</h1>
            <p className="text-gray-500 text-sm">{data.movement_number}</p>
          </div>
        </div>
        <Link
          to={`/app/warehouse/movements/${id}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <PencilSquareIcon className="h-4 w-4" />
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Movement Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Informasi Movement</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeColor}`}>
                  {typeLabel}
                </span>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {/* Product */}
              <div className="flex items-start gap-3">
                <CubeIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Produk / Material</p>
                  <p className="text-sm font-semibold text-gray-900">{data.product_code} — {data.product_name}</p>
                </div>
              </div>

              {/* Quantity & UoM */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Kuantitas</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{data.quantity.toLocaleString('id-ID')}</p>
                  <p className="text-sm text-gray-500">{data.product_uom}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Tanggal</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{formatDate(data.movement_date)}</p>
                </div>
              </div>

              {/* Locations */}
              {(data.from_location || data.to_location || data.location) && (
                <div className="flex items-center gap-3">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                  <div className="flex items-center gap-2 flex-wrap">
                    {data.from_location && (
                      <span className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
                        Dari: {data.from_location.location_code} ({data.from_location.zone_name})
                      </span>
                    )}
                    {data.from_location && data.to_location && (
                      <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                    )}
                    {data.to_location && (
                      <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                        Ke: {data.to_location.location_code} ({data.to_location.zone_name})
                      </span>
                    )}
                    {!data.from_location && !data.to_location && data.location && (
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                        Lokasi: {data.location.location_code} ({data.location.zone_name})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {data.notes && (
                <div className="flex items-start gap-3">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Catatan</p>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{data.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Batch & Tracking */}
          {(data.batch_number || data.lot_number || data.serial_number || data.expiry_date) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <TagIcon className="h-4 w-4" /> Informasi Batch & Tracking
                </h3>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                {data.batch_number && (
                  <div>
                    <p className="text-xs text-gray-500">Batch Number</p>
                    <p className="text-sm font-medium text-gray-900">{data.batch_number}</p>
                  </div>
                )}
                {data.lot_number && (
                  <div>
                    <p className="text-xs text-gray-500">Lot Number</p>
                    <p className="text-sm font-medium text-gray-900">{data.lot_number}</p>
                  </div>
                )}
                {data.serial_number && (
                  <div>
                    <p className="text-xs text-gray-500">Serial Number</p>
                    <p className="text-sm font-medium text-gray-900">{data.serial_number}</p>
                  </div>
                )}
                {data.expiry_date && (
                  <div>
                    <p className="text-xs text-gray-500">Expiry Date</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(data.expiry_date)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cost Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <CurrencyDollarIcon className="h-4 w-4" /> Informasi Biaya
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Harga Satuan</span>
                <span className="text-sm font-medium">{data.unit_cost ? formatCurrency(data.unit_cost) : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Kuantitas</span>
                <span className="text-sm font-medium">{data.quantity.toLocaleString('id-ID')} {data.product_uom}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="text-sm font-semibold text-gray-700">Total</span>
                <span className="text-sm font-bold text-blue-700">{data.total_cost ? formatCurrency(data.total_cost) : '-'}</span>
              </div>
            </div>
          </div>

          {/* Reference */}
          {(data.reference_type || data.reference_number) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4" /> Referensi
                </h3>
              </div>
              <div className="p-6 space-y-3">
                {data.reference_type && (
                  <div>
                    <p className="text-xs text-gray-500">Tipe Referensi</p>
                    <p className="text-sm font-medium">{referenceTypeLabels[data.reference_type] || data.reference_type}</p>
                  </div>
                )}
                {data.reference_number && (
                  <div>
                    <p className="text-xs text-gray-500">Nomor Referensi</p>
                    <p className="text-sm font-medium">{data.reference_number}</p>
                  </div>
                )}
                {data.reference_id && (
                  <div>
                    <p className="text-xs text-gray-500">Reference ID</p>
                    <p className="text-sm font-medium">#{data.reference_id}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Audit Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <ClockIcon className="h-4 w-4" /> Audit
              </h3>
            </div>
            <div className="p-6 space-y-3">
              {data.created_by && (
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Dibuat oleh</p>
                    <p className="text-sm font-medium">{data.created_by}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Dibuat pada</p>
                  <p className="text-sm font-medium">{formatDateTime(data.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovementDetail;
