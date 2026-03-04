import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  BeakerIcon as Beaker,
  BuildingStorefrontIcon as Warehouse,
  ChartBarIcon,
  ChevronDownIcon as ChevronDown,
  ChevronRightIcon as ChevronRight,
  Cog6ToothIcon as Settings,
  CubeIcon,
  CurrencyDollarIcon,
  HomeIcon,
  Bars3Icon as MenuIcon,
  ShoppingCartIcon as ShoppingCart,
  UsersIcon,
  WrenchIcon as Wrench,
  XMarkIcon as X
} from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  children?: NavigationItem[];
}

const MobileNavigation: React.FC = () => {
  const { t } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const location = useLocation();

  const navigation: NavigationItem[] = [
    { name: t('navigation.dashboard'), href: '/app/dashboard', icon: HomeIcon },
    {
      name: t('navigation.products'),
      href: '/app/products',
      icon: CubeIcon,
      children: [
        { name: 'Product List', href: '/app/products', icon: CubeIcon },
        { name: 'Categories', href: '/app/products/categories', icon: CubeIcon },
        { name: 'BOM', href: '/app/products/bom', icon: CubeIcon }
      ]
    },
    {
      name: t('navigation.warehouse'),
      href: '/app/warehouse',
      icon: Warehouse,
      children: [
        { name: t('navigation.dashboard'), href: '/app/warehouse', icon: Warehouse },
        { name: 'Inventory', href: '/app/warehouse/inventory', icon: Warehouse },
        { name: 'Locations', href: '/app/warehouse/locations', icon: Warehouse },
        { name: 'Movements', href: '/app/warehouse/movements', icon: Warehouse }
      ]
    },
    {
      name: t('navigation.sales'),
      href: '/app/sales',
      icon: ShoppingCart,
      children: [
        { name: t('navigation.dashboard'), href: '/app/sales', icon: ShoppingCart },
        { name: 'Orders', href: '/app/sales/orders', icon: ShoppingCart },
        { name: 'Customers', href: '/app/sales/customers', icon: ShoppingCart }
      ]
    },
    {
      name: t('navigation.finance'),
      href: '/app/finance',
      icon: CurrencyDollarIcon,
      children: [
        { name: t('navigation.dashboard'), href: '/app/finance', icon: CurrencyDollarIcon },
        { name: 'Accounting', href: '/app/finance/accounting', icon: CurrencyDollarIcon },
        { name: 'Budget', href: '/app/finance/budget', icon: CurrencyDollarIcon },
        { name: 'Reports', href: '/app/finance/reports', icon: CurrencyDollarIcon }
      ]
    },
    {
      name: t('navigation.hr'),
      href: '/app/hr',
      icon: UsersIcon,
      children: [
        { name: t('navigation.dashboard'), href: '/app/hr', icon: UsersIcon },
        { name: 'Employees', href: '/app/hr/employees', icon: UsersIcon },
        { name: 'Attendance', href: '/app/hr/attendance', icon: UsersIcon },
        { name: 'Payroll', href: '/app/hr/payroll', icon: UsersIcon }
      ]
    },
    {
      name: t('navigation.maintenance'),
      href: '/app/maintenance',
      icon: Wrench,
      children: [
        { name: 'Dashboard', href: '/app/maintenance', icon: Wrench },
        { name: 'Work Orders', href: '/app/maintenance/records', icon: Wrench },
        { name: 'Schedule', href: '/app/maintenance/schedules', icon: Wrench },
        { name: 'New Request', href: '/app/maintenance/request/new', icon: Wrench },
        { name: 'Analytics', href: '/app/maintenance/analytics', icon: Wrench }
      ]
    },
    {
      name: 'R&D',
      href: '/app/rd',
      icon: Beaker,
      children: [
        { name: 'Dashboard', href: '/app/rd', icon: Beaker },
        { name: 'Projects', href: '/app/rd/projects', icon: Beaker },
        { name: 'Experiments', href: '/app/rd/experiments', icon: Beaker },
        { name: 'Materials', href: '/app/rd/materials', icon: Beaker },
        { name: 'Products', href: '/app/rd/products', icon: Beaker },
        { name: 'Reports', href: '/app/rd/reports', icon: Beaker }
      ]
    },
    { name: 'Reports', href: '/app/reports', icon: ChartBarIcon },
    { name: 'Settings', href: '/app/settings', icon: Settings }
  ];

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    );
  };

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.name);
    const active = isActive(item.href);

    return (
      <div key={item.name} className="mb-1">
        <div className="flex items-center">
          <Link
            to={item.href}
            className={`flex-1 flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              active
                ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            } ${level > 0 ? 'ml-4' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
          {hasChildren && (
            <button
              onClick={() => toggleSection(item.name)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-white shadow-lg border border-gray-200 text-gray-600 hover:text-gray-900"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile navigation panel */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ERP</span>
              </div>
              <span className="ml-2 text-lg font-semibold text-gray-900">ERP System</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4 px-2">
            <nav className="space-y-1">
              {navigation.map(item => renderNavigationItem(item))}
            </nav>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="text-xs text-gray-500 text-center">
              ERP System v2.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;
