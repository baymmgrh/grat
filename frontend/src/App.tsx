import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from './hooks/redux'
import { checkAuth } from './store/slices/authSlice'
import { useDocumentTitle } from './hooks/useDocumentTitle'
import axiosInstance from './utils/axiosConfig'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { PermissionProvider } from './contexts/PermissionContext'
import { ToastProvider, ErrorBoundary } from './components/ui'
import SessionTimeoutModal from './components/SessionTimeoutModal'
import Layout from './components/Layout/Layout'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'
import ResetPassword from './pages/Auth/ResetPassword'
import OAuthCallback from './pages/Auth/OAuthCallback'
import CompleteProfile from './pages/Auth/CompleteProfile'
import Dashboard from './pages/Dashboard/Dashboard'
import ProductList from './pages/Products/ProductList'
import NonwovenCalculator from './pages/Products/NonwovenCalculator'
import ProductDashboard from './pages/Products/ProductDashboard'
import ProductAnalytics from './pages/Products/ProductAnalytics'
import ProductCategories from './pages/Products/ProductCategories'
import BOMManagement from './pages/Products/BOMManagement'
import ProductLifecycle from './pages/Products/ProductLifecycle'
import ProductsNewPage from './pages/ProductsNewPage'
import ProductFormNew from './components/ProductFormNew'
import ProductVersionHistory from './components/ProductVersionHistory'
import ProductCompare from './components/ProductCompare'
import WarehouseLocations from './pages/Warehouse/WarehouseLocations'
import WarehouseDashboardEnhanced from './pages/Warehouse/WarehouseDashboardEnhanced'
import WarehouseAnalytics from './pages/Warehouse/WarehouseAnalytics'
import ABCAnalysis from './pages/Warehouse/ABCAnalysis'
import ReorderPoints from './pages/Warehouse/ReorderPoints'
import InventoryList from './pages/Warehouse/InventoryList'
import InventoryListEnhanced from './pages/Warehouse/InventoryListEnhanced'
import AddProductToInventory from './pages/Warehouse/AddProductToInventory'
import InventoryForm from './pages/Warehouse/InventoryForm'
import LocationForm from './pages/Warehouse/LocationForm'
import MovementForm from './pages/Warehouse/MovementForm'
import MovementDetail from './pages/Warehouse/MovementDetail'
import AdjustmentForm from './pages/Warehouse/AdjustmentForm'
import TransferForm from './pages/Warehouse/TransferForm'
import LocationList from './pages/Warehouse/LocationList'
import LocationDetail from './pages/Warehouse/LocationDetail'
import MovementList from './pages/Warehouse/MovementList'
import ReorderList from './pages/Warehouse/ReorderList'
import StockInput from './pages/Warehouse/StockInput'
import WarehouseZones from './pages/Warehouse/WarehouseZones'
import MaterialsDashboard from './pages/Warehouse/MaterialsDashboard'
import MaterialsList from './pages/Warehouse/MaterialsList'
import MaterialView from './pages/Warehouse/MaterialView'
import MaterialEdit from './pages/Warehouse/MaterialEdit'
import MaterialCreate from './pages/Warehouse/MaterialCreate'
import MaterialStockManagement from './pages/Warehouse/MaterialStockManagement'
import StockOpnameList from './pages/Warehouse/StockOpnameList'
import StockOpnameForm from './pages/Warehouse/StockOpnameForm'
import StockOpnameDetail from './pages/Warehouse/StockOpnameDetail'
import UoMList from './pages/Warehouse/UoMList'
import StockAlerts from './pages/Warehouse/StockAlerts'
import CustomerList from './pages/Sales/CustomerList'
import CustomerForm from './pages/Sales/CustomerForm'
import CustomerDetails from './pages/Sales/CustomerDetails'
import WorkflowStatus from './pages/Sales/WorkflowStatus'
import SalesOrderList from './pages/Sales/SalesOrderListUpgraded'
import SalesOrderDetails from './pages/Sales/SalesOrderDetails'
import SalesOrderForm from './pages/Sales/SalesOrderForm'
import LeadList from './pages/Sales/LeadListUpgraded'
import LeadForm from './pages/Sales/LeadForm'
import OpportunityList from './pages/Sales/OpportunityListUpgraded'
import OpportunityForm from './pages/Sales/OpportunityForm'
import QuotationList from './pages/Sales/QuotationList'
import QuotationForm from './pages/Sales/QuotationForm'
import ActivityList from './pages/Sales/ActivityList'
import ActivityForm from './pages/Sales/ActivityForm'
import SalesDashboard from './pages/Sales/SalesDashboard'
import SalesForecastList from './pages/Sales/SalesForecastList'
import SalesForecastForm from './pages/Sales/SalesForecastForm'
import SalesInvoiceForm from './pages/Sales/InvoiceForm'
import SupplierList from './pages/Purchasing/SupplierList'
import SupplierForm from './pages/Purchasing/SupplierForm'
import PurchaseOrderList from './pages/Purchasing/PurchaseOrderList'
import PurchaseOrderForm from './pages/Purchasing/PurchaseOrderForm'
import Purchasing from './pages/Purchasing/Purchasing'
import PriceComparison from './pages/Purchasing/PriceComparison'
import ContractList from './pages/Purchasing/ContractList'
import RFQList from './pages/Purchasing/RFQList'
import QuoteList from './pages/Purchasing/QuoteList'
import RFQForm from './pages/Purchasing/RFQForm'
import GRNForm from './pages/Purchasing/GRNForm'
import SupplierQuoteForm from './pages/Purchasing/SupplierQuoteForm'
import MachineList from './pages/Production/MachineList'
import MachineForm from './pages/Production/MachineForm'
import MachineDetail from './pages/Production/MachineDetail'
import WorkOrderList from './pages/Production/WorkOrderList'
import WorkOrderForm from './pages/Production/WorkOrderForm'
import ProductionDashboard from './pages/Production/ProductionDashboard'
import ProductionScheduling from './pages/Production/ProductionScheduling'
import ProductionRecords from './pages/Production/ProductionRecords'
import ProductionRecordForm from './pages/Production/ProductionRecordForm'
import EfficiencyTracking from './pages/Production/EfficiencyTracking'
import Traceability from './pages/Production/Traceability'
import ProductionPlanningList from './pages/Production/ProductionPlanningList'
import ProductionPlanningForm from './pages/Production/ProductionPlanningForm'
import ProductionPlanningDashboard from './pages/Production/ProductionPlanningDashboard'
import MaterialIssueList from './pages/Production/MaterialIssueList'
import MaterialIssueDetail from './pages/Production/MaterialIssueDetail'
import WIPBatchForm from './pages/Production/WIPBatchForm'
import ProductionApprovalList from './pages/Production/ProductionApprovalList'
import ProductionApprovalDetail from './pages/Production/ProductionApprovalDetail'
import ProductChangeover from './pages/Production/ProductChangeover'
import ChangeoverList from './pages/Production/ChangeoverList'
import WeeklyProductionPlan from './pages/Production/WeeklyProductionPlan'
import WeeklyPlanDetail from './pages/Production/WeeklyPlanDetail'
import MonthlyProductionPlan from './pages/Production/MonthlyProductionPlan'
import DailyController from './pages/Production/DailyController'
import WeeklyController from './pages/Production/WeeklyController'
import MonthlyController from './pages/Production/MonthlyController'
import ConvertingDashboard from './pages/Production/ConvertingDashboard'
import ConvertingInput from './pages/Production/ConvertingInput'
import WorkOrderMonitoring from './pages/Production/WorkOrderMonitoring'
import BreakdownSummary from './pages/Production/BreakdownSummary'
import WorkOrderTimeline from './pages/Production/WorkOrderTimeline'
import WorkOrderBreakdown from './pages/Production/WorkOrderBreakdown'
import WorkOrderStatus from './pages/Production/WorkOrderStatus'
import QualityTestList from './pages/Quality/QualityTestList'
import QualityTestForm from './pages/Quality/QualityTestForm'
import QualityDashboardEnhanced from './pages/Quality/QualityDashboardEnhanced'
import QualityAlerts from './pages/Quality/QualityAlerts'
import QualityAnalytics from './pages/Quality/QualityAnalytics'
import QualityAudits from './pages/Quality/QualityAudits'
import PendingQC from './pages/Quality/PendingQC'
import WorkOrderQCForm from './pages/Quality/WorkOrderQCForm'
import QCToWarehouse from './pages/Quality/QCToWarehouse'
import IncomingQC from './pages/Quality/IncomingQC'
import InProcessQC from './pages/Quality/InProcessQC'
import FinishGoodQC from './pages/Quality/FinishGoodQC'
import QCPackingList from './pages/Quality/QCPackingList'
import QualityObjectiveProduction from './pages/Quality/QualityObjectiveProduction'
import DowntimeAnalysis from './pages/Quality/DowntimeAnalysis'
import ShippingDashboard from './pages/Shipping/ShippingDashboard'
import ShippingOrderList from './pages/Shipping/ShippingOrderList'
import ShippingOrderForm from './pages/Shipping/ShippingOrderForm'
import CreateShippingFromQC from './pages/Shipping/CreateShippingFromQC'
import ShippingOrderDetails from './pages/Shipping/ShippingOrderDetails'
import ShippingTrackingForm from './pages/Shipping/ShippingTrackingForm'
import ShippingReportsForm from './pages/Shipping/ShippingReportsForm'
import DeliveryTracking from './pages/Shipping/DeliveryTracking'
import ShippingCalculator from './pages/Shipping/ShippingCalculator'
import LogisticsProviders from './pages/Shipping/LogisticsProviders'
import FinanceDashboard from './pages/Finance/FinanceDashboard'
import AccountingManagement from './pages/Finance/AccountingManagement'
import BudgetPlanning from './pages/Finance/BudgetPlanning'
import CashFlowManagement from './pages/Finance/CashFlowManagement'
import FinancialReports from './pages/Finance/FinancialReports'
import InvoiceList from './pages/Finance/InvoiceList'
import FinanceInvoiceForm from './pages/Finance/InvoiceForm'
import AccountsReceivable from './pages/Finance/AccountsReceivable'
import AccountsPayable from './pages/Finance/AccountsPayable'
import GeneralLedger from './pages/Finance/GeneralLedger'
import ChartOfAccounts from './pages/Finance/ChartOfAccounts'
import CashBankManagement from './pages/Finance/CashBankManagement'
import BudgetForecasting from './pages/Finance/BudgetForecasting'
import FixedAssets from './pages/Finance/FixedAssets'
import TaxManagement from './pages/Finance/TaxManagement'
import CostingControlling from './pages/Finance/CostingControlling'
import Consolidation from './pages/Finance/Consolidation'
import PaymentForm from './pages/Finance/PaymentForm'
import AccountForm from './pages/Finance/AccountForm'
import BudgetForm from './pages/Finance/BudgetForm'
import ExpenseForm from './pages/Finance/ExpenseForm'
import EmployeeList from './pages/HR/EmployeeList'
import EmployeeForm from './pages/HR/EmployeeForm'
import RosterCalendar from './pages/HR/RosterCalendar'
import RosterManagementComplete from './pages/HR/RosterManagementComplete'
import WorkRosterComplete from './pages/HR/WorkRosterComplete'
import WorkRosterWeekly from './pages/HR/WorkRosterWeekly'
import HRDashboard from './pages/HR/HRDashboard'
import PayrollList from './pages/HR/PayrollList'
import PayrollPeriodForm from './pages/HR/PayrollPeriodForm'
import PayrollRecordList from './pages/HR/PayrollRecordList'
import AttendanceManagement from './pages/HR/AttendanceManagement'
import AttendanceAdmin from './pages/HR/AttendanceAdmin'
import FaceAdmin from './pages/HR/FaceAdmin'
import AttendancePage from './pages/HR/AttendancePage'
import AttendanceReport from './pages/HR/AttendanceReport'
import PublicAttendance from './pages/Public/PublicAttendance'
import StaffLeaveRequest from './pages/Public/StaffLeaveRequest'
import FaceRegistration from './pages/Public/FaceRegistration'
import AttendanceCalendar from './pages/HR/AttendanceCalendar'
import AttendanceNotClockedOut from './pages/HR/AttendanceNotClockedOut'
import StaffLeaveManagement from './pages/HR/StaffLeaveManagement'
import LeaveManagement from './pages/HR/LeaveManagement'
import LeaveRequestForm from './pages/HR/LeaveRequestForm'
import AppraisalList from './pages/HR/AppraisalList'
import AppraisalCycleForm from './pages/HR/AppraisalCycleForm'
import TrainingManagement from './pages/HR/TrainingManagement'
import AttendanceForm from './pages/HR/AttendanceForm'
import LeaveForm from './pages/HR/LeaveForm'
import PayrollForm from './pages/HR/PayrollForm'
import OutsourcingVendorList from './pages/HR/OutsourcingVendorList'
import PieceworkLogList from './pages/HR/PieceworkLogList'
import AppraisalForm from './pages/HR/AppraisalForm'
import Departments from './pages/HR/Departments'
import HRReports from './pages/HR/Reports'
import MaintenanceList from './pages/Maintenance/MaintenanceList'
import MaintenanceDashboard from './pages/Maintenance/MaintenanceDashboard'
import MaintenanceWorkOrderForm from './pages/Maintenance/MaintenanceWorkOrderForm'
import MaintenancePartsForm from './pages/Maintenance/MaintenancePartsForm'
import MaintenanceAnalyticsForm from './pages/Maintenance/MaintenanceAnalyticsForm'
import MaintenanceDashboardEnhanced from './pages/Maintenance/MaintenanceDashboardEnhanced'
import MaintenanceSchedule from './pages/Maintenance/MaintenanceSchedule'
import MaintenanceForm from './pages/Maintenance/MaintenanceForm'
import MaintenanceRequestForm from './pages/Maintenance/MaintenanceRequestForm'
import ProjectList from './pages/RD/ProjectList'
import ProjectForm from './pages/RD/ProjectForm'
import ProjectDetails from './pages/RD/ProjectDetails'
import ProjectDetailsForm from './pages/RD/ProjectDetailsForm'
import ResearchReportsForm from './pages/RD/ResearchReportsForm'
import RDDashboard from './pages/RD/RDDashboard'
import ExperimentList from './pages/RD/ExperimentList'
import ExperimentForm from './pages/RD/ExperimentForm'
import MaterialList from './pages/RD/MaterialList'
import MaterialForm from './pages/RD/MaterialForm'
import ProductDevelopmentList from './pages/RD/ProductDevelopmentList'
import ProductDevelopmentForm from './pages/RD/ProductDevelopmentForm'
import { RNDDashboard, RNDProjectList, RNDProjectDetail, RNDProjectForm, RNDApprovals } from './pages/RND'
import WasteRecordList from './pages/Waste/WasteRecordList'
import WasteRecordForm from './pages/Waste/WasteRecordForm'
import ReturnsDashboard from './pages/Returns/ReturnsDashboard'
import ReturnDetails from './pages/Returns/ReturnDetails'
import CreateReturnForm from './pages/Returns/CreateReturnForm'
import OEEDashboard from './pages/OEE/OEEDashboard'
import OEEDashboardEnhanced from './pages/OEE/OEEDashboardEnhanced'
import OEERecordForm from './pages/OEE/OEERecordForm'
import MachineAnalytics from './pages/OEE/MachineAnalytics'
import ProductionInput from './pages/Production/ProductionInput'
import DowntimeInput from './pages/Production/DowntimeInput'
import WorkOrderProductionInput from './pages/Production/WorkOrderProductionInput'
import EditProductionRecord from './pages/Production/EditProductionRecord'
import WorkOrderEdit from './pages/Production/WorkOrderEdit'
import WorkOrderBOMEdit from './pages/Production/WorkOrderBOMEdit'
import BOMForm from './pages/Products/BOMForm'
import ProductionScheduleForm from './pages/Production/ProductionScheduleForm'
import QualityCheckForm from './pages/Production/QualityCheckForm'
import MaterialIssueForm from './pages/Production/MaterialIssueForm'
import WIPDashboard from './pages/Production/WIPDashboard'
import WIPBatchList from './pages/Production/WIPBatchList'
import RemainingStock from './pages/Production/RemainingStock'
import PackingListNew from './pages/Production/PackingListNew'
import PackingListDetail from './pages/Production/PackingListDetail'
import WIPStock from './pages/Production/WIPStock'
import Reports from './pages/Reports/ReportsFixed'
import AdvancedReportBuilder from './pages/Reports/AdvancedReportBuilder'
import ScheduledReports from './pages/Reports/ScheduledReports'
import ExecutiveDashboard from './pages/Reports/ExecutiveDashboard'
import ProductionByProductReport from './pages/Reports/ProductionByProductReport'
import ExecutiveDashboardAdvanced from './pages/Executive/ExecutiveDashboard'
import ProductionExecutiveDashboard from './pages/Executive/ProductionExecutiveDashboard'
import ProductionMonitoringDashboard from './pages/Executive/ProductionMonitoringDashboard'
import LiveMonitoringDashboard from './pages/Production/LiveMonitoringDashboard'
import ReportGenerator from './pages/Reports/ReportGenerator'
import CustomReportBuilder from './pages/Reports/CustomReportBuilder'
import ReportScheduler from './pages/Reports/ReportScheduler'
import SystemOverview from './pages/Landing/SystemOverview'
import ApprovalDashboard from './pages/Approval/ApprovalDashboard'
import ApprovalDetail from './pages/Approval/ApprovalDetail'
import WIPLedger from './pages/Finance/WIPLedger'
import DocumentDashboard from './pages/Documents/DocumentDashboardUpgraded'
import DocumentGenerator from './pages/Documents/DocumentGeneratorUpgraded'
import TemplateList from './pages/Documents/TemplateList'
import TemplateForm from './pages/Documents/TemplateForm'
import TemplateDesigner from './pages/Documents/TemplateDesigner'
import WorkOrderDetail from './pages/Production/WorkOrderDetail'
import Settings from './pages/Settings/Settings'
import AdvancedSystemConfig from './pages/Settings/AdvancedSystemConfig'
import UserRoleManagement from './pages/Settings/UserRoleManagement'
import AuditTrail from './pages/Settings/AuditTrail'
import BackupRestore from './pages/Settings/BackupRestore'
import EmailSettings from './pages/Settings/EmailSettings'
import KPITargetSettings from './pages/Settings/KPITargetSettings'
import UserProfile from './pages/Profile/UserProfile'
import UserManual from './pages/Manual/UserManual'
import FAQPage from './pages/Manual/FAQPage'
import ManualAdmin from './pages/Manual/ManualAdmin'
import GroupChat from './pages/Chat/GroupChat'
import ServerSettings from './pages/Chat/ServerSettings'
import AdminRoute from './components/Auth/AdminRoute'
import ExternalConnectors from './pages/Integration/ExternalConnectors'
import APIGateway from './pages/Integration/APIGateway'
import DataSynchronization from './pages/Integration/DataSynchronization'
import WebhookManagement from './pages/Integration/WebhookManagement'
import TVDisplayProduction from './pages/TVDisplay/TVDisplayProduction'
import TVDisplayShipping from './pages/TVDisplay/TVDisplayShipping'
import TVDisplaySelector from './pages/TVDisplay/TVDisplaySelector'
import TVDisplayRoster from './pages/TVDisplay/TVDisplayRoster'
import TVDisplayOverview from './pages/TVDisplay/TVDisplayOverview'
import MRP from './pages/MRP/MRP'
import WhatIfSimulation from './pages/MRP/WhatIfSimulation'
import MRPDashboard from './pages/MRP/MRPDashboard'
import DemandPlanning from './pages/MRP/DemandPlanning'
import CapacityPlanning from './pages/MRP/CapacityPlanning'
import MaterialRequirements from './pages/MRP/MaterialRequirements'
import SupplierIntegration from './pages/MRP/SupplierIntegration'
import NotificationsPage from './pages/Notifications/NotificationsPage'
// Redirect component for warehouse zones with ID
const WarehouseZoneRedirect = () => {
  const { id } = useParams()
  return <Navigate to={`/app/warehouse/zones/${id}`} replace />
}

// Redirect component for warehouse zone locations with ID
const WarehouseZoneLocationsRedirect = () => {
  const { id } = useParams()
  return <Navigate to={`/app/warehouse/zones/${id}/locations`} replace />
}

// Wrapper for ProductFormNew to handle routing
const ProductFormNewWrapper = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (id) {
      setLoading(true)
      axiosInstance.get(`/api/products-new/${id}`)
        .then(res => setProduct(res.data))
        .catch(err => console.error('Error loading product:', err))
        .finally(() => setLoading(false))
    }
  }, [id])
  
  const handleSave = () => {
    navigate('/app/products/list')
  }
  const handleCancel = () => {
    navigate(-1)
  }
  
  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  }
  
  return <ProductFormNew product={product} onSave={handleSave} onCancel={handleCancel} />
}

function App() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, loading } = useAppSelector((state: { auth: { isAuthenticated: boolean; loading: boolean } }) => state.auth)
  
  // Update document title dynamically based on company settings
  useDocumentTitle()

  useEffect(() => {
    // Check auth if token exists in localStorage
    const token = localStorage.getItem('token')
    if (token) {
      dispatch(checkAuth())
    }
  }, [dispatch])
  
  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-blue-200">Verifying session...</p>
        </div>
      </div>
    )
  }
  return (
    <ErrorBoundary>
    <LanguageProvider>
      <ThemeProvider>
        <PermissionProvider>
        <ToastProvider />
        <SessionTimeoutModal />
        <Routes>
      {/* System Overview for non-authenticated users */}
      <Route path="/" element={!isAuthenticated ? <SystemOverview /> : <Navigate to="/app" />} />
      <Route path="/absensi" element={<PublicAttendance />} />
      <Route path="/public/attendance" element={<PublicAttendance />} />
      <Route path="/public/leave-request" element={<StaffLeaveRequest />} />
      <Route path="/public/face-registration" element={<FaceRegistration />} />
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/app" />} />
      <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/app" />} />
      <Route path="/reset-password" element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/app" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/app" />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="/complete-profile" element={<CompleteProfile />} />
      
      {/* Redirect specific old URLs to correct app structure */}
      <Route path="/sales/opportunities" element={<Navigate to="/app/sales/opportunities" replace />} />
      <Route path="/sales/opportunities/new" element={<Navigate to="/app/sales/opportunities/new" replace />} />
      <Route path="/sales/opportunities/:id/edit" element={<Navigate to="/app/sales/opportunities" replace />} />
      <Route path="/sales/leads" element={<Navigate to="/app/sales/leads" replace />} />
      <Route path="/sales/leads/new" element={<Navigate to="/app/sales/leads/new" replace />} />
      <Route path="/sales/leads/:id/edit" element={<Navigate to="/app/sales/leads" replace />} />
      <Route path="/sales/quotations" element={<Navigate to="/app/sales/quotations" replace />} />
      <Route path="/sales/quotations/new" element={<Navigate to="/app/sales/quotations/new" replace />} />
      <Route path="/sales/quotations/:id/edit" element={<Navigate to="/app/sales/quotations" replace />} />
      <Route path="/sales/activities" element={<Navigate to="/app/sales/activities" replace />} />
      <Route path="/sales/activities/new" element={<Navigate to="/app/sales/activities/new" replace />} />
      <Route path="/sales/customers" element={<Navigate to="/app/sales/customers" replace />} />
      <Route path="/sales/customers/new" element={<Navigate to="/app/sales/customers/new" replace />} />
      <Route path="/sales/customers/:id/edit" element={<Navigate to="/app/sales/customers" replace />} />
      <Route path="/sales/orders" element={<Navigate to="/app/sales/orders" replace />} />
      <Route path="/sales/orders/new" element={<Navigate to="/app/sales/orders/new" replace />} />
      <Route path="/sales/orders/:id/edit" element={<Navigate to="/app/sales/orders" replace />} />
      <Route path="/production/machines" element={<Navigate to="/app/production/machines" replace />} />
      <Route path="/production/work-orders" element={<Navigate to="/app/production/work-orders" replace />} />
      <Route path="/production/work-orders/new" element={<Navigate to="/app/production/work-orders/new" replace />} />
      <Route path="/production/work-orders/:id/edit" element={<Navigate to="/app/production/work-orders" replace />} />
      
      <Route path="/tv/production" element={<TVDisplayProduction />} />
      <Route path="/tv/shipping" element={<TVDisplayShipping />} />
      <Route path="/tv/roster" element={<TVDisplayRoster />} />
      <Route path="/tv/overview" element={<TVDisplayOverview />} />
      
      {/* Redirect old product routes to app routes */}
      <Route path="/products" element={<Navigate to="/app/products" replace />} />
      <Route path="/products/new" element={<Navigate to="/app/products/new" replace />} />
      <Route path="/products/:id/edit" element={<Navigate to="/app/products" replace />} />
      
      {/* Redirect old warehouse routes to app routes */}
      <Route path="/warehouse/inventory" element={<Navigate to="/app/warehouse/inventory" replace />} />
      <Route path="/warehouse/stock-summary" element={<Navigate to="/app/warehouse/stock-summary" replace />} />
      <Route path="/warehouse/locations" element={<Navigate to="/app/warehouse/locations" replace />} />
      <Route path="/warehouse/locations/new" element={<Navigate to="/app/warehouse/locations/new" replace />} />
      <Route path="/warehouse/zones" element={<Navigate to="/app/warehouse/zones" replace />} />
      <Route path="/warehouse/zones/:id" element={<WarehouseZoneRedirect />} />
      <Route path="/warehouse/zones/:id/locations" element={<WarehouseZoneLocationsRedirect />} />
      <Route path="/warehouse/zones/new" element={<Navigate to="/app/warehouse/zones/new" replace />} />
      <Route path="/warehouse/alerts" element={<Navigate to="/app/warehouse/alerts" replace />} />
      <Route path="/warehouse/movements" element={<Navigate to="/app/warehouse/movements" replace />} />
      <Route path="/warehouse/movements/new" element={<Navigate to="/app/warehouse/movements/new" replace />} />
      <Route path="/warehouse/reports" element={<Navigate to="/app/warehouse/reports" replace />} />
      
      {/* Redirect old purchasing routes to app routes */}
      <Route path="/purchasing/suppliers" element={<Navigate to="/app/purchasing/suppliers" replace />} />
      <Route path="/purchasing/suppliers/new" element={<Navigate to="/app/purchasing/suppliers/new" replace />} />
      <Route path="/purchasing/suppliers/:id/edit" element={<Navigate to="/app/purchasing/suppliers" replace />} />
      <Route path="/purchasing/purchase-orders" element={<Navigate to="/app/purchasing/purchase-orders" replace />} />
      <Route path="/purchasing/purchase-orders/new" element={<Navigate to="/app/purchasing/purchase-orders/new" replace />} />
      <Route path="/purchasing/purchase-orders/:id/edit" element={<Navigate to="/app/purchasing/purchase-orders" replace />} />
      
      {/* Redirect old quality routes to app routes */}
      <Route path="/quality/tests/new" element={<Navigate to="/app/quality/tests/new" replace />} />
      <Route path="/quality/tests/:id/edit" element={<Navigate to="/app/quality/tests" replace />} />
      <Route path="/quality/tests" element={<Navigate to="/app/quality/tests" replace />} />
      
      {/* Redirect old maintenance routes to app routes */}
      <Route path="/maintenance/new" element={<Navigate to="/app/maintenance/new" replace />} />
      <Route path="/maintenance/:id/edit" element={<Navigate to="/app/maintenance" replace />} />
      <Route path="/maintenance" element={<Navigate to="/app/maintenance" replace />} />
      
      {/* Redirect old returns routes to app routes */}
      <Route path="/returns" element={<Navigate to="/app/returns" replace />} />
      <Route path="/returns/new" element={<Navigate to="/app/returns/new" replace />} />
      <Route path="/returns/:id" element={<Navigate to="/app/returns" replace />} />
      
      {/* Redirect old converting routes to app routes */}
      <Route path="/production/converting" element={<Navigate to="/app/production/converting" replace />} />
      <Route path="/production/converting/input" element={<Navigate to="/app/production/converting/input" replace />} />
      
      {/* Bypass auth for specific debug route */}
      <Route path="/app/debug/roster" element={
        <div className="min-h-screen bg-gray-50">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-purple-600">🔧 DEBUG ROSTER (Bypass Auth)</h1>
            <p className="mt-2">This route completely bypasses authentication.</p>
            <div className="mt-4 p-4 bg-purple-100 border border-purple-400 rounded">
              <p className="text-purple-800">Authentication Status: {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}</p>
              <p className="text-purple-800">Token: {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}</p>
              <button 
                onClick={() => window.location.href = '/app/hr/roster/integrated'} 
                className="mt-2 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Try Normal Route
              </button>
            </div>
          </div>
        </div>
      } />
      
      <Route path="/app" element={isAuthenticated ? <Layout /> : <Navigate to="/" />}>
        <Route index element={<ExecutiveDashboardAdvanced />} />
        
        {/* Old Dashboard */}
        <Route path="dashboard-old" element={<Dashboard />} />
        
        {/* Executive Dashboard */}
        <Route path="executive" element={<ExecutiveDashboardAdvanced />} />
        <Route path="executive/production" element={<ProductionExecutiveDashboard />} />
        <Route path="executive/production-monitoring" element={<ProductionMonitoringDashboard />} />
        <Route path="production/live-monitoring" element={<LiveMonitoringDashboard />} />
        
        {/* Products */}
        <Route path="products" element={<ProductsNewPage />} />
        <Route path="products/dashboard" element={<ProductDashboard />} />
        <Route path="products/list" element={<ProductsNewPage />} />
        <Route path="products/list/old" element={<ProductList />} />
        <Route path="products/analytics" element={<ProductAnalytics />} />
        <Route path="products/categories" element={<ProductCategories />} />
        <Route path="products/bom" element={<BOMManagement />} />
        <Route path="products/boms" element={<BOMManagement />} />
        <Route path="products/boms/new" element={<BOMForm />} />
        <Route path="products/boms/:id" element={<BOMForm />} />
        <Route path="products/boms/:id/edit" element={<BOMForm />} />
        <Route path="products/:id" element={<ProductFormNewWrapper />} />
        <Route path="products/lifecycle" element={<ProductLifecycle />} />
        <Route path="products/new" element={<ProductFormNewWrapper />} />
        <Route path="products/:id/edit" element={<ProductFormNewWrapper />} />
        <Route path="products/:kode_produk/versions" element={<ProductVersionHistory />} />
        <Route path="products/:kode_produk/compare" element={<ProductCompare />} />
        <Route path="products-v2" element={<ProductsNewPage />} />
        
        {/* Warehouse */}
        <Route path="warehouse" element={<WarehouseDashboardEnhanced />} />
        <Route path="warehouse/dashboard" element={<WarehouseDashboardEnhanced />} />
        <Route path="warehouse/analytics" element={<WarehouseAnalytics />} />
        <Route path="warehouse/abc-analysis" element={<ABCAnalysis />} />
        <Route path="warehouse/reorder-points" element={<ReorderPoints />} />
        <Route path="warehouse/zones" element={<WarehouseZones />} />
        <Route path="warehouse/zones/:id" element={<WarehouseZones />} />
        <Route path="warehouse/zones/:id/locations" element={<WarehouseLocations />} />
        <Route path="warehouse/zones/new" element={<WarehouseZones />} />
        <Route path="warehouse/locations" element={<LocationList />} />
        <Route path="warehouse/locations/new" element={<LocationForm />} />
        <Route path="warehouse/locations/:id" element={<LocationDetail />} />
        <Route path="warehouse/locations/:id/edit" element={<LocationForm />} />
        <Route path="warehouse/inventory" element={<InventoryListEnhanced />} />
        <Route path="warehouse/inventory/add-product" element={<AddProductToInventory />} />
        <Route path="warehouse/inventory/new" element={<InventoryForm />} />
        <Route path="warehouse/inventory/:id/edit" element={<InventoryForm />} />
        <Route path="warehouse/stock-input" element={<StockInput />} />
        <Route path="warehouse/stock-summary" element={<InventoryListEnhanced />} />
        <Route path="warehouse/alerts" element={<StockAlerts />} />
        <Route path="warehouse/uom" element={<UoMList />} />
        <Route path="warehouse/material-issues" element={<MaterialIssueList />} />
        <Route path="warehouse/movements" element={<MovementList />} />
        <Route path="warehouse/movements/new" element={<MovementForm />} />
        <Route path="warehouse/movements/:id" element={<MovementDetail />} />
        <Route path="warehouse/movements/:id/edit" element={<MovementForm />} />
        <Route path="warehouse/adjustments/new" element={<AdjustmentForm />} />
        <Route path="warehouse/adjustments/:id/edit" element={<AdjustmentForm />} />
        <Route path="warehouse/transfers/new" element={<TransferForm />} />
        <Route path="warehouse/reorder-points" element={<ReorderList />} />
        <Route path="warehouse/transfers/:id/edit" element={<TransferForm />} />
        <Route path="warehouse/reports" element={<InventoryList />} />
        <Route path="warehouse/materials" element={<MaterialsDashboard />} />
        <Route path="warehouse/materials/list" element={<MaterialsList />} />
        <Route path="warehouse/materials/stock" element={<MaterialStockManagement />} />
        <Route path="warehouse/materials/new" element={<MaterialCreate />} />
        <Route path="warehouse/materials/:id" element={<MaterialView />} />
        <Route path="warehouse/materials/:id/edit" element={<MaterialEdit />} />
        <Route path="warehouse/stock-opname" element={<StockOpnameList />} />
        <Route path="warehouse/stock-opname/new" element={<StockOpnameForm />} />
        <Route path="warehouse/stock-opname/results" element={<StockOpnameList />} />
        <Route path="warehouse/stock-opname/:id" element={<StockOpnameDetail />} />
        
        {/* Sales */}
        <Route path="sales" element={<Navigate to="/app/sales/dashboard" replace />} />
        <Route path="sales/dashboard" element={<SalesDashboard />} />
        <Route path="sales/leads" element={<LeadList />} />
        <Route path="sales/leads/new" element={<LeadForm />} />
        <Route path="sales/leads/:id" element={<LeadForm />} />
        <Route path="sales/leads/:id/edit" element={<LeadForm />} />
        <Route path="sales/opportunities" element={<OpportunityList />} />
        <Route path="sales/opportunities/new" element={<OpportunityForm />} />
        <Route path="sales/opportunities/:id" element={<OpportunityForm />} />
        <Route path="sales/opportunities/:id/edit" element={<OpportunityForm />} />
        <Route path="sales/quotations" element={<QuotationList />} />
        <Route path="sales/quotations/new" element={<QuotationForm />} />
        <Route path="sales/quotations/:id/edit" element={<QuotationForm />} />
        <Route path="sales/activities" element={<ActivityList />} />
        <Route path="sales/activities/new" element={<ActivityForm />} />
        <Route path="sales/customers" element={<CustomerList />} />
        <Route path="sales/customers/new" element={<CustomerForm />} />
        <Route path="sales/customers/:id" element={<CustomerDetails />} />
        <Route path="sales/customers/:id/edit" element={<CustomerForm />} />
        <Route path="sales/orders" element={<SalesOrderList />} />
        <Route path="sales/orders/new" element={<SalesOrderForm />} />
        <Route path="sales/orders/:id/workflow" element={<WorkflowStatus />} />
        <Route path="sales/orders/:id/edit" element={<SalesOrderForm />} />
        <Route path="sales/orders/:id" element={<SalesOrderDetails />} />
        <Route path="sales/forecasts" element={<SalesForecastList />} />
        <Route path="sales/forecasts/new" element={<SalesForecastForm />} />
        <Route path="sales/forecasts/:id" element={<SalesForecastForm />} />
        <Route path="sales/forecasts/:id/edit" element={<SalesForecastForm />} />
        <Route path="sales/invoices/new" element={<SalesInvoiceForm />} />
        <Route path="sales/invoices/:id/edit" element={<SalesInvoiceForm />} />
        
        {/* Purchasing */}
        <Route path="purchasing" element={<Purchasing />} />
        <Route path="purchasing/suppliers" element={<SupplierList />} />
        <Route path="purchasing/suppliers/new" element={<SupplierForm />} />
        <Route path="purchasing/suppliers/:id" element={<SupplierForm />} />
        <Route path="purchasing/suppliers/:id/edit" element={<SupplierForm />} />
        <Route path="purchasing/purchase-orders" element={<PurchaseOrderList />} />
        <Route path="purchasing/purchase-orders/new" element={<PurchaseOrderForm />} />
        <Route path="purchasing/purchase-orders/:id" element={<PurchaseOrderForm />} />
        <Route path="purchasing/purchase-orders/:id/edit" element={<PurchaseOrderForm />} />
        <Route path="purchasing/orders" element={<PurchaseOrderList />} />
        <Route path="purchasing/orders/new" element={<PurchaseOrderForm />} />
        <Route path="purchasing/orders/:id" element={<PurchaseOrderForm />} />
        <Route path="purchasing/orders/:id/edit" element={<PurchaseOrderForm />} />
        <Route path="purchasing/rfq" element={<RFQList />} />
        <Route path="purchasing/rfqs" element={<RFQList />} />
        <Route path="purchasing/rfqs/new" element={<RFQForm />} />
        <Route path="purchasing/rfqs/:id" element={<RFQForm />} />
        <Route path="purchasing/rfqs/:id/edit" element={<RFQForm />} />
        <Route path="purchasing/grn/new" element={<GRNForm />} />
        <Route path="purchasing/grn/:id/edit" element={<GRNForm />} />
        <Route path="purchasing/quotes" element={<QuoteList />} />
        <Route path="purchasing/quotes/new" element={<SupplierQuoteForm />} />
        <Route path="purchasing/quotes/:id" element={<SupplierQuoteForm />} />
        <Route path="purchasing/quotes/:id/edit" element={<SupplierQuoteForm />} />
        <Route path="purchasing/contracts" element={<ContractList />} />
        <Route path="purchasing/contracts/new" element={<SupplierForm />} />
        <Route path="purchasing/contracts/:id" element={<SupplierForm />} />
        <Route path="purchasing/contracts/:id/edit" element={<SupplierForm />} />
        <Route path="purchasing/price-comparison" element={<PriceComparison />} />
        <Route path="purchasing/supplier-integration" element={<SupplierIntegration />} />
        
        {/* Production */}
        <Route path="production" element={<ProductionDashboard />} />
        <Route path="production/dashboard" element={<ProductionDashboard />} />
        <Route path="production/machines" element={<MachineList />} />
        <Route path="production/machines/new" element={<MachineForm />} />
        <Route path="production/machines/:id" element={<MachineDetail />} />
        <Route path="production/machines/:id/edit" element={<MachineForm />} />
        <Route path="production/machines/:id/efficiency" element={<MachineDetail />} />
        <Route path="production/machines/:id/analytics" element={<MachineDetail />} />
        <Route path="production/controller" element={<DailyController />} />
        <Route path="production/weekly-controller" element={<WeeklyController />} />
        <Route path="production/monthly-controller" element={<MonthlyController />} />
        <Route path="production/converting" element={<ConvertingDashboard />} />
        <Route path="production/converting/input" element={<ConvertingInput />} />
        <Route path="production/work-orders" element={<WorkOrderList />} />
        <Route path="production/work-orders-monitoring" element={<WorkOrderMonitoring />} />
        <Route path="production/breakdown-summary" element={<BreakdownSummary />} />
        <Route path="production/work-orders/new" element={<WorkOrderForm />} />
        <Route path="production/work-orders/:id" element={<WorkOrderDetail />} />
        <Route path="production/work-orders/:id/edit" element={<WorkOrderEdit />} />
        <Route path="production/work-orders/:id/input" element={<WorkOrderProductionInput />} />
        <Route path="production/work-orders/:id/records/:recordId/edit" element={<EditProductionRecord />} />
        <Route path="production/work-orders/:id/timeline" element={<WorkOrderTimeline />} />
        <Route path="production/work-orders/:id/breakdown" element={<WorkOrderBreakdown />} />
        <Route path="production/work-order-status" element={<WorkOrderStatus />} />
        <Route path="production/work-orders/:id/bom-edit" element={<WorkOrderBOMEdit />} />
        <Route path="production/remaining-stock" element={<RemainingStock />} />
        <Route path="production/scheduling" element={<WeeklyProductionPlan />} />
        <Route path="production/monthly-schedule" element={<MonthlyProductionPlan />} />
        <Route path="production/weekly-plans/:id" element={<WeeklyPlanDetail />} />
        <Route path="production/schedules/new" element={<Navigate to="/app/production/scheduling?new=true" replace />} />
        <Route path="production/records" element={<ProductionRecords />} />
        <Route path="production/records/new" element={<ProductionRecordForm />} />
        <Route path="production/schedules/new" element={<ProductionScheduleForm />} />
        <Route path="production/schedules/:id/edit" element={<ProductionScheduleForm />} />
        <Route path="production/quality-checks/new" element={<QualityCheckForm />} />
        <Route path="production/quality-checks/:id/edit" element={<QualityCheckForm />} />
        <Route path="production/material-issues" element={<MaterialIssueList />} />
        <Route path="production/material-issues/:id" element={<MaterialIssueDetail />} />
        <Route path="production/efficiency" element={<EfficiencyTracking />} />
        <Route path="production/traceability" element={<Traceability />} />
        <Route path="production/planning" element={<ProductionPlanningList />} />
        <Route path="production/planning/create" element={<ProductionPlanningForm />} />
        <Route path="production/planning/edit/:id" element={<ProductionPlanningForm />} />
        <Route path="production/planning/dashboard" element={<ProductionPlanningDashboard />} />
        
        {/* Production MRP Integration */}
        <Route path="production/mrp" element={<MRPDashboard />} />
        <Route path="production/demand-planning" element={<DemandPlanning />} />
        <Route path="production/capacity-planning" element={<CapacityPlanning />} />
        <Route path="production/material-requirements" element={<MaterialRequirements />} />
        <Route path="production/supplier-integration" element={<SupplierIntegration />} />
        <Route path="production/simulation" element={<WhatIfSimulation />} />
        
        {/* Legacy MRP routes (redirect to production) */}
        <Route path="mrp" element={<Navigate to="/app/production/mrp" replace />} />
        <Route path="mrp/dashboard" element={<Navigate to="/app/production/mrp" replace />} />
        <Route path="mrp/demand-planning" element={<Navigate to="/app/production/demand-planning" replace />} />
        <Route path="mrp/capacity-planning" element={<Navigate to="/app/production/capacity-planning" replace />} />
        <Route path="mrp/material-requirements" element={<Navigate to="/app/production/material-requirements" replace />} />
        <Route path="mrp/supplier-integration" element={<Navigate to="/app/production/supplier-integration" replace />} />
        <Route path="mrp/legacy" element={<MRP />} />
        <Route path="mrp/simulation" element={<Navigate to="/app/production/simulation" replace />} />
        
        {/* Quality */}
        <Route path="quality" element={<QualityDashboardEnhanced />} />
        <Route path="quality/dashboard" element={<QualityDashboardEnhanced />} />
        <Route path="quality/incoming" element={<IncomingQC />} />
        <Route path="quality/in-process" element={<InProcessQC />} />
        <Route path="quality/finish-good" element={<FinishGoodQC />} />
        <Route path="quality/packing-list" element={<QCPackingList />} />
        <Route path="quality/finish-good/:woId/input" element={<WorkOrderQCForm />} />
        <Route path="quality/objective/production" element={<QualityObjectiveProduction />} />
        <Route path="quality/objective/downtime-analysis" element={<DowntimeAnalysis />} />
        <Route path="quality/analytics" element={<QualityAnalytics />} />
        <Route path="quality/pending-qc" element={<PendingQC />} />
        <Route path="quality/pending-qc/:woId" element={<WorkOrderQCForm />} />
        <Route path="quality/tests" element={<QualityTestList />} />
        <Route path="quality/tests/new" element={<QualityTestForm />} />
        <Route path="quality/tests/:id" element={<QualityTestForm />} />
        <Route path="quality/tests/:id/edit" element={<QualityTestForm />} />
        <Route path="quality/inspections" element={<QualityTestList />} />
        <Route path="quality/inspections/new" element={<QualityTestForm />} />
        <Route path="quality/inspections/:id" element={<QualityTestForm />} />
        <Route path="quality/inspections/:id/edit" element={<QualityTestForm />} />
        <Route path="quality-enhanced/dashboard" element={<QualityDashboardEnhanced />} />
        <Route path="quality-enhanced/alerts" element={<QualityAlerts />} />
        <Route path="quality-enhanced/analytics" element={<QualityAnalytics />} />
        <Route path="quality-enhanced/audits" element={<QualityAudits />} />
        <Route path="quality/to-warehouse" element={<QCToWarehouse />} />
        
        {/* Shipping */}
        <Route path="shipping" element={<ShippingDashboard />} />
        <Route path="shipping/orders" element={<ShippingDashboard />} />
        <Route path="shipping/orders/new" element={<ShippingOrderForm />} />
        <Route path="shipping/orders/from-qc" element={<CreateShippingFromQC />} />
        <Route path="shipping/orders/:id/edit" element={<ShippingOrderForm />} />
        <Route path="shipping/tracking" element={<DeliveryTracking />} />
        <Route path="shipping/calculator" element={<ShippingCalculator />} />
        <Route path="shipping/providers" element={<LogisticsProviders />} />
        <Route path="shipping/orders/:id" element={<ShippingOrderDetails />} />
        <Route path="shipping/orders/:orderId/tracking/new" element={<ShippingTrackingForm />} />
        <Route path="shipping/tracking/:trackingId/edit" element={<ShippingTrackingForm />} />
        <Route path="shipping/reports" element={<ShippingReportsForm />} />
        
        {/* Finance */}
        <Route path="finance" element={<FinanceDashboard />} />
        <Route path="finance/dashboard" element={<FinanceDashboard />} />
        <Route path="finance/accounting" element={<AccountingManagement />} />
        <Route path="finance/budget" element={<BudgetPlanning />} />
        <Route path="finance/cash-flow" element={<CashFlowManagement />} />
        <Route path="finance/reports" element={<FinancialReports />} />
        <Route path="finance/invoices" element={<InvoiceList />} />
        <Route path="finance/invoices/new" element={<FinanceInvoiceForm />} />
        <Route path="finance/invoices/:id" element={<FinanceInvoiceForm />} />
        <Route path="finance/invoices/:id/edit" element={<FinanceInvoiceForm />} />
        <Route path="finance/payments" element={<FinanceDashboard />} />
        <Route path="finance/payments/:id" element={<PaymentForm />} />
        <Route path="finance/accounts-receivable" element={<AccountsReceivable />} />
        <Route path="finance/accounts-payable" element={<AccountsPayable />} />
        <Route path="finance/general-ledger" element={<GeneralLedger />} />
        <Route path="finance/chart-of-accounts" element={<ChartOfAccounts />} />
        <Route path="finance/cash-bank" element={<CashBankManagement />} />
        <Route path="finance/budgeting" element={<BudgetForecasting />} />
        <Route path="finance/fixed-assets" element={<FixedAssets />} />
        <Route path="finance/tax-management" element={<TaxManagement />} />
        <Route path="finance/costing" element={<CostingControlling />} />
        <Route path="finance/consolidation" element={<Consolidation />} />
        <Route path="finance/payments/new" element={<PaymentForm />} />
        <Route path="finance/accounts/new" element={<AccountForm />} />
        <Route path="finance/accounts/:id/edit" element={<AccountForm />} />
        <Route path="finance/budgets/new" element={<BudgetForm />} />
        <Route path="finance/budgets/:id/edit" element={<BudgetForm />} />
        <Route path="finance/expenses/new" element={<ExpenseForm />} />
        <Route path="finance/expenses/:id/edit" element={<ExpenseForm />} />
        
        {/* Accounting - Separated module for accountants */}
        <Route path="accounting" element={<AccountingManagement />} />
        <Route path="accounting/chart-of-accounts" element={<ChartOfAccounts />} />
        <Route path="accounting/general-ledger" element={<GeneralLedger />} />
        <Route path="accounting/journal" element={<AccountingManagement />} />
        <Route path="accounting/receivable" element={<AccountsReceivable />} />
        <Route path="accounting/payable" element={<AccountsPayable />} />
        <Route path="accounting/fixed-assets" element={<FixedAssets />} />
        <Route path="accounting/tax" element={<TaxManagement />} />
        <Route path="accounting/reports" element={<FinancialReports />} />
        
        {/* Approval Workflow */}
        <Route path="approval" element={<ApprovalDashboard />} />
        <Route path="approval/:id" element={<ApprovalDetail />} />
        
        {/* WIP Accounting */}
        <Route path="finance/wip-ledger" element={<WIPLedger />} />
        
        {/* Documents */}
        <Route path="documents" element={<DocumentDashboard />} />
        <Route path="documents/generate" element={<DocumentGenerator />} />
        <Route path="documents/templates" element={<TemplateList />} />
        <Route path="documents/templates/new" element={<TemplateDesigner />} />
        <Route path="documents/templates/:id/edit" element={<TemplateDesigner />} />
        
        {/* HR */}
        <Route path="hr" element={<HRDashboard />} />
        <Route path="hr/dashboard" element={<HRDashboard />} />
        <Route path="hr/employees" element={<EmployeeList />} />
        <Route path="hr/employees/new" element={<EmployeeForm />} />
        <Route path="hr/employees/:id" element={<EmployeeForm />} />
        <Route path="hr/employees/:id/edit" element={<EmployeeForm />} />
        <Route path="hr/departments" element={<Departments />} />
        <Route path="hr/reports" element={<HRReports />} />
        <Route path="hr/attendance" element={<AttendanceManagement />} />
        <Route path="hr/attendance-admin" element={<AttendanceAdmin />} />
        <Route path="hr/face-admin" element={<FaceAdmin />} />
        <Route path="hr/attendance-report" element={<AttendanceReport />} />
        <Route path="hr/attendance-calendar" element={<AttendanceCalendar />} />
        <Route path="hr/attendance-not-clocked-out" element={<AttendanceNotClockedOut />} />
        <Route path="hr/staff-leave" element={<StaffLeaveManagement />} />
        <Route path="hr/absensi" element={<AttendancePage />} />
        <Route path="hr/leaves" element={<LeaveManagement />} />
        <Route path="hr/leaves/new" element={<LeaveRequestForm />} />
        <Route path="hr/attendance/new" element={<AttendanceForm />} />
        <Route path="hr/attendance/:id/edit" element={<AttendanceForm />} />
        <Route path="hr/leaves/request/new" element={<LeaveForm />} />
        <Route path="hr/leaves/:id/edit" element={<LeaveForm />} />
        <Route path="hr/payroll" element={<PayrollList />} />
        <Route path="hr/payroll/new" element={<PayrollForm />} />
        <Route path="hr/payroll/:id/edit" element={<PayrollForm />} />
        <Route path="hr/payroll/periods/new" element={<PayrollPeriodForm />} />
        <Route path="hr/payroll/periods/:periodId/records" element={<PayrollRecordList />} />
        <Route path="hr/payroll/outsourcing-vendors" element={<OutsourcingVendorList />} />
        <Route path="hr/payroll/piecework-logs" element={<PieceworkLogList />} />
        <Route path="hr/appraisals" element={<AppraisalList />} />
        <Route path="hr/appraisals/new" element={<AppraisalForm />} />
        <Route path="hr/appraisals/:id/edit" element={<AppraisalForm />} />
        <Route path="hr/appraisal" element={<AppraisalList />} />
        <Route path="hr/appraisal/cycles/new" element={<AppraisalCycleForm />} />
        <Route path="hr/training" element={<TrainingManagement />} />
        <Route path="hr/roster/integrated" element={<RosterManagementComplete key="integrated" />} />
        <Route path="hr/roster/manage" element={<RosterManagementComplete key="manage" />} />
        <Route path="hr/roster/calendar" element={<RosterCalendar />} />
        <Route path="hr/roster/daily" element={<WorkRosterComplete />} />
        <Route path="hr/roster" element={<WorkRosterWeekly />} />
        
        {/* Maintenance */}
        <Route path="maintenance" element={<MaintenanceDashboardEnhanced />} />
        <Route path="maintenance/dashboard" element={<MaintenanceDashboardEnhanced />} />
        <Route path="maintenance/records" element={<MaintenanceList />} />
        <Route path="maintenance/schedules" element={<MaintenanceSchedule />} />
        <Route path="maintenance/new" element={<MaintenanceForm />} />
        <Route path="maintenance/request/new" element={<MaintenanceRequestForm />} />
        <Route path="maintenance/request/:id/edit" element={<MaintenanceRequestForm />} />
        <Route path="maintenance/work-orders/new" element={<MaintenanceWorkOrderForm />} />
        <Route path="maintenance/work-orders/:id/edit" element={<MaintenanceWorkOrderForm />} />
        <Route path="maintenance/parts-requests/new" element={<MaintenancePartsForm />} />
        <Route path="maintenance/parts-requests/:id/edit" element={<MaintenancePartsForm />} />
        <Route path="maintenance/analytics" element={<MaintenanceAnalyticsForm />} />
        <Route path="maintenance/:id" element={<MaintenanceForm />} />
        <Route path="maintenance/:id/edit" element={<MaintenanceForm />} />
        
        {/* R&D */}
        <Route path="rd" element={<RDDashboard />} />
        <Route path="rd/dashboard" element={<RDDashboard />} />
        <Route path="rd/projects" element={<ProjectList />} />
        <Route path="rd/projects/new" element={<ProjectForm />} />
        <Route path="rd/projects/:id" element={<ProjectDetails />} />
        <Route path="rd/projects/:id/edit" element={<ProjectForm />} />
        <Route path="rd/projects/:id/details" element={<ProjectDetailsForm />} />
        <Route path="rd/experiments" element={<ExperimentList />} />
        <Route path="rd/experiments/new" element={<ExperimentForm />} />
        <Route path="rd/experiments/:id" element={<ExperimentForm />} />
        <Route path="rd/experiments/:id/edit" element={<ExperimentForm />} />
        <Route path="rd/materials" element={<MaterialList />} />
        <Route path="rd/materials/new" element={<MaterialForm />} />
        <Route path="rd/materials/:id/edit" element={<MaterialForm />} />
        <Route path="rd/products" element={<ProductDevelopmentList />} />
        <Route path="rd/products/new" element={<ProductDevelopmentForm />} />
        <Route path="rd/products/:id" element={<ProductDevelopmentForm />} />
        <Route path="rd/products/:id/edit" element={<ProductDevelopmentForm />} />
        <Route path="rd/reports" element={<ResearchReportsForm />} />
        
        {/* RND (New R&D Module) */}
        <Route path="rnd" element={<RNDDashboard />} />
        <Route path="rnd/dashboard" element={<RNDDashboard />} />
        <Route path="rnd/projects" element={<RNDProjectList />} />
        <Route path="rnd/projects/new" element={<RNDProjectForm />} />
        <Route path="rnd/projects/:id" element={<RNDProjectDetail />} />
        <Route path="rnd/projects/:id/edit" element={<RNDProjectForm />} />
        <Route path="rnd/approvals" element={<RNDApprovals />} />
        
        {/* Waste */}
        <Route path="waste" element={<WasteRecordList />} />
        <Route path="waste/new" element={<WasteRecordForm />} />
        <Route path="waste/:id/edit" element={<WasteRecordForm />} />
        
        {/* Returns */}
        <Route path="returns" element={<ReturnsDashboard />} />
        <Route path="returns/new" element={<CreateReturnForm />} />
        <Route path="returns/:id" element={<ReturnDetails />} />
        
        {/* OEE */}
        <Route path="oee" element={<OEEDashboardEnhanced />} />
        <Route path="oee/monitoring" element={<OEEDashboardEnhanced />} />
        <Route path="oee/dashboard" element={<OEEDashboardEnhanced />} />
        <Route path="oee/records" element={<OEEDashboardEnhanced />} />
        <Route path="oee/records/new" element={<OEERecordForm />} />
        <Route path="oee/records/:id" element={<OEERecordForm />} />
        <Route path="oee/records/:id/edit" element={<OEERecordForm />} />
        <Route path="oee/downtime" element={<OEEDashboardEnhanced />} />
        <Route path="oee/machines/:machineId/analytics" element={<MachineAnalytics />} />
        <Route path="oee/legacy" element={<OEEDashboard />} />
        
        {/* Production Input */}
        <Route path="production/input" element={<ProductionInput />} />
        <Route path="production/downtime" element={<DowntimeInput />} />
        
        {/* WIP & Job Costing */}
        <Route path="production/wip" element={<WIPDashboard />} />
        <Route path="production/wip-batches" element={<WIPBatchList />} />
        <Route path="production/wip-batches/new" element={<WIPBatchForm />} />
        <Route path="production/wip-batches/:id" element={<WIPBatchList />} />
        <Route path="production/job-costs" element={<WIPBatchList />} />
        
        {/* Packing List (New - Separate from WO) */}
        <Route path="production/packing-list" element={<PackingListNew />} />
        <Route path="production/packing-list/:id" element={<PackingListDetail />} />
        <Route path="production/wip-stock" element={<WIPStock />} />
        
        {/* Production Approval */}
        <Route path="production/approvals" element={<ProductionApprovalList />} />
        <Route path="production/approvals/:id" element={<ProductionApprovalDetail />} />
        
        {/* Product Changeover */}
        <Route path="production/changeovers" element={<ChangeoverList />} />
        <Route path="production/work-orders/:woId/changeover" element={<ProductChangeover />} />
        
        {/* TV Display */}
        <Route path="tv-display" element={<TVDisplaySelector />} />
        
        {/* Notifications */}
        <Route path="notifications" element={<NotificationsPage />} />
        
        {/* Settings - Admin Only */}
        <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="settings/system-config" element={<AdminRoute><AdvancedSystemConfig /></AdminRoute>} />
        <Route path="settings/user-roles" element={<AdminRoute><UserRoleManagement /></AdminRoute>} />
        <Route path="settings/audit-trail" element={<AdminRoute><AuditTrail /></AdminRoute>} />
        <Route path="settings/backup-restore" element={<AdminRoute><BackupRestore /></AdminRoute>} />
        <Route path="settings/email" element={<AdminRoute><EmailSettings /></AdminRoute>} />
        <Route path="settings/kpi-targets" element={<AdminRoute><KPITargetSettings /></AdminRoute>} />
        
        {/* Profile */}
        <Route path="profile" element={<UserProfile />} />
        <Route path="profile/:userId" element={<UserProfile />} />
        
        {/* User Manual */}
        <Route path="manual" element={<UserManual />} />
        <Route path="manual/faq" element={<FAQPage />} />
        <Route path="manual/article" element={<UserManual />} />
        <Route path="manual/article/:articleSlug" element={<UserManual />} />
        <Route path="manual/category/:categorySlug" element={<UserManual />} />
        <Route path="manual/admin" element={<AdminRoute><ManualAdmin /></AdminRoute>} />
        
        {/* Group Chat */}
        <Route path="chat" element={<GroupChat />} />
        <Route path="chat/server/:serverId/settings" element={<ServerSettings />} />
        
        {/* Integration - Admin Only */}
        <Route path="integration/connectors" element={<AdminRoute><ExternalConnectors /></AdminRoute>} />
        <Route path="integration/api-gateway" element={<AdminRoute><APIGateway /></AdminRoute>} />
        <Route path="integration/data-sync" element={<AdminRoute><DataSynchronization /></AdminRoute>} />
        <Route path="integration/webhooks" element={<AdminRoute><WebhookManagement /></AdminRoute>} />
        <Route path="reports" element={<Reports />} />
        <Route path="reports/advanced-builder" element={<AdvancedReportBuilder />} />
        <Route path="reports/scheduled" element={<ScheduledReports />} />
        <Route path="reports/executive" element={<ExecutiveDashboard />} />
        <Route path="reports/generate/:reportId" element={<ReportGenerator />} />
        <Route path="reports/custom" element={<CustomReportBuilder />} />
        <Route path="reports/scheduler" element={<ReportScheduler />} />
        <Route path="reports/production-by-product" element={<ProductionByProductReport />} />
      </Route>
    </Routes>
        </PermissionProvider>
      </ThemeProvider>
    </LanguageProvider>
    </ErrorBoundary>
  )
}

export default App
