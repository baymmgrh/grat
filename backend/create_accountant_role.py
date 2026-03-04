"""
Script to create Accountant role template with appropriate permissions
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db
from models.user import Role, Permission, RolePermission

def create_accountant_role():
    """Create Accountant role with accounting-specific permissions"""
    app = create_app()
    
    with app.app_context():
        # Check if Accountant role already exists
        existing_role = Role.query.filter_by(name='Accountant').first()
        if existing_role:
            print("Accountant role already exists. Updating permissions...")
            role = existing_role
        else:
            # Create new Accountant role
            role = Role(
                name='Accountant',
                description='Role for accounting staff with access to financial records, journal entries, and financial reports',
                is_active=True
            )
            db.session.add(role)
            db.session.flush()
            print(f"Created Accountant role with ID: {role.id}")
        
        # Define accounting permissions
        accounting_permissions = [
            # Accounting module permissions
            {'name': 'accounting_view', 'resource': 'accounting', 'module': 'Accounting', 'action': 'read', 'description': 'View accounting module'},
            {'name': 'accounting_create', 'resource': 'accounting', 'module': 'Accounting', 'action': 'create', 'description': 'Create accounting entries'},
            {'name': 'accounting_update', 'resource': 'accounting', 'module': 'Accounting', 'action': 'update', 'description': 'Update accounting entries'},
            
            # Chart of Accounts
            {'name': 'chart_of_accounts_view', 'resource': 'chart_of_accounts', 'module': 'Accounting', 'action': 'read', 'description': 'View chart of accounts'},
            {'name': 'chart_of_accounts_create', 'resource': 'chart_of_accounts', 'module': 'Accounting', 'action': 'create', 'description': 'Create accounts'},
            {'name': 'chart_of_accounts_update', 'resource': 'chart_of_accounts', 'module': 'Accounting', 'action': 'update', 'description': 'Update accounts'},
            
            # General Ledger
            {'name': 'general_ledger_view', 'resource': 'general_ledger', 'module': 'Accounting', 'action': 'read', 'description': 'View general ledger'},
            {'name': 'general_ledger_create', 'resource': 'general_ledger', 'module': 'Accounting', 'action': 'create', 'description': 'Create ledger entries'},
            
            # Journal Entries
            {'name': 'journal_entry_view', 'resource': 'journal_entry', 'module': 'Accounting', 'action': 'read', 'description': 'View journal entries'},
            {'name': 'journal_entry_create', 'resource': 'journal_entry', 'module': 'Accounting', 'action': 'create', 'description': 'Create journal entries'},
            {'name': 'journal_entry_update', 'resource': 'journal_entry', 'module': 'Accounting', 'action': 'update', 'description': 'Update journal entries'},
            
            # Accounts Receivable
            {'name': 'accounts_receivable_view', 'resource': 'accounts_receivable', 'module': 'Accounting', 'action': 'read', 'description': 'View accounts receivable'},
            {'name': 'accounts_receivable_create', 'resource': 'accounts_receivable', 'module': 'Accounting', 'action': 'create', 'description': 'Create AR entries'},
            {'name': 'accounts_receivable_update', 'resource': 'accounts_receivable', 'module': 'Accounting', 'action': 'update', 'description': 'Update AR entries'},
            
            # Accounts Payable
            {'name': 'accounts_payable_view', 'resource': 'accounts_payable', 'module': 'Accounting', 'action': 'read', 'description': 'View accounts payable'},
            {'name': 'accounts_payable_create', 'resource': 'accounts_payable', 'module': 'Accounting', 'action': 'create', 'description': 'Create AP entries'},
            {'name': 'accounts_payable_update', 'resource': 'accounts_payable', 'module': 'Accounting', 'action': 'update', 'description': 'Update AP entries'},
            
            # Fixed Assets
            {'name': 'fixed_assets_view', 'resource': 'fixed_assets', 'module': 'Accounting', 'action': 'read', 'description': 'View fixed assets'},
            {'name': 'fixed_assets_create', 'resource': 'fixed_assets', 'module': 'Accounting', 'action': 'create', 'description': 'Create fixed asset records'},
            {'name': 'fixed_assets_update', 'resource': 'fixed_assets', 'module': 'Accounting', 'action': 'update', 'description': 'Update fixed asset records'},
            
            # Tax Management
            {'name': 'tax_management_view', 'resource': 'tax_management', 'module': 'Accounting', 'action': 'read', 'description': 'View tax records'},
            {'name': 'tax_management_create', 'resource': 'tax_management', 'module': 'Accounting', 'action': 'create', 'description': 'Create tax entries'},
            {'name': 'tax_management_update', 'resource': 'tax_management', 'module': 'Accounting', 'action': 'update', 'description': 'Update tax entries'},
            
            # Financial Reports
            {'name': 'financial_reports_view', 'resource': 'financial_reports', 'module': 'Accounting', 'action': 'read', 'description': 'View financial reports'},
            {'name': 'financial_reports_export', 'resource': 'financial_reports', 'module': 'Accounting', 'action': 'export', 'description': 'Export financial reports'},
            
            # WIP Ledger (read-only for accountants)
            {'name': 'wip_ledger_view', 'resource': 'wip_ledger', 'module': 'Accounting', 'action': 'read', 'description': 'View WIP ledger'},
            
            # Invoices (view and create for accountants)
            {'name': 'invoices_view', 'resource': 'invoices', 'module': 'Finance', 'action': 'read', 'description': 'View invoices'},
            {'name': 'invoices_create', 'resource': 'invoices', 'module': 'Finance', 'action': 'create', 'description': 'Create invoices'},
            {'name': 'invoices_update', 'resource': 'invoices', 'module': 'Finance', 'action': 'update', 'description': 'Update invoices'},
        ]
        
        # Create or get permissions and assign to role
        for perm_data in accounting_permissions:
            # Check if permission exists
            permission = Permission.query.filter_by(name=perm_data['name']).first()
            if not permission:
                permission = Permission(
                    name=perm_data['name'],
                    resource=perm_data['resource'],
                    module=perm_data['module'],
                    action=perm_data['action'],
                    description=perm_data['description'],
                    is_active=True
                )
                db.session.add(permission)
                db.session.flush()
                print(f"  Created permission: {perm_data['name']}")
            
            # Check if role-permission link exists
            existing_link = RolePermission.query.filter_by(
                role_id=role.id,
                permission_id=permission.id
            ).first()
            
            if not existing_link:
                role_permission = RolePermission(
                    role_id=role.id,
                    permission_id=permission.id
                )
                db.session.add(role_permission)
                print(f"  Assigned permission '{perm_data['name']}' to Accountant role")
        
        db.session.commit()
        print("\n✅ Accountant role created/updated successfully!")
        print(f"   Role ID: {role.id}")
        print(f"   Total permissions: {len(accounting_permissions)}")
        
        # Also ensure 'accounting' permission exists for sidebar visibility
        accounting_main = Permission.query.filter_by(name='accounting').first()
        if not accounting_main:
            accounting_main = Permission(
                name='accounting',
                resource='accounting',
                module='Accounting',
                action='access',
                description='Access to Accounting module',
                is_active=True
            )
            db.session.add(accounting_main)
            db.session.flush()
            
            # Link to Accountant role
            role_perm = RolePermission(role_id=role.id, permission_id=accounting_main.id)
            db.session.add(role_perm)
            db.session.commit()
            print("   Added 'accounting' module access permission")

if __name__ == '__main__':
    create_accountant_role()
