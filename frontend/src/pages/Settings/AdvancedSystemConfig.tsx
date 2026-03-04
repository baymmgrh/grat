import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ClockIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ServerIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
interface SystemConfig {
  id: string;
  category: string;
  key: string;
  value: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  is_sensitive: boolean;
  requires_restart: boolean;
}

interface ConfigCategory {
  name: string;
  icon: any;
  description: string;
  configs: SystemConfig[];
}

const AdvancedSystemConfig: React.FC = () => {
  const { t } = useLanguage();

  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});

  const categories: ConfigCategory[] = [
    {
      name: 'general',
      icon: Cog6ToothIcon,
      description: 'General system settings',
      configs: configs.filter(c => c.category === 'general')
    },
    {
      name: 'database',
      icon: ServerIcon,
      description: 'Database configuration',
      configs: configs.filter(c => c.category === 'database')
    },
    {
      name: 'security',
      icon: ShieldCheckIcon,
      description: 'Security and authentication',
      configs: configs.filter(c => c.category === 'security')
    },
    {
      name: 'performance',
      icon: ClockIcon,
      description: 'Performance optimization',
      configs: configs.filter(c => c.category === 'performance')
    },
    {
      name: 'logging',
      icon: DocumentTextIcon,
      description: 'Logging and monitoring',
      configs: configs.filter(c => c.category === 'logging')
    }
  ];

  // Load system configurations
  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/settings/system-config');
      setConfigs(response.data?.configs || []);
    } catch (error) {
      console.error('Failed to load system configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigurations();
  }, []);

  // Handle config value change
  const handleConfigChange = (configId: string, value: string) => {
    setPendingChanges(prev => ({
      ...prev,
      [configId]: value
    }));
  };

  // Save configuration changes
  const saveChanges = async () => {
    try {
      setSaving(true);
      
      const updates = Object.entries(pendingChanges).map(([configId, value]) => ({
        id: configId,
        value: value
      }));

      await axiosInstance.post('/api/settings/system-config/update', {
        updates: updates
      });

      setPendingChanges({});
      await loadConfigurations();
      
      alert('Configuration updated successfully!');
    } catch (error) {
      console.error('Failed to save configurations:', error);
      alert('Failed to save configurations');
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = async (category: string) => {
    if (!confirm(`Reset all ${category} settings to default values?`)) {
      return;
    }

    try {
      await axiosInstance.post('/api/settings/system-config/reset', {
        category: category
      });
      
      await loadConfigurations();
      setPendingChanges({});
      
      alert('Settings reset to defaults successfully!');
    } catch (error) {
      console.error('Failed to reset settings:', error);
      alert('Failed to reset settings');
    }
  };

  // Render config input based on type
  const renderConfigInput = (config: SystemConfig) => {
    const currentValue = pendingChanges[config.id] ?? config.value;
    const hasChanges = pendingChanges[config.id] !== undefined;

    switch (config.type) {
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={currentValue === 'true'}
              onChange={(e) => handleConfigChange(config.id, e.target.checked.toString())}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">
              {currentValue === 'true' ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleConfigChange(config.id, e.target.value)}
            className={`w-full border rounded-md px-3 py-2 ${hasChanges ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}
          />
        );
      
      case 'json':
        return (
          <textarea
            value={currentValue}
            onChange={(e) => handleConfigChange(config.id, e.target.value)}
            rows={4}
            className={`w-full border rounded-md px-3 py-2 font-mono text-sm ${hasChanges ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}
          />
        );
      
      default:
        return (
          <input
            type={config.is_sensitive ? 'password' : 'text'}
            value={config.is_sensitive && !hasChanges ? '••••••••' : currentValue}
            onChange={(e) => handleConfigChange(config.id, e.target.value)}
            className={`w-full border rounded-md px-3 py-2 ${hasChanges ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}
          />
        );
    }
  };

  const selectedCategoryData = categories.find(c => c.name === selectedCategory);
  const hasAnyChanges = Object.keys(pendingChanges).length > 0;
  const requiresRestart = configs.some(c => 
    pendingChanges[c.id] !== undefined && c.requires_restart
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading system configuration...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Advanced System Configuration
        </h1>
        <p className="text-gray-600">
          Configure advanced system settings and parameters
        </p>
        
        {requiresRestart && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-medium">
                Some changes require system restart to take effect
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Category Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Configuration Categories</h3>
            
            <div className="space-y-2">
              {categories.map((category) => {
                const IconComponent = category.icon;
                const isSelected = selectedCategory === category.name;
                const categoryHasChanges = category.configs.some(c => 
                  pendingChanges[c.id] !== undefined
                );
                
                return (
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${
                      isSelected 
                        ? 'bg-blue-100 text-blue-900 border border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent className="h-5 w-5 mr-3" />
                    <div className="flex-1">
                      <div className="font-medium capitalize">{category.name}</div>
                      <div className="text-xs text-gray-500">{category.configs.length} settings</div>
                    </div>
                    {categoryHasChanges && (
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            
            {/* Category Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {selectedCategoryData && (
                    <>
                      <selectedCategoryData.icon className="h-6 w-6 text-gray-600 mr-3" />
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 capitalize">
                          {selectedCategory} Configuration
                        </h2>
                        <p className="text-gray-600">{selectedCategoryData.description}</p>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => resetToDefaults(selectedCategory)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Reset to Defaults
                  </button>
                </div>
              </div>
            </div>

            {/* Configuration List */}
            <div className="p-6">
              {selectedCategoryData?.configs.length === 0 ? (
                <div className="text-center py-8">
                  <Cog6ToothIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No configurations</h3>
                  <p className="text-gray-500">No settings available for this category.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedCategoryData?.configs.map((config) => {
                    const hasChanges = pendingChanges[config.id] !== undefined;
                    
                    return (
                      <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h4 className="font-medium text-gray-900">{config.key}</h4>
                              {hasChanges && (
                                <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                </span>
                              )}
                              {config.requires_restart && (
                                <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                                  Requires Restart
                                </span>
                              )}
                              {config.is_sensitive && (
                                <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          {renderConfigInput(config)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Changes Bar */}
      {hasAnyChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-gray-900 font-medium">
                You have unsaved changes ({Object.keys(pendingChanges).length} settings)
              </span>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setPendingChanges({})}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Discard Changes
              </button>
              <button
                onClick={saveChanges}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSystemConfig;
