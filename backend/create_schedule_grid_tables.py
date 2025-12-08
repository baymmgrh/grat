"""
Script to create schedule grid tables
Run: python create_schedule_grid_tables.py
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
    
    # Create schedule_grid_items table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='schedule_grid_items'")
    if not cursor.fetchone():
        cursor.execute('''
            CREATE TABLE schedule_grid_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                machine_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                week_start DATE NOT NULL,
                order_ctn DECIMAL(15, 2) DEFAULT 0,
                qty_per_ctn INTEGER DEFAULT 0,
                spek_kain VARCHAR(100),
                no_spk VARCHAR(50),
                color VARCHAR(50) DEFAULT 'bg-blue-500',
                schedule_days TEXT,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (machine_id) REFERENCES machines(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        ''')
        cursor.execute('CREATE INDEX ix_schedule_grid_week ON schedule_grid_items(week_start)')
        cursor.execute('CREATE INDEX ix_schedule_grid_machine ON schedule_grid_items(machine_id)')
        print("Table 'schedule_grid_items' created successfully!")
    else:
        print("Table 'schedule_grid_items' already exists")
    
    # Create schedule_grid_notes table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='schedule_grid_notes'")
    if not cursor.fetchone():
        cursor.execute('''
            CREATE TABLE schedule_grid_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                week_start DATE NOT NULL,
                note_text TEXT NOT NULL,
                order_index INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cursor.execute('CREATE INDEX ix_schedule_notes_week ON schedule_grid_notes(week_start)')
        print("Table 'schedule_grid_notes' created successfully!")
    else:
        print("Table 'schedule_grid_notes' already exists")
    
    conn.commit()
    conn.close()
    print("Done!")


if __name__ == '__main__':
    create_tables()
