"""
Account Configuration for GL Posting
Centralized account mapping for all modules to avoid hardcoded account IDs
"""

# Standard Chart of Accounts Mapping
ACCOUNT_CODES = {
    # Assets (1000-1999)
    'cash': '1-1000',
    'cash_in_bank': '1-1010',
    'petty_cash': '1-1020',
    'accounts_receivable': '1-1100',
    'allowance_doubtful_accounts': '1-1110',
    'inventory_raw_materials': '1-1200',
    'inventory_wip': '1-1300',
    'inventory_finished_goods': '1-1400',
    'inventory_supplies': '1-1500',
    'prepaid_expenses': '1-1600',
    'fixed_assets': '1-2000',
    'accumulated_depreciation': '1-2100',
    
    # Liabilities (2000-2999)
    'accounts_payable': '2-1000',
    'accrued_expenses': '2-1100',
    'accrued_salaries': '2-1110',
    'taxes_payable': '2-1200',
    'vat_payable': '2-1210',
    'short_term_debt': '2-1300',
    'long_term_debt': '2-2000',
    
    # Equity (3000-3999)
    'capital': '3-1000',
    'retained_earnings': '3-2000',
    'current_year_earnings': '3-3000',
    
    # Revenue (4000-4999)
    'sales_revenue': '4-1000',
    'sales_returns': '4-1100',
    'sales_discounts': '4-1200',
    'other_income': '4-9000',
    
    # Cost of Goods Sold (5000-5999)
    'cogs': '5-1000',
    'cogs_material': '5-1100',
    'cogs_labor': '5-1200',
    'cogs_overhead': '5-1300',
    
    # Operating Expenses (6000-8999)
    'material_expense': '6-1000',
    'labor_expense': '6-2000',
    'overhead_expense': '6-3000',
    'manufacturing_overhead': '6-3100',
    'factory_supplies': '6-3200',
    'utilities': '6-4000',
    'rent_expense': '6-5000',
    'depreciation_expense': '6-6000',
    'salary_expense': '7-1000',
    'marketing_expense': '8-1000',
    'administrative_expense': '8-2000',
    
    # Other Expenses (9000-9999)
    'interest_expense': '9-1000',
    'tax_expense': '9-2000',
    'other_expense': '9-9000',
}

# Account mapping for specific transactions
TRANSACTION_ACCOUNTS = {
    # WIP Accounting
    'wip_material_debit': 'inventory_wip',
    'wip_material_credit': 'material_expense',
    'wip_labor_debit': 'inventory_wip',
    'wip_labor_credit': 'labor_expense',
    'wip_overhead_debit': 'inventory_wip',
    'wip_overhead_credit': 'overhead_expense',
    
    # COGM Transfer
    'cogm_debit': 'inventory_finished_goods',
    'cogm_credit': 'inventory_wip',
    
    # COGS Posting
    'cogs_debit': 'cogs',
    'cogs_credit': 'inventory_finished_goods',
    
    # Sales Order
    'sales_debit': 'accounts_receivable',
    'sales_credit': 'sales_revenue',
    
    # Purchase Order
    'purchase_debit': 'inventory_raw_materials',
    'purchase_credit': 'accounts_payable',
    
    # Payment
    'payment_debit': 'accounts_payable',
    'payment_credit': 'cash',
    
    # Receipt
    'receipt_debit': 'cash',
    'receipt_credit': 'accounts_receivable',
}


def get_account_id(account_key):
    """
    Get account ID from account key
    
    Args:
        account_key (str): Account key from ACCOUNT_CODES or TRANSACTION_ACCOUNTS
        
    Returns:
        int: Account ID from database
        
    Raises:
        ValueError: If account key not found or account doesn't exist in database
    """
    from models.finance import Account
    
    # Check if it's a transaction account mapping
    if account_key in TRANSACTION_ACCOUNTS:
        account_key = TRANSACTION_ACCOUNTS[account_key]
    
    # Get account code
    code = ACCOUNT_CODES.get(account_key)
    if not code:
        raise ValueError(f'Account key not found in configuration: {account_key}')
    
    # Query database
    account = Account.query.filter_by(code=code, is_active=True).first()
    if not account:
        raise ValueError(f'Account not found in database: {code} (key: {account_key})')
    
    return account.id


def get_account_code(account_key):
    """
    Get account code from account key
    
    Args:
        account_key (str): Account key from ACCOUNT_CODES
        
    Returns:
        str: Account code
    """
    # Check if it's a transaction account mapping
    if account_key in TRANSACTION_ACCOUNTS:
        account_key = TRANSACTION_ACCOUNTS[account_key]
    
    return ACCOUNT_CODES.get(account_key)


def get_account(account_key):
    """
    Get full account object from account key
    
    Args:
        account_key (str): Account key from ACCOUNT_CODES
        
    Returns:
        Account: Account object from database
    """
    from models.finance import Account
    
    # Check if it's a transaction account mapping
    if account_key in TRANSACTION_ACCOUNTS:
        account_key = TRANSACTION_ACCOUNTS[account_key]
    
    code = ACCOUNT_CODES.get(account_key)
    if not code:
        raise ValueError(f'Account key not found: {account_key}')
    
    account = Account.query.filter_by(code=code, is_active=True).first()
    if not account:
        raise ValueError(f'Account not found: {code}')
    
    return account


def create_journal_entry_lines(transaction_type, amount, description=''):
    """
    Create journal entry lines for common transaction types
    
    Args:
        transaction_type (str): Type of transaction (sales, purchase, payment, etc.)
        amount (float): Transaction amount
        description (str): Optional description
        
    Returns:
        list: List of journal entry line dictionaries
    """
    lines = []
    
    if transaction_type == 'sales':
        lines = [
            {
                'account_id': get_account_id('sales_debit'),
                'debit': amount,
                'credit': 0,
                'description': description or 'Accounts Receivable'
            },
            {
                'account_id': get_account_id('sales_credit'),
                'debit': 0,
                'credit': amount,
                'description': description or 'Sales Revenue'
            }
        ]
    
    elif transaction_type == 'purchase':
        lines = [
            {
                'account_id': get_account_id('purchase_debit'),
                'debit': amount,
                'credit': 0,
                'description': description or 'Raw Materials Inventory'
            },
            {
                'account_id': get_account_id('purchase_credit'),
                'debit': 0,
                'credit': amount,
                'description': description or 'Accounts Payable'
            }
        ]
    
    elif transaction_type == 'wip_material':
        lines = [
            {
                'account_id': get_account_id('wip_material_debit'),
                'debit': amount,
                'credit': 0,
                'description': description or 'WIP - Material'
            },
            {
                'account_id': get_account_id('wip_material_credit'),
                'debit': 0,
                'credit': amount,
                'description': description or 'Material Expense'
            }
        ]
    
    elif transaction_type == 'wip_labor':
        lines = [
            {
                'account_id': get_account_id('wip_labor_debit'),
                'debit': amount,
                'credit': 0,
                'description': description or 'WIP - Labor'
            },
            {
                'account_id': get_account_id('wip_labor_credit'),
                'debit': 0,
                'credit': amount,
                'description': description or 'Labor Expense'
            }
        ]
    
    elif transaction_type == 'wip_overhead':
        lines = [
            {
                'account_id': get_account_id('wip_overhead_debit'),
                'debit': amount,
                'credit': 0,
                'description': description or 'WIP - Overhead'
            },
            {
                'account_id': get_account_id('wip_overhead_credit'),
                'debit': 0,
                'credit': amount,
                'description': description or 'Overhead Expense'
            }
        ]
    
    elif transaction_type == 'cogm':
        lines = [
            {
                'account_id': get_account_id('cogm_debit'),
                'debit': amount,
                'credit': 0,
                'description': description or 'Finished Goods Inventory'
            },
            {
                'account_id': get_account_id('cogm_credit'),
                'debit': 0,
                'credit': amount,
                'description': description or 'WIP Inventory'
            }
        ]
    
    elif transaction_type == 'cogs':
        lines = [
            {
                'account_id': get_account_id('cogs_debit'),
                'debit': amount,
                'credit': 0,
                'description': description or 'Cost of Goods Sold'
            },
            {
                'account_id': get_account_id('cogs_credit'),
                'debit': 0,
                'credit': amount,
                'description': description or 'Finished Goods Inventory'
            }
        ]
    
    return lines


def validate_accounts_exist():
    """
    Validate that all configured accounts exist in database
    Returns list of missing accounts
    """
    from models.finance import Account
    
    missing_accounts = []
    
    for key, code in ACCOUNT_CODES.items():
        account = Account.query.filter_by(code=code).first()
        if not account:
            missing_accounts.append({'key': key, 'code': code})
    
    return missing_accounts


def seed_standard_accounts():
    """
    Seed standard chart of accounts if they don't exist
    This should be run during initial setup
    """
    from models import db
    from models.finance import Account
    
    account_types = {
        '1-': 'asset',
        '2-': 'liability',
        '3-': 'equity',
        '4-': 'revenue',
        '5-': 'expense',
        '6-': 'expense',
        '7-': 'expense',
        '8-': 'expense',
        '9-': 'expense',
    }
    
    created_count = 0
    
    for key, code in ACCOUNT_CODES.items():
        # Check if account exists
        existing = Account.query.filter_by(code=code).first()
        if existing:
            continue
        
        # Determine account type from code
        account_type = 'asset'
        for prefix, atype in account_types.items():
            if code.startswith(prefix):
                account_type = atype
                break
        
        # Create account
        account = Account(
            code=code,
            name=key.replace('_', ' ').title(),
            account_type=account_type,
            is_active=True,
            balance=0
        )
        
        db.session.add(account)
        created_count += 1
    
    if created_count > 0:
        db.session.commit()
        print(f'Created {created_count} standard accounts')
    
    return created_count
