from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# Import all models
from .user import User, Role, UserRole, Permission, RolePermission
from .product import Material, Product, ProductSpecification, ProductPackaging, ProductCategory
from .product_excel_schema import ProductNew, ProductVersion
from .warehouse import WarehouseZone, WarehouseLocation, Inventory, InventoryMovement
from .sales import Customer, SalesOrder, SalesOrderItem, SalesForecast
from .purchasing import Supplier, PurchaseOrder, PurchaseOrderItem, GoodsReceivedNote, GRNItem
from .production import Machine, WorkOrder, ProductionRecord, BillOfMaterials, BOMItem, ProductionSchedule, ShiftProduction, DowntimeRecord, WeeklyProductionPlan, WeeklyProductionPlanItem, ProductChangeover
from .quality import QualityTest, QualityInspection, CAPA, QualityStandard
from .shipping import ShippingOrder, ShippingItem, DeliveryTracking, LogisticsProvider
from .returns import CustomerReturn, ReturnItem, ReturnQCRecord, ReturnDisposition
from .finance import Invoice, InvoiceItem, Payment, AccountingEntry, CostCenter
from .hr import Employee, Department, ShiftSchedule, Attendance, Leave, EmployeeRoster
from .hr_extended import (
    PayrollPeriod, PayrollRecord, SalaryComponent, EmployeeSalaryComponent,
    AppraisalCycle, AppraisalTemplate, AppraisalCriteria, EmployeeAppraisal, AppraisalScore,
    TrainingCategory, TrainingProgram, TrainingSession, TrainingEnrollment, TrainingRequest
)
from .maintenance import MaintenanceSchedule, MaintenanceRecord, MaintenanceTask, EquipmentHistory
from .rd import ResearchProject, Experiment, ProductDevelopment, RDMaterial, ResearchReport, Prototype, ProductTestResult
from .waste import WasteRecord, WasteCategory, WasteTarget, WasteDisposal
from .oee import OEERecord, OEEDowntimeRecord, QualityDefect, MachinePerformance
from .quality_enhanced import (
    QualityMetrics, QualityAlert, QualityTarget, QualityAnalytics,
    QualityAudit, QualityTraining, QualityCompetency
)
from .warehouse_enhanced import (
    WarehouseAnalytics, ProductABCClassification, InventoryReorderPoint,
    WarehouseAlert, WarehouseOptimization, StockMovementForecast
)
from .notification import Notification, SystemAlert
from .backup import BackupRecord
from .integration import IntegrationLog, ThirdPartyAPI
from .analytics import AnalyticsReport, KPI, MetricData
from .settings import SystemSetting, CompanyProfile
from .settings_extended import (
    AdvancedUserRole, AdvancedPermission, AdvancedRolePermission,
    AdvancedUserRoleAssignment, AuditLog, SystemConfiguration, BackupConfiguration
)
from .integration_extended import (
    ExternalConnector, APIEndpoint, DataSyncJob, SyncJobExecution,
    Webhook, WebhookDelivery
)
from .workflow_integration import (
    WorkflowStep, MRPRequirement, ProductionBuffer, WorkflowAutomation
)
from .product_new_schema import InventoryItemNew, BOMItemNew, WorkOrderNew
from .bom_history import BOMHistory, BOMImportLog
from .custom_bom import CustomBOM, CustomBOMItem
from .kpi_target import KPITarget, seed_kpi_targets
from .user_manual import ManualCategory, ManualArticle, ManualFAQ
from .group_chat import (
    ChatServer, ChatCategory, ChatChannel, ChatMessage, ChatAttachment,
    ChatReaction, ChatMention, ChatPinnedMessage, ChatServerRole,
    ChatServerRoleMember, ChatUserStatus, ChatUnreadMessage
)
from .work_order_bom import WorkOrderBOMItem

# Import to ensure models are registered
from . import product_new_schema

__all__ = [
    'db',
    # User models
    'User', 'Role', 'UserRole', 'Permission', 'RolePermission',
    # Product models
    'Material', 'Product', 'ProductSpecification', 'ProductPackaging', 'ProductCategory',
    # Warehouse models
    'WarehouseZone', 'WarehouseLocation', 'Inventory', 'InventoryMovement',
    # Sales models
    'Customer', 'SalesOrder', 'SalesOrderItem', 'SalesForecast',
    # Purchasing models
    'Supplier', 'PurchaseOrder', 'PurchaseOrderItem', 'GoodsReceivedNote', 'GRNItem',
    # Production models
    'Machine', 'WorkOrder', 'ProductionRecord', 'BillOfMaterials', 'BOMItem', 'ProductionSchedule', 'ShiftProduction', 'DowntimeRecord', 'WeeklyProductionPlan', 'WeeklyProductionPlanItem', 'ProductChangeover',
    # Quality models
    'QualityTest', 'QualityInspection', 'CAPA', 'QualityStandard',
    # Shipping models
    'ShippingOrder', 'ShippingItem', 'DeliveryTracking', 'LogisticsProvider',
    # Returns models
    'CustomerReturn', 'ReturnItem', 'ReturnQCRecord', 'ReturnDisposition',
    # Finance models
    'Invoice', 'InvoiceItem', 'Payment', 'AccountingEntry', 'CostCenter',
    # HR models
    'Employee', 'Department', 'ShiftSchedule', 'Attendance', 'Leave', 'EmployeeRoster',
    # HR Extended models
    'PayrollPeriod', 'PayrollRecord', 'SalaryComponent', 'EmployeeSalaryComponent',
    'AppraisalCycle', 'AppraisalTemplate', 'AppraisalCriteria', 'EmployeeAppraisal', 'AppraisalScore',
    'TrainingCategory', 'TrainingProgram', 'TrainingSession', 'TrainingEnrollment', 'TrainingRequest',
    # Maintenance models
    'MaintenanceSchedule', 'MaintenanceRecord', 'MaintenanceTask', 'EquipmentHistory',
    # R&D models
    'ResearchProject', 'Experiment', 'ProductDevelopment', 'RDMaterial', 'ResearchReport', 'Prototype', 'ProductTestResult',
    # Waste models
    'WasteRecord', 'WasteCategory', 'WasteTarget', 'WasteDisposal',
    # OEE models
    'OEERecord', 'OEEDowntimeRecord', 'QualityDefect', 'MachinePerformance',
    # Quality Enhanced models
    'QualityMetrics', 'QualityAlert', 'QualityTarget', 'QualityAnalytics',
    'QualityAudit', 'QualityTraining', 'QualityCompetency',
    # Notification models
    'Notification', 'SystemAlert',
    # Backup models
    'BackupRecord',
    # Integration models
    'IntegrationLog', 'ThirdPartyAPI',
    # Analytics models
    'AnalyticsReport', 'KPI', 'MetricData',
    # Settings models
    'SystemSetting', 'CompanyProfile',
    # Extended Settings models
    'AdvancedUserRole', 'AdvancedPermission', 'AdvancedRolePermission',
    'AdvancedUserRoleAssignment', 'AuditLog', 'SystemConfiguration', 'BackupConfiguration',
    # Extended Integration models
    'ExternalConnector', 'APIEndpoint', 'DataSyncJob', 'SyncJobExecution',
    'Webhook', 'WebhookDelivery',
    # Workflow Integration models
    'WorkflowStep', 'MRPRequirement', 'ProductionBuffer', 'WorkflowAutomation',
    # New Product Schema models
    'ProductNew', 'ProductVersion', 'InventoryItemNew', 'BOMItemNew', 'WorkOrderNew',
    # BOM History models
    'BOMHistory', 'BOMImportLog',
    # KPI Target models
    'KPITarget', 'seed_kpi_targets',
    # User Manual models
    'ManualCategory', 'ManualArticle', 'ManualFAQ',
    # Group Chat models
    'ChatServer', 'ChatCategory', 'ChatChannel', 'ChatMessage', 'ChatAttachment',
    'ChatReaction', 'ChatMention', 'ChatPinnedMessage', 'ChatServerRole',
    'ChatServerRoleMember', 'ChatUserStatus', 'ChatUnreadMessage',
]
