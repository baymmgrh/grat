import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Role } from '../../types/auth';
import {
  PencilIcon,
  ShieldCheckIcon,
  TrashIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
interface RoleTableProps {
  roles: Role[];
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}

const RoleTable: React.FC<RoleTableProps> = ({ roles, onEdit, onDelete }) => {
  const { t } = useLanguage();

  if (roles.length === 0) {
    return (
      <div className="text-center py-12">
        <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No roles found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new role.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {roles.map((role) => (
        <div key={role.id} className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ShieldCheckIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">{role.name}</h3>
                  <p className="text-sm text-gray-500">{role.description || 'No description'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onEdit(role)}
                  className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50"
                  title="Edit Role"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(role)}
                  className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                  title="Delete Role"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between mb-4">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                role.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {role.is_active ? 'Active' : 'Inactive'}
              </span>
              <div className="flex items-center text-sm text-gray-500">
                <UsersIcon className="h-4 w-4 mr-1" />
                {role.user_count} users
              </div>
            </div>

            {/* Permissions */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Permissions ({role.permissions?.length || 0})
              </h4>
              {role.permissions && role.permissions.length > 0 ? (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {role.permissions.slice(0, 5).map((permission) => (
                    <div key={permission.id} className="flex items-center text-xs text-gray-600">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                      <span className="font-medium">{permission.module}:</span>
                      <span className="ml-1">{permission.name}</span>
                    </div>
                  ))}
                  {role.permissions.length > 5 && (
                    <div className="text-xs text-gray-500 italic">
                      +{role.permissions.length - 5} more permissions
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">No permissions assigned</p>
              )}
            </div>

            {/* Created Date */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Created: {new Date(role.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RoleTable;
