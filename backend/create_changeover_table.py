"""
Script to create product_changeovers table directly
Run: python create_changeover_table.py
"""
import sqlite3
import os

def create_changeover_table():
    db_path = os.path.join(os.path.dirname(__file__), 'instance', 'erp_database.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='product_changeovers'")
    if cursor.fetchone():
        print("Table 'product_changeovers' already exists")
        conn.close()
        return
    
    # Create table
    cursor.execute('''
        CREATE TABLE product_changeovers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            changeover_number VARCHAR(50) NOT NULL UNIQUE,
            from_work_order_id INTEGER NOT NULL,
            to_work_order_id INTEGER,
            machine_id INTEGER NOT NULL,
            reason VARCHAR(50) NOT NULL,
            reason_detail TEXT,
            from_wo_status VARCHAR(30),
            from_wo_progress DECIMAL(15, 2) DEFAULT 0,
            from_wo_target DECIMAL(15, 2) DEFAULT 0,
            changeover_start DATETIME NOT NULL,
            changeover_end DATETIME,
            setup_time_minutes INTEGER DEFAULT 0,
            status VARCHAR(30) DEFAULT 'in_progress',
            initiated_by INTEGER NOT NULL,
            completed_by INTEGER,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (from_work_order_id) REFERENCES work_orders(id),
            FOREIGN KEY (to_work_order_id) REFERENCES work_orders(id),
            FOREIGN KEY (machine_id) REFERENCES machines(id),
            FOREIGN KEY (initiated_by) REFERENCES users(id),
            FOREIGN KEY (completed_by) REFERENCES users(id)
        )
    ''')
    
    # Create indexes
    cursor.execute('CREATE INDEX ix_product_changeovers_status ON product_changeovers(status)')
    cursor.execute('CREATE INDEX ix_product_changeovers_machine ON product_changeovers(machine_id)')
    
    conn.commit()
    conn.close()
    
    print("Table 'product_changeovers' created successfully!")


if __name__ == '__main__':
    create_changeover_table()
