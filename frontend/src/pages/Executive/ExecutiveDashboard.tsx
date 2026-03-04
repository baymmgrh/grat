import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  Package, CheckCircle, AlertTriangle, Users, Activity,
  BarChart3, ArrowUpRight, ArrowDownRight,
  UserCircle, Shield, Clock, RefreshCw, Zap, Target,
  Factory, Boxes, BadgeCheck, Wallet, CreditCard, TrendingUp as TrendUp
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../utils/axiosConfig';
import { 
  Skeleton, CardSkeleton, ChartSkeleton, ListSkeleton, 
  UserCardSkeleton, KPISkeleton 
} from '../../components/ui/Skeleton';
import ProductionOutputModal from '../../components/Production/ProductionOutputModal';

const ExecutiveDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('30');
  const [canViewProfiles, setCanViewProfiles] = useState(false);
  const [showProductionOutput, setShowProductionOutput] = useState(false);

  // Check if current user can view other profiles (admin roles only)
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const response = await api.get('/api/auth/me');
        const userData = response.data.user;
        
        // Roles that can view other profiles (Supervisor level and above, including Staff)
        const adminRoles = [
          // Admin level
          'Super Admin', 'Admin', 'IT Admin',
          // Direktur level
          'Direktur Utama', 'Direktur Operasional', 'Direktur Keuangan', 'Direktur HRD',
          // Manager level
          'General Manager',
          'Manager Produksi', 'Manager Sales', 'Manager Purchasing', 'Manager Warehouse',
          'Manager Finance', 'Manager HRD', 'Manager QC', 'Manager Maintenance', 'Manager R&D',
          'Manager PPIC',
          // Supervisor level
          'Supervisor Produksi', 'Supervisor Warehouse', 'Supervisor QC', 'Supervisor PPIC',
          'Production Supervisor', 'Team Lead Sales',
          // Staff level
          'Admin Staff', 'Sales Staff', 'Purchasing Staff', 'Warehouse Staff', 'Production Staff',
          'Finance Staff', 'HR Staff', 'QC Staff', 'Maintenance Staff', 'R&D Staff', 'Staff PPIC',
          'Quality Control', 'Auditor'
        ];
        const userRoles = userData.roles || [];
        
        const hasAdminRole = userRoles.some((role: string) => adminRoles.includes(role));
        const isAdmin = userData.is_admin || userData.is_super_admin || hasAdminRole;
        
        setCanViewProfiles(isAdmin);
      } catch (err) {
        console.error('Error checking permission:', err);
        setCanViewProfiles(false);
      }
    };
    
    checkPermission();
  }, []);

  const handleUserClick = (userId: number) => {
    if (canViewProfiles) {
      navigate(`/app/profile/${userId}`);
    }
  };

  // Fetch overview data
  const { data: overview, isLoading: loadingOverview, refetch: refetchOverview } = useQuery({
    queryKey: ['executive-overview', dateRange],
    queryFn: () => api.get(`/api/executive/overview?days=${dateRange}`).then(res => res.data.data)
  });

  // Fetch trends data
  const { data: trends, isLoading: loadingTrends } = useQuery({
    queryKey: ['executive-trends', dateRange],
    queryFn: () => api.get(`/api/executive/trends?days=${dateRange}`).then(res => res.data.data)
  });

  // Fetch scorecard
  const { data: scorecard, isLoading: loadingScorecard } = useQuery({
    queryKey: ['executive-scorecard'],
    queryFn: () => api.get('/api/executive/performance-scorecard').then(res => res.data.data)
  });

  // Fetch top performers
  const { data: topPerformers, isLoading: loadingPerformers } = useQuery({
    queryKey: ['executive-performers'],
    queryFn: () => api.get('/api/executive/top-performers').then(res => res.data.data)
  });

  // Fetch alerts
  const { data: alerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ['executive-alerts'],
    queryFn: () => api.get('/api/executive/alerts').then(res => res.data.data)
  });

  // Fetch active users
  const { data: activeUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ['executive-active-users'],
    queryFn: () => api.get('/api/executive/active-users').then(res => res.data.data),
    refetchInterval: 60000
  });

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `Rp ${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `Rp ${(value / 1000).toFixed(1)}K`;
    return `Rp ${value}`;
  };

  const isLoading = loadingOverview || loadingTrends || loadingScorecard;

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 min-h-screen -m-6 p-6">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-2xl shadow-indigo-500/25">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -left-1/4 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg">
                <BarChart3 className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Executive Dashboard</h1>
                <p className="text-blue-100 text-sm">PT. Gratia Makmur Sentosa</p>
              </div>
            </div>
            </div>
          <div className="mt-3 flex items-center gap-2 text-blue-100 text-sm">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              {isLoading ? (
                <Skeleton className="h-3 w-32 bg-white/20" />
              ) : (
                <span>Live • {overview?.period?.start_date} - {overview?.period?.end_date}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select 
              className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm font-medium backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 transition-all cursor-pointer hover:bg-white/20"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="7" className="text-slate-900">7 Days</option>
              <option value="30" className="text-slate-900">30 Days</option>
              <option value="90" className="text-slate-900">90 Days</option>
            </select>
            <button 
              onClick={() => refetchOverview()}
              className="p-2.5 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 hover:scale-105 active:scale-95 transition-all"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${loadingOverview ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {!loadingAlerts && alerts && alerts.total_alerts > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-rose-500 rounded-xl p-4 text-white shadow-lg animate-pulse-slow">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {alerts.critical_count} Critical Alert{alerts.critical_count > 1 ? 's' : ''} Require Attention
              </h3>
              <div className="mt-2 space-y-1">
                {alerts.alerts.slice(0, 3).map((alert: any, idx: number) => (
                  <p key={idx} className="text-sm text-red-100 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    {alert.message}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Revenue Card */}
        {loadingOverview ? <CardSkeleton /> : (
          <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl p-6 border border-slate-200/80 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-600 transition-all duration-500 overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Revenue</p>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
                    {formatCurrency(overview?.financial?.revenue || 0)}
                  </h3>
                </div>
                <div className="p-3.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2">
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  (overview?.financial?.revenue_growth || 0) >= 0 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {(overview?.financial?.revenue_growth || 0) >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {Math.abs(overview?.financial?.revenue_growth || 0).toFixed(1)}%
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">vs last period</span>
              </div>
            </div>
          </div>
        )}

        {/* Sales Orders Card */}
        {loadingOverview ? <CardSkeleton /> : (
          <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl p-6 border border-slate-200/80 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-600 transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sales Orders</p>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
                    {overview?.sales?.total_orders || 0}
                  </h3>
                </div>
                <div className="p-3.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {overview?.sales?.fulfillment_rate || 0}%
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">fulfillment rate</span>
              </div>
            </div>
          </div>
        )}

        {/* Production Output Card - Clickable */}
        {loadingOverview ? <CardSkeleton /> : (
          <div 
            className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl p-6 border border-slate-200/80 dark:border-slate-700 hover:border-violet-200 dark:hover:border-violet-600 transition-all duration-500 overflow-hidden cursor-pointer"
            onClick={() => setShowProductionOutput(true)}
            title="Klik untuk lihat detail per mesin & produk"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Production Output</p>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
                    {(overview?.production?.output || 0).toLocaleString()}
                  </h3>
                </div>
                <div className="p-3.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg shadow-violet-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Factory className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                  <Zap className="w-3.5 h-3.5" />
                  {overview?.production?.avg_oee || 0}%
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">avg OEE</span>
              </div>
              <p className="text-xs text-violet-500 mt-2">Klik untuk detail →</p>
            </div>
          </div>
        )}

        {/* Quality Pass Rate Card */}
        {loadingOverview ? <CardSkeleton /> : (
          <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl p-6 border border-slate-200/80 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-600 transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Quality Pass Rate</p>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
                    {overview?.quality?.pass_rate || 0}%
                  </h3>
                </div>
                <div className="p-3.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <BadgeCheck className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-5">
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 h-2.5 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${overview?.quality?.pass_rate || 0}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {overview?.quality?.passed_inspections || 0} / {overview?.quality?.total_inspections || 0} inspections
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue Trend */}
        {loadingTrends ? <ChartSkeleton /> : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg p-6 border border-slate-200/80 dark:border-slate-700 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Trend</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Monthly revenue performance</p>
              </div>
              <div className="p-2.5 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl">
                <TrendUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trends?.revenue || []}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Production & OEE Trend */}
        {loadingTrends ? <ChartSkeleton /> : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg p-6 border border-slate-200/80 dark:border-slate-700 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Production & OEE</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Output vs efficiency</p>
              </div>
              <div className="p-2.5 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-xl">
                <Factory className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trends?.production || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Output" />
                <Line yAxisId="right" type="monotone" dataKey={(d: any) => 
                  trends?.oee?.find((o: any) => o.period === d.period)?.value || 0
                } stroke="#10b981" strokeWidth={2} name="OEE %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>


      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Customers */}
        {loadingPerformers ? <ListSkeleton rows={5} /> : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg border border-slate-200/80 dark:border-slate-700 overflow-hidden transition-all duration-300">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Top Customers</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">By revenue</p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {topPerformers?.top_customers?.slice(0, 5).map((customer: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' :
                      idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                      idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                      'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{customer.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{customer.orders} orders</p>
                    </div>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(customer.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Products */}
        {loadingPerformers ? <ListSkeleton rows={5} /> : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg border border-slate-200/80 dark:border-slate-700 overflow-hidden transition-all duration-300">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Top Products</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">By quantity sold</p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {topPerformers?.top_products?.slice(0, 5).map((product: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' :
                      idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                      idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                      'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{product.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{product.code}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {product.quantity?.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="group bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg p-6 border border-slate-200/80 dark:border-slate-700 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">Cash Collected</h4>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(overview?.financial?.cash_collected || 0)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full"
                style={{ width: `${overview?.financial?.collection_rate || 0}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{overview?.financial?.collection_rate || 0}%</span>
          </div>
        </div>

        <div className="group bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg p-6 border border-slate-200/80 dark:border-slate-700 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">Outstanding AR</h4>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatCurrency(overview?.financial?.outstanding_ar || 0)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">Accounts Receivable</p>
        </div>

        <div className="group bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg p-6 border border-slate-200/80 dark:border-slate-700 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-xl group-hover:scale-110 transition-transform">
              <Boxes className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">Inventory Value</h4>
          </div>
          <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
            {formatCurrency(overview?.inventory?.total_value || 0)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            <span className="text-amber-500 font-semibold">{overview?.inventory?.low_stock_items || 0}</span> low stock items
          </p>
        </div>
      </div>

      {/* Active Users Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg p-6 border border-slate-200/80 dark:border-slate-700 transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Users</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Real-time user activity</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{activeUsers?.online_count || 0} Online</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">{activeUsers?.recent_count || 0} Recent</span>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Total: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeUsers?.total_users || 0}</span>
            </div>
          </div>
        </div>

        {loadingUsers ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <UserCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeUsers?.users?.slice(0, 12).map((user: any) => (
              <div 
                key={user.id} 
                onClick={() => handleUserClick(user.id)}
                className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                  canViewProfiles ? 'cursor-pointer' : ''
                } ${
                  user.status === 'online' 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                    : user.status === 'recent'
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                    : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
                }`}
                title={canViewProfiles ? 'Klik untuk melihat profil' : ''}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      user.is_admin 
                        ? 'bg-gradient-to-br from-violet-500 to-purple-600' 
                        : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    }`}>
                      {user.is_admin ? (
                        <Shield className="w-5 h-5 text-white" />
                      ) : (
                        <UserCircle className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 ${
                      user.status === 'online' ? 'bg-emerald-500' :
                      user.status === 'recent' ? 'bg-amber-500' :
                      'bg-slate-400'
                    }`}></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-slate-900 dark:text-white truncate ${
                      canViewProfiles ? 'hover:text-blue-600 dark:hover:text-blue-400' : ''
                    }`}>
                      {user.full_name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{user.username}</p>
                    {user.roles?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {user.roles.slice(0, 2).map((role: string, idx: number) => (
                          <span 
                            key={idx}
                            className="px-2 py-0.5 text-xs font-medium bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {user.status === 'online' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Online now</span>
                    ) : user.time_ago ? (
                      `Last active ${user.time_ago}`
                    ) : (
                      'Never logged in'
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeUsers?.users?.length > 12 && (
          <div className="mt-6 text-center">
            <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium">
              View all {activeUsers.total_users} users →
            </button>
          </div>
        )}
      </div>

      {/* Production Output Detail Modal */}
      <ProductionOutputModal
        isOpen={showProductionOutput}
        onClose={() => setShowProductionOutput(false)}
        days={parseInt(dateRange)}
      />
    </div>
  );
};

export default ExecutiveDashboard;
