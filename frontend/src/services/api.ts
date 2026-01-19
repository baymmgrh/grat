import { api } from '../store/api'

// Products API
export const productsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params) => ({
        url: '/products',
        params: { all: true, ...params },  // Default to get all products for dropdowns
      }),
      providesTags: ['Products'],
    }),
    getProduct: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: ['Products'],
    }),
    createProduct: builder.mutation({
      query: (data) => ({
        url: '/products',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Products'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Products'],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Products'],
    }),
    getProductCategories: builder.query({
      query: () => '/products/categories',
      providesTags: ['Products'],
    }),
  }),
})

// MRP API
export const mrpApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMRPMaterials: builder.query({
      query: (params) => ({
        url: '/mrp/materials',
        params,
      }),
      providesTags: ['MRP'],
    }),
    getMRPBOMs: builder.query({
      query: (params) => ({
        url: '/mrp/bom',
        params,
      }),
      providesTags: ['MRP'],
    }),
    getMRPBOMDetails: builder.query({
      query: (bomId) => `/mrp/bom/${bomId}`,
      providesTags: ['MRP'],
    }),
    getMRPRequirements: builder.query({
      query: (params) => ({
        url: '/mrp/requirements',
        params,
      }),
      providesTags: ['MRP'],
    }),
    createMRPPlan: builder.mutation({
      query: (data) => ({
        url: '/mrp/planning',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['MRP'],
    }),
  }),
})

// Warehouse API
export const warehouseApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getWarehouseZones: builder.query({
      query: () => '/warehouse/zones',
      providesTags: ['Warehouse'],
    }),
    createWarehouseZone: builder.mutation({
      query: (data) => ({
        url: '/warehouse/zones',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Warehouse'],
    }),
    updateWarehouseZone: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/warehouse/zones/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Warehouse'],
    }),
    deleteWarehouseZone: builder.mutation({
      query: (id) => ({
        url: `/warehouse/zones/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Warehouse'],
    }),
    getWarehouseLocations: builder.query({
      query: (params) => ({
        url: '/warehouse/locations',
        params,
      }),
      providesTags: ['Warehouse'],
    }),
    createWarehouseLocation: builder.mutation({
      query: (data) => ({
        url: '/warehouse/locations',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Warehouse'],
    }),
    updateWarehouseLocation: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/warehouse/locations/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Warehouse'],
    }),
    deleteWarehouseLocation: builder.mutation({
      query: (id) => ({
        url: `/warehouse/locations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Warehouse'],
    }),
    getInventory: builder.query({
      query: (params) => ({
        url: '/warehouse/inventory',
        params,
      }),
      providesTags: ['Inventory'],
    }),
    createInventoryMovement: builder.mutation({
      query: (data) => ({
        url: '/warehouse/movements',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Inventory'],
    }),
    getStockSummary: builder.query({
      query: () => '/warehouse/stock-summary',
      providesTags: ['Inventory'],
    }),
  }),
})

// Sales API
export const salesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query({
      query: (params) => ({
        url: '/sales/customers',
        params,
      }),
      providesTags: ['Customers'],
    }),
    getCustomer: builder.query({
      query: (id) => `/sales/customers/${id}`,
      providesTags: ['Customers'],
    }),
    createCustomer: builder.mutation({
      query: (data) => ({
        url: '/sales/customers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Customers'],
    }),
    updateCustomer: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/sales/customers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Customers'],
    }),
    deleteCustomer: builder.mutation({
      query: (id) => ({
        url: `/sales/customers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Customers'],
    }),
    getSalesOrders: builder.query({
      query: (params) => ({
        url: '/sales/orders',
        params,
      }),
      providesTags: ['SalesOrders'],
    }),
    getSalesOrder: builder.query({
      query: (id) => `/sales/orders/${id}`,
      providesTags: ['SalesOrders'],
    }),
    createSalesOrder: builder.mutation({
      query: (data) => ({
        url: '/sales/orders',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['SalesOrders'],
    }),
    confirmSalesOrder: builder.mutation({
      query: (id) => ({
        url: `/sales/orders/${id}/confirm`,
        method: 'PUT',
      }),
      invalidatesTags: ['SalesOrders'],
    }),
  }),
})

// Production API
export const productionApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMachines: builder.query({
      query: () => '/production/machines',
      providesTags: ['Machines'],
    }),
    getWorkOrders: builder.query({
      query: (params) => ({
        url: '/production/work-orders',
        params,
      }),
      providesTags: ['WorkOrders'],
    }),
    createWorkOrder: builder.mutation({
      query: (data) => ({
        url: '/production/work-orders',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['WorkOrders'],
    }),
    startWorkOrder: builder.mutation({
      query: (id) => ({
        url: `/production/work-orders/${id}/start`,
        method: 'PUT',
      }),
      invalidatesTags: ['WorkOrders'],
    }),
    completeWorkOrder: builder.mutation({
      query: (id) => ({
        url: `/production/work-orders/${id}/complete`,
        method: 'PUT',
      }),
      invalidatesTags: ['WorkOrders'],
    }),
    getWorkOrderById: builder.query({
      query: (id) => `/production/work-orders/${id}`,
      transformResponse: (response: any) => response.work_order,
      providesTags: (result, error, id) => [{ type: 'WorkOrders', id }],
    }),
  }),
})

// Dashboard API
export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardOverview: builder.query({
      query: () => '/dashboard/overview',
      providesTags: ['Dashboard'],
    }),
    getExecutiveDashboard: builder.query({
      query: () => '/dashboard/executive',
      providesTags: ['Dashboard', 'OEE', 'Production', 'Sales', 'Inventory', 'Quality', 'HR', 'Maintenance'],
    }),
    getSalesChart: builder.query({
      query: (days = 30) => `/dashboard/charts/sales?days=${days}`,
      providesTags: ['Dashboard'],
    }),
    getProductionChart: builder.query({
      query: (days = 30) => `/dashboard/charts/production?days=${days}`,
    }),
  }),
})

// MRP Forecasts API
export const mrpForecastsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMRPForecasts: builder.query({
      query: (params) => ({
        url: '/mrp/forecasts',
        params,
      }),
      providesTags: ['MRP'],
    }),
  }),
})

export const {
  useGetMRPMaterialsQuery,
  useGetMRPBOMsQuery,
  useGetMRPRequirementsQuery,
  useCreateMRPPlanMutation,
} = mrpApi

export const {
  useGetMRPForecastsQuery,
} = mrpForecastsApi

// MRP Simulation API
export const mrpSimulationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    runMRPSimulation: builder.mutation({
      query: (data) => ({
        url: '/mrp/simulation/scenarios',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['MRP'],
    }),
    getSimulationTemplates: builder.query({
      query: () => '/mrp/simulation/templates',
      providesTags: ['MRP'],
    }),
  }),
})

export const {
  useRunMRPSimulationMutation,
  useGetSimulationTemplatesQuery,
} = mrpSimulationApi

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetProductCategoriesQuery,
} = productsApi

export const {
  useGetWarehouseZonesQuery,
  useCreateWarehouseZoneMutation,
  useUpdateWarehouseZoneMutation,
  useDeleteWarehouseZoneMutation,
  useGetWarehouseLocationsQuery,
  useCreateWarehouseLocationMutation,
  useUpdateWarehouseLocationMutation,
  useDeleteWarehouseLocationMutation,
  useGetInventoryQuery,
  useCreateInventoryMovementMutation,
  useGetStockSummaryQuery,
} = warehouseApi

export const {
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetSalesOrdersQuery,
  useGetSalesOrderQuery,
  useCreateSalesOrderMutation,
  useConfirmSalesOrderMutation,
} = salesApi

export const {
  useGetMachinesQuery,
  useGetWorkOrdersQuery,
  useGetWorkOrderByIdQuery,
  useCreateWorkOrderMutation,
  useStartWorkOrderMutation,
  useCompleteWorkOrderMutation,
} = productionApi

// Purchasing API
export const purchasingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Supplier Management
    getSuppliers: builder.query({
      query: (params) => ({
        url: '/purchasing/suppliers',
        params,
      }),
      providesTags: ['Suppliers'],
    }),
    getSupplier: builder.query({
      query: (id) => `/purchasing/suppliers/${id}`,
      providesTags: ['Suppliers'],
    }),
    createSupplier: builder.mutation({
      query: (data) => ({
        url: '/purchasing/suppliers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Suppliers'],
    }),
    updateSupplier: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/purchasing/suppliers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Suppliers'],
    }),
    deleteSupplier: builder.mutation({
      query: (id) => ({
        url: `/purchasing/suppliers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Suppliers'],
    }),
    
    // Purchase Orders
    getPurchaseOrders: builder.query({
      query: (params) => ({
        url: '/purchasing/purchase-orders',
        params,
      }),
      providesTags: ['PurchaseOrders'],
    }),
    getPurchaseOrder: builder.query({
      query: (id) => `/purchasing/purchase-orders/${id}`,
      providesTags: ['PurchaseOrders'],
    }),
    createPurchaseOrder: builder.mutation({
      query: (data) => ({
        url: '/purchasing/purchase-orders',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PurchaseOrders'],
    }),
    updatePurchaseOrder: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/purchasing/purchase-orders/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['PurchaseOrders'],
    }),
    deletePurchaseOrder: builder.mutation({
      query: (id) => ({
        url: `/purchasing/purchase-orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PurchaseOrders'],
    }),
    
    // Approval Workflow
    getPOApprovals: builder.query({
      query: (poId) => `/purchasing/purchase-orders/${poId}/approvals`,
      providesTags: ['Approvals'],
    }),
    approvePurchaseOrder: builder.mutation({
      query: ({ poId, ...data }) => ({
        url: `/purchasing/purchase-orders/${poId}/approve`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PurchaseOrders', 'Approvals'],
    }),
    submitForApproval: builder.mutation({
      query: ({ poId, ...data }) => ({
        url: `/purchasing/purchase-orders/${poId}/submit-approval`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PurchaseOrders', 'Approvals'],
    }),
    
    // RFQ Management
    getRFQs: builder.query({
      query: (params) => ({
        url: '/purchasing/rfqs',
        params,
      }),
      providesTags: ['RFQs'],
    }),
    getRFQ: builder.query({
      query: (id) => `/purchasing/rfqs/${id}`,
      providesTags: ['RFQs'],
    }),
    createRFQ: builder.mutation({
      query: (data) => ({
        url: '/purchasing/rfqs',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['RFQs'],
    }),
    
    // Supplier Quotes
    getQuotes: builder.query({
      query: (params) => ({
        url: '/purchasing/quotes',
        params,
      }),
      providesTags: ['Quotes'],
    }),
    createQuote: builder.mutation({
      query: (data) => ({
        url: '/purchasing/quotes',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Quotes'],
    }),
    
    // Price Comparison
    comparePrices: builder.mutation({
      query: (data) => ({
        url: '/purchasing/price-comparison',
        method: 'POST',
        body: data,
      }),
    }),
    
    // Contract Management
    getContracts: builder.query({
      query: (params) => ({
        url: '/purchasing/contracts',
        params,
      }),
      providesTags: ['Contracts'],
    }),
    getContract: builder.query({
      query: (id) => `/purchasing/contracts/${id}`,
      providesTags: ['Contracts'],
    }),
    createContract: builder.mutation({
      query: (data) => ({
        url: '/purchasing/contracts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Contracts'],
    }),
    activateContract: builder.mutation({
      query: (id) => ({
        url: `/purchasing/contracts/${id}/activate`,
        method: 'POST',
      }),
      invalidatesTags: ['Contracts'],
    }),
  }),
})

export const {
  // Supplier Management
  useGetSuppliersQuery,
  useGetSupplierQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  
  // Purchase Orders
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
  
  // Approval Workflow
  useGetPOApprovalsQuery,
  useApprovePurchaseOrderMutation,
  useSubmitForApprovalMutation,
  
  // RFQ Management
  useGetRFQsQuery,
  useGetRFQQuery,
  useCreateRFQMutation,
  
  // Supplier Quotes
  useGetQuotesQuery,
  useCreateQuoteMutation,
  
  // Price Comparison
  useComparePricesMutation,
  
  // Contract Management
  useGetContractsQuery,
  useGetContractQuery,
  useCreateContractMutation,
  useActivateContractMutation,
} = purchasingApi

// Shipping API moved to separate file: services/shippingApi.ts

// Quality API
export const qualityApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getQualityTests: builder.query({
      query: () => '/quality/tests',
      providesTags: ['Quality'],
    }),
    createQualityTest: builder.mutation({
      query: (data) => ({
        url: '/quality/tests',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Quality'],
    }),
    updateQualityTest: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/quality/tests/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Quality'],
    }),
  }),
})

// Finance API
export const financeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query({
      query: (params) => ({
        url: '/finance/invoices',
        params,
      }),
      providesTags: ['Finance'],
    }),
    getInvoice: builder.query({
      query: (id) => `/finance/invoices/${id}`,
      providesTags: ['Finance'],
    }),
    createInvoice: builder.mutation({
      query: (data) => ({
        url: '/finance/invoices',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Finance'],
    }),
    updateInvoice: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/finance/invoices/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Finance'],
    }),
  }),
})

export const {
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
} = financeApi

// HR API
export const hrApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query({
      query: (params) => ({
        url: '/hr/employees',
        params,
      }),
      providesTags: ['Employees'],
    }),
    createEmployee: builder.mutation({
      query: (data) => ({
        url: '/hr/employees',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Employees'],
    }),
    updateEmployee: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/hr/employees/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Employees'],
    }),
    deleteEmployee: builder.mutation({
      query: (id) => ({
        url: `/hr/employees/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Employees'],
    }),
    getDepartments: builder.query({
      query: () => '/hr/departments',
      providesTags: ['Departments'],
    }),
    getPositions: builder.query({
      query: () => '/hr/positions',
      providesTags: ['Positions'],
    }),
    createDepartment: builder.mutation({
      query: (data) => ({
        url: '/hr/departments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Departments'],
    }),
    getShifts: builder.query({
      query: () => '/hr/shifts',
      providesTags: ['Shifts'],
    }),
    createShift: builder.mutation({
      query: (data) => ({
        url: '/hr/shifts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Shifts'],
    }),
    getRoster: builder.query({
      query: (params) => ({
        url: '/hr/roster',
        params,
      }),
      providesTags: ['Roster', 'Employees'],
    }),
    updateRoster: builder.mutation({
      query: (data) => ({
        url: '/hr/roster',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Roster', 'Employees'],
    }),
    assignRoster: builder.mutation({
      query: (data) => ({
        url: '/hr/roster/assign',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Roster', 'Employees'],
    }),
    unassignRoster: builder.mutation({
      query: (data) => ({
        url: '/hr/roster/unassign',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Roster', 'Employees'],
    }),
    getWeeklyRoster: builder.query({
      query: (params) => ({
        url: '/hr/roster/weekly',
        params,
      }),
      providesTags: ['Roster'],
    }),
    copyWeeklyRoster: builder.mutation({
      query: (data) => ({
        url: '/hr/roster/copy-week',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Roster'],
    }),
    recordAttendance: builder.mutation({
      query: (data) => ({
        url: '/hr/attendance',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Employees'],
    }),
    // Extended HR APIs
    getEmployeeDetail: builder.query({
      query: (id) => `/hr/employees/${id}`,
      providesTags: ['Employees'],
    }),
    // Attendance Management
    getAttendanceRecords: builder.query({
      query: (params) => ({
        url: '/hr/attendance',
        params,
      }),
      providesTags: ['Attendance'],
    }),
    clockIn: builder.mutation({
      query: (data) => ({
        url: '/hr/attendance/clock-in',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Attendance'],
    }),
    clockOut: builder.mutation({
      query: (data) => ({
        url: '/hr/attendance/clock-out',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Attendance'],
    }),
    bulkMarkAttendance: builder.mutation({
      query: (data) => ({
        url: '/hr/attendance/bulk-mark',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Attendance'],
    }),
    // Leave Management
    getLeaves: builder.query({
      query: (params) => ({
        url: '/hr/leaves',
        params,
      }),
      providesTags: ['Leaves'],
    }),
    createLeaveRequest: builder.mutation({
      query: (data) => ({
        url: '/hr/leaves',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Leaves'],
    }),
    approveLeave: builder.mutation({
      query: (leaveId) => ({
        url: `/hr/leaves/${leaveId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['Leaves'],
    }),
    rejectLeave: builder.mutation({
      query: ({ leaveId, ...data }) => ({
        url: `/hr/leaves/${leaveId}/reject`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Leaves'],
    }),
    // Payroll Management
    getPayrollPeriods: builder.query({
      query: (params) => ({
        url: '/hr/payroll/periods',
        params,
      }),
      providesTags: ['Payroll'],
    }),
    createPayrollPeriod: builder.mutation({
      query: (data) => ({
        url: '/hr/payroll/periods',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payroll'],
    }),
    calculatePayroll: builder.mutation({
      query: (periodId) => ({
        url: `/hr/payroll/periods/${periodId}/calculate`,
        method: 'POST',
      }),
      invalidatesTags: ['Payroll'],
    }),
    getPayrollRecords: builder.query({
      query: (params) => ({
        url: '/hr/payroll/records',
        params,
      }),
      providesTags: ['Payroll'],
    }),
    // Appraisal Management
    getAppraisalCycles: builder.query({
      query: (params) => ({
        url: '/hr/appraisal/cycles',
        params,
      }),
      providesTags: ['Appraisal'],
    }),
    createAppraisalCycle: builder.mutation({
      query: (data) => ({
        url: '/hr/appraisal/cycles',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Appraisal'],
    }),
    activateAppraisalCycle: builder.mutation({
      query: ({ cycleId, ...data }) => ({
        url: `/hr/appraisal/cycles/${cycleId}/activate`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Appraisal'],
    }),
    getAppraisalTemplates: builder.query({
      query: () => '/hr/appraisal/templates',
      providesTags: ['Appraisal'],
    }),
    createAppraisalTemplate: builder.mutation({
      query: (data) => ({
        url: '/hr/appraisal/templates',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Appraisal'],
    }),
    getEmployeeAppraisals: builder.query({
      query: (params) => ({
        url: '/hr/appraisal/appraisals',
        params,
      }),
      providesTags: ['Appraisal'],
    }),
    getAppraisalDetail: builder.query({
      query: (id) => `/hr/appraisal/appraisals/${id}`,
      providesTags: ['Appraisal'],
    }),
    submitSelfReview: builder.mutation({
      query: ({ appraisalId, ...data }) => ({
        url: `/hr/appraisal/appraisals/${appraisalId}/self-review`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Appraisal'],
    }),
    submitManagerReview: builder.mutation({
      query: ({ appraisalId, ...data }) => ({
        url: `/hr/appraisal/appraisals/${appraisalId}/manager-review`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Appraisal'],
    }),
    // Training Management
    getTrainingCategories: builder.query({
      query: () => '/hr/training/categories',
      providesTags: ['Training'],
    }),
    createTrainingCategory: builder.mutation({
      query: (data) => ({
        url: '/hr/training/categories',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Training'],
    }),
    getTrainingPrograms: builder.query({
      query: (params) => ({
        url: '/hr/training/programs',
        params,
      }),
      providesTags: ['Training'],
    }),
    createTrainingProgram: builder.mutation({
      query: (data) => ({
        url: '/hr/training/programs',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Training'],
    }),
    getTrainingProgram: builder.query({
      query: (id) => `/hr/training/programs/${id}`,
      providesTags: ['Training'],
    }),
    getTrainingSessions: builder.query({
      query: (params) => ({
        url: '/hr/training/sessions',
        params,
      }),
      providesTags: ['Training'],
    }),
    createTrainingSession: builder.mutation({
      query: (data) => ({
        url: '/hr/training/sessions',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Training'],
    }),
    getTrainingSession: builder.query({
      query: (id) => `/hr/training/sessions/${id}`,
      providesTags: ['Training'],
    }),
    enrollEmployees: builder.mutation({
      query: ({ sessionId, ...data }) => ({
        url: `/hr/training/sessions/${sessionId}/enroll`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Training'],
    }),
    getTrainingRequests: builder.query({
      query: (params) => ({
        url: '/hr/training/requests',
        params,
      }),
      providesTags: ['Training'],
    }),
    createTrainingRequest: builder.mutation({
      query: (data) => ({
        url: '/hr/training/requests',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Training'],
    }),
    approveTrainingRequest: builder.mutation({
      query: (requestId) => ({
        url: `/hr/training/requests/${requestId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['Training'],
    }),
    rejectTrainingRequest: builder.mutation({
      query: ({ requestId, ...data }) => ({
        url: `/hr/training/requests/${requestId}/reject`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Training'],
    }),
  }),
})

export const {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useGetDepartmentsQuery,
  useGetPositionsQuery,
  useCreateDepartmentMutation,
  useGetShiftsQuery,
  useCreateShiftMutation,
  // Roster Management
  useGetRosterQuery,
  useUpdateRosterMutation,
  useAssignRosterMutation,
  useUnassignRosterMutation,
  useGetWeeklyRosterQuery,
  useCopyWeeklyRosterMutation,
  useCreateAttendanceMutation: useRecordAttendanceMutation,
  // Extended HR hooks
  useGetEmployeeDetailQuery,
  // Attendance Management
  useGetAttendanceRecordsQuery,
  useClockInMutation,
  useClockOutMutation,
  useBulkMarkAttendanceMutation,
  // Leave Management
  useGetLeavesQuery,
  useCreateLeaveRequestMutation,
  useApproveLeaveMutation,
  useRejectLeaveMutation,
  // Payroll Management
  useGetPayrollPeriodsQuery,
  useCreatePayrollPeriodMutation,
  useCalculatePayrollMutation,
  useGetPayrollRecordsQuery,
  // Appraisal Management
  useGetAppraisalCyclesQuery,
  useCreateAppraisalCycleMutation,
  useActivateAppraisalCycleMutation,
  useGetAppraisalTemplatesQuery,
  useCreateAppraisalTemplateMutation,
  useGetEmployeeAppraisalsQuery,
  useGetAppraisalDetailQuery,
  useSubmitSelfReviewMutation,
  useSubmitManagerReviewMutation,
  // Training Management
  useGetTrainingCategoriesQuery,
  useCreateTrainingCategoryMutation,
  useGetTrainingProgramsQuery,
  useCreateTrainingProgramMutation,
  useGetTrainingProgramQuery,
  useGetTrainingSessionsQuery,
  useCreateTrainingSessionMutation,
  useGetTrainingSessionQuery,
  useEnrollEmployeesMutation,
  useGetTrainingRequestsQuery,
  useCreateTrainingRequestMutation,
  useApproveTrainingRequestMutation,
  useRejectTrainingRequestMutation,
} = hrApi

// Export alias for backward compatibility
export const useCreateAttendanceMutation = useRecordAttendanceMutation

// Maintenance API
export const maintenanceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMaintenanceRecords: builder.query({
      query: () => '/maintenance/records',
      providesTags: ['Maintenance'],
    }),
    createMaintenance: builder.mutation({
      query: (data) => ({
        url: '/maintenance/maintenance',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Maintenance'],
    }),
    updateMaintenance: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/maintenance/records/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Maintenance'],
    }),
  }),
})

export const {
  useGetMaintenanceRecordsQuery,
  useCreateMaintenanceMutation,
  useUpdateMaintenanceMutation,
} = maintenanceApi

// R&D API - Legacy endpoints (moved to comprehensive R&D API below)

// Waste API
export const wasteApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getWasteRecords: builder.query({
      query: () => '/waste/records',
      providesTags: ['Waste'],
    }),
    getWasteRecord: builder.query({
      query: (id) => `/waste/records/${id}`,
      providesTags: ['Waste'],
    }),
    createWasteRecord: builder.mutation({
      query: (data) => ({
        url: '/waste/records',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Waste'],
    }),
    updateWasteRecord: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/waste/records/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Waste'],
    }),
    deleteWasteRecord: builder.mutation({
      query: (id) => ({
        url: `/waste/records/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Waste'],
    }),
  }),
})

// Settings API
export const settingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSystemSettings: builder.query<any, void>({
      query: () => ({
        url: '/settings/system',
        method: 'GET',
      }),
      providesTags: ['Settings'],
    }),
    updateSystemSettings: builder.mutation({
      query: (data) => ({
        url: '/settings/system',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Settings'],
    }),
    getCompanyProfile: builder.query<any, void>({
      query: () => ({
        url: '/settings/company',
        method: 'GET',
      }),
      providesTags: ['Settings'],
    }),
    updateCompanyProfile: builder.mutation({
      query: (data) => ({
        url: '/settings/company',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Settings'],
    }),
    getUsers: builder.query<any, void>({
      query: () => ({
        url: '/settings/users',
        method: 'GET',
      }),
      providesTags: ['UsersIcon'],
    }),
    createUser: builder.mutation({
      query: (data) => ({
        url: '/settings/users',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['UsersIcon'],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/settings/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['UsersIcon'],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/settings/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['UsersIcon'],
    }),
    createBackup: builder.mutation({
      query: () => ({
        url: '/settings/backup/create',
        method: 'POST',
      }),
    }),
    exportData: builder.mutation({
      query: (data) => ({
        url: '/settings/export/data',
        method: 'POST',
        body: data,
      }),
    }),
    updateSessionTimeout: builder.mutation({
      query: (data) => ({
        url: '/settings/security/session-timeout',
        method: 'PUT',
        body: data,
      }),
    }),
    testNotifications: builder.mutation({
      query: (data) => ({
        url: '/settings/notifications/test',
        method: 'POST',
        body: data,
      }),
    }),
  }),
})

// OEE API
export const oeeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOEERecords: builder.query({
      query: () => '/oee/records',
      providesTags: ['OEE'],
    }),
    getOEEDashboard: builder.query({
      query: (params) => {
        // FunnelIcon out undefined values
        const filteredParams = Object.fromEntries(
          Object.entries(params).filter(([_, value]) => value !== undefined)
        )
        return {
          url: '/oee/dashboard',
          params: filteredParams,
        }
      },
      providesTags: ['OEE', 'Machine', 'Maintenance'],
    }),
    getOEEAlerts: builder.query({
      query: (params) => {
        // FunnelIcon out undefined values
        const filteredParams = Object.fromEntries(
          Object.entries(params).filter(([_, value]) => value !== undefined)
        )
        return {
          url: '/oee/alerts',
          params: filteredParams,
        }
      },
      providesTags: ['OEEAlert'],
    }),
    acknowledgeAlert: builder.mutation({
      query: (alertId) => ({
        url: `/oee/alerts/${alertId}/acknowledge`,
        method: 'PUT',
      }),
      invalidatesTags: ['OEEAlert'],
    }),
    resolveAlert: builder.mutation({
      query: ({ alertId, ...data }) => ({
        url: `/oee/alerts/${alertId}/resolve`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['OEEAlert'],
    }),
    createMaintenanceImpact: builder.mutation({
      query: (data) => ({
        url: '/oee/maintenance-impact',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['OEE', 'Maintenance'],
    }),
    createOEERecord: builder.mutation({
      query: (data) => ({
        url: '/oee/records',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['OEE'],
    }),
    createDowntimeRecord: builder.mutation({
      query: (data) => ({
        url: '/oee/downtime',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['OEE'],
    }),
    getMachineAnalytics: builder.query({
      query: ({ machineId, ...params }) => ({
        url: `/oee/machines/${machineId}/analytics`,
        params,
      }),
      providesTags: ['OEE', 'Machine', 'Maintenance'],
    }),
  }),
})

// Reports API
export const reportsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSalesReport: builder.query({
      query: (params) => ({
        url: '/reports/sales',
        params,
      }),
      providesTags: ['Reports'],
    }),
    getProductionReport: builder.query({
      query: (params) => ({
        url: '/reports/production',
        params,
      }),
      providesTags: ['Reports'],
    }),
    getInventoryReport: builder.query({
      query: (params) => ({
        url: '/reports/inventory',
        params,
      }),
      providesTags: ['Reports'],
    }),
    getWasteReport: builder.query({
      query: (params) => ({
        url: '/reports/waste',
        params,
      }),
      providesTags: ['Reports'],
    }),
    getMaintenanceReport: builder.query({
      query: (params) => ({
        url: '/reports/maintenance',
        params,
      }),
      providesTags: ['Reports'],
    }),
    getQualityReport: builder.query({
      query: (params) => ({
        url: '/reports/quality',
        params,
      }),
      providesTags: ['Reports'],
    }),
    generateReport: builder.mutation({
      query: ({ reportType, ...data }) => ({
        url: `/reports/generate/${reportType}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Reports'],
    }),
    getDashboardSummary: builder.query({
      query: () => '/reports/dashboard-summary',
      providesTags: ['Reports'],
    }),
  }),
})

export const {
  useGetDashboardOverviewQuery,
  useGetExecutiveDashboardQuery,
  useGetSalesChartQuery,
  useGetProductionChartQuery,
} = dashboardApi

// Shipping hooks exported from services/shippingApi.ts

export const {
  useGetQualityTestsQuery,
  useCreateQualityTestMutation,
  useUpdateQualityTestMutation,
} = qualityApi

// Quality Enhanced API
export const qualityEnhancedApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getQualityDashboard: builder.query({
      query: () => '/quality-enhanced/dashboard',
      providesTags: ['Quality', 'QualityEnhanced'],
    }),
    getQualityAlerts: builder.query({
      query: (params) => ({
        url: '/quality-enhanced/alerts',
        params,
      }),
      providesTags: ['QualityEnhanced', 'QualityAlerts'],
    }),
    acknowledgeQualityAlert: builder.mutation({
      query: (alertId) => ({
        url: `/quality-enhanced/alerts/${alertId}/acknowledge`,
        method: 'PUT',
      }),
      invalidatesTags: ['QualityAlerts', 'QualityEnhanced'],
    }),
    resolveQualityAlert: builder.mutation({
      query: ({ alertId, ...data }) => ({
        url: `/quality-enhanced/alerts/${alertId}/resolve`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['QualityAlerts', 'QualityEnhanced'],
    }),
    getQualityAnalytics: builder.query({
      query: (params) => ({
        url: '/quality-enhanced/analytics',
        params,
      }),
      providesTags: ['QualityEnhanced', 'QualityAnalytics'],
    }),
    getQualityTargets: builder.query({
      query: (params) => ({
        url: '/quality-enhanced/targets',
        params,
      }),
      providesTags: ['QualityEnhanced', 'QualityTargets'],
    }),
    createQualityTarget: builder.mutation({
      query: (data) => ({
        url: '/quality-enhanced/targets',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['QualityTargets', 'QualityEnhanced'],
    }),
    getQualityAudits: builder.query({
      query: (params) => ({
        url: '/quality-enhanced/audits',
        params,
      }),
      providesTags: ['QualityEnhanced', 'QualityAudits'],
    }),
    getQualityCompetency: builder.query({
      query: (params) => ({
        url: '/quality-enhanced/training/competency',
        params,
      }),
      providesTags: ['QualityEnhanced', 'QualityTraining'],
    }),
  }),
})

export const {
  useGetQualityDashboardQuery,
  useGetQualityAlertsQuery,
  useAcknowledgeQualityAlertMutation,
  useResolveQualityAlertMutation,
  useGetQualityAnalyticsQuery,
  useGetQualityTargetsQuery,
  useCreateQualityTargetMutation,
  useGetQualityAuditsQuery,
  useGetQualityCompetencyQuery,
} = qualityEnhancedApi

// Sales Forecasts API
export const salesForecastsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSalesForecasts: builder.query({
      query: (params) => ({
        url: '/sales/forecasts',
        params,
      }),
      providesTags: ['Sales'],
    }),
    getSalesForecast: builder.query({
      query: (id) => `/sales/forecasts/${id}`,
      providesTags: ['Sales'],
    }),
    createSalesForecast: builder.mutation({
      query: (data) => ({
        url: '/sales/forecasts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Sales'],
    }),
    updateSalesForecast: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/sales/forecasts/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Sales'],
    }),
    deleteSalesForecast: builder.mutation({
      query: (id) => ({
        url: `/sales/forecasts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Sales'],
    }),
  }),
})

export const {
  useGetSalesForecastsQuery,
  useGetSalesForecastQuery,
  useCreateSalesForecastMutation,
  useUpdateSalesForecastMutation,
  useDeleteSalesForecastMutation,
} = salesForecastsApi

export const {
  useGetWasteRecordsQuery,
  useGetWasteRecordQuery,
  useCreateWasteRecordMutation,
  useUpdateWasteRecordMutation,
  useDeleteWasteRecordMutation,
} = wasteApi

export const {
  useGetSystemSettingsQuery,
  useUpdateSystemSettingsMutation,
  useGetCompanyProfileQuery,
  useUpdateCompanyProfileMutation,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useCreateBackupMutation,
  useExportDataMutation,
  useUpdateSessionTimeoutMutation,
  useTestNotificationsMutation,
} = settingsApi

export const {
  useGetOEERecordsQuery,
  useGetOEEDashboardQuery,
  useGetOEEAlertsQuery,
  useAcknowledgeAlertMutation,
  useResolveAlertMutation,
  useCreateMaintenanceImpactMutation,
  useCreateOEERecordMutation,
  useCreateDowntimeRecordMutation,
  useGetMachineAnalyticsQuery,
} = oeeApi


// R&D API
export const rdApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Dashboard & Analytics
    getRDDashboard: builder.query({
      query: () => '/rd/dashboard',
      providesTags: ['RD'],
    }),
    getRDAnalytics: builder.query({
      query: () => '/rd/analytics',
      providesTags: ['RD'],
    }),

    // Research Projects
    getProjects: builder.query({
      query: (params) => ({
        url: '/rd/projects',
        params,
      }),
      providesTags: ['Projects'],
    }),
    getProject: builder.query({
      query: (id) => `/rd/projects/${id}`,
      providesTags: ['Projects'],
    }),
    createProject: builder.mutation({
      query: (data) => ({
        url: '/rd/projects',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Projects', 'RD'],
    }),
    updateProject: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/rd/projects/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Projects', 'RD'],
    }),
    deleteProject: builder.mutation({
      query: (id) => ({
        url: `/rd/projects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Projects', 'RD'],
    }),
    updateProjectProgress: builder.mutation({
      query: ({ id, progress_percentage }) => ({
        url: `/rd/projects/${id}/progress`,
        method: 'PUT',
        body: { progress_percentage },
      }),
      invalidatesTags: ['Projects', 'RD'],
    }),
    getProjectsAnalytics: builder.query({
      query: () => '/rd/projects/analytics',
      providesTags: ['Projects'],
    }),
    getTeamMembers: builder.query({
      query: () => '/rd/projects/team-members',
      providesTags: ['Projects'],
    }),

    // Experiments
    getExperiments: builder.query({
      query: (params) => ({
        url: '/rd/experiments',
        params,
      }),
      providesTags: ['Experiments'],
    }),
    getExperiment: builder.query({
      query: (id) => `/rd/experiments/${id}`,
      providesTags: ['Experiments'],
    }),
    createExperiment: builder.mutation({
      query: (data) => ({
        url: '/rd/experiments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Experiments', 'RD'],
    }),
    updateExperiment: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/rd/experiments/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Experiments', 'RD'],
    }),
    deleteExperiment: builder.mutation({
      query: (id) => ({
        url: `/rd/experiments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Experiments', 'RD'],
    }),
    reviewExperiment: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/rd/experiments/${id}/review`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Experiments', 'RD'],
    }),
    getExperimentsAnalytics: builder.query({
      query: (params) => ({
        url: '/rd/experiments/analytics',
        params,
      }),
      providesTags: ['Experiments'],
    }),
    getProjectsForExperiments: builder.query({
      query: () => '/rd/experiments/projects',
      providesTags: ['Projects'],
    }),

    // Product Development
    getProductDevelopments: builder.query({
      query: (params) => ({
        url: '/rd/products',
        params,
      }),
      providesTags: ['ProductDevelopments'],
    }),
    getProductDevelopment: builder.query({
      query: (id) => `/rd/products/${id}`,
      providesTags: ['ProductDevelopments'],
    }),
    createProductDevelopment: builder.mutation({
      query: (data) => ({
        url: '/rd/products',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ProductDevelopments', 'RD'],
    }),
    updateProductDevelopment: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/rd/products/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ProductDevelopments', 'RD'],
    }),
    deleteProductDevelopment: builder.mutation({
      query: (id) => ({
        url: `/rd/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ProductDevelopments', 'RD'],
    }),
    approveProductDevelopment: builder.mutation({
      query: (id) => ({
        url: `/rd/products/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['ProductDevelopments', 'RD'],
    }),
    getProductDevelopmentsAnalytics: builder.query({
      query: (params) => ({
        url: '/rd/products/analytics',
        params,
      }),
      providesTags: ['ProductDevelopments'],
    }),

    // Materials
    getMaterials: builder.query({
      query: (params) => ({
        url: '/rd/materials',
        params,
      }),
      providesTags: ['Materials'],
    }),
    getMaterial: builder.query({
      query: (id) => `/rd/materials/${id}`,
      providesTags: ['Materials'],
    }),
    createMaterialRequest: builder.mutation({
      query: (data) => ({
        url: '/rd/materials',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Materials', 'RD'],
    }),
    updateMaterial: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/rd/materials/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Materials', 'RD'],
    }),
    deleteMaterial: builder.mutation({
      query: (id) => ({
        url: `/rd/materials/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Materials', 'RD'],
    }),
    approveMaterialRequest: builder.mutation({
      query: (id) => ({
        url: `/rd/materials/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['Materials', 'RD'],
    }),
    receiveMaterial: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/rd/materials/${id}/receive`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Materials', 'RD'],
    }),
    useMaterial: builder.mutation({
      query: ({ id, quantity_used }) => ({
        url: `/rd/materials/${id}/use`,
        method: 'POST',
        body: { quantity_used },
      }),
      invalidatesTags: ['Materials', 'RD'],
    }),
    getMaterialsAnalytics: builder.query({
      query: (params) => ({
        url: '/rd/materials/analytics',
        params,
      }),
      providesTags: ['Materials'],
    }),
    // Research Reports
    getReports: builder.query({
      query: (params) => ({
        url: '/rd/reports',
        params,
      }),
      providesTags: ['Reports'],
    }),
    getReport: builder.query({
      query: (id) => `/rd/reports/${id}`,
      providesTags: ['Reports'],
    }),
    createReport: builder.mutation({
      query: (data) => ({
        url: '/rd/reports',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Reports', 'RD'],
    }),
    updateReport: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/rd/reports/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Reports', 'RD'],
    }),
    deleteReport: builder.mutation({
      query: (id) => ({
        url: `/rd/reports/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Reports', 'RD'],
    }),
    submitReport: builder.mutation({
      query: (id) => ({
        url: `/rd/reports/${id}/submit`,
        method: 'POST',
      }),
      invalidatesTags: ['Reports', 'RD'],
    }),
    reviewReport: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/rd/reports/${id}/review`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Reports', 'RD'],
    }),
    approveReport: builder.mutation({
      query: (id) => ({
        url: `/rd/reports/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['Reports', 'RD'],
    }),
    getReportsAnalytics: builder.query({
      query: (params) => ({
        url: '/rd/reports/analytics',
        params,
      }),
      providesTags: ['Reports'],
    }),
    getProjectsForReports: builder.query({
      query: () => '/rd/reports/projects',
      providesTags: ['Projects'],
    }),
  }),
})

export const {
  // Dashboard & Analytics
  useGetRDDashboardQuery,
  useGetRDAnalyticsQuery,
  
  // Research Projects
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useUpdateProjectProgressMutation,
  useGetProjectsAnalyticsQuery,
  useGetTeamMembersQuery,
  
  // Experiments
  useGetExperimentsQuery,
  useGetExperimentQuery,
  useCreateExperimentMutation,
  useUpdateExperimentMutation,
  useDeleteExperimentMutation,
  useReviewExperimentMutation,
  useGetExperimentsAnalyticsQuery,
  useGetProjectsForExperimentsQuery,
  
  // Product Development
  useGetProductDevelopmentsQuery,
  useGetProductDevelopmentQuery,
  useCreateProductDevelopmentMutation,
  useUpdateProductDevelopmentMutation,
  useDeleteProductDevelopmentMutation,
  useApproveProductDevelopmentMutation,
  useGetProductDevelopmentsAnalyticsQuery,
  
  // Materials
  useGetMaterialsQuery,
  useGetMaterialQuery,
  useCreateMaterialRequestMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialMutation,
  useApproveMaterialRequestMutation,
  useReceiveMaterialMutation,
  useUseMaterialMutation,
  useGetMaterialsAnalyticsQuery,
  
  // Research Reports
  useGetReportsQuery,
  useGetReportQuery,
  useCreateReportMutation,
  useUpdateReportMutation,
  useDeleteReportMutation,
  useSubmitReportMutation,
  useReviewReportMutation,
  useApproveReportMutation,
  useGetReportsAnalyticsQuery,
  useGetProjectsForReportsQuery,
} = rdApi

// Warehouse Enhanced API
export const warehouseEnhancedApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getWarehouseDashboard: builder.query({
      query: () => '/warehouse/dashboard',
      providesTags: ['WarehouseEnhanced'],
    }),
    getWarehouseAnalytics: builder.query({
      query: (params) => ({
        url: '/warehouse-enhanced/analytics',
        params,
      }),
      providesTags: ['WarehouseEnhanced'],
    }),
    getABCAnalysis: builder.query({
      query: (params) => ({
        url: '/warehouse-enhanced/abc-analysis',
        params,
      }),
      providesTags: ['WarehouseEnhanced'],
    }),
    getReorderPoints: builder.query({
      query: (params) => ({
        url: '/warehouse-enhanced/reorder-points',
        params,
      }),
      providesTags: ['WarehouseEnhanced'],
    }),
    getWarehouseAlerts: builder.query({
      query: (params) => ({
        url: '/warehouse-enhanced/alerts',
        params,
      }),
      providesTags: ['WarehouseAlerts'],
    }),
    acknowledgeWarehouseAlert: builder.mutation({
      query: (alertId) => ({
        url: `/warehouse-enhanced/alerts/${alertId}/acknowledge`,
        method: 'POST',
      }),
      invalidatesTags: ['WarehouseAlerts'],
    }),
    resolveWarehouseAlert: builder.mutation({
      query: ({ alertId, ...data }) => ({
        url: `/warehouse-enhanced/alerts/${alertId}/resolve`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['WarehouseAlerts'],
    }),
    getOptimizationResults: builder.query({
      query: (params) => ({
        url: '/warehouse-enhanced/optimization',
        params,
      }),
      providesTags: ['WarehouseEnhanced'],
    }),
    getDemandForecast: builder.query({
      query: (params) => ({
        url: '/warehouse-enhanced/forecast',
        params,
      }),
      providesTags: ['WarehouseEnhanced'],
    }),
    getEnhancedStockSummary: builder.query({
      query: () => '/warehouse-enhanced/stock-summary',
      providesTags: ['WarehouseEnhanced'],
    }),
  }),
})

export const {
  useGetWarehouseDashboardQuery,
  useGetWarehouseAnalyticsQuery,
  useGetABCAnalysisQuery,
  useGetReorderPointsQuery,
  useGetWarehouseAlertsQuery,
  useAcknowledgeWarehouseAlertMutation,
  useResolveWarehouseAlertMutation,
  useGetOptimizationResultsQuery,
  useGetDemandForecastQuery,
  useGetEnhancedStockSummaryQuery,
} = warehouseEnhancedApi

export const {
  useGetSalesReportQuery,
  useGetProductionReportQuery,
  useGetInventoryReportQuery,
  useGetWasteReportQuery,
  useGetMaintenanceReportQuery,
  useGetQualityReportQuery,
  useGenerateReportMutation,
  useGetDashboardSummaryQuery,
} = reportsApi
