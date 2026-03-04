import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowRightIcon,
  BanknotesIcon,
  BeakerIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  ComputerDesktopIcon,
  CpuChipIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PauseIcon,
  PlayIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  SignalIcon,
  SparklesIcon,
  TruckIcon,
  UsersIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import LanguageSwitcher from '../../components/LanguageSwitcher';
interface SystemModule {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  status: 'active' | 'inactive' | 'maintenance';
  usage: number;
  lastAccessed: string;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

const SystemOverviewEnhanced: React.FC = () => {
  const { t } = useLanguage();

  const [companyName, setCompanyName] = useState(t('company.name'));
  
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeModules: 0,
    totalRecords: 0,
    systemUptime: '99.9%',
    backendStatus: 'checking...',
    databaseStatus: 'checking...',
    lastUpdate: new Date(),
    responseTime: 0
  });

  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0
  });

  const [selectedView, setSelectedView] = useState<'overview' | 'performance' | 'modules'>('overview');
  const [userIP, setUserIP] = useState<string>('Loading...');

  useEffect(() => {
    const initializeData = async () => {
      await loadSystemStats();
      await loadCompanySettings();
      await loadSystemMetrics();
      await fetchUserIP();
    };
    
    initializeData();
    
    // Auto-refresh every 5 seconds (always enabled)
    const realTimeInterval = setInterval(() => {
      loadSystemStats();
      loadSystemMetrics();
    }, 5000);
    
    const statusInterval = setInterval(() => {
      loadSystemStats();
    }, 30000);
    
    const handleCompanyUpdate = () => {
      loadCompanySettings();
    };
    
    window.addEventListener('companySettingsUpdated', handleCompanyUpdate);
    
    return () => {
      clearInterval(realTimeInterval);
      clearInterval(statusInterval);
      window.removeEventListener('companySettingsUpdated', handleCompanyUpdate);
    };
  }, []);

  const fetchUserIP = async () => {
    try {
      // Try to get IP from ipify API
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setUserIP(data.ip);
    } catch (error) {
      // Fallback: try to get from local network info
      try {
        const localResponse = await axiosInstance.get('/api/user/ip');
        setUserIP(localResponse.data.ip || 'Unknown');
      } catch {
        setUserIP('Unable to detect');
      }
    }
  };

  const loadCompanySettings = async () => {
    try {
      const response = await axiosInstance.get('/api/company/public');
      if (response.data?.name) {
        setCompanyName(response.data.name);
        localStorage.setItem('companyName', response.data.name);
      } else {
        setCompanyName(t('company.name'));
      }
    } catch (error) {
      const storedCompanyName = localStorage.getItem('companyName');
      if (storedCompanyName) {
        setCompanyName(storedCompanyName);
      } else {
        setCompanyName(t('company.name'));
      }
    }
  };

  const loadSystemStats = async () => {
    try {
      const startTime = Date.now();
      let backendStatus = 'offline';
      let databaseStatus = 'connected';
      let responseTime = 0;
      
      const availableModules = modules.length;
      let realStats = {
        totalUsers: 0,
        totalRecords: 0,
        activeModules: availableModules
      };
      
      try {
        const response = await axiosInstance.get('/api/status');
        responseTime = Date.now() - startTime;
        
        if (response.data?.status === 'online') {
          backendStatus = 'online';
          
          if (response.data?.statistics) {
            const stats = response.data.statistics;
            realStats = {
              totalUsers: stats.total_users || 0,
              totalRecords: stats.total_records || 0,
              activeModules: stats.active_modules || availableModules
            };
          }
        }
      } catch (error: any) {
        responseTime = Date.now() - startTime;
        backendStatus = 'offline';
      }
      
      setSystemStats({
        totalUsers: realStats.totalUsers,
        activeModules: realStats.activeModules,
        totalRecords: realStats.totalRecords,
        systemUptime: '99.9%',
        backendStatus,
        databaseStatus,
        lastUpdate: new Date(),
        responseTime: responseTime
      });
    } catch (error) {
      setSystemStats(prev => ({
        ...prev,
        backendStatus: 'offline',
        databaseStatus: 'disconnected',
        activeModules: 0,
        lastUpdate: new Date(),
        responseTime: 0
      }));
    }
  };

  const loadSystemMetrics = async () => {
    try {
      // Get REAL metrics from PUBLIC endpoint (no auth required)
      const response = await axiosInstance.get('/api/system/metrics/public');
      
      const data = response.data;
      setSystemMetrics({
        cpu: data.cpu?.usage_percent || 0,
        memory: data.memory?.usage_percent || 0,
        disk: data.disks && data.disks.length > 0 ? data.disks[0].usage_percent : 0,
        network: data.network?.usage_percent || 0
      });
    } catch (error) {
      // Fallback to 0 on error
      console.error('Error loading system metrics:', error);
      setSystemMetrics({
        cpu: 0,
        memory: 0,
        disk: 0,
        network: 0
      });
    }
  };

  const modules: SystemModule[] = [
    {
      id: 'dashboard',
      name: t('dashboard.title'),
      description: t('dashboard.description'),
      icon: ComputerDesktopIcon,
      color: 'text-blue-600',
      status: 'active',
      usage: 95,
      lastAccessed: '2 min ago'
    },
    {
      id: 'products',
      name: t('products.title'),
      description: t('products.description'),
      icon: CubeIcon,
      color: 'text-green-600',
      status: 'active',
      usage: 87,
      lastAccessed: '5 min ago'
    },
    {
      id: 'mrp',
      name: t('mrp.title'),
      description: t('mrp.description'),
      icon: ChartBarIcon,
      color: 'text-purple-600',
      status: 'active',
      usage: 73,
      lastAccessed: '12 min ago'
    },
    {
      id: 'warehouse',
      name: t('warehouse.title'),
      description: t('warehouse.description'),
      icon: BuildingStorefrontIcon,
      color: 'text-indigo-600',
      status: 'active',
      usage: 91,
      lastAccessed: '3 min ago'
    },
    {
      id: 'sales',
      name: t('sales.title'),
      description: t('sales.description'),
      icon: ShoppingCartIcon,
      color: 'text-red-600',
      status: 'active',
      usage: 82,
      lastAccessed: '8 min ago'
    },
    {
      id: 'purchasing',
      name: t('purchasing.title'),
      description: t('purchasing.description'),
      icon: ShoppingBagIcon,
      color: 'text-orange-600',
      status: 'active',
      usage: 76,
      lastAccessed: '15 min ago'
    },
    {
      id: 'production',
      name: t('production.title'),
      description: t('production.description'),
      icon: CogIcon,
      color: 'text-gray-600',
      status: 'active',
      usage: 89,
      lastAccessed: '1 min ago'
    },
    {
      id: 'quality',
      name: t('quality.title'),
      description: t('quality.description'),
      icon: BeakerIcon,
      color: 'text-cyan-600',
      status: 'active',
      usage: 68,
      lastAccessed: '22 min ago'
    },
    {
      id: 'shipping',
      name: t('shipping.title'),
      description: t('shipping.description'),
      icon: TruckIcon,
      color: 'text-yellow-600',
      status: 'maintenance',
      usage: 45,
      lastAccessed: '1 hour ago'
    },
    {
      id: 'finance',
      name: t('finance.title'),
      description: t('finance.description'),
      icon: BanknotesIcon,
      color: 'text-emerald-600',
      status: 'active',
      usage: 93,
      lastAccessed: '4 min ago'
    },
    {
      id: 'hr',
      name: t('hr.title'),
      description: t('hr.description'),
      icon: UsersIcon,
      color: 'text-pink-600',
      status: 'active',
      usage: 78,
      lastAccessed: '18 min ago'
    },
    {
      id: 'maintenance',
      name: t('maintenance.title'),
      description: t('maintenance.description'),
      icon: WrenchScrewdriverIcon,
      color: 'text-teal-600',
      status: 'active',
      usage: 65,
      lastAccessed: '35 min ago'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'inactive': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 80) return 'text-green-500';
    if (usage >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Enhanced Header with Navigation */}
        <nav className="absolute top-0 w-full z-40 bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3 md:py-6">
              <div className="flex items-center space-x-2 md:space-x-4">
                {/* IP Address Display - Hidden on mobile */}
                <div className="hidden lg:flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2 border border-white/20">
                  <SignalIcon className="h-4 w-4 text-green-400 animate-pulse" />
                  <div className="flex flex-col">
                    <span className="text-[9px] text-blue-200 uppercase tracking-wider leading-tight">IP</span>
                    <span className="text-xs text-white font-mono font-semibold leading-tight">{userIP}</span>
                  </div>
                </div>

                {/* Company Logo & Name */}
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <SparklesIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-sm md:text-xl font-bold text-white">{companyName}</h1>
                    <p className="text-xs md:text-sm text-blue-200 hidden sm:block">{t('system.erp_system')}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 md:space-x-6">
                {/* View Selector - Hidden on mobile */}
                <div className="hidden lg:flex items-center space-x-2 bg-white/10 rounded-lg p-1">
                  {[
                    {id: 'overview', icon: EyeIcon, label: 'Overview'}, 
                    {id: 'performance', icon: ChartBarIcon, label: 'Performance'}, 
                    {id: 'modules', icon: ComputerDesktopIcon, label: 'Modules'}
                  ].map((view) => (
                    <button
                      key={view.id}
                      onClick={() => setSelectedView(view.id as any)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                        selectedView === view.id
                          ? 'bg-white/20 text-white'
                          : 'text-blue-200 hover:text-white hover:bg-white/10'
                      }`}
                      title={view.label}
                    >
                      <view.icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
                
                {/* Language Switcher - Hidden on small mobile */}
                <div className="hidden sm:block">
                  <LanguageSwitcher showLabel={false} className="text-white" />
                </div>
                
                {/* Attendance Button - Compact on mobile */}
                <Link
                  to="/absensi"
                  className="px-3 py-2 md:px-6 md:py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-1 md:gap-2 text-sm md:text-base"
                >
                  <ClockIcon className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Absensi</span>
                </Link>
                
                {/* Login Button - Always visible, compact on mobile */}
                <Link
                  to="/login"
                  className="px-3 py-2 md:px-6 md:py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl text-sm md:text-base whitespace-nowrap"
                >
                  <span className="sm:hidden">Login</span>
                  <span className="hidden sm:inline">{t('auth.login_to_access')}</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="text-white block mb-2">
                {companyName}
              </span>
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300 bg-clip-text text-transparent">
                Sistem ERP
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
              Solusi ERP Lengkap untuk Manufaktur Nonwoven & Produksi Wet Wipes
            </p>

            {/* View Content Based on Selection */}
            {selectedView === 'overview' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto mb-12">
              {/* Pengguna Sistem */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-center mb-3">
                  <UsersIcon className="h-10 w-10 text-blue-400" />
                </div>
                <p className="text-4xl font-bold text-blue-400 mb-2">{systemStats.totalUsers}</p>
                <p className="text-sm text-blue-200 font-medium">Pengguna Sistem</p>
                <div className="mt-3 bg-blue-500/30 rounded-full h-1.5">
                  <div className="bg-blue-400 h-1.5 rounded-full transition-all duration-500" style={{width: `${Math.min(systemStats.totalUsers * 10, 100)}%`}}></div>
                </div>
              </div>

              {/* Modul Aktif */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-center mb-3">
                  <CogIcon className="h-10 w-10 text-green-400" />
                </div>
                <p className="text-4xl font-bold text-green-400 mb-2">{systemStats.activeModules}</p>
                <p className="text-sm text-blue-200 font-medium">Modul Aktif</p>
                <div className="mt-3 bg-green-500/30 rounded-full h-1.5">
                  <div className="bg-green-400 h-1.5 rounded-full transition-all duration-500" style={{width: `${Math.min((systemStats.activeModules / modules.length) * 100, 100)}%`}}></div>
                </div>
              </div>

              {/* Total Data */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-center mb-3">
                  <ChartBarIcon className="h-10 w-10 text-purple-400" />
                </div>
                <p className="text-4xl font-bold text-purple-400 mb-2">{systemStats.totalRecords.toLocaleString()}</p>
                <p className="text-sm text-blue-200 font-medium">Total Data</p>
                <div className="mt-3 bg-purple-500/30 rounded-full h-1.5">
                  <div className="bg-purple-400 h-1.5 rounded-full transition-all duration-500" style={{width: '85%'}}></div>
                </div>
              </div>

              {/* Waktu Aktif Sistem */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-center mb-3">
                  <CheckCircleIcon className="h-10 w-10 text-emerald-400" />
                </div>
                <p className="text-4xl font-bold text-emerald-400 mb-2">{systemStats.systemUptime}</p>
                <p className="text-sm text-blue-200 font-medium">Waktu Aktif Sistem</p>
                <div className="mt-3 bg-emerald-500/30 rounded-full h-1.5">
                  <div className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500" style={{width: '99%'}}></div>
                </div>
              </div>
            </div>
            )}

            {/* Performance View */}
            {selectedView === 'performance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto mb-12">
              {/* CPU Usage */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-center mb-3">
                  <CpuChipIcon className="h-10 w-10 text-cyan-400" />
                </div>
                <p className="text-4xl font-bold text-cyan-400 mb-2">{systemMetrics.cpu}%</p>
                <p className="text-sm text-blue-200 font-medium">CPU Usage</p>
                <div className="mt-3 bg-cyan-500/30 rounded-full h-1.5">
                  <div className="bg-cyan-400 h-1.5 rounded-full transition-all duration-500" style={{width: `${systemMetrics.cpu}%`}}></div>
                </div>
              </div>

              {/* Memory Usage */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-center mb-3">
                  <ChartBarIcon className="h-10 w-10 text-orange-400" />
                </div>
                <p className="text-4xl font-bold text-orange-400 mb-2">{systemMetrics.memory}%</p>
                <p className="text-sm text-blue-200 font-medium">Memory Usage</p>
                <div className="mt-3 bg-orange-500/30 rounded-full h-1.5">
                  <div className="bg-orange-400 h-1.5 rounded-full transition-all duration-500" style={{width: `${systemMetrics.memory}%`}}></div>
                </div>
              </div>

              {/* Disk Usage */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-center mb-3">
                  <ChartBarIcon className="h-10 w-10 text-pink-400" />
                </div>
                <p className="text-4xl font-bold text-pink-400 mb-2">{systemMetrics.disk}%</p>
                <p className="text-sm text-blue-200 font-medium">Disk Usage</p>
                <div className="mt-3 bg-pink-500/30 rounded-full h-1.5">
                  <div className="bg-pink-400 h-1.5 rounded-full transition-all duration-500" style={{width: `${systemMetrics.disk}%`}}></div>
                </div>
              </div>

              {/* Network */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-center mb-3">
                  <SignalIcon className="h-10 w-10 text-yellow-400" />
                </div>
                <p className="text-4xl font-bold text-yellow-400 mb-2">{systemMetrics.network}%</p>
                <p className="text-sm text-blue-200 font-medium">Network</p>
                <div className="mt-3 bg-yellow-500/30 rounded-full h-1.5">
                  <div className="bg-yellow-400 h-1.5 rounded-full transition-all duration-500" style={{width: `${systemMetrics.network}%`}}></div>
                </div>
              </div>
            </div>
            )}

            {/* Modules View */}
            {selectedView === 'modules' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mb-12">
              {modules.slice(0, 12).map((module) => (
                <div key={module.id} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-2">
                    <module.icon className={`h-6 w-6 ${module.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{module.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded-full ${
                      module.status === 'active' ? 'bg-green-500/20 text-green-300' :
                      module.status === 'maintenance' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {module.status}
                    </span>
                    <span className="text-blue-200">{module.usage}%</span>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </section>

        {/* Enhanced System Modules */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                {t('system.modules_features')}
              </h2>
              <p className="text-xl text-blue-200 max-w-3xl mx-auto">
                {t('system.modules_description')}
              </p>
            </div>

            {/* Enhanced Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
              {modules.map((module) => (
                <div
                  key={module.id}
                  className="p-6 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1 cursor-default group min-h-[320px] flex flex-col"
                >
                  {/* Header with Icon, Title and Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center flex-1 min-w-0">
                      <module.icon className={`h-8 w-8 ${module.color} mr-3 group-hover:scale-110 transition-transform flex-shrink-0`} />
                      <h3 className="text-lg font-semibold text-white truncate">{module.name}</h3>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(module.status)} animate-pulse`}></div>
                      <span className={`text-sm font-bold ${getUsageColor(module.usage)}`}>{module.usage}%</span>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div className="flex-1 mb-4">
                    <p className="text-sm text-blue-200 leading-relaxed line-clamp-3">{module.description}</p>
                  </div>
                  
                  {/* Footer with Last Access and Status */}
                  <div className="mt-auto">
                    <div className="flex justify-between items-center text-xs text-blue-300 mb-3">
                      <span>Last: {module.lastAccessed}</span>
                      <span className="capitalize px-2 py-1 bg-white/10 rounded-full">{module.status}</span>
                    </div>
                    
                    {/* Usage Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-blue-300">Usage</span>
                        <span className={`font-bold ${getUsageColor(module.usage)}`}>{module.usage}%</span>
                      </div>
                      <div className="bg-gray-700/50 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            module.usage >= 80 ? 'bg-green-400' : 
                            module.usage >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}
                          style={{width: `${module.usage}%`}}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* System Status & Metrics */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Real-time System Metrics */}
              <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <CpuChipIcon className="h-6 w-6 text-blue-400 mr-2" />
                  System Metrics
                  <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full animate-pulse">
                    Live
                  </span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'CPU Usage', value: systemMetrics.cpu, icon: CpuChipIcon, color: 'text-blue-400' },
                    { label: 'Memory', value: systemMetrics.memory, icon: ComputerDesktopIcon, color: 'text-green-400' },
                    { label: 'Disk Usage', value: systemMetrics.disk, icon: ComputerDesktopIcon, color: 'text-yellow-400' },
                    { label: 'Network', value: systemMetrics.network, icon: SignalIcon, color: 'text-purple-400' }
                  ].map((metric, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4 min-h-[120px] flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <metric.icon className={`h-5 w-5 ${metric.color} flex-shrink-0`} />
                        <span className={`text-lg font-bold ${metric.color}`}>{metric.value}%</span>
                      </div>
                      <p className="text-sm text-white mb-3 flex-1">{metric.label}</p>
                      <div className="mt-auto">
                        <div className="bg-gray-700/50 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              metric.value >= 80 ? 'bg-red-400' : 
                              metric.value >= 60 ? 'bg-yellow-400' : 'bg-green-400'
                            }`}
                            style={{width: `${metric.value}%`}}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Status */}
              <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
                <div className="text-center">
                  {systemStats.backendStatus === 'online' && systemStats.databaseStatus === 'connected' ? (
                    <CheckCircleIcon className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  ) : systemStats.backendStatus === 'offline' ? (
                    <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  ) : (
                    <ClockIcon className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                  )}
                  
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {systemStats.backendStatus === 'online' && systemStats.databaseStatus === 'connected' 
                      ? [t('system.all_systems_operational')]
                      : systemStats.backendStatus === 'offline' 
                      ? [t('system.system_offline')]
                      : t('system.status_checking')}
                  </h3>
                  <p className="text-blue-200 mb-6">
                    {t('system.backend')}: {systemStats.backendStatus} | {t('system.database')}: {systemStats.databaseStatus}
                  </p>
                  
                  <div className="text-center">
                    <p className="text-blue-200 mb-4">
                      {t('system.ready_to_access')}
                    </p>
                    <Link
                      to="/login"
                      className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
                    >
                      <span className="text-lg font-semibold">{t('system.access_system')}</span>
                      <ArrowRightIcon className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center text-blue-300 text-sm">
              © 2024 {companyName} {t('system.erp_system')}. {t('system.all_rights_reserved')}.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SystemOverviewEnhanced;
