import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  BuildingOfficeIcon as Building,
  CheckIcon as Save,
  CubeIcon,
  ExclamationCircleIcon,
  MapPinIcon,
  RectangleGroupIcon as Grid,
  SquaresPlusIcon as Layers,
  XMarkIcon as X
} from '@heroicons/react/24/outline';
interface Zone {
  id: number;
  name: string;
  code: string;
  material_type: string;
}

interface LocationFormData {
  zone_id: number;
  location_code: string;
  rack: string;
  level: string;
  position: string;
  capacity: number;
  capacity_uom: string;
  is_active: boolean;
  is_available: boolean;
}

const LocationForm: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<LocationFormData>({
    zone_id: 0,
    location_code: '',
    rack: '',
    level: '',
    position: '',
    capacity: 0,
    capacity_uom: 'Pcs',
    is_active: true,
    is_available: true
  });

  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const uomOptions = [
    'Pcs', 'Kg', 'Liter', 'Meter', 'Roll', 'Box', 'Pallet', 'Cubic Meter'
  ];

  useEffect(() => {
    fetchZones();
    if (isEdit) {
      fetchLocation();
    }
  }, [id]);

  useEffect(() => {
    // Auto-generate location code when zone, rack, level, or position changes
    if (formData.zone_id && formData.rack && formData.level && formData.position) {
      const selectedZone = zones.find(z => z.id === formData.zone_id);
      if (selectedZone) {
        const locationCode = `${selectedZone.code}-${formData.rack}-${formData.level}-${formData.position}`;
        setFormData(prev => ({ ...prev, location_code: locationCode }));
      }
    }
  }, [formData.zone_id, formData.rack, formData.level, formData.position, zones]);

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

  const fetchLocation = async () => {
    try {
      const response = await fetch(`/api/warehouse/locations/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          zone_id: data.zone_id,
          location_code: data.location_code,
          rack: data.rack,
          level: data.level,
          position: data.position,
          capacity: data.capacity,
          capacity_uom: data.capacity_uom,
          is_active: data.is_active,
          is_available: data.is_available
        });
      }
    } catch (error) {
      console.error('Failed to fetch location:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = isEdit 
        ? `/api/warehouse/locations/${id}` 
        : '/api/warehouse/locations';
      
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        navigate('/app/warehouse/locations');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save location');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : name === 'zone_id' || name === 'capacity' 
          ? Number(value) 
          : value
    }));
  };

  const selectedZone = zones.find(z => z.id === formData.zone_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Location' : 'Add Location'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update warehouse location details' : 'Add new location to warehouse zone'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <ExclamationCircleIcon className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Zone Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="inline h-4 w-4 mr-1" />
              Warehouse Zone *
            </label>
            <select
              name="zone_id"
              value={formData.zone_id}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Zone</option>
              {zones.map(zone => (
                <option key={zone.id} value={zone.id}>
                  {zone.code} - {zone.name} ({zone.material_type})
                </option>
              ))}
            </select>
            {selectedZone && (
              <p className="mt-1 text-sm text-gray-500">
                Material Type: {selectedZone.material_type}
              </p>
            )}
          </div>

          {/* Location Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Grid className="inline h-4 w-4 mr-1" />
                Rack *
              </label>
              <input
                type="text"
                name="rack"
                value={formData.rack}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., A01, B02"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Layers className="inline h-4 w-4 mr-1" />
                Level *
              </label>
              <input
                type="text"
                name="level"
                value={formData.level}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., L1, L2, L3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPinIcon className="inline h-4 w-4 mr-1" />
                Position *
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., P01, P02"
              />
            </div>
          </div>

          {/* Generated Location Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location Code
            </label>
            <input
              type="text"
              name="location_code"
              value={formData.location_code}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Auto-generated based on zone-rack-level-position"
              readOnly={!isEdit}
            />
            <p className="mt-1 text-sm text-gray-500">
              Format: ZONE-RACK-LEVEL-POSITION (e.g., FG-A01-L1-P01)
            </p>
          </div>

          {/* Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CubeIcon className="inline h-4 w-4 mr-1" />
                Capacity *
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter capacity"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit of Measure *
              </label>
              <select
                name="capacity_uom"
                value={formData.capacity_uom}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {uomOptions.map(uom => (
                  <option key={uom} value={uom}>{uom}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Checkboxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Active Location
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_available"
                checked={formData.is_available}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Available for Storage
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/warehouse/locations')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <X className="inline h-4 w-4 mr-2" />{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="inline h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update Location' : 'Add Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LocationForm;
