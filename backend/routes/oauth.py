"""
Google OAuth Authentication
============================
Handles Google Sign-In for the ERP system.

Setup:
1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: http://localhost:5000/api/oauth/google/callback
4. Add to .env:
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
"""

import os
import secrets
from flask import Blueprint, request, jsonify, redirect, session, url_for, current_app
from flask_jwt_extended import create_access_token, create_refresh_token
from authlib.integrations.flask_client import OAuth
from models import db, User, Role, UserRole
from datetime import datetime
from utils.timezone import get_local_now, get_local_today

oauth_bp = Blueprint('oauth', __name__)

# OAuth setup will be done in init_oauth function
oauth = OAuth()

def init_oauth(app):
    """Initialize OAuth with Flask app"""
    oauth.init_app(app)
    
    # Register Google OAuth
    oauth.register(
        name='google',
        client_id=os.getenv('GOOGLE_CLIENT_ID'),
        client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={
            'scope': 'openid email profile'
        }
    )

def get_or_create_user_from_google(google_user_info: dict) -> tuple[User, bool]:
    """
    Get existing user or create new one from Google user info.
    Returns (user, is_new_user)
    """
    email = google_user_info.get('email')
    
    # Check if user exists by email
    user = User.query.filter_by(email=email).first()
    
    if user:
        # Update last login
        user.last_login = get_local_now()
        db.session.commit()
        return user, False
    
    # Create new user
    # Generate username from email (before @)
    base_username = email.split('@')[0]
    username = base_username
    counter = 1
    
    # Ensure unique username
    while User.query.filter_by(username=username).first():
        username = f"{base_username}{counter}"
        counter += 1
    
    # Create user with random password (won't be used for OAuth login)
    new_user = User(
        username=username,
        email=email,
        password_hash='',  # Will be set below
        full_name=google_user_info.get('name', email),
        is_active=True,
        is_admin=False,
        last_login=get_local_now()
    )
    # Set a random password (user won't need it for Google login)
    new_user.set_password(secrets.token_urlsafe(32))
    
    db.session.add(new_user)
    db.session.flush()
    
    # Assign default role (e.g., "Viewer" or first available non-admin role)
    default_role = Role.query.filter(
        Role.is_active == True,
        Role.name.in_(['Viewer', 'Staff', 'Employee'])
    ).first()
    
    if not default_role:
        # Get any non-admin role
        excluded = ['Super Admin', 'Direktur Utama', 'IT Admin', 'admin']
        default_role = Role.query.filter(
            Role.is_active == True,
            ~Role.name.in_(excluded)
        ).first()
    
    if default_role:
        user_role = UserRole(user_id=new_user.id, role_id=default_role.id)
        db.session.add(user_role)
    
    db.session.commit()
    
    # Send welcome email
    try:
        from utils.email_service import get_email_service
        email_service = get_email_service()
        if email_service.is_configured():
            email_service.send_welcome_email(
                to=new_user.email,
                username=new_user.username,
                full_name=new_user.full_name
            )
    except Exception as e:
        print(f"Failed to send welcome email: {e}")
    
    return new_user, True


@oauth_bp.route('/google/login')
def google_login():
    """Initiate Google OAuth login"""
    # Check if OAuth is configured
    if not os.getenv('GOOGLE_CLIENT_ID'):
        return jsonify({'error': 'Google OAuth not configured'}), 503
    
    # Generate state for CSRF protection
    state = secrets.token_urlsafe(32)
    session['oauth_state'] = state
    
    # Get redirect URI - support production domain, LAN, and localhost
    host = request.host.split(':')[0]
    
    # Determine protocol and port based on environment
    if host in ['localhost', '127.0.0.1'] or host.startswith('192.168.'):
        # Development/LAN - use http and port 3000
        default_redirect = f"http://{host}:3000/oauth/callback"
    else:
        # Production domain (e.g., falmaco.com) - use https without port
        default_redirect = f"https://{host}/oauth/callback"
    
    redirect_uri = request.args.get('redirect_uri', default_redirect)
    session['oauth_redirect'] = redirect_uri
    
    # Redirect to Google - construct callback URL properly for production
    if host in ['localhost', '127.0.0.1'] or host.startswith('192.168.'):
        callback_url = url_for('oauth.google_callback', _external=True)
    else:
        # For production, use the configured domain
        callback_url = f"https://{host}/api/oauth/google/callback"
    
    return oauth.google.authorize_redirect(callback_url, state=state)


@oauth_bp.route('/google/callback')
def google_callback():
    """Handle Google OAuth callback"""
    try:
        # Verify state
        state = request.args.get('state')
        if state != session.get('oauth_state'):
            return redirect_with_error('Invalid state parameter')
        
        # Get token from Google
        token = oauth.google.authorize_access_token()
        
        # Get user info
        user_info = token.get('userinfo')
        if not user_info:
            user_info = oauth.google.userinfo()
        
        if not user_info or not user_info.get('email'):
            return redirect_with_error('Failed to get user info from Google')
        
        # Get or create user
        user, is_new = get_or_create_user_from_google(user_info)
        
        if not user.is_active:
            return redirect_with_error('Account is inactive')
        
        # Get user roles
        try:
            user_roles = [ur.role.name for ur in user.roles if ur.role]
        except:
            user_roles = []
        
        # Create JWT tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        # Redirect to frontend with tokens - support production domain
        host = request.host.split(':')[0]
        if host in ['localhost', '127.0.0.1'] or host.startswith('192.168.'):
            default_redirect = f"http://{host}:3000/oauth/callback"
        else:
            default_redirect = f"https://{host}/oauth/callback"
        frontend_redirect = session.get('oauth_redirect', default_redirect)
        
        # Clean up session
        session.pop('oauth_state', None)
        session.pop('oauth_redirect', None)
        
        # Redirect with tokens as query params (frontend will handle them)
        redirect_url = (
            f"{frontend_redirect}"
            f"?access_token={access_token}"
            f"&refresh_token={refresh_token}"
            f"&user_id={user.id}"
            f"&username={user.username}"
            f"&email={user.email}"
            f"&full_name={user.full_name}"
            f"&is_new={'true' if is_new else 'false'}"
        )
        
        return redirect(redirect_url)
        
    except Exception as e:
        print(f"OAuth error: {e}")
        return redirect_with_error(str(e))


def redirect_with_error(error_message: str):
    """Redirect to frontend with error"""
    # Use session redirect or construct from request host - support production domain
    host = request.host.split(':')[0]
    if host in ['localhost', '127.0.0.1'] or host.startswith('192.168.'):
        default_redirect = f"http://{host}:3000/oauth/callback"
    else:
        default_redirect = f"https://{host}/oauth/callback"
    frontend_redirect = session.get('oauth_redirect', default_redirect)
    session.pop('oauth_state', None)
    session.pop('oauth_redirect', None)
    return redirect(f"{frontend_redirect}?error={error_message}")


@oauth_bp.route('/google/status')
def google_status():
    """Check if Google OAuth is configured"""
    configured = bool(os.getenv('GOOGLE_CLIENT_ID') and os.getenv('GOOGLE_CLIENT_SECRET'))
    return jsonify({
        'configured': configured,
        'login_url': '/api/oauth/google/login' if configured else None
    })
