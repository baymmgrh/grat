import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../../contexts/PermissionContext';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

interface AdminRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  showAccessDenied?: boolean;
}

/**
 * AdminRoute - Protects routes that should only be accessible by admins
 * 
 * Usage:
 * <AdminRoute>
 *   <Settings />
 * </AdminRoute>
 */
const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  redirectTo = '/app',
  showAccessDenied = true 
}) => {
  const { isSuperAdmin, isLoading } = usePermissions();
  const location = useLocation();

  // Show loading while checking permissions
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // If not super admin, show access denied or redirect
  if (!isSuperAdmin) {
    if (showAccessDenied) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="bg-red-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <ShieldExclamationIcon className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page. 
              This area is restricted to administrators only.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Go Back
              </button>
              <a
                href="/app"
                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }
    
    // Redirect to specified path
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // User is admin, render children
  return <>{children}</>;
};

export default AdminRoute;
