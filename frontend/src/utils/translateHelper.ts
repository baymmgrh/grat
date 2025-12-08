
const { t } = useLanguage();
/**
 * Translation Helper Utility
 * Helper functions for consistent translation implementation across all modules
 */

// Common page title generator
export const getPageTitle = (t: (key: string) => string, moduleKey: string, pageKey: string = 'title') => {
  return t(`${moduleKey}.${pageKey}`)
}

// Common button translations
export const getCommonButtons = (t: (key: string) => string) => ({
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
  loading: t('common.loading'),
  success: t('common.success'),
  error: t('common.error')
})

// Module-specific title generators
export const getModuleTitles = (t: (key: string) => string) => ({
  // Main modules
  dashboard: t('dashboard.title'),
  products: t('products.title'),
  warehouse: t('warehouse.title'),
  production: t('production.title'),
  sales: t('sales.title'),
  purchasing: t('purchasing.title'),
  finance: t('finance.title'),
  quality: t('quality.title'),
  hr: t('hr.title'),
  mrp: t('mrp.title'),
  analytics: t('analytics.title'),
  shipping: t('shipping.title'),
  maintenance: t('maintenance.title'),
  rd: t('rd.title'),
  waste: t('waste.title'),
  oee: t('oee.title'),
  settings: t('settings.title'),
  reports: t('reports.title')
})

// Status translations
export const getStatusTranslations = (t: (key: string) => string) => ({
  active: t('status.active'),
  inactive: t('status.inactive'),
  pending: t('status.pending'),
  approved: t('status.approved'),
  rejected: t('status.rejected'),
  completed: t('status.completed'),
  cancelled: t('status.cancelled'),
  draft: t('status.draft'),
  published: t('status.published')
})

// Form field translations
export const getFormFieldTranslations = (t: (key: string) => string) => ({
  name: t('fields.name'),
  description: t('fields.description'),
  code: t('fields.code'),
  status: t('fields.status'),
  date: t('fields.date'),
  amount: t('fields.amount'),
  quantity: t('fields.quantity'),
  price: t('fields.price'),
  total: t('fields.total'),
  remarks: t('fields.remarks'),
  createdAt: t('fields.created_at'),
  updatedAt: t('fields.updated_at'),
  createdBy: t('fields.created_by')
})
