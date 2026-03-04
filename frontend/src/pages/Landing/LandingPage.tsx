import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowRightIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ChevronRightIcon,
  CogIcon,
  GlobeAltIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon

} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
interface SystemModule {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  gradient: string;
  status: 'active' | 'configured' | 'pending';
  lastUpdated?: string;
  itemCount?: number;
}

const LandingPage: React.FC = () => {
  const { t } = useLanguage();

  const [companyName, setCompanyName] = useState('Your Company');
  const [companyInfo, setCompanyInfo] = useState({
    industry: 'Manufacturing',
    description: 'Advanced Enterprise Resource Planning System'
  });
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeModules: 0,
    totalRecords: 0,
    lastBackup: ''
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadCompanySettings();
    loadSystemStats();
    
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timeInterval);
  }, []);

  const loadSystemStats = async () => {
    try {
      // Load various system statistics
      const [usersRes, productsRes, ordersRes] = await Promise.allSettled([
        axiosInstance.get('/api/settings/users'),
        axiosInstance.get('/api/products'),
        axiosInstance.get('/api/sales/orders')
      ]);
      
      setSystemStats({
        totalUsers: usersRes.status === 'fulfilled' ? usersRes.value.data?.users?.length || 0 : 0,
        activeModules: modules.length,
        totalRecords: (
          (productsRes.status === 'fulfilled' ? productsRes.value.data?.products?.length || 0 : 0) +
          (ordersRes.status === 'fulfilled' ? ordersRes.value.data?.orders?.length || 0 : 0)
        ),
        lastBackup: new Date().toLocaleDateString()
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  const loadCompanySettings = async () => {
    try {
      const response = await axiosInstance.get('/api/settings/company');
      if (response.data) {
        setCompanyName(response.data.name || 'Your Company');
        setCompanyInfo({
          industry: response.data.industry || 'Manufacturing',
          description: `Advanced Enterprise Resource Planning System for ${response.data.industry || 'Manufacturing'}`
        });
      }
    } catch (error) {
      console.error('Error loading company settings:', error);
    }
  };

  const modules: FeatureModule[] = [
    {
      id: 'dashboard',
      name: t('navigation.dashboard'),
      description: 'Real-time insights and analytics for your entire operation',
      icon: ChartBarIcon,
      href: '/app',
      color: 'text-blue-600',
      gradient: 'from-blue-600 to-blue-800',
      features: ['Real-time Analytics', 'KPI Monitoring', 'Executive Reports', 'Data Visualization']
    },
    {
      id: 'products',
      name: 'Product Management',
      description: 'Complete product lifecycle and inventory management',
      icon: CubeIcon,
      href: '/app/products',
      color: 'text-green-600',
      gradient: 'from-green-600 to-green-800',
      features: ['Product Catalog', 'Inventory Tracking', 'BOM Management', 'Cost Analysis']
    },
    {
      id: 'mrp',
      name: 'Material Requirements Planning',
      description: 'Advanced MRP system for optimal resource planning',
      icon: ChartBarIcon,
      href: '/app/mrp',
      color: 'text-purple-600',
      gradient: 'from-purple-600 to-purple-800',
      features: ['Demand Forecasting', 'Resource Planning', 'Supply Chain Optimization', 'Lead Time Management']
    },
    {
      id: 'warehouse',
      name: 'Warehouse Management',
      description: 'Smart warehouse operations and inventory control',
      icon: BuildingStorefrontIcon,
      href: '/app/warehouse',
      color: 'text-indigo-600',
      gradient: 'from-indigo-600 to-indigo-800',
      features: ['Zone Management', 'Inventory Control', 'Location Tracking', 'Stock Optimization']
    },
    {
      id: 'sales',
      name: 'Sales & CRM',
      description: 'Complete customer relationship and sales management',
      icon: ShoppingCartIcon,
      href: '/app/sales/dashboard',
      color: 'text-red-600',
      gradient: 'from-red-600 to-red-800',
      features: ['Lead Management', 'Opportunity Pipeline', 'Customer Database', 'Sales Analytics']
    },
    {
      id: 'purchasing',
      name: 'Procurement',
      description: 'Streamlined purchasing and supplier management',
      icon: ShoppingBagIcon,
      href: '/app/purchasing/purchase-orders',
      color: 'text-orange-600',
      gradient: 'from-orange-600 to-orange-800',
      features: ['Purchase Orders', 'Supplier Management', 'Cost Control', 'Procurement Analytics']
    },
    {
      id: 'production',
      name: 'Manufacturing',
      description: 'Advanced production planning and execution',
      icon: CogIcon,
      href: '/app/production/work-orders',
      color: 'text-gray-600',
      gradient: 'from-gray-600 to-gray-800',
      features: ['Work Orders', 'Production Planning', 'Machine Management', 'OEE Monitoring']
    },
    {
      id: 'quality',
      name: 'Quality Control',
      description: 'Comprehensive quality management system',
      icon: BeakerIcon,
      href: '/app/quality/tests',
      color: 'text-cyan-600',
      gradient: 'from-cyan-600 to-cyan-800',
      features: ['Quality Tests', 'Inspection Management', 'Non-Conformance', 'Quality Reports']
    },
    {
      id: 'shipping',
      name: 'Logistics & Shipping',
      description: 'End-to-end logistics and delivery management',
      icon: TruckIcon,
      href: '/app/shipping/orders',
      color: 'text-yellow-600',
      gradient: 'from-yellow-600 to-yellow-800',
      features: ['Shipment Tracking', 'Delivery Management', 'Route Optimization', 'Carrier Integration']
    },
    {
      id: 'finance',
      name: 'Financial Management',
      description: 'Complete financial control and reporting',
      icon: BanknotesIcon,
      href: '/app/finance/invoices',
      color: 'text-emerald-600',
      gradient: 'from-emerald-600 to-emerald-800',
      features: ['Invoice Management', 'Financial Reports', 'Cost Accounting', 'Budget Planning']
    },
    {
      id: 'hr',
      name: 'Human Resources',
      description: 'Modern HR management and workforce planning',
      icon: UsersIcon,
      href: '/app/hr/employees',
      color: 'text-pink-600',
      gradient: 'from-pink-600 to-pink-800',
      features: ['Employee Management', 'Attendance Tracking', 'Roster Planning', 'HR Analytics']
    },
    {
      id: 'maintenance',
      name: 'Asset Maintenance',
      description: 'Preventive maintenance and asset management',
      icon: WrenchScrewdriverIcon,
      href: '/app/maintenance',
      color: 'text-teal-600',
      gradient: 'from-teal-600 to-teal-800',
      features: ['Preventive Maintenance', 'Asset Tracking', 'Work Orders', 'Maintenance Analytics']
    }
  ];

  const benefits = [
    {
      icon: RocketLaunchIcon,
      title: 'Boost Productivity',
      description: 'Increase operational efficiency by up to 40% with automated workflows'
    },
    {
      icon: GlobeAltIcon,
      title: 'Global Scalability',
      description: 'Scale your operations worldwide with multi-location support'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Enterprise Security',
      description: 'Bank-grade security with role-based access controls'
    },
    {
      icon: CloudIcon,
      title: 'Cloud Ready',
      description: 'Access your ERP anywhere, anytime with cloud deployment'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="absolute top-0 w-full z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <SparklesIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{companyName}</h1>
                  <p className="text-sm text-blue-200">ERP System</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="px-6 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-300 backdrop-blur-sm border border-white/30"
                >
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className={`text-center transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full px-6 py-2 mb-8 backdrop-blur-sm border border-white/20">
                <LightBulbIcon className="h-5 w-5 text-yellow-400" />
                <span className="text-sm font-medium text-white">Next-Generation ERP Solution</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Transform Your
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {companyInfo.industry}
                </span>
                <br />
                <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
                {companyInfo.description} - Streamline processes, boost productivity, 
                and drive growth with our comprehensive ERP solution.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link
                  to="/login"
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center space-x-2"
                >
                  <span className="text-lg font-semibold">Start Your Journey</span>
                  <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="#features"
                  className="px-8 py-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/30 text-lg font-semibold"
                >
                  Explore Features
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Showcase */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Comprehensive ERP Modules
              </h2>
              <p className="text-xl text-blue-200 max-w-3xl mx-auto">
                Discover our complete suite of integrated business modules designed to optimize every aspect of your operations
              </p>
            </div>

            {/* Featured Module Spotlight */}
            <div className="mb-16 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-8 lg:p-12">
                  <div className="flex items-center space-x-3 mb-4">
                    {React.createElement(modules[currentFeature].icon, { 
                      className: `h-8 w-8 ${modules[currentFeature].color}` 
                    })}
                    <span className="text-sm font-semibold text-blue-300 uppercase tracking-wide">Featured Module</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">{modules[currentFeature].name}</h3>
                  <p className="text-lg text-blue-100 mb-6">{modules[currentFeature].description}</p>
                  <ul className="space-y-2 mb-8">
                    {modules[currentFeature].features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2 text-blue-200">
                        <ChevronRightIcon className="h-4 w-4 text-blue-400" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={modules[currentFeature].href}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                  >
                    <span>Explore {modules[currentFeature].name}</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </div>
                <div className="relative p-8 lg:p-12 bg-gradient-to-br from-blue-600/20 to-purple-600/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10"></div>
                  <div className="relative z-10 h-64 lg:h-full flex items-center justify-center">
                    <div className={`w-32 h-32 bg-gradient-to-br ${modules[currentFeature].gradient} rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-6 transition-transform duration-300`}>
                      {React.createElement(modules[currentFeature].icon, { 
                        className: "h-16 w-16 text-white" 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* All Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {modules.map((module, index) => (
                <Link
                  key={module.id}
                  to={module.href}
                  className={`group p-6 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl ${
                    index === currentFeature ? 'ring-2 ring-blue-400' : ''
                  }`}
                  onClick={() => setCurrentFeature(index)}
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${module.gradient} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {React.createElement(module.icon, { 
                      className: "h-6 w-6 text-white" 
                    })}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                    {module.name}
                  </h3>
                  <p className="text-sm text-blue-200 line-clamp-2">
                    {module.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Why Choose Our ERP?
              </h2>
              <p className="text-xl text-blue-200 max-w-3xl mx-auto">
                Experience the difference with our cutting-edge enterprise resource planning solution
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="text-center p-8 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                    {React.createElement(benefit.icon, { 
                      className: "h-8 w-8 text-white" 
                    })}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{benefit.title}</h3>
                  <p className="text-blue-200">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-lg rounded-2xl border border-white/20 p-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Transform Your Business?
              </h2>
              <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
                Join thousands of companies worldwide who trust our ERP solution to drive their success
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/login"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 text-lg font-semibold"
                >
                  Start Free Trial
                </Link>
                <Link
                  to="/contact"
                  className="px-8 py-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/30 text-lg font-semibold"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-3 mb-4 md:mb-0">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <SparklesIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-white font-semibold">{companyName} ERP</span>
              </div>
              <div className="text-blue-300 text-sm">
                © 2024 {companyName}. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
