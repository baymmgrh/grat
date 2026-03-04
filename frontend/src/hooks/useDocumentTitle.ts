import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useGetCompanyPublicQuery } from '../services/api'

const ROUTE_TITLES: Record<string, string> = {
  '/app/dashboard': 'Dashboard',
  '/app/production/work-orders': 'Work Orders',
  '/app/production/input': 'Input Produksi',
  '/app/production/daily-controller': 'Daily Controller',
  '/app/production/live-monitoring': 'Live Monitoring',
  '/app/production/packing-list': 'Packing List',
  '/app/production/wip-stock': 'WIP Stock',
  '/app/oee': 'OEE Dashboard',
  '/app/oee/enhanced': 'OEE Enhanced',
  '/app/quality': 'Quality Control',
  '/app/quality/inspections': 'QC Inspections',
  '/app/quality/packing-list': 'QC Packing List',
  '/app/inventory': 'Inventory',
  '/app/inventory/products': 'Products',
  '/app/inventory/materials': 'Materials',
  '/app/warehouse': 'Warehouse',
  '/app/warehouse/finished-goods': 'Finished Goods',
  '/app/purchasing': 'Purchasing',
  '/app/purchasing/orders': 'Purchase Orders',
  '/app/purchasing/suppliers': 'Suppliers',
  '/app/sales': 'Sales',
  '/app/sales/orders': 'Sales Orders',
  '/app/sales/customers': 'Customers',
  '/app/hr': 'HR',
  '/app/hr/employees': 'Employees',
  '/app/hr/attendance': 'Attendance',
  '/app/hr/payroll': 'Payroll',
  '/app/settings': 'Settings',
  '/app/users': 'User Management',
}

const getPageTitle = (pathname: string): string => {
  // Exact match
  if (ROUTE_TITLES[pathname]) {
    return ROUTE_TITLES[pathname]
  }
  
  // Check for dynamic routes (e.g., /app/production/work-orders/123)
  for (const [route, title] of Object.entries(ROUTE_TITLES)) {
    if (pathname.startsWith(route + '/')) {
      // Extract ID or action from path
      const suffix = pathname.replace(route + '/', '')
      if (suffix.match(/^\d+$/)) {
        return `${title} #${suffix}`
      }
      if (suffix === 'create' || suffix === 'new') {
        return `${title} - Baru`
      }
      if (suffix.includes('/edit')) {
        return `${title} - Edit`
      }
      return title
    }
  }
  
  // Fallback: generate title from path
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1]
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/-/g, ' ')
  }
  
  return ''
}

export const useDocumentTitle = (pageTitle?: string) => {
  const { data: companyPublic } = useGetCompanyPublicQuery()
  const location = useLocation()
  
  useEffect(() => {
    const companyName = companyPublic?.name || 'ERP System'
    const autoTitle = getPageTitle(location.pathname)
    const title = pageTitle || autoTitle
    document.title = title ? `${title} | ${companyName}` : companyName
  }, [companyPublic, pageTitle, location.pathname])
}
