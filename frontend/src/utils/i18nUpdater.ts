/**
 * Utility to help update components with i18n translations
 * This provides common patterns and helpers for implementing i18n
 */

import { useLanguage } from '../contexts/LanguageContext';

// Common translation patterns
export const useCommonTranslations = () => {
    const { t } = useLanguage();

    return {
    // Common UI elements
    loading: t('ui.loading'),
    saving: t('ui.saving'),
    processing: t('ui.processing'),
    pleaseWait: t('ui.please_wait'),
    noData: t('ui.no_data'),
    errorOccurred: t('ui.error_occurred'),
    tryAgain: t('ui.try_again'),
    refresh: t('ui.refresh'),
    close: t('ui.close'),
    open: t('ui.open'),
    expand: t('ui.expand'),
    collapse: t('ui.collapse'),
    selectAll: t('ui.select_all'),
    clearAll: t('ui.clear_all'),
    apply: t('ui.apply'),
    reset: t('ui.reset'),
    previous: t('ui.previous'),
    next: t('ui.next'),
    first: t('ui.first'),
    last: t('ui.last'),
    page: t('ui.page'),
    of: t('ui.of'),
    items: t('ui.items'),
    showing: t('ui.showing'),
    to: t('ui.to'),
    total: t('ui.total'),
    
    // Common actions
    save: t('common.save'),
    cancel: t('common.cancel'),
    edit: t('common.edit'),
    delete: t('common.delete'),
    add: t('common.add'),
    create: t('common.create'),
    update: t('common.update'),
    search: t('common.search'),
    filter: t('common.filter'),
    export: t('common.export'),
    import: t('common.import'),
    success: t('common.success'),
    error: t('common.error'),
    confirmation: t('common.confirmation'),
    yes: t('common.yes'),
    no: t('common.no'),
    
    // Form fields
    name: t('fields.name'),
    description: t('fields.description'),
    code: t('fields.code'),
    status: t('fields.status'),
    date: t('fields.date'),
    amount: t('fields.amount'),
    quantity: t('fields.quantity'),
    price: t('fields.price'),
    totalAmount: t('fields.total'),
    remarks: t('fields.remarks'),
    createdAt: t('fields.created_at'),
    updatedAt: t('fields.updated_at'),
    createdBy: t('fields.created_by'),
    
    // Status values
    active: t('status.active'),
    inactive: t('status.inactive'),
    pending: t('status.pending'),
    approved: t('status.approved'),
    rejected: t('status.rejected'),
    completed: t('status.completed'),
    cancelled: t('status.cancelled'),
    draft: t('status.draft'),
    published: t('status.published'),
    
    // Date and time
    today: t('date.today'),
    yesterday: t('date.yesterday'),
    tomorrow: t('date.tomorrow'),
    thisWeek: t('date.this_week'),
    lastWeek: t('date.last_week'),
    nextWeek: t('date.next_week'),
    thisMonth: t('date.this_month'),
    lastMonth: t('date.last_month'),
    nextMonth: t('date.next_month'),
    thisYear: t('date.this_year'),
    lastYear: t('date.last_year'),
    nextYear: t('date.next_year'),
    
    // Success messages
    savedSuccess: t('success.saved'),
    updatedSuccess: t('success.updated'),
    deletedSuccess: t('success.deleted'),
    createdSuccess: t('success.created'),
    importedSuccess: t('success.imported'),
    exportedSuccess: t('success.exported'),
    sentSuccess: t('success.sent'),
    approvedSuccess: t('success.approved'),
    rejectedSuccess: t('success.rejected'),
    
    // Error messages
    saveFailed: t('error.save_failed'),
    updateFailed: t('error.update_failed'),
    deleteFailed: t('error.delete_failed'),
    createFailed: t('error.create_failed'),
    importFailed: t('error.import_failed'),
    exportFailed: t('error.export_failed'),
    networkError: t('error.network_error'),
    serverError: t('error.server_error'),
    unauthorized: t('error.unauthorized'),
    forbidden: t('error.forbidden'),
    notFound: t('error.not_found'),
    
    // Confirmation messages
    confirmDelete: t('confirm.delete'),
    confirmSave: t('confirm.save'),
    confirmCancel: t('confirm.cancel'),
    confirmLogout: t('confirm.logout'),
    confirmDiscardChanges: t('confirm.discard_changes'),
  };
};

// Module-specific translation hooks
export const useProductTranslations = () => {
  const { t } = useLanguage();
  return {
    title: t('products.title'),
    list: t('products.list'),
    add: t('products.add'),
    edit: t('products.edit'),
    addNew: t('products.add_new'),
    productCode: t('products.product_code'),
    productName: t('products.product_name'),
    price: t('products.price'),
    cost: t('products.cost'),
    category: t('products.category'),
    materialType: t('products.material_type'),
    stock: t('products.stock'),
    actions: t('products.actions'),
    categories: t('products.categories'),
    materials: t('products.materials'),
    specifications: t('products.specifications'),
    qualityStandards: t('products.quality_standards'),
    pricing: t('products.pricing'),
    inventoryLevels: t('products.inventory_levels'),
    productLifecycle: t('products.product_lifecycle'),
    bom: t('products.bom'),
    routing: t('products.routing'),
  };
};

export const useWarehouseTranslations = () => {
  const { t } = useLanguage();
  return {
    title: t('warehouse.title'),
    inventory: t('warehouse.inventory'),
    locations: t('warehouse.locations'),
    zones: t('warehouse.zones'),
    stockLevel: t('warehouse.stock_level'),
    dashboard: t('warehouse.dashboard'),
    addLocation: t('warehouse.add_location'),
    addZone: t('warehouse.add_zone'),
    receiving: t('warehouse.receiving'),
    picking: t('warehouse.picking'),
    packing: t('warehouse.packing'),
    shipping: t('warehouse.shipping'),
    cycleCounting: t('warehouse.cycle_counting'),
    adjustments: t('warehouse.adjustments'),
    transfers: t('warehouse.transfers'),
    layout: t('warehouse.layout'),
    optimization: t('warehouse.optimization'),
    kpi: t('warehouse.kpi'),
  };
};

export const useProductionTranslations = () => {
  return {
    title: t('production.title'),
    dashboard: t('production.dashboard'),
    scheduling: t('production.scheduling'),
    workOrders: t('production.work_orders'),
    planning: t('production.planning'),
    capacity: t('production.capacity'),
    efficiency: t('production.efficiency'),
    newWorkOrder: t('production.new_work_order'),
    machines: t('production.machines'),
    operators: t('production.operators'),
    shifts: t('production.shifts'),
    downtime: t('production.downtime'),
    qualityControl: t('production.quality_control'),
    materialConsumption: t('production.material_consumption'),
    wasteTracking: t('production.waste_tracking'),
    performanceAnalysis: t('production.performance_analysis'),
    maintenanceSchedule: t('production.maintenance_schedule'),
    input: t('production.input'),
    output: t('production.output'),
    yield: t('production.yield'),
  };
};

export const useSalesTranslations = () => {
  return {
    title: t('sales.title'),
    activities: t('sales.activities'),
    opportunities: t('sales.opportunities'),
    leads: t('sales.leads'),
    customers: t('sales.customers'),
    newActivity: t('sales.new_activity'),
    newOpportunity: t('sales.new_opportunity'),
    activityList: t('sales.activity_list'),
    opportunityList: t('sales.opportunity_list'),
    subject: t('sales.subject'),
    activityType: t('sales.activity_type'),
    status: t('sales.status'),
    priority: t('sales.priority'),
    assignedTo: t('sales.assigned_to'),
    startDate: t('sales.start_date'),
    endDate: t('sales.end_date'),
    description: t('sales.description'),
    crm: t('sales.crm'),
    pipeline: t('sales.pipeline'),
    forecasting: t('sales.forecasting'),
    quotations: t('sales.quotations'),
    orders: t('sales.orders'),
    invoicing: t('sales.invoicing'),
    payments: t('sales.payments'),
    returns: t('sales.returns'),
    commissions: t('sales.commissions'),
    territories: t('sales.territories'),
    campaigns: t('sales.campaigns'),
  };
};

export const useFinanceTranslations = () => {
  return {
    title: t('finance.title'),
    dashboard: t('finance.dashboard'),
    revenue: t('finance.revenue'),
    expenses: t('finance.expenses'),
    profit: t('finance.profit'),
    cashFlow: t('finance.cash_flow'),
    accounting: t('finance.accounting'),
    budgeting: t('finance.budgeting'),
    costAccounting: t('finance.cost_accounting'),
    financialReporting: t('finance.financial_reporting'),
    accountsReceivable: t('finance.accounts_receivable'),
    accountsPayable: t('finance.accounts_payable'),
    generalLedger: t('finance.general_ledger'),
    journalEntries: t('finance.journal_entries'),
    bankReconciliation: t('finance.bank_reconciliation'),
    taxManagement: t('finance.tax_management'),
    assetManagement: t('finance.asset_management'),
    depreciation: t('finance.depreciation'),
    costCenters: t('finance.cost_centers'),
    profitCenters: t('finance.profit_centers'),
  };
};

export const useHRTranslations = () => {
  return {
    title: t('hr.title'),
    dashboard: t('hr.dashboard'),
    employees: t('hr.employees'),
    attendance: t('hr.attendance'),
    payroll: t('hr.payroll'),
    roster: t('hr.roster'),
    performance: t('hr.performance'),
    training: t('hr.training'),
    recruitment: t('hr.recruitment'),
    leaves: t('hr.leaves'),
    appraisal: t('hr.appraisal'),
    quickActions: t('hr.quick_actions'),
    addEmployee: t('hr.add_employee'),
    markAttendance: t('hr.mark_attendance'),
    approveLeaves: t('hr.approve_leaves'),
    processPayroll: t('hr.process_payroll'),
    totalEmployees: t('hr.total_employees'),
    presentToday: t('hr.present_today'),
    pendingLeaves: t('hr.pending_leaves'),
    activeTrainings: t('hr.active_trainings'),
    employeeManagement: t('hr.employee_management'),
    organizationalChart: t('hr.organizational_chart'),
    jobDescriptions: t('hr.job_descriptions'),
    competencyManagement: t('hr.competency_management'),
    successionPlanning: t('hr.succession_planning'),
    disciplinaryActions: t('hr.disciplinary_actions'),
    exitInterviews: t('hr.exit_interviews'),
    employeeSurveys: t('hr.employee_surveys'),
    benefitsAdministration: t('hr.benefits_administration'),
    timeTracking: t('hr.time_tracking'),
    shiftManagement: t('hr.shift_management'),
    overtimeManagement: t('hr.overtime_management'),
  };
};

// Utility functions for formatting with i18n
export const formatRupiah = (value: number, language: 'id' | 'en' = 'id') => {
  const locale = language === 'id' ? 'id-ID' : 'en-US';
  const currency = language === 'id' ? 'IDR' : 'IDR';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value: number, language: 'id' | 'en' = 'id') => {
  const locale = language === 'id' ? 'id-ID' : 'en-US';
  return new Intl.NumberFormat(locale).format(value);
};

export const formatDate = (date: Date | string, language: 'id' | 'en' = 'id') => {
  const locale = language === 'id' ? 'id-ID' : 'en-US';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(dateObj);
};

export const formatDateTime = (date: Date | string, language: 'id' | 'en' = 'id') => {
  const locale = language === 'id' ? 'id-ID' : 'en-US';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};
