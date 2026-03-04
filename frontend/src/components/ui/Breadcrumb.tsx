import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Route to label mapping
const routeLabels: Record<string, string> = {
  'app': 'Home',
  'dashboard': 'Dashboard',
  // Products
  'products': 'Products',
  'bom': 'Bill of Materials',
  'categories': 'Categories',
  'lifecycle': 'Lifecycle',
  'calculator': 'Cost Calculator',
  'analytics': 'Analytics',
  // Warehouse
  'warehouse': 'Warehouse',
  'inventory': 'Inventory',
  'materials': 'Materials',
  'stock-input': 'Stock Input',
  'locations': 'Locations',
  'zones': 'Zones',
  'movements': 'Movements',
  // Production
  'production': 'Production',
  'work-orders': 'Work Orders',
  'scheduling': 'Scheduling',
  'mrp': 'MRP',
  'demand-planning': 'Demand Planning',
  'capacity-planning': 'Capacity Planning',
  'efficiency': 'Efficiency',
  'traceability': 'Traceability',
  // Quality
  'quality': 'Quality Control',
  'tests': 'Quality Tests',
  // Purchasing
  'purchasing': 'Purchasing',
  'suppliers': 'Suppliers',
  'orders': 'Orders',
  'rfq': 'RFQ',
  'contracts': 'Contracts',
  'price-comparison': 'Price Comparison',
  'supplier-integration': 'Supplier Integration',
  // Sales
  'sales': 'Sales',
  // Shipping
  'shipping': 'Shipping',
  'tracking': 'Tracking',
  'providers': 'Providers',
  // Finance
  'finance': 'Finance',
  'accounting': 'Accounting',
  'budget': 'Budget',
  'cash-flow': 'Cash Flow',
  'wip-ledger': 'WIP Ledger',
  'reports': 'Reports',
  'approval': 'Approvals',
  // HR
  'hr': 'Human Resources',
  'employees': 'Employees',
  'attendance': 'Attendance',
  'leaves': 'Leave Management',
  'payroll': 'Payroll',
  'appraisal': 'Performance',
  'training': 'Training',
  'roster': 'Work Roster',
  // Maintenance
  'maintenance': 'Maintenance',
  'records': 'Work Orders',
  'schedules': 'Schedule',
  'request': 'Request',
  // R&D
  'rd': 'R&D',
  'projects': 'Projects',
  'experiments': 'Experiments',
  // 'materials': 'Materials', // already defined
  // 'products': 'Products', // already defined
  // 'reports': 'Reports', // already defined
  // Others
  'waste': 'Waste Management',
  'returns': 'Returns',
  'oee': 'OEE Monitoring',
  'tv-display': 'TV Display',
  'documents': 'Documents',
  'settings': 'Settings',
  // Actions
  'new': 'New',
  'edit': 'Edit',
  'details': 'Details',
  'list': 'List',
};

const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Generate breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = pathnames.map((segment, index) => {
    const href = `/${pathnames.slice(0, index + 1).join('/')}`;
    
    // Check if segment is a number (ID)
    const isId = /^\d+$/.test(segment);
    
    // Get label from mapping or format the segment
    let label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    
    if (isId) {
      label = `#${segment}`;
    }

    return {
      label,
      href: index < pathnames.length - 1 ? href : undefined, // Last item has no link
    };
  });

  // Don't show breadcrumb on home page
  if (pathnames.length <= 1) {
    return null;
  }

  return (
    <nav className="mb-6" aria-label="Breadcrumb">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 px-4 py-3">
        <ol className="flex items-center flex-wrap gap-1 text-sm">
          {/* Home */}
          <li>
            <Link
              to="/app"
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-700 transition-all"
            >
              <HomeIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </li>

          {breadcrumbItems.slice(1).map((item, index) => (
            <li key={index} className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-0.5" />
              {item.href ? (
                <Link
                  to={item.href}
                  className="px-2 py-1 rounded-md text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-700 transition-all font-medium"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
};

export default Breadcrumb;
