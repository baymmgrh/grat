import React from 'react';
import {
  FunnelIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ShieldCheckIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
interface UserManagementHeaderProps {
  activeTab: 'users' | 'roles' | 'permissions';
  setActiveTab: (tab: 'users' | 'roles' | 'permissions') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: 'all' | 'active' | 'inactive';
  setFilterStatus: (status: 'all' | 'active' | 'inactive') => void;
  onCreateUser: () => void;
  onCreateRole: () => void;
  onCreatePermission: () => void;
  userCount: number;
  roleCount: number;
  permissionCount: number;
}

const UserManagementHeader: React.FC<UserManagementHeaderProps> = ({
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  onCreateUser,
  onCreateRole,
  onCreatePermission,
  userCount,
  roleCount,
  permissionCount
}) => {
  const tabs = [
    { 
      id: 'users' as const, 
      label: 'Users', 
      icon: UsersIcon, 
      count: userCount,
      description: 'Manage user accounts and access'
    },
    { 
      id: 'roles' as const, 
      label: 'Roles', 
      icon: ShieldCheckIcon, 
      count: roleCount,
      description: 'Define user roles and permissions'
    },
    { 
      id: 'permissions' as const, 
      label: 'Permissions', 
      icon: KeyIcon, 
      count: permissionCount,
      description: 'System permissions and access control'
    }
  ];

  const getCreateButton = () => {
    if (activeTab === 'users') {
      return (
        <button
          onClick={onCreateUser}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add User
        </button>
      );
    } else if (activeTab === 'roles') {
      return (
        <button
          onClick={onCreateRole}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Role
        </button>
      );
    } else if (activeTab === 'permissions') {
      return (
        <button
          onClick={onCreatePermission}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Permission
        </button>
      );
    }
    return null;
  };

  return (
    <div className="bg-white shadow rounded-lg mb-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User & Role Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage users, roles, and permissions for your ERP system
            </p>
          </div>
          {getCreateButton()}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className={`mr-2 h-5 w-5 ${
                  activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                {tab.label}
                <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium ${
                  activeTab === tab.id 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filters */}
      {(activeTab === 'users' || activeTab === 'roles') && (
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={`Search ${activeTab}...`}
                />
              </div>
            </div>

            {/* Status FunnelIcon */}
            <div className="flex items-center space-x-3">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Active Tab Description */}
          <div className="mt-3">
            <p className="text-sm text-gray-600">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementHeader;
