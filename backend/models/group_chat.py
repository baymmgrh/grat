"""
Group Chat Models - Discord-style group chat system
"""
from datetime import datetime
from models import db


# Association table for server members
server_members = db.Table('chat_server_members',
    db.Column('server_id', db.Integer, db.ForeignKey('chat_servers.id'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('joined_at', db.DateTime, default=datetime.utcnow),
    db.Column('nickname', db.String(100), nullable=True)
)

# Association table for channel members (for private channels)
channel_members = db.Table('chat_channel_members',
    db.Column('channel_id', db.Integer, db.ForeignKey('chat_channels.id'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('added_at', db.DateTime, default=datetime.utcnow)
)


class ChatServer(db.Model):
    """Chat Server - equivalent to Discord server"""
    __tablename__ = 'chat_servers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    icon = db.Column(db.String(255), nullable=True)  # Icon URL or emoji
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    is_public = db.Column(db.Boolean, default=True)  # Public servers can be joined by anyone
    invite_code = db.Column(db.String(20), unique=True, nullable=True)  # For private servers
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = db.relationship('User', foreign_keys=[owner_id], backref='owned_servers')
    members = db.relationship('User', secondary=server_members, backref='chat_servers')
    categories = db.relationship('ChatCategory', backref='server', lazy='dynamic', 
                                 cascade='all, delete-orphan', order_by='ChatCategory.order')
    channels = db.relationship('ChatChannel', backref='server', lazy='dynamic',
                               cascade='all, delete-orphan')
    roles = db.relationship('ChatServerRole', backref='server', lazy='dynamic',
                            cascade='all, delete-orphan')
    
    def to_dict(self, include_members=False, include_channels=False):
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'owner_id': self.owner_id,
            'owner_name': self.owner.full_name if self.owner else None,
            'is_public': self.is_public,
            'invite_code': self.invite_code,
            'member_count': len(self.members),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_members:
            data['members'] = [{
                'id': m.id,
                'username': m.username,
                'full_name': m.full_name,
                'avatar': m.avatar if hasattr(m, 'avatar') else None
            } for m in self.members]
        
        if include_channels:
            data['categories'] = [c.to_dict(include_channels=True) for c in self.categories.order_by(ChatCategory.order)]
            # Uncategorized channels
            uncategorized = self.channels.filter_by(category_id=None).order_by(ChatChannel.order).all()
            data['uncategorized_channels'] = [ch.to_dict() for ch in uncategorized]
        
        return data


class ChatCategory(db.Model):
    """Channel Category - for organizing channels"""
    __tablename__ = 'chat_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    server_id = db.Column(db.Integer, db.ForeignKey('chat_servers.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    order = db.Column(db.Integer, default=0)
    is_collapsed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    channels = db.relationship('ChatChannel', backref='category', lazy='dynamic',
                               order_by='ChatChannel.order')
    
    def to_dict(self, include_channels=False):
        data = {
            'id': self.id,
            'server_id': self.server_id,
            'name': self.name,
            'order': self.order,
            'is_collapsed': self.is_collapsed
        }
        
        if include_channels:
            data['channels'] = [ch.to_dict() for ch in self.channels.order_by(ChatChannel.order)]
        
        return data


class ChatChannel(db.Model):
    """Chat Channel - text or voice channel"""
    __tablename__ = 'chat_channels'
    
    id = db.Column(db.Integer, primary_key=True)
    server_id = db.Column(db.Integer, db.ForeignKey('chat_servers.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('chat_categories.id'), nullable=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    channel_type = db.Column(db.String(20), default='text')  # text, voice, announcement
    is_private = db.Column(db.Boolean, default=False)  # Private/locked channel
    is_locked = db.Column(db.Boolean, default=False)  # Only certain roles can send messages
    password_hash = db.Column(db.String(255), nullable=True)  # Password for private channels
    order = db.Column(db.Integer, default=0)
    slowmode_seconds = db.Column(db.Integer, default=0)  # Slowmode delay
    topic = db.Column(db.String(1024), nullable=True)  # Channel topic
    last_message_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_password(self, password):
        """Hash and set password"""
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password"""
        from werkzeug.security import check_password_hash
        if not self.password_hash:
            return True
        return check_password_hash(self.password_hash, password)
    
    # Relationships
    messages = db.relationship('ChatMessage', backref='channel', lazy='dynamic',
                               cascade='all, delete-orphan')
    allowed_members = db.relationship('User', secondary=channel_members, backref='private_channels')
    pins = db.relationship('ChatPinnedMessage', backref='channel', lazy='dynamic',
                           cascade='all, delete-orphan')
    
    def to_dict(self, include_messages=False):
        data = {
            'id': self.id,
            'server_id': self.server_id,
            'category_id': self.category_id,
            'name': self.name,
            'description': self.description,
            'channel_type': self.channel_type,
            'is_private': self.is_private,
            'is_locked': self.is_locked,
            'order': self.order,
            'slowmode_seconds': self.slowmode_seconds,
            'topic': self.topic,
            'last_message_at': self.last_message_at.isoformat() if self.last_message_at else None,
            'message_count': self.messages.count()
        }
        
        if include_messages:
            data['messages'] = [m.to_dict() for m in self.messages.order_by(ChatMessage.created_at.desc()).limit(50)]
        
        return data


class ChatMessage(db.Model):
    """Chat Message"""
    __tablename__ = 'chat_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    channel_id = db.Column(db.Integer, db.ForeignKey('chat_channels.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(20), default='text')  # text, image, file, system
    reply_to_id = db.Column(db.Integer, db.ForeignKey('chat_messages.id'), nullable=True)
    is_edited = db.Column(db.Boolean, default=False)
    edited_at = db.Column(db.DateTime, nullable=True)
    is_deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='chat_messages')
    reply_to = db.relationship('ChatMessage', remote_side=[id], backref='replies')
    attachments = db.relationship('ChatAttachment', backref='message', lazy='dynamic',
                                  cascade='all, delete-orphan')
    reactions = db.relationship('ChatReaction', backref='message', lazy='dynamic',
                                cascade='all, delete-orphan')
    mentions = db.relationship('ChatMention', backref='message', lazy='dynamic',
                               cascade='all, delete-orphan')
    
    def to_dict(self, include_replies=False):
        data = {
            'id': self.id,
            'channel_id': self.channel_id,
            'user_id': self.user_id,
            'user': {
                'id': self.user.id,
                'username': self.user.username,
                'full_name': self.user.full_name,
                'avatar': self.user.avatar if hasattr(self.user, 'avatar') else None
            } if self.user else None,
            'content': self.content if not self.is_deleted else '[Message deleted]',
            'message_type': self.message_type,
            'reply_to_id': self.reply_to_id,
            'reply_to': self.reply_to.to_dict() if self.reply_to and not self.reply_to.is_deleted else None,
            'is_edited': self.is_edited,
            'edited_at': self.edited_at.isoformat() if self.edited_at else None,
            'is_deleted': self.is_deleted,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'attachments': [a.to_dict() for a in self.attachments],
            'reactions': self._get_reaction_summary(),
            'mentions': [m.to_dict() for m in self.mentions]
        }
        
        return data
    
    def _get_reaction_summary(self):
        """Get reaction summary grouped by emoji"""
        reactions = {}
        for r in self.reactions:
            if r.emoji not in reactions:
                reactions[r.emoji] = {'emoji': r.emoji, 'count': 0, 'users': []}
            reactions[r.emoji]['count'] += 1
            reactions[r.emoji]['users'].append(r.user_id)
        return list(reactions.values())


class ChatAttachment(db.Model):
    """Message Attachment"""
    __tablename__ = 'chat_attachments'
    
    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.Integer, db.ForeignKey('chat_messages.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_url = db.Column(db.String(500), nullable=True)  # Legacy field
    file_path = db.Column(db.String(500), nullable=True)  # New field for local path
    file_type = db.Column(db.String(50), nullable=True)  # image, video, audio, document
    content_type = db.Column(db.String(100), nullable=True)  # MIME type
    file_size = db.Column(db.Integer, nullable=True)  # in bytes
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'file_path': self.file_path or self.file_url,
            'file_url': self.file_url,
            'file_type': self.file_type,
            'content_type': self.content_type,
            'file_size': self.file_size
        }


class ChatReaction(db.Model):
    """Message Reaction"""
    __tablename__ = 'chat_reactions'
    
    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.Integer, db.ForeignKey('chat_messages.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    emoji = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Unique constraint: one reaction per user per message per emoji
    __table_args__ = (
        db.UniqueConstraint('message_id', 'user_id', 'emoji', name='unique_reaction'),
    )
    
    user = db.relationship('User', backref='chat_reactions')


class ChatMention(db.Model):
    """Message Mention"""
    __tablename__ = 'chat_mentions'
    
    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.Integer, db.ForeignKey('chat_messages.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Null for @everyone
    mention_type = db.Column(db.String(20), default='user')  # user, role, everyone, channel
    role_id = db.Column(db.Integer, db.ForeignKey('chat_server_roles.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='chat_mentions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'mention_type': self.mention_type,
            'role_id': self.role_id
        }


class ChatPinnedMessage(db.Model):
    """Pinned Message"""
    __tablename__ = 'chat_pinned_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    channel_id = db.Column(db.Integer, db.ForeignKey('chat_channels.id'), nullable=False)
    message_id = db.Column(db.Integer, db.ForeignKey('chat_messages.id'), nullable=False)
    pinned_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    pinned_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    message = db.relationship('ChatMessage', backref='pinned_in')
    pinner = db.relationship('User', backref='pinned_messages')


class ChatServerRole(db.Model):
    """Server Role - for permissions"""
    __tablename__ = 'chat_server_roles'
    
    id = db.Column(db.Integer, primary_key=True)
    server_id = db.Column(db.Integer, db.ForeignKey('chat_servers.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    color = db.Column(db.String(7), default='#99AAB5')  # Hex color
    is_default = db.Column(db.Boolean, default=False)  # Default role for new members
    position = db.Column(db.Integer, default=0)  # Higher = more priority
    
    # Permissions
    can_manage_server = db.Column(db.Boolean, default=False)
    can_manage_channels = db.Column(db.Boolean, default=False)
    can_manage_roles = db.Column(db.Boolean, default=False)
    can_manage_messages = db.Column(db.Boolean, default=False)
    can_kick_members = db.Column(db.Boolean, default=False)
    can_ban_members = db.Column(db.Boolean, default=False)
    can_invite = db.Column(db.Boolean, default=True)
    can_send_messages = db.Column(db.Boolean, default=True)
    can_attach_files = db.Column(db.Boolean, default=True)
    can_add_reactions = db.Column(db.Boolean, default=True)
    can_mention_everyone = db.Column(db.Boolean, default=False)
    can_pin_messages = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    members = db.relationship('ChatServerRoleMember', backref='role', lazy='dynamic',
                              cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'server_id': self.server_id,
            'name': self.name,
            'color': self.color,
            'is_default': self.is_default,
            'position': self.position,
            'permissions': {
                'can_manage_server': self.can_manage_server,
                'can_manage_channels': self.can_manage_channels,
                'can_manage_roles': self.can_manage_roles,
                'can_manage_messages': self.can_manage_messages,
                'can_kick_members': self.can_kick_members,
                'can_ban_members': self.can_ban_members,
                'can_invite': self.can_invite,
                'can_send_messages': self.can_send_messages,
                'can_attach_files': self.can_attach_files,
                'can_add_reactions': self.can_add_reactions,
                'can_mention_everyone': self.can_mention_everyone,
                'can_pin_messages': self.can_pin_messages
            },
            'member_count': self.members.count()
        }


class ChatServerRoleMember(db.Model):
    """Server Role Member Assignment"""
    __tablename__ = 'chat_server_role_members'
    
    id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey('chat_server_roles.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)
    assigned_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    user = db.relationship('User', foreign_keys=[user_id], backref='server_roles')
    assigner = db.relationship('User', foreign_keys=[assigned_by])
    
    __table_args__ = (
        db.UniqueConstraint('role_id', 'user_id', name='unique_role_member'),
    )


class ChatUserStatus(db.Model):
    """User Online Status"""
    __tablename__ = 'chat_user_status'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    status = db.Column(db.String(20), default='offline')  # online, idle, dnd, offline
    custom_status = db.Column(db.String(128), nullable=True)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='chat_status', uselist=False)
    
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'status': self.status,
            'custom_status': self.custom_status,
            'last_seen': self.last_seen.isoformat() if self.last_seen else None
        }


class ChatUnreadMessage(db.Model):
    """Track unread messages per user per channel"""
    __tablename__ = 'chat_unread_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    channel_id = db.Column(db.Integer, db.ForeignKey('chat_channels.id'), nullable=False)
    last_read_message_id = db.Column(db.Integer, db.ForeignKey('chat_messages.id'), nullable=True)
    unread_count = db.Column(db.Integer, default=0)
    last_read_at = db.Column(db.DateTime, nullable=True)
    
    user = db.relationship('User', backref='unread_channels')
    channel = db.relationship('ChatChannel', backref='unread_by_users')
    last_read_message = db.relationship('ChatMessage')
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'channel_id', name='unique_user_channel_unread'),
    )
