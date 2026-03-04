"""
Group Chat Routes - Discord-style group chat API
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import secrets
import string

from models import db
from models.user import User
from models.group_chat import (
    ChatServer, ChatCategory, ChatChannel, ChatMessage, ChatAttachment,
    ChatReaction, ChatMention, ChatPinnedMessage, ChatServerRole,
    ChatServerRoleMember, ChatUserStatus, ChatUnreadMessage,
    server_members, channel_members
)
from utils.timezone import get_local_now, get_local_today

chat_bp = Blueprint('chat', __name__)


def generate_invite_code(length=8):
    """Generate a random invite code"""
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))


# Roles that are excluded from group chat
EXCLUDED_ROLES = ['Operator', 'Helper', 'operator', 'helper']


def is_user_eligible_for_chat(user):
    """Check if user is eligible for group chat (not Operator/Helper)"""
    try:
        user_roles = [ur.role.name for ur in user.roles if ur.role]
        # User is eligible if they have NO excluded roles, or have other roles too
        for role in user_roles:
            if role.lower() in [r.lower() for r in EXCLUDED_ROLES]:
                # Check if user has any other non-excluded role
                other_roles = [r for r in user_roles if r.lower() not in [er.lower() for er in EXCLUDED_ROLES]]
                if not other_roles:
                    return False
        return True
    except:
        return True  # Default to eligible if can't check


def get_or_create_company_server():
    """Get or create the default company-wide chat server"""
    server = ChatServer.query.filter_by(name='ERP Company Chat').first()
    
    if not server:
        # Create default company server
        server = ChatServer(
            name='ERP Company Chat',
            description='Server chat untuk seluruh karyawan perusahaan',
            icon='🏢',
            owner_id=1,  # Admin user
            is_public=True,
            invite_code=None
        )
        db.session.add(server)
        db.session.flush()
        
        # Create default role
        default_role = ChatServerRole(
            server_id=server.id,
            name='@everyone',
            is_default=True,
            position=0
        )
        db.session.add(default_role)
        
        # Create default categories and channels
        general_category = ChatCategory(
            server_id=server.id,
            name='Umum',
            order=0
        )
        db.session.add(general_category)
        db.session.flush()
        
        # General channel
        general_channel = ChatChannel(
            server_id=server.id,
            category_id=general_category.id,
            name='general',
            description='Diskusi umum',
            channel_type='text',
            order=0
        )
        db.session.add(general_channel)
        
        # Announcements channel
        announcement_channel = ChatChannel(
            server_id=server.id,
            category_id=general_category.id,
            name='pengumuman',
            description='Pengumuman penting dari manajemen',
            channel_type='text',
            order=1
        )
        db.session.add(announcement_channel)
        
        # Department category
        dept_category = ChatCategory(
            server_id=server.id,
            name='Departemen',
            order=1
        )
        db.session.add(dept_category)
        db.session.flush()
        
        # Department channels
        for idx, dept in enumerate(['produksi', 'sales', 'finance', 'hr', 'warehouse']):
            channel = ChatChannel(
                server_id=server.id,
                category_id=dept_category.id,
                name=dept,
                description=f'Diskusi departemen {dept}',
                channel_type='text',
                order=idx
            )
            db.session.add(channel)
        
        db.session.commit()
    
    return server


def auto_join_company_server(user):
    """Auto join user to company server if eligible"""
    if not is_user_eligible_for_chat(user):
        return None
    
    server = get_or_create_company_server()
    
    if user not in server.members:
        server.members.append(user)
        
        # Assign default role
        default_role = ChatServerRole.query.filter_by(server_id=server.id, is_default=True).first()
        if default_role:
            existing = ChatServerRoleMember.query.filter_by(role_id=default_role.id, user_id=user.id).first()
            if not existing:
                role_member = ChatServerRoleMember(
                    role_id=default_role.id,
                    user_id=user.id
                )
                db.session.add(role_member)
        
        db.session.commit()
    
    return server


# ==================== SERVER ROUTES ====================

@chat_bp.route('/servers', methods=['GET'])
@jwt_required()
def get_servers():
    """Get the company server - all eligible users share one server"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if user is eligible for chat
    if not is_user_eligible_for_chat(user):
        return jsonify({
            'error': 'Akses chat tidak tersedia untuk role Anda',
            'joined_servers': [],
            'available_servers': []
        }), 403
    
    # Auto join to company server
    server = auto_join_company_server(user)
    
    if not server:
        return jsonify({
            'joined_servers': [],
            'available_servers': []
        })
    
    return jsonify({
        'joined_servers': [server.to_dict()],
        'available_servers': []  # No other servers available - single server system
    })


@chat_bp.route('/servers', methods=['POST'])
@jwt_required()
def create_server():
    """Create a new chat server"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data.get('name'):
        return jsonify({'error': 'Server name is required'}), 400
    
    # Create server
    server = ChatServer(
        name=data['name'],
        description=data.get('description'),
        icon=data.get('icon'),
        owner_id=current_user_id,
        is_public=data.get('is_public', True),
        invite_code=generate_invite_code() if not data.get('is_public', True) else None
    )
    db.session.add(server)
    db.session.flush()
    
    # Add owner as member
    owner = User.query.get(current_user_id)
    server.members.append(owner)
    
    # Create default role
    default_role = ChatServerRole(
        server_id=server.id,
        name='@everyone',
        is_default=True,
        position=0
    )
    db.session.add(default_role)
    
    # Create default category and channel
    general_category = ChatCategory(
        server_id=server.id,
        name='Text Channels',
        order=0
    )
    db.session.add(general_category)
    db.session.flush()
    
    general_channel = ChatChannel(
        server_id=server.id,
        category_id=general_category.id,
        name='general',
        description='General discussion',
        channel_type='text',
        order=0
    )
    db.session.add(general_channel)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Server created successfully',
        'server': server.to_dict(include_channels=True)
    }), 201


@chat_bp.route('/servers/<int:server_id>', methods=['GET'])
@jwt_required()
def get_server(server_id):
    """Get server details with channels"""
    current_user_id = get_jwt_identity()
    server = ChatServer.query.get_or_404(server_id)
    
    # Check if user is member
    user = User.query.get(current_user_id)
    if user not in server.members and not server.is_public:
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify({
        'server': server.to_dict(include_members=True, include_channels=True)
    })


@chat_bp.route('/servers/<int:server_id>', methods=['PUT'])
@jwt_required()
def update_server(server_id):
    """Update server settings"""
    current_user_id = get_jwt_identity()
    server = ChatServer.query.get_or_404(server_id)
    
    # Check if user is owner or has permission
    if server.owner_id != current_user_id:
        return jsonify({'error': 'Only server owner can update settings'}), 403
    
    data = request.get_json()
    
    if 'name' in data:
        server.name = data['name']
    if 'description' in data:
        server.description = data['description']
    if 'icon' in data:
        server.icon = data['icon']
    if 'is_public' in data:
        server.is_public = data['is_public']
        if not data['is_public'] and not server.invite_code:
            server.invite_code = generate_invite_code()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Server updated successfully',
        'server': server.to_dict()
    })


@chat_bp.route('/servers/<int:server_id>', methods=['DELETE'])
@jwt_required()
def delete_server(server_id):
    """Delete a server"""
    current_user_id = get_jwt_identity()
    server = ChatServer.query.get_or_404(server_id)
    
    if server.owner_id != current_user_id:
        return jsonify({'error': 'Only server owner can delete server'}), 403
    
    db.session.delete(server)
    db.session.commit()
    
    return jsonify({'message': 'Server deleted successfully'})


@chat_bp.route('/servers/<int:server_id>/available-users', methods=['GET'])
@jwt_required()
def get_available_users(server_id):
    """Get users that can be invited to the server"""
    current_user_id = get_jwt_identity()
    server = ChatServer.query.get_or_404(server_id)
    
    # Get current member IDs
    member_ids = [m.id for m in server.members]
    
    # Get all active users who are not members and are eligible for chat
    all_users = User.query.filter(
        User.is_active == True,
        ~User.id.in_(member_ids)
    ).all()
    
    # Filter out users with excluded roles (Operator, Helper)
    eligible_users = []
    for user in all_users:
        if is_user_eligible_for_chat(user):
            eligible_users.append({
                'id': user.id,
                'username': user.username,
                'full_name': user.full_name or user.username,
                'email': user.email
            })
    
    return jsonify({'users': eligible_users})


@chat_bp.route('/servers/<int:server_id>/invite', methods=['POST'])
@jwt_required()
def invite_user_to_server(server_id):
    """Invite a user to the server"""
    current_user_id = get_jwt_identity()
    server = ChatServer.query.get_or_404(server_id)
    data = request.get_json()
    
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user in server.members:
        return jsonify({'error': 'User is already a member'}), 400
    
    # Check if user is eligible for chat
    if not is_user_eligible_for_chat(user):
        return jsonify({'error': 'User tidak eligible untuk chat (role Operator/Helper)'}), 400
    
    # Add user to server
    server.members.append(user)
    
    # Assign default role
    default_role = ChatServerRole.query.filter_by(server_id=server_id, is_default=True).first()
    if default_role:
        existing = ChatServerRoleMember.query.filter_by(role_id=default_role.id, user_id=user_id).first()
        if not existing:
            role_member = ChatServerRoleMember(
                role_id=default_role.id,
                user_id=user_id
            )
            db.session.add(role_member)
    
    db.session.commit()
    
    return jsonify({
        'message': f'{user.full_name or user.username} berhasil diundang',
        'user': {
            'id': user.id,
            'username': user.username,
            'full_name': user.full_name
        }
    })


@chat_bp.route('/servers/<int:server_id>/join', methods=['POST'])
@jwt_required()
def join_server(server_id):
    """Join a server"""
    current_user_id = get_jwt_identity()
    server = ChatServer.query.get_or_404(server_id)
    user = User.query.get(current_user_id)
    
    if user in server.members:
        return jsonify({'error': 'Already a member'}), 400
    
    # Check if server is public or has valid invite
    if not server.is_public:
        invite_code = request.get_json().get('invite_code')
        if invite_code != server.invite_code:
            return jsonify({'error': 'Invalid invite code'}), 403
    
    server.members.append(user)
    
    # Assign default role
    default_role = ChatServerRole.query.filter_by(server_id=server_id, is_default=True).first()
    if default_role:
        role_member = ChatServerRoleMember(
            role_id=default_role.id,
            user_id=current_user_id
        )
        db.session.add(role_member)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Joined server successfully',
        'server': server.to_dict(include_channels=True)
    })


@chat_bp.route('/servers/<int:server_id>/leave', methods=['POST'])
@jwt_required()
def leave_server(server_id):
    """Leave a server"""
    current_user_id = get_jwt_identity()
    server = ChatServer.query.get_or_404(server_id)
    user = User.query.get(current_user_id)
    
    if user not in server.members:
        return jsonify({'error': 'Not a member'}), 400
    
    if server.owner_id == current_user_id:
        return jsonify({'error': 'Owner cannot leave server. Transfer ownership or delete server.'}), 400
    
    server.members.remove(user)
    
    # Remove role assignments
    ChatServerRoleMember.query.filter_by(user_id=current_user_id).filter(
        ChatServerRoleMember.role_id.in_([r.id for r in server.roles])
    ).delete(synchronize_session=False)
    
    db.session.commit()
    
    return jsonify({'message': 'Left server successfully'})


@chat_bp.route('/servers/join/<invite_code>', methods=['POST'])
@jwt_required()
def join_by_invite(invite_code):
    """Join server by invite code"""
    current_user_id = get_jwt_identity()
    server = ChatServer.query.filter_by(invite_code=invite_code).first()
    
    if not server:
        return jsonify({'error': 'Invalid invite code'}), 404
    
    user = User.query.get(current_user_id)
    
    if user in server.members:
        return jsonify({'error': 'Already a member'}), 400
    
    server.members.append(user)
    db.session.commit()
    
    return jsonify({
        'message': 'Joined server successfully',
        'server': server.to_dict(include_channels=True)
    })


# ==================== CATEGORY ROUTES ====================

@chat_bp.route('/servers/<int:server_id>/categories', methods=['POST'])
@jwt_required()
def create_category(server_id):
    """Create a channel category"""
    current_user_id = get_jwt_identity()
    server = ChatServer.query.get_or_404(server_id)
    
    # Check permission
    if server.owner_id != current_user_id:
        # Check if user has manage_channels permission
        user_roles = ChatServerRoleMember.query.filter_by(user_id=current_user_id).join(ChatServerRole).filter(
            ChatServerRole.server_id == server_id,
            ChatServerRole.can_manage_channels == True
        ).first()
        if not user_roles:
            return jsonify({'error': 'Permission denied'}), 403
    
    data = request.get_json()
    
    if not data.get('name'):
        return jsonify({'error': 'Category name is required'}), 400
    
    # Get max order
    max_order = db.session.query(db.func.max(ChatCategory.order)).filter_by(server_id=server_id).scalar() or 0
    
    category = ChatCategory(
        server_id=server_id,
        name=data['name'],
        order=data.get('order', max_order + 1)
    )
    db.session.add(category)
    db.session.commit()
    
    return jsonify({
        'message': 'Category created successfully',
        'category': category.to_dict()
    }), 201


@chat_bp.route('/categories/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    """Update a category"""
    current_user_id = get_jwt_identity()
    category = ChatCategory.query.get_or_404(category_id)
    server = category.server
    
    if server.owner_id != current_user_id:
        return jsonify({'error': 'Permission denied'}), 403
    
    data = request.get_json()
    
    if 'name' in data:
        category.name = data['name']
    if 'order' in data:
        category.order = data['order']
    if 'is_collapsed' in data:
        category.is_collapsed = data['is_collapsed']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Category updated successfully',
        'category': category.to_dict()
    })


@chat_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    """Delete a category"""
    current_user_id = get_jwt_identity()
    category = ChatCategory.query.get_or_404(category_id)
    server = category.server
    
    if server.owner_id != current_user_id:
        return jsonify({'error': 'Permission denied'}), 403
    
    # Move channels to uncategorized
    for channel in category.channels:
        channel.category_id = None
    
    db.session.delete(category)
    db.session.commit()
    
    return jsonify({'message': 'Category deleted successfully'})


# ==================== CHANNEL ROUTES ====================

@chat_bp.route('/servers/<int:server_id>/channels', methods=['POST'])
@jwt_required()
def create_channel(server_id):
    """Create a new channel"""
    current_user_id = get_jwt_identity()
    server = ChatServer.query.get_or_404(server_id)
    
    # Check permission
    if server.owner_id != current_user_id:
        user_roles = ChatServerRoleMember.query.filter_by(user_id=current_user_id).join(ChatServerRole).filter(
            ChatServerRole.server_id == server_id,
            ChatServerRole.can_manage_channels == True
        ).first()
        if not user_roles:
            return jsonify({'error': 'Permission denied'}), 403
    
    data = request.get_json()
    
    if not data.get('name'):
        return jsonify({'error': 'Channel name is required'}), 400
    
    # Normalize channel name (lowercase, no spaces)
    channel_name = data['name'].lower().replace(' ', '-')
    
    # Get max order
    max_order = db.session.query(db.func.max(ChatChannel.order)).filter_by(
        server_id=server_id,
        category_id=data.get('category_id')
    ).scalar() or 0
    
    channel = ChatChannel(
        server_id=server_id,
        category_id=data.get('category_id'),
        name=channel_name,
        description=data.get('description'),
        channel_type=data.get('channel_type', 'text'),
        is_private=data.get('is_private', False),
        is_locked=data.get('is_locked', False),
        order=data.get('order', max_order + 1),
        topic=data.get('topic'),
        slowmode_seconds=data.get('slowmode_seconds', 0)
    )
    
    # Set password for private channel
    if data.get('is_private') and data.get('password'):
        channel.set_password(data['password'])
    
    db.session.add(channel)
    db.session.flush()
    
    # If private, add creator as allowed member
    if channel.is_private:
        user = User.query.get(current_user_id)
        channel.allowed_members.append(user)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Channel created successfully',
        'channel': channel.to_dict()
    }), 201


@chat_bp.route('/channels/<int:channel_id>/check-access', methods=['GET'])
@jwt_required()
def check_channel_access(channel_id):
    """Check if user has access to private channel"""
    current_user_id = get_jwt_identity()
    channel = ChatChannel.query.get_or_404(channel_id)
    user = User.query.get(current_user_id)
    
    # Server owner always has access
    if channel.server.owner_id == current_user_id:
        return jsonify({'has_access': True})
    
    # Check if user is in allowed members
    if user in channel.allowed_members:
        return jsonify({'has_access': True})
    
    # Not private channel = has access
    if not channel.is_private:
        return jsonify({'has_access': True})
    
    return jsonify({'has_access': False})


@chat_bp.route('/channels/<int:channel_id>/unlock', methods=['POST'])
@jwt_required()
def unlock_channel(channel_id):
    """Unlock private channel with password"""
    current_user_id = get_jwt_identity()
    channel = ChatChannel.query.get_or_404(channel_id)
    user = User.query.get(current_user_id)
    
    if not channel.is_private:
        return jsonify({'error': 'Channel is not private'}), 400
    
    data = request.get_json()
    password = data.get('password', '')
    
    if not channel.check_password(password):
        return jsonify({'error': 'Password salah'}), 403
    
    # Add user to allowed members
    if user not in channel.allowed_members:
        channel.allowed_members.append(user)
        db.session.commit()
    
    return jsonify({'message': 'Channel unlocked successfully'})


@chat_bp.route('/channels/<int:channel_id>', methods=['GET'])
@jwt_required()
def get_channel(channel_id):
    """Get channel details with recent messages"""
    current_user_id = int(get_jwt_identity())
    channel = ChatChannel.query.get_or_404(channel_id)
    server = channel.server
    
    # Check if user is member of server
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Allow access if user is server member, owner, or server is public
    is_server_member = user in server.members
    is_owner = server.owner_id == current_user_id
    
    if not is_server_member and not is_owner and not server.is_public:
        return jsonify({'error': 'Access denied - not a server member'}), 403
    
    # Additional check for private channels
    if channel.is_private and user not in channel.allowed_members and not is_owner:
        return jsonify({'error': 'Access denied - private channel'}), 403
    
    # Get messages
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    messages = channel.messages.filter_by(is_deleted=False).order_by(
        ChatMessage.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)
    
    # Mark as read
    unread = ChatUnreadMessage.query.filter_by(
        user_id=current_user_id,
        channel_id=channel_id
    ).first()
    
    if unread:
        unread.unread_count = 0
        unread.last_read_at = get_local_now()
        if messages.items:
            unread.last_read_message_id = messages.items[0].id
        db.session.commit()
    
    return jsonify({
        'channel': channel.to_dict(),
        'messages': [m.to_dict() for m in reversed(messages.items)],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': messages.total,
            'pages': messages.pages,
            'has_next': messages.has_next,
            'has_prev': messages.has_prev
        }
    })


@chat_bp.route('/channels/<int:channel_id>', methods=['PUT'])
@jwt_required()
def update_channel(channel_id):
    """Update channel settings"""
    current_user_id = get_jwt_identity()
    channel = ChatChannel.query.get_or_404(channel_id)
    server = channel.server
    
    if server.owner_id != current_user_id:
        return jsonify({'error': 'Permission denied'}), 403
    
    data = request.get_json()
    
    if 'name' in data:
        channel.name = data['name'].lower().replace(' ', '-')
    if 'description' in data:
        channel.description = data['description']
    if 'topic' in data:
        channel.topic = data['topic']
    if 'is_private' in data:
        channel.is_private = data['is_private']
    if 'is_locked' in data:
        channel.is_locked = data['is_locked']
    if 'slowmode_seconds' in data:
        channel.slowmode_seconds = data['slowmode_seconds']
    if 'category_id' in data:
        channel.category_id = data['category_id']
    if 'order' in data:
        channel.order = data['order']
    
    # Update password if provided
    if 'password' in data and data['password']:
        channel.set_password(data['password'])
    
    db.session.commit()
    
    return jsonify({
        'message': 'Channel updated successfully',
        'channel': channel.to_dict()
    })


@chat_bp.route('/channels/<int:channel_id>', methods=['DELETE'])
@jwt_required()
def delete_channel(channel_id):
    """Delete a channel"""
    current_user_id = get_jwt_identity()
    channel = ChatChannel.query.get_or_404(channel_id)
    server = channel.server
    
    if server.owner_id != current_user_id:
        return jsonify({'error': 'Permission denied'}), 403
    
    db.session.delete(channel)
    db.session.commit()
    
    return jsonify({'message': 'Channel deleted successfully'})


@chat_bp.route('/channels/<int:channel_id>/members', methods=['POST'])
@jwt_required()
def add_channel_member(channel_id):
    """Add member to private channel"""
    current_user_id = get_jwt_identity()
    channel = ChatChannel.query.get_or_404(channel_id)
    
    if not channel.is_private:
        return jsonify({'error': 'Channel is not private'}), 400
    
    if channel.server.owner_id != current_user_id:
        return jsonify({'error': 'Permission denied'}), 403
    
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    user = User.query.get_or_404(user_id)
    
    if user in channel.allowed_members:
        return jsonify({'error': 'User already has access'}), 400
    
    channel.allowed_members.append(user)
    db.session.commit()
    
    return jsonify({'message': 'Member added successfully'})


@chat_bp.route('/channels/<int:channel_id>/members/<int:user_id>', methods=['DELETE'])
@jwt_required()
def remove_channel_member(channel_id, user_id):
    """Remove member from private channel"""
    current_user_id = get_jwt_identity()
    channel = ChatChannel.query.get_or_404(channel_id)
    
    if channel.server.owner_id != current_user_id:
        return jsonify({'error': 'Permission denied'}), 403
    
    user = User.query.get_or_404(user_id)
    
    if user not in channel.allowed_members:
        return jsonify({'error': 'User does not have access'}), 400
    
    channel.allowed_members.remove(user)
    db.session.commit()
    
    return jsonify({'message': 'Member removed successfully'})


# ==================== MESSAGE ROUTES ====================

@chat_bp.route('/channels/<int:channel_id>/messages', methods=['POST'])
@jwt_required()
def send_message(channel_id):
    """Send a message to a channel"""
    current_user_id = get_jwt_identity()
    channel = ChatChannel.query.get_or_404(channel_id)
    user = User.query.get(current_user_id)
    
    # Check if user is member of server
    if user not in channel.server.members:
        return jsonify({'error': 'Not a member of this server'}), 403
    
    # Check if channel is private
    if channel.is_private and user not in channel.allowed_members:
        if channel.server.owner_id != current_user_id:
            return jsonify({'error': 'Access denied'}), 403
    
    # Check if channel is locked
    if channel.is_locked:
        # Check if user has permission to send in locked channel
        has_permission = False
        for role_member in user.server_roles:
            if role_member.role.server_id == channel.server_id:
                if role_member.role.can_manage_channels or channel.server.owner_id == current_user_id:
                    has_permission = True
                    break
        if not has_permission:
            return jsonify({'error': 'Channel is locked'}), 403
    
    data = request.get_json()
    
    if not data.get('content'):
        return jsonify({'error': 'Message content is required'}), 400
    
    message = ChatMessage(
        channel_id=channel_id,
        user_id=current_user_id,
        content=data['content'],
        message_type=data.get('message_type', 'text'),
        reply_to_id=data.get('reply_to_id')
    )
    db.session.add(message)
    
    # Update channel last message time
    channel.last_message_at = get_local_now()
    
    # Process mentions
    if '@everyone' in data['content']:
        mention = ChatMention(
            message_id=message.id,
            mention_type='everyone'
        )
        db.session.add(mention)
    
    # Update unread counts for other members
    for member in channel.server.members:
        if member.id != current_user_id:
            unread = ChatUnreadMessage.query.filter_by(
                user_id=member.id,
                channel_id=channel_id
            ).first()
            
            if not unread:
                unread = ChatUnreadMessage(
                    user_id=member.id,
                    channel_id=channel_id,
                    unread_count=0
                )
                db.session.add(unread)
            
            unread.unread_count += 1
    
    db.session.commit()
    
    return jsonify({
        'message': 'Message sent successfully',
        'data': message.to_dict()
    }), 201


@chat_bp.route('/messages/upload', methods=['POST'])
@jwt_required()
def upload_file_message():
    """Upload a file and send as message"""
    import os
    from werkzeug.utils import secure_filename
    
    current_user_id = get_jwt_identity()
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    channel_id = request.form.get('channel_id')
    caption = request.form.get('caption', '')
    reply_to_id = request.form.get('reply_to_id')
    
    if not channel_id:
        return jsonify({'error': 'Channel ID is required'}), 400
    
    channel = ChatChannel.query.get_or_404(int(channel_id))
    user = User.query.get(current_user_id)
    
    # Check if user is member of server
    if user not in channel.server.members:
        return jsonify({'error': 'Not a member of this server'}), 403
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Allowed extensions
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'zip', 'rar'}
    
    def allowed_file(filename):
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400
    
    # Check file size (max 10MB)
    file.seek(0, 2)  # Seek to end
    file_size = file.tell()
    file.seek(0)  # Seek back to start
    
    if file_size > 10 * 1024 * 1024:
        return jsonify({'error': 'File size exceeds 10MB limit'}), 400
    
    # Create upload directory
    upload_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'chat')
    os.makedirs(upload_folder, exist_ok=True)
    
    # Generate unique filename
    original_filename = secure_filename(file.filename)
    ext = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
    unique_filename = f"{get_local_now().strftime('%Y%m%d%H%M%S')}_{current_user_id}_{secrets.token_hex(8)}.{ext}"
    
    file_path = os.path.join(upload_folder, unique_filename)
    file.save(file_path)
    
    # Determine message type based on file
    file_ext = ext.lower()
    if file_ext in ['png', 'jpg', 'jpeg', 'gif', 'webp']:
        message_type = 'image'
    else:
        message_type = 'file'
    
    # Create message
    message = ChatMessage(
        channel_id=int(channel_id),
        user_id=current_user_id,
        content=caption if caption else f'📎 {original_filename}',
        message_type=message_type,
        reply_to_id=int(reply_to_id) if reply_to_id else None
    )
    db.session.add(message)
    db.session.flush()
    
    # Create attachment record
    attachment = ChatAttachment(
        message_id=message.id,
        filename=original_filename,
        file_path=f'/uploads/chat/{unique_filename}',
        file_size=file_size,
        content_type=file.content_type or 'application/octet-stream'
    )
    db.session.add(attachment)
    
    # Update channel last message time
    channel.last_message_at = get_local_now()
    
    # Update unread counts for other members
    for member in channel.server.members:
        if member.id != current_user_id:
            unread = ChatUnreadMessage.query.filter_by(
                user_id=member.id,
                channel_id=int(channel_id)
            ).first()
            
            if not unread:
                unread = ChatUnreadMessage(
                    user_id=member.id,
                    channel_id=int(channel_id),
                    unread_count=0
                )
                db.session.add(unread)
            
            unread.unread_count += 1
    
    db.session.commit()
    
    return jsonify({
        'message': 'File uploaded successfully',
        'data': message.to_dict()
    }), 201


@chat_bp.route('/messages/<int:message_id>', methods=['PUT'])
@jwt_required()
def edit_message(message_id):
    """Edit a message"""
    current_user_id = get_jwt_identity()
    message = ChatMessage.query.get_or_404(message_id)
    
    if message.user_id != current_user_id:
        return jsonify({'error': 'Can only edit your own messages'}), 403
    
    if message.is_deleted:
        return jsonify({'error': 'Message is deleted'}), 400
    
    data = request.get_json()
    
    if not data.get('content'):
        return jsonify({'error': 'Message content is required'}), 400
    
    message.content = data['content']
    message.is_edited = True
    message.edited_at = get_local_now()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Message updated successfully',
        'data': message.to_dict()
    })


@chat_bp.route('/messages/<int:message_id>', methods=['DELETE'])
@jwt_required()
def delete_message(message_id):
    """Delete a message"""
    current_user_id = get_jwt_identity()
    message = ChatMessage.query.get_or_404(message_id)
    channel = message.channel
    
    # Can delete own messages or if has manage_messages permission
    if message.user_id != current_user_id:
        if channel.server.owner_id != current_user_id:
            return jsonify({'error': 'Permission denied'}), 403
    
    message.is_deleted = True
    message.deleted_at = get_local_now()
    
    db.session.commit()
    
    return jsonify({'message': 'Message deleted successfully'})


@chat_bp.route('/messages/<int:message_id>/reactions', methods=['POST'])
@jwt_required()
def add_reaction(message_id):
    """Add reaction to a message"""
    current_user_id = get_jwt_identity()
    message = ChatMessage.query.get_or_404(message_id)
    
    data = request.get_json()
    emoji = data.get('emoji')
    
    if not emoji:
        return jsonify({'error': 'Emoji is required'}), 400
    
    # Check if reaction already exists
    existing = ChatReaction.query.filter_by(
        message_id=message_id,
        user_id=current_user_id,
        emoji=emoji
    ).first()
    
    if existing:
        return jsonify({'error': 'Reaction already exists'}), 400
    
    reaction = ChatReaction(
        message_id=message_id,
        user_id=current_user_id,
        emoji=emoji
    )
    db.session.add(reaction)
    db.session.commit()
    
    return jsonify({
        'message': 'Reaction added successfully',
        'reactions': message._get_reaction_summary()
    })


@chat_bp.route('/messages/<int:message_id>/reactions', methods=['DELETE'])
@jwt_required()
def remove_reaction(message_id):
    """Remove reaction from a message"""
    current_user_id = get_jwt_identity()
    
    emoji = request.args.get('emoji')
    if not emoji:
        return jsonify({'error': 'Emoji is required'}), 400
    
    reaction = ChatReaction.query.filter_by(
        message_id=message_id,
        user_id=current_user_id,
        emoji=emoji
    ).first()
    
    if not reaction:
        return jsonify({'error': 'Reaction not found'}), 404
    
    db.session.delete(reaction)
    db.session.commit()
    
    message = ChatMessage.query.get(message_id)
    
    return jsonify({
        'message': 'Reaction removed successfully',
        'reactions': message._get_reaction_summary()
    })


@chat_bp.route('/messages/<int:message_id>/pin', methods=['POST'])
@jwt_required()
def pin_message(message_id):
    """Pin a message"""
    current_user_id = get_jwt_identity()
    message = ChatMessage.query.get_or_404(message_id)
    channel = message.channel
    
    # Check permission
    if channel.server.owner_id != current_user_id:
        return jsonify({'error': 'Permission denied'}), 403
    
    # Check if already pinned
    existing = ChatPinnedMessage.query.filter_by(
        channel_id=channel.id,
        message_id=message_id
    ).first()
    
    if existing:
        return jsonify({'error': 'Message already pinned'}), 400
    
    pin = ChatPinnedMessage(
        channel_id=channel.id,
        message_id=message_id,
        pinned_by=current_user_id
    )
    db.session.add(pin)
    db.session.commit()
    
    return jsonify({'message': 'Message pinned successfully'})


@chat_bp.route('/messages/<int:message_id>/pin', methods=['DELETE'])
@jwt_required()
def unpin_message(message_id):
    """Unpin a message"""
    current_user_id = get_jwt_identity()
    message = ChatMessage.query.get_or_404(message_id)
    channel = message.channel
    
    if channel.server.owner_id != current_user_id:
        return jsonify({'error': 'Permission denied'}), 403
    
    pin = ChatPinnedMessage.query.filter_by(
        channel_id=channel.id,
        message_id=message_id
    ).first()
    
    if not pin:
        return jsonify({'error': 'Message not pinned'}), 404
    
    db.session.delete(pin)
    db.session.commit()
    
    return jsonify({'message': 'Message unpinned successfully'})


@chat_bp.route('/channels/<int:channel_id>/pins', methods=['GET'])
@jwt_required()
def get_pinned_messages(channel_id):
    """Get pinned messages in a channel"""
    channel = ChatChannel.query.get_or_404(channel_id)
    
    pins = ChatPinnedMessage.query.filter_by(channel_id=channel_id).order_by(
        ChatPinnedMessage.pinned_at.desc()
    ).all()
    
    return jsonify({
        'pinned_messages': [{
            'id': p.id,
            'message': p.message.to_dict(),
            'pinned_by': p.pinned_by,
            'pinned_at': p.pinned_at.isoformat()
        } for p in pins]
    })


# ==================== ROLE ROUTES ====================

@chat_bp.route('/servers/<int:server_id>/roles', methods=['GET'])
@jwt_required()
def get_roles(server_id):
    """Get server roles"""
    server = ChatServer.query.get_or_404(server_id)
    
    roles = ChatServerRole.query.filter_by(server_id=server_id).order_by(
        ChatServerRole.position.desc()
    ).all()
    
    return jsonify({
        'roles': [r.to_dict() for r in roles]
    })


@chat_bp.route('/servers/<int:server_id>/roles', methods=['POST'])
@jwt_required()
def create_role(server_id):
    """Create a new role"""
    current_user_id = get_jwt_identity()
    server = ChatServer.query.get_or_404(server_id)
    
    if server.owner_id != current_user_id:
        return jsonify({'error': 'Permission denied'}), 403
    
    data = request.get_json()
    
    if not data.get('name'):
        return jsonify({'error': 'Role name is required'}), 400
    
    # Get max position
    max_pos = db.session.query(db.func.max(ChatServerRole.position)).filter_by(server_id=server_id).scalar() or 0
    
    role = ChatServerRole(
        server_id=server_id,
        name=data['name'],
        color=data.get('color', '#99AAB5'),
        position=max_pos + 1,
        can_manage_server=data.get('can_manage_server', False),
        can_manage_channels=data.get('can_manage_channels', False),
        can_manage_roles=data.get('can_manage_roles', False),
        can_manage_messages=data.get('can_manage_messages', False),
        can_kick_members=data.get('can_kick_members', False),
        can_ban_members=data.get('can_ban_members', False),
        can_invite=data.get('can_invite', True),
        can_send_messages=data.get('can_send_messages', True),
        can_attach_files=data.get('can_attach_files', True),
        can_add_reactions=data.get('can_add_reactions', True),
        can_mention_everyone=data.get('can_mention_everyone', False),
        can_pin_messages=data.get('can_pin_messages', False)
    )
    db.session.add(role)
    db.session.commit()
    
    return jsonify({
        'message': 'Role created successfully',
        'role': role.to_dict()
    }), 201


@chat_bp.route('/roles/<int:role_id>', methods=['PUT'])
@jwt_required()
def update_role(role_id):
    """Update a role"""
    current_user_id = get_jwt_identity()
    role = ChatServerRole.query.get_or_404(role_id)
    
    if role.server.owner_id != current_user_id:
        return jsonify({'error': 'Permission denied'}), 403
    
    if role.is_default:
        return jsonify({'error': 'Cannot modify default role'}), 400
    
    data = request.get_json()
    
    for field in ['name', 'color', 'position', 'can_manage_server', 'can_manage_channels',
                  'can_manage_roles', 'can_manage_messages', 'can_kick_members', 'can_ban_members',
                  'can_invite', 'can_send_messages', 'can_attach_files', 'can_add_reactions',
                  'can_mention_everyone', 'can_pin_messages']:
        if field in data:
            setattr(role, field, data[field])
    
    db.session.commit()
    
    return jsonify({
        'message': 'Role updated successfully',
        'role': role.to_dict()
    })


@chat_bp.route('/roles/<int:role_id>', methods=['DELETE'])
@jwt_required()
def delete_role(role_id):
    """Delete a role"""
    current_user_id = get_jwt_identity()
    role = ChatServerRole.query.get_or_404(role_id)
    
    if role.server.owner_id != current_user_id:
        return jsonify({'error': 'Permission denied'}), 403
    
    if role.is_default:
        return jsonify({'error': 'Cannot delete default role'}), 400
    
    db.session.delete(role)
    db.session.commit()
    
    return jsonify({'message': 'Role deleted successfully'})


@chat_bp.route('/roles/<int:role_id>/members', methods=['POST'])
@jwt_required()
def assign_role(role_id):
    """Assign role to a user"""
    current_user_id = get_jwt_identity()
    role = ChatServerRole.query.get_or_404(role_id)
    
    if role.server.owner_id != current_user_id:
        return jsonify({'error': 'Permission denied'}), 403
    
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    # Check if already assigned
    existing = ChatServerRoleMember.query.filter_by(
        role_id=role_id,
        user_id=user_id
    ).first()
    
    if existing:
        return jsonify({'error': 'User already has this role'}), 400
    
    assignment = ChatServerRoleMember(
        role_id=role_id,
        user_id=user_id,
        assigned_by=current_user_id
    )
    db.session.add(assignment)
    db.session.commit()
    
    return jsonify({'message': 'Role assigned successfully'})


@chat_bp.route('/roles/<int:role_id>/members/<int:user_id>', methods=['DELETE'])
@jwt_required()
def remove_role(role_id, user_id):
    """Remove role from a user"""
    current_user_id = get_jwt_identity()
    role = ChatServerRole.query.get_or_404(role_id)
    
    if role.server.owner_id != current_user_id:
        return jsonify({'error': 'Permission denied'}), 403
    
    assignment = ChatServerRoleMember.query.filter_by(
        role_id=role_id,
        user_id=user_id
    ).first()
    
    if not assignment:
        return jsonify({'error': 'User does not have this role'}), 404
    
    db.session.delete(assignment)
    db.session.commit()
    
    return jsonify({'message': 'Role removed successfully'})


# ==================== USER STATUS ROUTES ====================

@chat_bp.route('/status', methods=['GET'])
@jwt_required()
def get_my_status():
    """Get current user's status"""
    current_user_id = get_jwt_identity()
    
    status = ChatUserStatus.query.filter_by(user_id=current_user_id).first()
    
    if not status:
        status = ChatUserStatus(
            user_id=current_user_id,
            status='online'
        )
        db.session.add(status)
        db.session.commit()
    
    return jsonify({'status': status.to_dict()})


@chat_bp.route('/status', methods=['PUT'])
@jwt_required()
def update_status():
    """Update user status"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    status = ChatUserStatus.query.filter_by(user_id=current_user_id).first()
    
    if not status:
        status = ChatUserStatus(user_id=current_user_id)
        db.session.add(status)
    
    if 'status' in data:
        if data['status'] not in ['online', 'idle', 'dnd', 'offline']:
            return jsonify({'error': 'Invalid status'}), 400
        status.status = data['status']
    
    if 'custom_status' in data:
        status.custom_status = data['custom_status']
    
    status.last_seen = get_local_now()
    
    db.session.commit()
    
    return jsonify({'status': status.to_dict()})


@chat_bp.route('/servers/<int:server_id>/members/status', methods=['GET'])
@jwt_required()
def get_members_status(server_id):
    """Get online status of server members"""
    server = ChatServer.query.get_or_404(server_id)
    
    members_status = []
    for member in server.members:
        status = ChatUserStatus.query.filter_by(user_id=member.id).first()
        members_status.append({
            'user_id': member.id,
            'username': member.username,
            'full_name': member.full_name,
            'status': status.status if status else 'offline',
            'custom_status': status.custom_status if status else None
        })
    
    return jsonify({'members': members_status})


# ==================== UNREAD ROUTES ====================

@chat_bp.route('/unread', methods=['GET'])
@jwt_required()
def get_unread_counts():
    """Get unread message counts for all channels"""
    current_user_id = get_jwt_identity()
    
    unreads = ChatUnreadMessage.query.filter(
        ChatUnreadMessage.user_id == current_user_id,
        ChatUnreadMessage.unread_count > 0
    ).all()
    
    return jsonify({
        'unread': [{
            'channel_id': u.channel_id,
            'unread_count': u.unread_count,
            'last_read_at': u.last_read_at.isoformat() if u.last_read_at else None
        } for u in unreads]
    })


@chat_bp.route('/channels/<int:channel_id>/read', methods=['POST'])
@jwt_required()
def mark_as_read(channel_id):
    """Mark channel as read"""
    current_user_id = get_jwt_identity()
    
    unread = ChatUnreadMessage.query.filter_by(
        user_id=current_user_id,
        channel_id=channel_id
    ).first()
    
    if unread:
        unread.unread_count = 0
        unread.last_read_at = get_local_now()
        
        # Get latest message
        latest_msg = ChatMessage.query.filter_by(channel_id=channel_id).order_by(
            ChatMessage.created_at.desc()
        ).first()
        if latest_msg:
            unread.last_read_message_id = latest_msg.id
        
        db.session.commit()
    
    return jsonify({'message': 'Marked as read'})


# ==================== SEARCH ROUTES ====================

@chat_bp.route('/channels/<int:channel_id>/search', methods=['GET'])
@jwt_required()
def search_messages(channel_id):
    """Search messages in a channel"""
    channel = ChatChannel.query.get_or_404(channel_id)
    
    query = request.args.get('q', '')
    if not query or len(query) < 2:
        return jsonify({'error': 'Search query must be at least 2 characters'}), 400
    
    messages = ChatMessage.query.filter(
        ChatMessage.channel_id == channel_id,
        ChatMessage.is_deleted == False,
        ChatMessage.content.ilike(f'%{query}%')
    ).order_by(ChatMessage.created_at.desc()).limit(50).all()
    
    return jsonify({
        'results': [m.to_dict() for m in messages],
        'count': len(messages)
    })


@chat_bp.route('/servers/<int:server_id>/search', methods=['GET'])
@jwt_required()
def search_server_messages(server_id):
    """Search messages across all channels in a server"""
    server = ChatServer.query.get_or_404(server_id)
    
    query = request.args.get('q', '')
    if not query or len(query) < 2:
        return jsonify({'error': 'Search query must be at least 2 characters'}), 400
    
    # Get all channel IDs in this server
    channel_ids = [c.id for c in server.channels]
    
    messages = ChatMessage.query.filter(
        ChatMessage.channel_id.in_(channel_ids),
        ChatMessage.is_deleted == False,
        ChatMessage.content.ilike(f'%{query}%')
    ).order_by(ChatMessage.created_at.desc()).limit(100).all()
    
    return jsonify({
        'results': [m.to_dict() for m in messages],
        'count': len(messages)
    })


# ==================== HEARTBEAT / PRESENCE ROUTES ====================

@chat_bp.route('/heartbeat', methods=['POST'])
@jwt_required()
def heartbeat():
    """Update user's last activity (heartbeat for online status)"""
    current_user_id = get_jwt_identity()
    
    status = ChatUserStatus.query.filter_by(user_id=current_user_id).first()
    
    if not status:
        status = ChatUserStatus(
            user_id=current_user_id,
            status='online'
        )
        db.session.add(status)
    # Don't change manually set status (dnd, idle, offline)
    # Only update last_seen timestamp
    
    status.last_seen = get_local_now()
    db.session.commit()
    
    return jsonify({
        'status': 'ok', 
        'current_status': status.status,
        'last_seen': status.last_seen.isoformat()
    })


@chat_bp.route('/servers/<int:server_id>/online', methods=['GET'])
@jwt_required()
def get_online_members(server_id):
    """Get real-time online status of server members based on heartbeat"""
    from datetime import timedelta
    
    server = ChatServer.query.get_or_404(server_id)
    
    # Consider user active if last_seen within 30 seconds
    active_threshold = get_local_now() - timedelta(seconds=30)
    
    online_members = []
    idle_members = []
    offline_members = []
    
    for member in server.members:
        status = ChatUserStatus.query.filter_by(user_id=member.id).first()
        
        member_data = {
            'id': member.id,
            'username': member.username,
            'full_name': member.full_name,
            'custom_status': status.custom_status if status else None
        }
        
        if status:
            # Check if user is active (has recent heartbeat)
            is_active = status.last_seen and status.last_seen >= active_threshold
            
            # Respect manually set status
            if status.status == 'offline':
                # User chose to appear offline (invisible)
                member_data['status'] = 'offline'
                offline_members.append(member_data)
            elif status.status == 'dnd':
                # User is Do Not Disturb but still present
                member_data['status'] = 'dnd'
                if is_active:
                    online_members.append(member_data)
                else:
                    offline_members.append(member_data)
            elif status.status == 'idle':
                # User manually set to idle
                member_data['status'] = 'idle'
                if is_active:
                    idle_members.append(member_data)
                else:
                    offline_members.append(member_data)
            elif is_active:
                # User is online and active
                member_data['status'] = 'online'
                online_members.append(member_data)
            else:
                # User was online but no recent activity
                member_data['status'] = 'offline'
                offline_members.append(member_data)
        else:
            member_data['status'] = 'offline'
            offline_members.append(member_data)
    
    return jsonify({
        'online': online_members,
        'idle': idle_members,
        'offline': offline_members,
        'online_count': len(online_members),
        'idle_count': len(idle_members),
        'offline_count': len(offline_members),
        'total': len(server.members)
    })
