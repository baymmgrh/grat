import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowRightIcon,
  ChartBarIcon,
  CogIcon,
  ComputerDesktopIcon,
  TruckIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
const TVDisplaySelector: React.FC = () => {
  const { t } = useLanguage();

  const displayOptions = [
    {
      title: 'Production Floor',
      description: 'Monitor mesin produksi, work orders, dan progress real-time',
      icon: CogIcon,
      href: '/tv/production',
      color: 'blue',
      features: ['Work Orders Aktif', 'Status Mesin', 'Progress Produksi', 'Target vs Actual']
    },
    {
      title: 'Shipping Department',
      description: 'Track pengiriman, status driver, dan delivery schedule',
      icon: TruckIcon,
      href: '/tv/shipping',
      color: 'green',
      features: ['Shipment Aktif', 'Status Driver', 'Tracking Number', 'Delivery Schedule']
    },
    {
      title: 'Employee Roster',
      description: 'Jadwal karyawan per mesin per shift untuk minggu ini',
      icon: UsersIcon,
      href: '/tv/roster',
      color: 'purple',
      features: ['Roster Mingguan', 'Assignment Mesin', 'Shift Schedule', 'Employee Status']
    },
    {
      title: 'Dashboard Overview',
      description: 'Overview keseluruhan operasional pabrik dan KPI',
      icon: ChartBarIcon,
      href: '/tv/overview',
      color: 'yellow',
      features: ['Production KPI', 'Shipping Summary', 'Quality Metrics', 'OEE Overview']
    }
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-blue-600',
      border: 'border-blue-200'
    },
    green: {
      bg: 'bg-green-600',
      hover: 'hover:bg-green-700',
      text: 'text-green-600',
      border: 'border-green-200'
    },
    purple: {
      bg: 'bg-purple-600',
      hover: 'hover:bg-purple-700',
      text: 'text-purple-600',
      border: 'border-purple-200'
    },
    yellow: {
      bg: 'bg-yellow-600',
      hover: 'hover:bg-yellow-700',
      text: 'text-yellow-600',
      border: 'border-yellow-200'
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <ComputerDesktopIcon className="h-16 w-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            TV Display System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Pilih tampilan yang ingin ditampilkan di layar TV untuk monitoring real-time operasional pabrik
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {displayOptions.map((option) => {
            const Icon = option.icon;
            const colors = colorClasses[option.color as keyof typeof colorClasses];
            
            return (
              <Link
                key={option.title}
                to={option.href}
                className={`block p-8 bg-white rounded-xl shadow-lg ${colors.border} border-2 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-3 ${colors.bg} rounded-lg`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <ArrowRightIcon className="h-6 w-6 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {option.title}
                </h3>
                
                <p className="text-gray-600 mb-6">
                  {option.description}
                </p>

                <div className="space-y-2">
                  <h4 className={`font-semibold ${colors.text} mb-3`}>
                    Fitur Utama:
                  </h4>
                  <ul className="space-y-2">
                    {option.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <div className={`w-2 h-2 ${colors.bg} rounded-full mr-3`}></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className={`inline-flex items-center text-sm font-medium ${colors.text} group-hover:${colors.text}`}>
                    Buka Display
                    <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg p-6 shadow-md max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              💡 Tips Penggunaan TV Display
            </h3>
            <ul className="text-sm text-gray-600 space-y-2 text-left">
              <li>• Gunakan mode fullscreen browser untuk pengalaman terbaik</li>
              <li>• Data akan ter-refresh otomatis setiap 10-30 detik</li>
              <li>• Optimal untuk layar TV 32" ke atas dengan resolusi 1080p+</li>
              <li>• Tekan F11 untuk mode fullscreen atau klik tombol fullscreen</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TVDisplaySelector;
