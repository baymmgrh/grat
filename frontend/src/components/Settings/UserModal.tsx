import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCreateUserMutation, useUpdateUserMutation } from '../../services/api';
import { useAssignUserRolesMutation } from '../../services/userManagementApi';
import type { Role, User } from '../../types/auth';
import {
  XMarkIcon
} from '@heroicons/react/24/outline';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  roles: Role[];
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, user, roles }) => {
  const { t } = useLanguage();

  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [assignUserRoles] = useAssignUserRolesMutation();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    phone: '',
    department: '',
    position: '',
    password: '',
    confirmPassword: '',
    is_active: true,
    is_admin: false,
    selectedRoles: [] as number[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone: (user as any).phone || '',
        department: (user as any).department || '',
        position: (user as any).position || '',
        password: '',
        confirmPassword: '',
        is_active: user.is_active,
        is_admin: user.is_admin,
        selectedRoles: user.roles?.map(role => role.id) || []
      });
    } else {
      setFormData({
        username: '',
        email: '',
        full_name: '',
        phone: '',
        department: '',
        position: '',
        password: '',
        confirmPassword: '',
        is_active: true,
        is_admin: false,
        selectedRoles: []
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!user && !formData.password) {
      newErrors.password = 'Password is required for new users';
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const userData = {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
        is_active: formData.is_active,
        is_admin: formData.is_admin,
        ...(formData.password && { password: formData.password })
      };

      if (user) {
        // Spread userData directly with id for the API
        await updateUser({ id: user.id, ...userData }).unwrap();
      } else {
        await createUser(userData).unwrap();
      }

      // Assign roles if user exists or after creation
      if (user && formData.selectedRoles.length > 0) {
        await assignUserRoles({
          userId: user.id,
          data: { role_ids: formData.selectedRoles }
        }).unwrap();
      }

      onClose();
    } catch (error: any) {
      console.error('Failed to save user:', error);
      setErrors({ submit: error.data?.error || 'Failed to save user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleToggle = (roleId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedRoles: prev.selectedRoles.includes(roleId)
        ? prev.selectedRoles.filter(id => id !== roleId)
        : [...prev.selectedRoles, roleId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">
                  {user ? 'Edit User' : 'Create New User'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6">

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 border-b pb-2">Basic Information</h4>
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                      errors.username ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter username"
                  />
                  {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter email"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                        errors.full_name ? 'border-red-300' : 'border-gray-300'
                      } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Enter full name"
                    />
                    {errors.full_name && <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+62 xxx xxxx xxxx"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., IT, Sales, Finance"
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Position</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Manager, Staff, Supervisor"
                    />
                  </div>
                </div>

                {/* Right Column - Account & Security */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 border-b pb-2">Account & Security</h4>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password {user && <span className="text-gray-500">(leave blank to keep current)</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter password"
                  />
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                  {/* Confirm Password */}
                  {formData.password && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Confirm Password <span className="text-red-500">*</span></label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                          errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="Confirm password"
                      />
                      {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                    </div>
                  )}

                  {/* Status & Permissions */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h5 className="text-sm font-semibold text-gray-900">Status & Permissions</h5>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active User</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_admin}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_admin: e.target.checked }))}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500 h-4 w-4"
                      />
                      <span className="ml-2 text-sm text-gray-700">System Administrator</span>
                    </label>
                  </div>

                  {/* Roles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assign Roles</label>
                    <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3 bg-white">
                      {roles.length > 0 ? (
                        roles.map((role) => (
                          <label key={role.id} className="flex items-start py-2 hover:bg-gray-50 rounded px-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.selectedRoles.includes(role.id)}
                              onChange={() => handleRoleToggle(role.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 h-4 w-4"
                            />
                            <div className="ml-3">
                              <span className="text-sm font-medium text-gray-900">{role.name}</span>
                              {role.description && (
                                <p className="text-xs text-gray-500">{role.description}</p>
                              )}
                            </div>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No roles available</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Selected: {formData.selectedRoles.length} role(s)
                    </p>
                  </div>
                </div>
              </div>

              {errors.submit && (
                <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md">
                  {errors.submit}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : (user ? 'Update User' : 'Create User')}
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

export default UserModal;
