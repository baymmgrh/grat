import { useLanguage } from '../../contexts/LanguageContext';
import { useGetWarehouseZonesQuery, useGetWarehouseLocationsQuery } from '../../services/api';
export default function WarehouseLocations() {
    const { t } = useLanguage();

const { data: zones } = useGetWarehouseZonesQuery({})
  const { data: locations, isLoading } = useGetWarehouseLocationsQuery({})

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Warehouse Locations</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {zones?.zones?.map((zone: any) => (
          <div key={zone.id} className="card p-4">
            <h3 className="font-semibold text-gray-900">{zone.name}</h3>
            <p className="text-sm text-gray-500">{zone.code}</p>
            <p className="mt-2 text-xs text-gray-600">{zone.material_type}</p>
            <p className="mt-1 text-sm font-medium text-primary-600">
              {zone.location_count} locations
            </p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12">{t('common.loading')}</div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Location Code</th>
                  <th>Zone</th>
                  <th>Rack</th>
                  <th>Level</th>
                  <th>Position</th>
                  <th>Capacity</th>
                  <th>Occupied</th>
                  <th>Available</th>
                  <th>{t('common.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {locations?.locations?.map((location: any) => (
                  <tr key={location.id}>
                    <td className="font-medium">{location.location_code}</td>
                    <td>{location.zone}</td>
                    <td>{location.rack}</td>
                    <td>{location.level}</td>
                    <td>{location.position}</td>
                    <td>{location.capacity}</td>
                    <td>{location.occupied}</td>
                    <td className="text-green-600 font-medium">{location.available}</td>
                    <td>
                      <span className={`badge ${location.is_available ? 'badge-success' : 'badge-danger'}`}>
                        {location.is_available ? 'Available' : 'Full'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
