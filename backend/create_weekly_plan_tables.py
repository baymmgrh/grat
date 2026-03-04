"""
Script to create weekly production plan tables
Run: python create_weekly_plan_tables.py
"""
import sqlite3
import os

def create_tables():
    db_path = os.path.join(os.path.dirname(__file__), 'instance', 'erp_database.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create weekly_production_plans table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='weekly_production_plans'")
    if not cursor.fetchone():
        cursor.execute('''
            CREATE TABLE weekly_production_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                plan_number VARCHAR(50) NOT NULL UNIQUE,
                week_number INTEGER NOT NULL,
                year INTEGER NOT NULL,
                week_start DATE NOT NULL,
                week_end DATE NOT NULL,
                status VARCHAR(30) DEFAULT 'draft',
                created_by INTEGER NOT NULL,
                approved_by INTEGER,
                approved_at DATETIME,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id),
                FOREIGN KEY (approved_by) REFERENCES users(id)
            )
        ''')
        cursor.execute('CREATE INDEX ix_weekly_plans_year_week ON weekly_production_plans(year, week_number)')
        cursor.execute('CREATE INDEX ix_weekly_plans_status ON weekly_production_plans(status)')
        print("Table 'weekly_production_plans' created successfully!")
    else:
        print("Table 'weekly_production_plans' already exists")
    
    # Create weekly_production_plan_items table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='weekly_production_plan_items'")
    if not cursor.fetchone():
        cursor.execute('''
            CREATE TABLE weekly_production_plan_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                plan_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                planned_quantity DECIMAL(15, 2) NOT NULL,
                uom VARCHAR(20) DEFAULT 'pcs',
                priority INTEGER DEFAULT 1,
                planned_date DATE,
                machine_id INTEGER,
                material_status VARCHAR(30) DEFAULT 'pending',
                shortage_items TEXT,
                work_order_id INTEGER,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (plan_id) REFERENCES weekly_production_plans(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id),
                FOREIGN KEY (machine_id) REFERENCES machines(id),
                FOREIGN KEY (work_order_id) REFERENCES work_orders(id)
            )
        ''')
        cursor.execute('CREATE INDEX ix_weekly_plan_items_plan ON weekly_production_plan_items(plan_id)')
        cursor.execute('CREATE INDEX ix_weekly_plan_items_product ON weekly_production_plan_items(product_id)')
        print("Table 'weekly_production_plan_items' created successfully!")
    else:
        print("Table 'weekly_production_plan_items' already exists")
    
    conn.commit()
    conn.close()
    print("Done!")


if __name__ == '__main__':
    create_tables()
