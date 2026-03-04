from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from models import db, User, Role, UserRole
from datetime import datetime
from utils.i18n import success_response, error_response, get_message
from utils.timezone import get_local_now, get_local_today, utc_to_local

auth_bp = Blueprint('auth', __name__)

def get_bcrypt():
    """Get bcrypt instance from current app"""
    return current_app.bcrypt

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify(error_response('validation.required_field', field='Username and Password')), 400
        
        # Find user with eager loading of roles
        from sqlalchemy.orm import joinedload
        user = User.query.options(
            joinedload(User.roles).joinedload(UserRole.role)
        ).filter_by(username=username).first()
        
        if not user or not user.check_password(password):
            return jsonify(error_response('auth.invalid_credentials')), 401
        
        if not user.is_active:
            return jsonify(error_response('auth.account_inactive')), 403
        
        # Update last login
        user.last_login = get_local_now()
        db.session.commit()
        
        # Get user roles safely
        try:
            user_roles = [ur.role.name for ur in user.roles if ur.role]
        except Exception as e:
            print(f"Error getting user roles: {e}")
            user_roles = []
        
        # Create tokens with string identity
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'is_admin': user.is_admin,
                'is_super_admin': getattr(user, 'is_super_admin', False),
                'roles': user_roles
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'full_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if user exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 409
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 409
        
        # Create new user
        new_user = User(
            username=data['username'],
            email=data['email'],
            password_hash='',  # Will be set below
            full_name=data['full_name'],
            is_active=True,
            is_admin=False
        )
        new_user.set_password(data['password'])
        
        db.session.add(new_user)
        db.session.flush()  # Get the user ID
        
        # Assign role if provided
        role_id = data.get('role_id')
        if role_id:
            from models import Role, UserRole
            # Validate role exists and is not admin role
            excluded_roles = ['Super Admin', 'Direktur Utama', 'Direktur Operasional', 
                             'Direktur Keuangan', 'Direktur HRD', 'IT Admin']
            role = Role.query.filter(
                Role.id == role_id,
                Role.is_active == True,
                ~Role.name.in_(excluded_roles)
            ).first()
            
            if role:
                user_role = UserRole(user_id=new_user.id, role_id=role.id)
                db.session.add(user_role)
        
        db.session.commit()
        
        # Send welcome email (async, don't block registration)
        try:
            from utils.email_service import get_email_service
            email_service = get_email_service()
            if email_service.is_configured():
                email_service.send_welcome_email(
                    to=new_user.email,
                    username=new_user.username,
                    full_name=new_user.full_name
                )
        except Exception as email_error:
            print(f"Failed to send welcome email: {email_error}")
        
        # Get assigned roles for response
        assigned_roles = []
        if hasattr(new_user, 'roles'):
            assigned_roles = [{'id': ur.role.id, 'name': ur.role.name} for ur in new_user.roles if ur.role]
        
        return jsonify({
            'message': 'User registered successfully',
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'email': new_user.email,
                'full_name': new_user.full_name,
                'roles': assigned_roles
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    try:
        user_id = get_jwt_identity()
        # Get user with eager loading of roles
        from sqlalchemy.orm import joinedload
        user = User.query.options(
            joinedload(User.roles).joinedload(UserRole.role)
        ).get(int(user_id))  # Convert string to int
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get user roles safely
        try:
            user_roles = [ur.role.name for ur in user.roles if ur.role]
        except Exception as e:
            print(f"Error getting user roles in /me: {e}")
            user_roles = []
        
        return jsonify({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'is_active': user.is_active,
                'is_admin': user.is_admin,
                'is_super_admin': getattr(user, 'is_super_admin', False),
                'roles': user_roles,
                'last_login': utc_to_local(user.last_login).isoformat() if user.last_login else None,
                'created_at': utc_to_local(user.created_at).isoformat() if user.created_at else None
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        user_id = get_jwt_identity()
        access_token = create_access_token(identity=user_id)  # user_id already string
        
        return jsonify({
            'access_token': access_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/extend-session', methods=['POST'])
@jwt_required()
def extend_session():
    """Extend user session by issuing a new access token"""
    try:
        user_id = get_jwt_identity()
        
        # Verify user still exists and is active
        user = User.query.get(int(user_id))
        if not user:
            return jsonify({'error': 'User not found'}), 404
        if not user.is_active:
            return jsonify({'error': 'User account is inactive'}), 403
        
        # Create new access token
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'Session extended successfully',
            'access_token': access_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """User logout endpoint"""
    # In a production system, you would add the token to a blacklist
    return jsonify({'message': 'Logout successful'}), 200

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current and new passwords are required'}), 400
        
        user = User.query.get(int(user_id))  # Convert string to int
        
        if not user or not user.check_password(current_password):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Update password using set_password method
        user.set_password(new_password)
        db.session.commit()
        
        # Send password changed notification email
        try:
            from utils.email_service import get_email_service
            email_service = get_email_service()
            if email_service.is_configured():
                email_service.send_password_changed(
                    to=user.email,
                    full_name=user.full_name
                )
        except Exception as email_error:
            print(f"Failed to send password changed email: {email_error}")
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users for assignment dropdowns"""
    try:
        users = User.query.filter_by(is_active=True).all()
        return jsonify({
            'users': [{
                'id': u.id,
                'name': u.full_name or u.username,
                'username': u.username,
                'email': u.email
            } for u in users]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/permissions', methods=['GET'])
@jwt_required()
def get_user_permissions():
    """Get current user's permissions for navigation RBAC"""
    try:
        from sqlalchemy.orm import joinedload
        from models import RolePermission, Permission
        
        user_id = get_jwt_identity()
        user = User.query.options(
            joinedload(User.roles).joinedload(UserRole.role).joinedload(Role.permissions).joinedload(RolePermission.permission)
        ).get(int(user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Super admin or is_admin gets all permissions
        if user.is_admin:
            all_permissions = Permission.query.filter_by(is_active=True).all()
            permissions = [p.name for p in all_permissions]
            modules = list(set([p.module for p in all_permissions]))
        else:
            # Collect permissions from all user's roles
            permissions = set()
            modules = set()
            
            for user_role in user.roles:
                if user_role.role and user_role.role.is_active:
                    for role_perm in user_role.role.permissions:
                        if role_perm.permission and role_perm.permission.is_active:
                            permissions.add(role_perm.permission.name)
                            modules.add(role_perm.permission.module)
            
            permissions = list(permissions)
            modules = list(modules)
        
        # Get roles
        roles = [ur.role.name for ur in user.roles if ur.role and ur.role.is_active]
        
        return jsonify({
            'user_id': user.id,
            'username': user.username,
            'is_admin': user.is_admin,
            'is_super_admin': getattr(user, 'is_super_admin', False),
            'roles': roles,
            'permissions': permissions,
            'modules': modules
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/check-permission', methods=['POST'])
@jwt_required()
def check_permission():
    """Check if current user has specific permission"""
    try:
        from sqlalchemy.orm import joinedload
        from models import RolePermission
        
        data = request.get_json()
        permission_name = data.get('permission')
        
        if not permission_name:
            return jsonify({'error': 'Permission name is required'}), 400
        
        user_id = get_jwt_identity()
        user = User.query.options(
            joinedload(User.roles).joinedload(UserRole.role).joinedload(Role.permissions).joinedload(RolePermission.permission)
        ).get(int(user_id))
        
        if not user:
            return jsonify({'has_permission': False}), 200
        
        # Super admin has all permissions
        if user.is_admin:
            return jsonify({'has_permission': True}), 200
        
        # Check user's roles for the permission
        for user_role in user.roles:
            if user_role.role and user_role.role.is_active:
                for role_perm in user_role.role.permissions:
                    if role_perm.permission and role_perm.permission.name == permission_name:
                        return jsonify({'has_permission': True}), 200
        
        return jsonify({'has_permission': False}), 200
        
    except Exception as e:
        return jsonify({'error': str(e), 'has_permission': False}), 500


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile - for new users completing their profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update basic profile fields
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'department' in data:
            user.department = data['department']
        if 'position' in data:
            user.position = data['position']
        if 'bio' in data:
            user.bio = data['bio']
        
        # Handle role request
        requested_role = data.get('requested_role')
        if requested_role:
            # Find the role
            role = Role.query.filter_by(name=requested_role, is_active=True).first()
            if role:
                # Check if user already has this role
                existing_role = UserRole.query.filter_by(
                    user_id=user.id, 
                    role_id=role.id
                ).first()
                
                if not existing_role:
                    # Add the role to user
                    user_role = UserRole(user_id=user.id, role_id=role.id)
                    db.session.add(user_role)
                    
                    # Log the role assignment
                    print(f"Role '{requested_role}' assigned to user {user.username}")
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'phone': user.phone,
                'department': user.department,
                'position': user.position,
                'bio': user.bio
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating profile: {e}")
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get user roles
        user_roles = []
        try:
            user_roles = [ur.role.name for ur in user.roles if ur.role]
        except:
            pass
        
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'phone': getattr(user, 'phone', None),
                'department': getattr(user, 'department', None),
                'position': getattr(user, 'position', None),
                'bio': getattr(user, 'bio', None),
                'is_admin': user.is_admin,
                'is_super_admin': user.is_super_admin,
                'is_active': user.is_active,
                'last_login': utc_to_local(user.last_login).isoformat() if user.last_login else None,
                'created_at': utc_to_local(user.created_at).isoformat() if user.created_at else None,
                'roles': user_roles
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== PASSWORD RESET ====================

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request password reset email"""
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        # Always return success to prevent email enumeration
        if user:
            try:
                from utils.email_service import get_email_service
                import secrets
                from datetime import timedelta
                
                # Generate reset token
                reset_token = secrets.token_urlsafe(32)
                user.reset_token = reset_token
                user.reset_token_expires = get_local_now() + timedelta(hours=1)
                db.session.commit()
                
                # Send reset email
                email_service = get_email_service()
                if email_service.is_configured():
                    email_service.send_password_reset(
                        to=user.email,
                        reset_token=reset_token,
                        full_name=user.full_name
                    )
            except Exception as e:
                print(f"Failed to send reset email: {e}")
        
        return jsonify({
            'message': 'If an account with that email exists, a password reset link has been sent.'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using token"""
    try:
        data = request.get_json()
        token = data.get('token')
        new_password = data.get('password')
        
        if not token or not new_password:
            return jsonify({'error': 'Token and password are required'}), 400
        
        user = User.query.filter_by(reset_token=token).first()
        
        if not user or not user.reset_token_expires:
            return jsonify({'error': 'Invalid or expired reset token'}), 400
        
        if user.reset_token_expires < get_local_now():
            return jsonify({'error': 'Reset token has expired'}), 400
        
        # Update password
        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expires = None
        db.session.commit()
        
        return jsonify({'message': 'Password reset successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== GOOGLE OAUTH ====================

@auth_bp.route('/google/url', methods=['GET'])
def get_google_auth_url():
    """Get Google OAuth URL"""
    try:
        client_id = current_app.config.get('GOOGLE_CLIENT_ID')
        redirect_uri = current_app.config.get('GOOGLE_REDIRECT_URI')
        
        if not client_id:
            return jsonify({'error': 'Google OAuth not configured'}), 500
        
        # Build OAuth URL
        params = {
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'response_type': 'code',
            'scope': 'openid email profile',
            'access_type': 'offline',
            'prompt': 'consent'
        }
        
        from urllib.parse import urlencode
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
        
        return jsonify({'url': auth_url}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/google/callback', methods=['POST'])
def google_callback():
    """Handle Google OAuth callback"""
    try:
        import requests
        
        data = request.get_json()
        code = data.get('code')
        
        if not code:
            return jsonify({'error': 'Authorization code is required'}), 400
        
        client_id = current_app.config.get('GOOGLE_CLIENT_ID')
        client_secret = current_app.config.get('GOOGLE_CLIENT_SECRET')
        redirect_uri = current_app.config.get('GOOGLE_REDIRECT_URI')
        
        if not client_id or not client_secret:
            return jsonify({'error': 'Google OAuth not configured'}), 500
        
        # Exchange code for tokens
        token_response = requests.post(
            'https://oauth2.googleapis.com/token',
            data={
                'code': code,
                'client_id': client_id,
                'client_secret': client_secret,
                'redirect_uri': redirect_uri,
                'grant_type': 'authorization_code'
            }
        )
        
        if token_response.status_code != 200:
            return jsonify({'error': 'Failed to exchange authorization code'}), 400
        
        tokens = token_response.json()
        access_token = tokens.get('access_token')
        
        # Get user info from Google
        userinfo_response = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if userinfo_response.status_code != 200:
            return jsonify({'error': 'Failed to get user info from Google'}), 400
        
        google_user = userinfo_response.json()
        email = google_user.get('email')
        name = google_user.get('name', '')
        google_id = google_user.get('id')
        
        if not email:
            return jsonify({'error': 'Email not provided by Google'}), 400
        
        # Find or create user
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # Create new user from Google account
            username = email.split('@')[0]
            # Ensure unique username
            base_username = username
            counter = 1
            while User.query.filter_by(username=username).first():
                username = f"{base_username}{counter}"
                counter += 1
            
            user = User(
                username=username,
                email=email,
                password_hash='',  # No password for OAuth users
                full_name=name,
                is_active=True,
                is_admin=False,
                google_id=google_id
            )
            db.session.add(user)
            db.session.commit()
            
            # Assign default "Viewer" role to new Google OAuth users
            from models.user import Role, UserRole
            viewer_role = Role.query.filter_by(name='Viewer').first()
            if viewer_role:
                user_role = UserRole(user_id=user.id, role_id=viewer_role.id)
                db.session.add(user_role)
                db.session.commit()
        else:
            # Update Google ID if not set
            if not user.google_id:
                user.google_id = google_id
                db.session.commit()
        
        if not user.is_active:
            return jsonify({'error': 'Account is inactive'}), 403
        
        # Update last login
        user.last_login = get_local_now()
        db.session.commit()
        
        # Get user roles
        user_roles = []
        try:
            user_roles = [ur.role.name for ur in user.roles if ur.role]
        except:
            pass
        
        # Create JWT tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'is_admin': user.is_admin,
                'is_super_admin': getattr(user, 'is_super_admin', False),
                'roles': user_roles
            }
        }), 200
        
    except Exception as e:
        print(f"Google OAuth error: {e}")
        return jsonify({'error': str(e)}), 500
