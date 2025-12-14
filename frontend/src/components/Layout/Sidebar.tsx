import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { NavLink } from 'react-router-dom'
import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  BanknotesIcon,
  BeakerIcon,
  BookOpenIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  CogIcon,
  CubeIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  HomeIcon,
  PencilSquareIcon,
  QuestionMarkCircleIcon,
  ReceiptPercentIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  TrashIcon,
  TruckIcon,
  TvIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  PresentationChartLineIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  CalculatorIcon,
  ClipboardDocumentListIcon,
  RocketLaunchIcon,
  ArchiveBoxIcon,
  MapPinIcon,
  ArrowsRightLeftIcon,
  ChartPieIcon,
  UserGroupIcon,
  ClockIcon,
  DocumentCheckIcon,
  SparklesIcon,
  LightBulbIcon,
  ScaleIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import axiosInstance from '../../utils/axiosConfig'
import { usePermissions } from '../../contexts/PermissionContext'

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

function SidebarContent() {
  const [companyName, setCompanyName] = useState('ERP System')
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const { hasPermission, hasAnyPermission, isAdmin, isSuperAdmin, isLoading } = usePermissions()

  // Permission-based menu visibility
  // If still loading or is admin/super admin, show all menus
  const canView = (module: string) => isLoading || isAdmin || isSuperAdmin || hasPermission(`${module}.view`)
  const canViewAny = (modules: string[]) => isLoading || isAdmin || isSuperAdmin || hasAnyPermission(modules.map(m => `${m}.view`))

  // Menu Groups with proper labels and permissions
  const menuGroups = [
    {
      groupName: 'MAIN',
      items: [
        { name: 'Dashboard', href: '/app', icon: HomeIcon, permission: 'dashboard' },
      ]
    },
    {
      groupName: 'OPERATIONS',
      show: canViewAny(['products', 'inventory', 'warehouse', 'production', 'quality']),
      items: [
        { 
          name: 'Products', 
          href: '/app/products', 
          icon: CubeIcon,
          permission: 'products',
          children: [
            { name: 'All Products', href: '/app/products', icon: CubeIcon },
            { name: 'Dashboard', href: '/app/products/dashboard', icon: PresentationChartLineIcon },
            { name: 'Analytics', href: '/app/products/analytics', icon: ChartPieIcon },
            { name: 'Categories', href: '/app/products/categories', icon: ArchiveBoxIcon },
            { name: 'Bill of Materials', href: '/app/products/bom', icon: ClipboardDocumentListIcon, permission: 'bom' },
            { name: 'Lifecycle', href: '/app/products/lifecycle', icon: ArrowPathIcon },
            { name: 'Cost Calculator', href: '/app/products/calculator', icon: CalculatorIcon },
          ]
        },
        { 
          name: 'Warehouse', 
          href: '/app/warehouse', 
          icon: BuildingStorefrontIcon,
          permission: 'warehouse',
          children: [
            { name: 'Dashboard', href: '/app/warehouse', icon: PresentationChartLineIcon },
            { name: 'Inventory', href: '/app/warehouse/inventory', icon: ArchiveBoxIcon, permission: 'inventory' },
            { name: 'Materials', href: '/app/warehouse/materials', icon: CubeIcon, permission: 'materials' },
            { name: 'Stock Input', href: '/app/warehouse/stock-input', icon: ClipboardDocumentCheckIcon },
            { name: 'Locations', href: '/app/warehouse/locations', icon: MapPinIcon },
            { name: 'Movements', href: '/app/warehouse/movements', icon: ArrowsRightLeftIcon },
            { name: 'Analytics', href: '/app/warehouse/analytics', icon: ChartPieIcon },
          ]
        },
        { 
          name: 'Production', 
          href: '/app/production', 
          icon: CogIcon,
          permission: 'production',
          children: [
            { name: 'Dashboard', href: '/app/production', icon: PresentationChartLineIcon },
            { name: 'Work Orders', href: '/app/production/work-orders', icon: ClipboardDocumentListIcon, permission: 'work_orders' },
            { name: 'Sisa Order', href: '/app/production/remaining-stock', icon: ArchiveBoxIcon },
            { name: 'Changeover', href: '/app/production/changeovers', icon: ArrowsRightLeftIcon },
            { name: 'Approval', href: '/app/production/approvals', icon: ClipboardDocumentCheckIcon },
            { name: 'Jadwal Bulanan', href: '/app/production/monthly-schedule', icon: CalendarDaysIcon },
            { name: 'Jadwal Mingguan', href: '/app/production/scheduling', icon: CalendarDaysIcon },
            { name: 'MRP', href: '/app/production/mrp', icon: CalculatorIcon, permission: 'mrp' },
            { name: 'Demand Planning', href: '/app/production/demand-planning', icon: ChartBarIcon, permission: 'mrp' },
            { name: 'Capacity', href: '/app/production/capacity-planning', icon: ScaleIcon, permission: 'mrp' },
            { name: 'Efficiency', href: '/app/production/efficiency', icon: SparklesIcon },
            { name: 'Traceability', href: '/app/production/traceability', icon: DocumentCheckIcon },
          ]
        },
        { 
          name: 'Quality Control', 
          href: '/app/quality', 
          icon: CheckBadgeIcon,
          permission: 'quality',
          children: [
            { name: 'Dashboard', href: '/app/quality', icon: PresentationChartLineIcon },
            { name: 'QC Work Order', href: '/app/quality/pending-qc', icon: ClipboardDocumentCheckIcon },
            { name: 'Inspections', href: '/app/quality/tests', icon: BeakerIcon },
            { name: 'Alerts', href: '/app/quality-enhanced/alerts', icon: DocumentCheckIcon },
            { name: 'Analytics', href: '/app/quality-enhanced/analytics', icon: ChartPieIcon },
            { name: 'Audits', href: '/app/quality-enhanced/audits', icon: ClipboardDocumentListIcon },
          ]
        },
      ]
    },
    {
      groupName: 'SUPPLY CHAIN',
      show: canViewAny(['purchasing', 'sales', 'shipping', 'returns']),
      items: [
        { 
          name: 'Purchasing', 
          href: '/app/purchasing', 
          icon: ShoppingBagIcon,
          permission: 'purchasing',
          children: [
            { name: 'Dashboard', href: '/app/purchasing', icon: PresentationChartLineIcon },
            { name: 'Suppliers', href: '/app/purchasing/suppliers', icon: UserGroupIcon, permission: 'suppliers' },
            { name: 'Purchase Orders', href: '/app/purchasing/orders', icon: ClipboardDocumentListIcon, permission: 'purchase_orders' },
            { name: 'RFQ', href: '/app/purchasing/rfq', icon: DocumentTextIcon },
            { name: 'Contracts', href: '/app/purchasing/contracts', icon: DocumentCheckIcon },
            { name: 'Price Comparison', href: '/app/purchasing/price-comparison', icon: ScaleIcon },
          ]
        },
        { 
          name: 'Sales', 
          href: '/app/sales', 
          icon: ShoppingCartIcon,
          permission: 'sales',
          children: [
            { name: 'Dashboard', href: '/app/sales/dashboard', icon: PresentationChartLineIcon },
            { name: 'Customers', href: '/app/sales/customers', icon: UserGroupIcon, permission: 'customers' },
            { name: 'Leads', href: '/app/sales/leads', icon: UserGroupIcon, permission: 'leads' },
            { name: 'Opportunities', href: '/app/sales/opportunities', icon: ChartBarIcon },
            { name: 'Quotations', href: '/app/sales/quotations', icon: DocumentTextIcon, permission: 'quotations' },
            { name: 'Sales Orders', href: '/app/sales/orders', icon: ClipboardDocumentListIcon, permission: 'sales_orders' },
            { name: 'Forecasts', href: '/app/sales/forecasts', icon: ChartPieIcon },
          ]
        },
        { 
          name: 'Shipping', 
          href: '/app/shipping', 
          icon: TruckIcon,
          permission: 'shipping',
          children: [
            { name: 'Dashboard', href: '/app/shipping', icon: PresentationChartLineIcon },
            { name: 'Orders', href: '/app/shipping/orders', icon: ClipboardDocumentListIcon },
            { name: 'Tracking', href: '/app/shipping/tracking', icon: MapPinIcon },
            { name: 'Cost Calculator', href: '/app/shipping/calculator', icon: CalculatorIcon },
            { name: 'Providers', href: '/app/shipping/providers', icon: TruckIcon },
          ]
        },
        { name: 'Returns', href: '/app/returns', icon: ArrowPathIcon, permission: 'returns' },
      ]
    },
    {
      groupName: 'FINANCE & HR',
      show: canViewAny(['finance', 'accounting', 'hr', 'employees', 'payroll']),
      items: [
        { 
          name: 'Finance', 
          href: '/app/finance', 
          icon: BanknotesIcon,
          permission: 'finance',
          children: [
            { name: 'Dashboard', href: '/app/finance', icon: PresentationChartLineIcon },
            { name: 'Budget', href: '/app/finance/budget', icon: CurrencyDollarIcon },
            { name: 'Cash Flow', href: '/app/finance/cash-flow', icon: ArrowsRightLeftIcon },
            { name: 'Approvals', href: '/app/approval', icon: DocumentCheckIcon, permission: 'approval' },
          ]
        },
        { 
          name: 'Accounting', 
          href: '/app/accounting', 
          icon: CalculatorIcon,
          permission: 'accounting',
          children: [
            { name: 'Chart of Accounts', href: '/app/accounting/chart-of-accounts', icon: DocumentTextIcon },
            { name: 'General Ledger', href: '/app/accounting/general-ledger', icon: DocumentChartBarIcon },
            { name: 'Journal Entry', href: '/app/accounting/journal', icon: PencilSquareIcon },
            { name: 'Accounts Receivable', href: '/app/accounting/receivable', icon: ArrowDownTrayIcon },
            { name: 'Accounts Payable', href: '/app/accounting/payable', icon: ArrowUpTrayIcon },
            { name: 'Fixed Assets', href: '/app/accounting/fixed-assets', icon: BuildingOfficeIcon },
            { name: 'Tax Management', href: '/app/accounting/tax', icon: ReceiptPercentIcon },
            { name: 'WIP Ledger', href: '/app/finance/wip-ledger', icon: CubeIcon },
            { name: 'Financial Reports', href: '/app/accounting/reports', icon: DocumentChartBarIcon },
          ]
        },
        { 
          name: 'Human Resources', 
          href: '/app/hr', 
          icon: UsersIcon,
          permission: 'hr',
          children: [
            { name: 'Dashboard', href: '/app/hr/dashboard', icon: PresentationChartLineIcon },
            { name: 'Employees', href: '/app/hr/employees', icon: UserGroupIcon, permission: 'employees' },
            { name: 'Attendance', href: '/app/hr/attendance', icon: ClockIcon, permission: 'attendance' },
            { name: 'Leave Management', href: '/app/hr/leaves', icon: CalendarDaysIcon, permission: 'leave' },
            { name: 'Payroll', href: '/app/hr/payroll', icon: CurrencyDollarIcon, permission: 'payroll' },
            { name: 'Performance', href: '/app/hr/appraisal', icon: ChartBarIcon, permission: 'appraisal' },
            { name: 'Training', href: '/app/hr/training', icon: AcademicCapIcon, permission: 'training' },
            { name: 'Work Roster', href: '/app/hr/roster', icon: CalendarDaysIcon, permission: 'roster' },
          ]
        },
      ]
    },
    {
      groupName: 'MAINTENANCE & R&D',
      show: canViewAny(['maintenance', 'rd', 'waste', 'oee']),
      items: [
        { 
          name: 'Maintenance', 
          href: '/app/maintenance', 
          icon: WrenchScrewdriverIcon,
          permission: 'maintenance',
          children: [
            { name: 'Dashboard', href: '/app/maintenance', icon: PresentationChartLineIcon },
            { name: 'Work Orders', href: '/app/maintenance/records', icon: ClipboardDocumentListIcon },
            { name: 'Schedule', href: '/app/maintenance/schedules', icon: CalendarDaysIcon },
            { name: 'New Request', href: '/app/maintenance/request/new', icon: ClipboardDocumentCheckIcon },
            { name: 'Analytics', href: '/app/maintenance/analytics', icon: ChartPieIcon },
          ]
        },
        { 
          name: 'R&D', 
          href: '/app/rd', 
          icon: LightBulbIcon,
          permission: 'rd',
          children: [
            { name: 'Dashboard', href: '/app/rd', icon: PresentationChartLineIcon },
            { name: 'Projects', href: '/app/rd/projects', icon: ClipboardDocumentListIcon },
            { name: 'Experiments', href: '/app/rd/experiments', icon: BeakerIcon },
            { name: 'Materials', href: '/app/rd/materials', icon: CubeIcon },
            { name: 'Product Dev', href: '/app/rd/products', icon: RocketLaunchIcon },
            { name: 'Reports', href: '/app/rd/reports', icon: DocumentChartBarIcon },
          ]
        },
        { name: 'Waste Management', href: '/app/waste', icon: TrashIcon, permission: 'waste' },
        { name: 'OEE Monitoring', href: '/app/oee', icon: ChartBarIcon, permission: 'oee' },
      ]
    },
    {
      groupName: 'REPORTS & SETTINGS',
      items: [
        { name: 'Reports', href: '/app/reports', icon: DocumentChartBarIcon, permission: 'reports' },
        { 
          name: 'Documents', 
          href: '/app/documents', 
          icon: DocumentTextIcon,
          permission: 'documents',
          subItems: [
            { name: 'All Documents', href: '/app/documents' },
            { name: 'Generate', href: '/app/documents/generate' },
            { name: 'Templates', href: '/app/documents/templates', permission: 'templates' }
          ]
        },
        { name: 'TV Display', href: '/app/tv-display', icon: TvIcon, permission: 'tv_display' },
        { name: 'Group Chat', href: '/app/chat', icon: ChatBubbleLeftRightIcon },
        { 
          name: 'User Manual', 
          href: '/app/manual', 
          icon: BookOpenIcon,
          children: [
            { name: 'Dokumentasi', href: '/app/manual', icon: BookOpenIcon },
            { name: 'FAQ', href: '/app/manual/faq', icon: QuestionMarkCircleIcon },
            { name: 'Kelola Manual', href: '/app/manual/admin', icon: Cog6ToothIcon, superAdminOnly: true },
          ]
        },
        { name: 'Settings', href: '/app/settings', icon: Cog6ToothIcon, permission: 'settings', superAdminOnly: true },
      ]
    }
  ]

  useEffect(() => {
    loadCompanySettings()
  }, [])

  const loadCompanySettings = async () => {
    try {
      const response = await axiosInstance.get('/api/settings/company/public')
      if (response.data && response.data.name) {
        setCompanyName(response.data.name)
      }
    } catch (error) {
      console.error('Error loading company settings:', error)
      // Use fallback if API fails  
      setCompanyName('ERP System')
    }
  }

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  return (
    <div className="flex grow flex-col gap-y-3 overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-800 px-4 pb-4">
      {/* Company Header */}
      <div className="flex h-16 shrink-0 items-center border-b border-slate-700/50 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg" aria-hidden="true">
            <CubeIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-lg font-bold tracking-tight">{companyName}</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col" role="navigation" aria-label="Menu utama">
        <div className="space-y-6">
          {menuGroups
            .filter((group: any) => group.show === undefined || group.show)
            .map((group: any) => {
              // Filter items based on permission and admin status
              const visibleItems = group.items.filter((item: any) => {
                // If item requires super admin, check isSuperAdmin
                if (item.superAdminOnly && !isSuperAdmin) return false
                // Check permission
                return !item.permission || canView(item.permission)
              })
              
              if (visibleItems.length === 0) return null
              
              return (
                <div key={group.groupName}>
                  {/* Group Label */}
                  {group.groupName !== 'MAIN' && (
                    <div className="px-2 mb-2">
                      <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                        {group.groupName}
                      </span>
                    </div>
                  )}
                  
                  <ul role="list" className="space-y-1">
                    {visibleItems.map((item: any) => (
                      <li key={item.name}>
                        {item.children ? (
                          // Menu with submenu
                          <div>
                            <button
                              onClick={() => toggleExpanded(item.name.toLowerCase())}
                              className={clsx(
                                expandedItems.includes(item.name.toLowerCase())
                                  ? 'bg-slate-700/50 text-white'
                                  : 'text-slate-300 hover:text-white hover:bg-slate-700/30',
                                'group flex w-full items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150'
                              )}
                            >
                              <item.icon className={clsx(
                                'h-5 w-5 shrink-0 transition-colors',
                                expandedItems.includes(item.name.toLowerCase()) ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'
                              )} aria-hidden="true" />
                              <span className="flex-1 text-left">{item.name}</span>
                              <ChevronDownIcon className={clsx(
                                'h-4 w-4 transition-transform duration-200',
                                expandedItems.includes(item.name.toLowerCase()) ? 'rotate-180 text-blue-400' : 'text-slate-500'
                              )} />
                            </button>
                            
                            {/* Submenu with animation */}
                            <div className={clsx(
                              'overflow-hidden transition-all duration-200',
                              expandedItems.includes(item.name.toLowerCase()) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                            )}>
                              <ul className="mt-1 ml-4 border-l border-slate-700/50 pl-3 space-y-0.5">
                                {item.children
                                  .filter((child: any) => !child.permission || canView(child.permission))
                                  .map((child: any) => (
                                  <li key={child.name}>
                                    <NavLink
                                      to={child.href}
                                      className={({ isActive }) =>
                                        clsx(
                                          isActive
                                            ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400 -ml-[13px] pl-[11px]'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-700/30',
                                          'group flex items-center gap-x-2.5 rounded-md py-2 px-2.5 text-sm transition-all duration-150'
                                        )
                                      }
                                    >
                                      {child.icon && <child.icon className="h-4 w-4 shrink-0" />}
                                      {child.name}
                                    </NavLink>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ) : (
                          // Regular menu item
                          <NavLink
                            to={item.href}
                            end={item.href === '/app'}
                            className={({ isActive }) =>
                              clsx(
                                isActive
                                  ? 'bg-gradient-to-r from-blue-600/20 to-transparent text-white border-l-2 border-blue-500'
                                  : 'text-slate-300 hover:text-white hover:bg-slate-700/30 border-l-2 border-transparent',
                                'group flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150'
                              )
                            }
                          >
                            <item.icon className={clsx(
                              'h-5 w-5 shrink-0 transition-colors'
                            )} aria-hidden="true" />
                            {item.name}
                          </NavLink>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
        </div>
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-slate-700/50">
        <div className="px-2 py-2 text-center">
          <span className="text-[10px] text-slate-500">ERP System v2.0</span>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMobileClose = () => {
    // Only close if we're actually on mobile
    if (isMobile) {
      setOpen(false);
    }
  };

  return (
    <>
      {/* Mobile sidebar - only render on mobile */}
      {isMobile && (
        <Transition.Root show={open} as={Fragment}>
          <Dialog as="div" className="relative z-50 lg:hidden" onClose={handleMobileClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={handleMobileClose}>
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:z-40 lg:w-64 lg:flex-col transition-all duration-300 ${
        open ? 'lg:flex' : 'lg:hidden'
      }`}>
        <SidebarContent />
      </div>
    </>
  )
}
