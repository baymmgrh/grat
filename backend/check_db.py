import sqlite3
conn = sqlite3.connect('instance/erp_database.db')
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in c.fetchall()]
warehouse_tables = [t for t in tables if 'warehouse' in t.lower() or 'zone' in t.lower() or 'location' in t.lower() or 'inventory' in t.lower()]
print("Warehouse-related tables:", warehouse_tables)
