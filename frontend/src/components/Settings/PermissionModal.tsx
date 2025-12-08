import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Permission {
  id?: number;
  name: string;
  code: string;
  description?: string;
  module: string;
  action: string;
  is_active: boolean;
}

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  permission?: Permission | null;
  onSave: (permission: Omit<Permission, 'id'>) => void;
}

const PermissionModal: React.FC<PermissionModalProps> = ({
  isOpen,
  onClose,
  permission,
  onSave
}) => {
  const [formData, setFormData] = useState<Omit<Permission, 'id'>>({
    name: '',
    code: '',
    description: '',
    module: '',
    action: '',
    is_active: true
  });

  const modules = [
    'Sales',
    'Purchasing',
    'Production',
    'Warehouse',
    'HR',
    'Finance',
    'Quality',
    'Maintenance',
    'Settings',
    'General'
  ];

  const actions = [
    'all',
    'view',
    'create',
    'update',
    'delete',
    'approve',
    'export',
    'import'
  ];

  useEffect(() => {
    if (permission) {
      setFormData({
        name: permission.name,
        code: permission.code,
        description: permission.description || '',
        module: permission.module,
        action: permission.action,
        is_active: permission.is_active
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        module: '',
        action: '',
        is_active: true
      });
    }
  }, [permission, isOpen]);

  // Auto-generate code when module and action change
  useEffect(() => {
    if (formData.module && formData.action) {
      const generatedCode = `${formData.module.toLowerCase()}.${formData.action.toLowerCase()}`;
      setFormData(prev => ({ ...prev, code: generatedCode }));
    }
  }, [formData.module, formData.action]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {permission ? 'Edit Permission' : 'Create New Permission'}
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {/* Module & Action */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Module <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.module}
                    onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select Module</option>
                    {modules.map((module) => (
                      <option key={module} value={module}>
                        {module}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.action}
                    onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select Action</option>
                    {actions.map((action) => (
                      <option key={action} value={action}>
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Permission Code (Auto-generated) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permission Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., sales.view"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-generated from module and action. You can customize it if needed.
                </p>
              </div>

              {/* Permission Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permission Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., View Sales Orders"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Describe what this permission allows..."
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Active (permission is enabled and can be assigned to roles)
                </label>
              </div>

              {/* Info Box */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-800">
                  <strong>Note:</strong> Permissions control what actions users can perform in each module. 
                  After creating a permission, assign it to roles to grant access to users.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                {permission ? 'Update Permission' : 'Create Permission'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PermissionModal;
