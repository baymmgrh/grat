from models.finance import Account, db
from datetime import datetime

def seed_chart_of_accounts():
    """Seed basic chart of accounts for Indonesian companies"""
    
    accounts = [
        # ASSETS (1000-1999)
        {'code': '1000', 'name': 'ASSETS', 'type': 'asset', 'normal': 'debit', 'header': True, 'level': 1},
        {'code': '1100', 'name': 'Current Assets', 'type': 'asset', 'normal': 'debit', 'header': True, 'level': 2, 'parent': '1000'},
        {'code': '1110', 'name': 'Cash and Cash Equivalents', 'type': 'asset', 'normal': 'debit', 'header': False, 'level': 3, 'parent': '1100'},
        {'code': '1120', 'name': 'Accounts Receivable', 'type': 'asset', 'normal': 'debit', 'header': False, 'level': 3, 'parent': '1100'},
        {'code': '1130', 'name': 'Inventory', 'type': 'asset', 'normal': 'debit', 'header': False, 'level': 3, 'parent': '1100'},
        {'code': '1140', 'name': 'Prepaid Expenses', 'type': 'asset', 'normal': 'debit', 'header': False, 'level': 3, 'parent': '1100'},
        
        {'code': '1200', 'name': 'Fixed Assets', 'type': 'asset', 'normal': 'debit', 'header': True, 'level': 2, 'parent': '1000'},
        {'code': '1210', 'name': 'Property, Plant & Equipment', 'type': 'asset', 'normal': 'debit', 'header': False, 'level': 3, 'parent': '1200'},
        {'code': '1220', 'name': 'Accumulated Depreciation', 'type': 'asset', 'normal': 'credit', 'header': False, 'level': 3, 'parent': '1200'},
        
        # LIABILITIES (2000-2999)
        {'code': '2000', 'name': 'LIABILITIES', 'type': 'liability', 'normal': 'credit', 'header': True, 'level': 1},
        {'code': '2100', 'name': 'Current Liabilities', 'type': 'liability', 'normal': 'credit', 'header': True, 'level': 2, 'parent': '2000'},
        {'code': '2110', 'name': 'Accounts Payable', 'type': 'liability', 'normal': 'credit', 'header': False, 'level': 3, 'parent': '2100'},
        {'code': '2120', 'name': 'Accrued Expenses', 'type': 'liability', 'normal': 'credit', 'header': False, 'level': 3, 'parent': '2100'},
        {'code': '2130', 'name': 'Short-term Debt', 'type': 'liability', 'normal': 'credit', 'header': False, 'level': 3, 'parent': '2100'},
        
        {'code': '2200', 'name': 'Long-term Liabilities', 'type': 'liability', 'normal': 'credit', 'header': True, 'level': 2, 'parent': '2000'},
        {'code': '2210', 'name': 'Long-term Debt', 'type': 'liability', 'normal': 'credit', 'header': False, 'level': 3, 'parent': '2200'},
        
        # EQUITY (3000-3999)
        {'code': '3000', 'name': 'EQUITY', 'type': 'equity', 'normal': 'credit', 'header': True, 'level': 1},
        {'code': '3100', 'name': 'Share Capital', 'type': 'equity', 'normal': 'credit', 'header': False, 'level': 2, 'parent': '3000'},
        {'code': '3200', 'name': 'Retained Earnings', 'type': 'equity', 'normal': 'credit', 'header': False, 'level': 2, 'parent': '3000'},
        
        # REVENUE (4000-4999)
        {'code': '4000', 'name': 'REVENUE', 'type': 'revenue', 'normal': 'credit', 'header': True, 'level': 1},
        {'code': '4100', 'name': 'Sales Revenue', 'type': 'revenue', 'normal': 'credit', 'header': False, 'level': 2, 'parent': '4000'},
        {'code': '4200', 'name': 'Other Revenue', 'type': 'revenue', 'normal': 'credit', 'header': False, 'level': 2, 'parent': '4000'},
        
        # EXPENSES (5000-9999)
        {'code': '5000', 'name': 'COST OF GOODS SOLD', 'type': 'expense', 'normal': 'debit', 'header': True, 'level': 1},
        {'code': '5100', 'name': 'Raw Materials', 'type': 'expense', 'normal': 'debit', 'header': False, 'level': 2, 'parent': '5000'},
        {'code': '5200', 'name': 'Direct Labor', 'type': 'expense', 'normal': 'debit', 'header': False, 'level': 2, 'parent': '5000'},
        {'code': '5300', 'name': 'Manufacturing Overhead', 'type': 'expense', 'normal': 'debit', 'header': False, 'level': 2, 'parent': '5000'},
        
        {'code': '6000', 'name': 'OPERATING EXPENSES', 'type': 'expense', 'normal': 'debit', 'header': True, 'level': 1},
        {'code': '6100', 'name': 'Salaries & Wages', 'type': 'expense', 'normal': 'debit', 'header': False, 'level': 2, 'parent': '6000'},
        {'code': '6200', 'name': 'Marketing & Advertising', 'type': 'expense', 'normal': 'debit', 'header': False, 'level': 2, 'parent': '6000'},
        {'code': '6300', 'name': 'Administrative Expenses', 'type': 'expense', 'normal': 'debit', 'header': False, 'level': 2, 'parent': '6000'},
        {'code': '6400', 'name': 'Depreciation Expense', 'type': 'expense', 'normal': 'debit', 'header': False, 'level': 2, 'parent': '6000'},
    ]
    
    # Create parent mapping
    parent_map = {}
    
    # First pass: create accounts without parent relationships
    for acc_data in accounts:
        existing = Account.query.filter_by(account_code=acc_data['code']).first()
        if not existing:
            account = Account(
                account_code=acc_data['code'],
                account_name=acc_data['name'],
                account_type=acc_data['type'],
                normal_balance=acc_data['normal'],
                is_header=acc_data['header'],
                level=acc_data['level'],
                is_active=True
            )
            db.session.add(account)
            parent_map[acc_data['code']] = acc_data.get('parent')
    
    db.session.commit()
    
    # Second pass: set parent relationships
    for code, parent_code in parent_map.items():
        if parent_code:
            account = Account.query.filter_by(account_code=code).first()
            parent = Account.query.filter_by(account_code=parent_code).first()
            if account and parent:
                account.parent_id = parent.id
    
    db.session.commit()
    print("Chart of accounts seeded successfully!")

if __name__ == '__main__':
    from app import create_app
    app = create_app()
    with app.app_context():
        seed_chart_of_accounts()
