import sqlite3

conn = sqlite3.connect('instance/erp_database.db')
c = conn.cursor()

# Add missing zone_type column
try:
    c.execute('ALTER TABLE warehouse_zones ADD COLUMN zone_type VARCHAR(50) DEFAULT "storage"')
    print('Added zone_type column')
except Exception as e:
    print(f'zone_type: {e}')

# Add FG warehouse zone if not exists
c.execute('SELECT COUNT(*) FROM warehouse_zones WHERE material_type = "finished_goods"')
fg_count = c.fetchone()[0]
if fg_count == 0:
    c.execute('''INSERT INTO warehouse_zones (code, name, description, material_type, zone_type, is_active, created_at, updated_at)
                 VALUES ("FG-01", "Gudang Finished Goods", "Warehouse for finished products from production", "finished_goods", "storage", 1, datetime("now"), datetime("now"))''')
    print('Added FG warehouse zone')

# Add Raw Material zone if not exists
c.execute('SELECT COUNT(*) FROM warehouse_zones WHERE material_type = "raw_materials"')
rm_count = c.fetchone()[0]
if rm_count == 0:
    c.execute('''INSERT INTO warehouse_zones (code, name, description, material_type, zone_type, is_active, created_at, updated_at)
                 VALUES ("RM-01", "Gudang Bahan Baku", "Warehouse for raw materials", "raw_materials", "storage", 1, datetime("now"), datetime("now"))''')
    print('Added RM warehouse zone')

conn.commit()
print('Done!')
conn.close()
