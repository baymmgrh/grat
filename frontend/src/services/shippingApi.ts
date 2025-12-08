import { api } from '../store/api'

// Shipping API
export const shippingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getShippingOrders: builder.query({
      query: (params) => ({
        url: '/shipping/orders',
        params,
      }),
      providesTags: ['Shipping'],
    }),
    getShippingOrder: builder.query({
      query: (id) => `/shipping/orders/${id}`,
      providesTags: ['Shipping'],
    }),
    createShippingOrder: builder.mutation({
      query: (data) => ({
        url: '/shipping/orders',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Shipping'],
    }),
    updateShippingOrder: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/shipping/orders/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Shipping'],
    }),
    deleteShippingOrder: builder.mutation({
      query: (id) => ({
        url: `/shipping/orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Shipping'],
    }),
    getLogisticsProviders: builder.query({
      query: (params) => ({
        url: '/shipping/providers',
        params,
      }),
      providesTags: ['Shipping'],
    }),
    createLogisticsProvider: builder.mutation({
      query: (data) => ({
        url: '/shipping/providers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Shipping'],
    }),
    updateLogisticsProvider: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/shipping/providers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Shipping'],
    }),
    deleteLogisticsProvider: builder.mutation({
      query: (id) => ({
        url: `/shipping/providers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Shipping'],
    }),
    getDeliveryTracking: builder.query({
      query: (params) => ({
        url: '/shipping/tracking',
        params,
      }),
      providesTags: ['Shipping'],
    }),
    updateTrackingStatus: builder.mutation({
      query: ({ tracking_number, ...data }) => ({
        url: `/shipping/tracking/${tracking_number}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Shipping'],
    }),
  }),
})

export const {
  useGetShippingOrdersQuery,
  useGetShippingOrderQuery,
  useCreateShippingOrderMutation,
  useUpdateShippingOrderMutation,
  useDeleteShippingOrderMutation,
  useGetLogisticsProvidersQuery,
  useCreateLogisticsProviderMutation,
  useUpdateLogisticsProviderMutation,
  useDeleteLogisticsProviderMutation,
  useGetDeliveryTrackingQuery,
  useUpdateTrackingStatusMutation,
} = shippingApi
