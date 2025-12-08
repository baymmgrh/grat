import { fetchBaseQuery } from '../../services/api';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface CustomerReturn {
  id: number
  return_number: string
  customer_name: string
  return_date: string
  reason: string
  status: string
  qc_status: string
  total_items: number
  total_value: number
  qc_required: boolean
}

export interface ReturnDetails {
  id: number
  return_number: string
  sales_order_number?: string
  customer: {
    id: number
    name: string
    contact: string
  }
  return_date: string
  reason: string
  description?: string
  status: string
  qc_status: string
  qc_required: boolean
  qc_notes?: string
  total_items: number
  total_value: number
  items: ReturnItem[]
  qc_records: QCRecord[]
}

export interface ReturnItem {
  id: number
  product_name: string
  quantity_returned: number
  unit_price: number
  total_value: number
  condition_received: string
  defect_description?: string
  qc_status?: string
  qc_quantity_approved: number
  qc_quantity_rejected: number
  disposition?: string
  batch_number?: string
}

export interface QCRecord {
  id: number
  qc_date: string
  qc_by: string
  overall_result: string
  quantity_inspected: number
  quantity_approved: number
  quantity_rejected: number
  defects_found?: string
  recommendation?: string
  qc_notes?: string
}

export interface CreateReturnRequest {
  customer_id: number
  sales_order_id?: number
  return_date: string
  reason: string
  description?: string
  qc_required?: boolean
  items: {
    sales_order_item_id?: number
    product_id: number
    quantity_returned: number
    unit_price: number
    condition_received: string
    defect_description?: string
    batch_number?: string
  }[]
}

export interface QCInspectionRequest {
  return_item_id?: number
  visual_inspection: string
  functional_test?: string
  dimensional_check?: string
  overall_result: string
  quantity_inspected: number
  quantity_approved?: number
  quantity_rejected?: number
  defects_found?: string
  qc_notes?: string
  recommendation?: string
}

export interface DispositionRequest {
  dispositions: {
    return_item_id: number
    disposition_type: string
    quantity: number
    warehouse_location?: string
    waste_category?: string
    work_order_id?: number
    notes?: string
  }[]
}

export interface ReturnAnalytics {
  summary: {
    total_returns: number
    pending_qc: number
    approved_returns: number
    rejected_returns: number
    qc_approval_rate: number
  }
  return_reasons: {
    reason: string
    count: number
  }[]
  monthly_trends: {
    month: string
    count: number
  }[]
}

// Auto-detect the correct API base URL
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api/returns';
  } else {
    // Use same IP as frontend but port 5000 for backend
    return `http://${hostname}:5000/api/returns`;
  }
};

export const returnsApi = createApi({
  reducerPath: 'returnsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: getApiBaseUrl(),
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token')
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Return', 'QC', 'Analytics'],
  endpoints: (builder) => ({
    // Get all returns
    getReturns: builder.query<{
      returns: CustomerReturn[]
      total: number
      pages: number
      current_page: number
    }, {
      page?: number
      per_page?: number
      status?: string
      qc_status?: string
    }>({
      query: (params = {}) => ({
        url: '',
        params
      }),
      providesTags: ['Return']
    }),

    // Get return details
    getReturn: builder.query<ReturnDetails, number>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Return', id }]
    }),

    // Create new return
    createReturn: builder.mutation<{
      message: string
      return_id: number
      return_number: string
    }, CreateReturnRequest>({
      query: (data) => ({
        url: '',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Return', 'Analytics']
    }),

    // Create QC inspection
    createQCInspection: builder.mutation<{
      message: string
      qc_record_id: number
      overall_result: string
    }, { return_id: number; inspection: QCInspectionRequest }>({
      query: ({ return_id, inspection }) => ({
        url: `/${return_id}/qc`,
        method: 'POST',
        body: inspection
      }),
      invalidatesTags: (result, error, { return_id }) => [
        { type: 'Return', id: return_id },
        'QC',
        'Analytics'
      ]
    }),

    // Create disposition
    createDisposition: builder.mutation<{
      message: string
    }, { return_id: number; disposition: DispositionRequest }>({
      query: ({ return_id, disposition }) => ({
        url: `/${return_id}/disposition`,
        method: 'POST',
        body: disposition
      }),
      invalidatesTags: (result, error, { return_id }) => [
        { type: 'Return', id: return_id },
        'Analytics'
      ]
    }),

    // Get analytics
    getReturnAnalytics: builder.query<ReturnAnalytics, void>({
      query: () => '/analytics',
      providesTags: ['Analytics']
    })
  })
})

export const {
  useGetReturnsQuery,
  useGetReturnQuery,
  useCreateReturnMutation,
  useCreateQCInspectionMutation,
  useCreateDispositionMutation,
  useGetReturnAnalyticsQuery
} = returnsApi
