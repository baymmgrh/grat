import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  CalendarIcon as Calendar,
  CheckIcon as Save,
  ClockIcon,
  CubeIcon,
  DocumentTextIcon,
  ExclamationCircleIcon
,
  MapPinIcon as MapPin,
  TruckIcon as Truck
} from '@heroicons/react/24/outline';
interface TrackingFormData {
  shipping_order_id: number;
  event_date: string;
  event_time: string;
  location: string;
  status: string;
  description: string;
  notes: string;
  latitude: number;
  longitude: number;
  temperature: number;
  humidity: number;
  photos: File[];
}

interface ShippingOrder {
  id: number;
  shipping_number: string;
  customer_name: string;
  tracking_number: string;
  current_status: string;
}

const ShippingTrackingForm: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { orderId, trackingId } = useParams();
  const isEdit = Boolean(trackingId);

  const [formData, setFormData] = useState<TrackingFormData>({
    shipping_order_id: orderId ? parseInt(orderId) : 0,
    event_date: new Date().toISOString().split('T')[0],
    event_time: new Date().toTimeString().slice(0, 5),
    location: '',
    status: 'in_transit',
    description: '',
    notes: '',
    latitude: 0,
    longitude: 0,
    temperature: 0,
    humidity: 0,
    photos: []
  });

  const [shippingOrder, setShippingOrder] = useState<ShippingOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  const trackingStatuses = [
    { value: 'picked_up', label: 'Picked Up', color: 'bg-blue-100 text-blue-800' },
    { value: 'in_transit', label: 'In Transit', color: 'bg-purple-100 text-purple-800' },
    { value: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-orange-100 text-orange-800' },
    { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
    { value: 'failed_delivery', label: 'Failed Delivery', color: 'bg-red-100 text-red-800' },
    { value: 'returned', label: 'Returned', color: 'bg-gray-100 text-gray-800' },
    { value: 'delayed', label: 'Delayed', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'damaged', label: 'Damaged', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    if (orderId) {
      fetchShippingOrder();
    }
    if (isEdit && trackingId) {
      fetchTrackingEvent();
    }
  }, [orderId, trackingId]);

  const fetchShippingOrder = async () => {
    try {
      const response = await fetch(`/api/shipping/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setShippingOrder(data.shipping_order);
      }
    } catch (error) {
      console.error('Failed to fetch shipping order:', error);
    }
  };

  const fetchTrackingEvent = async () => {
    try {
      const response = await fetch(`/api/shipping/tracking/${trackingId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const event = data.tracking_event;
        const eventDateTime = new Date(event.event_date);
        
        setFormData({
          shipping_order_id: event.shipping_order_id,
          event_date: eventDateTime.toISOString().split('T')[0],
          event_time: eventDateTime.toTimeString().slice(0, 5),
          location: event.location || '',
          status: event.status,
          description: event.description || '',
          notes: event.notes || '',
          latitude: event.latitude || 0,
          longitude: event.longitude || 0,
          temperature: event.temperature || 0,
          humidity: event.humidity || 0,
          photos: []
        });
      }
    } catch (error) {
      console.error('Failed to fetch tracking event:', error);
    }
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          
          // Reverse geocoding to get location name
          reverseGeocode(position.coords.latitude, position.coords.longitude);
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationLoading(false);
          alert('Unable to get current location. Please enter manually.');
        }
      );
    } else {
      setLocationLoading(false);
      alert('Geolocation is not supported by this browser.');
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // This would typically use a geocoding service like Google Maps API
      // For now, we'll just set a placeholder
      setFormData(prev => ({
        ...prev,
        location: `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
      }));
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.location.trim()) {
      setError('Please provide a location');
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError('Please provide a description');
      setLoading(false);
      return;
    }

    try {
      const eventDateTime = new Date(`${formData.event_date}T${formData.event_time}`);
      
      const submitData = {
        ...formData,
        event_date: eventDateTime.toISOString(),
        shipping_order_id: parseInt(orderId || '0')
      };

      const url = isEdit 
        ? `/api/shipping/tracking/${trackingId}` 
        : '/api/shipping/tracking';
      
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        navigate(`/app/shipping/orders/${orderId}`);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save tracking event');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' 
        ? (value === '' ? 0 : Number(value))
        : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        photos: Array.from(e.target.files || [])
      }));
    }
  };

  const getStatusInfo = (status: string) => {
    return trackingStatuses.find(s => s.value === status) || trackingStatuses[1];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Tracking Event' : 'Add Tracking Event'}
          </h1>
          {shippingOrder && (
            <p className="text-gray-600">
              Shipping Order: {shippingOrder.shipping_number} - {shippingOrder.customer_name}
            </p>
          )}
        </div>
        
        {shippingOrder && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Current Status:</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(shippingOrder.current_status).color}`}>
              {getStatusInfo(shippingOrder.current_status).label}
            </span>
          </div>
        )}
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

          {/* Event Details */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              <CubeIcon className="inline h-4 w-4 mr-1" />
              Event Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Event Date *
                </label>
                <input
                  type="date"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ClockIcon className="inline h-4 w-4 mr-1" />
                  Event Time *
                </label>
                <input
                  type="time"
                  name="event_time"
                  value={formData.event_time}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Truck className="inline h-4 w-4 mr-1" />
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {trackingStatuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Location *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter location or address"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {locationLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="inline h-4 w-4 mr-1" />
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                placeholder="Describe what happened at this tracking event..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Location Coordinates */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              GPS Coordinates (Optional)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                </label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  step="any"
                  placeholder="0.000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                </label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  step="any"
                  placeholder="0.000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Environmental Conditions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Environmental Conditions (Optional)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleInputChange}
                  step="0.1"
                  placeholder="25.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Humidity (%)
                </label>
                <input
                  type="number"
                  name="humidity"
                  value={formData.humidity}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  placeholder="60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={2}
              placeholder="Any additional notes or observations..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos (Optional)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Upload photos of the package or delivery location
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(`/app/shipping/orders/${orderId}`)}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <X className="inline h-4 w-4 mr-2" />{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="inline h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update Event' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShippingTrackingForm;
