import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCreateRoleMutation, useUpdateRoleMutation } from '../../services/userManagementApi';
import type { Permission, Role } from '../../types/auth';
import {
  XMarkIcon
} from '@heroicons/react/24/outline';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
  permissions: Permission[];
}

const RoleModal: React.FC<RoleModalProps> = ({ isOpen, onClose, role, permissions }) => {
  const { t } = useLanguage();

  const [createRole] = useCreateRoleMutation();
  const [updateRole] = useUpdateRoleMutation();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    selectedPermissions: [] as number[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description,
        is_active: role.is_active,
        selectedPermissions: role.permissions?.map(permission => permission.id) || []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        is_active: true,
        selectedPermissions: []
      });
    }
    setErrors({});
  }, [role, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const roleData = {
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active,
        permissions: formData.selectedPermissions
      };

      if (role) {
        await updateRole({ id: role.id, data: roleData }).unwrap();
      } else {
        await createRole(roleData).unwrap();
      }

      onClose();
    } catch (error: any) {
      console.error('Failed to save role:', error);
      setErrors({ submit: error.data?.error || 'Failed to save role' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePermissionToggle = (permissionId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedPermissions: prev.selectedPermissions.includes(permissionId)
        ? prev.selectedPermissions.filter(id => id !== permissionId)
        : [...prev.selectedPermissions, permissionId]
    }));
  };

  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {role ? 'Edit Role' : 'Create New Role'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Basic Information</h4>
                  
                  {/* Role Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Enter role name"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('common.description')}</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter role description"
                    />
                  </div>

                  {/* Active Status */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active Role</span>
                    </label>
                  </div>

                  {/* Selected Permissions Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">
                      Selected Permissions ({formData.selectedPermissions.length})
                    </h5>
                    {formData.selectedPermissions.length > 0 ? (
                      <div className="text-xs text-gray-600">
                        {Object.entries(permissionsByModule).map(([module, modulePermissions]) => {
                          const selectedCount = modulePermissions.filter(p => 
                            formData.selectedPermissions.includes(p.id)
                          ).length;
                          
                          if (selectedCount === 0) return null;
                          
                          return (
                            <div key={module} className="mb-1">
                              <span className="font-medium capitalize">{module}:</span> {selectedCount} permissions
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No permissions selected</p>
                    )}
                  </div>
                </div>

                {/* Right Column - Permissions */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Permissions</h4>
                  
                  <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                    {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
                      <div key={module} className="border-b border-gray-200 last:border-b-0">
                        <div className="bg-gray-50 px-4 py-2">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-medium text-gray-900 capitalize">
                              {module} Module
                            </h5>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const modulePermissionIds = modulePermissions.map(p => p.id);
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedPermissions: [
                                      ...prev.selectedPermissions.filter(id => !modulePermissionIds.includes(id)),
                                      ...modulePermissionIds
                                    ]
                                  }));
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Select All
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const modulePermissionIds = modulePermissions.map(p => p.id);
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedPermissions: prev.selectedPermissions.filter(id => !modulePermissionIds.includes(id))
                                  }));
                                }}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                Clear All
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-2 space-y-1">
                          {modulePermissions.map((permission) => (
                            <label key={permission.id} className="flex items-start py-1 px-2 hover:bg-gray-50 rounded">
                              <input
                                type="checkbox"
                                checked={formData.selectedPermissions.includes(permission.id)}
                                onChange={() => handlePermissionToggle(permission.id)}
                                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="ml-2 flex-1">
                                <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                                <div className="text-xs text-gray-500">{permission.description}</div>
                                <div className="text-xs text-blue-600 font-medium">Action: {permission.action}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {errors.submit && (
                <div className="mt-4 text-sm text-red-600 bg-red-50 p-2 rounded">
                  {errors.submit}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : (role ? 'Update Role' : 'Create Role')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoleModal;
