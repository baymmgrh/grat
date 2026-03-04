"""
Seed script for default roles and permissions
Run: python -m scripts.seed_roles
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models import db, Role, Permission, RolePermission

app = create_app()

# Define all modules and their permissions
MODULES = {
    'dashboard': {
        'name': 'Dashboard',
        'actions': ['view']
    },
    'executive_dashboard': {
        'name': 'Executive Dashboard',
        'actions': ['view']
    },
    'sales': {
        'name': 'Sales',
        'actions': ['view', 'create', 'edit', 'delete', 'approve']
    },
    'leads': {
        'name': 'Leads',
        'actions': ['view', 'create', 'edit', 'delete', 'convert']
    },
    'quotations': {
        'name': 'Quotations',
        'actions': ['view', 'create', 'edit', 'delete', 'approve', 'convert']
    },
    'sales_orders': {
        'name': 'Sales Orders',
        'actions': ['view', 'create', 'edit', 'delete', 'approve', 'confirm', 'ship']
    },
    'customers': {
        'name': 'Customers',
        'actions': ['view', 'create', 'edit', 'delete']
    },
    'purchasing': {
        'name': 'Purchasing',
        'actions': ['view', 'create', 'edit', 'delete', 'approve']
    },
    'purchase_requests': {
        'name': 'Purchase Requests',
        'actions': ['view', 'create', 'edit', 'delete', 'approve']
    },
    'purchase_orders': {
        'name': 'Purchase Orders',
        'actions': ['view', 'create', 'edit', 'delete', 'approve', 'receive']
    },
    'suppliers': {
        'name': 'Suppliers',
        'actions': ['view', 'create', 'edit', 'delete']
    },
    'inventory': {
        'name': 'Inventory',
        'actions': ['view', 'create', 'edit', 'delete', 'adjust']
    },
    'products': {
        'name': 'Products',
        'actions': ['view', 'create', 'edit', 'delete']
    },
    'materials': {
        'name': 'Materials',
        'actions': ['view', 'create', 'edit', 'delete']
    },
    'warehouse': {
        'name': 'Warehouse',
        'actions': ['view', 'create', 'edit', 'delete', 'transfer']
    },
    'production': {
        'name': 'Production',
        'actions': ['view', 'create', 'edit', 'delete', 'start', 'complete']
    },
    'work_orders': {
        'name': 'Work Orders',
        'actions': ['view', 'create', 'edit', 'delete', 'release', 'complete']
    },
    'bom': {
        'name': 'Bill of Materials',
        'actions': ['view', 'create', 'edit', 'delete']
    },
    'mrp': {
        'name': 'MRP',
        'actions': ['view', 'run', 'configure']
    },
    'oee': {
        'name': 'OEE',
        'actions': ['view', 'create', 'edit', 'delete']
    },
    'maintenance': {
        'name': 'Maintenance',
        'actions': ['view', 'create', 'edit', 'delete', 'schedule']
    },
    'quality': {
        'name': 'Quality Control',
        'actions': ['view', 'create', 'edit', 'delete', 'approve']
    },
    'rd': {
        'name': 'R&D',
        'actions': ['view', 'create', 'edit', 'delete']
    },
    'shipping': {
        'name': 'Shipping',
        'actions': ['view', 'create', 'edit', 'delete', 'dispatch']
    },
    'returns': {
        'name': 'Returns',
        'actions': ['view', 'create', 'edit', 'delete', 'process']
    },
    'waste': {
        'name': 'Waste Management',
        'actions': ['view', 'create', 'edit', 'delete']
    },
    'finance': {
        'name': 'Finance',
        'actions': ['view', 'create', 'edit', 'delete', 'approve', 'post']
    },
    'journal': {
        'name': 'Journal Entries',
        'actions': ['view', 'create', 'edit', 'delete', 'post']
    },
    'ar': {
        'name': 'Accounts Receivable',
        'actions': ['view', 'create', 'edit', 'delete']
    },
    'ap': {
        'name': 'Accounts Payable',
        'actions': ['view', 'create', 'edit', 'delete']
    },
    'documents': {
        'name': 'Documents',
        'actions': ['view', 'create', 'edit', 'delete', 'print', 'design']
    },
    'templates': {
        'name': 'Document Templates',
        'actions': ['view', 'create', 'edit', 'delete']
    },
    'hr': {
        'name': 'Human Resources',
        'actions': ['view', 'create', 'edit', 'delete']
    },
    'employees': {
        'name': 'Employees',
        'actions': ['view', 'create', 'edit', 'delete']
    },
    'attendance': {
        'name': 'Attendance',
        'actions': ['view', 'create', 'edit', 'delete']
    },
    'payroll': {
        'name': 'Payroll',
        'actions': ['view', 'create', 'edit', 'delete', 'process', 'approve']
    },
    'leave': {
        'name': 'Leave Management',
        'actions': ['view', 'create', 'edit', 'delete', 'approve']
    },
    'roster': {
        'name': 'Roster/Shift',
        'actions': ['view', 'create', 'edit', 'delete']
    },
    'training': {
        'name': 'Training',
        'actions': ['view', 'create', 'edit', 'delete']
    },
    'appraisal': {
        'name': 'Performance Appraisal',
        'actions': ['view', 'create', 'edit', 'delete', 'approve']
    },
    'approval': {
        'name': 'Approval Workflow',
        'actions': ['view', 'approve', 'reject']
    },
    'reports': {
        'name': 'Reports',
        'actions': ['view', 'create', 'export', 'schedule']
    },
    'tv_display': {
        'name': 'TV Display',
        'actions': ['view', 'configure']
    },
    'integration': {
        'name': 'Integration',
        'actions': ['view', 'configure', 'sync']
    },
    'ai_assistant': {
        'name': 'AI Assistant',
        'actions': ['view', 'use']
    },
    'settings': {
        'name': 'Settings',
        'actions': ['view', 'edit']
    },
    'users': {
        'name': 'User Management',
        'actions': ['view', 'create', 'edit', 'delete']
    },
    'roles': {
        'name': 'Role Management',
        'actions': ['view', 'create', 'edit', 'delete']
    },
    'audit': {
        'name': 'Audit Trail',
        'actions': ['view']
    },
    'backup': {
        'name': 'Backup & Restore',
        'actions': ['view', 'backup', 'restore']
    }
}

# Define default roles with their permissions
# Struktur organisasi lengkap dari Top Management hingga Operator
DEFAULT_ROLES = {
    # ==================== TOP MANAGEMENT ====================
    'Super Admin': {
        'description': 'System administrator dengan akses penuh ke semua fitur',
        'permissions': 'all'  # Special: gets all permissions
    },
    'Direktur Utama': {
        'description': 'CEO/Direktur Utama - akses executive dashboard dan approval tingkat tinggi',
        'permissions': {
            'dashboard': ['view'],
            'executive_dashboard': ['view'],
            'sales': ['view', 'approve'],
            'sales_orders': ['view', 'approve'],
            'quotations': ['view', 'approve'],
            'purchasing': ['view', 'approve'],
            'purchase_orders': ['view', 'approve'],
            'finance': ['view', 'approve'],
            'hr': ['view'],
            'employees': ['view'],
            'payroll': ['view', 'approve'],
            'production': ['view'],
            'approval': ['view', 'approve', 'reject'],
            'reports': ['view', 'export'],
            'audit': ['view']
        }
    },
    'Direktur Operasional': {
        'description': 'COO - mengawasi operasional produksi, warehouse, dan supply chain',
        'permissions': {
            'dashboard': ['view'],
            'executive_dashboard': ['view'],
            'production': ['view', 'create', 'edit', 'start', 'complete'],
            'work_orders': ['view', 'create', 'edit', 'release', 'complete'],
            'bom': ['view', 'create', 'edit'],
            'mrp': ['view', 'run', 'configure'],
            'oee': ['view', 'create', 'edit'],
            'quality': ['view', 'approve'],
            'maintenance': ['view', 'approve', 'schedule'],
            'warehouse': ['view', 'create', 'edit', 'transfer'],
            'inventory': ['view', 'adjust'],
            'shipping': ['view', 'approve'],
            'purchasing': ['view', 'approve'],
            'purchase_orders': ['view', 'approve'],
            'suppliers': ['view'],
            'approval': ['view', 'approve', 'reject'],
            'reports': ['view', 'create', 'export'],
            'tv_display': ['view', 'configure']
        }
    },
    'Direktur Keuangan': {
        'description': 'CFO - mengawasi keuangan, akuntansi, dan anggaran',
        'permissions': {
            'dashboard': ['view'],
            'executive_dashboard': ['view'],
            'finance': ['view', 'create', 'edit', 'delete', 'approve', 'post'],
            'journal': ['view', 'create', 'edit', 'delete', 'post'],
            'ar': ['view', 'create', 'edit', 'delete'],
            'ap': ['view', 'create', 'edit', 'delete'],
            'payroll': ['view', 'approve'],
            'sales': ['view'],
            'sales_orders': ['view'],
            'purchasing': ['view'],
            'purchase_orders': ['view'],
            'approval': ['view', 'approve', 'reject'],
            'reports': ['view', 'create', 'export', 'schedule'],
            'audit': ['view']
        }
    },
    'Direktur HRD': {
        'description': 'CHRO - mengawasi SDM, rekrutmen, dan pengembangan karyawan',
        'permissions': {
            'dashboard': ['view'],
            'executive_dashboard': ['view'],
            'hr': ['view', 'create', 'edit', 'delete'],
            'employees': ['view', 'create', 'edit', 'delete'],
            'attendance': ['view', 'create', 'edit', 'delete'],
            'payroll': ['view', 'create', 'edit', 'delete', 'process', 'approve'],
            'leave': ['view', 'create', 'edit', 'delete', 'approve'],
            'roster': ['view', 'create', 'edit', 'delete'],
            'training': ['view', 'create', 'edit', 'delete'],
            'appraisal': ['view', 'create', 'edit', 'delete', 'approve'],
            'approval': ['view', 'approve', 'reject'],
            'reports': ['view', 'create', 'export'],
            'audit': ['view']
        }
    },
    
    # ==================== MIDDLE MANAGEMENT ====================
    'General Manager': {
        'description': 'GM - mengelola operasional harian perusahaan',
        'permissions': {
            'dashboard': ['view'],
            'executive_dashboard': ['view'],
            'sales': ['view', 'create', 'edit', 'approve'],
            'leads': ['view', 'create', 'edit', 'convert'],
            'quotations': ['view', 'create', 'edit', 'approve', 'convert'],
            'sales_orders': ['view', 'create', 'edit', 'approve', 'confirm'],
            'customers': ['view', 'create', 'edit'],
            'purchasing': ['view', 'create', 'edit', 'approve'],
            'purchase_requests': ['view', 'create', 'edit', 'approve'],
            'purchase_orders': ['view', 'create', 'edit', 'approve'],
            'suppliers': ['view', 'create', 'edit'],
            'inventory': ['view', 'create', 'edit', 'adjust'],
            'products': ['view', 'create', 'edit'],
            'materials': ['view', 'create', 'edit'],
            'warehouse': ['view', 'create', 'edit', 'transfer'],
            'production': ['view', 'create', 'edit', 'start', 'complete'],
            'work_orders': ['view', 'create', 'edit', 'release', 'complete'],
            'bom': ['view', 'create', 'edit'],
            'finance': ['view', 'create', 'edit', 'approve'],
            'documents': ['view', 'create', 'edit', 'print'],
            'hr': ['view', 'create', 'edit'],
            'employees': ['view', 'create', 'edit'],
            'approval': ['view', 'approve', 'reject'],
            'reports': ['view', 'create', 'export']
        }
    },
    'Manager Produksi': {
        'description': 'Kepala produksi - mengelola seluruh aktivitas produksi',
        'permissions': {
            'dashboard': ['view'],
            'production': ['view', 'create', 'edit', 'delete', 'start', 'complete'],
            'work_orders': ['view', 'create', 'edit', 'delete', 'release', 'complete'],
            'bom': ['view', 'create', 'edit', 'delete'],
            'mrp': ['view', 'run', 'configure'],
            'oee': ['view', 'create', 'edit', 'delete'],
            'quality': ['view', 'create', 'edit', 'approve'],
            'maintenance': ['view', 'create', 'edit', 'schedule'],
            'waste': ['view', 'create', 'edit', 'delete'],
            'materials': ['view', 'create', 'edit'],
            'inventory': ['view', 'adjust'],
            'warehouse': ['view', 'transfer'],
            'employees': ['view'],
            'roster': ['view', 'create', 'edit'],
            'attendance': ['view'],
            'approval': ['view', 'approve', 'reject'],
            'documents': ['view', 'print'],
            'reports': ['view', 'create', 'export'],
            'tv_display': ['view', 'configure']
        }
    },
    'Manager Sales': {
        'description': 'Kepala penjualan - mengelola tim sales dan target penjualan',
        'permissions': {
            'dashboard': ['view'],
            'executive_dashboard': ['view'],
            'sales': ['view', 'create', 'edit', 'delete', 'approve'],
            'leads': ['view', 'create', 'edit', 'delete', 'convert'],
            'quotations': ['view', 'create', 'edit', 'delete', 'approve', 'convert'],
            'sales_orders': ['view', 'create', 'edit', 'delete', 'approve', 'confirm'],
            'customers': ['view', 'create', 'edit', 'delete'],
            'products': ['view'],
            'inventory': ['view'],
            'shipping': ['view'],
            'returns': ['view', 'approve'],
            'ar': ['view'],
            'employees': ['view'],
            'approval': ['view', 'approve', 'reject'],
            'documents': ['view', 'create', 'print'],
            'reports': ['view', 'create', 'export']
        }
    },
    'Manager Purchasing': {
        'description': 'Kepala pembelian - mengelola pengadaan dan vendor',
        'permissions': {
            'dashboard': ['view'],
            'purchasing': ['view', 'create', 'edit', 'delete', 'approve'],
            'purchase_requests': ['view', 'create', 'edit', 'delete', 'approve'],
            'purchase_orders': ['view', 'create', 'edit', 'delete', 'approve', 'receive'],
            'suppliers': ['view', 'create', 'edit', 'delete'],
            'products': ['view'],
            'materials': ['view', 'create', 'edit'],
            'inventory': ['view'],
            'warehouse': ['view'],
            'ap': ['view'],
            'employees': ['view'],
            'approval': ['view', 'approve', 'reject'],
            'documents': ['view', 'create', 'print'],
            'reports': ['view', 'create', 'export']
        }
    },
    'Manager Warehouse': {
        'description': 'Kepala gudang - mengelola inventory dan logistik',
        'permissions': {
            'dashboard': ['view'],
            'warehouse': ['view', 'create', 'edit', 'delete', 'transfer'],
            'inventory': ['view', 'create', 'edit', 'delete', 'adjust'],
            'products': ['view'],
            'materials': ['view', 'create', 'edit', 'delete'],
            'shipping': ['view', 'create', 'edit', 'delete', 'dispatch'],
            'returns': ['view', 'create', 'edit', 'delete', 'process'],
            'purchase_orders': ['view', 'receive'],
            'sales_orders': ['view', 'ship'],
            'employees': ['view'],
            'roster': ['view', 'create', 'edit'],
            'approval': ['view', 'approve', 'reject'],
            'documents': ['view', 'print'],
            'reports': ['view', 'create', 'export'],
            'tv_display': ['view', 'configure']
        }
    },
    'Manager Finance': {
        'description': 'Kepala keuangan - mengelola akuntansi dan pelaporan keuangan',
        'permissions': {
            'dashboard': ['view'],
            'executive_dashboard': ['view'],
            'finance': ['view', 'create', 'edit', 'delete', 'approve', 'post'],
            'journal': ['view', 'create', 'edit', 'delete', 'post'],
            'ar': ['view', 'create', 'edit', 'delete'],
            'ap': ['view', 'create', 'edit', 'delete'],
            'sales': ['view'],
            'sales_orders': ['view'],
            'purchasing': ['view'],
            'purchase_orders': ['view'],
            'approval': ['view', 'approve', 'reject'],
            'documents': ['view', 'print'],
            'reports': ['view', 'create', 'export', 'schedule']
        }
    },
    'Manager HRD': {
        'description': 'Kepala HRD - mengelola SDM dan administrasi kepegawaian',
        'permissions': {
            'dashboard': ['view'],
            'hr': ['view', 'create', 'edit', 'delete'],
            'employees': ['view', 'create', 'edit', 'delete'],
            'attendance': ['view', 'create', 'edit', 'delete'],
            'payroll': ['view', 'create', 'edit', 'delete', 'process', 'approve'],
            'leave': ['view', 'create', 'edit', 'delete', 'approve'],
            'roster': ['view', 'create', 'edit', 'delete'],
            'training': ['view', 'create', 'edit', 'delete'],
            'appraisal': ['view', 'create', 'edit', 'delete', 'approve'],
            'approval': ['view', 'approve', 'reject'],
            'documents': ['view', 'print'],
            'reports': ['view', 'create', 'export']
        }
    },
    'Manager QC': {
        'description': 'Kepala Quality Control - mengelola standar kualitas',
        'permissions': {
            'dashboard': ['view'],
            'quality': ['view', 'create', 'edit', 'delete', 'approve'],
            'production': ['view'],
            'work_orders': ['view'],
            'products': ['view', 'edit'],
            'materials': ['view'],
            'rd': ['view'],
            'employees': ['view'],
            'approval': ['view', 'approve', 'reject'],
            'documents': ['view', 'print'],
            'reports': ['view', 'create', 'export']
        }
    },
    'Manager Maintenance': {
        'description': 'Kepala maintenance - mengelola perawatan mesin dan fasilitas',
        'permissions': {
            'dashboard': ['view'],
            'maintenance': ['view', 'create', 'edit', 'delete', 'schedule'],
            'oee': ['view', 'create', 'edit'],
            'production': ['view'],
            'work_orders': ['view'],
            'inventory': ['view'],
            'materials': ['view'],
            'employees': ['view'],
            'roster': ['view', 'create', 'edit'],
            'approval': ['view', 'approve', 'reject'],
            'documents': ['view', 'print'],
            'reports': ['view', 'create', 'export']
        }
    },
    'Manager R&D': {
        'description': 'Kepala R&D - mengelola riset dan pengembangan produk',
        'permissions': {
            'dashboard': ['view'],
            'rd': ['view', 'create', 'edit', 'delete'],
            'bom': ['view', 'create', 'edit', 'delete'],
            'products': ['view', 'create', 'edit', 'delete'],
            'materials': ['view', 'create', 'edit'],
            'quality': ['view', 'create', 'edit'],
            'production': ['view'],
            'employees': ['view'],
            'approval': ['view', 'approve', 'reject'],
            'documents': ['view', 'create', 'print'],
            'reports': ['view', 'create', 'export']
        }
    },
    
    # ==================== SUPERVISOR / TEAM LEAD ====================
    'Supervisor Produksi': {
        'description': 'Supervisor produksi - mengawasi lini produksi',
        'permissions': {
            'dashboard': ['view'],
            'production': ['view', 'create', 'edit', 'start', 'complete'],
            'work_orders': ['view', 'create', 'edit', 'release', 'complete'],
            'bom': ['view', 'create', 'edit'],
            'mrp': ['view', 'run'],
            'oee': ['view', 'create', 'edit'],
            'quality': ['view', 'create', 'edit'],
            'maintenance': ['view', 'create', 'edit'],
            'waste': ['view', 'create', 'edit'],
            'materials': ['view', 'create', 'edit'],
            'inventory': ['view', 'adjust'],
            'roster': ['view'],
            'attendance': ['view', 'create', 'edit'],
            'documents': ['view', 'print'],
            'reports': ['view', 'create', 'export'],
            'tv_display': ['view']
        }
    },
    'Supervisor Warehouse': {
        'description': 'Supervisor gudang - mengawasi operasional gudang',
        'permissions': {
            'dashboard': ['view'],
            'warehouse': ['view', 'create', 'edit', 'transfer'],
            'inventory': ['view', 'create', 'edit', 'adjust'],
            'products': ['view'],
            'materials': ['view', 'create', 'edit'],
            'shipping': ['view', 'create', 'edit', 'dispatch'],
            'returns': ['view', 'create', 'edit', 'process'],
            'purchase_orders': ['view', 'receive'],
            'sales_orders': ['view', 'ship'],
            'roster': ['view'],
            'attendance': ['view', 'create', 'edit'],
            'documents': ['view', 'print'],
            'reports': ['view', 'create'],
            'tv_display': ['view']
        }
    },
    'Supervisor QC': {
        'description': 'Supervisor QC - mengawasi inspeksi kualitas',
        'permissions': {
            'dashboard': ['view'],
            'quality': ['view', 'create', 'edit', 'approve'],
            'production': ['view'],
            'work_orders': ['view'],
            'products': ['view'],
            'materials': ['view'],
            'attendance': ['view', 'create', 'edit'],
            'documents': ['view', 'print'],
            'reports': ['view', 'create']
        }
    },
    'Team Lead Sales': {
        'description': 'Team lead sales - memimpin tim sales',
        'permissions': {
            'dashboard': ['view'],
            'sales': ['view', 'create', 'edit'],
            'leads': ['view', 'create', 'edit', 'convert'],
            'quotations': ['view', 'create', 'edit', 'convert'],
            'sales_orders': ['view', 'create', 'edit'],
            'customers': ['view', 'create', 'edit'],
            'products': ['view'],
            'inventory': ['view'],
            'documents': ['view', 'print'],
            'reports': ['view', 'create']
        }
    },
    
    # ==================== STAFF / OFFICER ====================
    'Admin Staff': {
        'description': 'Staff administrasi umum',
        'permissions': {
            'dashboard': ['view'],
            'documents': ['view', 'create', 'edit', 'print'],
            'templates': ['view'],
            'reports': ['view'],
            'settings': ['view']
        }
    },
    'Sales Staff': {
        'description': 'Staff penjualan',
        'permissions': {
            'dashboard': ['view'],
            'sales': ['view', 'create', 'edit'],
            'leads': ['view', 'create', 'edit', 'convert'],
            'quotations': ['view', 'create', 'edit', 'convert'],
            'sales_orders': ['view', 'create', 'edit'],
            'customers': ['view', 'create', 'edit'],
            'products': ['view'],
            'inventory': ['view'],
            'documents': ['view', 'print'],
            'reports': ['view']
        }
    },
    'Purchasing Staff': {
        'description': 'Staff pembelian',
        'permissions': {
            'dashboard': ['view'],
            'purchasing': ['view', 'create', 'edit'],
            'purchase_requests': ['view', 'create', 'edit'],
            'purchase_orders': ['view', 'create', 'edit', 'receive'],
            'suppliers': ['view', 'create', 'edit'],
            'products': ['view'],
            'materials': ['view'],
            'inventory': ['view'],
            'documents': ['view', 'print'],
            'reports': ['view']
        }
    },
    'Finance Staff': {
        'description': 'Staff keuangan dan akuntansi',
        'permissions': {
            'dashboard': ['view'],
            'finance': ['view', 'create', 'edit'],
            'journal': ['view', 'create', 'edit'],
            'ar': ['view', 'create', 'edit'],
            'ap': ['view', 'create', 'edit'],
            'documents': ['view', 'print'],
            'reports': ['view', 'create', 'export']
        }
    },
    'HR Staff': {
        'description': 'Staff HRD',
        'permissions': {
            'dashboard': ['view'],
            'hr': ['view', 'create', 'edit'],
            'employees': ['view', 'create', 'edit'],
            'attendance': ['view', 'create', 'edit'],
            'leave': ['view', 'create', 'edit'],
            'roster': ['view', 'create', 'edit'],
            'training': ['view', 'create', 'edit'],
            'documents': ['view', 'print'],
            'reports': ['view']
        }
    },
    'Warehouse Staff': {
        'description': 'Staff gudang',
        'permissions': {
            'dashboard': ['view'],
            'warehouse': ['view', 'create', 'edit', 'transfer'],
            'inventory': ['view', 'create', 'edit'],
            'products': ['view'],
            'materials': ['view', 'create', 'edit'],
            'shipping': ['view', 'create', 'edit'],
            'returns': ['view', 'create', 'edit'],
            'documents': ['view', 'print'],
            'reports': ['view']
        }
    },
    'QC Staff': {
        'description': 'Staff quality control / inspector',
        'permissions': {
            'dashboard': ['view'],
            'quality': ['view', 'create', 'edit'],
            'production': ['view'],
            'work_orders': ['view'],
            'products': ['view'],
            'documents': ['view', 'print'],
            'reports': ['view']
        }
    },
    'Maintenance Staff': {
        'description': 'Staff maintenance / teknisi',
        'permissions': {
            'dashboard': ['view'],
            'maintenance': ['view', 'create', 'edit'],
            'oee': ['view'],
            'production': ['view'],
            'documents': ['view', 'print'],
            'reports': ['view']
        }
    },
    'R&D Staff': {
        'description': 'Staff riset dan pengembangan',
        'permissions': {
            'dashboard': ['view'],
            'rd': ['view', 'create', 'edit'],
            'bom': ['view', 'create', 'edit'],
            'products': ['view', 'create', 'edit'],
            'materials': ['view'],
            'quality': ['view'],
            'documents': ['view', 'print'],
            'reports': ['view']
        }
    },
    
    # ==================== OPERATOR / WORKER ====================
    'Operator Produksi': {
        'description': 'Operator mesin produksi',
        'permissions': {
            'dashboard': ['view'],
            'production': ['view', 'create', 'edit', 'start', 'complete'],
            'work_orders': ['view', 'complete'],
            'bom': ['view'],
            'oee': ['view', 'create'],
            'quality': ['view', 'create'],
            'waste': ['view', 'create'],
            'materials': ['view'],
            'inventory': ['view'],
            'attendance': ['view'],
            'tv_display': ['view']
        }
    },
    'Operator Mesin': {
        'description': 'Operator mesin spesifik (extruder, slitting, dll)',
        'permissions': {
            'dashboard': ['view'],
            'production': ['view', 'start', 'complete'],
            'work_orders': ['view', 'complete'],
            'oee': ['view', 'create'],
            'quality': ['view', 'create'],
            'waste': ['view', 'create'],
            'materials': ['view'],
            'maintenance': ['view', 'create'],
            'attendance': ['view'],
            'tv_display': ['view']
        }
    },
    'Operator Forklift': {
        'description': 'Operator forklift untuk material handling',
        'permissions': {
            'dashboard': ['view'],
            'warehouse': ['view', 'transfer'],
            'inventory': ['view'],
            'materials': ['view'],
            'shipping': ['view'],
            'attendance': ['view'],
            'tv_display': ['view']
        }
    },
    'Staff Packing': {
        'description': 'Karyawan bagian packing/pengemasan',
        'permissions': {
            'dashboard': ['view'],
            'production': ['view', 'complete'],
            'work_orders': ['view', 'complete'],
            'shipping': ['view', 'create', 'edit'],
            'inventory': ['view'],
            'products': ['view'],
            'quality': ['view', 'create'],
            'waste': ['view', 'create'],
            'attendance': ['view'],
            'tv_display': ['view']
        }
    },
    'Staff Shipping': {
        'description': 'Karyawan bagian pengiriman',
        'permissions': {
            'dashboard': ['view'],
            'shipping': ['view', 'create', 'edit', 'dispatch'],
            'sales_orders': ['view', 'ship'],
            'warehouse': ['view'],
            'inventory': ['view'],
            'products': ['view'],
            'customers': ['view'],
            'documents': ['view', 'print'],
            'attendance': ['view'],
            'tv_display': ['view']
        }
    },
    'Staff Receiving': {
        'description': 'Karyawan bagian penerimaan barang',
        'permissions': {
            'dashboard': ['view'],
            'purchase_orders': ['view', 'receive'],
            'warehouse': ['view', 'create', 'edit'],
            'inventory': ['view', 'create', 'edit'],
            'materials': ['view', 'create', 'edit'],
            'suppliers': ['view'],
            'quality': ['view', 'create'],
            'documents': ['view', 'print'],
            'attendance': ['view']
        }
    },
    'Helper Produksi': {
        'description': 'Helper/pembantu di area produksi',
        'permissions': {
            'dashboard': ['view'],
            'production': ['view'],
            'work_orders': ['view'],
            'materials': ['view'],
            'waste': ['view', 'create'],
            'attendance': ['view'],
            'tv_display': ['view']
        }
    },
    'Helper Gudang': {
        'description': 'Helper/pembantu di gudang',
        'permissions': {
            'dashboard': ['view'],
            'warehouse': ['view'],
            'inventory': ['view'],
            'materials': ['view'],
            'shipping': ['view'],
            'attendance': ['view'],
            'tv_display': ['view']
        }
    },
    
    # ==================== SPECIAL ROLES ====================
    'IT Admin': {
        'description': 'Administrator IT - mengelola sistem dan user',
        'permissions': {
            'dashboard': ['view'],
            'settings': ['view', 'edit'],
            'users': ['view', 'create', 'edit', 'delete'],
            'roles': ['view', 'create', 'edit', 'delete'],
            'audit': ['view'],
            'backup': ['view', 'backup', 'restore'],
            'integration': ['view', 'configure', 'sync'],
            'documents': ['view', 'create', 'edit', 'delete', 'print', 'design'],
            'templates': ['view', 'create', 'edit', 'delete'],
            'reports': ['view', 'create', 'export', 'schedule']
        }
    },
    'Auditor': {
        'description': 'Internal auditor - akses read-only untuk audit',
        'permissions': {
            'dashboard': ['view'],
            'executive_dashboard': ['view'],
            'sales': ['view'],
            'leads': ['view'],
            'quotations': ['view'],
            'sales_orders': ['view'],
            'customers': ['view'],
            'purchasing': ['view'],
            'purchase_requests': ['view'],
            'purchase_orders': ['view'],
            'suppliers': ['view'],
            'inventory': ['view'],
            'products': ['view'],
            'materials': ['view'],
            'warehouse': ['view'],
            'production': ['view'],
            'work_orders': ['view'],
            'bom': ['view'],
            'finance': ['view'],
            'journal': ['view'],
            'ar': ['view'],
            'ap': ['view'],
            'hr': ['view'],
            'employees': ['view'],
            'payroll': ['view'],
            'quality': ['view'],
            'audit': ['view'],
            'documents': ['view'],
            'reports': ['view', 'export']
        }
    },
    'Viewer': {
        'description': 'Read-only access - hanya bisa melihat data',
        'permissions': {
            'dashboard': ['view'],
            'sales': ['view'],
            'leads': ['view'],
            'quotations': ['view'],
            'sales_orders': ['view'],
            'customers': ['view'],
            'purchasing': ['view'],
            'purchase_orders': ['view'],
            'suppliers': ['view'],
            'inventory': ['view'],
            'products': ['view'],
            'materials': ['view'],
            'warehouse': ['view'],
            'production': ['view'],
            'work_orders': ['view'],
            'bom': ['view'],
            'finance': ['view'],
            'documents': ['view'],
            'hr': ['view'],
            'reports': ['view']
        }
    },
    'Guest': {
        'description': 'Tamu - akses sangat terbatas',
        'permissions': {
            'dashboard': ['view'],
            'products': ['view'],
            'tv_display': ['view']
        }
    }
}


def seed_permissions():
    """Create all permissions"""
    print("Seeding permissions...")
    created = 0
    
    for module_key, module_data in MODULES.items():
        for action in module_data['actions']:
            perm_name = f"{module_key}.{action}"
            
            # Check if permission exists
            existing = Permission.query.filter_by(name=perm_name).first()
            if not existing:
                permission = Permission(
                    name=perm_name,
                    resource=module_key,
                    module=module_data['name'],
                    action=action,
                    description=f"{action.title()} {module_data['name']}",
                    is_active=True
                )
                db.session.add(permission)
                created += 1
                print(f"  Created: {perm_name}")
    
    db.session.commit()
    print(f"Created {created} permissions")
    return created


def seed_roles():
    """Create default roles with permissions"""
    print("\nSeeding roles...")
    created = 0
    
    # Get all permissions
    all_permissions = {p.name: p for p in Permission.query.all()}
    
    for role_name, role_data in DEFAULT_ROLES.items():
        # Check if role exists
        existing = Role.query.filter_by(name=role_name).first()
        if existing:
            print(f"  Skipped (exists): {role_name}")
            continue
        
        # Create role
        role = Role(
            name=role_name,
            description=role_data['description'],
            is_active=True
        )
        db.session.add(role)
        db.session.flush()
        
        # Assign permissions
        if role_data['permissions'] == 'all':
            # Super Admin gets all permissions
            for perm in all_permissions.values():
                rp = RolePermission(role_id=role.id, permission_id=perm.id)
                db.session.add(rp)
        else:
            # Assign specific permissions
            for module_key, actions in role_data['permissions'].items():
                for action in actions:
                    perm_name = f"{module_key}.{action}"
                    if perm_name in all_permissions:
                        rp = RolePermission(
                            role_id=role.id,
                            permission_id=all_permissions[perm_name].id
                        )
                        db.session.add(rp)
        
        created += 1
        print(f"  Created: {role_name}")
    
    db.session.commit()
    print(f"Created {created} roles")
    return created


def main():
    with app.app_context():
        print("=" * 50)
        print("ERP Flask - Role & Permission Seeder")
        print("=" * 50)
        
        perm_count = seed_permissions()
        role_count = seed_roles()
        
        print("\n" + "=" * 50)
        print(f"Summary: {perm_count} permissions, {role_count} roles created")
        print("=" * 50)


if __name__ == '__main__':
    main()
