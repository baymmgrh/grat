from flask import Blueprint

def register_routes(app):
    """Register all route blueprints"""
    
    # Import all route modules
    from .health import health_bp
    from .auth import auth_bp
    from .products import products_bp
    from .warehouse import warehouse_bp
    from .sales import sales_bp
    from .purchasing import purchasing_bp
    from .production import production_bp
    from .quality import quality_bp
    from .quality_enhanced import quality_enhanced_bp
    from .shipping import shipping_bp
    from .finance import finance_bp
    from .hr import hr_bp
    from .maintenance import maintenance_bp
    from .rd import rd_bp
    from .waste import waste_bp
    from .oee import oee_bp
    from .notifications import notifications_bp
    from .backup import backup_bp
    from .integration import integration_bp
    from .analytics import analytics_bp
    from .settings import settings_bp
    from .dashboard import dashboard_bp
    from .reports import reports_bp
    from .tv_display import tv_display_bp
    from .mrp import mrp_bp
    from .warehouse_enhanced import warehouse_enhanced_bp
    from .attendance import attendance_bp
    from .logs import logs_bp
    from .converting import converting_bp
    from .staff_leave import staff_leave_bp
    from .hr_payroll import hr_payroll_bp
    from .live_monitoring import live_monitoring_bp
    
    # Register all blueprints
    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(warehouse_bp, url_prefix='/api/warehouse')
    app.register_blueprint(sales_bp, url_prefix='/api/sales')
    app.register_blueprint(purchasing_bp, url_prefix='/api/purchasing')
    app.register_blueprint(production_bp, url_prefix='/api/production')
    app.register_blueprint(quality_bp, url_prefix='/api/quality')
    app.register_blueprint(shipping_bp, url_prefix='/api/shipping')
    app.register_blueprint(finance_bp, url_prefix='/api/finance')
    app.register_blueprint(hr_bp, url_prefix='/api/hr')
    app.register_blueprint(maintenance_bp, url_prefix='/api/maintenance')
    app.register_blueprint(rd_bp, url_prefix='/api/rd')
    app.register_blueprint(waste_bp, url_prefix='/api/waste')
    app.register_blueprint(oee_bp, url_prefix='/api/oee')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(backup_bp, url_prefix='/api/backup')
    app.register_blueprint(integration_bp, url_prefix='/api/integration')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(tv_display_bp, url_prefix='/api/tv-display')
    app.register_blueprint(mrp_bp, url_prefix='/api/mrp')
    app.register_blueprint(warehouse_enhanced_bp, url_prefix='/api/warehouse-enhanced')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    app.register_blueprint(logs_bp, url_prefix='/api/logs')
    app.register_blueprint(converting_bp)  # Routes already have /api/converting prefix
    app.register_blueprint(staff_leave_bp, url_prefix='/api/staff-leave')
    app.register_blueprint(hr_payroll_bp, url_prefix='/api/hr/payroll')
    app.register_blueprint(live_monitoring_bp, url_prefix='/api/live-monitoring')
    print("✓ Converting routes registered")
    print("✓ Live Monitoring routes registered")
    print("✓ Staff Leave routes registered")
    print("✓ Payroll routes registered")
    
    # API documentation endpoint
    @app.route('/api/docs')
    def api_docs():
        return {
            'application': 'PT. Gratia Makmur Sentosa ERP System',
            'version': '1.0.0',
            'description': 'Complete ERP System for Nonwoven Manufacturing',
            'endpoints': {
                'auth': '/api/auth',
                'products': '/api/products',
                'warehouse': '/api/warehouse',
                'sales': '/api/sales',
                'purchasing': '/api/purchasing',
                'production': '/api/production',
                'quality': '/api/quality',
                'shipping': '/api/shipping',
                'finance': '/api/finance',
                'hr': '/api/hr',
                'maintenance': '/api/maintenance',
                'rd': '/api/rd',
                'waste': '/api/waste',
                'oee': '/api/oee',
                'notifications': '/api/notifications',
                'backup': '/api/backup',
                'integration': '/api/integration',
                'analytics': '/api/analytics',
                'settings': '/api/settings',
                'dashboard': '/api/dashboard',
                'reports': '/api/reports',
                'tv_display': '/api/tv-display',
                'mrp': '/api/mrp'
            }
        }
    
    @app.route('/')
    @app.route('/api')
    def index():
        return {
            'message': 'PT. Gratia Makmur Sentosa ERP API',
            'status': 'running',
            'version': '1.0.0',
            'documentation': '/api/docs'
        }
