import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowPathIcon,
  BoltIcon,
  ChartBarIcon,
  CloudArrowDownIcon,
  CogIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  KeyIcon,
  LinkIcon,
  ShieldCheckIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
interface SettingsCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  category: 'system' | 'integration';
  isNew?: boolean;
}

const SettingsMain: React.FC = () => {

  const settingsCards: SettingsCard[] = [
    // System Settings
    {
      id: 'system-config',
      title: 'Advanced System Configuration',
      description: 'Configure advanced system settings and parameters',
      icon: CogIcon,
      path: '/app/settings/system-config',
      category: 'system',
      isNew: true
    },
    {
      id: 'user-roles',
      title: 'User Role Management',
      description: 'Manage user roles, permissions, and access control',
      icon: UsersIcon,
      path: '/app/settings/user-roles',
      category: 'system',
      isNew: true
    },
    {
      id: 'audit-trail',
      title: 'Audit Trail',
      description: 'Track all system activities and changes',
      icon: DocumentTextIcon,
      path: '/app/settings/audit-trail',
      category: 'system',
      isNew: true
    },
    {
      id: 'backup-restore',
      title: 'Backup & Restore',
      description: 'Manage system backups and restore points',
      icon: CloudArrowDownIcon,
      path: '/app/settings/backup-restore',
      category: 'system',
      isNew: true
    },
    {
      id: 'email-settings',
      title: 'Email Notifications',
      description: 'Configure email notification settings and providers',
      icon: EnvelopeIcon,
      path: '/app/settings/email',
      category: 'system',
      isNew: true
    },
    // Integration Settings
    {
      id: 'external-connectors',
      title: 'External System Connectors',
      description: 'Manage connections to external systems and APIs',
      icon: LinkIcon,
      path: '/app/integration/connectors',
      category: 'integration',
      isNew: true
    },
    {
      id: 'api-gateway',
      title: 'API Gateway',
      description: 'Manage API endpoints and access control',
      icon: GlobeAltIcon,
      path: '/app/integration/api-gateway',
      category: 'integration',
      isNew: true
    },
    {
      id: 'data-sync',
      title: 'Data Synchronization',
      description: 'Manage data synchronization between systems',
      icon: ArrowPathIcon,
      path: '/app/integration/data-sync',
      category: 'integration',
      isNew: true
    },
    {
      id: 'webhooks',
      title: 'Webhook Management',
      description: 'Manage webhook endpoints and event notifications',
      icon: BoltIcon,
      path: '/app/integration/webhooks',
      category: 'integration',
      isNew: true
    }
  ];

  const systemSettings = settingsCards.filter(card => card.category === 'system');
  const integrationSettings = settingsCards.filter(card => card.category === 'integration');

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Settings & Configuration
        </h1>
        <p className="text-gray-600">
          Manage system settings, user access, and external integrations
        </p>
      </div>

      {/* System Settings Section */}
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <ShieldCheckIcon className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {systemSettings.map((setting) => {
            const IconComponent = setting.icon;
            return (
              <Link
                key={setting.id}
                to={setting.path}
                className="block bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 p-6 border border-gray-200 hover:border-blue-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <IconComponent className="h-6 w-6 text-blue-600" />
                  </div>
                  {setting.isNew && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    </span>
                  )}
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                  {setting.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {setting.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Integration Settings Section */}
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <KeyIcon className="h-6 w-6 text-purple-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Integration Settings</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {integrationSettings.map((setting) => {
            const IconComponent = setting.icon;
            return (
              <Link
                key={setting.id}
                to={setting.path}
                className="block bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 p-6 border border-gray-200 hover:border-purple-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                    <IconComponent className="h-6 w-6 text-purple-600" />
                  </div>
                  {setting.isNew && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    </span>
                  )}
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">
                  {setting.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {setting.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/app/settings/system-config"
            className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <CogIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="font-medium text-gray-900">System Configuration</div>
              <div className="text-sm text-gray-500">Configure system parameters</div>
            </div>
          </Link>
          
          <Link
            to="/app/settings/backup-restore"
            className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <CloudArrowDownIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="font-medium text-gray-900">Create Backup</div>
              <div className="text-sm text-gray-500">Backup system data</div>
            </div>
          </Link>
          
          <Link
            to="/app/settings/audit-trail"
            className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <DocumentTextIcon className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <div className="font-medium text-gray-900">View Audit Trail</div>
              <div className="text-sm text-gray-500">Track system changes</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Info Panel */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-3">
          <CogIcon className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-sm font-medium text-blue-900">Settings Information</h3>
        </div>
        <div className="text-sm text-blue-800">
          <ul className="space-y-1">
            <li>• System settings control core application behavior</li>
            <li>• User roles determine access permissions across modules</li>
            <li>• Audit trail provides complete activity tracking</li>
            <li>• Regular backups ensure data protection</li>
            <li>• Integration settings enable external system connectivity</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SettingsMain;
