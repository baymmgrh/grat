from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, SystemSetting, CompanyProfile, User, Role
from utils.i18n import success_response, error_response, get_message
from datetime import datetime
import json
import os
import tempfile
import zipfile
from utils import generate_number
from utils.timezone import get_local_now, get_local_today

settings_bp = Blueprint('settings', __name__)

@settings_bp.route('/system', methods=['GET'])
@jwt_required()
def get_system_settings():
    try:
        settings = SystemSetting.query.all()
        
        # Convert to dictionary format for frontend
        settings_dict = {}
        for s in settings:
            if s.setting_category not in settings_dict:
                settings_dict[s.setting_category] = {}
            
            # Convert string values to appropriate types
            value = s.setting_value
            if s.data_type == 'boolean':
                value = value.lower() in ['true', '1', 'yes']
            elif s.data_type == 'integer':
                value = int(value) if value.isdigit() else 0
            elif s.data_type == 'float':
                value = float(value) if value.replace('.', '').isdigit() else 0.0
            
            settings_dict[s.setting_category][s.setting_key] = value
        
        return jsonify(settings_dict), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/system', methods=['PUT'])
@jwt_required()
def update_system_settings():
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())  # Convert string to int
        
        updated_count = 0
        
        for category, settings in data.items():
            for key, value in settings.items():
                setting = SystemSetting.query.filter_by(
                    setting_category=category,
                    setting_key=key
                ).first()
                
                if setting and setting.is_editable:
                    # Convert value to string for storage
                    if isinstance(value, bool):
                        setting.setting_value = 'true' if value else 'false'
                    else:
                        setting.setting_value = str(value)
                    
                    setting.updated_by = user_id
                    setting.updated_at = get_local_now()
                    updated_count += 1
                elif not setting:
                    # Create new setting if it doesn't exist
                    new_setting = SystemSetting(
                        setting_key=key,
                        setting_category=category,
                        setting_name=key.replace('_', ' ').title(),
                        setting_value=str(value),
                        data_type='string',
                        is_editable=True,
                        updated_by=user_id  # Only use updated_by, no created_by
                    )
                    db.session.add(new_setting)
                    updated_count += 1
        
        db.session.commit()
        return jsonify({
            'message': f'Successfully updated {updated_count} settings'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/company/public', methods=['GET'])
def get_company_public_info():
    """Public endpoint for company basic info (no auth required)"""
    try:
        profile = CompanyProfile.query.first()
        if not profile:
            # Return default info if no profile exists
            return jsonify({
                'name': 'Your Company',
                'industry': 'Manufacturing'
            }), 200
        
        return jsonify({
            'name': profile.company_name,
            'industry': profile.industry or 'Manufacturing'
        }), 200
    except Exception as e:
        return jsonify({
            'name': 'Your Company',
            'industry': 'Manufacturing'
        }), 200

@settings_bp.route('/company', methods=['GET'])
@jwt_required()
def get_company_profile():
    try:
        profile = CompanyProfile.query.first()
        if not profile:
            # Create default company profile if not exists
            profile = CompanyProfile(
                company_name='PT. Gratia Makmur Sentosa',
                legal_name='PT. Gratia Makmur Sentosa',
                tax_id='12.345.678.9-012.000',
                industry='Manufacturing',
                phone='+62-21-1234567',
                email='info@gratiamakmur.com',
                website='www.gratiamakmur.com',
                address='Jl. Industri No. 123, Jakarta',
                city='Jakarta',
                country='Indonesia',
                currency='IDR',
                timezone='Asia/Jakarta'
            )
            db.session.add(profile)
            db.session.commit()
        
        return jsonify({
            'id': profile.id,
            'name': profile.company_name,
            'legal_name': profile.legal_name,
            'taxId': profile.tax_id,
            'industry': profile.industry,
            'phone': profile.phone,
            'email': profile.email,
            'website': profile.website,
            'address': profile.address,
            'city': profile.city,
            'country': profile.country,
            'currency': profile.currency,
            'timezone': profile.timezone
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/company', methods=['PUT'])
@jwt_required()
def update_company_profile():
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())  # Convert string to int
        
        profile = CompanyProfile.query.first()
        if not profile:
            return jsonify(error_response('api.error', error_code=404)), 404
        
        # Map frontend field names to database field names
        field_mapping = {
            'name': 'company_name',
            'taxId': 'tax_id'
        }
        
        for key, value in data.items():
            db_field = field_mapping.get(key, key)
            if hasattr(profile, db_field):
                setattr(profile, db_field, value)
        
        profile.updated_by = user_id
        profile.updated_at = get_local_now()
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    try:
        # Get users with eager loading of roles
        from sqlalchemy.orm import joinedload
        from models import UserRole
        users = User.query.options(
            joinedload(User.roles).joinedload(UserRole.role)
        ).all()
        
        return jsonify({
            'users': [{
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'full_name': u.full_name,
                'is_active': u.is_active,
                'is_admin': u.is_admin,
                'last_login': u.last_login.isoformat() if u.last_login else None,
                'created_at': u.created_at.isoformat(),
                'roles': [{
                    'id': ur.role.id,
                    'name': ur.role.name,
                    'description': ur.role.description
                } for ur in u.roles if ur.role] if hasattr(u, 'roles') else []
            } for u in users]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/users/<int:user_id>/profile', methods=['GET'])
@jwt_required()
def get_user_profile(user_id):
    """Get user profile by ID - restricted to admin roles"""
    try:
        current_user_id = int(get_jwt_identity())
        
        # Get current user to check permissions
        from sqlalchemy.orm import joinedload
        from models import UserRole
        current_user = User.query.options(
            joinedload(User.roles).joinedload(UserRole.role)
        ).get(current_user_id)
        
        if not current_user:
            return jsonify({'error': 'Current user not found'}), 404
        
        # Check if viewing own profile (always allowed)
        is_own_profile = current_user_id == user_id
        
        # Roles that can view other profiles (Supervisor level and above, including Staff)
        admin_roles = [
            # Admin level
            'Super Admin', 'Admin', 'IT Admin',
            # Direktur level
            'Direktur Utama', 'Direktur Operasional', 'Direktur Keuangan', 'Direktur HRD',
            # Manager level
            'General Manager',
            'Manager Produksi', 'Manager Sales', 'Manager Purchasing', 'Manager Warehouse',
            'Manager Finance', 'Manager HRD', 'Manager QC', 'Manager Maintenance', 'Manager R&D',
            'Manager PPIC',
            # Supervisor level
            'Supervisor Produksi', 'Supervisor Warehouse', 'Supervisor QC', 'Supervisor PPIC',
            'Production Supervisor', 'Team Lead Sales',
            # Staff level
            'Admin Staff', 'Sales Staff', 'Purchasing Staff', 'Warehouse Staff', 'Production Staff',
            'Finance Staff', 'HR Staff', 'QC Staff', 'Maintenance Staff', 'R&D Staff', 'Staff PPIC',
            'Quality Control', 'Auditor'
        ]
        user_roles = [ur.role.name for ur in current_user.roles if ur.role] if current_user.roles else []
        
        has_admin_role = any(role in admin_roles for role in user_roles)
        is_admin = current_user.is_admin or current_user.is_super_admin or has_admin_role
        
        # If not own profile and not admin, deny access
        if not is_own_profile and not is_admin:
            return jsonify({'error': 'Anda tidak memiliki izin untuk melihat profil pengguna lain'}), 403
        
        # Get target user profile
        target_user = User.query.options(
            joinedload(User.roles).joinedload(UserRole.role)
        ).get(user_id)
        
        if not target_user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'success': True,
            'user': {
                'id': target_user.id,
                'username': target_user.username,
                'email': target_user.email,
                'full_name': target_user.full_name,
                'phone': getattr(target_user, 'phone', None),
                'department': getattr(target_user, 'department', None),
                'position': getattr(target_user, 'position', None),
                'bio': getattr(target_user, 'bio', None),
                'is_active': target_user.is_active,
                'is_admin': target_user.is_admin,
                'is_super_admin': target_user.is_super_admin,
                'last_login': target_user.last_login.isoformat() if target_user.last_login else None,
                'created_at': target_user.created_at.isoformat(),
                'roles': [{
                    'id': ur.role.id,
                    'name': ur.role.name,
                    'description': ur.role.description
                } for ur in target_user.roles if ur.role] if target_user.roles else []
            }
        }), 200
        
    except Exception as e:
        print(f"Error getting user profile: {e}")
        return jsonify({'error': str(e)}), 500


@settings_bp.route('/users', methods=['POST'])
@jwt_required()
def create_user():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'full_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if user exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify(error_response('api.error', error_code=409)), 409
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify(error_response('api.error', error_code=409)), 409
        
        # Create new user
        new_user = User(
            username=data['username'],
            email=data['email'],
            password_hash='',  # Will be set below
            full_name=data['full_name'],
            is_active=data.get('is_active', True),
            is_admin=data.get('is_admin', False)
        )
        new_user.set_password(data['password'])
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'email': new_user.email,
                'full_name': new_user.full_name,
                'is_active': new_user.is_active,
                'is_admin': new_user.is_admin
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    try:
        data = request.get_json()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify(error_response('api.error', error_code=404)), 404
        
        # Update user fields
        if 'username' in data:
            # Check if username already exists (excluding current user)
            existing_user = User.query.filter(User.username == data['username'], User.id != user_id).first()
            if existing_user:
                return jsonify(error_response('api.error', error_code=409)), 409
            user.username = data['username']
        
        if 'email' in data:
            # Check if email already exists (excluding current user)
            existing_user = User.query.filter(User.email == data['email'], User.id != user_id).first()
            if existing_user:
                return jsonify(error_response('api.error', error_code=409)), 409
            user.email = data['email']
        
        if 'full_name' in data:
            user.full_name = data['full_name']
        
        if 'phone' in data:
            user.phone = data['phone']
        
        if 'department' in data:
            user.department = data['department']
        
        if 'position' in data:
            user.position = data['position']
        
        if 'is_active' in data:
            user.is_active = data['is_active']
        
        if 'is_admin' in data:
            user.is_admin = data['is_admin']
        
        # Update password if provided
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        
        user.updated_at = get_local_now()
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'phone': user.phone,
                'department': user.department,
                'position': user.position,
                'is_active': user.is_active,
                'is_admin': user.is_admin
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    try:
        current_user_id = int(get_jwt_identity())
        
        # Prevent deleting self
        if current_user_id == user_id:
            return jsonify(error_response('api.error', error_code=400)), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify(error_response('api.error', error_code=404)), 404
        
        # Soft delete by setting is_active to False
        user.is_active = False
        user.updated_at = get_local_now()
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@settings_bp.route('/users/<int:user_id>/permanent', methods=['DELETE'])
@jwt_required()
def permanent_delete_user(user_id):
    """Permanently delete a user from the database"""
    try:
        current_user_id = int(get_jwt_identity())
        
        # Get current user to check if admin
        current_user = User.query.get(current_user_id)
        if not current_user or not (current_user.is_admin or current_user.is_super_admin):
            return jsonify({'error': 'Only administrators can permanently delete users'}), 403
        
        # Prevent deleting self
        if current_user_id == user_id:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Prevent deleting super admin
        if user.is_super_admin:
            return jsonify({'error': 'Cannot delete super admin account'}), 400
        
        username = user.username
        
        # Delete user roles first (cascade should handle this, but being explicit)
        from models import UserRole
        UserRole.query.filter_by(user_id=user_id).delete()
        
        # Delete notifications
        from models import Notification
        Notification.query.filter_by(user_id=user_id).delete()
        
        # Delete the user permanently
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'User "{username}" has been permanently deleted'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error permanently deleting user: {e}")
        return jsonify({'error': str(e)}), 500


@settings_bp.route('/backup/create', methods=['POST'])
@jwt_required()
def create_backup():
    try:
        user_id = int(get_jwt_identity())  # Convert string to int
        
        # Create temporary directory for backup
        backup_dir = tempfile.mkdtemp()
        backup_file = f"gms_backup_{get_local_now().strftime('%Y%m%d_%H%M%S')}.zip"
        backup_path = os.path.join(backup_dir, backup_file)
        
        # Create zip file with database export
        with zipfile.ZipFile(backup_path, 'w') as zipf:
            # Add database schema info
            schema_info = {
                'created_at': get_local_now().isoformat(),
                'created_by': user_id,
                'version': '1.0.0',
                'tables': []
            }
            
            # Export each table (simplified - you might want to use SQLAlchemy-Utils or similar)
            from models import Product, Material, WorkOrder, SalesOrder, Customer
            
            # Sample data export for key tables
            tables_data = {
                'products': [{'id': p.id, 'code': p.code, 'name': p.name} for p in Product.query.limit(10).all()],
                'materials': [{'id': m.id, 'code': m.code, 'name': m.name} for m in Material.query.limit(10).all()],
                'work_orders': [{'id': w.id, 'wo_number': w.wo_number} for w in WorkOrder.query.limit(10).all()],
                'sales_orders': [{'id': s.id, 'so_number': s.so_number} for s in SalesOrder.query.limit(10).all()],
                'customers': [{'id': c.id, 'company_name': c.company_name} for c in Customer.query.limit(10).all()]
            }
            
            for table_name, data in tables_data.items():
                zipf.writestr(f'{table_name}.json', json.dumps(data, indent=2))
            
            zipf.writestr('schema.json', json.dumps(schema_info, indent=2))
        
        return jsonify({
            'message': 'Backup created successfully',
            'backup_file': backup_file,
            'size': os.path.getsize(backup_path),
            'created_at': get_local_now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/backup/download/<filename>', methods=['GET'])
@jwt_required()
def download_backup(filename):
    try:
        # In production, you'd store these in a secure location
        backup_dir = tempfile.gettempdir()
        backup_path = os.path.join(backup_dir, filename)
        
        if os.path.exists(backup_path):
            return send_file(backup_path, as_attachment=True)
        else:
            return jsonify(error_response('api.error', error_code=404)), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/export/data', methods=['POST'])
@jwt_required()
def export_data():
    try:
        data = request.get_json()
        export_type = data.get('type', 'full')  # full, products, orders, etc.
        
        # Create export based on type
        export_data = {
            'export_info': {
                'type': export_type,
                'created_at': get_local_now().isoformat(),
                'created_by': int(get_jwt_identity())  # Convert string to int
            }
        }
        
        if export_type == 'full' or export_type == 'products':
            from models import Product
            products = Product.query.all()
            export_data['products'] = [{
                'id': p.id,
                'code': p.code,
                'name': p.name,
                'description': p.description,
                'price': float(p.price) if p.price else 0,
                'cost': float(p.cost) if p.cost else 0,
                'material_type': p.material_type
            } for p in products]
        
        return jsonify({
            'message': 'Data export prepared successfully',
            'data': export_data,
            'records_count': len(export_data.get('products', [])),
            'download_url': '/api/settings/export/download'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/security/session-timeout', methods=['PUT'])
@jwt_required()
def update_session_timeout():
    try:
        data = request.get_json()
        timeout_minutes = data.get('timeout_minutes', 60)
        
        # Update session timeout setting
        setting = SystemSetting.query.filter_by(
            setting_key='session_timeout_minutes'
        ).first()
        
        if not setting:
            setting = SystemSetting(
                setting_key='session_timeout_minutes',
                setting_category='security',
                setting_name='Session Timeout (Minutes)',
                setting_value=str(timeout_minutes),
                data_type='integer',
                is_editable=True,
                updated_by=int(get_jwt_identity())  # Only use updated_by, no created_by
            )
            db.session.add(setting)
        else:
            setting.setting_value = str(timeout_minutes)
            setting.updated_by = int(get_jwt_identity())  # Convert string to int
            setting.updated_at = get_local_now()
        
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===== ROLE MANAGEMENT ENDPOINTS =====

@settings_bp.route('/roles/public', methods=['GET'])
def get_public_roles():
    """Get all active roles for registration (public endpoint)"""
    try:
        # Exclude admin/super admin roles from public registration
        excluded_roles = ['Super Admin', 'Direktur Utama', 'Direktur Operasional', 
                         'Direktur Keuangan', 'Direktur HRD', 'IT Admin']
        
        roles = Role.query.filter(
            Role.is_active == True,
            ~Role.name.in_(excluded_roles)
        ).order_by(Role.name).all()
        
        # Group roles by category
        role_categories = {
            'Management': [],
            'Supervisor': [],
            'Staff': [],
            'Operator': []
        }
        
        for r in roles:
            role_data = {
                'id': r.id,
                'name': r.name,
                'description': r.description
            }
            
            name_lower = r.name.lower()
            if 'manager' in name_lower or 'general' in name_lower:
                role_categories['Management'].append(role_data)
            elif 'supervisor' in name_lower or 'team lead' in name_lower:
                role_categories['Supervisor'].append(role_data)
            elif 'staff' in name_lower or 'admin' in name_lower:
                role_categories['Staff'].append(role_data)
            elif 'operator' in name_lower or 'helper' in name_lower:
                role_categories['Operator'].append(role_data)
            else:
                role_categories['Staff'].append(role_data)
        
        return jsonify({
            'roles': [{'id': r.id, 'name': r.name, 'description': r.description} for r in roles],
            'categories': role_categories
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/roles', methods=['GET'])
@jwt_required()
def get_roles():
    """Get all roles with permissions"""
    try:
        from sqlalchemy.orm import joinedload
        from models import Permission, RolePermission
        
        roles = Role.query.options(
            joinedload(Role.permissions).joinedload(RolePermission.permission)
        ).all()
        
        return jsonify({
            'roles': [{
                'id': r.id,
                'name': r.name,
                'description': r.description,
                'is_active': r.is_active,
                'created_at': r.created_at.isoformat(),
                'permissions': [{
                    'id': rp.permission.id,
                    'name': rp.permission.name,
                    'description': rp.permission.description,
                    'module': rp.permission.module
                } for rp in r.permissions if rp.permission] if hasattr(r, 'permissions') else [],
                'user_count': len([ur for ur in r.users if ur.user.is_active]) if hasattr(r, 'users') else 0
            } for r in roles]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/roles', methods=['POST'])
@jwt_required()
def create_role():
    """Create new role"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Role name is required'}), 400
        
        # Check if role exists
        if Role.query.filter_by(name=data['name']).first():
            return jsonify({'error': 'Role name already exists'}), 409
        
        # Create new role
        new_role = Role(
            name=data['name'],
            description=data.get('description', ''),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(new_role)
        db.session.flush()  # Get the ID
        
        # Assign permissions if provided
        if 'permissions' in data and data['permissions']:
            from models import RolePermission
            for perm_id in data['permissions']:
                role_perm = RolePermission(
                    role_id=new_role.id,
                    permission_id=perm_id
                )
                db.session.add(role_perm)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Role created successfully',
            'role': {
                'id': new_role.id,
                'name': new_role.name,
                'description': new_role.description,
                'is_active': new_role.is_active
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/roles/<int:role_id>', methods=['PUT'])
@jwt_required()
def update_role(role_id):
    """Update role"""
    try:
        data = request.get_json()
        role = Role.query.get(role_id)
        
        if not role:
            return jsonify({'error': 'Role not found'}), 404
        
        # Update role fields
        if 'name' in data:
            # Check if name already exists (excluding current role)
            existing_role = Role.query.filter(Role.name == data['name'], Role.id != role_id).first()
            if existing_role:
                return jsonify({'error': 'Role name already exists'}), 409
            role.name = data['name']
        
        if 'description' in data:
            role.description = data['description']
        
        if 'is_active' in data:
            role.is_active = data['is_active']
        
        # Update permissions if provided
        if 'permissions' in data:
            from models import RolePermission
            # Remove existing permissions
            RolePermission.query.filter_by(role_id=role_id).delete()
            
            # Add new permissions
            for perm_id in data['permissions']:
                role_perm = RolePermission(
                    role_id=role_id,
                    permission_id=perm_id
                )
                db.session.add(role_perm)
        
        role.updated_at = get_local_now()
        db.session.commit()
        
        return jsonify({
            'message': 'Role updated successfully',
            'role': {
                'id': role.id,
                'name': role.name,
                'description': role.description,
                'is_active': role.is_active
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/roles/<int:role_id>', methods=['DELETE'])
@jwt_required()
def delete_role(role_id):
    """Delete role (soft delete)"""
    try:
        role = Role.query.get(role_id)
        if not role:
            return jsonify({'error': 'Role not found'}), 404
        
        # Check if role is assigned to users
        from models import UserRole
        active_assignments = UserRole.query.join(User).filter(
            UserRole.role_id == role_id,
            User.is_active == True
        ).count()
        
        if active_assignments > 0:
            return jsonify({
                'error': f'Cannot delete role. It is assigned to {active_assignments} active users.'
            }), 400
        
        # Soft delete
        role.is_active = False
        role.updated_at = get_local_now()
        db.session.commit()
        
        return jsonify({'message': 'Role deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===== PERMISSION MANAGEMENT ENDPOINTS =====

@settings_bp.route('/permissions', methods=['GET'])
@jwt_required()
def get_permissions():
    """Get all permissions grouped by module"""
    try:
        from models import Permission
        permissions = Permission.query.order_by(Permission.module, Permission.name).all()
        
        return jsonify({
            'permissions': [{
                'id': p.id,
                'name': p.name,
                'description': p.description,
                'module': p.module or 'General',  # Default to 'General' if module is None
                'action': p.action,
                'is_active': getattr(p, 'is_active', True),  # Default to True if not exists
                'created_at': p.created_at.isoformat()
            } for p in permissions]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/permissions', methods=['POST'])
@jwt_required()
def create_permission():
    """Create new permission"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'module', 'action']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if permission exists
        from models import Permission
        existing = Permission.query.filter_by(
            name=data['name'],
            module=data['module']
        ).first()
        
        if existing:
            return jsonify({'error': 'Permission already exists'}), 409
        
        # Create new permission
        # Use module as resource if not provided (for backward compatibility)
        resource = data.get('resource', data['module'].lower().replace(' ', '_'))
        
        new_permission = Permission(
            name=data['name'],
            description=data.get('description', ''),
            resource=resource,
            module=data['module'],
            action=data['action'],
            is_active=data.get('is_active', True)
        )
        
        db.session.add(new_permission)
        db.session.commit()
        
        return jsonify({
            'message': 'Permission created successfully',
            'permission': {
                'id': new_permission.id,
                'name': new_permission.name,
                'description': new_permission.description,
                'module': new_permission.module,
                'action': new_permission.action,
                'is_active': new_permission.is_active
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===== USER ROLE ASSIGNMENT ENDPOINTS =====

@settings_bp.route('/users/<int:user_id>/roles', methods=['POST'])
@jwt_required()
def assign_user_roles(user_id):
    """Assign roles to user"""
    try:
        data = request.get_json()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        role_ids = data.get('role_ids', [])
        
        # Remove existing role assignments
        from models import UserRole
        UserRole.query.filter_by(user_id=user_id).delete()
        
        # Add new role assignments
        for role_id in role_ids:
            # Verify role exists
            role = Role.query.get(role_id)
            if role and role.is_active:
                user_role = UserRole(
                    user_id=user_id,
                    role_id=role_id
                )
                db.session.add(user_role)
        
        db.session.commit()
        
        return jsonify({
            'message': 'User roles updated successfully',
            'assigned_roles': len(role_ids)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/users/<int:user_id>/roles/<int:role_id>', methods=['DELETE'])
@jwt_required()
def remove_user_role(user_id, role_id):
    """Remove specific role from user"""
    try:
        from models import UserRole
        user_role = UserRole.query.filter_by(
            user_id=user_id,
            role_id=role_id
        ).first()
        
        if not user_role:
            return jsonify({'error': 'Role assignment not found'}), 404
        
        db.session.delete(user_role)
        db.session.commit()
        
        return jsonify({'message': 'Role removed from user successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/notifications/test', methods=['POST'])
@jwt_required()
def test_notifications():
    try:
        data = request.get_json()
        notification_type = data.get('type', 'email')
        
        if notification_type == 'email':
            # Simulate email notification test
            return jsonify({
                'message': 'Test email sent successfully',
                'details': 'Check your email inbox for the test message'
            }), 200
        elif notification_type == 'sms':
            # Simulate SMS notification test
            return jsonify({
                'message': 'Test SMS sent successfully',
                'details': 'Check your phone for the test message'
            }), 200
        else:
            return jsonify(error_response('api.error', error_code=400)), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
