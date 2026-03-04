"""
Seed data for Group Chat module
Creates default server, categories, and channels
"""

from models import db
from models.group_chat import (
    ChatServer, ChatCategory, ChatChannel, ChatServerRole,
    ChatServerRoleMember, server_members
)
from models.user import User


def seed_group_chat():
    """Create default group chat server with categories and channels"""
    
    # Get admin user (first admin or first user)
    admin = User.query.filter_by(is_admin=True).first()
    if not admin:
        admin = User.query.first()
    
    if not admin:
        print("No users found. Please create a user first.")
        return
    
    # Check if default server already exists
    existing_server = ChatServer.query.filter_by(name='ERP General').first()
    if existing_server:
        print("Default server already exists. Skipping seed.")
        return
    
    print(f"Creating default server with owner: {admin.username}")
    
    # Create default server
    server = ChatServer(
        name='ERP General',
        description='Server umum untuk komunikasi tim ERP',
        icon='🏢',
        owner_id=admin.id,
        is_public=True
    )
    db.session.add(server)
    db.session.flush()  # Get server ID
    
    # Create default role
    default_role = ChatServerRole(
        server_id=server.id,
        name='Member',
        color='#99AAB5',
        is_default=True,
        position=0,
        can_send_messages=True,
        can_attach_files=True,
        can_add_reactions=True,
        can_invite=True
    )
    db.session.add(default_role)
    
    # Create admin role
    admin_role = ChatServerRole(
        server_id=server.id,
        name='Admin',
        color='#E74C3C',
        is_default=False,
        position=1,
        can_manage_server=True,
        can_manage_channels=True,
        can_manage_roles=True,
        can_manage_messages=True,
        can_kick_members=True,
        can_ban_members=True,
        can_invite=True,
        can_send_messages=True,
        can_attach_files=True,
        can_add_reactions=True,
        can_mention_everyone=True,
        can_pin_messages=True
    )
    db.session.add(admin_role)
    db.session.flush()
    
    # Add owner as member using the association table
    server.members.append(admin)
    db.session.flush()
    
    # Assign admin role to owner
    role_member = ChatServerRoleMember(
        role_id=admin_role.id,
        user_id=admin.id
    )
    db.session.add(role_member)
    
    # Create categories
    categories_data = [
        {'name': 'Informasi', 'order': 0},
        {'name': 'Departemen', 'order': 1},
        {'name': 'Proyek', 'order': 2}
    ]
    
    categories = {}
    for cat_data in categories_data:
        category = ChatCategory(
            server_id=server.id,
            name=cat_data['name'],
            order=cat_data['order']
        )
        db.session.add(category)
        db.session.flush()
        categories[cat_data['name']] = category
    
    # Create channels
    channels_data = [
        # Informasi category
        {'name': 'pengumuman', 'category': 'Informasi', 'topic': 'Pengumuman penting perusahaan', 'is_locked': True},
        {'name': 'aturan', 'category': 'Informasi', 'topic': 'Aturan dan kebijakan chat'},
        
        # Departemen category
        {'name': 'produksi', 'category': 'Departemen', 'topic': 'Diskusi tim produksi'},
        {'name': 'sales', 'category': 'Departemen', 'topic': 'Diskusi tim sales'},
        {'name': 'purchasing', 'category': 'Departemen', 'topic': 'Diskusi tim purchasing'},
        {'name': 'warehouse', 'category': 'Departemen', 'topic': 'Diskusi tim warehouse'},
        {'name': 'finance', 'category': 'Departemen', 'topic': 'Diskusi tim finance'},
        {'name': 'hr', 'category': 'Departemen', 'topic': 'Diskusi tim HR'},
        {'name': 'quality', 'category': 'Departemen', 'topic': 'Diskusi tim QC'},
        
        # Proyek category
        {'name': 'general', 'category': 'Proyek', 'topic': 'Diskusi umum proyek'},
        {'name': 'development', 'category': 'Proyek', 'topic': 'Diskusi pengembangan sistem'},
        
        # Uncategorized
        {'name': 'random', 'category': None, 'topic': 'Obrolan santai'},
        {'name': 'help', 'category': None, 'topic': 'Bantuan dan pertanyaan'}
    ]
    
    for idx, ch_data in enumerate(channels_data):
        channel = ChatChannel(
            server_id=server.id,
            category_id=categories[ch_data['category']].id if ch_data['category'] else None,
            name=ch_data['name'],
            topic=ch_data.get('topic', ''),
            channel_type='text',
            is_private=ch_data.get('is_private', False),
            is_locked=ch_data.get('is_locked', False),
            order=idx
        )
        db.session.add(channel)
    
    db.session.commit()
    print(f"✓ Created server: {server.name}")
    print(f"✓ Created {len(categories_data)} categories")
    print(f"✓ Created {len(channels_data)} channels")
    print(f"✓ Created 2 roles (Admin, Member)")
    print("Group chat seed completed successfully!")


if __name__ == '__main__':
    from app import create_app
    app = create_app()
    with app.app_context():
        seed_group_chat()
