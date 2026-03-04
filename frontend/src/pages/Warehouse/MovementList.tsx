import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowsUpDownIcon as ArrowUpDown,
  CalendarIcon as Calendar,
  CubeIcon,
  DocumentTextIcon,
  EyeIcon as Eye,
  FunnelIcon,
  MagnifyingGlassIcon as Search,
  MapPinIcon,
  PencilIcon as Edit,
  PlusIcon as Plus,
  TagIcon
} from '@heroicons/react/24/outline';
interface InventoryMovement {
  id: number;
  movement_number: string;
  movement_type: string;
  product_code: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total_value: number;
  location_code: string;
  location_name: string;
  reference_type: string;
  reference_number: string;
  movement_date: string;
  created_by: string;
  notes: string;
  status: string;
}

const MovementList: React.FC = () => {
  const { t } = useLanguage();

  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  const movementTypes = [
    { value: 'stock_in', label: 'Stock In', color: 'text-green-600', icon: ArrowDownTrayIcon },
    { value: 'stock_out', label: 'Stock Out', color: 'text-red-600', icon: ArrowUpTrayIcon },
    { value: 'receive', label: 'Receive', color: 'text-green-600', icon: ArrowDownTrayIcon },
    { value: 'issue', label: 'Issue', color: 'text-red-600', icon: ArrowUpTrayIcon },
    { value: 'transfer', label: 'Transfer', color: 'text-blue-600', icon: ArrowUpDown },
    { value: 'adjust', label: 'Adjustment', color: 'text-purple-600', icon: DocumentTextIcon },
    { value: 'production_receipt', label: 'Produksi Masuk', color: 'text-emerald-600', icon: CubeIcon }
  ];

  const statusOptions = [
    'pending',
    'confirmed',
    'completed',
    'cancelled'
  ];

  useEffect(() => {
    fetchMovements();
  }, [currentPage, searchTerm, filterType, filterStatus, dateFrom, dateTo]);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterType && { movement_type: filterType }),
        ...(filterStatus && { status: filterStatus }),
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo })
      });

      const response = await fetch(`/api/warehouse/movements?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMovements(data.movements || []);
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      }
    } catch (error) {
      console.error('Failed to fetch movements:', error);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const getMovementTypeInfo = (type: string) => {
    return movementTypes.find(t => t.value === type) || { value: type, label: type, color: 'text-gray-600', icon: DocumentTextIcon };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const exportMovements = async () => {
    try {
      const params = new URLSearchParams({
        export: 'true',
        ...(searchTerm && { search: searchTerm }),
        ...(filterType && { movement_type: filterType }),
        ...(filterStatus && { status: filterStatus }),
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo })
      });

      const response = await fetch(`/api/warehouse/movements/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory_movements_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export movements:', error);
      alert('Failed to export data');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterStatus('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Movements</h1>
          <p className="text-gray-600">Track all inventory movements and transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportMovements}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <ArrowDownTrayIcon className="inline h-4 w-4 mr-2" />{t('common.export')}</button>
          <Link
            to="/app/warehouse/movements/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="inline h-4 w-4 mr-2" />
            New Movement
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search movements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            {movementTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="From Date"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="To Date"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
            </button>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <FunnelIcon className="h-4 w-4" />
              {movements.length} results
            </div>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      {movements.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <ArrowUpDown className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No movements found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterType || filterStatus || dateFrom || dateTo
                ? 'Try adjusting your filters to see more movements.'
                : 'Get started by recording your first inventory movement.'
              }
            </p>
            {!searchTerm && !filterType && !filterStatus && !dateFrom && !dateTo && (
              <Link
                to="/app/warehouse/movements/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Record First Movement
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Movement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('production.product')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.quantity')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.date')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.map((movement) => {
                  const typeInfo = getMovementTypeInfo(movement.movement_type);
                  const TypeIcon = typeInfo.icon;
                  
                  return (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {movement.movement_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {movement.reference_type}: {movement.reference_number}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CubeIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {movement.product_code}
                            </div>
                            <div className="text-sm text-gray-500">
                              {movement.product_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center ${typeInfo.color}`}>
                          <TypeIcon className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">
                            {typeInfo.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {movement.quantity.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(movement.total_value)}
                        </div>
                        <div className="text-sm text-gray-500">
                          @ {formatCurrency(movement.unit_cost)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {movement.location_code}
                            </div>
                            <div className="text-sm text-gray-500">
                              {movement.location_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm text-gray-900">
                              {new Date(movement.movement_date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(movement.movement_date).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(movement.status)}`}>
                          {movement.status.charAt(0).toUpperCase() + movement.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/app/warehouse/movements/${movement.id}`}
                            className="text-blue-600 hover:text-blue-900" title="Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/app/warehouse/movements/${movement.id}/edit`}
                            className="text-gray-500 hover:text-gray-900" title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Movement Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {movementTypes.map((type) => {
            const count = movements.filter(m => m.movement_type === type.value).length;
            const TypeIcon = type.icon;
            return (
              <div key={type.value} className="text-center">
                <div className={`flex items-center justify-center mb-2 ${type.color}`}>
                  <TagIcon className="h-6 w-6" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600">{type.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MovementList;
