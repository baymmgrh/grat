import React from 'react'
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGetEmployeesQuery } from '../../services/api'
import {
  LinkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
export default function EmployeeList() {
    const { t } = useLanguage();

const { data, isLoading } = useGetEmployeesQuery({})

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
        <Link to="/app/hr/employees/new" className="btn-primary inline-flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Add Employee
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12">{t('common.loading')}</div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee Number</th>
                  <th>Full Name</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Employment Type</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.employees?.map((employee: any) => (
                  <tr key={employee.id}>
                    <td className="font-medium">{employee.employee_number}</td>
                    <td>{employee.full_name}</td>
                    <td>{employee.department || '-'}</td>
                    <td>{employee.position || '-'}</td>
                    <td>
                      <span className="badge badge-info">{employee.employment_type?.replace('_', ' ') || '-'}</span>
                    </td>
                    <td>
                      <span className={`badge ${
                        employee.status === 'active' ? 'badge-success' : 
                        employee.status === 'on_leave' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {employee.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/app/hr/employees/${employee.id}`}
                        className="text-primary-600 hover:text-primary-800 text-sm"
                      >
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!data?.employees || data.employees.length === 0) && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            👥
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No employees</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first employee.</p>
          <div className="mt-6">
            <Link to="/app/hr/employees/new" className="btn-primary">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Employee
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
