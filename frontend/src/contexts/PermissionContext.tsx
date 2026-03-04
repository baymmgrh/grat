import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axiosConfig';

interface PermissionContextType {
  permissions: string[];
  modules: string[];
  roles: string[];
  isAdmin: boolean;        // Staff Admin (Admin Produksi, Admin Gudang)
  isSuperAdmin: boolean;   // System Administrator (full access to Settings)
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasModuleAccess: (module: string) => boolean;
  hasRole: (role: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setPermissions([]);
        setModules([]);
        setRoles([]);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsLoading(false);
        return;
      }

      const response = await axiosInstance.get('/api/auth/permissions');
      const data = response.data;
      
      console.log('Permissions loaded:', data);
      
      setPermissions(data.permissions || []);
      setModules(data.modules || []);
      setRoles(data.roles || []);
      setIsAdmin(data.is_admin || false);
      setIsSuperAdmin(data.is_super_admin || false);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      // If error, use fallback from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.is_super_admin) {
        setIsSuperAdmin(true);
        setIsAdmin(true);
        console.log('Fallback: Using is_super_admin from localStorage');
      } else if (user.is_admin) {
        setIsAdmin(true);
        setIsSuperAdmin(false);
        console.log('Fallback: Using is_admin from localStorage');
      } else {
        setPermissions([]);
        setModules([]);
        setRoles([]);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Listen for login/logout events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        fetchPermissions();
      }
    };

    // Listen for auth-change event (triggered by OAuth login)
    const handleAuthChange = () => {
      fetchPermissions();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [fetchPermissions]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (isAdmin) return true;
    return permissions.includes(permission);
  }, [permissions, isAdmin]);

  const hasAnyPermission = useCallback((perms: string[]): boolean => {
    if (isAdmin) return true;
    return perms.some(p => permissions.includes(p));
  }, [permissions, isAdmin]);

  const hasAllPermissions = useCallback((perms: string[]): boolean => {
    if (isAdmin) return true;
    return perms.every(p => permissions.includes(p));
  }, [permissions, isAdmin]);

  const hasModuleAccess = useCallback((module: string): boolean => {
    if (isAdmin) return true;
    return modules.includes(module);
  }, [modules, isAdmin]);

  const hasRole = useCallback((role: string): boolean => {
    return roles.includes(role);
  }, [roles]);

  const refreshPermissions = useCallback(async () => {
    setIsLoading(true);
    await fetchPermissions();
  }, [fetchPermissions]);

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        modules,
        roles,
        isAdmin,
        isSuperAdmin,
        isLoading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasModuleAccess,
        hasRole,
        refreshPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

// HOC for protecting components
export const withPermission = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission: string
) => {
  return (props: P) => {
    const { hasPermission, isLoading } = usePermissions();
    
    if (isLoading) {
      return <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>;
    }
    
    if (!hasPermission(requiredPermission)) {
      return <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
      </div>;
    }
    
    return <WrappedComponent {...props} />;
  };
};

// Component for conditional rendering based on permission
export const PermissionGate: React.FC<{
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  module?: string;
  role?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ permission, permissions, requireAll = false, module, role, fallback = null, children }) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasModuleAccess, hasRole, isLoading } = usePermissions();
  
  if (isLoading) return null;
  
  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  } else if (module) {
    hasAccess = hasModuleAccess(module);
  } else if (role) {
    hasAccess = hasRole(role);
  } else {
    hasAccess = true; // No restriction specified
  }
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default PermissionContext;
