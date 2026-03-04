"""
AI Assistant Route - Internal ERP Query Assistant
Menjawab pertanyaan seputar data ERP tanpa AI eksternal
Bahasa: Indonesia Modern & Santai 🇮🇩

Features:
- Regex-based intent detection
- Slash commands (/help, /stock, /sales, /production, etc.)
- Mini charts & tables in chat
- Deep linking to modules
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.product import Product, Material
from models.warehouse import Inventory, WarehouseLocation
from models.sales import SalesOrder, SalesOrderItem, Customer
from models.purchasing import PurchaseOrder, PurchaseOrderItem, Supplier
from models.production import WorkOrder, Machine, BillOfMaterials, BOMItem
from models.maintenance import MaintenanceRecord
from models.user import User
# Finance models
from models.finance import Invoice, Payment, CostCenter
# HR models
from models.hr import Employee, Department, Attendance, ShiftSchedule
# Quality models
from models.quality import QualityTest, QualityInspection, QualityStandard
# OEE models
from models.oee import OEERecord, OEEDowntimeRecord, QualityDefect
# Shipping models
from models.shipping import ShippingOrder, DeliveryTracking, LogisticsProvider
# R&D models
from models.rd import ResearchProject, ProductDevelopment, Experiment
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
import re
import random
import json
from utils.timezone import get_local_now, get_local_today

# ===========================================
# SLASH COMMANDS CONFIGURATION
# ===========================================
SLASH_COMMANDS = {
    '/help': {
        'description': 'Tampilkan daftar perintah',
        'handler': 'handle_help_command'
    },
    '/stock': {
        'description': 'Cek stok barang. Contoh: /stock gula',
        'handler': 'handle_stock_command',
        'aliases': ['/stok', '/inventory']
    },
    '/sales': {
        'description': 'Info penjualan. Contoh: /sales hari ini',
        'handler': 'handle_sales_command',
        'aliases': ['/penjualan', '/so']
    },
    '/production': {
        'description': 'Info produksi. Contoh: /production hari ini',
        'handler': 'handle_production_command',
        'aliases': ['/produksi', '/wo']
    },
    '/po': {
        'description': 'Info purchase order. Contoh: /po pending',
        'handler': 'handle_po_command',
        'aliases': ['/purchase', '/pembelian']
    },
    '/oee': {
        'description': 'Cek OEE mesin. Contoh: /oee MC001',
        'handler': 'handle_oee_command',
        'aliases': ['/efisiensi', '/efficiency']
    },
    '/bom': {
        'description': 'Lihat BOM produk. Contoh: /bom ANDALAN',
        'handler': 'handle_bom_command',
        'aliases': ['/formula', '/resep']
    },
    '/employee': {
        'description': 'Info karyawan. Contoh: /employee aktif',
        'handler': 'handle_employee_command',
        'aliases': ['/karyawan', '/staff']
    },
    '/chart': {
        'description': 'Tampilkan grafik. Contoh: /chart sales bulan ini',
        'handler': 'handle_chart_command',
        'aliases': ['/grafik', '/graph']
    },
    '/goto': {
        'description': 'Deep link ke halaman. Contoh: /goto dashboard',
        'handler': 'handle_goto_command',
        'aliases': ['/go', '/buka', '/open']
    }
}

# Deep linking routes
DEEP_LINKS = {
    'dashboard': '/app/dashboard',
    'sales': '/app/sales/orders',
    'production': '/app/production/work-orders',
    'inventory': '/app/warehouse/inventory',
    'stock': '/app/warehouse/inventory',
    'material': '/app/warehouse/materials',
    'product': '/app/products',
    'bom': '/app/products/bom',
    'po': '/app/purchasing/orders',
    'purchase': '/app/purchasing/orders',
    'supplier': '/app/purchasing/suppliers',
    'customer': '/app/sales/customers',
    'oee': '/app/oee/dashboard',
    'quality': '/app/quality/inspections',
    'maintenance': '/app/maintenance',
    'shipping': '/app/shipping/orders',
    'hr': '/app/hr/employees',
    'employee': '/app/hr/employees',
    'attendance': '/app/hr/attendance',
    'finance': '/app/finance/dashboard',
    'invoice': '/app/finance/invoices',
    'rd': '/app/rd/dashboard',
    'rnd': '/app/rnd/dashboard',
    'report': '/app/reports',
    'setting': '/app/settings'
}

# Regex patterns for enhanced parsing
REGEX_PATTERNS = {
    'product_code': re.compile(r'\b([A-Z]{2,4}[\-_]?\d{3,6})\b', re.IGNORECASE),
    'date_range': re.compile(r'(\d{1,2})[/\-](\d{1,2})[/\-]?(\d{2,4})?'),
    'quantity': re.compile(r'(\d+(?:[.,]\d+)?)\s*(pcs|kg|liter|box|karton|roll|meter|unit)?', re.IGNORECASE),
    'money': re.compile(r'(?:rp\.?\s?)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)(?:\s*(?:juta|ribu|rb|jt))?', re.IGNORECASE),
    'percentage': re.compile(r'(\d+(?:[.,]\d+)?)\s*%'),
    'machine_code': re.compile(r'\b(MC|M|LINE)[\-_]?(\d{1,3})\b', re.IGNORECASE),
    'time_period': re.compile(r'(hari ini|kemarin|minggu ini|bulan ini|tahun ini|today|yesterday|this week|this month)', re.IGNORECASE),
    'comparison': re.compile(r'(lebih|kurang|>=?|<=?|sama dengan|>|<)\s*(\d+)', re.IGNORECASE)
}

ai_assistant_bp = Blueprint('ai_assistant', __name__)

# Responses kocak
GREETINGS = [
    "Siap boss! 🫡",
    "Oke gas! 🚀", 
    "Santuy, gue bantu! 😎",
    "Cuss lah! 💪",
    "Otw cek data! 🔍",
]

NOT_FOUND_RESPONSES = [
    "Waduh, kagak ketemu nih boss 😅",
    "Hmm, datanya gaada nih. Yakin bener nulisnya? 🤔",
    "Kosong melompong boss, coba cek lagi deh 🙈",
    "Nope, gak ada. Mungkin typo? 🤷",
]

SUCCESS_RESPONSES = [
    "Nih boss, ketemu! 🎯",
    "Dapet nih datanya! ✨",
    "Cakep, ini dia! 👇",
    "Sikat boss! 🔥",
]

ERROR_RESPONSES = [
    "Aduh error nih, coba lagi ya boss 😵",
    "Wadaw, ada yang salah. Bentar ya 🛠️",
    "Oops, sistemnya lagi ngambek 😅",
]

LOW_STOCK_ALERTS = [
    "⚠️ BAHAYA! Stok tipis nih boss!",
    "🚨 Alert! Stok mau abis, buruan restock!",
    "😱 Gawat, stok menipis! Segera PO!",
]

ALL_GOOD_RESPONSES = [
    "✅ Aman boss, semua terkendali!",
    "👍 Santuy, semua baik-baik aja!",
    "🎉 All good, no problemo!",
]

# Keywords mapping untuk intent detection
INTENT_KEYWORDS = {
    # Inventory & Warehouse
    'bom': ['bom', 'bill of material', 'resep', 'formula', 'komposisi'],
    'stock': ['stok', 'stock', 'inventory', 'persediaan', 'gudang', 'warehouse'],
    'material': ['material', 'bahan', 'bahan baku', 'raw material'],
    'product': ['produk', 'product', 'barang jadi', 'finished good'],
    
    # Purchasing & Sales
    'purchase_order': ['po', 'purchase order', 'pembelian', 'beli', 'order pembelian'],
    'sales': ['sales', 'penjualan', 'revenue', 'pendapatan', 'omset', 'omzet', 'so', 'sales order'],
    'supplier': ['supplier', 'vendor', 'pemasok'],
    'customer': ['customer', 'pelanggan', 'client'],
    
    # Production
    'work_order': ['wo', 'work order', 'produksi', 'production', 'manufacturing'],
    'maintenance': ['maintenance', 'perawatan', 'perbaikan', 'repair', 'service'],
    
    # Finance
    'invoice': ['invoice', 'faktur', 'tagihan', 'billing'],
    'payment': ['payment', 'pembayaran', 'bayar', 'lunas', 'cicilan'],
    'finance': ['keuangan', 'finance', 'uang', 'kas', 'cash', 'hutang', 'piutang', 'account receivable', 'account payable'],
    
    # HR
    'employee': ['karyawan', 'employee', 'pegawai', 'staff'],
    'attendance': ['absensi', 'attendance', 'hadir', 'kehadiran', 'cuti', 'leave', 'izin'],
    'department': ['departemen', 'department', 'divisi', 'bagian'],
    
    # Quality
    'quality': ['quality', 'qc', 'kualitas', 'mutu', 'inspeksi', 'inspection', 'test'],
    
    # OEE & Performance
    'oee': ['oee', 'efisiensi', 'efficiency', 'downtime', 'availability', 'performance'],
    'machine': ['mesin', 'machine', 'equipment', 'alat'],
    
    # Shipping & Delivery
    'shipping': ['shipping', 'pengiriman', 'kirim', 'delivery', 'ekspedisi', 'logistik'],
    'tracking': ['tracking', 'lacak', 'status pengiriman', 'resi'],
    
    # R&D
    'rd': ['r&d', 'rd', 'riset', 'research', 'development', 'pengembangan', 'experiment', 'eksperimen'],
}

def detect_intent(query: str) -> list:
    """Detect user intent from query"""
    query_lower = query.lower()
    intents = []
    
    for intent, keywords in INTENT_KEYWORDS.items():
        for keyword in keywords:
            if keyword in query_lower:
                if intent not in intents:
                    intents.append(intent)
                break
    
    return intents if intents else ['general']

def extract_search_term(query: str) -> str:
    """Extract specific item name from query"""
    # Remove punctuation first
    import re
    clean_query = re.sub(r'[?!.,;:\'"()]', '', query)
    
    # Only remove very common question words, keep product/material names
    stop_words = [
        'stok', 'stock', 'berapa', 'apa', 'gimana', 'bagaimana', 
        'cek', 'check', 'lihat', 'show', 'tampilkan', 'info', 'detail', 
        'nya', 'dong', 'deh', 'nih', 'sih', 'ya', 'tolong', 'please', 
        'minta', 'kasih', 'tau', 'tahu', 'yang', 'ini', 'itu', 'ada', 
        'gak', 'tidak', 'apakah', 'dimana', 'where', 'is', 'the', 'an',
        'bom', 'bill', 'materials', 'dari', 'untuk', 'di', 'produk',
        'product', 'material', 'bahan', 'invoice', 'faktur', 'tagihan',
        'payment', 'pembayaran', 'karyawan', 'employee', 'absensi',
        'attendance', 'departemen', 'department', 'quality', 'qc',
        'oee', 'mesin', 'machine', 'shipping', 'pengiriman', 'tracking',
        'rd', 'riset', 'research', 'project', 'supplier', 'customer',
        'pelanggan', 'vendor', 'po', 'so', 'wo', 'purchase', 'order',
        'sales', 'work', 'hari', 'bulan', 'tahun', 'minggu', 'kemarin',
        'besok', 'lalu', 'depan', 'rendah', 'tinggi', 'semua', 'total',
        'jumlah', 'berapa', 'pending', 'aktif', 'active', 'belum', 'lunas'
    ]
    
    words = clean_query.lower().split()
    # Keep words that are not stop words and have at least 2 chars
    search_words = [w for w in words if w not in stop_words and len(w) >= 2]
    
    return ' '.join(search_words) if search_words else ''

def extract_time_range(query: str) -> tuple:
    """Extract time range from query"""
    query_lower = query.lower()
    today = get_local_now().date()
    
    if 'hari ini' in query_lower or 'today' in query_lower:
        return today, today
    elif 'kemarin' in query_lower or 'yesterday' in query_lower:
        yesterday = today - timedelta(days=1)
        return yesterday, yesterday
    elif 'minggu ini' in query_lower or 'this week' in query_lower:
        start_week = today - timedelta(days=today.weekday())
        return start_week, today
    elif 'bulan ini' in query_lower or 'this month' in query_lower:
        start_month = today.replace(day=1)
        return start_month, today
    elif 'tahun ini' in query_lower or 'this year' in query_lower:
        start_year = today.replace(month=1, day=1)
        return start_year, today
    
    return None, None

def format_currency(value):
    """Format number as Indonesian Rupiah"""
    if value is None:
        return "Rp 0"
    return f"Rp {float(value):,.0f}".replace(",", ".")

# ===========================================
# SLASH COMMAND HANDLERS
# ===========================================

def handle_slash_command(query: str) -> dict:
    """Handle slash commands"""
    parts = query.split(maxsplit=1)
    command = parts[0].lower()
    args = parts[1] if len(parts) > 1 else ''
    
    # Check for command aliases
    resolved_command = None
    for cmd, config in SLASH_COMMANDS.items():
        if command == cmd or command in config.get('aliases', []):
            resolved_command = cmd
            break
    
    if resolved_command == '/help':
        return handle_help_command()
    elif resolved_command == '/stock':
        return handle_stock_command(args)
    elif resolved_command == '/sales':
        return handle_sales_command(args)
    elif resolved_command == '/production':
        return handle_production_command(args)
    elif resolved_command == '/po':
        return handle_po_command_slash(args)
    elif resolved_command == '/oee':
        return handle_oee_command(args)
    elif resolved_command == '/bom':
        return handle_bom_command_slash(args)
    elif resolved_command == '/employee':
        return handle_employee_command(args)
    elif resolved_command == '/chart':
        return handle_chart_request(args)
    elif resolved_command == '/goto':
        return handle_goto_command(args)
    else:
        return {
            'message': f"❓ Perintah `{command}` tidak dikenal.\n\nKetik `/help` untuk lihat daftar perintah.",
            'links': [],
            'data': None
        }

def handle_help_command() -> dict:
    """Show available commands"""
    msg = "📚 **Daftar Perintah AI Assistant**\n"
    msg += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
    
    for cmd, config in SLASH_COMMANDS.items():
        aliases = config.get('aliases', [])
        alias_str = f" ({', '.join(aliases)})" if aliases else ""
        msg += f"**{cmd}**{alias_str}\n"
        msg += f"   {config['description']}\n\n"
    
    msg += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    msg += "💡 *Atau ketik pertanyaan biasa seperti:*\n"
    msg += '• "stok gula"\n'
    msg += '• "sales hari ini"\n'
    msg += '• "BOM ANDALAN"'
    
    return {
        'message': msg,
        'links': [{'label': 'Dashboard', 'href': '/app/dashboard'}],
        'data': None
    }

def handle_stock_command(args: str) -> dict:
    """Handle /stock command"""
    if not args:
        # Show low stock summary
        low_stock = db.session.query(Material).join(
            Inventory, Inventory.material_id == Material.id
        ).filter(
            Inventory.quantity_on_hand <= Inventory.min_stock_level,
            Inventory.min_stock_level > 0
        ).limit(10).all()
        
        if low_stock:
            data = [{'Kode': m.code, 'Nama': m.name[:25], 'Status': '🔴 Low'} for m in low_stock]
            return {
                'message': f"⚠️ **{len(low_stock)} Material Stok Rendah**\n\nKetik `/stock [nama]` untuk detail spesifik.",
                'links': [{'label': 'Lihat Semua', 'href': '/app/warehouse/materials?filter=low_stock'}],
                'data': data
            }
        return {
            'message': "✅ Semua stok dalam kondisi aman!",
            'links': [{'label': 'Lihat Inventory', 'href': '/app/warehouse/inventory'}],
            'data': None
        }
    
    # Search specific material
    materials = Material.query.filter(
        or_(Material.name.ilike(f'%{args}%'), Material.code.ilike(f'%{args}%'))
    ).limit(5).all()
    
    if materials:
        data = []
        for m in materials:
            inv = Inventory.query.filter(Inventory.material_id == m.id).first()
            qty = float(inv.quantity_on_hand) if inv else 0
            data.append({'Kode': m.code, 'Nama': m.name[:25], 'Stok': f"{qty:,.0f}"})
        
        return {
            'message': f"📦 **Hasil pencarian: '{args}'**",
            'links': [{'label': 'Lihat Detail', 'href': '/app/warehouse/materials'}],
            'data': data
        }
    
    return {
        'message': f"❌ Material '{args}' tidak ditemukan.",
        'links': [{'label': 'Cari di Warehouse', 'href': '/app/warehouse/materials'}],
        'data': None
    }

def handle_sales_command(args: str) -> dict:
    """Handle /sales command"""
    today = get_local_today()
    start_date = today
    
    if 'bulan' in args.lower() or 'month' in args.lower():
        start_date = today.replace(day=1)
        period = "Bulan Ini"
    elif 'minggu' in args.lower() or 'week' in args.lower():
        start_date = today - timedelta(days=today.weekday())
        period = "Minggu Ini"
    else:
        period = "Hari Ini"
    
    orders = SalesOrder.query.filter(
        SalesOrder.order_date >= start_date,
        SalesOrder.order_date <= today
    ).all()
    
    total_value = sum(float(o.total_amount or 0) for o in orders)
    pending = len([o for o in orders if o.status in ['draft', 'pending', 'confirmed']])
    completed = len([o for o in orders if o.status in ['delivered', 'completed']])
    
    # Mini chart data
    chart_data = {
        'type': 'bar',
        'title': f'Sales {period}',
        'data': [
            {'label': 'Pending', 'value': pending, 'color': '#f59e0b'},
            {'label': 'Completed', 'value': completed, 'color': '#10b981'}
        ]
    }
    
    msg = f"📊 **Sales {period}**\n"
    msg += f"━━━━━━━━━━━━━━━━━━━━\n"
    msg += f"📝 Total Order: **{len(orders)}**\n"
    msg += f"💰 Total Value: **{format_currency(total_value)}**\n"
    msg += f"⏳ Pending: **{pending}**\n"
    msg += f"✅ Completed: **{completed}**\n"
    
    return {
        'message': msg,
        'links': [{'label': 'Lihat Sales', 'href': '/app/sales/orders'}],
        'data': None,
        'chart': chart_data
    }

def handle_production_command(args: str) -> dict:
    """Handle /production command"""
    today = get_local_today()
    
    wos = WorkOrder.query.filter(
        WorkOrder.scheduled_date == today
    ).all()
    
    in_progress = len([w for w in wos if w.status == 'in_progress'])
    completed = len([w for w in wos if w.status == 'completed'])
    pending = len([w for w in wos if w.status in ['planned', 'released']])
    
    msg = f"🏭 **Produksi Hari Ini**\n"
    msg += f"━━━━━━━━━━━━━━━━━━━━\n"
    msg += f"📝 Total WO: **{len(wos)}**\n"
    msg += f"🔄 In Progress: **{in_progress}**\n"
    msg += f"✅ Completed: **{completed}**\n"
    msg += f"⏳ Pending: **{pending}**\n"
    
    return {
        'message': msg,
        'links': [
            {'label': 'Lihat WO', 'href': '/app/production/work-orders'},
            {'label': 'Input Produksi', 'href': '/app/production/input'}
        ],
        'data': None
    }

def handle_po_command_slash(args: str) -> dict:
    """Handle /po command"""
    if 'pending' in args.lower():
        pos = PurchaseOrder.query.filter(
            PurchaseOrder.status.in_(['draft', 'pending', 'approved'])
        ).order_by(PurchaseOrder.order_date.desc()).limit(10).all()
    else:
        pos = PurchaseOrder.query.order_by(
            PurchaseOrder.order_date.desc()
        ).limit(10).all()
    
    if pos:
        data = [{
            'No': p.po_number,
            'Supplier': (p.supplier.name[:20] if p.supplier else '-'),
            'Status': p.status,
            'Total': format_currency(p.total_amount)
        } for p in pos[:5]]
        
        return {
            'message': f"📋 **{len(pos)} Purchase Order Terbaru**",
            'links': [{'label': 'Lihat PO', 'href': '/app/purchasing/orders'}],
            'data': data
        }
    
    return {
        'message': "📋 Tidak ada PO ditemukan.",
        'links': [{'label': 'Buat PO', 'href': '/app/purchasing/orders/new'}],
        'data': None
    }

def handle_oee_command(args: str) -> dict:
    """Handle /oee command"""
    today = get_local_today()
    
    # Get today's OEE records
    records = OEERecord.query.filter(
        func.date(OEERecord.production_date) == today
    ).all()
    
    if records:
        avg_oee = sum(float(r.oee_percentage or 0) for r in records) / len(records)
        avg_availability = sum(float(r.availability or 0) for r in records) / len(records)
        avg_performance = sum(float(r.performance or 0) for r in records) / len(records)
        avg_quality = sum(float(r.quality or 0) for r in records) / len(records)
        
        # Mini chart for OEE breakdown
        chart_data = {
            'type': 'gauge',
            'title': 'OEE Hari Ini',
            'value': avg_oee,
            'breakdown': [
                {'label': 'Availability', 'value': avg_availability},
                {'label': 'Performance', 'value': avg_performance},
                {'label': 'Quality', 'value': avg_quality}
            ]
        }
        
        msg = f"📈 **OEE Hari Ini**\n"
        msg += f"━━━━━━━━━━━━━━━━━━━━\n"
        msg += f"🎯 OEE: **{avg_oee:.1f}%**\n"
        msg += f"⏱️ Availability: **{avg_availability:.1f}%**\n"
        msg += f"⚡ Performance: **{avg_performance:.1f}%**\n"
        msg += f"✨ Quality: **{avg_quality:.1f}%**\n"
        
        return {
            'message': msg,
            'links': [{'label': 'Dashboard OEE', 'href': '/app/oee/dashboard'}],
            'data': None,
            'chart': chart_data
        }
    
    return {
        'message': "📈 Belum ada data OEE untuk hari ini.",
        'links': [{'label': 'Dashboard OEE', 'href': '/app/oee/dashboard'}],
        'data': None
    }

def handle_bom_command_slash(args: str) -> dict:
    """Handle /bom command"""
    if not args:
        total = BillOfMaterials.query.filter(BillOfMaterials.is_active == True).count()
        return {
            'message': f"📋 Total **{total}** BOM aktif.\n\nKetik `/bom [nama produk]` untuk detail.",
            'links': [{'label': 'Lihat BOM', 'href': '/app/products/bom'}],
            'data': None
        }
    
    # Search product BOM
    products = Product.query.filter(
        or_(Product.name.ilike(f'%{args}%'), Product.code.ilike(f'%{args}%'))
    ).limit(5).all()
    
    if products:
        data = []
        for p in products:
            bom = BillOfMaterials.query.filter(
                BillOfMaterials.product_id == p.id,
                BillOfMaterials.is_active == True
            ).first()
            data.append({
                'Produk': p.name[:25],
                'Kode': p.code,
                'BOM': bom.bom_number if bom else '❌ Belum ada'
            })
        
        return {
            'message': f"📋 **Hasil pencarian BOM: '{args}'**",
            'links': [{'label': 'Lihat BOM', 'href': '/app/products/bom'}],
            'data': data
        }
    
    return {
        'message': f"❌ Produk '{args}' tidak ditemukan.",
        'links': [{'label': 'Lihat Produk', 'href': '/app/products'}],
        'data': None
    }

def handle_employee_command(args: str) -> dict:
    """Handle /employee command"""
    if 'aktif' in args.lower() or not args:
        employees = Employee.query.filter(Employee.status == 'active').all()
        by_dept = {}
        for e in employees:
            dept = e.department.name if e.department else 'Lainnya'
            by_dept[dept] = by_dept.get(dept, 0) + 1
        
        data = [{'Departemen': k, 'Jumlah': v} for k, v in sorted(by_dept.items(), key=lambda x: -x[1])[:5]]
        
        return {
            'message': f"👥 **{len(employees)} Karyawan Aktif**",
            'links': [{'label': 'Lihat Karyawan', 'href': '/app/hr/employees'}],
            'data': data
        }
    
    # Search specific employee
    employees = Employee.query.filter(
        or_(Employee.full_name.ilike(f'%{args}%'), Employee.employee_id.ilike(f'%{args}%'))
    ).limit(5).all()
    
    if employees:
        data = [{
            'ID': e.employee_id,
            'Nama': e.full_name[:25],
            'Dept': e.department.name[:15] if e.department else '-',
            'Status': e.status
        } for e in employees]
        
        return {
            'message': f"👤 **Hasil pencarian: '{args}'**",
            'links': [{'label': 'Lihat Detail', 'href': '/app/hr/employees'}],
            'data': data
        }
    
    return {
        'message': f"❌ Karyawan '{args}' tidak ditemukan.",
        'links': [{'label': 'Cari Karyawan', 'href': '/app/hr/employees'}],
        'data': None
    }

def handle_goto_command(args: str) -> dict:
    """Handle /goto deep linking command"""
    if not args:
        # Show available deep links
        links_list = "\n".join([f"• `{k}` → {v}" for k, v in list(DEEP_LINKS.items())[:10]])
        return {
            'message': f"🔗 **Deep Links Tersedia:**\n\n{links_list}\n\n...\n\nKetik `/goto [nama]` untuk navigasi.",
            'links': [{'label': 'Dashboard', 'href': '/app/dashboard'}],
            'data': None
        }
    
    target = args.lower().strip()
    if target in DEEP_LINKS:
        return {
            'message': f"🚀 Navigasi ke **{target.title()}**",
            'links': [{'label': f'Buka {target.title()}', 'href': DEEP_LINKS[target]}],
            'data': None,
            'redirect': DEEP_LINKS[target]
        }
    
    # Fuzzy match
    for key, href in DEEP_LINKS.items():
        if target in key or key in target:
            return {
                'message': f"🚀 Navigasi ke **{key.title()}**",
                'links': [{'label': f'Buka {key.title()}', 'href': href}],
                'data': None,
                'redirect': href
            }
    
    return {
        'message': f"❓ Halaman '{args}' tidak ditemukan.\n\nKetik `/goto` untuk lihat daftar.",
        'links': [{'label': 'Dashboard', 'href': '/app/dashboard'}],
        'data': None
    }

# ===========================================
# CHART GENERATION FOR CHAT
# ===========================================

def handle_chart_request(query: str) -> dict:
    """Handle chart/graph requests - generates mini chart data"""
    query_lower = query.lower()
    today = get_local_today()
    
    # Sales chart
    if any(kw in query_lower for kw in ['sales', 'penjualan', 'omset']):
        # Get last 7 days sales
        start = today - timedelta(days=6)
        daily_sales = []
        
        for i in range(7):
            date = start + timedelta(days=i)
            total = db.session.query(func.sum(SalesOrder.total_amount)).filter(
                func.date(SalesOrder.order_date) == date
            ).scalar() or 0
            daily_sales.append({
                'label': date.strftime('%d/%m'),
                'value': float(total)
            })
        
        chart_data = {
            'type': 'line',
            'title': 'Sales 7 Hari Terakhir',
            'data': daily_sales,
            'color': '#3b82f6'
        }
        
        total_week = sum(d['value'] for d in daily_sales)
        msg = f"📈 **Grafik Sales 7 Hari Terakhir**\n\n"
        msg += f"💰 Total: **{format_currency(total_week)}**\n\n"
        msg += "```\n"
        max_val = max(d['value'] for d in daily_sales) or 1
        for d in daily_sales:
            bar_len = int((d['value'] / max_val) * 20)
            msg += f"{d['label']} {'█' * bar_len} {format_currency(d['value'])}\n"
        msg += "```"
        
        return {
            'message': msg,
            'links': [{'label': 'Detail Sales', 'href': '/app/sales/orders'}],
            'data': None,
            'chart': chart_data
        }
    
    # Production chart
    if any(kw in query_lower for kw in ['production', 'produksi', 'output']):
        # Get last 7 days production
        start = today - timedelta(days=6)
        daily_prod = []
        
        for i in range(7):
            date = start + timedelta(days=i)
            total = db.session.query(func.sum(WorkOrder.quantity_good)).filter(
                func.date(WorkOrder.scheduled_start_date) == date,
                WorkOrder.status.in_(['completed', 'in_progress'])
            ).scalar() or 0
            daily_prod.append({
                'label': date.strftime('%d/%m'),
                'value': float(total)
            })
        
        chart_data = {
            'type': 'bar',
            'title': 'Produksi 7 Hari Terakhir',
            'data': daily_prod,
            'color': '#10b981'
        }
        
        total_week = sum(d['value'] for d in daily_prod)
        msg = f"🏭 **Grafik Produksi 7 Hari Terakhir**\n\n"
        msg += f"📦 Total Output: **{total_week:,.0f}** pcs\n\n"
        msg += "```\n"
        max_val = max(d['value'] for d in daily_prod) or 1
        for d in daily_prod:
            bar_len = int((d['value'] / max_val) * 20)
            msg += f"{d['label']} {'█' * bar_len} {d['value']:,.0f}\n"
        msg += "```"
        
        return {
            'message': msg,
            'links': [{'label': 'Detail Produksi', 'href': '/app/production/work-orders'}],
            'data': None,
            'chart': chart_data
        }
    
    # OEE chart
    if any(kw in query_lower for kw in ['oee', 'efisiensi', 'efficiency']):
        # Get OEE trend
        start = today - timedelta(days=6)
        daily_oee = []
        
        for i in range(7):
            date = start + timedelta(days=i)
            records = OEERecord.query.filter(
                func.date(OEERecord.production_date) == date
            ).all()
            avg_oee = sum(float(r.oee_percentage or 0) for r in records) / len(records) if records else 0
            daily_oee.append({
                'label': date.strftime('%d/%m'),
                'value': avg_oee
            })
        
        chart_data = {
            'type': 'line',
            'title': 'Trend OEE 7 Hari',
            'data': daily_oee,
            'color': '#8b5cf6'
        }
        
        avg_week = sum(d['value'] for d in daily_oee) / 7
        msg = f"📊 **Grafik OEE 7 Hari Terakhir**\n\n"
        msg += f"🎯 Rata-rata: **{avg_week:.1f}%**\n\n"
        msg += "```\n"
        for d in daily_oee:
            bar_len = int(d['value'] / 5)  # Scale 0-100 to 0-20
            msg += f"{d['label']} {'█' * bar_len} {d['value']:.1f}%\n"
        msg += "```"
        
        return {
            'message': msg,
            'links': [{'label': 'Dashboard OEE', 'href': '/app/oee/dashboard'}],
            'data': None,
            'chart': chart_data
        }
    
    # Default - show available charts
    return {
        'message': "📊 **Grafik yang tersedia:**\n\n• `/chart sales` - Grafik penjualan\n• `/chart production` - Grafik produksi\n• `/chart oee` - Grafik OEE\n\nAtau ketik: *'grafik sales bulan ini'*",
        'links': [{'label': 'Dashboard', 'href': '/app/dashboard'}],
        'data': None
    }

@ai_assistant_bp.route('/query', methods=['POST'])
@jwt_required(optional=True)
def process_query():
    """Process user query and return relevant data"""
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        
        if not query:
            return jsonify({
                'message': 'Halo boss! Mau tanya apa nih? 🤔\n\nKetik aja pertanyaannya, gue siap bantu!\n\n💡 *Coba ketik `/help` untuk lihat perintah yang tersedia*',
                'links': [],
                'data': None
            })
        
        # Check for slash commands first
        if query.startswith('/'):
            return jsonify(handle_slash_command(query))
        
        # Check for chart/graph requests
        if any(kw in query.lower() for kw in ['grafik', 'chart', 'graph', 'tampilkan grafik', 'lihat grafik']):
            return jsonify(handle_chart_request(query))
        
        intents = detect_intent(query)
        start_date, end_date = extract_time_range(query)
        search_term = extract_search_term(query)
        
        print(f"=== AI ASSISTANT DEBUG ===")
        print(f"Query: {query}")
        print(f"Intents: {intents}")
        print(f"Search term: {search_term}")
        
        response = {
            'message': '',
            'links': [],
            'data': None
        }
        
        # Process based on intent - prioritize specific queries
        if 'bom' in intents:
            response = handle_bom_query(query, search_term)
        elif 'material' in intents:
            response = handle_material_query(query, search_term)
        elif 'product' in intents:
            response = handle_product_query(query, search_term)
        elif 'stock' in intents:
            response = handle_stock_query(query, search_term)
        elif 'purchase_order' in intents:
            response = handle_po_query(query, search_term, start_date, end_date)
        elif 'sales' in intents:
            response = handle_sales_query(query, search_term, start_date, end_date)
        elif 'work_order' in intents:
            response = handle_wo_query(query, search_term, start_date, end_date)
        elif 'maintenance' in intents:
            response = handle_maintenance_query(query, search_term)
        elif 'supplier' in intents:
            response = handle_supplier_query(query, search_term)
        elif 'customer' in intents:
            response = handle_customer_query(query, search_term)
        # Finance
        elif 'invoice' in intents:
            response = handle_invoice_query(query, search_term, start_date, end_date)
        elif 'payment' in intents:
            response = handle_payment_query(query, search_term, start_date, end_date)
        elif 'finance' in intents:
            response = handle_finance_query(query, start_date, end_date)
        # HR
        elif 'employee' in intents:
            response = handle_employee_query(query, search_term)
        elif 'attendance' in intents:
            response = handle_attendance_query(query, search_term, start_date, end_date)
        elif 'department' in intents:
            response = handle_department_query(query, search_term)
        # Quality
        elif 'quality' in intents:
            response = handle_quality_query(query, search_term, start_date, end_date)
        # OEE
        elif 'oee' in intents or 'machine' in intents:
            response = handle_oee_query(query, search_term, start_date, end_date)
        # Shipping
        elif 'shipping' in intents or 'tracking' in intents:
            response = handle_shipping_query(query, search_term, start_date, end_date)
        # R&D
        elif 'rd' in intents:
            response = handle_rd_query(query, search_term)
        else:
            response = handle_general_query(query)
        
        return jsonify(response)
        
    except Exception as e:
        print(f"AI Assistant Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'message': random.choice(ERROR_RESPONSES) + f"\n\nDetail: {str(e)}",
            'links': [],
            'data': None
        }), 500

def handle_bom_query(query: str, search_term: str) -> dict:
    """Handle BOM/Bill of Materials queries"""
    try:
        if search_term:
            # Search product first to find its BOM
            products = Product.query.filter(
                or_(
                    Product.name.ilike(f'%{search_term}%'),
                    Product.code.ilike(f'%{search_term}%')
                )
            ).limit(5).all()
            
            # If no results, try searching each word
            if not products:
                for word in search_term.split():
                    if len(word) >= 2:
                        products = Product.query.filter(
                            or_(
                                Product.name.ilike(f'%{word}%'),
                                Product.code.ilike(f'%{word}%')
                            )
                        ).limit(5).all()
                        if products:
                            break
            
            if products:
                if len(products) == 1:
                    p = products[0]
                    # Get BOM for this product
                    bom = BillOfMaterials.query.filter(
                        BillOfMaterials.product_id == p.id,
                        BillOfMaterials.is_active == True
                    ).first()
                    
                    if bom:
                        msg = f"{random.choice(SUCCESS_RESPONSES)}\n\n"
                        msg += f"📋 **BOM: {p.name}**\n"
                        msg += f"━━━━━━━━━━━━━━━━━━━━\n"
                        msg += f"🏷️ No BOM: `{bom.bom_number}`\n"
                        msg += f"📦 Produk: {p.code}\n"
                        msg += f"📊 Batch Size: {float(bom.batch_size):,.0f} {bom.batch_uom}\n"
                        msg += f"📦 Pack/Carton: {bom.pack_per_carton}\n"
                        msg += f"📝 Versi: {bom.version}\n"
                        msg += f"━━━━━━━━━━━━━━━━━━━━\n"
                        msg += f"**Komposisi Material:**\n\n"
                        
                        # Get BOM items
                        bom_items = BOMItem.query.filter(BOMItem.bom_id == bom.id).order_by(BOMItem.line_number).all()
                        
                        if bom_items:
                            data = []
                            for item in bom_items[:10]:
                                item_name = '-'
                                if item.material:
                                    item_name = item.material.name[:25]
                                elif item.product:
                                    item_name = item.product.name[:25]
                                
                                data.append({
                                    'No': item.line_number,
                                    'Material': item_name,
                                    'Qty': float(item.quantity),
                                    'UOM': item.uom
                                })
                            
                            return {
                                'message': msg,
                                'links': [
                                    {'label': f'Detail BOM', 'href': f'/app/products/boms/{bom.id}/edit'},
                                    {'label': 'Buat WO', 'href': '/app/production/work-orders/new'}
                                ],
                                'data': data
                            }
                        else:
                            msg += "*Belum ada material di BOM ini*"
                            return {
                                'message': msg,
                                'links': [{'label': f'Edit BOM', 'href': f'/app/products/boms/{bom.id}/edit'}],
                                'data': None
                            }
                    else:
                        return {
                            'message': f"⚠️ Produk **{p.name}** belum punya BOM nih boss.\n\n*Mau bikin BOM baru?*",
                            'links': [
                                {'label': 'Buat BOM', 'href': '/app/products/boms/new'},
                                {'label': 'Lihat Produk', 'href': f'/app/products/{p.id}'}
                            ],
                            'data': None
                        }
                else:
                    # Multiple products found
                    data = [{
                        'Kode': p.code,
                        'Nama': p.name[:30],
                        'Ada BOM': '✅' if BillOfMaterials.query.filter(BillOfMaterials.product_id == p.id, BillOfMaterials.is_active == True).first() else '❌'
                    } for p in products]
                    
                    return {
                        'message': f"🔍 Ketemu {len(products)} produk. Pilih yang mana boss?",
                        'links': [{'label': 'Lihat Semua BOM', 'href': '/app/products/bom'}],
                        'data': data
                    }
            else:
                return {
                    'message': random.choice(NOT_FOUND_RESPONSES) + f"\n\nGak ada produk dengan nama '{search_term}'",
                    'links': [{'label': 'Lihat BOM', 'href': '/app/products/bom'}],
                    'data': None
                }
        
        # General BOM info
        else:
            total_bom = BillOfMaterials.query.filter(BillOfMaterials.is_active == True).count()
            
            msg = f"📋 **Bill of Materials**\n\n"
            msg += f"• Total BOM aktif: **{total_bom}**\n\n"
            msg += f"💡 *Ketik nama produk untuk lihat BOM-nya, contoh:*\n"
            msg += f'*"BOM ANDALAN" atau "BOM roti"*'
            
            return {
                'message': msg,
                'links': [
                    {'label': 'Lihat Semua BOM', 'href': '/app/products/bom'},
                    {'label': 'Buat BOM Baru', 'href': '/app/products/boms/new'}
                ],
                'data': None
            }
    except Exception as e:
        print(f"BOM query error: {e}")
        return {
            'message': random.choice(ERROR_RESPONSES),
            'links': [{'label': 'Lihat BOM', 'href': '/app/products/bom'}],
            'data': None
        }

def handle_material_query(query: str, search_term: str) -> dict:
    """Handle material/bahan baku queries - DETAIL"""
    query_lower = query.lower()
    
    try:
        # Search for specific material
        if search_term:
            # Try exact match first, then partial
            materials = Material.query.filter(
                or_(
                    Material.name.ilike(f'%{search_term}%'),
                    Material.code.ilike(f'%{search_term}%'),
                    Material.code.ilike(f'{search_term}%'),  # Starts with
                    Material.name.ilike(f'{search_term}%')   # Starts with
                )
            ).limit(10).all()
            
            # If no results, try searching each word separately
            if not materials and ' ' in search_term:
                for word in search_term.split():
                    if len(word) >= 2:
                        materials = Material.query.filter(
                            or_(
                                Material.name.ilike(f'%{word}%'),
                                Material.code.ilike(f'%{word}%')
                            )
                        ).limit(10).all()
                        if materials:
                            break
            
            if materials:
                if len(materials) == 1:
                    m = materials[0]
                    # Get inventory info
                    inv = Inventory.query.filter(Inventory.material_id == m.id).first()
                    stok = float(inv.quantity_on_hand) if inv else 0
                    min_stok = float(inv.min_stock_level) if inv else float(getattr(m, 'min_stock_level', 0) or 0)
                    
                    status_stok = "🟢 Aman" if stok > min_stok else "🔴 Rendah!" if stok > 0 else "⚫ Habis!"
                    
                    # Get attributes safely
                    harga = getattr(m, 'unit_price', None) or getattr(m, 'cost_per_unit', None) or 0
                    satuan = getattr(m, 'unit', None) or getattr(m, 'primary_uom', None) or 'pcs'
                    kategori = getattr(m, 'category', None) or getattr(m, 'material_type', None) or '-'
                    
                    msg = f"{random.choice(SUCCESS_RESPONSES)}\n\n"
                    msg += f"📦 **{m.name}**\n"
                    msg += f"━━━━━━━━━━━━━━━━━━━━\n"
                    msg += f"🏷️ Kode: `{m.code}`\n"
                    msg += f"📁 Kategori: {kategori}\n"
                    msg += f"📏 Satuan: {satuan}\n"
                    msg += f"💰 Harga: {format_currency(harga)}\n"
                    msg += f"━━━━━━━━━━━━━━━━━━━━\n"
                    msg += f"📊 **Stok Saat Ini:** {stok:,.0f} {satuan}\n"
                    if min_stok > 0:
                        msg += f"📉 **Min. Stok:** {min_stok:,.0f}\n"
                    msg += f"🚦 **Status:** {status_stok}\n"
                    
                    if min_stok > 0 and stok <= min_stok and stok > 0:
                        msg += f"\n⚠️ *Woy boss, stoknya tipis nih! Buruan PO!*"
                    elif stok == 0:
                        msg += f"\n🚨 *GAWAT! Stok abis boss! Langsung PO sekarang!*"
                    
                    return {
                        'message': msg,
                        'links': [
                            {'label': f'Detail {m.code}', 'href': f'/app/warehouse/materials/{m.id}'},
                            {'label': 'Buat PO', 'href': '/app/purchasing/orders/new'}
                        ],
                        'data': None
                    }
                else:
                    # Multiple results - get attributes safely
                    data = []
                    for m in materials[:10]:
                        harga = getattr(m, 'unit_price', None) or getattr(m, 'cost_per_unit', None) or 0
                        kategori = getattr(m, 'category', None) or getattr(m, 'material_type', None) or '-'
                        data.append({
                            'Kode': m.code,
                            'Nama': m.name[:30] if len(m.name) > 30 else m.name,
                            'Kategori': kategori,
                            'Harga': format_currency(harga)
                        })
                    
                    return {
                        'message': f"🔍 Ketemu {len(materials)} material dengan kata kunci '{search_term}':\n\nMau detail yang mana nih boss?",
                        'links': [{'label': 'Lihat Semua Material', 'href': '/app/warehouse/materials'}],
                        'data': data
                    }
            else:
                return {
                    'message': random.choice(NOT_FOUND_RESPONSES) + f"\n\nGak ada material dengan nama '{search_term}'",
                    'links': [{'label': 'Cari di Material', 'href': '/app/warehouse/materials'}],
                    'data': None
                }
        
        # General material info
        else:
            total = Material.query.filter(Material.is_active == True).count()
            
            # Low stock materials
            low_stock = db.session.query(func.count(Material.id)).join(
                Inventory, Inventory.material_id == Material.id
            ).filter(
                Inventory.quantity_on_hand <= Inventory.min_stock_level,
                Inventory.min_stock_level > 0
            ).scalar() or 0
            
            msg = f"📦 **Ringkasan Material**\n\n"
            msg += f"• Total material aktif: **{total}**\n"
            msg += f"• Stok rendah: **{low_stock}** item\n\n"
            msg += f"💡 *Tips: Ketik nama material untuk lihat detail, contoh:*\n"
            msg += f'*"material gula" atau "bahan tepung"*'
            
            return {
                'message': msg,
                'links': [
                    {'label': 'Lihat Material', 'href': '/app/warehouse/materials'},
                    {'label': 'Stok Rendah', 'href': '/app/warehouse/materials?filter=low_stock'}
                ],
                'data': None
            }
    except Exception as e:
        print(f"Material query error: {e}")
        return {
            'message': random.choice(ERROR_RESPONSES),
            'links': [{'label': 'Lihat Material', 'href': '/app/warehouse/materials'}],
            'data': None
        }

def handle_product_query(query: str, search_term: str) -> dict:
    """Handle product queries - DETAIL"""
    query_lower = query.lower()
    
    try:
        print(f"[AI] Product query - search_term: '{search_term}'")
        
        # Search for specific product
        if search_term:
            # Try multiple search patterns
            products = Product.query.filter(
                or_(
                    Product.name.ilike(f'%{search_term}%'),
                    Product.code.ilike(f'%{search_term}%'),
                    Product.code.ilike(f'{search_term}%'),  # Starts with
                    Product.name.ilike(f'{search_term}%')   # Starts with
                )
            ).limit(10).all()
            
            print(f"[AI] Found {len(products)} products")
            
            # If no results, try searching each word separately
            if not products and ' ' in search_term:
                for word in search_term.split():
                    if len(word) >= 2:
                        products = Product.query.filter(
                            or_(
                                Product.name.ilike(f'%{word}%'),
                                Product.code.ilike(f'%{word}%')
                            )
                        ).limit(10).all()
                        if products:
                            break
            
            if products:
                if len(products) == 1:
                    p = products[0]
                    # Get inventory info
                    inv = Inventory.query.filter(Inventory.product_id == p.id).first()
                    stok = float(inv.quantity_on_hand) if inv else 0
                    min_stok = float(inv.min_stock_level) if inv else 0
                    
                    status_stok = "🟢 Aman" if stok > min_stok else "🔴 Rendah!" if stok > 0 else "⚫ Habis!"
                    
                    # Get price - try different attribute names
                    harga_jual = getattr(p, 'selling_price', None) or getattr(p, 'price', None) or 0
                    harga_dasar = getattr(p, 'base_price', None) or getattr(p, 'cost', None) or 0
                    satuan = getattr(p, 'unit', None) or getattr(p, 'primary_uom', None) or 'pcs'
                    kategori = getattr(p, 'category', None) or getattr(p, 'nonwoven_category', None) or '-'
                    
                    msg = f"{random.choice(SUCCESS_RESPONSES)}\n\n"
                    msg += f"🏭 **{p.name}**\n"
                    msg += f"━━━━━━━━━━━━━━━━━━━━\n"
                    msg += f"🏷️ Kode: `{p.code}`\n"
                    msg += f"📁 Kategori: {kategori}\n"
                    msg += f"📏 Satuan: {satuan}\n"
                    msg += f"💰 Harga Jual: {format_currency(harga_jual)}\n"
                    msg += f"💵 Harga Dasar: {format_currency(harga_dasar)}\n"
                    msg += f"━━━━━━━━━━━━━━━━━━━━\n"
                    msg += f"📊 **Stok Saat Ini:** {stok:,.0f} {satuan}\n"
                    if min_stok > 0:
                        msg += f"📉 **Min. Stok:** {min_stok:,.0f}\n"
                    msg += f"🚦 **Status:** {status_stok}\n"
                    
                    # Calculate stock value
                    nilai_stok = stok * float(harga_dasar)
                    msg += f"💎 **Nilai Stok:** {format_currency(nilai_stok)}\n"
                    
                    if min_stok > 0 and stok <= min_stok and stok > 0:
                        msg += f"\n⚠️ *Eh boss, stoknya dikit! Mau produksi lagi?*"
                    elif stok == 0:
                        msg += f"\n🚨 *Waduh stok kosong! Buruan bikin WO!*"
                    
                    return {
                        'message': msg,
                        'links': [
                            {'label': f'Detail {p.code}', 'href': f'/app/products/{p.id}'},
                            {'label': 'Buat WO', 'href': '/app/production/work-orders/new'}
                        ],
                        'data': None
                    }
                else:
                    # Multiple results - get price safely
                    data = []
                    for p in products[:10]:
                        harga = getattr(p, 'selling_price', None) or getattr(p, 'price', None) or 0
                        data.append({
                            'Kode': p.code,
                            'Nama': p.name[:30] if len(p.name) > 30 else p.name,
                            'Harga': format_currency(harga)
                        })
                    
                    return {
                        'message': f"🔍 Ada {len(products)} produk dengan kata kunci '{search_term}':\n\nPilih yang mana boss?",
                        'links': [{'label': 'Lihat Semua Produk', 'href': '/app/products'}],
                        'data': data
                    }
            else:
                return {
                    'message': random.choice(NOT_FOUND_RESPONSES) + f"\n\nGak ada produk dengan nama '{search_term}'",
                    'links': [{'label': 'Cari di Produk', 'href': '/app/products'}],
                    'data': None
                }
        
        # General product info
        else:
            total = Product.query.filter(Product.is_active == True).count()
            
            msg = f"🏭 **Ringkasan Produk**\n\n"
            msg += f"• Total produk aktif: **{total}**\n\n"
            msg += f"💡 *Tips: Ketik nama produk untuk detail, contoh:*\n"
            msg += f'*"produk roti" atau "product ABC"*'
            
            return {
                'message': msg,
                'links': [{'label': 'Lihat Produk', 'href': '/app/products'}],
                'data': None
            }
    except Exception as e:
        print(f"Product query error: {e}")
        return {
            'message': random.choice(ERROR_RESPONSES),
            'links': [{'label': 'Lihat Produk', 'href': '/app/products'}],
            'data': None
        }

def handle_stock_query(query: str, search_term: str) -> dict:
    """Handle stock/inventory related queries"""
    query_lower = query.lower()
    
    try:
        # Low stock query
        if any(word in query_lower for word in ['rendah', 'low', 'habis', 'kosong', 'kurang', 'tipis', 'dikit']):
            # Query products with low stock
            items = db.session.query(
                Product.name,
                Product.code,
                Inventory.quantity_on_hand,
                Inventory.min_stock_level
            ).join(Inventory, Inventory.product_id == Product.id).filter(
                Inventory.quantity_on_hand <= Inventory.min_stock_level,
                Inventory.min_stock_level > 0
            ).limit(10).all()
            
            if items:
                data = [{
                    'Produk': item.name[:25],
                    'Kode': item.code,
                    'Stok': float(item.quantity_on_hand or 0),
                    'Min': float(item.min_stock_level or 0)
                } for item in items]
                
                return {
                    'message': f"{random.choice(LOW_STOCK_ALERTS)}\n\nAda {len(items)} item yang stoknya menipis:",
                    'links': [
                        {'label': 'Lihat Inventory', 'href': '/app/warehouse/inventory'},
                        {'label': 'Buat PO', 'href': '/app/purchasing/orders/new'}
                    ],
                    'data': data
                }
            else:
                return {
                    'message': random.choice(ALL_GOOD_RESPONSES) + "\n\nSemua stok masih aman, gak ada yang perlu di-restock! 🎉",
                    'links': [{'label': 'Lihat Inventory', 'href': '/app/warehouse/inventory'}],
                    'data': None
                }
        
        # Total stock value
        elif any(word in query_lower for word in ['nilai', 'value', 'total']):
            result = db.session.query(
                func.sum(Inventory.quantity_on_hand * Product.base_price)
            ).join(Product, Product.id == Inventory.product_id).scalar() or 0
            
            return {
                'message': f"💰 **Total Nilai Inventory**\n\n{format_currency(result)}\n\n*Mantap boss, asetnya gede juga ya!* 💎",
                'links': [{'label': 'Lihat Detail', 'href': '/app/warehouse/analytics'}],
                'data': None
            }
        
        # General stock info
        else:
            total_items = Inventory.query.count()
            total_products = Product.query.filter(Product.is_active == True).count()
            
            # Count low stock
            low_stock = db.session.query(func.count(Inventory.id)).filter(
                Inventory.quantity_on_hand <= Inventory.min_stock_level,
                Inventory.min_stock_level > 0
            ).scalar() or 0
            
            msg = f"📦 **Ringkasan Inventory**\n\n"
            msg += f"• Produk aktif: **{total_products}**\n"
            msg += f"• Item di gudang: **{total_items}**\n"
            msg += f"• Stok rendah: **{low_stock}** item\n\n"
            
            if low_stock > 0:
                msg += f"⚠️ *Ada {low_stock} item yang perlu restock nih boss!*\n"
                msg += f"Ketik *'stok rendah'* untuk lihat detailnya."
            else:
                msg += f"✅ *Semua stok aman terkendali!*"
            
            return {
                'message': msg,
                'links': [
                    {'label': 'Lihat Inventory', 'href': '/app/warehouse/inventory'},
                    {'label': 'Stok Rendah', 'href': '/app/warehouse/inventory?filter=low'}
                ],
                'data': None
            }
    except Exception as e:
        print(f"Stock query error: {e}")
        return {
            'message': random.choice(ERROR_RESPONSES),
            'links': [{'label': 'Lihat Inventory', 'href': '/app/warehouse/inventory'}],
            'data': None
        }

def handle_po_query(query: str, search_term: str, start_date, end_date) -> dict:
    """Handle Purchase Order related queries"""
    query_lower = query.lower()
    
    try:
        # Search specific PO
        if search_term and len(search_term) > 2:
            pos = PurchaseOrder.query.filter(
                or_(
                    PurchaseOrder.po_number.ilike(f'%{search_term}%'),
                    PurchaseOrder.notes.ilike(f'%{search_term}%')
                )
            ).limit(5).all()
            
            if pos:
                if len(pos) == 1:
                    po = pos[0]
                    status_emoji = {
                        'draft': '📝', 'pending': '⏳', 'approved': '✅',
                        'ordered': '📦', 'received': '📥', 'completed': '🎉',
                        'cancelled': '❌'
                    }.get(po.status, '📋')
                    
                    msg = f"{random.choice(SUCCESS_RESPONSES)}\n\n"
                    msg += f"📋 **PO: {po.po_number}**\n"
                    msg += f"━━━━━━━━━━━━━━━━━━━━\n"
                    msg += f"🏢 Supplier: {po.supplier.name if po.supplier else '-'}\n"
                    msg += f"📅 Tanggal: {po.order_date.strftime('%d/%m/%Y') if po.order_date else '-'}\n"
                    msg += f"💰 Total: {format_currency(po.total_amount)}\n"
                    msg += f"{status_emoji} Status: **{po.status.upper()}**\n"
                    
                    return {
                        'message': msg,
                        'links': [
                            {'label': f'Detail PO', 'href': f'/app/purchasing/orders/{po.id}'},
                            {'label': 'Semua PO', 'href': '/app/purchasing/orders'}
                        ],
                        'data': None
                    }
                else:
                    data = [{
                        'No PO': po.po_number,
                        'Supplier': po.supplier.name[:20] if po.supplier else '-',
                        'Total': format_currency(po.total_amount),
                        'Status': po.status
                    } for po in pos]
                    
                    return {
                        'message': f"🔍 Ketemu {len(pos)} PO:",
                        'links': [{'label': 'Lihat Semua PO', 'href': '/app/purchasing/orders'}],
                        'data': data
                    }
        
        # Pending PO
        if any(word in query_lower for word in ['pending', 'belum', 'menunggu', 'outstanding']):
            pos = PurchaseOrder.query.filter(
                PurchaseOrder.status.in_(['draft', 'pending', 'approved'])
            ).order_by(PurchaseOrder.created_at.desc()).limit(10).all()
            
            if pos:
                data = [{
                    'No PO': po.po_number,
                    'Supplier': (po.supplier.name[:15] + '..') if po.supplier and len(po.supplier.name) > 15 else (po.supplier.name if po.supplier else '-'),
                    'Total': format_currency(po.total_amount),
                    'Status': po.status
                } for po in pos]
                
                return {
                    'message': f"📋 Ada **{len(pos)} PO** yang masih nunggu diproses nih boss:",
                    'links': [
                        {'label': 'Lihat Semua PO', 'href': '/app/purchasing/orders'},
                        {'label': 'Buat PO Baru', 'href': '/app/purchasing/orders/new'}
                    ],
                    'data': data
                }
            else:
                return {
                    'message': random.choice(ALL_GOOD_RESPONSES) + "\n\nSemua PO udah diproses, gak ada yang pending! 🎉",
                    'links': [{'label': 'Buat PO Baru', 'href': '/app/purchasing/orders/new'}],
                    'data': None
                }
        
        # Count PO
        elif any(word in query_lower for word in ['berapa', 'jumlah', 'total', 'count']):
            total = PurchaseOrder.query.count()
            pending = PurchaseOrder.query.filter(PurchaseOrder.status.in_(['draft', 'pending'])).count()
            completed = PurchaseOrder.query.filter(PurchaseOrder.status == 'completed').count()
            
            msg = f"📋 **Ringkasan Purchase Order**\n\n"
            msg += f"• Total PO: **{total}**\n"
            msg += f"• Pending: **{pending}**\n"
            msg += f"• Selesai: **{completed}**\n\n"
            if pending > 0:
                msg += f"⚠️ *Ada {pending} PO yang belum kelar tuh boss!*"
            else:
                msg += f"✅ *Mantap, semua PO udah beres!*"
            
            return {
                'message': msg,
                'links': [{'label': 'Lihat Semua PO', 'href': '/app/purchasing/orders'}],
                'data': None
            }
        
        else:
            msg = "📋 **Purchase Order**\n\n"
            msg += "Mau tau apa nih boss?\n\n"
            msg += "• *'PO pending'* - liat PO yang belum selesai\n"
            msg += "• *'berapa PO'* - total jumlah PO\n"
            msg += "• *'PO [nomor]'* - cari PO spesifik"
            
            return {
                'message': msg,
                'links': [{'label': 'Lihat PO', 'href': '/app/purchasing/orders'}],
                'data': None
            }
    except Exception as e:
        return {
            'message': random.choice(ERROR_RESPONSES),
            'links': [{'label': 'Lihat PO', 'href': '/app/purchasing/orders'}],
            'data': None
        }

def handle_sales_query(query: str, search_term: str, start_date, end_date) -> dict:
    """Handle Sales related queries"""
    query_lower = query.lower()
    
    try:
        # Revenue query
        if any(word in query_lower for word in ['revenue', 'pendapatan', 'omset', 'omzet', 'cuan']):
            if start_date and end_date:
                total = db.session.query(func.sum(SalesOrder.total_amount)).filter(
                    and_(
                        func.date(SalesOrder.order_date) >= start_date,
                        func.date(SalesOrder.order_date) <= end_date,
                        SalesOrder.status.in_(['completed', 'delivered'])
                    )
                ).scalar() or 0
                period = f"dari {start_date} sampai {end_date}"
            else:
                # Default: this month
                today = get_local_now().date()
                start_month = today.replace(day=1)
                total = db.session.query(func.sum(SalesOrder.total_amount)).filter(
                    and_(
                        func.date(SalesOrder.order_date) >= start_month,
                        SalesOrder.status.in_(['completed', 'delivered'])
                    )
                ).scalar() or 0
                period = "bulan ini"
            
            msg = f"💰 **Total Revenue {period}**\n\n"
            msg += f"**{format_currency(total)}**\n\n"
            if total > 0:
                msg += f"*Cuan terus boss! Keep it up!* 🚀"
            else:
                msg += f"*Hmm, belum ada transaksi nih. Semangat jualan!* 💪"
            
            return {
                'message': msg,
                'links': [
                    {'label': 'Dashboard Sales', 'href': '/app/sales/dashboard'},
                    {'label': 'Laporan', 'href': '/app/finance/reports'}
                ],
                'data': None
            }
        
        # Sales order count
        elif any(word in query_lower for word in ['berapa', 'jumlah', 'total']):
            total = SalesOrder.query.count()
            pending = SalesOrder.query.filter(SalesOrder.status.in_(['draft', 'pending', 'confirmed'])).count()
            completed = SalesOrder.query.filter(SalesOrder.status.in_(['completed', 'delivered'])).count()
            
            msg = f"📊 **Ringkasan Sales Order**\n\n"
            msg += f"• Total SO: **{total}**\n"
            msg += f"• Pending: **{pending}**\n"
            msg += f"• Selesai: **{completed}**\n"
            
            return {
                'message': msg,
                'links': [{'label': 'Dashboard Sales', 'href': '/app/sales/dashboard'}],
                'data': None
            }
        
        else:
            msg = "💰 **Sales**\n\n"
            msg += "Mau cek apa nih boss?\n\n"
            msg += "• *'revenue bulan ini'* - total cuan\n"
            msg += "• *'berapa SO'* - jumlah sales order\n"
            msg += "• *'omset hari ini'* - pendapatan hari ini"
            
            return {
                'message': msg,
                'links': [{'label': 'Dashboard Sales', 'href': '/app/sales/dashboard'}],
                'data': None
            }
    except Exception as e:
        return {
            'message': random.choice(ERROR_RESPONSES),
            'links': [{'label': 'Dashboard Sales', 'href': '/app/sales/dashboard'}],
            'data': None
        }

def handle_wo_query(query: str, search_term: str, start_date, end_date) -> dict:
    """Handle Work Order related queries"""
    query_lower = query.lower()
    
    try:
        # Today's WO
        if any(word in query_lower for word in ['hari ini', 'today', 'sekarang']):
            today = get_local_now().date()
            wos = WorkOrder.query.filter(
                func.date(WorkOrder.planned_start) == today
            ).limit(10).all()
            
            if wos:
                data = [{
                    'No WO': wo.wo_number,
                    'Produk': (wo.product.name[:20] + '..') if wo.product and len(wo.product.name) > 20 else (wo.product.name if wo.product else '-'),
                    'Qty': int(wo.quantity) if wo.quantity else 0,
                    'Status': wo.status
                } for wo in wos]
                
                return {
                    'message': f"🏭 Ada **{len(wos)} Work Order** buat hari ini boss:",
                    'links': [{'label': 'Lihat Work Orders', 'href': '/app/production/work-orders'}],
                    'data': data
                }
            else:
                return {
                    'message': "📅 Gak ada WO yang dijadwalkan hari ini boss.\n\n*Mau bikin WO baru?*",
                    'links': [{'label': 'Buat WO Baru', 'href': '/app/production/work-orders/new'}],
                    'data': None
                }
        
        # Pending WO
        elif any(word in query_lower for word in ['pending', 'belum', 'outstanding', 'jalan']):
            wos = WorkOrder.query.filter(
                WorkOrder.status.in_(['draft', 'planned', 'in_progress'])
            ).order_by(WorkOrder.planned_start).limit(10).all()
            
            if wos:
                data = [{
                    'No WO': wo.wo_number,
                    'Produk': (wo.product.name[:20] + '..') if wo.product and len(wo.product.name) > 20 else (wo.product.name if wo.product else '-'),
                    'Qty': int(wo.quantity) if wo.quantity else 0,
                    'Status': wo.status
                } for wo in wos]
                
                return {
                    'message': f"🏭 Ada **{len(wos)} WO** yang masih jalan/pending:",
                    'links': [{'label': 'Lihat Work Orders', 'href': '/app/production/work-orders'}],
                    'data': data
                }
            else:
                return {
                    'message': random.choice(ALL_GOOD_RESPONSES) + "\n\nSemua WO udah kelar boss! 🎉",
                    'links': [{'label': 'Lihat Work Orders', 'href': '/app/production/work-orders'}],
                    'data': None
                }
        
        else:
            total = WorkOrder.query.count()
            in_progress = WorkOrder.query.filter(WorkOrder.status == 'in_progress').count()
            planned = WorkOrder.query.filter(WorkOrder.status == 'planned').count()
            
            msg = f"🏭 **Ringkasan Work Order**\n\n"
            msg += f"• Total WO: **{total}**\n"
            msg += f"• Lagi jalan: **{in_progress}**\n"
            msg += f"• Dijadwalkan: **{planned}**\n\n"
            msg += f"💡 *Ketik 'WO hari ini' atau 'WO pending' untuk detail*"
            
            return {
                'message': msg,
                'links': [
                    {'label': 'Lihat Work Orders', 'href': '/app/production/work-orders'},
                    {'label': 'Dashboard Produksi', 'href': '/app/production'}
                ],
                'data': None
            }
    except Exception as e:
        return {
            'message': random.choice(ERROR_RESPONSES),
            'links': [{'label': 'Lihat Work Orders', 'href': '/app/production/work-orders'}],
            'data': None
        }

def handle_maintenance_query(query: str, search_term: str) -> dict:
    """Handle Maintenance related queries"""
    try:
        total = MaintenanceRecord.query.count()
        pending = MaintenanceRecord.query.filter(
            MaintenanceRecord.status.in_(['pending', 'in_progress'])
        ).count()
        
        msg = f"🔧 **Ringkasan Maintenance**\n\n"
        msg += f"• Total record: **{total}**\n"
        msg += f"• Pending/Jalan: **{pending}**\n\n"
        
        if pending > 0:
            msg += f"⚠️ *Ada {pending} maintenance yang belum kelar boss!*"
        else:
            msg += f"✅ *Semua mesin aman terkendali!*"
        
        return {
            'message': msg,
            'links': [
                {'label': 'Dashboard Maintenance', 'href': '/app/maintenance'},
                {'label': 'Buat Request', 'href': '/app/maintenance/request/new'}
            ],
            'data': None
        }
    except Exception as e:
        return {
            'message': random.choice(ERROR_RESPONSES),
            'links': [{'label': 'Dashboard Maintenance', 'href': '/app/maintenance'}],
            'data': None
        }

def handle_finance_query(query: str, start_date, end_date) -> dict:
    """Handle Finance related queries"""
    msg = "💵 **Finance**\n\n"
    msg += "Untuk info keuangan detail, langsung aja ke dashboard Finance ya boss!\n\n"
    msg += "*Atau tanya 'revenue bulan ini' untuk cek omset*"
    
    return {
        'message': msg,
        'links': [
            {'label': 'Dashboard Finance', 'href': '/app/finance'},
            {'label': 'Laporan', 'href': '/app/finance/reports'}
        ],
        'data': None
    }

def handle_employee_query(query: str, search_term: str) -> dict:
    """Handle Employee related queries"""
    try:
        total = User.query.filter(User.is_active == True).count()
        
        msg = f"👥 **Ringkasan Karyawan**\n\n"
        msg += f"• Total karyawan aktif: **{total}** orang\n\n"
        msg += f"*Butuh info lebih detail? Cek dashboard HR!*"
        
        return {
            'message': msg,
            'links': [
                {'label': 'Lihat Karyawan', 'href': '/app/hr/employees'},
                {'label': 'Dashboard HR', 'href': '/app/hr/dashboard'}
            ],
            'data': None
        }
    except Exception as e:
        return {
            'message': random.choice(ERROR_RESPONSES),
            'links': [{'label': 'Dashboard HR', 'href': '/app/hr/dashboard'}],
            'data': None
        }

def handle_supplier_query(query: str, search_term: str) -> dict:
    """Handle Supplier related queries"""
    try:
        # Search specific supplier
        if search_term:
            suppliers = Supplier.query.filter(
                or_(
                    Supplier.name.ilike(f'%{search_term}%'),
                    Supplier.code.ilike(f'%{search_term}%')
                ),
                Supplier.is_active == True
            ).limit(5).all()
            
            if suppliers:
                if len(suppliers) == 1:
                    s = suppliers[0]
                    msg = f"{random.choice(SUCCESS_RESPONSES)}\n\n"
                    msg += f"🏢 **{s.name}**\n"
                    msg += f"━━━━━━━━━━━━━━━━━━━━\n"
                    msg += f"🏷️ Kode: `{s.code}`\n"
                    msg += f"📞 Telp: {s.phone or '-'}\n"
                    msg += f"📧 Email: {s.email or '-'}\n"
                    msg += f"📍 Alamat: {s.address or '-'}\n"
                    
                    return {
                        'message': msg,
                        'links': [
                            {'label': f'Detail Supplier', 'href': f'/app/purchasing/suppliers/{s.id}'},
                            {'label': 'Buat PO', 'href': '/app/purchasing/orders/new'}
                        ],
                        'data': None
                    }
                else:
                    data = [{
                        'Kode': s.code,
                        'Nama': s.name[:25],
                        'Telp': s.phone or '-'
                    } for s in suppliers]
                    
                    return {
                        'message': f"🔍 Ketemu {len(suppliers)} supplier:",
                        'links': [{'label': 'Lihat Semua Supplier', 'href': '/app/purchasing/suppliers'}],
                        'data': data
                    }
            else:
                return {
                    'message': random.choice(NOT_FOUND_RESPONSES) + f"\n\nGak ada supplier dengan nama '{search_term}'",
                    'links': [{'label': 'Lihat Supplier', 'href': '/app/purchasing/suppliers'}],
                    'data': None
                }
        
        total = Supplier.query.filter(Supplier.is_active == True).count()
        
        msg = f"🏢 **Ringkasan Supplier**\n\n"
        msg += f"• Total supplier aktif: **{total}**\n\n"
        msg += f"💡 *Ketik nama supplier untuk detail, contoh:*\n"
        msg += f'*"supplier ABC" atau "vendor XYZ"*'
        
        return {
            'message': msg,
            'links': [{'label': 'Lihat Supplier', 'href': '/app/purchasing/suppliers'}],
            'data': None
        }
    except Exception as e:
        return {
            'message': random.choice(ERROR_RESPONSES),
            'links': [{'label': 'Lihat Supplier', 'href': '/app/purchasing/suppliers'}],
            'data': None
        }

def handle_customer_query(query: str, search_term: str) -> dict:
    """Handle Customer related queries"""
    try:
        # Search specific customer
        if search_term:
            customers = Customer.query.filter(
                or_(
                    Customer.name.ilike(f'%{search_term}%'),
                    Customer.code.ilike(f'%{search_term}%')
                ),
                Customer.is_active == True
            ).limit(5).all()
            
            if customers:
                if len(customers) == 1:
                    c = customers[0]
                    msg = f"{random.choice(SUCCESS_RESPONSES)}\n\n"
                    msg += f"👤 **{c.name}**\n"
                    msg += f"━━━━━━━━━━━━━━━━━━━━\n"
                    msg += f"🏷️ Kode: `{c.code}`\n"
                    msg += f"📞 Telp: {c.phone or '-'}\n"
                    msg += f"📧 Email: {c.email or '-'}\n"
                    msg += f"📍 Alamat: {c.address or '-'}\n"
                    
                    return {
                        'message': msg,
                        'links': [
                            {'label': f'Detail Customer', 'href': f'/app/sales/customers/{c.id}'},
                            {'label': 'Buat SO', 'href': '/app/sales/orders/new'}
                        ],
                        'data': None
                    }
                else:
                    data = [{
                        'Kode': c.code,
                        'Nama': c.name[:25],
                        'Telp': c.phone or '-'
                    } for c in customers]
                    
                    return {
                        'message': f"🔍 Ketemu {len(customers)} customer:",
                        'links': [{'label': 'Lihat Semua Customer', 'href': '/app/sales/customers'}],
                        'data': data
                    }
            else:
                return {
                    'message': random.choice(NOT_FOUND_RESPONSES) + f"\n\nGak ada customer dengan nama '{search_term}'",
                    'links': [{'label': 'Lihat Customer', 'href': '/app/sales/customers'}],
                    'data': None
                }
        
        total = Customer.query.filter(Customer.is_active == True).count()
        
        msg = f"👤 **Ringkasan Customer**\n\n"
        msg += f"• Total customer aktif: **{total}**\n\n"
        msg += f"💡 *Ketik nama customer untuk detail*"
        
        return {
            'message': msg,
            'links': [{'label': 'Lihat Customer', 'href': '/app/sales/customers'}],
            'data': None
        }
    except Exception as e:
        return {
            'message': random.choice(ERROR_RESPONSES),
            'links': [{'label': 'Lihat Customer', 'href': '/app/sales/customers'}],
            'data': None
        }

def handle_general_query(query: str) -> dict:
    """Handle general queries"""
    msg = "Halo boss! 👋 Aku AI Assistant ERP kamu.\n\n"
    msg += "Aku bisa bantu kamu dengan:\n\n"
    msg += "📦 **Inventory**\n"
    msg += "• *'material POLYESTER'* - cek material\n"
    msg += "• *'produk WETKINS'* - info produk\n"
    msg += "• *'BOM ANDALAN'* - lihat resep\n\n"
    msg += "🛒 **Purchasing & Sales**\n"
    msg += "• *'PO pending'* - PO belum selesai\n"
    msg += "• *'revenue bulan ini'* - total cuan\n"
    msg += "• *'invoice belum lunas'* - tagihan\n\n"
    msg += "🏭 **Production**\n"
    msg += "• *'WO hari ini'* - work order\n"
    msg += "• *'OEE mesin'* - efisiensi mesin\n\n"
    msg += "📊 **Quality**\n"
    msg += "• *'QC hari ini'* - inspeksi kualitas\n"
    msg += "• *'defect rate'* - tingkat cacat\n\n"
    msg += "👥 **HR**\n"
    msg += "• *'karyawan aktif'* - jumlah pegawai\n"
    msg += "• *'absensi hari ini'* - kehadiran\n\n"
    msg += "🚚 **Shipping**\n"
    msg += "• *'pengiriman hari ini'* - delivery\n"
    msg += "• *'tracking [nomor]'* - lacak kiriman\n\n"
    msg += "🔬 **R&D**\n"
    msg += "• *'project R&D'* - riset aktif\n\n"
    msg += "Langsung ketik aja pertanyaannya! 🚀"
    
    return {
        'message': msg,
        'links': [
            {'label': 'Dashboard', 'href': '/app'},
            {'label': 'Laporan', 'href': '/app/reports'}
        ],
        'data': None
    }

# ==================== FINANCE HANDLERS ====================

def handle_invoice_query(query: str, search_term: str, start_date, end_date) -> dict:
    """Handle Invoice queries"""
    try:
        query_lower = query.lower()
        
        # Unpaid invoices
        if any(x in query_lower for x in ['belum lunas', 'unpaid', 'outstanding', 'belum bayar']):
            invoices = Invoice.query.filter(
                Invoice.status.in_(['sent', 'partial', 'overdue'])
            ).order_by(Invoice.due_date.asc()).limit(10).all()
            
            if invoices:
                total_outstanding = sum(float(inv.balance_due or 0) for inv in invoices)
                
                data = [{
                    'No': inv.invoice_number,
                    'Customer': inv.customer.name[:20] if inv.customer else '-',
                    'Jatuh Tempo': inv.due_date.strftime('%d/%m/%Y') if inv.due_date else '-',
                    'Sisa': format_currency(inv.balance_due)
                } for inv in invoices[:5]]
                
                msg = f"📋 **Invoice Belum Lunas**\n\n"
                msg += f"• Total outstanding: **{format_currency(total_outstanding)}**\n"
                msg += f"• Jumlah invoice: **{len(invoices)}**\n"
                
                overdue = [inv for inv in invoices if inv.status == 'overdue']
                if overdue:
                    msg += f"\n⚠️ *{len(overdue)} invoice sudah jatuh tempo!*"
                
                return {
                    'message': msg,
                    'links': [
                        {'label': 'Lihat Invoice', 'href': '/app/finance/invoices'},
                        {'label': 'AR Aging', 'href': '/app/finance/ar-aging'}
                    ],
                    'data': data
                }
            else:
                return {
                    'message': random.choice(ALL_GOOD_RESPONSES) + "\n\nSemua invoice sudah lunas! 💰",
                    'links': [{'label': 'Lihat Invoice', 'href': '/app/finance/invoices'}],
                    'data': None
                }
        
        # Search specific invoice
        if search_term:
            invoices = Invoice.query.filter(
                Invoice.invoice_number.ilike(f'%{search_term}%')
            ).limit(5).all()
            
            if invoices and len(invoices) == 1:
                inv = invoices[0]
                msg = f"{random.choice(SUCCESS_RESPONSES)}\n\n"
                msg += f"📋 **Invoice: {inv.invoice_number}**\n"
                msg += f"━━━━━━━━━━━━━━━━━━━━\n"
                msg += f"📅 Tanggal: {inv.invoice_date.strftime('%d/%m/%Y') if inv.invoice_date else '-'}\n"
                msg += f"👤 Customer: {inv.customer.name if inv.customer else '-'}\n"
                msg += f"💰 Total: {format_currency(inv.total_amount)}\n"
                msg += f"💵 Dibayar: {format_currency(inv.paid_amount)}\n"
                msg += f"📊 Sisa: {format_currency(inv.balance_due)}\n"
                msg += f"🚦 Status: **{inv.status.upper()}**\n"
                
                return {
                    'message': msg,
                    'links': [{'label': 'Detail Invoice', 'href': f'/app/finance/invoices/{inv.id}'}],
                    'data': None
                }
        
        # General invoice stats
        total = Invoice.query.count()
        unpaid = Invoice.query.filter(Invoice.status.in_(['sent', 'partial', 'overdue'])).count()
        
        msg = f"📋 **Ringkasan Invoice**\n\n"
        msg += f"• Total invoice: **{total}**\n"
        msg += f"• Belum lunas: **{unpaid}**\n\n"
        msg += f"💡 *Ketik 'invoice belum lunas' untuk detail*"
        
        return {
            'message': msg,
            'links': [{'label': 'Lihat Invoice', 'href': '/app/finance/invoices'}],
            'data': None
        }
    except Exception as e:
        print(f"Invoice query error: {e}")
        return {
            'message': random.choice(ERROR_RESPONSES),
            'links': [{'label': 'Lihat Invoice', 'href': '/app/finance/invoices'}],
            'data': None
        }

def handle_payment_query(query: str, search_term: str, start_date, end_date) -> dict:
    """Handle Payment queries"""
    try:
        # Payment today/this period
        if start_date and end_date:
            payments = Payment.query.filter(
                Payment.payment_date.between(start_date, end_date)
            ).all()
            
            total_amount = sum(float(p.amount or 0) for p in payments)
            
            msg = f"💵 **Pembayaran**\n\n"
            msg += f"• Periode: {start_date} - {end_date}\n"
            msg += f"• Jumlah transaksi: **{len(payments)}**\n"
            msg += f"• Total: **{format_currency(total_amount)}**\n"
            
            return {
                'message': msg,
                'links': [{'label': 'Lihat Payment', 'href': '/app/finance/payments'}],
                'data': None
            }
        
        # General payment info
        today = get_local_now().date()
        payments_today = Payment.query.filter(
            func.date(Payment.payment_date) == today
        ).all()
        
        total_today = sum(float(p.amount or 0) for p in payments_today)
        
        msg = f"💵 **Pembayaran Hari Ini**\n\n"
        msg += f"• Jumlah transaksi: **{len(payments_today)}**\n"
        msg += f"• Total: **{format_currency(total_today)}**\n"
        
        return {
            'message': msg,
            'links': [{'label': 'Lihat Payment', 'href': '/app/finance/payments'}],
            'data': None
        }
    except Exception as e:
        return {
            'message': random.choice(ERROR_RESPONSES),
            'links': [{'label': 'Lihat Payment', 'href': '/app/finance/payments'}],
            'data': None
        }

# ==================== HR HANDLERS ====================

def handle_attendance_query(query: str, search_term: str, start_date, end_date) -> dict:
    """Handle Attendance queries"""
    try:
        today = get_local_now().date()
        
        # Today's attendance
        attendance_today = Attendance.query.filter(
            Attendance.attendance_date == today
        ).all()
        
        total_employees = Employee.query.filter(Employee.is_active == True).count()
        present = len([a for a in attendance_today if a.status == 'present'])
        late = len([a for a in attendance_today if a.status == 'late'])
        absent = total_employees - len(attendance_today)
        
        msg = f"📋 **Absensi Hari Ini** ({today.strftime('%d/%m/%Y')})\n\n"
        msg += f"• Total karyawan: **{total_employees}**\n"
        msg += f"• Hadir: **{present}** ✅\n"
        msg += f"• Terlambat: **{late}** ⚠️\n"
        msg += f"• Belum absen: **{absent}** ❌\n"
        
        if absent > 0:
            msg += f"\n*{absent} orang belum absen hari ini*"
        
        return {
            'message': msg,
            'links': [
                {'label': 'Lihat Absensi', 'href': '/app/hr/attendance'},
                {'label': 'Dashboard HR', 'href': '/app/hr/dashboard'}
            ],
            'data': None
        }
    except Exception as e:
        return {
            'message': random.choice(ERROR_RESPONSES),
            'links': [{'label': 'Dashboard HR', 'href': '/app/hr/dashboard'}],
            'data': None
        }

def handle_department_query(query: str, search_term: str) -> dict:
    """Handle Department queries"""
    try:
        departments = Department.query.filter(Department.is_active == True).all()
        
        data = []
        for dept in departments[:10]:
            emp_count = Employee.query.filter(
                Employee.department_id == dept.id,
                Employee.is_active == True
            ).count()
            data.append({
                'Kode': dept.code,
                'Nama': dept.name[:25],
                'Jumlah': emp_count
            })
        
        msg = f"🏢 **Daftar Departemen**\n\n"
        msg += f"• Total departemen: **{len(departments)}**\n"
        
        return {
            'message': msg,
            'links': [{'label': 'Lihat Departemen', 'href': '/app/hr/departments'}],
            'data': data
        }
    except Exception as e:
        return {
            'message': random.choice(ERROR_RESPONSES),
            'links': [{'label': 'Dashboard HR', 'href': '/app/hr/dashboard'}],
            'data': None
        }

# ==================== QUALITY HANDLERS ====================

def handle_quality_query(query: str, search_term: str, start_date, end_date) -> dict:
    """Handle Quality queries"""
    try:
        query_lower = query.lower()
        today = get_local_now().date()
        
        # QC today
        if 'hari ini' in query_lower or 'today' in query_lower:
            tests = QualityTest.query.filter(
                func.date(QualityTest.test_date) == today
            ).all()
            
            passed = len([t for t in tests if t.result == 'passed'])
            failed = len([t for t in tests if t.result == 'failed'])
            pending = len([t for t in tests if t.result == 'pending'])
            
            msg = f"🔬 **Quality Control Hari Ini**\n\n"
            msg += f"• Total test: **{len(tests)}**\n"
            msg += f"• Passed: **{passed}** ✅\n"
            msg += f"• Failed: **{failed}** ❌\n"
            msg += f"• Pending: **{pending}** ⏳\n"
            
            if failed > 0:
                msg += f"\n⚠️ *Ada {failed} produk gagal QC!*"
            
            return {
                'message': msg,
                'links': [
                    {'label': 'Lihat QC', 'href': '/app/quality/tests'},
                    {'label': 'Dashboard Quality', 'href': '/app/quality/dashboard'}
                ],
                'data': None
            }
        
        # Defect rate
        if 'defect' in query_lower or 'cacat' in query_lower:
            defects = QualityDefect.query.filter(
                func.date(QualityDefect.defect_date) >= today - timedelta(days=30)
            ).all()
            
            total_qty = sum(d.quantity for d in defects)
            by_type = {}
            for d in defects:
                by_type[d.defect_type] = by_type.get(d.defect_type, 0) + d.quantity
            
            msg = f"📊 **Defect Report (30 hari)**\n\n"
            msg += f"• Total defect: **{total_qty}** unit\n"
            msg += f"• Jumlah kejadian: **{len(defects)}**\n\n"
            
            if by_type:
                msg += "**Top Defect:**\n"
                for dtype, qty in sorted(by_type.items(), key=lambda x: x[1], reverse=True)[:3]:
                    msg += f"• {dtype}: {qty}\n"
            
            return {
                'message': msg,
                'links': [{'label': 'Lihat Defect', 'href': '/app/quality/defects'}],
                'data': None
            }
        
        # General quality stats
        total_tests = QualityTest.query.count()
        passed = QualityTest.query.filter(QualityTest.result == 'passed').count()
        pass_rate = (passed / total_tests * 100) if total_tests > 0 else 0
        
        msg = f"🔬 **Ringkasan Quality**\n\n"
        msg += f"• Total test: **{total_tests}**\n"
        msg += f"• Pass rate: **{pass_rate:.1f}%**\n\n"
        msg += f"💡 *Ketik 'QC hari ini' atau 'defect rate' untuk detail*"
        
        return {
            'message': msg,
            'links': [{'label': 'Dashboard Quality', 'href': '/app/quality/dashboard'}],
            'data': None
        }
    except Exception as e:
        return {
            'message': random.choice(ERROR_RESPONSES),
            'links': [{'label': 'Dashboard Quality', 'href': '/app/quality/dashboard'}],
            'data': None
        }

# ==================== OEE HANDLERS ====================

def handle_oee_query(query: str, search_term: str, start_date, end_date) -> dict:
    """Handle OEE/Machine efficiency queries"""
    try:
        query_lower = query.lower()
        today = get_local_now().date()
        
        # Today's OEE
        oee_today = OEERecord.query.filter(
            OEERecord.record_date == today
        ).all()
        
        if oee_today:
            avg_oee = sum(float(r.oee or 0) for r in oee_today) / len(oee_today)
            avg_availability = sum(float(r.availability or 0) for r in oee_today) / len(oee_today)
            avg_performance = sum(float(r.performance or 0) for r in oee_today) / len(oee_today)
            avg_quality = sum(float(r.quality or 0) for r in oee_today) / len(oee_today)
            
            total_downtime = sum(r.downtime or 0 for r in oee_today)
            
            msg = f"📊 **OEE Hari Ini**\n\n"
            msg += f"• OEE: **{avg_oee:.1f}%** {'🟢' if avg_oee >= 85 else '🟡' if avg_oee >= 60 else '🔴'}\n"
            msg += f"• Availability: **{avg_availability:.1f}%**\n"
            msg += f"• Performance: **{avg_performance:.1f}%**\n"
            msg += f"• Quality: **{avg_quality:.1f}%**\n"
            msg += f"━━━━━━━━━━━━━━━━━━━━\n"
            msg += f"⏱️ Total Downtime: **{total_downtime}** menit\n"
            
            if avg_oee < 60:
                msg += f"\n⚠️ *OEE rendah! Cek mesin yang bermasalah*"
            
            return {
                'message': msg,
                'links': [
                    {'label': 'Dashboard OEE', 'href': '/app/oee/dashboard'},
                    {'label': 'Downtime Log', 'href': '/app/oee/downtime'}
                ],
                'data': None
            }
        
        # Downtime query
        if 'downtime' in query_lower:
            downtimes = OEEDowntimeRecord.query.filter(
                func.date(OEEDowntimeRecord.downtime_date) == today
            ).all()
            
            total_minutes = sum(d.duration_minutes or 0 for d in downtimes)
            
            msg = f"⏱️ **Downtime Hari Ini**\n\n"
            msg += f"• Total kejadian: **{len(downtimes)}**\n"
            msg += f"• Total durasi: **{total_minutes}** menit\n"
            
            if downtimes:
                by_category = {}
                for d in downtimes:
                    by_category[d.downtime_category] = by_category.get(d.downtime_category, 0) + (d.duration_minutes or 0)
                
                msg += "\n**Per Kategori:**\n"
                for cat, mins in sorted(by_category.items(), key=lambda x: x[1], reverse=True)[:3]:
                    msg += f"• {cat}: {mins} menit\n"
            
            return {
                'message': msg,
                'links': [{'label': 'Downtime Log', 'href': '/app/oee/downtime'}],
                'data': None
            }
        
        # Machine specific
        if search_term:
            machines = Machine.query.filter(
                or_(
                    Machine.name.ilike(f'%{search_term}%'),
                    Machine.code.ilike(f'%{search_term}%')
                )
            ).limit(5).all()
            
            if machines and len(machines) == 1:
                m = machines[0]
                oee = OEERecord.query.filter(
                    OEERecord.machine_id == m.id,
                    OEERecord.record_date == today
                ).first()
                
                msg = f"🏭 **Mesin: {m.name}**\n"
                msg += f"━━━━━━━━━━━━━━━━━━━━\n"
                msg += f"🏷️ Kode: `{m.code}`\n"
                msg += f"📍 Status: **{m.status or 'Unknown'}**\n"
                
                if oee:
                    msg += f"\n**OEE Hari Ini:**\n"
                    msg += f"• OEE: **{float(oee.oee):.1f}%**\n"
                    msg += f"• Downtime: **{oee.downtime}** menit\n"
                
                return {
                    'message': msg,
                    'links': [{'label': 'Detail Mesin', 'href': f'/app/oee/machines/{m.id}'}],
                    'data': None
                }
        
        # General OEE stats
        msg = f"📊 **OEE Overview**\n\n"
        msg += f"Belum ada data OEE hari ini.\n\n"
        msg += f"💡 *Ketik 'OEE hari ini' atau 'downtime' untuk detail*"
        
        return {
            'message': msg,
            'links': [{'label': 'Dashboard OEE', 'href': '/app/oee/dashboard'}],
            'data': None
        }
    except Exception as e:
        print(f"OEE query error: {e}")
        return {
            'message': random.choice(ERROR_RESPONSES),
            'links': [{'label': 'Dashboard OEE', 'href': '/app/oee/dashboard'}],
            'data': None
        }

# ==================== SHIPPING HANDLERS ====================

def handle_shipping_query(query: str, search_term: str, start_date, end_date) -> dict:
    """Handle Shipping/Delivery queries"""
    try:
        query_lower = query.lower()
        today = get_local_now().date()
        
        # Today's shipments
        if 'hari ini' in query_lower or 'today' in query_lower:
            shipments = ShippingOrder.query.filter(
                ShippingOrder.shipping_date == today
            ).all()
            
            preparing = len([s for s in shipments if s.status == 'preparing'])
            shipped = len([s for s in shipments if s.status in ['shipped', 'in_transit']])
            delivered = len([s for s in shipments if s.status == 'delivered'])
            
            msg = f"🚚 **Pengiriman Hari Ini**\n\n"
            msg += f"• Total: **{len(shipments)}**\n"
            msg += f"• Preparing: **{preparing}** 📦\n"
            msg += f"• Shipped: **{shipped}** 🚛\n"
            msg += f"• Delivered: **{delivered}** ✅\n"
            
            return {
                'message': msg,
                'links': [
                    {'label': 'Lihat Shipping', 'href': '/app/shipping/orders'},
                    {'label': 'Tracking', 'href': '/app/shipping/tracking'}
                ],
                'data': None
            }
        
        # Tracking specific shipment
        if 'tracking' in query_lower or 'lacak' in query_lower or search_term:
            term = search_term or ''
            shipments = ShippingOrder.query.filter(
                or_(
                    ShippingOrder.shipping_number.ilike(f'%{term}%'),
                    ShippingOrder.tracking_number.ilike(f'%{term}%')
                )
            ).limit(5).all()
            
            if shipments and len(shipments) == 1:
                s = shipments[0]
                msg = f"📦 **Tracking: {s.shipping_number}**\n"
                msg += f"━━━━━━━━━━━━━━━━━━━━\n"
                msg += f"👤 Customer: {s.customer.name if s.customer else '-'}\n"
                msg += f"📅 Tgl Kirim: {s.shipping_date.strftime('%d/%m/%Y') if s.shipping_date else '-'}\n"
                msg += f"🚛 Ekspedisi: {s.logistics_provider.company_name if s.logistics_provider else '-'}\n"
                msg += f"📍 Resi: `{s.tracking_number or '-'}`\n"
                msg += f"🚦 Status: **{s.status.upper()}**\n"
                
                if s.expected_delivery_date:
                    msg += f"📅 ETA: {s.expected_delivery_date.strftime('%d/%m/%Y')}\n"
                
                return {
                    'message': msg,
                    'links': [{'label': 'Detail Shipping', 'href': f'/app/shipping/orders/{s.id}'}],
                    'data': None
                }
        
        # General shipping stats
        pending = ShippingOrder.query.filter(
            ShippingOrder.status.in_(['preparing', 'packed'])
        ).count()
        in_transit = ShippingOrder.query.filter(
            ShippingOrder.status.in_(['shipped', 'in_transit'])
        ).count()
        
        msg = f"🚚 **Ringkasan Shipping**\n\n"
        msg += f"• Pending: **{pending}**\n"
        msg += f"• In Transit: **{in_transit}**\n\n"
        msg += f"💡 *Ketik 'pengiriman hari ini' atau 'tracking [nomor]'*"
        
        return {
            'message': msg,
            'links': [{'label': 'Lihat Shipping', 'href': '/app/shipping/orders'}],
            'data': None
        }
    except Exception as e:
        return {
            'message': random.choice(ERROR_RESPONSES),
            'links': [{'label': 'Lihat Shipping', 'href': '/app/shipping/orders'}],
            'data': None
        }

# ==================== R&D HANDLERS ====================

def handle_rd_query(query: str, search_term: str) -> dict:
    """Handle R&D/Research queries"""
    try:
        # Active projects
        active_projects = ResearchProject.query.filter(
            ResearchProject.status.in_(['planning', 'in_progress', 'testing'])
        ).all()
        
        if active_projects:
            data = [{
                'No': p.project_number,
                'Nama': p.project_name[:25],
                'Status': p.status,
                'Progress': f"{p.progress_percentage}%"
            } for p in active_projects[:5]]
            
            msg = f"🔬 **Project R&D Aktif**\n\n"
            msg += f"• Total project aktif: **{len(active_projects)}**\n"
            
            # Count by status
            planning = len([p for p in active_projects if p.status == 'planning'])
            in_progress = len([p for p in active_projects if p.status == 'in_progress'])
            testing = len([p for p in active_projects if p.status == 'testing'])
            
            msg += f"• Planning: **{planning}**\n"
            msg += f"• In Progress: **{in_progress}**\n"
            msg += f"• Testing: **{testing}**\n"
            
            return {
                'message': msg,
                'links': [
                    {'label': 'Lihat Project', 'href': '/app/rd/projects'},
                    {'label': 'Dashboard R&D', 'href': '/app/rd/dashboard'}
                ],
                'data': data
            }
        else:
            return {
                'message': "🔬 Tidak ada project R&D aktif saat ini.",
                'links': [{'label': 'Buat Project', 'href': '/app/rd/projects/new'}],
                'data': None
            }
    except Exception as e:
        return {
            'message': random.choice(ERROR_RESPONSES),
            'links': [{'label': 'Dashboard R&D', 'href': '/app/rd/dashboard'}],
            'data': None
        }
