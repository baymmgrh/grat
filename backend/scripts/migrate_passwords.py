"""
Script to migrate legacy password hashes to bcrypt.
Run: python -m scripts.migrate_passwords

This script will:
1. Find all users with non-bcrypt password hashes (scrypt, pbkdf2, etc.)
2. Reset their passwords to a default value
3. Mark them for password change on next login (optional)

Note: Users with legacy hashes will need to reset their passwords
since we cannot decrypt the old hash.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models import User, db

app = create_app()

DEFAULT_PASSWORD = 'changeme123'

def is_bcrypt_hash(hash_str: str) -> bool:
    """Check if hash is bcrypt format"""
    return hash_str.startswith('$2b$') or hash_str.startswith('$2a$')

def migrate_passwords(dry_run: bool = True):
    """Migrate all non-bcrypt password hashes to bcrypt"""
    with app.app_context():
        users = User.query.all()
        legacy_users = []
        
        for user in users:
            if not is_bcrypt_hash(user.password_hash):
                legacy_users.append(user)
        
        if not legacy_users:
            print("✓ All users already have bcrypt password hashes!")
            return
        
        print(f"Found {len(legacy_users)} users with legacy password hashes:")
        for user in legacy_users:
            hash_type = user.password_hash.split('$')[0] if '$' in user.password_hash else 'unknown'
            print(f"  - {user.username} (hash type: {hash_type})")
        
        if dry_run:
            print("\n[DRY RUN] No changes made. Run with --execute to apply changes.")
            return
        
        print(f"\nMigrating passwords to bcrypt (default: {DEFAULT_PASSWORD})...")
        
        for user in legacy_users:
            try:
                user.set_password(DEFAULT_PASSWORD)
                print(f"  ✓ {user.username} - password reset to default")
            except Exception as e:
                print(f"  ✗ {user.username} - error: {e}")
        
        db.session.commit()
        print(f"\n✓ Migration complete! {len(legacy_users)} users updated.")
        print(f"  Default password: {DEFAULT_PASSWORD}")
        print("  Please notify users to change their passwords.")

def check_all_users():
    """Check all users and their hash formats"""
    with app.app_context():
        users = User.query.all()
        print(f"Total users: {len(users)}\n")
        
        bcrypt_count = 0
        legacy_count = 0
        
        for user in users:
            if is_bcrypt_hash(user.password_hash):
                bcrypt_count += 1
                status = "✓ bcrypt"
            else:
                legacy_count += 1
                status = "✗ legacy"
            
            print(f"  {status} - {user.username}: {user.password_hash[:20]}...")
        
        print(f"\nSummary:")
        print(f"  Bcrypt hashes: {bcrypt_count}")
        print(f"  Legacy hashes: {legacy_count}")

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Migrate legacy password hashes to bcrypt')
    parser.add_argument('--check', action='store_true', help='Check all users hash formats')
    parser.add_argument('--execute', action='store_true', help='Execute migration (not dry run)')
    parser.add_argument('--password', type=str, default=DEFAULT_PASSWORD, 
                       help=f'Default password for reset users (default: {DEFAULT_PASSWORD})')
    
    args = parser.parse_args()
    
    if args.password:
        DEFAULT_PASSWORD = args.password
    
    if args.check:
        check_all_users()
    else:
        migrate_passwords(dry_run=not args.execute)
