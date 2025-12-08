#!/usr/bin/env python3
"""
Database Migration Management Script
Provides easy commands for Alembic database migrations
"""

import sys
import os
from pathlib import Path
import subprocess
from datetime import datetime

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def run_alembic_command(command_args):
    """Run alembic command with proper error handling"""
    try:
        cmd = ['alembic'] + command_args
        print(f"Running: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=backend_dir)
        
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr)
            
        if result.returncode != 0:
            print(f"❌ Command failed with return code {result.returncode}")
            return False
        return True
    except Exception as e:
        print(f"❌ Error running alembic command: {e}")
        return False

def init_migrations():
    """Initialize migration environment"""
    print("🔧 Initializing Alembic migrations...")
    
    # Check if already initialized
    if Path('migrations/env.py').exists():
        print("✅ Migrations already initialized")
        return True
    
    return run_alembic_command(['init', 'migrations'])

def create_migration(message=None):
    """Create a new migration"""
    if not message:
        message = f"Auto migration {datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    print(f"📝 Creating migration: {message}")
    return run_alembic_command(['revision', '--autogenerate', '-m', message])

def upgrade_database(revision='head'):
    """Upgrade database to specific revision"""
    print(f"⬆️  Upgrading database to {revision}...")
    return run_alembic_command(['upgrade', revision])

def downgrade_database(revision):
    """Downgrade database to specific revision"""
    print(f"⬇️  Downgrading database to {revision}...")
    return run_alembic_command(['downgrade', revision])

def show_current_revision():
    """Show current database revision"""
    print("📍 Current database revision:")
    return run_alembic_command(['current'])

def show_migration_history():
    """Show migration history"""
    print("📜 Migration history:")
    return run_alembic_command(['history'])

def show_pending_migrations():
    """Show pending migrations"""
    print("⏳ Pending migrations:")
    return run_alembic_command(['show', 'head'])

def backup_database():
    """Backup current database"""
    db_file = Path('erp_database.db')
    if db_file.exists():
        backup_name = f"erp_database_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
        backup_path = Path('backups') / backup_name
        
        # Create backups directory
        backup_path.parent.mkdir(exist_ok=True)
        
        # Copy database
        import shutil
        shutil.copy2(db_file, backup_path)
        print(f"💾 Database backed up to: {backup_path}")
        return str(backup_path)
    else:
        print("⚠️  No database file found to backup")
        return None

def restore_database(backup_path):
    """Restore database from backup"""
    backup_file = Path(backup_path)
    if backup_file.exists():
        db_file = Path('erp_database.db')
        import shutil
        shutil.copy2(backup_file, db_file)
        print(f"🔄 Database restored from: {backup_path}")
        return True
    else:
        print(f"❌ Backup file not found: {backup_path}")
        return False

def reset_database():
    """Reset database - WARNING: This will delete all data!"""
    print("⚠️  WARNING: This will delete all data!")
    confirm = input("Type 'YES' to confirm database reset: ")
    
    if confirm == 'YES':
        # Backup first
        backup_path = backup_database()
        
        # Delete database
        db_file = Path('erp_database.db')
        if db_file.exists():
            db_file.unlink()
            print("🗑️  Database deleted")
        
        # Run migrations
        if upgrade_database():
            print("✅ Database reset and migrated successfully")
            if backup_path:
                print(f"💾 Backup available at: {backup_path}")
            return True
    else:
        print("❌ Database reset cancelled")
        return False

def main():
    """Main CLI interface"""
    if len(sys.argv) < 2:
        print("""
🚀 ERP Database Migration Tool

Usage: python migrate.py <command> [options]

Commands:
  init                    Initialize migration environment
  create [message]        Create new migration (auto-generate)
  upgrade [revision]      Upgrade to revision (default: head)
  downgrade <revision>    Downgrade to revision
  current                 Show current revision
  history                 Show migration history
  pending                 Show pending migrations
  backup                  Backup current database
  restore <backup_path>   Restore from backup
  reset                   Reset database (WARNING: deletes all data)

Examples:
  python migrate.py init
  python migrate.py create "Add user roles"
  python migrate.py upgrade
  python migrate.py current
  python migrate.py backup
  python migrate.py reset
        """)
        return

    command = sys.argv[1].lower()
    
    if command == 'init':
        init_migrations()
    
    elif command == 'create':
        message = sys.argv[2] if len(sys.argv) > 2 else None
        create_migration(message)
    
    elif command == 'upgrade':
        revision = sys.argv[2] if len(sys.argv) > 2 else 'head'
        upgrade_database(revision)
    
    elif command == 'downgrade':
        if len(sys.argv) < 3:
            print("❌ Please specify revision to downgrade to")
            return
        downgrade_database(sys.argv[2])
    
    elif command == 'current':
        show_current_revision()
    
    elif command == 'history':
        show_migration_history()
    
    elif command == 'pending':
        show_pending_migrations()
    
    elif command == 'backup':
        backup_database()
    
    elif command == 'restore':
        if len(sys.argv) < 3:
            print("❌ Please specify backup file path")
            return
        restore_database(sys.argv[2])
    
    elif command == 'reset':
        reset_database()
    
    else:
        print(f"❌ Unknown command: {command}")

if __name__ == '__main__':
    main()
