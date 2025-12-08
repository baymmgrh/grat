import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import type { RootState } from './index'

// Auto-detect the correct API base URL with better network handling
const getApiBaseUrl = () => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  const hostname = window.location.hostname;
  
  // Use the same hostname that the user is accessing the frontend from
  // This ensures LAN users connect to the correct server
  return `http://${hostname}:5000/api`;
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: getApiBaseUrl(),
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
})

// Custom event for session expiry
export const SESSION_EXPIRED_EVENT = 'session-expired';

// Wrapper to handle 401 errors and dispatch session expired event
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    // Dispatch custom event for session expiry
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }
  
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'Products',
    'Materials',
    'Suppliers',
    'Customers',
    'SalesOrders',
    'PurchaseOrders',
    'WorkOrders',
    'Machines',
    'Employees',
    'Departments', 
    'Shifts',
    'UsersIcon',
    'Roles',
    'Permissions',
    'Settings',
    'Warehouse',
    'Inventory',
    'QualityTests',
    'Quality',
    'Maintenance',
    'Projects',
    'MRP',
    'OEE',
    'Waste',
    'Notifications',
    'Dashboard',
    'Shipping',
    'Finance',
    'HR',
    'Reports',
    'Approvals',
    'RFQs',
    'Quotes',
    'Contracts',
    'Sales',
    'Roster',
    // HR Extended tags
    'Attendance',
    'Leaves',
    'Payroll',
    'Appraisal',
    'Training',
    // R&D tags
    'RD',
    'Experiments',
    'ProductDevelopments',
  ],
  endpoints: () => ({}),
})
