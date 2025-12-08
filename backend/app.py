from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from middleware.i18n import setup_i18n_middleware
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from config import Config
from models import db
from routes import register_routes
import os

def create_app(config_class=Config):
    """Application factory pattern"""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Disable automatic trailing slash redirects to prevent CORS preflight issues
    app.url_map.strict_slashes = False
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    jwt = JWTManager(app)
    bcrypt = Bcrypt(app)
    app.bcrypt = bcrypt  # Make bcrypt accessible from app instance
    # More permissive CORS for LAN access
    setup_i18n_middleware(app)
    
    # Initialize audit middleware (tracks all user activities except admin)
    from utils.audit_middleware import init_audit_middleware
    init_audit_middleware(app)
    
    CORS(app, 
         origins=['*'],  # Allow all origins for LAN access
         allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
         supports_credentials=False)  # Set to False when using wildcard origins
    
    # Import all blueprints
    from routes.health import health_bp
    from routes.auth import auth_bp
    from routes.products import products_bp
    from routes.warehouse import warehouse_bp
    from routes.sales import sales_bp
    from routes.purchasing import purchasing_bp
    from routes.production import production_bp
    from routes.finance import finance_bp
    from routes.hr import hr_bp
    from routes.hr_payroll import hr_payroll_bp
    from routes.hr_appraisal import hr_appraisal_bp
    from routes.hr_training import hr_training_bp
    from routes.hr_extended import hr_extended_bp
    from routes.settings import settings_bp
    from routes.mrp import mrp_bp
    from routes.quality import quality_bp
    from routes.quality_enhanced import quality_enhanced_bp
    from routes.reports import reports_bp
    from routes.dashboard import dashboard_bp
    from routes.shipping import shipping_bp
    from routes.maintenance import maintenance_bp
    from routes.maintenance_extended import maintenance_extended_bp
    from routes.rd import rd_bp
    from routes.rd_extended import rd_extended_bp
    from routes.waste import waste_bp
    from routes.oee import oee_bp
    from routes.import_data import import_bp
    from routes.returns import returns_bp
    from routes.warehouse_enhanced import warehouse_enhanced_bp
    from routes.settings_extended import settings_extended_bp
    from routes.integration_extended import integration_bp
    from routes.tv_display import tv_display_bp
    from routes.workflow_complete import workflow_complete_bp
    from routes.bom import bom_bp
    from routes.stock_input import stock_input_bp
    from routes.materials import materials_bp
    from routes.materials_crud import materials_crud_bp
    from routes.materials_simple_crud import materials_simple_crud_bp
    from routes.products_new import products_new_bp
    from routes.products_new_extended import products_new_extended_bp
    from routes.products_new_excel import products_new_excel_bp
    from routes.product_calculations import product_calc_bp
    from routes.workflow_integration import workflow_bp
    from routes.production_planning import planning_bp
    from routes.executive_dashboard import executive_dashboard_bp
    
    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    # Import and register OAuth blueprint
    from routes.oauth import oauth_bp, init_oauth
    init_oauth(app)
    app.register_blueprint(oauth_bp, url_prefix='/api/oauth')
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(bom_bp, url_prefix='/api/production')
    app.register_blueprint(warehouse_bp, url_prefix='/api/warehouse')
    app.register_blueprint(stock_input_bp, url_prefix='/api/warehouse')
    app.register_blueprint(materials_bp, url_prefix='/api/materials')
    app.register_blueprint(materials_crud_bp, url_prefix='/api/materials')
    app.register_blueprint(materials_simple_crud_bp, url_prefix='/api/materials')
    app.register_blueprint(products_new_bp)
    app.register_blueprint(products_new_extended_bp)
    app.register_blueprint(products_new_excel_bp, url_prefix='/api/products-excel')
    app.register_blueprint(product_calc_bp)
    app.register_blueprint(sales_bp, url_prefix='/api/sales')
    app.register_blueprint(purchasing_bp, url_prefix='/api/purchasing')
    app.register_blueprint(production_bp, url_prefix='/api/production')
    
    # Import and register production input blueprint
    from routes.production_input import production_input_bp
    app.register_blueprint(production_input_bp, url_prefix='/api/production-input')
    app.register_blueprint(finance_bp, url_prefix='/api/finance')
    app.register_blueprint(hr_bp, url_prefix='/api/hr')
    app.register_blueprint(hr_payroll_bp, url_prefix='/api/hr/payroll')
    app.register_blueprint(hr_appraisal_bp, url_prefix='/api/hr/appraisal')
    app.register_blueprint(hr_training_bp, url_prefix='/api/hr/training')
    app.register_blueprint(hr_extended_bp, url_prefix='/api/hr')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')
    app.register_blueprint(mrp_bp, url_prefix='/api/mrp')
    app.register_blueprint(quality_bp, url_prefix='/api/quality')
    app.register_blueprint(quality_enhanced_bp, url_prefix='/api/quality-enhanced')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(shipping_bp, url_prefix='/api/shipping')
    app.register_blueprint(maintenance_bp, url_prefix='/api/maintenance')
    app.register_blueprint(maintenance_extended_bp, url_prefix='/api/maintenance')
    app.register_blueprint(rd_bp, url_prefix='/api/rd')
    app.register_blueprint(rd_extended_bp, url_prefix='/api/rd')
    app.register_blueprint(waste_bp, url_prefix='/api/waste')
    app.register_blueprint(oee_bp, url_prefix='/api/oee')
    app.register_blueprint(returns_bp, url_prefix='/api/returns')
    app.register_blueprint(warehouse_enhanced_bp, url_prefix='/api/warehouse-enhanced')
    app.register_blueprint(settings_extended_bp, url_prefix='/api/settings')
    app.register_blueprint(integration_bp, url_prefix='/api/integration')
    app.register_blueprint(tv_display_bp, url_prefix='/api/tv-display')
    app.register_blueprint(import_bp)
    
    # Import and register workflow blueprints
    from routes.workflow import workflow_bp as workflow_old_bp
    app.register_blueprint(workflow_old_bp, url_prefix='/api/workflow')
    app.register_blueprint(workflow_complete_bp, url_prefix='/api/workflow-complete')
    app.register_blueprint(workflow_bp, url_prefix='/api/workflow-integration')  # New integration workflow
    app.register_blueprint(planning_bp, url_prefix='/api/production-planning')  # Production Planning (MPS)
    
    # Import and register WIP Job Costing blueprint
    from routes.wip_job_costing import wip_job_costing_bp
    app.register_blueprint(wip_job_costing_bp, url_prefix='/api/wip')
    
    # Import and register Approval Workflow blueprint
    from routes.approval_workflow import approval_bp
    app.register_blueprint(approval_bp)
    
    # Import and register WIP Accounting blueprint
    from routes.wip_accounting import wip_accounting_bp
    app.register_blueprint(wip_accounting_bp)
    
    # Import and register Executive Dashboard blueprint
    app.register_blueprint(executive_dashboard_bp, url_prefix='/api/executive')
    
    # Import and register KPI Targets blueprint
    from routes.kpi_targets import kpi_targets_bp
    app.register_blueprint(kpi_targets_bp, url_prefix='/api/kpi-targets')
    
    # Import and register Document Management blueprint
    from routes.document_management import document_bp
    app.register_blueprint(document_bp)
    
    # Import and register System Monitor blueprint
    from routes.system_monitor import system_monitor_bp
    app.register_blueprint(system_monitor_bp, url_prefix='/api')
    
    # Import and register Notifications blueprint
    from routes.notifications import notifications_bp
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    
    # Import and register Email Notifications blueprint
    from routes.notifications_email import notifications_email_bp
    app.register_blueprint(notifications_email_bp, url_prefix='/api/email')
    
    # Import and register Backup blueprint
    from routes.backup import backup_bp
    app.register_blueprint(backup_bp, url_prefix='/api/settings')
    
    # Import and register Material Stock blueprint
    from routes.material_stock import material_stock_bp
    app.register_blueprint(material_stock_bp, url_prefix='/api')
    
    # Import and register BOM Management blueprint
    from routes.bom_management import bom_management_bp
    app.register_blueprint(bom_management_bp, url_prefix='/api')
    
    # Import and register AI Assistant blueprint
    from routes.ai_assistant import ai_assistant_bp
    app.register_blueprint(ai_assistant_bp, url_prefix='/api/ai-assistant')
    
    # Import and register User Manual blueprint
    from routes.user_manual import manual_bp
    app.register_blueprint(manual_bp, url_prefix='/api/manual')
    
    # Import and register Group Chat blueprint
    from routes.group_chat import chat_bp
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    
    # Import and register Material Issue blueprint
    from routes.material_issue import material_issue_bp
    app.register_blueprint(material_issue_bp, url_prefix='/api/production')
    
    # Import and register Production Approval blueprint
    from routes.production_approval import production_approval_bp
    app.register_blueprint(production_approval_bp, url_prefix='/api/production')
    
    # Serve uploaded files
    from flask import send_from_directory
    
    @app.route('/uploads/chat/<filename>')
    def serve_chat_upload(filename):
        upload_folder = os.path.join(os.path.dirname(__file__), 'uploads', 'chat')
        return send_from_directory(upload_folder, filename)
    
    # Public company info endpoint for showcase page (no auth required)
    @app.route('/api/company/public', methods=['GET'])
    def get_public_company_info():
        try:
            from models import CompanyProfile
            company_profile = CompanyProfile.query.first()
            
            if company_profile:
                return {
                    'name': company_profile.company_name,
                    'industry': company_profile.industry or 'Manufacturing',
                    'website': company_profile.website or '',
                    'city': company_profile.city or 'Jakarta'
                }, 200
            else:
                return {
                    'name': 'PT. Gratia Makmur Sentosa',
                    'industry': 'Manufacturing',
                    'website': 'www.gratiams.com',
                    'city': 'Jakarta'
                }, 200
        except Exception as e:
            return {
                'name': 'PT. Gratia Makmur Sentosa',
                'industry': 'Manufacturing',
                'website': 'www.gratiams.com',
                'city': 'Jakarta'
            }, 200

    # System status and statistics endpoint for showcase page
    @app.route('/api/status', methods=['GET'])
    def system_status():
        try:
            from models import User, Product, Customer, Supplier, WorkOrder, SalesOrder
            
            # Get real counts from database
            total_users = User.query.count()
            total_products = Product.query.count()
            total_customers = Customer.query.count()
            total_suppliers = Supplier.query.count()
            total_work_orders = WorkOrder.query.count()
            total_sales_orders = SalesOrder.query.count()
            
            # Calculate total records
            total_records = (total_users + total_products + total_customers + 
                           total_suppliers + total_work_orders + total_sales_orders)
            
            # Get company profile
            from models import CompanyProfile
            company_profile = CompanyProfile.query.first()
            company_name = company_profile.company_name if company_profile else 'PT. Gratia Makmur Sentosa'
            
            return {
                'status': 'online',
                'message': 'ERP System is running',
                'version': '1.0.0',
                'company': company_name,
                'statistics': {
                    'total_users': total_users,
                    'total_products': total_products,
                    'total_customers': total_customers,
                    'total_suppliers': total_suppliers,
                    'total_work_orders': total_work_orders,
                    'total_sales_orders': total_sales_orders,
                    'total_records': total_records,
                    'active_modules': 16,  # Count of available modules
                    'breakdown': {
                        'users': total_users,
                        'products': total_products,
                        'customers': total_customers,
                        'suppliers': total_suppliers,
                        'work_orders': total_work_orders,
                        'sales_orders': total_sales_orders
                    }
                }
            }, 200
        except Exception as e:
            # Fallback if database not ready
            return {
                'status': 'online',
                'message': 'ERP System is running (DB initializing)',
                'version': '1.0.0',
                'company': 'PT. Gratia Makmur Sentosa',
                'statistics': {
                    'total_users': 0,
                    'total_products': 0,
                    'total_customers': 0,
                    'total_suppliers': 0,
                    'total_work_orders': 0,
                    'total_sales_orders': 0,
                    'total_records': 0,
                    'active_modules': 16
                }
            }, 200
    
    # Create required directories
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['BACKUP_FOLDER'], exist_ok=True)
    
    # Register production event listeners
    try:
        from utils.production_events import register_production_events
        register_production_events(app)
    except Exception as e:
        print(f"Warning: Could not register production events: {str(e)}")
    
    # Register quality event listeners
    try:
        from utils.quality_events import register_quality_events
        register_quality_events(app)
    except Exception as e:
        print(f"Warning: Could not register quality events: {str(e)}")
    
    return app
def create_initial_data(app):
    """Create initial data for the system"""
    from models import (
        User, Role, Permission, CompanyProfile, SystemSetting,
        ProductCategory, WarehouseZone, Department, ShiftSchedule, WasteCategory
    )
    
    # Check if admin user exists
    admin_user = User.query.filter(
        (User.username == 'admin') | (User.email == 'admin@gratiams.com')
    ).first()
    
    if not admin_user:
        # Create admin user
        admin_user = User(
            username='admin',
            email='admin@gratiams.com',
            password_hash='',  # Will be set below
            full_name='System Administrator',
            is_active=True,
            is_admin=True
        )
        admin_user.set_password('admin123')
        db.session.add(admin_user)
        try:
            db.session.commit()
            print("✓ Admin user created (username: admin, password: admin123)")
        except Exception as e:
            db.session.rollback()
            print(f"Admin user already exists or error occurred: {e}")
            # Try to get existing admin user
            admin_user = User.query.filter_by(username='admin').first()
            if not admin_user:
                admin_user = User.query.filter_by(email='admin@gratiams.com').first()
    else:
        print("✓ Admin user already exists")
    
    # Create default roles
    roles_data = [
        {'name': 'Administrator', 'description': 'Full system access'},
        {'name': 'Manager', 'description': 'Department manager access'},
        {'name': 'Supervisor', 'description': 'Supervisor access'},
        {'name': 'Operator', 'description': 'Production operator access'},
        {'name': 'Quality Control', 'description': 'Quality control access'},
        {'name': 'Warehouse Staff', 'description': 'Warehouse operations access'},
        {'name': 'Sales', 'description': 'Sales operations access'},
        {'name': 'Purchasing', 'description': 'Purchasing operations access'},
    ]
    
    for role_data in roles_data:
        if not Role.query.filter_by(name=role_data['name']).first():
            role = Role(**role_data)
            db.session.add(role)
    
    try:
        db.session.commit()
        print("✓ Default roles created")
    except Exception as e:
        db.session.rollback()
        print(f"Roles may already exist: {e}")
    
    # Create company profile
    if not CompanyProfile.query.first():
        company = CompanyProfile(
            company_name='PT. Gratia Makmur Sentosa',
            legal_name='PT. Gratia Makmur Sentosa',
            industry='Nonwoven Manufacturing',
            email='info@gratiams.com',
            country='Indonesia',
            currency='IDR',
            timezone='Asia/Jakarta',
            updated_by=admin_user.id if admin_user else 1
        )
        db.session.add(company)
        try:
            db.session.commit()
            print("✓ Company profile created")
        except Exception as e:
            db.session.rollback()
            print(f"Company profile error: {e}")
    
    # Create default system settings
    if not SystemSetting.query.first():
        system_settings_data = [
            # System preferences
            {'setting_key': 'language', 'setting_category': 'system', 'setting_name': 'Language', 'setting_value': 'id', 'data_type': 'string', 'is_editable': True},
            {'setting_key': 'dateFormat', 'setting_category': 'system', 'setting_name': 'Date Format', 'setting_value': 'DD/MM/YYYY', 'data_type': 'string', 'is_editable': True},
            {'setting_key': 'timeFormat', 'setting_category': 'system', 'setting_name': 'Time Format', 'setting_value': '24', 'data_type': 'string', 'is_editable': True},
            {'setting_key': 'weekStart', 'setting_category': 'system', 'setting_name': 'Week Start', 'setting_value': 'monday', 'data_type': 'string', 'is_editable': True},
            {'setting_key': 'fiscalYearStart', 'setting_category': 'system', 'setting_name': 'Fiscal Year Start', 'setting_value': 'january', 'data_type': 'string', 'is_editable': True},
            
            # UI preferences
            {'setting_key': 'theme', 'setting_category': 'ui', 'setting_name': 'Theme', 'setting_value': 'light', 'data_type': 'string', 'is_editable': True},
            
            # Backup settings
            {'setting_key': 'autoBackup', 'setting_category': 'backup', 'setting_name': 'Auto Backup', 'setting_value': 'true', 'data_type': 'boolean', 'is_editable': True},
            {'setting_key': 'backupFrequency', 'setting_category': 'backup', 'setting_name': 'Backup Frequency', 'setting_value': 'daily', 'data_type': 'string', 'is_editable': True},
            
            # Notification settings
            {'setting_key': 'emailNotifications', 'setting_category': 'notifications', 'setting_name': 'Email Notifications', 'setting_value': 'true', 'data_type': 'boolean', 'is_editable': True},
            {'setting_key': 'smsNotifications', 'setting_category': 'notifications', 'setting_name': 'SMS Notifications', 'setting_value': 'false', 'data_type': 'boolean', 'is_editable': True},
            
            # Security settings
            {'setting_key': 'session_timeout_minutes', 'setting_category': 'security', 'setting_name': 'Session Timeout (Minutes)', 'setting_value': '60', 'data_type': 'integer', 'is_editable': True},
        ]
        
        for setting_data in system_settings_data:
            setting = SystemSetting(
                updated_by=admin_user.id if admin_user else 1,
                **setting_data
            )
            db.session.add(setting)
        
        try:
            db.session.commit()
            print("✓ Default system settings created")
        except Exception as e:
            db.session.rollback()
            print(f"System settings error: {e}")
    
    # Create product categories
    categories_data = [
        {'code': 'WET', 'name': 'Wet Tissue'},
        {'code': 'DRY', 'name': 'Dry Tissue'},
        {'code': 'ANT', 'name': 'Antiseptic'},
        {'code': 'SAN', 'name': 'Sanitizer'},
        {'code': 'PTW', 'name': 'Paper Towel'},
        {'code': 'FAC', 'name': 'Facial Tissue'},
        {'code': 'BWI', 'name': 'Baby Wipes'},
        {'code': 'OTH', 'name': 'Other Nonwoven Products'},
    ]
    
    for cat_data in categories_data:
        if not ProductCategory.query.filter_by(code=cat_data['code']).first():
            category = ProductCategory(**cat_data)
            db.session.add(category)
    
    try:
        db.session.commit()
        print("✓ Product categories created")
    except Exception as e:
        db.session.rollback()
        print(f"Product categories error: {e}")
    
    # Create warehouse zones
    zones_data = [
        {'code': 'ZONE-A', 'name': 'Finished Goods', 'material_type': 'finished_goods'},
        {'code': 'ZONE-B', 'name': 'Raw Materials', 'material_type': 'raw_materials'},
        {'code': 'ZONE-C', 'name': 'Packaging Materials', 'material_type': 'packaging_materials'},
        {'code': 'ZONE-D', 'name': 'Chemical Materials', 'material_type': 'chemical_materials'},
    ]
    
    for zone_data in zones_data:
        if not WarehouseZone.query.filter_by(code=zone_data['code']).first():
            zone = WarehouseZone(**zone_data)
            db.session.add(zone)
    
    try:
        db.session.commit()
        print("✓ Warehouse zones created")
    except Exception as e:
        db.session.rollback()
        print(f"Warehouse zones error: {e}")
    
    # Create departments
    departments_data = [
        {'code': 'PROD', 'name': 'Production'},
        {'code': 'QC', 'name': 'Quality Control'},
        {'code': 'WH', 'name': 'Warehouse'},
        {'code': 'SALES', 'name': 'Sales & Marketing'},
        {'code': 'PURCH', 'name': 'Purchasing'},
        {'code': 'RD', 'name': 'Research & Development'},
        {'code': 'MAINT', 'name': 'Maintenance'},
        {'code': 'HR', 'name': 'Human Resources'},
        {'code': 'FIN', 'name': 'Finance & Accounting'},
    ]
    
    for dept_data in departments_data:
        if not Department.query.filter_by(code=dept_data['code']).first():
            dept = Department(**dept_data)
            db.session.add(dept)
    
    try:
        db.session.commit()
        print("✓ Departments created")
    except Exception as e:
        db.session.rollback()
        print(f"Departments error: {e}")
    
    # Create shift schedules
    from datetime import time
    shifts_data = [
        {'name': 'Shift 1 (Pagi)', 'shift_type': 'morning', 'start_time': time(7, 0), 'end_time': time(15, 0), 'color_code': '#3B82F6'},
        {'name': 'Shift 2 (Siang)', 'shift_type': 'afternoon', 'start_time': time(15, 0), 'end_time': time(23, 0), 'color_code': '#10B981'},
        {'name': 'Shift 3 (Malam)', 'shift_type': 'night', 'start_time': time(23, 0), 'end_time': time(7, 0), 'color_code': '#8B5CF6'},
    ]
    
    for shift_data in shifts_data:
        if not ShiftSchedule.query.filter_by(name=shift_data['name']).first():
            shift = ShiftSchedule(**shift_data)
            db.session.add(shift)
    
    try:
        db.session.commit()
        print("✓ Shift schedules created")
    except Exception as e:
        db.session.rollback()
        print(f"Shift schedules error: {e}")
    
    # Create waste categories
    waste_categories_data = [
        {'code': 'PROD-WASTE', 'name': 'Production Waste', 'waste_type': 'production_waste', 'hazard_level': 'low'},
        {'code': 'PACK-WASTE', 'name': 'Packaging Waste', 'waste_type': 'packaging_waste', 'hazard_level': 'none'},
        {'code': 'CHEM-WASTE', 'name': 'Chemical Waste', 'waste_type': 'chemical_waste', 'hazard_level': 'high'},
        {'code': 'GEN-WASTE', 'name': 'General Waste', 'waste_type': 'general_waste', 'hazard_level': 'none'},
    ]
    
    for waste_data in waste_categories_data:
        if not WasteCategory.query.filter_by(code=waste_data['code']).first():
            waste_cat = WasteCategory(**waste_data)
            db.session.add(waste_cat)
    
    try:
        db.session.commit()
        print("✓ Waste categories created")
    except Exception as e:
        db.session.rollback()
        print(f"Waste categories error: {e}")
    
    print("✓ Initial data setup completed")

if __name__ == '__main__':
    app = create_app()
    print("\n" + "="*60)
    print("  PT. Gratia Makmur Sentosa - ERP System")
    print("  Nonwoven Manufacturing ERP")
    print("="*60)
    print("\n✓ Server starting on http://localhost:5000")
    print("✓ API Documentation: http://localhost:5000/api/docs")
    print("\nDefault Credentials:")
    print("  Username: admin")
    print("  Password: admin123")
    print("\n" + "="*60 + "\n")
    app.run(debug=True, host='0.0.0.0', port=5000)
