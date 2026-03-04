import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ExclamationTriangleIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import {
  useDeleteUserMutation
} from '../../services/api';
import {
  useDeleteRoleMutation,
  useGetPermissionsQuery,
  useGetRolesQuery,
  useGetUsersQuery,
  useCreatePermissionMutation
} from '../../services/userManagementApi';
import UserManagementHeader from '../../components/Settings/UserManagementHeader';
import UserTable from '../../components/Settings/UserTable';
import RoleTable from '../../components/Settings/RoleTable';
import PermissionTable from '../../components/Settings/PermissionTable';
import UserModal from '../../components/Settings/UserModal';
import RoleModal from '../../components/Settings/RoleModal';
import PermissionModal from '../../components/Settings/PermissionModal';

// Components
const UserRoleManagementNew: React.FC = () => {
  const { t } = useLanguage();

  // API hooks
  const { data: usersData, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useGetUsersQuery();
  const { data: rolesData, isLoading: rolesLoading, error: rolesError, refetch: refetchRoles } = useGetRolesQuery();
  const { data: permissionsData, isLoading: permissionsLoading, refetch: refetchPermissions } = useGetPermissionsQuery();
  
  // Mutations
  const [deleteUser] = useDeleteUserMutation();
  const [deleteRole] = useDeleteRoleMutation();
  const [createPermission] = useCreatePermissionMutation();
  
  // Local state
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    type: 'user' | 'role';
    id: number;
    name: string;
  } | null>(null);
  
  // Derived data
  const users = usersData?.users || [];
  const roles = rolesData?.roles || [];
  const permissions = permissionsData?.permissions || [];
  const loading = usersLoading || rolesLoading || permissionsLoading;
  
  // FunnelIcon functions
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.is_active) ||
                         (filterStatus === 'inactive' && !user.is_active);
    return matchesSearch && matchesStatus;
  });
  
  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && role.is_active) ||
                         (filterStatus === 'inactive' && !role.is_active);
    return matchesSearch && matchesStatus;
  });
  
  // Handle functions
  const handleCreateUser = () => {
    setEditingUser(null);
    setShowUserModal(true);
  };
  
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserModal(true);
  };
  
  const handleViewUser = (user: User) => {
    setViewingUser(user);
  };
  
  const handleDeleteUser = (user: User) => {
    setShowDeleteConfirm({ type: 'user', id: user.id, name: user.full_name });
  };
  
  const handleCreateRole = () => {
    setEditingRole(null);
    setShowRoleModal(true);
  };
  
  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setShowRoleModal(true);
  };
  
  const handleDeleteRole = (role: Role) => {
    setShowDeleteConfirm({ type: 'role', id: role.id, name: role.name });
  };
  
  const handleCreatePermission = () => {
    setEditingPermission(null);
    setShowPermissionModal(true);
  };
  
  const handleSavePermission = async (permissionData: any) => {
    try {
      // Prepare data for API (remove 'code' field as backend doesn't need it)
      const { code, ...apiData } = permissionData;
      
      // Call API to create permission
      await createPermission(apiData).unwrap();
      
      // Refresh permissions list immediately
      await refetchPermissions();
      
      alert('Permission created successfully!');
    } catch (error: any) {
      console.error('Error saving permission:', error);
      alert(error?.data?.error || 'Failed to save permission');
    }
  };
  
  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;
    
    try {
      if (showDeleteConfirm.type === 'user') {
        await deleteUser(showDeleteConfirm.id).unwrap();
      } else {
        await deleteRole(showDeleteConfirm.id).unwrap();
      }
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (usersError || rolesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
            <p className="text-sm text-red-700 mt-1">Failed to load user management data. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with tabs and filters */}
      <UserManagementHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onCreateUser={handleCreateUser}
        onCreateRole={handleCreateRole}
        onCreatePermission={handleCreatePermission}
        userCount={users.length}
        roleCount={roles.length}
        permissionCount={permissions.length}
      />

      {/* Content based on active tab */}
      <div className="bg-white shadow rounded-lg p-6">
        {activeTab === 'users' && (
          <UserTable
            users={filteredUsers}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onView={handleViewUser}
          />
        )}

        {activeTab === 'roles' && (
          <RoleTable
            roles={filteredRoles}
            onEdit={handleEditRole}
            onDelete={handleDeleteRole}
          />
        )}

        {activeTab === 'permissions' && (
          <PermissionTable permissions={permissions} />
        )}
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setEditingUser(null);
        }}
        user={editingUser}
        roles={roles}
      />

      {/* Role Modal */}
      <RoleModal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setEditingRole(null);
        }}
        role={editingRole}
        permissions={permissions}
      />

      {/* Permission Modal */}
      <PermissionModal
        isOpen={showPermissionModal}
        onClose={() => {
          setShowPermissionModal(false);
          setEditingPermission(null);
        }}
        permission={editingPermission}
        onSave={handleSavePermission}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete {showDeleteConfirm.type}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete "{showDeleteConfirm.name}"? 
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >{t('common.delete')}</button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >{t('common.cancel')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setViewingUser(null)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">User Details</h3>
                  <button
                    onClick={() => setViewingUser(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingUser.full_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Username</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingUser.username}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingUser.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('common.status')}</label>
                      <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        viewingUser.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {viewingUser.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                    <div className="flex flex-wrap gap-2">
                      {viewingUser.roles && viewingUser.roles.length > 0 ? (
                        viewingUser.roles.map((role) => (
                          <span key={role.id} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {role.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No roles assigned</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Login</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {viewingUser.last_login 
                          ? new Date(viewingUser.last_login).toLocaleString()
                          : 'Never'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(viewingUser.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRoleManagementNew;
