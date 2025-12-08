import React from 'react';
import { 
  CheckCircleIcon, 
  KeyIcon,
  LockClosedIcon,
  ShieldCheckIcon 
} from '@heroicons/react/24/outline';

interface Permission {
  id: number;
  name: string;
  code: string;
  description?: string;
  module?: string;
  is_active: boolean;
}

interface PermissionTableProps {
  permissions: Permission[];
}

const PermissionTable: React.FC<PermissionTableProps> = ({ permissions }) => {
  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const module = permission.module || 'General';
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const getModuleIcon = (module: string) => {
    const icons: Record<string, any> = {
      'Sales': '📊',
      'Purchasing': '🛒',
      'Production': '🏭',
      'Warehouse': '📦',
      'HR': '👥',
      'Finance': '💰',
      'Quality': '✅',
      'Maintenance': '🔧',
      'General': '⚙️'
    };
    return icons[module] || '📋';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center space-x-3">
          <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">System Permissions</h2>
            <p className="text-sm text-gray-600 mt-1">
              Permissions are automatically managed by the system based on modules and actions
            </p>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Permissions</span>
              <KeyIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              {permissions.length}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active</span>
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600 mt-2">
              {permissions.filter(p => p.is_active).length}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Modules</span>
              <LockClosedIcon className="h-5 w-5 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-indigo-600 mt-2">
              {Object.keys(groupedPermissions).length}
            </div>
          </div>
        </div>
      </div>

      {/* Permissions by Module */}
      {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
        <div key={module} className="bg-white rounded-lg shadow overflow-hidden">
          {/* Module Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getModuleIcon(module)}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{module}</h3>
                <p className="text-sm text-gray-600">
                  {modulePermissions.length} permissions
                </p>
              </div>
            </div>
          </div>

          {/* Permissions Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modulePermissions.map((permission) => (
                <div
                  key={permission.id}
                  className={`border rounded-lg p-4 transition-all ${
                    permission.is_active
                      ? 'border-green-200 bg-green-50 hover:shadow-md'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <KeyIcon className={`h-4 w-4 ${
                          permission.is_active ? 'text-green-600' : 'text-gray-400'
                        }`} />
                        <h4 className="text-sm font-semibold text-gray-900">
                          {permission.name}
                        </h4>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-1 font-mono bg-white px-2 py-1 rounded">
                        {permission.code}
                      </p>
                      
                      {permission.description && (
                        <p className="text-xs text-gray-500 mt-2">
                          {permission.description}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      {permission.is_active ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <ShieldCheckIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900">About Permissions</h4>
            <p className="text-sm text-blue-700 mt-1">
              Permissions are automatically generated based on system modules and actions. 
              They control what users can view, create, edit, or delete in each module.
              Assign permissions to roles to control user access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionTable;
