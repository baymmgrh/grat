import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  CubeIcon,
  EyeIcon,
  ExclamationCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
interface WarehouseLocation {
  id: number;
  code?: string;
  name?: string;
  location_code?: string;
  zone_code?: string;
  zone_name?: string;
  location_type?: string;
  capacity?: number;
  capacity_uom?: string;
  current_utilization?: number;
  is_active: boolean;
  created_at?: string;
}

const LocationList: React.FC = () => {
  const { t } = useLanguage();

  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterType, setFilterType] = useState('');
  const [zones, setZones] = useState<any[]>([]);

  const locationTypes = [
    'storage',
    'picking',
    'receiving',
    'shipping',
    'staging',
    'quarantine'
  ];

  useEffect(() => {
    fetchLocations();
    fetchZones();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/warehouse/locations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLocations(data.locations || []);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const response = await fetch('/api/warehouse/zones', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setZones(data.zones || []);
      }
    } catch (error) {
      console.error('Failed to fetch zones:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      const response = await fetch(`/api/warehouse/locations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchLocations();
      } else {
        alert('Failed to delete location');
      }
    } catch (error) {
      alert('Error deleting location');
    }
  };

  const filteredLocations = locations.filter(location => {
    const code = (location.code || location.location_code || '').toLowerCase();
    const name = (location.name || location.zone_name || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = code.includes(search) || name.includes(search);
    const matchesZone = !filterZone || location.zone_code === filterZone;
    const matchesType = !filterType || location.location_type === filterType;
    
    return matchesSearch && matchesZone && matchesType;
  });

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <CheckCircleIcon className="h-4 w-4" /> : <ExclamationCircleIcon className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'storage': return 'bg-blue-100 text-blue-800';
      case 'picking': return 'bg-green-100 text-green-800';
      case 'receiving': return 'bg-purple-100 text-purple-800';
      case 'shipping': return 'bg-orange-100 text-orange-800';
      case 'staging': return 'bg-yellow-100 text-yellow-800';
      case 'quarantine': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600';
    if (utilization >= 75) return 'text-orange-600';
    if (utilization >= 50) return 'text-yellow-600';
    return 'text-green-600';
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
          <h1 className="text-2xl font-bold text-gray-900">Warehouse Locations</h1>
          <p className="text-gray-600">Manage warehouse storage locations and zones</p>
        </div>
        <Link
          to="/app/warehouse/locations/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <PlusIcon className="inline h-4 w-4 mr-2" />
          Add Location
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Zones</option>
            {zones.map(zone => (
              <option key={zone.id} value={zone.code}>
                {zone.code} - {zone.name}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            {locationTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {filteredLocations.length} of {locations.length} locations
            </span>
          </div>
        </div>
      </div>

      {/* Locations Grid */}
      {filteredLocations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <MapPinIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterZone || filterType 
                ? 'Try adjusting your filters to see more locations.'
                : 'Get started by creating your first warehouse location.'
              }
            </p>
            {!searchTerm && !filterZone && !filterType && (
              <Link
                to="/app/warehouse/locations/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
          <PlusIcon className="h-4 w-4 mr-2" />
                Add First Location
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((location) => (
            <div key={location.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPinIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{location.code}</h3>
                    <p className="text-sm text-gray-600">{location.name}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1 ${getStatusColor(location.is_active)}`}>
                  {getStatusIcon(location.is_active)}
                </div>
              </div>

              {/* Zone Info */}
              <div className="flex items-center gap-2 mb-3">
                <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Zone: {location.zone_code} - {location.zone_name}
                </span>
              </div>

              {/* Type Badge */}
              <div className="mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(location.location_type || '')}`}>
                  {(location.location_type || 'unknown').charAt(0).toUpperCase() + (location.location_type || 'unknown').slice(1)}
                </span>
              </div>

              {/* Capacity Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Capacity:</span>
                  <span className="text-sm font-medium">
                    {location.capacity ?? '-'} {location.capacity_uom || ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Utilization:</span>
                  <span className={`text-sm font-medium ${getUtilizationColor(location.current_utilization ?? 0)}`}>
                    {(location.current_utilization ?? 0).toFixed(1)}%
                  </span>
                </div>
                
                {/* Utilization Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (location.current_utilization ?? 0) >= 90 ? 'bg-red-500' :
                      (location.current_utilization ?? 0) >= 75 ? 'bg-orange-500' :
                      (location.current_utilization ?? 0) >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(location.current_utilization ?? 0, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                  Created: {location.created_at ? new Date(location.created_at).toLocaleDateString() : '-'}
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/app/warehouse/locations/${location.id}`}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="View Details"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Link>
                  <Link
                    to={`/app/warehouse/locations/${location.id}/edit`}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit Location"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(location.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete Location"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Location Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{locations.length}</div>
            <div className="text-sm text-gray-600">Total Locations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {locations.filter(l => l.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Active Locations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {locations.filter(l => l.current_utilization >= 75).length}
            </div>
            <div className="text-sm text-gray-600">High Utilization</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {zones.length}
            </div>
            <div className="text-sm text-gray-600">Total Zones</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationList;
